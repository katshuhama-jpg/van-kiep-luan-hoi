'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ENDINGS, RARE_COLOR } from '@/lib/game/endings';
import { GIFTS, RARE_NAME } from '@/lib/game/gacha';
import type { Meta } from '@/lib/game/types';
import { loadAll } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

export default function SoSinhTu() {
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadAll(user).then((r) => setMeta(r.meta));
  }, [ready, user?.token]);
  const got = meta?.endings ?? {};
  const n = Object.keys(got).length;
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Sổ Sinh Tử
          </span>
          <span className="meta">
            Đã mở {n}/{ENDINGS.length} kết cục
            {meta ? ` · ${meta.lives} kiếp` : ''}
          </span>
          <Link href="/choi" className="icon-btn" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }} aria-label="Quay lại">
            ‹
          </Link>
        </div>
      </header>
      <div className="ss-progress" aria-hidden="true">
        <span style={{ width: `${(n / ENDINGS.length) * 100}%` }} />
      </div>
      <div className="ss-grid">
        {ENDINGS.map((e) => {
          const k = got[e.id];
          return (
            <article key={e.id} className={`ss-card ${k ? 'open' : 'locked'}`} style={{ ['--rc' as string]: RARE_COLOR[e.rare] } as CSSProperties}>
              <small>{RARE_NAME[e.rare]} phẩm</small>
              <b>{k ? e.name : '???'}</b>
              <span>{k ? e.desc : `Gợi ý: ${e.hint}`}</span>
              {k ? <em>Đã gặp {k} lần</em> : null}
            </article>
          );
        })}
      </div>
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>Thiên phú có thể gieo được</h2>
        <p className="note" style={{ marginTop: 0 }}>
          {GIFTS.length} loại. Tỉ lệ: Phàm 58% · Linh 28% · Huyền 11% · Địa 2.9% · Thiên 0.1%
        </p>
        <div className="ss-gifts">
          {[0, 1, 2, 3, 4].map((r) => (
            <span key={r} style={{ color: RARE_COLOR[r] }}>
              {RARE_NAME[r]}: {GIFTS.filter((g) => g.rare === r).length}
            </span>
          ))}
        </div>
      </section>
      <Link href="/choi" className="btn btn-red btn-big" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 10 }}>
        Chơi tiếp
      </Link>
    </main>
  );
}
