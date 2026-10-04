import {addXp} from '../shared/progression';
import {tutorialState,tutorialReady,tutorialKills} from '../shared/tutorial';
import type {Player,Input,World} from '../shared/types';
export function tutorialInput(w:World,p:Player,i:Input,now:number){if(i.action==='tutorialStart'&&!p.tutorial)p.tutorial=tutorialState(p);if(i.action!=='tutorialNext'||!tutorialReady(p))return;const t=p.tutorial!;if(t.stage===6){p.pets??=[];if(!p.pets.includes(0))p.pets.push(0);p.petId=0;p.petAutoLoot=true;t.completed=true;p.notice='튜토리얼 완료! 별빛 여우가 함께합니다.';return;}if(t.stage===3)t.killStart=tutorialKills(p);if(t.stage===4&&addXp(p,180))w.events.push({id:crypto.randomUUID(),time:now,zone:p.zone,x:p.x,y:p.y,kind:'level',value:p.level,color:'#ffe8a3',source:p.id});t.stage++;}
