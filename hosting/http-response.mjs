// Consume a worker response before committing Node headers. A failed body stream
// must become one failed request, never an unhandled second writeHead().
export async function writeResponse(req,res,response,overrides){
 if(res.destroyed||res.writableEnded){await response.body?.cancel().catch(()=>{});return;}
 const noBody=req.method==='HEAD'||response.status===204||response.status===304;
 const body=noBody?null:Buffer.from(await response.arrayBuffer());
 if(noBody)await response.body?.cancel().catch(()=>{});
 if(res.destroyed||res.writableEnded)return;
 if(res.headersSent)throw new Error('Response already committed');
 const headers=Object.fromEntries(Object.entries(overrides||Object.fromEntries(response.headers)).map(([key,value])=>[key.toLowerCase(),value]));
 for(const key of ['connection','transfer-encoding','keep-alive','upgrade','trailer'])delete headers[key];
 const cookies=response.headers.getSetCookie?.();if(cookies?.length)headers['set-cookie']=cookies;
 if(body)headers['content-length']=String(body.length);
 res.writeHead(response.status,headers);
 res.end(body||undefined);
}
export function writeFailure(res,status=503,message='Server unavailable'){
 if(res.destroyed||res.writableEnded)return;
 try{
  if(res.headersSent){res.destroy();return;}
  res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
  res.end(message);
 }catch{res.destroy();}
}
