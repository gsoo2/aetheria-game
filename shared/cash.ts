import {ANIMAL_SKINS} from './animal-skins';
import {WINGS,TITLE_BADGES} from './premium';
import type {Player} from './types';
export const CASH_PRODUCTS = [
    { id: 0, name: '천공의 약속', description: '금빛 별 문양의 후원 전용 말풍선', price: 200, kind: 'bubble', value: 12, image: '/bubbles/12.svg' },
    { id: 1, name: '붉은 월식', description: '붉은 보석을 품은 후원 전용 말풍선', price: 250, kind: 'bubble', value: 13, image: '/bubbles/13.svg' },
    { id: 2, name: '오로라의 편지', description: '청록빛 오로라 문양의 후원 전용 말풍선', price: 300, kind: 'bubble', value: 14, image: '/bubbles/14.svg' },
    { id: 3, name: '왕의 별자리', description: '왕관과 별이 장식된 후원 전용 말풍선', price: 350, kind: 'bubble', value: 15, image: '/bubbles/15.svg' },
    { id: 4, name: '별의 후원자', description: '캐릭터 이름 옆에 표시하는 영구 칭호', price: 300, kind: 'title', value: 0, image: '' },
    { id: 5, name: '새벽의 수호자', description: '새로운 새벽을 여는 후원자 칭호', price: 450, kind: 'title', value: 1, image: '' },
    { id: 6, name: '전설 무기 상자', description: '현재 직업에 맞는 전설 무기 1개', price: 500, kind: 'weapon', value: 0, image: '' },
    { id: 7, name: '별가루 오로라', description: '보랏빛 별가루 숫자 데미지 스킨 · 능력치 변화 없음', price: 200, kind: 'damageSkin', value: 3, image: '' },
    { id: 8, name: '태양의 불꽃', description: '붉은 불꽃 숫자 데미지 스킨 · 능력치 변화 없음', price: 250, kind: 'damageSkin', value: 4, image: '' },
    { id: 9, name: '천상의 맹세', description: '은빛과 금빛의 숫자 데미지 스킨 · 능력치 변화 없음', price: 300, kind: 'damageSkin', value: 5, image: '' },
    ...ANIMAL_SKINS.filter(s=>s.currency==='cash').map((s,i)=>({id:10+i,name:s.name,description:'영구 소장 · 동물 전신 변신과 걷기·공격·쓰러짐 모션',price:s.price,kind:'animalSkin' as const,value:s.id,image:''})),
    ...WINGS.map((w,i)=>({id:16+i,name:w.name,description:'등에서 반짝이며 움직이는 영구 날개 · 능력치 변화 없음',price:w.price,kind:'wings' as const,value:w.id,image:''})),
    ...TITLE_BADGES.map((t,i)=>({id:19+i,name:t.name,description:'이름 위에 반짝이는 이미지 배지를 표시하는 영구 칭호',price:t.price,kind:'titleBadge' as const,value:t.id,image:''})),
    {id:22,name:'꿀빛 코기',description:'영구 동행 펫 · 전리품 줍기와 맡긴 포션 자동 회복',price:180,kind:'pet',value:3,image:''},
    {id:23,name:'별구름 아기 용',description:'영구 동행 펫 · 전리품 줍기와 맡긴 포션 자동 회복',price:300,kind:'pet',value:4,image:''},
    {id:24,name:'천공의 수호 무기',description:'현재 직업 무기 1개 · LV.15 · 공격 +24, HP +15 · 캐릭터 귀속. 가방에서 장착하세요.',price:700,kind:'weapon',value:44,image:''},
    {id:25,name:'모험가 포션 보급 상자',description:'고정 구성: 생명 포션 60개 + 마나 포션 40개. 펫에게 맡겨 자동 회복에 사용하세요.',price:100,kind:'provisions',value:0,image:''}
] as const;
export const DONATION_PACKS = [{ id: 0, won: 3000, cash: 300 }, { id: 1, won: 5000, cash: 500 }, { id: 2, won: 10000, cash: 1000 }];
export type Donation = {
    id: string;
    playerId: string;
    name: string;
    pack: number;
    won: number;
    cash: number;
    reference: string;
    created: number;
    status: 'pending' | 'approved' | 'rejected';
    revision: number;
    processed?: number;
};
export type ShopSettings = {
    donationGuide: string;
    donationUrl: string;
};

export type CashProduct=typeof CASH_PRODUCTS[number];
export function cashProductOwned(p:Player,product:CashProduct){
 if(product.kind==='weapon'||product.kind==='provisions')return false;
 if(product.kind==='animalSkin')return !!p.animalSkins?.includes(product.value);
 if(product.kind==='wings')return !!p.wings?.includes(product.value);
 if(product.kind==='pet')return !!p.pets?.includes(product.value);
 return !!p.cashPurchases?.includes(product.id);
}
