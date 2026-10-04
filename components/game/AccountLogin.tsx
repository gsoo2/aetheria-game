'use client';
import { tr } from '../../shared/i18n';
import { useEffect, useState } from 'react';
type LoginState = {
    googleEnabled: boolean;
    provider: 'guest' | 'google';
    profile: {
        name: string;
        email: string;
    } | null;
};
export default function AccountLogin() {
    const [state, setState] = useState<LoginState | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    useEffect(() => {
        let stop = false;
        fetch('/api/auth/session').then(async (r) => {
            if (!r.ok)
                throw new Error('로그인 정보를 불러오지 못했습니다.');
            return r.json() as Promise<LoginState>;
        }).then(s => {
            if (!stop)
                setState(s);
        }).catch(e => {
            if (!stop)
                setError(e.message);
        });
        const url = new URL(location.href), login = url.searchParams.get('login');
        const messages: Record<string, string> = { setup: '구글 로그인은 운영자가 연결 설정을 마치면 사용할 수 있습니다.', cancelled: '구글 로그인을 취소했습니다.', failed: '로그인하지 못했습니다. 다시 시도해 주세요.' };
        if (login && messages[login])
            queueMicrotask(() => {
                if (!stop)
                    setError(messages[login]);
            });
        if (login) {
            url.searchParams.delete('login');
            history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
        return () => { stop = true; };
    }, []);
    const logout = async () => {
        setBusy(true);
        try {
            const r = await fetch('/api/auth/logout', { method: 'POST' });
            if (!r.ok)
                throw new Error('로그아웃하지 못했습니다.');
            location.assign('/');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : '잠시 후 다시 시도하세요.');
            setBusy(false);
        }
    };
    return <section className="account-login" aria-label={tr("로그인 및 서버 저장")}>
  <div><strong>{tr(state?.provider === 'google' ? '구글 계정으로 연결됨' : '계정 연결 · 서버 저장')}</strong><p>{tr(state?.provider === 'google' ? `${state.profile?.email} · 같은 계정으로 다른 기기에서도 이어서 플레이하세요.` : '구글 계정에 연결하면 캐릭터·레벨·장비·퀘스트를 다른 기기에서도 불러올 수 있습니다.')}</p></div>
  {state?.provider === 'google' ? <button className="outline-button" disabled={busy} onClick={() => void logout()}>{tr("로그아웃")}</button> : <a className={'google-login-button ' + (!state?.googleEnabled ? 'unavailable' : '')} href={state?.googleEnabled ? '/api/auth/google' : undefined} aria-disabled={!state?.googleEnabled} title={tr(!state?.googleEnabled ? '구글 계정 연결 준비 중' : undefined)}><span aria-hidden="true">G</span>{tr(!state ? '로그인 확인 중' : state.googleEnabled ? 'Google로 로그인' : '구글 로그인 준비 중')}</a>}
  {state?.provider !== 'google' && <small>{tr("지금은 게스트로 플레이해도 서버에 저장됩니다. 로그인하면 기존 게스트 캐릭터도 계정에 연결됩니다.")}</small>}
  {tr(error && <p className="account-login-error" role="status">{tr(error)}</p>)}
 </section>;
}
