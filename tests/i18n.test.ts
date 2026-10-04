import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {translateText as translate,setLanguage,getLanguage,restoreLanguage,subscribeLanguage} from '../shared/i18n';
import {TRANSLATIONS} from '../shared/translation-data';
import {CLASSES,ITEMS,MONSTERS,NPCS,QUESTS,ZONES,MAIN_QUESTS} from '../shared/content';
import {SKILL_SPECS} from '../shared/skills';
import {PROMOTION_TRIALS} from '../shared/promotion';
import {PETS} from '../shared/pets';
import {newPlayer} from '../server/engine';
import {QuestJournal,QuestTracker,QuestReward} from '../components/game/QuestJournal';

test('every authored translation and generated quest has English and Japanese coverage',()=>{
 for(const lang of ['en','ja'] as const){
  for(const key of Object.keys(TRANSLATIONS))assert.doesNotMatch(translate(key,lang),/[가-힣]/,key);
  const records=[...QUESTS,...ZONES,...MONSTERS,...ITEMS,...CLASSES,...NPCS,...SKILL_SPECS.flat(),...PROMOTION_TRIALS,...PETS];
  for(const record of records)for(const key of ['name','sub','story','description','epilogue','chapter','role','effect']){
   const value=(record as unknown as Record<string,unknown>)[key];if(typeof value==='string')assert.doesNotMatch(translate(value,lang),/[가-힣]/,value);
  }
 }
});
test('multiword monster names remain intact and translated numeric values keep their meaning',()=>{
 assert.equal(translate('이슬빛 초원 · 물방울 슬라임 4마리 처치','en'),'Dewlight Meadow · Defeat 4 Droplet Slime');
 assert.equal(translate('서리문 고개 · 서리 정령 3마리 처치','ja'),'霜門の峠 · 霜の精霊を3体討伐');
 assert.equal(translate('레벨 10부터 시작할 수 있습니다.','en'),'Available from level 10.');
 assert.equal(translate('퀘스트 완료! 65 골드 · 90 경험치 획득','ja'),'クエスト完了！65ゴールド · 90経験値を獲得');
 assert.equal(translate('퀘스트','ko'),'퀘스트');
});
test('rendered quests and rewards switch language without changing player data',()=>{
 const p=newPlayer('language-test','수호자',0,1800000000000);p.quests[0]=QUESTS[0].count;p.lastQuestReward={id:0,time:1800000000000,gold:65,xp:90};
 const original=JSON.stringify(p);
 for(const language of ['en','ja'] as const){setLanguage(language);
  for(const element of [createElement(QuestTracker,{p,onAction:()=>{},onJournal:()=>{}}),createElement(QuestJournal,{p,onAction:()=>{}}),createElement(QuestReward,{p,onDismiss:()=>{}})])assert.doesNotMatch(renderToStaticMarkup(element),/[가-힣]/);
  assert.equal(JSON.stringify(p),original);
 }
 p.done=MAIN_QUESTS.map(q=>q.id);assert.doesNotMatch(renderToStaticMarkup(createElement(QuestJournal,{p,onAction:()=>{}})),/[가-힣]/);setLanguage('ko');
});
test('language preference survives reload and updates document language and subscribers',()=>{
 const originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const values=new Map<string,string>(),doc={documentElement:{lang:'ko'}};
 Object.defineProperty(globalThis,'document',{configurable:true,value:doc});Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key),setItem:(key:string,value:string)=>values.set(key,value)}});
 let updates=0;const stop=subscribeLanguage(()=>updates++);
 try{setLanguage('ja');assert.equal(doc.documentElement.lang,'ja');assert.equal(values.get('aetheria-language'),'ja');values.set('aetheria-language','en');restoreLanguage();assert.equal(getLanguage(),'en');assert.equal(doc.documentElement.lang,'en');assert.equal(updates,2);stop();setLanguage('ko');assert.equal(updates,2);}finally{stop();if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else Reflect.deleteProperty(globalThis,'document');if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else Reflect.deleteProperty(globalThis,'localStorage');setLanguage('ko');}
});
