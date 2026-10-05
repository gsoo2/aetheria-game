import type {Input} from '../shared/types';
export function gameInput(body:Record<string,unknown>):Input{
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('잘못된 요청');
 for(const key of ['seq','dx','dy','tx','ty','moveX','moveY','skill','value','slot','revision','gold']){const value=body[key];if(value!==undefined&&(typeof value!=='number'||!Number.isFinite(value)))throw new Error('잘못된 숫자');}
 for(const key of ['seq','skill','value','slot','revision','gold'])if(body[key]!==undefined&&!Number.isSafeInteger(body[key]))throw new Error('잘못된 정수');
 for(const key of ['action','targetId','tradeId','reference','chat'])if(body[key]!==undefined&&(typeof body[key]!=='string'||(body[key] as string).length>160))throw new Error('잘못된 문자열');
 if(body.indices!==undefined&&(!Array.isArray(body.indices)||body.indices.length>12||body.indices.some(v=>!Number.isSafeInteger(v)||v<0)))throw new Error('잘못된 아이템');
 const seq=Number(body.seq);if(!Number.isSafeInteger(seq)||seq<0)throw new Error('잘못된 입력');
 return {seq,dx:Number(body.dx)||0,dy:Number(body.dy)||0,skill:body.skill===undefined?undefined:Number(body.skill),tx:Number(body.tx)||0,ty:Number(body.ty)||0,
  action:typeof body.action==='string'?body.action:undefined,value:body.value===undefined?undefined:Number(body.value),slot:body.slot===undefined?undefined:Number(body.slot),
  moveX:body.moveX===undefined?undefined:Number(body.moveX),moveY:body.moveY===undefined?undefined:Number(body.moveY),
  reference:typeof body.reference==='string'?body.reference:undefined,chat:typeof body.chat==='string'?body.chat:undefined,
  targetId:typeof body.targetId==='string'?body.targetId:undefined,tradeId:typeof body.tradeId==='string'?body.tradeId:undefined,
  revision:body.revision===undefined?undefined:Number(body.revision),indices:Array.isArray(body.indices)?body.indices.map(Number):undefined,gold:body.gold===undefined?undefined:Number(body.gold)};
}
export async function requestBody(request:Request){const raw=await request.text();if(raw.length>4096)throw new Error('요청이 너무 큽니다.');const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('잘못된 요청');return body as Record<string,unknown>;}
export function sameOrigin(request:Request){const origin=request.headers.get('Origin');try{return origin?origin===new URL(request.url).origin:request.method==='GET'||request.method==='HEAD';}catch{return false;}}
