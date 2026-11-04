'use client';

import { track } from '@/lib/track';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import { createRecovery, currentPlayer, googleSignIn, googleSignUp, signIn, signUp, usernameIssue } from '@/lib/auth';
import { googleError, googleOn } from '@/lib/google';
import { ForgotPanel, GoogleButton, RecoveryShow } from '@/components/GoogleAuth';
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
  const [ggName, setGgName] = useState('');
  const [forgot, setForgot] = useState(false);
  const [recCode, setRecCode] = useState<string | null>(null); // 4/11: đăng ký bằng mật khẩu xong thì phát mã khôi phục ngay

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
    // gợi ý tên từ email (bỏ dấu, ký tự lạ), người chơi sửa nếu muốn
    const base = (r.email ?? '').split('@')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9_]/g, '').slice(0, 14);
    setGgName(base.length >= 3 ? base : '');
    track('gg_need_name');
  }
  async function ggCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ggSb) return;
    setBusy(true);
    setError(null);
    setSuggest(null);
    const err = await googleSignUp(ggSb, ggName.trim().toLowerCase());
    setBusy(false);
    if (err) {
      const m = /[A-Z_]{5,}/.test(err) ? googleError(err) : err;
      setError(m);
      if (/USERNAME_TAKEN/.test(err)) setGgName(`${ggName.slice(0, 13)}${10 + Math.floor(Math.random() * 90)}`);
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
    // tài khoản mới bằng mật khẩu: phát mã khôi phục ngay để lỡ quên mật khẩu vẫn lấy lại được
    if (mode === 'up') {
      const r = await createRecovery().catch(() => null);
      if (r && 'code' in r) {
        track('rec_create', { from: 'signup' });
        setRecCode(r.code);
        return;
      }
    }
    goNext();
  }
  function goNext() {
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

      <form className="panel" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
            
            {tr("Đăng nhập", "Log in")}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
            
            {tr("Đăng ký", "Sign up")}
          </button>
        </div>
        {gg && (
          <>
            <GoogleButton key={mode} from={mode === 'in' ? 'login' : 'signup'} text={mode === 'in' ? 'signin_with' : 'signup_with'} onAuth={onGoogle} />
            <p className="gg-or">{mode === 'in' ? tr('hoặc đăng nhập bằng tên và mật khẩu', 'or log in with username and password') : tr('hoặc tạo bằng tên và mật khẩu', 'or create one with a username and password')}</p>
          </>
        )}

        {!enabled && <p className="error">{tr("Chưa kết nối được máy chủ, thử lại sau ít phút.", "Can't reach the server, try again in a few minutes.")}</p>}
        <p className="note" style={{ margin: 0 }}>
          
          {tr("Ghi danh để khắc bia ở Nghĩa trang tu sĩ, lên Bảng xếp hạng, ra Lôi đài. Tiến độ lưu trên mây, đổi máy vẫn chơi tiếp. Các kiếp đã chơi thử trên máy này được giữ lại.", "Register to carve your tombstone in the Cultivators' Cemetery, climb the Leaderboard and enter the Arena. Progress is saved to the cloud, so you can switch devices and keep playing. Lives played as a guest on this device are kept.")}
        </p>

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
        {(
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
        {mode === 'in' && (
          <button type="button" className="gg-forgot" onClick={() => setForgot(true)}>
            {tr('Quên mật khẩu?', 'Forgot password?')}
          </button>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        {suggest && (
          <button type="button" className="btn" onClick={() => (setUsername(suggest), setSuggest(null), setError(null))}>
            
            {tr("Dùng tên ", "Use the name ")}{suggest}
          </button>
        )}

        <button className="btn btn-red btn-big" disabled={busy || !enabled || !!issue}>
          {busy ? tr('Đang vận công...', "Circulating qi...") : mode === 'in' ? tr('Vào game', "Enter game") : tr('Tạo tài khoản', "Create account")}
        </button>
      </form>
      {ggSb && (
        <div className="gg-gate" role="dialog" aria-modal="true" aria-label={tr('Đặt tên đạo hữu', 'Pick your name')}>
          <form className="gg-card" onSubmit={ggCreate}>
            <b className="gg-title">{tr('Đặt tên trong giang hồ', 'Pick your name')}</b>
            <p>
              {tr('Đã xác thực Google', 'Google verified')}
              {ggEmail ? ` (${ggEmail})` : ''}
              {tr('. Chỉ cần đặt tên đăng nhập là vào chơi, không cần mật khẩu.', '. Just pick a username to start playing, no password needed.')}
            </p>
            <label className="field">
              <span>{tr('Tên đăng nhập', 'Username')}</span>
              <input value={ggName} onChange={(e) => setGgName(e.target.value)} autoCapitalize="none" spellCheck={false} maxLength={16} placeholder="vd: thanhvan" required aria-invalid={!!usernameIssue(ggName)} />
              {usernameIssue(ggName) ? (
                <small className="error" role="alert" style={{ margin: 0 }}>
                  {usernameIssue(ggName)}
                </small>
              ) : (
                <small className="note">{tr('3-16 ký tự, viết liền: chữ thường không dấu, số, dấu _', '3-16 characters, no spaces: lowercase letters without accents, digits, _')}</small>
              )}
            </label>
            {error && (
              <p className="error" role="alert" style={{ margin: 0 }}>
                {error}
              </p>
            )}
            <button className="btn btn-red btn-big" disabled={busy || !!usernameIssue(ggName) || ggName.length < 3}>
              {busy ? tr('Đang vận công...', 'Circulating qi...') : tr('Vào game', 'Enter game')}
            </button>
            <button type="button" className="chip-btn" onClick={() => (setGgSb(null), setError(null))}>
              {tr('Quay lại', 'Back')}
            </button>
          </form>
        </div>
      )}
      {recCode && (
        <div className="gg-gate" role="dialog" aria-modal="true">
          <div className="gg-card">
            <b className="gg-title">{tr('Tài khoản đã tạo xong', 'Account created')}</b>
            <p>{tr('Đây là mã khôi phục của bạn. Lỡ quên mật khẩu, vào Đăng nhập > Quên mật khẩu rồi nhập mã này để đặt lại.', 'Here is your recovery code. If you forget your password, go to Log in > Forgot password and enter it to reset.')}</p>
            <RecoveryShow code={recCode} onDone={() => (track('rec_done', { from: 'signup' }), goNext())} />
          </div>
        </div>
      )}
      {forgot && (
        <ForgotPanel
          username={username}
          google={gg ? onGoogle : null}
          onClose={() => setForgot(false)}
          onDone={() => {
            // mã cũ vừa dùng đã hết hiệu lực: vào game sẽ phát mã mới rồi hỏi liên kết Google
            try {
              sessionStorage.setItem('vkl.setup', 'code');
            } catch {}
            done(false);
          }}
        />
      )}

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
