import {ANIMAL_ATLASES,ANIMAL_SKINS} from '../../shared/animal-skins';
import {WINGS_ATLAS,CREATURES_ATLAS,SHOP_ICONS_ATLAS} from '../../shared/premium';
import type {CashProduct} from '../../shared/cash';
import {tr} from '../../shared/i18n';
export default function ProductArt({product:p,classId}:{product:CashProduct;classId:number}){
 let src:string=SHOP_ICONS_ATLAS,cols=4,rows=2,col=0,row=0;
 if(p.kind==='animalSkin'){const skin=ANIMAL_SKINS.find(s=>s.id===p.value)!;src=ANIMAL_ATLASES[skin.atlas];cols=8;rows=4;row=skin.row;}
 else if(p.kind==='wings'){src=WINGS_ATLAS;rows=3;row=p.value;}
 else if(p.kind==='pet'){src=CREATURES_ATLAS;rows=6;row=p.value-3;}
 else if(p.kind==='titleBadge')col=p.value;
 else if(p.kind==='title')col=p.value;
 else if(p.kind==='weapon'){row=1;col=classId;}
 else if(p.kind==='provisions')col=3;
 return <div role="img" aria-label={tr(p.name)} className={'cash-sprite-art '+(p.kind==='wings'?'wing-preview':'')} style={{backgroundImage:`url(${src})`,backgroundSize:`${cols*100}% ${rows*100}%`,backgroundPosition:`${col/(cols-1)*100}% ${row/(rows-1)*100}%`}}/>;
}
