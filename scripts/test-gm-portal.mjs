import assert from 'node:assert/strict';
import {launch} from '../hosting/server.mjs';
process.env.GM_LOGIN_CODE='12345678901234567890';const loginCode=process.env.GM_LOGIN_CODE;
let saved;const token='portal-test-only-secret-1234567890123456789';const app=await launch({store:{async load(){return saved;},async save(world){saved=structuredClone(world);}},token,port:0,host:'127.0.0.1'});
async function call(path,{body,cookie,origin=app.url,method}={}){const res=await fetch(app.url+path,{method:method||(body?'POST':'GET'),headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await res.text();let data;try{data=JSON.parse(text);}catch{}return {status:res.status,text,data,headers:res.headers,cookie:res.headers.get('set-cookie')?.split(';')[0]};}
try{
 const html=await call('/gm/');assert.equal(html.status,200);assert.ok(html.text.includes('src="gm.js"'));assert.ok(!html.text.includes(token));assert.ok(html.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
 for(const path of ['/gm/gm.css','/gm/gm.js'])assert.equal((await call(path)).status,200);
 assert.equal((await call('/gm/api/players')).status,401);assert.equal((await call('/gm/api/session')).data.authenticated,false);assert.equal((await call('/gm/api/players',{cookie:'aetheria_gm=forged'})).status,401);
 assert.equal((await call('/gm/api/login',{body:{code:loginCode},origin:'https://foreign.example'})).status,403);assert.equal((await call('/gm/api/login',{body:{code:'wrong'}})).status,401);
 assert.equal((await call('/gm/api/login',{body:{code:token}})).status,401);
 const login=await call('/gm/api/login',{body:{code:loginCode}}),cookie=login.cookie;assert.equal(login.status,200);assert.ok(cookie);const setCookie=login.headers.get('set-cookie');for(const flag of ['HttpOnly','SameSite=Strict','Path=/gm'])assert.ok(setCookie.includes(flag));assert.ok(!login.text.includes(token));assert.equal((await call('/gm/api/session',{cookie})).data.authenticated,true);
 const created=await call('/api/account',{body:{action:'create',name:'GM포털검증',classId:0}}),id=created.data.active;assert.ok(id);assert.equal((await call('/api/gm/players',{cookie:created.cookie})).status,404);
 const roster=await call('/gm/api/players',{cookie});assert.equal(roster.status,200);assert.ok(roster.data.players.some(p=>p.id===id));
 assert.equal((await call('/gm/api/action',{body:{playerId:id,revision:0,action:'set',gold:999},cookie,origin:'https://foreign.example'})).status,403);
 const changed=await call('/gm/api/action',{body:{playerId:id,revision:0,action:'set',gold:321,reason:'local GM portal integration test'},cookie});assert.equal(changed.status,200);assert.equal(saved.players[id].gold,321);
 const detail=await call('/gm/api/player?id='+id,{cookie});assert.equal(detail.data.gold,321);
 assert.equal((await call('/gm/api/players',{body:{},cookie})).status,405);assert.equal((await call('/gm/api/unknown',{cookie})).status,404);
 const backup=await call('/gm/api/backup',{cookie});assert.equal(backup.status,200);assert.ok(backup.headers.get('content-disposition').includes('attachment'));assert.equal(backup.data.world.players[id].gold,321);
 assert.equal((await call('/gm/api/logout',{body:{},cookie})).status,200);assert.equal((await call('/gm/api/players',{cookie})).status,401);
 for(let n=0;n<8;n++)assert.equal((await call('/gm/api/login',{body:{code:'wrong'}})).status,401);assert.equal((await call('/gm/api/login',{body:{code:loginCode}})).status,429);
 console.log('PASS: hosted GM assets, protected login, HttpOnly session, authorization, CSRF rejection, rate limit, logout, real character mutation, durable save and backup');
}finally{await app.close();}
