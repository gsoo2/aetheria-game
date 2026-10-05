import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,newPlayer,applyInput,migrateWorld,stats,snapshot} from '../server/engine';
import {cashInput} from '../server/cash';
import {petCareInput,tickPetCare} from '../server/pet-care';
import {damageMonster} from '../server/combat';
import {socialInput} from '../server/social';
import {workshopInput} from '../server/workshop';
import {ANIMAL_SKINS} from '../shared/animal-skins';
import {CASH_PRODUCTS,cashProductOwned} from '../shared/cash';
import {ITEMS,MONSTERS,NPCS,ZONES,zoneScale} from '../shared/content';
const now=1800000000000;
function setup(){const w=createWorld(now),p=newPlayer('p','확인',0,now);w.players.p=p;p.cash=5000;return {w,p};}
test('two gold skins and four cash skins enforce their purchase channels; legacy owners keep access',()=>{
 const {w,p}=setup();assert.equal(ANIMAL_SKINS.filter(s=>s.currency==='gold').length,2);assert.equal(ANIMAL_SKINS.filter(s=>s.currency==='cash').length,4);
 p.gold=100000;applyInput(w,p,{seq:1,action:'animalBuy',value:2},now);assert.equal(p.animalSkinId,undefined);assert.equal(p.gold,100000);
 p.animalSkins=[3];cashInput(w,p,{action:'cashBuy',value:12},now);assert.equal(p.cash,5000);cashInput(w,p,{action:'cashEquip',value:12},now);assert.equal(p.animalSkinId,3);
});
test('cash animal, wings, image titles and pets charge once, re-equip and appear in remote snapshots',()=>{
 const {w,p}=setup(),base=stats(p);const q=newPlayer('q','동료',1,now);w.players.q=q;
 for(const id of [12,16,19,22]){const product=CASH_PRODUCTS.find(x=>x.id===id)!;const before=p.cash!;cashInput(w,p,{action:'cashBuy',value:id},now);assert.equal(p.cash,before-product.price);assert.ok(cashProductOwned(p,product));cashInput(w,p,{action:'cashBuy',value:id},now);assert.equal(p.cash,before-product.price);cashInput(w,p,{action:'cashEquip',value:id},now);}
 assert.deepEqual(stats(p),base);assert.equal(p.petId,3);assert.equal(p.wingId,0);assert.equal(p.titleBadgeId,0);assert.equal(snapshot(w,q,now).players[0].wingId,0);
 cashInput(w,p,{action:'wingUnequip'},now);assert.equal(p.wingId,undefined);cashInput(w,p,{action:'cashEquip',value:16},now);assert.equal(p.wingId,0);
 cashInput(w,p,{action:'cashEquip',value:-1},now);assert.equal(p.titleBadgeId,undefined);
 const restored=JSON.parse(JSON.stringify(w));assert.deepEqual(restored.players.p.wings,[0]);assert.deepEqual(restored.players.p.pets,[3]);
});
test('paid weapon requires level, class and space, improves attacks and cannot enter free shops',()=>{
 const {w,p}=setup();cashInput(w,p,{action:'cashBuy',value:24},now);assert.equal(p.cash,5000);assert.ok(!p.inventory.includes(44));p.level=15;p.inventory=Array(60).fill(0);cashInput(w,p,{action:'cashBuy',value:24},now);assert.equal(p.cash,5000);
 p.inventory=[0];const base=stats(p);cashInput(w,p,{action:'cashBuy',value:24},now);assert.equal(p.cash,4300);applyInput(w,p,{seq:1,action:'equip',value:44},now);assert.ok(stats(p).atk>base.atk);
 const shop=NPCS.find(n=>n.service==='shop'&&n.zone===0)!;p.x=shop.x;p.y=shop.y;p.gold=100000;applyInput(w,p,{seq:2,action:'buy',value:45},now+1);assert.ok(!p.inventory.includes(45));applyInput(w,p,{seq:3,action:'buyPet',value:4},now+2);assert.ok(!p.pets?.includes(4));
});
test('fixed cash supply box can be bought repeatedly and refuses overflow without charging',()=>{
 const {w,p}=setup(),hp=p.potions,mp=p.manaPotions;for(let n=0;n<2;n++)cashInput(w,p,{action:'cashBuy',value:25},now);assert.equal(p.cash,4800);assert.equal(p.potions,hp+120);assert.equal(p.manaPotions,mp+80);
 p.potions=9999;cashInput(w,p,{action:'cashBuy',value:25},now);assert.equal(p.cash,4800);assert.equal(p.manaPotions,mp+80);
});
test('pet potion deposits and withdrawal conserve inventory and reject forged quantities or nonowners',()=>{
 const {p}=setup();p.potions=20;petCareInput(p,{action:'petPotionLoad',slot:0,value:10});assert.equal(p.potions,20);p.pets=[0];
 for(const value of [-1,0,1.5,1000])petCareInput(p,{action:'petPotionLoad',slot:0,value});assert.equal(p.potions,20);
 petCareInput(p,{action:'petPotionLoad',slot:0,value:10});assert.equal(p.potions,10);assert.equal(p.petHpPotions,10);petCareInput(p,{action:'petPotionUnload',slot:0,value:11});assert.equal(p.potions,10);
 petCareInput(p,{action:'petPotionUnload',slot:0,value:10});assert.equal(p.potions,20);assert.equal(p.petHpPotions,0);
 p.petHpPotions=995;petCareInput(p,{action:'petPotionLoad',slot:0,value:10});assert.equal(p.potions,20);assert.equal(p.petHpPotions,995);
});
test('pet healing consumes reserved HP and MP potions and shares manual potion cooldowns',()=>{
 const {w,p}=setup();p.pets=[0];p.petId=0;p.petAutoHeal=true;p.hp=5;p.mp=0;p.petHpPotions=3;p.petMpPotions=3;const bag=p.potions;
 tickPetCare(w,p,now);assert.equal(p.hp,85);assert.equal(p.petHpPotions,2);assert.equal(p.petMpPotions,2);assert.equal(p.potions,bag);assert.equal(p.potionCd,now+2200);assert.equal(p.manaPotionCd,now+2200);
 p.hp=1;p.mp=0;tickPetCare(w,p,now+1000);assert.equal(p.hp,1);assert.equal(p.petHpPotions,2);applyInput(w,p,{seq:1,action:'potion'},now+1000);assert.equal(p.potions,bag);
 applyInput(w,p,{seq:2,action:'potion'},now+2300);assert.equal(p.potions,bag-1);p.hp=1;tickPetCare(w,p,now+2400);assert.equal(p.petHpPotions,2);
});
test('pet automation never revives, uses an absent or unowned pet, or heals an offline player',()=>{
 const {w,p}=setup();p.pets=[0];p.petAutoHeal=true;p.petHpPotions=3;p.hp=1;
 tickPetCare(w,p,now);assert.equal(p.hp,1);p.petId=4;tickPetCare(w,p,now);assert.equal(p.hp,1);p.petId=0;p.hp=0;tickPetCare(w,p,now);assert.equal(p.hp,0);p.hp=1;p.seen=now-16000;tickPetCare(w,p,now);assert.equal(p.hp,1);assert.equal(p.petHpPotions,3);
});
test('v16 migration appends four new species once and preserves player progress and GM animal ownership',()=>{
 const {w,p}=setup();const level=p.level;p.gmSkin=2;w.contentVersion=5;w.monsters=w.monsters.filter(m=>m.type<19);migrateWorld(w,now);assert.equal(w.contentVersion,6);for(let type=19;type<23;type++)assert.ok(w.monsters.some(m=>m.type===type));const ids=w.monsters.map(m=>m.id);migrateWorld(w,now);assert.deepEqual(w.monsters.map(m=>m.id),ids);assert.equal(new Set(ids).size,ids.length);assert.equal(p.level,level);assert.ok(p.animalSkins?.includes(2));assert.ok(w.monsters.every(m=>!ZONES[m.zone].safe));
});
test('new monsters award server XP and loot once; the equipment drop pool excludes GM and paid gear',()=>{
 const {w,p}=setup();p.level=20;const original=Math.random;
 try{for(let type=19;type<23;type++){const m=w.monsters.find(m=>m.type===type)!;p.zone=m.zone;p.x=m.x;p.y=m.y;m.hp=1;let call=0;Math.random=()=>[.1,.1,.999,.5][call++%4];const oldKills=p.kills[type]||0,count=w.loot.length;damageMonster(w,m,p,100,now);assert.equal(m.hp,0);assert.equal(w.loot.length,count+1);assert.equal(p.kills[type],oldKills+1);assert.equal(w.loot.at(-1)!.gold,Math.round(MONSTERS[type].gold*zoneScale(m.zone)));const item=w.loot.at(-1)!.item;if(item!==null){assert.ok(!ITEMS[item].gmOnly);assert.ok(!ITEMS[item].cashOnly);}damageMonster(w,m,p,100,now+1);assert.equal(w.loot.length,count+1);}}finally{Math.random=original;}
});
test('bound paid gear cannot be sold, salvaged or offered in player trades but can use own storage',()=>{
 const {w,p}=setup();p.inventory.push(44);const index=p.inventory.length-1;
 for(const [action,service] of [['sell','shop'],['salvage','materials']] as const){const n=NPCS.find(n=>n.service===service&&n.zone===0)!;p.x=n.x;p.y=n.y;if(action==='sell')applyInput(w,p,{seq:1,action,value:index},now);else workshopInput(w,p,{action,value:index});assert.ok(p.inventory.includes(44));}
 const q=newPlayer('q','동료',1,now);q.x=p.x;q.y=p.y;w.players.q=q;socialInput(w,p,{action:'tradeRequest',targetId:q.id},now);const t=w.trades![0];socialInput(w,q,{action:'tradeAccept',tradeId:t.id},now);socialInput(w,p,{action:'tradeOffer',tradeId:t.id,indices:[index],gold:0},now);assert.deepEqual(t.offers.p.items,[]);
 w.trades=[];const n=NPCS.find(n=>n.service==='storage'&&n.zone===0)!;p.x=n.x;p.y=n.y;workshopInput(w,p,{action:'store',value:index});assert.ok(p.storage?.includes(44));workshopInput(w,p,{action:'withdraw',value:0});assert.ok(p.inventory.includes(44));
});
