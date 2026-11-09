// 성 (RPG 허브): 걸어 다니며 재상·상인·기사·보물상자·세계지도 그림과 상호작용
"use strict";
const Castle = (() => {
  const VW = 320, VH = 192, T = 16;
  const view = document.createElement("canvas"); view.width = VW; view.height = VH;
  const vg = view.getContext("2d"); vg.imageSmoothingEnabled = false;
  let room = null; // 정적 배경
  const PAINT = { x: 60, y: 10, w: 52, h: 34 }; // 세계지도 그림 위치
  const player = { x: 160, y: 150, dir: 1, frame: 0, moving: false, tx: null, ty: null, after: null, sheet: null, stepT: 0 };
  let ents = [], keys = {}, nearEnt = null, hoverEnt = null, zoom = null, frozen = false;
  const parts = Array.from({ length: 26 }, (_, i) => ({ x: Math.random() * VW, y: 50 + Math.random() * 120, v: 2 + Math.random() * 4, p: Math.random() * 6 }));

  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  // ---------- 정적 방 그리기 ----------
  function buildRoom() {
    const c = document.createElement("canvas"); c.width = VW; c.height = VH;
    const g = c.getContext("2d");
    // 바닥 (돌 타일)
    for (let ty = 3; ty < 12; ty++) for (let tx = 1; tx < 19; tx++) {
      const x = tx * T, y = ty * T, alt = (tx + ty) % 2;
      px(g, x, y, T, T, alt ? "#4b4466" : "#544c72");
      px(g, x, y, T, 1, alt ? "#5a5280" : "#625a88"); px(g, x, y, 1, T, alt ? "#5a5280" : "#625a88");
      px(g, x + T - 1, y, 1, T, "#3b3552"); px(g, x, y + T - 1, T, 1, "#3b3552");
      if ((tx * 7 + ty * 13) % 5 === 0) { px(g, x + 5, y + 7, 3, 1, "#3e3858"); px(g, x + 7, y + 8, 2, 1, "#3e3858"); }
    }
    // 단상 (왕좌 단)
    px(g, 104, 44, 112, 36, "#6b5f92"); px(g, 104, 44, 112, 2, "#8577b0");
    for (let x = 104; x < 216; x += 16) px(g, x, 46, 1, 32, "#5e5385");
    px(g, 104, 78, 112, 4, "#3a3254"); px(g, 112, 82, 96, 3, "#4a4168"); px(g, 112, 85, 96, 2, "#2f2945");
    // 붉은 융단
    px(g, 144, 50, 32, 142, "#8e1f33"); px(g, 146, 50, 28, 142, "#a8283f"); px(g, 148, 50, 1, 142, "#e2b34a"); px(g, 171, 50, 1, 142, "#e2b34a");
    for (let y = 56; y < 192; y += 12) { px(g, 158, y, 4, 4, "#c6394f"); px(g, 159, y + 1, 2, 2, "#e2b34a"); }
    px(g, 144, 80, 32, 4, "#6e1828");
    // 상점 깔개
    px(g, 228, 92, 76, 50, "#3d6a5a"); px(g, 230, 94, 72, 46, "#4a7d6a");
    for (let x = 232; x < 300; x += 8) { px(g, x, 96, 4, 2, "#e2b34a"); px(g, x + 2, 136, 4, 2, "#e2b34a"); }
    // 뒷벽
    px(g, 0, 0, VW, 8, "#1b1630");
    for (let y = 8; y < 48; y += 8) for (let x = 0; x < VW; x += 16) {
      const o = (y / 8) % 2 ? 8 : 0;
      px(g, x - o, y, 16, 8, "#3a3358"); px(g, x - o, y, 15, 1, "#4a4270"); px(g, x - o + 15, y, 1, 8, "#28223f"); px(g, x - o, y + 7, 16, 1, "#28223f");
    }
    px(g, 0, 44, VW, 4, "#28223f"); px(g, 0, 48, VW, 2, "#16122a");
    // 창문 (아치)
    for (const wx of [24, 264]) {
      px(g, wx, 14, 24, 26, "#1a1630"); px(g, wx + 2, 16, 20, 22, "#2a3f7a");
      px(g, wx + 4, 12, 16, 2, "#1a1630"); px(g, wx + 2, 14, 20, 2, "#2a3f7a");
      px(g, wx + 11, 14, 2, 24, "#1a1630"); px(g, wx + 2, 26, 20, 2, "#1a1630");
      px(g, wx + 5, 18, 3, 3, "#f4f0d0"); px(g, wx + 4, 19, 1, 1, "#f4f0d0"); // 달
      px(g, wx + 16, 20, 1, 1, "#ffffff"); px(g, wx + 7, 31, 1, 1, "#ffffff"); px(g, wx + 18, 33, 1, 1, "#cfd8ff");
      px(g, wx - 1, 38, 26, 3, "#5a5280");
    }
    // 깃발 배너
    for (const bx of [124, 188]) {
      px(g, bx - 1, 10, 10, 2, "#c99a3b");
      px(g, bx, 12, 8, 26, "#5a3fa0"); px(g, bx, 12, 1, 26, "#7a5fc0"); px(g, bx, 38, 2, 3, "#5a3fa0"); px(g, bx + 6, 38, 2, 3, "#5a3fa0"); px(g, bx + 3, 38, 2, 2, "#5a3fa0");
      px(g, bx + 2, 18, 4, 4, "#e2b34a"); px(g, bx + 3, 17, 2, 1, "#e2b34a"); px(g, bx + 3, 22, 2, 3, "#e2b34a");
    }
    // 세계지도 그림 (실제 지도 축소판)
    const P0 = PAINT;
    px(g, P0.x - 3, P0.y - 3, P0.w + 6, P0.h + 6, "#a8771c"); px(g, P0.x - 2, P0.y - 2, P0.w + 4, P0.h + 4, "#e8b93a"); px(g, P0.x - 1, P0.y - 1, P0.w + 2, P0.h + 2, "#6b4a12");
    const M = window.MAPDATA;
    for (let y = 0; y < P0.h; y++) for (let x = 0; x < P0.w; x++) {
      const c0 = Math.floor((x / P0.w) * M.W), r0 = Math.floor((y / P0.h) * M.H);
      let landN = 0;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) { const r = Math.min(M.H - 1, r0 + dy * 2), cc = Math.min(M.W - 1, c0 + dx * 4); if (Engine.grid[r * M.W + cc] >= 0) landN++; }
      px(g, P0.x + x, P0.y + y, 1, 1, landN >= 3 ? (y < 6 ? "#e8eef5" : (x + y) % 5 === 0 ? "#4f8a3a" : "#6aa84f") : (x + y) % 2 ? "#2f63a3" : "#3a6fb0");
    }
    px(g, P0.x + 14, P0.y + P0.h + 3, 24, 4, "#6b4a12"); // 명판
    px(g, P0.x + 16, P0.y + P0.h + 4, 20, 2, "#e8b93a");
    // 왼쪽/오른쪽 벽 윗면
    for (const wx of [0, 304]) { px(g, wx, 48, 16, VH - 48, "#231d3a"); px(g, wx === 0 ? 14 : 304, 48, 2, VH - 48, "#16122a"); for (let y = 56; y < VH; y += 16) px(g, wx + 4, y, 8, 1, "#2e2748"); }
    // 아래 벽 (문 제외)
    px(g, 0, 178, 136, 14, "#231d3a"); px(g, 184, 178, 136, 14, "#231d3a"); px(g, 0, 178, 136, 2, "#3a3358"); px(g, 184, 178, 136, 2, "#3a3358");
    px(g, 136, 178, 48, 14, "#120e22"); px(g, 136, 178, 2, 14, "#3a3358"); px(g, 182, 178, 2, 14, "#3a3358");
    return c;
  }

  // ---------- 엔티티 ----------
  const NPCS = {
    advisor: { name: "재상 오르벤", skin: 0, hair: "#d8d2c5", robe: "#3a5aa0", trim: "#e2b34a", hat: "hood", hatColor: "#2c4680", beard: 1, beardColor: "#e9e4dc" },
    merchant: { name: "떠돌이 상인 미라", skin: 2, hair: "#3b2a1e", hairStyle: "long", robe: "#2f8a6a", trim: "#e2b34a", hat: "turban", hatColor: "#8e4cc0" },
    knight: { name: "기사단장 그레고르", skin: 1, hair: "#7a4a26", robe: "#6b7486", trim: "#c8243a", hat: "helmet", beard: 1 },
    me: { name: "나", skin: 1, hair: "#2a2240", robe: "#5b3f9e", trim: "#e2b34a", hat: "crown", cape: "#b8242c" },
  };
  const sheets = {};
  function sheet(id) { return sheets[id] || (sheets[id] = chibiCanvas(NPCS[id], 1)); }
  // 대화창용 NPC 초상
  const NPC_LOOKS = {
    advisor: { skin: 0, hair: "#d8d2c5", hairStyle: "bald", hat: "none", beard: "long", robe: "#2c4680", trim: "#e2b34a", eyes: "soft" },
    merchant: { skin: 2, hair: "#3b2a1e", hairStyle: "long", hat: "turban", beard: "none", robe: "#2f8a6a", trim: "#e2b34a", eyes: "soft" },
    knight: { skin: 1, hair: "#7a4a26", hairStyle: "short", hat: "corinth", beard: "full", robe: "#6b7486", trim: "#c8243a", eyes: "fierce" },
    me: { skin: 1, hair: "#2a2240", hairStyle: "short", hat: "crown", beard: "none", robe: "#5b3f9e", trim: "#e2b34a", eyes: "normal" },
  };

  function setup(handlers) {
    room = buildRoom();
    ents = [
      { id: "throne", x: 160, y: 62, hw: 14, hh: 6, solid: true, label: "왕좌", draw: drawThrone, act: handlers.throne },
      { id: "advisor", x: 196, y: 70, hw: 6, hh: 4, solid: true, npc: "advisor", dir: 2, label: NPCS.advisor.name, act: handlers.advisor },
      { id: "painting", x: PAINT.x + PAINT.w / 2, y: 54, hw: 26, hh: 3, solid: false, label: "세계지도", act: handlers.painting, ix: PAINT.x + PAINT.w / 2, iy: 58 },
      { id: "counter", x: 266, y: 110, hw: 30, hh: 6, solid: true, label: "상점", draw: drawCounter, act: handlers.merchant },
      { id: "merchant", x: 266, y: 100, hw: 6, hh: 4, solid: true, npc: "merchant", dir: 0, label: NPCS.merchant.name, act: handlers.merchant, iy: 122 },
      { id: "chest", x: 40, y: 134, hw: 18, hh: 6, solid: true, label: "보물창고", draw: drawChests, act: handlers.chest },
      { id: "knight", x: 196, y: 160, hw: 6, hh: 4, solid: true, npc: "knight", dir: 2, label: NPCS.knight.name, act: handlers.knight },
      { id: "pillarL", x: 60, y: 84, hw: 7, hh: 4, solid: true, draw: drawPillar },
      { id: "pillarR", x: 260, y: 84, hw: 7, hh: 4, solid: true, draw: drawPillar },
      { id: "pillarL2", x: 92, y: 158, hw: 7, hh: 4, solid: true, draw: drawPillar },
      { id: "plant", x: 290, y: 164, hw: 6, hh: 4, solid: true, draw: drawPlant },
      { id: "book", x: 30, y: 74, hw: 12, hh: 5, solid: true, draw: drawBookshelf, label: "서가", act: handlers.book },
    ];
    player.sheet = sheet("me");
  }

  function drawThrone(g, e) {
    const x = e.x - 14, y = e.y - 34;
    px(g, x + 2, y, 24, 26, "#7a1f33"); px(g, x + 4, y + 2, 20, 22, "#a8283f");
    px(g, x, y + 4, 4, 30, "#e2b34a"); px(g, x + 24, y + 4, 4, 30, "#e2b34a"); px(g, x + 2, y - 3, 24, 4, "#e2b34a"); px(g, x + 12, y - 7, 4, 4, "#e2b34a"); px(g, x + 13, y - 6, 2, 2, "#c8243a");
    px(g, x + 4, y + 22, 20, 8, "#c6394f"); px(g, x + 4, y + 22, 20, 2, "#e05a6e"); px(g, x + 2, y + 30, 24, 4, "#a8771c");
  }
  function drawCounter(g, e) {
    const x = e.x - 32, y = e.y - 12;
    px(g, x, y, 64, 8, "#9a6a3a"); px(g, x, y, 64, 2, "#c08a52"); px(g, x, y + 8, 64, 8, "#6b4422"); px(g, x, y + 15, 64, 1, "#3a2410");
    for (let i = 0; i < 4; i++) px(g, x + 6 + i * 16, y + 9, 1, 6, "#4a2e14");
    // 물약·금화
    px(g, x + 6, y - 6, 5, 6, "#c8243a"); px(g, x + 7, y - 8, 3, 2, "#d9d2c5"); px(g, x + 14, y - 5, 5, 5, "#3d78d8"); px(g, x + 15, y - 7, 3, 2, "#d9d2c5");
    px(g, x + 46, y - 3, 8, 3, "#e8b93a"); px(g, x + 48, y - 5, 6, 2, "#ffd56b"); px(g, x + 26, y - 7, 10, 7, "#b9c2cf"); px(g, x + 28, y - 5, 6, 3, "#8e5cc8");
  }
  function drawChests(g, e) {
    for (const [dx, big] of [[-18, 1], [4, 0]]) {
      const x = e.x + dx, y = e.y - 14, w = big ? 18 : 14;
      px(g, x, y, w, 14, "#8a5a2b"); px(g, x, y, w, 5, "#a8743a"); px(g, x, y + 5, w, 2, "#e8b93a"); px(g, x + w / 2 - 2, y + 4, 4, 5, "#e8b93a"); px(g, x + w / 2 - 1, y + 6, 2, 2, "#3a2410"); px(g, x, y + 13, w, 1, "#3a2410");
    }
    px(g, e.x - 26, e.y - 3, 6, 3, "#e8b93a"); px(g, e.x - 24, e.y - 5, 4, 2, "#ffd56b"); px(g, e.x + 20, e.y - 2, 4, 2, "#e8b93a");
  }
  function drawPillar(g, e) {
    const x = e.x - 8, y = e.y - 46;
    px(g, x - 2, y + 42, 20, 6, "#3a3358"); px(g, x, y + 4, 16, 40, "#8e86ad"); px(g, x, y + 4, 4, 40, "#aaa2c8"); px(g, x + 12, y + 4, 4, 40, "#6e6690");
    px(g, x - 2, y, 20, 5, "#aaa2c8"); px(g, x - 2, y + 4, 20, 1, "#5e5680");
  }
  function drawPlant(g, e) {
    const x = e.x - 7, y = e.y - 22;
    px(g, x + 2, y + 14, 10, 8, "#a8562a"); px(g, x + 2, y + 14, 10, 2, "#c8743a");
    px(g, x, y + 4, 14, 10, "#2f7d3a"); px(g, x + 3, y, 8, 6, "#3f9a4a"); px(g, x + 5, y + 6, 2, 2, "#5ac46a"); px(g, x + 9, y + 9, 2, 2, "#5ac46a");
  }
  function drawBookshelf(g, e) {
    const x = e.x - 14, y = e.y - 36;
    px(g, x, y, 28, 36, "#5a3a1e"); px(g, x + 2, y + 2, 24, 32, "#3a2410");
    const cols = ["#c8243a", "#3d78d8", "#e8b93a", "#3fae5a", "#8e5cc8", "#d9d2c5"];
    for (let sh = 0; sh < 3; sh++) { px(g, x + 2, y + 12 + sh * 11, 24, 1, "#7a5230"); for (let b = 0; b < 7; b++) px(g, x + 3 + b * 3, y + 4 + sh * 11, 2, 8 - (b % 3), cols[(b + sh * 2) % 6]); }
  }

  // ---------- 입력 ----------
  function onKey(e, down) { keys[e.key.toLowerCase()] = down; }
  // 세로 화면에서는 방을 크게 보여 주고 카메라가 주인공을 따라간다
  let camX = 160;
  function viewRect(cw, ch) {
    let s = Math.min(cw / VW, ch / VH);
    if (ch > cw * 1.15) s = Math.min((ch * 0.62) / VH, (cw * 2.3) / VW);
    if (s >= 2) s = Math.floor(s * 2) / 2;
    const w = VW * s, h = VH * s;
    let x = Math.round((cw - w) / 2);
    if (w > cw) x = Math.round(Math.max(cw - w, Math.min(0, cw / 2 - camX * s)));
    return { s, x, y: Math.round((ch - h) / 2), w, h };
  }
  function toView(sx, sy, cw, ch) { const r = viewRect(cw, ch); return [(sx - r.x) / r.s, (sy - r.y) / r.s]; }
  function entAt(vx, vy) {
    for (const e of ents) {
      if (!e.act) continue;
      const top = e.id === "painting" ? PAINT.y : e.y - 30, bot = e.y + 6;
      const l = e.id === "painting" ? PAINT.x : e.x - Math.max(10, e.hw), r = e.id === "painting" ? PAINT.x + PAINT.w : e.x + Math.max(10, e.hw);
      if (vx >= l && vx <= r && vy >= top && vy <= bot) return e;
    }
    return null;
  }
  function click(sx, sy, cw, ch) {
    if (frozen) return;
    const [vx, vy] = toView(sx, sy, cw, ch);
    const e = entAt(vx, vy);
    if (e) {
      player.tx = e.ix != null ? e.ix : e.x; player.ty = e.iy != null ? e.iy : e.y + e.hh + 10;
      if (e.id === "chest") { player.tx = e.x + 26; player.ty = e.y; }
      if (e.id === "book") { player.tx = e.x + 22; player.ty = e.y + 4; }
      if (e.id === "advisor" || e.id === "knight") { player.tx = e.x - 16; player.ty = e.y; }
      if (e.id === "throne") { player.tx = e.x; player.ty = e.y + 14; }
      player.after = e;
    } else { player.tx = vx; player.ty = vy; player.after = null; }
  }
  function hover(sx, sy, cw, ch) { const [vx, vy] = toView(sx, sy, cw, ch); hoverEnt = entAt(vx, vy); return !!hoverEnt; }

  function blocked(x, y) {
    if (x < 20 || x > 300 || y < 56 || y > 174) return true;
    for (const e of ents) if (e.solid && Math.abs(x - e.x) < e.hw + 4 && Math.abs(y - e.y) < e.hh + 3) return true;
    return false;
  }

  // ---------- 갱신 ----------
  function update(dt, onInteract) {
    if (frozen) { player.moving = false; return; }
    let dx = 0, dy = 0;
    if (keys["arrowleft"] || keys["a"]) dx -= 1;
    if (keys["arrowright"] || keys["d"]) dx += 1;
    if (keys["arrowup"] || keys["w"]) dy -= 1;
    if (keys["arrowdown"] || keys["s"]) dy += 1;
    if (dx || dy) { player.tx = null; player.after = null; }
    else if (player.tx != null) {
      const ex = player.tx - player.x, ey = player.ty - player.y, d = Math.hypot(ex, ey);
      if (d < 2) { player.tx = null; if (player.after) { const e = player.after; player.after = null; faceTo(e); onInteract(e); } }
      else { dx = ex / d; dy = ey / d; }
    }
    const sp = 78 * dt;
    if (dx || dy) {
      const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      const nx = player.x + dx * sp, ny = player.y + dy * sp;
      let moved = false;
      if (!blocked(nx, player.y)) { player.x = nx; moved = true; }
      if (!blocked(player.x, ny)) { player.y = ny; moved = true; }
      if (!moved && player.tx != null) { // 막히면 목표 근처에서 멈추고 상호작용
        if (player.after && Math.hypot(player.x - player.after.x, player.y - player.after.y) < 48) { const e = player.after; player.after = null; player.tx = null; faceTo(e); onInteract(e); }
        else player.tx = null;
      }
      player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
      player.moving = moved;
      player.stepT += dt; if (player.stepT > 0.16) { player.stepT = 0; player.frame ^= 1; if (moved) SFX.play("step"); }
    } else { player.moving = false; player.frame = 0; }
    camX += (player.x - camX) * Math.min(1, dt * 4);
    // 가까운 상호작용 대상
    nearEnt = null; let bd = 30;
    for (const e of ents) {
      if (!e.act) continue;
      const ix = e.ix != null ? e.ix : e.x, iy = e.iy != null ? e.iy : e.y;
      const d = Math.hypot(player.x - ix, (player.y - iy) * 1.2) - Math.max(e.hw, 6);
      if (d < bd) { bd = d; nearEnt = e; }
    }
  }
  function faceTo(e) { const dx = e.x - player.x, dy = (e.iy != null ? e.y - 30 : e.y) - player.y; player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0; }
  function interactNear(onInteract) { if (!frozen && nearEnt) { faceTo(nearEnt); onInteract(nearEnt); } }

  // ---------- 그리기 ----------
  function draw(ctx, cw, ch, now) {
    const g = vg;
    g.drawImage(room, 0, 0);
    // 그림 반짝임
    const glow = 0.5 + 0.5 * Math.sin(now / 300);
    g.fillStyle = `rgba(255,240,170,${0.08 + glow * 0.12})`; g.fillRect(PAINT.x, PAINT.y, PAINT.w, PAINT.h);
    if (Math.floor(now / 160) % 9 === 0) { g.fillStyle = "#fff"; g.fillRect(PAINT.x + 8 + ((now / 160) % 30), PAINT.y + 4, 2, 2); }
    // 창문 빛줄기
    g.save(); g.globalCompositeOperation = "lighter";
    for (const wx of [24, 264]) {
      g.fillStyle = "rgba(120,150,255,0.07)";
      g.beginPath(); g.moveTo(wx + 2, 40); g.lineTo(wx + 22, 40); g.lineTo(wx + 52 * (wx < 160 ? 1 : -0.2) + 40, 150); g.lineTo(wx + 52 * (wx < 160 ? 1 : -0.2) + 6, 150); g.closePath(); g.fill();
    }
    g.restore();
    // 엔티티 (y 정렬)
    const list = ents.map((e) => ({ y: e.y, e })).concat([{ y: player.y, p: true }]).sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.p) {
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(Math.round(player.x) - 6, Math.round(player.y) - 1, 12, 3);
        const fr = player.moving ? player.frame : 0;
        g.drawImage(player.sheet, (player.dir * 2 + fr) * 16, 0, 16, 26, Math.round(player.x) - 8, Math.round(player.y) - 25, 16, 26);
        continue;
      }
      const e = it.e;
      if (e.id === "painting") continue;
      if (e.draw) e.draw(g, e);
      if (e.npc) {
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(e.x - 6, e.y - 1, 12, 3);
        const fr = Math.floor(now / 500 + e.x) % 2;
        g.drawImage(sheet(e.npc), (e.dir * 2) * 16, 0, 16, 26, e.x - 8, e.y - 25 - fr, 16, 26);
      }
    }
    // 횃불
    for (const tx of [56, 128 - 18, 208, 248]) {
      const f = Math.floor(now / 120 + tx) % 3;
      px(g, tx, 26, 3, 8, "#5a3a1e"); px(g, tx - 1, 24, 5, 2, "#3a2410");
      px(g, tx - 1 + (f === 1 ? 1 : 0), 18 + (f === 2 ? 1 : 0), 5, 6, "#ff8a2a"); px(g, tx, 20, 3, 4, "#ffd56b"); px(g, tx + 1, 17 + f % 2, 1, 2, "#fff3c0");
    }
    // 먼지
    for (const p of parts) {
      p.y -= p.v * 0.016; if (p.y < 50) p.y = 170;
      const a = 0.25 + 0.25 * Math.sin(now / 500 + p.p);
      g.fillStyle = `rgba(255,240,200,${a})`; g.fillRect(Math.round(p.x + Math.sin(now / 1500 + p.p) * 4), Math.round(p.y), 1, 1);
    }
    // 조명: 어둠 + 횃불 빛
    g.fillStyle = "rgba(14,8,40,0.28)"; g.fillRect(0, 0, VW, VH);
    g.save(); g.globalCompositeOperation = "lighter";
    for (const tx of [56, 110, 208, 248]) {
      const rg = g.createRadialGradient(tx + 1, 22, 2, tx + 1, 30, 46 + Math.sin(now / 90 + tx) * 2);
      rg.addColorStop(0, "rgba(255,150,60,0.28)"); rg.addColorStop(1, "rgba(255,150,60,0)");
      g.fillStyle = rg; g.fillRect(tx - 50, 0, 100, 90);
    }
    const pg = g.createRadialGradient(PAINT.x + PAINT.w / 2, PAINT.y + PAINT.h / 2, 4, PAINT.x + PAINT.w / 2, PAINT.y + PAINT.h / 2, 44);
    pg.addColorStop(0, `rgba(120,200,255,${0.12 + glow * 0.08})`); pg.addColorStop(1, "rgba(120,200,255,0)");
    g.fillStyle = pg; g.fillRect(PAINT.x - 50, 0, PAINT.w + 100, 100);
    g.restore();
    // 상호작용 표시
    const tgt = hoverEnt || nearEnt;
    const talking = typeof Dialog !== "undefined" && Dialog.open;
    if (tgt && !frozen && !talking) {
      const bx = tgt.id === "painting" ? PAINT.x + PAINT.w / 2 : tgt.x, by = tgt.id === "painting" ? PAINT.y - 6 : tgt.y - (tgt.npc ? 34 : tgt.id === "throne" ? 48 : tgt.id === "book" ? 44 : 26);
      const b = Math.floor(now / 250) % 2;
      px(g, bx - 4, by - 9 - b, 9, 10, "#09071a"); px(g, bx - 3, by - 8 - b, 7, 8, "#fff6c8"); px(g, bx, by - 7 - b, 1, 4, "#c8243a"); px(g, bx, by - 2 - b, 1, 1, "#c8243a");
    }
    // 화면에 출력
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0c0a1c"; ctx.fillRect(0, 0, cw, ch);
    const r = viewRect(cw, ch);
    if (zoom) {
      const k = Math.min(1, (now - zoom.t0) / zoom.dur);
      const e = zoom.rev ? Math.pow(1 - k, 3) : k * k * k;
      const z = 1 + (zoom.z - 1) * e;
      const fx = zoom.x, fy = zoom.y;
      ctx.save();
      ctx.translate(r.x + fx * r.s, r.y + fy * r.s); ctx.scale(z, z); ctx.rotate(e * 0.08);
      ctx.drawImage(view, -fx * r.s, -fy * r.s, r.w, r.h);
      ctx.restore();
      if (k >= 1) { const res = zoom.res; zoom.res = null; if (zoom.rev) zoom = null; res && res(); }
    } else ctx.drawImage(view, r.x, r.y, r.w, r.h);
    return tgt;
  }
  function zoomIntoPainting(dur = 1100) {
    SFX.play("swoosh");
    return new Promise((res) => { zoom = { x: PAINT.x + PAINT.w / 2, y: PAINT.y + PAINT.h / 2, z: 14, t0: performance.now(), dur, res }; });
  }
  function zoomOutOfPainting(dur = 1100) {
    SFX.play("swoosh");
    return new Promise((res) => { zoom = { x: PAINT.x + PAINT.w / 2, y: PAINT.y + PAINT.h / 2, z: 14, t0: performance.now(), dur, res, rev: true }; });
  }
  function resetZoom() { zoom = null; }
  function placePlayer(x, y, dir) { player.x = x; player.y = y; player.dir = dir; player.tx = null; player.after = null; camX = x; }
  function screenOf(vx, vy, cw, ch) { const r = viewRect(cw, ch); return [r.x + vx * r.s, r.y + vy * r.s]; }

  return {
    setup, update, draw, click, hover, onKey, interactNear, zoomIntoPainting, zoomOutOfPainting, resetZoom, placePlayer, screenOf, NPCS, NPC_LOOKS,
    set frozen(v) { frozen = v; if (v) { keys = {}; player.tx = null; player.after = null; } }, get frozen() { return frozen; },
    get near() { return nearEnt; },
  };
})();
