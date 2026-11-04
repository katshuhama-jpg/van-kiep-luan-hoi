'use client';
/**
 * Đăng nhập bằng Google (Tyler chốt 4/11).
 * Nút "Đăng nhập bằng Google" của Google Identity Services trả về ID token ngay trên trang (không chuyển trang).
 * ID token đổi lấy phiên Supabase Auth (signInWithIdToken), Supabase kiểm chứng token với Google.
 * Phiên đó chỉ dùng để gọi các hàm vkl_google_*; game vẫn giữ token phiên riêng như đăng nhập bằng mật khẩu.
 * Client Supabase riêng, không lưu phiên, để không đụng client chính (client chính tắt hẳn auth vì Safari iOS hay treo khóa).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { tr } from './i18n';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
/** Chưa có Client ID thì toàn bộ phần Google tắt, game chạy như cũ */
export const googleOn = () => !!GOOGLE_CLIENT_ID;

/** Trình duyệt nhúng trong app (Facebook, Messenger, Instagram, Zalo, TikTok): Google chặn đăng nhập ở đây */
export function inAppBrowser(): string | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Zalo/i.test(ua)) return 'Zalo';
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/Line\//i.test(ua)) return 'Line';
  return null;
}

let gis: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (gis) return gis;
  gis = new Promise((ok, no) => {
    if ((window as unknown as { google?: unknown }).google) return ok();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      gis = null;
      no(new Error('gis'));
    };
    document.head.appendChild(s);
  });
  return gis;
}

async function sha256(s: string): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

interface GisApi {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
      cancel: () => void;
    };
  };
}

/**
 * Vẽ nút Google vào el. Bấm và chọn tài khoản xong thì onAuth nhận client Supabase đã có phiên Google.
 * Trả về hàm dọn dẹp.
 */
export async function mountGoogleButton(el: HTMLElement, onAuth: (sb: SupabaseClient) => void, onError: (msg: string) => void, text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with'): Promise<() => void> {
  await loadGis();
  const raw = crypto.getRandomValues(new Uint32Array(4)).join('-');
  const hashed = await sha256(raw);
  const g = (window as unknown as { google: GisApi }).google;
  g.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: hashed,
    use_fedcm_for_prompt: true,
    callback: async (res: { credential?: string }) => {
      if (!res.credential) return onError(tr('Google chưa trả về tài khoản, thử lại nhé.', 'Google returned no account, please try again.'));
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return onError(tr('Chưa cấu hình máy chủ.', 'Server not configured.'));
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'vkl.gg' } });
      const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: res.credential, nonce: raw });
      if (error) return onError(tr('Không xác thực được với Google, thử lại sau.', "Couldn't verify with Google, try again later."));
      onAuth(sb);
    },
  });
  el.innerHTML = '';
  g.accounts.id.renderButton(el, { type: 'standard', theme: 'filled_black', size: 'large', shape: 'rectangular', text, logo_alignment: 'left', locale: 'vi', width: Math.min(320, el.clientWidth || 300) });
  return () => {
    try {
      g.accounts.id.cancel();
    } catch {}
  };
}

export function googleError(msg: string): string {
  if (msg.includes('GOOGLE_USED')) return tr('Tài khoản Google này đã gắn với một tài khoản game khác.', 'This Google account is already linked to another game account.');
  if (msg.includes('ALREADY_LINKED')) return tr('Tài khoản game này đã gắn với một tài khoản Google khác.', 'This game account is already linked to a different Google account.');
  if (msg.includes('USERNAME_TAKEN')) return tr('Tên đăng nhập này đã có người dùng.', 'This username is already taken.');
  if (msg.includes('USERNAME_INVALID')) return tr('Tên đăng nhập không hợp lệ.', 'Invalid username.');
  if (msg.includes('SESSION')) return tr('Phiên đăng nhập đã hết, đăng nhập lại rồi liên kết.', 'Your session expired, log in again and link.');
  return tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later.");
}
