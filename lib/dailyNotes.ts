/**
 * Ghi chú sửa game theo ngày (giờ Việt Nam), hiện một dòng ở trang đầu: "Hôm nay Thiên Đạo đã sửa: ...".
 * Chỉ hiện ghi chú của hôm nay hoặc hôm qua, không bật bảng cập nhật. Mỗi lần đẩy bản sửa thì thêm một dòng ở cuối.
 * day: ngày giờ VN dạng YYYY-MM-DD. vi, en: một câu ngắn (khoảng 12-15 chữ) người chơi hiểu được, vì trang đầu chỉ hiện một dòng.
 */
export type DailyNote = { day: string; vi: string; en: string };

export const DAILY_NOTES: DailyNote[] = [
  {
    day: '2026-10-30',
    vi: 'chết vì quái, địch thủ, oan gia có kết cục riêng, bia ghi tên kẻ giết.',
    en: 'deaths to monsters, rivals and old enemies get their own ending; graves name the killer.',
  },
];

/** Ngày giờ Việt Nam (UTC+7) dạng YYYY-MM-DD, lệch d ngày */
export function vnDay(now: number, d = 0): string {
  return new Date(now + 7 * 3600e3 + d * 86400e3).toISOString().slice(0, 10);
}

/** Ghi chú để hiện: của hôm nay, không có thì của hôm qua (tối đa 2 ngày) */
export function noteFor(now: number): { note: DailyNote; today: boolean } | null {
  const today = vnDay(now);
  const yest = vnDay(now, -1);
  const t = [...DAILY_NOTES].reverse().find((n) => n.day === today);
  if (t) return { note: t, today: true };
  const y = [...DAILY_NOTES].reverse().find((n) => n.day === yest);
  return y ? { note: y, today: false } : null;
}
