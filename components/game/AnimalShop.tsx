import {ANIMAL_ATLASES,ANIMAL_SKINS} from '../../shared/animal-skins';
import type {Input,Player} from '../../shared/types';
import {tr} from '../../shared/i18n';
const GOLD_SKINS=ANIMAL_SKINS.filter(skin=>!skin.gmOnly&&skin.currency==='gold');
export default function AnimalShop({player:p,send}:{player:Player;send:(input:Input)=>void;onCash:()=>void}){
 const active=p.gmSkin??p.animalSkinId;
 return <div className="animal-shop"><p className="subtle">{tr('골드로 구매하는 동물 스킨입니다. 보유한 스킨은 캐릭터 창에서 갈아입을 수 있습니다.')}</p><div className="shop-wallet">{p.gold.toLocaleString()} G</div><button className="outline-button" disabled={active===undefined} onClick={()=>send({action:'animalEquip',value:-1})}>{tr('기본 수호자 모습')}</button><div className="animal-skin-grid">{GOLD_SKINS.map(skin=>{const owned=p.animalSkins?.includes(skin.id),equipped=active===skin.id;return <article key={skin.id} className={'animal-skin-card '+(equipped?'equipped':'')}><div role="img" aria-label={tr(skin.name)} className="animal-skin-preview" style={{backgroundImage:`url(${ANIMAL_ATLASES[skin.atlas]})`,backgroundPosition:`0% ${skin.row/3*100}%`}}/><h3>{tr(skin.name)}</h3><small>{tr('영구 소장 · 골드 스킨')}</small><button className={equipped?'outline-button':'gold-button'} disabled={equipped||(!owned&&p.gold<skin.price)} onClick={()=>send({action:owned?'animalEquip':'animalBuy',value:skin.id})}>{tr(equipped?'적용 중':owned?'갈아입기':`${skin.price} G · 구매`)}</button></article>;})}</div></div>;
}
