'use client';
import { tr } from '../../shared/i18n';
import Link from 'next/link';
import LanguagePicker, { useLanguage } from './LanguagePicker';
import ChatPanel from './ChatPanel';
import AccountLogin from './AccountLogin';
import { QuestTracker, QuestJournal, QuestReward } from './QuestJournal';
import { interactionAt } from '../../shared/interactions';
import WorkshopPanel from './WorkshopPanel';
import CashShop from './CashShop';
import { BubbleShop, RaidPanel, TradePanel } from './SocialPanel';
import { RAIDS } from '../../shared/social';
import CharacterLobby, { type Roster } from './CharacterLobby';
import { findPath } from '../../shared/navigation';
import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { Sword, Sparkles, Flame, Wind, Backpack, ScrollText, UserRound, Settings, Coins, Heart, ChevronRight, Volume2, Shield, ArrowUpRight, Map, Maximize, MessageSquare, Menu, Diamond, RefreshCw, BookOpen, Hammer, Zap, Crosshair, MoveUpRight, Snowflake, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Slider } from '../ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { SKILL_SPECS, DODGE } from '../../shared/skills';
import { skillPoints } from '../../shared/progression';
import { Progress } from '../ui/progress';
import { CLASSES, isBoss, ITEMS, MONSTERS, NPCS, PORTALS, QUESTS, WORLD, ZONES, portalsFor, loadoutFor, SKILL_LEVELS, skillUnlocked, skillAvailable } from '../../shared/content';
import { needXp, stats } from '../../server/engine';
import type { Input, Snapshot } from '../../shared/types';
import { drawGame, loadArt, type RenderState } from './render';
import { sound, unlockSounds } from './audio';
import { playVoice, unlockVoices, stopVoice } from './voice';
import { PETS } from '../../shared/pets';
import { setMusic, unlockMusic, stopMusic } from './music';
import WorldMap from './WorldMap';
import Promotion from './Promotion';
import { classNameFor, PROMOTION_TRIALS } from '../../shared/promotion';
import { LORE } from '../../shared/lore';
const icons = [Sword, Wind, Sparkles];
const classSkillIcons = [[Sword, Hammer, Wind, Zap], [Crosshair, MoveUpRight, ArrowUpRight, Wind], [Sparkles, Flame, Snowflake, Star]];
const SpriteContext = createContext<string[]>([]);
type GameReply = Snapshot & {
    needsCharacter?: boolean;
    error?: string;
};
type Panel = 'inventory' | 'character' | 'quests' | 'settings' | 'guide' | 'npc0' | 'npc1' | `npc${number}` | 'skills' | 'map' | 'bubbles' | 'raid' | 'trade' | 'player' | 'cash' | 'chat' | 'menu' | null;
function SkillArt({ classId, skill }: {
    classId: number;
    skill: number;
}) { return <span className="advanced-skill-art" style={{ backgroundPosition: `${classId * 50}% ${(skill % 2) * 100}%` }}/>; }
function Portrait({ index, className = '' }: {
    index: number;
    className?: string;
}) { const sprites = useContext(SpriteContext); return <span className={'sprite-portrait ' + className + (sprites[index] ? ' sprite-fitted' : '')} style={sprites[index] ? { backgroundImage: `url(${sprites[index]})` } : { backgroundPosition: `${(index % 4) / 3 * 100}% ${Math.floor(index / 4) / 3 * 100}%` }}/>; }
export default function Game() {
    useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null), render = useRef<RenderState>({ snapshot: null, keys: new Set(), camera: { x: 900, y: 700 }, local: { x: 900, y: 740, zone: -1 }, mouse: { x: 900, y: 500 }, clockOffset: 0, lastSnapshot: 0, debug: false, volume: .65 });
    const [petUrls, setPetUrls] = useState<string[]>([]), [spriteUrls, setSpriteUrls] = useState<string[]>([]), [targetId, setTargetId] = useState<string | null>(null);
    const [snap, setSnap] = useState<Snapshot | null>(null), [boot, setBoot] = useState(true), [name, setName] = useState(''), [classId, setClassId] = useState(0), [joining, setJoining] = useState(false), [error, setError] = useState(''), [connected, setConnected] = useState(true), [artReady, setArtReady] = useState(false), [panel, setPanel] = useState<Panel>(null), [chat, setChat] = useState(''), [notice, setNotice] = useState(''), [now, setNow] = useState(() => Date.now()), [volume, setVolume] = useState(.65), [sfx, setSfx] = useState(.85), [voiceVolume, setVoiceVolume] = useState(.75), [music, setMusicVolume] = useState(.55), [hud, setHud] = useState({ x: 2, y: 3 }), [hudEdit, setHudEdit] = useState(false), [bindSlot, setBindSlot] = useState(0);
    const [chatSending,setChatSending]=useState(false);
    const [chatViewport,setChatViewport]=useState<{height:number;top:number}|null>(null);
    useEffect(()=>{if(panel!=='chat')return;const viewport=window.visualViewport;const update=()=>setChatViewport({height:viewport?.height||window.innerHeight,top:viewport?.offsetTop||0});update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);};},[panel]);
    const [inspectId, setInspectId] = useState<string | null>(null);
    const [roster, setRoster] = useState<Roster | null>(null), [creating, setCreating] = useState(false);
    const activeCharacter = useRef<string | null>(null), autoQuest = useRef<{
        id: number;
        stage: 'travel' | 'walk' | 'queued';
        started: number;
    } | null>(null);
    const hudDrag = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const packetPosition = useRef<{
        x: number;
        y: number;
        zone: number;
    } | null>(null);
    const socket = useRef<WebSocket | null>(null), socketTried = useRef(0), retryPacket = useRef<Input | null>(null), inflightAction = useRef<Input | null>(null), sentAt = useRef(0);
    const pending = useRef<Input[]>([]), seq = useRef(0), busy = useRef(false), holding = useRef(false), panelRef = useRef<Panel>(null), seenEvents = useRef(new Set<string>()), chatEnd = useRef<HTMLDivElement>(null), volumeRef = useRef(.55), voiceRef = useRef(.75);
    const accept = useCallback((data: Snapshot) => {
        if (activeCharacter.current !== data.player.id || data.now < (render.current.snapshot?.now || 0))
            return;
        const priorChat = render.current.snapshot?.chat.at(-1)?.id;
        const previous = render.current.snapshot?.player;
        const position = packetPosition.current;
        if (position && previous && data.player.zone === position.zone && data.player.lastSeq >= (retryPacket.current?.seq || Infinity)) {
            render.current.correction = { x: data.player.x - position.x, y: data.player.y - position.y };
            packetPosition.current = null;
        }
        if (previous && (previous.zone !== data.player.zone || (previous.hp <= 0 && data.player.hp > 0) || (data.player.dodgeUntil || 0) > (previous.dodgeUntil || 0) || (data.player.attackAt !== previous.attackAt && SKILL_SPECS[data.player.classId][data.player.attackSkill]?.dash))) {
            render.current.local = { x: data.player.x, y: data.player.y, zone: data.player.zone };
            render.current.pendingMove = { x: 0, y: 0 };
            render.current.correction = { x: 0, y: 0 };
            if (previous.zone !== data.player.zone) {
                render.current.camera = { x: data.player.x, y: data.player.y };
                render.current.positions?.clear();
                render.current.buffers?.clear();
                render.current.bufferStamp = undefined;
                render.current.timeline = undefined;
            }
        }
        const offset = data.now - Date.now();
        render.current.clockOffset = render.current.lastSnapshot ? render.current.clockOffset * .9 + offset * .1 : offset;
        render.current.lastSnapshot = Date.now();
        render.current.snapshot = data;
        seq.current = Math.max(seq.current, data.player.lastSeq);
        setSnap(data);
        const latestChat = data.chat.at(-1);
        if (previous && latestChat && latestChat.id !== priorChat && data.now - latestChat.time < 1800)
            sound('chat', volumeRef.current * .5);
        setConnected(true);
        setError('');
        if (data.player.notice)
            setNotice(data.player.notice);
        for (const e of data.events) {
            if (!seenEvents.current.has(e.id) && Date.now() + render.current.clockOffset - e.time < 1800) {
                seenEvents.current.add(e.id);
                sound(e.kind, volumeRef.current, e);
                if (e.kind === 'spell' && e.source === data.player.id)
                    playVoice(data.player.classId, 'attack', voiceRef.current, e.skill || 0, Math.floor(e.time) % 3);
                if (e.kind === 'hit' && e.effect === 'player-hurt' && e.source === data.player.id)
                    playVoice(data.player.classId, 'hurt', voiceRef.current, 0, Math.floor(e.time) % 3);
                if ((e.kind === 'heal' || e.kind === 'level' || e.kind === 'dodge') && e.source === data.player.id)
                    playVoice(data.player.classId, e.kind === 'heal' ? 'heal' : e.kind === 'level' ? 'level' : 'dodge', voiceRef.current);
            }
        }
        if (seenEvents.current.size > 800)
            seenEvents.current = new Set(data.events.map(e => e.id));
    }, []);
    const queue = useCallback((input: Input) => {
        if (pending.current.length < 15)
            pending.current.push(input);
        sound('ui', volumeRef.current * .3);
    }, []);
    useEffect(() => { render.current.onEvent = kind => sound(kind, volumeRef.current); }, []);
    const open = useCallback((p: Panel) => { unlockMusic(); setPanel(p); panelRef.current = p; render.current.keys.clear(); holding.current = false; }, []);
    const interact = useCallback(() => {
        const s = render.current.snapshot;
        if (!s)
            return;
        const target = interactionAt(s.player.zone, render.current.local);
        if (target?.kind === 'npc')
            open(`npc${target.id}` as Panel);
        else if (target?.kind === 'portal') {
            const portal = portalsFor(s.player.zone)[target.id];
            if (portal.target === -1)
                open('map');
            else
                queue({ action: 'portal', value: target.id });
        }
        else
            setNotice('NPC나 차원문에 가까이 다가가 E 키를 누르세요.');
    }, [open, queue]);
    const attack = useCallback((slot: number) => {
        autoQuest.current = null;
        render.current.autoPath = [];
        unlockMusic();
        const p = render.current.snapshot?.player;
        if (!p)
            return;
        const skill = loadoutFor(p)[slot];
        if (skill >= 0)
            queue({ skill, tx: render.current.mouse.x, ty: render.current.mouse.y });
    }, [queue]);
    useEffect(() => {
        let cancelled = false;
        fetch('/api/account').then(r => {
            if (!r.ok)
                throw new Error('수호자를 불러오지 못했습니다.');
            return r.json() as Promise<Roster>;
        }).then(data => {
            if (!cancelled)
                setRoster(data);
        }).catch(e => {
            if (!cancelled)
                setError(e.message);
        }).finally(() => {
            if (!cancelled)
                setBoot(false);
        });
        return () => { cancelled = true; };
    }, []);
    useEffect(() => {
        let stop = false;
        let frame = 0;
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        let previous = performance.now();
        loadArt().then(art => {
            if (stop)
                return;
            setSpriteUrls(art.sprites.map(sprite => sprite.toDataURL()));
            setPetUrls(art.pets.map(frames => frames[0].toDataURL()));
            setArtReady(true);
            let view={width:0,height:0,dpr:1};
            const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(matchMedia('(pointer:coarse)').matches?1.5:2,devicePixelRatio);view={width:r.width,height:r.height,dpr};canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);};
            resize();
            const observer = new ResizeObserver(resize);
            observer.observe(canvas);
            const draw = (t: number) => {
                if (stop) {
                    observer.disconnect();
                    return;
                }
                const dt = Math.min(.05, (t - previous) / 1000);
                previous = t;
                const ctx = canvas.getContext('2d')!;
                ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
                drawGame(ctx, view.width, view.height, render.current, art, dt, Date.now());
                frame = requestAnimationFrame(draw);
            };
            frame = requestAnimationFrame(draw);
        }).catch(() => setError('게임 아트를 불러오지 못했습니다. 새로고침해 주세요.'));
        return () => { stop = true; cancelAnimationFrame(frame); };
    }, []);
    useEffect(() => { const timer = setInterval(() => setNow(Date.now() + render.current.clockOffset), 200); return () => clearInterval(timer); }, []);
    useEffect(() => {
        if (!snap?.player.id)
            return;
        let stopped = false, reconnect: ReturnType<typeof setTimeout> | undefined;
        const connect = () => {
            if (stopped)
                return;
            socketTried.current = Date.now();
            const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/socket?characterId=${encodeURIComponent(snap.player.id)}`);
            socket.current = ws;
            ws.onmessage = e => {
                try {
                    const data = JSON.parse(e.data) as GameReply & {
                        retry?: boolean;
                    };
                    if (data.retry || data.error) {
                        busy.current = false;
                        return;
                    }
                    if(data.needsCharacter){activeCharacter.current=null;render.current.snapshot=null;render.current.keys.clear();holding.current=false;pending.current=[];retryPacket.current=null;inflightAction.current=null;setSnap(null);setCreating(false);open(null);void fetch('/api/account').then(r=>r.json()).then(data=>setRoster(data as Roster)).catch(()=>{});}
                    else {
                        accept(data);
                        if (retryPacket.current && data.player.lastSeq >= retryPacket.current.seq!) {
                            if (inflightAction.current === pending.current[0])
                                pending.current.shift();
                            retryPacket.current = null;
                            inflightAction.current = null;
                        }
                    }
                    busy.current = false;
                }
                catch {
                    busy.current = false;
                }
            };
            ws.onclose = e => {
                if (e.code === 4001) {
                    location.assign('/?login=failed');
                    return;
                }
                if (e.code === 4003) {
                    activeCharacter.current = null;
                    render.current.snapshot = null;
                    render.current.keys.clear();
                    pending.current = [];
                    retryPacket.current = null;
                    holding.current = false;
                    busy.current = false;
                    setSnap(null);
                    setCreating(false);
                    setError('GM이 접속을 종료했습니다. 캐릭터 접속 상태를 확인하세요.');
                    void fetch('/api/account').then(r => r.json()).then(data => setRoster(data as Roster)).catch(() => { });
                    return;
                }
                if (socket.current === ws)
                    socket.current = null;
                busy.current = false;
                if (!stopped)
                    reconnect = setTimeout(connect, 2000);
            };
            ws.onerror = () => ws.close();
        };
        connect();
        return () => {
            stopped = true;
            if (reconnect)
                clearTimeout(reconnect);
            socket.current?.close();
            socket.current = null;
        };
    }, [snap?.player.id, accept, open]);
    useEffect(() => {
        const timer = setInterval(async () => {
            const state = render.current;
            if (!state.snapshot)
                return;
            if (busy.current) {
                if (Date.now() - sentAt.current > 12000) {
                    busy.current = false;
                    socket.current?.close();
                    setConnected(false);
                }
                else
                    return;
            }
            const active = document.activeElement;
            const canMove = !panelRef.current && !(active instanceof HTMLInputElement) && !(active instanceof HTMLTextAreaElement);
            const keys = state.keys;
            const action = pending.current[0] || null;
            const packet = retryPacket.current || { ...(action || {}), seq: ++seq.current, dx: canMove ? Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')) : 0, dy: canMove ? Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')) : 0 };
            if (!retryPacket.current && holding.current && !action?.action && action?.skill === undefined && !panelRef.current) {
                packet.skill = loadoutFor(state.snapshot.player)[0];
                packet.tx = state.mouse.x;
                packet.ty = state.mouse.y;
            }
            if (!retryPacket.current) {
                packet.moveX = state.pendingMove?.x || 0;
                packet.moveY = state.pendingMove?.y || 0;
                state.pendingMove = { x: 0, y: 0 };
                packetPosition.current = { ...state.local };
                retryPacket.current = packet;
                inflightAction.current = action;
            }
            busy.current = true;
            sentAt.current = Date.now();
            if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify(packet));
                return;
            }
            try {
                const r = await fetch('/api/game?characterId=' + encodeURIComponent(state.snapshot.player.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(packet), signal: AbortSignal.timeout(12000) });
                const data = await r.json() as GameReply;
                if (!r.ok)
                    throw new Error(data.error || '다시 연결 중');
                if (data.needsCharacter) {
                    setSnap(null);
                    state.snapshot = null;
                }
                else {
                    accept(data);
                    if (data.player.lastSeq >= packet.seq!) {
                        if (inflightAction.current === pending.current[0])
                            pending.current.shift();
                        retryPacket.current = null;
                        inflightAction.current = null;
                    }
                }
            }
            catch {
                setConnected(false);
            }
            finally {
                busy.current = false;
            }
        }, 100);
        return () => clearInterval(timer);
    }, [accept]);
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (e.repeat)
                    return;
                autoQuest.current = null;
                render.current.autoPath = [];
                open(panelRef.current ? null : 'settings');
                return;
            }
            const active = document.activeElement;
            if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
                return;
            const key = e.key.toLowerCase();
            if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key))
                e.preventDefault();
            if (panelRef.current) {
                if (key === 'escape' || (key === 'm' && panelRef.current === 'map') || (key === 'k' && panelRef.current === 'skills'))
                    open(null);
                return;
            }
            render.current.keys.add(key);
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape'].includes(key)) {
                autoQuest.current = null;
                render.current.autoPath = [];
            }
            if (e.repeat)
                return;
            unlockMusic();
            if (['1', '2', '3', '4'].includes(key))
                attack(Number(key) - 1);
            if (key === ' ')
                attack(0);
            if (key === 'e')
                interact();
            if (key === 'z' || key === 'f')
                queue({ action: 'loot' });
            if (key === 'q')
                queue({ action: 'potion' });
            if (key === 'r')
                queue({ action: 'mana' });
            if (key === 'i')
                open('inventory');
            if (key === 'c')
                open('character');
            if (key === 'j')
                open('quests');
            if (key === 'k')
                open('skills');
            if (key === 'm')
                open('map');
            if (key === 'shift') {
                e.preventDefault();
                queue({ action: 'dodge', tx: render.current.mouse.x, ty: render.current.mouse.y });
            }
            if (key === 'escape')
                open('settings');
            if (key === 'f1') {
                e.preventDefault();
                render.current.debug = !render.current.debug;
            }
        };
        const up = (e: KeyboardEvent) => render.current.keys.delete(e.key.toLowerCase());
        const blur = () => { render.current.keys.clear(); holding.current = false; };
        window.addEventListener('keydown', down, true);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        const release = () => { holding.current = false; };
        window.addEventListener('mouseup', release);
        return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); window.removeEventListener('mouseup', release); };
    }, [attack, interact, open, queue]);
    useEffect(() => {
        voiceRef.current = volume * voiceVolume;
        if (volume * voiceVolume === 0)
            stopVoice();
    }, [volume, voiceVolume]);
    useEffect(() => { volumeRef.current = volume * sfx; render.current.volume = volume * sfx; }, [volume, sfx]);
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('aetheria-hud') || 'null');
            if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))
                queueMicrotask(() => setHud({ x: Math.max(0, Math.min(70, saved.x)), y: Math.max(0, Math.min(85, saved.y)) }));
        }
        catch { }
        const unlock = () => { unlockMusic(); unlockVoices(); unlockSounds(); };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); stopMusic(); stopVoice(); };
    }, []);
    useEffect(() => {
        if (snap)
            setMusic(panel === 'npc1' ? 3 : ZONES[snap.player.zone].music, volume * music);
    }, [snap?.player.zone, !!snap, panel, volume, music]);
    useEffect(() => {
        if (!notice)
            return;
        const t = setTimeout(() => setNotice(''), 4500);
        return () => clearTimeout(t);
    }, [notice]);
    useEffect(() => {
        const log = chatEnd.current?.parentElement;
        if (log)
            log.scrollTop = log.scrollHeight;
    }, [snap?.chat.at(-1)?.id]);
    const selectCharacter = async (id: string) => {
        unlockMusic();
        setJoining(true);
        setError('');
        try {
            const r = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'select', characterId: id }) });
            const result = await r.json() as Roster & {
                error?: string;
            };
            if (!r.ok)
                throw new Error(result.error || '연결에 실패했습니다.');
            activeCharacter.current = id;
            seq.current = 0;
            retryPacket.current = null;
            pending.current = [];
            render.current.local.zone = -1;
            const game = await fetch('/api/game?characterId=' + encodeURIComponent(id));
            const data = await game.json() as GameReply;
            if (!game.ok || data.needsCharacter)
                throw new Error(data.error || '수호자를 불러오지 못했습니다.');
            accept(data);
            setCreating(false);
            sound('level', volumeRef.current);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : '연결에 실패했습니다.');
        }
        finally {
            setJoining(false);
        }
    };
    const changeRoster = async (body: Record<string, unknown>) => {
        setJoining(true);
        setError('');
        try {
            const r = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), data = await r.json() as Roster & {
                error?: string;
            };
            if (!r.ok)
                throw new Error(data.error || '저장에 실패했습니다.');
            setRoster(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
        }
        finally {
            setJoining(false);
        }
    };
    const join = async () => {
        if (!artReady || joining)
            return;
        setJoining(true);
        setError('');
        try {
            const r = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', name: name.trim(), classId }) }), data = await r.json() as Roster & {
                error?: string;
            };
            if (!r.ok)
                throw new Error(data.error);
            setRoster(data);
            setJoining(false);
            await selectCharacter(data.active!);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : '연결에 실패했습니다.');
            setJoining(false);
        }
    };
    const returnToLobby = async () => {
        activeCharacter.current = null;
        autoQuest.current = null;
        render.current.autoPath = [];
        socket.current?.close();
        render.current.snapshot = null;
        render.current.keys.clear();
        render.current.pendingMove = { x: 0, y: 0 };
        render.current.correction = { x: 0, y: 0 };
        pending.current = [];
        retryPacket.current = null;
        inflightAction.current = null;
        packetPosition.current = null;
        busy.current = false;
        seq.current = 0;
        setSnap(null);
        setCreating(false);
        open(null);
        const r = await fetch('/api/account');
        if (r.ok)
            setRoster(await r.json());
    };
    const sendChat = async () => {
        const text=chat.trim();if(!text||chatSending)return;
        setChatSending(true);
        try {
            const response=await fetch('/api/chat?characterId='+encodeURIComponent(activeCharacter.current||''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:AbortSignal.timeout(12000)});
            const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||'채팅을 보내지 못했습니다. 다시 시도하세요.');
            setChat(current=>current.trim()===text?'':current);
        } catch(error){setNotice(error instanceof Error?error.message:'채팅을 보내지 못했습니다. 다시 시도하세요.');}
        finally{setChatSending(false);}
    };
    const [dismissedReward, setDismissedReward] = useState(0);
    const followQuest = useCallback((id: number) => {
        const p = render.current.snapshot?.player, q = QUESTS[id];
        if (!p || !q || p.done.includes(id))
            return;
        if (p.level < (q.minLevel || 1)) {
            setNotice(`레벨 ${q.minLevel}부터 시작할 수 있습니다.`);
            return;
        }
        autoQuest.current = null;
        render.current.autoPath = [];
        holding.current = false;
        render.current.keys.clear();
        if (p.quests[id] === undefined || p.quests[id] >= q.count) {
            queue({ action: 'quest', value: id });
            return;
        }
        const zone = q.zone ?? ZONES.find(z => z.types.includes(q.monster))?.id;
        if (zone !== undefined) {
            queue({ action: 'travel', value: zone });
            open(null);
        }
    }, [open, queue]);
    const moveMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const zoom = Math.min(1.05, Math.max(.63, r.width / 1300));
        const aim = { x: (e.clientX - r.left - r.width / 2) / zoom + render.current.camera.x, y: (e.clientY - r.top - r.height / 2) / zoom + render.current.camera.y };
        render.current.mouse = aim;
        const s = render.current.snapshot;
        let id: string | undefined;
        if (s) {
            const npc = NPCS.find(n => n.zone === s.player.zone && Math.abs(aim.x - n.x) < 48 && aim.y > n.y - 115 && aim.y < n.y + 15);
            if (npc)
                id = 'npc-' + npc.id;
        }
        if (!id) {
            const m = s?.monsters.filter(m => m.hp > 0).find(m => Math.abs(aim.x - m.x) < (isBoss(m.type) ? 60 : 40) && aim.y > m.y - (isBoss(m.type) ? 140 : 90) && aim.y < m.y + 15);
            id = m?.id;
        }
        const other = s?.players.find(a => Math.abs(aim.x - a.x) < 48 && aim.y > a.y - 105 && aim.y < a.y + 15);
        if (other)
            id = other.id;
        render.current.hoverId = id;
        e.currentTarget.style.cursor = id ? 'pointer' : 'crosshair';
    };
    const clickWorld = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!snap || e.button !== 0 || panel)
            return;
        autoQuest.current = null;
        render.current.autoPath = [];
        moveMouse(e);
        const hover = render.current.hoverId;
        if (hover?.startsWith('npc-')) {
            const n = NPCS[Number(hover.slice(4))];
            if (Math.hypot(n.x - render.current.local.x, n.y - render.current.local.y) < 170)
                open(`npc${n.id}` as Panel);
            else
                setNotice('NPC에게 조금 더 가까이 다가가세요.');
            return;
        }
        if (snap.players.some(p => p.id === hover)) {
            setInspectId(hover!);
            open('player');
            return;
        }
        if (hover) {
            setTargetId(hover);
            render.current.targetId = hover;
        }
        holding.current = true;
        attack(0);
    };
    const p = snap?.player, c = p ? CLASSES[p.classId] : CLASSES[classId], st = p ? stats(p) : null;
    const currentClass = p ? classNameFor(p, c.name) : c.name;
    const slots = p ? loadoutFor(p) : [0, 1, 2, 3];
    const targetMonster = snap?.monsters.find(m => m.id === targetId && m.hp > 0) || snap?.monsters.find(m => m.type === 9 && m.hp > 0 && p && Math.hypot(m.x - p.x, m.y - p.y) < 650);
    const inspected = snap?.players.find(a => a.id === inspectId);
    const serviceNpc = panel?.startsWith('npc') ? NPCS.find(n => n.id === Number(panel.slice(3))) : undefined;
    const storyDialog = !!serviceNpc || panel === 'quests';
    const title = panel==='chat'?'세계 채팅':panel==='menu'?'메뉴':serviceNpc ? serviceNpc.name : panel === 'cash' ? '별빛 캐시샵' : panel === 'player' ? '수호자 정보' : panel === 'trade' ? '수호자 거래' : panel === 'bubbles' ? '말풍선 상점' : panel === 'raid' ? '보스 레이드' : panel === 'inventory' ? '여행자의 가방' : panel === 'character' ? '나의 수호자' : panel === 'quests' ? '모험 기록' : panel === 'map' ? '월드맵 · 에테리아' : panel === 'skills' ? '수호자의 스킬' : panel === 'settings' ? '게임 설정' : panel === 'guide' ? '모험 안내' : panel === 'npc0' ? '별샘의 안내자, 세라' : panel === 'npc1' ? '여행 상인, 로엔' : '치유사, 엘린';
    return <SpriteContext.Provider value={spriteUrls}><main className="game-shell">
  <canvas ref={canvasRef} className="game-canvas" aria-label={tr("에테리아 게임 세계")} onMouseMove={moveMouse} onMouseDown={clickWorld} onContextMenu={e => {
            e.preventDefault();
            moveMouse(e);
            const other = snap?.players.find(a => a.id === render.current.hoverId);
            if (other) {
                setInspectId(other.id);
                open('player');
            }
        }}/>
  {!snap && <div className="entry-screen">
   <header className="entry-top"><Link className="wordmark" href="/"> <Sparkles size={20}/> AETHERIA</Link><span>{tr("별빛의 수호자")}</span><LanguagePicker /><button className="icon-button" aria-label={tr("게임 안내")} onClick={() => open('guide')}><ScrollText size={20}/></button></header>
   <div className="entry-content"><div className="entry-heading"><span className="eyebrow">A NEW JOURNEY AWAITS</span><h1>{tr("당신의 별이")}<br />{tr("깨어나는 곳.")}</h1><p>{tr("별샘의 수호자가 되어, 잊힌 세계를 탐험하세요.")}</p></div>
   {!creating && roster && <AccountLogin />}
   {!creating && roster ? <CharacterLobby roster={roster} sprites={spriteUrls} busy={joining} onCreate={() => { setName(''); setCreating(true); }} onSelect={id => void selectCharacter(id)} onChange={changeRoster}/> : <section className="character-select creation-card"><button className="outline-button" onClick={() => setCreating(false)}>{tr("← 수호자 목록")}</button><div className="section-caption"><span>01 <i />{tr(" 수호자 선택")}</span><span>{tr("세 가지 길, 하나의 모험")}</span></div>
    <RadioGroup value={String(classId)} onValueChange={v => setClassId(Number(v))} className="class-grid" aria-label={tr("직업 선택")}>{CLASSES.map((cls, i) => { const Icon = icons[i]; return <label htmlFor={`class-${i}`} className={'class-card ' + (classId === i ? 'selected' : '')} key={cls.id}><div className="class-card-top"><span>{tr(cls.en)}</span><RadioGroupItem value={String(i)} id={`class-${i}`} aria-label={tr(cls.name)}/></div><Portrait index={i} className="entry-portrait"/><div className="class-copy"><Icon size={18}/><h2>{tr(cls.name)}</h2><p>{tr(cls.role)}</p></div></label>; })}</RadioGroup>
    <div className="class-description"><span className="small-diamond">✦</span> {tr(CLASSES[classId].description)}</div>
    <form className="entry-form" aria-label={tr("캐릭터 만들기")} onSubmit={e => { e.preventDefault(); if (!boot && artReady && !joining && name.trim().length >= 2) void join(); }}><label htmlFor="nickname"><span>02 <i />{tr(" 수호자의 이름")}</span><input id="nickname" maxLength={14} placeholder={tr("이름을 입력하세요 (2~14글자)")} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }} autoComplete="off"/></label><button type="submit" className="gold-button enter-button" disabled={boot || joining || !artReady || name.trim().length < 2}>{tr(boot ? '진행 정보 확인 중' : joining ? '세계에 연결 중' : !artReady ? '게임 아트 불러오는 중' : '모험 시작')}<Sparkles size={18}/></button></form>
    {tr(error && <p className="error-line" role="alert">{tr(error)} <button onClick={() => location.reload()}>{tr("다시 시도")}</button></p>)}
   </section>}{tr(error && !creating && <p className="error-line" role="alert">{tr(error)}</p>)}{boot && <p>{tr("수호자를 불러오는 중…")}</p>}</div>
   <footer className="entry-bottom"><span><kbd>W A S D</kbd>{tr(" 이동 ")}<b /> <kbd>1 – 4</kbd>{tr(" 스킬 ")}<b /> <kbd>E</kbd>{tr(" 대화")}</span><span>{tr("오리지널 온라인 판타지 RPG")}</span></footer>
  </div>}
  {snap && p && st && <>
   <div className="mobile-top-actions"><button className="glass" onClick={()=>open('chat')} aria-label={tr('세계 채팅')}><MessageSquare size={18}/><span>{tr('채팅')}</span></button><button className="glass" onClick={()=>open('menu')} aria-label={tr('메뉴')}><Menu size={19}/><span>{tr('메뉴')}</span></button></div><div className="top-hud"><div className={'player-hud glass adjustable-hud ' + (hudEdit ? 'editing' : '')} style={{ left: `${hud.x}vw`, top: `${hud.y}vh` }} onPointerDown={e => {
                if (!hudEdit || (e.target as HTMLElement).closest('button'))
                    return;
                const rect = e.currentTarget.getBoundingClientRect();
                hudDrag.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                e.currentTarget.setPointerCapture(e.pointerId);
            }} onPointerMove={e => {
                if (!hudEdit || !hudDrag.current || !e.currentTarget.hasPointerCapture(e.pointerId))
                    return;
                const rect = e.currentTarget.getBoundingClientRect();
                const next = { x: Math.max(0, Math.min(100 - rect.width / window.innerWidth * 100, (e.clientX - hudDrag.current.x) / window.innerWidth * 100)), y: Math.max(0, Math.min(100 - rect.height / window.innerHeight * 100, (e.clientY - hudDrag.current.y) / window.innerHeight * 100)) };
                setHud(next);
                localStorage.setItem('aetheria-hud', JSON.stringify(next));
            }}><button className="hud-handle" onClick={() => setHudEdit(!hudEdit)} aria-label={tr("레벨창 위치 조정")}>{tr(hudEdit ? '✓ 위치 고정' : '⠿ 위치 조정')}</button><div className="avatar-frame"><Portrait index={p.classId}/><span className="level-badge">LV {p.level}</span></div><div className="player-info"><div className="player-name">{p.name}<span>{tr(currentClass)}</span></div><div className="bar-row"><span>HP</span><Progress className="hp-bar" value={p.hp / st.hp * 100}/><small>{Math.ceil(p.hp)} / {st.hp}</small></div><div className="bar-row"><span>MP</span><Progress className="mp-bar" value={p.mp / st.mp * 100}/><small>{Math.floor(p.mp)} / {st.mp}</small></div></div></div>
    <div className="zone-heading"><span className="eyebrow">{tr(ZONES[p.zone].level)}</span><h1>{tr(ZONES[p.zone].name)}</h1><span>{tr(ZONES[p.zone].sub)}</span></div>
    <div className="world-hud"><div className="world-status"><span className={connected ? 'connected' : 'offline'}>{tr(connected ? '연결됨' : '다시 연결 중')}</span><span><UserRound size={13}/>{snap.online}{tr("명 접속")}</span><button aria-label={tr("게임 설정")} onClick={() => open('settings')}><Settings size={17}/></button></div><div className="minimap glass" aria-label={tr("미니맵")}><div className="minimap-world" style={{ backgroundImage: `url(${ZONES[p.zone].art || '/art/' + ['forest', 'snow', 'ember'][ZONES[p.zone].biome] + '.png'})` }}><span className="map-player" style={{ left: `${p.x / WORLD.w * 100}%`, top: `${p.y / WORLD.h * 100}%` }}/>{NPCS.filter(n => n.zone === p.zone).map(n => <span className="map-npc" key={n.id} style={{ left: `${n.x / WORLD.w * 100}%`, top: `${n.y / WORLD.h * 100}%` }}/>)}{portalsFor(p.zone).map((a, i) => <span key={i} className="map-portal" style={{ left: `${a.x / WORLD.w * 100}%`, top: `${a.y / WORLD.h * 100}%` }}/>)}{snap.monsters.filter(m => m.hp > 0).map(m => <span key={m.id} className="map-monster" style={{ left: `${m.x / WORLD.w * 100}%`, top: `${m.y / WORLD.h * 100}%` }}/>)}</div><div className="minimap-caption" role="button" tabIndex={0} onClick={() => open('map')} onKeyDown={e => {
                if (e.key === 'Enter')
                    open('map');
            }}><Map size={12}/> {tr(ZONES[p.zone].name)}</div></div></div>
   </div>
   {targetMonster && <div className={'target-plate glass ' + (targetMonster.type === 9 ? 'boss-plate' : '')}><span>{tr(targetMonster.type === 9 ? 'BOSS · ' : targetMonster.type === 8 ? 'ELITE · ' : '')}{tr(ZONES[targetMonster.zone]?.raid ? RAIDS[targetMonster.zone - 25].name : MONSTERS[targetMonster.type].name)}{isBoss(targetMonster.type) && targetMonster.hp < targetMonster.maxHp * .5 && <em>{tr("격노")}</em>}</span><Progress value={targetMonster.hp / targetMonster.maxHp * 100}/><small>{Math.ceil(targetMonster.hp)} / {targetMonster.maxHp}</small>{(targetMonster.attackUntil || 0) > now && <b>{tr("범위 공격 준비 · 붉은 원을 벗어나세요")}</b>}</div>}
   <QuestTracker p={p} onAction={followQuest} onJournal={() => open('quests')}/>
   {p.lastQuestReward && p.lastQuestReward.time > dismissedReward && now - p.lastQuestReward.time < 15000 && <QuestReward p={p} onDismiss={() => setDismissedReward(p.lastQuestReward!.time)}/>}

   {snap.raid && <div className="raid-status glass"><strong>{tr(RAIDS[p.zone - 25]?.name)}</strong><span>{tr(snap.raid.status === 'fight' ? `남은 시간 ${Math.max(0, Math.ceil((snap.raid.ends - now) / 1000))}초 · ${snap.raid.participants.length}/4명` : snap.raid.status === 'won' ? '보스 처치 완료' : '도전 실패')}</span>{snap.monsters[0] && <Progress value={snap.monsters[0].hp / snap.monsters[0].maxHp * 100}/>}<small>{tr(snap.monsters[0]?.hp < snap.monsters[0]?.maxHp * .5 ? '광폭화 · 강타 강화' : '붉은 경고 범위를 피하세요')}</small><button className="outline-button" onClick={() => queue({ action: 'raidLeave' })}>{tr("퇴장")}</button></div>}
   {tr(notice && <div className="game-notice" role="status"><Sparkles size={16}/>{tr(notice)}</div>)}
   {!connected && <div className="reconnect-banner"><RefreshCw size={16} className="spin"/>{tr("서버에 다시 연결하고 있습니다. 진행도는 저장됩니다.")}</div>}
   <div className="bottom-hud"><ChatPanel messages={snap.chat} draft={chat} onDraft={setChat} onSend={()=>void sendChat()} onFocus={()=>{render.current.keys.clear();holding.current=false;}} sending={chatSending}/>
   <div className="combat-controls"><div className="combat-utility">{p.level >= 10 && <button className="skillbook-control glass" onClick={() => open('raid')} title={tr("보스 레이드 · LV10 이상")}><Flame size={18}/>{tr("레이드")}</button>}{snap.trade && <button className="skillbook-control glass" onClick={() => open('trade')}><Coins size={18}/>{tr("거래 ")}{tr(snap.trade.phase === 'request' ? '요청' : '진행')}</button>}<button className="dodge-control glass" disabled={(p.dodgeCd || 0) > now || p.hp <= 0} onClick={() => queue({ action: 'dodge', tx: render.current.mouse.x, ty: render.current.mouse.y })}><Wind size={16}/><kbd>SHIFT</kbd>{tr((p.dodgeCd || 0) > now ? `${(((p.dodgeCd || 0) - now) / 1000).toFixed(1)}초` : '회피')}</button>{p.classId === 0 && (p.comboUntil || 0) > now && <span className="combo-indicator">{p.combo} / 3 COMBO</span>}<button className="skillbook-control glass" onClick={() => open('skills')}><BookOpen size={16}/><kbd>K</kbd>{tr("스킬")}{skillPoints(p) > 0 && <b>{skillPoints(p)}</b>}</button></div><div className="combat-hint"><kbd>WASD</kbd>{tr(" 이동 ")}<span>·</span><kbd>{tr("마우스")}</kbd>{tr(" 조준 · 기본 공격 ")}<span>·</span><kbd>Z</kbd>{tr(" 줍기")}</div><div className="hotbar glass"><div className="skill-group">{slots.map((skill, slot) => { const name = skill < 0 ? '빈 슬롯' : c.skills[skill], Icon = classSkillIcons[p.classId][skill % 4] || Sparkles, remaining = skill < 0 ? 0 : Math.max(0, (p.cd[skill] || 0) - now); return <button key={slot} className={'skill-button skill-' + slot} aria-label={tr(`${slot + 1} ${name}`)} title={tr(skill < 0 ? 'K에서 스킬을 넣으세요' : `${name} · MP ${c.cost[skill]} · ${SKILL_SPECS[p.classId][skill].description} · 우클릭으로 제거`)} onContextMenu={e => { e.preventDefault(); queue({ action: 'bind', slot, value: -1 }); }} disabled={skill < 0 || remaining > 0 || p.hp <= 0 || p.mp < c.cost[skill]} onClick={() => attack(slot)}><kbd>{slot + 1}</kbd>{skill >= 8 ? <SkillArt classId={p.classId} skill={skill}/> : skill >= 0 ? <Icon size={27}/> : <span>＋</span>}{skill >= 0 && !!p.skillRanks?.[skill] && <span className="rank-badge">+{p.skillRanks[skill]}</span>}{remaining > 0 && <span className="cooldown" style={{ background: `conic-gradient(#081c20df ${remaining / c.cd[skill] * 360}deg, transparent 0)` }}><b>{tr((remaining / 1000).toFixed(1))}</b></span>}<small>{tr(name)}</small></button>; })}</div><i className="hotbar-divider"/><button className="potion-button hp-potion" disabled={(p.potionCd || 0) > now || p.potions === 0 || p.hp <= 0} onClick={() => queue({ action: 'potion' })} title={tr("Q · 생명 물약 +80 HP")}><kbd>Q</kbd><Heart size={23}/>{(p.potionCd || 0) > now && <b className="potion-cooldown">{tr((((p.potionCd || 0) - now) / 1000).toFixed(1))}</b>}<span>{p.potions}</span></button><button className="potion-button mana-potion" disabled={(p.manaPotionCd || 0) > now || p.manaPotions === 0 || p.hp <= 0} onClick={() => queue({ action: 'mana' })} title={tr("R · 마나 물약 +70 MP")}><kbd>R</kbd><Diamond size={22}/>{(p.manaPotionCd || 0) > now && <b className="potion-cooldown">{tr((((p.manaPotionCd || 0) - now) / 1000).toFixed(1))}</b>}<span>{p.manaPotions}</span></button></div><div className="experience"><span>LV. {p.level}</span><Progress value={p.xp / needXp(p.level) * 100}/><span>{p.xp} / {needXp(p.level)} EXP</span></div></div>
   <div className="menu-stack"><div className="gold-count wallet-cash"><Diamond size={16}/>{tr((p.cash || 0).toLocaleString())}<span>C</span></div><div className="gold-count"><Coins size={17}/>{tr(p.gold.toLocaleString())}<span>G</span></div><div className="game-menu glass">{([{ panel: 'map', label: '월드맵', key: 'M', icon: Map }, { panel: 'inventory', label: '가방', key: 'I', icon: Backpack }, { panel: 'character', label: '수호자', key: 'C', icon: UserRound }, { panel: 'quests', label: '퀘스트', key: 'J', icon: ScrollText }] as const).map(n => <button key={n.panel} onClick={() => open(n.panel)} title={tr(`${n.label} (${n.key})`)}><n.icon size={21}/><span>{tr(n.label)}</span><kbd>{tr(n.key)}</kbd></button>)}</div><button className="cashshop-icon glass" title={tr("후원 캐시샵")} onClick={() => open('cash')}><Diamond size={19}/>{tr("캐시샵")}</button><div className="town-shortcuts" aria-label={tr("광장 바로 이동")}>{ZONES.filter(z => z.id === 0 || z.id === 28 || z.id === 29).map(z => <button key={z.id} disabled={p.level < z.minLevel || p.zone === z.id || p.hp <= 0} onClick={() => { queue({ action: 'travel', value: z.id }); }} title={tr("레벨 조건만 충족하면 즉시 이동")}>{tr(z.name)}<small>{tr(p.zone === z.id ? '현재 광장' : p.level < z.minLevel ? 'LV ' + z.minLevel + ' 필요' : '바로 이동')}</small></button>)}</div><button className="help-link" onClick={() => open('bubbles')}>{tr("말풍선 상점")}</button><button className="help-link" onClick={() => open('guide')}>{tr("조작 안내")}</button></div>
   </div>
   <div className="touch-controls"><button onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId);autoQuest.current = null; render.current.autoPath = []; render.current.keys.add('w'); }} onPointerUp={() => render.current.keys.delete('w')} onPointerCancel={()=>render.current.keys.delete('w')} onLostPointerCapture={()=>render.current.keys.delete('w')}>↑</button><div><button onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId);autoQuest.current = null; render.current.autoPath = []; render.current.keys.add('a'); }} onPointerUp={() => render.current.keys.delete('a')} onPointerCancel={()=>render.current.keys.delete('a')} onLostPointerCapture={()=>render.current.keys.delete('a')}>←</button><button onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId);autoQuest.current = null; render.current.autoPath = []; render.current.keys.add('s'); }} onPointerUp={() => render.current.keys.delete('s')} onPointerCancel={()=>render.current.keys.delete('s')} onLostPointerCapture={()=>render.current.keys.delete('s')}>↓</button><button onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId);autoQuest.current = null; render.current.autoPath = []; render.current.keys.add('d'); }} onPointerUp={() => render.current.keys.delete('d')} onPointerCancel={()=>render.current.keys.delete('d')} onLostPointerCapture={()=>render.current.keys.delete('d')}>→</button></div><button onClick={interact}>{tr("E · 대화")}</button><button onClick={() => queue({ action: 'loot' })}>{tr("Z · 줍기")}</button></div>
   {p.hp <= 0 && <div className="death-overlay"><Sparkles size={40}/><h2>{tr("잠시, 별빛이 희미해졌습니다.")}</h2><p>{tr("당신의 모험은 아직 끝나지 않았습니다.")}</p><button className="gold-button" onClick={() => queue({ action: 'respawn' })}>{tr("별샘에서 다시 일어나기")}</button></div>}
  </>}
  <Dialog open={!!panel} onOpenChange={v => {
            if (!v)
                open(null);
        }}><DialogContent style={panel==='chat'&&chatViewport?{top:chatViewport.top+16,maxHeight:Math.max(160,chatViewport.height-32),transform:'translateX(-50%)'}:undefined} className={'game-dialog '+(panel==='chat'?'mobile-chat-dialog':panel==='menu'?'mobile-menu-dialog':storyDialog?'story-dialog':'')}>{storyDialog && <Portrait index={serviceNpc?.sprite ?? 3} className="story-speaker-portrait"/>}<DialogTitle className="dialog-title">{tr(title)}</DialogTitle><DialogDescription className="dialog-description">{tr(panel==='chat'?'메시지를 입력하고 보내기를 누르세요.':panel==='menu'?'원하는 메뉴를 선택하세요.':panel === 'npc0' ? '“작은 용기가 별샘을 지켜낼 거예요. 당신의 힘을 빌려주세요.”' : panel === 'npc1' ? '“여행에 필요한 물건이라면 제게 맡기세요.”' : panel === 'npc2' ? '“별빛이 당신의 상처를 어루만지기를.”' : panel === 'inventory' ? '아이템을 선택해 장착하세요. 같은 종류의 장비는 하나씩 장착합니다.' : panel === 'quests' ? '메인 이야기 1개 · 서브 의뢰 2개. 어디서든 한 번의 클릭으로 수락하고 보상을 받으세요.' : panel === 'settings' ? '편안한 모험을 위한 설정' : panel === 'skills' ? '레벨마다 숙련 포인트를 1 얻습니다. 스킬을 강화하면 피해가 12%씩 증가합니다. 레벨 5·10·20·35에 성장 스킬을 배울 수 있고, 10·30레벨 전직 시험을 완료하면 전직 스킬이 열립니다. 슬롯을 고른 후 원하는 스킬을 넣으세요.' : panel === 'character' ? '별빛과 함께 성장하는 당신의 기록' : '별샘 마을에서 시작해 초원, 숲, 유적, 월식의 성소로 이어지는 모험.')}</DialogDescription><div className={storyDialog?'story-dialog-body':'dialog-body'}>
   {snap&&panel==='chat'&&<ChatPanel messages={snap.chat} draft={chat} onDraft={setChat} onSend={()=>void sendChat()} onFocus={()=>{render.current.keys.clear();holding.current=false;}} sending={chatSending} drawer/>}
   {p&&panel==='menu'&&<div className="mobile-menu-content"><div className="mobile-wallet"><span>{p.gold.toLocaleString()} G</span><span>{(p.cash||0).toLocaleString()} C</span></div><div className="mobile-menu-grid">{([{panel:'map',label:'월드맵',icon:Map},{panel:'inventory',label:'가방',icon:Backpack},{panel:'character',label:'수호자',icon:UserRound},{panel:'quests',label:'퀘스트',icon:ScrollText},{panel:'skills',label:'스킬',icon:BookOpen},{panel:'raid',label:'레이드',icon:Flame},{panel:'bubbles',label:'말풍선 상점',icon:MessageSquare},{panel:'cash',label:'캐시샵',icon:Diamond},{panel:'settings',label:'게임 설정',icon:Settings}] as const).map(item=><button key={item.panel} className="outline-button" onClick={()=>open(item.panel)}><item.icon size={22}/><span>{tr(item.label)}</span></button>)}</div><div className="town-shortcuts">{ZONES.filter(zone=>zone.safe).map(zone=><button key={zone.id} className="outline-button" disabled={p.level<zone.minLevel||p.zone===zone.id||p.hp<=0} onClick={()=>{queue({action:'travel',value:zone.id});open(null);}}>{tr(zone.name)}<small>{tr(p.zone===zone.id?'현재 광장':p.level<zone.minLevel?`LV. ${zone.minLevel} 필요`:'바로 이동')}</small></button>)}</div></div>}
   {p && serviceNpc && !['quest', 'shop', 'heal'].includes(serviceNpc.service) && <WorkshopPanel player={p} npc={serviceNpc} send={queue} navigate={open} sprites={spriteUrls}/>}
   {snap && panel === 'cash' && <CashShop snapshot={snap} send={queue}/>}
   {snap && panel === 'bubbles' && <BubbleShop snapshot={snap} send={queue}/>}
   {snap && panel === 'raid' && <RaidPanel snapshot={snap} send={queue}/>}
   {snap && panel === 'trade' && <TradePanel snapshot={snap} send={queue}/>}
   {p && panel === 'player' && (inspected ? <div className="character-panel"><Portrait index={inspected.classId}/><div><h2>{inspected.name}</h2><p>LV. {inspected.level} · {tr(classNameFor(inspected, CLASSES[inspected.classId].name))}</p><p>{tr("레이드 승리 ")}{inspected.raidWins || 0}{tr("회")}</p>{Object.entries(inspected.equipment).map(([slot, id]) => <p key={slot}>{tr(id !== null ? ITEMS[id].name : '장비 없음')}</p>)}<button className="gold-button" onClick={() => { queue({ action: 'tradeRequest', targetId: inspected.id }); open('trade'); }}>{tr("거래 요청")}</button></div></div> : <p>{tr("수호자가 지역을 떠났습니다.")}</p>)}
   {tr(notice && panel !== 'guide' && <div className="dialog-feedback" role="status"><Sparkles size={14}/>{tr(notice)}</div>)}
   {panel === 'guide' && <div className="guide-content"><div className="control-grid">{[['WASD / 방향키', '이동'], ['마우스 왼쪽 / Space', '기본 공격'], ['1 · 2 · 3 · 4', '직업별 스킬'], ['Shift', '방향 이동 · 짧은 무적 회피'], ['K', '스킬 습득 / 슬롯 편집'], ['M', '27개 지역 + 3개 레이드 월드맵'], ['E', 'NPC 대화 / 차원문 이동'], ['Z / F', '가까운 전리품 줍기'], ['Q / R', '생명 / 마나 물약'], ['I / C / J', '가방 / 수호자 / 퀘스트'], ['ESC', '설정 / 창 닫기']].map(([key, label]) => <div key={key}><kbd>{tr(key)}</kbd><span>{tr(label)}</span></div>)}</div><p>{tr("퀘스트 카드에서 첫 임무를 받은 후 오른쪽 차원문으로 초원에 들어가세요. 몬스터를 처치하면 경험치를 얻습니다. Z로 전리품을 모으고, I로 장비를 장착하세요.")}</p><p className="subtle">{tr("진행도는 서버에 저장됩니다. 구글 로그인 후에는 같은 계정으로 다른 기기에서도 모험을 이어갈 수 있습니다.")}</p></div>}
   {panel === 'settings' && <div className="settings-content"><LanguagePicker /><AccountLogin /><button className="outline-button" onClick={() => void returnToLobby()}>{tr("수호자 선택 화면으로")}</button>{[{ name: '전체 음량', value: volume, set: setVolume }, { name: '효과음', value: sfx, set: setSfx }, { name: '캐릭터 음성', value: voiceVolume, set: setVoiceVolume }, { name: '배경 음악', value: music, set: setMusicVolume }].map(a => <div className="volume-row" key={a.name}><span><Volume2 size={16}/>{tr(a.name)}</span><Slider aria-label={tr(a.name)} value={[a.value * 100]} max={100} step={1} onValueChange={v => a.set(v[0] / 100)}/><b>{Math.round(a.value * 100)}%</b></div>)}<p className="subtle">{tr("업로드한 8곡이 마을·초원·숲·상점·설원·협곡·성소에 맞춰 재생됩니다. 지역을 바꾸면 음악이 자연스럽게 전환됩니다.")}</p><div className="hud-settings"><strong>{tr("레벨창 위치")}</strong><p>{tr("게임 화면의 ‘위치 조정’을 누르고 창을 드래그하세요.")}</p><button className="outline-button" onClick={() => { const next = { x: 2, y: 3 }; setHud(next); localStorage.setItem('aetheria-hud', JSON.stringify(next)); }}>{tr("기본 위치로 복원")}</button></div><button className="outline-button" onClick={() => {
                if (!document.fullscreenElement)
                    void document.documentElement.requestFullscreen();
                else
                    void document.exitFullscreen();
            }}><Maximize size={16}/>{tr("전체 화면 전환")}</button></div>}
   {p && panel === 'skills' && <div className="skillbook"><section className="auto-skill-panel"><div><h3>{tr("자동 스탯 · 스킬 숙련 배분")}</h3><p>{tr("레벨·전직으로 얻은 숙련 포인트를 자동으로 사용합니다. 이미 찍은 포인트는 유지됩니다.")}</p></div><div className="auto-skill-modes">{['수동', '균형 배분', '장착 스킬 우선', '전직 스킬 우선'].map((label, mode) => <button key={mode} className={(p.autoSkillMode || 0) === mode ? 'selected' : ''} aria-pressed={(p.autoSkillMode || 0) === mode} onClick={() => queue({ action: 'autoSkillMode', value: mode })}>{tr(label)}</button>)}</div><p className="subtle">{tr("배울 수 있는 스킬만 최대 숙련 3까지 배분합니다. 남는 포인트는 다음 스킬 해금까지 보관합니다. 공격·방어·HP는 기존 레벨·장비 성장 규칙을 유지합니다.")}</p><button className="outline-button" disabled={skillPoints(p) === 0} onClick={() => queue({ action: 'autoTrain', value: p.autoSkillMode || 1 })}>{tr("남은 ")}{skillPoints(p)}{tr(" 포인트 지금 자동 배분")}</button></section><div className="slot-editor"><span>{tr("편집할 슬롯")}</span>{slots.map((id, i) => <button key={i} className={bindSlot === i ? 'selected' : ''} onClick={() => setBindSlot(i)}><kbd>{i + 1}</kbd>{tr(id < 0 ? '비어 있음' : c.skills[id])}</button>)}<button onClick={() => queue({ action: 'bind', slot: bindSlot, value: -1 })}>{tr("선택 슬롯 비우기")}</button></div><div className="skill-points"><Sparkles size={17}/>{tr("남은 숙련 포인트 ")}<strong>{skillPoints(p)}</strong></div><Tabs defaultValue={String(p.classId)}><TabsList className="class-tabs">{CLASSES.map(cls => <TabsTrigger value={String(cls.id)} key={cls.id}>{tr(cls.name)}</TabsTrigger>)}</TabsList>{CLASSES.map(cls => <TabsContent value={String(cls.id)} key={cls.id}><div className="skill-list">{SKILL_SPECS[cls.id].map((spec, i) => { const Icon = classSkillIcons[cls.id][i % 4], own = cls.id === p.classId, rank = own ? p.skillRanks?.[i] || 0 : 0; return <article key={i} className={'skill-detail skill-detail-' + cls.id}><div className="skill-detail-icon">{i >= 8 ? <SkillArt classId={cls.id} skill={i}/> : <Icon size={28}/>}<kbd>{i + 1}</kbd></div><div className="skill-detail-copy"><h3>{tr(cls.skills[i])}{own && <span>{tr("숙련 ")}{rank} / 3</span>}</h3><span className="skill-effect">{tr(spec.effect)}</span><p>{tr(spec.description)}</p><div className="skill-stats"><span>MP {cls.cost[i]}</span><span>{cls.cd[i] / 1000}{tr("초 재사용")}</span><span>{tr("사거리 ")}{cls.range[i]}</span>{rank > 0 && <b>{tr("피해 +")}{rank * 12}%</b>}</div>{own && <><button className="outline-button" disabled={skillPoints(p) === 0 || rank >= 3 || !skillAvailable(p, i)} onClick={() => queue({ action: 'train', value: i })}>{tr(!skillAvailable(p, i) ? (p.level < SKILL_LEVELS[i] ? `LV. ${SKILL_LEVELS[i]} 필요` : `${i < 10 ? 1 : 2}차 전직 필요`) : rank >= 3 ? '최대 숙련' : i >= 4 && rank === 0 ? '배우기 · 1 포인트' : '강화 · 1 포인트')}</button><button className="outline-button" disabled={!skillUnlocked(p, i)} onClick={() => queue({ action: 'bind', slot: bindSlot, value: i })}>{bindSlot + 1}{tr("번 슬롯에 넣기")}</button></>}</div></article>; })}</div>{cls.id !== p.classId && <p className="subtle">{tr("다른 직업의 스킬을 미리 보고 있습니다.")}</p>}</TabsContent>)}</Tabs><div className="dodge-description"><Wind size={20}/><div><strong>{tr("공통 회피 · Shift")}</strong><p>{tr("이동 방향으로 빠르게 회피하며 ")}{DODGE.invulnerable / 1000}{tr("초간 피해를 받지 않습니다. 재사용 시간 ")}{DODGE.cooldown / 1000}{tr("초.")}</p></div></div></div>}
   {p && st && panel === 'character' && <div className="character-panel"><Portrait index={p.classId}/><div><span className="eyebrow">{tr(c.en)} · LEVEL {p.level}</span><h2>{p.name}</h2><p>{tr(currentClass)}</p><div className="stat-grid"><span><Sword size={16}/>{tr(" 공격력 ")}<b>{st.atk}</b></span><span><Shield size={16}/>{tr(" 방어력 ")}<b>{st.def}</b></span><span><Heart size={16}/>{tr(" 생명력 ")}<b>{st.hp}</b></span><span><Sparkles size={16}/>{tr(" 마나 ")}<b>{st.mp}</b></span></div>{p.petId !== undefined && p.petId !== null && <p className="pet-summary">{tr("동행: ")}{tr(PETS[p.petId]?.name)}{tr(" · 자동 줍기 ")}{tr(p.petAutoLoot === false ? '꺼짐' : '켜짐')}</p>}<div className="equipment-list">{Object.entries(p.equipment).map(([slot, id]) => <div key={slot}><span>{tr(slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : '반지')}</span><b>{tr(id !== null ? ITEMS[id].name : '장착하지 않음')}</b></div>)}</div></div></div>}
   {p && panel === 'inventory' && <div><div className="inventory-summary"><span><Backpack size={16}/>{p.inventory.length} / 60</span><span><Coins size={16}/>{p.gold} G</span></div><div className="item-grid">{p.inventory.map((id, index) => { const item = ITEMS[id], equipped = Object.values(p.equipment).includes(id), Icon = item.slot === 'weapon' ? Sword : item.slot === 'armor' ? Shield : Diamond; return <button className={'item-card rarity-' + item.rarity} key={index} onClick={() => queue({ action: 'equip', value: id })}><Icon size={28}/><strong>{tr(item.name)}</strong><span>{tr(item.atk ? `공격 +${item.atk}` : `방어 +${item.def}`)}{tr(item.hp ? ` · HP +${item.hp}` : '')}</span><small>{tr(equipped ? '장착 중' : p.level < (item.minLevel || 1) ? 'LV ' + item.minLevel + ' 필요' : item.classId !== undefined && item.classId !== p.classId ? '다른 직업 장비' : '클릭하여 장착')}</small></button>; })}</div><div className="bag-potions"><span><Heart size={17}/>{tr(" 생명 물약 ×")}{p.potions}</span><span><Diamond size={17}/>{tr(" 마나 물약 ×")}{p.manaPotions}</span></div></div>}
   {p && panel === 'quests' && <QuestJournal p={p} onAction={followQuest}/>}
   {p && panel === 'map' && <WorldMap player={p} onTravel={zone => { queue({ action: 'travel', value: zone }); open(null); }}/>}
   {p && serviceNpc?.service === 'quest' && <div className="npc-story"><Promotion player={p} onAction={() => queue({ action: 'promotion' })}/><div className="npc-speech"><strong>{tr("세라")}</strong><p>{tr(LORE)}</p></div><QuestJournal p={p} onAction={followQuest}/></div>}
   {p && serviceNpc?.service === 'shop' && <div className="shop-content"><div className="shop-wallet"><Coins size={16}/>{p.gold} G</div><div className="shop-potions"><button className="outline-button" onClick={() => queue({ action: 'buy', value: -1 })}><Heart size={18}/>{tr("생명 물약 ×3 ")}<b>18 G</b></button><button className="outline-button" onClick={() => queue({ action: 'buy', value: -2 })}><Diamond size={18}/>{tr("마나 물약 ×3 ")}<b>18 G</b></button></div><h3>{tr("펫샵 · 전리품 자동 줍기")}</h3><p className="subtle">{tr("구매한 펫은 가까운 전리품을 자동으로 줍습니다. 다른 수호자의 전리품과 벽 너머의 아이템은 줍지 않습니다.")}</p><div className="pet-shop">{PETS.map(pet => <article key={pet.id}><div className="pet-shop-art" style={{ backgroundImage: `url(${petUrls[pet.id] || '/art/pet-motion.png'})` }}/><strong>{tr(pet.name)}</strong><p>{tr(pet.description)}</p>{p.pets?.includes(pet.id) ? <button className="outline-button" onClick={() => queue({ action: 'equipPet', value: pet.id })}>{tr(p.petId === pet.id ? '함께하는 중' : '불러내기')}</button> : <button className="gold-button" disabled={p.gold < pet.price} onClick={() => queue({ action: 'buyPet', value: pet.id })}>{pet.price}{tr(" G · 구매")}</button>}</article>)}</div>{!!p.pets?.length && <div className="pet-controls"><button className="outline-button" onClick={() => queue({ action: 'equipPet', value: -1 })}>{tr("펫 쉬게 하기")}</button><button className="outline-button" onClick={() => queue({ action: 'petAutoLoot', value: p.petAutoLoot === false ? 1 : 0 })}>{tr("자동 줍기 ")}{tr(p.petAutoLoot === false ? '켜기' : '끄기')}</button></div>}<h3>{tr("말풍선 상점 · 12종")}</h3>{snap && <BubbleShop snapshot={snap} send={queue}/>}<h3>{tr("장비")}</h3><div className="shop-items">{ITEMS.filter(item => item.id < 14 || item.id >= 21).map(item => <div key={item.id}><span className={'rarity-text-' + item.rarity}>{tr(item.name)}<small>{tr("공격 +")}{item.atk}{tr(" · 방어 +")}{item.def} · HP +{item.hp}{tr(item.minLevel ? ` · LV ${item.minLevel}` : '')}{tr(item.classId !== undefined ? ` · ${CLASSES[item.classId].name}` : '')}</small></span><button className="outline-button" onClick={() => queue({ action: 'buy', value: item.id })} disabled={p.gold < item.price || p.level < (item.minLevel || 1)}>{tr(p.level < (item.minLevel || 1) ? 'LV ' + item.minLevel + ' 필요' : item.price + ' G')}</button></div>)}</div><h3>{tr("가방 아이템 판매")}</h3><div className="shop-items">{p.inventory.map((id, index) => !Object.values(p.equipment).includes(id) && <div key={index}><span>{tr(ITEMS[id].name)}</span><button className="outline-button" onClick={() => queue({ action: 'sell', value: index })}>{tr("판매 · ")}{Math.floor(ITEMS[id].price * .4)} G</button></div>)}</div></div>}
   {serviceNpc?.service === 'heal' && <div className="healer-content"><Portrait index={15}/><p>{tr("생명력과 마나를 모두 회복합니다.")}</p><button className="gold-button" onClick={() => { queue({ action: 'heal' }); open(null); }}>{tr("별빛의 치유 받기 · 무료")}</button></div>}
  </div>{storyDialog && <footer className="story-dialog-footer"><span>{tr("별빛의 여정")}</span><button className="gold-button" onClick={() => open(null)}>{tr("닫기")} <ChevronRight size={15}/></button></footer>}</DialogContent></Dialog>
 </main></SpriteContext.Provider>;
}
