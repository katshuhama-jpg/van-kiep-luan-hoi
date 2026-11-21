'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { ENDINGS, RARE_COLOR } from '@/lib/game/endings';
import { CHUYEN_DAO } from '@/lib/game/chuyenDao';
import { PATHS } from '@/lib/game/data';
import { GIFTS, RARE_NAME } from '@/lib/game/gacha';
import type { Meta } from '@/lib/game/types';
import { endingFirsts, endingStats, loadAll } from '@/lib/storage';
import { PETS, PET_IDS } from '@/lib/game/pets';
import { ACHIEVEMENTS } from '@/lib/game/hook';
import { useAuth } from '@/lib/useAuth';
import { LORE1, LORE2, LORE2_TOTAL, LORE_TOTAL, lore1Count, lore2Count, quyNhatDone, type LoreFragment } from '@/lib/game/lore';
import { TT3_PAGES, tt3NhanhOf, tt3Open, tt3PageCount } from '@/lib/game/tt3';
import { TT3_ON } from '@/lib/flags';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';
import { SON_MON_ON } from '@/lib/flags';
import { SmSoSinhTu } from '@/components/sonmon/SmSoSinhTu';

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
            
            {tr("Sổ Sinh Tử", "Book of Life and Death")}
          </span>
          <span className="meta">
            
            {tr("Đã mở ", "Unlocked ")}{n}/{ENDINGS.length}{tr(" kết cục · ", " endings · ")}{ENDINGS.filter((e) => !e.how).length}{tr(" bí ẩn", " secret")}
            {meta ? tr(` · ${meta.lives} kiếp`, ` · ${meta.lives} lives`) : ''}
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
              <small>{RARE_NAME[e.rare]}{tr(" phẩm", " grade")}</small>
              <b>{k ? e.name : '???'}</b>
              {k ? (
                <span>{e.desc}</span>
              ) : e.how ? (
                <span className="ss-how">
                  <i>{tr("Cách mở", "How to unlock")}</i> {e.how}
                </span>
              ) : (
                <span className="ss-how secret">
                  <i>{tr("Bí ẩn", "Secret")}</i> {e.hint}{tr(" Chưa ai tiết lộ cách mở, tự mình tìm hiểu.", " No one has revealed how to unlock this. Find out yourself.")}
                </span>
              )}
              {k && !e.how && <em className="ss-secret">{tr("Kết cục bí ẩn", "Secret ending")}</em>}
              {k ? <em>{tr("Đã gặp ", "Encountered ")}{k}{tr(" lần", " times")}</em> : null}
              {stats && (
                <i className="ss-rarity">
                  {(stats.counts[e.id] ?? 0) === 0 ? tr('Chưa ai trong giang hồ mở được', "No one in the jianghu has unlocked this yet") : tr(`${stats.counts[e.id]} người đã mở (${pct(e.id)}%)`, `${stats.counts[e.id]} unlocked (${pct(e.id)}%)`)}
                  {firsts[e.id] ? tr(` · đầu tiên: @${firsts[e.id]}`, ` · first: @${firsts[e.id]}`) : ''}
                </i>
              )}
            </article>
          );
        })}
      </div>
      {SON_MON_ON && <SmSoSinhTu />}
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{tr("Kỳ ngộ chuyển đạo", "Path-changing encounters")}</h2>
        <p className="note" style={{ marginTop: 0 }}>
          
          {tr("Đã gặp ", "Encountered ")}{(meta?.daoBook ?? []).length}/{CHUYEN_DAO.length}{tr(". Mỗi kỳ ngộ cho đổi sang một con đường giữa kiếp, mất 30% tu vi, mỗi kiếp một lần, từ Trúc Cơ trở lên.", ". Each encounter lets you switch to another Path mid-life at the cost of 30% of your cultivation, once per life, from Foundation Establishment up.")}
        </p>
        <div className="ss-grid">
          {CHUYEN_DAO.map((d) => {
            const k = meta?.daoBook?.includes(d.id);
            return (
              <article key={d.id} className={`ss-card ${k ? 'open' : 'locked'}`} style={{ ['--rc' as string]: PATHS[d.to].aura } as CSSProperties}>
                <small>{tr("Sang ", "To ")}{PATHS[d.to].name}</small>
                <b>{k ? d.name : '???'}</b>
                <span className={k ? '' : 'ss-how secret'}>{d.hint}</span>
              </article>
            );
          })}
        </div>
      </section>
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{tr("Thành tựu", "Achievements")}</h2>
        <p className="note" style={{ marginTop: 0 }}>
          
          {tr("Đã đạt ", "Earned ")}{(meta?.achievements ?? []).length}/{ACHIEVEMENTS.length}{tr(". Mỗi thành tựu thưởng phúc duyên, chấm khi một kiếp kết thúc.", ". Each achievement grants Fortune, tallied when a life ends.")}
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
                    {a.desc} · +{a.reward}{tr(" phúc", " Fortune")}
                  </small>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="panel" style={{ marginTop: 10 }}>
        <h2>{tr("Sổ linh thú", "Spirit beast register")}</h2>
        <p className="note" style={{ marginTop: 0 }}>
          
          {tr("Đã từng nuôi ", "Raised ")}{book.length}/{PET_IDS.length}{tr(" loài. Linh thú được ghi vào sổ khi một kiếp kết thúc mà nó còn theo bạn.", " species. A spirit beast is recorded when a life ends with it still at your side.")}
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
        <h2>{tr("Thiên phú có thể gieo được", "Rollable talents")}</h2>
        <p className="note" style={{ marginTop: 0 }}>
          {GIFTS.length}{tr(" loại. Tỉ lệ: Phàm 58% · Linh 28% · Huyền 11% · Địa 2.9% · Thiên 0.1%", " kinds. Odds: Mortal 58% · Spirit 28% · Mystic 11% · Earth 2.9% · Heaven 0.1%")}
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
        
        {tr("Chơi tiếp", "Keep playing")}
      </Link>
    </main>
  );
}

