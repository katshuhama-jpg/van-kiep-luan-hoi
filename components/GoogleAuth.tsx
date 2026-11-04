'use client';
/**
 * Đăng nhập bằng Google (Tyler chốt 4/11): nút Google, cảnh báo trình duyệt trong app, pop up bắt buộc liên kết cho tài khoản cũ.
 */
import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { googleError, googleOn, inAppBrowser, mountGoogleButton } from '@/lib/google';
import { currentPlayer, googleLink, googleLinked } from '@/lib/auth';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';
import { FB_PAGE } from '@/lib/links';

/** Facebook, Zalo... mở link trong trình duyệt riêng, Google không cho đăng nhập ở đó: hướng dẫn mở bằng Chrome/Safari */
export function InAppNote({ app }: { app: string }) {
  const [copied, setCopied] = useState(false);
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div className="gg-inapp">
      <b>{tr(`Đang mở trong ${app}`, `Opened inside ${app}`)}</b>
      <span>
        {tr(
          `Google không cho đăng nhập trong trình duyệt của ${app}. Bấm dấu ba chấm ở góc màn hình, chọn "${ios ? 'Mở bằng Safari' : 'Mở bằng Chrome'}" (hoặc "Mở trong trình duyệt"), rồi đăng nhập ở đó.`,
          `Google does not allow sign-in inside the ${app} browser. Tap the three dots in the corner, choose "Open in ${ios ? 'Safari' : 'Chrome'}" (or "Open in browser"), then sign in there.`,
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

/** Nút "Tiếp tục với Google". onAuth nhận client Supabase đã có phiên Google */
export function GoogleButton({ onAuth, text = 'continue_with', from }: { onAuth: (sb: SupabaseClient) => void; text?: 'signin_with' | 'signup_with' | 'continue_with'; from: string }) {
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
      <div ref={ref} className="gg-btn" />
      {err && (
        <p className="error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      )}
    </div>
  );
}

/**
 * Tài khoản cũ chưa liên kết Google: pop up bắt buộc trước khi chơi tiếp (Tyler chốt 4/11).
 * Không hỏi được máy chủ thì không chặn. Đang mở trong Facebook, Zalo... thì Google không cho đăng nhập,
 * nên ở đó cho "Để sau" (chỉ trong phiên này) kèm hướng dẫn mở bằng trình duyệt, tránh khóa người chơi ở ngoài.
 */
export function GoogleGate({ onOpen, onDone }: { onOpen?: () => void; onDone?: () => void }) {
  const [need, setNeed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [app, setApp] = useState<string | null>(null);
  useEffect(() => {
    if (!googleOn() || !currentPlayer()) return;
    try {
      if (sessionStorage.getItem('vkl.ggLater')) return;
    } catch {}
    setApp(inAppBrowser());
    googleLinked().then((v) => {
      if (v === false) {
        setNeed(true);
        onOpen?.();
        track('gg_gate_show', { inapp: inAppBrowser() ?? null });
      }
    });
  }, []);
  if (!need) return null;
  return (
    <div className="gg-gate" role="dialog" aria-modal="true" aria-label={tr('Liên kết Google', 'Link Google')}>
      <div className="gg-card">
        <b className="gg-title">{tr('Giữ tài khoản bằng Google', 'Secure your account with Google')}</b>
        <p>
          {tr(
            `Thiên Đạo nay cho đăng nhập bằng Google. Liên kết một lần để không bao giờ mất tài khoản ${currentPlayer()?.username ?? ''}: quên mật khẩu, đổi máy, xóa trình duyệt vẫn vào lại được.`,
            `You can now sign in with Google. Link it once and you'll never lose the account ${currentPlayer()?.username ?? ''}: forgotten password, new phone or cleared browser, you can always get back in.`,
          )}
        </p>
        <p className="note" style={{ margin: 0 }}>
          {tr('Nhân vật, các kiếp và đồ đạc giữ nguyên. Vẫn đăng nhập được bằng tên và mật khẩu như cũ.', 'Your character, lives and items stay the same. You can still log in with your username and password.')}
        </p>
        {busy ? (
          <p className="note">{tr('Đang liên kết...', 'Linking...')}</p>
        ) : (
          <GoogleButton
            from="gate"
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
              track('gg_link');
              setNeed(false);
              onDone?.();
            }}
          />
        )}
        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}
        {app && (
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              try {
                sessionStorage.setItem('vkl.ggLater', '1');
              } catch {}
              track('gg_gate_later', { app });
              setNeed(false);
              onDone?.();
            }}
          >
            {tr('Để sau, chơi tiếp trong lần này', 'Later, keep playing this time')}
          </button>
        )}
        <a className="note" href={FB_PAGE} target="_blank" rel="noopener noreferrer">
          {tr('Gặp khó? Nhắn Fanpage ›', 'Trouble? Message our Page ›')}
        </a>
      </div>
    </div>
  );
}
