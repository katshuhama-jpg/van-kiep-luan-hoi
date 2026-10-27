'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ENDINGS, RARE_COLOR } from '@/lib/game/endings';
import { GIFTS, RARE_NAME } from '@/lib/game/gacha';
import type { Meta } from '@/lib/game/types';
import { endingFirsts, endingStats, loadAll } from '@/lib/storage';
import { PETS, PET_IDS } from '@/lib/game/pets';
import { ACHIEVEMENTS } from '@/lib/game/hook';
import { useAuth } from '@/lib/useAuth';
import { LORE1, LORE2, LORE2_TOTAL, LORE_TOTAL, lore1Count, lore2Count, quyNhatDone, type LoreFragment } from '@/lib/game/lore';

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
  const [firsts, setFirsts] = useState<Record<string, string>>({});
  useEffect(() => {
    endingFirsts()
      .then(setFirsts)
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
      <ThienThu meta={meta} />
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
              {stats && (
                <i className="ss-rarity">
                  {(stats.counts[e.id] ?? 0) === 0 ? 'Chưa ai trong giang hồ mở được' : `${stats.counts[e.id]} người đã mở (${pct(e.id)}%)`}
                  {firsts[e.id] ? ` · đầu tiên: @${firsts[e.id]}` : ''}
                </i>
              )}
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

/** Thiên thư hai quyển: Quyển II bị phong ấn tới khi đạt Vạn Kiếp Quy Nhất */
function ThienThu({ meta }: { meta: Meta | null }) {
  const open2 = quyNhatDone(meta);
  const [tab, setTab] = useState<1 | 2>(1);
  useEffect(() => {
    if (open2) setTab(2);
  }, [open2]);
  const n1 = lore1Count(meta);
  const n2 = lore2Count(meta);
  const list: LoreFragment[] = tab === 1 ? LORE1 : LORE2;
  return (
    <section className="panel thien-thu" id="thien-thu" style={{ marginBottom: 10 }}>
      <h2>Thiên thư · Vạn Kiếp</h2>
      <div className="tt-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 1} className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>
          Quyển I · Vạn Kiếp <small>{n1}/{LORE_TOTAL}</small>
        </button>
        <button role="tab" aria-selected={tab === 2} className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>
          {open2 ? 'Quyển II · Vạn Mảnh' : '🔒 Quyển II'} <small>{open2 ? `${n2}/${LORE2_TOTAL}` : 'phong ấn'}</small>
        </button>
      </div>
      {tab === 1 ? (
        <p className="note" style={{ marginTop: 0 }}>
          Vì sao bạn cứ phải luân hồi mãi? Mỗi mảnh ký ức mở khi đạt một cột mốc lớn qua các kiếp. Đã mở {n1}/{LORE_TOTAL}.
          {n1 >= LORE_TOTAL && !open2 ? ' Đã đủ: kiếp sau, bạn sẽ gặp lại chính mình.' : ''}
          {open2 ? ' Bạn đã gom lại chính mình. Nhưng tiếng chuông vẫn chưa im.' : ''}
        </p>
      ) : open2 ? (
        <p className="note" style={{ marginTop: 0 }}>
          Chân Nhân không chỉ vỡ làm một mảnh là bạn. Những đạo hữu trên giang hồ cũng là mảnh vỡ, và có kẻ vẫn đang đếm. Mảnh mới mở khi một kiếp khép lại. Đã mở {n2}/{LORE2_TOTAL}.
        </p>
      ) : (
        <p className="note tt-seal" style={{ marginTop: 0 }}>
          Quyển sách bị niêm bằng một sợi chỉ vàng. Gom đủ 10 mảnh Quyển I và đạt kết cục Vạn Kiếp Quy Nhất để mở phong ấn.
        </p>
      )}
      {(tab === 1 || open2) && (
        <ol className="tt-list">
          {list.map((f, i) => {
            const has = meta?.lore?.includes(f.id);
            const last = has && !list.slice(i + 1).some((x) => meta?.lore?.includes(x.id));
            return (
              <li key={f.id} className={has ? 'has' : ''}>
                {has ? (
                  <details open={last}>
                    <summary>{f.title}</summary>
                    <p>{f.text}</p>
                  </details>
                ) : (
                  <>
                    <b>{f.title.split('.')[0] + '. ???'}</b> <small>{f.hint}</small>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
