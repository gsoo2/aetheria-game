import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {launch} from './server.mjs';
const token='a'.repeat(64);let saved,fail=false;const store={async load(){return saved?structuredClone(saved):undefined;},async save(world){if(fail)throw new Error('test failure');saved=structuredClone(world);}};
let app=await launch({store,token,port:0,host:'127.0.0.1'}),socket;
try{
 assert.equal((await fetch(app.url+'/health')).status,200);
 assert.equal((await fetch(app.url)).status,200);
 let r=await fetch(app.url+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',Origin:app.url},body:JSON.stringify({join:true,name:'호스팅검증',classId:0})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0],id=(await r.json()).player.id;assert.ok(saved.players[id]);
 assert.equal((await fetch(app.url+'/api/gm/players')).status,401);
 socket=new WebSocket(app.url.replace('http:','ws:')+'/api/socket?characterId='+id,{headers:{Cookie:cookie,Origin:app.url}});
 await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
 const seen=new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('No live snapshot')),8000);socket.on('message',raw=>{const snap=JSON.parse(String(raw));if(snap.player?.level===12){clearTimeout(t);resolve();}});});
 r=await fetch(app.url+'/api/gm/action',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({playerId:id,action:'set',revision:0,level:12,gold:777,reason:'test'})});assert.equal(r.status,200);await seen;assert.equal(saved.players[id].gold,777);
 const received=new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('No chat broadcast')),8000);socket.on('message',raw=>{const snap=JSON.parse(String(raw));if(snap.chat?.some(c=>c.text==='Render 채팅 검증')){clearTimeout(t);resolve();}});});socket.send(JSON.stringify({kind:'chat',text:'Render 채팅 검증'}));await received;socket.close();await new Promise(r=>socket.once('close',r));
 await app.close();app=await launch({store,token,port:0,host:'127.0.0.1'});
 r=await fetch(app.url+'/api/game?characterId='+id,{headers:{Cookie:cookie}});assert.equal(r.status,200);const restored=(await r.json()).player;assert.equal(restored.level,12);assert.equal(restored.gold,777);
 fail=true;r=await fetch(app.url+'/api/gm/action',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({playerId:id,action:'heal',revision:1})});assert.equal(r.status,503);assert.equal((await fetch(app.url+'/health')).status,503);fail=false;
 console.log('PASS: Render adapter HTTP, WS snapshots/chat, GM auth, restore after fresh cache and storage failure health');
}finally{socket?.terminate();fail=false;await app.close();}
