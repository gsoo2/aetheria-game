import http from 'node:http';
import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {gmConnection} from '../local/gm-config.mjs';
const root=dirname(fileURLToPath(import.meta.url)),base=resolve(root,'..');
const sessions=new Map();let failed=[],failUntil=0;
const equal=(a,b)=>timingSafeEqual(createHash('sha256').update(String(a)).digest(),createHash('sha256').update(String(b)).digest());
export async function startGm({port=8790,config=gmConnection(base),quiet=false}={}){
 const app=http.createServer(async(req,res)=>{const host=req.headers.host||'',validHost=host===`127.0.0.1:${app.address().port}`||host===`localhost:${app.address().port}`;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'");
  const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  if(!validHost){json({error:'잘못된 접속 주소입니다.'},403);return;}
  const origin=req.headers.origin;if((origin&&origin!==`http://${host}`)||(req.method==='POST'&&origin!==`http://${host}`)){json({error:'다른 사이트의 요청을 차단했습니다.'},403);return;}
  const url=new URL(req.url,`http://${host}`);let body;
  const readBody=async()=>{let value='';for await(const chunk of req){value+=chunk;if(value.length>16384)throw new Error('요청이 너무 큽니다.');}return JSON.parse(value||'{}');};
  try{
   if(url.pathname==='/api/login'&&req.method==='POST'){const now=Date.now();if(now<failUntil){json({error:'로그인 시도가 너무 많습니다. 잠시 기다리세요.'},429);return;}body=await readBody();if(typeof body.code!=='string'||body.code.length>256||!equal(body.code.trim(),config.loginCode)){failed=failed.filter(t=>now-t<60000);failed.push(now);if(failed.length>=5)failUntil=now+60000;json({error:'관리자 로그인 코드를 확인하세요.'},401);return;}failed=[];const token=randomBytes(32).toString('hex');sessions.set(token,now+8*3600000);res.setHeader('Set-Cookie',`aetheria_gm=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);json({ok:true});return;}
   const sid=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('aetheria_gm='))?.slice(12);for(const [id,expires] of sessions)if(expires<Date.now())sessions.delete(id);
   const authorized=!!sid&&(sessions.get(sid)||0)>Date.now();
   if(url.pathname==='/api/session'){json({authenticated:authorized,server:authorized?config.url:undefined});return;}
   if(url.pathname.startsWith('/api/')){
    if(!authorized){json({error:'관리자 로그인이 필요합니다.'},401);return;}
    if(url.pathname==='/api/logout'&&req.method==='POST'){sessions.delete(sid);res.setHeader('Set-Cookie','aetheria_gm=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');json({ok:true});return;}
    const allowed=new Set(['players','player','audit','backup','action','donations','donation','settings']),name=url.pathname.slice(5);if(!allowed.has(name)||(['action','donation','settings'].includes(name)?req.method!=='POST':req.method!=='GET')){json({error:'잘못된 관리 요청입니다.'},404);return;}
    if(req.method==='POST')body=await readBody();
    const upstream=await fetch(config.url+'/api/gm/'+name+url.search,{method:req.method,headers:{Authorization:'Bearer '+config.token,'Content-Type':'application/json',Origin:config.url},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
    if(name==='backup'&&upstream.ok)res.setHeader('Content-Disposition','attachment; filename="aetheria-world-backup-'+Date.now()+'.json"');res.writeHead(upstream.status,{'Content-Type':'application/json; charset=utf-8'});res.end(await upstream.text());return;
   }
   const files={'/':'index.html','/gm.js':'gm.js','/gm.css':'gm.css'};if(req.method==='GET'&&files[url.pathname]){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});res.end(readFileSync(resolve(root,files[url.pathname])));return;}json({error:'페이지를 찾을 수 없습니다.'},404);
  }catch(e){json({error:e.name==='TimeoutError'?'게임 서버 응답이 늦습니다.':e.cause?'게임 서버에 연결할 수 없습니다. SERVER-WINDOWS.bat 실행 여부를 확인하세요.':e.message||'요청에 실패했습니다.'},502);}
 });await new Promise((ok,no)=>{app.once('error',no);app.listen(port,'127.0.0.1',ok);});if(!quiet)console.log('\nAetheria GM: http://127.0.0.1:'+app.address().port+'\nGame server: '+config.url+'\nAdmin login code: '+config.loginCode+'\nKeep this code private. Ctrl+C stops GM.\n');return app;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await startGm();if(process.argv.includes('--open')&&process.platform==='win32')spawn('cmd',['/c','start','','http://127.0.0.1:'+app.address().port],{stdio:'ignore',detached:true}).unref();const stop=()=>app.close(()=>process.exit(0));process.on('SIGINT',stop);process.on('SIGTERM',stop);}
