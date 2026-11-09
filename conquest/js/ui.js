// 화면 UI: 대화, 모달, 상점, 보물창고, 기록, 군주 선택/창조, 화면 전환 효과
"use strict";
const $ = (s) => document.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (k === "class") e.className = v; else if (k === "style") e.style.cssText = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return e;
}
const fmtN = (n) => Math.round(n).toLocaleString("ko-KR");
// 받침에 따라 조사 선택: josa("벨기에", "이", "가") → "벨기에가"
function josa(w, withB, noB) {
  const ch = String(w).trim().slice(-1), c = ch.charCodeAt(0) - 0xac00;
  const has = c >= 0 && c < 11172 ? c % 28 !== 0 : /[0-9LMNRlmnr]$/.test(ch);
  return w + (has ? withB : noB);
}

// ---------------- 저장 ----------------
const Save = (() => {
  const KM = "dotEmpire.meta.v1", KC = "dotEmpire.campaign.v1";
  const def = () => ({ gold: 300, bag: { horn: 1, chest: 1 }, relics: [], equipped: [], unlocked: RULERS.filter((r) => !r.locked).map((r) => r.id), records: { wins: 0, losses: 0, retreats: 0, history: [] }, intro: false });
  let mem = null, memC = null;
  return {
    meta() {
      if (mem) return mem;
      try { const s = localStorage.getItem(KM); mem = s ? Object.assign(def(), JSON.parse(s)) : def(); } catch (e) { mem = def(); }
      return mem;
    },
    saveMeta() { try { localStorage.setItem(KM, JSON.stringify(mem)); } catch (e) {} },
    campaign() { if (memC) return memC; try { const s = localStorage.getItem(KC); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    saveCampaign(C) { memC = C; try { localStorage.setItem(KC, JSON.stringify(C)); } catch (e) {} },
    clearCampaign() { memC = null; try { localStorage.removeItem(KC); } catch (e) {} },
  };
})();

// ---------------- 화면 전환 ----------------
const Fade = (() => {
  const cv = $("#fade"), g = cv.getContext("2d");
  let st = null;
  function run(mode, opts = {}) { return new Promise((res) => { st = Object.assign({ mode, t0: performance.now(), dur: 600, res }, opts); }); }
  function draw(now) {
    const w = cv.clientWidth, hh = cv.clientHeight;
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    g.clearRect(0, 0, w, hh);
    if (!st) return;
    const k = Math.min(1, (now - st.t0) / st.dur);
    const cx = st.cx != null ? st.cx : w / 2, cy = st.cy != null ? st.cy : hh / 2;
    const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, hh - cy)) + 10;
    if (st.mode === "close" || st.mode === "open") {
      const r = st.mode === "close" ? R * (1 - k) : R * k;
      g.fillStyle = "#07051a"; g.beginPath(); g.rect(0, 0, w, hh);
      // 도트 느낌의 계단식 원
      g.moveTo(cx + r, cy); g.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true); g.fill("evenodd");
      if (st.mode === "open" && k >= 1) { const r2 = st.res; st = null; r2(); return; }
      if (st.mode === "close" && k >= 1) { st.hold = true; const r2 = st.res; st.res = null; r2 && r2(); }
    } else if (st.mode === "flash") {
      g.fillStyle = `rgba(255,252,235,${1 - k})`; g.fillRect(0, 0, w, hh);
      if (k >= 1) { const r2 = st.res; st = null; r2(); }
    } else if (st.mode === "black") { g.fillStyle = "#07051a"; g.fillRect(0, 0, w, hh); if (st.res) { const r2 = st.res; st.res = null; r2(); } }
  }
  return { close: (o) => run("close", o), open: (o) => run("open", o), flash: (o) => run("flash", o), black: () => run("black"), draw, clear() { st = null; } };
})();

// ---------------- 토스트 ----------------
let _toastT = 0;
function toast(text, ms = 1400, color) {
  const t = $("#toast"); t.textContent = text; t.style.color = color || ""; t.hidden = false;
  clearTimeout(_toastT); _toastT = setTimeout(() => (t.hidden = true), ms);
}

