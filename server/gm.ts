import {GM_SKINS,GM_TITLES} from '../shared/gm-content';
import { ITEMS } from '../shared/content';
import { addXp, needXp, stats } from '../shared/progression';
import type { Player, World } from '../shared/types';
export type GmAction = {
    playerId: string;
    revision: number;
    cosmeticId?:number;
    action: 'setSkin' | 'setTitle' | 'set' | 'addXp' | 'addGold' | 'addCash' | 'giveItem' | 'removeItem' | 'heal' | 'town' | 'kick' | 'ban' | 'unban';
    level?: number;
    xp?: number;
    gold?: number;
    cash?: number;
    potions?: number;
    manaPotions?: number;
    itemId?: number;
    quantity?: number;
    amount?: number;
    reason?: string;
};
export type GmAudit = {
    id: string;
    at: number;
    playerId: string;
    name: string;
    action: string;
    reason: string;
    before: unknown;
    after: unknown;
};
export function integer(value: unknown, label: string, min: number, max: number): number { if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max)
    throw new Error(label + ' 범위: ' + min + ' ~ ' + max); return Number(value); }
export function gmSummary(p: Player, now: number) { return { id: p.id, name: p.name, classId: p.classId, level: p.level, xp: p.xp, gold: p.gold, cash: p.cash || 0, zone: p.zone, hp: p.hp, mp: p.mp, online: now - p.seen < 10000 && !p.gmBanned, seen: p.seen, revision: p.gmRevision || 0, banned: !!p.gmBanned, blockedUntil: p.gmBlockedUntil || 0 }; }
export function gmDetail(p: Player, now: number) { return { ...gmSummary(p, now), inventory: p.inventory, equipment: p.equipment, potions: p.potions, manaPotions: p.manaPotions, promotionTier: p.promotionTier || 0, stats: stats(p), needXp: needXp(p.level), pets: p.pets || [], gmSkin:p.gmSkin??-1,gmTitle:p.gmTitle||'', bubbleId: p.bubbleId || 0 }; }
export function gmMutate(w: World, body: GmAction, now: number) {
    const p = w.players[body.playerId];
    if (!p)
        throw new Error('수호자를 찾을 수 없습니다.');
    if (body.revision !== (p.gmRevision || 0))
        throw new Error('REVISION_CONFLICT');
    const before = JSON.parse(JSON.stringify(gmDetail(p, now)));
    const next = structuredClone(p);
    let affected: string;
    switch (body.action) {
        case 'setSkin': { const id=integer(body.cosmeticId,'스킨',-1,8),skin=GM_SKINS.find(s=>s.id===id);if(id!==-1&&!skin)throw new Error('GM 전용 스킨을 선택하세요.');delete next.animalSkinId;if(id===-1)delete next.gmSkin;else {next.gmSkin=id;next.animalSkins??=[];if(!next.animalSkins.includes(id))next.animalSkins.push(id);}affected=id===-1?'GM 스킨 해제':skin!.name+' 적용';break; }
        case 'setTitle': { const id=integer(body.cosmeticId,'칭호',-1,GM_TITLES.length-1);if(id===-1)delete next.gmTitle;else next.gmTitle=GM_TITLES[id];affected=id===-1?'GM 칭호 해제':GM_TITLES[id]+' 적용';break; }
        case 'set': {
            const level = body.level === undefined ? next.level : integer(body.level, '레벨', 1, 50);
            if (body.xp !== undefined)
                next.xp = integer(body.xp, '현재 레벨 경험치', 0, needXp(level) - 1);
            else if (level !== next.level)
                next.xp = 0;
            next.level = level;
            for (const key of ['gold', 'cash', 'potions', 'manaPotions'] as const)
                if (body[key] !== undefined)
                    next[key] = integer(body[key], key === 'gold' ? '골드' : key === 'cash' ? '캐시 코인' : '물약', 0, key === 'gold' || key === 'cash' ? 1000000000 : 99999);
            if (['level', 'xp', 'gold', 'cash', 'potions', 'manaPotions'].every(k => (body as unknown as Record<string, unknown>)[k] === undefined))
                throw new Error('변경할 수치를 입력하세요.');
            affected = '능력치 수정';
            break;
        }
        case 'addXp':
            addXp(next, integer(body.amount, '추가 경험치', 1, 10000000));
            affected = '경험치 지급';
            break;
        case 'addGold': {
            const amount = integer(body.amount, '골드 증감', -1000000000, 1000000000);
            next.gold = integer(next.gold + amount, '결과 골드', 0, 1000000000);
            affected = '골드 지급 / 회수';
            break;
        }
        case 'addCash': {
            const amount = integer(body.amount, '캐시 코인 증감', -1000000000, 1000000000);
            next.cash = integer((next.cash || 0) + amount, '결과 캐시 코인', 0, 1000000000);
            affected = '캐시 코인 지급 / 회수';
            break;
        }
        case 'giveItem': {
            const id = integer(body.itemId, '아이템', 0, ITEMS.length - 1), n = integer(body.quantity, '수량', 1, 60);
            if (next.inventory.length + n > 60)
                throw new Error('가방 공간이 부족합니다. 지급할 수량을 줄이세요.');
            next.inventory.push(...Array(n).fill(id));
            affected = ITEMS[id].name + ' 지급';
            break;
        }
        case 'removeItem': {
            const id = integer(body.itemId, '아이템', 0, ITEMS.length - 1), n = integer(body.quantity, '수량', 1, 60);
            if (next.inventory.filter(v => v === id).length < n)
                throw new Error('보유한 아이템 수량보다 많이 회수할 수 없습니다.');
            for (let i = 0; i < n; i++)
                next.inventory.splice(next.inventory.indexOf(id), 1);
            if (!next.inventory.includes(id))
                for (const slot of ['weapon', 'armor', 'ring'] as const)
                    if (next.equipment[slot] === id)
                        next.equipment[slot] = null;
            affected = ITEMS[id].name + ' 회수';
            break;
        }
        case 'heal': {
            const s = stats(next);
            next.hp = s.hp;
            next.mp = s.mp;
            affected = '생명력 / 마나 회복';
            break;
        }
        case 'town':
            next.zone = 0;
            next.x = 900;
            next.y = 740;
            affected = '마을 이동';
            break;
        case 'kick':
            next.gmBlockedUntil = now + 30000;
            next.seen = 0;
            affected = '30초 접속 종료';
            break;
        case 'ban':
            next.gmBanned = true;
            next.seen = 0;
            affected = '캐릭터 접속 차단';
            break;
        case 'unban':
            next.gmBanned = false;
            next.gmBlockedUntil = 0;
            affected = '접속 차단 해제';
            break;
        default: throw new Error('지원하지 않는 관리 작업입니다.');
    }
    const s = stats(next);
    next.hp = Math.max(0, Math.min(next.hp, s.hp));
    next.mp = Math.max(0, Math.min(next.mp, s.mp));
    next.gmRevision = (p.gmRevision || 0) + 1;
    next.notice = 'GM: ' + affected;
    // Validate a clone first; commit one complete change and cancel stale trade proposals.
    if(next.gmSkin===undefined)delete p.gmSkin;
    if(next.animalSkinId===undefined)delete p.animalSkinId;
    if(next.gmTitle===undefined)delete p.gmTitle;
    Object.assign(p, next);
    for (const trade of w.trades || [])
        if (trade.a === p.id || trade.b === p.id) {
            const other = w.players[trade.a === p.id ? trade.b : trade.a];
            if (other)
                other.notice = '관리자 수정으로 거래가 취소되었습니다.';
        }
    w.trades = (w.trades || []).filter(t => t.a !== p.id && t.b !== p.id);
    w.gmAudit ??= [];
    w.gmAudit.push({ id: crypto.randomUUID(), at: now, playerId: p.id, name: p.name, action: body.action, reason: String(body.reason || '').replace(/[<>\x00-\x1f]/g, '').slice(0, 200), before, after: JSON.parse(JSON.stringify(gmDetail(p, now))) });
    w.gmAudit = w.gmAudit.slice(-500);
    return gmDetail(p, now);
}
export async function gmAuthorized(header: string | null, secret: string | undefined) { if (!secret || secret.length < 32 || !header?.startsWith('Bearer '))
    return false; const candidate = header.slice(7); if (candidate.length > 256)
    return false; const enc = new TextEncoder(), [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(candidate)), crypto.subtle.digest('SHA-256', enc.encode(secret))]); const aa = new Uint8Array(a), bb = new Uint8Array(b); let diff = 0; for (let i = 0; i < aa.length; i++)
    diff |= aa[i] ^ bb[i]; return diff === 0; }
