'use client';

import { currentPlayer } from './auth';

/**
 * Ghi sự kiện nhẹ để đo người chơi: vào game, đổi trang, còn ở trang (nhịp 60 giây), ẩn tab,
 * bắt đầu và kết thúc kiếp, đánh lôi đài, đăng ký, đăng nhập.
 * Gom lại gửi một lần (mỗi 15 giây hoặc khi rời trang) vào RPC vkl_track. Lỗi thì bỏ qua, không ảnh hưởng game.
 */

type Ev = { k: string; p: string; t: number; d?: Record<string, unknown> };

/** Màn đang hiện trong trang (vd. trong /choi: dau_thai, choi, su_kien, chet) để biết người chơi rời đi ở đâu */
let screen = '';
export function setScreen(s: string) {
  screen = s;
}
/** Kiếp và tuổi đang chơi, gắn vào sự kiện rời trang (hide, leave) để biết khách mới bỏ ở tuổi nào */
let lifeCtx: { life: number; age: number } | null = null;
export function setLifeCtx(x: { life: number; age: number } | null) {
  lifeCtx = x;
}

const queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function sessionId(): string {
  try {
    let s = sessionStorage.getItem('vkl.sid');
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('vkl.sid', s);
    }
    return s;
  } catch {
    return 'nosid';
  }
}

export function track(kind: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const base = (kind === 'hide' || kind === 'leave') && lifeCtx ? { ...lifeCtx, ...(data ?? {}) } : data;
  const d = screen ? { sc: screen, ...(base ?? {}) } : base;
  queue.push({ k: kind, p: location.pathname, t: Date.now(), ...(d ? { d } : {}) });
  if (queue.length >= 25) flush();
  else if (!timer) timer = setTimeout(() => flush(), 15000);
}

export function flush(beacon = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return void (queue.length = 0);
  const events = queue.splice(0, 30);
  const body = JSON.stringify({ p_token: currentPlayer()?.token ?? null, p_sid: sessionId(), p_events: events });
  try {
    fetch(`${url}/rest/v1/rpc/vkl_track`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body,
      keepalive: beacon,
    }).catch(() => {});
  } catch {
    /* bỏ qua */
  }
  if (queue.length) timer = setTimeout(() => flush(), 1000);
}
