import type {Player,TutorialState} from './types';
export const tutorialKills=(p:Player)=>Object.values(p.kills).reduce((n,k)=>n+k,0);
export const tutorialState=(p:Player):TutorialState=>({stage:0,moved:0,usedSkill:false,killStart:tutorialKills(p),completed:false});
export function tutorialReady(p:Player){const t=p.tutorial;if(!t||t.completed)return false;switch(t.stage){case 0:return true;case 1:return t.moved>=120;case 2:return t.usedSkill;case 3:return Object.keys(p.quests).length>0||p.done.length>0;case 4:return tutorialKills(p)-t.killStart>=3;case 5:return p.level>=2;case 6:return true;default:return false;}}
export const TUTORIAL_STEPS=[
 {title:'별빛이 부른 수호자',text:'저는 별샘의 안내자 세라예요. 숲에서 별빛이 사라지고 있어요. 작은 한 걸음부터 함께 배워 볼까요?',goal:'튜토리얼을 마치면 별빛 여우가 모험에 함께해요.'},
 {title:'첫 번째 걸음',text:'PC에서는 WASD 또는 방향키로, 모바일에서는 왼쪽 조이스틱으로 이동해 보세요.',goal:'아무 방향으로 120만큼 이동하기'},
 {title:'별의 힘을 사용해요',text:'초원으로 이동한 뒤 몬스터를 향해 하단 스킬을 누르세요. PC에서는 1~4 키도 사용할 수 있어요. 첫 스킬은 마나를 쓰지 않아요.',goal:'사냥터에서 스킬 1회 사용하기'},
 {title:'첫 임무를 받아요',text:'퀘스트 카드 한 번이면 수락돼요. 목표를 채운 뒤 카드를 다시 누르면 보상을 받아요.',goal:'퀘스트 1개 수락하기'},
 {title:'숲의 빛을 되찾아요',text:'초원의 몬스터 3마리를 물리쳐 주세요. 체력이 줄면 생명 물약을 누르고, 바닥 전리품은 Z 또는 줍기로 모으세요.',goal:'몬스터 3마리 처치하기'},
 {title:'더 강한 수호자로',text:'처치와 퀘스트 보상으로 경험치를 얻어요. 막대를 채우면 레벨과 기본 능력이 오릅니다. 레벨 20까지는 강화 없이도 성장할 수 있어요.',goal:'레벨 2 이상 달성하기'},
 {title:'새로운 동행',text:'잘 해냈어요! 별빛 여우를 선물할게요. 가까운 전리품을 자동으로 주워 줄 거예요. 레벨 20에 1차 전직을 마치면 본격적인 모험이 시작돼요.',goal:'별빛 여우 받기 · 서버에 영구 저장'}
];
