import {petCareInput,tickPetCare} from './pet-care';
import {canAcceptQuest} from '../shared/quests';
import {workshopInput} from './workshop';
import {cashInput,cashSettings} from './cash';
import {beginnerProtected} from '../shared/beginner';
import {tutorialInput} from './tutorial';
import {animalSkinInput} from './animal-skins';
import {damageSkinInput} from './damage-skins';
import {socialInput,tradeFor,expireTrades} from './social';
import {enterRaid,tickRaids} from './raids';
import {RAIDS} from '../shared/social';
import {PETS,PET_PICKUP_RADIUS} from '../shared/pets';
import {collectLoot} from './loot';
import {PROMOTION_TRIALS,PROMOTION_NAMES} from '../shared/promotion';
import {CLASSES,ITEMS,MONSTERS,isBoss,NPCS,portalsFor,QUESTS,WORLD,ZONES,zoneScale,SKILL_LEVELS,skillUnlocked,skillAvailable} from '../shared/content';
import type {Input,Player,World as Realm} from '../shared/types';
import {addXp,stats,skillPoints,autoTrain} from '../shared/progression';
import {distance as dist,movable,sweepMove} from '../shared/physics';
import {castSkill,dodge,emit as event,hurtPlayer,tickCombat} from './combat';
export {addXp,stats,needXp} from '../shared/progression';
export {movable,clearSight} from '../shared/physics';
export function newPlayer(id:string,name:string,classId:number,now:number):Player {const c=CLASSES[classId];return {id,name,classId,zone:0,x:900,y:740,face:1,hp:c.hp+15,mp:c.mp,level:1,xp:0,gold:80,inventory:[classId,3],equipment:{weapon:classId,armor:3,ring:null},potions:8,manaPotions:5,quests:{},done:[],kills:{},cd:[0,0,0,0],last:now,seen:now,attackAt:0,attackSkill:0,target:{x:0,y:0},lastSeq:0,loadout:[0,1,2,3],skillRanks:Array(12).fill(0),dodgeCd:0,dodgeUntil:0,potionCd:0,manaPotionCd:0,tutorial:{stage:0,moved:0,usedSkill:false,killStart:0,completed:false},damageSkins:[],damageSkinId:0,notice:'퀘스트 카드 클릭으로 즉시 수락 · 목표 달성 후 다시 클릭하면 보상을 받습니다.'};}
export function createWorld(now:number):Realm{const monsters:Realm['monsters']=[];for(const z of ZONES){if(z.raid||z.safe)continue;for(let i=0;i<(z.id===0?0:12);i++){const type=z.types[i%z.types.length];const x=500+(i%4)*245,y=390+Math.floor(i/4)*220;monsters.push({id:`m${z.id}-${i}`,type,zone:z.id,x,y,homeX:x,homeY:y,hp:Math.round(MONSTERS[type].hp*zoneScale(z.id)),maxHp:Math.round(MONSTERS[type].hp*zoneScale(z.id)),deadUntil:0,lastHit:0,lastAtk:0});}}return {players:{},monsters,loot:[],events:[],chat:[],tick:now,contentVersion:6};}
function notice(p:Player,s:string){p.notice=s;}
export function tickWorld(w:Realm,now:number){const dt=Math.min(.55,Math.max(0,(now-w.tick)/1000));w.tick=now;w.events=w.events.filter(e=>now-e.time<2400);w.loot=w.loot.filter(l=>now<l.expires);w.chat=w.chat.filter(c=>now-c.time<3600000).slice(-60);
 const activeByZone=new Map<number,Player[]>();for(const player of Object.values(w.players))if(player.hp>0&&now-player.seen<10000){const group=activeByZone.get(player.zone)||[];group.push(player);activeByZone.set(player.zone,group);}
 expireTrades(w,now);tickCombat(w,now);tickRaids(w,now);
 for(const p of Object.values(w.players)){if(now-p.seen>15000||p.hp<=0)continue;autoTrain(p);tickPetCare(w,p,now);const s=stats(p);p.mp=Math.min(s.mp,p.mp+dt*2.8);if(ZONES[p.zone]?.safe)p.hp=Math.min(s.hp,p.hp+dt*5);else if(beginnerProtected(p)){p.hp=Math.min(s.hp,p.hp+dt*s.hp*.025);p.mp=Math.min(s.mp,p.mp+dt*5);}if(p.petAutoLoot!==false&&p.petId!==undefined&&p.petId!==null&&p.pets?.includes(p.petId)&&now-(p.petPickupAt||0)>=450){p.petPickupAt=now;const collected=collectLoot(w,p,now,PET_PICKUP_RADIUS);if(collected)event(w,p,now,'loot',collected,'#ffe0a2',{source:p.id,effect:'pet-pickup'});}}
 for(const m of w.monsters){if(m.hp<=0){if(now>=m.deadUntil){m.hp=m.maxHp;m.x=m.homeX;m.y=m.homeY;m.attackUntil=0;m.nextSpecial=now+4500;m.burnUntil=0;}continue;}const players=(activeByZone.get(m.zone)||[]).slice().sort((a,b)=>dist(a,m)-dist(b,m));const target=players[0];const d=target?dist(m,target):Infinity;const def=ZONES[m.zone]?.raid?{...MONSTERS[m.type],atk:RAIDS[m.zone-25].atk/zoneScale(m.zone),speed:85}:MONSTERS[m.type];const frozen=Math.max(m.freezeUntil||0,m.stunUntil||0)>now;if(frozen)continue;const speed=def.speed*((m.slowUntil||0)>now?.45:1)*(isBoss(m.type)&&m.hp<m.maxHp*.5?1.25:1);
 if(target&&isBoss(m.type)&&d<400&&now>=(m.nextSpecial||0)){m.attackX=target.x;m.attackY=target.y;m.attackUntil=now+1200;m.nextSpecial=now+(m.type===9?5500:8000);event(w,{zone:m.zone,x:target.x,y:target.y},now,'warning',170,'#ff8a70',{effect:'boss-slam'});}if(m.attackUntil&&m.attackUntil>now)continue;
 if(target&&d<330){if(d>55){const move=Math.min(speed*dt,d-50);sweepMove(m,(target.x-m.x)/d*move,(target.y-m.y)/d*move);}if(d<68&&now-m.lastAtk>1100){m.lastAtk=now;hurtPlayer(w,target,def.atk*zoneScale(m.zone),now)}}
 else {const phase=Number(m.id.split('-')[1])||0;const goal={x:m.homeX+Math.sin(now/3000+phase)*12,y:m.homeY+Math.cos(now/3700+phase)*9};const distance=dist(m,goal);if(distance>.01){const move=Math.min(distance,dt*35);sweepMove(m,(goal.x-m.x)/distance*move,(goal.y-m.y)/distance*move);}}
 }
}
export function applyInput(w:Realm,p:Player,input:Input,now:number){const elapsed=Math.max(0,Math.min(2,(now-p.last)/1000));p.seen=now;const fresh=typeof input.seq==='number'&&input.seq>p.lastSeq;if(!fresh)return;p.last=now;p.lastSeq=input.seq!;p.notice='';if(p.hp<=0){if(input.action==='animalEquip'&&input.value===-1)animalSkinInput(p,input);if(input.action==='wingUnequip'||input.action==='cashEquip'&&input.value===-1)cashInput(w,p,input,now);if(input.action==='respawn'){p.zone=0;p.x=900;p.y=740;const s=stats(p);p.hp=s.hp;p.mp=s.mp;notice(p,'별샘의 빛이 당신을 되살렸습니다.');}return;}
 if(!movable(p.x,p.y,p.zone)){let found=false;for(let radius=20;radius<=700&&!found;radius+=20)for(let angle=0;angle<24;angle++){const x=p.x+Math.cos(angle/24*Math.PI*2)*radius,y=p.y+Math.sin(angle/24*Math.PI*2)*radius;if(movable(x,y,p.zone)){p.x=x;p.y=y;found=true;break;}}if(!found){p.x=900;p.y=740;}}
 const beforeMove={x:p.x,y:p.y};const dx=Math.max(-1,Math.min(1,Number(input.dx)||0)),dy=Math.max(-1,Math.min(1,Number(input.dy)||0)),len=Math.max(1,Math.hypot(dx,dy));const nx=p.x+dx/len*WORLD.speed*Math.min(.5,elapsed),ny=p.y+dy/len*WORLD.speed*Math.min(.5,elapsed);if(Number.isFinite(input.moveX)&&Number.isFinite(input.moveY)){const mx=input.moveX!,my=input.moveY!,distance=Math.hypot(mx,my),limit=WORLD.speed*elapsed+2,scale=distance>limit?limit/distance:1;sweepMove(p,mx*scale,my*scale);}else sweepMove(p,nx-p.x,ny-p.y);if(dx)p.face=dx>0?1:-1;
 if(p.tutorial?.stage===1)p.tutorial.moved=Math.min(120,p.tutorial.moved+Math.hypot(p.x-beforeMove.x,p.y-beforeMove.y));
 tutorialInput(w,p,input,now);damageSkinInput(p,input);animalSkinInput(p,input);petCareInput(p,input);
 if(input.action==='dodge')dodge(w,p,input,now);
 castSkill(w,p,input,now);if(p.tutorial?.stage===2&&p.attackAt===now&&Number.isInteger(input.skill))p.tutorial.usedSkill=true;socialInput(w,p,input,now);cashInput(w,p,input,now);workshopInput(w,p,input);if(input.action==='raidClaim'){while(p.raidRewards?.length&&p.inventory.length<60)p.inventory.push(p.raidRewards.shift()!);p.notice=p.raidRewards?.length?'가방 공간을 확보하세요.':'보상 무기를 수령했습니다.';}if(input.action==='raidEnter')enterRaid(w,p,Number(input.value),now);if(input.action==='raidLeave'&&ZONES[p.zone]?.raid){p.zone=0;p.x=900;p.y=740;p.notice='별샘 마을로 돌아왔습니다.';}
 if(input.action==='autoTrain'||input.action==='autoSkillMode'){const mode=Number(input.value);if(Number.isInteger(mode)&&mode>=0&&mode<=3){if(input.action==='autoSkillMode')p.autoSkillMode=mode;const used=autoTrain(p,mode);notice(p,mode===0?'자동 배분을 껐습니다.':used?`숙련 포인트 ${used}개를 자동 배분했습니다.`:'자동 배분 설정을 저장했습니다. 다음 레벨부터 적용됩니다.');}}
 if(input.action==='train'){const skill=Number(input.value);p.skillRanks??=Array(12).fill(0);if(Number.isInteger(skill)&&skill>=0&&skill<12&&skillAvailable(p,skill)&&skillPoints(p)>0&&(p.skillRanks[skill]||0)<3){p.skillRanks[skill]=(p.skillRanks[skill]||0)+1;notice(p,CLASSES[p.classId].skills[skill]+' 숙련도 상승');}else notice(p,'남은 숙련 포인트가 없거나 최대 숙련도입니다.');}
 if(input.action==='loot'){const count=collectLoot(w,p,now,160);if(count){notice(p,`전리품 ${count}개 획득`);event(w,p,now,'loot',count,'#ffe0a2',{source:p.id});}else notice(p,'가까운 전리품이 없거나 가방 공간이 부족합니다.');}
 if(input.action==='potion'||input.action==='mana'){const hp=input.action==='potion',s=stats(p),cooldown=hp?p.potionCd||0:p.manaPotionCd||0;if(now<cooldown){notice(p,'물약을 다시 사용하려면 잠시 기다리세요.');}else if(hp?p.hp>=s.hp:p.mp>=s.mp){notice(p,hp?'생명력이 가득 차 있습니다.':'마나가 가득 차 있습니다.');}else if(hp?p.potions>0:p.manaPotions>0){const amount=hp?Math.min(80,s.hp-p.hp):Math.min(70,s.mp-p.mp);if(hp){p.potions--;p.hp=Math.min(s.hp,p.hp+80);p.potionCd=now+2200;}else{p.manaPotions--;p.mp=Math.min(s.mp,p.mp+70);p.manaPotionCd=now+2200;}event(w,p,now,'heal',Math.ceil(amount),hp?'#a0f4ae':'#a1cbff',{source:p.id});}else notice(p,'물약이 없습니다. 마을 상점에서 구입하세요.');}
 if(input.action==='bind'){const slot=Number(input.slot),skill=Number(input.value);if(Number.isInteger(slot)&&slot>=0&&slot<4&&(skill===-1||(Number.isInteger(skill)&&skill>=0&&skill<12&&skillUnlocked(p,skill)))){p.loadout??=[0,1,2,3];p.loadout[slot]=skill;notice(p,'스킬 슬롯을 변경했습니다.');}}
 if(input.action==='portal'||input.action==='travel'){const direct=input.action==='travel',portal=direct?undefined:portalsFor(p.zone)[Number(input.value)],zone=direct?Number(input.value):portal?.target;if((direct||portal&&dist(p,portal)<160)&&Number.isInteger(zone)&&zone!>=0&&zone!<ZONES.length&&!ZONES[zone!].raid){if(p.level<ZONES[zone!].minLevel)notice(p,`레벨 ${ZONES[zone!].minLevel}부터 들어갈 수 있습니다.`);else {p.zone=zone!;p.x=direct?900:portal!.next>0?400:1400;p.y=direct?830:680;notice(p,ZONES[zone!].name+'에 도착했습니다.');}}else notice(p,direct?'이동할 수 없는 지역입니다.':'이동 구슬이나 차원문에 가까이 다가가세요.');}
 if(input.action==='promotion'){const tier=p.promotionTier||0,trial=PROMOTION_TRIALS[tier];if(!trial)notice(p,'최종 전직을 이미 완료했습니다.');else if(p.level<trial.level)notice(p,`레벨 ${trial.level}부터 전직할 수 있습니다.`);else {p.promotionTier=tier+1;delete p.promotionQuest;const st=stats(p);p.hp=st.hp;p.mp=st.mp;autoTrain(p);notice(p,PROMOTION_NAMES[p.classId][tier]+' 전직 완료! 새 스킬과 숙련 포인트 2개를 얻었습니다.');event(w,p,now,'level',p.level,'#ffe8a3',{source:p.id});}}

 if(input.action==='quest'){
  const id=Number(input.value),q=Number.isInteger(id)?QUESTS[id]:undefined;
  if(!q||p.done.includes(id))return;
  if(!canAcceptQuest(p,q)){notice(p,p.level<(q.minLevel||1)?`레벨 ${q.minLevel}부터 시작할 수 있습니다.`:'먼저 진행 중인 임무 또는 이전 메인 이야기를 완료하세요.');return;}
  if(p.quests[id]===undefined){p.quests[id]=0;notice(p,`${q.name} 수락 · ${q.description}`);}
  else if(p.quests[id]>=q.count){
   if(q.id===4&&p.inventory.length>=60){notice(p,'보상 무기를 받으려면 가방 한 칸을 비워 주세요.');return;}
   p.done.push(id);delete p.quests[id];p.gold+=q.gold;
   if(addXp(p,q.xp))event(w,p,now,'level',p.level,'#ffe8a3',{source:p.id});
   if(q.id===4)p.inventory.push(14);
   p.lastQuestReward={id:q.id,gold:q.gold,xp:q.xp,time:now};
   event(w,p,now,'loot',q.gold,'#ffe0a2',{source:p.id,effect:'quest-reward'});
   notice(p,`퀘스트 완료! ${q.gold} 골드 · ${q.xp} 경험치 획득`);
  }else notice(p,`아직 목표를 달성하지 못했습니다. ${p.quests[id]} / ${q.count}`);
 }
 if(input.action==='buyPet'&&NPCS.some(n=>(n.service==='pets'||n.service==='shop')&&n.zone===p.zone&&dist(p,n)<180)){const pet=PETS[Number(input.value)];if(pet&&!pet.cashOnly&&Number.isInteger(input.value)){p.pets??=[];if(p.pets.includes(pet.id))notice(p,'이미 함께하는 펫입니다.');else if(p.gold<pet.price)notice(p,'골드가 부족합니다.');else{p.gold-=pet.price;p.pets.push(pet.id);p.petId=pet.id;p.petAutoLoot=true;notice(p,pet.name+'이 모험에 함께합니다. 가까운 전리품을 자동으로 줍습니다.');}}}
 if(input.action==='equipPet'){const id=Number(input.value);if(id===-1){p.petId=null;notice(p,'펫을 쉬게 했습니다.');}else if(Number.isInteger(id)&&p.pets?.includes(id)){p.petId=id;notice(p,PETS[id].name+'을 불러냈습니다.');}}
 if(input.action==='petAutoLoot'){p.petAutoLoot=input.value===1;notice(p,p.petAutoLoot?'펫 자동 줍기 켜짐':'펫 자동 줍기 꺼짐');}
 if(input.action==='buy'&&NPCS.some(n=>n.service==='shop'&&n.zone===p.zone&&dist(p,n)<180)){const value=Number(input.value);if(value===-1||value===-2){const price=18;if(p.gold>=price){p.gold-=price;if(value===-1)p.potions+=3;else p.manaPotions+=3;notice(p,'물약 3개를 구입했습니다.');}else notice(p,'골드가 부족합니다.');}else {const item=ITEMS[value];if(item&&!item.gmOnly&&!item.cashOnly&&Number.isInteger(value)&&p.level>=(item.minLevel||1)&&p.inventory.length<60&&p.gold>=item.price){p.gold-=item.price;p.inventory.push(value);notice(p,item.name+' 구입');}else notice(p,item&&p.level<(item.minLevel||1)?`레벨 ${item.minLevel}부터 구입할 수 있습니다.`:'골드 또는 가방 공간이 부족합니다.');}}
 if(input.action==='heal'&&NPCS.some(n=>n.service==='heal'&&n.zone===p.zone&&dist(p,n)<180)){const s=stats(p);p.hp=s.hp;p.mp=s.mp;notice(p,'엘린의 빛으로 생명력과 마나를 회복했습니다.');event(w,p,now,'heal',s.hp,'#a0f4ae',{source:p.id});}
 if(input.action==='equip'){const item=ITEMS[Number(input.value)];if(item&&p.inventory.includes(item.id)&&p.level>=(item.minLevel||1)&&(item.classId===undefined||item.classId===p.classId)){p.equipment[item.slot]=item.id;p.hp=Math.min(p.hp,stats(p).hp);notice(p,item.name+' 장착');}else if(item)notice(p,'장착 레벨 또는 직업 조건을 확인하세요.');}
 if(input.action==='sell'){const index=Number(input.value);if(NPCS.some(n=>n.service==='shop'&&n.zone===p.zone&&dist(p,n)<180)&&Number.isInteger(index)&&index>=0&&index<p.inventory.length){const id=p.inventory[index];if(ITEMS[id].gmOnly||ITEMS[id].cashOnly)notice(p,'전용 장비는 판매할 수 없습니다.');else if(Object.values(p.equipment).includes(id))notice(p,'장착 중인 아이템은 판매할 수 없습니다.');else {p.inventory.splice(index,1);p.gold+=Math.floor(ITEMS[id].price*.4);notice(p,'아이템을 판매했습니다.');}}}
 if(input.chat&&now-(w.chat.filter(c=>c.id.startsWith(p.id)).at(-1)?.time||0)>900){const text=String(input.chat).replace(/[<>\x00-\x1f]/g,'').trim().slice(0,120);if(text)w.chat.push({id:p.id+':'+crypto.randomUUID(),name:p.name,text,time:now,zone:p.zone,playerId:p.id});}
}
export function snapshot(w:Realm,p:Player,now:number){return {shopSettings:cashSettings(w),donations:(w.donations||[]).filter(d=>d.playerId===p.id).slice(-20),trade:tradeFor(w,p.id),raid:w.raids?.find(b=>b.zone===p.zone),player:p,players:Object.values(w.players).filter(a=>a.zone===p.zone&&now-a.seen<10000&&a.id!==p.id).map(a=>({...a,gold:0,xp:0,inventory:[],quests:{},done:[],kills:{},cd:[],potions:0,manaPotions:0,cash:undefined,cashPurchases:undefined,storage:undefined,materials:undefined,donations:undefined,gmRevision:undefined,gmBanned:undefined,gmBlockedUntil:undefined,animalSkins:undefined,wings:undefined,pets:undefined})),monsters:w.monsters.filter(m=>m.zone===p.zone),loot:w.loot.filter(l=>l.zone===p.zone),events:w.events.filter(e=>e.zone===p.zone),chat:w.chat.slice(-30),now,online:Object.values(w.players).filter(a=>now-a.seen<10000).length,casts:(w.casts||[]).filter(c=>c.zone===p.zone)};}

