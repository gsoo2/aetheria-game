'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent,type KeyboardEvent as ReactKeyboardEvent} from 'react';
type Point={x:number;y:number};
export function useFloatingWindow(key:string,enabled=true){
 const [element,setElement]=useState<HTMLElement|null>(null),[position,setPosition]=useState<Point|null>(null);
 const current=useRef<Point|null>(null),drag=useRef<{id:number;x:number;y:number;left:number;top:number}|null>(null);
 const storageKey='aetheria-window-v1:'+key;
 const attach=useCallback((node:HTMLElement|null)=>setElement(node),[]);
 const clamp=useCallback((point:Point)=>{const rect=element?.getBoundingClientRect();const viewport=window.visualViewport;const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0,w=viewport?.width||window.innerWidth,h=viewport?.height||window.innerHeight;return {x:Math.max(left+8,Math.min(point.x,left+Math.max(8,w-(rect?.width||0)-8))),y:Math.max(top+8,Math.min(point.y,top+Math.max(8,h-(rect?.height||0)-8)))};},[element]);
 const update=useCallback((point:Point|null,save=false)=>{const next=point?clamp(point):null;current.current=next;setPosition(next);if(save)try{if(next)localStorage.setItem(storageKey,JSON.stringify(next));else localStorage.removeItem(storageKey);}catch{}},[clamp,storageKey]);
 useEffect(()=>{drag.current=null;let point:Point|null=null;try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))point=saved;}catch{}current.current=point;setPosition(point);},[storageKey]);
 useEffect(()=>{if(!element||!enabled)return;const fit=()=>{if(current.current)update(current.current);};const observer=new ResizeObserver(fit);observer.observe(element);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);fit();return()=>{observer.disconnect();window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);};},[element,enabled,update]);
 const reset=()=>update(null,true);
 const onPointerDown=(event:ReactPointerEvent<HTMLElement>)=>{if(!enabled||event.button!==0||!element)return;const rect=element.getBoundingClientRect();drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();};
 const onPointerMove=(event:ReactPointerEvent<HTMLElement>)=>{const start=drag.current;if(!start||start.id!==event.pointerId)return;update({x:start.left+event.clientX-start.x,y:start.top+event.clientY-start.y});event.stopPropagation();};
 const finish=(event:ReactPointerEvent<HTMLElement>)=>{if(drag.current?.id!==event.pointerId)return;drag.current=null;update(current.current,true);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 const onKeyDown=(event:ReactKeyboardEvent<HTMLElement>)=>{const moves:Record<string,Point>={ArrowLeft:{x:-20,y:0},ArrowRight:{x:20,y:0},ArrowUp:{x:0,y:-20},ArrowDown:{x:0,y:20}};const delta=moves[event.key];if(delta&&element){event.preventDefault();event.stopPropagation();const rect=element.getBoundingClientRect();update({x:rect.left+delta.x,y:rect.top+delta.y},true);}if(event.key==='Home'){event.preventDefault();reset();}};
 const style=enabled&&position?{'--floating-left':position.x+'px','--floating-top':position.y+'px','--floating-transform':'none'} as CSSProperties:undefined;
 return {attach,style,reset,handle:{onPointerDown,onPointerMove,onPointerUp:finish,onPointerCancel:finish,onLostPointerCapture:()=>{drag.current=null;},onDoubleClick:reset,onKeyDown}};
}
