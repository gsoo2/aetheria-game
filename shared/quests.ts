import {QUESTS} from './content';
import type {Quest} from './content';
import type {Player} from './types';
export const questKind=(q:Quest)=>q.kind||'main';
export function questAvailable(p:Player,q:Quest){return !p.done.includes(q.id)&&p.level>=(q.minLevel||1)&&(p.quests[q.id]!==undefined||q.previous===undefined||p.done.includes(q.previous));}
export function questSlots(p:Player){
 const pending=QUESTS.filter(q=>!p.done.includes(q.id));
 const main=pending.find(q=>questKind(q)==='main'&&p.quests[q.id]!==undefined)||pending.find(q=>questKind(q)==='main');
 const sides=pending.filter(q=>questKind(q)==='side'&&p.quests[q.id]!==undefined);
 for(const q of pending)if(sides.length<2&&questKind(q)==='side'&&p.level>=(q.minLevel||1)&&!sides.includes(q))sides.push(q);
 return {main,sides:sides.slice(0,2)};
}
export function canAcceptQuest(p:Player,q:Quest){
 if(!questAvailable(p,q))return false;
 if(p.quests[q.id]!==undefined)return true;
 const kind=questKind(q),active=QUESTS.filter(x=>questKind(x)===kind&&p.quests[x.id]!==undefined).length;
 return active<(kind==='main'?1:2);
}
