import {guestIdentity} from '../../../../server/auth';
import {googleConfigured,authCookie,cookie} from '../../../../server/google-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const auth=await guestIdentity(request);const headers:Record<string,string>={'Cache-Control':'no-store'};
  if(!auth&&cookie(request,'__Host-aetheria_session'))headers['Set-Cookie']=authCookie('__Host-aetheria_session','',0);
  return Response.json({googleEnabled:googleConfigured(),provider:auth?.provider||'guest',profile:auth?.profile||null},{headers});
 }catch{return Response.json({error:'로그인 정보를 불러오지 못했습니다.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
