'use client';

import { track } from '@/lib/track';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import { currentPlayer, googleSignIn, googleSignUp, signIn, signUp, usernameIssue } from '@/lib/auth';
import { googleError, googleOn } from '@/lib/google';
import { GoogleButton } from '@/components/GoogleAuth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { carryGuest } from '@/lib/storage';
import { demoChar } from '@/lib/game/demo';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

const demo = demoChar({ path: 'kiem', equipped: { ao: 'thanh_sam', vu_khi: 'thanh_phong' } });

export default function LoginPage() {
  const router = useRouter();
  const { enabled } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  // từ lời mời ghi danh (chơi thử) thì mở thẳng tab Đăng ký
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('up')) setMode('up');
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<string | null>(null);
  // tên có dấu, khoảng trắng, chữ hoa thì cảnh báo ngay và không cho gửi
  const issue = usernameIssue(username);
  // 4/11: đăng nhập bằng Google. Đăng ký mới bắt buộc qua Google (chọn tên sau khi xác thực)
  const [gg, setGg] = useState(false);
  useEffect(() => setGg(googleOn()), []);
  const [ggSb, setGgSb] = useState<SupabaseClient | null>(null);
  const [ggEmail, setGgEmail] = useState<string | undefined>();
  const [forgot, setForgot] = useState(false);

  const done = async (isNew: boolean) => {
    track(isNew ? 'signup' : 'login', { via: 'google' });
    if (isNew) await carryGuest(currentPlayer()).catch(() => {});
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next && next.startsWith('/') ? next : '/choi');
  };
  async function onGoogle(sb: SupabaseClient) {
    setBusy(true);
    setError(null);
    const r = await googleSignIn(sb);
    setBusy(false);
    if ('ok' in r) return done(false);
    if ('error' in r) return setError(googleError(r.error));
    // Google chưa gắn tài khoản nào: chọn tên để tạo tài khoản mới
    setGgSb(sb);
    setGgEmail(r.email);
    setMode('up');
  }
  async function ggCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ggSb) return;
    setBusy(true);
    setError(null);
    setSuggest(null);
    const err = await googleSignUp(ggSb, username);
    setBusy(false);
    if (err) {
      const m = /[A-Z_]{5,}/.test(err) ? googleError(err) : err;
      setError(m);
      if (/USERNAME_TAKEN/.test(err)) setSuggest(`${username.slice(0, 13)}${10 + Math.floor(Math.random() * 90)}`);
      track('auth_fail', { mode: 'gg_up', err: String(err).slice(0, 80) });
      return;
    }
    done(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuggest(null);
    const err = mode === 'in' ? await signIn(username, password) : await signUp(username, password);
    setBusy(false);
    if (err) {
      setError(err);
      if (mode === 'up' && /đã có người dùng|already taken/.test(err)) setSuggest(`${username.slice(0, 13)}${10 + Math.floor(Math.random() * 90)}`);
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
        {mode === 'in' ? tr('Nhập Môn', "Enter the Gate") : tr('Bái Sư', "Join a Master")}
        <small>{mode === 'in' ? tr('Đạo hữu quay lại rồi sao?', "Back again, fellow Daoist?") : tr('Ghi danh vào sổ luân hồi', "Register in the Book of Reincarnation")}</small>
      </h1>

      <form className="panel" onSubmit={gg && mode === 'up' ? ggCreate : submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
            
            {tr("Đăng nhập", "Log in")}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
            
            {tr("Đăng ký", "Sign up")}
          </button>
        </div>

        {!enabled && <p className="error">{tr("Chưa kết nối được máy chủ, thử lại sau ít phút.", "Can't reach the server, try again in a few minutes.")}</p>}
        <p className="note" style={{ margin: 0 }}>
          
          {tr("Ghi danh để khắc bia ở Nghĩa trang tu sĩ, lên Bảng xếp hạng, ra Lôi đài. Tiến độ lưu trên mây, đổi máy vẫn chơi tiếp. Các kiếp đã chơi thử trên máy này được giữ lại.", "Register to carve your tombstone in the Cultivators' Cemetery, climb the Leaderboard and enter the Arena. Progress is saved to the cloud, so you can switch devices and keep playing. Lives played as a guest on this device are kept.")}
        </p>

        {gg && mode === 'in' && (
          <>
            <GoogleButton from="login" text="signin_with" onAuth={onGoogle} />
            <p className="gg-or">{tr('hoặc đăng nhập bằng tên và mật khẩu', 'or log in with username and password')}</p>
          </>
        )}
        {gg && mode === 'up' && !ggSb && (
          <>
            <p className="note" style={{ margin: 0 }}>{tr('Tài khoản mới tạo bằng Google: không cần nhớ mật khẩu, đổi máy vẫn vào lại được.', 'New accounts are created with Google: no password to remember, works on any device.')}</p>
            <GoogleButton from="signup" text="signup_with" onAuth={onGoogle} />
          </>
        )}
        {gg && mode === 'up' && ggSb && (
          <p className="note" style={{ margin: 0 }}>
            {tr('Đã xác thực Google', 'Google verified')}
            {ggEmail ? ` (${ggEmail})` : ''}
            {tr('. Chọn tên đăng nhập để tạo tài khoản.', '. Pick a username to create your account.')}
          </p>
        )}
        {!(gg && mode === 'up' && !ggSb) && (
        <label className="field">
          <span>{tr("Tên đăng nhập", "Username")}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={!!issue}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={16}
            placeholder="vd: thanhvan"
            required
          />
          {issue ? (
            <small className="error" role="alert" style={{ margin: 0 }}>
              {issue}
            </small>
          ) : (
            <small className="note">{tr("3-16 ký tự, viết liền: chữ thường không dấu, số, dấu _", "3-16 characters, no spaces: lowercase letters without accents, digits, _")}</small>
          )}
        </label>
        )}
        {!(gg && mode === 'up') && (
        <label className="field">
          <span>{tr("Mật khẩu", "Password")}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            minLength={3}
            maxLength={6}
            required
          />
          <small className="note">{tr("3-6 ký tự", "3-6 characters")}</small>
        </label>
        )}
        {gg && mode === 'in' && (
          <button type="button" className="gg-forgot" onClick={() => setForgot((v) => !v)}>
            {tr('Quên mật khẩu?', 'Forgot password?')}
          </button>
        )}
        {gg && mode === 'in' && forgot && (
          <p className="note" style={{ margin: 0 }}>
            {tr('Đã liên kết Google thì bấm "Đăng nhập bằng Google" ở trên, không cần mật khẩu. Chưa liên kết thì nhắn Fanpage để được đặt lại mật khẩu.', 'If your account is linked to Google, use "Sign in with Google" above, no password needed. Not linked yet? Message our Page to reset your password.')}
          </p>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        {suggest && (
          <button type="button" className="btn" onClick={() => (setUsername(suggest), setSuggest(null), setError(null))}>
            
            {tr("Dùng tên ", "Use the name ")}{suggest}
          </button>
        )}

        {!(gg && mode === 'up' && !ggSb) && (
        <button className="btn btn-red btn-big" disabled={busy || !enabled || !!issue}>
          {busy ? tr('Đang vận công...', "Circulating qi...") : mode === 'in' ? tr('Vào game', "Enter game") : tr('Tạo tài khoản', "Create account")}
        </button>
        )}
      </form>

      <div className="menu">
        <Link href="/choi" className="note">
          
          {tr("Chơi thử, chưa cần tài khoản ›", "Play as guest, no account needed ›")}
        </Link>
        <Link href="/" className="note">
          
          {tr("‹ Về trang đầu", "‹ Back to home")}
        </Link>
      </div>
    </main>
  );
}
