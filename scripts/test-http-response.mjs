import {createServer,get} from 'node:http';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {writeResponse,writeFailure} from '../hosting/http-response.mjs';
const server=createServer(async(req,res)=>{
 try{
  if(req.url==='/late'){res.writeHead(200);res.flushHeaders();throw Error('failure after headers');}
  if(req.url==='/broken')return await writeResponse(req,res,new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1,2,3]));controller.error(Error('broken worker stream'));}})));
  if(req.url==='/slow')return await writeResponse(req,res,new Response(new ReadableStream({async start(controller){await new Promise(r=>setTimeout(r,100));controller.enqueue(new Uint8Array([1,2,3]));controller.close();}})));
  if(req.url==='/cached')return await writeResponse(req,res,new Response(null,{status:304}));
  if(req.url==='/gzip')return await writeResponse(req,res,new Response(gzipSync('compressed response survives'),{headers:{'Content-Encoding':'gzip'}}));
  const headers=new Headers();headers.append('Set-Cookie','first=a; Path=/');headers.append('Set-Cookie','second=b; Path=/');
  await writeResponse(req,res,new Response('healthy',{headers}));
 }catch{writeFailure(res);}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
try{
 const failed=await fetch(base+'/broken');assert.equal(failed.status,503);assert.equal(await failed.text(),'Server unavailable');
 const head=await fetch(base+'/broken',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 await fetch(base+'/late').then(r=>r.text()).catch(()=>{});
 await new Promise(resolve=>{const req=get(base+'/slow');req.on('error',resolve);setTimeout(()=>req.destroy(),10);});
 await new Promise(r=>setTimeout(r,130));
 const healthy=await fetch(base);assert.equal(healthy.status,200);assert.equal(await healthy.text(),'healthy');assert.equal(healthy.headers.getSetCookie().length,2);
 assert.equal((await fetch(base+'/cached')).status,304);
 assert.equal(await (await fetch(base+'/gzip')).text(),'compressed response survives');
 console.log('PASS: failed body returns 503 without crashing; HEAD, 304, compressed responses, multiple cookies, committed headers and aborted requests preserve server health');
}finally{await new Promise(r=>server.close(r));}
