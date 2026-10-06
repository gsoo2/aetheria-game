'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import CuteIcon from './CuteIcon';
import {tr} from '../../shared/i18n';
export default function MobileControls({onMove,onAttack,onInteract,onLoot,disabled}:{onMove:(x:number,y:number)=>void;onAttack:()=>void;onInteract:()=>void;onLoot:()=>void;disabled:boolean}){
 const pad=useRef<HTMLDivElement>(null),pointer=useRef<number|null>(null),move=useRef(onMove),[position,setPosition]=useState({x:0,y:0});move.current=onMove;
 const release=()=>{pointer.current=null;setPosition({x:0,y:0});move.current(0,0);};
 useEffect(()=>{const stop=()=>{pointer.current=null;setPosition({x:0,y:0});move.current(0,0);};window.addEventListener('blur',stop);const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);return()=>{move.current(0,0);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);};},[]);
 const update=(e:PointerEvent<HTMLDivElement>)=>{if(pointer.current!==e.pointerId||!pad.current)return;const r=pad.current.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,length=Math.hypot(dx,dy),scale=length>40?40/length:1;setPosition({x:dx*scale,y:dy*scale});move.current(length<10?0:dx/Math.max(length,40),length<10?0:dy/Math.max(length,40));};
 return <div className="mobile-play-controls"><div ref={pad} role="group" aria-label={tr('이동 조이스틱')} className="mobile-joystick" onPointerDown={e=>{if(disabled||pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={update} onPointerUp={e=>{if(pointer.current===e.pointerId)release();}} onPointerCancel={release} onLostPointerCapture={release}><span className="joystick-ring"/><span className="joystick-knob" style={{transform:'translate('+position.x+'px,'+position.y+'px)'}}/><small>{tr('이동')}</small></div><div className="mobile-action-pad"><button className="mobile-attack" disabled={disabled} onClick={onAttack}><CuteIcon name="sword" size={36}/>{tr('공격')}</button><div><button disabled={disabled} onClick={onInteract}>{tr('대화 / 이동')}</button><button disabled={disabled} onClick={onLoot}><CuteIcon name="chest" size={24}/>{tr('줍기')}</button></div></div></div>;
}

