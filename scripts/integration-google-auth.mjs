import {createRequire} from 'node:module';
import {realpathSync,readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
const require=createRequire(realpathSync('node_modules/wrangler/package.json')),{Miniflare}=require('miniflare');
const root=resolve('dist/server'),files=readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.js'));
const modules=['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:resolve(root,f)}));
const origin='https://aetheria.test';
const mf=new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],bindings:{GOOGLE_CLIENT_ID:'test-client.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'test-only-secret',AUTH_ORIGIN:origin},d1Databases:{DB:'google-auth-test'},assets:{directory:resolve('dist/client'),binding:'ASSETS',routerConfig:{invoke_user_worker_ahead_of_assets:true,has_user_worker:true}}});
const hash=s=>createHash('sha256').update(s).digest('hex');
const request=(path,cookie='',body)=>mf.dispatchFetch(origin+path,{method:body?'POST':'GET',redirect:'manual',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
try{
 const db=await mf.getD1Database('DB');for(const sql of readFileSync('drizzle/0000_talented_epoch.sql','utf8').split('--> statement-breakpoint'))await db.exec(sql.trim().replace(/\n/g,' '));
 const create=await request('/api/account','',{action:'create',name:'게스트수호자',classId:0});assert.equal(create.status,200);const guestCookie=create.headers.get('set-cookie').split(';')[0],created=await create.json(),id=created.active;
 const auth=await request('/api/auth/google',guestCookie);assert.equal(auth.status,302);const google=new URL(auth.headers.get('location'));assert.equal(google.origin,'https://accounts.google.com');assert.equal(google.searchParams.get('code_challenge_method'),'S256');assert.equal(google.searchParams.get('scope'),'openid email profile');assert.equal(google.searchParams.get('redirect_uri'),origin+'/api/auth/google/callback');
 const state=google.searchParams.get('state'),oauthCookie=auth.headers.get('set-cookie').split(';')[0];assert.ok(oauthCookie.startsWith('__Host-aetheria_oauth='));assert.ok(auth.headers.get('set-cookie').includes('HttpOnly'));
 const forged=await request('/api/auth/google/callback?state=forged&code=not-a-real-code',oauthCookie);assert.ok(forged.headers.get('location').endsWith('login=failed'));
 assert.ok(await db.prepare('SELECT hash FROM login_states WHERE hash=?').bind(hash(state)).first());
 const cancelled=await request('/api/auth/google/callback?state='+state+'&error=access_denied',oauthCookie);assert.ok(cancelled.headers.get('location').endsWith('login=cancelled'));assert.equal(await db.prepare('SELECT hash FROM login_states WHERE hash=?').bind(hash(state)).first(),null);
 const replay=await request('/api/auth/google/callback?state='+state+'&error=access_denied',oauthCookie);assert.ok(replay.headers.get('location').endsWith('login=failed'));
 console.log('PASS: real OAuth start, PKCE, nonce, state binding, cancellation and one-time state consumption');
 // Session fixtures represent two completed and cryptographically verified Google logins.
 // Real Google token signature/issuer/audience/nonce/expiry checks run in the unit suite.
 const row=await db.prepare('SELECT data FROM realms WHERE id=?').bind('aetheria').first(),world=JSON.parse(row.data);world.players[id].level=23;world.players[id].gold=1234;world.players[id].done=[0,1];
 const {linkGoogleAccount}=createRequire(import.meta.url)('../.test/shared/google-accounts.js');const googleId=hash('google:verified-test-subject'),guestId=hash(guestCookie.split('=')[1]);linkGoogleAccount(world,googleId,guestId,{name:'Google수호자',email:'player@example.test'});
 await db.prepare('UPDATE realms SET data=?,version=version+1 WHERE id=?').bind(JSON.stringify(world),'aetheria').run();
 const tokens=[randomBytes(32).toString('base64url'),randomBytes(32).toString('base64url')];for(const token of tokens)await db.prepare('INSERT INTO login_sessions (hash,account_id,name,email,expires) VALUES (?,?,?,?,?)').bind(hash(token),googleId,'Google수호자','player@example.test',Date.now()+60000).run();
 const cookies=tokens.map(t=>'__Host-aetheria_session='+t);
 for(const cookie of cookies){const status=await (await request('/api/auth/session',cookie)).json();assert.equal(status.provider,'google');assert.equal(status.googleEnabled,true);const roster=await (await request('/api/account',cookie)).json();assert.equal(roster.characters[0].id,id);assert.equal(roster.characters[0].level,23);assert.equal(roster.characters[0].gold,1234);}
 assert.equal((await (await request('/api/game?characterId='+id,guestCookie)).json()).needsCharacter,true);
 const select=await request('/api/account',cookies[0],{action:'select',characterId:id});assert.equal(select.status,200);assert.equal(select.headers.get('set-cookie'),null);
 const socketResponse=await mf.dispatchFetch(origin+'/api/socket?characterId='+id,{headers:{Origin:origin,Cookie:cookies[0],Upgrade:'websocket'}});assert.equal(socketResponse.status,101);const socket=socketResponse.webSocket;socket.accept();
 const logout=await request('/api/auth/logout',cookies[0],{});assert.equal(logout.status,200);assert.equal(await db.prepare('SELECT hash FROM login_sessions WHERE hash=?').bind(hash(tokens[0])).first(),null);
 const closed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('revoked socket remained active')),5000);socket.addEventListener('close',e=>{clearTimeout(timer);resolve(e.code);},{once:true});});socket.send(JSON.stringify({seq:1,dx:1}));assert.equal(await closed,4001);
 assert.equal((await (await request('/api/game?characterId='+id,cookies[0])).json()).needsCharacter,true);assert.equal((await (await request('/api/game?characterId='+id,cookies[1])).json()).player.level,23);
 const badCookie='__Host-aetheria_session='+randomBytes(32).toString('base64url')+'; '+guestCookie;assert.equal((await (await request('/api/game?characterId='+id,badCookie)).json()).needsCharacter,true);
 const csrf=await mf.dispatchFetch(origin+'/api/auth/logout',{method:'POST',headers:{Origin:'https://evil.test',Cookie:cookies[1]}});assert.equal(csrf.status,403);
 console.log('PASS: two-device server save, guest migration, ownership, Google cookie isolation, logout revocation and live socket termination');
}catch(e){console.error(e);process.exitCode=1;}finally{await mf.dispose();}
