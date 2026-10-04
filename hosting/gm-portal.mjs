import {readFile} from 'node:fs/promises';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {writeResponse} from './http-response.mjs';
const files={'/gm/':['index.html','text/html; charset=utf-8'],'/gm/gm.css':['gm.css','text/css; charset=utf-8'],'/gm/gm.js':['gm.js','text/javascript; charset=utf-8']};
const routes={players:'GET',player:'GET',audit:'GET',backup:'GET',donations:'GET',settings:'POST',donation:'POST',action:'POST'};
const digest=value=>createHash('sha256').update(value).digest();
export function createGmPortal({mf,token,persist,clock=Date.now}){
 const sessions=new Map(),attempts=new Map(),expected=digest(token),age=8*60*60*1000;
 const json=(res,status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(body));};
 async function body(req){let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)throw Error('요청이 너무 큽니다.');chunks.push(chunk);}return Buffer.concat(chunks);}
 return async(req,res,url)=>{
  if(url.pathname!=='/gm'&&!url.pathname.startsWith('/gm/'))return false;
  const now=clock();for(const [key,until] of sessions)if(until<=now)sessions.delete(key);for(const [key,entry] of attempts)if(entry.until<=now)attempts.delete(key);
  if(url.pathname==='/gm'){res.writeHead(302,{Location:'/gm/','Cache-Control':'no-store'});res.end();return true;}
  const file=files[url.pathname];if(file){if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'지원하지 않는 요청입니다.'});return true;}const bytes=await readFile(new URL('../gm/'+file[0],import.meta.url));res.writeHead(200,{'Content-Type':file[1],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});res.end(req.method==='HEAD'?undefined:bytes);return true;}
  if(!url.pathname.startsWith('/gm/api/')){json(res,404,{error:'관리 경로를 찾을 수 없습니다.'});return true;}
  if(req.method==='POST'&&req.headers.origin!==url.origin){json(res,403,{error:'같은 사이트에서만 관리 요청을 보낼 수 있습니다.'});return true;}
  const cookieName='aetheria_gm',secure=url.protocol==='https:'?'; Secure':'',cookie=(value,seconds)=>`${cookieName}=${value}; Path=/gm; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure}`;
  const session=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1),authenticated=!!session&&(sessions.get(session)||0)>now;
  const route=url.pathname.slice('/gm/api/'.length);
  if(route==='session'&&req.method==='GET'){json(res,200,{authenticated});return true;}
  if(route==='login'&&req.method==='POST'){
   const ip=req.socket.remoteAddress||'unknown',entry=attempts.get(ip)||{count:0,until:now+10*60*1000};if(entry.count>=8){json(res,429,{error:'로그인 시도가 많습니다. 잠시 후 다시 시도하세요.'});return true;}
   let input;try{input=JSON.parse((await body(req)).toString());}catch{json(res,400,{error:'관리자 코드를 입력하세요.'});return true;}
   if(typeof input.code!=='string'||input.code.length>256||!timingSafeEqual(digest(input.code.trim()),expected)){entry.count++;attempts.set(ip,entry);json(res,401,{error:'관리자 코드가 올바르지 않습니다.'});return true;}
   attempts.delete(ip);if(session)sessions.delete(session);const id=randomBytes(32).toString('hex');sessions.set(id,now+age);json(res,200,{ok:true},{'Set-Cookie':cookie(id,age/1000)});return true;
  }
  if(route==='logout'&&req.method==='POST'){if(session)sessions.delete(session);json(res,200,{ok:true},{'Set-Cookie':cookie('',0)});return true;}
  if(!authenticated){json(res,401,{error:'관리자 로그인이 필요합니다.'});return true;}
  if(!Object.hasOwn(routes,route)){json(res,404,{error:'지원하지 않는 관리 경로입니다.'});return true;}
  if(req.method!==routes[route]){json(res,405,{error:'지원하지 않는 요청입니다.'});return true;}
  const bytes=req.method==='POST'?await body(req):null;const response=await mf.dispatchFetch('http://localhost/api/gm/'+route+url.search,{method:req.method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(bytes?.length?{body:bytes}:{})});
  if(req.method==='POST'&&response.ok)await persist();
  const headers=Object.fromEntries(response.headers);headers['cache-control']='no-store';if(route==='backup')headers['content-disposition']='attachment; filename="aetheria-world-backup.json"';await writeResponse(req,res,response,headers);return true;
 };
}
