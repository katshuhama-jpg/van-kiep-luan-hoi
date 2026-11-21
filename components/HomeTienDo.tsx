'use client';

/**
 * 21/11 (Tyler: "trang chủ nên có số kết cục đã mở / tổng"): thẻ tiến độ ở trang đầu.
 * Số liệu cùng ngày: 300 người đạt Vạn Kiếp Quy Nhất nhưng 185 người đứng ở 3-5/10 mảnh Quyển II, chỉ 24 người xong,
 * vì không thấy mình đang có bao nhiêu và còn thiếu gì. Thẻ này hiện: kết cục x/y (thanh), Bảo khố, ba quyển Thiên thư.
 * Chạm mở Sổ Sinh Tử. Chưa chơi kiếp nào thì không hiện.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Player } from '@/lib/auth';
import { loadAll } from '@/lib/storage';
import type { Meta } from '@/lib/game/types';
import { collectStats } from '@/lib/game/collect';
import { LORE2_TOTAL, LORE_TOTAL, lore1Count, lore2Count, quyNhatDone } from '@/lib/game/lore';
import { TT3_PAGES, tt3Open, tt3PageCount } from '@/lib/game/tt3';
import { TT3_ON } from '@/lib/flags';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';

export function HomeTienDo({ user, ready }: { user: Player | null; ready: boolean }) {
  const [m, setM] = useState<Meta | null>(null);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    loadAll(user)
      .then((r) => live && setM(r.meta))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ready, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m || !m.lives) return null;
  const s = collectStats(m);
  const pct = s.endingsTotal ? Math.round((s.endings / s.endingsTotal) * 100) : 0;
  const q2 = quyNhatDone(m);
  const q3 = tt3Open(m);
  const quyen = [
    { ten: 'I', v: `${lore1Count(m)}/${LORE_TOTAL}`, khoa: false },
    { ten: 'II', v: q2 ? `${lore2Count(m)}/${LORE2_TOTAL}` : '', khoa: !q2 },
    ...(TT3_ON ? [{ ten: 'III', v: q3 ? `${tt3PageCount(m)}/${TT3_PAGES.length}` : '', khoa: !q3 }] : []),
  ];
  return (
    <Link href="/so-sinh-tu" className="home-td" onClick={() => track('home_tien_do', { e: s.endings })}>
      <span className="home-td-dau">
        <small>{tr('Sổ Sinh Tử', 'Book of Life and Death')}</small>
        <b>
          {s.endings}
          <i>/{s.endingsTotal}</i>
        </b>
        <small>{tr('kết cục', 'endings')}</small>
      </span>
      <span className="home-td-than">
        <span className="home-td-bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.endingsTotal} aria-valuenow={s.endings} aria-label={tr(`Đã mở ${s.endings} trên ${s.endingsTotal} kết cục`, `${s.endings} of ${s.endingsTotal} endings`)}>
          <i style={{ width: `${pct}%` }} />
        </span>
        <span className="home-td-dong">
          <span>{tr(`Bảo khố ${s.items}/${s.itemsTotal}`, `Treasury ${s.items}/${s.itemsTotal}`)}</span>
          <span className="home-td-tt">
            {tr('Thiên thư', 'Tome')}
            {quyen.map((q) => (
              <em key={q.ten} className={q.khoa ? 'khoa' : ''}>
                {q.ten} {q.khoa ? <span aria-label={tr('phong ấn', 'sealed')}>🔒</span> : q.v}
              </em>
            ))}
          </span>
        </span>
      </span>
      <span className="home-td-di" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