// ---------------- 대화 ----------------
const Dialog = (() => {
  const box = $("#dialog"), nm = $("#dlgName"), tx = $("#dlgText"), ch = $("#dlgChoices"), more = $("#dlgMore"), pc = $("#dlgPortrait");
  const pg = pc.getContext("2d"); pg.imageSmoothingEnabled = false;
  let typing = null, advance = null;
  function setPortrait(look, bg) { pg.clearRect(0, 0, 128, 128); pg.drawImage(portraitCanvas(look, 4, bg || "#2d2551"), 0, 0); }
  async function say(lines) {
    box.hidden = false;
    let result = null;
    for (const L of lines) {
      setPortrait(L.look || Castle.NPC_LOOKS[L.who] || Castle.NPC_LOOKS.advisor, L.bg);
      nm.textContent = L.name || (Castle.NPCS[L.who] && Castle.NPCS[L.who].name) || "";
      ch.innerHTML = ""; more.hidden = true;
      await typeText(L.text);
      if (L.choices) {
        result = await new Promise((res) => {
          L.choices.forEach((c, i) => ch.append(h("button", { class: "btn" + (i === 0 ? " gold" : ""), onclick: (e) => { e.stopPropagation(); SFX.play("select"); res(c.value); } }, c.label)));
          const f = ch.querySelector("button"); f && f.focus({ preventScroll: true });
        });
        ch.innerHTML = "";
        if (result === "__stop") break;
      } else {
        more.hidden = false;
        await new Promise((res) => (advance = res));
        advance = null;
      }
    }
    box.hidden = true;
    return result;
  }
  function typeText(t) {
    return new Promise((res) => {
      tx.textContent = ""; let i = 0;
      const step = () => {
        if (i >= t.length) { typing = null; res(); return; }
        tx.textContent += t[i++]; if (i % 2 === 0) SFX.play("text");
        typing = setTimeout(step, 22);
      };
      typing = setTimeout(step, 22);
      typingFinish = () => { clearTimeout(typing); tx.textContent = t; typing = null; res(); };
    });
  }
  let typingFinish = null;
  function next() {
    if (box.hidden) return false;
    if (typing) { typingFinish && typingFinish(); return true; }
    if (advance) { SFX.play("click"); advance(); return true; }
    return true;
  }
  box.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; next(); });
  return { say, next, get open() { return !box.hidden; } };
})();

// ---------------- 모달 ----------------
function modal({ title, body, buttons = [{ label: "닫기", value: null }], cls = "", onRender }) {
  return new Promise((res) => {
    const root = $("#modalRoot");
    const close = (v) => { bg.remove(); res(v); };
    const head = h("div", { class: "head" }, h("h2", {}, title || ""), h("button", { class: "btn small", onclick: () => { SFX.play("click"); close(null); }, "aria-label": "닫기" }, "✕"));
    const foot = h("div", { class: "row", style: "justify-content:flex-end;margin-top:14px" }, buttons.map((b) => h("button", { class: "btn " + (b.cls || ""), onclick: () => { SFX.play("click"); close(b.value); } }, b.label)));
    const m = h("div", { class: "win modal " + cls }, head, body, buttons.length ? foot : null);
    const bg = h("div", { class: "modal-bg", onpointerdown: (e) => { if (e.target === bg) close(null); } }, m);
    root.append(bg);
    onRender && onRender(m, close);
  });
}
const modalOpen = () => $("#modalRoot").children.length > 0;

function iconEl(name, scale = 3) { const c = iconCanvas(name, scale); const e = h("canvas", { class: "px", width: c.width, height: c.height }); e.getContext("2d").drawImage(c, 0, 0); return e; }
function portraitEl(look, scale = 2, bg) { const c = portraitCanvas(look, scale, bg); const e = h("canvas", { class: "px", width: c.width, height: c.height }); e.getContext("2d").drawImage(c, 0, 0); return e; }
function paintIcons(root = document) { root.querySelectorAll("canvas[data-icon]").forEach((c) => { const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(iconCanvas(c.dataset.icon, 3), 0, 0, c.width, c.height); }); }

