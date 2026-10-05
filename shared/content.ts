export const WORLD={w:1800,h:1200,speed:210};
export const CLASSES=[
 {id:0,name:'별빛 기사',en:'KNIGHT',role:'검과 수호의 힘',description:'단단한 방어와 넓은 검격으로 전선을 지킵니다.',hp:160,mp:80,atk:22,def:7,color:'#92caff',skills:['빛의 검격','파쇄 일격','별빛 회오리','돌진 베기'],range:[135,165,220,320],power:[1,1.9,1.5,2.2],cost:[0,12,20,25],cd:[650,2500,5000,6500]},
 {id:1,name:'바람 순찰자',en:'RANGER',role:'정확하고 날렵한 사격',description:'먼 거리에서 화살을 날리고 적의 포위를 벗어납니다.',hp:120,mp:100,atk:24,def:4,color:'#9bedbc',skills:['바람 화살','다중 사격','관통 화살','회피 사격'],range:[410,380,500,360],power:[1,1.25,2.1,1.5],cost:[0,14,20,18],cd:[650,2600,4200,5000]},
 {id:2,name:'달빛 마도사',en:'MAGE',role:'원소와 별의 마법',description:'얼음과 불꽃의 마법으로 전장을 환하게 밝힙니다.',hp:95,mp:150,atk:29,def:2,color:'#d0b3ff',skills:['비전 탄환','태양 불꽃','서리 파동','별의 낙하'],range:[400,430,260,520],power:[1,1.8,1.4,2.8],cost:[0,15,22,32],cd:[750,2600,5000,7500]}
];
export type Zone={id:number;name:string;sub:string;level:string;minLevel:number;filter:string;types:number[];color:string;biome:number;mapX:number;mapY:number;music:number;raid?:boolean;safe?:boolean;art?:string};
const regions=[
 ['별샘 마을','별의 심장이 잠든 마지막 안식처',1,0,0],
 ['이슬빛 초원','마을의 봉인을 지키는 작은 생명들',1,0,1],
 ['속삭이는 숲','나무에 새겨진 별의 기억',3,0,2],
 ['잊힌 유적','첫 번째 별조각이 잠든 유적',5,0,4],
 ['월식의 성소','월식의 군주가 기다리는 곳',7,0,7],
 ['바람꽃 들판','동쪽 별길의 첫 이정표',8,0,1],
 ['푸른 안개 숲','안개 속 정령의 흔적',10,0,2],
 ['은빛 늑대 협곡','길을 잃은 순찰자의 길',12,0,4],
 ['수정 샘터','봉인의 빛이 솟아나는 샘',14,0,5],
 ['고목의 정원','검은 뿌리가 삼킨 별조각',16,0,2],
 ['서리문 고개','북방의 닫힌 문',18,1,5],
 ['눈꽃 평원','새하얀 별의 흔적',20,1,5],
 ['빙결 호수','얼음 아래 봉인된 기록',22,1,5],
 ['백야의 숲','잠들지 않는 망령의 숲',24,1,6],
 ['얼음 왕관 유적','두 번째 별조각의 수호자',26,1,6],
 ['잿빛 경계','불의 대륙으로 향하는 길',28,2,4],
 ['불씨 협곡','붉은 바람과 타오르는 암석',30,2,6],
 ['유황 황야','고대 화로의 숨결',32,2,6],
 ['붉은 사막','모래 속에 묻힌 왕국',34,2,6],
 ['용광로 성채','세 번째 별조각을 품은 성채',36,2,7],
 ['황혼의 길','별길이 끝나는 황혼',38,0,4],
 ['별의 무덤','잊힌 수호자들의 이름',40,1,7],
 ['공허의 회랑','세 별조각이 여는 회랑',43,2,7],
 ['검은 달 제단','봉인의 마지막 시험',46,2,7],
 ['에테리아의 심장','새로운 새벽을 되찾는 최종 성소',49,1,7]
] as const;
export const ZONES:Zone[]=regions.map(([name,sub,minLevel,biome,music],id)=>({id,name,sub,minLevel,biome,music,level:id===0?'SAFE':`LV. ${minLevel}+`,filter:id===0?'none':biome===1?'saturate(.85)':biome===2?'saturate(1.08)':`hue-rotate(${id*7%30}deg) brightness(${id===4?.58:id%3===0?.8:1})`,types:id===0?[]:id===1?[0,0,1,2,3]:id===2?[3,4,7,8]:id===3?[4,5,6,8]:id>=4?[5,6,7,8,9]:[0,1,2],color:biome===1?'#b8e4ff':biome===2?'#f6b282':'#a9dfbd',mapX:12+(id%5)*18,mapY:12+Math.floor(id/5)*18}));
export const portalsFor=(zone:number)=>{
 if(ZONES[zone]?.raid)return [{x:900,y:925,name:'별샘 마을로',next:0,target:0}];
 const exits=zone===28?[{x:1450,y:680,name:'눈꽃 평원',next:1,target:11},{x:350,y:680,name:'별샘 마을',next:-1,target:0}]:zone===29?[{x:1450,y:680,name:'불씨 협곡',next:1,target:16},{x:350,y:680,name:'별샘 마을',next:-1,target:0}]:[
 ...(zone<24?[{x:1530,y:680,name:ZONES[zone+1].name,next:1,target:zone+1}]:[]),
 ...(zone>0?[{x:270,y:680,name:ZONES[zone-1].name,next:-1,target:zone-1}]:[]),
 ...(zone===11?[{x:1100,y:925,name:'설원 광장',next:0,target:28}]:zone===16?[{x:1100,y:925,name:'불씨 광장',next:0,target:29}]:[])
 ];
 return [...exits,{x:900,y:925,name:'별길 이동 구슬',next:0,target:-1}];
};
export const zoneScale=(zone:number)=>1+Math.max(0,ZONES[zone].minLevel-7)*.16;
export const isBoss=(type:number)=>type===8||type===9;
export const MONSTERS=[
 {name:'이슬 슬라임',sprite:4,hp:48,atk:5,xp:22,gold:9,speed:58},
 {name:'물방울 슬라임',sprite:5,hp:65,atk:7,xp:28,gold:12,speed:65},
 {name:'숲 버섯',sprite:6,hp:85,atk:8,xp:35,gold:14,speed:52},
 {name:'은빛 늑대',sprite:7,hp:100,atk:12,xp:45,gold:18,speed:110},
 {name:'이끼 고블린',sprite:8,hp:145,atk:15,xp:65,gold:25,speed:85},
 {name:'달의 망령',sprite:9,hp:190,atk:20,xp:85,gold:32,speed:70},
 {name:'고대 골렘',sprite:10,hp:280,atk:25,xp:110,gold:45,speed:45},
 {name:'그늘 박쥐',sprite:11,hp:120,atk:16,xp:60,gold:23,speed:125},
 {name:'붉은 파수꾼',sprite:12,hp:480,atk:30,xp:210,gold:90,speed:55},
 {name:'월식의 군주',sprite:13,hp:1800,atk:42,xp:700,gold:350,speed:48},
 {name:'이끼 갑충',sprite:22,hp:95,atk:9,xp:38,gold:15,speed:65},
 {name:'서리 정령',sprite:23,hp:160,atk:18,xp:75,gold:28,speed:80},
 {name:'불씨 여우',sprite:24,hp:155,atk:17,xp:72,gold:27,speed:118},
 {name:'꽃잎 버섯',sprite:25,hp:90,atk:9,xp:40,gold:16,speed:55},
 {name:'수정 게',sprite:26,hp:200,atk:20,xp:95,gold:35,speed:62},
 {name:'눈구름 토끼',sprite:27,hp:135,atk:14,xp:68,gold:25,speed:110},
 {name:'용암 달팽이',sprite:28,hp:240,atk:23,xp:105,gold:42,speed:42},
 {name:'별빛 해파리',sprite:29,hp:180,atk:19,xp:90,gold:33,speed:78},
 {name:'가시 선인장',sprite:30,hp:210,atk:22,xp:98,gold:38,speed:48},
 {name:'보석 왕 슬라임',sprite:31,hp:125,atk:12,xp:68,gold:28,speed:62},
 {name:'달빛 늑대',sprite:32,hp:210,atk:19,xp:112,gold:43,speed:100},
 {name:'구름 그리핀',sprite:33,hp:225,atk:21,xp:125,gold:48,speed:90},
 {name:'불씨 멧돼지',sprite:34,hp:260,atk:24,xp:145,gold:56,speed:78}
];
export type Item={id:number;name:string;slot:'weapon'|'armor'|'ring';atk:number;def:number;hp:number;rarity:number;price:number;minLevel?:number;classId?:number;gmOnly?:boolean;cashOnly?:boolean};
export const ITEMS:Item[]=Array.from({length:21},(_,i)=>({id:i,name:[['여행자의 검','바람의 활','새벽의 지팡이','가죽 갑옷','별조각 반지','은빛 장검','숲의 장궁'],['빛을 품은 검','질풍의 활','달빛 지팡이','수호자의 갑옷','이슬빛 반지','유적의 검','정령의 활'],['월식의 성검','별자리 활','심연의 지팡이','천상의 갑옷','영원의 반지','파수꾼의 검','달의 활']][Math.floor(i/7)][i%7],slot:i%7===3?'armor':i%7===4?'ring':'weapon',atk:i%7===3?0:3+Math.floor(i/7)*8,def:i%7===3?4+Math.floor(i/7)*5:i%7===4?2:0,hp:i%7===3?15+Math.floor(i/7)*20:0,rarity:Math.floor(i/7),price:40+Math.floor(i/7)*110}));
// Appended IDs preserve all old inventories and stored equipment.
for(let tier=0;tier<3;tier++){const level=[8,18,30][tier],prefix=['별철','오로라','불사조'][tier],rarity=tier+1;for(let kind=0;kind<6;kind++){const slot=kind<3?'weapon':kind===3?'armor':'ring';ITEMS.push({id:ITEMS.length,name:prefix+' '+['장검','장궁','마법봉','흉갑','수호 반지','집중 반지'][kind],slot,classId:kind<3?kind:undefined,minLevel:level,atk:kind<3?9+tier*9:kind===5?5+tier*5:0,def:kind===3?7+tier*6:kind===4?4+tier*3:0,hp:kind===3?35+tier*30:kind===4?20+tier*20:0,rarity,price:250+tier*650+(kind===3?100:0)});}}
// GM-only IDs are appended; never included in normal drops, recipes or shop products.
for(const [kind,name] of ['별빛 토끼 검','고양이 발바닥 활','구름 사탕 지팡이','말랑 구름 갑옷','꼬마 별 반지'].entries()) ITEMS.push({id:ITEMS.length,name,slot:kind<3?'weapon':kind===3?'armor':'ring',classId:kind<3?kind:undefined,atk:kind<3?35:0,def:kind===3?25:kind===4?8:0,hp:kind===3?120:kind===4?50:0,rarity:2,price:0,gmOnly:true});
for(let classId=0;classId<3;classId++)ITEMS.push({id:ITEMS.length,name:['천공 수정 검','정령 깃털 활','은하 별 지팡이'][classId],slot:'weapon',classId,minLevel:15,atk:24,def:0,hp:15,rarity:2,price:0,cashOnly:true});
for(const zone of ZONES){if(zone.id===0||zone.safe||zone.raid)continue;const types=zone.biome===1?[20,21]:zone.biome===2?[22]:zone.id===1?[19]:[19,20];for(const type of types)if(!zone.types.includes(type))zone.types.push(type);}
export type Quest={id:number;name:string;description:string;monster:number;count:number;xp:number;gold:number;zone?:number;minLevel?:number;kind?:'main'|'side';story?:string;epilogue?:string;chapter?:string;previous?:number};
export const QUESTS:Quest[]=[
 {id:0,name:'초원의 작은 소동',description:'이슬빛 초원에서 이슬 슬라임 5마리를 처치하세요.',monster:0,count:5,xp:90,gold:65},
 {id:1,name:'버섯의 숲',description:'숲 버섯 4마리를 처치하세요.',monster:2,count:4,xp:130,gold:90},
 {id:2,name:'숲길의 수호자',description:'이끼 고블린 4마리를 처치하세요.',monster:4,count:4,xp:220,gold:140},
 {id:3,name:'붉은 돌의 비밀',description:'붉은 파수꾼을 1마리 처치하세요.',monster:8,count:1,xp:320,gold:220},
 {id:4,name:'월식을 넘어',description:'월식의 군주를 처치하고 마을에 돌아오세요.',monster:9,count:1,xp:900,gold:600}
];
export type Npc={id:number;name:string;role:string;sprite:number;x:number;y:number;zone:number;service:string};
export const NPCS:Npc[]=[
 {id:0,name:'세라 · 별샘의 안내자',role:'퀘스트',sprite:3,x:830,y:560,zone:0,service:'quest'},
 {id:1,name:'로엔 · 여행 상인',role:'상점',sprite:14,x:1030,y:600,zone:0,service:'shop'},
 {id:2,name:'엘린 · 치유사',role:'회복',sprite:15,x:730,y:710,zone:0,service:'heal'},
 {id:3,name:'브란 · 별철 대장장이',role:'장비 강화',sprite:16,x:560,y:475,zone:0,service:'forge'},
 {id:4,name:'미아 · 달빛 연금술사',role:'연금 · 제작',sprite:17,x:1120,y:780,zone:0,service:'alchemy'},
 {id:5,name:'도린 · 재료 연구가',role:'재료 · 분해',sprite:18,x:1290,y:660,zone:0,service:'materials'},
 {id:6,name:'카일 · 창고지기',role:'개인 창고',sprite:19,x:580,y:790,zone:0,service:'storage'},
 {id:7,name:'루미 · 펫 관리인',role:'펫 관리',sprite:20,x:1230,y:475,zone:0,service:'pets'},
 {id:8,name:'아리아 · 광장 안내원',role:'마을 안내',sprite:21,x:990,y:415,zone:0,service:'guide'},
 {id:9,name:'브란 · 수정 야영지',role:'장비 강화',sprite:16,x:900,y:880,zone:8,service:'forge'},
 {id:10,name:'미아 · 눈꽃 쉼터',role:'연금 · 제작',sprite:17,x:900,y:880,zone:11,service:'alchemy'},
 {id:11,name:'도린 · 불씨 교역소',role:'재료 · 분해',sprite:18,x:900,y:880,zone:16,service:'materials'}
];

