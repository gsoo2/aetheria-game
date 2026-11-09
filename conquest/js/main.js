// 장면 관리: 타이틀 → 성 → 군주 선택 → (그림 속으로) 지도 → 귀환
"use strict";
(() => {
  const cv = $("#cv"), ctx = cv.getContext("2d");
  let scene = "title", CW = 0, CH = 0;
  WorldView.init();
  paintIcons();

  // ---------- 성 상호작용 ----------
  const L = (who, text, extra) => Object.assign({ who, text }, extra || {});
  const meLook = () => Castle.NPC_LOOKS.me;
  const handlers = {
    advisor: () => advisorTalk(),
    painting: () => paintingTalk(),
    merchant: async () => { await Dialog.say([L("merchant", "어서 오세요, 시간의 군주님! 시대 너머에서 건져 올린 물건들이랍니다.")]); await openShop(updateCastleHud); },
    chest: async () => { SFX.play("coin"); await openTreasury(updateCastleHud); },
    knight: async () => {
      const r = Save.meta().records;
      await Dialog.say([L("knight", r.wins + r.losses + r.retreats ? `지금까지 ${r.wins}번 승리하고, ${r.losses}번 패배하셨습니다. 기록을 보시겠습니까?` : "폐하의 원정은 모두 제가 기록합니다. 아직 첫 장이 비어 있군요!")]);
      await openRecords();
    },
    book: () => Dialog.say(HOWTO.map((t) => L("advisor", t, { name: "전략서" }))),
    throne: () => Dialog.say([{ look: meLook(), name: "나", text: "시간의 왕좌다. 세계를 칠하고 돌아올 때마다 이 성은 더 빛나겠지." }]),
  };
  const HOWTO = [
    "지도에서 내 영토를 누르면 패널이 열립니다. 녹색으로 빛나는 땅은 이동, 빨간 땅은 공격 대상입니다.",
    "회색으로 빛나는 이웃 땅을 공격하려면 먼저 그 나라에 선전포고해야 합니다. 그 땅을 누르면 패널에 버튼이 있습니다.",
    "징병한 병력은 다음 턴부터 움직입니다. 금과 인력은 턴이 끝날 때마다 영토에서 들어옵니다. 병력이 많을수록 유지비도 큽니다.",
    "개발은 세수와 인력을, 요새는 방어를 높입니다. 점선은 바다 항로이며, 바다를 건너 공격하면 공격력이 25% 줄어듭니다.",
    "수도를 빼앗으면 상대 국고의 일부를 약탈합니다. 목표한 영토 수를 채우면 승리하고, 금화를 들고 이 성으로 돌아옵니다.",
  ];

  async function advisorTalk() {
    Castle.frozen = true;
    const saved = Save.campaign();
    const choices = saved
      ? [{ label: "원정을 이어가겠다", value: "continue" }, { label: "새 원정을 떠나겠다 (지금 원정 포기)", value: "new" }, { label: "전략을 알려 주게", value: "howto" }, { label: "아무것도 아닐세", value: "__stop" }]
      : [{ label: "세계로 출정하겠다", value: "new" }, { label: "전략을 알려 주게", value: "howto" }, { label: "아무것도 아닐세", value: "__stop" }];
    const c = await Dialog.say([L("advisor", saved ? `폐하, ${saved.nations[saved.player].name}의 원정이 ${saved.turn}턴째 멈춰 있습니다. 어찌하시겠습니까?` : "폐하, 세계지도가 새 주인을 기다리고 있습니다. 어찌하시겠습니까?", { choices })]);
    if (c === "howto") { await Dialog.say(HOWTO.map((t) => L("advisor", t))); Castle.frozen = false; return; }
    if (c === "continue") return continueCampaign();
    if (c === "new") {
      if (saved) {
        const ok = await Dialog.say([L("advisor", "지금 원정을 포기하면 일부 보상만 받고 기록이 닫힙니다. 정말입니까?", { choices: [{ label: "그래, 새로 시작하지", value: true }, { label: "아니, 그만두지", value: false }] })]);
        if (!ok) { Castle.frozen = false; return; }
        settle(saved, "retreat", true);
      }
      return newCampaignFlow();
    }
    Castle.frozen = false;
  }
  async function paintingTalk() {
    Castle.frozen = true;
    const saved = Save.campaign();
    const c = await Dialog.say([{ look: meLook(), name: "나", text: saved ? "그림 속 세계에서 내 깃발이 기다리고 있다…" : "세계지도가 희미하게 빛나고 있다. 손을 대면 빨려 들어갈 것 같다.", choices: saved ? [{ label: "원정을 이어간다", value: "continue" }, { label: "그만둔다", value: "__stop" }] : [{ label: "누구의 운명을 이을지 고른다", value: "new" }, { label: "그만둔다", value: "__stop" }] }]);
    if (c === "continue") return continueCampaign();
    if (c === "new") return newCampaignFlow();
    Castle.frozen = false;
  }

  // ---------- 원정 흐름 ----------
  async function newCampaignFlow() {
    Castle.frozen = true;
    $("#castleHud").hidden = true; $("#hint").hidden = true;
    const pick = await openSelect();
    if (!pick) { enterCastleUi(); return; }
    const meta = Save.meta();
    let look, name;
    if (pick.custom) { look = pick.custom.look; name = `${pick.custom.title} ${pick.custom.name}`; }
    else { const r = RULERS.find((x) => x.id === pick.rulerId); look = r.look; name = r.name; }
    const quote = pick.custom ? "오늘부터 이 세계에 새로운 이름이 새겨진다." : RULERS.find((x) => x.id === pick.rulerId).quote;
    await Dialog.say([
      { look, name, text: quote, bg: "#2d2551" },
      L("advisor", "운명이 이어졌습니다. 자, 그림 속으로 들어가시지요!"),
    ]);
    const opt = { goalId: pick.goalId, diffId: pick.diffId, relics: meta.equipped.slice(), bag: Object.assign({}, meta.bag) };
    if (pick.custom) opt.custom = pick.custom; else { opt.rulerId = pick.rulerId; opt.color = pick.color; }
    // 가방은 실제로 출정할 때 비운다 (색칠 단계에서 새로고침해도 아이템이 사라지지 않게)
    opt.onStart = () => { meta.bag = {}; Save.saveMeta(); };
    let C;
    if (pick.custom) {
      // 미리보기 캠페인: 아직 플레이어 나라가 없다
      C = Engine.newCampaign({ rulerId: "sejong", goalId: opt.goalId, diffId: opt.diffId });
      C.nations[C.player].player = false; C.player = -1;
    } else C = Engine.newCampaign(opt);
    await diveIntoMap(C, pick.custom ? null : C.nations[C.player].capital);
    const res = await Play.run(C, opt, openMapMenu);
    await afterCampaign(res);
  }
  async function continueCampaign() {
    const C = Save.campaign();
    if (!C) { Castle.frozen = false; return; }
    $("#castleHud").hidden = true; $("#hint").hidden = true;
    await diveIntoMap(C, C.nations[C.player].capital);
    const res = await Play.run(C, null, openMapMenu);
    await afterCampaign(res);
  }
  async function diveIntoMap(C, focusPid) {
    Castle.frozen = true;
    await Castle.zoomIntoPainting(1000);
    Fade.flash({ dur: 700 });
    scene = "map"; SFX.bgm("map");
    Castle.resetZoom();
    WorldView.setOwners(Engine.P.map((p) => C.nations[C.prov[p.id].o].color), Engine.P.map((p) => C.prov[p.id].o));
    const [x, y] = focusPid != null ? WorldView.labelPos(focusPid) : [WorldView.BW * 0.55, WorldView.BH * 0.42];
    WorldView.cam.x = x; WorldView.cam.y = y; WorldView.cam.z = 7;
    setTimeout(() => WorldView.flyTo(x, y, focusPid != null ? 1.5 : 0.6, 1500), 30);
  }
  async function afterCampaign(res) {
    const C = Play.C;
    if (res.type === "castle") { Play.stop(); await backToCastle(); Dialog.say([L("advisor", "원정은 그대로 보존해 두었습니다. 언제든 그림 속으로 돌아가실 수 있습니다.")]); return; }
    const reward = settle(C, res.type);
    const n = C.nations[C.player];
    const title = res.type === "win" ? "승리!" : res.type === "lose" ? "패배…" : "귀환";
    if (res.type === "win") SFX.play("fanfare"); else if (res.type === "lose") SFX.play("lose");
    await modal({
      title, cls: "",
      body: h("div", { class: "col" },
        h("div", { class: "row" }, n.look ? portraitEl(n.look, 3, shade(n.color, -0.45)) : null, h("div", { class: "col", style: "gap:4px;flex:1;min-width:0" },
          h("h2", {}, res.type === "win" ? `${n.name}, ${Engine.goal(C).name} 달성!` : res.type === "lose" ? `${josa(n.name, "이", "가")} 무너졌습니다` : `${n.name}의 원정을 마칩니다`),
          h("span", { class: "muted" }, `${C.turn}턴 · 최대 영토 ${C.stats.peak}곳 · 전투 ${C.stats.won}승 ${C.stats.lost}패 · 점령 ${C.stats.taken}곳`))),
        h("div", { class: "row" }, iconEl("gold", 3), h("h2", { class: "gold-t" }, `왕실 금화 +${fmtN(reward)}`)),
        h("div", { class: "muted" }, "남은 소모품은 보물창고로 돌아갑니다. 금화로 새 유물을 사서 다음 원정을 준비하세요.")),
      buttons: [{ label: "성으로 돌아가기", cls: "gold", value: 1 }],
    });
    Play.stop();
    await WorldView.flyTo(WorldView.BW / 2, WorldView.BH / 2, 0.45, 900);
    await backToCastle();
    const meta = Save.meta();
    await Dialog.say([L("advisor", res.type === "win" ? `대단하십니다, 폐하! 금화 ${fmtN(reward)}닢을 가지고 돌아오셨군요. 이제 왕실 금고는 ${fmtN(meta.gold)}닢입니다.` : `무사히 돌아오셔서 다행입니다. 금화 ${fmtN(reward)}닢을 건지셨습니다. 상인 미라에게 들러 보시지요.`)]);
  }
  // 보상 정산 (캠페인 종료)
  function settle(C, type, silent) {
    const meta = Save.meta();
    const reward = Engine.reward(C, type);
    meta.gold += reward;
    for (const id in C.bag) if (C.bag[id] > 0) meta.bag[id] = (meta.bag[id] || 0) + C.bag[id];
    const n = C.nations[C.player];
    meta.records[type === "win" ? "wins" : type === "lose" ? "losses" : "retreats"]++;
    meta.records.history.push({ ruler: `${n.rulerName} (${n.name})`, look: n.look, goal: Engine.goal(C).name, result: type === "win" ? "승리" : type === "lose" ? "패배" : "귀환", turn: C.turn, prov: Engine.countOwned(C, C.player), reward });
    if (meta.records.history.length > 30) meta.records.history.shift();
    Save.saveMeta(); Save.clearCampaign();
    updateCastleHud();
    return reward;
  }
  async function backToCastle() {
    Fade.flash({ dur: 600 });
    scene = "castle"; SFX.bgm("castle");
    Castle.placePlayer(86, 62, 0);
    await Castle.zoomOutOfPainting(1000);
    enterCastleUi();
  }
  async function openMapMenu() {
    if (Play.busy) return;
    SFX.play("click");
    const v = await modal({
      title: "원정 메뉴",
      body: h("div", { class: "col" }, h("div", { class: "muted", style: "line-height:1.6" }, "원정은 턴마다 자동 저장됩니다. 성으로 돌아가도 나중에 이어서 할 수 있어요."),
        h("button", { class: "btn", onclick: () => { const m = SFX.toggle(); toast(m ? "소리 꺼짐" : "소리 켜짐"); } }, "소리 켜기/끄기"),
        h("button", { class: "btn", onclick: (e) => { e.target.closest(".modal-bg").remove(); Dialog.say(HOWTO.map((t) => L("advisor", t))); } }, "전략 다시 보기")),
      buttons: [{ label: "계속하기", value: null }, { label: "원정 포기 (보상 일부)", cls: "red", value: "retreat" }, { label: "성으로 돌아가기", cls: "gold", value: "castle" }],
    });
    if (v === "castle") Play.quit("castle");
    if (v === "retreat") {
      const ok = await modal({ title: "원정 포기", body: h("div", { style: "line-height:1.6" }, `지금 귀환하면 금화 약 ${fmtN(Engine.reward(Play.C, "retreat"))}닢을 받고 이 원정은 끝납니다.`), buttons: [{ label: "취소", value: false }, { label: "귀환한다", cls: "red", value: true }] });
      if (ok) Play.quit("retreat");
    }
  }

  // ---------- 성 UI ----------
  function updateCastleHud() {
    const meta = Save.meta();
    $("#hudGold").textContent = fmtN(meta.gold);
    const r = $("#hudRelics"); r.innerHTML = "";
    if (meta.equipped.length) meta.equipped.forEach((id) => r.append(h("span", { title: ITEMS[id].name + ": " + ITEMS[id].desc }, iconEl(ITEMS[id].icon, 2))));
    else r.append(h("span", { class: "muted" }, "유물 없음"));
    r.hidden = false;
  }
  function enterCastleUi() {
    $("#castleHud").hidden = false; updateCastleHud();
    Castle.frozen = false;
  }
  async function enterCastle() {
    $("#title").hidden = true;
    if (document.activeElement) document.activeElement.blur();
    scene = "castle"; SFX.bgm("castle");
    Castle.placePlayer(160, 156, 1);
    enterCastleUi();
    await Fade.open({ dur: 700 });
    const meta = Save.meta();
    if (!meta.intro) {
      Castle.frozen = true;
      await Dialog.say([
        L("advisor", "오오, 드디어 깨어나셨군요, 시간의 군주시여!"),
        L("advisor", "이곳은 모든 시대의 틈에 떠 있는 ‘시간의 성’입니다. 저는 재상 오르벤이라 하옵니다."),
        L("advisor", "저 벽의 세계지도가 보이십니까? 그림 속으로 들어가면 역사 속 위대한 군주의 운명을 이어받거나, 새 군주가 되어 세계를 다툴 수 있습니다."),
        L("advisor", "땅을 칠하고, 병력을 길러, 이웃을 정복하십시오. 목표를 이루면 금화를 들고 이 성으로 돌아오게 됩니다."),
        L("advisor", "금화로는 상인 미라에게서 전쟁 도구와 유물을 살 수 있지요. 준비되시면 제게 말을 거시거나 지도 그림에 다가가십시오."),
        { look: meLook(), name: "나", text: "좋아. 세계를 내 색으로 칠하러 가 볼까." },
      ]);
      meta.intro = true; Save.saveMeta();
      Castle.frozen = false;
    }
  }

  // ---------- 타이틀 ----------
  const sndBtns = [$("#btnSound"), $("#btnSound2")];
  const updSnd = () => sndBtns.forEach((b) => (b.textContent = SFX.muted ? "소리: 꺼짐" : "소리: 켜짐"));
  updSnd();
  sndBtns.forEach((b) => (b.onclick = () => { SFX.unlock(); SFX.toggle(); updSnd(); SFX.play("click"); }));
  $("#btnStart").onclick = async () => {
    SFX.unlock(); SFX.play("select");
    await Fade.close({ dur: 500 });
    enterCastle();
  };
  Castle.setup(handlers);

  // ---------- 입력 ----------
  const ptrs = new Map();
  let drag = null, pinch = null;
  cv.addEventListener("pointerdown", (e) => {
    SFX.unlock();
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && scene === "map") {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: WorldView.cam.z }; drag = null; return;
    }
    drag = { x: e.clientX, y: e.clientY, cx: WorldView.cam.x, cy: WorldView.cam.y, moved: false };
  });
  cv.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (scene === "map") {
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        WorldView.cam.z = pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.d);
        return;
      }
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) { WorldView.cam.x = drag.cx - dx / WorldView.cam.z; WorldView.cam.y = drag.cy - dy / WorldView.cam.z; $("#tooltip").hidden = true; }
      } else if (e.pointerType === "mouse" && !modalOpen()) Play.onHover(e.clientX, e.clientY);
    } else if (scene === "castle") {
      cv.style.cursor = Castle.hover(e.clientX, e.clientY, CW, CH) ? "pointer" : "default";
    }
  });
  const endPtr = (e) => {
    ptrs.delete(e.pointerId);
    if (pinch) { if (ptrs.size < 2) { pinch = null; drag = null; } return; }
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved) return;
    if (Dialog.open) { Dialog.next(); return; }
    if (modalOpen()) return;
    if (scene === "castle") Castle.click(e.clientX, e.clientY, CW, CH);
    else if (scene === "map") Play.onClick(e.clientX, e.clientY);
  };
  cv.addEventListener("pointerup", endPtr);
  cv.addEventListener("pointercancel", (e) => { ptrs.delete(e.pointerId); drag = null; pinch = null; });
  cv.addEventListener("wheel", (e) => {
    if (scene !== "map") return;
    e.preventDefault();
    const [wx, wy] = WorldView.toWorld(e.clientX, e.clientY);
    const z0 = WorldView.cam.z, z1 = Math.max(0.35, Math.min(6, z0 * Math.pow(1.0015, -e.deltaY)));
    WorldView.cam.z = z1;
    WorldView.cam.x = wx - (e.clientX - CW / 2) / z1; WorldView.cam.y = wy - (e.clientY - CH / 2) / z1;
  }, { passive: false });
  addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const k = e.key;
    if (k === " " || k === "Enter") {
      if (Dialog.open) { e.preventDefault(); Dialog.next(); return; }
      if (modalOpen() || document.activeElement && document.activeElement.tagName === "BUTTON") return;
      if (scene === "castle") { e.preventDefault(); Castle.interactNear(onInteract); return; }
    }
    if (k === "Escape") {
      const m = $("#modalRoot").lastElementChild; if (m) { m.remove(); return; }
      if (scene === "map") Play.escape();
    }
    if (scene === "castle" && !modalOpen() && !Dialog.open) { Castle.onKey(e, true); if (k.startsWith("Arrow")) e.preventDefault(); }
  });
  addEventListener("keyup", (e) => Castle.onKey(e, false));
  addEventListener("blur", () => ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].forEach((k) => Castle.onKey({ key: k }, false)));
  async function onInteract(ent) {
    if (!ent.act || Castle.frozen || Dialog.open || modalOpen()) return;
    Castle.frozen = true;
    try { await ent.act(); } finally { if (scene === "castle" && !$("#castleHud").hidden) Castle.frozen = false; }
  }

  // ---------- 루프 ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const w = cv.clientWidth, hh = cv.clientHeight;
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    CW = w; CH = hh;
    if (scene === "title") drawTitle(now);
    else if (scene === "castle") {
      Castle.update(dt, onInteract);
      const tgt = Castle.draw(ctx, w, hh, now);
      const hint = $("#hint");
      if (!Castle.frozen && !Dialog.open && !modalOpen()) { hint.hidden = false; hint.textContent = tgt ? `Space / 클릭: ${tgt.label}` : "방향키·WASD 또는 클릭으로 이동"; }
      else hint.hidden = true;
    } else if (scene === "map") {
      const st = Play.state;
      WorldView.draw(ctx, w, hh, now, { C: st.C, sel: st.sel, targets: st.targets, hover: st.hover });
    }
    Fade.draw(now);
    requestAnimationFrame(frame);
  }
  // 타이틀 배경: 천천히 흐르는 세계 지도
  const titleC = (() => {
    const C = Engine.newCampaign({ rulerId: "sejong", goalId: "empire", diffId: "normal" });
    WorldView.setOwners(Engine.P.map((p) => C.nations[C.prov[p.id].o].color), Engine.P.map((p) => C.prov[p.id].o));
    WorldView.cam.z = 1.1; WorldView.cam.y = WorldView.BH * 0.4;
    return C;
  })();
  function drawTitle(now) {
    WorldView.cam.x = WorldView.BW / 2 + Math.sin(now / 24000) * WorldView.BW * 0.3;
    WorldView.draw(ctx, CW, CH, now, { C: null });
    ctx.fillStyle = "rgba(12,9,30,.55)"; ctx.fillRect(0, 0, CW, CH);
  }
  requestAnimationFrame(frame);
})();
