/** Giờ máy chủ (ms), để Hồn lực không bị gian lận bằng cách đổi giờ máy. Lỗi mạng thì dùng giờ máy. */
export async function serverNow(): Promise<number> {
  try {
    const r = await fetch('/api/version', { cache: 'no-store' });
    const j = (await r.json()) as { now?: number };
    if (typeof j.now === 'number') return j.now;
  } catch {
    /* bỏ qua */
  }
  return Date.now();
}
