import { RAIDS } from '../shared/social';
import { stats } from '../shared/progression';
import type { World, Player } from '../shared/types';
export function enterRaid(w: World, p: Player, value: number, now: number) { const r = RAIDS[value]; if (!r || p.level < r.level) {
    p.notice = '레이드 입장 레벨이 부족합니다.';
    return;
} if (p.hp <= 0)
    return; if (p.zone >= 25) {
    p.notice = '이미 성소에 입장했습니다. 다른 레이드는 퇴장 후 선택하세요.';
    return;
} w.raids ??= []; let battle = w.raids.find(b => b.zone === r.zone); if (battle && battle.status !== 'fight' && now < battle.ends) {
    p.notice = '성소가 회복 중입니다. 잠시 뒤 다시 입장하세요.';
    return;
} if (!battle || battle.status !== 'fight') {
    w.raids = w.raids.filter(b => b.zone !== r.zone);
    w.monsters = w.monsters.filter(m => m.zone !== r.zone);
    battle = { zone: r.zone, started: now, ends: now + r.minutes * 60000, participants: [], status: 'fight', rewarded: false };
    w.raids.push(battle);
    w.monsters.push({ id: 'raid-' + r.zone, type: 9, zone: r.zone, x: 900, y: 470, homeX: 900, homeY: 470, hp: r.hp, maxHp: r.hp, deadUntil: 0, lastHit: 0, lastAtk: 0, nextSpecial: now + 4000 });
} if (!battle.participants.includes(p.id)) {
    if (battle.participants.length >= 4) {
        p.notice = '레이드는 최대 4명입니다.';
        return;
    }
    battle.participants.push(p.id);
} p.zone = r.zone; p.x = 900; p.y = 850; const s = stats(p); p.hp = s.hp; p.mp = s.mp; p.notice = r.name + ' 레이드 시작! 붉은 경고 범위를 피하세요.'; }
export function tickRaids(w: World, now: number) { for (const b of w.raids || []) {
    if (b.status !== 'fight')
        continue;
    const boss = w.monsters.find(m => m.zone === b.zone);
    if (!boss || boss.hp <= 0)
        continue;
    const present = b.participants.map(id => w.players[id]).filter(p => p && p.zone === b.zone && now - p.seen < 15000);
    if (now >= b.ends || (now - b.started > 15000 && (!present.length || present.every(p => p.hp <= 0)))) {
        b.status = 'failed';
        b.ends = now + 30000;
        boss.hp = 0;
        boss.deadUntil = Number.MAX_SAFE_INTEGER;
        for (const p of present)
            p.notice = '레이드 실패. 별샘 마을로 돌아가 다시 도전하세요.';
    }
} }
