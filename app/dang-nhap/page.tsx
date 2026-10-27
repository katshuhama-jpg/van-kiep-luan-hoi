'use client';

import { track } from '@/lib/track';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sprite from '@/components/Sprite';
import { currentPlayer, normalizeUsername, signIn, signUp } from '@/lib/auth';
import { carryGuest } from '@/lib/storage';
import { demoChar } from '@/lib/game/demo';
import { useAuth } from '@/lib/useAuth';

const demo = demoChar({ path: 'kiem', equipped: { ao: 'thanh_sam', vu_khi: 'thanh_phong' } });

export default function LoginPage() {
  const router = useRouter();
  const { enabled } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<string | null>(null);
  // tên thật sẽ dùng sau khi bỏ dấu, viết thường, bỏ khoảng trắng
  const norm = normalizeUsername(username);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuggest(null);
    if (norm !== username) setUsername(norm);
    const err = mode === 'in' ? await signIn(norm, password) : await signUp(norm, password);
    setBusy(false);
    if (err) {
      setError(err);
      if (mode === 'up' && err.includes('đã có người dùng')) setSuggest(`${norm.slice(0, 13)}${10 + Math.floor(Math.random() * 90)}`);
      track('auth_fail', { mode, err: String(err).slice(0, 80) });
      return;
    }
    track(mode === 'in' ? 'login' : 'signup');
    // tài khoản mới: chuyển tiến độ chơi thử trên máy (nếu có) vào tài khoản
    if (mode === 'up') await carryGuest(currentPlayer()).catch(() => {});
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next && next.startsWith('/') ? next : '/choi');
  }

  return (
    <main className="app title-screen">
      <div className="showcase" style={{ height: 130 }}>
        <Sprite c={demo} size={130} />
      </div>
      <h1 className="logo" style={{ fontSize: 44 }}>
        {mode === 'in' ? 'Nhập Môn' : 'Bái Sư'}
        <small>{mode === 'in' ? 'Đạo hữu quay lại rồi sao?' : 'Ghi danh vào sổ luân hồi'}</small>
      </h1>

      <form className="panel" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
            Đăng nhập
          </button>
          <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
            Đăng ký
          </button>
        </div>

        {!enabled && <p className="error">Chưa kết nối được máy chủ, thử lại sau ít phút.</p>}
        <p className="note" style={{ margin: 0 }}>
          Cần một tài khoản để vào luân hồi. Tiến độ được lưu trên mây, đổi máy vẫn chơi tiếp được.
        </p>

        <label className="field">
          <span>Tên đăng nhập</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => norm && setUsername(norm)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            placeholder="vd: thanhvan"
            required
          />
          {username && norm !== username ? (
            <small className="note">
              Tên sẽ dùng: <b>{norm || '...'}</b>
            </small>
          ) : (
            <small className="note">3-16 ký tự. Gõ có dấu hay viết hoa cũng được, game tự chuyển thành chữ thường không dấu.</small>
          )}
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            minLength={3}
            maxLength={6}
            required
          />
          <small className="note">3-6 ký tự</small>
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        {suggest && (
          <button type="button" className="btn" onClick={() => (setUsername(suggest), setSuggest(null), setError(null))}>
            Dùng tên {suggest}
          </button>
        )}

        <button className="btn btn-red btn-big" disabled={busy || !enabled}>
          {busy ? 'Đang vận công...' : mode === 'in' ? 'Vào game' : 'Tạo tài khoản'}
        </button>
      </form>

      <div className="menu">
        <Link href="/" className="note">
          ‹ Về trang đầu
        </Link>
      </div>
    </main>
  );
}