/** 21/11: thanh tiến độ "24/30" cho mảnh chưa mở, đo được từ hồ sơ */
function TtTien({ v: [co, can] }: { v: [number, number] }) {
  const x = Math.min(co, can);
  return (
    <span className="tt-tien" role="progressbar" aria-valuemin={0} aria-valuemax={can} aria-valuenow={x} aria-label={tr(`Đã có ${x} trên ${can}`, `${x} of ${can}`)}>
      <i style={{ width: `${(x / can) * 100}%` }} />
      <b>
        {x}/{can}
      </b>
    </span>
  );
}

/** 21/11 (Tyler: người chơi không biết mình đang có bao nhiêu, cần làm gì tiếp): thẻ "Bước tiếp theo" đầu mỗi quyển.
 *  Số liệu: 300 người đạt Quy Nhất nhưng 185 người đứng ở 3-5/10 mảnh quyển II, chỉ 24 người xong. */
function TtBuocTiep({ meta, tab, open2, open3 }: { meta: Meta | null; tab: 1 | 2 | 3; open2: boolean; open3: boolean }) {
  if (!meta) return null;
  let ten = '';
  let cach = '';
  let tien: [number, number] | null = null;
  if (tab === 2 && !open2) {
    const n1 = lore1Count(meta);
    ten = tr('Mở phong ấn Quyển II', 'Break the seal of Volume II');
    cach = n1 < LORE_TOTAL
      ? tr(`Gom đủ ${LORE_TOTAL} mảnh Quyển I trước, rồi kiếp sau chọn buông bỏ khi gặp lại chính mình (kết cục Vạn Kiếp Quy Nhất).`, `Collect all ${LORE_TOTAL} Volume I shards first, then in the next life choose to let go when you meet yourself (Ten Thousand Lives Become One).`)
      : tr('Đủ 10 mảnh rồi. Kiếp sau bạn sẽ gặp lại chính mình: chọn buông bỏ để đạt Vạn Kiếp Quy Nhất.', 'All 10 shards found. Next life you will meet yourself: choose to let go to reach Ten Thousand Lives Become One.');
    tien = [Math.min(n1, LORE_TOTAL), LORE_TOTAL];
  } else if (tab === 3 && !open3) {
    ten = tr('Mở Quyển III', 'Open Volume III');
    // 21/11 (Tyler): hiện quyển III nhưng không để cách giải
    cach = tr('Đi hết Quyển II thì quyển này tự mở.', 'Finish Volume II and this volume opens.');
    tien = open2 ? [lore2Count(meta), LORE2_TOTAL] : null;
  } else if (tab === 3) {
    const i = TT3_PAGES.findIndex((p) => !meta.endings?.[p.id]);
    if (i < 0) return null;
    ten = TT3_PAGES[i].title.split('.')[0] + '. ???';
    cach = tr('Quyển này không có lời gợi ý. Cứ sống, trang sau sẽ tự tìm tới.', 'This volume gives no hints. Keep living; the next page will find you.');
  } else {
    const list = tab === 1 ? LORE1 : LORE2;
    const f = list.find((x) => !meta.lore?.includes(x.id));
    if (!f) return null;
    ten = f.title.split('.')[0] + '. ???';
    cach = f.hint;
    tien = f.tien ? f.tien(meta) : null;
  }
  return (
    <div className="tt-buoc">
      <small>{tr('Bước tiếp theo', 'Next step')}</small>
      <b>{ten}</b>
      <p>{cach}</p>
      {tien && <TtTien v={tien} />}
      <small className="tt-buoc-chu">{tr('Mảnh mới mở khi một kiếp khép lại.', 'New shards unlock when a life closes.')}</small>
    </div>
  );
}

