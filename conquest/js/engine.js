// 전략 엔진: 영토, 경제, 전투, 외교, AI. 화면과 분리되어 있어 단독 테스트가 가능하다.
"use strict";
const Engine = (() => {
  const M = window.MAPDATA;
  const W = M.W, H = M.H;
  // 정적 프로빈스 정보
  const P = M.provinces.map((a, i) => ({
    id: i, country: a[0], name: a[1], cells: a[2], value: a[3], label: a[4],
    lx: a[4] % W, ly: Math.floor(a[4] / W), adj: a[5], sea: a[6],
    nb: a[5].concat(a[6]),
  }));
  const NP = P.length;
  // 셀 → 프로빈스 격자
  const grid = new Int16Array(W * H).fill(-1);
  M.grid.split("|").forEach((row, r) => {
    let c = 0;
    for (const run of row.split(",")) {
      const [v, n] = run.split(".");
      const val = parseInt(v, 36) - 1, len = parseInt(n, 36);
      for (let k = 0; k < len; k++) grid[r * W + c + k] = val;
      c += len;
    }
  });
  const provCells = P.map(() => []);
  for (let i = 0; i < W * H; i++) if (grid[i] >= 0) provCells[grid[i]].push(i);

  function provAtLatLon(lat, lon, filter) {
    const r = Math.floor((M.LAT_TOP - lat) / M.RES), c = Math.floor((lon + 180) / M.RES);
    let best = -1, bd = 1e9;
    for (let rr = Math.max(0, r - 10); rr < Math.min(H, r + 10); rr++)
      for (let cc = c - 10; cc < c + 10; cc++) {
        const v = grid[rr * W + ((cc + W) % W)]; if (v < 0 || (filter && !filter(v))) continue;
        const d = (rr - r) ** 2 + (cc - c) ** 2; if (d < bd) { bd = d; best = v; }
      }
    return best;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const key = (a, b) => (a < b ? a + "_" + b : b + "_" + a);
  const isSea = (a, b) => P[a].sea.includes(b);

  function minorColor(ci) {
    const h = (ci * 137.508) % 360, s = 28 + ((ci * 53) % 22), l = 48 + ((ci * 29) % 16);
    // HSL → hex
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n) => { const k = (n + h / 30) % 12; const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, "0"); };
    return "#" + f(0) + f(8) + f(4);
  }
  function addMods(...list) {
    const m = { atk: 0, def: 0, income: 0, manpower: 0, recruitCost: 0, devCost: 0, fortCost: 0, sea: 0, siege: 0, diplo: 0, startGold: 0, startTroops: 0 };
    for (const x of list) if (x) for (const k in x) m[k] = (m[k] || 0) + x[k];
    return m;
  }

  // ---------- 캠페인 생성 ----------
  // opt: { rulerId | custom:{name,title,look,traitId}, color, startProv, goalId, diffId, relics:[], bag:{} }
  function newCampaign(opt) {
    const diff = DIFFICULTY.find((d) => d.id === opt.diffId) || DIFFICULTY[1];
    const nations = M.countries.map((c, ci) => ({
      id: ci, cid: ci, name: c.ko, ruler: null, rulerName: c.ko + " 군주", title: "", look: null,
      color: minorColor(ci), gold: 0, mp: 0, capital: -1, alive: true, great: false, mods: addMods(), player: false,
    }));
    const byEn = {}; M.countries.forEach((c, i) => (byEn[c.en] = i));
    // 역사 인물 강대국
    for (const r of RULERS) {
      const ci = byEn[r.country]; if (ci == null) continue;
      const n = nations[ci];
      n.ruler = r.id; n.rulerName = r.name; n.title = r.title; n.look = r.look; n.color = r.color; n.great = true;
      n.mods = addMods(r.mods); n.home = r.home;
    }
    // 플레이어 나라 결정
    let pn;
    if (opt.custom) {
      const ci = P[opt.startProv].country;
      pn = nations[ci];
      const tr = CUSTOM.traits.find((t) => t.id === opt.custom.traitId) || CUSTOM.traits[0];
      pn.ruler = "custom"; pn.rulerName = opt.custom.name; pn.title = opt.custom.title; pn.look = opt.custom.look;
      pn.name = opt.custom.nation || pn.name; pn.mods = addMods(tr.mods); pn.great = true; pn.home = null;
    } else {
      const r = RULERS.find((x) => x.id === opt.rulerId);
      pn = nations[byEn[r.country]];
    }
    pn.player = true;
    if (opt.color) pn.color = opt.color;
    const relicMods = (opt.relics || []).map((id) => ITEMS[id] && ITEMS[id].mods);
    pn.mods = addMods(pn.mods, ...relicMods);
    // AI 난이도 보정
    for (const n of nations) if (!n.player) { n.mods.atk += diff.ai; n.mods.def += diff.ai; n.mods.income += diff.ai; }

    const prov = P.map((p) => ({ o: p.country, t: 0, r: 0, d: 1, f: 0 }));
    const C = {
      v: 1, turn: 1, goalId: opt.goalId || "empire", diffId: diff.id, player: pn.id, nations, prov,
      war: {}, warInfo: {}, truce: {}, bag: Object.assign({}, opt.bag || {}), relics: (opt.relics || []).slice(),
      buff: { horn: false, siege: false }, log: [], stats: { won: 0, lost: 0, taken: 0, peak: 0 },
      rulerId: opt.custom ? "custom" : opt.rulerId, pendingOffers: [],
    };
    // 수도 & 초기 병력·금
    for (const n of nations) {
      const owned = P.filter((p) => prov[p.id].o === n.id);
      if (!owned.length) { n.alive = false; continue; }
      let cap = null;
      if (n.player && opt.custom) cap = opt.startProv;
      else if (n.home) { const hp = provAtLatLon(n.home[0], n.home[1], (v) => prov[v].o === n.id); if (hp >= 0) cap = hp; }
      if (cap == null) cap = owned.reduce((a, b) => (b.value > a.value ? b : a)).id;
      n.capital = cap;
      for (const p of owned) {
        let t = 300 + Math.sqrt(p.value) * 80;
        if (n.great) t *= 1.4;
        if (n.player) t *= 1.3 + n.mods.startTroops;
        if (p.id === cap) t *= 1.6;
        prov[p.id].t = prov[p.id].r = Math.round(t / 50) * 50;
        if (p.id === cap) { prov[p.id].f = 1; prov[p.id].d = n.great ? 2 : 1; }
      }
      n.gold = Math.round(150 + owned.length * 25 + (n.player ? 200 + n.mods.startGold : 0));
      n.mp = Math.round(mpRegen(C, n.id) * 3);
    }
    C.total = NP;
    C.stats.peak = countOwned(C, pn.id);
    return C;
  }

  // ---------- 경제 ----------
  function econ(C, pid) {
    const p = P[pid], s = C.prov[pid];
    const cap = C.nations[s.o] && C.nations[s.o].capital === pid;
    return (1.5 + Math.sqrt(p.value) * 0.9) * (1 + 0.4 * (s.d - 1)) * (cap ? 1.5 : 1);
  }
  function ownedList(C, nid) { const a = []; for (let i = 0; i < NP; i++) if (C.prov[i].o === nid) a.push(i); return a; }
  function countOwned(C, nid) { let k = 0; for (let i = 0; i < NP; i++) if (C.prov[i].o === nid) k++; return k; }
  function totalTroops(C, nid) { let k = 0; for (let i = 0; i < NP; i++) if (C.prov[i].o === nid) k += C.prov[i].t; return k; }
  function grossIncome(C, nid) {
    const n = C.nations[nid]; let s = 0;
    for (let i = 0; i < NP; i++) if (C.prov[i].o === nid) s += econ(C, i);
    return s * (1 + n.mods.income);
  }
  function upkeep(C, nid) { return totalTroops(C, nid) / 1000 * 1.5; }
  function income(C, nid) { return Math.round(grossIncome(C, nid) - upkeep(C, nid)); }
  function mpRegen(C, nid) {
    const n = C.nations[nid]; let s = 0;
    for (let i = 0; i < NP; i++) if (C.prov[i].o === nid) s += (40 + Math.sqrt(P[i].value) * 14) * (1 + 0.3 * (C.prov[i].d - 1));
    return Math.round(s * (1 + n.mods.manpower));
  }
  const recruitCost = (C, nid, amount) => Math.ceil((amount / 100) * 8 * (1 + C.nations[nid].mods.recruitCost));
  const devCost = (C, pid) => Math.round(60 * C.prov[pid].d * (1 + C.nations[C.prov[pid].o].mods.devCost));
  const fortCost = (C, pid) => Math.round(80 * (C.prov[pid].f + 1) * (1 + C.nations[C.prov[pid].o].mods.fortCost));

  function recruit(C, nid, pid, amount) {
    const n = C.nations[nid];
    if (C.prov[pid].o !== nid) return false;
    amount = Math.floor(Math.min(amount, n.mp) / 100) * 100;
    while (amount > 0 && recruitCost(C, nid, amount) > n.gold) amount -= 100;
    if (amount <= 0) return false;
    n.gold -= recruitCost(C, nid, amount); n.mp -= amount; C.prov[pid].t += amount; // 이번 턴엔 이동 불가(r 미증가)
    return amount;
  }
  function maxRecruit(C, nid) {
    const n = C.nations[nid];
    let a = Math.floor(n.mp / 100) * 100;
    const per = 8 * (1 + n.mods.recruitCost);
    a = Math.min(a, Math.floor(n.gold / per) * 100);
    return Math.max(0, a);
  }
  function develop(C, pid) {
    const s = C.prov[pid], n = C.nations[s.o]; if (s.d >= 5) return false;
    const c = devCost(C, pid); if (n.gold < c) return false;
    n.gold -= c; s.d++; return true;
  }
  function fortify(C, pid) {
    const s = C.prov[pid], n = C.nations[s.o]; if (s.f >= 3) return false;
    const c = fortCost(C, pid); if (n.gold < c) return false;
    n.gold -= c; s.f++; return true;
  }

  // ---------- 외교 ----------
  const atWar = (C, a, b) => !!C.war[key(a, b)];
  const truceLeft = (C, a, b) => Math.max(0, (C.truce[key(a, b)] || 0) - C.turn);
  function declareWar(C, a, b) {
    if (a === b || atWar(C, a, b) || truceLeft(C, a, b) > 0) return false;
    C.war[key(a, b)] = true;
    C.warInfo[key(a, b)] = { start: C.turn, lost: { [a]: 0, [b]: 0 } };
    return true;
  }
  function makePeace(C, a, b, truce = 8) {
    delete C.war[key(a, b)]; delete C.warInfo[key(a, b)];
    C.truce[key(a, b)] = C.turn + truce;
  }
  function enemiesOf(C, nid) {
    const out = [];
    for (const k in C.war) { const [a, b] = k.split("_").map(Number); if (a === nid) out.push(b); else if (b === nid) out.push(a); }
    return out;
  }
  // 플레이어가 AI에 평화 제안
  function peaceChance(C, from, to) {
    const wi = C.warInfo[key(from, to)] || { start: C.turn, lost: {} };
    const myT = totalTroops(C, from), theirT = totalTroops(C, to);
    let p = 0.2 + (wi.lost[to] || 0) * 0.15 - (wi.lost[from] || 0) * 0.08 + C.nations[from].mods.diplo;
    if (theirT < myT * 0.7) p += 0.25; if (theirT > myT * 1.5) p -= 0.2;
    if (C.turn - wi.start < 2) p -= 0.15;
    return Math.max(0.05, Math.min(0.95, p));
  }
  function proposePeace(C, from, to) {
    if (!atWar(C, from, to)) return false;
    C.nations[from].peaceAsked = C.nations[from].peaceAsked || {};
    if (C.nations[from].peaceAsked[to] === C.turn) return "wait";
    C.nations[from].peaceAsked[to] = C.turn;
    if (Math.random() < peaceChance(C, from, to)) { makePeace(C, from, to); return true; }
    return false;
  }

  // ---------- 전투/이동 ----------
  function atkMul(C, a, from, to) {
    const n = C.nations[a];
    let m = 1 + n.mods.atk + (n.player && C.buff.horn ? 0.5 : 0);
    if (isSea(from, to) && !(n.mods.sea > 0)) m *= 0.75;
    return Math.max(0.3, m);
  }
  function defMul(C, d, pid, attacker) {
    const n = C.nations[d], s = C.prov[pid], an = C.nations[attacker];
    let fortEff = 1 - (an.mods.siege || 0);
    if (an.player && C.buff.siege) fortEff = 0;
    return Math.max(0.3, 1 + n.mods.def + 0.25 * s.f * fortEff + (n.capital === pid ? 0.2 : 0));
  }
  function militia(C, pid) { return 50 * C.prov[pid].d; }
  // 전투 승리 확률 대략치 (UI 표시용)
  function odds(C, from, to, amount) {
    const a = C.prov[from].o, d = C.prov[to].o;
    const pa = amount * atkMul(C, a, from, to), pd = (C.prov[to].t + militia(C, to)) * defMul(C, d, to, a);
    const r = pa / Math.max(1, pd);
    // 각 ±15% 무작위 → 비율 r 에서 승리 확률 근사
    return Math.max(0, Math.min(1, (r - 0.74) / (1.35 - 0.74)));
  }
  // amount 만큼 from → to 이동 또는 공격
  function move(C, from, to, amount) {
    const sa = C.prov[from], sb = C.prov[to], a = sa.o, b = sb.o;
    if (!P[from].nb.includes(to)) return { ok: false, why: "인접하지 않음" };
    amount = Math.min(amount, sa.r);
    if (amount <= 0) return { ok: false, why: "이동 가능한 병력이 없음" };
    if (a === b) { sa.t -= amount; sa.r -= amount; sb.t += amount; return { ok: true, type: "move", from, to, amount }; }
    if (!atWar(C, a, b)) return { ok: false, why: "전쟁 중이 아님" };
    sa.t -= amount; sa.r -= amount;
    const D = sb.t;
    const pa = amount * atkMul(C, a, from, to) * rnd(0.85, 1.15);
    const pd = (D + militia(C, to)) * defMul(C, b, to, a) * rnd(0.85, 1.15);
    const res = { ok: true, type: "battle", from, to, a, b, amount, defenders: D, win: pa > pd };
    if (res.win) {
      const loss = Math.min(amount - 1, Math.round(amount * (pd / pa) * 0.55));
      res.lossA = loss; res.lossD = D;
      capture(C, to, a, amount - loss, res);
    } else {
      const loss = Math.round(amount * 0.6);
      res.lossA = loss; res.lossD = Math.min(D, Math.round(D * (pa / pd) * 0.45));
      sb.t -= res.lossD; sb.r = Math.min(sb.r, sb.t);
      sa.t += amount - loss; // 생존자 귀환 (이번 턴 재이동 불가)
    }
    const wi = C.warInfo[key(a, b)];
    if (res.win && wi) wi.lost[b] = (wi.lost[b] || 0) + 1;
    if (C.nations[a].player) res.win ? C.stats.won++ : C.stats.lost++;
    return res;
  }
  function capture(C, pid, nid, troops, res) {
    const s = C.prov[pid], old = s.o, on = C.nations[old], nn = C.nations[nid];
    s.o = nid; s.t = troops; s.r = 0; s.f = Math.max(0, s.f - 1);
    const plunder = Math.round(econ(C, pid) * 3);
    nn.gold += plunder; res.plunder = plunder;
    if (nn.player) C.stats.taken++;
    if (on.capital === pid) {
      const rest = ownedList(C, old);
      if (rest.length) {
        on.capital = rest.reduce((a, b) => (P[b].value > P[a].value ? b : a));
        const g = Math.round(on.gold * 0.3); on.gold -= g; nn.gold += g; res.capital = true; res.plunder += g;
      }
    }
    if (countOwned(C, old) === 0) {
      on.alive = false; res.eliminated = old;
      for (const e of enemiesOf(C, old)) { delete C.war[key(old, e)]; delete C.warInfo[key(old, e)]; }
    }
  }

  // ---------- AI ----------
  function aiTurn(C, nid, events) {
    const n = C.nations[nid], diff = DIFFICULTY.find((d) => d.id === C.diffId);
    const mine = ownedList(C, nid);
    if (!mine.length) return;
    const enemies = new Set(enemiesOf(C, nid));
    // 국경/위협 계산
    const border = [], dist = {};
    for (const pid of mine) {
      let foreign = false, threat = 0;
      for (const q of P[pid].nb) {
        const o = C.prov[q].o;
        if (o !== nid) { foreign = true; threat += enemies.has(o) ? C.prov[q].t : C.prov[q].t * 0.25; }
      }
      if (foreign) { border.push({ pid, threat }); dist[pid] = 0; }
    }
    // 국경까지 거리 (BFS)
    const q = border.map((b) => b.pid); let h = 0;
    while (h < q.length) { const x = q[h++]; for (const y of P[x].nb) if (C.prov[y].o === nid && dist[y] == null) { dist[y] = dist[x] + 1; q.push(y); } }

    // 1) 소비: 징병 / 개발 / 요새
    const myTroops = totalTroops(C, nid);
    const inc = grossIncome(C, nid);
    const wantTroops = mine.length * 700 + (enemies.size ? 1500 : 0) + (n.great ? 1500 : 0);
    if (border.length) {
      border.sort((a, b) => b.threat / (C.prov[b.pid].t + 1) - a.threat / (C.prov[a.pid].t + 1));
      if (enemies.size || myTroops < wantTroops) {
        const budget = Math.max(0, n.gold - 25);
        const per = 8 * (1 + n.mods.recruitCost);
        let amount = Math.min(Math.floor(budget / per) * 100, Math.floor(n.mp / 100) * 100);
        // 유지비가 수입을 넘지 않도록
        const maxByUpkeep = Math.max(0, Math.floor(((inc * 0.85) / 1.5) * 1000 - myTroops));
        amount = Math.min(amount, maxByUpkeep);
        if (amount >= 100) {
          const a1 = Math.round(amount * 0.65 / 100) * 100;
          if (a1 > 0) recruit(C, nid, border[0].pid, a1);
          if (border[1] && amount - a1 > 0) recruit(C, nid, border[1].pid, amount - a1); else if (amount - a1 > 0) recruit(C, nid, border[0].pid, amount - a1);
        }
      }
    }
    if (!enemies.size && Math.random() < 0.5) {
      const cand = mine.filter((p) => C.prov[p].d < 5).sort((a, b) => P[b].value - P[a].value)[0];
      if (cand != null && n.gold > devCost(C, cand) + 40) develop(C, cand);
    }
    if (enemies.size && border.length && Math.random() < 0.25) {
      const b = border[0].pid; if (C.prov[b].f < 2 && n.gold > fortCost(C, b) + 60) fortify(C, b);
    }

    // 2) 공격
    if (enemies.size) {
      const order = mine.slice().sort((a, b) => C.prov[b].r - C.prov[a].r);
      for (const pid of order) {
        const s = C.prov[pid]; if (s.o !== nid || s.r < 100) continue;
        let best = null, bestScore = 0;
        for (const t of P[pid].nb) {
          const o = C.prov[t].o; if (!enemies.has(o)) continue;
          const keep = Math.round(s.r * 0.1);
          const amt = s.r - keep;
          const od = odds(C, pid, t, amt);
          const score = od * (1 + P[t].value / 100) + (C.nations[o].capital === t ? 0.3 : 0);
          if (od >= 0.62 && score > bestScore) { bestScore = score; best = { t, amt }; }
        }
        if (best) {
          const r = move(C, pid, best.t, best.amt);
          if (r.ok) events.push(r);
        }
      }
    }
    // 3) 내륙 병력을 국경으로
    for (const pid of mine) {
      const s = C.prov[pid];
      if (s.o !== nid || !(dist[pid] > 0) || s.r < 100) continue;
      const nx = P[pid].nb.filter((y) => C.prov[y].o === nid && dist[y] != null && dist[y] < dist[pid]);
      if (nx.length) { const r = move(C, pid, nx[0], s.r); }
    }
    // 4) 국경 병력 재배치: 위협이 낮은 국경 → 높은 국경 이웃
    // 5) 선전포고
    const aggr = diff.aggr * (n.great ? 0.08 : 0.025);
    if (enemies.size === 0 && C.turn > 2 && Math.random() < aggr) {
      const neigh = new Set();
      for (const pid of mine) for (const q2 of P[pid].nb) { const o = C.prov[q2].o; if (o !== nid) neigh.add(o); }
      let best = null, br = 0;
      for (const o of neigh) {
        if (truceLeft(C, nid, o) > 0) continue;
        const on = C.nations[o];
        if (on.player && C.turn < (C.diffId === "easy" ? 10 : C.diffId === "hard" ? 4 : 6)) continue;
        const ratio = myTroops / Math.max(1, totalTroops(C, o));
        const need = n.great ? 1.15 : 1.5;
        const score = ratio * (on.player ? diff.aggr : 1);
        if (ratio > need && score > br) { br = score; best = o; }
      }
      if (best != null && declareWar(C, nid, best)) events.push({ type: "war", a: nid, b: best });
    }
    // 6) 평화
    for (const e of enemies) {
      const wi = C.warInfo[key(nid, e)]; if (!wi) continue;
      const len = C.turn - wi.start;
      if (C.nations[e].player) {
        if ((wi.lost[nid] || 0) >= 2 && len > 3 && Math.random() < 0.15 && !C.pendingOffers.includes(nid)) {
          C.pendingOffers.push(nid); events.push({ type: "peaceOffer", a: nid, b: e });
        }
      } else if (nid < e && len > 6 && Math.random() < 0.12) {
        makePeace(C, nid, e); events.push({ type: "peace", a: nid, b: e });
      }
    }
  }

  function endTurn(C) {
    const events = [];
    C.buff.horn = false; C.buff.siege = false;
    const order = C.nations.filter((n) => n.alive && !n.player).map((n) => n.id).sort(() => Math.random() - 0.5);
    for (const nid of order) {
      if (!C.nations[nid].alive) continue;
      aiTurn(C, nid, events);
    }
    // 항복: 압도적으로 밀린 작은 나라는 통째로 넘어간다
    for (const k of Object.keys(C.war)) {
      const [a, b] = k.split("_").map(Number);
      for (const [w, l] of [[a, b], [b, a]]) {
        const ln = C.nations[l], wn = C.nations[w];
        if (!ln.alive || !wn.alive || ln.player || !C.war[k]) continue;
        const lp = countOwned(C, l), wi = C.warInfo[k];
        if (lp > 3 || !wi || C.turn - wi.start < 2) continue;
        const ratio = totalTroops(C, w) / Math.max(1, totalTroops(C, l));
        if (ratio > 4 && Math.random() < (wn.player ? 0.45 : 0.3)) {
          for (const pid of ownedList(C, l)) { const s = C.prov[pid]; s.o = w; s.t = Math.round(s.t * 0.5); s.r = 0; }
          wn.gold += Math.round(ln.gold * 0.5);
          ln.alive = false;
          for (const e of enemiesOf(C, l)) { delete C.war[key(l, e)]; delete C.warInfo[key(l, e)]; }
          events.push({ type: "annex", a: w, b: l, n: lp });
          if (wn.player) C.stats.taken += lp;
        }
      }
    }
    // 경제
    for (const n of C.nations) {
      if (!n.alive) continue;
      if (!n.alive || countOwned(C, n.id) === 0) { n.alive = false; continue; }
      if (C.prov[n.capital] == null || C.prov[n.capital].o !== n.id) {
        const rest = ownedList(C, n.id); n.capital = rest.reduce((a, b) => (P[b].value > P[a].value ? b : a));
      }
      n.gold = Math.max(0, n.gold + income(C, n.id));
      const reg = mpRegen(C, n.id);
      n.mp = Math.min(reg * 6, n.mp + reg);
      // 파산: 금이 0이고 수입이 음수면 병력 탈영
      if (n.gold === 0 && income(C, n.id) < 0) for (const pid of ownedList(C, n.id)) C.prov[pid].t = Math.round(C.prov[pid].t * 0.93);
    }
    for (const s of C.prov) s.r = s.t;
    C.turn++;
    const pc = countOwned(C, C.player);
    C.stats.peak = Math.max(C.stats.peak, pc);
    return events;
  }

  function goal(C) { return GOALS.find((g) => g.id === C.goalId) || GOALS[1]; }
  function goalCount(C) { return Math.ceil(goal(C).frac * NP); }
  function status(C) {
    const pc = countOwned(C, C.player);
    if (pc === 0) return "lose";
    if (pc >= goalCount(C)) return "win";
    return null;
  }
  // 성으로 돌아갈 때 받는 왕실 금화
  function reward(C, result) {
    const g = goal(C), d = DIFFICULTY.find((x) => x.id === C.diffId);
    const pc = countOwned(C, C.player);
    if (result === "win") return Math.round((g.reward + pc * 3 + C.stats.won * 2) * d.reward);
    const frac = Math.min(1, C.stats.peak / goalCount(C));
    return Math.round((40 + g.reward * 0.35 * frac + C.stats.won) * d.reward);
  }
  function ranking(C) {
    const cnt = {};
    for (const s of C.prov) cnt[s.o] = (cnt[s.o] || 0) + 1;
    return Object.keys(cnt).map((k) => ({ id: +k, n: cnt[k] })).sort((a, b) => b.n - a.n);
  }

  return {
    P, NP, grid, provCells, W, H, provAtLatLon, newCampaign, econ, income, grossIncome, upkeep, mpRegen, recruitCost, devCost, fortCost,
    recruit, maxRecruit, develop, fortify, atWar, truceLeft, declareWar, makePeace, enemiesOf, peaceChance, proposePeace,
    move, odds, endTurn, aiTurn, status, reward, goal, goalCount, countOwned, ownedList, totalTroops, ranking, isSea, key, addMods, capture,
  };
})();
