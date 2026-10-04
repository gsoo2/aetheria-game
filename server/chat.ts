import {transactWorld} from './store';
import {ownedPlayer} from '../shared/accounts';
export function postChat(accountId:string,characterId:string|null,text:unknown){return transactWorld((w,now)=>{
 const p=ownedPlayer(w,accountId,characterId);if(!p)throw new Error('수호자를 찾을 수 없습니다.');
 if(typeof text!=='string')return false;
 const value=text.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,120);
 if(!value||now-(w.chat.filter(c=>c.playerId===p.id).at(-1)?.time||0)<900)return false;
 w.chat.push({id:p.id+':'+crypto.randomUUID(),playerId:p.id,name:p.name,text:value,time:now,zone:p.zone});w.chat=w.chat.slice(-60);return true;
});}
