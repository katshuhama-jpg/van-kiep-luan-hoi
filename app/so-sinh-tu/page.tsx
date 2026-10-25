'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ENDINGS, RARE_COLOR } from '@/lib/game/endings';
import { GIFTS, RARE_NAME } from '@/lib/game/gacha';
import type { Meta } from '@/lib/game/types';
import { endingStats, loadAll } from '@/lib/storage';
import { PETS, PET_IDS } from '@/lib/game/pets';
import { ACHIEVEMENTS } from '@/lib/game/hook';
import { useAuth } from '@/lib/useAuth';

export default function SoSinhTu() {
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadAll(user).then((r) => setMeta(r.meta));
  }, [ready, user?.token]);
  const [stats, setStats] = useState<{ total: number; counts: Record<string, number> } | null>(null);
  useEffect(() => {
    endingStats()
      .then(setStats)
      .catch(() => {});
  }, []);
  const pct = (id: string) => (stats && stats.total ? Math.round(((stats.counts[id] ?? 0) / stats.total) * 100) : null);
  const book = meta?.petBook ?? [];
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
            Đã mở {n}/{ENDINGS.length} kết cục · {ENDINGS.filter((e) => !e.how).length} bí ẩn
            {meta ? ` · ${meta.lives} kiếp` : ''}
          </span>
          <BackButton fallback="/choi" />
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
              {k ? (
                <span>{e.desc}</span>
              ) : e.how ? (
                <span className="ss-how">
                  <i>Cách mở</i> {e.how}
                </span>
              ) : (
                <span className="ss-how secret">
                  <i>Bí ẩn</i> {e.hint} Chưa ai tiết lộ cách mở, tự mình tìm hiểu.
                </span>
              )}
              {k && !e.how && <em className="ss-secret">Kết cục bí ẩn</em>}
              {k ? <em>Đã gặp {k} lần</em> : null}
              {stats && <i className="ss-rarity">{(stats.counts[e.id] ?? 0) === 0 ? 'Chưa ai đạt được' : `${pct(e.id)}% người chơi đã mở`}</i>}
            </article>
          );
        })}
      </div>
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>Thành tựu</h2>
        <p className="note" style={{ marginTop: 0 }}>
          Đã đạt {(meta?.achievements ?? []).length}/{ACHIEVEMENTS.length}. Mỗi thành tựu thưởng phúc duyên, chấm khi một kiếp kết thúc.
        </p>
        <ul className="ach-list">
          {ACHIEVEMENTS.map((a) => {
            const has = meta?.achievements?.includes(a.id);
            return (
              <li key={a.id} className={has ? 'has' : ''}>
                <span aria-hidden="true">{has ? '🏆' : '▫'}</span>
                <span>
                  <b>{a.name}</b>
                  <small>
                    {a.desc} · +{a.reward} phúc
                  </small>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>Sổ linh thú</h2>
        <p className="note" style={{ marginTop: 0 }}>
          Đã từng nuôi {book.length}/{PET_IDS.length} loài. Linh thú được ghi vào sổ khi một kiếp kết thúc mà nó còn theo bạn.
        </p>
        <div className="pet-book">
          {PET_IDS.map((id) => {
            const p = PETS[id];
            const has = book.includes(id);
            const z = 40 / Math.max(p.w, p.h);
            return (
              <span key={id} className={`pet-cell ${has ? 'has' : ''}`} title={has ? p.name : '???'}>
                <span
                  className="pet-thumb"
                  style={{
                    width: p.w * z,
                    height: p.h * z,
                    backgroundImage: `url(/lpc/pets/${id}.png)`,
                    backgroundSize: `${p.n * p.w * z}px ${2 * p.h * z}px`,
                    filter: has ? p.filter : 'brightness(0) opacity(0.35)',
                  }}
                />
                <small>{has ? p.name : '???'}</small>
              </span>
            );
          })}
        </div>
      </section>
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
