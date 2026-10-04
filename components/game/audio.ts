let ctx: AudioContext | null = null;
const cache = new Map<string, Promise<AudioBuffer | null>>();
let step = 0, voices = 0, lastStep = 0;
function buffer(key: string) { if (!cache.has(key))
    cache.set(key, fetch('/sfx/' + key + '.mp3').then(r => { if (!r.ok)
        throw new Error('sound'); return r.arrayBuffer(); }).then(data => ctx!.decodeAudioData(data)).catch(() => null)); return cache.get(key)!; }
export function unlockSounds() { try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended')
        void ctx.resume().catch(() => { });
    for (const key of ['sword', 'arrow', 'magic', 'ui', 'hit', 'loot', 'step-0-1', 'step-1-1', 'step-2-1'])
        void buffer(key);
}
catch { } }
export function sound(kind: string, volume: number, detail?: {
    classId?: number;
    skill?: number;
    effect?: string;
}) { if (volume <= 0)
    return; unlockSounds(); if (!ctx)
    return; let key = kind; const foot = kind.startsWith('step-'); if (foot) {
    if (Date.now() - lastStep < 170)
        return;
    lastStep = Date.now();
    key = kind + '-' + (step++ % 4 + 1);
}
else if (kind === 'spell')
    key = detail?.effect === 'boss-slam' ? 'boss' : detail?.classId === 0 ? (detail.skill === 0 ? 'sword' : 'slash') : detail?.classId === 1 ? 'arrow' : detail?.skill === 2 ? 'ice' : detail?.skill === 1 ? 'fire' : 'magic';
else if (kind === 'death')
    key = detail?.effect === 'raid-death' ? 'boss' : 'hit';
else if (kind === 'dodge')
    key = 'magic';
else if (!['hit', 'level', 'heal', 'loot', 'ui', 'warning', 'chat'].includes(kind))
    return; const requested = Date.now(); void buffer(key).then(b => { if (!b || !ctx || voices >= 12 || Date.now() - requested > 500 || ctx.state !== 'running')
    return; const src = ctx.createBufferSource(), gain = ctx.createGain(); src.buffer = b; gain.gain.value = Math.min(1, Math.max(0, volume)) * (foot ? .20 : kind === 'ui' ? .35 : .65); src.connect(gain); gain.connect(ctx.destination); voices++; src.onended = () => { voices--; src.disconnect(); gain.disconnect(); }; src.start(); }); }