export const PORTALS=[{x:1530,y:680,name:'다음 지역',next:1},{x:270,y:680,name:'이전 지역',next:-1}];
export const BLOCKS=[{x:80,y:0,w:1640,h:110},{x:0,y:0,w:160,h:1200},{x:1640,y:0,w:160,h:1200},{x:0,y:1040,w:1800,h:160},{x:1080,y:215,w:250,h:140}];

const biomeBlocks=[[...BLOCKS,{x:300,y:255,w:90,h:65},{x:1370,y:330,w:80,h:95},{x:290,y:850,w:80,h:95}],[{x:0,y:0,w:1800,h:180},{x:0,y:0,w:230,h:1200},{x:1570,y:0,w:230,h:1200},{x:0,y:1010,w:1800,h:190}],[{x:0,y:0,w:1800,h:180},{x:0,y:0,w:230,h:1200},{x:1570,y:0,w:230,h:1200},{x:0,y:1010,w:1800,h:190}]];
export const blocksFor=(zone=0)=>ZONES[zone]?.raid||zone===28||zone===29?[]:biomeBlocks[ZONES[zone]?.biome||0];

const advanced=[
 {skills:['빛의 성역','유성 돌격','수호자의 심판','천상의 검무'],range:[260,400,500,360],power:[2,2.7,3.5,4.5],cost:[28,32,40,50],cd:[8500,10000,13000,18000]},
 {skills:['폭풍의 깃','서리 화살','별빛 폭우','폭풍의 심장'],range:[460,540,550,600],power:[2,2.5,3.4,4.4],cost:[25,30,40,48],cd:[8000,10000,13500,18000]},
 {skills:['생명의 달','빙하의 창','혜성 충돌','초신성'],range:[280,580,580,550],power:[1.8,2.8,3.6,4.8],cost:[28,35,45,55],cd:[8500,10000,14000,18000]}
];
CLASSES.forEach((c,i)=>{c.skills.push(...advanced[i].skills);c.range.push(...advanced[i].range);c.power.push(...advanced[i].power);c.cost.push(...advanced[i].cost);c.cd.push(...advanced[i].cd);});
const promoted=[
 {skills:['태양 방벽','광휘의 심판','천상의 돌격','성검의 새벽'],range:[280,480,460,500],power:[2.2,2.9,3.8,4.8],cost:[30,35,45,55],cd:[10000,11000,13000,19000]},
 {skills:['폭풍 날개','불사조 화살','천궁의 연사','별빛 사냥'],range:[440,600,620,580],power:[2.3,3,3.6,4.8],cost:[28,34,43,52],cd:[9500,11000,12500,18000]},
 {skills:['달의 가호','은하 혜성','시간의 서리','우주의 탄생'],range:[300,600,340,650],power:[2.1,3.2,3.8,5],cost:[30,38,48,60],cd:[10000,11500,13500,20000]}
];
CLASSES.forEach((c,i)=>{c.skills.push(...promoted[i].skills);c.range.push(...promoted[i].range);c.power.push(...promoted[i].power);c.cost.push(...promoted[i].cost);c.cd.push(...promoted[i].cd);});
export const SKILL_LEVELS=[1,1,1,1,5,10,20,35,10,10,30,30];
export const skillAvailable=(p:{level:number;promotionTier?:number},i:number)=>p.level>=SKILL_LEVELS[i]&&(i<8||(p.promotionTier||0)>=(i<10?1:2));
export const skillUnlocked=(p:{level:number;promotionTier?:number;skillRanks?:number[]},i:number)=>i<4||(skillAvailable(p,i)&&(p.skillRanks?.[i]||0)>0);
export const loadoutFor=(p:{loadout?:number[]})=>p.loadout||[0,1,2,3];

