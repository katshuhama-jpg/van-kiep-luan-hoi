'use client';

/**
 * 4.5.0 Ngày 3: huyệt trên giao diện. Chân thân với chấm huyệt, bảng Tam Tài (Thân, Khí, Đạo), phần chân thân ở màn cáo biệt,
 * thẻ trang chủ, chip thử thách trong kiếp, dòng Tam Tài ở màn đầu thai, cảnh "Chân thân thức tỉnh", tủ ngoại trang.
 * Lời dẫn lấy đúng từng chữ ở doc "Kế hoạch 4.5.0", mục "Kịch bản và lời dẫn". Giấu sau cờ CHAN_THAN_ON.
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CT_REWARD_BASE, ctLayers } from '@/lib/game/chanThan';
import {
  COI,
  CT_REWARDS,
  DAO,
  HANH,
  HUYET,
  HUYET_POS,
  HUYET_TIER_NAME,
  daoDone,
  huyetChip,
  huyetCount,
  huyetGiftLine,
  huyetGiftsNow,
  huyetWaitLine,
  khaiAfterLife,
  khaiCheck,
  nextHuyet,
  tamTaiCount,
  tamTaiNews,
  type DaoExt,
} from '@/lib/game/khaiMach';
import { updateCareer } from '@/lib/game/hook';
import { alsoEndings, endingOf } from '@/lib/game/endings';
import type { Character, ChanThanLook, Meta } from '@/lib/game/types';
import type { Player } from '@/lib/auth';
import { ctExt, loadAll, saveMeta } from '@/lib/storage';
import { musicPref } from '@/lib/music';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';
import { CtFlow, LpcFigure, TamTaiReview } from './ChanThan';

type Look = Pick<ChanThanLook, 'gender' | 'skin' | 'hair' | 'hairColor' | 'outfit'>;

// ---------------- Chân thân có chấm huyệt ----------------

/**
 * Chân thân với 10 chấm huyệt dọc thân (pixel). `open` huyệt đã khai sáng lên; `flash` là huyệt vừa khai (to hơn, chớp).
 * `eyes=false` vẽ chân thân nhắm mắt (bỏ lớp mắt), dùng cho cảnh thức tỉnh.
 */
