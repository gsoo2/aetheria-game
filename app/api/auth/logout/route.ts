import {cookie,authCookie,revokeLoginSession} from '../../../../server/google-auth';
import {sameOrigin} from '../../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'잘못된 요청'},{status:403});
 try{const token=cookie(request,'__Host-aetheria_session');if(token)await revokeLoginSession(token);
  const h=new Headers({'Cache-Control':'no-store'});h.append('Set-Cookie',authCookie('__Host-aetheria_session','',0));h.append('Set-Cookie',authCookie('__Host-aetheria_oauth','',0));
  return Response.json({ok:true},{headers:h});
 }catch{return Response.json({error:'로그아웃하지 못했습니다.'},{status:503});}
}