ZONES.slice(5).forEach(z=>QUESTS.push({id:QUESTS.length,name:`${z.name}의 별빛`,description:`${z.name}에서 ${MONSTERS[z.id%5===4?9:8].name} ${z.id%5===4?1:3}마리를 처치하고 세라에게 돌아가세요.`,monster:z.id%5===4?9:8,count:z.id%5===4?1:3,xp:Math.round(70*z.minLevel**1.45*.55),gold:100+z.minLevel*35,zone:z.id,minLevel:z.minLevel}));
// Foot collision follows the clear ground inside each painted scene (source image 1536×1024).
const groundContours=[
 [[225,340],[260,280],[310,230],[480,160],[655,140],[830,145],[940,220],[1060,220],[1095,315],[1190,380],[1290,410],[1285,500],[1360,560],[1380,650],[1280,740],[1180,805],[1040,835],[930,860],[830,810],[735,820],[615,835],[520,810],[475,780],[365,745],[315,655],[245,600],[195,490]],
 [[180,290],[390,220],[660,185],[930,190],[1180,230],[1340,270],[1480,390],[1490,580],[1450,750],[1290,840],[1160,850],[1000,930],[750,945],[640,880],[420,850],[250,760],[175,580]],
 [[180,270],[420,185],[650,190],[900,170],[1130,210],[1370,300],[1460,420],[1490,600],[1410,750],[1220,840],[1000,900],[760,935],[510,890],[335,800],[200,675],[155,490]]
];
const grounds=groundContours.map(points=>points.map(([x,y])=>({x:x*1800/1536,y:y*1200/1024})));
export const groundFor=(zone=0)=>ZONES[zone]?.raid||zone===28||zone===29?[[340,330],[650,215],[1000,215],[1420,330],[1550,500],[1510,780],[1280,950],[1050,1000],[750,1000],[490,940],[275,760],[235,520]].map(([x,y])=>({x,y})):grounds[ZONES[zone]?.biome||0];

