import { useEffect, useState } from 'react';
import { ApiError, getProfile, logout } from './api';
import type { User } from './types';
import AuthDialog from './components/AuthDialog';
import type { AuthMode } from './components/AuthDialog';
import LoadingBar from './components/LoadingBar';
import Chat from './Chat';
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [busy, setBusy] = useState('Проверяем вход…');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getProfile().then((value) => { if (active) setUser(value); }).catch((cause) => {
      if (active && !(cause instanceof ApiError && cause.status === 401)) setError(cause.message);
    }).finally(() => { if (active) setBusy(''); });
    return () => { active = false; };
  }, []);
  async function leave() {
    setUser(null); setBusy('Выходим…'); setError('');
    try { await logout(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Сервер не подтвердил выход. Повторите выход.'); }
    finally { setBusy(''); }
  }
  return <>
    <header className="site-header"><div className="page-width header-inner"><strong>Thunder bend — чат</strong>
      <button className="button button-outline" disabled={Boolean(busy)} onClick={() => void leave()}>Выйти</button>
    </div></header><LoadingBar message={busy} />
    {error && <p className="page-width message error" role="alert">{error}</p>}
    {user ? <Chat key={user.id} /> : <main className="page-width profile-page"><h1>Чат музыкальной группы</h1>
      <p>Войдите или создайте аккаунт, чтобы писать сообщения.</p>
      <button className="button button-accent" disabled={Boolean(busy)} onClick={() => setMode('login')}>Войти</button>{' '}
      <button className="button button-outline" disabled={Boolean(busy)} onClick={() => setMode('register')}>Регистрация</button>
    </main>}
    {mode && <AuthDialog mode={mode} onModeChange={setMode} onClose={() => setMode(null)} onLogin={(value) => { setUser(value); setMode(null); setError(''); }} />}
  </>;
}
