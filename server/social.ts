import {ITEMS} from '../shared/content';
import { BUBBLES } from '../shared/social';
import { distance } from '../shared/physics';
import type { World, Player, Input } from '../shared/types';
export function tradeFor(w: World, id: string) { return w.trades?.find(t => t.a === id || t.b === id); }
export function expireTrades(w: World, now: number) { w.trades = (w.trades || []).filter(t => { const a = w.players[t.a], b = w.players[t.b]; const valid = a && b && a.hp > 0 && b.hp > 0 && a.zone === b.zone && distance(a, b) <= 240 && now - a.seen < 15000 && now - b.seen < 15000 && t.expires > now; if (!valid) {
    if (a)
        a.notice = '거래가 종료되었습니다. 아이템과 골드는 이동하지 않았습니다.';
    if (b)
        b.notice = '거래가 종료되었습니다. 아이템과 골드는 이동하지 않았습니다.';
} return valid; }); }
export function socialInput(w: World, p: Player, i: Input, now: number) {
    if (i.action === 'bubbleBuy' || i.action === 'bubbleEquip') {
        const b = BUBBLES[Number(i.value)];
        if (!b)
            return;
        p.bubbles ??= [0];
        if(i.action==='bubbleBuy'&&b.cashOnly){p.notice='이 상품은 후원 캐시샵에서 구매할 수 있습니다.';return;}
        if (i.action === 'bubbleBuy' && !p.bubbles.includes(b.id)) {
            if (p.gold < b.price) {
                p.notice = '골드가 부족합니다.';
                return;
            }
            p.gold -= b.price;
            p.bubbles.push(b.id);
        }
        if (p.bubbles.includes(b.id)) {
            p.bubbleId = b.id;
            p.notice = b.name + ' 말풍선 적용';
        }
        return;
    }
    if (!i.action?.startsWith('trade'))
        return;
    expireTrades(w, now);
    if (i.action === 'tradeRequest') {
        const other = w.players[i.targetId || ''];
        if (!other || other.id === p.id || other.zone !== p.zone || p.zone >= 25 || other.hp <= 0 || distance(p, other) > 220 || now - other.seen > 10000) {
            p.notice = '거래할 수호자에게 가까이 다가가세요.';
            return;
        }
        if (tradeFor(w, p.id) || tradeFor(w, other.id)) {
            p.notice = '이미 진행 중인 거래가 있습니다.';
            return;
        }
        w.trades ??= [];
        w.trades.push({ id: crypto.randomUUID(), a: p.id, b: other.id, phase: 'request', revision: 0, expires: now + 120000, offers: { [p.id]: { indices: [], items: [], gold: 0, confirmed: false }, [other.id]: { indices: [], items: [], gold: 0, confirmed: false } } });
        other.notice = p.name + '님이 거래를 요청했습니다.';
        return;
    }
    const t = tradeFor(w, p.id);
    if (!t || t.id !== i.tradeId)
        return;
    const cancel = () => { w.trades = w.trades!.filter(a => a.id !== t.id); };
    if (i.action === 'tradeCancel') {
        cancel();
        return;
    }
    if (i.action === 'tradeAccept' && t.phase === 'request' && p.id === t.b) {
        t.phase = 'open';
        t.revision++;
        return;
    }
    if (t.phase !== 'open')
        return;
    if (i.action === 'tradeOffer') {
        const indices = i.indices || [], gold = i.gold ?? 0;
        if (!Array.isArray(indices) || indices.length > 12 || new Set(indices).size !== indices.length || !Number.isSafeInteger(gold) || gold < 0 || gold > p.gold || indices.some(n => !Number.isSafeInteger(n) || n < 0 || n >= p.inventory.length || Object.values(p.equipment).includes(p.inventory[n]) || (ITEMS[p.inventory[n]]?.gmOnly || ITEMS[p.inventory[n]]?.cashOnly))) {
            p.notice = '제안할 아이템과 골드를 확인하세요. 장착한 장비는 거래할 수 없습니다.';
            return;
        }
        t.offers[p.id] = { indices: [...indices], items: indices.map(n => p.inventory[n]), gold, confirmed: false };
        for (const o of Object.values(t.offers))
            o.confirmed = false;
        t.revision++;
        t.expires = now + 120000;
        return;
    }
    if (i.action !== 'tradeConfirm' || i.revision !== t.revision)
        return;
    const a = w.players[t.a], b = w.players[t.b], ao = t.offers[t.a], bo = t.offers[t.b];
    const valid = (player: Player, o: typeof ao) => player.gold >= o.gold && o.indices.every((index, n) => player.inventory[index] === o.items[n] && !Object.values(player.equipment).includes(o.items[n]));
    if (!valid(a, ao) || !valid(b, bo) || a.inventory.length - ao.items.length + bo.items.length > 60 || b.inventory.length - bo.items.length + ao.items.length > 60) {
        for (const o of Object.values(t.offers))
            o.confirmed = false;
        t.revision++;
        p.notice = '골드·아이템·가방 공간이 바뀌었습니다. 제안을 다시 등록하세요.';
        return;
    }
    t.offers[p.id].confirmed = true;
    if (!ao.confirmed || !bo.confirmed)
        return;
    // One synchronous authoritative operation; no escrow, partial transfer or client balances.
    a.inventory = a.inventory.filter((_, n) => !ao.indices.includes(n)).concat(bo.items);
    b.inventory = b.inventory.filter((_, n) => !bo.indices.includes(n)).concat(ao.items);
    a.gold += bo.gold - ao.gold;
    b.gold += ao.gold - bo.gold;
    a.notice = b.notice = '거래가 완료되었습니다.';
    cancel();
}
