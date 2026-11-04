'use client';
/**
 * Bảo vệ tài khoản (Tyler chốt 4/11): liên kết Google HOẶC lưu mã khôi phục.
 * - Tài khoản cũ chưa có cả hai: pop up bắt buộc chọn một cách khi vào game (thời gian dừng).
 * - Tài khoản mới: pop up này hiện ngay sau khi đăng ký.
 * - Quên mật khẩu: đăng nhập bằng Google, hoặc tên + mã khôi phục để đặt mật khẩu mới.
 * Google chặn đăng nhập trong trình duyệt của Facebook, Zalo...: ở đó vẫn còn đường mã khôi phục nên không ai bị khóa ngoài.
 * Chưa có Client ID Google thì chỉ hiện mã khôi phục.
 */
import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { googleError, googleOn, inAppBrowser, mountGoogleButton } from '@/lib/google';
import { changePassword, createRecovery, currentPlayer, googleLink, recoverAccount, securityStatus, type Security } from '@/lib/auth';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';
import { FB_PAGE } from '@/lib/links';

/** Facebook, Zalo... mở link trong trình duyệt riêng, Google không cho đăng nhập ở đó */
export function InAppNote({ app }: { app: string }) {
  const [copied, setCopied] = useState(false);
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div className="gg-inapp">
      <b>{tr(`Đang mở trong ${app}`, `Opened inside ${app}`)}</b>
      <span>
        {tr(
          `Google không cho đăng nhập trong trình duyệt của ${app}. Muốn dùng Google thì bấm dấu ba chấm ở góc màn hình, chọn "${ios ? 'Mở bằng Safari' : 'Mở bằng Chrome'}" (hoặc "Mở trong trình duyệt").`,
          `Google does not allow sign-in inside the ${app} browser. To use Google, tap the three dots in the corner and choose "Open in ${ios ? 'Safari' : 'Chrome'}" (or "Open in browser").`,
        )}
      </span>
      <button
        type="button"
        className="btn"
        onClick={() => {
          try {
            navigator.clipboard?.writeText(window.location.href);
          } catch {}
          setCopied(true);
          track('gg_copy_link', { app });
        }}
      >
        {copied ? tr('Đã chép link, dán vào Chrome/Safari', 'Link copied, paste it into Chrome/Safari') : tr('Chép link game', 'Copy game link')}
      </button>
    </div>
  );
}

