// 지도 위 플레이: 색칠(시작) 단계, 영토 선택, 징병/이동/공격, 외교, 아이템, 턴 진행
"use strict";
const Play = (() => {
  const E = Engine, P = E.P;
  let C = null, sel = -1, hoverP = -1, frac = 1, recruitAmt = 0, targeting = null, busy = false, finish = null, phase = "play";
  let setupState = null;

  const N = (id) => C.nations[id];
  const me = () => C.nations[C.player];
  const colorArr = () => P.map((p) => N(C.prov[p.id].o).color);
  const ownerArr = () => P.map((p) => C.prov[p.id].o);
  function repaint(revealPid, dur, rad) {
    const rv = revealPid != null ? WorldView.labelPos(revealPid).concat([dur || 450, rad || 60]) : null;
    WorldView.setOwners(colorArr(), ownerArr(), rv);
  }
  function log(text, cls = "") {
    const L = $("#log");
    L.prepend(h("div", { class: cls }, text));
    while (L.children.length > 6) L.lastChild.remove();
    C.log.unshift({ t: C.turn, text, cls }); C.log.length = Math.min(C.log.length, 40);
  }

  // ---------- HUD ----------
  function renderTop() {
    const n = me();
    $("#meName").textContent = n.name;
    $("#meRuler").textContent = `${n.title ? n.title + " " : ""}${n.rulerName}`;
    const g = $("#meFace").getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 64, 64);
    if (n.look) g.drawImage(portraitCanvas(n.look, 2, shade(n.color, -0.45)), 0, 0);
    $("#stGold").textContent = fmtN(n.gold);
    const inc = E.income(C, n.id);
    $("#stInc").textContent = (inc >= 0 ? "+" : "") + inc;
    $("#stInc").className = "num " + (inc >= 0 ? "green-t" : "red-t");
    $("#stMp").textContent = fmtN(n.mp);
    $("#stTroops").textContent = fmtN(E.totalTroops(C, n.id));
    const pc = E.countOwned(C, n.id), gc = E.goalCount(C);
    $("#stTurn").textContent = `${C.turn}턴`;
    $("#stProv").textContent = `${pc}/${gc}`;
    $("#stBar").style.width = Math.min(100, (pc / E.NP) * 100) + "%";
    $("#stGoalMark").style.left = Math.min(98, (gc / E.NP) * 100) + "%";
    renderBag();
  }
  function renderBag() {
    const bag = $("#bag"); bag.innerHTML = "";
    for (const id in C.bag) {
      if (!(C.bag[id] > 0)) continue;
      const it = ITEMS[id];
      bag.append(h("button", { class: "slot" + (targeting && targeting.item === id ? " on" : ""), title: `${it.name}: ${it.desc}`, "aria-label": it.name, onclick: () => useItem(id) }, iconEl(it.icon, 3), h("span", { class: "cnt" }, C.bag[id])));
    }
    if (C.buff.horn) bag.append(h("span", { class: "chip", title: "이번 턴 공격력 +50%" }, iconEl("horn", 2), "진격"));
    if (C.buff.siege) bag.append(h("span", { class: "chip", title: "이번 턴 요새 무시" }, iconEl("catapult", 2), "공성"));
  }
  function setHint(t) { const e = $("#targetHint"); if (t) { e.innerHTML = ""; e.append(t, h("button", { class: "btn small", style: "margin-left:8px", onclick: () => { targeting = null; setHint(null); renderBag(); updTargets(); } }, "취소")); e.hidden = false; } else e.hidden = true; }

  // ---------- 아이템 ----------
  function useItem(id) {
    if (busy || phase !== "play") return;
    SFX.play("click");
    if (targeting && targeting.item === id) { targeting = null; setHint(null); renderBag(); updTargets(); return; }
    const n = me();
    const consume = () => { C.bag[id]--; if (C.bag[id] <= 0) delete C.bag[id]; renderTop(); Save.saveCampaign(C); };
    if (id === "horn") { C.buff.horn = true; consume(); toast("진격의 뿔피리! 공격력 +50%", 1500, "#f2c14e"); SFX.play("war"); renderPanel(); return; }
    if (id === "chest") { n.gold += 400; consume(); toast("+400 금", 1200, "#f2c14e"); SFX.play("coin"); log("황금 상자를 열어 금 400을 얻었다", "gold"); return; }
    if (id === "catapult") { C.buff.siege = true; consume(); toast("공성 투석기 준비 완료", 1400); SFX.play("march"); renderPanel(); return; }
    const hints = { decree: "병력을 보낼 내 영토를 고르세요", dagger: "첩자를 보낼 적 영토를 고르세요", dove: "평화를 맺을 전쟁 상대의 영토를 고르세요" };
    targeting = { item: id };
    setHint(hints[id]); renderBag(); updTargets();
  }
  function applyItemTarget(pid) {
    const id = targeting.item, s = C.prov[pid], o = s.o;
    const ok = id === "decree" ? o === C.player : id === "dagger" ? o !== C.player : E.atWar(C, C.player, o);
    if (!ok) { SFX.play("error"); toast(id === "dove" ? "전쟁 중인 나라를 골라야 해요" : "그 영토에는 쓸 수 없어요"); return; }
    if (id === "decree") { s.t += 2500; s.r += 2500; WorldView.floatText(pid, "+2,500", "#7ee08a"); SFX.play("march"); log(`${P[pid].name}에 징병 칙서로 병력 2,500 증원`, "good"); }
    if (id === "dagger") { const k = Math.round(s.t * 0.6); s.t -= k; s.r = Math.min(s.r, s.t); WorldView.floatText(pid, "-" + fmtN(k), "#ff7a6a"); SFX.play("clash"); log(`첩자가 ${P[pid].name}의 병력 ${fmtN(k)}을 무너뜨렸다`, "war"); }
    if (id === "dove") { E.makePeace(C, C.player, o, 10); SFX.play("peace"); log(`${josa(N(o).name, "과", "와")} 평화의 비둘기로 휴전 (10턴)`, "good"); toast("평화 성립"); }
    C.bag[id]--; if (C.bag[id] <= 0) delete C.bag[id];
    targeting = null; setHint(null); renderTop(); renderPanel(); updTargets(); Save.saveCampaign(C);
  }

  // ---------- 선택 & 대상 ----------
  let targets = new Map();
  function updTargets() {
    targets = new Map();
    if (targeting) {
      for (let i = 0; i < E.NP; i++) {
        const o = C.prov[i].o;
        if (targeting.item === "decree" && o === C.player) targets.set(i, "#7ee08a");
        if (targeting.item === "dagger" && o !== C.player && E.atWar(C, C.player, o)) targets.set(i, "#ff6a5a");
        if (targeting.item === "dove" && E.atWar(C, C.player, o)) targets.set(i, "#9fd8ff");
      }
      return;
    }
    if (phase === "setup") return;
    if (sel >= 0 && C.prov[sel].o === C.player && C.prov[sel].r > 0) {
      for (const q of P[sel].nb) {
        const o = C.prov[q].o;
        targets.set(q, o === C.player ? "#7ee08a" : E.atWar(C, C.player, o) ? "#ff5a4a" : "#c9c2b4");
      }
    }
  }
  function select(pid) {
    sel = pid; frac = 1;
    const s = C.prov[pid];
    if (s && s.o === C.player) recruitAmt = Math.min(1000, E.maxRecruit(C, C.player));
    updTargets(); renderPanel();
  }

  // ---------- 영토 패널 ----------
  function renderPanel() {
    const pp = $("#ppanel");
    if (sel < 0 || phase !== "play") { pp.hidden = true; return; }
    pp.hidden = false; pp.innerHTML = "";
    const s = C.prov[sel], p = P[sel], on = N(s.o), mine = s.o === C.player;
    const orig = MAPDATA.countries[p.country].ko;
    const head = h("div", { class: "ttl" }, h("span", { class: "flag", style: `background:${on.color}` }), h("div", { style: "min-width:0;flex:1" }, h("h2", {}, p.name), h("div", { class: "muted" }, on.name + (on.name !== orig ? ` · 원래 ${orig} 땅` : ""))),
      h("button", { class: "btn small", "aria-label": "닫기", onclick: () => { sel = -1; updTargets(); renderPanel(); } }, "✕"));
    pp.append(head);
    const star = (k, max) => "■".repeat(k) + "□".repeat(max - k);
    pp.append(h("div", { class: "kv num" },
      h("span", {}, "병력"), h("span", {}, mine ? `${fmtN(s.t)} (이동 가능 ${fmtN(s.r)})` : fmtN(s.t)),
      h("span", {}, "개발도"), h("span", { class: "gold-t" }, star(s.d, 5)),
      h("span", {}, "요새"), h("span", {}, s.f ? star(s.f, 3) : "없음"),
      h("span", {}, "세수"), h("span", {}, `${E.econ(C, sel).toFixed(1)} / 턴`),
      on.capital === sel ? h("span", {}, "수도") : null, on.capital === sel ? h("span", { class: "gold-t" }, "★ " + on.name + "의 수도") : null));
    if (mine) {
      // 이동/공격
      if (s.r > 0) {
        const amtLbl = h("b", { class: "num" }, fmtN(Math.max(1, Math.round(s.r * frac))));
        pp.append(h("div", { class: "sec" }, h("h3", {}, "출병"), h("div", { class: "muted", style: "line-height:1.5" }, "녹색은 내 땅(이동), 빨간색은 적(공격), 회색은 선전포고가 필요한 땅입니다. 지도에서 바로 누르세요."),
          h("div", { class: "row" }, h("span", { class: "muted" }, "보낼 병력"), amtLbl),
          h("div", { class: "seg" }, [0.25, 0.5, 0.75, 1].map((f) => h("button", { class: "btn small" + (frac === f ? " on" : ""), onclick: () => { frac = f; SFX.play("click"); renderPanel(); } }, Math.round(f * 100) + "%")))));
      }
      // 징병
      const maxR = E.maxRecruit(C, C.player);
      recruitAmt = Math.max(0, Math.min(recruitAmt || 0, maxR));
      if (!recruitAmt && maxR) recruitAmt = Math.min(1000, maxR);
      const cost = h("span", { class: "gold-t num" });
      const amt = h("b", { class: "num" });
      const upd = () => { amt.textContent = fmtN(recruitAmt); cost.textContent = `금 ${fmtN(E.recruitCost(C, C.player, recruitAmt))}`; };
      const rng = h("input", { type: "range", id: "rRecruit", min: 0, max: Math.max(100, maxR), step: 100, value: recruitAmt, disabled: !maxR, oninput: (e) => { recruitAmt = +e.target.value; upd(); } });
      upd();
      pp.append(h("div", { class: "sec" }, h("h3", {}, "징병"), h("div", { class: "row", style: "justify-content:space-between" }, amt, cost), rng,
        h("button", { class: "btn green", disabled: !maxR || !recruitAmt, onclick: () => {
          const r = E.recruit(C, C.player, sel, recruitAmt);
          if (r) { SFX.play("march"); WorldView.floatText(sel, "+" + fmtN(r), "#7ee08a"); log(`${p.name}에서 ${fmtN(r)} 징병 (다음 턴부터 출병 가능)`, "good"); renderTop(); renderPanel(); Save.saveCampaign(C); }
          else SFX.play("error");
        } }, maxR ? "징병하기" : "금이나 인력이 부족해요")));
      // 개발 & 요새
      const dc = E.devCost(C, sel), fc = E.fortCost(C, sel);
      pp.append(h("div", { class: "sec" }, h("h3", {}, "내정"), h("div", { class: "row" },
        h("button", { class: "btn", disabled: s.d >= 5 || me().gold < dc, onclick: () => { if (E.develop(C, sel)) { SFX.play("coin"); WorldView.floatText(sel, "개발 +1", "#f2c14e"); renderTop(); renderPanel(); Save.saveCampaign(C); } } }, s.d >= 5 ? "개발 최대" : `개발 (금 ${fmtN(dc)})`),
        h("button", { class: "btn", disabled: s.f >= 3 || me().gold < fc, onclick: () => { if (E.fortify(C, sel)) { SFX.play("coin"); WorldView.floatText(sel, "요새 +1", "#c9c2b4"); renderTop(); renderPanel(); Save.saveCampaign(C); } } }, s.f >= 3 ? "요새 최대" : `요새 (금 ${fmtN(fc)})`)),
        h("div", { class: "muted", style: "line-height:1.5" }, "개발은 세수와 인력을, 요새는 방어력을 높입니다.")));
    } else {
      // 외국
      const war = E.atWar(C, C.player, s.o), tl = E.truceLeft(C, C.player, s.o);
      const rel = war ? h("span", { class: "red-t" }, "전쟁 중") : tl ? h("span", { class: "muted" }, `휴전 ${tl}턴 남음`) : h("span", { class: "green-t" }, "평화");
      const box = h("div", { class: "sec" },
        h("div", { class: "row" }, on.look ? portraitEl(on.look, 1, shade(on.color, -0.45)) : null, h("div", { class: "col", style: "gap:2px" }, h("b", {}, on.rulerName), h("span", { class: "muted" }, `${on.title || "군주"} · 영토 ${E.countOwned(C, on.id)}곳 · 병력 ${fmtN(E.totalTroops(C, on.id))}`))),
        h("div", { class: "row" }, h("span", { class: "muted" }, "관계"), rel));
      // 공격 승률 미리보기 (내 인접 영토에서)
      const from = bestSource(sel);
      if (from >= 0 && war) {
        const amtA = Math.max(1, Math.round(C.prov[from].r * frac));
        const od = E.odds(C, from, sel, amtA);
        box.append(h("div", { class: "row" }, h("span", { class: "muted" }, "공격 승률"), h("b", { class: od > 0.6 ? "green-t" : od > 0.35 ? "gold-t" : "red-t" }, `${Math.round(od * 100)}%`), h("span", { class: "muted" }, `(${P[from].name}에서 ${fmtN(amtA)})`)));
        box.append(h("button", { class: "btn red", onclick: () => doMove(from, sel) }, "공격!"));
      }
      if (!war) box.append(h("button", { class: "btn red", disabled: tl > 0, onclick: () => declare(s.o) }, tl ? "휴전 중에는 선전포고 불가" : "선전포고"));
      else box.append(h("button", { class: "btn", onclick: () => {
        const r = E.proposePeace(C, C.player, s.o);
        if (r === "wait") { toast("이번 턴에는 이미 사신을 보냈어요"); return; }
        if (r) { SFX.play("peace"); log(`${josa(on.name, "이", "가")} 평화 제안을 받아들였다 (휴전 8턴)`, "good"); toast("평화 성립"); }
        else { SFX.play("error"); log(`${josa(on.name, "이", "가")} 평화 제안을 거절했다`, "war"); toast("평화 거절"); }
        updTargets(); renderPanel(); Save.saveCampaign(C);
      } }, `평화 제안 (성공률 약 ${Math.round(E.peaceChance(C, C.player, s.o) * 100)}%)`));
      pp.append(box);
    }
  }
  // 대상 영토에 가장 가까운 내 출병지 (선택된 곳 우선)
  function bestSource(target) {
    if (sel >= 0 && sel !== target && C.prov[sel].o === C.player && P[sel].nb.includes(target) && C.prov[sel].r > 0) return sel;
    let best = -1, bt = 0;
    for (const q of P[target].nb) if (C.prov[q].o === C.player && C.prov[q].r > bt) { bt = C.prov[q].r; best = q; }
    return best;
  }
  async function declare(o) {
    const on = N(o);
    const ok = await modal({ title: "선전포고", body: h("div", { class: "col" }, h("div", { class: "row" }, on.look ? portraitEl(on.look, 2, shade(on.color, -0.45)) : null, h("div", { style: "line-height:1.6" }, `${on.name}(${on.rulerName})에게 전쟁을 선포합니까?`, h("br"), h("span", { class: "muted" }, `상대 병력 ${fmtN(E.totalTroops(C, o))} · 영토 ${E.countOwned(C, o)}곳`)))), buttons: [{ label: "취소", value: false }, { label: "전쟁이다!", cls: "red", value: true }] });
    if (!ok) return;
    if (E.declareWar(C, C.player, o)) { SFX.play("war"); toast(`${on.name}에 선전포고!`, 1600, "#ff7a6a"); log(`${on.name}에 선전포고했다`, "war"); }
    updTargets(); renderPanel(); Save.saveCampaign(C);
  }

  // ---------- 이동/공격 ----------
  async function doMove(from, to) {
    if (busy) return;
    const s = C.prov[from], amount = Math.max(1, Math.round(s.r * frac));
    const o = C.prov[to].o;
    if (o !== C.player && !E.atWar(C, C.player, o)) { declare(o); return; }
    busy = true;
    SFX.play("march");
    await WorldView.march(from, to, me().color, o === C.player ? 450 : 650);
    const r = E.move(C, from, to, amount);
    if (!r.ok) { toast(r.why); busy = false; return; }
    if (r.type === "move") { WorldView.floatText(to, "+" + fmtN(r.amount), "#f2c14e"); }
    else {
      SFX.play("clash"); await WorldView.burst(to, 550);
      if (r.win) {
        SFX.play("win"); repaint(to, 500, 90);
        WorldView.floatText(to, r.capital ? "수도 함락!" : "점령!", "#fff3a0");
        log(`${P[to].name} 점령! (손실 ${fmtN(r.lossA)}, 약탈 금 ${fmtN(r.plunder)})`, "good");
        if (r.eliminated != null) { log(`${josa(N(r.eliminated).name, "이", "가")} 멸망했다!`, "gold"); toast(`${N(r.eliminated).name} 멸망!`, 1800, "#f2c14e"); }
      } else {
        SFX.play("lose"); WorldView.floatText(to, "패배…", "#ff7a6a");
        log(`${P[to].name} 공격 실패 (손실 ${fmtN(r.lossA)}, 적 손실 ${fmtN(r.lossD)})`, "war");
      }
    }
    if (C.prov[from].r <= 0 && sel === from && r.win) select(to); else { updTargets(); renderPanel(); }
    renderTop(); Save.saveCampaign(C);
    busy = false;
    checkEnd();
  }

  // ---------- 턴 종료 ----------
  async function endTurn() {
    if (busy || phase !== "play") return;
    busy = true; targeting = null; setHint(null);
    $("#endTurn").disabled = true;
    SFX.play("turn");
    const before = E.countOwned(C, C.player);
    const events = E.endTurn(C);
    let anim = 0;
    for (const ev of events) {
      if (ev.type === "war") {
        if (ev.b === C.player) { SFX.play("war"); log(`${josa(N(ev.a).name, "이", "가")} 우리에게 선전포고했다!`, "war"); toast(`${N(ev.a).name}의 침공!`, 1600, "#ff7a6a"); }
        else if (N(ev.a).great || N(ev.b).great) log(`${N(ev.a).name} ⚔ ${N(ev.b).name} 전쟁 발발`, "war");
      } else if (ev.type === "peace") {
        if (N(ev.a).great || N(ev.b).great) log(`${josa(N(ev.a).name, "과", "와")} ${josa(N(ev.b).name, "이", "가")} 강화했다`);
      } else if (ev.type === "annex") {
        if (ev.a === C.player) { SFX.play("fanfare"); log(`${josa(N(ev.b).name, "이", "가")} 항복하여 영토 ${ev.n}곳이 우리 것이 되었다!`, "gold"); toast(`${N(ev.b).name} 항복!`, 1800, "#f2c14e"); }
        else if (N(ev.a).great || N(ev.b).great) log(`${josa(N(ev.b).name, "이", "가")} ${N(ev.a).name}에 항복했다`);
      } else if (ev.type === "battle") {
        if (ev.b === C.player || ev.a === C.player) {
          if (anim < 5) {
            anim++;
            await WorldView.march(ev.from, ev.to, N(ev.a).color, 380);
            SFX.play("clash"); await WorldView.burst(ev.to, 380);
            WorldView.floatText(ev.to, ev.win ? "함락" : "방어 성공!", ev.win ? "#ff7a6a" : "#7ee08a");
          }
          if (ev.win) { repaint(ev.to, 300, 60); log(`${josa(N(ev.a).name, "이", "가")} ${josa(P[ev.to].name, "을", "를")} 빼앗았다`, "war"); }
          else log(`${P[ev.to].name}에서 ${N(ev.a).name}의 공격을 막아냈다`, "good");
        }
        if (ev.eliminated != null && N(ev.eliminated).great) log(`${josa(N(ev.eliminated).name, "이", "가")} ${N(ev.a).name}에게 멸망했다`, "gold");
      }
    }
    repaint();
    const after = E.countOwned(C, C.player);
    renderTop(); updTargets(); renderPanel();
    Save.saveCampaign(C);
    // 평화 제안
    for (const ev of events.filter((e) => e.type === "peaceOffer")) {
      const on = N(ev.a); if (!on.alive || !E.atWar(C, ev.a, C.player)) continue;
      const ok = await modal({ title: "평화 제안", body: h("div", { class: "row" }, on.look ? portraitEl(on.look, 2, shade(on.color, -0.45)) : null, h("div", { style: "line-height:1.6;flex:1;min-width:0" }, `${on.name}의 사신이 왔습니다.`, h("br"), h("span", { class: "muted" }, "“더 이상의 피는 원치 않소. 휴전합시다.”"))), buttons: [{ label: "거절", value: false }, { label: "평화 수락", cls: "gold", value: true }] });
      if (ok) { E.makePeace(C, ev.a, C.player); SFX.play("peace"); log(`${josa(on.name, "과", "와")} 휴전했다`, "good"); }
    }
    C.pendingOffers = [];
    $("#endTurn").disabled = false;
    busy = false;
    toast(`${C.turn}턴`, 900);
    if (after < before && !anim) log(`영토 ${before - after}곳을 잃었다`, "war");
    Save.saveCampaign(C);
    checkEnd();
  }

  function checkEnd() {
    const st = E.status(C);
    if (st && finish) { const f = finish; finish = null; phase = "over"; f({ type: st }); }
  }

  // ---------- 시작(색칠) 단계 ----------
  function startSetup(opt) {
    phase = "setup";
    const bar = $("#setupBar"); bar.hidden = false;
    const custom = !!opt.custom;
    setupState = { color: opt.color || NATION_COLORS[1], pid: custom ? -1 : me().capital, painted: false, custom };
    const render = () => {
      bar.innerHTML = "";
      const sw = h("div", { class: "swatches" }, NATION_COLORS.map((c) => h("button", { class: "sw" + (setupState.color === c ? " on" : ""), style: `background:${c}`, "aria-label": "색 " + c, onclick: () => { setupState.color = c; SFX.play("click"); if (setupState.painted) paintNow(); render(); } })));
      const ci = setupState.pid >= 0 ? P[setupState.pid].country : -1;
      bar.append(
        h("h2", {}, setupState.painted ? `${me().name}, 출정 준비 완료` : custom ? "시작할 나라를 지도에서 고르세요" : "깃발 색을 고르고 땅을 칠하세요"),
        h("div", { class: "muted", style: "margin-top:4px" }, custom ? (ci >= 0 ? `선택: ${MAPDATA.countries[ci].ko} (영토 ${P.filter((p) => p.country === ci).length}곳)` : "작은 나라일수록 어렵지만 정복의 맛이 있습니다") : `${MAPDATA.countries[P[me().capital].country].ko}에서 시작합니다`),
        sw,
        h("div", { class: "row", style: "justify-content:center" },
          h("button", { class: "btn", disabled: setupState.pid < 0, onclick: () => paintNow() }, setupState.painted ? "다시 칠하기" : "이 땅을 칠하기"),
          h("button", { class: "btn gold", disabled: !setupState.painted, onclick: () => go() }, "출정!")));
    };
    const paintNow = () => {
      if (setupState.pid < 0) return;
      if (custom) {
        // 선택한 나라를 플레이어 나라로 교체
        C = E.newCampaign(Object.assign({}, opt, { startProv: setupState.pid, color: setupState.color }));
      } else me().color = setupState.color;
      setupState.painted = true;
      SFX.play("paint");
      repaint(setupState.pid, 900, 260);
      WorldView.focusProv(setupState.pid, 2.2, 700);
      render(); renderTop();
    };
    const go = () => {
      bar.hidden = true; phase = "play";
      $("#mapHud").hidden = false;
      SFX.play("fanfare");
      renderTop(); select(me().capital);
      log(`${me().rulerName}의 원정이 시작되었다! 목표: ${E.goal(C).name} (${E.goalCount(C)}곳)`, "gold");
      Save.saveCampaign(C);
      opt.onStart && opt.onStart();
      setupState.resolve && setupState.resolve();
    };
    setupState.click = (pid) => {
      if (pid < 0) return;
      if (custom) { setupState.pid = pid; setupState.painted = false; SFX.play("select"); sel = -1; render(); updSetupTargets(); }
      else if (P[pid].country === P[me().capital].country) { paintNow(); }
    };
    function updSetupTargets() {
      targets = new Map();
      if (setupState.pid >= 0) { const ci = P[setupState.pid].country; P.forEach((p) => { if (p.country === ci) targets.set(p.id, "#fff6c8"); }); }
      else if (!custom) P.forEach((p) => { if (C.prov[p.id].o === C.player) targets.set(p.id, "#fff6c8"); });
    }
    updSetupTargets();
    render();
    return new Promise((res) => (setupState.resolve = res));
  }

  // ---------- 입력 ----------
  function onClick(sx, sy) {
    const pid = WorldView.provAtScreen(sx, sy);
    if (phase === "setup") { setupState.click(pid); return; }
    if (phase !== "play" || busy) return;
    if (pid < 0) { sel = -1; updTargets(); renderPanel(); return; }
    if (targeting) { applyItemTarget(pid); return; }
    // 선택된 내 영토에서 인접 영토 클릭 → 이동/공격
    if (sel >= 0 && pid !== sel && C.prov[sel].o === C.player && C.prov[sel].r > 0 && P[sel].nb.includes(pid)) {
      const o = C.prov[pid].o;
      if (o === C.player || E.atWar(C, C.player, o)) { doMove(sel, pid); return; }
      SFX.play("select"); select(pid); return;
    }
    SFX.play("select"); select(pid);
  }
  function onHover(sx, sy) {
    hoverP = WorldView.provAtScreen(sx, sy);
    const tt = $("#tooltip");
    if (hoverP < 0 || !C) { tt.hidden = true; return; }
    const s = C.prov[hoverP], on = N(s.o);
    tt.textContent = `${P[hoverP].name} · ${on.name} · 병력 ${fmtN(s.t)}`;
    tt.style.left = sx + 14 + "px"; tt.style.top = sy + 12 + "px"; tt.hidden = false;
    const r = tt.getBoundingClientRect(); if (r.right > innerWidth - 8) tt.style.left = sx - r.width - 10 + "px";
  }

  // ---------- 진입 ----------
  function attachHud(onMenu) {
    $("#endTurn").onclick = endTurn;
    $("#btnMenu").onclick = onMenu;
    $("#btnZoomIn").onclick = () => { WorldView.flyTo(WorldView.cam.x, WorldView.cam.y, WorldView.cam.z * 1.5, 250); };
    $("#btnZoomOut").onclick = () => { WorldView.flyTo(WorldView.cam.x, WorldView.cam.y, WorldView.cam.z / 1.5, 250); };
    $("#btnHome").onclick = () => { WorldView.focusProv(me().capital, Math.max(1.6, WorldView.cam.z), 500); select(me().capital); };
  }
  // opt: 새 캠페인이면 시작 옵션, 아니면 null
  async function run(campaign, opt, onMenu) {
    C = campaign; sel = -1; targeting = null; busy = false; phase = "play";
    $("#log").innerHTML = "";
    (C.log || []).slice(0, 5).reverse().forEach((l) => log(l.text, l.cls));
    attachHud(onMenu);
    repaint();
    const endP = new Promise((res) => (finish = res));
    if (opt) {
      $("#mapHud").hidden = true;
      await startSetup(opt);
    } else {
      $("#mapHud").hidden = false; renderTop(); select(me().capital);
    }
    return endP;
  }
  function stop() { finish = null; phase = "over"; $("#mapHud").hidden = true; $("#setupBar").hidden = true; $("#ppanel").hidden = true; $("#tooltip").hidden = true; setHint(null); }
  function quit(type) { if (finish) { const f = finish; finish = null; phase = "over"; f({ type }); } }

  return {
    run, stop, quit, onClick, onHover, endTurn,
    get C() { return C; }, get state() { return { C, sel, targets, hover: hoverP }; }, get phase() { return phase; }, get busy() { return busy; },
    escape() { if (targeting) { targeting = null; setHint(null); renderBag(); updTargets(); return true; } if (sel >= 0) { sel = -1; updTargets(); renderPanel(); return true; } return false; },
  };
})();
