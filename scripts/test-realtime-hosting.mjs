import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {launch} from '../hosting/server.mjs';
const require=createRequire(new URL('../hosting/package.json',import.meta.url));
const WebSocket=require('ws');
let saved,delay=0,writes=0;
const store={async load(){return saved?structuredClone(saved):undefined;},async save(world){await new Promise(r=>setTimeout(r,delay));saved=structuredClone(world);writes++;}};
const options={store,token:'hosting-integration-secret-123456789012345',port:0,host:'127.0.0.1'};
let app=await launch(options),socket;
const call=async(path,body,cookie)=>{const r=await fetch(app.url+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:app.url,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
const waitFor=(predicate,timeout=4000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.off('message',listener);reject(Error('Socket timeout'));},timeout);const listener=raw=>{const data=JSON.parse(raw);if(predicate(data)){clearTimeout(timer);socket.off('message',listener);resolve(data);}};socket.on('message',listener);});
try{
 assert.equal((await call('/health')).data.backend,'realtime');
 const create=await call('/api/account',{action:'create',name:'실시간서버검증',classId:0}),id=create.data.active,cookie=create.cookie;assert.ok(id);
 const stranger=await call('/api/account');assert.equal((await call('/api/game?characterId='+id,null,stranger.cookie)).data.needsCharacter,true);
 socket=new WebSocket(app.url.replace('http:','ws:')+'/api/socket?characterId='+id,{headers:{Cookie:cookie,Origin:app.url}});
 await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
 let seq=0;const input=async(body)=>{const n=++seq,pending=waitFor(d=>d.player?.lastSeq>=n);socket.send(JSON.stringify({...body,seq:n}));return pending;};
 await input({action:'quest',value:0});await new Promise(r=>setTimeout(r,100));await input({action:'travel',value:1});
 delay=1200;const times=[];const collect=raw=>{const d=JSON.parse(raw);if(d.now)times.push(d.now);};socket.on('message',collect);
 const chat=waitFor(d=>d.chat?.some(c=>c.text==='저장 지연 중 사냥 확인'));socket.send(JSON.stringify({kind:'chat',text:'저장 지연 중 사냥 확인'}));await chat;
 await new Promise(r=>setTimeout(r,2200));socket.off('message',collect);
 assert.ok(times.length>=15);const max=Math.max(...times.slice(1).map((t,i)=>t-times[i]));assert.ok(max<350,'slow durable writes must not block monster snapshots');
 console.log('PASS: real HTTP/WebSocket hosting; 1200ms storage latency, max snapshot gap',max,'ms, snapshots',times.length);
 delay=0;socket.close();socket=undefined;await app.close();app=await launch(options);
 const restored=await call('/api/game?characterId='+id,null,cookie);assert.equal(restored.data.player.id,id);assert.equal(restored.data.player.zone,1);assert.equal(restored.data.player.quests[0],0);assert.ok(writes>=3);
 console.log('PASS: original guest cookie, ownership checks, character/quest progress and chat survive full hosting restart');
}finally{socket?.close();await app.close();}
