import CutePortrait from './CutePortrait';
import CuteIcon from './CuteIcon';
import { tr } from '../../shared/i18n';
import { useState } from 'react';
import type { Player } from '../../shared/types';
import { CLASSES } from '../../shared/content';
import { classNameFor } from '../../shared/promotion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
export type Roster = {
    characters: Player[];
    slots: number;
    active: string | null;
    slotPrice: number;
};
export default function CharacterLobby({ roster, sprites, busy, onCreate, onSelect, onChange }: {
    roster: Roster;
    sprites: string[];
    busy: boolean;
    onCreate: () => void;
    onSelect: (id: string) => void;
    onChange: (body: Record<string, unknown>) => Promise<void>;
}) {
    const [remove, setRemove] = useState<Player | null>(null), [confirm, setConfirm] = useState(''), [payer, setPayer] = useState(roster.active || roster.characters[0]?.id || '');
    return <section className="character-lobby"><div className="section-caption"><span>{tr("나의 수호자")}</span><span>{roster.characters.length} / {roster.slots}{tr(" 슬롯")}</span></div><div className="guardian-slots">{Array.from({ length: roster.slots }, (_, i) => { const p = roster.characters[i]; return p ? <article className="guardian-slot" key={p.id}><span className="slot-number">SLOT {tr(String(i + 1).padStart(2, '0'))}</span><CutePortrait classId={p.classId}/><h2>{p.name}</h2><p>LV. {p.level} · {tr(classNameFor(p, CLASSES[p.classId].name))}</p><small>{tr(p.gold.toLocaleString())}{tr(" G · 완료한 모험 ")}{p.done.length}{tr("개")}</small><button className="gold-button" disabled={busy} onClick={() => onSelect(p.id)}>{tr("이어서 모험하기")}</button><button className="delete-guardian" disabled={busy} onClick={() => { setRemove(p); setConfirm(''); }}>{tr("캐릭터 삭제")}</button></article> : <button className="guardian-slot empty" key={i} disabled={busy} onClick={onCreate}><span className="slot-number">SLOT {tr(String(i + 1).padStart(2, '0'))}</span><CuteIcon name="star" size={64}/><strong>{tr("새로운 수호자")}</strong><small>{tr("캐릭터 만들기")}</small></button>; })}</div><p className="lobby-save-info">{tr("캐릭터와 진행도는 서버에 저장됩니다. 게스트는 같은 브라우저에서, 구글 계정은 로그인한 다른 기기에서도 이어갈 수 있습니다.")}</p>{roster.slots < 8 && <div className="slot-shop"><div><strong>{tr("수호자 슬롯 확장")}</strong><p>{tr("기본 4개 · 최대 8개 / 게임 골드로 구매")}</p></div><select aria-label={tr("슬롯 구매에 사용할 캐릭터")} value={payer} onChange={e => setPayer(e.target.value)}>{!roster.characters.length && <option value="">{tr("캐릭터가 필요합니다")}</option>}{roster.characters.map(p => <option value={p.id} key={p.id}>{p.name} · {tr(p.gold.toLocaleString())} G</option>)}</select><button className="outline-button" disabled={busy || !payer || !(roster.characters.find(p => p.id === payer)?.gold! >= roster.slotPrice)} onClick={() => void onChange({ action: 'buySlot', characterId: payer })}>＋ {tr(roster.slotPrice.toLocaleString())} G</button></div>}<Dialog open={!!remove} onOpenChange={v => {
            if (!v)
                setRemove(null);
        }}><DialogContent className="game-dialog"><DialogTitle>{tr("수호자 삭제")}</DialogTitle><DialogDescription>{tr("장비와 진행도가 함께 삭제됩니다. 삭제할 캐릭터 이름을 입력하세요.")}</DialogDescription><label className="delete-confirm">{remove?.name}<input value={confirm} onChange={e => setConfirm(e.target.value)} aria-label={tr("삭제할 캐릭터 이름")}/></label><button className="gold-button" disabled={busy || confirm !== remove?.name} onClick={async () => { await onChange({ action: 'delete', characterId: remove?.id, confirm }); setRemove(null); }}>{tr("캐릭터 삭제")}</button></DialogContent></Dialog></section>;
}

