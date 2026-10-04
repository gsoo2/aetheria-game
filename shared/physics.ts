import {blocksFor,groundFor} from './content';
export const distance=(a:{x:number;y:number;zone?:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
export function movable(x:number,y:number,zone=0){return x>180&&x<1620&&y>140&&y<1020&&onGround(x,y,zone)&&!blocksFor(zone).some(b=>x>b.x-15&&x<b.x+b.w+15&&y>b.y-15&&y<b.y+b.h+15);}
export function clearSight(a:{x:number;y:number;zone?:number},b:{x:number;y:number;zone?:number}){const steps=Math.ceil(distance(a,b)/12);for(let i=1;i<=steps;i++){const t=i/steps;if(!movable(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.zone||0))return false;}return true;}
export function sweepMove(a:{x:number;y:number;zone?:number},dx:number,dy:number){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/10));for(let i=0;i<steps;i++){const x=a.x+dx/steps,y=a.y+dy/steps;if(movable(x,a.y,a.zone||0))a.x=x;if(movable(a.x,y,a.zone||0))a.y=y;}}
export function aimDirection(p:{x:number;y:number;face?:number},aim:{x:number;y:number}){const d=distance(p,aim);return d>.1?{x:(aim.x-p.x)/d,y:(aim.y-p.y)/d}:{x:p.face||1,y:0};}
export function inCone(p:{x:number;y:number},target:{x:number;y:number},aim:{x:number;y:number},cosine=-.2){const dir=aimDirection(p,aim),d=distance(p,target);return d<1||((target.x-p.x)*dir.x+(target.y-p.y)*dir.y)/d>=cosine;}
export function lineDistance(p:{x:number;y:number},target:{x:number;y:number},aim:{x:number;y:number}){const dir=aimDirection(p,aim);return {along:(target.x-p.x)*dir.x+(target.y-p.y)*dir.y,across:Math.abs((target.x-p.x)*dir.y-(target.y-p.y)*dir.x)};}

export function onGround(x:number,y:number,zone:number){const points=groundFor(zone);let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;const vx=b.x-a.x,vy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/(vx*vx+vy*vy)));if(Math.hypot(x-a.x-vx*t,y-a.y-vy*t)<12)return false;}return inside;}
