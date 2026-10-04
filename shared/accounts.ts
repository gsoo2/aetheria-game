import type {World,Player} from './types';
import {newPlayer} from '../server/engine';
export type Account={characters:string[];slots:number;active:string|null;google?:{name:string;email:string}};
export function accountFor(w:World,id:string):Account{w.accounts??={};return w.accounts[id]??=(w.players[id]?{characters:[id],slots:4,active:id}:{characters:[],slots:4,active:null});}
export function roster(w:World,id:string){const a=accountFor(w,id);return {characters:a.characters.map(k=>w.players[k]).filter(Boolean),slots:a.slots,active:a.active,slotPrice:5000*(a.slots-3)};}
export function ownedPlayer(w:World,accountId:string,characterId?:string|null):Player|undefined{const a=accountFor(w,accountId),id=characterId||a.active;return id&&a.characters.includes(id)?w.players[id]:undefined;}
export function changeAccount(w:World,id:string,body:{action:string;characterId?:string;name?:string;classId?:number},now:number){const a=accountFor(w,id);if(body.action==='create'){const name=String(body.name||'').replace(/[<>\x00-\x1f]/g,'').trim(),cls=Number(body.classId);if(name.length<2||name.length>14||!Number.isInteger(cls)||cls<0||cls>2)throw new Error('이름은 2~14글자로 입력하세요.');if(a.characters.length>=a.slots)throw new Error('빈 슬롯이 없습니다.');const key=crypto.randomUUID();w.players[key]=newPlayer(key,name,cls,now);a.characters.push(key);a.active=key;}
 else if(body.action==='select'){if(!a.characters.includes(body.characterId||''))throw new Error('수호자를 찾을 수 없습니다.');a.active=body.characterId!;}
 else if(body.action==='delete'){if(!a.characters.includes(body.characterId||''))throw new Error('수호자를 찾을 수 없습니다.');delete w.players[body.characterId!];a.characters=a.characters.filter(k=>k!==body.characterId);if(a.active===body.characterId)a.active=a.characters[0]||null;}
 else if(body.action==='buySlot'){const p=ownedPlayer(w,id,body.characterId);const price=5000*(a.slots-3);if(a.slots>=8)throw new Error('최대 8슬롯까지 확장할 수 있습니다.');if(!p||p.gold<price)throw new Error(`추가 슬롯은 ${price.toLocaleString()} 골드가 필요합니다.`);p.gold-=price;a.slots++;}
 else throw new Error('잘못된 요청입니다.');return roster(w,id);}
