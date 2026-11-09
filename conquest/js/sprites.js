// 도트 그래픽 생성기: 초상화, 꼬마 캐릭터, 아이템 아이콘
"use strict";

const SKINS = [["#f7d6b8", "#e0b08a"], ["#efc49c", "#d29e72"], ["#d8a476", "#b98256"], ["#b47d52", "#93603a"], ["#7d5032", "#5f3b23"]];

function shade(hex, f) {
  // f<0 어둡게, f>0 밝게
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return "#" + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return "#" + ((1 << 24) | (Math.round(A[0] + (B[0] - A[0]) * t) << 16) | (Math.round(A[1] + (B[1] - A[1]) * t) << 8) | Math.round(A[2] + (B[2] - A[2]) * t)).toString(16).slice(1); }

function makeCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

// ---------------- 초상화 (32x32) ----------------
function drawPortrait(ctx, look, ox = 0, oy = 0, bg = null) {
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
  const [sk, sks] = SKINS[look.skin || 0];
  const hair = look.hair || "#222", hairD = shade(hair, -0.35);
  const robe = look.robe || "#844", trim = look.trim || "#eb5";
  if (bg) { P(0, 0, 32, 32, bg); for (let y = 0; y < 32; y += 2) P(0, y, 32, 1, shade(bg, -0.12)); }

  // 긴 머리는 뒤쪽부터
  if (look.hairStyle === "long") { P(8, 11, 3, 14, hair); P(21, 11, 3, 14, hair); P(8, 24, 3, 1, hairD); P(21, 24, 3, 1, hairD); }
  // 어깨/옷
  P(8, 24, 16, 1, robe); P(6, 25, 20, 1, robe); P(4, 26, 24, 6, robe);
  P(4, 26, 2, 6, shade(robe, -0.25)); P(26, 26, 2, 6, shade(robe, -0.25));
  P(14, 24, 4, 2, trim); P(15, 26, 2, 6, trim); P(12, 25, 2, 1, trim); P(18, 25, 2, 1, trim);
  // 목
  P(13, 21, 6, 4, sks);
  // 얼굴
  P(11, 10, 10, 12, sk); P(10, 11, 12, 10, sk);
  P(21, 11, 1, 10, sks); P(11, 21, 10, 1, sks); P(20, 21, 1, 1, sks);
  // 귀
  P(9, 14, 1, 3, sk); P(22, 14, 1, 3, sks);
  // 눈썹·눈
  const eye = "#1b1420";
  if (look.eyes === "fierce") { P(11, 13, 3, 1, hairD); P(18, 13, 3, 1, hairD); P(13, 14, 1, 1, hairD); P(18, 14, 1, 1, hairD); }
  else if (look.eyes === "soft") { P(12, 13, 2, 1, hairD); P(18, 13, 2, 1, hairD); }
  else { P(11, 13, 3, 1, hairD); P(18, 13, 3, 1, hairD); }
  P(12, 15, 2, 2, eye); P(18, 15, 2, 2, eye); P(12, 15, 1, 1, "#ffffff"); P(18, 15, 1, 1, "#ffffff");
  if (look.eyes === "soft") { P(11, 15, 1, 1, eye); P(20, 15, 1, 1, eye); P(11, 18, 2, 1, "#e89a8a"); P(19, 18, 2, 1, "#e89a8a"); }
  // 코·입
  P(16, 17, 1, 2, sks); P(14, 19, 4, 1, "#9e4c45"); if (look.eyes === "soft") P(15, 20, 2, 1, "#c96a62");

  // 머리카락
  const hs = look.hairStyle || "short";
  if (hs !== "bald") {
    P(10, 8, 12, 3, hair); P(9, 10, 2, 5, hair); P(21, 10, 2, 5, hair); P(11, 7, 10, 1, hair);
    P(10, 11, 3, 1, hair); P(19, 11, 3, 1, hair); P(12, 8, 6, 1, shade(hair, 0.25));
    if (hs === "bun") { P(13, 3, 6, 4, hair); P(14, 2, 4, 1, hair); P(14, 4, 2, 1, shade(hair, 0.25)); }
    if (hs === "topknot") { P(14, 4, 4, 3, hair); P(15, 3, 2, 1, hair); }
  } else { P(11, 9, 10, 1, sks); }
  // 수염
  const bd = look.beard || "none";
  if (bd !== "none") { P(13, 18, 6, 1, hair); P(12, 19, 2, 1, hair); P(18, 19, 2, 1, hair); }
  if (bd === "goatee") { P(14, 20, 4, 3, hair); P(15, 23, 2, 1, hair); }
  if (bd === "full" || bd === "long") { P(10, 17, 2, 4, hair); P(20, 17, 2, 4, hair); P(11, 20, 10, 3, hair); P(14, 19, 4, 1, "#9e4c45"); P(12, 23, 8, 1, hair); }
  if (bd === "long") { P(13, 24, 6, 3, hair); P(14, 27, 4, 2, hair); P(15, 29, 2, 1, hairD); }
  if (look.ruff) { for (let x = 9; x < 23; x += 2) { P(x, 22, 2, 2, "#f4f1ea"); P(x, 24, 1, 1, "#d8d2c6"); } }

  // 모자
  const G = "#e8b93a", GD = "#a8771c", RED = "#c8243a", BLU = "#2c6bd1", BLK = "#1c1a22";
  switch (look.hat) {
    case "crown":
      P(10, 7, 12, 3, G); P(10, 9, 12, 1, GD); P(10, 4, 2, 3, G); P(15, 3, 2, 4, G); P(20, 4, 2, 3, G); P(13, 5, 1, 2, G); P(18, 5, 1, 2, G);
      P(15, 8, 2, 1, RED); P(11, 8, 1, 1, BLU); P(20, 8, 1, 1, BLU); break;
    case "goldcrown":
      P(9, 5, 14, 5, G); P(9, 9, 14, 1, GD); P(9, 2, 2, 3, G); P(12, 3, 2, 2, G); P(15, 1, 2, 4, G); P(18, 3, 2, 2, G); P(21, 2, 2, 3, G);
      P(15, 6, 2, 2, "#2fae6a"); P(11, 7, 1, 1, RED); P(20, 7, 1, 1, RED); P(15, 0, 2, 1, "#fff3a8"); break;
    case "tiara":
      P(11, 8, 10, 1, "#d9dbe6"); P(15, 6, 2, 2, "#9fd8ff"); P(13, 7, 1, 1, "#d9dbe6"); P(18, 7, 1, 1, "#d9dbe6"); break;
    case "laurel":
      for (let x = 9; x < 23; x += 2) { P(x, 9, 2, 1, "#4f9a3a"); P(x + 1, 8, 1, 1, "#7cc35a"); }
      P(9, 10, 1, 2, "#4f9a3a"); P(22, 10, 1, 2, "#4f9a3a"); break;
    case "bicorne":
      P(4, 6, 24, 3, BLK); P(7, 4, 18, 2, BLK); P(11, 2, 10, 2, BLK); P(4, 8, 24, 1, G); P(14, 3, 3, 3, "#d8d8e8"); P(15, 4, 1, 1, RED); P(13, 9, 6, 1, BLK); break;
    case "tricorn":
      P(7, 6, 18, 4, BLK); P(9, 4, 14, 2, BLK); P(7, 9, 18, 1, G); P(6, 7, 2, 2, BLK); P(24, 7, 2, 2, BLK); P(15, 5, 2, 1, G); break;
    case "turban":
      P(9, 4, 14, 7, "#f1ece0"); P(10, 3, 12, 1, "#f1ece0"); P(9, 6, 14, 1, "#d6cfbf"); P(9, 9, 14, 1, "#d6cfbf");
      P(15, 6, 2, 2, RED); P(16, 1, 1, 3, "#f4f4f4"); P(17, 0, 1, 2, "#d9d9d9"); break;
    case "bigturban":
      P(7, 2, 18, 9, "#f6f2e8"); P(9, 0, 14, 2, "#f6f2e8"); P(7, 4, 18, 1, "#ddd5c4"); P(7, 7, 18, 1, "#ddd5c4"); P(13, 0, 6, 3, RED);
      P(15, 5, 2, 2, "#2fae6a"); P(16, 1, 1, 1, G); break;
    case "mongol":
      P(10, 3, 12, 6, "#2b5d8f"); P(12, 2, 8, 1, "#2b5d8f"); P(15, 0, 2, 2, RED); P(8, 8, 16, 3, "#7a5634"); P(8, 8, 16, 1, "#9a7450"); P(9, 10, 2, 3, "#7a5634"); P(21, 10, 2, 3, "#7a5634"); break;
    case "kabuto":
      P(8, 5, 16, 6, "#2a2a32"); P(10, 4, 12, 1, "#2a2a32"); P(7, 10, 18, 2, "#3a3a46"); P(8, 12, 2, 4, "#3a3a46"); P(22, 12, 2, 4, "#3a3a46");
      P(10, 1, 2, 4, G); P(9, 0, 2, 2, G); P(20, 1, 2, 4, G); P(21, 0, 2, 2, G); P(15, 4, 2, 3, G); P(15, 7, 2, 1, RED); break;
    case "corinth":
      P(9, 5, 14, 7, "#c58b3a"); P(10, 4, 12, 1, "#c58b3a"); P(9, 12, 2, 7, "#c58b3a"); P(21, 12, 2, 7, "#c58b3a"); P(15, 12, 2, 4, "#c58b3a");
      P(9, 5, 14, 1, "#e0ad5c"); P(11, 0, 10, 4, RED); P(10, 1, 1, 3, RED); P(21, 1, 1, 3, RED); P(12, 0, 8, 1, "#e5505e"); break;
    case "ikseon":
      P(10, 5, 12, 6, BLK); P(11, 4, 10, 1, BLK); P(10, 10, 12, 1, "#3a3644"); P(11, 1, 4, 4, BLK); P(17, 1, 4, 4, BLK); P(12, 2, 2, 1, "#3a3644"); P(18, 2, 2, 1, "#3a3644"); break;
    case "mian":
      P(5, 3, 22, 2, BLK); P(5, 3, 22, 1, RED); P(11, 5, 10, 5, BLK);
      for (let x = 6; x < 27; x += 3) { P(x, 5, 1, 1, "#e8d080"); P(x, 7, 1, 1, "#d84a4a"); P(x, 9, 1, 1, "#e8d080"); } break;
    case "nemes":
      for (let y = 6; y < 11; y++) P(9, y, 14, 1, y % 2 ? BLU : G);
      P(10, 5, 12, 1, G); for (let y = 11; y < 23; y++) { const c = y % 2 ? BLU : G; P(7, y, 3, 1, c); P(22, y, 3, 1, c); }
      P(15, 4, 2, 3, G); P(15, 4, 2, 1, "#2fae6a"); break;
    case "llautu":
      for (let x = 9; x < 23; x++) P(x, 9, 1, 2, ["#c0392b", "#f1c40f", "#27ae60", "#2980b9"][x % 4]);
      P(14, 11, 4, 2, G); P(15, 4, 2, 5, "#e74c3c"); P(16, 2, 1, 3, "#f39c12"); break;
  }
}

