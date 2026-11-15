'use client';

/**
 * 4.6.0 Ngày 3b Sư Đồ: link mời `?su=<tên>`, bái sư, nhận thưởng thành tài.
 * Máy chủ: supabase/su_do_2026_11_16.sql (bảng vkl_su, hàm vkl_su_bind/info/claim/count).
 * Mọi lỗi mạng đều bỏ qua, không được làm hỏng game.
 */
import type { Player } from './auth';
import { SU_DO_ON } from './flags';
import { supabase } from './supabase';
import { track } from './track';
import { tr } from './i18n';

export const SU_RE = /^[a-z0-9_]{3,16}$/;
const COOKIE = 'vkl_su';
/** sự kiện báo đã bái sư (khung nhắn nhỏ ở components/SuDoLink.tsx hiện một dòng) */
export const SU_BOUND_EV = 'vkl-su-bound';

export function suCookie(): string | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)vkl_su=([^;]*)/);
    const v = m ? decodeURIComponent(m[1]) : '';
    return SU_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

function clearSuCookie() {
  try {
    document.cookie = `${COOKIE}=; max-age=0; path=/; samesite=lax`;
  } catch {}
}

/** Máy này đã có chân thân (khách hoặc bất kỳ tài khoản nào từng đăng nhập ở đây) */
function hasChanThanHere(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !(k === 'vkl.meta' || k.startsWith('vkl.meta.u.'))) continue;
      const m = JSON.parse(localStorage.getItem(k) || 'null') as { chanThan?: unknown } | null;
      if (m && typeof m === 'object' && m.chanThan) return true;
    }
  } catch {}
  return false;
}

/** Bắt `?su=<tên>` trên mọi trang. Chỉ nhớ (cookie 7 ngày) khi máy này chưa có chân thân; giữ link đầu tiên. */
export function captureSuLink() {
  if (!SU_DO_ON || typeof window === 'undefined') return;
  let su = '';
  try {
    su = (new URLSearchParams(location.search).get('su') ?? '').trim().toLowerCase();
  } catch {
    return;
  }
  if (!SU_RE.test(su)) return;
  if (hasChanThanHere()) return void track('su_link_open', { kept: false, su });
  if (suCookie()) return void track('su_link_open', { kept: false, su, had: true });
  try {
    document.cookie = `${COOKIE}=${su}; max-age=604800; path=/; samesite=lax`;
  } catch {}
  track('su_link_open', { kept: true, su });
}

/** Mã máy lâu dài (localStorage) để đánh dấu nhiều đệ tử dùng chung một máy */
function deviceId(): string {
  try {
    let d = localStorage.getItem('vkl.did');
    if (!d) {
      d = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('vkl.did', d);
    }
    return d;
  } catch {
    return '';
  }
}

let binding = false;
/** Gắn đệ tử khi đã đăng nhập và còn cookie. Kết quả bất kỳ thì xóa cookie (trừ lỗi mạng). */
export async function trySuBind(user: Player | null): Promise<string | null> {
  if (!SU_DO_ON || !user || binding) return null;
  const su = suCookie();
  const sb = supabase();
  if (!su || !sb) return null;
  if (su === user.username) {
    clearSuCookie();
    return 'SU_SELF';
  }
  binding = true;
  try {
    const { data, error } = await sb.rpc('vkl_su_bind', { p_token: user.token, p_su: su, p_sid: deviceId() });
    if (error || typeof data !== 'string') return null;
    clearSuCookie();
    if (data === 'OK') {
      track('su_bind', { su });
      try {
        window.dispatchEvent(new CustomEvent(SU_BOUND_EV, { detail: su }));
      } catch {}
    } else track('su_bind_no', { su, code: data });
    return data;
  } catch {
    return null;
  } finally {
    binding = false;
  }
}

export type SuInfo = {
  su: { ten: string; phap_danh: string | null } | null;
  kiep: number;
  han: string | null;
  thanh_tai: boolean;
  de_tu: number;
  thanh_tai_n: number;
  cho_nhan: number;
};

export async function suInfo(user: Player | null): Promise<SuInfo | null> {
  const sb = supabase();
  if (!SU_DO_ON || !user || !sb) return null;
  try {
    const { data, error } = await sb.rpc('vkl_su_info', { p_token: user.token });
    if (error || !data) return null;
    const d = data as Partial<SuInfo>;
    return {
      su: d.su && typeof d.su === 'object' && d.su.ten ? { ten: String(d.su.ten), phap_danh: d.su.phap_danh ? String(d.su.phap_danh) : null } : null,
      kiep: Number(d.kiep ?? 0),
      han: d.han ? String(d.han) : null,
      thanh_tai: !!d.thanh_tai,
      de_tu: Number(d.de_tu ?? 0),
      thanh_tai_n: Number(d.thanh_tai_n ?? 0),
      cho_nhan: Number(d.cho_nhan ?? 0),
    };
  } catch {
    return null;
  }
}

/** Nhận thưởng: trả số phúc duyên vừa nhận (máy chủ đã đánh dấu đã nhận), người gọi tự cộng vào meta rồi saveMeta */
export async function suClaim(user: Player | null): Promise<number> {
  const sb = supabase();
  if (!SU_DO_ON || !user || !sb) return 0;
  try {
    const { data, error } = await sb.rpc('vkl_su_claim', { p_token: user.token });
    if (error) return 0;
    const n = Number(data ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Số đệ tử thành tài (đạo Truyền Đạo) */
export async function suCount(user: Player | null): Promise<number | null> {
  const sb = supabase();
  if (!SU_DO_ON || !user || !sb) return null;
  try {
    const { data, error } = await sb.rpc('vkl_su_count', { p_token: user.token });
    if (error || data === null || data === undefined) return null;
    const n = Number(data);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Danh hiệu sư phụ theo số đệ tử thành tài */
export function suTitle(n: number): string | null {
  if (n >= 20) return tr('Truyền Đạo Tôn Sư', 'Dao-Passing Grandmaster');
  if (n >= 5) return tr('Danh sư', 'Renowned Master');
  return null;
}
