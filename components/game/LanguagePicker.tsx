'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { Globe } from 'lucide-react';
import { getLanguage, getServerLanguage, subscribeLanguage, setLanguage, restoreLanguage, type Language } from '../../shared/i18n';
export function useLanguage() { return useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage); }
export default function LanguagePicker() {
    const language = useLanguage();
    useEffect(() => { restoreLanguage(); }, []);
    return <label className="language-picker"><Globe size={16} aria-hidden="true"/><select aria-label="언어 / Language / 言語" value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="ko">한국어</option><option value="ja">日本語</option><option value="en">English</option></select></label>;
}
