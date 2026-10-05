// shared/cash.ts
var CASH_PRODUCTS = [
  { id: 0, name: "\uCC9C\uACF5\uC758 \uC57D\uC18D", description: "\uAE08\uBE5B \uBCC4 \uBB38\uC591\uC758 \uD6C4\uC6D0 \uC804\uC6A9 \uB9D0\uD48D\uC120", price: 200, kind: "bubble", value: 12, image: "/bubbles/12.svg" },
  { id: 1, name: "\uBD89\uC740 \uC6D4\uC2DD", description: "\uBD89\uC740 \uBCF4\uC11D\uC744 \uD488\uC740 \uD6C4\uC6D0 \uC804\uC6A9 \uB9D0\uD48D\uC120", price: 250, kind: "bubble", value: 13, image: "/bubbles/13.svg" },
  { id: 2, name: "\uC624\uB85C\uB77C\uC758 \uD3B8\uC9C0", description: "\uCCAD\uB85D\uBE5B \uC624\uB85C\uB77C \uBB38\uC591\uC758 \uD6C4\uC6D0 \uC804\uC6A9 \uB9D0\uD48D\uC120", price: 300, kind: "bubble", value: 14, image: "/bubbles/14.svg" },
  { id: 3, name: "\uC655\uC758 \uBCC4\uC790\uB9AC", description: "\uC655\uAD00\uACFC \uBCC4\uC774 \uC7A5\uC2DD\uB41C \uD6C4\uC6D0 \uC804\uC6A9 \uB9D0\uD48D\uC120", price: 350, kind: "bubble", value: 15, image: "/bubbles/15.svg" },
  { id: 4, name: "\uBCC4\uC758 \uD6C4\uC6D0\uC790", description: "\uCE90\uB9AD\uD130 \uC774\uB984 \uC606\uC5D0 \uD45C\uC2DC\uD558\uB294 \uC601\uAD6C \uCE6D\uD638", price: 300, kind: "title", value: 0, image: "" },
  { id: 5, name: "\uC0C8\uBCBD\uC758 \uC218\uD638\uC790", description: "\uC0C8\uB85C\uC6B4 \uC0C8\uBCBD\uC744 \uC5EC\uB294 \uD6C4\uC6D0\uC790 \uCE6D\uD638", price: 450, kind: "title", value: 1, image: "" },
  { id: 6, name: "\uC804\uC124 \uBB34\uAE30 \uC0C1\uC790", description: "\uD604\uC7AC \uC9C1\uC5C5\uC5D0 \uB9DE\uB294 \uC804\uC124 \uBB34\uAE30 1\uAC1C", price: 500, kind: "weapon", value: 0, image: "" },
  { id: 7, name: "\uBCC4\uAC00\uB8E8 \uC624\uB85C\uB77C", description: "\uBCF4\uB78F\uBE5B \uBCC4\uAC00\uB8E8 \uC22B\uC790 \uB370\uBBF8\uC9C0 \uC2A4\uD0A8 \xB7 \uB2A5\uB825\uCE58 \uBCC0\uD654 \uC5C6\uC74C", price: 200, kind: "damageSkin", value: 3, image: "" },
  { id: 8, name: "\uD0DC\uC591\uC758 \uBD88\uAF43", description: "\uBD89\uC740 \uBD88\uAF43 \uC22B\uC790 \uB370\uBBF8\uC9C0 \uC2A4\uD0A8 \xB7 \uB2A5\uB825\uCE58 \uBCC0\uD654 \uC5C6\uC74C", price: 250, kind: "damageSkin", value: 4, image: "" },
  { id: 9, name: "\uCC9C\uC0C1\uC758 \uB9F9\uC138", description: "\uC740\uBE5B\uACFC \uAE08\uBE5B\uC758 \uC22B\uC790 \uB370\uBBF8\uC9C0 \uC2A4\uD0A8 \xB7 \uB2A5\uB825\uCE58 \uBCC0\uD654 \uC5C6\uC74C", price: 300, kind: "damageSkin", value: 5, image: "" }
];
var DONATION_PACKS = [{ id: 0, won: 3e3, cash: 300 }, { id: 1, won: 5e3, cash: 500 }, { id: 2, won: 1e4, cash: 1e3 }];