export function migrateWorld(w:Realm,now:number){
 if(w.contentVersion===6)return;
 const template=createWorld(now),ids=new Set(w.monsters.map(m=>m.id));
 for(const m of template.monsters)if(!ids.has(m.id))w.monsters.push(m);
 for(const z of ZONES){if(z.safe||z.raid||z.id===0)continue;
  const type=z.biome===1?11:z.biome===2?12:10;
  for(let i=0;i<3;i++){const id=`v13-${z.id}-${i}`;if(ids.has(id))continue;const x=600+i*220,y=740;
   w.monsters.push({id,type,zone:z.id,x,y,homeX:x,homeY:y,hp:Math.round(MONSTERS[type].hp*zoneScale(z.id)),maxHp:Math.round(MONSTERS[type].hp*zoneScale(z.id)),deadUntil:0,lastHit:0,lastAtk:0});}
  if(z.id===2&&!w.monsters.some(m=>m.zone===2&&m.type===2)){const x=650,y=660;w.monsters.push({id:'v13-forest-mushroom',type:2,zone:2,x,y,homeX:x,homeY:y,hp:85,maxHp:85,deadUntil:0,lastHit:0,lastAtk:0});}
 }
 for(const z of ZONES){if(z.safe||z.raid||z.id===0)continue;for(const type of z.types.filter(t=>t>=13&&t<19)){const id=`v14-${z.id}-${type}`;if(w.monsters.some(m=>m.id===id))continue;const x=550+(type-13)%3*270,y=510+Math.floor((type-13)/3)*190;const hp=Math.round(MONSTERS[type].hp*zoneScale(z.id));w.monsters.push({id,type,zone:z.id,x,y,homeX:x,homeY:y,hp,maxHp:hp,deadUntil:0,lastHit:0,lastAtk:0});}}
 for(const z of ZONES){if(z.safe||z.raid||z.id===0)continue;for(const type of z.types.filter(t=>t>=19)){const id=`v16-${z.id}-${type}`;if(w.monsters.some(m=>m.id===id||m.zone===z.id&&m.type===type))continue;const x=520+(type-19)%3*270,y=720;const hp=Math.round(MONSTERS[type].hp*zoneScale(z.id));w.monsters.push({id,type,zone:z.id,x,y,homeX:x,homeY:y,hp,maxHp:hp,deadUntil:0,lastHit:0,lastAtk:0});}}
 for(const p of Object.values(w.players)){if(p.gmSkin!==undefined&&p.gmSkin>=0&&p.gmSkin<8){p.animalSkins??=[];if(!p.animalSkins.includes(p.gmSkin))p.animalSkins.push(p.gmSkin);}}
 w.contentVersion=6;
}
