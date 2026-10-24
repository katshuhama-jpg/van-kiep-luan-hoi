'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sprite from '@/components/Sprite';
import { signIn, signUp } from '@/lib/auth';
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = mode === 'in' ? await signIn(username, password) : await signUp(username, password);
    setBusy(false);
    if (err) setError(err);
    else router.push('/choi');
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

        {!enabled && <p className="error">Chưa cấu hình máy chủ, tạm thời chỉ chơi được ở chế độ khách.</p>}

        <label className="field">
          <span>Tên đăng nhập</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={16}
            placeholder="vd: thanhvan"
            required
          />
          <small className="note">3-16 ký tự: chữ thường không dấu, số, dấu _</small>
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

        <button className="btn btn-red btn-big" disabled={busy || !enabled}>
          {busy ? 'Đang vận công...' : mode === 'in' ? 'Vào game' : 'Tạo tài khoản'}
        </button>
      </form>

      <div className="menu">
        <Link className="btn" href="/choi" style={{ textDecoration: 'none', display: 'block' }}>
          Chơi thử không cần tài khoản
        </Link>
        <Link href="/" className="note">
          ‹ Về trang đầu
        </Link>
      </div>
    </main>
  );
}