const atlasLocations=[[18,61],[23,67],[20,48],[30,54],[36,45],[31,71],[28,39],[36,63],[41,54],[40,32],[43,24],[52,16],[60,22],[55,32],[66,14],[70,40],[76,51],[84,37],[87,57],[79,67],[51,65],[48,78],[61,77],[60,88],[49,90]];
ZONES.forEach((z,i)=>{z.mapX=atlasLocations[i][0];z.mapY=atlasLocations[i][1];});

import {RAIDS} from './social';
for(const r of RAIDS){ZONES.push({id:r.zone,name:r.name+'의 성소',sub:'협력 보스 레이드 · 경고 범위를 피하고 함께 싸우세요',level:'LV. '+r.level+'+',minLevel:r.level,filter:r.zone===25?'none':r.zone===26?'hue-rotate(35deg)':'hue-rotate(300deg)',types:[9],color:'#eed2a1',biome:0,mapX:50,mapY:50,music:7,raid:true});}

ZONES[0].safe=true;
ZONES.push(
 {id:28,name:'오로라 설원 광장',sub:'눈꽃 연합의 교역과 휴식의 안식처',level:'SAFE · LV18+',minLevel:18,filter:'none',types:[],color:'#bae6ff',biome:1,mapX:46,mapY:11,music:8,safe:true,art:'/art/winter-plaza.png'},
 {id:29,name:'불씨 교역 광장',sub:'붉은 대륙의 장인들이 모이는 안전한 교역소',level:'SAFE · LV28+',minLevel:28,filter:'none',types:[],color:'#ffc292',biome:2,mapX:91,mapY:43,music:10,safe:true,art:'/art/ember-plaza.png'}
);
for(const zone of [28,29])for(const n of NPCS.slice(0,9))NPCS.push({...n,id:NPCS.length,zone,name:n.name.replace('별샘의 안내자',zone===28?'설원의 안내자':'불씨의 안내자')});
for(const zone of [10,11,14,21])ZONES[zone].music=8;
for(const zone of [12,13,24])ZONES[zone].music=9;
for(const zone of [15,16,18])ZONES[zone].music=10;
for(const zone of [17,19,22,23])ZONES[zone].music=11;

