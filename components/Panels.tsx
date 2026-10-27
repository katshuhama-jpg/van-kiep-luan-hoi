'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ENDINGS, RARE_COLOR, endingOf } from '@/lib/game/endings';
import { GachaPanel, ShareCard } from './Extras';
import ItemIconImg from './ItemIcon';
import { FOCUS, ITEMS, PATHS, PILLS, REALMS, SEASONS, TALENTS, fxText, gearFx, itemPrice, overworkFree, pillPrice, safeYears, RARE_STOCK_REALM, realmLabel, soldOut, type Item } from '@/lib/game/data';
import { describeLean } from '@/lib/game/engine';
import { DANGER_TEXT, MONSTERS, combatLevel, dangerOf, dropFactor, monstersFor, effLv, killExp, monsterName, playerStats, tierOf } from '@/lib/game/combat';
import { MonsterSprite } from './Battle';
import { cultPct, fmt, needFor } from '@/lib/game/helpers';
import type { Character, Focus, LogEntry, Meta, PendingEvent, Slot } from '@/lib/game/types';
import { QUEST_BONUS, QUEST_REWARD, dailyOf, omenToday, evalQuests, nearEndings, pickProphecy, questName } from '@/lib/game/hook';
import { HIDDEN_ITEMS, collectStats, isHidden, itemHint } from '@/lib/game/collect';
import { sectSide, rankName, rankShort } from '@/lib/game/sect';
import { KiepSoBlock, ManhBaBridge, luanHoiSummary, useNow } from './LuanHoi';
import Sprite from './Sprite';
import { BIG_TALENTS, honActive, ksBase, ksOf, ksOneBig } from '@/lib/game/luanHoi';
import { LORE, LORE2_TOTAL, LORE_TOTAL, lore1Count, lore2Count, quyNhatDone } from '@/lib/game/lore';
import { ELEMENTS } from '@/lib/game/nguhanh';
import { CheckinRow, TodayScroll } from './Hook';
import { ArenaNudge } from './LoiDaiButton';
import { useAuth } from '@/lib/useAuth';
import { addFeedback } from '@/lib/storage';

