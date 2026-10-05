import {PROMOTION_NAMES,PROMOTION_TRIALS} from '../../shared/promotion';
import type {Player} from '../../shared/types';
import {tr} from '../../shared/i18n';
export default function Promotion({player,onAction}:{player:Player;onAction:()=>void}){
 const tier=player.promotionTier||0,trial=PROMOTION_TRIALS[tier];
 if(!trial)return <section className="promotion-card"><p>{tr('최종 전직을 완료했습니다. K에서 천상의 스킬을 배워보세요.')}</p></section>;
 return <section className="promotion-card"><div><strong>{tier+1}{tr('차 전직 · ')}{tr(PROMOTION_NAMES[player.classId][tier])}</strong><span>LV. {trial.level}</span></div><h3>{tr(trial.name)}</h3><p>{tr('필요 레벨을 달성하면 버튼을 눌러 즉시 전직합니다. 몬스터 처치나 시험 보고는 필요하지 않습니다.')}</p><small>{tr('전직 보상: 새 스킬 2종, 능력치 증가, 숙련 포인트 2개 · 스킬은 K에서 습득')}</small><button className="gold-button" disabled={player.level<trial.level} onClick={onAction}>{tr(player.level<trial.level?`레벨 ${trial.level} 필요`:'즉시 전직하기')}</button></section>;
}
