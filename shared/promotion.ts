import type {Player} from './types';
export const PROMOTION_NAMES=[['태양의 수호기사','천상의 성기사'],['폭풍의 추적자','천궁의 순찰자'],['달의 현자','별자리 대마도사']];
export const PROMOTION_TRIALS=[
 {tier:1,level:20,name:'첫 번째 별의 맹세',zone:2,monster:4,count:10,bossZone:3,boss:8,bossCount:1,story:'별빛은 힘만으로 깨어나지 않아요. 숲길의 고블린을 물리치고 유적의 붉은 파수꾼을 넘어, 수호자의 맹세를 증명해 주세요.'},
 {tier:2,level:30,name:'천상의 별을 계승하다',zone:16,monster:6,count:15,bossZone:16,boss:8,bossCount:2,story:'불씨 협곡의 고대 골렘과 붉은 파수꾼을 넘어야 마지막 별의 힘을 이어받을 수 있어요. 천상의 길은 준비된 수호자에게만 열리지요.'}
];
export const classNameFor=(p:Pick<Player,'classId'|'promotionTier'>,base:string)=>p.promotionTier?PROMOTION_NAMES[p.classId][p.promotionTier-1]:base;
