export const MATERIALS=['별철 조각','정령 가루','빛잎 약초'] as const;
export const RECIPES=[
 {name:'생명 물약 ×5',gold:25,cost:[0,0,3],kind:'hp'},
 {name:'마나 물약 ×5',gold:25,cost:[0,2,2],kind:'mp'},
 {name:'별철 정련 ×3',gold:35,cost:[0,3,0],kind:'ore'},
 {name:'직업별 희귀 무기',gold:180,cost:[12,8,0],kind:'weapon'}
] as const;
