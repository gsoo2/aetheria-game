import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {launch} from '../hosting/server.mjs';import {limiter,clientIp} from '../hosting/security.mjs';
const require=createRequire(new URL('../hosting/package.json',import.meta.url)),WS=require('ws');process.env.GM_LOGIN_CODE='security-test-login-only-1234567890';const token='internal-security-test-token-123456789012345';let saved;const app=await launch({store:{async load(){return saved;},async save(w){saved=structuredClone(w);}},token,host:'127.0.0.1',port:0}),sockets=[];
async function call(path,body,cookie,origin=app.url,content='application/json'){const r=await fetch(app.url+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':content,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();return {status:r.status,text,headers:r.headers,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const rejected=(url,headers)=>new Promise((resolve,reject)=>{const ws=new WS(url,{headers});ws.once('unexpected-response',(_req,r)=>{r.resume();resolve(r.statusCode);});ws.once('open',()=>{ws.close();reject(Error('Unexpected accepted socket'));});ws.once('error',()=>{});});
try{
 const head=await call('/');assert.equal(head.status,200);assert.equal(head.headers.get('x-frame-options'),'DENY');assert.ok(head.headers.get('content-security-policy').includes("object-src 'none'"));
 for(const path of ['/api/gm/backup','/api/gm/action']){const r=await fetch(app.url+path,{headers:{Authorization:'Bearer '+token,Origin:app.url}});assert.equal(r.status,404);}
 assert.equal((await call('/api/account',{action:'create',name:'검증인물',classId:0},null,'https://evil.example')).status,403);assert.equal((await call('/api/account',{action:'create',name:'검증인물',classId:0},null,app.url,'text/plain')).status,415);
 const made=await call('/api/account',{action:'create',name:'보안검증',classId:0}),id=JSON.parse(made.text).active,cookie=made.cookie;assert.ok(id);
 const url=app.url.replace('http:','ws:')+'/api/socket?characterId='+id;assert.notEqual(await rejected(url,{Cookie:cookie,Origin:'https://evil.example'}),101);assert.notEqual(await rejected(url,{Cookie:cookie}),101);
 for(let n=0;n<4;n++){const ws=new WS(url,{headers:{Cookie:cookie,Origin:app.url}});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});sockets.push(ws);}
 assert.notEqual(await rejected(url,{Cookie:cookie,Origin:app.url}),101);
 const flood=sockets[0],closed=new Promise(r=>flood.once('close',r));for(let n=0;n<70;n++)flood.send(JSON.stringify({seq:n+1}));assert.equal(await closed,1008);
 for(let n=0;n<31;n++)await call('/api/account',{action:'select',characterId:id},cookie);assert.equal((await call('/api/account',{action:'select',characterId:id},cookie)).status,429);
 let time=1000;const gate=limiter({clock:()=>time,maximum:2});assert.equal(gate('x',2,100),true);assert.equal(gate('x',2,100),true);assert.equal(gate('x',2,100),false);time+=101;assert.equal(gate('x',2,100),true);assert.equal(clientIp({socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'1.2.3.4'}}),'127.0.0.1');
 console.log('PASS: private GM API hidden even with bearer; CSP; CSRF; JSON only; origin-required sockets; per-account socket cap; message flood closes; account throttling; expiry and proxy spoof tests');
}finally{for(const s of sockets)s.terminate();await app.close();}
