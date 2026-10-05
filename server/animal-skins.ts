import {ANIMAL_SKINS} from '../shared/animal-skins';
import type {Input,Player} from '../shared/types';
export function animalSkinInput(p:Player,input:Input){
 if(input.action==='animalEquip'&&input.value===-1){delete p.animalSkinId;delete p.gmSkin;p.notice='기본 수호자 모습으로 돌아왔습니다.';return;}
 const skin=ANIMAL_SKINS.find(s=>s.id===input.value);if(!skin)return;
 if(input.action==='animalBuy'&&skin.currency==='gold'){
  p.animalSkins??=[];if(p.animalSkins.includes(skin.id)){p.notice='이미 보유한 동물 스킨입니다.';return;}
  if(p.gold<skin.price){p.notice='골드가 부족합니다.';return;}
  p.gold-=skin.price;p.animalSkins.push(skin.id);p.animalSkinId=skin.id;delete p.gmSkin;p.notice=skin.name+' 구매 · 전신 스킨 적용 완료';
 }
 if(input.action==='animalEquip'&&p.animalSkins?.includes(skin.id)){p.animalSkinId=skin.id;delete p.gmSkin;p.notice=skin.name+' 스킨을 적용했습니다.';}
}
