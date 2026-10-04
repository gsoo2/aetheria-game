import { tr } from '../../shared/i18n';
import { useEffect, useState } from 'react';
import { BUBBLES, RAIDS } from '../../shared/social';
import { CLASSES, ITEMS } from '../../shared/content';
import type { Input, Snapshot } from '../../shared/types';
export function BubbleShop({ snapshot: s, send }: {
    snapshot: Snapshot;
    send: (i: Input) => void;
}) { const p = s.player; return <div><p className="subtle">{tr("세계 채팅을 보내면 캐릭터 위에 말풍선이 나타납니다. 구매는 게임 골드로 합니다.")}</p><div className="bubble-shop">{BUBBLES.filter(b => !b.cashOnly).map(b => { const owned = b.id === 0 || p.bubbles?.includes(b.id); return <article key={b.id}><img src={'/bubbles/' + b.id + '.svg'} alt={tr(b.name + ' 말풍선')}/><strong>{tr(b.name)}</strong><button className="outline-button" disabled={!owned && p.gold < b.price} onClick={() => send({ action: owned ? 'bubbleEquip' : 'bubbleBuy', value: b.id })}>{tr(p.bubbleId === b.id ? '사용 중' : owned ? '적용' : b.price + ' G · 구매')}</button></article>; })}</div></div>; }
export function RaidPanel({ snapshot: s, send }: {
    snapshot: Snapshot;
    send: (i: Input) => void;
}) { const b = s.raid, p = s.player; return <div className="raid-panel"><p>{tr("LV10부터 참여하는 최대 4인 협력 전투입니다. 같은 레이드를 선택하면 함께 입장합니다. 혼자 도전할 수도 있습니다.")}</p>{b && <div className="dialog-feedback">{tr(b.status === 'fight' ? '전투 중' : b.status === 'won' ? '보스 처치 완료' : '레이드 실패')}{tr(" · 참가 ")}{b.participants.length}{tr("명")}<button className="outline-button" onClick={() => send({ action: 'raidLeave' })}>{tr("마을로 돌아가기")}</button></div>}<div className="raid-cards">{RAIDS.map((r, i) => <article key={r.zone}><img src="/art/raid-arena.png" alt={tr("천공 성소")} style={{ filter: i === 1 ? 'hue-rotate(35deg)' : i === 2 ? 'hue-rotate(300deg)' : 'none' }}/><span className="eyebrow">LV. {r.level}+ · {r.minutes}{tr("분 제한")}</span><h3>{tr(r.name)}</h3><p>{tr("전방 경고 후 강타 · 체력 50% 이하 광폭화")}</p><small>{tr("처치 보상: ")}{r.gold} G · {r.xp}{tr(" EXP · 전설 무기")}</small><button className="gold-button" disabled={p.level < r.level || p.zone >= 25} onClick={() => send({ action: 'raidEnter', value: i })}>{tr(p.level < r.level ? '레벨 ' + r.level + ' 필요' : '성소 입장')}</button></article>)}</div><p className="subtle">{tr("경고 원에서 벗어나거나 Shift로 회피하세요. 제한 시간 초과 또는 전원 쓰러짐으로 실패합니다. 처치 보상은 보스에게 피해를 준 수호자 중 같은 맵에 접속 중인 수호자에게 자동 지급되며, 가방이 가득 차면 보상 무기를 나중에 수령할 수 있습니다.")}</p>{(p.raidRewards?.length || 0) > 0 && <button className="gold-button" onClick={() => send({ action: 'raidClaim' })}>{tr("보관된 보상 무기 받기 (")}{p.raidRewards?.length})</button>}</div>; }
export function TradePanel({ snapshot: s, send }: {
    snapshot: Snapshot;
    send: (i: Input) => void;
}) {
    const t = s.trade, p = s.player;
    const [indices, setIndices] = useState<number[]>([]), [gold, setGold] = useState(0);
    useEffect(() => { setIndices([]); setGold(0); }, [t?.id]);
    if (!t)
        return <p>{tr("현재 거래가 없습니다. 가까운 다른 수호자를 우클릭해 거래를 요청하세요.")}</p>;
    const mine = t.offers[p.id], otherId = t.a === p.id ? t.b : t.a, other = s.players.find(a => a.id === otherId), offer = t.offers[otherId];
    const action = (name: string) => send({ action: name, tradeId: t.id, revision: t.revision });
    return <div className="trade-panel"><h3>{other?.name || tr('수호자')}{tr("님과 거래")}</h3>{t.phase === 'request' ? <><p>{tr(t.a === p.id ? '상대방의 수락을 기다립니다.' : '상대방이 거래를 요청했습니다.')}</p>{t.b === p.id && <button className="gold-button" onClick={() => action('tradeAccept')}>{tr("거래 수락")}</button>}</> : <><p className="subtle">{tr("장착하지 않은 아이템 최대 12개와 골드를 제안하세요. 제안이 바뀌면 양쪽 확인이 해제됩니다.")}</p><div className="trade-offers">{[[p.name, mine], [other?.name || '상대방', offer]].map(([name, o], i) => { const value = o as typeof mine; return <article key={i}><h4>{String(name)} {tr(value.confirmed ? '✓ 확인됨' : '· 미확인')}</h4><b>{value.gold} G</b>{value.items.map((id, j) => <p key={j}>{tr(ITEMS[id]?.name)}</p>)}{!value.items.length && <p>{tr("아이템 없음")}</p>}</article>; })}</div><h4>{tr("내 가방에서 선택 (")}{indices.length}/12)</h4><div className="trade-bag">{p.inventory.map((id, index) => <button key={index} disabled={Object.values(p.equipment).includes(id)} className={'outline-button ' + (indices.includes(index) ? 'selected' : '')} onClick={() => setIndices(a => a.includes(index) ? a.filter(n => n !== index) : a.length < 12 ? [...a, index] : a)}>{tr(indices.includes(index) ? '✓ ' : '')}{tr(ITEMS[id].name)}{tr(Object.values(p.equipment).includes(id) ? ' (장착)' : '')}</button>)}</div><label>{tr("제안 골드 ")}<input aria-label={tr("거래 골드")} type="number" min="0" max={p.gold} value={gold} onChange={e => setGold(Math.max(0, Math.floor(Number(e.target.value) || 0)))}/></label><div className="trade-actions"><button className="outline-button" onClick={() => send({ action: 'tradeOffer', tradeId: t.id, indices, gold })}>{tr("제안 등록 / 변경")}</button><button className="gold-button" disabled={mine.confirmed} onClick={() => action('tradeConfirm')}>{tr(mine.confirmed ? '상대 확인 대기' : '현재 제안 확인')}</button></div><p className="subtle">{tr("양쪽이 확인하면 즉시 교환됩니다. 거래 중 거리가 멀어지거나 접속이 끊기면 취소됩니다.")}</p></>}<button className="outline-button" onClick={() => action('tradeCancel')}>{tr("거래 취소")}</button></div>;
}