// ---------------- 상점 ----------------
function openShop(onChange) {
  const meta = Save.meta();
  let tab = "use";
  const body = h("div");
  const render = () => {
    body.innerHTML = "";
    body.append(h("div", { class: "row", style: "justify-content:space-between;margin-bottom:10px" },
      h("div", { class: "tabs" }, [["use", "소모품"], ["relic", "유물"]].map(([k, l]) => h("button", { class: "btn small" + (tab === k ? " on" : ""), onclick: () => { tab = k; SFX.play("click"); render(); } }, l))),
      h("span", { class: "chip" }, iconEl("gold", 2), h("b", { class: "num" }, fmtN(meta.gold)))));
    body.append(h("div", { class: "muted", style: "margin-bottom:8px" }, tab === "use" ? "소모품은 다음 원정에 모두 가져가 지도 아래 가방에서 한 번씩 씁니다." : `유물은 보물창고에서 최대 ${MAX_RELICS}개까지 장착하면 원정 내내 효과가 이어집니다.`));
    const grid = h("div", { class: "grid-items" });
    for (const id in ITEMS) {
      const it = ITEMS[id]; if (it.kind !== tab) continue;
      const owned = it.kind === "relic" ? meta.relics.includes(id) : meta.bag[id] || 0;
      const can = meta.gold >= it.price && !(it.kind === "relic" && owned);
      grid.append(h("div", { class: "item" }, iconEl(it.icon, 3), h("div", { class: "info" },
        h("span", { class: "nm" }, it.name), h("span", { class: "ds" }, it.desc),
        h("div", { class: "row", style: "justify-content:space-between" },
          h("span", { class: "gold-t num" }, fmtN(it.price) + " G"),
          it.kind === "relic" && owned ? h("span", { class: "muted" }, "보유 중") :
            h("button", { class: "btn small gold", disabled: !can, onclick: () => buy(id) }, "구입" + (it.kind === "use" && owned ? ` (${owned})` : ""))))));
    }
    body.append(grid);
  };
  const buy = (id) => {
    const it = ITEMS[id]; if (meta.gold < it.price) { SFX.play("error"); return; }
    meta.gold -= it.price;
    if (it.kind === "relic") { meta.relics.push(id); if (meta.equipped.length < MAX_RELICS) meta.equipped.push(id); }
    else meta.bag[id] = (meta.bag[id] || 0) + 1;
    Save.saveMeta(); SFX.play("buy"); render(); onChange && onChange();
  };
  render();
  return modal({ title: "미라의 떠돌이 상점", body, buttons: [] });
}

// ---------------- 보물창고 ----------------
function openTreasury(onChange) {
  const meta = Save.meta();
  const body = h("div");
  const render = () => {
    body.innerHTML = "";
    body.append(h("h3", {}, `장착한 유물 ${meta.equipped.length}/${MAX_RELICS}`));
    const g1 = h("div", { class: "grid-items", style: "margin:8px 0 14px" });
    if (!meta.relics.length) g1.append(h("div", { class: "muted" }, "아직 유물이 없습니다. 상인 미라에게서 살 수 있어요."));
    for (const id of meta.relics) {
      const it = ITEMS[id], on = meta.equipped.includes(id);
      g1.append(h("div", { class: "item" + (on ? " on" : "") }, iconEl(it.icon, 3), h("div", { class: "info" }, h("span", { class: "nm" }, it.name), h("span", { class: "ds" }, it.desc),
        h("button", { class: "btn small" + (on ? "" : " gold"), onclick: () => {
          if (on) meta.equipped = meta.equipped.filter((x) => x !== id);
          else if (meta.equipped.length < MAX_RELICS) meta.equipped.push(id); else { toast(`유물은 ${MAX_RELICS}개까지 장착할 수 있어요`); SFX.play("error"); return; }
          SFX.play("select"); Save.saveMeta(); render(); onChange && onChange();
        } }, on ? "해제" : "장착"))));
    }
    body.append(g1, h("h3", {}, "소모품 가방"));
    const g2 = h("div", { class: "grid-items", style: "margin-top:8px" });
    const ids = Object.keys(meta.bag).filter((k) => meta.bag[k] > 0);
    if (!ids.length) g2.append(h("div", { class: "muted" }, "가방이 비어 있습니다."));
    for (const id of ids) { const it = ITEMS[id]; g2.append(h("div", { class: "item" }, iconEl(it.icon, 3), h("div", { class: "info" }, h("span", { class: "nm" }, `${it.name} ×${meta.bag[id]}`), h("span", { class: "ds" }, it.desc)))); }
    body.append(g2);
  };
  render();
  return modal({ title: "왕실 보물창고", body, buttons: [] });
}

