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
    { id: 9, name: '천상의 맹세', description: '은빛과 금빛의 숫자 데미지 스킨 · 능력치 변화 없음', price: 300, kind: 'damageSkin', value: 5, image: '' }
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