function portraitCanvas(look, scale = 4, bg = null) {
  const c = makeCanvas(32 * scale, 32 * scale);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const tmp = makeCanvas(32, 32);
  drawPortrait(tmp.getContext("2d"), look, 0, 0, bg);
  g.drawImage(tmp, 0, 0, 32 * scale, 32 * scale);
  return c;
}

// ---------------- 꼬마 캐릭터 (16x20) ----------------
// dir: 0 아래, 1 위, 2 왼, 3 오른
function drawChibi(ctx, x, y, o, dir = 0, frame = 0) {
  const P = (px, py, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + px, y + py, w, h); };
  const [sk, sks] = SKINS[o.skin || 0];
  const hair = o.hair || "#333", robe = o.robe || "#55a", robeD = shade(robe, -0.3), trim = o.trim || "#eb5";
  const bob = frame % 2 ? 1 : 0;
  // 다리
  const shoe = "#2a2230";
  if (frame % 2 === 0) { P(5, 17, 2, 2, shoe); P(9, 17, 2, 2, shoe); }
  else if (dir >= 2) { P(4, 17, 2, 2, shoe); P(10, 17, 2, 2, shoe); }
  else { P(5, 17, 2, 1, shoe); P(9, 17, 2, 2, shoe); }
  // 몸통 (로브)
  P(4, 11 + bob, 8, 6, robe); P(3, 13 + bob, 10, 4, robe); P(3, 16 + bob, 10, 1, robeD);
  if (dir === 0) { P(7, 11 + bob, 2, 6, trim); }
  if (o.cape) { if (dir === 1) P(3, 11 + bob, 10, 6, o.cape); else { P(2, 12 + bob, 1, 5, o.cape); P(13, 12 + bob, 1, 5, o.cape); } }
  // 팔
  if (dir !== 1) { P(2, 12 + bob, 2, 3, robeD); P(12, 12 + bob, 2, 3, robeD); P(2, 15 + bob, 2, 1, sk); P(12, 15 + bob, 2, 1, sk); }
  // 머리
  const hy = bob;
  P(3, 2 + hy, 10, 9, sk); P(4, 1 + hy, 8, 1, sk); P(12, 3 + hy, 1, 7, sks);
  // 머리카락
  if (o.hairStyle !== "bald") {
    P(3, 1 + hy, 10, 3, hair); P(4, 0 + hy, 8, 1, hair);
    if (dir === 1) P(3, 1 + hy, 10, 8, hair);
    if (dir === 2) P(8, 1 + hy, 5, 7, hair);
    if (dir === 3) P(3, 1 + hy, 5, 7, hair);
    if (dir === 0) { P(3, 4 + hy, 1, 3, hair); P(12, 4 + hy, 1, 3, hair); }
    if (o.hairStyle === "long") { P(2, 3 + hy, 2, 8, hair); P(12, 3 + hy, 2, 8, hair); }
  }
  // 얼굴
  const eye = "#1b1420";
  if (dir === 0) { P(5, 6 + hy, 1, 2, eye); P(10, 6 + hy, 1, 2, eye); P(4, 8 + hy, 1, 1, "#eda39a"); P(11, 8 + hy, 1, 1, "#eda39a"); }
  if (dir === 2) { P(4, 6 + hy, 1, 2, eye); }
  if (dir === 3) { P(11, 6 + hy, 1, 2, eye); }
  if (o.beard && dir !== 1) { const bx = dir === 2 ? 3 : dir === 3 ? 7 : 5; P(bx, 9 + hy, 6, 2, o.beardColor || hair); }
  // 모자
  const G = "#e8b93a";
  switch (o.hat) {
    case "crown": P(4, -2 + hy, 8, 2, G); P(4, -4 + hy, 1, 2, G); P(7, -4 + hy, 2, 2, G); P(11, -4 + hy, 1, 2, G); P(7, -1 + hy, 2, 1, "#c8243a"); break;
    case "wizard": P(3, 0 + hy, 10, 2, o.hatColor || "#5b3f9e"); P(5, -3 + hy, 6, 3, o.hatColor || "#5b3f9e"); P(7, -6 + hy, 3, 3, o.hatColor || "#5b3f9e"); P(8, -7 + hy, 2, 1, G); break;
    case "helmet": P(3, -1 + hy, 10, 4, "#9aa4b5"); P(3, 2 + hy, 10, 1, "#6b7486"); P(7, -3 + hy, 2, 2, "#c8243a"); break;
    case "hood": P(2, 0 + hy, 12, 4, o.hatColor || "#6b4a2a"); P(2, 4 + hy, 2, 6, o.hatColor || "#6b4a2a"); P(12, 4 + hy, 2, 6, o.hatColor || "#6b4a2a"); break;
    case "turban": P(3, -2 + hy, 10, 4, o.hatColor || "#f1ece0"); P(3, 0 + hy, 10, 1, shade(o.hatColor || "#f1ece0", -0.2)); P(7, -2 + hy, 2, 2, "#e8b93a"); break;
    case "gat": P(1, 0 + hy, 14, 1, "#1c1a22"); P(5, -3 + hy, 6, 3, "#1c1a22"); break;
  }
}

