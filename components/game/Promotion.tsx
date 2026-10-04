import { tr } from '../../shared/i18n';
import { Sparkles, ScrollText } from 'lucide-react';
import { PROMOTION_NAMES, PROMOTION_TRIALS } from '../../shared/promotion';
import { ZONES, MONSTERS } from '../../shared/content';
import type { Player } from '../../shared/types';
export default function Promotion({ player, onAction }: {
    player: Player;
    onAction: () => void;
}) {
    const tier = player.promotionTier || 0, trial = PROMOTION_TRIALS[tier], q = player.promotionQuest;
    if (!trial)
        return <section className="promotion-card"><Sparkles /><strong>{tr(PROMOTION_NAMES[player.classId][1])}</strong><p>{tr("최종 전직을 완료했습니다. K에서 천상의 스킬을 배워보세요.")}</p></section>;
    const ready = !!q && q.kills >= trial.count && q.bosses >= trial.bossCount;
    return <section className="promotion-card"><div><ScrollText size={19}/><strong>{tier + 1}{tr("차 전직 · ")}{tr(PROMOTION_NAMES[player.classId][tier])}</strong><span>LV. {trial.level}</span></div><h3>{tr(trial.name)}</h3><p>{tr(trial.story)}</p><ul><li>{tr(ZONES[trial.zone].name)} · {tr(MONSTERS[trial.monster].name)} <b>{q?.kills || 0} / {trial.count}</b></li><li>{tr(ZONES[trial.bossZone].name)} · {tr(MONSTERS[trial.boss].name)} <b>{q?.bosses || 0} / {trial.bossCount}</b></li></ul><small>{tr("전직 보상: 새 스킬 2종, 능력치 증가, 숙련 포인트 2개 · 스킬은 K에서 습득")}</small><button className={ready ? 'gold-button' : 'outline-button'} disabled={player.level < trial.level || !!q && !ready} onClick={onAction}>{tr(player.level < trial.level ? `레벨 ${trial.level} 필요` : ready ? '시험 보고 · 전직하기' : q ? '시험 진행 중' : '세라의 시험 수락')}</button></section>;
}
