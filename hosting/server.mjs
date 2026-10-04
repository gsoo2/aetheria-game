import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {WebSocketServer,WebSocket} from 'ws';
import pg from 'pg';
import {writeResponse,writeFailure} from './http-response.mjs';
import {createGmPortal} from './gm-portal.mjs';
import {remoteStore} from './remote-store.mjs';
const base=resolve(fileURLToPath(new URL('..',import.meta.url)));
export async function launch({store,token,port=Number(process.env.PORT||10000),host='0.0.0.0',data=resolve(base,'.render-state')}={}){
 if(!store||typeof token!=='string'||token.length<32)throw new Error('Persistent store and GM_TOKEN of at least 32 characters required');
 mkdirSync(data,{recursive:true});
 // Each boot uses a new local cache. Postgres is authoritative, never an old ephemeral disk.
 const cache=resolve(data,randomBytes(8).toString('hex'));
 const mf=new Miniflare({rootPath:base,modules:true,scriptPath:resolve(base,'dist/external/server/worker.js'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],host:'127.0.0.1',port:0,bindings:{GM_TOKEN:token},durableObjects:{REALM:{className:'AetheriaRealm',useSQLite:true}},durableObjectsPersist:resolve(cache,'world'),d1Databases:{DB:'aetheria-render'},d1Persist:resolve(cache,'db'),assets:{directory:resolve(base,'dist/external/client'),binding:'ASSETS',routerConfig:{invoke_user_worker_ahead_of_assets:true,has_user_worker:true}}});
 const db=await mf.getD1Database('DB');await db.exec('CREATE TABLE IF NOT EXISTS realms (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0)');
 const restored=await store.load();if(restored){if(!restored.players||!Array.isArray(restored.monsters))throw new Error('Invalid saved world; startup aborted');await db.prepare('INSERT INTO realms (id,data) VALUES (?,?)').bind('aetheria',JSON.stringify(restored)).run();}
 let saving=null,dirty=false,healthy=true,closing=false,onHandoff;
 async function save(){const response=await mf.dispatchFetch('http://localhost/api/gm/backup',{headers:{Authorization:'Bearer '+token}});if(!response.ok)throw new Error('Backup endpoint failed');const {world}=await response.json();await store.save(world);healthy=true;if(store.handoff&&!closing)queueMicrotask(()=>onHandoff?.());}
 function persist(){dirty=true;if(!saving){saving=(async()=>{try{while(dirty){dirty=false;await save();}}catch(error){healthy=false;console.error('World persistence failed; service paused');for(const client of wss?.clients||[])client.close(1012,'Storage reconnecting');if(process.env.RENDER)setTimeout(()=>{if(!healthy)process.exit(1);},5000).unref();throw error;}finally{saving=null;}})();}return saving;}
 let wss;
 await persist();
 wss=new WebSocketServer({noServer:true,maxPayload:4096});
 function address(req){const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);headers.delete('accept-encoding');const proto=req.headers['x-forwarded-proto']==='https'?'https':'http';return {url:proto+'://'+req.headers.host+req.url,headers};}
 const gmPortal=createGmPortal({mf,token,persist});
 const server=createServer(async(req,res)=>{try{if(req.url==='/health'){res.writeHead(healthy&&!closing?200:503,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:healthy&&!closing,backend:'realtime',simulationMs:50,broadcastMs:100}));return;}if(!healthy||closing){res.writeHead(503);res.end('Storage unavailable');return;}const {url,headers}=address(req);if(await gmPortal(req,res,new URL(url)))return;const chunks=[];let length=0;for await(const part of req){length+=part.length;if(length>4096){res.writeHead(413);res.end();return;}chunks.push(part);}const response=await mf.dispatchFetch(url,{method:req.method,headers,...(length?{body:Buffer.concat(chunks)}:{})});if(req.method!=='GET'&&req.url.startsWith('/api/')&&response.ok)await persist();await writeResponse(req,res,response);}catch(error){console.error('HTTP request failed:',error.code||error.name||'Error');writeFailure(res);}});
 server.on('upgrade',async(req,socket,head)=>{try{if(!healthy||closing||!req.url.startsWith('/api/socket?'))throw new Error('Unavailable');const {url,headers}=address(req);const response=await mf.dispatchFetch(url,{headers});if(response.status!==101||!response.webSocket){socket.end('HTTP/1.1 '+response.status+' Rejected\r\nConnection: close\r\n\r\n');return;}const worker=response.webSocket;worker.accept();wss.handleUpgrade(req,socket,head,client=>{let criticalSeq=0,progress='',lastChat='';worker.addEventListener('message',event=>{try{const snapshot=JSON.parse(event.data),p=snapshot.player;if(p){const next=JSON.stringify([p.xp,p.level,p.gold,p.cash,p.inventory,p.quests,p.done,p.kills,p.equipment,p.materials,p.enhancements,p.skillRanks,p.pets,p.tutorial,p.damageSkins,p.damageSkinId]);const chat=snapshot.chat?.at(-1)?.id||'';if((progress&&next!==progress)||(lastChat&&chat!==lastChat)||(criticalSeq&&p.lastSeq>=criticalSeq)){criticalSeq=0;void persist().catch(()=>{});}progress=next;lastChat=chat;}}catch{}if(client.readyState===WebSocket.OPEN)client.send(event.data);});worker.addEventListener('close',event=>{if(client.readyState===WebSocket.OPEN)client.close(event.code===1006?1011:event.code,event.reason);});client.on('message',(message,binary)=>{if(binary){client.close(1003);return;}try{const input=JSON.parse(message.toString());if(input.action&&Number.isSafeInteger(input.seq))criticalSeq=Math.max(criticalSeq,input.seq);}catch{}worker.send(message.toString());});client.on('close',()=>{try{worker.close();}catch{}void persist().catch(()=>{});});client.on('error',()=>{try{worker.close();}catch{}});wss.emit('connection',client,req);});}catch{socket.end('HTTP/1.1 503 Unavailable\r\nConnection: close\r\n\r\n');}});
 const timer=setInterval(()=>{if(!closing)void persist().catch(()=>{});},5000);timer.unref();
 const pings=setInterval(()=>{for(const client of wss.clients){if(client.isAlive===false){client.terminate();continue;}client.isAlive=false;client.ping();}},15000);pings.unref();
 wss.on('connection',client=>{client.isAlive=true;client.on('pong',()=>{client.isAlive=true;});});
 await new Promise(r=>server.listen(port,host,r));
 const app={server,mf,url:'http://127.0.0.1:'+server.address().port,async close(){if(closing)return;closing=true;clearInterval(timer);clearInterval(pings);for(const client of wss.clients)client.close(1012,'Server restarting');await new Promise(resolve=>setTimeout(resolve,100));await persist();await store.close?.();await new Promise(r=>server.close(r));await mf.dispose();}};
 onHandoff=()=>{void app.close().then(()=>{console.log('World handed over safely');if(process.env.RENDER)setInterval(()=>{},30000); /* Wait for Render SIGTERM without restarting a retired instance. */}).catch(()=>{console.error('World handoff failed');process.exitCode=1;});};
 return app;
}
export async function postgresStore(url){
 if(!url)throw new Error('DATABASE_URL required');
 const client=new pg.Client({connectionString:url,connectionTimeoutMillis:15000});await client.connect();
 const lock=await client.query("SELECT pg_try_advisory_lock(807221490) AS locked");if(!lock.rows[0].locked){await client.end();throw new Error('Another game server holds this world. Use a single instance.');}
 await client.query('CREATE TABLE IF NOT EXISTS aetheria_world (id INTEGER PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 client.on('error',()=>{console.error('Database connection lost');process.exitCode=1;});
 return {async load(){return (await client.query('SELECT data FROM aetheria_world WHERE id=1')).rows[0]?.data;},async save(world){await client.query('INSERT INTO aetheria_world (id,data) VALUES (1,$1::jsonb) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()',[JSON.stringify(world)]);},async close(){await client.end();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await launch({store:process.env.REALTIME_STORE_URL?remoteStore(process.env.REALTIME_STORE_URL,process.env.REALTIME_STORE_TOKEN):await postgresStore(process.env.DATABASE_URL),token:process.env.GM_TOKEN});console.log('Aetheria realtime hosting ready');let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;try{await app.close();process.exit(0);}catch{console.error('Shutdown checkpoint failed');process.exit(1);}};process.on('SIGTERM',stop);process.on('SIGINT',stop);}
