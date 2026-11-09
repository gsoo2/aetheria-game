// 2.5D 도트 세계 지도 렌더러: 지형 버퍼, 카메라, 유닛, 애니메이션
"use strict";
const WorldView = (() => {
  const { W, H, grid, P, provCells } = Engine;
  const M = window.MAPDATA;
  const S = 4, LIFT = 3;
  const BW = W * S, BH = H * S + LIFT;
  const cam = { x: BW / 2, y: BH / 2, z: 1 };
  let buf = null, bufNext = null, reveal = null; // 칠하기 공개 애니메이션
  const land = new Uint8Array(W * H), biome = new Uint8Array(W * H), deco = new Uint8Array(W * H), depth = new Uint8Array(W * H);
  const hash = (i) => { let x = (i * 374761393) ^ 0x5bf03635; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
  const BIOME_RGB = [[106, 168, 79], [232, 238, 245], [138, 154, 122], [217, 196, 138], [63, 122, 58], [47, 125, 58]]; // 초원,눈,툰드라,사막,숲,밀림
  const DESERTS = [[15, 30, -15, 33], [16, 30, 36, 56], [38, 46, 92, 112], [-31, -20, 120, 142], [36, 42, 78, 90], [-27, -19, 15, 24], [24, 32, -116, -108], [-28, -20, -71, -68]];
  const MOUNTS = [[27, 36, 70, 97], [35, 60, -125, -106], [-40, -10, -76, -66], [-10, 8, -79, -72], [44, 47.5, 5, 16], [50, 68, 57, 61], [41, 44, 40, 48], [36, 40, 66, 76], [42, 50, 80, 95], [31, 35, -8, 2], [-45, -36, 168, 175]];
  const WATER = [[27, 53, 102], [33, 66, 118], [43, 85, 143], [62, 114, 178]];

  function init() {
    for (let i = 0; i < W * H; i++) land[i] = grid[i] >= 0 ? 1 : 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c; if (!land[i]) continue;
      const lat = M.LAT_TOP - (r + 0.5) * M.RES, lon = -180 + (c + 0.5) * M.RES, a = Math.abs(lat);
      let b = 0;
      if (a > 66 || (lon > -60 && lon < -20 && lat > 59)) b = 1; else if (a > 58) b = 2;
      else if (a < 10) b = 5; else if ((a > 45 && a < 58) || (lat < -38)) b = 4;
      for (const [la0, la1, lo0, lo1] of DESERTS) if (lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1) b = 3;
      biome[i] = b;
      const hh = hash(i);
      let m = false; for (const [la0, la1, lo0, lo1] of MOUNTS) if (lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1) m = true;
      if (m && hh < 0.33) deco[i] = 2; else if ((b === 4 || b === 5) && hh < 0.22) deco[i] = 1; else if (b === 3 && hh < 0.05) deco[i] = 3;
    }
    // 바다 깊이: 해안에서 거리
    const q = []; depth.fill(255);
    for (let i = 0; i < W * H; i++) if (land[i]) { depth[i] = 0; q.push(i); }
    let h = 0;
    while (h < q.length) {
      const i = q[h++], r = Math.floor(i / W), c = i % W;
      if (depth[i] >= 8) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dy; if (rr < 0 || rr >= H) continue;
        const j = rr * W + ((c + dx + W) % W);
        if (depth[j] === 255) { depth[j] = depth[i] + 1; q.push(j); }
      }
    }
  }

  // ---------- 지형 버퍼 생성 ----------
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function build(provColor, provOwner) {
    // provColor[pid] = "#hex", provOwner[pid] = nation id
    const cv = document.createElement("canvas"); cv.width = BW; cv.height = BH;
    const g = cv.getContext("2d");
    const img = g.createImageData(BW, BH);
    const d32 = new Uint32Array(img.data.buffer);
    const pack = (r, gg, b) => (255 << 24) | (Math.max(0, Math.min(255, b | 0)) << 16) | (Math.max(0, Math.min(255, gg | 0)) << 8) | Math.max(0, Math.min(255, r | 0));
    const put = (x, y, v) => { if (x >= 0 && y >= 0 && x < BW && y < BH) d32[y * BW + x] = v; };
    const pc = provColor.map(rgb);
    // 바다
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c; if (land[i]) continue;
      const dp = depth[i];
      const lvl = dp <= 1 ? 3 : dp <= 3 ? 2 : dp <= 6 ? 1 : 0;
      const base = WATER[lvl], alt = WATER[Math.max(0, lvl - 1)];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const px = c * S + x, py = r * S + y + LIFT;
        const dith = (dp === 2 || dp === 4 || dp === 7) && ((px + py) & 1);
        const col = dith ? alt : base;
        put(px, py, pack(col[0], col[1], col[2]));
      }
      if (hash(i * 7) < 0.025 && dp > 2) { put(c * S + 1, r * S + LIFT + 1, pack(88, 136, 196)); put(c * S + 2, r * S + LIFT + 1, pack(88, 136, 196)); }
    }
    // 육지 윗면
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = r * W + c; if (!land[i]) continue;
      const pid = grid[i], oc = pc[pid], bt = BIOME_RGB[biome[i]];
      const n = (hash(i) - 0.5) * 14;
      const t = biome[i] === 1 ? 0.45 : 0.22;
      let R = oc[0] * (1 - t) + bt[0] * t + n, G = oc[1] * (1 - t) + bt[1] * t + n, B = oc[2] * (1 - t) + bt[2] * t + n;
      const e = (c + 1) % W, s = r + 1 < H ? (r + 1) * W + c : -1, nI = r > 0 ? (r - 1) * W + c : -1;
      const ep = grid[r * W + e], sp = s >= 0 ? grid[s] : -1, np = nI >= 0 ? grid[nI] : -1;
      const top = pack(R, G, B), hi = pack(R + 40, G + 40, B + 40), lo = pack(R * 0.82, G * 0.82, B * 0.82), dk = pack(R * 0.45, G * 0.45, B * 0.45);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const px = c * S + x, py = r * S + y;
        put(px, py, ((x + y + r + c) & 3) === 0 ? lo : top);
      }
      // 북쪽 해안 하이라이트
      if (np < 0) for (let x = 0; x < S; x++) put(c * S + x, r * S, hi);
      // 경계선
      const eo = ep >= 0 ? provOwner[ep] : -1, so = sp >= 0 ? provOwner[sp] : -1, me = provOwner[pid];
      if (ep >= 0 && ep !== pid) { const col = eo !== me ? dk : lo; for (let y = 0; y < S; y++) put(c * S + S - 1, r * S + y, col); }
      if (sp >= 0 && sp !== pid) { const col = so !== me ? dk : lo; for (let x = 0; x < S; x++) put(c * S + x, r * S + S - 1, col); }
      // 장식
      const dc = deco[i];
      if (dc === 1) { const tr = pack(R * 0.55, G * 0.62, B * 0.5); put(c * S + 1, r * S + 1, tr); put(c * S, r * S + 2, tr); put(c * S + 1, r * S + 2, tr); put(c * S + 2, r * S + 2, tr); put(c * S + 1, r * S + 3, pack(70, 50, 30)); }
      if (dc === 2) { const sn = pack(Math.min(255, R + 90), Math.min(255, G + 90), Math.min(255, B + 90)), mk = pack(R * 0.55, G * 0.55, B * 0.55); put(c * S + 2, r * S, sn); put(c * S + 1, r * S + 1, sn); put(c * S + 2, r * S + 1, mk); put(c * S + 3, r * S + 1, mk); put(c * S, r * S + 2, mk); put(c * S + 1, r * S + 2, mk); put(c * S + 2, r * S + 2, mk); put(c * S + 3, r * S + 2, mk); }
      if (dc === 3) { const sd = pack(R + 30, G + 25, B); put(c * S + 1, r * S + 2, sd); put(c * S + 2, r * S + 2, sd); put(c * S + 2, r * S + 1, sd); }
      // 남쪽 절벽 (2.5D 옆면)
      if (sp < 0) {
        for (let y = 0; y < LIFT; y++) for (let x = 0; x < S; x++) {
          const k = y === 0 ? 0.55 : 0.4;
          put(c * S + x, r * S + S + y, pack(R * k * 0.9, G * k * 0.85, B * k * 0.8));
        }
      }
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  function setOwners(provColor, provOwner, revealAt) {
    const nb = build(provColor, provOwner);
    if (revealAt && buf) { bufNext = nb; reveal = { x: revealAt[0], y: revealAt[1], t0: performance.now(), dur: revealAt[2] || 700, r: revealAt[3] || 600 }; }
    else { buf = nb; bufNext = null; reveal = null; }
  }

  // ---------- 좌표 ----------
  const labelPos = (pid) => [P[pid].lx * S + S / 2, P[pid].ly * S + S / 2 - 1];
  let CW = 1, CH = 1;
  const toScreen = (x, y) => [(x - cam.x) * cam.z + CW / 2, (y - cam.y) * cam.z + CH / 2];
  const toWorld = (sx, sy) => [(sx - CW / 2) / cam.z + cam.x, (sy - CH / 2) / cam.z + cam.y];
  function provAtScreen(sx, sy) {
    const [wx, wy] = toWorld(sx, sy);
    const c = Math.floor(wx / S);
    // 육지는 LIFT만큼 위에 그려져 있으므로 두 위치를 확인
    for (const yy of [wy, wy - LIFT]) {
      const r = Math.floor(yy / S);
      if (r >= 0 && r < H && c >= 0 && c < W) { const v = grid[r * W + c]; if (v >= 0) return v; }
    }
    return -1;
  }
  function clampCam() {
    cam.z = Math.max(0.35, Math.min(6, cam.z));
    const hw = CW / 2 / cam.z, hh = CH / 2 / cam.z;
    cam.x = BW < hw * 2 ? BW / 2 : Math.max(hw - 40, Math.min(BW - hw + 40, cam.x));
    cam.y = BH < hh * 2 ? BH / 2 : Math.max(hh - 60, Math.min(BH - hh + 60, cam.y));
  }
  // 부드러운 카메라 이동
  let camAnim = null;
  function flyTo(x, y, z, dur = 700) {
    return new Promise((res) => { camAnim = { x0: cam.x, y0: cam.y, z0: cam.z, x, y, z, t0: performance.now(), dur, res }; });
  }
  function focusProv(pid, z, dur) { const [x, y] = labelPos(pid); return flyTo(x, y, z || Math.max(cam.z, 1.6), dur); }

  // ---------- 하이라이트 마스크 ----------
  const maskCache = {};
  function mask(pid, color) {
    const k = pid + color;
    if (maskCache[k]) return maskCache[k];
    const cells = provCells[pid];
    let c0 = 1e9, c1 = -1, r0 = 1e9, r1 = -1;
    for (const i of cells) { const c = i % W, r = Math.floor(i / W); c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
    const cv = document.createElement("canvas"); cv.width = (c1 - c0 + 1) * S; cv.height = (r1 - r0 + 1) * S;
    const g = cv.getContext("2d"); g.fillStyle = color;
    const set = new Set(cells);
    for (const i of cells) {
      const c = i % W, r = Math.floor(i / W);
      g.globalAlpha = 0.32; g.fillRect((c - c0) * S, (r - r0) * S, S, S);
      g.globalAlpha = 1;
      if (!set.has(i - W)) g.fillRect((c - c0) * S, (r - r0) * S, S, 1);
      if (!set.has(i + W)) g.fillRect((c - c0) * S, (r - r0) * S + S - 1, S, 1);
      if (!set.has(i - 1)) g.fillRect((c - c0) * S, (r - r0) * S, 1, S);
      if (!set.has(i + 1)) g.fillRect((c - c0) * S + S - 1, (r - r0) * S, 1, S);
    }
    return (maskCache[k] = { cv, x: c0 * S, y: r0 * S });
  }

  // ---------- 애니메이션 ----------
  const anims = [];
  function play(a) { return new Promise((res) => { a.t0 = performance.now(); a.res = res; anims.push(a); }); }
  function march(from, to, color, dur = 650) { return play({ type: "march", from: labelPos(from), to: labelPos(to), color, dur }); }
  function burst(pid, dur = 600) { return play({ type: "burst", at: labelPos(pid), dur }); }
  function floatText(pid, text, color = "#fff", dur = 1300) { play({ type: "float", at: labelPos(pid), text, color, dur }); }

  // 구름
  const clouds = Array.from({ length: 9 }, (_, i) => ({ x: hash(i + 11) * BW, y: hash(i + 99) * BH, w: 50 + hash(i + 5) * 80, v: 4 + hash(i + 3) * 6, seed: i }));
  // 바다 반짝임
  const sparkles = Array.from({ length: 160 }, (_, i) => ({ x: hash(i * 3 + 1) * BW, y: hash(i * 5 + 2) * BH, p: hash(i + 77) * 6 }));

  function drawSoldier(g, x, y, col, scale) {
    const s = scale;
    const P2 = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + px * s), Math.round(y + py * s), w * s, h * s); };
    const dark = shade(col, -0.45);
    P2(-3, 8, 7, 1, "rgba(0,0,0,.35)");
    P2(-2, 0, 5, 2, dark); P2(-1, -1, 3, 1, dark); // 투구
    P2(-2, 2, 5, 2, "#f2d0a8");
    P2(-3, 4, 7, 3, col); P2(-3, 4, 7, 1, shade(col, 0.25));
    P2(-2, 7, 2, 1, "#2a2230"); P2(1, 7, 2, 1, "#2a2230");
    P2(4, -3, 1, 10, "#8a6a3a"); P2(4, -4, 1, 1, "#d8d8e0");
  }
  function drawCastle(g, x, y, col, s) {
    const P2 = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + px * s), Math.round(y + py * s), w * s, h * s); };
    P2(-5, -6, 10, 7, "#c9c2b4"); P2(-5, -6, 10, 1, "#efe8da"); P2(-6, -9, 3, 10, "#b3ab9c"); P2(3, -9, 3, 10, "#b3ab9c");
    P2(-6, -10, 1, 1, "#b3ab9c"); P2(-4, -10, 1, 1, "#b3ab9c"); P2(3, -10, 1, 1, "#b3ab9c"); P2(5, -10, 1, 1, "#b3ab9c");
    P2(-1, -3, 2, 4, "#3a2a1e"); P2(0, -15, 1, 6, "#3a2a1e"); P2(1, -15, 4, 3, col);
  }

  const fmt = (n) => (n >= 10000 ? (n / 1000).toFixed(0) + "k" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

  // ---------- 그리기 ----------
  // st: { C, sel, targets: Map(pid→color), hover, showUnits }
  function draw(ctx, cw, ch, now, st) {
    CW = cw; CH = ch;
    if (camAnim) {
      const k = Math.min(1, (now - camAnim.t0) / camAnim.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.x = camAnim.x0 + (camAnim.x - camAnim.x0) * e; cam.y = camAnim.y0 + (camAnim.y - camAnim.y0) * e;
      cam.z = camAnim.z0 * Math.pow(camAnim.z / camAnim.z0, e);
      if (k >= 1) { const r = camAnim.res; camAnim = null; r(); }
    } else clampCam();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#162c57"; ctx.fillRect(0, 0, cw, ch);
    // 바다 바깥 줄무늬
    ctx.setTransform(cam.z, 0, 0, cam.z, -cam.x * cam.z + cw / 2, -cam.y * cam.z + ch / 2);
    if (buf) ctx.drawImage(buf, 0, 0);
    if (reveal && bufNext) {
      const k = Math.min(1, (now - reveal.t0) / reveal.dur);
      ctx.save(); ctx.beginPath(); ctx.arc(reveal.x, reveal.y, Math.max(1, reveal.r * k), 0, Math.PI * 2); ctx.clip(); ctx.drawImage(bufNext, 0, 0); ctx.restore();
      if (k >= 1) { buf = bufNext; bufNext = null; reveal = null; }
    }
    // 바다 반짝임
    for (const s of sparkles) {
      const ph = (now / 900 + s.p) % 6;
      if (ph > 1) continue;
      const c = Math.floor(s.x / S), r = Math.floor(s.y / S);
      if (r < 0 || r >= H || land[r * W + c]) continue;
      ctx.fillStyle = ph < 0.5 ? "rgba(200,225,255,.8)" : "rgba(200,225,255,.4)";
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 2 + (ph < 0.5 ? 1 : 0), 1);
    }
    const C = st.C;
    // 대상 하이라이트
    const pulse = 0.55 + 0.45 * Math.sin(now / 180);
    if (st.targets) for (const [pid, color] of st.targets) {
      const m = mask(pid, color); ctx.globalAlpha = 0.35 + 0.25 * pulse; ctx.drawImage(m.cv, m.x, m.y - LIFT * 0);
    }
    if (st.hover != null && st.hover >= 0 && st.hover !== st.sel) { const m = mask(st.hover, "#ffffff"); ctx.globalAlpha = 0.22; ctx.drawImage(m.cv, m.x, m.y); }
    if (st.sel != null && st.sel >= 0) { const m = mask(st.sel, "#fff6c8"); ctx.globalAlpha = 0.5 + 0.4 * pulse; ctx.drawImage(m.cv, m.x, m.y); }
    ctx.globalAlpha = 1;
    // 바다 항로 (선택된 곳)
    if (st.sel != null && st.sel >= 0) {
      const [x0, y0] = labelPos(st.sel);
      ctx.strokeStyle = "rgba(240,230,190,.8)"; ctx.lineWidth = 1.5 / cam.z; ctx.setLineDash([4 / cam.z, 4 / cam.z]); ctx.lineDashOffset = -now / 60 / cam.z;
      for (const q of P[st.sel].sea) { const [x1, y1] = labelPos(q); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    // 구름 그림자 & 구름
    if (st.clouds !== false) {
      for (const cl of clouds) {
        const x = ((cl.x + (now / 1000) * cl.v) % (BW + 200)) - 100;
        ctx.fillStyle = "rgba(10,20,40,.13)";
        blob(ctx, x + 18, cl.y + 26, cl.w, cl.seed);
      }
    }
    // 화면 공간 오버레이
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const us = cam.z >= 1.6 ? 2 : cam.z >= 0.7 ? 2 : 1;
    if (C && st.showUnits !== false) {
      const list = [];
      const pl = C.player;
      for (let pid = 0; pid < P.length; pid++) {
        const s = C.prov[pid];
        const [sx, sy] = toScreen(...labelPos(pid));
        if (sx < -30 || sy < -30 || sx > cw + 30 || sy > ch + 30) continue;
        const own = s.o === pl, war = Engine.atWar(C, pl, s.o);
        const near = cam.z >= 1.15 || own || war || pid === st.sel || (st.targets && st.targets.has(pid));
        const cap = C.nations[s.o].capital === pid;
        list.push({ pid, sx, sy, s, own, war, near, cap });
      }
      list.sort((a, b) => a.sy - b.sy);
      ctx.font = "11px Galmuri11, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const u of list) {
        const col = C.nations[u.s.o].color;
        if (u.cap && cam.z > 0.5) drawCastle(ctx, u.sx - 9 * us / 2, u.sy - 2, col, us === 2 && cam.z > 1.2 ? 2 : 1);
        if (!u.near || u.s.t <= 0) continue;
        drawSoldier(ctx, u.sx, u.sy - 8 * us, col, us);
        const txt = fmt(u.s.t);
        const w = ctx.measureText(txt).width + 6;
        ctx.fillStyle = u.own ? "rgba(20,16,40,.9)" : u.war ? "rgba(110,20,20,.92)" : "rgba(20,16,40,.7)";
        ctx.fillRect(Math.round(u.sx - w / 2), Math.round(u.sy + 4), Math.round(w), 13);
        if (u.own && u.s.r > 0) { ctx.fillStyle = "#f2c14e"; ctx.fillRect(Math.round(u.sx - w / 2), Math.round(u.sy + 16), Math.round(w), 1); }
        ctx.fillStyle = u.own ? "#f2c14e" : "#f4ecd6";
        ctx.fillText(txt, Math.round(u.sx), Math.round(u.sy + 11));
      }
      // 확대 시 영토 이름
      if (cam.z >= 2.2) {
        ctx.font = "11px Galmuri11, monospace";
        for (const u of list) {
          ctx.fillStyle = "rgba(9,7,26,.65)"; const nm = P[u.pid].name; const w = ctx.measureText(nm).width + 6;
          ctx.fillRect(Math.round(u.sx - w / 2), Math.round(u.sy + 19), Math.round(w), 13);
          ctx.fillStyle = "#ddd5f0"; ctx.fillText(nm, Math.round(u.sx), Math.round(u.sy + 26));
        }
      }
    }
    // 애니메이션
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i], k = Math.min(1, (now - a.t0) / a.dur);
      if (a.type === "march") {
        const [x0, y0] = toScreen(...a.from), [x1, y1] = toScreen(...a.to);
        ctx.strokeStyle = "rgba(255,240,200,.9)"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); ctx.stroke(); ctx.setLineDash([]);
        // 화살촉
        const ang = Math.atan2(y1 - y0, x1 - x0), hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k;
        ctx.fillStyle = "#fff0c8"; ctx.beginPath(); ctx.moveTo(hx + Math.cos(ang) * 8, hy + Math.sin(ang) * 8); ctx.lineTo(hx + Math.cos(ang + 2.5) * 7, hy + Math.sin(ang + 2.5) * 7); ctx.lineTo(hx + Math.cos(ang - 2.5) * 7, hy + Math.sin(ang - 2.5) * 7); ctx.fill();
        const bob = Math.floor(now / 90) % 2;
        drawSoldier(ctx, hx - 6, hy - 18 - bob, a.color, 2); drawSoldier(ctx, hx + 6, hy - 16 + bob, a.color, 2);
      } else if (a.type === "burst") {
        const [x, y] = toScreen(...a.at);
        for (let j = 0; j < 12; j++) {
          const an = (j / 12) * Math.PI * 2 + j, d = 6 + k * 34 * (0.6 + hash(j) * 0.6);
          ctx.fillStyle = j % 3 === 0 ? "#fff3a0" : j % 3 === 1 ? "#ff8a3d" : "#d9d2c5";
          const sz = Math.max(1, Math.round((1 - k) * 5));
          ctx.fillRect(Math.round(x + Math.cos(an) * d), Math.round(y - 8 + Math.sin(an) * d * 0.7), sz, sz);
        }
        if (k < 0.3) { ctx.fillStyle = "rgba(255,255,230," + (0.6 - k * 2) + ")"; ctx.fillRect(x - 14, y - 22, 28, 28); }
        // 칼 부딪힘
        if (k < 0.6) { ctx.drawImage(iconCanvas("sword", 2), x - 22, y - 30); ctx.save(); ctx.translate(x + 22, y - 30); ctx.scale(-1, 1); ctx.drawImage(iconCanvas("sword", 2), 0, 0); ctx.restore(); }
      } else if (a.type === "float") {
        const [x, y] = toScreen(...a.at);
        ctx.font = "bold 13px Galmuri11, monospace"; ctx.textAlign = "center";
        ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) * 5;
        ctx.fillStyle = "#09071a"; ctx.fillText(a.text, x + 2, y - 30 - k * 26 + 2);
        ctx.fillStyle = a.color; ctx.fillText(a.text, x, y - 30 - k * 26);
        ctx.globalAlpha = 1;
      }
      if (k >= 1) { anims.splice(i, 1); a.res && a.res(); }
    }
    // 구름 (화면 위)
    if (st.clouds !== false && cam.z < 3) {
      ctx.setTransform(cam.z, 0, 0, cam.z, -cam.x * cam.z + cw / 2, -cam.y * cam.z + ch / 2);
      for (const cl of clouds) {
        const x = ((cl.x + (now / 1000) * cl.v) % (BW + 200)) - 100;
        ctx.fillStyle = "rgba(245,245,255,.55)"; blob(ctx, x, cl.y, cl.w, cl.seed);
        ctx.fillStyle = "rgba(255,255,255,.75)"; blob(ctx, x + 4, cl.y - 3, cl.w * 0.7, cl.seed + 1);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  function blob(ctx, x, y, w, seed) {
    const u = 4;
    for (let i = 0; i < 5; i++) {
      const bw = Math.round((w * (0.4 + hash(seed * 9 + i) * 0.5)) / u) * u, bh = u * (2 + Math.floor(hash(seed * 7 + i) * 3));
      ctx.fillRect(Math.round((x + (i - 2) * w * 0.18) / u) * u, Math.round((y - bh / 2 + hash(seed + i) * 6) / u) * u, bw, bh);
    }
  }

  // ---------- 선택 화면용 미니 지도 ----------
  function miniMap(cv, colorOfCountry) {
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), img = g.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) {
      let r, gg, b;
      if (land[i]) { const col = rgb(colorOfCountry(P[grid[i]].country)); const n = (hash(i) - 0.5) * 16; [r, gg, b] = [col[0] + n, col[1] + n, col[2] + n]; }
      else { const w = WATER[depth[i] <= 1 ? 3 : depth[i] <= 3 ? 2 : depth[i] <= 6 ? 1 : 0]; [r, gg, b] = w; }
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  function latLonToMini(lat, lon) { return [(lon + 180) / M.RES, (M.LAT_TOP - lat) / M.RES]; }

  return { init, setOwners, draw, cam, flyTo, focusProv, provAtScreen, toWorld, toScreen, labelPos, march, burst, floatText, miniMap, latLonToMini, clampCam, BW, BH, S, LIFT, get busy() { return anims.length > 0 || !!camAnim; } };
})();
