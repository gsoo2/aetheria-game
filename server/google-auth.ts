import {env} from 'cloudflare:workers';
import {base64url,validateGoogleToken,type SigningKey} from './google-token';
import {linkGoogleAccount} from '../shared/google-accounts';
import {transactWorld} from './store';
import {digest} from './auth-crypto';
const configuration=()=>({clientId:env.GOOGLE_CLIENT_ID||'',clientSecret:env.GOOGLE_CLIENT_SECRET||'',origin:env.AUTH_ORIGIN||''});
export function googleConfigured(){const c=configuration();return !!(c.clientId&&c.clientSecret&&/^https:\/\/[^/]+$/.test(c.origin));}
export function randomToken(){return base64url(crypto.getRandomValues(new Uint8Array(32)));}
export function cookie(request:Request,name:string){return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||null;}
export function authCookie(name:string,value:string,age:number){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;}
const DB=()=>{if(!env.DB)throw new Error('Auth storage unavailable');return env.DB;};
let schema:Promise<void>|undefined;
export function ensureAuthStorage(){return schema??=(async()=>{
 await DB().prepare('CREATE TABLE IF NOT EXISTS login_states (hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, verifier TEXT NOT NULL, guest_id TEXT, expires INTEGER NOT NULL)').run();
 await DB().prepare('CREATE TABLE IF NOT EXISTS login_sessions (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, expires INTEGER NOT NULL)').run();
})().catch(e=>{schema=undefined;throw e;});}
export type LoginSession={account_id:string;name:string;email:string;expires:number};
export async function readLoginSession(token:string){if(!/^[A-Za-z0-9_-]{43}$/.test(token))return null;await ensureAuthStorage();const record=await DB().prepare('SELECT account_id,name,email,expires FROM login_sessions WHERE hash=? AND expires>?').bind(await digest(token),Date.now()).first<LoginSession>();return record||null;}
export async function revokeLoginSession(token:string){await ensureAuthStorage();await DB().prepare('DELETE FROM login_sessions WHERE hash=?').bind(await digest(token)).run();}
export async function beginGoogleLogin(request:Request){
 if(!googleConfigured())return Response.redirect(new URL('/?login=setup',request.url),302);
 const c=configuration();if(new URL(request.url).origin!==c.origin)return new Response('잘못된 로그인 주소입니다.',{status:400});
 await ensureAuthStorage();
 const state=randomToken(),nonce=randomToken(),verifier=randomToken(),guestToken=cookie(request,'aetheria_guest');
 const guestId=guestToken&&/^[a-f0-9-]{36}$/.test(guestToken)&&!cookie(request,'__Host-aetheria_session')?await digest(guestToken):null;
 await DB().prepare('DELETE FROM login_states WHERE expires<?').bind(Date.now()).run();
 await DB().prepare('INSERT INTO login_states (hash,nonce,verifier,guest_id,expires) VALUES (?,?,?,?,?)').bind(await digest(state),nonce,verifier,guestId,Date.now()+600000).run();
 const challenge=base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.origin+'/api/auth/google/callback',response_type:'code',scope:'openid email profile',state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();
 return new Response(null,{status:302,headers:{Location:url.toString(),'Set-Cookie':authCookie('__Host-aetheria_oauth',state,600),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
let signingKeys:{keys:SigningKey[];expires:number}|undefined;
async function googleKeys(){if(signingKeys&&signingKeys.expires>Date.now())return signingKeys.keys;const r=await fetch('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Google verification unavailable');const data=await r.json() as {keys:SigningKey[]};if(!Array.isArray(data.keys))throw new Error('Invalid key response');signingKeys={keys:data.keys,expires:Date.now()+300000};return data.keys;}
function finishResponse(origin:string,result:string,session?:string){const h=new Headers({Location:origin+'/?login='+result,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});h.append('Set-Cookie',authCookie('__Host-aetheria_oauth','',0));if(session){h.append('Set-Cookie',authCookie('__Host-aetheria_session',session,2592000));h.append('Set-Cookie',authCookie('aetheria_guest','',0));}return new Response(null,{status:302,headers:h});}
export async function finishGoogleLogin(request:Request){
 const c=configuration();if(!googleConfigured())return finishResponse(new URL(request.url).origin,'setup');
 if(new URL(request.url).origin!==c.origin)return new Response('잘못된 로그인 주소입니다.',{status:400});
 try{
  const url=new URL(request.url),state=url.searchParams.get('state'),bound=cookie(request,'__Host-aetheria_oauth');
  if(!state||state!==bound||!/^[A-Za-z0-9_-]{43}$/.test(state))throw new Error('Invalid state');
  await ensureAuthStorage();const record=await DB().prepare('DELETE FROM login_states WHERE hash=? AND expires>? RETURNING nonce,verifier,guest_id').bind(await digest(state),Date.now()).first<{nonce:string;verifier:string;guest_id:string|null}>();
  if(!record)throw new Error('Expired login request');
  if(url.searchParams.has('error'))return finishResponse(c.origin,'cancelled');
  const code=url.searchParams.get('code');if(!code||code.length>4096)throw new Error('Missing code');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:c.clientId,client_secret:c.clientSecret,redirect_uri:c.origin+'/api/auth/google/callback',grant_type:'authorization_code',code_verifier:record.verifier}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Google token exchange failed');const tokens=await response.json() as {id_token?:string};if(!tokens.id_token)throw new Error('Missing ID token');
  let keys=await googleKeys();const kid=JSON.parse(atob(tokens.id_token.split('.')[0].replace(/-/g,'+').replace(/_/g,'/'))).kid;
  if(!keys.some(k=>k.kid===kid)){signingKeys=undefined;keys=await googleKeys();}
  const claims=await validateGoogleToken(tokens.id_token,c.clientId,record.nonce,keys);
  const accountId=await digest('google:'+claims.sub),name=claims.name||claims.email;
  await transactWorld(w=>linkGoogleAccount(w,accountId,record.guest_id,{name,email:claims.email}));
  const session=randomToken();await DB().prepare('DELETE FROM login_sessions WHERE expires<?').bind(Date.now()).run();
  await DB().prepare('INSERT INTO login_sessions (hash,account_id,name,email,expires) VALUES (?,?,?,?,?)').bind(await digest(session),accountId,name.slice(0,100),claims.email.slice(0,254),Date.now()+2592000000).run();
  return finishResponse(c.origin,'success',session);
 }catch{console.error('Google login failed');return finishResponse(c.origin,'failed');}
}
