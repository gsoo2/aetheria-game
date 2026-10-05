'use client';
import {tr} from '../../shared/i18n';
export type InterfaceMode='pc'|'mobile';
export default function InterfaceModeSwitch({mode,onChange}:{mode:InterfaceMode;onChange:(mode:InterfaceMode)=>void}){return <div className="interface-mode-switch" role="group" aria-label={tr('화면 모드 선택')}><button type="button" aria-pressed={mode==='pc'} onClick={()=>onChange('pc')}>{tr('PC 버전')}</button><button type="button" aria-pressed={mode==='mobile'} onClick={()=>onChange('mobile')}>{tr('모바일 버전')}</button></div>;}
