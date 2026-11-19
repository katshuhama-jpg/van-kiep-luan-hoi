/**
 * Ngày 7b (19/11): link mời Sơn Môn `?sm=<mã môn>&tu=<tên người mời>&mn=<tên môn>`.
 * Máy chưa có kiếp nào thì nhớ 7 ngày (localStorage `vkl.smRef`), giữ link đầu tiên.
 * Màn đầu ghi "<tên> ở <môn> mời bạn"; tạo chân thân xong thì Sơn Môn mời vào môn đó (một chạm).
 */
import { tr } from './i18n';

export type SmRef = { sm: string; tu: string; mn: string; at: number };
const KEY = 'vkl.smRef';
const TTL = 7 * 86400_000;

export function readSmRef(): SmRef | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as SmRef;
    if (!r.sm || Date.now() - r.at > TTL) return null;
    return r;
  } catch {
    return null;
  }
}

export function clearSmRef() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** bắt link trên mọi trang; chỉ nhớ khi máy này chưa chơi kiếp nào (chống tự mời tài khoản cũ) */
export function catchSmRef(lives: number | null): SmRef | null {
  try {
    const q = new URLSearchParams(location.search);
    const sm = q.get('sm');
    if (sm && /^[0-9a-zA-Z-]{1,40}$/.test(sm) && !readSmRef() && (lives ?? 0) === 0) {
      const r: SmRef = { sm, tu: (q.get('tu') ?? '').slice(0, 24), mn: (q.get('mn') ?? '').slice(0, 40), at: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(r));
      return r;
    }
  } catch {}
  return readSmRef();
}

export function smInviteLine(): string | null {
  const r = readSmRef();
  if (!r || !r.tu) return null;
  return r.mn ? tr(`${r.tu} ở ${r.mn} mời bạn`, `${r.tu} of ${r.mn} invites you`) : tr(`${r.tu} mời bạn`, `${r.tu} invites you`);
}

export function smRefLink(origin: string, monId: string | number, tu: string, mn: string) {
  const e = encodeURIComponent;
  return `${origin}/choi?sm=${e(String(monId))}&tu=${e(tu)}&mn=${e(mn)}`;
}
