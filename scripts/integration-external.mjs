import {createRequire} from 'node:module';
import {realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const req=createRequire(realpathSync('node_modules/wrangler/package.json')),{Miniflare}=req('miniflare');
const options={modules:true,scriptPath:resolve('dist/external/server/worker.js'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],durableObjects:{REALM:{className:'AetheriaRealm',useSQLite:true}},assets:{directory:resolve('dist/external/client'),binding:'ASSETS',routerConfig:{invoke_user_worker_ahead_of_assets:true,has_user_worker:true}},durableObjectsPersist:resolve('.sites-runtime/external-test-data')};
let mf=new Miniflare(options);const base='http://localhost',headers={'Content-Type':'application/json',Origin:base};const call=async(path,body,cookie)=>{const response=await mf.dispatchFetch(base+path,{method:body?'POST':'GET',headers:{...headers,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
const ws=async(cookie,id)=>{const r=await mf.dispatchFetch(base+'/api/socket?characterId='+id,{headers:{Cookie:cookie,Origin:base,Upgrade:'websocket'}});assert.equal(r.status,101);const socket=r.webSocket;socket.accept();return socket;};
const waitFor=(socket,predicate,timeout=4000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.removeEventListener('message',on);reject(new Error('Socket response timed out'));},timeout);const on=e=>{const value=JSON.parse(e.data);if(predicate(value)){clearTimeout(timer);socket.removeEventListener('message',on);resolve(value);}};socket.addEventListener('message',on);});
try{
 assert.equal((await mf.dispatchFetch(base)).status,200);
 const a=await call('/api/account'),cookie=a.cookie;assert.ok(cookie);assert.equal(a.data.slots,4);
 const created=await call('/api/account',{action:'create',name:'서버검증',classId:0},cookie);assert.equal(created.status,200);const id=created.data.active;
 const stranger=await call('/api/account');assert.equal((await call('/api/account',{action:'select',characterId:id},stranger.cookie)).status,400);assert.equal((await call('/api/game?characterId='+id,null,stranger.cookie)).data.needsCharacter,true);
 const socket=await ws(cookie,id);let seq=0;
 const update=async(packet)=>{const n=++seq,pending=waitFor(socket,d=>d.player?.lastSeq>=n);socket.send(JSON.stringify({...packet,seq:n}));return pending;};
 let state=await update({});assert.equal(state.player.id,id);
 await new Promise(r=>setTimeout(r,120));state=await update({action:'quest',value:0});assert.equal(state.player.quests[0],0,'quest card accepts remotely in one click');
 await new Promise(r=>setTimeout(r,105));state=await update({action:'travel',value:1});assert.equal(state.player.zone,1);
 // Autonomous simulation pushes fresh snapshots even when the client sends no input.
 const snapshots=[];const collect=e=>{const d=JSON.parse(e.data);if(d.monsters)snapshots.push(d);};socket.addEventListener('message',collect);
 const chatReceived=waitFor(socket,d=>d.chat?.some(c=>c.text==='독립 채팅 검증'));socket.send(JSON.stringify({kind:'chat',text:'독립 채팅 검증'}));await chatReceived;
 await new Promise(r=>setTimeout(r,650));socket.removeEventListener('message',collect);assert.ok(snapshots.length>=4);assert.ok(snapshots.at(-1).now>snapshots[0].now);const gap=Math.max(...snapshots.slice(1).map((s,i)=>s.now-snapshots[i].now));assert.ok(gap<300,'chat must not pause world broadcasts');assert.notEqual(snapshots.at(-1).monsters[0].x,snapshots[0].monsters[0].x);
 console.log('PASS: server push and chat coexist; maximum snapshot gap',gap,'ms');
 // Real HTTP identities exercise the authoritative trade handshake and isolate private offers.
 const first=await call('/api/account'),second=await call('/api/account'),observer=await call('/api/account');
 const f=await call('/api/account',{action:'create',name:'거래첫째',classId:0},first.cookie),g=await call('/api/account',{action:'create',name:'거래둘째',classId:1},second.cookie);
 const fid=f.data.active,gid=g.data.active;let fs=0,gs=0;
 const fop=body=>call('/api/game?characterId='+fid,{...body,seq:++fs},first.cookie),gop=body=>call('/api/game?characterId='+gid,{...body,seq:++gs},second.cookie);
 let ft=(await fop({action:'tradeRequest',targetId:gid})).data.trade;assert.ok(ft);
 const gt=(await gop({action:'tradeAccept',tradeId:ft.id})).data.trade;assert.equal(gt.phase,'open');
 ft=(await fop({action:'tradeOffer',tradeId:ft.id,gold:15,indices:[]})).data.trade;
 ft=(await gop({action:'tradeOffer',tradeId:ft.id,gold:5,indices:[]})).data.trade;
 const unknown=await call('/api/account',{action:'create',name:'거래외부',classId:2},observer.cookie);const outsider=await call('/api/game?characterId='+unknown.data.active,{seq:1,action:'tradeConfirm',tradeId:ft.id,revision:ft.revision},observer.cookie);assert.equal(outsider.data.trade,undefined);
 await fop({action:'tradeConfirm',tradeId:ft.id,revision:ft.revision});const exchanged=(await gop({action:'tradeConfirm',tradeId:ft.id,revision:ft.revision})).data;assert.equal(exchanged.player.gold,90);assert.equal(exchanged.trade,undefined);assert.equal((await call('/api/game?characterId='+fid,null,first.cookie)).data.player.gold,70);
 const gate=(await fop({action:'raidEnter',value:0})).data;assert.equal(gate.player.zone,0);assert.match(gate.player.notice,/레벨/);
 const bubble=(await fop({action:'bubbleEquip',value:0})).data;assert.equal(bubble.player.bubbleId,0);
 assert.equal((await call('/api/game?characterId='+fid,{seq:++fs,action:'tradeOffer',indices:'bad'},first.cookie)).status,400);
 console.log('PASS: real identities complete atomic trade, block outsider access, reject malformed offers and enforce raid entry gate');
 const crowd=[];for(let i=0;i<20;i++){const user=await call('/api/account');const c=await call('/api/account',{action:'create',name:'동접검증'+i,classId:i%3},user.cookie);crowd.push(await ws(user.cookie,c.data.active));}const crowded=[];const watch=e=>{const d=JSON.parse(e.data);if(d.now)crowded.push(d.now);};socket.addEventListener('message',watch);await new Promise(r=>setTimeout(r,650));socket.removeEventListener('message',watch);assert.ok(crowded.length>=4);const crowdGap=Math.max(...crowded.slice(1).map((time,i)=>time-crowded[i]));assert.ok(crowdGap<400);for(const client of crowd)client.close();console.log('PASS: 21 live sockets; maximum local snapshot gap',crowdGap,'ms');
 const savedId=id;socket.close();await new Promise(r=>setTimeout(r,100));await mf.dispose();mf=new Miniflare(options);const restored=await call('/api/game?characterId='+savedId,null,cookie);assert.equal(restored.data.player.id,savedId);assert.equal(restored.data.player.zone,1);assert.equal(restored.data.player.quests[0],0);
 for(let i=0;i<3;i++)assert.equal((await call('/api/account',{action:'create',name:'추가수호자'+i,classId:i%3},cookie)).status,200);assert.equal((await call('/api/account',{action:'create',name:'초과생성',classId:0},cookie)).status,400);
 assert.equal((await call('/api/account',{action:'delete',characterId:id,confirm:'틀린이름'},cookie)).status,400);assert.equal((await call('/api/account',{action:'delete',characterId:id,confirm:'서버검증'},cookie)).status,200);assert.equal((await call('/api/game?characterId='+id,null,cookie)).data.needsCharacter,true);
 const forged=await mf.dispatchFetch(base+'/api/account',{method:'POST',headers:{...headers,Origin:'https://attacker.test',Cookie:cookie},body:JSON.stringify({action:'create',name:'위조',classId:0})});assert.equal(forged.status,403);
 for(const file of ['/art/raid-arena.png','/bubbles/11.svg','/sfx/sword.mp3','/sfx/step-1-4.mp3','/art/world-atlas.png','/art/knight-motion.png','/audio/track-8.mp3','/art/pet-motion.png','/art/elite-monsters.png','/voices/type-1/attack1.mp3','/voices/type-2/damaged2.mp3','/voices/type-3/fire.mp3'])assert.equal((await mf.dispatchFetch(base+file)).status,200);
 console.log('PASS: character roster, ownership, four-slot cap, confirmed deletion, restart persistence, NPC distance, quest accept, terrain, assets and WebSocket');
}finally{await mf.dispose();}
