import {NPCS,ITEMS} from '../shared/content';
import {RECIPES} from '../shared/workshop';
import {stats} from '../shared/progression';
import type {World,Player,Input} from '../shared/types';
export function workshopInput(w:World,p:Player,input:Input){
 const service=({enhance:'forge',salvage:'materials',craft:'alchemy',materialBuy:'materials',store:'storage',withdraw:'storage'} as Record<string,string>)[input.action||''];if(!service)return;
 if(!NPCS.some(n=>n.service===service&&n.zone===p.zone&&Math.hypot(n.x-p.x,n.y-p.y)<180)){p.notice='담당 NPC에게 가까이 다가가세요.';return;}
 if(w.trades?.some(t=>(t.a===p.id||t.b===p.id))){p.notice='거래를 종료한 뒤 이용하세요.';return;}
 const index=Number(input.value);if(!Number.isSafeInteger(index)){p.notice='올바른 항목을 선택하세요.';return;}
 const materials=p.materials||[0,0,0];
 if(input.action==='materialBuy'){if(index<0||index>2||p.gold<50){p.notice='재료 구매에는 50 G가 필요합니다.';return;}p.gold-=50;p.materials=[...materials];p.materials[index]+=3;p.notice='재료 3개를 구입했습니다.';return;}
 if(input.action==='enhance'){
 const id=p.equipment[['weapon','armor','ring'][index] as keyof Player['equipment']];if(index<0||index>2||id===null||id===undefined||!p.inventory.includes(id)){p.notice='장착한 장비를 선택하세요.';return;}
 const rank=p.enhancements?.[id]||0,gold=80*(rank+1),ore=3*(rank+1),dust=2*(rank+1);
 if(rank>=5||p.level<(rank+1)*3){p.notice=rank>=5?'최대 강화 +5입니다.':`레벨 ${(rank+1)*3}부터 강화할 수 있습니다.`;return;}
 if(p.gold<gold||materials[0]<ore||materials[1]<dust){p.notice='골드와 강화 재료가 부족합니다.';return;}
 p.gold-=gold;p.materials=[materials[0]-ore,materials[1]-dust,materials[2]];p.enhancements={...p.enhancements,[id]:rank+1};p.notice=ITEMS[id].name+` 숙련 강화 +${rank+1} 완료!`;return;
 }
 if(input.action==='craft'){const r=RECIPES[index];if(!r){p.notice='없는 제작법입니다.';return;}if(p.gold<r.gold||r.cost.some((n,i)=>materials[i]<n)||(r.kind==='weapon'&&(p.level<5||p.inventory.length>=60))){p.notice='골드·재료·가방 공간을 확인하세요. 희귀 무기는 LV5부터 제작합니다.';return;}p.gold-=r.gold;p.materials=materials.map((n,i)=>n-r.cost[i]);if(r.kind==='hp')p.potions+=5;else if(r.kind==='mp')p.manaPotions+=5;else if(r.kind==='ore')p.materials[0]+=3;else p.inventory.push(7+p.classId);p.notice=r.name+' 제작 완료';return;}
 const source=input.action==='withdraw'?p.storage||[]:p.inventory,id=source[index];if(index<0||index>=source.length){p.notice='아이템을 다시 선택하세요.';return;}
 if(input.action==='withdraw'){if(p.inventory.length>=60){p.notice='가방이 가득 찼습니다.';return;}p.inventory.push(id);p.storage!.splice(index,1);}
 else {if(Object.values(p.equipment).includes(id)){p.notice='장착 중인 장비는 벗은 후 이용하세요.';return;}if(input.action==='store'){if((p.storage?.length||0)>=60){p.notice='창고가 가득 찼습니다.';return;}(p.storage??=[]).push(id);}else{p.materials=[...materials];p.materials[0]+=2+ITEMS[id].rarity*2;p.materials[1]+=1+ITEMS[id].rarity;}p.inventory.splice(index,1);const s=stats(p);p.hp=Math.min(p.hp,s.hp);p.mp=Math.min(p.mp,s.mp);}
 p.notice=input.action==='salvage'?'장비를 분해해 재료를 얻었습니다.':'창고 이동 완료';
}
