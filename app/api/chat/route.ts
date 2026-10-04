import {guestIdentity} from '../../../server/auth';
import {postChat} from '../../../server/chat';
import {requestBody,sameOrigin} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'잘못된 요청'},{status:403});
 const auth=await guestIdentity(request);if(!auth)return Response.json({needsCharacter:true},{status:401});
 try{const body=await requestBody(request);const sent=await postChat(auth.id,new URL(request.url).searchParams.get('characterId'),body.text);return sent?Response.json({ok:true}):Response.json({error:'채팅은 잠시 기다린 후 다시 보내세요.'},{status:429});}
 catch{return Response.json({error:'채팅을 보내지 못했습니다.'},{status:400});}
}