/* ---------------- Khung hộp thoại ---------------- */
export function Sheet({ title, onClose, children }: { title: string; onClose?: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="btn" onClick={onClose} aria-label="Đóng">
              Đóng
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Chỉ số ---------------- */
function Bar({ label, value, pct, color, wide }: { label: string; value: string; pct: number; color: string; wide?: boolean }) {
  return (
    <div className={`stat ${wide ? 'wide' : ''}`}>
      <div className="row">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export function StatsPanel({ c }: { c: Character }) {
  const s = c.stats;
  const daoPct = (c.daoTam + 100) / 200;
  return (
    <section className="panel" aria-label="Chỉ số">
      <div className="stats">
        <Bar
          wide
          label={c.realm === 0 ? 'Tu vi (chưa nhập đạo)' : `Tu vi · ${realmLabel(c.realm, c.layer, c.cosmos)}`}
          value={c.realm === 0 ? `${fmt(c.cultivation)}/40` : `${fmt(c.cultivation)}/${fmt(needFor(c))}`}
          pct={c.realm === 0 ? c.cultivation / 40 : cultPct(c)}
          color="#2f6b5a"
        />
        <Bar label="Thọ nguyên" value={`${Math.floor(c.age)}/${c.lifespan}`} pct={c.age / c.lifespan} color="#b8432f" />
        <Bar label="Sức khỏe" value={`${s.sucKhoe}`} pct={s.sucKhoe / 100} color="#d96a4a" />
        <Bar label="Tâm cảnh" value={`${s.tamCanh}`} pct={s.tamCanh / 100} color="#c9962e" />
        <Bar label="Tâm ma" value={`${s.tamMa}`} pct={s.tamMa / 100} color="#5a1a2a" />
        <Bar label="Ngộ tính" value={`${s.ngoTinh}`} pct={s.ngoTinh / 100} color="#5b6fb0" />
        <Bar label="Khí vận" value={`${s.khiVan}`} pct={s.khiVan / 100} color="#7a5ab0" />
        <div className="dao">
          <div className="row">
            <span style={{ color: 'var(--chinh)' }}>Chính</span>
            <span>Đạo tâm: {describeLean(c.daoTam)}</span>
            <span style={{ color: 'var(--ta)' }}>Tà</span>
          </div>
          <div className="dao-track" role="meter" aria-label="Đạo tâm" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={c.daoTam}>
            <div style={{ background: '#a8c4e6' }} />
            <div style={{ background: '#d8cfc0' }} />
            <div style={{ background: '#e4a0a6' }} />
            <span className="dao-mark" style={{ left: `${(1 - daoPct) * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Sự kiện 4 lựa chọn ---------------- */
const LEAN_TEXT = { chinh: 'Chính', ta: 'Tà', trung: '' };

export function EventCard({ p, onChoose }: { p: PendingEvent; onChoose: (i: number) => void }) {
  return (
    <section className="dialog event" aria-live="assertive" key={p.id + p.text}>
      <div className="event-head">
        <h2>{p.title}</h2>
        <span>❚❚ dừng</span>
      </div>
      <p>{p.text}</p>
      <div className="choices">
        {p.choices.map((ch, i) => (
          <button key={i} className={`choice ${ch.lean}`} onClick={() => onChoose(i)}>
            <span>
              {String.fromCharCode(65 + i)}. {ch.label}
            </span>
            {ch.hint && <small>{ch.hint}</small>}
            {LEAN_TEXT[ch.lean] && <span className="lean-tag">{LEAN_TEXT[ch.lean]}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Gia phả ---------------- */
export function LogPanel({ log }: { log: LogEntry[] }) {
  const [all, setAll] = useState(false);
  const items = [...log].reverse().slice(0, all ? 400 : 25);
  const ref = useRef<HTMLElement>(null);
  const touched = useRef(0);
  // người chơi đang tự cuộn đọc lại thì để yên một lúc
  useEffect(() => {
    const box = ref.current?.closest('.game-scroll');
    if (!box) return;
    const mark = () => (touched.current = Date.now());
    box.addEventListener('touchstart', mark, { passive: true });
    box.addEventListener('wheel', mark, { passive: true });
    return () => {
      box.removeEventListener('touchstart', mark);
      box.removeEventListener('wheel', mark);
    };
  }, []);
  // dòng mới nhất nằm trên cùng: có mốc mới thì cuộn khung gia phả về đầu cho người chơi thấy ngay
  useEffect(() => {
    const box = ref.current?.closest('.game-scroll');
    if (!box || box.scrollTop <= 0 || Date.now() - touched.current < 6000) return;
    box.scrollTo({ top: 0, behavior: 'smooth' });
  }, [log.length]);
  return (
    <section className="panel" aria-label="Gia phả kiếp này" ref={ref}>
      <h2>Gia phả kiếp này</h2>
      <div className="log">
        {items.map((e, i) => (
          <div key={log.length - i} className={`log-item ${e.tone}`}>
            <span className="a">{e.age}t</span>
            <span className="t">{e.text}</span>
          </div>
        ))}
      </div>
      {log.length > 25 && !all && (
        <button className="btn" style={{ marginTop: 8, width: '100%' }} onClick={() => setAll(true)}>
          Xem các ghi chép trước
        </button>
      )}
    </section>
  );
}

/* ---------------- Biểu tượng vật phẩm ---------------- */
const ICON_COLOR: Record<string, [string, string]> = {
  vai: ['#a08060', '#5a4128'],
  thanh: ['#3fa58a', '#e9fff6'],
  bach: ['#f2f6ff', '#6fb8ff'],
  huyet: ['#1e1a24', '#c0202e'],
  tukim: ['#7a4ab0', '#ffc23d'],
  casa: ['#e0902a', '#b8432f'],
};

export function ItemIcon({ item, pill, silhouette }: { item?: Item; pill?: string; silhouette?: boolean }) {
  if (pill || item?.icon || item?.slot === 'ao') return <ItemIconImg item={item} pill={pill} silhouette={silhouette} />;
  if (pill) {
    const col = { tu_khi: '#7fc8ff', truc_co: '#ffc23d', dien_tho: '#ff8fb1', thanh_tam: '#9ff0c8', hoi_xuan: '#ff7a5a' }[pill] ?? '#fff';
    return (
      <svg viewBox="0 0 8 8" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="1" width="4" height="6" fill={col} />
        <rect x="1" y="2" width="6" height="4" fill={col} />
        <rect x="2" y="2" width="1" height="1" fill="#fff" />
      </svg>
    );
  }
  if (!item) return null;
  if (item.wpn) return <WeaponIcon k={item.wpn.k} a={item.wpn.a} b={item.wpn.b} />;
  if ((item.slot as string) === 'ao') {
    const [a, b] = item.robe ? [item.robe[0], item.robe[2]] : (ICON_COLOR[item.look] ?? ICON_COLOR.vai);
    return (
      <svg viewBox="0 0 8 8" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="1" width="4" height="7" fill={a} />
        <rect x="0" y="2" width="2" height="4" fill={a} />
        <rect x="6" y="2" width="2" height="4" fill={a} />
        <rect x="3" y="1" width="2" height="3" fill={b} />
        <rect x="2" y="4" width="4" height="1" fill={b} />
      </svg>
    );
  }
  const map: Record<string, ReactNode> = {
    mockiem: (
      <>
        <rect x="4" y="0" width="1" height="6" fill="#b58a5a" />
        <rect x="2" y="6" width="5" height="1" fill="#7a5a3a" />
        <rect x="4" y="7" width="1" height="1" fill="#7a5a3a" />
      </>
    ),
    kiem: (
      <>
        <rect x="4" y="0" width="1" height="6" fill="#d9e6ff" />
        <rect x="2" y="6" width="5" height="1" fill="#ffd36b" />
        <rect x="4" y="7" width="1" height="1" fill="#5a4128" />
      </>
    ),
    dao: (
      <>
        <rect x="3" y="0" width="3" height="6" fill="#c0202e" />
        <rect x="2" y="6" width="5" height="1" fill="#141217" />
        <rect x="4" y="7" width="1" height="1" fill="#141217" />
      </>
    ),
    phattran: (
      <>
        <rect x="4" y="3" width="1" height="5" fill="#b58a5a" />
        <rect x="2" y="0" width="5" height="3" fill="#ffffff" />
      </>
    ),
    lodan: (
      <>
        <rect x="1" y="3" width="6" height="4" fill="#5a4a3a" />
        <rect x="0" y="2" width="8" height="1" fill="#3e3228" />
        <rect x="3" y="5" width="2" height="1" fill="#ff8a3d" />
      </>
    ),
    ngoc: (
      <>
        <rect x="2" y="2" width="4" height="4" fill="#5fd8a0" />
        <rect x="3" y="0" width="1" height="2" fill="#b8432f" />
      </>
    ),
    holo: (
      <>
        <rect x="2" y="4" width="4" height="4" fill="#e0a040" />
        <rect x="3" y="1" width="2" height="3" fill="#e0a040" />
        <rect x="3" y="0" width="2" height="1" fill="#8a5a2a" />
      </>
    ),
    kiembay: (
      <>
        <rect x="1" y="6" width="1" height="1" fill="#ffd36b" />
        <rect x="2" y="5" width="1" height="1" fill="#d9e6ff" />
        <rect x="3" y="4" width="1" height="1" fill="#d9e6ff" />
        <rect x="4" y="3" width="1" height="1" fill="#d9e6ff" />
        <rect x="5" y="2" width="1" height="1" fill="#d9e6ff" />
        <rect x="6" y="1" width="1" height="1" fill="#ffffff" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 8 8" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
      {map[item.look]}
    </svg>
  );
}

function WeaponIcon({ k, a, b }: { k: string; a: string; b: string }) {
  const r: Record<string, [number, number, number, number, string][]> = {
    kiem: [
      [4, 0, 1, 6, a],
      [2, 6, 5, 1, b],
      [4, 7, 1, 1, b],
    ],
    dao: [
      [3, 0, 3, 6, a],
      [2, 6, 5, 1, b],
      [4, 7, 1, 1, b],
    ],
    thuong: [
      [4, 2, 1, 6, b],
      [3, 0, 3, 2, a],
      [3, 2, 3, 1, '#c0202e'],
    ],
    cung: [
      [2, 0, 1, 1, a],
      [1, 1, 1, 6, a],
      [2, 7, 1, 1, a],
      [3, 0, 1, 8, b],
    ],
    quat: [
      [1, 1, 6, 4, a],
      [2, 0, 4, 1, a],
      [3, 5, 2, 3, b],
    ],
    truong: [
      [4, 0, 1, 8, a],
      [3, 0, 3, 1, b],
    ],
    chuy: [
      [4, 4, 1, 4, b],
      [2, 0, 5, 4, a],
    ],
    tieu: [
      [4, 0, 1, 8, a],
      [4, 2, 1, 1, b],
      [4, 4, 1, 1, b],
      [4, 6, 1, 1, b],
    ],
    roi: [
      [5, 4, 1, 4, b],
      [4, 2, 1, 2, a],
      [3, 1, 1, 1, a],
      [2, 0, 1, 1, a],
    ],
    song: [
      [2, 0, 1, 6, a],
      [1, 6, 3, 1, b],
      [5, 0, 1, 6, b],
      [4, 6, 3, 1, a],
    ],
    liem: [
      [4, 1, 1, 7, b],
      [0, 0, 5, 1, a],
      [0, 1, 1, 2, a],
    ],
    but: [
      [4, 2, 1, 6, b],
      [4, 0, 1, 2, a],
      [3, 1, 1, 1, a],
    ],
    cuoc: [
      [4, 1, 1, 7, b],
      [2, 0, 3, 2, a],
    ],
    quyen: [
      [1, 2, 6, 4, a],
      [1, 2, 6, 1, b],
      [2, 6, 4, 2, a],
    ],
  };
  return (
    <svg viewBox="0 0 8 8" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
      {(r[k] ?? r.kiem).map(([x, y, w, h, f], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={f} />
      ))}
    </svg>
  );
}

const RARE_TXT = ['', 'Tốt', 'Hiếm', 'Cực phẩm'];
function srcText(it: Item): string {
  if (it.src === 'drop') return 'Rơi từ: ' + (it.from ?? []).map((id) => MONSTERS.find((m) => m.id === id)?.name ?? id).join(', ');
  if (it.src === 'event') return 'Nhặt được khi: ' + (it.where ?? 'đi khắp nơi');
  return 'Bán ở phường thị';
}

/* ---------------- Phường thị ---------------- */
function lockReason(c: Character, it: Item): string | null {
  if (c.realm < it.minRealm) return `Cần ${REALMS[it.minRealm].name}`;
  if (it.path && c.path !== it.path) return `Chỉ cho ${PATHS[it.path].name}`;
  if (it.lean === 'chinh' && c.daoTam < 20) return 'Cần Đạo tâm nghiêng Chính';
  if (it.lean === 'ta' && c.daoTam > -20) return 'Cần Đạo tâm nghiêng Tà';
  return null;
}

export function ShopSheet({ c, onBuyItem, onBuyPill, onClose }: { c: Character; onBuyItem: (id: string) => void; onBuyPill: (id: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'do' | 'dan' | 'kho'>('do');
  const [slot, setSlot] = useState<'all' | Slot>('all');
  const [fit, setFit] = useState(true);
  // lọc theo loại đồ và "hợp với mình": đúng phái (hoặc đồ chung), cảnh giới hiện tại hoặc cao hơn một bậc
  const pass = (it: Item) => (slot === 'all' || it.slot === slot) && (!fit || ((!it.path || it.path === c.path) && it.minRealm <= c.realm + 1));
  const filters = (
    <div className="shop-filter">
      <div className="chips">
        {(
          [
            ['all', 'Tất cả'],
            ['vu_khi', 'Vũ khí'],
            ['ao', 'Pháp y'],
            ['phu_kien', 'Phụ kiện'],
          ] as const
        ).map(([k, t]) => (
          <button key={k} className={`chip-btn ${slot === k ? 'on' : ''}`} onClick={() => setSlot(k)}>
            {t}
          </button>
        ))}
      </div>
      <label className="fit-toggle">
        <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} /> Chỉ hiện đồ hợp với mình
      </label>
    </div>
  );
  return (
    <Sheet title="Phường thị" onClose={onClose}>
      <p className="note" style={{ marginTop: 0 }}>
        Linh thạch: <b style={{ color: 'var(--red-d)', fontWeight: 700 }}>{fmt(c.linhThach)}</b> · Đồ mua xong tự mặc lên người.
      </p>
      <div className="tabs">
        <button className={tab === 'do' ? 'on' : ''} onClick={() => setTab('do')}>
          Pháp y, pháp bảo
        </button>
        <button className={tab === 'dan' ? 'on' : ''} onClick={() => setTab('dan')}>
          Đan dược
        </button>
        <button className={tab === 'kho' ? 'on' : ''} onClick={() => setTab('kho')}>
          Đồ hiếm
        </button>
      </div>
      <div className="items">
        {tab !== 'dan' && filters}
        {tab === 'do' &&
          ITEMS.filter((i) => i.price > 0 && i.src !== 'drop' && i.src !== 'event' && pass(i))
            .sort((x, y) => x.minRealm - y.minRealm || x.price - y.price)
            .map((it) => {
              const owned = c.inventory.includes(it.id);
              const lock = lockReason(c, it);
              const price = itemPrice(c, it);
              const out = soldOut(c, it);
              return (
                <div key={it.id} className="item">
                  <div className="item-icon">
                    <ItemIcon item={it} />
                  </div>
                  <div className="item-body">
                    <span>{it.name}</span>
                    {it.fx && <small className="fx-line">{fxText(it.fx)}</small>}
                    <small>{lock ?? it.desc}</small>
                    {it.minRealm >= RARE_STOCK_REALM && !owned && !out && <small className="stock-tag">Hàng hiếm: mỗi kiếp chỉ bán một lần</small>}
                  </div>
                  <button className="btn btn-red" disabled={owned || out || !!lock || c.linhThach < price} onClick={() => onBuyItem(it.id)}>
                    {owned ? 'Đã có' : out ? 'Hết hàng' : fmt(price)}
                  </button>
                </div>
              );
            })}
        {tab === 'kho' && (
          <>
            <p className="note" style={{ margin: 0 }}>
              Không bán ở đâu cả. Phải trừ yêu hoặc gặp cơ duyên trong đời mới có. Đã có{' '}
              {ITEMS.filter((i) => (i.src === 'drop' || i.src === 'event') && i.id !== 'ao_vai' && c.inventory.includes(i.id)).length}/
              {ITEMS.filter((i) => (i.src === 'drop' || i.src === 'event') && i.id !== 'ao_vai').length}.
            </p>
            {ITEMS.filter((i) => (i.src === 'drop' || i.src === 'event') && i.id !== 'ao_vai' && pass(i))
              .sort((x, y) => x.minRealm - y.minRealm || (x.rare ?? 0) - (y.rare ?? 0))
              .map((it) => {
                const owned = c.inventory.includes(it.id);
                return (
                  <div key={it.id} className={`item rare-${it.rare ?? 0} ${owned ? '' : 'unknown'}`}>
                    <div className="item-icon">
                      <ItemIcon item={it} />
                    </div>
                    <div className="item-body">
                      <span>
                        {it.name} {it.rare ? <em className={`rare-tag r${it.rare}`}>{RARE_TXT[it.rare]}</em> : null}
                      </span>
                      {it.fx && <small className="fx-line">{fxText(it.fx)}</small>}
                      <small>{srcText(it)}</small>
                    </div>
                    <span className="owned-tag">{owned ? 'Đã có' : 'Chưa có'}</span>
                  </div>
                );
              })}
          </>
        )}
        {tab === 'dan' &&
          PILLS.map((p) => (
            <div key={p.id} className="item">
              <div className="item-icon">
                <ItemIcon pill={p.id} />
              </div>
              <div className="item-body">
                <span>
                  {p.name} {c.pills[p.id] ? <small>(có {c.pills[p.id]})</small> : null}
                </span>
                <small>{p.desc}</small>
              </div>
              <button className="btn btn-red" disabled={c.linhThach < pillPrice(c, p.id)} onClick={() => onBuyPill(p.id)}>
                {fmt(pillPrice(c, p.id))}
              </button>
            </div>
          ))}
      </div>
    </Sheet>
  );
}

/* ---------------- Túi đồ ---------------- */
type BagKind = 'all' | Slot | 'dan';
type BagSort = 'new' | 'rare' | 'atk' | 'def';
const BAG_KINDS: [BagKind, string][] = [
  ['all', 'Tất cả'],
  ['ao', 'Pháp y'],
  ['vu_khi', 'Vũ khí'],
  ['phu_kien', 'Phụ kiện'],
  ['dan', 'Đan dược'],
];
function readPref(k: string): string {
  try {
    return localStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
}
function writePref(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

export function BagSheet({
  c,
  onEquip,
  onUsePill,
  onClose,
  book,
  startTab = 'tui',
  onSeen,
}: {
  c: Character;
  onEquip: (id: string) => void;
  onUsePill: (id: string) => void;
  onClose: () => void;
  book: string[];
  startTab?: 'tui' | 'kho';
  onSeen?: () => void;
}) {
  // 3.1.0: lọc theo loại, sắp xếp; đồ đang mặc luôn ở trên; nhớ lựa chọn lần trước
  const [kind, setKind] = useState<BagKind>(() => (readPref('vkl.bagKind') as BagKind) || 'all');
  const [sort, setSort] = useState<BagSort>(() => (readPref('vkl.bagSort') as BagSort) || 'new');
  useEffect(() => writePref('vkl.bagKind', kind), [kind]);
  useEffect(() => writePref('vkl.bagSort', sort), [sort]);
  const allOwned = ITEMS.filter((i) => c.inventory.includes(i.id));
  const allPills = PILLS.filter((p) => (c.pills[p.id] ?? 0) > 0);
  const count = (k: BagKind) => (k === 'all' ? allOwned.length + allPills.length : k === 'dan' ? allPills.length : allOwned.filter((i) => i.slot === k).length);
  const isOn = (it: Item) => c.equipped[it.slot] === it.id;
  const owned = (kind === 'all' ? allOwned : kind === 'dan' ? [] : allOwned.filter((i) => i.slot === kind)).sort((a, b) => {
    if (isOn(a) !== isOn(b)) return isOn(a) ? -1 : 1;
    if (sort === 'rare') return (b.rare ?? 0) - (a.rare ?? 0) || b.minRealm - a.minRealm;
    if (sort === 'atk') return (b.fx?.atk ?? 0) - (a.fx?.atk ?? 0);
    if (sort === 'def') return (b.fx?.def ?? 0) - (a.fx?.def ?? 0);
    return c.inventory.lastIndexOf(b.id) - c.inventory.lastIndexOf(a.id);
  });
  const pills = kind === 'all' || kind === 'dan' ? allPills : [];
  const total = fxText(gearFx(c.equipped));
  const [tab, setTab] = useState<'tui' | 'kho'>(startTab);
  useEffect(() => {
    if (tab === 'kho') onSeen?.();
  }, [tab]);
  const got = book.filter(isHidden).length;
  return (
    <Sheet title="Túi trữ vật" onClose={onClose}>
      <div className="tabs">
        <button className={tab === 'tui' ? 'on' : ''} onClick={() => setTab('tui')}>
          Túi đồ
        </button>
        <button className={tab === 'kho' ? 'on' : ''} onClick={() => setTab('kho')}>
          Bảo khố {got}/{HIDDEN_ITEMS.length}
        </button>
      </div>
      {tab === 'kho' ? (
        <BaoKho book={book} />
      ) : (
        <>
          <p className="note" style={{ marginTop: 0 }}>
            Trang bị đang mặc: {total || 'chưa có chỉ số gì'}
          </p>
          <div className="bag-filter">
            <div className="bag-kinds" role="tablist" aria-label="Loại đồ">
              {BAG_KINDS.map(([k, label]) => (
                <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                  {label} <small>{count(k)}</small>
                </button>
              ))}
            </div>
            {kind !== 'dan' && (
              <label className="bag-sort">
                Xếp theo
                <select value={sort} onChange={(e) => setSort(e.target.value as BagSort)}>
                  <option value="new">Mới nhận</option>
                  <option value="rare">Phẩm</option>
                  <option value="atk">Công</option>
                  <option value="def">Thủ</option>
                </select>
              </label>
            )}
          </div>
          <div className="items">
            {owned.map((it) => {
              const on = c.equipped[it.slot] === it.id;
              return (
                <div key={it.id} className="item">
                  <div className="item-icon">
                    <ItemIcon item={it} />
                  </div>
                  <div className="item-body">
                    <span>
                      {c.legend?.item === it.id ? (
                        <b className="legend-name">
                          ★ {c.legend.name} ({it.name}, {c.legend.lv} kiếp)
                        </b>
                      ) : (
                        it.name
                      )}{' '}
                      {it.rare ? <em className={`rare-tag r${it.rare}`}>{RARE_TXT[it.rare]}</em> : null}
                    </span>
                    {it.fx && <small className="fx-line">{fxText(it.fx)}</small>}
                    <small>{it.desc}</small>
                  </div>
                  <button className={`btn ${on ? 'btn-jade' : ''}`} onClick={() => onEquip(it.id)}>
                    {on ? 'Đang dùng' : 'Dùng'}
                  </button>
                </div>
              );
            })}
            {pills.map((p) => (
              <div key={p.id} className="item">
                <div className="item-icon">
                  <ItemIcon pill={p.id} />
                </div>
                <div className="item-body">
                  <span>
                    {p.name} x{c.pills[p.id]}
                  </span>
                  <small>{p.desc}</small>
                </div>
                <button className="btn btn-red" onClick={() => onUsePill(p.id)}>
                  Uống
                </button>
              </div>
            ))}
            {!owned.length && !pills.length && <p className="note">{kind === 'all' ? 'Túi trống trơn.' : 'Chưa có món nào loại này.'}</p>}
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ---------------- Bảo khố: đồ ẩn đã từng có ---------------- */
export function BaoKho({ book }: { book: string[] }) {
  const has = new Set(book);
  const [f, setF] = useState<'all' | 'co' | 'chua'>('all');
  const [pick, setPick] = useState<string | null>(null);
  const got = HIDDEN_ITEMS.filter((i) => has.has(i.id)).length;
  const list = [...HIDDEN_ITEMS].sort((a, b) => (b.rare ?? 0) - (a.rare ?? 0) || a.minRealm - b.minRealm).filter((i) => (f === 'co' ? has.has(i.id) : f === 'chua' ? !has.has(i.id) : true));
  const sel = HIDDEN_ITEMS.find((i) => i.id === pick);
  return (
    <div className="baokho">
      <div className="bk-head">
        <b>
          {got}/{HIDDEN_ITEMS.length}
        </b>
        <span className="bk-bar" aria-hidden="true">
          <i style={{ width: `${(got / HIDDEN_ITEMS.length) * 100}%` }} />
        </span>
      </div>
      <p className="note" style={{ margin: '4px 0 6px' }}>
        Đồ ẩn không bán ở phường thị, chỉ rơi từ yêu thú hoặc có được qua kỳ ngộ. Món nào từng có trong bất kỳ kiếp nào cũng được ghi lại mãi mãi.
      </p>
      <div className="chips" role="radiogroup" aria-label="Lọc Bảo khố">
        {(
          [
            ['all', 'Tất cả'],
            ['co', 'Đã có'],
            ['chua', 'Chưa có'],
          ] as const
        ).map(([k, n]) => (
          <button key={k} role="radio" aria-checked={f === k} className={`chip-btn ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>
            {n}
          </button>
        ))}
      </div>
      {sel && (
        <div className={`bk-detail ${has.has(sel.id) ? '' : 'locked'}`}>
          <span className="bk-icon">
            <ItemIcon item={sel} />
          </span>
          <span>
            <b>{has.has(sel.id) ? sel.name : '???'}</b> {sel.rare ? <em className={`rare-tag r${sel.rare}`}>{RARE_TXT[sel.rare]}</em> : null}
            {has.has(sel.id) ? (
              <>
                {sel.fx && <small className="fx-line">{fxText(sel.fx)}</small>}
                <small>{sel.desc}</small>
              </>
            ) : (
              <small>Gợi ý: {itemHint(sel)}</small>
            )}
          </span>
        </div>
      )}
      <div className="bk-grid">
        {list.map((i) => (
          <button
            key={i.id}
            className={`bk-cell r${i.rare ?? 0} ${has.has(i.id) ? '' : 'locked'} ${pick === i.id ? 'on' : ''}`}
            onClick={() => setPick(i.id)}
            aria-label={has.has(i.id) ? i.name : 'Chưa có, xem gợi ý'}
          >
            <ItemIcon item={i} silhouette={!has.has(i.id)} />
            {!has.has(i.id) && <span className="bk-q">?</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BaoKhoSheet({ book, onClose }: { book: string[]; onClose: () => void }) {
  return (
    <Sheet title="Bảo khố" onClose={onClose}>
      <BaoKho book={book} />
    </Sheet>
  );
}

/* ---------------- Bế quan ---------------- */
export function BeQuanSheet({ c, onGo, onClose }: { c: Character; onGo: (years: number) => void; onClose: () => void }) {
  const left = Math.max(0, Math.floor(c.lifespan - c.age));
  return (
    <Sheet title="Bế quan" onClose={onClose}>
      <p style={{ marginTop: 0 }}>
        Đóng cửa động phủ, tu vi tăng gấp rưỡi nhưng không gặp kỳ ngộ nào. Sẽ tự xuất quan khi chạm bình cảnh. Thọ nguyên còn khoảng{' '}
        <b style={{ fontWeight: 700, color: 'var(--red-d)' }}>{left} năm</b>.
      </p>
      {c.realm < 1 ? (
        <p className="note">Phải nhập đạo (Luyện Khí) mới bế quan được.</p>
      ) : (
        <div className="choice-row">
          {[5, 10, 20].map((y) => (
            <button key={y} className="btn btn-big" onClick={() => onGo(y)} disabled={y > left}>
              {y} năm
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- Trọng tâm ---------------- */
/** Cảnh báo quá độ nổi bật trên dock: chỉ cảnh báo, không tự đổi việc */
export function OverworkBar({ c }: { c: Character }) {
  const n = c.streak?.f === c.focus ? c.streak.n : 0;
  const safe = safeYears(c);
  if (overworkFree(c.focus) || n < safe - 1 || c.dead) return null;
  const name = FOCUS[c.focus as Focus]?.name ?? 'một việc';
  return (
    <p className={`overwork-bar ${n >= safe ? 'hot' : ''}`} role="alert">
      ⚠ {n >= safe ? `Quá độ: đã ${n} năm liền ${name.toLowerCase()}. Mỗi năm thêm đều có thể mất mạng, hãy đổi việc khác.` : `Đã ${n} năm liền ${name.toLowerCase()}. Sang năm là quá độ, nên đổi việc khác.`}
    </p>
  );
}

export function FocusGrid({ c, onPick }: { c: Character; onPick: (f: Focus) => void }) {
  return (
    <div className="focus-grid" role="radiogroup" aria-label="Trọng tâm năm nay">
      {(Object.keys(FOCUS) as Focus[]).map((f) => {
        const locked = c.age < FOCUS[f].minAge;
        const n = c.focus === f && c.streak?.f === f && !overworkFree(f) ? c.streak.n : 0;
        const safe = safeYears(c);
        return (
          <button
            key={f}
            role="radio"
            aria-checked={c.focus === f}
            className={`${c.focus === f ? 'on' : ''} ${n >= safe ? 'tired' : n >= safe - 2 ? 'warm' : ''}`}
            disabled={locked || c.dead}
            onClick={() => onPick(f)}
            title={locked ? `Mở khi ${FOCUS[f].minAge} tuổi` : FOCUS[f].desc}
          >
            <FocusIcon f={f} />
            <span>{locked ? `${FOCUS[f].minAge}t` : FOCUS[f].name}</span>
            {n >= 2 && <i className="streak">{n >= safe ? `Quá độ ${n}n` : `${n}/${safe} năm`}</i>}
          </button>
        );
      })}
    </div>
  );
}

/** Mục tiêu kiếp này: mảnh Thiên thư kế tiếp, để người mới biết nên nhắm tới đâu */
function LifeGoal({ meta }: { meta: Meta }) {
  const have = new Set(meta.lore ?? []);
  const b2 = quyNhatDone(meta);
  const f = LORE.find((x) => !have.has(x.id) && (!x.book || b2));
  if (!f) return null;
  return (
    <Link href="/so-sinh-tu#thien-thu" className="life-goal">
      <small>Mục tiêu · Thiên thư {f.title.split('.')[0]}</small>
      <span>{f.hint}</span>
    </Link>
  );
}

/* ---------------- Màn luân hồi (đầu thai) ---------------- */
export function BirthPanel({
  meta,
  onBorn,
  busy,
  onKho,
  onSoSinhTu,
  onHoanHon,
  onCheckin,
}: {
  meta: Meta;
  onCheckin?: () => void;
  onHoanHon?: (id: import('@/lib/game/luanHoi').HonPillId) => void;
  onBorn: (talents: string[], yearSec: number, gifts: string[], gachaSpent: number, base: Character | null, drink: boolean) => void;
  busy?: boolean;
  onKho?: () => void;
  onSoSinhTu?: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [yearSec, setYearSec] = useState(20);
  const [gifts, setGifts] = useState<string[]>([]);
  const [gSpent, setGSpent] = useState(0);
  const [base, setBase] = useState<Character | null>(null);
  const [bridge, setBridge] = useState(false);
  const oneBig = ksOneBig(ksOf(meta));
  const tal = (id: string) => TALENTS.find((t) => t.id === id);
  const spent = picked.filter((id) => !tal(id)?.ta).reduce((s, id) => s + (tal(id)?.cost ?? 0), 0) + gSpent;
  const left = meta.phucDuyen - spent;
  const leftTa = meta.nghiep - picked.filter((id) => tal(id)?.ta).reduce((s, id) => s + (tal(id)?.cost ?? 0), 0);
  const first = meta.lives === 0;
  const cs = collectStats(meta);
  const cheapest = Math.min(...TALENTS.filter((t) => !t.ta).map((t) => t.cost));
  const now = useNow();
  const lhOn = honActive(meta);
  const ksOn = ksBase(meta) > 0 || lhOn;
  const lh = luanHoiSummary(meta, false, now);
  const omen = omenToday();
  const daily = dailyOf(meta);
  const doneQ = daily.quests.filter((q) => daily.done.includes(q)).length;
  const bought = picked.filter((id) => !tal(id)?.ta).length;
  const boughtTa = picked.filter((id) => tal(id)?.ta).length;
  const speed = yearSec === 10 ? 'Nhanh' : yearSec === 30 ? 'Chậm' : 'Vừa';
  const barNote = lhOn ? 'tiếp theo: Cầu Nại Hà' : [picked.length + gifts.length ? `${picked.length + gifts.length} thiên phú` : '', `thời gian ${speed.toLowerCase()}`].filter(Boolean).join(' · ');
  const go = (d: boolean) => onBorn(picked, yearSec, gifts, gSpent, base, d);
  return (
    <div className="birth-flow">
      {first ? (
        <section className="howto-strip" aria-label="Cách chơi">
          <b className="hs-title">Lần đầu luân hồi</b>
          <ol>
            <li>
              Xem <b>lá số</b>, không ưng thì <b>Gieo lại</b>
            </li>
            <li>
              Bấm <b>Đầu thai</b>, năm tháng tự trôi
            </li>
            <li>Gặp chuyện thì chọn cách xử lý, có cách mạnh lên, có cách chết</li>
          </ol>
          <small>
            Mục tiêu: <b>sống trọn một kiếp</b>, rồi <b>kết Kim Đan</b> để biết vì sao mình cứ phải luân hồi.
          </small>
        </section>
      ) : (
        <div className="bf-stats">
          <span>
            <small>Đã trải</small>
            <b>{meta.lives} kiếp</b>
          </span>
          <span className="jade">
            <small>Phúc duyên</small>
            <b>{left}</b>
          </span>
          {meta.nghiep > 0 && (
            <span className="ta">
              <small>Nghiệp</small>
              <b>{leftTa}</b>
            </span>
          )}
          {ksOn && (
            <span className="ks">
              <small>Kiếp Số</small>
              <b>{lh.ks}</b>
            </span>
          )}
        </div>
      )}
      {onCheckin && <CheckinRow meta={meta} onClaim={onCheckin} />}

      <GachaPanel
        phuc={left}
        busy={busy}
        lifeNo={meta.lives + 1}
        barNote={barNote}
        onBorn={() => (lhOn ? setBridge(true) : go(false))}
        onChange={(g, s, b) => {
          setGifts(g);
          setGSpent(s);
          setBase(b);
        }}
      />

      <section className="prep">
        <h2 className="prep-title">Chuẩn bị trước khi đầu thai</h2>

        {!first && (
          <details className="prep-row" open={meta.phucDuyen >= cheapest && meta.lives < 5}>
            <summary>
              <span className="pr-name">Mua thiên phú</span>
              <span className="pr-val jade">{bought ? `đã chọn ${bought} · còn ${left} phúc` : `${left} phúc duyên`}</span>
            </summary>
            <div className="pr-body">
              {meta.phucDuyen <= 0 && <p className="note">Chưa có phúc duyên. Sống tốt một kiếp, chết đi sẽ được phúc duyên để mua ở đây.</p>}
              <div className="talent-list">
                {TALENTS.filter((t) => !t.ta).map((t) => {
                  const on = picked.includes(t.id);
                  // Kiếp Số từ 5: mỗi kiếp chỉ một thiên phú lớn
                  const blocked = oneBig && BIG_TALENTS.includes(t.id) && picked.some((x) => x !== t.id && BIG_TALENTS.includes(x));
                  const can = on || (left >= t.cost && !blocked);
                  return (
                    <button key={t.id} className={`talent ${on ? 'on' : ''}`} disabled={!can} title={blocked ? 'Kiếp Số từ 5: mỗi kiếp chỉ chọn một thiên phú lớn' : undefined} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== t.id) : [...picked, t.id])}>
                      <span>
                        {t.name}
                        <br />
                        <small className="note">{t.desc}</small>
                      </span>
                      <span className="cost">{t.cost} phúc</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </details>
        )}

        {meta.nghiep > 0 && (
          <details className="prep-row ta-row">
            <summary>
              <span className="pr-name">Thiên phú tà đạo</span>
              <span className="pr-val ta">{boughtTa ? `đã chọn ${boughtTa} · còn ${leftTa}` : `${leftTa} nghiệp lực`}</span>
            </summary>
            <div className="pr-body">
              <p className="note" style={{ marginTop: 0 }}>
                Nghiệp lực tích từ những kiếp đi tà. Tích quá {150} nghiệp mà không tiêu thì kiếp sau bị trời phạt.
              </p>
              <div className="talent-list">
                {TALENTS.filter((t) => t.ta).map((t) => {
                  const on = picked.includes(t.id);
                  const can = on || leftTa >= t.cost;
                  return (
                    <button key={t.id} className={`talent ta ${on ? 'on' : ''}`} disabled={!can} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== t.id) : [...picked, t.id])}>
                      <span>
                        {t.name}
                        <br />
                        <small className="note">{t.desc}</small>
                      </span>
                      <span className="cost">{t.cost} nghiệp</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </details>
        )}

        {ksOn && (
          <details className="prep-row">
            <summary>
              <span className="pr-name">Kiếp Số và Hồn lực</span>
              <span className="pr-val">
                Kiếp Số {lh.ks}
                {lhOn ? ` · ${lh.honName} ${lh.hon}` : ''}
              </span>
            </summary>
            <div className="pr-body">
              <KiepSoBlock meta={meta} onHoanHon={onHoanHon} />
            </div>
          </details>
        )}

        <div className="prep-row prep-inline">
          <span className="pr-name">Tốc độ thời gian</span>
          <div className="seg" role="radiogroup" aria-label="Tốc độ thời gian">
            {[
              [10, 'Nhanh'],
              [20, 'Vừa'],
              [30, 'Chậm'],
            ].map(([sec, label]) => (
              <button key={sec} role="radio" className={yearSec === sec ? 'on' : ''} onClick={() => setYearSec(sec as number)} aria-checked={yearSec === sec} title={`1 năm khoảng ${sec} giây`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <details className="prep-row today-row">
        <summary>
          <span className="pr-name">Hôm nay · {omen.name}</span>
          <span className="pr-val">
            Nhiệm vụ {doneQ}/{daily.quests.length}
          </span>
        </summary>
        <div className="pr-body">
          <TodayScroll meta={meta} />
        </div>
      </details>

      {bridge && (
        <ManhBaBridge
          meta={meta}
          onHoanHon={onHoanHon}
          busy={busy}
          onBack={() => setBridge(false)}
          onPick={go}
          who={
            base ? (
              <>
                <span className="mbw-fig">
                  <Sprite c={{ ...base, age: 22, lifespan: 90 }} size={56} />
                </span>
                <span>
                  <small>Kiếp {meta.lives + 1}</small>
                  <b>{base.name}</b>
                </span>
              </>
            ) : null
          }
        />
      )}

      {!first && (
        <section className="journey">
          <h2 className="prep-title">Hành trình</h2>
          {meta.past && (
            <p className="jr-past">
              Kiếp trước: <b>{meta.past.name}</b>, {meta.past.age} tuổi, {meta.past.realmName}.{meta.stash ? ' Có chôn lại một chiếc rương...' : ''}
            </p>
          )}
          <LifeGoal meta={meta} />
          <div className="collect-strip">
            <Link href="/so-sinh-tu" onClick={onSoSinhTu} className="cs-item">
              <small>Sổ Sinh Tử</small>
              <b>
                {cs.endings}/{cs.endingsTotal}
              </b>
              <span className="bk-bar" aria-hidden="true">
                <i style={{ width: `${(cs.endings / cs.endingsTotal) * 100}%` }} />
              </span>
            </Link>
            <Link href="/so-sinh-tu#thien-thu" className="cs-item cs-lore">
              <small>{quyNhatDone(meta) ? 'Thiên thư II' : 'Thiên thư'}</small>
              <b>{quyNhatDone(meta) ? `${lore2Count(meta)}/${LORE2_TOTAL}` : `${lore1Count(meta)}/${LORE_TOTAL}`}</b>
              <span className="bk-bar" aria-hidden="true">
                <i style={{ width: `${(quyNhatDone(meta) ? lore2Count(meta) / LORE2_TOTAL : lore1Count(meta) / LORE_TOTAL) * 100}%` }} />
              </span>
            </Link>
            <button className="cs-item" onClick={onKho}>
              <small>Bảo khố</small>
              <b>
                {cs.items}/{cs.itemsTotal}
              </b>
              <span className="bk-bar" aria-hidden="true">
                <i style={{ width: `${(cs.items / cs.itemsTotal) * 100}%` }} />
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------- Màn chết ---------------- */
/** Hỏi nhanh cảm nhận ngay ở màn chết (thay vì bắt người chơi tìm trang góp ý) */
function LifeFeedback({ c }: { c: Character }) {
  const { user } = useAuth();
  const [star, setStar] = useState(0);
  const [text, setText] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  if (!user) return null;
  if (sent) return <p className="note life-fb-done">{sent}</p>;
  return (
    <div className="life-fb">
      <small>Kiếp này chơi thấy thế nào?</small>
      <div className="life-fb-stars" role="radiogroup" aria-label="Chấm điểm kiếp này">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={star === n} className={n <= star ? 'on' : ''} onClick={() => setStar(n)} aria-label={`${n} sao`}>
            ★
          </button>
        ))}
      </div>
      {star > 0 && (
        <div className="life-fb-row">
          <input value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder={star <= 3 ? 'Điều gì làm bạn chưa vui?' : 'Điều gì bạn thích nhất?'} />
          <button
            className="btn"
            onClick={async () => {
              const err = await addFeedback(
                user,
                'khac',
                `[Đánh giá kiếp ${c.lifeNo}] ${'★'.repeat(star)} ${text.trim() || '(không ghi chú)'} · ${Math.floor(c.age)} tuổi, ${realmLabel(c.realm, c.layer, c.cosmos)}, ${c.cause ?? ''}`.slice(
                  0,
                  480,
                ),
              );
              setSent(err ?? 'Cảm ơn bạn! Góp ý đã được ghi lại.');
            }}
          >
            Gửi
          </button>
        </div>
      )}
    </div>
  );
}

/** Kiếp sau đang chờ gì: nhiệm vụ còn lại, thiên phú mua được, mảnh Thiên thư kế tiếp. Để người chơi có lý do đầu thai thêm một kiếp. */
function NextLife({ meta, c, gain, left }: { meta: Meta; c: Character; gain: number; left: string[] }) {
  const total = meta.phucDuyen + gain;
  const best = [...TALENTS].filter((t) => !t.ta && t.cost <= total).sort((a, b) => b.cost - a.cost)[0];
  const next = TALENTS.filter((t) => !t.ta && t.cost > total).sort((a, b) => a.cost - b.cost)[0];
  const have = new Set(meta.lore ?? []);
  const book2 = quyNhatDone(meta) || c.endTag === 'thoat_van_kiep';
  const lore = LORE.find((f) => !have.has(f.id) && (!f.book || book2));
  const rows: { k: string; t: string }[] = [];
  if (left.length) rows.push({ k: 'q', t: `Còn ${left.length} nhiệm vụ hôm nay: ${left.map(questName).join(', ')} (+${QUEST_REWARD} phúc mỗi việc, xong cả ba thêm ${QUEST_BONUS})` });
  if (best) rows.push({ k: 't', t: `Có ${total} phúc duyên: kiếp sau mua được ${best.name}${next ? `, thêm ${next.cost - total} phúc nữa là đủ ${next.name}` : ''}` });
  else if (next) rows.push({ k: 't', t: `Thêm ${next.cost - total} phúc duyên nữa là mua được ${next.name} cho kiếp sau` });
  if (lore) rows.push({ k: 'l', t: `Thiên thư sắp mở ${lore.title.split('.')[0]}: ${lore.hint}` });
  if (!rows.length) return null;
  return (
    <div className="next-life">
      <small>Kiếp sau đang chờ</small>
      {rows.map((r) => (
        <span key={r.k} className={`nl-${r.k}`}>
          {r.t}
        </span>
      ))}
    </div>
  );
}

export function DeathSheet({
  c,
  meta,
  karma,
  isNew,
  onDone,
}: {
  c: Character;
  meta: Meta;
  karma: { phuc: number; nghiep: number };
  isNew: boolean;
  onDone: (epitaph: string, note: string, bury: boolean, extra: { prophecy: { id: string; text: string }; legendName: string | null }) => void;
}) {
  const [prophecy] = useState(() => pickProphecy(c, Math.random));
  const weapon = c.equipped.vu_khi ? ITEMS.find((i) => i.id === c.equipped.vu_khi) : null;
  const sameLegend = !!weapon && c.legend?.item === weapon.id;
  const [passOn, setPassOn] = useState(sameLegend);
  const [legendName, setLegendName] = useState(sameLegend ? c.legend!.name : weapon ? weapon.name : '');
  const near = nearEndings(c, meta.endings);
  const q = evalQuests(meta, c, isNew);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [bury, setBury] = useState(true);
  const [busy, setBusy] = useState(false);
  const ending = endingOf(c);
  const buryMoney = Math.round(c.linhThach * 0.3);
  return (
    <Sheet
      title={
        c.endTag === 'chung_dao'
          ? 'Chứng đạo!'
          : c.endTag === 'giang_tran'
            ? 'Bị giáng trần'
            : c.cosmos === 'ma'
              ? 'Ma hồn tan biến'
              : c.cosmos === 'hu'
                ? 'Tan vào hư không'
                : c.cosmos === 'tien'
                ? 'Tọa hóa nơi tiên giới'
                : 'Một kiếp đã hết'
      }
    >
      {c.cosmos && (
        <div className={`cos-tomb ${c.cosmos}`} aria-hidden="true">
          <i className="sky" />
          <i className="stele" />
          <b>{c.cosmos === 'ma' ? 'Ma Trủng' : c.cosmos === 'hu' ? 'Hư Trủng' : 'Tiên Trủng'}</b>
        </div>
      )}
      <p style={{ marginTop: 0 }}>
        <b style={{ fontWeight: 700, color: 'var(--red-d)', fontSize: 24 }}>{c.name}</b>
        <br />
        {Math.floor(c.age)} tuổi · {realmLabel(c.realm, c.layer, c.cosmos)}
        {c.path ? ` · ${PATHS[c.path].name}` : ''} · {describeLean(c.daoTam)}
      </p>
      <p className="note">{c.cause}</p>
      <div className={`ending-box r${ending.rare} ${isNew ? 'is-new' : ''}`} style={{ ['--rc' as string]: RARE_COLOR[ending.rare] } as CSSProperties}>
        {isNew && (
          <span className="new-stamp" aria-hidden="true">
            Kết cục mới
          </span>
        )}
        <small>
          Kết cục {['phàm', 'linh', 'huyền', 'địa', 'thiên'][ending.rare]} phẩm{isNew ? ' · MỚI MỞ!' : ''}
        </small>
        <b>{ending.name}</b>
        <span>{ending.desc}</span>
        <span className="sst-progress">
          <span className="bk-bar" aria-hidden="true">
            <i style={{ width: `${((Object.keys(meta.endings ?? {}).length + (isNew ? 1 : 0)) / ENDINGS.length) * 100}%` }} />
          </span>
          <small>
            Sổ Sinh Tử {Object.keys(meta.endings ?? {}).length + (isNew ? 1 : 0)}/{ENDINGS.length}
          </small>
        </span>
      </div>
      <p>
        Mang sang kiếp sau: <b style={{ fontWeight: 700, color: 'var(--jade)' }}>+{karma.phuc} phúc duyên</b>
        {karma.nghiep > 0 && (
          <>
            {' '}
            và <b style={{ fontWeight: 700, color: 'var(--ta)' }}>+{karma.nghiep} nghiệp lực</b> (tiêu được cho thiên phú tà đạo)
          </>
        )}
        .
      </p>
      {q.newly.length > 0 && (
        <p className="death-quests">
          Nhiệm vụ hôm nay hoàn thành: <b>{q.newly.map(questName).join(', ')}</b> (+{q.reward} phúc duyên)
        </p>
      )}
      <NextLife meta={meta} c={c} gain={karma.phuc + q.reward} left={q.daily.quests.filter((id) => !q.daily.done.includes(id))} />
      <div className="prophecy">
        <small>Lời tiên tri cho kiếp sau</small>
        <b>“{prophecy.text}”</b>
      </div>
      {near.length > 0 && (
        <div className="near-endings">
          <small>Kết cục chưa mở trong Sổ Sinh Tử</small>
          {near.map((e) => (
            <span key={e.name}>
              <b>{e.name}</b>: {e.hint}
            </span>
          ))}
        </div>
      )}
      {!!c.vendettas?.length && (
        <p className="note" style={{ margin: '6px 0' }}>
          Mối thù mang theo: {c.vendettas.map((v) => `@${v.player} (${v.name})`).join(', ')}. Kiếp sau gặp lại có thể báo thù.
        </p>
      )}
      <label className="field">
        <span>Khắc lên bia mộ (không bắt buộc)</span>
        <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="vd: Kiếp này không phụ kiếm trong tay" />
      </label>
      {!c.ascended && c.endTag !== 'xuyen_khong' && (
        <>
          <label className="toggle" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={bury} onChange={(e) => setBury(e.target.checked)} />
            Chôn rương cho kiếp sau ({buryMoney} linh thạch{c.equipped.vu_khi || c.equipped.phu_kien ? ' và một món đồ' : ''})
          </label>
          {bury && (
            <label className="field">
              <span>Lời nhắn bỏ vào rương</span>
              <input value={note} maxLength={100} onChange={(e) => setNote(e.target.value)} placeholder="vd: Kiếp sau đừng tin ai họ Mộ Dung" />
            </label>
          )}
        </>
      )}
      {weapon && !c.ascended && c.endTag !== 'xuyen_khong' && (
        <>
          <label className="toggle" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={passOn} onChange={(e) => setPassOn(e.target.checked)} />
            Truyền {weapon.name} thành thần binh cho kiếp sau
            {sameLegend ? ` (đời thứ ${c.legend!.lv + 1}, công +${Math.min(10, c.legend!.lv + 1) * 8}%)` : ' (công +8%, mỗi kiếp truyền tiếp mạnh thêm)'}
          </label>
          {passOn && (
            <label className="field">
              <span>Tên thần binh</span>
              <input value={legendName} maxLength={40} onChange={(e) => setLegendName(e.target.value)} placeholder="vd: Thanh Minh Kiếm" />
            </label>
          )}
        </>
      )}
      <LifeFeedback c={c} />
      <div style={{ marginTop: 10 }}>
        <ShareCard c={c} ending={ending} epitaph={text.trim()} isNew={isNew} />
      </div>
      <ArenaNudge />
      <button
        className="btn btn-red btn-big"
        style={{ width: '100%', marginTop: 10 }}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          onDone(text.trim(), note.trim(), bury, { prophecy, legendName: passOn && weapon ? legendName.trim() || weapon.name : null });
        }}
      >
        Lập bia và luân hồi
      </button>
    </Sheet>
  );
}

export { SEASONS };

/* ---------------- Dải chỉ số gọn dưới sân khấu ---------------- */
function Mini({ label, value, pct, color, danger }: { label: string; value: number | string; pct: number; color: string; danger?: boolean }) {
  return (
    <div className={`mini ${danger ? 'danger' : ''}`}>
      <span className="mini-l">{label}</span>
      <span className="mini-v">{value}</span>
      <span className="mini-bar" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
      </span>
    </div>
  );
}

export function StageStrip({ c, compact, wait = 0 }: { c: Character; compact: boolean; wait?: number }) {
  const s = c.stats;
  const cult = c.realm === 0 ? c.cultivation / 40 : cultPct(c);
  const daoPct = (c.daoTam + 100) / 200;
  return (
    <div className="strip">
      <div className="strip-who">
        <span className="strip-name">{c.name}</span>
        <span className={`badge sex ${c.gender}`}>{c.gender === 'nam' ? 'Nam' : 'Nữ'}</span>
        {c.path && <span className="badge path">{PATHS[c.path].short}</span>}
        {c.sect && !c.cosmos && (
          <span className={`badge sect-badge ${sectSide(c) ?? ''}`} title={`${rankName(c)} ${c.sect}`}>
            {rankShort(c)}
          </span>
        )}
        <span className="strip-realm">{c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer, c.cosmos)}</span>
      </div>
      <div className={`cult ${wait ? 'wait' : ''}`} role="progressbar" aria-label="Tu vi" aria-valuenow={Math.round(cult * 100)} aria-valuemin={0} aria-valuemax={100}>
        <span className="cult-fill" style={{ width: `${Math.min(1, cult) * 100}%` }} />
        <span className="cult-text">{wait ? `Đủ phi thăng · còn ${wait} năm · chạm xem` : `Tu vi ${Math.round(cult * 100)}%`}</span>
      </div>
      {!compact && (
        <>
          <div className="minis">
            <Mini label="Thọ" value={`${Math.floor(c.age)}/${c.lifespan}`} pct={1 - c.age / c.lifespan} color="#b8432f" />
            <Mini label={s.sucKhoe <= 25 ? '⚠ Khỏe' : 'Khỏe'} value={s.sucKhoe} pct={s.sucKhoe / 100} color="#d96a4a" danger={s.sucKhoe <= 25} />
            <Mini label="Tâm" value={s.tamCanh} pct={s.tamCanh / 100} color="#c9962e" />
            <Mini label="Ma" value={s.tamMa} pct={s.tamMa / 100} color="#6a1a2e" />
            <Mini label="Ngộ" value={s.ngoTinh} pct={s.ngoTinh / 100} color="#5b6fb0" />
            <Mini label="Vận" value={s.khiVan} pct={s.khiVan / 100} color="#7a5ab0" />
          </div>
          <div className="dao-line" role="meter" aria-label={`Đạo tâm: ${describeLean(c.daoTam)}`} aria-valuemin={-100} aria-valuemax={100} aria-valuenow={c.daoTam}>
            <span className="dl">Chính</span>
            <span className="dao-track thin">
              <span style={{ background: '#a8c4e6' }} />
              <span style={{ background: '#d8cfc0' }} />
              <span style={{ background: '#e4a0a6' }} />
              <span className="dao-mark" style={{ left: `${(1 - daoPct) * 100}%` }} />
            </span>
            <span className="dr">Tà</span>
            <span className="dao-name">{describeLean(c.daoTam)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Biểu tượng trọng tâm ---------------- */
export function FocusIcon({ f }: { f: Focus }) {
  const px: Record<Focus, [number, number, number, number, string][]> = {
    tu_luyen: [
      [3, 0, 2, 2, '#7fc8ff'],
      [2, 2, 4, 2, '#ffe27a'],
      [1, 4, 6, 2, '#ffe27a'],
      [0, 6, 8, 2, '#3fa58a'],
    ],
    luyen_dan: [
      [3, 0, 2, 1, '#c9c4ff'],
      [1, 2, 6, 1, '#3e3228'],
      [1, 3, 6, 4, '#7a5f44'],
      [3, 5, 2, 1, '#ff8a3d'],
      [1, 7, 1, 1, '#3e3228'],
      [6, 7, 1, 1, '#3e3228'],
    ],
    du_ngoan: [
      [0, 5, 8, 3, '#5fbf95'],
      [2, 2, 2, 3, '#8fb3a6'],
      [3, 1, 2, 2, '#8fb3a6'],
      [5, 3, 2, 2, '#6b9a8a'],
      [6, 0, 2, 2, '#fff6a8'],
    ],
    kiem_tien: [
      [2, 1, 4, 6, '#ffcf6e'],
      [1, 2, 6, 4, '#ffcf6e'],
      [3, 3, 2, 2, '#8a6a1a'],
      [2, 1, 1, 1, '#fff6d0'],
    ],
    tru_yeu: [
      [6, 0, 2, 1, '#e6eaf6'],
      [5, 1, 2, 1, '#e6eaf6'],
      [4, 2, 2, 1, '#d9e6ff'],
      [3, 3, 2, 1, '#d9e6ff'],
      [1, 4, 3, 1, '#ffd36b'],
      [2, 3, 1, 3, '#ffd36b'],
      [0, 6, 2, 2, '#7a5a3a'],
      [5, 5, 3, 3, '#e0402e'],
      [6, 6, 1, 1, '#ffffff'],
    ],
    ket_duyen: [
      [1, 1, 2, 1, '#e0507a'],
      [5, 1, 2, 1, '#e0507a'],
      [0, 2, 8, 2, '#e0507a'],
      [1, 4, 6, 1, '#e0507a'],
      [2, 5, 4, 1, '#e0507a'],
      [3, 6, 2, 1, '#e0507a'],
      [1, 2, 1, 1, '#ffb3c6'],
    ],
  };
  return (
    <svg viewBox="0 0 8 8" width="22" height="22" shapeRendering="crispEdges" aria-hidden="true">
      {px[f].map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  );
}

/* ---------------- Chọn quái để trừ yêu ---------------- */
export function HuntSheet({ c, onPick, onToggleFlee, onClose }: { c: Character; onPick: (id: string) => void; onToggleFlee: (v: boolean) => void; onClose: () => void }) {
  const L = combatLevel(c);
  const me = playerStats(c);
  return (
    <Sheet title="Trừ yêu luyện công" onClose={onClose}>
      <p style={{ marginTop: 0 }}>
        Cấp chiến đấu của bạn: <b style={{ fontWeight: 700, color: 'var(--red-d)' }}>Lv{L}</b> · Công {fmt(me.atk)} · Thủ {fmt(me.def)} · Máu {fmt(me.hp)}
      </p>
      <p className="note" style={{ marginTop: 0 }}>
        Quái càng mạnh càng nhiều tu vi, nhưng thua là có thể bỏ mạng. Ngọc bội hộ thân đỡ được một lần.
      </p>
      <label className="toggle">
        <input type="checkbox" checked={c.autoFlee !== false} onChange={(e) => onToggleFlee(e.target.checked)} />
        Tự rút lui khi máu dưới 30%
      </label>
      <div className="items">
        {monstersFor(c, sectSide(c)).map((m) => {
          const elv = effLv(c, m);
          const hidden = !m.boss && elv > L + 6;
          const d = dangerOf(c, m);
          const on = c.huntTarget === m.id;
          return (
            <button key={m.id} className={`hunt-item ${on ? 'on' : ''}`} disabled={hidden || c.dead} onClick={() => onPick(m.id)} aria-pressed={on}>
              <span className="item-icon" style={{ width: 48, height: 48 }}>
                {hidden ? <span style={{ fontSize: 26 }}>?</span> : <MonsterSprite m={m} size={42} tier={tierOf(c, m)} />}
              </span>
              <span>
                {hidden
                  ? '??? (chưa đủ tầm để biết)'
                  : m.boss
                    ? `BOSS ${m.boss === 'ta' ? 'Tà phái' : 'Chính phái'} · ${m.name}`
                    : `${monsterName(c, m)} · Lv${elv}${elv > m.lv ? ` (gốc ${m.lv})` : ''}`}
                {!hidden && m.el && (
                  <span className="badge el-badge" style={{ marginLeft: 4, background: ELEMENTS[m.el].color }}>
                    {ELEMENTS[m.el].name}
                  </span>
                )}
                {!hidden && m.sect && (
                  <span className="badge" style={{ marginLeft: 4 }}>
                    Thí luyện
                  </span>
                )}
                {!hidden && m.human && !m.boss && (
                  <span className="badge" style={{ marginLeft: 4 }}>
                    Cao thủ
                  </span>
                )}
                <small>{hidden ? m.place : m.boss ? `${m.place} · ${m.desc} Chưa từng ai thắng.` : `${m.place} · ~${fmt(killExp(c, m))} tu vi/con · ${c.kills?.[m.id] ?? 0} đã trảm`}</small>
                {!hidden && !m.boss && ITEMS.some((i) => i.from?.includes(m.id)) && (
                  <small className="drop-line">
                    Rơi {ITEMS.filter((i) => i.from?.includes(m.id)).length} món · đã có {ITEMS.filter((i) => i.from?.includes(m.id) && c.inventory.includes(i.id)).length} · xem trong Bảo khố
                    {dropFactor(c, m) < 1 && <b className="drop-warn"> · {dropFactor(c, m) === 0 ? 'quá yếu, không rơi đồ' : 'yếu hơn bạn, ít rơi đồ'}</b>}
                  </small>
                )}
              </span>
              {!hidden && <span className={`danger ${d}`}>{DANGER_TEXT[d]}</span>}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