/** Thiên thư hai quyển: Quyển II bị phong ấn tới khi đạt Vạn Kiếp Quy Nhất */
function ThienThu({ meta }: { meta: Meta | null }) {
  const open2 = quyNhatDone(meta);
  const [tab, setTab] = useState<1 | 2 | 3>(1);
  // 21/11: tab quyển III luôn hiện (khóa) để người chơi biết còn đường đi tiếp; mở khi xong quyển II (gõ hay đập chuông)
  const show3 = TT3_ON;
  const open3 = tt3Open(meta);
  useEffect(() => {
    if (open3) setTab(3);
    else if (open2) setTab(2);
  }, [open2, open3]);
  const n1 = lore1Count(meta);
  const n2 = lore2Count(meta);
  const list: LoreFragment[] = tab === 1 ? LORE1 : LORE2;
  const n3 = tt3PageCount(meta);
  const nhanh = tt3NhanhOf(meta);
  return (
    <section className="panel thien-thu" id="thien-thu" style={{ marginBottom: 10 }}>
      <h2>{tr("Thiên thư · Vạn Kiếp", "Heavenly Tome · Ten Thousand Lives")}</h2>
      <div className="tt-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 1} className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>
          
          {tr("Quyển I · Vạn Kiếp ", "Volume I · Ten Thousand Lives ")}<small>{n1}/{LORE_TOTAL}</small>
        </button>
        <button role="tab" aria-selected={tab === 2} className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>
          {open2 ? tr('Quyển II · Vạn Mảnh', "Volume II · Ten Thousand Shards") : tr('🔒 Quyển II', "🔒 Volume II")} <small>{open2 ? `${n2}/${LORE2_TOTAL}` : tr('phong ấn', "sealed")}</small>
        </button>
        {show3 && (
          <button role="tab" aria-selected={tab === 3} className={tab === 3 ? 'on' : ''} onClick={() => (setTab(3), track('tt3_tab', { open: open3 }))}>
            {open3 ? tr('Quyển III · Cơm Chiều', 'Volume III · Evening Rice') : tr('🔒 Quyển III', '🔒 Volume III')} <small>{open3 ? `${n3}/${TT3_PAGES.length}` : tr('phong ấn', 'sealed')}</small>
          </button>
        )}
      </div>
      <TtBuocTiep meta={meta} tab={tab} open2={open2} open3={open3} />
      {tab === 3 ? (
        open3 ? (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              {tr('Chuông đã có số phận của nó. Vậy mà chiều nào cũng còn một tiếng nhỏ hơn. Trang mới mở khi một kiếp khép lại, theo đúng thứ tự. Đã mở ', 'The bell has met its fate. Yet every evening a smaller sound remains. A new page opens when a life closes, in order. Opened ')}
              {n3}/{TT3_PAGES.length}.
            </p>
            <ol className="tt-list">
              {TT3_PAGES.map((p, i) => {
                const has = !!meta?.endings?.[p.id];
                const ke = !has && TT3_PAGES.slice(0, i).every((x) => !!meta?.endings?.[x.id]);
                const last = has && !TT3_PAGES.slice(i + 1).some((x) => !!meta?.endings?.[x.id]);
                return (
                  <li key={p.id} className={has ? 'has' : ''}>
                    {has ? (
                      <details open={last}>
                        <summary>{p.title}</summary>
                        <p>{nhanh === 'dap' && p.text2 ? p.text2 : p.text}</p>
                      </details>
                    ) : (
                      <>
                        <b>{p.title.split('.')[0] + '. ???'}</b> <small>{ke ? tr('Trang kế tiếp.', 'Next page.') : tr('Mở trang trước đã.', 'Open the page before first.')}</small>
                      </>
                    )}
                  </li>
                );
              })}
              <li>
                <b>XXVI. ???</b> <small>{tr('Còn đang chép.', 'Still being copied.')}</small>
              </li>
            </ol>
          </>
        ) : (
          <p className="note tt-phong" style={{ marginTop: 0 }}>
            {tr('Quyển III "Cơm Chiều" đang bị phong ấn: 20 trang (XXI-XL), chưa ai biết cách mở trang nào. Đi hết Quyển II thì phong ấn tự tan.', 'Volume III "Evening Rice" is sealed: 20 pages (XXI-XL), and no one knows how each opens. Finish Volume II and the seal breaks.')}
          </p>
        )
      ) : tab === 1 ? (
        <p className="note" style={{ marginTop: 0 }}>
          
          {tr("Vì sao bạn cứ phải luân hồi mãi? Mỗi mảnh ký ức mở khi đạt một cột mốc lớn qua các kiếp. Đã mở ", "Why must you keep reincarnating? Each memory shard unlocks when you reach a major milestone across your lives. Unlocked ")}{n1}/{LORE_TOTAL}.
          {n1 >= LORE_TOTAL && !open2 ? tr(' Đã đủ: kiếp sau, bạn sẽ gặp lại chính mình.', " Complete: in your next life, you will meet yourself again.") : ''}
          {open2 ? tr(' Bạn đã gom lại chính mình. Nhưng tiếng chuông vẫn chưa im.', " You have gathered yourself back together. But the bell has not yet fallen silent.") : ''}
        </p>
      ) : open2 ? (
        <p className="note" style={{ marginTop: 0 }}>
          
          {tr("Chân Nhân không chỉ vỡ làm một mảnh là bạn. Những đạo hữu trên giang hồ cũng là mảnh vỡ, và có kẻ vẫn đang đếm. Mảnh mới mở khi một kiếp khép lại. Đã mở ", "The True One did not shatter into just one shard that is you. The fellow Daoists of the jianghu are shards too, and someone is still counting. A new shard unlocks when a life closes. Unlocked ")}{n2}/{LORE2_TOTAL}.
        </p>
      ) : (
        <p className="note tt-phong" style={{ marginTop: 0 }}>
          
          {tr("Quyển sách bị niêm bằng một sợi chỉ vàng. Gom đủ 10 mảnh Quyển I và đạt kết cục Vạn Kiếp Quy Nhất để mở phong ấn.", "The book is sealed with a golden thread. Collect all 10 shards of Volume I and reach the ending Ten Thousand Lives Become One to break the seal.")}
        </p>
      )}
      {tab !== 3 && (tab === 1 || open2) && (
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
                    {meta && f.tien && <TtTien v={f.tien(meta)} />}
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
