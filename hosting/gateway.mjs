import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {WebSocketServer,WebSocket} from 'ws';
import {writeResponse,writeFailure} from './http-response.mjs';
// Keep the existing Render start command while switching to the real game server.
if(process.env.REALTIME_STORE_URL){await import('./server.mjs').then(async({launch})=>{const {remoteStore}=await import('./remote-store.mjs');const app=await launch({store:remoteStore(process.env.REALTIME_STORE_URL,process.env.REALTIME_STORE_TOKEN),token:process.env.GM_TOKEN});console.log('Aetheria realtime server ready');let stopped=false;const stop=async()=>{if(stopped)return;stopped=true;try{await app.close();process.exit(0);}catch{console.error('Final checkpoint failed');process.exit(1);}};process.on('SIGTERM',stop);process.on('SIGINT',stop);});}
const upstream=new URL('https://aetheria-rpg.lemainwang.chatgpt.site');
const root=resolve('dist/external/client');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.json':'application/json'};
export function start(port=Number(process.env.PORT||10000),host='0.0.0.0'){
 const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return;}
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`){res.writeHead(403);res.end('Invalid origin');return;}
   const headers=new Headers();for(const key of ['cookie','content-type','accept','user-agent'])if(req.headers[key])headers.set(key,String(req.headers[key]));headers.set('Origin',upstream.origin);
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const response=await fetch(new URL(url.pathname+url.search,upstream),{method:req.method,headers,redirect:'manual',signal:AbortSignal.timeout(20000),...(size?{body:Buffer.concat(chunks)}:{})});
   const out={'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'};
   const cookies=response.headers.getSetCookie();if(cookies.length)out['Set-Cookie']=cookies;
   const location=response.headers.get('location');if(location){const target=new URL(location,upstream);out.Location=target.origin===upstream.origin?target.pathname+target.search:target.href;}
   await writeResponse(req,res,response,out);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403);res.end();return;}
  try{if(!(await stat(path)).isFile())path=resolve(root,'index.html');}catch{if(extname(path)){res.writeHead(404);res.end();return;}path=resolve(root,'index.html');}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':path.endsWith('index.html')?'no-cache':'public,max-age=3600','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(error){console.error('Gateway request failed:',error.message);writeFailure(res,502,'Game server temporarily unavailable');}});
 const sockets=new WebSocketServer({noServer:true,maxPayload:4096});
 server.on('upgrade',(req,socket,head)=>{
  const url=new URL(req.url,'http://localhost');const origin=req.headers.origin;
  if(url.pathname!=='/api/socket'||origin&&origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  const remote=new WebSocket(new URL(url.pathname+url.search,upstream).href.replace('https:','wss:'),{headers:{Origin:upstream.origin,...(req.headers.cookie?{Cookie:req.headers.cookie}:{})},handshakeTimeout:15000});
  let client;const pending=[];
  remote.on('message',(data,binary)=>{if(client?.readyState===WebSocket.OPEN)client.send(data,{binary});else if(pending.length<5)pending.push([data,binary]);});
  remote.once('open',()=>sockets.handleUpgrade(req,socket,head,ws=>{client=ws;for(const [data,binary] of pending)ws.send(data,{binary});ws.on('message',(data,binary)=>{if(binary){ws.close(1003);return;}if(remote.readyState===WebSocket.OPEN)remote.send(data.toString());});ws.on('close',()=>remote.close());ws.on('error',()=>remote.terminate());}));
  remote.on('close',(code,reason)=>{if(client?.readyState===WebSocket.OPEN)client.close(code===1006?1011:code,reason.toString().slice(0,120));else if(!client)socket.destroy();});remote.on('error',()=>{if(client)client.close(1011,'Connection unavailable');else socket.destroy();});socket.on('error',()=>remote.terminate());socket.on('close',()=>remote.close());
 });
 server.listen(port,host,()=>console.log('Aetheria gateway ready'));return {server,sockets};
}
if(!process.env.REALTIME_STORE_URL&&process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){const app=start();process.on('SIGTERM',()=>{for(const client of app.sockets.clients)client.close(1001);app.server.close(()=>process.exit(0));});}
