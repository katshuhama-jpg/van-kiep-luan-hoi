'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CHECKIN, checkinClaimed, checkinDay, checkinDayToday, checkinLabel } from '@/lib/game/hook';
import { honActive } from '@/lib/game/luanHoi';
import { loadAll } from '@/lib/storage';
import type { Meta } from '@/lib/game/types';
import type { Player } from '@/lib/auth';
import { tr } from '@/lib/i18n';

/** Trang đầu: một dòng nhắc quà điểm danh hôm nay, bấm vào là vào game và tự mở bảng quà */
export function HomeCheckin({ user, ready }: { user: Player | null; ready: boolean }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadAll(user).then((r) => setMeta(r.meta)).catch(() => {});
  }, [ready, user]);
  if (!meta || meta.lives < 1) return null;
  const hon = honActive(meta);
  const claimed = checkinClaimed(meta);
  const day = claimed ? checkinDay(meta) : checkinDayToday(meta);
  const g = CHECKIN[claimed ? day % 7 : day - 1];
  return (
    <Link href="/choi" className={`wk-line ci-home ${claimed ? 'done' : ''}`}>
      <span>
        {claimed ? (
          <>
            {tr('Đã điểm danh ngày ', 'Checked in day ')}
            {day}/7 · {tr('mai: ', 'tomorrow: ')}
            <b>{checkinLabel(g, hon)}</b>
          </>
        ) : (
          <>
            <b>{tr(`Quà điểm danh ngày ${day}/7`, `Check-in gift day ${day}/7`)}</b>
            {' · '}
            {checkinLabel(g, hon)} ›
          </>
        )}
      </span>
    </Link>
  );
}
