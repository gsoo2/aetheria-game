import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,newPlayer,applyInput,migrateWorld,tickWorld} from '../server/engine';
import {killMonster} from '../server/combat';
import {QUESTS,ZONES,isBoss,MAIN_QUESTS} from '../shared/content';
import {questSlots} from '../shared/quests';
const time=1800000000000;
function setup(){const w=createWorld(time),p=newPlayer('quest','수호자',0,time);w.players[p.id]=p;return {w,p};}
test('remote card accepts and claims exactly once; incomplete objectives cannot claim',()=>{
 const {w,p}=setup();p.zone=1;p.x=700;p.y=700;
 applyInput(w,p,{seq:1,action:'quest',value:0},time);assert.equal(p.quests[0],0);
 const gold=p.gold;applyInput(w,p,{seq:2,action:'quest',value:0},time+1);assert.equal(p.gold,gold);
 p.quests[0]=QUESTS[0].count;applyInput(w,p,{seq:3,action:'quest',value:0},time+2);
 assert.equal(p.gold,gold+QUESTS[0].gold);assert.ok(p.done.includes(0));assert.equal(p.lastQuestReward?.id,0);
 applyInput(w,p,{seq:4,action:'quest',value:0},time+3);assert.equal(p.gold,gold+QUESTS[0].gold);
});
test('one main and two sides; level backlog remains visible, completion replaces one slot',()=>{
 const {w,p}=setup();const slots=questSlots(p);assert.equal(slots.main?.id,0);assert.equal(slots.sides.length,2);
 for(const q of [slots.main!,...slots.sides])applyInput(w,p,{seq:p.lastSeq+1,action:'quest',value:q.id},time+p.lastSeq);
 const extra=QUESTS.find(q=>q.kind==='side'&&q.minLevel===2)!;p.level=10;
 applyInput(w,p,{seq:4,action:'quest',value:extra.id},time+4);assert.equal(p.quests[extra.id],undefined);
 const first=slots.sides[0];p.quests[first.id]=first.count;
 applyInput(w,p,{seq:5,action:'quest',value:first.id},time+5);
 assert.equal(questSlots(p).sides.length,2);assert.ok(!questSlots(p).sides.some(q=>q.id===first.id));assert.ok(questSlots(p).sides.some(q=>q.id===slots.sides[1].id));
});
test('all 50 levels have two reachable side objectives and 25 linked story chapters',()=>{
 assert.equal(MAIN_QUESTS.length,25);assert.equal(QUESTS.filter(q=>q.kind==='side').length,100);
 for(let level=1;level<=50;level++){const qs=QUESTS.filter(q=>q.kind==='side'&&q.minLevel===level);assert.equal(qs.length,2);for(const q of qs){assert.ok(ZONES[q.zone!].minLevel<=level);assert.ok(ZONES[q.zone!].types.includes(q.monster));assert.ok(!isBoss(q.monster));}}
 for(const q of MAIN_QUESTS){assert.ok(q.story&&q.epilogue);assert.ok(ZONES[q.zone!].types.includes(q.monster));}
});
test('kills increment only accepted matching zone objectives',()=>{
 const {w,p}=setup(),q=questSlots(p).sides[1];p.zone=q.zone!;p.quests[q.id]=0;
 const m=w.monsters.find(m=>m.zone===p.zone&&m.type===q.monster)!;assert.ok(m);p.x=m.x;p.y=m.y;
 killMonster(w,m,p,time);assert.equal(p.quests[q.id],1);
 const other=QUESTS.find(x=>x.kind==='side'&&x.monster===q.monster&&x.zone!==q.zone)!;p.quests[other.id]=0;
 killMonster(w,m,p,time+1);assert.equal(p.quests[other.id],0);
});
test('v12 world migration preserves players and adds enemies once; new enemies have no boss attacks',()=>{
 const {w,p}=setup();w.contentVersion=3;w.monsters=w.monsters.filter(m=>m.type<10);const existing=w.monsters[0];existing.hp=10;p.gold=777;p.done=[0];
 migrateWorld(w,time);const n=w.monsters.length;migrateWorld(w,time+1);assert.equal(w.monsters.length,n);assert.equal(p.gold,777);assert.deepEqual(p.done,[0]);assert.equal(existing.hp,10);
 for(const type of [10,11,12]){const m=w.monsters.find(m=>m.type===type)!;assert.ok(m);p.zone=m.zone;p.x=m.x+100;p.y=m.y;tickWorld(w,time+2);assert.equal(m.attackUntil,undefined);}
});
