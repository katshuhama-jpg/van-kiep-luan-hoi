'use client';

import { useEffect, useState } from 'react';
import { noteFor, type DailyNote as Note } from '@/lib/dailyNotes';
import { tr } from '@/lib/i18n';

/** Trang đầu: một dòng "Hôm nay Thiên Đạo đã sửa: ..." (hôm nay hoặc hôm qua), không mở bảng cập nhật */
export function DailyNote() {
  const [n, setN] = useState<{ note: Note; today: boolean } | null>(null);
  // tính ở trình duyệt để ngày không lệch giữa máy chủ và máy người chơi
  useEffect(() => setN(noteFor(Date.now())), []);
  const [open, setOpen] = useState(false);
  if (!n) return null;
  // một dòng, bấm để xem đủ câu (trang đầu đã nhiều chữ)
  return (
    <p className={`daily-note ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
      <b>{n.today ? tr('Hôm nay đã sửa:', 'Fixed today:') : tr('Hôm qua đã sửa:', 'Fixed yesterday:')}</b> {tr(n.note.vi, n.note.en)}
    </p>
  );
}
