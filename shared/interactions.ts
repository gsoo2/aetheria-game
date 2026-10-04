import {NPCS,portalsFor} from './content';
export function interactionAt(zone:number,position:{x:number;y:number}){
 const candidates=[...NPCS.filter(n=>n.zone===zone).map(n=>({kind:'npc' as const,id:n.id,distance:Math.hypot(n.x-position.x,n.y-position.y)})),...portalsFor(zone).map((p,index)=>({kind:'portal' as const,id:index,distance:Math.hypot(p.x-position.x,p.y-position.y)}))];
 return candidates.filter(c=>c.distance<160).sort((a,b)=>a.distance-b.distance||(a.kind==='portal'?-1:1))[0];
}
