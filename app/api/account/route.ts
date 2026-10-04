import {guestIdentity,digest} from '../../../server/auth';
import {readWorld,transactWorld} from '../../../server/store';
import {accountFor,roster,changeAccount,ownedPlayer} from '../../../shared/accounts';
import {requestBody,sameOrigin} from '../../../server/request';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200,headers:Record<string,string>={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function GET(request:Request){try{const auth=await guestIdentity(request),row=auth?await readWorld():null;
 return json(auth&&row?roster(row.world,auth.id):{characters:[],slots:4,active:null,slotPrice:5000});
}catch{return json({error:'진행 정보를 불러오지 못했습니다.'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'잘못된 요청'},403);
 try{const body=await requestBody(request);let auth=await guestIdentity(request);
  if(!auth&&body.action!=='create')return json({error:'먼저 수호자를 만들어 주세요.'},401);
  const token=auth?.token||crypto.randomUUID();auth??={token,id:await digest(token),provider:'guest'};
  const result=await transactWorld((w,now)=>{accountFor(w,auth!.id);
   if(body.action==='delete'){const p=ownedPlayer(w,auth!.id,String(body.characterId||''));if(!p||body.confirm!==p.name)throw new Error('삭제할 캐릭터의 이름을 정확히 입력하세요.');}
   return changeAccount(w,auth!.id,{action:String(body.action),characterId:typeof body.characterId==='string'?body.characterId:undefined,name:typeof body.name==='string'?body.name:undefined,classId:body.classId===undefined?undefined:Number(body.classId)},now);
  });
  return json(result,200,auth.provider==='google'?{}:{'Set-Cookie':`aetheria_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`});
 }catch(e){return json({error:e instanceof Error?e.message:'진행 정보를 저장하지 못했습니다.'},400);}
}
