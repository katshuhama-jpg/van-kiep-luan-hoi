/**
 * Giờ máy chủ (ms), để Hồn lực không bị gian lận bằng cách đổi giờ máy. Lỗi mạng thì dùng giờ máy.
 * Lấy từ dòng Date của phản hồi /api/version (CDN luôn ghi giờ hiện tại, kể cả khi trả bản lưu sẵn).
 * Bản cũ của /api/version (trước 16/11) có trường `now`: vẫn nhận nếu gặp.
 */
export async function serverNow(): Promise<number> {
  try {
    const r = await fetch('/api/version', { cache: 'no-store' });
    const j = (await r.json().catch(() => ({}))) as { now?: number };
    if (typeof j.now === 'number') return j.now;
    const d = Date.parse(r.headers.get('date') ?? '');
    if (Number.isFinite(d)) return d;
  } catch {
    /* bỏ qua */
  }
  return Date.now();
}
