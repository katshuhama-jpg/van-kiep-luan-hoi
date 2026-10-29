'use client';

import { useEffect, useState } from 'react';
import { noteFor, type DailyNote as Note } from '@/lib/dailyNotes';
import { tr } from '@/lib/i18n';

/** Trang đầu: một dòng "Hôm nay Thiên Đạo đã sửa: ..." (hôm nay hoặc hôm qua), không mở bảng cập nhật */
export function DailyNote() {
  const [n, setN] = useState<{ note: Note; today: boolean } | null>(null);
  // tính ở trình duyệt để ngày không lệch giữa máy chủ và máy người chơi
  useEffect(() => setN(noteFor(Date.now())), []);
  if (!n) return null;
  return (
    <p className="daily-note">
      <b>{n.today ? tr('Hôm nay Thiên Đạo đã sửa:', 'Today the Heavenly Dao fixed:') : tr('Hôm qua Thiên Đạo đã sửa:', 'Yesterday the Heavenly Dao fixed:')}</b> {tr(n.note.vi, n.note.en)}
    </p>
  );
}
