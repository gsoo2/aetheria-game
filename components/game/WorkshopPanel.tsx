'use client';
import { tr } from '../../shared/i18n';
import type { Input, Player } from '../../shared/types';
import { ITEMS, type Npc, NPCS } from '../../shared/content';
import { MATERIALS, RECIPES } from '../../shared/workshop';
import { PETS } from '../../shared/pets';
export default function WorkshopPanel({ player: p, npc: n, send, navigate, sprites }: {
    player: Player;
    npc: Npc;
    send: (i: Input) => void;
    navigate: (s: 'map' | 'guide' | 'skills') => void;
    sprites: string[];
}) {
    const trade = (action: string, value: number) => send({ action, value });
    return <div className="workshop-panel"><div className="workshop-intro"><img src={sprites[n.sprite]} alt={tr(n.name)}/><div><h3>{tr(n.role)}</h3><p>{tr(n.service === 'forge' ? '별철과 정령의 힘으로 장비 숙련을 높여 드립니다.' : n.service === 'alchemy' ? '모은 재료를 물약과 장비로 바꾸어 보세요.' : n.service === 'materials' ? '남는 장비를 분해하면 제작 재료를 얻을 수 있습니다.' : n.service === 'storage' ? '귀중한 물건을 안전하게 보관해 드립니다.' : n.service === 'pets' ? '모험을 함께할 작은 친구를 만나 보세요.' : '별샘 광장에 오신 것을 환영합니다.')}</p><b>{tr(p.gold.toLocaleString())} G</b></div></div><div className="material-wallet">{MATERIALS.map((name, i) => <span key={name}>{tr(name)} <b>{p.materials?.[i] || 0}</b></span>)}</div>
 {n.service === 'forge' && <><p className="subtle">{tr("강화는 항상 성공합니다. 최대 +5 · 단계마다 LV3 필요. 해당 캐릭터의 같은 종류 장비에 적용되며 거래·창고 이동으로 다른 캐릭터에게 이전되지 않습니다.")}</p>{(['weapon', 'armor', 'ring'] as const).map((slot, i) => {
                const id = p.equipment[slot];
                if (id === null)
                    return <p key={slot}>{tr("장비를 장착하세요.")}</p>;
                const rank = p.enhancements?.[id] || 0;
                return <div className="workshop-row" key={slot}><span>{tr(ITEMS[id].name)} <b>+{rank}</b><small>{80 * (rank + 1)}{tr(" G · 별철 ")}{3 * (rank + 1)}{tr(" · 정령 ")}{2 * (rank + 1)}</small></span><button className="gold-button" disabled={rank >= 5 || p.level < (rank + 1) * 3 || p.gold < 80 * (rank + 1) || (p.materials?.[0] || 0) < 3 * (rank + 1) || (p.materials?.[1] || 0) < 2 * (rank + 1)} onClick={() => trade('enhance', i)}>{tr("숙련 강화")}</button></div>;
            })}</>}
 {n.service === 'alchemy' && RECIPES.map((r, i) => <div className="workshop-row" key={r.name}><span>{tr(r.name)}<small>{r.gold} G · {tr(r.cost.map((v, k) => v ? `${MATERIALS[k]} ${v}` : '').filter(Boolean).join(' / '))}</small></span><button className="gold-button" disabled={p.gold < r.gold || r.cost.some((v, k) => (p.materials?.[k] || 0) < v) || r.kind === 'weapon' && (p.level < 5 || p.inventory.length >= 60)} onClick={() => trade('craft', i)}>{tr("제작")}</button></div>)}
 {n.service === 'materials' && <><h3>{tr("재료 구매")}</h3>{MATERIALS.map((name, i) => <div className="workshop-row" key={name}><span>{tr(name)} ×3</span><button className="outline-button" disabled={p.gold < 50} onClick={() => trade('materialBuy', i)}>50 G</button></div>)}<h3>{tr("장비 분해 · 되돌릴 수 없습니다")}</h3>{p.inventory.map((id, i) => !Object.values(p.equipment).includes(id) && <div className="workshop-row" key={i}><span>{tr(ITEMS[id].name)}<small>{tr("별철 ")}{2 + ITEMS[id].rarity * 2}{tr(" · 정령 ")}{1 + ITEMS[id].rarity}</small></span><button className="outline-button" onClick={() => {
                    if (window.confirm(tr(ITEMS[id].name) + tr('을 분해할까요? 장비는 소모됩니다.')))
                        trade('salvage', i);
                }}>{tr("분해")}</button></div>)}</>}
 {n.service === 'storage' && <><h3>{tr("창고 ")}{p.storage?.length || 0} / 60</h3>{(p.storage || []).map((id, i) => <div className="workshop-row" key={i}><span>{tr(ITEMS[id].name)}</span><button className="outline-button" disabled={p.inventory.length >= 60} onClick={() => trade('withdraw', i)}>{tr("꺼내기")}</button></div>)}<h3>{tr("가방 ")}{p.inventory.length} / 60</h3>{p.inventory.map((id, i) => !Object.values(p.equipment).includes(id) && <div className="workshop-row" key={i}><span>{tr(ITEMS[id].name)}</span><button className="outline-button" disabled={(p.storage?.length || 0) >= 60} onClick={() => trade('store', i)}>{tr("보관")}</button></div>)}</>}
 {n.service === 'pets' && PETS.map(pet => <div className="workshop-row" key={pet.id}><span>{tr(pet.name)}<small>{tr(pet.description)}</small></span><button className="gold-button" disabled={!p.pets?.includes(pet.id) && p.gold < pet.price} onClick={() => trade(p.pets?.includes(pet.id) ? 'equipPet' : 'buyPet', pet.id)}>{tr(p.pets?.includes(pet.id) ? p.petId === pet.id ? '동행 중' : '불러내기' : pet.price + ' G')}</button></div>)}
 {n.service === 'guide' && <><div className="dialog-actions"><button className="gold-button" onClick={() => navigate('map')}>{tr("월드맵")}</button><button className="outline-button" onClick={() => navigate('skills')}>{tr("스킬")}</button><button className="outline-button" onClick={() => navigate('guide')}>{tr("조작 안내")}</button></div>{NPCS.filter(a => a.zone === p.zone).map(a => <div className="workshop-row" key={a.id}><span>{tr(a.name)}<small>{tr(a.role)}{tr(" · 광장 좌표 ")}{a.x}, {a.y}</small></span></div>)}</>}
 </div>;
}
