import type {CSSProperties} from 'react';
export const UI_ICONS={bag:0,map:1,quest:2,skills:3,crown:4,chat:5,cash:6,settings:7,pet:8,hp:9,mp:10,sword:11,shield:12,ring:13,chest:14,star:15} as const;
export type CuteIconName=keyof typeof UI_ICONS;
export const PANEL_ICONS:Record<string,CuteIconName>={inventory:'bag',map:'map',quests:'quest',skills:'skills',character:'crown',chat:'chat',bubbles:'chat',cash:'cash',settings:'settings',petcare:'pet',animals:'pet',damage:'star',guide:'star',raid:'sword',menu:'chest',player:'crown',trade:'chest'};
export default function CuteIcon({name,size=36,className=''}:{name:CuteIconName;size?:number;className?:string}){const n=UI_ICONS[name];return <span aria-hidden="true" className={'cute-icon '+className} style={{width:size,height:size,backgroundPosition:`${(n%4)/3*100}% ${Math.floor(n/4)/3*100}%`} as CSSProperties}/>;}