// v13: biome-native enemies, with stable old monster / quest IDs.
for(const z of ZONES){if(z.safe||z.raid||z.id===0)continue;z.types.push(z.biome===1?11:z.biome===2?12:10);}
for(const z of ZONES){if(z.safe||z.raid||z.id===0)continue;z.types.push(...(z.biome===1?[15,17]:z.biome===2?[16,18]:[13,14]));}
if(!ZONES[2].types.includes(2))ZONES[2].types.push(2);

import {CHAPTER_STORIES} from './quest-story';
const mainZones=[1,2,3,3,4];
QUESTS.forEach((q,i)=>{const zone=i<5?mainZones[i]:q.zone!;const [name,story,epilogue]=CHAPTER_STORIES[i];q.kind='main';q.name=name;q.story=story;q.epilogue=epilogue;q.chapter=i<5?'별샘의 부름':i<10?'초록 별길':i<15?'백야의 기억':i<20?'불꽃의 약속':'새벽의 수호자';q.zone=zone;q.minLevel=ZONES[zone].minLevel;q.previous=i?i-1:undefined;q.description=`${ZONES[zone].name} · ${MONSTERS[q.monster].name} ${q.count}마리 처치`;});
export const MAIN_QUESTS=QUESTS.slice();
// Two finite, non-repeatable assignments per level. Unfinished lower-level assignments stay available.
for(let level=1;level<=50;level++){
 const zone=ZONES.filter(z=>!z.safe&&!z.raid&&z.id>0&&z.minLevel<=level).at(-1)!;
 const ordinary=Array.from(new Set(zone.types)).filter(t=>!isBoss(t));
 for(let slot=0;slot<2;slot++){
  const monster=slot===1?(zone.biome===1?11:zone.biome===2?12:10):ordinary[(level-1)%ordinary.length];
  const count=slot===0?4:3;
  QUESTS.push({id:QUESTS.length,kind:'side',name:`${slot===0?'순찰 의뢰':'생태 조사'} · ${zone.name}`,minLevel:level,zone:zone.id,monster,count,xp:Math.round(180*level**1.6*(slot===0?.16:.12)),gold:30+level*12,
   story:slot===0?`LV. ${level} · 카일의 의뢰. ${zone.name}의 여행자들이 ${MONSTERS[monster].name} 때문에 발길을 돌리고 있어요. 안전한 길을 확보해 주세요.`:`LV. ${level} · 도린의 의뢰. ${MONSTERS[monster].name}에게 스며든 별빛을 조사하려 합니다. 주변 생태가 회복될 수 있도록 도와주세요.`,
   description:`${zone.name} · ${MONSTERS[monster].name} ${count}마리 처치`,epilogue:slot===0?'카일이 안전해진 길에 이정표를 세웠습니다. 여행자들이 다시 길을 나섭니다.':'도린이 조사 기록을 완성했습니다. 되찾은 별빛이 주변 생명들에게 돌아갑니다.'});
 }
}
