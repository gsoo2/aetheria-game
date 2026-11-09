// 칩튠 효과음 (WebAudio). 첫 입력 후에만 소리가 난다.
"use strict";
const SFX = (() => {
  let ac = null, master = null, muted = false, bgmTimer = null, bgmStep = 0, bgmName = null;
  try { muted = localStorage.getItem("dotEmpire.mute") === "1"; } catch (e) {}
  function ensure() {
    if (ac) return true;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.35; master.connect(ac.destination);
    } catch (e) { ac = null; }
    return !!ac;
  }
  function tone(freq, dur, type = "square", vol = 0.2, when = 0, slide = 0) {
    if (!ensure()) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.2, when = 0) {
    if (!ensure()) return;
    const t = ac.currentTime + when, n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf; g.gain.value = vol;
    s.connect(g); g.connect(master); s.start(t);
  }
  const N = (s) => 440 * Math.pow(2, (s - 69) / 12);
  const lib = {
    click: () => tone(880, 0.05, "square", 0.08),
    select: () => { tone(660, 0.06, "square", 0.1); tone(990, 0.08, "square", 0.08, 0.05); },
    text: () => tone(1200 + Math.random() * 200, 0.02, "square", 0.025),
    step: () => tone(180, 0.03, "triangle", 0.05),
    coin: () => { tone(988, 0.07, "square", 0.12); tone(1319, 0.2, "square", 0.12, 0.07); },
    paint: () => { tone(400, 0.25, "triangle", 0.15, 0, 3); },
    march: () => { for (let i = 0; i < 3; i++) tone(120, 0.06, "square", 0.12, i * 0.09); },
    clash: () => { noise(0.25, 0.3); tone(220, 0.15, "sawtooth", 0.12, 0, 0.4); },
    win: () => [72, 76, 79, 84].forEach((n, i) => tone(N(n), 0.12, "square", 0.12, i * 0.08)),
    lose: () => [67, 63, 60].forEach((n, i) => tone(N(n), 0.18, "triangle", 0.15, i * 0.12)),
    war: () => { tone(110, 0.5, "sawtooth", 0.15); tone(82, 0.6, "sawtooth", 0.12, 0.15); noise(0.4, 0.15, 0.1); },
    peace: () => [79, 84, 88].forEach((n, i) => tone(N(n), 0.25, "sine", 0.15, i * 0.12)),
    swoosh: () => { noise(0.5, 0.18); tone(300, 0.6, "sine", 0.15, 0, 4); },
    fanfare: () => [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => tone(N(n), i === 7 ? 0.6 : 0.14, "square", 0.12, i * 0.13)),
    buy: () => { tone(1047, 0.06, "square", 0.1); tone(1568, 0.15, "square", 0.1, 0.06); },
    error: () => tone(160, 0.15, "square", 0.12),
    turn: () => { tone(523, 0.08, "triangle", 0.12); tone(784, 0.12, "triangle", 0.12, 0.08); },
  };
  // 아주 짧은 배경 루프 (성 / 지도)
  const SONGS = {
    castle: { tempo: 0.22, mel: [64, 0, 67, 69, 67, 0, 64, 62, 60, 0, 62, 64, 62, 0, 0, 0, 64, 0, 67, 69, 71, 0, 72, 71, 69, 0, 67, 64, 67, 0, 0, 0], bass: [48, 48, 55, 55, 53, 53, 50, 50] },
    map: { tempo: 0.18, mel: [57, 0, 60, 0, 64, 0, 62, 60, 59, 0, 55, 0, 57, 0, 0, 0, 57, 0, 60, 0, 64, 0, 65, 64, 62, 0, 59, 0, 57, 0, 0, 0], bass: [45, 45, 43, 43, 41, 41, 40, 40] },
  };
  function bgm(name) {
    if (bgmName === name) return;
    bgmName = name; bgmStep = 0;
    if (bgmTimer) clearInterval(bgmTimer);
    bgmTimer = null;
    if (!name) return;
    const s = SONGS[name];
    bgmTimer = setInterval(() => {
      if (!ac || muted || document.hidden) { bgmStep++; return; }
      const m = s.mel[bgmStep % s.mel.length];
      if (m) tone(N(m), s.tempo * 0.9, "triangle", 0.05);
      if (bgmStep % 4 === 0) tone(N(s.bass[(bgmStep / 4) % s.bass.length]), s.tempo * 3.5, "square", 0.025);
      bgmStep++;
    }, s.tempo * 1000);
  }
  return {
    play(name) { if (muted) return; try { lib[name] && lib[name](); } catch (e) {} },
    unlock() { ensure(); if (ac && ac.state === "suspended") ac.resume(); },
    bgm,
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem("dotEmpire.mute", muted ? "1" : "0"); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.35;
      return muted;
    },
  };
})();
