import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newPlayer,createWorld,applyInput,snapshot} from '../server/engine';
import {animalSkinInput} from '../server/animal-skins';
import {ANIMAL_SKINS,animalFrame} from '../shared/animal-skins';
import {gmMutate} from '../server/gm';
const now=1800000000000;
test('animal purchases reject cash IDs, unowned equip and insufficient gold; charge once and persist ownership',()=>{
 const p=newPlayer('a','수호자',0,now),w=createWorld(now);w.players.a=p;
 const original=JSON.stringify(p);animalSkinInput(p,{action:'animalEquip',value:3});animalSkinInput(p,{action:'animalBuy',value:2});assert.equal(JSON.stringify(p),original);
 animalSkinInput(p,{action:'animalBuy',value:1});assert.equal(p.gold,80);assert.equal(p.animalSkinId,undefined);
 p.gold=3000;applyInput(w,p,{action:'animalBuy',value:1,seq:1},now);assert.equal(p.gold,2200);assert.equal(p.animalSkinId,1);
 applyInput(w,p,{action:'animalBuy',value:1,seq:2},now+1);assert.equal(p.gold,2200);assert.deepEqual(p.animalSkins,[1]);
 const restored=JSON.parse(JSON.stringify(w));assert.deepEqual(restored.players.a.animalSkins,[1]);assert.equal(restored.players.a.animalSkinId,1);
 animalSkinInput(p,{action:'animalEquip',value:-1});assert.equal(p.animalSkinId,undefined);animalSkinInput(p,{action:'animalEquip',value:1});assert.equal(p.animalSkinId,1);assert.equal(p.gold,2200);
});
test('all eight GM animal forms and shop changes reach other players without modifying combat stats',()=>{
 const p=newPlayer('a','수호자',0,now),b=newPlayer('b','동료',1,now),w=createWorld(now);w.players={a:p,b};const combat=[p.level,p.hp,p.mp,p.equipment,p.inventory];
 for(const skin of ANIMAL_SKINS){gmMutate(w,{playerId:'a',action:'setSkin',cosmeticId:skin.id,revision:skin.id},now);assert.equal(snapshot(w,b,now).players[0].gmSkin,skin.id);}
 assert.deepEqual([p.level,p.hp,p.mp,p.equipment,p.inventory],combat);p.gold=10000;animalSkinInput(p,{action:'animalEquip',value:4});assert.equal(p.gmSkin,undefined);assert.equal(snapshot(w,b,now).players[0].animalSkinId,4);
});
test('animal animation states have walking, attack anticipation/strike and two defeat frames with death priority',()=>{
 const state={dead:false,deathAge:0,attackAge:Infinity,moving:false,time:0};assert.equal(animalFrame(state),0);
 assert.deepEqual([0,125,250,375].map(time=>animalFrame({...state,moving:true,time})),[0,1,2,3]);
 assert.equal(animalFrame({...state,attackAge:40,moving:true}),4);assert.equal(animalFrame({...state,attackAge:200}),5);
 assert.equal(animalFrame({...state,dead:true,attackAge:40}),6);assert.equal(animalFrame({...state,dead:true,deathAge:300}),7);
});