// ---------------- 기록 ----------------
function openRecords() {
  const meta = Save.meta(), r = meta.records;
  const body = h("div", { class: "col" },
    h("div", { class: "row" }, h("span", { class: "chip" }, "승리 ", h("b", { class: "gold-t" }, r.wins)), h("span", { class: "chip" }, "패배 ", h("b", { class: "red-t" }, r.losses)), h("span", { class: "chip" }, "귀환 ", h("b", {}, r.retreats))),
    h("h3", {}, "원정 연대기"),
    r.history.length ? h("div", { class: "col" }, r.history.slice(-10).reverse().map((x) => h("div", { class: "item" }, x.look ? portraitEl(x.look, 1) : null, h("div", { class: "info" },
      h("span", { class: "nm" }, `${x.ruler} — ${x.goal}`), h("span", { class: "ds" }, `${x.result} · ${x.turn}턴 · 영토 ${x.prov}곳 · 보상 ${fmtN(x.reward)} G`))))) : h("div", { class: "muted" }, "아직 기록된 원정이 없습니다."));
  return modal({ title: "기사단의 기록실", body });
}

// ---------------- 군주 선택 ----------------
function openSelect() {
  return new Promise((resolve) => {
    const meta = Save.meta();
    const sec = $("#select"), cards = $("#cards"), detail = $("#detail"), mapCv = $("#selMap");
    sec.hidden = false;
    $("#selGold").textContent = fmtN(meta.gold);
    let cur = meta.lastRuler || "sejong", goalId = meta.lastGoal || "empire", diffId = meta.lastDiff || "normal";
    const byEn = {}; MAPDATA.countries.forEach((c, i) => (byEn[c.en] = i));
    const rulerOfCountry = {}; RULERS.forEach((r) => (rulerOfCountry[byEn[r.country]] = r));
    const custom = Object.assign({ name: "", nation: "", title: "왕", traitId: "conqueror", look: { skin: 1, hair: "#1d1a1f", hairStyle: "short", hat: "crown", beard: "none", robe: "#25336b", trim: "#e2b34a", eyes: "normal" } }, meta.lastCustom || {});
    const base = document.createElement("canvas");
    WorldView.miniMap(base, (ci) => (rulerOfCountry[ci] ? shade(rulerOfCountry[ci].color, 0.15) : "#8c8a78"));
    const done = (v) => { sec.hidden = true; cancelAnimationFrame(raf); resolve(v); };
    $("#selBack").onclick = () => { SFX.play("click"); done(null); };
    let raf = 0;
    const portraits = {};
    RULERS.forEach((r) => (portraits[r.id] = portraitCanvas(r.look, 1)));
    function drawMap(now) {
      mapCv.width = base.width; mapCv.height = base.height;
      const g = mapCv.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(base, 0, 0);
      for (const r of RULERS) {
        const [x, y] = WorldView.latLonToMini(r.home[0], r.home[1]);
        const sel = r.id === cur, sz = sel ? 48 : 26, b = sel ? Math.abs(Math.sin(now / 200)) * 6 : 0;
        const locked = r.locked && !meta.unlocked.includes(r.id);
        g.fillStyle = "#09071a"; g.fillRect(Math.round(x - sz / 2 - 2), Math.round(y - sz - 8 - b), sz + 4, sz + 4);
        g.fillStyle = sel ? "#f2c14e" : r.color; g.fillRect(Math.round(x - sz / 2 - 1), Math.round(y - sz - 7 - b), sz + 2, sz + 2);
        g.globalAlpha = locked ? 0.45 : 1;
        g.drawImage(portraits[r.id], Math.round(x - sz / 2), Math.round(y - sz - 6 - b), sz, sz);
        g.globalAlpha = 1;
        g.fillStyle = sel ? "#f2c14e" : "#09071a"; g.fillRect(Math.round(x - 1), Math.round(y - 5 - b), 3, 5 + b);
      }
      if (cur === "custom") { g.fillStyle = "rgba(242,193,78,.25)"; g.fillRect(0, 0, mapCv.width, mapCv.height); }
      raf = requestAnimationFrame(drawMap);
    }
    raf = requestAnimationFrame(drawMap);
    mapCv.onclick = (e) => {
      const rc = mapCv.getBoundingClientRect(), x = ((e.clientX - rc.left) / rc.width) * mapCv.width, y = ((e.clientY - rc.top) / rc.height) * mapCv.height;
      let best = null, bd = 30 * 30;
      for (const r of RULERS) { const [px2, py2] = WorldView.latLonToMini(r.home[0], r.home[1]); const d = (px2 - x) ** 2 + (py2 - 14 - y) ** 2; if (d < bd) { bd = d; best = r; } }
      if (best) { cur = best.id; SFX.play("select"); renderCards(); renderDetail(); }
    };
    function renderCards() {
      cards.innerHTML = "";
      for (const r of RULERS) {
        const locked = r.locked && !meta.unlocked.includes(r.id);
        cards.append(h("button", { class: "card" + (cur === r.id ? " on" : "") + (locked ? " locked" : ""), onclick: () => { cur = r.id; SFX.play("select"); renderCards(); renderDetail(); } },
          portraitEl(r.look, 2, shade(r.color, -0.45)), h("span", { class: "nm" }, r.name), locked ? h("span", { class: "lock" }, fmtN(r.cost) + "G") : null));
      }
      cards.append(h("button", { class: "card" + (cur === "custom" ? " on" : ""), onclick: () => { cur = "custom"; SFX.play("select"); renderCards(); renderDetail(); } },
        portraitEl(custom.look, 2, "#3a3166"), h("span", { class: "nm" }, "새 군주 창조")));
    }
    const optRow = () => h("div", { class: "col" },
      h("div", { class: "opt" }, h("span", { class: "muted" }, "목표"), h("div", { class: "seg" }, GOALS.map((g) => h("button", { class: "btn small" + (goalId === g.id ? " on" : ""), title: g.desc, onclick: () => { goalId = g.id; SFX.play("click"); renderDetail(); } }, g.name)))),
      h("div", { class: "opt" }, h("span", { class: "muted" }, "난이도"), h("div", { class: "seg" }, DIFFICULTY.map((d) => h("button", { class: "btn small" + (diffId === d.id ? " on" : ""), onclick: () => { diffId = d.id; SFX.play("click"); renderDetail(); } }, d.name)))),
      h("div", { class: "muted" }, `${GOALS.find((g) => g.id === goalId).desc} · 승리 보상 약 ${fmtN(GOALS.find((g) => g.id === goalId).reward * DIFFICULTY.find((d) => d.id === diffId).reward)} G 이상`),
      meta.equipped.length ? h("div", { class: "row" }, h("span", { class: "muted" }, "장착 유물"), meta.equipped.map((id) => h("span", { class: "chip", title: ITEMS[id].desc }, iconEl(ITEMS[id].icon, 2), ITEMS[id].name))) : null);
    function renderDetail() {
      detail.innerHTML = "";
      if (cur === "custom") return renderCreator();
      const r = RULERS.find((x) => x.id === cur);
      const locked = r.locked && !meta.unlocked.includes(r.id);
      detail.append(
        h("div", { class: "who" }, portraitEl(r.look, 4, shade(r.color, -0.45)), h("div", { class: "col", style: "gap:4px;min-width:0" },
          h("span", { class: "muted" }, `${r.era} · ${MAPDATA.countries[byEn[r.country]].ko}`), h("h2", {}, r.name), h("span", { class: "gold-t" }, r.title),
          h("span", { style: "line-height:1.5" }, r.trait))),
        h("div", { class: "quote" }, `“${r.quote}”`),
        optRow(),
        locked
          ? h("button", { class: "btn gold", disabled: meta.gold < r.cost, onclick: () => {
              if (meta.gold < r.cost) return; meta.gold -= r.cost; meta.unlocked.push(r.id); Save.saveMeta(); SFX.play("coin"); $("#selGold").textContent = fmtN(meta.gold); renderCards(); renderDetail();
            } }, `${fmtN(r.cost)} G로 초상화 해금`)
          : h("button", { class: "btn gold", style: "font-size:14px;padding:10px", onclick: () => {
              SFX.play("select"); meta.lastRuler = cur; meta.lastGoal = goalId; meta.lastDiff = diffId; Save.saveMeta();
              done({ rulerId: r.id, goalId, diffId, color: r.color });
            } }, "이 군주로 지도 속으로"));
    }
    function cycle(label, list, get, set) {
      const idx = () => Math.max(0, list.findIndex((x) => (Array.isArray(x) ? x[0] : x) === get()));
      const val = h("span", { class: "val" });
      const show = () => { const x = list[idx()]; val.textContent = Array.isArray(x) ? x[1] : ""; if (!Array.isArray(x)) val.append(h("span", { class: "sw", style: `display:inline-block;background:${x};vertical-align:middle` })); };
      const go = (d) => { const x = list[(idx() + d + list.length) % list.length]; set(Array.isArray(x) ? x[0] : x); SFX.play("click"); show(); updPreview(); };
      show();
      return h("div", { class: "opt" }, h("span", { class: "muted" }, label), h("div", { class: "picker" }, h("button", { class: "btn small", onclick: () => go(-1), "aria-label": label + " 이전" }, "◀"), val, h("button", { class: "btn small", onclick: () => go(1), "aria-label": label + " 다음" }, "▶")));
    }
    let prevCv = null;
    function updPreview() { if (!prevCv) return; const g = prevCv.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 128, 128); g.drawImage(portraitCanvas(custom.look, 4, "#3a3166"), 0, 0); renderCardsLight(); }
    function renderCardsLight() { const last = cards.lastElementChild; if (last) { const c = last.querySelector("canvas"), g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height); g.drawImage(portraitCanvas(custom.look, 2, "#3a3166"), 0, 0); } }
    function renderCreator() {
      const L = custom.look;
      prevCv = h("canvas", { class: "px", width: 128, height: 128 });
      const nameIn = h("input", { type: "text", id: "cName", maxlength: 12, placeholder: "군주 이름 (예: 아린)", value: custom.name, oninput: (e) => (custom.name = e.target.value) });
      const natIn = h("input", { type: "text", id: "cNation", maxlength: 10, placeholder: "나라 이름 (비우면 시작 지역 이름)", value: custom.nation, oninput: (e) => (custom.nation = e.target.value) });
      ["keydown", "keyup"].forEach((ev) => { nameIn.addEventListener(ev, (e) => e.stopPropagation()); natIn.addEventListener(ev, (e) => e.stopPropagation()); });
      detail.append(
        h("div", { class: "who" }, prevCv, h("div", { class: "col", style: "gap:6px;flex:1;min-width:0" }, h("h2", {}, "새 군주 창조"), h("span", { class: "muted", style: "line-height:1.5" }, "지도에서 아무 나라나 골라 그 땅의 새 주인이 됩니다."), nameIn, natIn)),
        h("div", { class: "opt" }, h("span", { class: "muted" }, "칭호"), h("div", { class: "seg" }, CUSTOM.titles.map((t) => h("button", { class: "btn small" + (custom.title === t ? " on" : ""), onclick: () => { custom.title = t; SFX.play("click"); renderDetail(); } }, t)))),
        cycle("머리 장식", CUSTOM.hats, () => L.hat, (v) => (L.hat = v)),
        cycle("머리 모양", CUSTOM.hairStyles, () => L.hairStyle, (v) => (L.hairStyle = v)),
        cycle("머리 색", CUSTOM.hairColors, () => L.hair, (v) => (L.hair = v)),
        cycle("수염", CUSTOM.beards, () => L.beard, (v) => (L.beard = v)),
        cycle("피부", [0, 1, 2, 3, 4].map((i) => SKINS[i][0]), () => SKINS[L.skin][0], (v) => (L.skin = SKINS.findIndex((s) => s[0] === v))),
        cycle("옷 색", CUSTOM.robeColors, () => L.robe, (v) => (L.robe = v)),
        cycle("눈매", [["normal", "보통"], ["fierce", "매서움"], ["soft", "온화함"]], () => L.eyes, (v) => (L.eyes = v)),
        h("div", { class: "opt" }, h("span", { class: "muted" }, "재능"), h("div", { class: "seg" }, CUSTOM.traits.map((t) => h("button", { class: "btn small" + (custom.traitId === t.id ? " on" : ""), title: t.desc, onclick: () => { custom.traitId = t.id; SFX.play("click"); renderDetail(); } }, t.name)))),
        h("div", { class: "muted" }, CUSTOM.traits.find((t) => t.id === custom.traitId).desc),
        optRow(),
        h("button", { class: "btn gold", style: "font-size:14px;padding:10px", onclick: () => {
          if (!custom.name.trim()) { toast("군주 이름을 지어 주세요"); SFX.play("error"); nameIn.focus(); return; }
          SFX.play("select"); meta.lastRuler = "custom"; meta.lastGoal = goalId; meta.lastDiff = diffId; meta.lastCustom = JSON.parse(JSON.stringify(custom)); Save.saveMeta();
          done({ custom: { name: custom.name.trim(), nation: custom.nation.trim(), title: custom.title, traitId: custom.traitId, look: JSON.parse(JSON.stringify(L)) }, goalId, diffId, color: null });
        } }, "창조하고 지도 속으로"));
      updPreview();
    }
    renderCards(); renderDetail();
  });
}
