import {accountFor} from './accounts';
import type {World} from './types';
export function linkGoogleAccount(w:World,accountId:string,guestId:string|null,profile:{name:string;email:string}){
 const target=accountFor(w,accountId);target.google={name:profile.name.slice(0,100),email:profile.email.slice(0,254)};
 if(!guestId||guestId===accountId)return;
 const guest=accountFor(w,guestId);if(guest.google)return;
 const incoming=guest.characters.filter(id=>!!w.players[id]&&!target.characters.includes(id));
 target.characters.push(...incoming);
 // Purchased slots and every character survive a merge, including two full rosters.
 target.slots=Math.max(target.slots,guest.slots,target.characters.length);
 if(!target.active)target.active=guest.active&&target.characters.includes(guest.active)?guest.active:target.characters[0]||null;
 guest.characters=[];guest.active=null;
}
