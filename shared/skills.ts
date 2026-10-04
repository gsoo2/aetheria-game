export type SkillSpec={shape:'single'|'cone'|'circle'|'line'|'target-circle'|'meteor';description:string;effect:string;radius?:number;stun?:number;burn?:number;freeze?:number;lifeSteal?:number;dash?:number;invulnerable?:number};
export const SKILL_SPECS:SkillSpec[][]=[
 [
  {shape:'cone',description:'전방을 베는 3연속 검격. 세 번째 검격은 더 강한 피해를 줍니다.',effect:'3타 콤보 · 전방 검격'},
  {shape:'cone',description:'전방의 적을 강하게 내리쳐 0.8초간 기절시킵니다. 보스는 기절에 저항합니다.',effect:'기절 · 강한 일격',stun:800},
  {shape:'circle',description:'주변의 모든 적을 베며 가한 피해의 12%만큼 생명력을 회복합니다.',effect:'원형 범위 · 흡혈',lifeSteal:.12},
  {shape:'line',description:'조준 방향으로 돌진하며 경로상의 적을 베어냅니다. 벽을 통과하지 않습니다.',effect:'돌진 · 경로 공격',dash:180}
 ],
 [
  {shape:'single',description:'조준한 적에게 빠르고 정확한 바람 화살을 날립니다.',effect:'단일 원거리'},
  {shape:'cone',description:'조준 방향의 넓은 부채꼴에 최대 5발의 화살을 발사합니다.',effect:'부채꼴 · 다중 표적'},
  {shape:'line',description:'조준 방향으로 관통 화살을 발사합니다. 일직선상의 적을 모두 공격합니다.',effect:'직선 관통'},
  {shape:'single',description:'조준 방향의 반대편으로 물러나 화살을 날립니다. 0.45초간 피해를 받지 않습니다.',effect:'후퇴 · 무적',dash:-110,invulnerable:450}
 ],
 [
  {shape:'single',description:'적 하나를 추적하는 비전 탄환을 발사합니다.',effect:'단일 원거리'},
  {shape:'target-circle',description:'조준한 적 주변에서 불꽃이 폭발합니다. 적은 3.2초간 화상 피해를 받습니다.',effect:'폭발 · 지속 화상',radius:115,burn:3200},
  {shape:'circle',description:'주변에 서리 파동을 방출해 적을 1.4초간 얼립니다. 해동 후에도 이동 속도가 느려집니다.',effect:'원형 범위 · 빙결',freeze:1400},
  {shape:'meteor',description:'조준한 위치에 0.7초 뒤 별이 떨어집니다. 넓은 폭발로 큰 피해를 주고 적을 잠시 기절시킵니다.',effect:'지정 범위 · 지연 폭발',radius:165,stun:500}
 ]
];
export const DODGE={distance:150,cooldown:3000,invulnerable:350};

SKILL_SPECS[0].push(
 {shape:'circle',effect:'흡혈 · 성역',description:'주변 적을 베고 피해의 25%를 회복합니다.',lifeSteal:.25},
 {shape:'line',effect:'긴 돌진 · 기절',description:'긴 거리를 돌진하며 경로의 적을 1초간 기절시킵니다.',dash:240,stun:1000},
 {shape:'meteor',effect:'심판 · 범위',description:'조준한 위치에 빛의 심판이 내려 적을 기절시킵니다.',radius:185,stun:1400},
 {shape:'circle',effect:'검무 · 무적',description:'넓은 원형 검무와 0.8초 무적을 얻습니다.',invulnerable:800});
SKILL_SPECS[1].push(
 {shape:'cone',effect:'폭풍 · 부채꼴',description:'전방에 강력한 폭풍 사격을 퍼붓습니다.'},
 {shape:'line',effect:'관통 · 빙결',description:'서리 화살로 직선상의 적을 얼립니다.',freeze:1600},
 {shape:'meteor',effect:'화살 폭우',description:'조준한 곳에 별빛 화살이 쏟아집니다.',radius:190},
 {shape:'circle',effect:'폭풍 · 회피',description:'주변을 폭풍으로 휩쓸고 0.8초 무적을 얻습니다.',invulnerable:800});
SKILL_SPECS[2].push(
 {shape:'circle',effect:'흡혈 · 달빛',description:'달빛 파동으로 적의 생명력을 35% 흡수합니다.',lifeSteal:.35},
 {shape:'line',effect:'빙하 · 관통',description:'관통하는 얼음 창으로 적을 2초간 얼립니다.',freeze:2000},
 {shape:'meteor',effect:'혜성 · 화상',description:'거대한 혜성을 떨어뜨려 넓은 범위에 화상을 남깁니다.',radius:210,burn:5000},
 {shape:'meteor',effect:'초신성 · 기절',description:'별의 폭발로 적을 2초간 기절시킵니다.',radius:240,stun:2000});

SKILL_SPECS[0].push({shape:'circle',effect:'태양 방벽 · 무적',description:'주변을 빛으로 정화하며 1초간 피해를 받지 않습니다.',invulnerable:1000},{shape:'meteor',effect:'광휘 · 기절',description:'조준한 위치에 성검의 빛을 내려 1.5초 기절시킵니다.',radius:180,stun:1500},{shape:'line',effect:'천상 돌격',description:'빛의 궤적을 따라 돌진하며 적을 관통합니다.',dash:260,invulnerable:500},{shape:'circle',effect:'성검 · 흡혈',description:'거대한 성검의 파동으로 주변을 베고 피해의 25%를 회복합니다.',lifeSteal:.25});
SKILL_SPECS[1].push({shape:'cone',effect:'폭풍 · 회피',description:'폭풍 사격과 함께 0.7초간 무적을 얻습니다.',invulnerable:700},{shape:'line',effect:'불사조 · 화상',description:'불사조 화살이 직선상의 적을 관통하고 4초간 불태웁니다.',burn:4000},{shape:'cone',effect:'천궁 · 다중 표적',description:'전방에 강력한 천상의 화살을 퍼붓습니다.'},{shape:'meteor',effect:'별빛 사냥 · 빙결',description:'별빛 화살비가 넓은 범위에 떨어져 적을 얼립니다.',radius:215,freeze:1800});
SKILL_SPECS[2].push({shape:'circle',effect:'달의 가호 · 흡혈',description:'달빛 파동으로 생명력을 흡수하고 0.6초간 무적을 얻습니다.',lifeSteal:.3,invulnerable:600},{shape:'meteor',effect:'은하 혜성 · 화상',description:'은하의 혜성으로 넓은 범위를 태웁니다.',radius:195,burn:4000},{shape:'circle',effect:'시간의 서리 · 빙결',description:'주변 적의 시간을 멈추듯 2.5초간 얼립니다.',freeze:2500},{shape:'meteor',effect:'우주의 탄생',description:'거대한 별의 폭발로 넓은 범위에 피해와 기절을 줍니다.',radius:245,stun:1800});
