export const BUBBLES = [
    ['별샘', '✦', '#fff8e6', '#bfa578', 0], ['달빛', '☾', '#eee9ff', '#a995dc', 120], ['숲의 편지', '❧', '#edf9e9', '#84ad82', 180], ['빙하', '❄', '#e9f5ff', '#81b9dc', 220], ['장미', '❀', '#ffeaf1', '#d18caa', 260], ['화염', '✧', '#fff0de', '#d9945a', 300], ['황금 왕관', '♛', '#fff5cf', '#bd9644', 400], ['밤의 별', '✦', '#242c50', '#aba8e9', 450], ['바다', '≈', '#e0f7f4', '#66ada8', 500], ['벚꽃', '❀', '#fff0f1', '#e3a5ad', 550], ['흑요석', '◆', '#28272e', '#c9b897', 650], ['은하', '✧', '#eee5ff', '#b283d7', 800]
].map(([name, glyph, fill, border, price], id) => ({ id, name: String(name), glyph: String(glyph), fill: String(fill), border: String(border), price: Number(price),cashOnly:false }));
export type Offer = {
    indices: number[];
    items: number[];
    gold: number;
    confirmed: boolean;
};
export type Trade = {
    id: string;
    a: string;
    b: string;
    phase: 'request' | 'open';
    revision: number;
    expires: number;
    offers: Record<string, Offer>;
};
export const RAIDS = [{ zone: 25, name: '별의 파수꾼', level: 10, hp: 6500, atk: 18, xp: 500, gold: 350, sprite: 12, minutes: 8 }, { zone: 26, name: '월식의 심판자', level: 20, hp: 16000, atk: 27, xp: 1400, gold: 800, sprite: 13, minutes: 10 }, { zone: 27, name: '천공의 거신', level: 30, hp: 32000, atk: 38, xp: 2600, gold: 1400, sprite: 10, minutes: 12 }];
export type RaidBattle = {
    zone: number;
    started: number;
    ends: number;
    participants: string[];
    status: 'fight' | 'won' | 'failed';
    rewarded: boolean;
};

for(const [i,name,fill,border,glyph] of [[12,'천공의 약속','#fff6de','#b89655','✦'],[13,'붉은 월식','#391e31','#e18a9d','☾'],[14,'오로라의 편지','#defafa','#61b8b1','✧'],[15,'왕의 별자리','#2b2d48','#e3c98b','♛']] as const)BUBBLES.push({id:i,name,fill,border,glyph,price:0,cashOnly:true});