// server/cash.ts
function cashSettings(w) {
  return w.shopSettings || { donationGuide: "", donationUrl: "" };
}
function cashInput(w, p, i, now) {
  if (i.action === "donationRequest") {
    const pack = DONATION_PACKS[Number(i.value)];
    if (!pack)
      return;
    if (!cashSettings(w).donationGuide.trim()) {
      p.notice = "\uC6B4\uC601\uC790\uAC00 \uD6C4\uC6D0 \uC548\uB0B4\uB97C \uB4F1\uB85D\uD55C \uB4A4 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      return;
    }
    w.donations ??= [];
    if (w.donations.some((d) => d.playerId === p.id && d.status === "pending")) {
      p.notice = "\uC774\uBBF8 \uD655\uC778\uC744 \uAE30\uB2E4\uB9AC\uB294 \uD6C4\uC6D0 \uC694\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4.";
      return;
    }
    if (w.donations.filter((d) => d.playerId === p.id).length >= 100) {
      p.notice = "\uC6B4\uC601\uC790\uC5D0\uAC8C \uC9C1\uC811 \uBB38\uC758\uD558\uC138\uC694.";
      return;
    }
    const reference = typeof i.reference === "string" ? i.reference.replace(/[<>\x00-\x1f]/g, "").trim().slice(0, 100) : "";
    if (reference.length < 2) {
      p.notice = "\uD6C4\uC6D0\uC790\uBA85 \uB610\uB294 \uACB0\uC81C \uD655\uC778\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694.";
      return;
    }
    w.donations.push({ id: crypto.randomUUID(), playerId: p.id, name: p.name, pack: pack.id, won: pack.won, cash: pack.cash, reference, created: now, status: "pending", revision: 0 });
    p.notice = "\uD6C4\uC6D0 \uD655\uC778 \uC694\uCCAD\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uACB0\uC81C \uD655\uC778 \uD6C4 GM\uC774 \uCE90\uC2DC\uB97C \uC9C0\uAE09\uD569\uB2C8\uB2E4.";
    return;
  }
  if (i.action === "cashBuy") {
    const product = CASH_PRODUCTS.find((product2) => product2.id === i.value);
    if (!product)
      return;
    p.cashPurchases ??= [];
    if (product.kind !== "weapon" && p.cashPurchases.includes(product.id)) {
      p.notice = "\uC774\uBBF8 \uBCF4\uC720\uD55C \uC0C1\uD488\uC785\uB2C8\uB2E4.";
      return;
    }
    if ((p.cash || 0) < product.price) {
      p.notice = "\uCE90\uC2DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4. \uD6C4\uC6D0 \uD655\uC778 \uD6C4 \uC9C0\uAE09\uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      return;
    }
    if (product.kind === "weapon" && p.inventory.length >= 60) {
      p.notice = "\uAC00\uBC29 \uACF5\uAC04\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.";
      return;
    }
    p.cash = (p.cash || 0) - product.price;
    if (!p.cashPurchases.includes(product.id))
      p.cashPurchases.push(product.id);
    if (product.kind === "bubble") {
      p.bubbles ??= [0];
      if (!p.bubbles.includes(product.value))
        p.bubbles.push(product.value);
      p.bubbleId = product.value;
    }
    if (product.kind === "damageSkin") {
      p.damageSkins ??= [];
      if (!p.damageSkins.includes(product.value)) p.damageSkins.push(product.value);
      p.damageSkinId = product.value;
    }
    if (product.kind === "title")
      p.cashTitle = product.name;
    if (product.kind === "weapon")
      p.inventory.push(14 + p.classId);
    p.notice = product.name + " \uAD6C\uB9E4 \uC644\uB8CC";
    return;
  }
  if (i.action === "cashEquip") {
    const product = CASH_PRODUCTS.find((product2) => product2.id === i.value);
    if (product && p.cashPurchases?.includes(product.id)) {
      if (product.kind === "title")
        p.cashTitle = product.name;
      if (product.kind === "damageSkin" && p.damageSkins?.includes(product.value)) p.damageSkinId = product.value;
      if (product.kind === "bubble")
        p.bubbleId = product.value;
      p.notice = product.name + " \uC801\uC6A9";
    }
    if (i.value === -1) {
      delete p.cashTitle;
      p.notice = "\uCE6D\uD638 \uD45C\uC2DC\uB97C \uD574\uC81C\uD588\uC2B5\uB2C8\uB2E4.";
    }
  }
}
function configureCash(w, body) {
  if (typeof body.donationGuide !== "string" || typeof body.donationUrl !== "string")
    throw new Error("\uD6C4\uC6D0 \uC548\uB0B4\uB97C \uC785\uB825\uD558\uC138\uC694.");
  const guide = body.donationGuide.trim().slice(0, 500), value = body.donationUrl.trim();
  if (value) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error("\uD6C4\uC6D0 \uB9C1\uD06C\uB294 HTTPS \uC8FC\uC18C\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  }
  w.shopSettings = { donationGuide: guide, donationUrl: value };
  return w.shopSettings;
}
function approveDonation(w, body, now) {
  const d = w.donations?.find((d2) => d2.id === body.id);
  if (!d)
    throw new Error("\uC694\uCCAD\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (d.status !== "pending" || body.revision !== d.revision)
    throw new Error("\uC774\uBBF8 \uCC98\uB9AC\uB418\uC5C8\uAC70\uB098 \uBCC0\uACBD\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.");
  if (typeof body.approve !== "boolean")
    throw new Error("\uC2B9\uC778 \uB610\uB294 \uAC70\uC808\uC744 \uC120\uD0DD\uD558\uC138\uC694.");
  const p = w.players[d.playerId];
  if (!p)
    throw new Error("\uB300\uC0C1 \uCE90\uB9AD\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (body.approve && body.confirmReceived !== true)
    throw new Error("\uC2E4\uC81C \uD6C4\uC6D0 \uACB0\uC81C \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  const before = p.cash || 0;
  if (body.approve && before + d.cash > 1e9)
    throw new Error("\uCE90\uC2DC \uBCF4\uC720 \uD55C\uB3C4\uB97C \uB118\uC2B5\uB2C8\uB2E4.");
  if (body.approve)
    p.cash = before + d.cash;
  d.status = body.approve ? "approved" : "rejected";
  d.revision++;
  d.processed = now;
  p.gmRevision = (p.gmRevision || 0) + 1;
  p.notice = body.approve ? `\uD6C4\uC6D0 \uD655\uC778 \uC644\uB8CC! ${d.cash} \uCE90\uC2DC\uAC00 \uC9C0\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : "\uD6C4\uC6D0 \uD655\uC778 \uC694\uCCAD\uC774 \uAC70\uC808\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC138\uC694.";
  w.gmAudit ??= [];
  w.gmAudit.push({ id: crypto.randomUUID(), at: now, playerId: p.id, name: p.name, action: body.approve ? "donationApprove" : "donationReject", reason: d.id, before: { cash: before, status: "pending" }, after: { cash: p.cash || 0, status: d.status, won: d.won, reference: d.reference } });
  w.gmAudit = w.gmAudit.slice(-500);
  return d;
}

// shared/gm-content.ts
var GM_SKINS = [
  { id: 0, name: "\uBCC4\uBE5B \uD1A0\uB07C", color: "#f6c5ff", decoration: "rabbit" },
  { id: 1, name: "\uC544\uAE30 \uACE0\uC591\uC774", color: "#ffe5b2", decoration: "cat" },
  { id: 2, name: "\uAF2C\uB9C8 \uC655\uAD00", color: "#a6f4ec", decoration: "crown" }
];
var GM_TITLES = ["\uB9D0\uB791\uB9D0\uB791 \uC218\uD638\uC790", "\uBCC4\uC0D8\uC758 \uC544\uAE30 \uACE0\uC591\uC774", "\uD1A0\uB07C \uC655\uAD6D\uC758 \uCE5C\uAD6C", "\uAD6C\uB984 \uC704\uC758 \uB0AE\uC7A0", "\uBC18\uC9DD\uBC18\uC9DD \uC6B4\uC601\uC790", "\uC5D0\uD14C\uB9AC\uC544\uC758 \uC218\uD638 GM"];

// shared/social.ts
var BUBBLES = [
  ["\uBCC4\uC0D8", "\u2726", "#fff8e6", "#bfa578", 0],
  ["\uB2EC\uBE5B", "\u263E", "#eee9ff", "#a995dc", 120],
  ["\uC232\uC758 \uD3B8\uC9C0", "\u2767", "#edf9e9", "#84ad82", 180],
  ["\uBE59\uD558", "\u2744", "#e9f5ff", "#81b9dc", 220],
  ["\uC7A5\uBBF8", "\u2740", "#ffeaf1", "#d18caa", 260],
  ["\uD654\uC5FC", "\u2727", "#fff0de", "#d9945a", 300],
  ["\uD669\uAE08 \uC655\uAD00", "\u265B", "#fff5cf", "#bd9644", 400],
  ["\uBC24\uC758 \uBCC4", "\u2726", "#242c50", "#aba8e9", 450],
  ["\uBC14\uB2E4", "\u2248", "#e0f7f4", "#66ada8", 500],
  ["\uBC9A\uAF43", "\u2740", "#fff0f1", "#e3a5ad", 550],
  ["\uD751\uC694\uC11D", "\u25C6", "#28272e", "#c9b897", 650],
  ["\uC740\uD558", "\u2727", "#eee5ff", "#b283d7", 800]
].map(([name, glyph, fill, border, price], id) => ({ id, name: String(name), glyph: String(glyph), fill: String(fill), border: String(border), price: Number(price), cashOnly: false }));
var RAIDS = [{ zone: 25, name: "\uBCC4\uC758 \uD30C\uC218\uAFBC", level: 10, hp: 6500, atk: 18, xp: 500, gold: 350, sprite: 12, minutes: 8 }, { zone: 26, name: "\uC6D4\uC2DD\uC758 \uC2EC\uD310\uC790", level: 20, hp: 16e3, atk: 27, xp: 1400, gold: 800, sprite: 13, minutes: 10 }, { zone: 27, name: "\uCC9C\uACF5\uC758 \uAC70\uC2E0", level: 30, hp: 32e3, atk: 38, xp: 2600, gold: 1400, sprite: 10, minutes: 12 }];
for (const [i, name, fill, border, glyph] of [[12, "\uCC9C\uACF5\uC758 \uC57D\uC18D", "#fff6de", "#b89655", "\u2726"], [13, "\uBD89\uC740 \uC6D4\uC2DD", "#391e31", "#e18a9d", "\u263E"], [14, "\uC624\uB85C\uB77C\uC758 \uD3B8\uC9C0", "#defafa", "#61b8b1", "\u2727"], [15, "\uC655\uC758 \uBCC4\uC790\uB9AC", "#2b2d48", "#e3c98b", "\u265B"]]) BUBBLES.push({ id: i, name, fill, border, glyph, price: 0, cashOnly: true });

// shared/quest-story.ts
var CHAPTER_STORIES = [
  ["\uAEBC\uC838 \uAC00\uB294 \uBCC4\uC0D8", "\uC138\uB77C\uB294 \uBC24\uB9C8\uB2E4 \uB0AE\uC544\uC9C0\uB294 \uBCC4\uC0D8\uC758 \uC218\uC704\uB97C \uBCF4\uC5EC \uC8FC\uC5C8\uB2E4. \uCD08\uC6D0\uC758 \uC2AC\uB77C\uC784\uC774 \uC0BC\uD0A8 \uBE5B\uC744 \uB418\uCC3E\uC544 \uCCAB \uBD09\uC778\uC744 \uBC1D\uD600\uC57C \uD55C\uB2E4.", "\uC2AC\uB77C\uC784\uC5D0\uAC8C\uC11C \uB098\uC628 \uBE5B\uC774 \uC0D8\uC73C\uB85C \uB3CC\uC544\uC654\uB2E4. \uBB3C \uC704\uC5D0 \uC624\uB798\uB41C \uC232\uC758 \uBB38\uC591\uC774 \uB5A0\uC62C\uB790\uB2E4."],
  ["\uC232\uC774 \uC804\uD558\uB294 \uAE30\uC5B5", "\uBB38\uC591\uC744 \uB530\uB77C \uC232\uC5D0 \uB4E4\uC5B4\uC11C\uC790 \uBC84\uC12F\uB4E4\uC774 \uD478\uB978 \uD3EC\uC790\uB97C \uBFDC\uC5C8\uB2E4. \uD3EC\uC790\uC5D0 \uAC07\uD78C \uC218\uD638\uC790\uC758 \uAE30\uC5B5\uC744 \uD574\uBC29\uD558\uBA74 \uBD09\uC778\uC758 \uD589\uBC29\uC744 \uC54C \uC218 \uC788\uB2E4.", "\uC232\uC740 \uCCAB \uBCC4\uC870\uAC01\uC774 \uC720\uC801\uC758 \uBD89\uC740 \uB3CC \uC544\uB798 \uC7A0\uB4E4\uC5C8\uB2E4\uACE0 \uC18D\uC0AD\uC600\uB2E4. \uADF8\uB7EC\uB098 \uADF8 \uAE38\uC744 \uACE0\uBE14\uB9B0\uB4E4\uC774 \uB9C9\uACE0 \uC788\uB2E4."],
  ["\uBE7C\uC557\uAE34 \uC218\uD638\uC790\uC758 \uAE30\uB85D", "\uACE0\uBE14\uB9B0\uB4E4\uC740 \uC720\uC801\uC5D0\uC11C \uAC00\uC838\uC628 \uAE30\uB85D\uC744 \uBD80\uC801\uC73C\uB85C \uC4F0\uACE0 \uC788\uC5C8\uB2E4. \uAE30\uB85D\uC744 \uB418\uCC3E\uC544 \uBCC4\uC870\uAC01\uC5D0 \uC811\uADFC\uD560 \uBC29\uBC95\uC744 \uC54C\uC544\uB0B4\uC790.", "\uAE30\uB85D\uC5D0\uB294 \uD30C\uC218\uAFBC\uC758 \uBD89\uC740 \uACBD\uACE0\uB97C \uD53C\uD558\uB77C\uB294 \uB9D0\uACFC \uC138 \uBCC4\uC870\uAC01\uC758 \uC9C0\uB3C4\uAC00 \uB0A8\uC544 \uC788\uC5C8\uB2E4."],
  ["\uCCAB \uBC88\uC9F8 \uBCC4\uC870\uAC01", "\uBD89\uC740 \uD30C\uC218\uAFBC\uC740 \uBD09\uC778\uC744 \uC9C0\uD0A4\uB2E4 \uC6D4\uC2DD\uC5D0 \uBB3C\uB4E4\uC5C8\uB2E4. \uADF8\uB97C \uC4F0\uB7EC\uB728\uB824 \uCD08\uB85D \uBCC4\uC870\uAC01\uC744 \uAE68\uC6B0\uACE0 \uACE0\uD1B5\uBC1B\uB294 \uC720\uC801\uC744 \uD574\uBC29\uD558\uC790.", "\uCD08\uB85D \uBCC4\uC870\uAC01\uC774 \uC190\uC548\uC5D0\uC11C \uB6F0\uC5C8\uB2E4. \uAC80\uC740 \uB2EC\uC758 \uADF8\uB9BC\uC790\uAC00 \uC131\uC18C\uB85C \uB2EC\uC544\uB0AC\uB2E4."],
  ["\uC6D4\uC2DD\uC758 \uBB38\uC9C0\uAE30", "\uC131\uC18C\uC758 \uAD70\uC8FC\uB294 \uAC80\uC740 \uB2EC\uC758 \uC804\uB839\uC77C \uBFD0\uC774\uC5C8\uB2E4. \uADF8\uAC00 \uC7A0\uADFC \uBCC4\uAE38\uC744 \uC5F4\uC5B4\uC57C \uBD81\uBC29\uACFC \uBD88\uC758 \uB300\uB959\uC73C\uB85C \uAC08 \uC218 \uC788\uB2E4.", "\uC804\uB839\uC774 \uC0AC\uB77C\uC9C0\uC790 \uBA3C \uB300\uB959\uC73C\uB85C \uC774\uC5B4\uC9C0\uB294 \uAE38\uC774 \uC5F4\uB838\uB2E4. \uC138\uB77C\uB294 \uC544\uC9C1 \uB450 \uC870\uAC01\uC744 \uB354 \uCC3E\uC544\uC57C \uD55C\uB2E4\uACE0 \uB9D0\uD588\uB2E4."],
  ["\uBC14\uB78C\uC5D0 \uB0A8\uAE34 \uD3B8\uC9C0", "\uBC14\uB78C\uAF43 \uB4E4\uD310\uC5D0\uC11C \uC21C\uCC30\uC790 \uCE74\uC77C\uC758 \uCC22\uC5B4\uC9C4 \uD3B8\uC9C0\uB97C \uBC1C\uACAC\uD588\uB2E4. \uD30C\uC218\uAFBC\uC774 \uBD99\uC7A1\uC740 \uC5EC\uD589\uC790\uB4E4\uC744 \uAD6C\uD558\uACE0 \uBD81\uCABD \uC18C\uC2DD\uC744 \uBAA8\uC73C\uC790.", "\uAD6C\uCD9C\uD55C \uC5EC\uD589\uC790\uB294 \uD478\uB978 \uC548\uAC1C \uC18D\uC5D0\uC11C \uBCC4\uBE5B\uC744 \uCAD3\uB294 \uADF8\uB9BC\uC790\uB97C \uBCF4\uC558\uB2E4\uACE0 \uB9D0\uD588\uB2E4."],
  ["\uC548\uAC1C \uC18D\uC758 \uBC1C\uC790\uAD6D", "\uC548\uAC1C \uC232\uC758 \uBD09\uC778\uC11D\uC744 \uD30C\uC218\uAFBC\uB4E4\uC774 \uC624\uC5FC\uC2DC\uD0A4\uACE0 \uC788\uB2E4. \uBD09\uC778\uC11D\uC744 \uB418\uC0B4\uB824 \uC0AC\uB77C\uC9C4 \uC21C\uCC30\uC790\uC758 \uBC1C\uC790\uAD6D\uC744 \uCC3E\uC544\uBCF4\uC790.", "\uB9D1\uC544\uC9C4 \uC548\uAC1C \uB108\uBA38\uB85C \uC740\uBE5B \uD611\uACE1\uC758 \uC774\uC815\uD45C\uAC00 \uB098\uD0C0\uB0AC\uB2E4."],
  ["\uB3CC\uC544\uC624\uC9C0 \uC54A\uC740 \uC21C\uCC30\uC790", "\uD611\uACE1\uC5D0\uC11C \uC21C\uCC30\uC790\uC758 \uBE48 \uC57C\uC601\uC9C0\uB97C \uCC3E\uC558\uB2E4. \uC6D4\uC2DD\uC758 \uD30C\uC218\uAFBC\uC774 \uAE38\uC744 \uB9C9\uACE0 \uC788\uB2E4. \uADF8\uB4E4\uC744 \uBB3C\uB9AC\uCCD0 \uB0A8\uACA8\uC9C4 \uAD6C\uC870 \uC2E0\uD638\uB97C \uC77D\uC790.", "\uAD6C\uC870 \uC2E0\uD638\uB294 \uC218\uC815 \uC0D8\uD130\uB97C \uAC00\uB9AC\uCF30\uB2E4. \uC21C\uCC30\uC790\uB294 \uC11C\uB9AC\uBB38\uC758 \uC5F4\uC1E0\uB97C \uCC3E\uACE0 \uC788\uC5C8\uB2E4."],
  ["\uC11C\uB9AC\uBB38\uC758 \uC5F4\uC1E0", "\uC218\uC815 \uC0D8\uD130\uC758 \uD30C\uC218\uAFBC\uC774 \uC5BC\uC5B4\uBD99\uC740 \uC5F4\uC1E0\uB97C \uD488\uACE0 \uC788\uB2E4. \uBCC4\uC0D8\uC758 \uBE5B\uC73C\uB85C \uC5F4\uC1E0\uC5D0 \uBB3B\uC740 \uC6D4\uC2DD\uC758 \uAE30\uC6B4\uC744 \uAC77\uC5B4\uB0B4\uC790.", "\uC5F4\uC1E0\uAC00 \uAE68\uC5B4\uB0AC\uC9C0\uB9CC \uBB38\uC744 \uC5F4\uB824\uBA74 \uACE0\uBAA9\uC5D0 \uBB36\uC778 \uBCC4\uAE38\uC744 \uBA3C\uC800 \uD480\uC5B4\uC57C \uD55C\uB2E4."],
  ["\uAC80\uC740 \uBFCC\uB9AC\uC758 \uB9E4\uB4ED", "\uACE0\uBAA9\uC758 \uBFCC\uB9AC\uB97C \uB4A4\uD2C0\uACE0 \uC788\uB294 \uC6D4\uC2DD\uC758 \uBD84\uC2E0\uC744 \uCC98\uCE58\uD558\uC790. \uCD08\uB85D \uBCC4\uC870\uAC01\uC758 \uD798\uC774 \uB098\uBB34\uB97C \uB2E4\uC2DC \uC0B4\uB9B4 \uC218 \uC788\uB2E4.", "\uBFCC\uB9AC\uAC00 \uD480\uB9AC\uBA70 \uBD81\uBC29\uC758 \uBB38\uC774 \uC5F4\uB838\uB2E4. \uBC14\uB78C\uC5D0 \uC21C\uCC30\uC790\uC758 \uAC10\uC0AC \uC778\uC0AC\uAC00 \uC2E4\uB824 \uC654\uB2E4."],
  ["\uC7A0\uAE34 \uBD81\uBC29\uC758 \uBB38", "\uC11C\uB9AC\uBB38 \uACE0\uAC1C\uC758 \uD30C\uC218\uAFBC\uC740 \uC624\uB798\uC804 \uBD81\uBC29 \uC0AC\uB78C\uB4E4\uC744 \uC9C0\uCF30\uB2E4. \uADF8\uB4E4\uC744 \uC6D4\uC2DD\uC5D0\uC11C \uD574\uBC29\uD558\uACE0 \uBC31\uC57C \uB300\uB959\uC73C\uB85C \uB4E4\uC5B4\uAC00\uC790.", "\uC5BC\uC74C \uBB38\uC774 \uC6C0\uC9C1\uC600\uB2E4. \uBB38 \uB108\uBA38\uC5D0\uB294 \uB208 \uC18D\uC5D0 \uBB3B\uD78C \uB4F1\uBD88\uB4E4\uC774 \uBCF4\uC600\uB2E4."],
  ["\uB208 \uC18D\uC758 \uB4F1\uBD88", "\uB208\uAF43 \uD3C9\uC6D0\uC758 \uB4F1\uBD88\uC744 \uAEBC\uB728\uB9AC\uB294 \uD30C\uC218\uAFBC\uC744 \uBB3C\uB9AC\uCE58\uC790. \uB4F1\uBD88\uC774 \uCF1C\uC9C0\uBA74 \uAE38\uC744 \uC783\uC740 \uC0AC\uB78C\uB4E4\uB3C4 \uAD11\uC7A5\uC73C\uB85C \uB3CC\uC544\uC62C \uC218 \uC788\uB2E4.", "\uB2E4\uC2DC \uCF1C\uC9C4 \uB4F1\uBD88\uC774 \uBE59\uACB0 \uD638\uC218\uAE4C\uC9C0 \uC774\uC5B4\uC84C\uB2E4. \uC5BC\uC74C \uC544\uB798 \uBB34\uC5B8\uAC00 \uBE5B\uB098\uACE0 \uC788\uB2E4."],
  ["\uC5BC\uC74C \uC544\uB798\uC758 \uC57D\uC18D", "\uBE59\uACB0 \uD638\uC218\uC5D0 \uC218\uD638\uC790\uC758 \uB9C8\uC9C0\uB9C9 \uC57D\uC18D\uC774 \uBD09\uC778\uB418\uC5B4 \uC788\uB2E4. \uD30C\uC218\uAFBC\uC758 \uC0AC\uC2AC\uC744 \uB04A\uC5B4 \uAE30\uB85D\uC744 \uC77D\uC790.", "\uAE30\uB85D\uC5D0\uB294 \uBC31\uC57C\uC758 \uC232\uC744 \uC9C0\uB098 \uC5BC\uC74C \uC655\uAD00\uC5D0 \uB3C4\uB2EC\uD558\uBA74 \uD478\uB978 \uBCC4\uC870\uAC01\uC744 \uB9CC\uB0A0 \uC218 \uC788\uB2E4\uACE0 \uC801\uD600 \uC788\uC5C8\uB2E4."],
  ["\uC7A0\uB4E4\uC9C0 \uBABB\uD558\uB294 \uC232", "\uBC31\uC57C\uC758 \uC232\uC744 \uB5A0\uB3C4\uB294 \uD30C\uC218\uAFBC\uB4E4\uC744 \uD574\uBC29\uD558\uC790. \uC624\uB798\uB41C \uC218\uD638\uC790\uB4E4\uC774 \uC7A0\uB4E4\uC5B4\uC57C \uC655\uAD00\uC73C\uB85C \uAC00\uB294 \uAE38\uC774 \uC5F4\uB9B0\uB2E4.", "\uC232\uC5D0 \uCC98\uC74C\uC73C\uB85C \uC870\uC6A9\uD55C \uBC24\uC774 \uCC3E\uC544\uC654\uB2E4. \uBD81\uCABD \uD558\uB298\uC5D0 \uC655\uAD00 \uBAA8\uC591\uC758 \uBCC4\uC790\uB9AC\uAC00 \uB5A0\uC62C\uB790\uB2E4."],
  ["\uB450 \uBC88\uC9F8 \uBCC4\uC870\uAC01", "\uC5BC\uC74C \uC655\uAD00 \uC720\uC801\uC758 \uC6D4\uC2DD \uBD84\uC2E0\uC744 \uC4F0\uB7EC\uB728\uB824 \uD478\uB978 \uBCC4\uC870\uAC01\uC744 \uB418\uCC3E\uC790. \uBCC4\uC870\uAC01\uC740 \uC5BC\uC5B4\uBD99\uC740 \uB300\uB959\uC758 \uAE30\uC5B5\uC744 \uD488\uACE0 \uC788\uB2E4.", "\uD478\uB978 \uC870\uAC01\uC774 \uCD08\uB85D \uC870\uAC01\uACFC \uACF5\uBA85\uD588\uB2E4. \uB0A8\uCABD \uD654\uB85C\uC758 \uBD88\uAF43\uC774 \uB450 \uBE5B\uC5D0 \uB2F5\uD588\uB2E4."],
  ["\uC7BF\uBE5B \uAD6D\uACBD\uC758 \uAD6C\uC870", "\uC7BF\uBE5B \uACBD\uACC4\uC5D0\uC11C \uD53C\uB09C\uBBFC\uB4E4\uC758 \uAE38\uC744 \uB9C9\uB294 \uD30C\uC218\uAFBC\uC744 \uCC98\uCE58\uD558\uC790. \uB9C8\uC9C0\uB9C9 \uC870\uAC01\uC758 \uC18C\uBB38\uC740 \uBD88\uC528 \uAD11\uC7A5\uC758 \uB300\uC7A5\uC7A5\uC774\uAC00 \uC54C\uACE0 \uC788\uB2E4.", "\uAD6C\uC870\uB41C \uB300\uC7A5\uC7A5\uC774\uB294 \uC6A9\uAD11\uB85C \uC131\uCC44\uAC00 \uC138 \uBC88\uC9F8 \uC870\uAC01\uC744 \uC5F0\uB8CC\uB85C \uC4F0\uACE0 \uC788\uB2E4\uACE0 \uC804\uD588\uB2E4."],
  ["\uBD88\uC528\uB97C \uC787\uB294 \uB2E4\uB9AC", "\uBD88\uC528 \uD611\uACE1\uC758 \uD30C\uC218\uAFBC\uC744 \uBB3C\uB9AC\uCCD0 \uAD50\uC5ED\uAE38\uC744 \uB418\uC0B4\uB9AC\uC790. \uC131\uCC44\uC758 \uD654\uB85C\uB97C \uB044\uB824\uBA74 \uD769\uC5B4\uC9C4 \uB0C9\uAC01 \uC7A5\uCE58\uB97C \uCC3E\uC544\uC57C \uD55C\uB2E4.", "\uBBF8\uC544\uB294 \uCCAB \uB0C9\uAC01 \uC7A5\uCE58\uB97C \uBCF5\uC6D0\uD588\uB2E4. \uB098\uBA38\uC9C0 \uBD80\uD488\uC740 \uC720\uD669 \uD669\uC57C\uB85C \uC62E\uACA8\uC84C\uB2E4."],
  ["\uACE0\uB300 \uD654\uB85C\uC758 \uC228\uACB0", "\uC720\uD669 \uD669\uC57C\uC758 \uD30C\uC218\uAFBC\uB4E4\uC774 \uB0C9\uAC01 \uC7A5\uCE58\uB97C \uC9C0\uD0A8\uB2E4. \uBD80\uD488\uC744 \uB418\uCC3E\uC544 \uC131\uCC44\uC758 \uC5F4\uAE30\uB97C \uACAC\uB51C \uC900\uBE44\uB97C \uD558\uC790.", "\uB0C9\uAC01 \uC7A5\uCE58\uAC00 \uC644\uC131\uB418\uC5C8\uB2E4. \uC624\uB798\uB41C \uC9C0\uB3C4\uC5D0\uB294 \uC0AC\uB9C9 \uC655\uAD6D\uC758 \uC9C0\uD558 \uD1B5\uB85C\uAC00 \uD45C\uC2DC\uB418\uC5B4 \uC788\uB2E4."],
  ["\uBAA8\uB798\uC5D0 \uBB3B\uD78C \uC655\uAD6D", "\uBD89\uC740 \uC0AC\uB9C9\uC758 \uD30C\uC218\uAFBC\uC744 \uBB3C\uB9AC\uCCD0 \uC9C0\uD558 \uD1B5\uB85C\uB97C \uC5F4\uC790. \uBA78\uB9DD\uD55C \uC655\uAD6D\uC758 \uC0AC\uB78C\uB4E4\uC774 \uB9C8\uC9C0\uB9C9 \uD0C8\uCD9C\uB85C\uB85C \uB0A8\uAE34 \uAE38\uC774\uB2E4.", "\uC9C0\uD558 \uD1B5\uB85C\uAC00 \uC131\uCC44\uC758 \uC2EC\uC7A5\uC73C\uB85C \uC774\uC5B4\uC84C\uB2E4. \uBD89\uC740 \uBCC4\uC870\uAC01\uC758 \uB9E5\uBC15\uC774 \uB4E4\uB9B0\uB2E4."],
  ["\uC138 \uBC88\uC9F8 \uBCC4\uC870\uAC01", "\uC6A9\uAD11\uB85C \uC131\uCC44\uC758 \uC6D4\uC2DD \uBD84\uC2E0\uC744 \uC4F0\uB7EC\uB728\uB9AC\uC790. \uBD89\uC740 \uBCC4\uC870\uAC01\uC744 \uD654\uB85C\uC5D0\uC11C \uAEBC\uB0B4\uBA74 \uC138 \uB300\uB959\uC758 \uBE5B\uC774 \uD558\uB098\uB85C \uBAA8\uC778\uB2E4.", "\uC138 \uC870\uAC01\uC744 \uBAA8\uB450 \uB418\uCC3E\uC558\uB2E4. \uADF8\uB7EC\uB098 \uAC80\uC740 \uB2EC\uC774 \uBCC4\uC0D8\uC73C\uB85C \uD5A5\uD558\uACE0 \uC788\uB2E4. \uC2EC\uC7A5\uC758 \uBD09\uC778\uC744 \uC11C\uB458\uB7EC \uBCF5\uAD6C\uD574\uC57C \uD55C\uB2E4."],
  ["\uD669\uD63C\uC758 \uADC0\uD658", "\uD669\uD63C\uC758 \uAE38\uC5D0 \uB098\uD0C0\uB09C \uD30C\uC218\uAFBC\uC744 \uBB3C\uB9AC\uCE58\uACE0 \uBCC4\uC758 \uBB34\uB364\uC73C\uB85C \uD5A5\uD558\uC790. \uC138\uB77C\uAC00 \uBCF4\uB0B8 \uBCC4\uBE5B \uD3B8\uC9C0\uB294 \uB9C8\uC9C0\uB9C9 \uC758\uC2DD\uC758 \uC7A5\uC18C\uB97C \uAC00\uB9AC\uD0A8\uB2E4.", "\uD3B8\uC9C0\uC5D0\uB294 \uC0AC\uB77C\uC9C4 \uC218\uD638\uC790\uB4E4\uC758 \uC774\uB984\uC744 \uBD88\uB7EC \uBCC4\uC870\uAC01\uC744 \uD558\uB098\uB85C \uC787\uB294 \uC758\uC2DD\uC774 \uC801\uD600 \uC788\uC5C8\uB2E4."],
  ["\uC78A\uD78C \uC218\uD638\uC790\uB4E4\uC758 \uC774\uB984", "\uBCC4\uC758 \uBB34\uB364\uC744 \uC9C0\uD0A4\uB294 \uD30C\uC218\uAFBC\uC744 \uD574\uBC29\uD558\uC790. \uC138 \uBCC4\uC870\uAC01\uC774 \uC7A0\uB4E0 \uC218\uD638\uC790\uB4E4\uC758 \uC774\uB984\uC744 \uAE30\uC5B5\uD558\uACE0 \uC788\uB2E4.", "\uC218\uD638\uC790\uB4E4\uC758 \uBE5B\uC774 \uBAA8\uC5EC \uACF5\uD5C8\uC758 \uD68C\uB791\uC744 \uC5F4\uC5C8\uB2E4. \uAE38 \uB05D\uC5D0\uC11C \uAC80\uC740 \uB2EC\uC774 \uAE30\uB2E4\uB9B0\uB2E4."],
  ["\uACF5\uD5C8\uB97C \uAC74\uB108\uB294 \uBE5B", "\uACF5\uD5C8\uC758 \uD68C\uB791\uC5D0\uC11C \uD30C\uC218\uAFBC\uB4E4\uC774 \uBCC4\uC870\uAC01\uC744 \uBE7C\uC557\uC73C\uB824 \uD55C\uB2E4. \uC138 \uBE5B\uC744 \uC9C0\uD0A4\uBA70 \uC81C\uB2E8\uAE4C\uC9C0 \uB098\uC544\uAC00\uC790.", "\uD68C\uB791\uC744 \uAC74\uB108\uC790 \uBCC4\uC870\uAC01\uC774 \uD558\uB098\uC758 \uC2EC\uC7A5 \uBAA8\uC591\uC73C\uB85C \uC774\uC5B4\uC84C\uB2E4. \uB0A8\uC740 \uAC83\uC740 \uB9C8\uC9C0\uB9C9 \uBD09\uC778\uC774\uB2E4."],
  ["\uAC80\uC740 \uB2EC\uC758 \uB9C8\uC9C0\uB9C9 \uBD09\uC778", "\uAC80\uC740 \uB2EC \uC81C\uB2E8\uC758 \uD30C\uC218\uAFBC\uB4E4\uC744 \uBB3C\uB9AC\uCCD0 \uC2EC\uC7A5\uC73C\uB85C \uD5A5\uD558\uB294 \uBD09\uC778\uC744 \uD480\uC790. \uC138\uB77C\uC640 \uC138 \uB300\uB959\uC758 \uC0AC\uB78C\uB4E4\uC774 \uB2F9\uC2E0\uC758 \uBE5B\uC744 \uAE30\uB2E4\uB9B0\uB2E4.", "\uC81C\uB2E8\uC774 \uBB34\uB108\uC9C0\uBA70 \uC5D0\uD14C\uB9AC\uC544\uC758 \uC2EC\uC7A5\uC774 \uB4DC\uB7EC\uB0AC\uB2E4. \uC9C4\uC815\uD55C \uC6D4\uC2DD\uC758 \uAD70\uC8FC\uAC00 \uADF8 \uC548\uC5D0 \uC228\uC5B4 \uC788\uC5C8\uB2E4."],
  ["\uC5D0\uD14C\uB9AC\uC544\uC758 \uC0C8\uBCBD", "\uC2EC\uC7A5\uC5D0 \uAE43\uB4E0 \uC6D4\uC2DD\uC758 \uAD70\uC8FC\uB97C \uC4F0\uB7EC\uB728\uB9AC\uC790. \uBCC4\uC758 \uD798\uC740 \uD640\uB85C \uC9C0\uD0A4\uB294 \uD798\uC774 \uC544\uB2C8\uB77C \uD568\uAED8 \uC0B4\uC544\uAC08 \uB0B4\uC77C\uC744 \uB418\uCC3E\uB294 \uD798\uC774\uB2E4.", "\uC138 \uBCC4\uC870\uAC01\uC774 \uC5D0\uD14C\uB9AC\uC544\uC758 \uC2EC\uC7A5\uC73C\uB85C \uB3CC\uC544\uAC14\uB2E4. \uC232\uC5D0\uB294 \uC0C8\uC78E\uC774, \uBD81\uBC29\uC5D0\uB294 \uB530\uB73B\uD55C \uD587\uC0B4\uC774, \uBD88\uC758 \uB300\uB959\uC5D0\uB294 \uB9D1\uC740 \uBC14\uB78C\uC774 \uCC3E\uC544\uC654\uB2E4. \uC138\uB77C\uB294 \uC0C8\uB85C\uC6B4 \uC0C8\uBCBD\uC758 \uC218\uD638\uC790\uC778 \uB2F9\uC2E0\uC744 \uB9DE\uC558\uB2E4."]
];

// shared/content.ts
var WORLD = { w: 1800, h: 1200, speed: 210 };
var CLASSES = [
  { id: 0, name: "\uBCC4\uBE5B \uAE30\uC0AC", en: "KNIGHT", role: "\uAC80\uACFC \uC218\uD638\uC758 \uD798", description: "\uB2E8\uB2E8\uD55C \uBC29\uC5B4\uC640 \uB113\uC740 \uAC80\uACA9\uC73C\uB85C \uC804\uC120\uC744 \uC9C0\uD0B5\uB2C8\uB2E4.", hp: 160, mp: 80, atk: 22, def: 7, color: "#92caff", skills: ["\uBE5B\uC758 \uAC80\uACA9", "\uD30C\uC1C4 \uC77C\uACA9", "\uBCC4\uBE5B \uD68C\uC624\uB9AC", "\uB3CC\uC9C4 \uBCA0\uAE30"], range: [135, 165, 220, 320], power: [1, 1.9, 1.5, 2.2], cost: [0, 12, 20, 25], cd: [650, 2500, 5e3, 6500] },
  { id: 1, name: "\uBC14\uB78C \uC21C\uCC30\uC790", en: "RANGER", role: "\uC815\uD655\uD558\uACE0 \uB0A0\uB835\uD55C \uC0AC\uACA9", description: "\uBA3C \uAC70\uB9AC\uC5D0\uC11C \uD654\uC0B4\uC744 \uB0A0\uB9AC\uACE0 \uC801\uC758 \uD3EC\uC704\uB97C \uBC97\uC5B4\uB0A9\uB2C8\uB2E4.", hp: 120, mp: 100, atk: 24, def: 4, color: "#9bedbc", skills: ["\uBC14\uB78C \uD654\uC0B4", "\uB2E4\uC911 \uC0AC\uACA9", "\uAD00\uD1B5 \uD654\uC0B4", "\uD68C\uD53C \uC0AC\uACA9"], range: [410, 380, 500, 360], power: [1, 1.25, 2.1, 1.5], cost: [0, 14, 20, 18], cd: [650, 2600, 4200, 5e3] },
  { id: 2, name: "\uB2EC\uBE5B \uB9C8\uB3C4\uC0AC", en: "MAGE", role: "\uC6D0\uC18C\uC640 \uBCC4\uC758 \uB9C8\uBC95", description: "\uC5BC\uC74C\uACFC \uBD88\uAF43\uC758 \uB9C8\uBC95\uC73C\uB85C \uC804\uC7A5\uC744 \uD658\uD558\uAC8C \uBC1D\uD799\uB2C8\uB2E4.", hp: 95, mp: 150, atk: 29, def: 2, color: "#d0b3ff", skills: ["\uBE44\uC804 \uD0C4\uD658", "\uD0DC\uC591 \uBD88\uAF43", "\uC11C\uB9AC \uD30C\uB3D9", "\uBCC4\uC758 \uB099\uD558"], range: [400, 430, 260, 520], power: [1, 1.8, 1.4, 2.8], cost: [0, 15, 22, 32], cd: [750, 2600, 5e3, 7500] }
];
var regions = [
  ["\uBCC4\uC0D8 \uB9C8\uC744", "\uBCC4\uC758 \uC2EC\uC7A5\uC774 \uC7A0\uB4E0 \uB9C8\uC9C0\uB9C9 \uC548\uC2DD\uCC98", 1, 0, 0],
  ["\uC774\uC2AC\uBE5B \uCD08\uC6D0", "\uB9C8\uC744\uC758 \uBD09\uC778\uC744 \uC9C0\uD0A4\uB294 \uC791\uC740 \uC0DD\uBA85\uB4E4", 1, 0, 1],
  ["\uC18D\uC0AD\uC774\uB294 \uC232", "\uB098\uBB34\uC5D0 \uC0C8\uACA8\uC9C4 \uBCC4\uC758 \uAE30\uC5B5", 3, 0, 2],
  ["\uC78A\uD78C \uC720\uC801", "\uCCAB \uBC88\uC9F8 \uBCC4\uC870\uAC01\uC774 \uC7A0\uB4E0 \uC720\uC801", 5, 0, 4],
  ["\uC6D4\uC2DD\uC758 \uC131\uC18C", "\uC6D4\uC2DD\uC758 \uAD70\uC8FC\uAC00 \uAE30\uB2E4\uB9AC\uB294 \uACF3", 7, 0, 7],
  ["\uBC14\uB78C\uAF43 \uB4E4\uD310", "\uB3D9\uCABD \uBCC4\uAE38\uC758 \uCCAB \uC774\uC815\uD45C", 8, 0, 1],
  ["\uD478\uB978 \uC548\uAC1C \uC232", "\uC548\uAC1C \uC18D \uC815\uB839\uC758 \uD754\uC801", 10, 0, 2],
  ["\uC740\uBE5B \uB291\uB300 \uD611\uACE1", "\uAE38\uC744 \uC783\uC740 \uC21C\uCC30\uC790\uC758 \uAE38", 12, 0, 4],
  ["\uC218\uC815 \uC0D8\uD130", "\uBD09\uC778\uC758 \uBE5B\uC774 \uC19F\uC544\uB098\uB294 \uC0D8", 14, 0, 5],
  ["\uACE0\uBAA9\uC758 \uC815\uC6D0", "\uAC80\uC740 \uBFCC\uB9AC\uAC00 \uC0BC\uD0A8 \uBCC4\uC870\uAC01", 16, 0, 2],
  ["\uC11C\uB9AC\uBB38 \uACE0\uAC1C", "\uBD81\uBC29\uC758 \uB2EB\uD78C \uBB38", 18, 1, 5],
  ["\uB208\uAF43 \uD3C9\uC6D0", "\uC0C8\uD558\uC580 \uBCC4\uC758 \uD754\uC801", 20, 1, 5],
  ["\uBE59\uACB0 \uD638\uC218", "\uC5BC\uC74C \uC544\uB798 \uBD09\uC778\uB41C \uAE30\uB85D", 22, 1, 5],
  ["\uBC31\uC57C\uC758 \uC232", "\uC7A0\uB4E4\uC9C0 \uC54A\uB294 \uB9DD\uB839\uC758 \uC232", 24, 1, 6],
  ["\uC5BC\uC74C \uC655\uAD00 \uC720\uC801", "\uB450 \uBC88\uC9F8 \uBCC4\uC870\uAC01\uC758 \uC218\uD638\uC790", 26, 1, 6],
  ["\uC7BF\uBE5B \uACBD\uACC4", "\uBD88\uC758 \uB300\uB959\uC73C\uB85C \uD5A5\uD558\uB294 \uAE38", 28, 2, 4],
  ["\uBD88\uC528 \uD611\uACE1", "\uBD89\uC740 \uBC14\uB78C\uACFC \uD0C0\uC624\uB974\uB294 \uC554\uC11D", 30, 2, 6],
  ["\uC720\uD669 \uD669\uC57C", "\uACE0\uB300 \uD654\uB85C\uC758 \uC228\uACB0", 32, 2, 6],
  ["\uBD89\uC740 \uC0AC\uB9C9", "\uBAA8\uB798 \uC18D\uC5D0 \uBB3B\uD78C \uC655\uAD6D", 34, 2, 6],
  ["\uC6A9\uAD11\uB85C \uC131\uCC44", "\uC138 \uBC88\uC9F8 \uBCC4\uC870\uAC01\uC744 \uD488\uC740 \uC131\uCC44", 36, 2, 7],
  ["\uD669\uD63C\uC758 \uAE38", "\uBCC4\uAE38\uC774 \uB05D\uB098\uB294 \uD669\uD63C", 38, 0, 4],
  ["\uBCC4\uC758 \uBB34\uB364", "\uC78A\uD78C \uC218\uD638\uC790\uB4E4\uC758 \uC774\uB984", 40, 1, 7],
  ["\uACF5\uD5C8\uC758 \uD68C\uB791", "\uC138 \uBCC4\uC870\uAC01\uC774 \uC5EC\uB294 \uD68C\uB791", 43, 2, 7],
  ["\uAC80\uC740 \uB2EC \uC81C\uB2E8", "\uBD09\uC778\uC758 \uB9C8\uC9C0\uB9C9 \uC2DC\uD5D8", 46, 2, 7],
  ["\uC5D0\uD14C\uB9AC\uC544\uC758 \uC2EC\uC7A5", "\uC0C8\uB85C\uC6B4 \uC0C8\uBCBD\uC744 \uB418\uCC3E\uB294 \uCD5C\uC885 \uC131\uC18C", 49, 1, 7]
];
var ZONES = regions.map(([name, sub, minLevel, biome, music], id) => ({ id, name, sub, minLevel, biome, music, level: id === 0 ? "SAFE" : `LV. ${minLevel}+`, filter: id === 0 ? "none" : biome === 1 ? "saturate(.85)" : biome === 2 ? "saturate(1.08)" : `hue-rotate(${id * 7 % 30}deg) brightness(${id === 4 ? 0.58 : id % 3 === 0 ? 0.8 : 1})`, types: id === 0 ? [] : id === 1 ? [0, 0, 1, 2, 3] : id === 2 ? [3, 4, 7, 8] : id === 3 ? [4, 5, 6, 8] : id >= 4 ? [5, 6, 7, 8, 9] : [0, 1, 2], color: biome === 1 ? "#b8e4ff" : biome === 2 ? "#f6b282" : "#a9dfbd", mapX: 12 + id % 5 * 18, mapY: 12 + Math.floor(id / 5) * 18 }));
var portalsFor = (zone) => {
  if (ZONES[zone]?.raid) return [{ x: 900, y: 925, name: "\uBCC4\uC0D8 \uB9C8\uC744\uB85C", next: 0, target: 0 }];
  const exits = zone === 28 ? [{ x: 1450, y: 680, name: "\uB208\uAF43 \uD3C9\uC6D0", next: 1, target: 11 }, { x: 350, y: 680, name: "\uBCC4\uC0D8 \uB9C8\uC744", next: -1, target: 0 }] : zone === 29 ? [{ x: 1450, y: 680, name: "\uBD88\uC528 \uD611\uACE1", next: 1, target: 16 }, { x: 350, y: 680, name: "\uBCC4\uC0D8 \uB9C8\uC744", next: -1, target: 0 }] : [
    ...zone < 24 ? [{ x: 1530, y: 680, name: ZONES[zone + 1].name, next: 1, target: zone + 1 }] : [],
    ...zone > 0 ? [{ x: 270, y: 680, name: ZONES[zone - 1].name, next: -1, target: zone - 1 }] : [],
    ...zone === 11 ? [{ x: 1100, y: 925, name: "\uC124\uC6D0 \uAD11\uC7A5", next: 0, target: 28 }] : zone === 16 ? [{ x: 1100, y: 925, name: "\uBD88\uC528 \uAD11\uC7A5", next: 0, target: 29 }] : []
  ];
  return [...exits, { x: 900, y: 925, name: "\uBCC4\uAE38 \uC774\uB3D9 \uAD6C\uC2AC", next: 0, target: -1 }];
};
var zoneScale = (zone) => 1 + Math.max(0, ZONES[zone].minLevel - 7) * 0.16;
var isBoss = (type) => type === 8 || type === 9;
var MONSTERS = [
  { name: "\uC774\uC2AC \uC2AC\uB77C\uC784", sprite: 4, hp: 48, atk: 5, xp: 22, gold: 9, speed: 58 },
  { name: "\uBB3C\uBC29\uC6B8 \uC2AC\uB77C\uC784", sprite: 5, hp: 65, atk: 7, xp: 28, gold: 12, speed: 65 },
  { name: "\uC232 \uBC84\uC12F", sprite: 6, hp: 85, atk: 8, xp: 35, gold: 14, speed: 52 },
  { name: "\uC740\uBE5B \uB291\uB300", sprite: 7, hp: 100, atk: 12, xp: 45, gold: 18, speed: 110 },
  { name: "\uC774\uB07C \uACE0\uBE14\uB9B0", sprite: 8, hp: 145, atk: 15, xp: 65, gold: 25, speed: 85 },
  { name: "\uB2EC\uC758 \uB9DD\uB839", sprite: 9, hp: 190, atk: 20, xp: 85, gold: 32, speed: 70 },
  { name: "\uACE0\uB300 \uACE8\uB818", sprite: 10, hp: 280, atk: 25, xp: 110, gold: 45, speed: 45 },
  { name: "\uADF8\uB298 \uBC15\uC950", sprite: 11, hp: 120, atk: 16, xp: 60, gold: 23, speed: 125 },
  { name: "\uBD89\uC740 \uD30C\uC218\uAFBC", sprite: 12, hp: 480, atk: 30, xp: 210, gold: 90, speed: 55 },
  { name: "\uC6D4\uC2DD\uC758 \uAD70\uC8FC", sprite: 13, hp: 1800, atk: 42, xp: 700, gold: 350, speed: 48 },
  { name: "\uC774\uB07C \uAC11\uCDA9", sprite: 22, hp: 95, atk: 9, xp: 38, gold: 15, speed: 65 },
  { name: "\uC11C\uB9AC \uC815\uB839", sprite: 23, hp: 160, atk: 18, xp: 75, gold: 28, speed: 80 },
  { name: "\uBD88\uC528 \uC5EC\uC6B0", sprite: 24, hp: 155, atk: 17, xp: 72, gold: 27, speed: 118 },
  { name: "\uAF43\uC78E \uBC84\uC12F", sprite: 25, hp: 90, atk: 9, xp: 40, gold: 16, speed: 55 },
  { name: "\uC218\uC815 \uAC8C", sprite: 26, hp: 200, atk: 20, xp: 95, gold: 35, speed: 62 },
  { name: "\uB208\uAD6C\uB984 \uD1A0\uB07C", sprite: 27, hp: 135, atk: 14, xp: 68, gold: 25, speed: 110 },
  { name: "\uC6A9\uC554 \uB2EC\uD33D\uC774", sprite: 28, hp: 240, atk: 23, xp: 105, gold: 42, speed: 42 },
  { name: "\uBCC4\uBE5B \uD574\uD30C\uB9AC", sprite: 29, hp: 180, atk: 19, xp: 90, gold: 33, speed: 78 },
  { name: "\uAC00\uC2DC \uC120\uC778\uC7A5", sprite: 30, hp: 210, atk: 22, xp: 98, gold: 38, speed: 48 }
];
var ITEMS = Array.from({ length: 21 }, (_, i) => ({ id: i, name: [["\uC5EC\uD589\uC790\uC758 \uAC80", "\uBC14\uB78C\uC758 \uD65C", "\uC0C8\uBCBD\uC758 \uC9C0\uD321\uC774", "\uAC00\uC8FD \uAC11\uC637", "\uBCC4\uC870\uAC01 \uBC18\uC9C0", "\uC740\uBE5B \uC7A5\uAC80", "\uC232\uC758 \uC7A5\uAD81"], ["\uBE5B\uC744 \uD488\uC740 \uAC80", "\uC9C8\uD48D\uC758 \uD65C", "\uB2EC\uBE5B \uC9C0\uD321\uC774", "\uC218\uD638\uC790\uC758 \uAC11\uC637", "\uC774\uC2AC\uBE5B \uBC18\uC9C0", "\uC720\uC801\uC758 \uAC80", "\uC815\uB839\uC758 \uD65C"], ["\uC6D4\uC2DD\uC758 \uC131\uAC80", "\uBCC4\uC790\uB9AC \uD65C", "\uC2EC\uC5F0\uC758 \uC9C0\uD321\uC774", "\uCC9C\uC0C1\uC758 \uAC11\uC637", "\uC601\uC6D0\uC758 \uBC18\uC9C0", "\uD30C\uC218\uAFBC\uC758 \uAC80", "\uB2EC\uC758 \uD65C"]][Math.floor(i / 7)][i % 7], slot: i % 7 === 3 ? "armor" : i % 7 === 4 ? "ring" : "weapon", atk: i % 7 === 3 ? 0 : 3 + Math.floor(i / 7) * 8, def: i % 7 === 3 ? 4 + Math.floor(i / 7) * 5 : i % 7 === 4 ? 2 : 0, hp: i % 7 === 3 ? 15 + Math.floor(i / 7) * 20 : 0, rarity: Math.floor(i / 7), price: 40 + Math.floor(i / 7) * 110 }));
for (let tier = 0; tier < 3; tier++) {
  const level = [8, 18, 30][tier], prefix = ["\uBCC4\uCCA0", "\uC624\uB85C\uB77C", "\uBD88\uC0AC\uC870"][tier], rarity = tier + 1;
  for (let kind = 0; kind < 6; kind++) {
    const slot = kind < 3 ? "weapon" : kind === 3 ? "armor" : "ring";
    ITEMS.push({ id: ITEMS.length, name: prefix + " " + ["\uC7A5\uAC80", "\uC7A5\uAD81", "\uB9C8\uBC95\uBD09", "\uD749\uAC11", "\uC218\uD638 \uBC18\uC9C0", "\uC9D1\uC911 \uBC18\uC9C0"][kind], slot, classId: kind < 3 ? kind : void 0, minLevel: level, atk: kind < 3 ? 9 + tier * 9 : kind === 5 ? 5 + tier * 5 : 0, def: kind === 3 ? 7 + tier * 6 : kind === 4 ? 4 + tier * 3 : 0, hp: kind === 3 ? 35 + tier * 30 : kind === 4 ? 20 + tier * 20 : 0, rarity, price: 250 + tier * 650 + (kind === 3 ? 100 : 0) });
  }
}
for (const [kind, name] of ["\uBCC4\uBE5B \uD1A0\uB07C \uAC80", "\uACE0\uC591\uC774 \uBC1C\uBC14\uB2E5 \uD65C", "\uAD6C\uB984 \uC0AC\uD0D5 \uC9C0\uD321\uC774", "\uB9D0\uB791 \uAD6C\uB984 \uAC11\uC637", "\uAF2C\uB9C8 \uBCC4 \uBC18\uC9C0"].entries()) ITEMS.push({ id: ITEMS.length, name, slot: kind < 3 ? "weapon" : kind === 3 ? "armor" : "ring", classId: kind < 3 ? kind : void 0, atk: kind < 3 ? 35 : 0, def: kind === 3 ? 25 : kind === 4 ? 8 : 0, hp: kind === 3 ? 120 : kind === 4 ? 50 : 0, rarity: 2, price: 0, gmOnly: true });
var QUESTS = [
  { id: 0, name: "\uCD08\uC6D0\uC758 \uC791\uC740 \uC18C\uB3D9", description: "\uC774\uC2AC\uBE5B \uCD08\uC6D0\uC5D0\uC11C \uC774\uC2AC \uC2AC\uB77C\uC784 5\uB9C8\uB9AC\uB97C \uCC98\uCE58\uD558\uC138\uC694.", monster: 0, count: 5, xp: 90, gold: 65 },
  { id: 1, name: "\uBC84\uC12F\uC758 \uC232", description: "\uC232 \uBC84\uC12F 4\uB9C8\uB9AC\uB97C \uCC98\uCE58\uD558\uC138\uC694.", monster: 2, count: 4, xp: 130, gold: 90 },
  { id: 2, name: "\uC232\uAE38\uC758 \uC218\uD638\uC790", description: "\uC774\uB07C \uACE0\uBE14\uB9B0 4\uB9C8\uB9AC\uB97C \uCC98\uCE58\uD558\uC138\uC694.", monster: 4, count: 4, xp: 220, gold: 140 },
  { id: 3, name: "\uBD89\uC740 \uB3CC\uC758 \uBE44\uBC00", description: "\uBD89\uC740 \uD30C\uC218\uAFBC\uC744 1\uB9C8\uB9AC \uCC98\uCE58\uD558\uC138\uC694.", monster: 8, count: 1, xp: 320, gold: 220 },
  { id: 4, name: "\uC6D4\uC2DD\uC744 \uB118\uC5B4", description: "\uC6D4\uC2DD\uC758 \uAD70\uC8FC\uB97C \uCC98\uCE58\uD558\uACE0 \uB9C8\uC744\uC5D0 \uB3CC\uC544\uC624\uC138\uC694.", monster: 9, count: 1, xp: 900, gold: 600 }
];
var NPCS = [
  { id: 0, name: "\uC138\uB77C \xB7 \uBCC4\uC0D8\uC758 \uC548\uB0B4\uC790", role: "\uD018\uC2A4\uD2B8", sprite: 3, x: 830, y: 560, zone: 0, service: "quest" },
  { id: 1, name: "\uB85C\uC5D4 \xB7 \uC5EC\uD589 \uC0C1\uC778", role: "\uC0C1\uC810", sprite: 14, x: 1030, y: 600, zone: 0, service: "shop" },
  { id: 2, name: "\uC5D8\uB9B0 \xB7 \uCE58\uC720\uC0AC", role: "\uD68C\uBCF5", sprite: 15, x: 730, y: 710, zone: 0, service: "heal" },
  { id: 3, name: "\uBE0C\uB780 \xB7 \uBCC4\uCCA0 \uB300\uC7A5\uC7A5\uC774", role: "\uC7A5\uBE44 \uAC15\uD654", sprite: 16, x: 560, y: 475, zone: 0, service: "forge" },
  { id: 4, name: "\uBBF8\uC544 \xB7 \uB2EC\uBE5B \uC5F0\uAE08\uC220\uC0AC", role: "\uC5F0\uAE08 \xB7 \uC81C\uC791", sprite: 17, x: 1120, y: 780, zone: 0, service: "alchemy" },
  { id: 5, name: "\uB3C4\uB9B0 \xB7 \uC7AC\uB8CC \uC5F0\uAD6C\uAC00", role: "\uC7AC\uB8CC \xB7 \uBD84\uD574", sprite: 18, x: 1290, y: 660, zone: 0, service: "materials" },
  { id: 6, name: "\uCE74\uC77C \xB7 \uCC3D\uACE0\uC9C0\uAE30", role: "\uAC1C\uC778 \uCC3D\uACE0", sprite: 19, x: 580, y: 790, zone: 0, service: "storage" },
  { id: 7, name: "\uB8E8\uBBF8 \xB7 \uD3AB \uAD00\uB9AC\uC778", role: "\uD3AB \uAD00\uB9AC", sprite: 20, x: 1230, y: 475, zone: 0, service: "pets" },
  { id: 8, name: "\uC544\uB9AC\uC544 \xB7 \uAD11\uC7A5 \uC548\uB0B4\uC6D0", role: "\uB9C8\uC744 \uC548\uB0B4", sprite: 21, x: 990, y: 415, zone: 0, service: "guide" },
  { id: 9, name: "\uBE0C\uB780 \xB7 \uC218\uC815 \uC57C\uC601\uC9C0", role: "\uC7A5\uBE44 \uAC15\uD654", sprite: 16, x: 900, y: 880, zone: 8, service: "forge" },
  { id: 10, name: "\uBBF8\uC544 \xB7 \uB208\uAF43 \uC27C\uD130", role: "\uC5F0\uAE08 \xB7 \uC81C\uC791", sprite: 17, x: 900, y: 880, zone: 11, service: "alchemy" },
  { id: 11, name: "\uB3C4\uB9B0 \xB7 \uBD88\uC528 \uAD50\uC5ED\uC18C", role: "\uC7AC\uB8CC \xB7 \uBD84\uD574", sprite: 18, x: 900, y: 880, zone: 16, service: "materials" }
];
var BLOCKS = [{ x: 80, y: 0, w: 1640, h: 110 }, { x: 0, y: 0, w: 160, h: 1200 }, { x: 1640, y: 0, w: 160, h: 1200 }, { x: 0, y: 1040, w: 1800, h: 160 }, { x: 1080, y: 215, w: 250, h: 140 }];
var biomeBlocks = [[...BLOCKS, { x: 300, y: 255, w: 90, h: 65 }, { x: 1370, y: 330, w: 80, h: 95 }, { x: 290, y: 850, w: 80, h: 95 }], [{ x: 0, y: 0, w: 1800, h: 180 }, { x: 0, y: 0, w: 230, h: 1200 }, { x: 1570, y: 0, w: 230, h: 1200 }, { x: 0, y: 1010, w: 1800, h: 190 }], [{ x: 0, y: 0, w: 1800, h: 180 }, { x: 0, y: 0, w: 230, h: 1200 }, { x: 1570, y: 0, w: 230, h: 1200 }, { x: 0, y: 1010, w: 1800, h: 190 }]];
var blocksFor = (zone = 0) => ZONES[zone]?.raid || zone === 28 || zone === 29 ? [] : biomeBlocks[ZONES[zone]?.biome || 0];
var advanced = [
  { skills: ["\uBE5B\uC758 \uC131\uC5ED", "\uC720\uC131 \uB3CC\uACA9", "\uC218\uD638\uC790\uC758 \uC2EC\uD310", "\uCC9C\uC0C1\uC758 \uAC80\uBB34"], range: [260, 400, 500, 360], power: [2, 2.7, 3.5, 4.5], cost: [28, 32, 40, 50], cd: [8500, 1e4, 13e3, 18e3] },
  { skills: ["\uD3ED\uD48D\uC758 \uAE43", "\uC11C\uB9AC \uD654\uC0B4", "\uBCC4\uBE5B \uD3ED\uC6B0", "\uD3ED\uD48D\uC758 \uC2EC\uC7A5"], range: [460, 540, 550, 600], power: [2, 2.5, 3.4, 4.4], cost: [25, 30, 40, 48], cd: [8e3, 1e4, 13500, 18e3] },
  { skills: ["\uC0DD\uBA85\uC758 \uB2EC", "\uBE59\uD558\uC758 \uCC3D", "\uD61C\uC131 \uCDA9\uB3CC", "\uCD08\uC2E0\uC131"], range: [280, 580, 580, 550], power: [1.8, 2.8, 3.6, 4.8], cost: [28, 35, 45, 55], cd: [8500, 1e4, 14e3, 18e3] }
];
CLASSES.forEach((c, i) => {
  c.skills.push(...advanced[i].skills);
  c.range.push(...advanced[i].range);
  c.power.push(...advanced[i].power);
  c.cost.push(...advanced[i].cost);
  c.cd.push(...advanced[i].cd);
});
var promoted = [
  { skills: ["\uD0DC\uC591 \uBC29\uBCBD", "\uAD11\uD718\uC758 \uC2EC\uD310", "\uCC9C\uC0C1\uC758 \uB3CC\uACA9", "\uC131\uAC80\uC758 \uC0C8\uBCBD"], range: [280, 480, 460, 500], power: [2.2, 2.9, 3.8, 4.8], cost: [30, 35, 45, 55], cd: [1e4, 11e3, 13e3, 19e3] },
  { skills: ["\uD3ED\uD48D \uB0A0\uAC1C", "\uBD88\uC0AC\uC870 \uD654\uC0B4", "\uCC9C\uAD81\uC758 \uC5F0\uC0AC", "\uBCC4\uBE5B \uC0AC\uB0E5"], range: [440, 600, 620, 580], power: [2.3, 3, 3.6, 4.8], cost: [28, 34, 43, 52], cd: [9500, 11e3, 12500, 18e3] },
  { skills: ["\uB2EC\uC758 \uAC00\uD638", "\uC740\uD558 \uD61C\uC131", "\uC2DC\uAC04\uC758 \uC11C\uB9AC", "\uC6B0\uC8FC\uC758 \uD0C4\uC0DD"], range: [300, 600, 340, 650], power: [2.1, 3.2, 3.8, 5], cost: [30, 38, 48, 60], cd: [1e4, 11500, 13500, 2e4] }
];
CLASSES.forEach((c, i) => {
  c.skills.push(...promoted[i].skills);
  c.range.push(...promoted[i].range);
  c.power.push(...promoted[i].power);
  c.cost.push(...promoted[i].cost);
  c.cd.push(...promoted[i].cd);
});
var SKILL_LEVELS = [1, 1, 1, 1, 5, 10, 20, 35, 10, 10, 30, 30];
var skillAvailable = (p, i) => p.level >= SKILL_LEVELS[i] && (i < 8 || (p.promotionTier || 0) >= (i < 10 ? 1 : 2));
var skillUnlocked = (p, i) => i < 4 || skillAvailable(p, i) && (p.skillRanks?.[i] || 0) > 0;
ZONES.slice(5).forEach((z) => QUESTS.push({ id: QUESTS.length, name: `${z.name}\uC758 \uBCC4\uBE5B`, description: `${z.name}\uC5D0\uC11C ${MONSTERS[z.id % 5 === 4 ? 9 : 8].name} ${z.id % 5 === 4 ? 1 : 3}\uB9C8\uB9AC\uB97C \uCC98\uCE58\uD558\uACE0 \uC138\uB77C\uC5D0\uAC8C \uB3CC\uC544\uAC00\uC138\uC694.`, monster: z.id % 5 === 4 ? 9 : 8, count: z.id % 5 === 4 ? 1 : 3, xp: Math.round(70 * z.minLevel ** 1.45 * 0.55), gold: 100 + z.minLevel * 35, zone: z.id, minLevel: z.minLevel }));
var groundContours = [
  [[225, 340], [260, 280], [310, 230], [480, 160], [655, 140], [830, 145], [940, 220], [1060, 220], [1095, 315], [1190, 380], [1290, 410], [1285, 500], [1360, 560], [1380, 650], [1280, 740], [1180, 805], [1040, 835], [930, 860], [830, 810], [735, 820], [615, 835], [520, 810], [475, 780], [365, 745], [315, 655], [245, 600], [195, 490]],
  [[180, 290], [390, 220], [660, 185], [930, 190], [1180, 230], [1340, 270], [1480, 390], [1490, 580], [1450, 750], [1290, 840], [1160, 850], [1e3, 930], [750, 945], [640, 880], [420, 850], [250, 760], [175, 580]],
  [[180, 270], [420, 185], [650, 190], [900, 170], [1130, 210], [1370, 300], [1460, 420], [1490, 600], [1410, 750], [1220, 840], [1e3, 900], [760, 935], [510, 890], [335, 800], [200, 675], [155, 490]]
];
var grounds = groundContours.map((points) => points.map(([x, y]) => ({ x: x * 1800 / 1536, y: y * 1200 / 1024 })));
var groundFor = (zone = 0) => ZONES[zone]?.raid || zone === 28 || zone === 29 ? [[340, 330], [650, 215], [1e3, 215], [1420, 330], [1550, 500], [1510, 780], [1280, 950], [1050, 1e3], [750, 1e3], [490, 940], [275, 760], [235, 520]].map(([x, y]) => ({ x, y })) : grounds[ZONES[zone]?.biome || 0];
var atlasLocations = [[18, 61], [23, 67], [20, 48], [30, 54], [36, 45], [31, 71], [28, 39], [36, 63], [41, 54], [40, 32], [43, 24], [52, 16], [60, 22], [55, 32], [66, 14], [70, 40], [76, 51], [84, 37], [87, 57], [79, 67], [51, 65], [48, 78], [61, 77], [60, 88], [49, 90]];
ZONES.forEach((z, i) => {
  z.mapX = atlasLocations[i][0];
  z.mapY = atlasLocations[i][1];
});
for (const r of RAIDS) {
  ZONES.push({ id: r.zone, name: r.name + "\uC758 \uC131\uC18C", sub: "\uD611\uB825 \uBCF4\uC2A4 \uB808\uC774\uB4DC \xB7 \uACBD\uACE0 \uBC94\uC704\uB97C \uD53C\uD558\uACE0 \uD568\uAED8 \uC2F8\uC6B0\uC138\uC694", level: "LV. " + r.level + "+", minLevel: r.level, filter: r.zone === 25 ? "none" : r.zone === 26 ? "hue-rotate(35deg)" : "hue-rotate(300deg)", types: [9], color: "#eed2a1", biome: 0, mapX: 50, mapY: 50, music: 7, raid: true });
}
ZONES[0].safe = true;
ZONES.push(
  { id: 28, name: "\uC624\uB85C\uB77C \uC124\uC6D0 \uAD11\uC7A5", sub: "\uB208\uAF43 \uC5F0\uD569\uC758 \uAD50\uC5ED\uACFC \uD734\uC2DD\uC758 \uC548\uC2DD\uCC98", level: "SAFE \xB7 LV18+", minLevel: 18, filter: "none", types: [], color: "#bae6ff", biome: 1, mapX: 46, mapY: 11, music: 8, safe: true, art: "/art/winter-plaza.png" },
  { id: 29, name: "\uBD88\uC528 \uAD50\uC5ED \uAD11\uC7A5", sub: "\uBD89\uC740 \uB300\uB959\uC758 \uC7A5\uC778\uB4E4\uC774 \uBAA8\uC774\uB294 \uC548\uC804\uD55C \uAD50\uC5ED\uC18C", level: "SAFE \xB7 LV28+", minLevel: 28, filter: "none", types: [], color: "#ffc292", biome: 2, mapX: 91, mapY: 43, music: 10, safe: true, art: "/art/ember-plaza.png" }
);
for (const zone of [28, 29]) for (const n of NPCS.slice(0, 9)) NPCS.push({ ...n, id: NPCS.length, zone, name: n.name.replace("\uBCC4\uC0D8\uC758 \uC548\uB0B4\uC790", zone === 28 ? "\uC124\uC6D0\uC758 \uC548\uB0B4\uC790" : "\uBD88\uC528\uC758 \uC548\uB0B4\uC790") });
for (const zone of [10, 11, 14, 21]) ZONES[zone].music = 8;
for (const zone of [12, 13, 24]) ZONES[zone].music = 9;
for (const zone of [15, 16, 18]) ZONES[zone].music = 10;
for (const zone of [17, 19, 22, 23]) ZONES[zone].music = 11;
for (const z of ZONES) {
  if (z.safe || z.raid || z.id === 0) continue;
  z.types.push(z.biome === 1 ? 11 : z.biome === 2 ? 12 : 10);
}
for (const z of ZONES) {
  if (z.safe || z.raid || z.id === 0) continue;
  z.types.push(...z.biome === 1 ? [15, 17] : z.biome === 2 ? [16, 18] : [13, 14]);
}
if (!ZONES[2].types.includes(2)) ZONES[2].types.push(2);
var mainZones = [1, 2, 3, 3, 4];
QUESTS.forEach((q, i) => {
  const zone = i < 5 ? mainZones[i] : q.zone;
  const [name, story, epilogue] = CHAPTER_STORIES[i];
  q.kind = "main";
  q.name = name;
  q.story = story;
  q.epilogue = epilogue;
  q.chapter = i < 5 ? "\uBCC4\uC0D8\uC758 \uBD80\uB984" : i < 10 ? "\uCD08\uB85D \uBCC4\uAE38" : i < 15 ? "\uBC31\uC57C\uC758 \uAE30\uC5B5" : i < 20 ? "\uBD88\uAF43\uC758 \uC57D\uC18D" : "\uC0C8\uBCBD\uC758 \uC218\uD638\uC790";
  q.zone = zone;
  q.minLevel = ZONES[zone].minLevel;
  q.previous = i ? i - 1 : void 0;
  q.description = `${ZONES[zone].name} \xB7 ${MONSTERS[q.monster].name} ${q.count}\uB9C8\uB9AC \uCC98\uCE58`;
});
var MAIN_QUESTS = QUESTS.slice();
for (let level = 1; level <= 50; level++) {
  const zone = ZONES.filter((z) => !z.safe && !z.raid && z.id > 0 && z.minLevel <= level).at(-1);
  const ordinary = Array.from(new Set(zone.types)).filter((t) => !isBoss(t));
  for (let slot = 0; slot < 2; slot++) {
    const monster = slot === 1 ? zone.biome === 1 ? 11 : zone.biome === 2 ? 12 : 10 : ordinary[(level - 1) % ordinary.length];
    const count = slot === 0 ? 4 : 3;
    QUESTS.push({
      id: QUESTS.length,
      kind: "side",
      name: `${slot === 0 ? "\uC21C\uCC30 \uC758\uB8B0" : "\uC0DD\uD0DC \uC870\uC0AC"} \xB7 ${zone.name}`,
      minLevel: level,
      zone: zone.id,
      monster,
      count,
      xp: Math.round(180 * level ** 1.6 * (slot === 0 ? 0.16 : 0.12)),
      gold: 30 + level * 12,
      story: slot === 0 ? `LV. ${level} \xB7 \uCE74\uC77C\uC758 \uC758\uB8B0. ${zone.name}\uC758 \uC5EC\uD589\uC790\uB4E4\uC774 ${MONSTERS[monster].name} \uB54C\uBB38\uC5D0 \uBC1C\uAE38\uC744 \uB3CC\uB9AC\uACE0 \uC788\uC5B4\uC694. \uC548\uC804\uD55C \uAE38\uC744 \uD655\uBCF4\uD574 \uC8FC\uC138\uC694.` : `LV. ${level} \xB7 \uB3C4\uB9B0\uC758 \uC758\uB8B0. ${MONSTERS[monster].name}\uC5D0\uAC8C \uC2A4\uBA70\uB4E0 \uBCC4\uBE5B\uC744 \uC870\uC0AC\uD558\uB824 \uD569\uB2C8\uB2E4. \uC8FC\uBCC0 \uC0DD\uD0DC\uAC00 \uD68C\uBCF5\uB420 \uC218 \uC788\uB3C4\uB85D \uB3C4\uC640\uC8FC\uC138\uC694.`,
      description: `${zone.name} \xB7 ${MONSTERS[monster].name} ${count}\uB9C8\uB9AC \uCC98\uCE58`,
      epilogue: slot === 0 ? "\uCE74\uC77C\uC774 \uC548\uC804\uD574\uC9C4 \uAE38\uC5D0 \uC774\uC815\uD45C\uB97C \uC138\uC6E0\uC2B5\uB2C8\uB2E4. \uC5EC\uD589\uC790\uB4E4\uC774 \uB2E4\uC2DC \uAE38\uC744 \uB098\uC12D\uB2C8\uB2E4." : "\uB3C4\uB9B0\uC774 \uC870\uC0AC \uAE30\uB85D\uC744 \uC644\uC131\uD588\uC2B5\uB2C8\uB2E4. \uB418\uCC3E\uC740 \uBCC4\uBE5B\uC774 \uC8FC\uBCC0 \uC0DD\uBA85\uB4E4\uC5D0\uAC8C \uB3CC\uC544\uAC11\uB2C8\uB2E4."
    });
  }
}

// shared/progression.ts
var needXp = (level) => Math.floor(180 * level ** 1.6);
function stats(p) {
  const c = CLASSES[p.classId], tier = p.promotionTier || 0;
  const items = Object.values(p.equipment).filter((id) => id !== null && !!ITEMS[id]).map((id) => ITEMS[id]);
  return { hp: c.hp + tier * 35 + (p.level - 1) * 20 + items.reduce((n, i) => n + i.hp + (p.enhancements?.[i.id] || 0) * 3, 0), mp: c.mp + tier * 20 + (p.level - 1) * 8, atk: c.atk + tier * 8 + (p.level - 1) * 4 + items.reduce((n, i) => n + i.atk + (i.slot !== "armor" ? (p.enhancements?.[i.id] || 0) * 2 : 0), 0), def: c.def + tier * 4 + (p.level - 1) * 2 + items.reduce((n, i) => n + i.def + (p.enhancements?.[i.id] || 0), 0) };
}
function addXp(p, xp) {
  p.xp += xp;
  let leveled = false;
  while (p.xp >= needXp(p.level) && p.level < 50) {
    p.xp -= needXp(p.level);
    p.level++;
    leveled = true;
  }
  if (leveled) {
    autoTrain(p);
    const s = stats(p);
    p.hp = s.hp;
    p.mp = s.mp;
  }
  return leveled;
}
var skillPoints = (p) => Math.max(0, p.level - 1 + (p.promotionTier || 0) * 2 - (p.skillRanks || []).reduce((a, b) => a + b, 0));
function autoTrain(p, mode = p.autoSkillMode || 0) {
  if (![1, 2, 3].includes(mode)) return 0;
  p.skillRanks ??= Array(12).fill(0);
  let used = 0;
  while (skillPoints(p) > 0 && used < 36) {
    const available = Array.from({ length: 12 }, (_, i) => i).filter((i) => skillAvailable(p, i) && (p.skillRanks[i] || 0) < 3);
    if (!available.length) break;
    const hotbar = p.loadout || [0, 1, 2, 3];
    available.sort((a, b) => {
      if (mode === 2) {
        const ah = hotbar.includes(a) ? 0 : 1, bh = hotbar.includes(b) ? 0 : 1;
        if (ah !== bh) return ah - bh;
      }
      if (mode === 3) {
        const at = a >= 8 ? 0 : a >= 4 ? 1 : 2, bt = b >= 8 ? 0 : b >= 4 ? 1 : 2;
        if (at !== bt) return at - bt;
      }
      return (p.skillRanks[a] || 0) - (p.skillRanks[b] || 0) || a - b;
    });
    const skill = available[0];
    p.skillRanks[skill] = (p.skillRanks[skill] || 0) + 1;
    used++;
  }
  return used;
}

// server/gm.ts
function integer(value, label, min, max) {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max)
    throw new Error(label + " \uBC94\uC704: " + min + " ~ " + max);
  return Number(value);
}
function gmSummary(p, now) {
  return { id: p.id, name: p.name, classId: p.classId, level: p.level, xp: p.xp, gold: p.gold, cash: p.cash || 0, zone: p.zone, hp: p.hp, mp: p.mp, online: now - p.seen < 1e4 && !p.gmBanned, seen: p.seen, revision: p.gmRevision || 0, banned: !!p.gmBanned, blockedUntil: p.gmBlockedUntil || 0 };
}
function gmDetail(p, now) {
  return { ...gmSummary(p, now), inventory: p.inventory, equipment: p.equipment, potions: p.potions, manaPotions: p.manaPotions, promotionTier: p.promotionTier || 0, stats: stats(p), needXp: needXp(p.level), pets: p.pets || [], gmSkin: p.gmSkin ?? -1, gmTitle: p.gmTitle || "", bubbleId: p.bubbleId || 0 };
}
function gmMutate(w, body, now) {
  const p = w.players[body.playerId];
  if (!p)
    throw new Error("\uC218\uD638\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (body.revision !== (p.gmRevision || 0))
    throw new Error("REVISION_CONFLICT");
  const before = JSON.parse(JSON.stringify(gmDetail(p, now)));
  const next = structuredClone(p);
  let affected;
  switch (body.action) {
    case "setSkin": {
      const id = integer(body.cosmeticId, "\uC2A4\uD0A8", -1, GM_SKINS.length - 1);
      if (id === -1) delete next.gmSkin;
      else next.gmSkin = id;
      affected = id === -1 ? "GM \uC2A4\uD0A8 \uD574\uC81C" : GM_SKINS[id].name + " \uC801\uC6A9";
      break;
    }
    case "setTitle": {
      const id = integer(body.cosmeticId, "\uCE6D\uD638", -1, GM_TITLES.length - 1);
      if (id === -1) delete next.gmTitle;
      else next.gmTitle = GM_TITLES[id];
      affected = id === -1 ? "GM \uCE6D\uD638 \uD574\uC81C" : GM_TITLES[id] + " \uC801\uC6A9";
      break;
    }
    case "set": {
      const level = body.level === void 0 ? next.level : integer(body.level, "\uB808\uBCA8", 1, 50);
      if (body.xp !== void 0)
        next.xp = integer(body.xp, "\uD604\uC7AC \uB808\uBCA8 \uACBD\uD5D8\uCE58", 0, needXp(level) - 1);
      else if (level !== next.level)
        next.xp = 0;
      next.level = level;
      for (const key of ["gold", "cash", "potions", "manaPotions"])
        if (body[key] !== void 0)
          next[key] = integer(body[key], key === "gold" ? "\uACE8\uB4DC" : key === "cash" ? "\uCE90\uC2DC \uCF54\uC778" : "\uBB3C\uC57D", 0, key === "gold" || key === "cash" ? 1e9 : 99999);
      if (["level", "xp", "gold", "cash", "potions", "manaPotions"].every((k) => body[k] === void 0))
        throw new Error("\uBCC0\uACBD\uD560 \uC218\uCE58\uB97C \uC785\uB825\uD558\uC138\uC694.");
      affected = "\uB2A5\uB825\uCE58 \uC218\uC815";
      break;
    }
    case "addXp":
      addXp(next, integer(body.amount, "\uCD94\uAC00 \uACBD\uD5D8\uCE58", 1, 1e7));
      affected = "\uACBD\uD5D8\uCE58 \uC9C0\uAE09";
      break;
    case "addGold": {
      const amount = integer(body.amount, "\uACE8\uB4DC \uC99D\uAC10", -1e9, 1e9);
      next.gold = integer(next.gold + amount, "\uACB0\uACFC \uACE8\uB4DC", 0, 1e9);
      affected = "\uACE8\uB4DC \uC9C0\uAE09 / \uD68C\uC218";
      break;
    }
    case "addCash": {
      const amount = integer(body.amount, "\uCE90\uC2DC \uCF54\uC778 \uC99D\uAC10", -1e9, 1e9);
      next.cash = integer((next.cash || 0) + amount, "\uACB0\uACFC \uCE90\uC2DC \uCF54\uC778", 0, 1e9);
      affected = "\uCE90\uC2DC \uCF54\uC778 \uC9C0\uAE09 / \uD68C\uC218";
      break;
    }
    case "giveItem": {
      const id = integer(body.itemId, "\uC544\uC774\uD15C", 0, ITEMS.length - 1), n = integer(body.quantity, "\uC218\uB7C9", 1, 60);
      if (next.inventory.length + n > 60)
        throw new Error("\uAC00\uBC29 \uACF5\uAC04\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. \uC9C0\uAE09\uD560 \uC218\uB7C9\uC744 \uC904\uC774\uC138\uC694.");
      next.inventory.push(...Array(n).fill(id));
      affected = ITEMS[id].name + " \uC9C0\uAE09";
      break;
    }
    case "removeItem": {
      const id = integer(body.itemId, "\uC544\uC774\uD15C", 0, ITEMS.length - 1), n = integer(body.quantity, "\uC218\uB7C9", 1, 60);
      if (next.inventory.filter((v) => v === id).length < n)
        throw new Error("\uBCF4\uC720\uD55C \uC544\uC774\uD15C \uC218\uB7C9\uBCF4\uB2E4 \uB9CE\uC774 \uD68C\uC218\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      for (let i = 0; i < n; i++)
        next.inventory.splice(next.inventory.indexOf(id), 1);
      if (!next.inventory.includes(id)) {
        for (const slot of ["weapon", "armor", "ring"])
          if (next.equipment[slot] === id)
            next.equipment[slot] = null;
      }
      affected = ITEMS[id].name + " \uD68C\uC218";
      break;
    }
    case "heal": {
      const s2 = stats(next);
      next.hp = s2.hp;
      next.mp = s2.mp;
      affected = "\uC0DD\uBA85\uB825 / \uB9C8\uB098 \uD68C\uBCF5";
      break;
    }
    case "town":
      next.zone = 0;
      next.x = 900;
      next.y = 740;
      affected = "\uB9C8\uC744 \uC774\uB3D9";
      break;
    case "kick":
      next.gmBlockedUntil = now + 3e4;
      next.seen = 0;
      affected = "30\uCD08 \uC811\uC18D \uC885\uB8CC";
      break;
    case "ban":
      next.gmBanned = true;
      next.seen = 0;
      affected = "\uCE90\uB9AD\uD130 \uC811\uC18D \uCC28\uB2E8";
      break;
    case "unban":
      next.gmBanned = false;
      next.gmBlockedUntil = 0;
      affected = "\uC811\uC18D \uCC28\uB2E8 \uD574\uC81C";
      break;
    default:
      throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAD00\uB9AC \uC791\uC5C5\uC785\uB2C8\uB2E4.");
  }
  const s = stats(next);
  next.hp = Math.max(0, Math.min(next.hp, s.hp));
  next.mp = Math.max(0, Math.min(next.mp, s.mp));
  next.gmRevision = (p.gmRevision || 0) + 1;
  next.notice = "GM: " + affected;
  if (next.gmSkin === void 0) delete p.gmSkin;
  if (next.gmTitle === void 0) delete p.gmTitle;
  Object.assign(p, next);
  for (const trade of w.trades || [])
    if (trade.a === p.id || trade.b === p.id) {
      const other = w.players[trade.a === p.id ? trade.b : trade.a];
      if (other)
        other.notice = "\uAD00\uB9AC\uC790 \uC218\uC815\uC73C\uB85C \uAC70\uB798\uAC00 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    }
  w.trades = (w.trades || []).filter((t) => t.a !== p.id && t.b !== p.id);
  w.gmAudit ??= [];
  w.gmAudit.push({ id: crypto.randomUUID(), at: now, playerId: p.id, name: p.name, action: body.action, reason: String(body.reason || "").replace(/[<>\x00-\x1f]/g, "").slice(0, 200), before, after: JSON.parse(JSON.stringify(gmDetail(p, now))) });
  w.gmAudit = w.gmAudit.slice(-500);
  return gmDetail(p, now);
}
async function gmAuthorized(header, secret) {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer "))
    return false;
  const candidate = header.slice(7);
  if (candidate.length > 256)
    return false;
  const enc = new TextEncoder(), [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(candidate)), crypto.subtle.digest("SHA-256", enc.encode(secret))]);
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++)
    diff |= aa[i] ^ bb[i];
  return diff === 0;
}

// shared/quests.ts
var questKind = (q) => q.kind || "main";
function questAvailable(p, q) {
  return !p.done.includes(q.id) && p.level >= (q.minLevel || 1) && (p.quests[q.id] !== void 0 || q.previous === void 0 || p.done.includes(q.previous));
}
function canAcceptQuest(p, q) {
  if (!questAvailable(p, q)) return false;
  if (p.quests[q.id] !== void 0) return true;
  const kind = questKind(q), active = QUESTS.filter((x) => questKind(x) === kind && p.quests[x.id] !== void 0).length;
  return active < (kind === "main" ? 1 : 2);
}

// shared/workshop.ts
var RECIPES = [
  { name: "\uC0DD\uBA85 \uBB3C\uC57D \xD75", gold: 25, cost: [0, 0, 3], kind: "hp" },
  { name: "\uB9C8\uB098 \uBB3C\uC57D \xD75", gold: 25, cost: [0, 2, 2], kind: "mp" },
  { name: "\uBCC4\uCCA0 \uC815\uB828 \xD73", gold: 35, cost: [0, 3, 0], kind: "ore" },
  { name: "\uC9C1\uC5C5\uBCC4 \uD76C\uADC0 \uBB34\uAE30", gold: 180, cost: [12, 8, 0], kind: "weapon" }
];

// server/workshop.ts
function workshopInput(w, p, input) {
  const service = { enhance: "forge", salvage: "materials", craft: "alchemy", materialBuy: "materials", store: "storage", withdraw: "storage" }[input.action || ""];
  if (!service) return;
  if (!NPCS.some((n) => n.service === service && n.zone === p.zone && Math.hypot(n.x - p.x, n.y - p.y) < 180)) {
    p.notice = "\uB2F4\uB2F9 NPC\uC5D0\uAC8C \uAC00\uAE4C\uC774 \uB2E4\uAC00\uAC00\uC138\uC694.";
    return;
  }
  if (w.trades?.some((t) => t.a === p.id || t.b === p.id)) {
    p.notice = "\uAC70\uB798\uB97C \uC885\uB8CC\uD55C \uB4A4 \uC774\uC6A9\uD558\uC138\uC694.";
    return;
  }
  const index = Number(input.value);
  if (!Number.isSafeInteger(index)) {
    p.notice = "\uC62C\uBC14\uB978 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD558\uC138\uC694.";
    return;
  }
  const materials = p.materials || [0, 0, 0];
  if (input.action === "materialBuy") {
    if (index < 0 || index > 2 || p.gold < 50) {
      p.notice = "\uC7AC\uB8CC \uAD6C\uB9E4\uC5D0\uB294 50 G\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";
      return;
    }
    p.gold -= 50;
    p.materials = [...materials];
    p.materials[index] += 3;
    p.notice = "\uC7AC\uB8CC 3\uAC1C\uB97C \uAD6C\uC785\uD588\uC2B5\uB2C8\uB2E4.";
    return;
  }
  if (input.action === "enhance") {
    const id2 = p.equipment[["weapon", "armor", "ring"][index]];
    if (index < 0 || index > 2 || id2 === null || id2 === void 0 || !p.inventory.includes(id2)) {
      p.notice = "\uC7A5\uCC29\uD55C \uC7A5\uBE44\uB97C \uC120\uD0DD\uD558\uC138\uC694.";
      return;
    }
    const rank = p.enhancements?.[id2] || 0, gold = 80 * (rank + 1), ore = 3 * (rank + 1), dust = 2 * (rank + 1);
    if (rank >= 5 || p.level < (rank + 1) * 3) {
      p.notice = rank >= 5 ? "\uCD5C\uB300 \uAC15\uD654 +5\uC785\uB2C8\uB2E4." : `\uB808\uBCA8 ${(rank + 1) * 3}\uBD80\uD130 \uAC15\uD654\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`;
      return;
    }
    if (p.gold < gold || materials[0] < ore || materials[1] < dust) {
      p.notice = "\uACE8\uB4DC\uC640 \uAC15\uD654 \uC7AC\uB8CC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.";
      return;
    }
    p.gold -= gold;
    p.materials = [materials[0] - ore, materials[1] - dust, materials[2]];
    p.enhancements = { ...p.enhancements, [id2]: rank + 1 };
    p.notice = ITEMS[id2].name + ` \uC219\uB828 \uAC15\uD654 +${rank + 1} \uC644\uB8CC!`;
    return;
  }
  if (input.action === "craft") {
    const r = RECIPES[index];
    if (!r) {
      p.notice = "\uC5C6\uB294 \uC81C\uC791\uBC95\uC785\uB2C8\uB2E4.";
      return;
    }
    if (p.gold < r.gold || r.cost.some((n, i) => materials[i] < n) || r.kind === "weapon" && (p.level < 5 || p.inventory.length >= 60)) {
      p.notice = "\uACE8\uB4DC\xB7\uC7AC\uB8CC\xB7\uAC00\uBC29 \uACF5\uAC04\uC744 \uD655\uC778\uD558\uC138\uC694. \uD76C\uADC0 \uBB34\uAE30\uB294 LV5\uBD80\uD130 \uC81C\uC791\uD569\uB2C8\uB2E4.";
      return;
    }
    p.gold -= r.gold;
    p.materials = materials.map((n, i) => n - r.cost[i]);
    if (r.kind === "hp") p.potions += 5;
    else if (r.kind === "mp") p.manaPotions += 5;
    else if (r.kind === "ore") p.materials[0] += 3;
    else p.inventory.push(7 + p.classId);
    p.notice = r.name + " \uC81C\uC791 \uC644\uB8CC";
    return;
  }
  const source = input.action === "withdraw" ? p.storage || [] : p.inventory, id = source[index];
  if (index < 0 || index >= source.length) {
    p.notice = "\uC544\uC774\uD15C\uC744 \uB2E4\uC2DC \uC120\uD0DD\uD558\uC138\uC694.";
    return;
  }
  if (ITEMS[id]?.gmOnly && input.action === "salvage") {
    p.notice = "GM \uC804\uC6A9 \uC7A5\uBE44\uB294 \uBD84\uD574\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
    return;
  }
  if (input.action === "withdraw") {
    if (p.inventory.length >= 60) {
      p.notice = "\uAC00\uBC29\uC774 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4.";
      return;
    }
    p.inventory.push(id);
    p.storage.splice(index, 1);
  } else {
    if (Object.values(p.equipment).includes(id)) {
      p.notice = "\uC7A5\uCC29 \uC911\uC778 \uC7A5\uBE44\uB294 \uBC97\uC740 \uD6C4 \uC774\uC6A9\uD558\uC138\uC694.";
      return;
    }
    if (input.action === "store") {
      if ((p.storage?.length || 0) >= 60) {
        p.notice = "\uCC3D\uACE0\uAC00 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4.";
        return;
      }
      (p.storage ??= []).push(id);
    } else {
      p.materials = [...materials];
      p.materials[0] += 2 + ITEMS[id].rarity * 2;
      p.materials[1] += 1 + ITEMS[id].rarity;
    }
    p.inventory.splice(index, 1);
    const s = stats(p);
    p.hp = Math.min(p.hp, s.hp);
    p.mp = Math.min(p.mp, s.mp);
  }
  p.notice = input.action === "salvage" ? "\uC7A5\uBE44\uB97C \uBD84\uD574\uD574 \uC7AC\uB8CC\uB97C \uC5BB\uC5C8\uC2B5\uB2C8\uB2E4." : "\uCC3D\uACE0 \uC774\uB3D9 \uC644\uB8CC";
}

// shared/beginner.ts
var beginnerProtected = (p) => p.level <= 20 && !(p.promotionTier || 0) && !ZONES[p.zone]?.raid;

// shared/tutorial.ts
var tutorialKills = (p) => Object.values(p.kills).reduce((n, k) => n + k, 0);
var tutorialState = (p) => ({ stage: 0, moved: 0, usedSkill: false, killStart: tutorialKills(p), completed: false });
function tutorialReady(p) {
  const t = p.tutorial;
  if (!t || t.completed) return false;
  switch (t.stage) {
    case 0:
      return true;
    case 1:
      return t.moved >= 120;
    case 2:
      return t.usedSkill;
    case 3:
      return Object.keys(p.quests).length > 0 || p.done.length > 0;
    case 4:
      return tutorialKills(p) - t.killStart >= 3;
    case 5:
      return p.level >= 2;
    case 6:
      return true;
    default:
      return false;
  }
}

// server/tutorial.ts
function tutorialInput(w, p, i, now) {
  if (i.action === "tutorialStart" && !p.tutorial) p.tutorial = tutorialState(p);
  if (i.action !== "tutorialNext" || !tutorialReady(p)) return;
  const t = p.tutorial;
  if (t.stage === 6) {
    p.pets ??= [];
    if (!p.pets.includes(0)) p.pets.push(0);
    p.petId = 0;
    p.petAutoLoot = true;
    t.completed = true;
    p.notice = "\uD29C\uD1A0\uB9AC\uC5BC \uC644\uB8CC! \uBCC4\uBE5B \uC5EC\uC6B0\uAC00 \uD568\uAED8\uD569\uB2C8\uB2E4.";
    return;
  }
  if (t.stage === 3) t.killStart = tutorialKills(p);
  if (t.stage === 4 && addXp(p, 180)) w.events.push({ id: crypto.randomUUID(), time: now, zone: p.zone, x: p.x, y: p.y, kind: "level", value: p.level, color: "#ffe8a3", source: p.id });
  t.stage++;
}

// shared/damage-skins.ts
var DAMAGE_SKINS = [
  { id: 0, name: "\uAE30\uBCF8", currency: "free", price: 0 },
  { id: 1, name: "\uD669\uAE08 \uBCC4\uBE5B", currency: "gold", price: 600 },
  { id: 2, name: "\uBE59\uACB0 \uC218\uC815", currency: "gold", price: 1200 },
  { id: 3, name: "\uBCC4\uAC00\uB8E8 \uC624\uB85C\uB77C", currency: "cash", price: 200 },
  { id: 4, name: "\uD0DC\uC591\uC758 \uBD88\uAF43", currency: "cash", price: 250 },
  { id: 5, name: "\uCC9C\uC0C1\uC758 \uB9F9\uC138", currency: "cash", price: 300 }
];

// server/damage-skins.ts
function damageSkinInput(p, i) {
  const skin = DAMAGE_SKINS.find((s) => s.id === i.value);
  if (!skin) return;
  if (i.action === "damageBuy" && skin.currency === "gold") {
    p.damageSkins ??= [];
    if (p.damageSkins.includes(skin.id)) return;
    if (p.gold < skin.price) {
      p.notice = "\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.";
      return;
    }
    p.gold -= skin.price;
    p.damageSkins.push(skin.id);
    p.damageSkinId = skin.id;
    p.notice = "\uB370\uBBF8\uC9C0 \uC2A4\uD0A8 \uAD6C\uB9E4 \uC644\uB8CC";
  }
  if (i.action === "damageEquip" && (skin.id === 0 || p.damageSkins?.includes(skin.id))) {
    p.damageSkinId = skin.id;
    p.notice = "\uB370\uBBF8\uC9C0 \uC2A4\uD0A8 \uC801\uC6A9";
  }
}

// shared/physics.ts
var distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function movable(x, y, zone = 0) {
  return x > 180 && x < 1620 && y > 140 && y < 1020 && onGround(x, y, zone) && !blocksFor(zone).some((b) => x > b.x - 15 && x < b.x + b.w + 15 && y > b.y - 15 && y < b.y + b.h + 15);
}
function clearSight(a, b) {
  const steps = Math.ceil(distance(a, b) / 12);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!movable(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.zone || 0)) return false;
  }
  return true;
}
function sweepMove(a, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 10));
  for (let i = 0; i < steps; i++) {
    const x = a.x + dx / steps, y = a.y + dy / steps;
    if (movable(x, a.y, a.zone || 0)) a.x = x;
    if (movable(a.x, y, a.zone || 0)) a.y = y;
  }
}
function aimDirection(p, aim) {
  const d = distance(p, aim);
  return d > 0.1 ? { x: (aim.x - p.x) / d, y: (aim.y - p.y) / d } : { x: p.face || 1, y: 0 };
}
function inCone(p, target, aim, cosine = -0.2) {
  const dir = aimDirection(p, aim), d = distance(p, target);
  return d < 1 || ((target.x - p.x) * dir.x + (target.y - p.y) * dir.y) / d >= cosine;
}
function lineDistance(p, target, aim) {
  const dir = aimDirection(p, aim);
  return { along: (target.x - p.x) * dir.x + (target.y - p.y) * dir.y, across: Math.abs((target.x - p.x) * dir.y - (target.y - p.y) * dir.x) };
}
function onGround(x, y, zone) {
  const points = groundFor(zone);
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if (a.y > y !== b.y > y && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    const vx = b.x - a.x, vy = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
    if (Math.hypot(x - a.x - vx * t, y - a.y - vy * t) < 12) return false;
  }
  return inside;
}

// server/social.ts
function tradeFor(w, id) {
  return w.trades?.find((t) => t.a === id || t.b === id);
}
function expireTrades(w, now) {
  w.trades = (w.trades || []).filter((t) => {
    const a = w.players[t.a], b = w.players[t.b];
    const valid = a && b && a.hp > 0 && b.hp > 0 && a.zone === b.zone && distance(a, b) <= 240 && now - a.seen < 15e3 && now - b.seen < 15e3 && t.expires > now;
    if (!valid) {
      if (a)
        a.notice = "\uAC70\uB798\uAC00 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC544\uC774\uD15C\uACFC \uACE8\uB4DC\uB294 \uC774\uB3D9\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
      if (b)
        b.notice = "\uAC70\uB798\uAC00 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC544\uC774\uD15C\uACFC \uACE8\uB4DC\uB294 \uC774\uB3D9\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
    }
    return valid;
  });
}
function socialInput(w, p, i, now) {
  if (i.action === "bubbleBuy" || i.action === "bubbleEquip") {
    const b2 = BUBBLES[Number(i.value)];
    if (!b2)
      return;
    p.bubbles ??= [0];
    if (i.action === "bubbleBuy" && b2.cashOnly) {
      p.notice = "\uC774 \uC0C1\uD488\uC740 \uD6C4\uC6D0 \uCE90\uC2DC\uC0F5\uC5D0\uC11C \uAD6C\uB9E4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      return;
    }
    if (i.action === "bubbleBuy" && !p.bubbles.includes(b2.id)) {
      if (p.gold < b2.price) {
        p.notice = "\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.";
        return;
      }
      p.gold -= b2.price;
      p.bubbles.push(b2.id);
    }
    if (p.bubbles.includes(b2.id)) {
      p.bubbleId = b2.id;
      p.notice = b2.name + " \uB9D0\uD48D\uC120 \uC801\uC6A9";
    }
    return;
  }
  if (!i.action?.startsWith("trade"))
    return;
  expireTrades(w, now);
  if (i.action === "tradeRequest") {
    const other = w.players[i.targetId || ""];
    if (!other || other.id === p.id || other.zone !== p.zone || p.zone >= 25 || other.hp <= 0 || distance(p, other) > 220 || now - other.seen > 1e4) {
      p.notice = "\uAC70\uB798\uD560 \uC218\uD638\uC790\uC5D0\uAC8C \uAC00\uAE4C\uC774 \uB2E4\uAC00\uAC00\uC138\uC694.";
      return;
    }
    if (tradeFor(w, p.id) || tradeFor(w, other.id)) {
      p.notice = "\uC774\uBBF8 \uC9C4\uD589 \uC911\uC778 \uAC70\uB798\uAC00 \uC788\uC2B5\uB2C8\uB2E4.";
      return;
    }
    w.trades ??= [];
    w.trades.push({ id: crypto.randomUUID(), a: p.id, b: other.id, phase: "request", revision: 0, expires: now + 12e4, offers: { [p.id]: { indices: [], items: [], gold: 0, confirmed: false }, [other.id]: { indices: [], items: [], gold: 0, confirmed: false } } });
    other.notice = p.name + "\uB2D8\uC774 \uAC70\uB798\uB97C \uC694\uCCAD\uD588\uC2B5\uB2C8\uB2E4.";
    return;
  }
  const t = tradeFor(w, p.id);
  if (!t || t.id !== i.tradeId)
    return;
  const cancel = () => {
    w.trades = w.trades.filter((a2) => a2.id !== t.id);
  };
  if (i.action === "tradeCancel") {
    cancel();
    return;
  }
  if (i.action === "tradeAccept" && t.phase === "request" && p.id === t.b) {
    t.phase = "open";
    t.revision++;
    return;
  }
  if (t.phase !== "open")
    return;
  if (i.action === "tradeOffer") {
    const indices = i.indices || [], gold = i.gold ?? 0;
    if (!Array.isArray(indices) || indices.length > 12 || new Set(indices).size !== indices.length || !Number.isSafeInteger(gold) || gold < 0 || gold > p.gold || indices.some((n) => !Number.isSafeInteger(n) || n < 0 || n >= p.inventory.length || Object.values(p.equipment).includes(p.inventory[n]) || ITEMS[p.inventory[n]]?.gmOnly)) {
      p.notice = "\uC81C\uC548\uD560 \uC544\uC774\uD15C\uACFC \uACE8\uB4DC\uB97C \uD655\uC778\uD558\uC138\uC694. \uC7A5\uCC29\uD55C \uC7A5\uBE44\uB294 \uAC70\uB798\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.";
      return;
    }
    t.offers[p.id] = { indices: [...indices], items: indices.map((n) => p.inventory[n]), gold, confirmed: false };
    for (const o of Object.values(t.offers))
      o.confirmed = false;
    t.revision++;
    t.expires = now + 12e4;
    return;
  }
  if (i.action !== "tradeConfirm" || i.revision !== t.revision)
    return;
  const a = w.players[t.a], b = w.players[t.b], ao = t.offers[t.a], bo = t.offers[t.b];
  const valid = (player, o) => player.gold >= o.gold && o.indices.every((index, n) => player.inventory[index] === o.items[n] && !Object.values(player.equipment).includes(o.items[n]));
  if (!valid(a, ao) || !valid(b, bo) || a.inventory.length - ao.items.length + bo.items.length > 60 || b.inventory.length - bo.items.length + ao.items.length > 60) {
    for (const o of Object.values(t.offers))
      o.confirmed = false;
    t.revision++;
    p.notice = "\uACE8\uB4DC\xB7\uC544\uC774\uD15C\xB7\uAC00\uBC29 \uACF5\uAC04\uC774 \uBC14\uB00C\uC5C8\uC2B5\uB2C8\uB2E4. \uC81C\uC548\uC744 \uB2E4\uC2DC \uB4F1\uB85D\uD558\uC138\uC694.";
    return;
  }
  t.offers[p.id].confirmed = true;
  if (!ao.confirmed || !bo.confirmed)
    return;
  a.inventory = a.inventory.filter((_, n) => !ao.indices.includes(n)).concat(bo.items);
  b.inventory = b.inventory.filter((_, n) => !bo.indices.includes(n)).concat(ao.items);
  a.gold += bo.gold - ao.gold;
  b.gold += ao.gold - bo.gold;
  a.notice = b.notice = "\uAC70\uB798\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
  cancel();
}

// server/raids.ts
function enterRaid(w, p, value, now) {
  const r = RAIDS[value];
  if (!r || p.level < r.level) {
    p.notice = "\uB808\uC774\uB4DC \uC785\uC7A5 \uB808\uBCA8\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.";
    return;
  }
  if (p.hp <= 0)
    return;
  if (p.zone >= 25) {
    p.notice = "\uC774\uBBF8 \uC131\uC18C\uC5D0 \uC785\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uB808\uC774\uB4DC\uB294 \uD1F4\uC7A5 \uD6C4 \uC120\uD0DD\uD558\uC138\uC694.";
    return;
  }
  w.raids ??= [];
  let battle = w.raids.find((b) => b.zone === r.zone);
  if (battle && battle.status !== "fight" && now < battle.ends) {
    p.notice = "\uC131\uC18C\uAC00 \uD68C\uBCF5 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uB4A4 \uB2E4\uC2DC \uC785\uC7A5\uD558\uC138\uC694.";
    return;
  }
  if (!battle || battle.status !== "fight") {
    w.raids = w.raids.filter((b) => b.zone !== r.zone);
    w.monsters = w.monsters.filter((m) => m.zone !== r.zone);
    battle = { zone: r.zone, started: now, ends: now + r.minutes * 6e4, participants: [], status: "fight", rewarded: false };
    w.raids.push(battle);
    w.monsters.push({ id: "raid-" + r.zone, type: 9, zone: r.zone, x: 900, y: 470, homeX: 900, homeY: 470, hp: r.hp, maxHp: r.hp, deadUntil: 0, lastHit: 0, lastAtk: 0, nextSpecial: now + 4e3 });
  }
  if (!battle.participants.includes(p.id)) {
    if (battle.participants.length >= 4) {
      p.notice = "\uB808\uC774\uB4DC\uB294 \uCD5C\uB300 4\uBA85\uC785\uB2C8\uB2E4.";
      return;
    }
    battle.participants.push(p.id);
  }
  p.zone = r.zone;
  p.x = 900;
  p.y = 850;
  const s = stats(p);
  p.hp = s.hp;
  p.mp = s.mp;
  p.notice = r.name + " \uB808\uC774\uB4DC \uC2DC\uC791! \uBD89\uC740 \uACBD\uACE0 \uBC94\uC704\uB97C \uD53C\uD558\uC138\uC694.";
}
function tickRaids(w, now) {
  for (const b of w.raids || []) {
    if (b.status !== "fight")
      continue;
    const boss = w.monsters.find((m) => m.zone === b.zone);
    if (!boss || boss.hp <= 0)
      continue;
    const present = b.participants.map((id) => w.players[id]).filter((p) => p && p.zone === b.zone && now - p.seen < 15e3);
    if (now >= b.ends || now - b.started > 15e3 && (!present.length || present.every((p) => p.hp <= 0))) {
      b.status = "failed";
      b.ends = now + 3e4;
      boss.hp = 0;
      boss.deadUntil = Number.MAX_SAFE_INTEGER;
      for (const p of present)
        p.notice = "\uB808\uC774\uB4DC \uC2E4\uD328. \uBCC4\uC0D8 \uB9C8\uC744\uB85C \uB3CC\uC544\uAC00 \uB2E4\uC2DC \uB3C4\uC804\uD558\uC138\uC694.";
    }
  }
}

// shared/pets.ts
var PETS = [{ id: 0, name: "\uBCC4\uBE5B \uC5EC\uC6B0", description: "\uC791\uC740 \uBC1C\uAC78\uC74C\uC73C\uB85C \uBAA8\uD5D8\uC744 \uD568\uAED8\uD558\uB294 \uC5EC\uC6B0", price: 500 }, { id: 1, name: "\uB2EC\uBE5B \uBD80\uC5C9\uC774", description: "\uBCC4\uAC00\uB8E8 \uB0A0\uAC1C\uB85C \uACC1\uC744 \uC9C0\uD0A4\uB294 \uBD80\uC5C9\uC774", price: 800 }, { id: 2, name: "\uAD6C\uB984 \uACE0\uC591\uC774", description: "\uBC18\uC9DD\uC774\uB294 \uBAA9\uAC78\uC774\uB97C \uB2E8 \uD638\uAE30\uC2EC \uB9CE\uC740 \uACE0\uC591\uC774", price: 1200 }];
var PET_PICKUP_RADIUS = 180;

// server/loot.ts
function collectLoot(w, p, now, radius) {
  let count = 0;
  const picked = /* @__PURE__ */ new Set();
  for (const l of w.loot) {
    if (l.zone !== p.zone || distance(p, l) >= radius || l.expires <= now || l.owner !== p.id && now <= l.expires - 45e3 || !clearSight(p, l)) continue;
    const fits = l.item === null || p.inventory.length < 60, changed = l.gold > 0 || l.potion || fits && l.item !== null;
    if (l.gold > 0) {
      p.materials ??= [0, 0, 0];
      p.materials[2]++;
      if (l.zone % 2 === 0) p.materials[0]++;
      else p.materials[1]++;
    }
    p.gold += l.gold;
    l.gold = 0;
    if (l.potion) {
      p.potions++;
      l.potion = false;
    }
    if (fits && l.item !== null) {
      p.inventory.push(l.item);
      l.item = null;
    }
    if (l.item === null) picked.add(l.id);
    if (changed) count++;
  }
  w.loot = w.loot.filter((l) => !picked.has(l.id));
  return count;
}

// shared/promotion.ts
var PROMOTION_NAMES = [["\uD0DC\uC591\uC758 \uC218\uD638\uAE30\uC0AC", "\uCC9C\uC0C1\uC758 \uC131\uAE30\uC0AC"], ["\uD3ED\uD48D\uC758 \uCD94\uC801\uC790", "\uCC9C\uAD81\uC758 \uC21C\uCC30\uC790"], ["\uB2EC\uC758 \uD604\uC790", "\uBCC4\uC790\uB9AC \uB300\uB9C8\uB3C4\uC0AC"]];
var PROMOTION_TRIALS = [
  { tier: 1, level: 20, name: "\uCCAB \uBC88\uC9F8 \uBCC4\uC758 \uB9F9\uC138", zone: 2, monster: 4, count: 10, bossZone: 3, boss: 8, bossCount: 1, story: "\uBCC4\uBE5B\uC740 \uD798\uB9CC\uC73C\uB85C \uAE68\uC5B4\uB098\uC9C0 \uC54A\uC544\uC694. \uC232\uAE38\uC758 \uACE0\uBE14\uB9B0\uC744 \uBB3C\uB9AC\uCE58\uACE0 \uC720\uC801\uC758 \uBD89\uC740 \uD30C\uC218\uAFBC\uC744 \uB118\uC5B4, \uC218\uD638\uC790\uC758 \uB9F9\uC138\uB97C \uC99D\uBA85\uD574 \uC8FC\uC138\uC694." },
  { tier: 2, level: 30, name: "\uCC9C\uC0C1\uC758 \uBCC4\uC744 \uACC4\uC2B9\uD558\uB2E4", zone: 16, monster: 6, count: 15, bossZone: 16, boss: 8, bossCount: 2, story: "\uBD88\uC528 \uD611\uACE1\uC758 \uACE0\uB300 \uACE8\uB818\uACFC \uBD89\uC740 \uD30C\uC218\uAFBC\uC744 \uB118\uC5B4\uC57C \uB9C8\uC9C0\uB9C9 \uBCC4\uC758 \uD798\uC744 \uC774\uC5B4\uBC1B\uC744 \uC218 \uC788\uC5B4\uC694. \uCC9C\uC0C1\uC758 \uAE38\uC740 \uC900\uBE44\uB41C \uC218\uD638\uC790\uC5D0\uAC8C\uB9CC \uC5F4\uB9AC\uC9C0\uC694." }
];

// shared/skills.ts
var SKILL_SPECS = [
  [
    { shape: "cone", description: "\uC804\uBC29\uC744 \uBCA0\uB294 3\uC5F0\uC18D \uAC80\uACA9. \uC138 \uBC88\uC9F8 \uAC80\uACA9\uC740 \uB354 \uAC15\uD55C \uD53C\uD574\uB97C \uC90D\uB2C8\uB2E4.", effect: "3\uD0C0 \uCF64\uBCF4 \xB7 \uC804\uBC29 \uAC80\uACA9" },
    { shape: "cone", description: "\uC804\uBC29\uC758 \uC801\uC744 \uAC15\uD558\uAC8C \uB0B4\uB9AC\uCCD0 0.8\uCD08\uAC04 \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4. \uBCF4\uC2A4\uB294 \uAE30\uC808\uC5D0 \uC800\uD56D\uD569\uB2C8\uB2E4.", effect: "\uAE30\uC808 \xB7 \uAC15\uD55C \uC77C\uACA9", stun: 800 },
    { shape: "circle", description: "\uC8FC\uBCC0\uC758 \uBAA8\uB4E0 \uC801\uC744 \uBCA0\uBA70 \uAC00\uD55C \uD53C\uD574\uC758 12%\uB9CC\uD07C \uC0DD\uBA85\uB825\uC744 \uD68C\uBCF5\uD569\uB2C8\uB2E4.", effect: "\uC6D0\uD615 \uBC94\uC704 \xB7 \uD761\uD608", lifeSteal: 0.12 },
    { shape: "line", description: "\uC870\uC900 \uBC29\uD5A5\uC73C\uB85C \uB3CC\uC9C4\uD558\uBA70 \uACBD\uB85C\uC0C1\uC758 \uC801\uC744 \uBCA0\uC5B4\uB0C5\uB2C8\uB2E4. \uBCBD\uC744 \uD1B5\uACFC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", effect: "\uB3CC\uC9C4 \xB7 \uACBD\uB85C \uACF5\uACA9", dash: 180 }
  ],
  [
    { shape: "single", description: "\uC870\uC900\uD55C \uC801\uC5D0\uAC8C \uBE60\uB974\uACE0 \uC815\uD655\uD55C \uBC14\uB78C \uD654\uC0B4\uC744 \uB0A0\uB9BD\uB2C8\uB2E4.", effect: "\uB2E8\uC77C \uC6D0\uAC70\uB9AC" },
    { shape: "cone", description: "\uC870\uC900 \uBC29\uD5A5\uC758 \uB113\uC740 \uBD80\uCC44\uAF34\uC5D0 \uCD5C\uB300 5\uBC1C\uC758 \uD654\uC0B4\uC744 \uBC1C\uC0AC\uD569\uB2C8\uB2E4.", effect: "\uBD80\uCC44\uAF34 \xB7 \uB2E4\uC911 \uD45C\uC801" },
    { shape: "line", description: "\uC870\uC900 \uBC29\uD5A5\uC73C\uB85C \uAD00\uD1B5 \uD654\uC0B4\uC744 \uBC1C\uC0AC\uD569\uB2C8\uB2E4. \uC77C\uC9C1\uC120\uC0C1\uC758 \uC801\uC744 \uBAA8\uB450 \uACF5\uACA9\uD569\uB2C8\uB2E4.", effect: "\uC9C1\uC120 \uAD00\uD1B5" },
    { shape: "single", description: "\uC870\uC900 \uBC29\uD5A5\uC758 \uBC18\uB300\uD3B8\uC73C\uB85C \uBB3C\uB7EC\uB098 \uD654\uC0B4\uC744 \uB0A0\uB9BD\uB2C8\uB2E4. 0.45\uCD08\uAC04 \uD53C\uD574\uB97C \uBC1B\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", effect: "\uD6C4\uD1F4 \xB7 \uBB34\uC801", dash: -110, invulnerable: 450 }
  ],
  [
    { shape: "single", description: "\uC801 \uD558\uB098\uB97C \uCD94\uC801\uD558\uB294 \uBE44\uC804 \uD0C4\uD658\uC744 \uBC1C\uC0AC\uD569\uB2C8\uB2E4.", effect: "\uB2E8\uC77C \uC6D0\uAC70\uB9AC" },
    { shape: "target-circle", description: "\uC870\uC900\uD55C \uC801 \uC8FC\uBCC0\uC5D0\uC11C \uBD88\uAF43\uC774 \uD3ED\uBC1C\uD569\uB2C8\uB2E4. \uC801\uC740 3.2\uCD08\uAC04 \uD654\uC0C1 \uD53C\uD574\uB97C \uBC1B\uC2B5\uB2C8\uB2E4.", effect: "\uD3ED\uBC1C \xB7 \uC9C0\uC18D \uD654\uC0C1", radius: 115, burn: 3200 },
    { shape: "circle", description: "\uC8FC\uBCC0\uC5D0 \uC11C\uB9AC \uD30C\uB3D9\uC744 \uBC29\uCD9C\uD574 \uC801\uC744 1.4\uCD08\uAC04 \uC5BC\uB9BD\uB2C8\uB2E4. \uD574\uB3D9 \uD6C4\uC5D0\uB3C4 \uC774\uB3D9 \uC18D\uB3C4\uAC00 \uB290\uB824\uC9D1\uB2C8\uB2E4.", effect: "\uC6D0\uD615 \uBC94\uC704 \xB7 \uBE59\uACB0", freeze: 1400 },
    { shape: "meteor", description: "\uC870\uC900\uD55C \uC704\uCE58\uC5D0 0.7\uCD08 \uB4A4 \uBCC4\uC774 \uB5A8\uC5B4\uC9D1\uB2C8\uB2E4. \uB113\uC740 \uD3ED\uBC1C\uB85C \uD070 \uD53C\uD574\uB97C \uC8FC\uACE0 \uC801\uC744 \uC7A0\uC2DC \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4.", effect: "\uC9C0\uC815 \uBC94\uC704 \xB7 \uC9C0\uC5F0 \uD3ED\uBC1C", radius: 165, stun: 500 }
  ]
];
var DODGE = { distance: 150, cooldown: 3e3, invulnerable: 350 };
SKILL_SPECS[0].push(
  { shape: "circle", effect: "\uD761\uD608 \xB7 \uC131\uC5ED", description: "\uC8FC\uBCC0 \uC801\uC744 \uBCA0\uACE0 \uD53C\uD574\uC758 25%\uB97C \uD68C\uBCF5\uD569\uB2C8\uB2E4.", lifeSteal: 0.25 },
  { shape: "line", effect: "\uAE34 \uB3CC\uC9C4 \xB7 \uAE30\uC808", description: "\uAE34 \uAC70\uB9AC\uB97C \uB3CC\uC9C4\uD558\uBA70 \uACBD\uB85C\uC758 \uC801\uC744 1\uCD08\uAC04 \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4.", dash: 240, stun: 1e3 },
  { shape: "meteor", effect: "\uC2EC\uD310 \xB7 \uBC94\uC704", description: "\uC870\uC900\uD55C \uC704\uCE58\uC5D0 \uBE5B\uC758 \uC2EC\uD310\uC774 \uB0B4\uB824 \uC801\uC744 \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4.", radius: 185, stun: 1400 },
  { shape: "circle", effect: "\uAC80\uBB34 \xB7 \uBB34\uC801", description: "\uB113\uC740 \uC6D0\uD615 \uAC80\uBB34\uC640 0.8\uCD08 \uBB34\uC801\uC744 \uC5BB\uC2B5\uB2C8\uB2E4.", invulnerable: 800 }
);
SKILL_SPECS[1].push(
  { shape: "cone", effect: "\uD3ED\uD48D \xB7 \uBD80\uCC44\uAF34", description: "\uC804\uBC29\uC5D0 \uAC15\uB825\uD55C \uD3ED\uD48D \uC0AC\uACA9\uC744 \uD37C\uBD93\uC2B5\uB2C8\uB2E4." },
  { shape: "line", effect: "\uAD00\uD1B5 \xB7 \uBE59\uACB0", description: "\uC11C\uB9AC \uD654\uC0B4\uB85C \uC9C1\uC120\uC0C1\uC758 \uC801\uC744 \uC5BC\uB9BD\uB2C8\uB2E4.", freeze: 1600 },
  { shape: "meteor", effect: "\uD654\uC0B4 \uD3ED\uC6B0", description: "\uC870\uC900\uD55C \uACF3\uC5D0 \uBCC4\uBE5B \uD654\uC0B4\uC774 \uC3DF\uC544\uC9D1\uB2C8\uB2E4.", radius: 190 },
  { shape: "circle", effect: "\uD3ED\uD48D \xB7 \uD68C\uD53C", description: "\uC8FC\uBCC0\uC744 \uD3ED\uD48D\uC73C\uB85C \uD729\uC4F8\uACE0 0.8\uCD08 \uBB34\uC801\uC744 \uC5BB\uC2B5\uB2C8\uB2E4.", invulnerable: 800 }
);
SKILL_SPECS[2].push(
  { shape: "circle", effect: "\uD761\uD608 \xB7 \uB2EC\uBE5B", description: "\uB2EC\uBE5B \uD30C\uB3D9\uC73C\uB85C \uC801\uC758 \uC0DD\uBA85\uB825\uC744 35% \uD761\uC218\uD569\uB2C8\uB2E4.", lifeSteal: 0.35 },
  { shape: "line", effect: "\uBE59\uD558 \xB7 \uAD00\uD1B5", description: "\uAD00\uD1B5\uD558\uB294 \uC5BC\uC74C \uCC3D\uC73C\uB85C \uC801\uC744 2\uCD08\uAC04 \uC5BC\uB9BD\uB2C8\uB2E4.", freeze: 2e3 },
  { shape: "meteor", effect: "\uD61C\uC131 \xB7 \uD654\uC0C1", description: "\uAC70\uB300\uD55C \uD61C\uC131\uC744 \uB5A8\uC5B4\uB728\uB824 \uB113\uC740 \uBC94\uC704\uC5D0 \uD654\uC0C1\uC744 \uB0A8\uAE41\uB2C8\uB2E4.", radius: 210, burn: 5e3 },
  { shape: "meteor", effect: "\uCD08\uC2E0\uC131 \xB7 \uAE30\uC808", description: "\uBCC4\uC758 \uD3ED\uBC1C\uB85C \uC801\uC744 2\uCD08\uAC04 \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4.", radius: 240, stun: 2e3 }
);
SKILL_SPECS[0].push({ shape: "circle", effect: "\uD0DC\uC591 \uBC29\uBCBD \xB7 \uBB34\uC801", description: "\uC8FC\uBCC0\uC744 \uBE5B\uC73C\uB85C \uC815\uD654\uD558\uBA70 1\uCD08\uAC04 \uD53C\uD574\uB97C \uBC1B\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", invulnerable: 1e3 }, { shape: "meteor", effect: "\uAD11\uD718 \xB7 \uAE30\uC808", description: "\uC870\uC900\uD55C \uC704\uCE58\uC5D0 \uC131\uAC80\uC758 \uBE5B\uC744 \uB0B4\uB824 1.5\uCD08 \uAE30\uC808\uC2DC\uD0B5\uB2C8\uB2E4.", radius: 180, stun: 1500 }, { shape: "line", effect: "\uCC9C\uC0C1 \uB3CC\uACA9", description: "\uBE5B\uC758 \uADA4\uC801\uC744 \uB530\uB77C \uB3CC\uC9C4\uD558\uBA70 \uC801\uC744 \uAD00\uD1B5\uD569\uB2C8\uB2E4.", dash: 260, invulnerable: 500 }, { shape: "circle", effect: "\uC131\uAC80 \xB7 \uD761\uD608", description: "\uAC70\uB300\uD55C \uC131\uAC80\uC758 \uD30C\uB3D9\uC73C\uB85C \uC8FC\uBCC0\uC744 \uBCA0\uACE0 \uD53C\uD574\uC758 25%\uB97C \uD68C\uBCF5\uD569\uB2C8\uB2E4.", lifeSteal: 0.25 });
SKILL_SPECS[1].push({ shape: "cone", effect: "\uD3ED\uD48D \xB7 \uD68C\uD53C", description: "\uD3ED\uD48D \uC0AC\uACA9\uACFC \uD568\uAED8 0.7\uCD08\uAC04 \uBB34\uC801\uC744 \uC5BB\uC2B5\uB2C8\uB2E4.", invulnerable: 700 }, { shape: "line", effect: "\uBD88\uC0AC\uC870 \xB7 \uD654\uC0C1", description: "\uBD88\uC0AC\uC870 \uD654\uC0B4\uC774 \uC9C1\uC120\uC0C1\uC758 \uC801\uC744 \uAD00\uD1B5\uD558\uACE0 4\uCD08\uAC04 \uBD88\uD0DC\uC6C1\uB2C8\uB2E4.", burn: 4e3 }, { shape: "cone", effect: "\uCC9C\uAD81 \xB7 \uB2E4\uC911 \uD45C\uC801", description: "\uC804\uBC29\uC5D0 \uAC15\uB825\uD55C \uCC9C\uC0C1\uC758 \uD654\uC0B4\uC744 \uD37C\uBD93\uC2B5\uB2C8\uB2E4." }, { shape: "meteor", effect: "\uBCC4\uBE5B \uC0AC\uB0E5 \xB7 \uBE59\uACB0", description: "\uBCC4\uBE5B \uD654\uC0B4\uBE44\uAC00 \uB113\uC740 \uBC94\uC704\uC5D0 \uB5A8\uC5B4\uC838 \uC801\uC744 \uC5BC\uB9BD\uB2C8\uB2E4.", radius: 215, freeze: 1800 });
SKILL_SPECS[2].push({ shape: "circle", effect: "\uB2EC\uC758 \uAC00\uD638 \xB7 \uD761\uD608", description: "\uB2EC\uBE5B \uD30C\uB3D9\uC73C\uB85C \uC0DD\uBA85\uB825\uC744 \uD761\uC218\uD558\uACE0 0.6\uCD08\uAC04 \uBB34\uC801\uC744 \uC5BB\uC2B5\uB2C8\uB2E4.", lifeSteal: 0.3, invulnerable: 600 }, { shape: "meteor", effect: "\uC740\uD558 \uD61C\uC131 \xB7 \uD654\uC0C1", description: "\uC740\uD558\uC758 \uD61C\uC131\uC73C\uB85C \uB113\uC740 \uBC94\uC704\uB97C \uD0DC\uC6C1\uB2C8\uB2E4.", radius: 195, burn: 4e3 }, { shape: "circle", effect: "\uC2DC\uAC04\uC758 \uC11C\uB9AC \xB7 \uBE59\uACB0", description: "\uC8FC\uBCC0 \uC801\uC758 \uC2DC\uAC04\uC744 \uBA48\uCD94\uB4EF 2.5\uCD08\uAC04 \uC5BC\uB9BD\uB2C8\uB2E4.", freeze: 2500 }, { shape: "meteor", effect: "\uC6B0\uC8FC\uC758 \uD0C4\uC0DD", description: "\uAC70\uB300\uD55C \uBCC4\uC758 \uD3ED\uBC1C\uB85C \uB113\uC740 \uBC94\uC704\uC5D0 \uD53C\uD574\uC640 \uAE30\uC808\uC744 \uC90D\uB2C8\uB2E4.", radius: 245, stun: 1800 });

// server/combat.ts
function emit(w, p, now, kind, value, color, extra = {}) {
  w.events.push({ id: crypto.randomUUID(), time: now, zone: p.zone, x: p.x, y: p.y, kind, value, color, ...extra });
}
function killMonster(w, m, p, now) {
  if (ZONES[m.zone]?.raid) {
    const b = w.raids?.find((b2) => b2.zone === m.zone), r = RAIDS[m.zone - 25];
    m.deadUntil = Number.MAX_SAFE_INTEGER;
    if (b && !b.rewarded) {
      b.rewarded = true;
      b.status = "won";
      b.ends = now + 3e4;
      for (const id of b.participants) {
        const a = w.players[id];
        if (!a || a.zone !== m.zone || now - a.seen > 15e3 || !m.raidDamage?.[id]) continue;
        a.gold += r.gold;
        a.raidWins = (a.raidWins || 0) + 1;
        if (a.inventory.length < 60) a.inventory.push(14 + a.classId);
        else {
          a.raidRewards ??= [];
          a.raidRewards.push(14 + a.classId);
        }
        if (addXp(a, r.xp)) emit(w, a, now, "level", a.level, "#ffe8a3", { source: a.id });
        a.notice = r.name + " \uCC98\uCE58! " + r.gold + " G \xB7 " + r.xp + " EXP" + (a.inventory.length <= 60 ? " \uC804\uC124 \uBB34\uAE30 \uC9C0\uAE09 \xB7 \uAC00\uBC29\uC774 \uAC00\uB4DD \uCC28\uBA74 \uB808\uC774\uB4DC \uCC3D\uC5D0\uC11C \uC218\uB839" : "");
      }
      emit(w, m, now, "death", 0, "#ffdf9e", { effect: "raid-death" });
    }
    return;
  }
  m.deadUntil = now + (m.type === 9 ? 6e4 : 15e3);
  const md = MONSTERS[m.type];
  const participants = Object.values(w.players).filter((a) => a.zone === m.zone && a.hp > 0 && now - a.seen < 1e4 && distance(a, m) < 500);
  for (const a of participants) {
    a.kills[m.type] = (a.kills[m.type] || 0) + 1;
    if (a.promotionQuest) {
      const trial = PROMOTION_TRIALS[a.promotionQuest.tier - 1];
      if (m.zone === trial.zone && m.type === trial.monster) a.promotionQuest.kills = Math.min(trial.count, a.promotionQuest.kills + 1);
      if (m.zone === trial.bossZone && m.type === trial.boss) a.promotionQuest.bosses = Math.min(trial.bossCount, a.promotionQuest.bosses + 1);
    }
    for (const q of QUESTS) {
      if ((q.zone === void 0 || q.zone === m.zone) && q.monster === m.type && a.quests[q.id] !== void 0) a.quests[q.id] = Math.min(q.count, a.quests[q.id] + 1);
    }
    if (addXp(a, Math.round(md.xp * zoneScale(m.zone) * (beginnerProtected(a) ? 2 : 1)))) emit(w, a, now, "level", a.level, "#ffe8a3", { source: a.id });
  }
  const rarity = isBoss(m.type) ? 2 : m.zone >= 2 ? 1 : 0;
  const pool = ITEMS.filter((i) => i.id >= 21 && (i.minLevel || 1) <= ZONES[m.zone].minLevel && i.rarity <= rarity + 1);
  const item = Math.random() < 0.48 || isBoss(m.type) ? pool.length && Math.random() < 0.5 ? pool[Math.floor(Math.random() * pool.length)].id : rarity * 7 + Math.floor(Math.random() * 7) : null;
  w.loot.push({ id: crypto.randomUUID(), owner: p.id, zone: m.zone, x: m.x, y: m.y, gold: Math.round(md.gold * zoneScale(m.zone)), item, potion: Math.random() < 0.35, expires: now + 6e4 });
  emit(w, m, now, "death", 0, "#b7ecd9");
}
function damageMonster(w, m, p, damage, now, critical = false, effect) {
  if (m.hp <= 0) return;
  damage = Math.max(1, Math.round(damage * (beginnerProtected(p) ? 1.6 : 1)));
  if (ZONES[m.zone]?.raid) {
    m.raidDamage ??= {};
    m.raidDamage[p.id] = (m.raidDamage[p.id] || 0) + Math.min(m.hp, damage);
  }
  m.hp = Math.max(0, m.hp - damage);
  m.lastHit = now;
  emit(w, m, now, "hit", damage, critical ? "#ffe7a4" : effect === "burn" ? "#ffb072" : "#fff5e0", { critical, effect, source: p.id, damageSkinId: p.damageSkinId || 0 });
  if (m.hp <= 0) killMonster(w, m, p, now);
}
function hurtPlayer(w, p, damage, now) {
  if (p.hp <= 0 || (p.dodgeUntil || 0) > now) return;
  const maxHp = stats(p).hp;
  let value = Math.max(2, Math.round(damage - stats(p).def * 0.6));
  if (beginnerProtected(p)) {
    const recent = w.events.filter((e) => e.effect === "player-hurt" && e.source === p.id && now - e.time < 1e3).reduce((sum, e) => sum + e.value, 0);
    value = Math.min(Math.max(1, Math.round(value * 0.25)), Math.max(1, Math.floor(maxHp * 0.018)), Math.max(0, Math.floor(maxHp * 0.065) - recent));
    if (value <= 0) return;
  }
  p.hp = Math.max(0, p.hp - value);
  emit(w, p, now, "hit", value, "#ff8e87", { source: p.id, effect: "player-hurt" });
  if (p.hp <= 0) p.notice = "\uC4F0\uB7EC\uC84C\uC2B5\uB2C8\uB2E4. \uBCC4\uC0D8 \uB9C8\uC744\uC5D0\uC11C \uB2E4\uC2DC \uC77C\uC5B4\uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
}
function applyStatus(m, p, skill, now) {
  const spec = SKILL_SPECS[p.classId][skill], rank = p.skillRanks?.[skill] || 0;
  if (spec.burn) {
    m.burnUntil = now + spec.burn;
    m.burnOwner = p.id;
    m.burnTick = now + 650;
  }
  if (spec.freeze) {
    if (m.type !== 9) m.freezeUntil = now + spec.freeze + rank * 100;
    m.slowUntil = now + 4e3;
  }
  if (spec.stun && m.type !== 9) m.stunUntil = now + spec.stun + rank * 80;
}
function castSkill(w, p, input, now) {
  const skill = input.skill;
  if (!Number.isInteger(skill) || skill < 0 || skill > 11) return;
  const i = skill, c = CLASSES[p.classId], spec = SKILL_SPECS[p.classId][i];
  if (!skillUnlocked(p, i)) {
    p.notice = "\uC2A4\uD0AC \uCC3D\uC5D0\uC11C \uB808\uBCA8 \uC870\uAC74\uC744 \uD655\uC778\uD558\uACE0 \uC2A4\uD0AC\uC744 \uBC30\uC6B0\uC138\uC694.";
    return;
  }
  if (ZONES[p.zone]?.safe) {
    p.notice = "\uB9C8\uC744\uC5D0\uC11C\uB294 \uBB34\uAE30\uB97C \uB0B4\uB824\uB193\uC73C\uC138\uC694.";
    return;
  }
  if (now < (p.cd[i] || 0)) return;
  if (p.mp < c.cost[i]) {
    p.notice = "\uB9C8\uB098\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4. R \uD0A4\uB85C \uB9C8\uB098 \uBB3C\uC57D\uC744 \uC0AC\uC6A9\uD558\uC138\uC694.";
    return;
  }
  p.mp -= c.cost[i];
  p.cd[i] = now + c.cd[i];
  p.attackAt = now;
  p.attackSkill = i;
  let aim = { x: Math.max(0, Math.min(WORLD.w, Number(input.tx) || p.x + 100)), y: Math.max(0, Math.min(WORLD.h, Number(input.ty) || p.y)) };
  const origin = { x: p.x, y: p.y, zone: p.zone };
  const dir = aimDirection(p, aim);
  if (Math.abs(dir.x) > 0.1) p.face = dir.x > 0 ? 1 : -1;
  p.target = aim;
  if (p.classId === 0 && i === 0) {
    p.combo = now < (p.comboUntil || 0) ? (p.combo || 0) % 3 + 1 : 1;
    p.comboUntil = now + 1800;
  }
  if (spec.dash) {
    sweepMove(p, dir.x * spec.dash, dir.y * spec.dash);
  }
  if (spec.invulnerable) p.dodgeUntil = now + spec.invulnerable;
  const rank = p.skillRanks?.[i] || 0, power = c.power[i] * (1 + rank * 0.12) * (p.classId === 0 && i === 0 && p.combo === 3 ? 1.55 : 1);
  const candidates = w.monsters.filter((m) => m.zone === p.zone && m.hp > 0 && distance(m, origin) <= c.range[i] && clearSight(origin, m)).sort((a, b) => distance(a, aim) - distance(b, aim));
  if (spec.shape === "meteor") {
    const d = distance(origin, aim);
    if (d > c.range[i]) aim = { x: origin.x + dir.x * c.range[i], y: origin.y + dir.y * c.range[i] };
    if (!clearSight(origin, aim)) {
      p.notice = "\uBCC4\uBE5B\uC774 \uB2FF\uC9C0 \uC54A\uB294 \uC704\uCE58\uC785\uB2C8\uB2E4.";
      p.mp += c.cost[i];
      p.cd[i] = now;
      return;
    }
    w.casts ??= [];
    w.casts.push({ id: crypto.randomUUID(), source: p.id, zone: p.zone, x: aim.x, y: aim.y, resolveAt: now + 700, radius: spec.radius, skill: i });
    emit(w, { ...aim, zone: p.zone }, now, "warning", spec.radius, "#c4afff", { classId: p.classId, source: p.id, skill: i, effect: "meteor" });
    return;
  }
  let victims = [];
  if (spec.shape === "single") victims = candidates.slice(0, 1);
  if (spec.shape === "circle") victims = candidates;
  if (spec.shape === "cone") victims = candidates.filter((m) => inCone(origin, m, aim, p.classId === 1 ? 0.52 : -0.2)).slice(0, p.classId === 1 ? 5 : 6);
  if (spec.shape === "line") victims = candidates.filter((m) => {
    const l = lineDistance(origin, m, aim);
    return l.along >= -20 && l.across < (p.classId === 0 ? 75 : 38);
  });
  if (spec.shape === "target-circle") {
    const target = candidates[0];
    aim = target ? { x: target.x, y: target.y } : aim;
    victims = w.monsters.filter((m) => m.zone === p.zone && m.hp > 0 && distance(m, aim) <= spec.radius && distance(m, origin) <= c.range[i] + spec.radius && clearSight(origin, m));
  }
  emit(w, origin, now, "spell", p.classId === 0 && i === 0 ? p.combo || 1 : 0, c.color, { source: p.id, tx: aim.x, ty: aim.y, skill: i, classId: p.classId, effect: spec.shape });
  let healed = 0;
  for (const m of victims) {
    const critical = Math.random() < 0.14;
    const damage = Math.round(stats(p).atk * power * (critical ? 1.6 : 1) * (0.9 + Math.random() * 0.2));
    const actual = Math.min(m.hp, damage);
    applyStatus(m, p, i, now);
    damageMonster(w, m, p, damage, now, critical);
    if (spec.lifeSteal) healed += actual * spec.lifeSteal;
    const d = distance(m, p);
    if (d > 0 && m.type !== 9 && !spec.freeze) {
      sweepMove(m, (m.x - p.x) / d * 14, (m.y - p.y) / d * 14);
    }
  }
  if (healed > 0) {
    const amount = Math.max(1, Math.round(healed));
    p.hp = Math.min(stats(p).hp, p.hp + amount);
    emit(w, p, now, "heal", amount, "#a0f4ae", { source: p.id });
  }
}
function dodge(w, p, input, now) {
  if (now < (p.dodgeCd || 0)) {
    p.notice = "\uD68C\uD53C\uAC00 \uC544\uC9C1 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.";
    return;
  }
  const dx = Number(input.dx) || 0, dy = Number(input.dy) || 0;
  const aim = dx || dy ? { x: p.x + dx, y: p.y + dy } : { x: Number(input.tx) || p.x + p.face * 100, y: Number(input.ty) || p.y };
  const dir = aimDirection(p, aim);
  const origin = { x: p.x, y: p.y, zone: p.zone };
  sweepMove(p, dir.x * DODGE.distance, dir.y * DODGE.distance);
  p.dodgeUntil = now + DODGE.invulnerable;
  p.dodgeCd = now + DODGE.cooldown;
  emit(w, origin, now, "dodge", 0, "#c2e8de", { source: p.id, tx: p.x, ty: p.y, classId: p.classId });
}
function tickCombat(w, now) {
  for (const cast of w.casts || []) {
    if (now < cast.resolveAt) continue;
    const p = w.players[cast.source];
    if (!p) continue;
    const skill = cast.skill, rank = p.skillRanks?.[skill] || 0;
    for (const m of w.monsters) {
      if (m.zone !== cast.zone || m.hp <= 0 || distance(m, cast) > cast.radius || !clearSight(cast, m)) continue;
      applyStatus(m, p, skill, now);
      damageMonster(w, m, p, stats(p).atk * CLASSES[p.classId].power[skill] * (1 + rank * 0.12), now);
    }
    emit(w, cast, now, "spell", 0, "#dec6ff", { skill, classId: p.classId, source: p.id, effect: "meteor", tx: cast.x, ty: cast.y });
  }
  w.casts = (w.casts || []).filter((c) => now < c.resolveAt);
  for (const m of w.monsters) {
    if (m.hp <= 0) continue;
    if ((m.burnUntil || 0) > now && now >= (m.burnTick || 0)) {
      const p = w.players[m.burnOwner || ""];
      if (p) {
        damageMonster(w, m, p, stats(p).atk * 0.2, now, false, "burn");
        m.burnTick = now + 650;
      }
    }
    if (m.hp <= 0) continue;
    if (m.attackUntil && now >= m.attackUntil) {
      for (const p of Object.values(w.players)) {
        if (p.zone === m.zone && p.hp > 0 && now - p.seen < 1e4 && distance(p, { x: m.attackX, y: m.attackY }) < 170) hurtPlayer(w, p, (ZONES[m.zone]?.raid ? RAIDS[m.zone - 25].atk : MONSTERS[m.type].atk * zoneScale(m.zone)) * (m.hp < m.maxHp * 0.5 ? 2.1 : 1.65), now);
      }
      emit(w, { zone: m.zone, x: m.attackX, y: m.attackY }, now, "spell", 0, "#ff876b", { effect: "boss-slam" });
      m.attackUntil = 0;
    }
  }
}

// server/engine.ts
function newPlayer(id, name, classId, now) {
  const c = CLASSES[classId];
  return { id, name, classId, zone: 0, x: 900, y: 740, face: 1, hp: c.hp + 15, mp: c.mp, level: 1, xp: 0, gold: 80, inventory: [classId, 3], equipment: { weapon: classId, armor: 3, ring: null }, potions: 8, manaPotions: 5, quests: {}, done: [], kills: {}, cd: [0, 0, 0, 0], last: now, seen: now, attackAt: 0, attackSkill: 0, target: { x: 0, y: 0 }, lastSeq: 0, loadout: [0, 1, 2, 3], skillRanks: Array(12).fill(0), dodgeCd: 0, dodgeUntil: 0, potionCd: 0, manaPotionCd: 0, tutorial: { stage: 0, moved: 0, usedSkill: false, killStart: 0, completed: false }, damageSkins: [], damageSkinId: 0, notice: "\uD018\uC2A4\uD2B8 \uCE74\uB4DC \uD074\uB9AD\uC73C\uB85C \uC989\uC2DC \uC218\uB77D \xB7 \uBAA9\uD45C \uB2EC\uC131 \uD6C4 \uB2E4\uC2DC \uD074\uB9AD\uD558\uBA74 \uBCF4\uC0C1\uC744 \uBC1B\uC2B5\uB2C8\uB2E4." };
}
function createWorld(now) {
  const monsters = [];
  for (const z of ZONES) {
    if (z.raid || z.safe) continue;
    for (let i = 0; i < (z.id === 0 ? 0 : 12); i++) {
      const type = z.types[i % z.types.length];
      const x = 500 + i % 4 * 245, y = 390 + Math.floor(i / 4) * 220;
      monsters.push({ id: `m${z.id}-${i}`, type, zone: z.id, x, y, homeX: x, homeY: y, hp: Math.round(MONSTERS[type].hp * zoneScale(z.id)), maxHp: Math.round(MONSTERS[type].hp * zoneScale(z.id)), deadUntil: 0, lastHit: 0, lastAtk: 0 });
    }
  }
  return { players: {}, monsters, loot: [], events: [], chat: [], tick: now, contentVersion: 5 };
}
function notice(p, s) {
  p.notice = s;
}
function tickWorld(w, now) {
  const dt = Math.min(0.55, Math.max(0, (now - w.tick) / 1e3));
  w.tick = now;
  w.events = w.events.filter((e) => now - e.time < 2400);
  w.loot = w.loot.filter((l) => now < l.expires);
  w.chat = w.chat.filter((c) => now - c.time < 36e5).slice(-60);
  const activeByZone = /* @__PURE__ */ new Map();
  for (const player of Object.values(w.players)) if (player.hp > 0 && now - player.seen < 1e4) {
    const group = activeByZone.get(player.zone) || [];
    group.push(player);
    activeByZone.set(player.zone, group);
  }
  expireTrades(w, now);
  tickCombat(w, now);
  tickRaids(w, now);
  for (const p of Object.values(w.players)) {
    if (now - p.seen > 15e3 || p.hp <= 0) continue;
    autoTrain(p);
    const s = stats(p);
    p.mp = Math.min(s.mp, p.mp + dt * 2.8);
    if (ZONES[p.zone]?.safe) p.hp = Math.min(s.hp, p.hp + dt * 5);
    else if (beginnerProtected(p)) {
      p.hp = Math.min(s.hp, p.hp + dt * s.hp * 0.025);
      p.mp = Math.min(s.mp, p.mp + dt * 5);
    }
    if (p.petAutoLoot !== false && p.petId !== void 0 && p.petId !== null && p.pets?.includes(p.petId) && now - (p.petPickupAt || 0) >= 450) {
      p.petPickupAt = now;
      const collected = collectLoot(w, p, now, PET_PICKUP_RADIUS);
      if (collected) emit(w, p, now, "loot", collected, "#ffe0a2", { source: p.id, effect: "pet-pickup" });
    }
  }
  for (const m of w.monsters) {
    if (m.hp <= 0) {
      if (now >= m.deadUntil) {
        m.hp = m.maxHp;
        m.x = m.homeX;
        m.y = m.homeY;
        m.attackUntil = 0;
        m.nextSpecial = now + 4500;
        m.burnUntil = 0;
      }
      continue;
    }
    const players = (activeByZone.get(m.zone) || []).slice().sort((a, b) => distance(a, m) - distance(b, m));
    const target = players[0];
    const d = target ? distance(m, target) : Infinity;
    const def = ZONES[m.zone]?.raid ? { ...MONSTERS[m.type], atk: RAIDS[m.zone - 25].atk / zoneScale(m.zone), speed: 85 } : MONSTERS[m.type];
    const frozen = Math.max(m.freezeUntil || 0, m.stunUntil || 0) > now;
    if (frozen) continue;
    const speed = def.speed * ((m.slowUntil || 0) > now ? 0.45 : 1) * (isBoss(m.type) && m.hp < m.maxHp * 0.5 ? 1.25 : 1);
    if (target && isBoss(m.type) && d < 400 && now >= (m.nextSpecial || 0)) {
      m.attackX = target.x;
      m.attackY = target.y;
      m.attackUntil = now + 1200;
      m.nextSpecial = now + (m.type === 9 ? 5500 : 8e3);
      emit(w, { zone: m.zone, x: target.x, y: target.y }, now, "warning", 170, "#ff8a70", { effect: "boss-slam" });
    }
    if (m.attackUntil && m.attackUntil > now) continue;
    if (target && d < 330) {
      if (d > 55) {
        const move = Math.min(speed * dt, d - 50);
        sweepMove(m, (target.x - m.x) / d * move, (target.y - m.y) / d * move);
      }
      if (d < 68 && now - m.lastAtk > 1100) {
        m.lastAtk = now;
        hurtPlayer(w, target, def.atk * zoneScale(m.zone), now);
      }
    } else {
      const phase = Number(m.id.split("-")[1]) || 0;
      const goal = { x: m.homeX + Math.sin(now / 3e3 + phase) * 12, y: m.homeY + Math.cos(now / 3700 + phase) * 9 };
      const distance2 = distance(m, goal);
      if (distance2 > 0.01) {
        const move = Math.min(distance2, dt * 35);
        sweepMove(m, (goal.x - m.x) / distance2 * move, (goal.y - m.y) / distance2 * move);
      }
    }
  }
}
function applyInput(w, p, input, now) {
  const elapsed = Math.max(0, Math.min(2, (now - p.last) / 1e3));
  p.seen = now;
  const fresh = typeof input.seq === "number" && input.seq > p.lastSeq;
  if (!fresh) return;
  p.last = now;
  p.lastSeq = input.seq;
  p.notice = "";
  if (p.hp <= 0) {
    if (input.action === "respawn") {
      p.zone = 0;
      p.x = 900;
      p.y = 740;
      const s = stats(p);
      p.hp = s.hp;
      p.mp = s.mp;
      notice(p, "\uBCC4\uC0D8\uC758 \uBE5B\uC774 \uB2F9\uC2E0\uC744 \uB418\uC0B4\uB838\uC2B5\uB2C8\uB2E4.");
    }
    return;
  }
  if (!movable(p.x, p.y, p.zone)) {
    let found = false;
    for (let radius = 20; radius <= 700 && !found; radius += 20) for (let angle = 0; angle < 24; angle++) {
      const x = p.x + Math.cos(angle / 24 * Math.PI * 2) * radius, y = p.y + Math.sin(angle / 24 * Math.PI * 2) * radius;
      if (movable(x, y, p.zone)) {
        p.x = x;
        p.y = y;
        found = true;
        break;
      }
    }
    if (!found) {
      p.x = 900;
      p.y = 740;
    }
  }
  const beforeMove = { x: p.x, y: p.y };
  const dx = Math.max(-1, Math.min(1, Number(input.dx) || 0)), dy = Math.max(-1, Math.min(1, Number(input.dy) || 0)), len = Math.max(1, Math.hypot(dx, dy));
  const nx = p.x + dx / len * WORLD.speed * Math.min(0.5, elapsed), ny = p.y + dy / len * WORLD.speed * Math.min(0.5, elapsed);
  if (Number.isFinite(input.moveX) && Number.isFinite(input.moveY)) {
    const mx = input.moveX, my = input.moveY, distance2 = Math.hypot(mx, my), limit = WORLD.speed * elapsed + 2, scale = distance2 > limit ? limit / distance2 : 1;
    sweepMove(p, mx * scale, my * scale);
  } else sweepMove(p, nx - p.x, ny - p.y);
  if (dx) p.face = dx > 0 ? 1 : -1;
  if (p.tutorial?.stage === 1) p.tutorial.moved = Math.min(120, p.tutorial.moved + Math.hypot(p.x - beforeMove.x, p.y - beforeMove.y));
  tutorialInput(w, p, input, now);
  damageSkinInput(p, input);
  if (input.action === "dodge") dodge(w, p, input, now);
  castSkill(w, p, input, now);
  if (p.tutorial?.stage === 2 && p.attackAt === now && Number.isInteger(input.skill)) p.tutorial.usedSkill = true;
  socialInput(w, p, input, now);
  cashInput(w, p, input, now);
  workshopInput(w, p, input);
  if (input.action === "raidClaim") {
    while (p.raidRewards?.length && p.inventory.length < 60) p.inventory.push(p.raidRewards.shift());
    p.notice = p.raidRewards?.length ? "\uAC00\uBC29 \uACF5\uAC04\uC744 \uD655\uBCF4\uD558\uC138\uC694." : "\uBCF4\uC0C1 \uBB34\uAE30\uB97C \uC218\uB839\uD588\uC2B5\uB2C8\uB2E4.";
  }
  if (input.action === "raidEnter") enterRaid(w, p, Number(input.value), now);
  if (input.action === "raidLeave" && ZONES[p.zone]?.raid) {
    p.zone = 0;
    p.x = 900;
    p.y = 740;
    p.notice = "\uBCC4\uC0D8 \uB9C8\uC744\uB85C \uB3CC\uC544\uC654\uC2B5\uB2C8\uB2E4.";
  }
  if (input.action === "autoTrain" || input.action === "autoSkillMode") {
    const mode = Number(input.value);
    if (Number.isInteger(mode) && mode >= 0 && mode <= 3) {
      if (input.action === "autoSkillMode") p.autoSkillMode = mode;
      const used = autoTrain(p, mode);
      notice(p, mode === 0 ? "\uC790\uB3D9 \uBC30\uBD84\uC744 \uAED0\uC2B5\uB2C8\uB2E4." : used ? `\uC219\uB828 \uD3EC\uC778\uD2B8 ${used}\uAC1C\uB97C \uC790\uB3D9 \uBC30\uBD84\uD588\uC2B5\uB2C8\uB2E4.` : "\uC790\uB3D9 \uBC30\uBD84 \uC124\uC815\uC744 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC74C \uB808\uBCA8\uBD80\uD130 \uC801\uC6A9\uB429\uB2C8\uB2E4.");
    }
  }
  if (input.action === "train") {
    const skill = Number(input.value);
    p.skillRanks ??= Array(12).fill(0);
    if (Number.isInteger(skill) && skill >= 0 && skill < 12 && skillAvailable(p, skill) && skillPoints(p) > 0 && (p.skillRanks[skill] || 0) < 3) {
      p.skillRanks[skill] = (p.skillRanks[skill] || 0) + 1;
      notice(p, CLASSES[p.classId].skills[skill] + " \uC219\uB828\uB3C4 \uC0C1\uC2B9");
    } else notice(p, "\uB0A8\uC740 \uC219\uB828 \uD3EC\uC778\uD2B8\uAC00 \uC5C6\uAC70\uB098 \uCD5C\uB300 \uC219\uB828\uB3C4\uC785\uB2C8\uB2E4.");
  }
  if (input.action === "loot") {
    const count = collectLoot(w, p, now, 160);
    if (count) {
      notice(p, `\uC804\uB9AC\uD488 ${count}\uAC1C \uD68D\uB4DD`);
      emit(w, p, now, "loot", count, "#ffe0a2", { source: p.id });
    } else notice(p, "\uAC00\uAE4C\uC6B4 \uC804\uB9AC\uD488\uC774 \uC5C6\uAC70\uB098 \uAC00\uBC29 \uACF5\uAC04\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.");
  }
  if (input.action === "potion" || input.action === "mana") {
    const hp = input.action === "potion", s = stats(p), cooldown = hp ? p.potionCd || 0 : p.manaPotionCd || 0;
    if (now < cooldown) {
      notice(p, "\uBB3C\uC57D\uC744 \uB2E4\uC2DC \uC0AC\uC6A9\uD558\uB824\uBA74 \uC7A0\uC2DC \uAE30\uB2E4\uB9AC\uC138\uC694.");
    } else if (hp ? p.hp >= s.hp : p.mp >= s.mp) {
      notice(p, hp ? "\uC0DD\uBA85\uB825\uC774 \uAC00\uB4DD \uCC28 \uC788\uC2B5\uB2C8\uB2E4." : "\uB9C8\uB098\uAC00 \uAC00\uB4DD \uCC28 \uC788\uC2B5\uB2C8\uB2E4.");
    } else if (hp ? p.potions > 0 : p.manaPotions > 0) {
      const amount = hp ? Math.min(80, s.hp - p.hp) : Math.min(70, s.mp - p.mp);
      if (hp) {
        p.potions--;
        p.hp = Math.min(s.hp, p.hp + 80);
        p.potionCd = now + 2200;
      } else {
        p.manaPotions--;
        p.mp = Math.min(s.mp, p.mp + 70);
        p.manaPotionCd = now + 2200;
      }
      emit(w, p, now, "heal", Math.ceil(amount), hp ? "#a0f4ae" : "#a1cbff", { source: p.id });
    } else notice(p, "\uBB3C\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9C8\uC744 \uC0C1\uC810\uC5D0\uC11C \uAD6C\uC785\uD558\uC138\uC694.");
  }
  if (input.action === "bind") {
    const slot = Number(input.slot), skill = Number(input.value);
    if (Number.isInteger(slot) && slot >= 0 && slot < 4 && (skill === -1 || Number.isInteger(skill) && skill >= 0 && skill < 12 && skillUnlocked(p, skill))) {
      p.loadout ??= [0, 1, 2, 3];
      p.loadout[slot] = skill;
      notice(p, "\uC2A4\uD0AC \uC2AC\uB86F\uC744 \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  if (input.action === "portal" || input.action === "travel") {
    const direct = input.action === "travel", portal = direct ? void 0 : portalsFor(p.zone)[Number(input.value)], zone = direct ? Number(input.value) : portal?.target;
    if ((direct || portal && distance(p, portal) < 160) && Number.isInteger(zone) && zone >= 0 && zone < ZONES.length && !ZONES[zone].raid) {
      if (p.level < ZONES[zone].minLevel) notice(p, `\uB808\uBCA8 ${ZONES[zone].minLevel}\uBD80\uD130 \uB4E4\uC5B4\uAC08 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`);
      else {
        p.zone = zone;
        p.x = direct ? 900 : portal.next > 0 ? 400 : 1400;
        p.y = direct ? 830 : 680;
        notice(p, ZONES[zone].name + "\uC5D0 \uB3C4\uCC29\uD588\uC2B5\uB2C8\uB2E4.");
      }
    } else notice(p, direct ? "\uC774\uB3D9\uD560 \uC218 \uC5C6\uB294 \uC9C0\uC5ED\uC785\uB2C8\uB2E4." : "\uC774\uB3D9 \uAD6C\uC2AC\uC774\uB098 \uCC28\uC6D0\uBB38\uC5D0 \uAC00\uAE4C\uC774 \uB2E4\uAC00\uAC00\uC138\uC694.");
  }
  if (input.action === "promotion" && NPCS.some((n) => n.service === "quest" && n.zone === p.zone && distance(p, n) < 180)) {
    const tier = p.promotionTier || 0, trial = PROMOTION_TRIALS[tier];
    if (!trial) notice(p, "\uCD5C\uC885 \uC804\uC9C1\uC744 \uC774\uBBF8 \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4.");
    else if (p.level < trial.level) notice(p, `\uB808\uBCA8 ${trial.level}\uBD80\uD130 \uC804\uC9C1 \uC2DC\uD5D8\uC744 \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`);
    else if (!p.promotionQuest) {
      p.promotionQuest = { tier: tier + 1, kills: 0, bosses: 0 };
      notice(p, trial.name + " \uC804\uC9C1 \uC2DC\uD5D8\uC744 \uC2DC\uC791\uD588\uC2B5\uB2C8\uB2E4.");
    } else if (p.promotionQuest.kills >= trial.count && p.promotionQuest.bosses >= trial.bossCount) {
      p.promotionTier = tier + 1;
      delete p.promotionQuest;
      const st = stats(p);
      p.hp = st.hp;
      p.mp = st.mp;
      notice(p, PROMOTION_NAMES[p.classId][tier] + " \uC804\uC9C1 \uC644\uB8CC! \uC0C8 \uC2A4\uD0AC\uACFC \uC219\uB828 \uD3EC\uC778\uD2B8 2\uAC1C\uB97C \uC5BB\uC5C8\uC2B5\uB2C8\uB2E4.");
      emit(w, p, now, "level", p.level, "#ffe8a3", { source: p.id });
    } else notice(p, "\uC804\uC9C1 \uC2DC\uD5D8\uC744 \uB9C8\uCE5C \uB4A4 \uC138\uB77C\uC5D0\uAC8C \uB3CC\uC544\uC624\uC138\uC694.");
  }
  if (input.action === "quest") {
    const id = Number(input.value), q = Number.isInteger(id) ? QUESTS[id] : void 0;
    if (!q || p.done.includes(id)) return;
    if (!canAcceptQuest(p, q)) {
      notice(p, p.level < (q.minLevel || 1) ? `\uB808\uBCA8 ${q.minLevel}\uBD80\uD130 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.` : "\uBA3C\uC800 \uC9C4\uD589 \uC911\uC778 \uC784\uBB34 \uB610\uB294 \uC774\uC804 \uBA54\uC778 \uC774\uC57C\uAE30\uB97C \uC644\uB8CC\uD558\uC138\uC694.");
      return;
    }
    if (p.quests[id] === void 0) {
      p.quests[id] = 0;
      notice(p, `${q.name} \uC218\uB77D \xB7 ${q.description}`);
    } else if (p.quests[id] >= q.count) {
      if (q.id === 4 && p.inventory.length >= 60) {
        notice(p, "\uBCF4\uC0C1 \uBB34\uAE30\uB97C \uBC1B\uC73C\uB824\uBA74 \uAC00\uBC29 \uD55C \uCE78\uC744 \uBE44\uC6CC \uC8FC\uC138\uC694.");
        return;
      }
      p.done.push(id);
      delete p.quests[id];
      p.gold += q.gold;
      if (addXp(p, q.xp)) emit(w, p, now, "level", p.level, "#ffe8a3", { source: p.id });
      if (q.id === 4) p.inventory.push(14);
      p.lastQuestReward = { id: q.id, gold: q.gold, xp: q.xp, time: now };
      emit(w, p, now, "loot", q.gold, "#ffe0a2", { source: p.id, effect: "quest-reward" });
      notice(p, `\uD018\uC2A4\uD2B8 \uC644\uB8CC! ${q.gold} \uACE8\uB4DC \xB7 ${q.xp} \uACBD\uD5D8\uCE58 \uD68D\uB4DD`);
    } else notice(p, `\uC544\uC9C1 \uBAA9\uD45C\uB97C \uB2EC\uC131\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. ${p.quests[id]} / ${q.count}`);
  }
  if (input.action === "buyPet" && NPCS.some((n) => (n.service === "pets" || n.service === "shop") && n.zone === p.zone && distance(p, n) < 180)) {
    const pet = PETS[Number(input.value)];
    if (pet && Number.isInteger(input.value)) {
      p.pets ??= [];
      if (p.pets.includes(pet.id)) notice(p, "\uC774\uBBF8 \uD568\uAED8\uD558\uB294 \uD3AB\uC785\uB2C8\uB2E4.");
      else if (p.gold < pet.price) notice(p, "\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.");
      else {
        p.gold -= pet.price;
        p.pets.push(pet.id);
        p.petId = pet.id;
        p.petAutoLoot = true;
        notice(p, pet.name + "\uC774 \uBAA8\uD5D8\uC5D0 \uD568\uAED8\uD569\uB2C8\uB2E4. \uAC00\uAE4C\uC6B4 \uC804\uB9AC\uD488\uC744 \uC790\uB3D9\uC73C\uB85C \uC90D\uC2B5\uB2C8\uB2E4.");
      }
    }
  }
  if (input.action === "equipPet") {
    const id = Number(input.value);
    if (id === -1) {
      p.petId = null;
      notice(p, "\uD3AB\uC744 \uC26C\uAC8C \uD588\uC2B5\uB2C8\uB2E4.");
    } else if (Number.isInteger(id) && p.pets?.includes(id)) {
      p.petId = id;
      notice(p, PETS[id].name + "\uC744 \uBD88\uB7EC\uB0C8\uC2B5\uB2C8\uB2E4.");
    }
  }
  if (input.action === "petAutoLoot") {
    p.petAutoLoot = input.value === 1;
    notice(p, p.petAutoLoot ? "\uD3AB \uC790\uB3D9 \uC90D\uAE30 \uCF1C\uC9D0" : "\uD3AB \uC790\uB3D9 \uC90D\uAE30 \uAEBC\uC9D0");
  }
  if (input.action === "buy" && NPCS.some((n) => n.service === "shop" && n.zone === p.zone && distance(p, n) < 180)) {
    const value = Number(input.value);
    if (value === -1 || value === -2) {
      const price = 18;
      if (p.gold >= price) {
        p.gold -= price;
        if (value === -1) p.potions += 3;
        else p.manaPotions += 3;
        notice(p, "\uBB3C\uC57D 3\uAC1C\uB97C \uAD6C\uC785\uD588\uC2B5\uB2C8\uB2E4.");
      } else notice(p, "\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.");
    } else {
      const item = ITEMS[value];
      if (item && !item.gmOnly && Number.isInteger(value) && p.level >= (item.minLevel || 1) && p.inventory.length < 60 && p.gold >= item.price) {
        p.gold -= item.price;
        p.inventory.push(value);
        notice(p, item.name + " \uAD6C\uC785");
      } else notice(p, item && p.level < (item.minLevel || 1) ? `\uB808\uBCA8 ${item.minLevel}\uBD80\uD130 \uAD6C\uC785\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.` : "\uACE8\uB4DC \uB610\uB294 \uAC00\uBC29 \uACF5\uAC04\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.");
    }
  }
  if (input.action === "heal" && NPCS.some((n) => n.service === "heal" && n.zone === p.zone && distance(p, n) < 180)) {
    const s = stats(p);
    p.hp = s.hp;
    p.mp = s.mp;
    notice(p, "\uC5D8\uB9B0\uC758 \uBE5B\uC73C\uB85C \uC0DD\uBA85\uB825\uACFC \uB9C8\uB098\uB97C \uD68C\uBCF5\uD588\uC2B5\uB2C8\uB2E4.");
    emit(w, p, now, "heal", s.hp, "#a0f4ae", { source: p.id });
  }
  if (input.action === "equip") {
    const item = ITEMS[Number(input.value)];
    if (item && p.inventory.includes(item.id) && p.level >= (item.minLevel || 1) && (item.classId === void 0 || item.classId === p.classId)) {
      p.equipment[item.slot] = item.id;
      p.hp = Math.min(p.hp, stats(p).hp);
      notice(p, item.name + " \uC7A5\uCC29");
    } else if (item) notice(p, "\uC7A5\uCC29 \uB808\uBCA8 \uB610\uB294 \uC9C1\uC5C5 \uC870\uAC74\uC744 \uD655\uC778\uD558\uC138\uC694.");
  }
  if (input.action === "sell") {
    const index = Number(input.value);
    if (NPCS.some((n) => n.service === "shop" && n.zone === p.zone && distance(p, n) < 180) && Number.isInteger(index) && index >= 0 && index < p.inventory.length) {
      const id = p.inventory[index];
      if (ITEMS[id].gmOnly) notice(p, "GM \uC804\uC6A9 \uC7A5\uBE44\uB294 \uD310\uB9E4\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      else if (Object.values(p.equipment).includes(id)) notice(p, "\uC7A5\uCC29 \uC911\uC778 \uC544\uC774\uD15C\uC740 \uD310\uB9E4\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      else {
        p.inventory.splice(index, 1);
        p.gold += Math.floor(ITEMS[id].price * 0.4);
        notice(p, "\uC544\uC774\uD15C\uC744 \uD310\uB9E4\uD588\uC2B5\uB2C8\uB2E4.");
      }
    }
  }
  if (input.chat && now - (w.chat.filter((c) => c.id.startsWith(p.id)).at(-1)?.time || 0) > 900) {
    const text = String(input.chat).replace(/[<>\x00-\x1f]/g, "").trim().slice(0, 120);
    if (text) w.chat.push({ id: p.id + ":" + crypto.randomUUID(), name: p.name, text, time: now, zone: p.zone, playerId: p.id });
  }
}
function snapshot(w, p, now) {
  return { shopSettings: cashSettings(w), donations: (w.donations || []).filter((d) => d.playerId === p.id).slice(-20), trade: tradeFor(w, p.id), raid: w.raids?.find((b) => b.zone === p.zone), player: p, players: Object.values(w.players).filter((a) => a.zone === p.zone && now - a.seen < 1e4 && a.id !== p.id), monsters: w.monsters.filter((m) => m.zone === p.zone), loot: w.loot.filter((l) => l.zone === p.zone), events: w.events.filter((e) => e.zone === p.zone), chat: w.chat.slice(-30), now, online: Object.values(w.players).filter((a) => now - a.seen < 1e4).length, casts: (w.casts || []).filter((c) => c.zone === p.zone) };
}
function migrateWorld(w, now) {
  if (w.contentVersion === 5) return;
  const template = createWorld(now), ids = new Set(w.monsters.map((m) => m.id));
  for (const m of template.monsters) if (!ids.has(m.id)) w.monsters.push(m);
  for (const z of ZONES) {
    if (z.safe || z.raid || z.id === 0) continue;
    const type = z.biome === 1 ? 11 : z.biome === 2 ? 12 : 10;
    for (let i = 0; i < 3; i++) {
      const id = `v13-${z.id}-${i}`;
      if (ids.has(id)) continue;
      const x = 600 + i * 220, y = 740;
      w.monsters.push({ id, type, zone: z.id, x, y, homeX: x, homeY: y, hp: Math.round(MONSTERS[type].hp * zoneScale(z.id)), maxHp: Math.round(MONSTERS[type].hp * zoneScale(z.id)), deadUntil: 0, lastHit: 0, lastAtk: 0 });
    }
    if (z.id === 2 && !w.monsters.some((m) => m.zone === 2 && m.type === 2)) {
      const x = 650, y = 660;
      w.monsters.push({ id: "v13-forest-mushroom", type: 2, zone: 2, x, y, homeX: x, homeY: y, hp: 85, maxHp: 85, deadUntil: 0, lastHit: 0, lastAtk: 0 });
    }
  }
  for (const z of ZONES) {
    if (z.safe || z.raid || z.id === 0) continue;
    for (const type of z.types.filter((t) => t >= 13)) {
      const id = `v14-${z.id}-${type}`;
      if (w.monsters.some((m) => m.id === id)) continue;
      const x = 550 + (type - 13) % 3 * 270, y = 510 + Math.floor((type - 13) / 3) * 190;
      const hp = Math.round(MONSTERS[type].hp * zoneScale(z.id));
      w.monsters.push({ id, type, zone: z.id, x, y, homeX: x, homeY: y, hp, maxHp: hp, deadUntil: 0, lastHit: 0, lastAtk: 0 });
    }
  }
  w.contentVersion = 5;
}

// server/auth-crypto.ts
async function digest(token) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// server/google-auth.ts
import { env as env2 } from "cloudflare:workers";

// shared/accounts.ts
function accountFor(w, id) {
  w.accounts ??= {};
  return w.accounts[id] ??= w.players[id] ? { characters: [id], slots: 4, active: id } : { characters: [], slots: 4, active: null };
}
function roster(w, id) {
  const a = accountFor(w, id);
  return { characters: a.characters.map((k) => w.players[k]).filter(Boolean), slots: a.slots, active: a.active, slotPrice: 5e3 * (a.slots - 3) };
}
function ownedPlayer(w, accountId, characterId) {
  const a = accountFor(w, accountId), id = characterId || a.active;
  return id && a.characters.includes(id) ? w.players[id] : void 0;
}
function changeAccount(w, id, body, now) {
  const a = accountFor(w, id);
  if (body.action === "create") {
    const name = String(body.name || "").replace(/[<>\x00-\x1f]/g, "").trim(), cls = Number(body.classId);
    if (name.length < 2 || name.length > 14 || !Number.isInteger(cls) || cls < 0 || cls > 2) throw new Error("\uC774\uB984\uC740 2~14\uAE00\uC790\uB85C \uC785\uB825\uD558\uC138\uC694.");
    if (a.characters.length >= a.slots) throw new Error("\uBE48 \uC2AC\uB86F\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const key = crypto.randomUUID();
    w.players[key] = newPlayer(key, name, cls, now);
    a.characters.push(key);
    a.active = key;
  } else if (body.action === "select") {
    if (!a.characters.includes(body.characterId || "")) throw new Error("\uC218\uD638\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    a.active = body.characterId;
  } else if (body.action === "delete") {
    if (!a.characters.includes(body.characterId || "")) throw new Error("\uC218\uD638\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    delete w.players[body.characterId];
    a.characters = a.characters.filter((k) => k !== body.characterId);
    if (a.active === body.characterId) a.active = a.characters[0] || null;
  } else if (body.action === "buySlot") {
    const p = ownedPlayer(w, id, body.characterId);
    const price = 5e3 * (a.slots - 3);
    if (a.slots >= 8) throw new Error("\uCD5C\uB300 8\uC2AC\uB86F\uAE4C\uC9C0 \uD655\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
    if (!p || p.gold < price) throw new Error(`\uCD94\uAC00 \uC2AC\uB86F\uC740 ${price.toLocaleString()} \uACE8\uB4DC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.`);
    p.gold -= price;
    a.slots++;
  } else throw new Error("\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.");
  return roster(w, id);
}

// server/store.ts
import { env } from "cloudflare:workers";

// server/google-auth.ts
function cookie(request, name) {
  return request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="))?.slice(name.length + 1) || null;
}
var DB = () => {
  if (!env2.DB) throw new Error("Auth storage unavailable");
  return env2.DB;
};
var schema;
function ensureAuthStorage() {
  return schema ??= (async () => {
    await DB().prepare("CREATE TABLE IF NOT EXISTS login_states (hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, verifier TEXT NOT NULL, guest_id TEXT, expires INTEGER NOT NULL)").run();
    await DB().prepare("CREATE TABLE IF NOT EXISTS login_sessions (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, expires INTEGER NOT NULL)").run();
  })().catch((e) => {
    schema = void 0;
    throw e;
  });
}
async function readLoginSession(token) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await ensureAuthStorage();
  const record = await DB().prepare("SELECT account_id,name,email,expires FROM login_sessions WHERE hash=? AND expires>?").bind(await digest(token), Date.now()).first();
  return record || null;
}

// server/auth.ts
async function guestIdentity(request) {
  const session = cookie(request, "__Host-aetheria_session");
  if (session) {
    const record = await readLoginSession(session);
    return record ? { token: session, id: record.account_id, provider: "google", profile: { name: record.name, email: record.email } } : null;
  }
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)aetheria_guest=([a-f0-9-]{36})/)?.[1];
  return token ? { token, id: await digest(token), provider: "guest" } : null;
}

// external/worker.ts
var reply = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });
var AetheriaRealm = class {
  constructor(state, env3) {
    this.state = state;
    this.sessions = /* @__PURE__ */ new Map();
    this.timer = null;
    this.saved = 0;
    this.broadcastAt = 0;
    this.gmToken = env3.GM_TOKEN || "";
    state.storage.sql.exec("CREATE TABLE IF NOT EXISTS realm (id INTEGER PRIMARY KEY, data TEXT NOT NULL)");
    const rows = [...state.storage.sql.exec("SELECT data FROM realm WHERE id=1")];
    this.world = rows.length ? JSON.parse(rows[0].data) : createWorld(Date.now());
    migrateWorld(this.world, Date.now());
    this.world.tick = Date.now();
    if (!rows.length && env3.DB) state.blockConcurrencyWhile(async () => {
      const old = await env3.DB.prepare("SELECT data FROM realms WHERE id=?").bind("aetheria").first();
      if (old) {
        this.world = JSON.parse(old.data);
        migrateWorld(this.world, Date.now());
        this.world.tick = Date.now();
        this.save();
      }
    });
    for (const ws of state.getWebSockets()) {
      const attachment = ws.deserializeAttachment();
      if (this.world.players[attachment.id]) this.sessions.set(ws, { id: attachment.id, last: 0 });
    }
    if (this.sessions.size) this.start();
  }
  save() {
    this.state.storage.sql.exec("INSERT INTO realm (id,data) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data", JSON.stringify(this.world));
    this.saved = Date.now();
  }
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const now = Date.now();
      tickWorld(this.world, now);
      if (now - this.broadcastAt >= 100) {
        this.broadcast();
        this.broadcastAt = now;
      }
      if (now - this.saved >= 5e3) this.save();
      if (!this.sessions.size) {
        clearInterval(this.timer);
        this.timer = null;
        this.save();
      }
    }, 50);
  }
  broadcast() {
    for (const [ws, s] of this.sessions) {
      const p = this.world.players[s.id];
      if (!p) {
        ws.close(1e3, "Character removed");
        this.sessions.delete(ws);
        continue;
      }
      try {
        ws.send(JSON.stringify(snapshot(this.world, p, Date.now())));
      } catch {
        this.sessions.delete(ws);
      }
    }
  }
  chat(id, text) {
    const p = this.world.players[id], now = Date.now();
    if (!p || typeof text !== "string") return;
    const value = text.replace(/[<>\x00-\x1f]/g, "").trim().slice(0, 120);
    if (!value || now - (this.world.chat.filter((c) => c.id.startsWith(id + ":")).at(-1)?.time || 0) < 900) return;
    this.world.chat.push({ id: id + ":" + crypto.randomUUID(), name: p.name, text: value, time: now, zone: p.zone, playerId: p.id });
    this.world.chat = this.world.chat.slice(-60);
    this.save();
    this.broadcast();
  }
  async fetch(request) {
    const url = new URL(request.url), origin = request.headers.get("Origin");
    if (origin && new URL(origin).host !== url.host) return reply({ error: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4." }, 403);
    try {
      if (url.pathname === "/api/auth/session") return reply({ googleEnabled: false, provider: "guest", profile: null });
      if (url.pathname === "/api/auth/google") return Response.redirect(new URL("/?login=setup", request.url), 302);
      if (url.pathname.startsWith("/api/gm/")) return await this.gmRequest(request, url);
      let auth = await guestIdentity(request);
      const token = auth?.token || crypto.randomUUID();
      auth ??= { token, id: await digest(token) };
      const headers = { "Set-Cookie": `aetheria_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol === "https:" ? "; Secure" : ""}` };
      const account = accountFor(this.world, auth.id);
      if (url.pathname === "/api/account") {
        if (request.method === "GET") return reply(roster(this.world, auth.id), 200, headers);
        if (request.method !== "POST") return reply({ error: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4." }, 405);
        const body = await this.body(request);
        if (body.action === "delete") {
          const p2 = ownedPlayer(this.world, auth.id, body.characterId);
          if (!p2 || body.confirm !== p2.name) return reply({ error: "\uC0AD\uC81C\uD560 \uCE90\uB9AD\uD130\uC758 \uC774\uB984\uC744 \uC815\uD655\uD788 \uC785\uB825\uD558\uC138\uC694." }, 400);
          for (const [ws, s] of this.sessions) if (s.id === p2.id) {
            ws.close(1e3, "Character removed");
            this.sessions.delete(ws);
          }
        }
        const result = changeAccount(this.world, auth.id, body, Date.now());
        this.save();
        return reply(result, 200, headers);
      }
      const id = url.searchParams.get("characterId") || account.active;
      let p = ownedPlayer(this.world, auth.id, id);
      if (p && (p.gmBanned || (p.gmBlockedUntil || 0) > Date.now())) return reply({ error: p.gmBanned ? "\uAD00\uB9AC\uC790\uAC00 \uC774 \uCE90\uB9AD\uD130\uC758 \uC811\uC18D\uC744 \uCC28\uB2E8\uD588\uC2B5\uB2C8\uB2E4." : "\uAD00\uB9AC\uC790\uAC00 \uC811\uC18D\uC744 \uC885\uB8CC\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC811\uC18D\uD558\uC138\uC694." }, 403);
      if (url.pathname === "/api/socket") {
        if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket required", { status: 426 });
        if (!p) return reply({ needsCharacter: true }, 401);
        const [client, server] = Object.values(new WebSocketPair());
        this.state.acceptWebSocket(server);
        server.serializeAttachment({ id: p.id });
        this.sessions.set(server, { id: p.id, last: 0 });
        p.seen = Date.now();
        this.start();
        return new Response(null, { status: 101, webSocket: client });
      }
      if (url.pathname === "/api/chat") {
        if (!p) return reply({ needsCharacter: true }, 401);
        const body = await this.body(request);
        this.chat(p.id, body.text);
        return reply({ ok: true });
      }
      if (url.pathname === "/api/game") {
        if (request.method === "GET") return reply(p ? snapshot(this.world, p, Date.now()) : { needsCharacter: true });
        const body = await this.body(request);
        if (body.join) {
          changeAccount(this.world, auth.id, { action: "create", name: body.name, classId: body.classId }, Date.now());
          p = ownedPlayer(this.world, auth.id);
          this.save();
          return reply(snapshot(this.world, p, Date.now()), 200, headers);
        }
        if (!p) return reply({ needsCharacter: true }, 401);
        const input = this.input(body), xp = p.xp, level = p.level;
        tickWorld(this.world, Date.now());
        applyInput(this.world, p, input, Date.now());
        if (input.action || p.xp !== xp || p.level !== level) this.save();
        return reply(snapshot(this.world, p, Date.now()));
      }
      return new Response("Not found", { status: 404 });
    } catch (e) {
      return reply({ error: e instanceof Error ? e.message : "\uC11C\uBC84 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }, 400);
    }
  }
  async gmRequest(request, url) {
    if (!await gmAuthorized(request.headers.get("Authorization"), this.gmToken)) return reply({ error: "\uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
    const now = Date.now();
    if (request.method === "GET" && url.pathname === "/api/gm/players") {
      const query = (url.searchParams.get("q") || "").toLocaleLowerCase();
      const players = Object.values(this.world.players).filter((p) => !query || p.name.toLocaleLowerCase().includes(query) || p.id.includes(query)).sort((a, b) => b.seen - a.seen).map((p) => gmSummary(p, now));
      return reply({ players, now, online: players.filter((p) => p.online).length, items: ITEMS, gmSkins: GM_SKINS, gmTitles: GM_TITLES, classes: CLASSES.map((c) => ({ id: c.id, name: c.name })), zones: ZONES.map((z) => ({ id: z.id, name: z.name })) });
    }
    if (request.method === "GET" && url.pathname === "/api/gm/player") {
      const p = this.world.players[url.searchParams.get("id") || ""];
      return p ? reply(gmDetail(p, now)) : reply({ error: "\uC218\uD638\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    }
    if (request.method === "GET" && url.pathname === "/api/gm/donations") return reply({ requests: (this.world.donations || []).slice().reverse(), settings: cashSettings(this.world) });
    if (request.method === "POST" && url.pathname === "/api/gm/settings") {
      const settings = configureCash(this.world, await this.body(request));
      this.save();
      this.broadcast();
      return reply({ ok: true, settings });
    }
    if (request.method === "POST" && url.pathname === "/api/gm/donation") {
      const donation = approveDonation(this.world, await this.body(request), now);
      this.save();
      this.broadcast();
      return reply({ ok: true, donation });
    }
    if (request.method === "GET" && url.pathname === "/api/gm/audit") return reply({ entries: (this.world.gmAudit || []).slice().reverse() });
    if (request.method === "GET" && url.pathname === "/api/gm/backup") return reply({ schema: "aetheria-world", exportedAt: now, world: this.world });
    if (request.method === "POST" && url.pathname === "/api/gm/action") {
      try {
        const body = await this.body(request), player = gmMutate(this.world, body, now);
        this.save();
        if (body.action === "kick" || body.action === "ban") {
          for (const [ws, s] of this.sessions) if (s.id === player.id) {
            ws.close(4003, "GM restriction");
            this.sessions.delete(ws);
          }
        }
        this.broadcast();
        return reply({ ok: true, player });
      } catch (e) {
        const message = e instanceof Error ? e.message : "\uC218\uC815 \uC2E4\uD328";
        return reply({ error: message === "REVISION_CONFLICT" ? "\uB2E4\uB978 \uAD00\uB9AC\uC790 \uC791\uC5C5\uC774 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0C8\uB85C\uACE0\uCE68 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694." : message }, message === "REVISION_CONFLICT" ? 409 : 400);
      }
    }
    return reply({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAD00\uB9AC \uACBD\uB85C\uC785\uB2C8\uB2E4." }, 404);
  }
  async body(request) {
    const text = await request.text();
    if (text.length > 4096) throw new Error("\uC694\uCCAD\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4.");
    return JSON.parse(text);
  }
  input(body) {
    if (!body || typeof body !== "object" || body.action !== void 0 && typeof body.action !== "string" || body.targetId !== void 0 && typeof body.targetId !== "string" || body.tradeId !== void 0 && typeof body.tradeId !== "string" || body.reference !== void 0 && (typeof body.reference !== "string" || body.reference.length > 160) || body.indices !== void 0 && (!Array.isArray(body.indices) || body.indices.length > 12 || body.indices.some((n) => !Number.isSafeInteger(n)))) throw new Error("\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.");
    if (!Number.isSafeInteger(body.seq) || body.seq < 0) throw new Error("\uC798\uBABB\uB41C \uC785\uB825\uC785\uB2C8\uB2E4.");
    for (const key of ["moveX", "moveY", "dx", "dy", "tx", "ty", "skill", "value", "slot", "gold", "revision"]) if (body[key] !== void 0 && !Number.isFinite(body[key])) throw new Error("\uC798\uBABB\uB41C \uC88C\uD45C\uC785\uB2C8\uB2E4.");
    return body;
  }
  webSocketMessage(ws, message) {
    const s = this.sessions.get(ws);
    if (!s) return;
    try {
      if (typeof message !== "string" || message.length > 4096) {
        ws.close(1009, "Message too large");
        return;
      }
      const body = JSON.parse(message);
      if (body.kind === "chat") {
        this.chat(s.id, body.text);
        return;
      }
      const now = Date.now();
      if (now - s.last < 65) {
        ws.send(JSON.stringify({ retry: true }));
        return;
      }
      s.last = now;
      const p = this.world.players[s.id];
      if (!p) return;
      if (p.gmBanned || (p.gmBlockedUntil || 0) > now) {
        ws.close(4003, "GM restriction");
        return;
      }
      const input = this.input(body), xp = p.xp, level = p.level;
      tickWorld(this.world, now);
      applyInput(this.world, p, input, now);
      if (input.action || p.xp !== xp || p.level !== level) this.save();
      ws.send(JSON.stringify(snapshot(this.world, p, now)));
    } catch {
      ws.send(JSON.stringify({ error: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4." }));
    }
  }
  webSocketClose(ws) {
    this.sessions.delete(ws);
    this.save();
  }
  webSocketError(ws) {
    this.sessions.delete(ws);
    this.save();
  }
};
var worker_default = { fetch(request, env3) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return env3.REALM.get(env3.REALM.idFromName("aetheria-world-v5")).fetch(request);
  return env3.ASSETS.fetch(request);
} };
export {
  AetheriaRealm,
  worker_default as default
};