export function HuyetBody({ ct, open, size = 140, flash, eyes = true, className, rise }: { ct: Look; open: number; size?: number; flash?: number | null; eyes?: boolean; className?: string; rise?: boolean }) {
  const layers = useMemo(() => {
    const l = ctLayers(ct);
    return eyes ? l : l.filter((x) => !x.key.startsWith('eyes'));
  }, [ct, eyes]);
  const dot = Math.max(4, Math.round(size / 40));
  return (
    <div className={`hb ${className ?? ''}`} style={{ width: size, height: size }}>
      <LpcFigure layers={layers} size={size} />
      {HUYET.map((h) => {
        const p = HUYET_POS[h.id];
        const lit = h.id <= open;
        const big = flash === h.id;
        const d = big ? dot * 2 : dot;
        return (
          <span
            key={h.id}
            className={`hb-dot ${lit ? 'lit' : ''} ${big ? 'flash' : ''}`}
            style={{ left: Math.round(p.x * size - d / 2), top: Math.round(p.y * size - d / 2), width: d, height: d, animationDelay: rise ? `${(h.id - 1) * 0.5}s` : undefined } as CSSProperties}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

/** Thanh 10 ô Thập Kiếp (huyệt đã khai) */
export function HuyetBar({ n, flash }: { n: number; flash?: number | null }) {
  return (
    <span className="hb-bar" role="img" aria-label={tr(`${n}/10 huyệt đã khai`, `${n}/10 points open`)}>
      {HUYET.map((h) => (
        <i key={h.id} className={`${h.id <= n ? 'on' : ''} ${flash === h.id ? 'flash' : ''}`} />
      ))}
    </span>
  );
}

// ---------------- Số liệu Nghĩa trang (Hương Hỏa, Từ Bi) ----------------

export function useCtExt(user: Player | null, on = true): DaoExt {
  const [ext, setExt] = useState<DaoExt>({});
  useEffect(() => {
    if (!on || !user) return;
    let live = true;
    ctExt(user).then((x) => live && x && setExt(x));
    return () => {
      live = false;
    };
  }, [user, on]);
  return ext;
}

// ---------------- Bảng Tam Tài ----------------

type TtTab = 'than' | 'khi' | 'dao';

export function TamTaiBoard({ meta, ext = {}, onHelp, tab0 = 'than' }: { meta: Meta; ext?: DaoExt; onHelp?: () => void; tab0?: TtTab }) {
  const [tab, setTab] = useState<TtTab>(tab0);
  const n = huyetCount(meta);
  const tier = HUYET_TIER_NAME();
  const done = daoDone(meta, ext);
  const hanh = meta.career?.hanh ?? {};
  const tabs: { id: TtTab; label: string; got: string }[] = [
    { id: 'than', label: tr('Thân', 'Body'), got: `${n}/10` },
    { id: 'khi', label: tr('Khí', 'Breath'), got: `${HANH.filter((h) => (hanh[h.id] ?? 0) >= 3).length}/5` },
    { id: 'dao', label: tr('Đạo', 'Dao'), got: `${done.length}/27` },
  ];
  return (
    <div className="ttai-board">
      <div className="ttai-head">
        <b>{tr(`Tam Tài ${tamTaiCount(meta, ext)}/42`, `Three Treasures ${tamTaiCount(meta, ext)}/42`)}</b>
        {onHelp && (
          <button className="icon-btn ttai-help" onClick={onHelp} aria-label={tr('Xem lại Tam Tài Đồ', 'Review the Three Treasures')}>
            ?
          </button>
        )}
      </div>
      <div className="ct-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`ct-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label} <small>{t.got}</small>
          </button>
        ))}
      </div>
      {tab === 'than' && (
        <ol className="ttai-list">
          {HUYET.map((h) => {
            const open = h.id <= n;
            const next = h.id === n + 1;
            return (
              <li key={h.id} className={`ttai-row ${open ? 'on' : next ? 'next' : 'off'}`}>
                <span className="ttai-no">{h.id}</span>
                <span className="ttai-body">
                  <b>
                    {h.name} <small className={`ttai-tier t-${h.tier}`}>{tier[h.tier]}</small>
                  </b>
                  <span>{open ? tr(`Đã khai: ${h.task}`, `Opened: ${h.task}`) : next ? tr(`Đang đợi: ${h.task}`, `Waiting: ${h.task}`) : tr(`Khai huyệt ${h.id - 1} trước. Thử thách: ${h.task}`, `Open point ${h.id - 1} first. Trial: ${h.task}`)}</span>
                  <small>{tr(`Lợi ích: ${h.gift}`, `Gift: ${h.gift}`)}</small>
                </span>
              </li>
            );
          })}
          <li className="ttai-foot">{tr('Mỗi kiếp tối đa 1 huyệt, xét lúc kiếp khép lại.', 'At most 1 point per life, checked when the life ends.')}</li>
        </ol>
      )}
      {tab === 'khi' && (
        <div className="ttai-khi">
          {HANH.map((h) => {
            const t = hanh[h.id] ?? 0;
            return (
              <div key={h.id} className="ttai-hanh" style={{ ['--hc' as string]: h.color } as CSSProperties}>
                <b>{h.name}</b>
                <span className="ttai-tiers">
                  {[tr('Hóa Thần', 'Spirit Tr.'), tr('Phi thăng', 'Ascend'), tr('Chứng Đạo', 'Dao')].map((lab, k) => (
                    <span key={k} className={`ttai-tierbox ${t > k ? 'on' : ''}`}>
                      {lab}
                    </span>
                  ))}
                </span>
                <small>{t >= 3 ? tr(`${h.name} Viên Mãn`, `${h.name} Perfected`) : tr(`Tầng kế: một kiếp mệnh ${h.name} ${['lên Hóa Thần', 'phi thăng', 'Chứng Đạo'][t]}`, `Next tier: a ${h.name}-fated life ${['reaches Spirit Transformation', 'ascends', 'attains the Dao'][t]}`)}</small>
              </div>
            );
          })}
          <p className="ttai-foot">{tr('Bản mệnh mỗi kiếp vẫn do trời định. Tầng hành chỉ để ngắm: hào quang, ngoại trang, danh hiệu.', 'Each life’s element is still decided by Heaven. Element tiers are cosmetic: aura, outfit, title.')}</p>
        </div>
      )}
      {tab === 'dao' && (
        <div className="ttai-dao">
          {COI.map((coi) => {
            const list = DAO.filter((d) => d.coi === coi.id);
            const got = list.filter((d) => done.includes(d.id)).length;
            return (
              <section key={coi.id} className={`ttai-coi c-${coi.id}`}>
                <h3>
                  {coi.name} <small>{got}/9 · {coi.id === 'thien' ? tr('sao trên đầu', 'stars above') : coi.id === 'tran' ? tr('ấn dưới chân', 'seals below') : tr('hồn đăng trong bóng', 'lamps in the shadow')}</small>
                </h3>
                <ul>
                  {list.map((d) => {
                    const on = done.includes(d.id);
                    const hide = d.hidden && !on;
                    return (
                      <li key={d.id} className={on ? 'on' : ''}>
                        <i className={`ttai-mark m-${coi.id}`} aria-hidden="true" />
                        <span>
                          <b>{hide ? '?' : d.name}</b>
                          <small>{hide ? tr('Đạo ẩn: tự tìm ra cách ngộ', 'Hidden Dao: find the way yourself') : on ? d.line : d.how}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Bảng Tam Tài nổi (mở từ chip trong kiếp, dòng ở màn đầu thai) */
export function TamTaiSheet({ meta, ext, from, onClose }: { meta: Meta; ext?: DaoExt; from: string; onClose: () => void }) {
  const [help, setHelp] = useState(false);
  useEffect(() => {
    track('huyet_view', { from });
  }, [from]);
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet ttai-sheet" role="dialog" aria-modal="true" aria-label={tr('Tam Tài', 'Three Treasures')} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{meta.chanThan?.name ?? tr('Chân thân', 'True Self')}</h2>
          <button className="btn" onClick={onClose}>
            {tr('Đóng', 'Close')}
          </button>
        </div>
        <TamTaiBoard meta={meta} ext={ext} onHelp={() => (track('huyet_intro_open', { from }), setHelp(true))} />
        <Link href="/chan-than" className="btn" style={{ display: 'block', textDecoration: 'none', marginTop: 10, textAlign: 'center' }}>
          {tr('Trang chân thân ›', 'True Self page ›')}
        </Link>
      </div>
      {help && <TamTaiReview meta={meta} from={from} onClose={() => setHelp(false)} />}
    </div>
  );
}

// ---------------- Màn cáo biệt ----------------

/** Hồ sơ dự tính sau khi kiếp khép lại (để màn cáo biệt báo trước huyệt, hành, đạo; số thật ghi lúc lập bia) */
export function metaAfterLife(meta: Meta, c: Character): Meta {
  const career = updateCareer(meta, c).career;
  const endings = [endingOf(c).id, ...alsoEndings(c)].reduce((e, id) => ({ ...e, [id]: (e[id] ?? 0) + 1 }), { ...(meta.endings ?? {}) } as Record<string, number>);
  return khaiAfterLife({ ...meta, career, endings, chuongWin: meta.chuongWin || !!c.qf?.chuongWin }, c);
}

/** Chân thân của người chơi ở màn cáo biệt: huyệt vừa khai chớp sáng, thanh 10 ô, thử thách kế, tối đa 2 dòng khai mở (huyệt trước) */
export function CtFarewell({ c, meta }: { c: Character; meta: Meta }) {
  const ct = meta.chanThan;
  const after = useMemo(() => (ct ? metaAfterLife(meta, c) : meta), [meta, c, ct]);
  if (!ct) return null;
  const h = khaiCheck(meta, c);
  const n = huyetCount(after);
  const news = tamTaiNews(meta, after).slice(0, 2);
  const nx = nextHuyet(after);
  const before = nextHuyet(meta);
  return (
    <div className="ct-farewell">
      <div className="ctf-top">
        <HuyetBody ct={ct} open={n} flash={h?.id ?? null} size={120} />
        <div className="ctf-side">
          <small>{tr('Chân thân', 'True self')}</small>
          <b>{ct.name}</b>
          <HuyetBar n={n} flash={h?.id ?? null} />
          <small>{tr(`Thập Kiếp ${n}/10 huyệt`, `${n}/10 great points`)}</small>
        </div>
      </div>
      {news.map((x, k) => (
        <p key={k} className={`ctf-line k-${x.kind}`}>
          {x.text}
          {x.kind === 'huyet' && h && <small>{huyetGiftLine(h)}</small>}
        </p>
      ))}
      {!h && before && <p className="ctf-wait">{huyetWaitLine(before)}</p>}
      {h && nx && <p className="ctf-next">{tr(`Huyệt kế: ${nx.name}, ${nx.task}.`, `Next point: ${nx.name}, ${nx.task}.`)}</p>}
    </div>
  );
}

// ---------------- Trang chủ ----------------

export function HomeCtCard({ meta }: { meta: Meta }) {
  const ct = meta.chanThan;
  if (!ct) return null;
  const n = huyetCount(meta);
  const h = nextHuyet(meta);
  const gifts = huyetGiftsNow(meta);
  return (
    <Link href="/chan-than" className="ct-home" onClick={() => track('ct_card_tap', { n })}>
      <HuyetBody ct={ct} open={n} size={84} />
      <span className="cth-body">
        <span className="cth-name">
          <small>{tr('Chân thân', 'True self')}</small> <b>{ct.name}</b>
        </span>
        <HuyetBar n={n} />
        <span className="cth-next">{h ? huyetChip(h) : tr('Mười huyệt đã khai. Khai Mạch.', 'All ten points open. Meridians Opened.')}</span>
        <small className="cth-gift">{gifts ? tr(`Đang hưởng: ${gifts}`, `Enjoying: ${gifts}`) : tr('Chưa khai huyệt nào', 'No point open yet')}</small>
      </span>
      <span className="cth-go" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

// ---------------- Trong kiếp: chip thử thách ----------------

/** Chip góc trên trái sân khấu: chỉ ghi thử thách (không vẽ chân thân trong kiếp). Đạt thử thách thì chuyển vàng. */
export function HuyetChip({ meta, c, shift, onOpen }: { meta: Meta; c: Character; shift?: boolean; onOpen: () => void }) {
  const h = nextHuyet(meta);
  if (!meta.chanThan || !h || c.dead) return null;
  const rung = !!khaiCheck(meta, c);
  return (
    <button className={`hy-chip ${rung ? 'rung' : ''} ${shift ? 'shift' : ''}`} onClick={onOpen} aria-label={`${huyetChip(h)}. ${tr('Chạm mở bảng Tam Tài', 'Tap to open the Three Treasures')}`}>
      <i aria-hidden="true" />
      <span>{huyetChip(h)}</span>
    </button>
  );
}

// ---------------- Chân thân thức tỉnh (huyệt 10) ----------------

function bell(freq = 220, vol = 0.14) {
  if (typeof window === 'undefined' || !musicPref()) return;
  try {
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
    const ctx = new AC();
    const t = ctx.currentTime;
    for (const [f, v] of [
      [freq, 1],
      [freq * 2.38, 0.4],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(vol * v, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 2.2);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 2.3);
    }
    setTimeout(() => ctx.close().catch(() => {}), 2600);
  } catch {
    /* không phát được tiếng: bỏ qua */
  }
}

const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53 + 11) % 100, s: i % 5 === 0 ? 4 : 2 }));

/** 4 nhịp: im lặng; mười huyệt sáng, mỗi huyệt một tiếng chuông; mở mắt; danh hiệu. Chạm để qua, có nút Bỏ qua. */
export function ThucTinh({ ct, onDone }: { ct: Look; onDone: () => void }) {
  const [i, setI] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    if (i === 1) for (let k = 0; k < 10; k++) timers.current.push(window.setTimeout(() => bell(196 + k * 22), 500 * k));
    return () => timers.current.forEach((t) => clearTimeout(t));
  }, [i]);
  const lines = ['', tr('Mười tiếng chuông.', 'Ten tolls of the bell.'), tr('Lần này, người tỉnh dậy là ngươi.', 'This time, the one who wakes is you.'), tr('Khai Mạch.', 'Meridians Opened.')];
  const next = () => (i >= 3 ? onDone() : setI(i + 1));
  return (
    <div className="ct-flow ttai-wake" role="dialog" aria-modal="true" aria-label={tr('Chân thân thức tỉnh', 'The true self awakens')}>
      <div className="ct-scene" onClick={next} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && next()} data-beat={i}>
        <span className="ttai-stars" aria-hidden="true">
          {STARS.map((s, k) => (
            <i key={k} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }} />
          ))}
        </span>
        <button
          className="ct-skip"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
        >
          {tr('Bỏ qua', 'Skip')}
        </button>
        <div className="ct-stage">
          <HuyetBody ct={ct} open={i === 0 ? 0 : 10} size={200} eyes={i >= 2} rise={i === 1} className={`tw-b${i}`} />
        </div>
        {i === 3 ? (
          <h2 className="ttai-wake-title" key="t">
            {lines[3]}
          </h2>
        ) : (
          <p className="ct-line" key={i}>
            {lines[i] || ' '}
          </p>
        )}
        <small className="ct-tap">{tr('Chạm để tiếp', 'Tap to continue')}</small>
      </div>
    </div>
  );
}

// ---------------- Tủ ngoại trang ----------------

export function CtWardrobe({ meta, ext = {}, onWear }: { meta: Meta; ext?: DaoExt; onWear: (outfit: number) => void }) {
  const ct = meta.chanThan;
  if (!ct) return null;
  const list = CT_REWARDS();
  return (
    <section className="ttai-ward">
      <h3>
        {tr('Tủ ngoại trang', 'Wardrobe')} <small>{list.filter((r) => r.has(meta, ext)).length}/{list.length}</small>
      </h3>
      <div className="ttai-ward-grid">
        {list.map((r, k) => {
          const has = r.has(meta, ext);
          const id = CT_REWARD_BASE + k;
          const on = ct.outfit === id;
          return has ? (
            <button key={r.id} className={`ttai-ward-cell ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onWear(id)}>
              <LpcFigure layers={ctLayers({ ...ct, outfit: id })} size={64} />
              <small>{r.name}</small>
              <small className="ttai-ward-st">{on ? tr('Đang mặc', 'Wearing') : tr('Chạm để mặc', 'Tap to wear')}</small>
            </button>
          ) : (
            <div key={r.id} className="ttai-ward-cell lock">
              <span className="ttai-lock" aria-hidden="true" />
              <small>{r.name}</small>
              <small className="ttai-ward-st">{tr(`Khóa. Cách mở: ${r.hint}`, `Locked. To unlock: ${r.hint}`)}</small>
            </div>
          );
        })}
      </div>
      <small className="ct-note">{tr('Mười bộ khởi đầu đổi ở "Đổi ngoại hình". Ngoại trang ở đây chỉ để ngắm.', 'The ten starting outfits are in "Change appearance". These outfits are cosmetic only.')}</small>
    </section>
  );
}

/** Dòng nhỏ ở màn đầu thai: "Tam Tài 20/42", chạm mở bảng */
export function TamTaiLine({ meta, ext, onOpen }: { meta: Meta; ext?: DaoExt; onOpen: () => void }) {
  if (!meta.chanThan) return null;
  return (
    <button className="ttai-line" onClick={onOpen}>
      {tr(`Tam Tài ${tamTaiCount(meta, ext)}/42`, `Three Treasures ${tamTaiCount(meta, ext)}/42`)}
      <small>{tr(' · chạm xem bảng', ' · tap to view')}</small>
    </button>
  );
}

// ---------------- Trang chủ: thẻ chân thân, hoặc mở luồng tạo cho người cũ ----------------

/**
 * Đã có chân thân: thẻ "Chân thân" (dưới dải giang hồ, trên nút Lôi đài).
 * Người đã có kiếp mà chưa có chân thân: lần đầu vào sau bản này thì mở Mộng Tỉnh, màn tạo, Tam Tài Đồ.
 * Màn tạo phải xong mới đi tiếp (có nút Thuận theo duyên nên chỉ mất một chạm). Chỉ tải hồ sơ khi cờ bật.
 */
export function HomeCt({ user, ready, on }: { user: Player | null; ready: boolean; on: boolean }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    if (!on || !ready) return;
    let live = true;
    loadAll(user)
      .then(({ meta: m }) => live && setMeta(m))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [on, ready, user]);
  if (!on || !meta) return null;
  if (meta.chanThan) return <HomeCtCard meta={meta} />;
  if ((meta.lives ?? 0) < 1) return null;
  return (
    <CtFlow
      meta={meta}
      dead={null}
      from="home"
      onDone={(ct) => {
        const m2 = { ...meta, chanThan: ct };
        setMeta(m2);
        saveMeta(user, m2).catch(() => {});
      }}
    />
  );
}
