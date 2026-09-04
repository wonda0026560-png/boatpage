import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { api } from '../../lib/api';

type AuthState = 'checking' | 'in' | 'out';

/**
 * 관리자 화면 공통 껍데기.
 * 로그인 확인 → 안 되어 있으면 비밀번호 폼, 되어 있으면 내용을 보여준다.
 * 검색엔진이 긁지 않도록 noindex 를 붙이고, 사이트 커스텀 커서는 폼에 방해가 되어 끈다.
 */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>('checking');
  const [dbReady, setDbReady] = useState(true);

  useEffect(() => {
    // index.html 에 이미 robots 메타가 있으므로 새로 붙이지 말고 그 값을 바꾼다.
    // 두 개가 공존하면 크롤러마다 해석이 달라진다.
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const original = meta.content;
    meta.content = 'noindex, nofollow';
    return () => {
      if (created) meta.remove();
      else meta.content = original;
    };
  }, []);

  useEffect(() => {
    api.admin
      .me()
      .then((r) => {
        setDbReady(r.db);
        setAuth('in');
      })
      .catch(() => setAuth('out'));
  }, []);

  const logout = async () => {
    await api.admin.logout();
    setAuth('out');
  };

  return (
    <div className="admin-page">
      <Header />
      <main className="admin">
        <div className="admin-bar">
          <div>
            <p className="admin-bar__eyebrow">관리자</p>
            <h1 className="admin-bar__title">{title}</h1>
          </div>
          {auth === 'in' && (
            <div className="admin-bar__actions">
              <Link to="/admin" className="admin-btn">
                글 목록
              </Link>
              <Link to="/board" className="admin-btn">
                게시판 보기
              </Link>
              <button type="button" className="admin-btn" onClick={logout}>
                로그아웃
              </button>
            </div>
          )}
        </div>

        {auth === 'checking' && <p className="admin-note">확인 중…</p>}
        {auth === 'out' && <AdminLogin onSuccess={() => setAuth('in')} />}
        {auth === 'in' && !dbReady && (
          <p className="admin-alert">
            DATABASE_URL 이 설정되지 않아 글을 저장할 수 없습니다. Railway 에서 Postgres 를
            연결해 주세요.
          </p>
        )}
        {auth === 'in' && children}
      </main>
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.login(password);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <label className="admin-field">
        <span className="admin-field__label">비밀번호</span>
        <input
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
      </label>
      {error && <p className="admin-error">{error}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? '확인 중…' : '로그인'}
      </button>
    </form>
  );
}
