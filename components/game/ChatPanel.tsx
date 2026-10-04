'use client';
import {useEffect,useRef} from 'react';
import {MessageSquare,Send} from 'lucide-react';
import {tr} from '../../shared/i18n';
import type {Snapshot} from '../../shared/types';
export default function ChatPanel({messages,draft,onDraft,onSend,onFocus,sending=false,drawer=false}:{messages:Snapshot['chat'];draft:string;onDraft:(text:string)=>void;onSend:()=>void;onFocus:()=>void;sending?:boolean;drawer?:boolean}){
 const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.at(-1)?.id]);
 return <section className={'chat-panel glass '+(drawer?'chat-drawer':'')}>
  {!drawer&&<div className="chat-heading"><MessageSquare size={13}/><span>{tr('세계 채팅')}</span><small>{tr('Enter로 전송')}</small></div>}
  <div className="chat-log" role="log" aria-label={tr('세계 채팅')} aria-live="polite"><div className="system-chat">{tr('별샘에 오신 것을 환영합니다. 함께 모험하세요.')}</div>{messages.map(message=><div key={message.id}><b>{message.name}</b><span>{message.text}</span></div>)}<div ref={end}/></div>
  <form onSubmit={event=>{event.preventDefault();onSend();}}><input aria-label={tr('채팅 메시지')} placeholder={tr('세계에 말을 건네세요…')} maxLength={120} value={draft} onFocus={onFocus} onChange={event=>onDraft(event.target.value)} autoComplete="off" enterKeyHint="send"/><button type="submit" disabled={sending||!draft.trim()} aria-label={tr('채팅 보내기')}><Send size={17}/>{drawer&&<span>{tr(sending?'전송 중…':'보내기')}</span>}</button></form>
 </section>;
}
