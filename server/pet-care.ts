import type {Input,Player,World} from '../shared/types';
import {stats} from '../shared/progression';
import {emit} from './combat';
import {PETS} from '../shared/pets';
export function petCareInput(p:Player,i:Input){
 if(i.action==='petAutoHeal'){p.petAutoHeal=i.value===1;p.notice=p.petAutoHeal?'펫 자동 회복 켜짐 · 맡겨둔 포션을 사용합니다.':'펫 자동 회복 꺼짐';return;}
 if(i.action==='petHealThreshold'&&[30,40,50,60].includes(i.value!)){p.petHealThreshold=i.value;p.notice='자동 생명 회복 기준 '+i.value+'%';return;}
 if(i.action!=='petPotionLoad'&&i.action!=='petPotionUnload')return;
 const count=i.value,slot=i.slot;if(!Number.isSafeInteger(count)||count!<1||count!>999||(slot!==0&&slot!==1))return;
 const stock=slot===0?'potions':'manaPotions',reserve=slot===0?'petHpPotions':'petMpPotions',stored=p[reserve]||0;
 if(i.action==='petPotionLoad'){
  if(!p.pets?.some(id=>PETS.some(pet=>pet.id===id))){p.notice='먼저 펫을 소장하세요.';return;}
  if(p[stock]<count!||stored+count!>999){p.notice='보유 포션이나 펫 보관 공간이 부족합니다.';return;}
  p[stock]-=count!;p[reserve]=stored+count!;p.notice='펫에게 '+count+'개 포션을 맡겼습니다.';
 }else{if(stored<count!)return;p[reserve]=stored-count!;p[stock]+=count!;p.notice='펫 포션 '+count+'개를 돌려받았습니다.';}
}
export function tickPetCare(w:World,p:Player,now:number){
 if(!p.petAutoHeal||p.hp<=0||now-p.seen>15000||p.petId===undefined||p.petId===null||!p.pets?.includes(p.petId)||!PETS.some(pet=>pet.id===p.petId))return;
 const s=stats(p),threshold=p.petHealThreshold||40;
 if(p.hp<s.hp*threshold/100&&(p.petHpPotions||0)>0&&now>=(p.potionCd||0)){
  const amount=Math.min(80,s.hp-p.hp);p.petHpPotions=(p.petHpPotions||0)-1;p.hp+=amount;p.potionCd=now+2200;emit(w,p,now,'heal',Math.ceil(amount),'#a0f4ae',{source:p.id,effect:'pet-heal'});
 }
 if(p.mp<s.mp*.35&&(p.petMpPotions||0)>0&&now>=(p.manaPotionCd||0)){
  const amount=Math.min(70,s.mp-p.mp);p.petMpPotions=(p.petMpPotions||0)-1;p.mp+=amount;p.manaPotionCd=now+2200;emit(w,p,now,'heal',Math.ceil(amount),'#a1cbff',{source:p.id,effect:'pet-mana'});
 }
}
