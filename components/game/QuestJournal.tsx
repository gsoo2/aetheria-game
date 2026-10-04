'use client';
import { tr } from '../../shared/i18n';
import { useEffect, useId, useState } from 'react';
import { PROMOTION_TRIALS } from '../../shared/promotion';
import { QUESTS, MONSTERS, MAIN_QUESTS } from '../../shared/content';
import type { Quest } from '../../shared/content';
import type { Player } from '../../shared/types';
import { questSlots, questKind, questAvailable } from '../../shared/quests';
import { ScrollText, ChevronRight, ChevronDown, Check, Gift, X } from 'lucide-react';
function QuestCard({ q, p, onAction, compact = false }: {
    q: Quest;
    p: Player;
    onAction: (id: number) => void;
    compact?: boolean;
}) {
    const active = p.quests[q.id] !== undefined, progress = p.quests[q.id] || 0, ready = active && progress >= q.count, locked = !questAvailable(p, q);
    const action = locked ? `LV. ${q.minLevel} 필요` : ready ? '보상 받기' : active ? '사냥터로 이동' : '클릭하여 수락';
    return <article className={`quest-card ${questKind(q)} ${ready ? 'ready' : ''} ${locked ? 'locked' : ''}`}>
  <div className="quest-card-label"><span>{tr(questKind(q) === 'main' ? '메인 이야기' : '서브 의뢰')} · LV. {q.minLevel}</span>{ready ? <Gift size={14}/> : active ? <span className="quest-status">{tr("진행 중")}</span> : null}</div>
  <button className="quest-card-action" onClick={() => onAction(q.id)} disabled={locked} title={tr(q.story)}>
   <strong>{tr(q.name)}</strong>
   {!compact && <p className="quest-story-copy">{tr(q.story)}</p>}
   <span className="quest-objective">{tr(MONSTERS[q.monster].name + ' 처치')} <b>{progress} / {q.count}</b></span>
   <span className="quest-progress" role="progressbar" aria-label={tr(q.name + ' 진행도')} aria-valuemin={0} aria-valuemax={q.count} aria-valuenow={progress}><i style={{ width: Math.min(100, progress / q.count * 100) + '%' }}/></span>
   <span className="quest-card-footer"><small>{tr(q.gold.toLocaleString())} G · {tr(q.xp.toLocaleString())} EXP</small><em>{tr(action)} <ChevronRight size={13}/></em></span>
  </button>
 </article>;
}
export function QuestTracker({ p, onAction, onJournal }: {
    p: Player;
    onAction: (id: number) => void;
    onJournal: () => void;
}) {
    const { main, sides } = questSlots(p);
    const [expanded, setExpanded] = useState(false), contentId = useId();
    const preferenceKey = () => 'aetheria-quests-' + (window.matchMedia('(max-width:900px), (max-height:540px) and (pointer:coarse)').matches ? 'mobile' : 'desktop');
    useEffect(() => {
        const media = window.matchMedia('(max-width:900px), (max-height:540px) and (pointer:coarse)');
        const restore = () => { let saved: string | null = null; try { saved = localStorage.getItem(preferenceKey()); } catch {} setExpanded(saved === null ? !media.matches : saved === 'open'); };
        restore(); media.addEventListener('change', restore); return () => media.removeEventListener('change', restore);
    }, []);
    const changeExpanded = (open: boolean) => { setExpanded(open); try { localStorage.setItem(preferenceKey(), open ? 'open' : 'closed'); } catch {} };
    const readyCount = [...(main ? [main] : []), ...sides].filter(q => p.quests[q.id] !== undefined && p.quests[q.id] >= q.count).length;
    return <aside className={`quest-tracker glass ${expanded ? 'is-expanded' : ''}`} aria-label={tr("퀘스트")}>
  <button className="quest-tracker-toggle" aria-expanded={expanded} aria-controls={contentId} aria-label={tr(expanded ? '퀘스트 접기' : '퀘스트 펼치기')} onClick={() => changeExpanded(!expanded)}><ScrollText size={15}/><span>{tr("퀘스트")}</span>{readyCount > 0 && <span className="quest-ready-count"><Gift size={12}/>{readyCount}</span>}<ChevronDown className="quest-toggle-chevron" size={15}/></button>
  <div className="quest-tracker-content" id={contentId} hidden={!expanded}><div className="quest-tracker-title"><ScrollText size={16}/><span>{tr("별빛의 여정")}</span><button aria-label={tr("퀘스트 이야기 보기")} onClick={onJournal}><ChevronRight size={16}/></button><button className="quest-tracker-close" aria-label={tr("퀘스트 접기")} onClick={() => changeExpanded(false)}><X size={16}/></button></div>
  {p.promotionQuest && <div className="promotion-tracker tracked-quest"><strong>{p.promotionQuest.tier}{tr("차 전직 시험")}</strong><span>{tr("일반 ")}{p.promotionQuest.kills}/{PROMOTION_TRIALS[p.promotionQuest.tier - 1].count}{tr(" · 파수꾼 ")}{p.promotionQuest.bosses}/{PROMOTION_TRIALS[p.promotionQuest.tier - 1].bossCount}</span></div>}
  {main ? <QuestCard q={main} p={p} onAction={onAction} compact/> : <div className="quest-ending"><Check size={18}/><strong>{tr("에테리아의 새벽")}</strong><span>{tr("모든 메인 이야기를 완료했습니다.")}</span></div>}
  <div className="side-quest-heading">{tr("서브퀘스트 ")}<span>{sides.length} / 2</span></div>
  {sides.map(q => <QuestCard q={q} p={p} onAction={onAction} key={q.id} compact/>)}
  {sides.length < 2 && <p className="quest-empty">{tr(p.level < 50 ? '남은 의뢰를 마치고 성장하면 새 의뢰가 도착합니다.' : '모든 서브 의뢰를 완료했습니다.')}</p>}
  </div>
 </aside>;
}
export function QuestJournal({ p, onAction }: {
    p: Player;
    onAction: (id: number) => void;
}) {
    const { main, sides } = questSlots(p), visible = [...(main ? [main] : []), ...sides];
    const legacy = QUESTS.filter(q => p.quests[q.id] !== undefined && !visible.includes(q));
    return <div className="quest-journal"><p className="quest-journal-hint">{tr("카드를 한 번 눌러 수락하세요. 목표를 채우면 같은 카드에서 바로 보상을 받습니다.")}</p>
  {visible.map(q => <QuestCard q={q} p={p} onAction={onAction} key={q.id}/>)}
  {!!legacy.length && <details><summary>{tr("이전에 수락한 임무 ")}{legacy.length}{tr("개")}</summary>{legacy.map(q => <QuestCard q={q} p={p} onAction={onAction} key={q.id}/>)}</details>}
  <details className="story-archive"><summary>{tr("완료한 메인 이야기 · ")}{MAIN_QUESTS.filter(q => p.done.includes(q.id)).length} / {MAIN_QUESTS.length}</summary>{MAIN_QUESTS.filter(q => p.done.includes(q.id)).map(q => <article key={q.id}><span>{tr(q.chapter)}</span><h3><Check size={15}/>{tr(q.name)}</h3><p>{tr(q.story)}</p><p className="quest-epilogue">{tr(q.epilogue)}</p></article>)}</details>
 </div>;
}
export function QuestReward({ p, onDismiss }: {
    p: Player;
    onDismiss: () => void;
}) {
    const reward = p.lastQuestReward;
    if (!reward)
        return null;
    const q = QUESTS[reward.id];
    if (!q)
        return null;
    return <section className="quest-reward glass" role="status" aria-live="polite"><button aria-label={tr("보상 알림 닫기")} onClick={onDismiss}>×</button><span className="quest-reward-label"><Check size={16}/> QUEST COMPLETE</span><h3>{tr(q.name)}</h3><p>{tr(q.epilogue)}</p><div><b>+{tr(reward.gold.toLocaleString())} G</b><b>+{tr(reward.xp.toLocaleString())} EXP</b></div></section>;
}