/** Nút Google (nút chính chủ của Google, có viền, màu, logo), đặt trong khung pixel của game */
export function GoogleButton({ onAuth, text = 'signup_with', from, label }: { onAuth: (sb: SupabaseClient) => void; text?: 'signin_with' | 'signup_with' | 'continue_with'; from: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [app, setApp] = useState<string | null>(null);
  const cb = useRef(onAuth);
  cb.current = onAuth;
  useEffect(() => {
    const a = inAppBrowser();
    setApp(a);
    if (a || !ref.current) return;
    let off: (() => void) | undefined;
    mountGoogleButton(
      ref.current,
      (sb) => {
        setErr(null);
        track('gg_auth', { from });
        cb.current(sb);
      },
      (m) => {
        setErr(m);
        track('gg_fail', { from, m: m.slice(0, 60) });
      },
      text,
    )
      .then((f) => (off = f))
      .catch(() => setErr(tr('Không tải được nút Google, kiểm tra mạng rồi tải lại trang.', "Couldn't load the Google button, check your connection and reload.")));
    return () => off?.();
  }, [text, from]);
  if (app) return <InAppNote app={app} />;
  return (
    <div className="gg-wrap">
      {label && <b className="gg-label">{label}</b>}
      <div ref={ref} className="gg-btn" />
      {err && (
        <p className="error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      )}
    </div>
  );
}

/** Hiện mã khôi phục vừa tạo: chép, lưu ảnh, xác nhận đã cất kỹ */
export function RecoveryShow({ code, onDone }: { code: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = currentPlayer()?.username ?? '';
  const saveImg = () => {
    const cv = document.createElement('canvas');
    cv.width = 720;
    cv.height = 360;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#f3e6c4';
    g.fillRect(0, 0, 720, 360);
    g.fillStyle = '#1f160d';
    g.fillRect(0, 0, 720, 8);
    g.fillRect(0, 352, 720, 8);
    g.fillRect(0, 0, 8, 360);
    g.fillRect(712, 0, 8, 360);
    g.fillStyle = '#8f2f20';
    g.font = 'bold 34px sans-serif';
    g.fillText(tr('Vạn Kiếp Luân Hồi - Mã khôi phục', 'Van Kiep Luan Hoi - Recovery code'), 40, 70);
    g.fillStyle = '#3b2a1a';
    g.font = '28px sans-serif';
    g.fillText(tr(`Tài khoản: ${user}`, `Account: ${user}`), 40, 130);
    g.font = 'bold 64px monospace';
    g.fillText(code, 40, 230);
    g.font = '22px sans-serif';
    g.fillText(tr('Quên mật khẩu: Đăng nhập > Quên mật khẩu > nhập mã này.', 'Forgot password: Log in > Forgot password > enter this code.'), 40, 300);
    const a = document.createElement('a');
    a.download = `ma-khoi-phuc-${user}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    setSaved(true);
    track('rec_save_img');
  };
  return (
    <div className="rec-show">
      <span>{tr('Mã khôi phục của bạn', 'Your recovery code')}</span>
      <b className="rec-code">{code}</b>
      <small>{tr('Mã chỉ hiện một lần. Cất vào ghi chú, chụp màn hình hoặc lưu ảnh. Ai có mã này và tên tài khoản đều đặt lại được mật khẩu, đừng đưa cho người khác.', 'This code is shown only once. Keep it in your notes, take a screenshot or save the image. Anyone with this code and your username can reset your password, so keep it private.')}</small>
      <div className="rec-acts">
        <button
          type="button"
          className="btn"
          onClick={() => {
            try {
              navigator.clipboard?.writeText(code);
            } catch {}
            setCopied(true);
            setSaved(true);
          }}
        >
          {copied ? tr('Đã chép', 'Copied') : tr('Chép mã', 'Copy code')}
        </button>
        <button type="button" className="btn" onClick={saveImg}>
          {tr('Lưu ảnh', 'Save image')}
        </button>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        {tr('Tôi đã cất mã ở nơi an toàn', "I've stored the code somewhere safe")}
      </label>
      <button type="button" className="btn btn-red" disabled={!saved} onClick={onDone}>
        {tr('Xong, đã cất mã', 'Done, code saved')}
      </button>
    </div>
  );
}

/**
 * Pop up bảo vệ tài khoản. mode 'gate': tự kiểm khi vào game, chưa có Google lẫn mã khôi phục thì bắt buộc chọn.
 * mode 'manage': mở từ menu để liên kết Google hoặc tạo lại mã.
 */
export function ProtectGate({ mode = 'gate', onOpen, onDone, fresh, bonus, ggBonus }: { mode?: 'gate' | 'manage' | 'death'; onOpen?: () => void; onDone?: (kind?: 'google' | 'code') => void; fresh?: boolean; bonus?: number; ggBonus?: number }) {
  const [sec, setSec] = useState<Security | null>(null);
  const [open, setOpen] = useState(mode !== 'gate');
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const gg = googleOn();
  useEffect(() => {
    if (!currentPlayer()) return;
    securityStatus().then((s) => {
      setSec(s);
      if (mode === 'gate' && s && !s.google && !s.recovery) {
        setOpen(true);
        onOpen?.();
        track('protect_show', { fresh: !!fresh, inapp: inAppBrowser() ?? null });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!open) return null;
  const close = (kind?: 'google' | 'code') => {
    setOpen(false);
    onDone?.(kind);
  };
  const protectedNow = !!sec && (sec.google || sec.recovery);
  return (
    <div className="gg-gate" role="dialog" aria-modal="true" aria-label={tr('Bảo vệ tài khoản', 'Protect your account')}>
      <div className="gg-card">
        <b className="gg-title">{tr('Bảo vệ tài khoản', 'Protect your account')}</b>
        {code ? (
          <RecoveryShow
            code={code}
            onDone={() => {
              track('rec_done');
              close('code');
            }}
          />
        ) : (
          <>
            {mode === 'death' && (
              <p>
                {tr('Trước khi luân hồi, hãy khắc tên vào Sổ Luân Hồi. Lỡ quên mật khẩu hay đổi máy, bạn vẫn tìm lại được mọi kiếp đã sống, Bảo khố và hành trang vừa tích được.', 'Before you are reborn, carve your name into the Book of Reincarnation. If you forget your password or change phones, you can still recover every life you lived, your Treasury and the baggage you just earned.')}
                {bonus ? <b className="protect-bonus">{tr(` Khắc tên lần đầu: thưởng +${bonus} phúc duyên.`, ` First time: +${bonus} Fortune.`)}</b> : null}
              </p>
            )}
            <p style={mode === 'death' ? { display: 'none' } : undefined}>
              {mode === 'manage'
                ? tr('Chọn cách lấy lại tài khoản khi quên mật khẩu hoặc đổi máy.', 'Choose how to get your account back if you forget your password or change phones.') + (bonus ? tr(` Lần đầu bảo vệ: kiếp sau thêm +${bonus} phúc duyên.`, ` First time: +${bonus} Fortune next life.`) : '')
                : fresh
                  ? tr('Tài khoản đã tạo xong. Chọn một cách giữ tài khoản để lỡ quên mật khẩu vẫn vào lại được.', 'Your account is ready. Pick one way to keep it safe, so you can get back in if you forget your password.')
                  : tr(`Thiên Đạo nay cho lấy lại tài khoản khi quên mật khẩu. Chọn một cách để không bao giờ mất ${currentPlayer()?.username ?? ''}. Nhân vật, các kiếp và đồ đạc giữ nguyên.`, `You can now recover your account if you forget your password. Pick one way so you never lose ${currentPlayer()?.username ?? ''}. Your character, lives and items stay the same.`) + (bonus ? tr(` Làm xong nhận +${bonus} phúc duyên.`, ` Done: +${bonus} Fortune.`) : '')}
            </p>
            {gg && (
              <div className="protect-opt">
                <b>{tr('Cách 1: Liên kết Google', 'Option 1: Link Google')}</b>
                {sec?.google ? (
                  <>
                    <span className="gg-linked">✓ {tr('Đã liên kết tài khoản Google', 'Google account linked')}{sec.email ? ` · ${sec.email}` : ''}</span>
                    <span className="note">{tr('Quên mật khẩu hay đổi máy thì bấm Đăng nhập bằng Google.', 'Forgot your password or changed phones? Just sign in with Google.')}</span>
                  </>
                ) : busy ? (
                  <span className="note">{tr('Đang liên kết...', 'Linking...')}</span>
                ) : (
                  <>
                    <span className="note">
                      {tr('Nhanh nhất: quên mật khẩu, đổi máy chỉ cần bấm Google.', 'Easiest: forgot password or new phone, just tap Google.')}
                      {ggBonus ? <b className="protect-bonus">{tr(` Liên kết lần đầu: +${ggBonus} phúc duyên.`, ` First link: +${ggBonus} Fortune.`)}</b> : null}
                    </span>
                    <GoogleButton
                      from={mode === 'manage' ? 'manage' : 'gate'}
                      text="continue_with"
                      onAuth={async (sb) => {
                        setBusy(true);
                        setErr(null);
                        const e = await googleLink(sb);
                        setBusy(false);
                        if (e) {
                          setErr(googleError(e));
                          track('gg_link_fail', { e: e.slice(0, 40) });
                          return;
                        }
                        track('gg_link', { from: mode });
                        close('google');
                      }}
                    />
                  </>
                )}
              </div>
            )}
            <div className="protect-opt">
              <b>{gg ? tr('Cách 2: Mã khôi phục', 'Option 2: Recovery code') : tr('Mã khôi phục', 'Recovery code')}</b>
              <span className="note">
                {sec?.recovery
                  ? tr('Bạn đã có mã. Tạo mã mới thì mã cũ hết hiệu lực.', 'You already have a code. Creating a new one cancels the old one.')
                  : tr('Không cần Google: game đưa bạn một mã 12 ký tự, cất kỹ để đặt lại mật khẩu khi cần.', 'No Google needed: the game gives you a 12-character code, keep it to reset your password when needed.')}
              </span>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  const r = await createRecovery();
                  setBusy(false);
                  if ('error' in r) {
                    setErr(r.error.includes('SESSION') ? googleError('SESSION') : tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later."));
                    return;
                  }
                  track('rec_create', { from: mode });
                  setCode(r.code);
                }}
              >
                {sec?.recovery ? tr('Tạo mã mới', 'Create a new code') : tr('Tạo mã khôi phục', 'Create recovery code')}
              </button>
            </div>
            {mode === 'manage' && <ChangePw />}
            {err && (
              <p className="error" role="alert">
                {err}
              </p>
            )}
            {(mode === 'manage' || protectedNow) && (
              <button type="button" className="chip-btn" onClick={() => close()}>
                {tr('Đóng', 'Close')}
              </button>
            )}
            <a className="note" href={FB_PAGE} target="_blank" rel="noopener noreferrer">
              {tr('Gặp khó? Nhắn Fanpage ›', 'Trouble? Message our Page ›')}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

/** Quên mật khẩu (trang đăng nhập): Google, hoặc tên + mã khôi phục + mật khẩu mới */
export function ForgotPanel({ username, google, onClose, onDone }: { username: string; google: ((sb: SupabaseClient) => void) | null; onClose: () => void; onDone: () => void }) {
  const [u, setU] = useState(username);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="gg-gate" role="dialog" aria-modal="true" aria-label={tr('Quên mật khẩu', 'Forgot password')}>
      <form
        className="gg-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const r = await recoverAccount(u, code, pw);
          setBusy(false);
          if (r) {
            setErr(r);
            track('rec_fail');
            return;
          }
          track('rec_ok');
          onDone();
        }}
      >
        <b className="gg-title">{tr('Quên mật khẩu', 'Forgot password')}</b>
        {google && (
          <div className="protect-opt">
            <b>{tr('Đã liên kết Google', 'Linked to Google')}</b>
            <GoogleButton from="forgot" text="signin_with" onAuth={google} />
          </div>
        )}
        <div className="protect-opt">
          <b>{tr('Có mã khôi phục', 'Have a recovery code')}</b>
          <label className="field">
            <span>{tr('Tên đăng nhập', 'Username')}</span>
            <input value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" spellCheck={false} maxLength={16} required />
          </label>
          <label className="field">
            <span>{tr('Mã khôi phục', 'Recovery code')}</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" spellCheck={false} maxLength={16} placeholder="ABCD-EFGH-JKMN" required />
          </label>
          <label className="field">
            <span>{tr('Mật khẩu mới (3-6 ký tự)', 'New password (3-6 characters)')}</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={3} maxLength={6} required />
          </label>
          {err && (
            <p className="error" role="alert" style={{ margin: 0 }}>
              {err}
            </p>
          )}
          <button className="btn btn-red" disabled={busy}>
            {busy ? tr('Đang kiểm...', 'Checking...') : tr('Đặt mật khẩu mới', 'Set new password')}
          </button>
        </div>
        <div className="protect-opt no-code">
          <b>{tr('Chưa có mã khôi phục?', 'No recovery code?')}</b>
          <span className="note">{tr('Nhắn Fanpage kèm tên đăng nhập. Fanpage sẽ gửi bạn một mã khôi phục, nhập vào ô Mã khôi phục ở trên rồi đặt mật khẩu mới.', 'Message our Page with your username. The Page will send you a recovery code; enter it in the Recovery code box above and set a new password.')}</span>
          <a className="btn" href={FB_PAGE} target="_blank" rel="noopener noreferrer" onClick={() => track('rec_page')}>
            {tr('Nhắn Fanpage', 'Message our Page')}
          </a>
        </div>
        <button type="button" className="chip-btn" onClick={onClose}>
          {tr('Quay lại', 'Back')}
        </button>
      </form>
    </div>
  );
}

/** Đổi mật khẩu (menu > Bảo vệ tài khoản). temp: đang dùng mật khẩu tạm, không cần mật khẩu cũ */
function ChangePw({ temp, onDone }: { temp?: boolean; onDone?: () => void }) {
  const [old, setOld] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="protect-opt"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw !== pw2) return setMsg({ ok: false, t: tr('Hai lần nhập mật khẩu mới chưa khớp.', "The two new passwords don't match.") });
        setBusy(true);
        const r = await changePassword(old, pw);
        setBusy(false);
        if (r) return setMsg({ ok: false, t: r });
        track('pw_change', { temp: !!temp });
        setMsg({ ok: true, t: tr('Đã đổi mật khẩu.', 'Password changed.') });
        setOld('');
        setPw('');
        setPw2('');
        onDone?.();
      }}
    >
      <b>{temp ? tr('Bước 1: Đặt mật khẩu mới', 'Step 1: Set a new password') : tr('Đổi mật khẩu', 'Change password')}</b>
      {temp && <span className="note">{tr('Bạn đang dùng mật khẩu tạm Fanpage cấp. Đặt mật khẩu của riêng bạn để chơi tiếp.', 'You are using a temporary password from our Page. Set your own password to continue.')}</span>}
      {!temp && (
        <label className="field">
          <span>{tr('Mật khẩu cũ', 'Old password')}</span>
          <input type="password" value={old} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" maxLength={6} required />
        </label>
      )}
      <label className="field">
        <span>{tr('Mật khẩu mới (3-6 ký tự)', 'New password (3-6 characters)')}</span>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={3} maxLength={6} required />
      </label>
      <label className="field">
        <span>{tr('Nhập lại mật khẩu mới', 'Repeat new password')}</span>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={3} maxLength={6} required />
      </label>
      {msg && (
        <p className={msg.ok ? 'note' : 'error'} role="alert" style={{ margin: 0 }}>
          {msg.t}
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy ? tr('Đang đổi...', 'Changing...') : tr('Đổi mật khẩu', 'Change password')}
      </button>
    </form>
  );
}

/**
 * Thiết lập lại tài khoản (Tyler chốt 4/11), chặn trước khi chơi:
 * vừa vào bằng mật khẩu tạm Fanpage cấp: đặt mật khẩu mới -> nhận mã khôi phục -> hỏi liên kết Google.
 * vừa đặt lại mật khẩu bằng mã khôi phục (mã cũ đã hết hiệu lực): nhận mã mới -> hỏi liên kết Google.
 */
export function AccountSetup({ start, onOpen, onDone }: { start?: 'pw' | 'code'; onOpen?: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'pw' | 'code' | 'gg' | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [gErr, setGErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!currentPlayer()) return;
    if (start) {
      setStep(start);
      onOpen?.();
      return;
    }
    securityStatus().then((s) => {
      if (s?.must_change) {
        setStep('pw');
        onOpen?.();
        track('setup_show', { from: 'temp' });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (step !== 'code' || code || busy) return;
    setBusy(true);
    createRecovery().then((r) => {
      setBusy(false);
      if ('code' in r) setCode(r.code);
      else setErr(tr('Không tạo được mã khôi phục, kiểm tra mạng rồi thử lại.', "Couldn't create a recovery code, check your connection and try again."));
    });
  }, [step, code, busy]);
  if (!step) return null;
  const finish = () => {
    setStep(null);
    onDone();
  };
  const toGg = () => (googleOn() ? setStep('gg') : finish());
  return (
    <div className="gg-gate" role="dialog" aria-modal="true" aria-label={tr('Thiết lập tài khoản', 'Account setup')}>
      <div className="gg-card">
        <b className="gg-title">{tr('Chào mừng đạo hữu quay lại', 'Welcome back')}</b>
        {step === 'pw' && <ChangePw temp onDone={() => setStep('code')} />}
        {step === 'code' && (
          <div className="protect-opt">
            <b>{start === 'code' ? tr('Mã khôi phục mới', 'New recovery code') : tr('Bước 2: Cất mã khôi phục', 'Step 2: Keep your recovery code')}</b>
            <span className="note">{tr('Mã cũ (nếu có) đã hết hiệu lực. Lần sau quên mật khẩu, dùng mã này để tự đặt lại, không cần nhắn Fanpage.', 'Any old code no longer works. Next time you forget your password, use this code to reset it yourself.')}</span>
            {code ? <RecoveryShow code={code} onDone={toGg} /> : err ? <p className="error">{err}</p> : <span className="note">{tr('Đang tạo mã...', 'Creating code...')}</span>}
            {err && (
              <button type="button" className="btn" onClick={() => (setErr(null), setCode(null))}>
                {tr('Thử lại', 'Try again')}
              </button>
            )}
          </div>
        )}
        {step === 'gg' && (
          <div className="protect-opt">
            <b>{tr('Liên kết thêm Google?', 'Also link Google?')}</b>
            <span className="note">{tr('Liên kết rồi thì đổi máy hay quên mật khẩu chỉ cần bấm Google, không cần mã.', 'Once linked, a new phone or forgotten password just needs one tap on Google.')}</span>
            <GoogleButton
              from="setup"
              text="continue_with"
              onAuth={async (sb) => {
                setGErr(null);
                const e = await googleLink(sb);
                if (e) return setGErr(googleError(e));
                track('gg_link', { from: 'setup' });
                finish();
              }}
            />
            {gErr && <p className="error">{gErr}</p>}
            <button type="button" className="chip-btn" onClick={() => (track('setup_gg_skip'), finish())}>
              {tr('Để sau, vào chơi', 'Later, let me play')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Nhắc bảo vệ tài khoản ở những màn không phải đang chơi (trang đầu, Lôi đài, màn luân hồi): Tyler chốt 4/11.
 * Chỉ cho người đã đăng nhập mà chưa có Google lẫn mã khôi phục. Đang ở màn chơi chính thì không làm phiền
 * (ở đó chỉ hỏi lúc luân hồi sau khi chết).
 */
export function ProtectPrompt({ at }: { at: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(!!currentPlayer()), []);
  if (!on) return null;
  return <ProtectGate onOpen={() => track('protect_show', { at })} />;
}
