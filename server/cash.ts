import { CASH_PRODUCTS, DONATION_PACKS, cashProductOwned, type ShopSettings } from '../shared/cash';
import type { Input, Player, World } from '../shared/types';
export function cashSettings(w: World): ShopSettings { return w.shopSettings || { donationGuide: '', donationUrl: '' }; }
export function cashInput(w: World, p: Player, i: Input, now: number) {
    if (i.action === 'donationRequest') {
        const pack = DONATION_PACKS[Number(i.value)];
        if (!pack)
            return;
        if (!cashSettings(w).donationGuide.trim()) {
            p.notice = '운영자가 후원 안내를 등록한 뒤 이용할 수 있습니다.';
            return;
        }
        w.donations ??= [];
        if (w.donations.some(d => d.playerId === p.id && d.status === 'pending')) {
            p.notice = '이미 확인을 기다리는 후원 요청이 있습니다.';
            return;
        }
        if (w.donations.filter(d => d.playerId === p.id).length >= 100) {
            p.notice = '운영자에게 직접 문의하세요.';
            return;
        }
        const reference = typeof i.reference === 'string' ? i.reference.replace(/[<>\x00-\x1f]/g, '').trim().slice(0, 100) : '';
        if (reference.length < 2) {
            p.notice = '후원자명 또는 결제 확인번호를 입력하세요.';
            return;
        }
        w.donations.push({ id: crypto.randomUUID(), playerId: p.id, name: p.name, pack: pack.id, won: pack.won, cash: pack.cash, reference, created: now, status: 'pending', revision: 0 });
        p.notice = '후원 확인 요청을 보냈습니다. 실제 결제 확인 후 GM이 캐시를 지급합니다.';
        return;
    }
    if (i.action === 'cashBuy') {
        const product = CASH_PRODUCTS.find(product=>product.id===i.value);
        if (!product)
            return;
        p.cashPurchases ??= [];
        if (cashProductOwned(p,product)) {
            p.notice = '이미 보유한 상품입니다.';
            return;
        }
        if ((p.cash || 0) < product.price) {
            p.notice = '캐시가 부족합니다. 후원 확인 후 지급받을 수 있습니다.';
            return;
        }
        if (product.kind === 'weapon' && p.inventory.length >= 60) {
            p.notice = '가방 공간이 부족합니다.';
            return;
        }
        if(product.kind==='weapon'&&product.value===44&&p.level<15){p.notice='레벨 15부터 구매할 수 있습니다.';return;}
        if(product.kind==='provisions'&&(p.potions+60>10000||p.manaPotions+40>10000)){p.notice='보급 포션을 받을 공간이 부족합니다.';return;}
        p.cash = (p.cash || 0) - product.price;
        if (!p.cashPurchases.includes(product.id))
            p.cashPurchases.push(product.id);
        if (product.kind === 'bubble') {
            p.bubbles ??= [0];
            if (!p.bubbles.includes(product.value))
                p.bubbles.push(product.value);
            p.bubbleId = product.value;
        }
        if(product.kind==='damageSkin'){p.damageSkins??=[];if(!p.damageSkins.includes(product.value))p.damageSkins.push(product.value);p.damageSkinId=product.value;}
        if (product.kind === 'title'){p.cashTitle=product.name;p.titleBadgeId=product.value;delete p.gmTitle;}
        if(product.kind==='titleBadge'){p.cashTitle=product.name;p.titleBadgeId=product.value;delete p.gmTitle;}
        if(product.kind==='animalSkin'){p.animalSkins??=[];p.animalSkins.push(product.value);p.animalSkinId=product.value;delete p.gmSkin;}
        if(product.kind==='wings'){p.wings??=[];p.wings.push(product.value);p.wingId=product.value;}
        if(product.kind==='pet'){p.pets??=[];p.pets.push(product.value);p.petId=product.value;p.petAutoLoot=true;}
        if(product.kind==='provisions'){p.potions+=60;p.manaPotions+=40;}
        if (product.kind === 'weapon')
            p.inventory.push((product.value||14) + p.classId);
        p.notice = product.name + ' 구매 완료';
        return;
    }
    if(i.action==='wingUnequip'){delete p.wingId;p.notice='날개를 해제했습니다.';return;}
    if (i.action === 'cashEquip') {
        const product = CASH_PRODUCTS.find(product=>product.id===i.value);
        if (product && cashProductOwned(p,product)) {
            if (product.kind === 'title'||product.kind==='titleBadge'){p.cashTitle=product.name;p.titleBadgeId=product.value;delete p.gmTitle;}
            if(product.kind==='animalSkin'){p.animalSkinId=product.value;delete p.gmSkin;}
            if(product.kind==='wings')p.wingId=product.value;
            if(product.kind==='pet')p.petId=product.value;
            if(product.kind==='damageSkin'&&p.damageSkins?.includes(product.value))p.damageSkinId=product.value;
            if (product.kind === 'bubble')
                p.bubbleId = product.value;
            p.notice = product.name + ' 적용';
        }
        if (i.value === -1) {
            delete p.cashTitle;delete p.titleBadgeId;delete p.gmTitle;
            p.notice = '칭호 표시를 해제했습니다.';
        }
    }
}
export function configureCash(w: World, body: ShopSettings) { if (typeof body.donationGuide !== 'string' || typeof body.donationUrl !== 'string')
    throw new Error('후원 안내를 입력하세요.'); const guide = body.donationGuide.trim().slice(0, 500), value = body.donationUrl.trim(); if (value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('후원 링크는 HTTPS 주소여야 합니다.');
} w.shopSettings = { donationGuide: guide, donationUrl: value }; return w.shopSettings; }
export function approveDonation(w: World, body: {
    id: string;
    revision: number;
    approve: boolean;
    confirmReceived?: boolean;
}, now: number) { const d = w.donations?.find(d => d.id === body.id); if (!d)
    throw new Error('요청을 찾을 수 없습니다.'); if (d.status !== 'pending' || body.revision !== d.revision)
    throw new Error('이미 처리되었거나 변경된 요청입니다.'); if (typeof body.approve !== 'boolean')
    throw new Error('승인 또는 거절을 선택하세요.'); const p = w.players[d.playerId]; if (!p)
    throw new Error('대상 캐릭터가 없습니다.'); if (body.approve && body.confirmReceived !== true)
    throw new Error('실제 후원 결제 확인이 필요합니다.'); const before = p.cash || 0; if (body.approve && before + d.cash > 1000000000)
    throw new Error('캐시 보유 한도를 넘습니다.'); if (body.approve)
    p.cash = before + d.cash; d.status = body.approve ? 'approved' : 'rejected'; d.revision++; d.processed = now; p.gmRevision = (p.gmRevision || 0) + 1; p.notice = body.approve ? `후원 확인 완료! ${d.cash} 캐시가 지급되었습니다.` : '후원 확인 요청이 거절되었습니다. 운영자에게 문의하세요.'; w.gmAudit ??= []; w.gmAudit.push({ id: crypto.randomUUID(), at: now, playerId: p.id, name: p.name, action: body.approve ? 'donationApprove' : 'donationReject', reason: d.id, before: { cash: before, status: 'pending' }, after: { cash: p.cash || 0, status: d.status, won: d.won, reference: d.reference } }); w.gmAudit = w.gmAudit.slice(-500); return d; }
