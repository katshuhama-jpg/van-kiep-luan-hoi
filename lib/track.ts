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
let pausedUntil = 0;
let inFlight = false;
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
  // máy chủ đang chậm: tạm ngừng gửi, chỉ giữ 50 sự kiện mới nhất, để các lệnh lưu game không bị nghẽn theo
  if (Date.now() < pausedUntil || inFlight) {
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    if (!timer) timer = setTimeout(() => flush(), Math.max(15000, pausedUntil - Date.now()));
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return void (queue.length = 0);
  const events = queue.splice(0, 30);
  const body = JSON.stringify({ p_token: currentPlayer()?.token ?? null, p_sid: sessionId(), p_events: events });
  const ctl = new AbortController();
  const t0 = Date.now();
  const kill = setTimeout(() => ctl.abort(), 8000);
  const backoff = () => {
    pausedUntil = Date.now() + 5 * 60_000;
  };
  inFlight = !beacon;
  try {
    fetch(`${url}/rest/v1/rpc/vkl_track`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body,
      keepalive: beacon,
      signal: beacon ? undefined : ctl.signal,
    })
      .then((r) => {
        if (!r.ok || Date.now() - t0 > 4000) backoff();
      })
      .catch(backoff)
      .finally(() => {
        clearTimeout(kill);
        inFlight = false;
      });
  } catch {
    inFlight = false;
  }
  if (queue.length) timer = setTimeout(() => flush(), 1000);
}

/** 19/11 (Ngày 7): số ms từ lúc điều hướng tới lúc ghi, và kiểu mạng nếu trình duyệt cho biết, để tách "tải chậm" với "không muốn chơi" */
export function loadHints(): { navMs?: number; net?: string } {
  try {
    const net = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
    return { navMs: Math.round(performance.now()), ...(net ? { net } : {}) };
  } catch {
    return {};
  }
}

/** Ngày 7: nhóm A/B màn đầu, chia theo sid lần đầu rồi giữ theo máy */
export function abFirst(mode: string): 'a' | 'b' {
  if (mode === '0') return 'b';
  if (mode === 'a' || mode === 'b') return mode;
  try {
    const old = localStorage.getItem('vkl.ab.first');
    if (old === 'a' || old === 'b') return old;
    const sid = sessionId();
    let h = 0;
    for (let i = 0; i < sid.length; i++) h = (h * 31 + sid.charCodeAt(i)) | 0;
    const v = (Math.abs(h) % 2 === 0 ? 'a' : 'b') as 'a' | 'b';
    localStorage.setItem('vkl.ab.first', v);
    return v;
  } catch {
    return 'b';
  }
}