function chibiCanvas(o, scale = 1) {
  // 4방향 x 2프레임 시트 (16x26 칸, 발끝이 y=25)
  const c = makeCanvas(16 * 8 * scale, 26 * scale);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const t = makeCanvas(16 * 8, 26);
  const tg = t.getContext("2d");
  for (let d = 0; d < 4; d++) for (let f = 0; f < 2; f++) {
    drawChibi(tg, (d * 2 + f) * 16, 7, o, d, f);
  }
  g.drawImage(t, 0, 0, t.width * scale, t.height * scale);
  return c;
}

// ---------------- 아이템 아이콘 (12x12 문자 도트) ----------------
const ICON_PAL = { k: "#1c1a22", w: "#f4f1ea", g: "#e8b93a", G: "#a8771c", r: "#c8243a", R: "#7e1424", b: "#3d78d8", B: "#22437e", n: "#8a5a2b", N: "#5a3a1a", s: "#b9c2cf", S: "#6b7486", e: "#3fae5a", E: "#21703a", p: "#8e5cc8", y: "#fff1a0", o: "#e67e22", c: "#9fd8ff" };
const ICONS = {
  horn: ["............", "..........w.", ".........ww.", "........gww.", ".......ggw..", "..G..gggg...", ".GGgggggg...", "GGGggggg....", ".GGgggg.....", "..GGg.......", "...nn.......", "............"],
  chest: ["............", "..nnnnnnnn..", ".nNNNNNNNNn.", ".nNyyyyyyNn.", ".gggggggggg.", ".nnnngGnnnn.", ".nNNNgGNNNn.", ".nNNNNNNNNn.", ".nNNNNNNNNn.", ".gggggggggg.", "............", "............"],
  scroll: ["............", ".nwwwwwwwn..", "..wwwwwwww..", "..wkkkkkw...", "..wwwwwww...", "..wkkkkww...", "..wwwwwww...", "..wkkkrrw...", "..wwwwrrw...", ".nwwwwwwwn..", "............", "............"],
  dove: ["............", "......ww....", ".....wwwk...", ".....wwwwo..", "..wwwwwww...", ".wwwwwwww...", "wwswwwww....", "..sswww.....", "....e.......", "...ee.......", "............", "............"],
  dagger: ["............", ".........s..", "........ss..", ".......ss...", "......ss....", ".....ss.....", "..g.ss......", "...gg.......", "...ng.......", "..n..g......", ".n..........", "............"],
  catapult: ["............", ".........kk.", "........kk..", ".......n....", "......n.....", ".....n......", "..nnnnnnnn..", "..n......n..", ".kNk....kNk.", "..k......k..", "............", "............"],
  banner: ["............", ".n..........", ".nrrrrrrr...", ".nrrgrrrr...", ".nrgggrrr...", ".nrrgrrrr...", ".nrrrrrrr...", ".nRRRRRRR...", ".n..........", ".n..........", ".n..........", "............"],
  shield: ["............", "..ssssssss..", ".sbbbbbbbbs.", ".sbbbgbbbbs.", ".sbbgggbbbs.", ".sbbbgbbbbs.", ".sbbbbbbbbs.", "..sbbbbbbs..", "...sbbbbs...", "....ssss....", "............", "............"],
  scales: ["............", ".....gg.....", "..gggggggg..", "..g..gg..g..", ".g.g.gg.g.g.", "g...ggg...g.", "ggg..gg.ggg.", ".....gg.....", ".....gg.....", "...gggggg...", "............", "............"],
  crown: ["............", "............", ".g...g...g..", ".gg.ggg.gg..", ".ggggggggg..", ".ggrggbgrg..", ".ggggggggg..", ".GGGGGGGGG..", "............", "............", "............", "............"],
  map: ["............", ".wwwwwwwwww.", ".wewwbbwwew.", ".weewbbweew.", ".wwewbbwwew.", ".wwwwbbrwww.", ".wewwwrrrww.", ".weewwwrwew.", ".wwwwwwwwww.", "..n......n..", "............", "............"],
  compass: ["............", "...ssssss...", "..s......s..", ".s...r....s.", ".s...rr...s.", ".s..kgk...s.", ".s...bb...s.", ".s...b....s.", "..s......s..", "...ssssss...", "............", "............"],
  hourglass: ["............", "..nnnnnnnn..", "...cccccc...", "...cyyyyc...", "....cyyc....", ".....yc.....", ".....cy.....", "....cccc....", "...cyyyyc...", "..nnnnnnnn..", "............", "............"],
  gold: ["............", "....gggg....", "...gyyyyg...", "..gyGggGyg..", "..gyGgggyg..", "..gyggGgyg..", "..gyGggGyg..", "...gyyyyg...", "....gggg....", "............", "............", "............"],
  sword: ["............", ".........ss.", "........sss.", ".......sss..", "......sss...", "..g..sss....", "...gsss.....", "...ngg......", "..nn.g......", ".nn.........", "............", "............"],
  people: ["............", "..kk....kk..", ".kwwk..kwwk.", ".kwwk..kwwk.", "..kk....kk..", ".bbbb..rrrr.", "bbbbbbrrrrrr", "bbbbbbrrrrrr", ".b..b..r..r.", "............", "............", "............"],
};
const _iconCache = {};
function iconCanvas(name, scale = 3) {
  const key = name + "@" + scale;
  if (_iconCache[key]) return _iconCache[key];
  const rows = ICONS[name] || ICONS.gold;
  const c = makeCanvas(12 * scale, 12 * scale);
  const g = c.getContext("2d");
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") { g.fillStyle = ICON_PAL[ch]; g.fillRect(x * scale, y * scale, scale, scale); } }));
  _iconCache[key] = c;
  return c;
}
function iconDataURL(name, scale = 3) { return iconCanvas(name, scale).toDataURL(); }
