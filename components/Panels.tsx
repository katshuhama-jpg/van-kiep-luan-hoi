'use client';

import { useState, type ReactNode } from 'react';
import { FOCUS, ITEMS, PATHS, PILLS, REALMS, SEASONS, TALENTS, realmLabel, type Item } from '@/lib/game/data';
import { describeLean } from '@/lib/game/engine';
import { cultPct, fmt, needFor } from '@/lib/game/helpers';
import type { Character, Focus, LogEntry, Meta, PendingEvent } from '@/lib/game/types';

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
        <Bar wide label={c.realm === 0 ? 'Tu vi (chưa nhập đạo)' : `Tu vi · ${realmLabel(c.realm, c.layer)}`} value={c.realm === 0 ? `${fmt(c.cultivation)}/40` : `${fmt(c.cultivation)}/${fmt(needFor(c))}`} pct={c.realm === 0 ? c.cultivation / 40 : cultPct(c)} color="#2f6b5a" />
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
  return (
    <section className="panel" aria-label="Gia phả kiếp này">
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

export function ItemIcon({ item, pill }: { item?: Item; pill?: string }) {
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
  if (item.slot === 'ao') {
    const [a, b] = ICON_COLOR[item.look] ?? ICON_COLOR.vai;
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
    mockiem: <><rect x="4" y="0" width="1" height="6" fill="#b58a5a" /><rect x="2" y="6" width="5" height="1" fill="#7a5a3a" /><rect x="4" y="7" width="1" height="1" fill="#7a5a3a" /></>,
    kiem: <><rect x="4" y="0" width="1" height="6" fill="#d9e6ff" /><rect x="2" y="6" width="5" height="1" fill="#ffd36b" /><rect x="4" y="7" width="1" height="1" fill="#5a4128" /></>,
    dao: <><rect x="3" y="0" width="3" height="6" fill="#c0202e" /><rect x="2" y="6" width="5" height="1" fill="#141217" /><rect x="4" y="7" width="1" height="1" fill="#141217" /></>,
    phattran: <><rect x="4" y="3" width="1" height="5" fill="#b58a5a" /><rect x="2" y="0" width="5" height="3" fill="#ffffff" /></>,
    lodan: <><rect x="1" y="3" width="6" height="4" fill="#5a4a3a" /><rect x="0" y="2" width="8" height="1" fill="#3e3228" /><rect x="3" y="5" width="2" height="1" fill="#ff8a3d" /></>,
    ngoc: <><rect x="2" y="2" width="4" height="4" fill="#5fd8a0" /><rect x="3" y="0" width="1" height="2" fill="#b8432f" /></>,
    holo: <><rect x="2" y="4" width="4" height="4" fill="#e0a040" /><rect x="3" y="1" width="2" height="3" fill="#e0a040" /><rect x="3" y="0" width="2" height="1" fill="#8a5a2a" /></>,
    kiembay: <><rect x="1" y="6" width="1" height="1" fill="#ffd36b" /><rect x="2" y="5" width="1" height="1" fill="#d9e6ff" /><rect x="3" y="4" width="1" height="1" fill="#d9e6ff" /><rect x="4" y="3" width="1" height="1" fill="#d9e6ff" /><rect x="5" y="2" width="1" height="1" fill="#d9e6ff" /><rect x="6" y="1" width="1" height="1" fill="#ffffff" /></>,
  };
  return (
    <svg viewBox="0 0 8 8" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
      {map[item.look]}
    </svg>
  );
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
  const [tab, setTab] = useState<'do' | 'dan'>('do');
  return (
    <Sheet title="Phường thị" onClose={onClose}>
      <p className="note" style={{ marginTop: 0 }}>
        Linh thạch: <b style={{ color: 'var(--red-d)', fontWeight: 400 }}>{fmt(c.linhThach)}</b> · Đồ mua xong tự mặc lên người.
      </p>
      <div className="tabs">
        <button className={tab === 'do' ? 'on' : ''} onClick={() => setTab('do')}>
          Pháp y, pháp bảo
        </button>
        <button className={tab === 'dan' ? 'on' : ''} onClick={() => setTab('dan')}>
          Đan dược
        </button>
      </div>
      <div className="items">
        {tab === 'do' &&
          ITEMS.filter((i) => i.price > 0).map((it) => {
            const owned = c.inventory.includes(it.id);
            const lock = lockReason(c, it);
            return (
              <div key={it.id} className="item">
                <div className="item-icon">
                  <ItemIcon item={it} />
                </div>
                <div className="item-body">
                  <span>{it.name}</span>
                  <small>{lock ?? it.desc}</small>
                </div>
                <button className="btn btn-red" disabled={owned || !!lock || c.linhThach < it.price} onClick={() => onBuyItem(it.id)}>
                  {owned ? 'Đã có' : fmt(it.price)}
                </button>
              </div>
            );
          })}
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
              <button className="btn btn-red" disabled={c.linhThach < p.price} onClick={() => onBuyPill(p.id)}>
                {fmt(p.price)}
              </button>
            </div>
          ))}
      </div>
    </Sheet>
  );
}

/* ---------------- Túi đồ ---------------- */
export function BagSheet({ c, onEquip, onUsePill, onClose }: { c: Character; onEquip: (id: string) => void; onUsePill: (id: string) => void; onClose: () => void }) {
  const owned = ITEMS.filter((i) => c.inventory.includes(i.id));
  const pills = PILLS.filter((p) => (c.pills[p.id] ?? 0) > 0);
  return (
    <Sheet title="Túi trữ vật" onClose={onClose}>
      <div className="items">
        {owned.map((it) => {
          const on = c.equipped[it.slot] === it.id;
          return (
            <div key={it.id} className="item">
              <div className="item-icon">
                <ItemIcon item={it} />
              </div>
              <div className="item-body">
                <span>{it.name}</span>
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
        {!owned.length && !pills.length && <p className="note">Túi trống trơn.</p>}
      </div>
    </Sheet>
  );
}

/* ---------------- Bế quan ---------------- */
export function BeQuanSheet({ c, onGo, onClose }: { c: Character; onGo: (years: number) => void; onClose: () => void }) {
  const left = Math.max(0, Math.floor(c.lifespan - c.age));
  return (
    <Sheet title="Bế quan" onClose={onClose}>
      <p style={{ marginTop: 0 }}>
        Đóng cửa động phủ, tu vi tăng gấp rưỡi nhưng không gặp kỳ ngộ nào. Sẽ tự xuất quan khi chạm bình cảnh. Thọ nguyên còn khoảng <b style={{ fontWeight: 400, color: 'var(--red-d)' }}>{left} năm</b>.
      </p>
      {c.realm < 1 ? (
        <p className="note">Phải nhập đạo (Luyện Khí) mới bế quan được.</p>
      ) : (
        <div className="choice-row">
          {[10, 30, 100].map((y) => (
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
export function FocusGrid({ c, onPick }: { c: Character; onPick: (f: Focus) => void }) {
  return (
    <div className="focus-grid" role="radiogroup" aria-label="Trọng tâm năm nay">
      {(Object.keys(FOCUS) as Focus[]).map((f) => {
        const locked = c.age < FOCUS[f].minAge;
        return (
          <button
            key={f}
            role="radio"
            aria-checked={c.focus === f}
            className={c.focus === f ? 'on' : ''}
            disabled={locked || c.dead}
            onClick={() => onPick(f)}
            title={locked ? `Mở khi ${FOCUS[f].minAge} tuổi` : FOCUS[f].desc}
          >
            <FocusIcon f={f} />
            <span>{locked ? `${FOCUS[f].minAge}t` : FOCUS[f].name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Màn luân hồi (đầu thai) ---------------- */
export function BirthPanel({ meta, onBorn, busy }: { meta: Meta; onBorn: (talents: string[], yearSec: number) => void; busy?: boolean }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [yearSec, setYearSec] = useState(30);
  const spent = picked.reduce((s, id) => s + (TALENTS.find((t) => t.id === id)?.cost ?? 0), 0);
  const left = meta.phucDuyen - spent;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <section className="panel">
        <h2>Luân hồi đài</h2>
        <p style={{ margin: '0 0 6px' }}>
          {meta.lives === 0 ? 'Linh hồn mới tinh, chưa từng đầu thai.' : `Đã trải qua ${meta.lives} kiếp.`} Phúc duyên: <b style={{ fontWeight: 400, color: 'var(--jade)' }}>{left}</b>
          {meta.nghiep > 0 && (
            <>
              {' '}
              · Nghiệp: <b style={{ fontWeight: 400, color: 'var(--ta)' }}>{meta.nghiep}</b>
            </>
          )}
        </p>
        {meta.nghiep >= 10 && <p className="note" style={{ margin: 0 }}>Nghiệp nặng: kiếp sau khí vận giảm và có oan gia tìm tới.</p>}
      </section>

      <section className="panel">
        <h2>Thiên phú cho kiếp này</h2>
        <p className="note" style={{ marginTop: 0 }}>Dùng phúc duyên tích được từ các kiếp trước. Dùng xong là hết.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TALENTS.map((t) => {
            const on = picked.includes(t.id);
            const can = on || left >= t.cost;
            return (
              <button key={t.id} className={`talent ${on ? 'on' : ''}`} disabled={!can} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== t.id) : [...picked, t.id])}>
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
      </section>

      <section className="panel">
        <h2>Độ dài một năm</h2>
        <div className="choice-row">
          {[
            [15, 'Ngắn'],
            [30, 'Vừa'],
            [45, 'Dài'],
          ].map(([s, label]) => (
            <button key={s} className={`btn ${yearSec === s ? 'on' : ''}`} onClick={() => setYearSec(s as number)} aria-pressed={yearSec === s}>
              {label}
              <br />
              <small>1 năm ≈ {s}s</small>
            </button>
          ))}
        </div>
        <p className="note" style={{ marginBottom: 0 }}>Trong lúc chơi vẫn chỉnh được tốc độ 1× đến 16×.</p>
      </section>

      <button className="btn btn-red btn-big" disabled={busy} onClick={() => onBorn(picked, yearSec)}>
        Đầu thai
      </button>
    </div>
  );
}

/* ---------------- Màn chết ---------------- */
export function DeathSheet({ c, karma, onDone }: { c: Character; karma: { phuc: number; nghiep: number }; onDone: (epitaph: string) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title={c.ascended ? 'Phi thăng!' : 'Một kiếp đã hết'}>
      <p style={{ marginTop: 0 }}>
        <b style={{ fontWeight: 400, color: 'var(--red-d)', fontSize: 24 }}>{c.name}</b>
        <br />
        {Math.floor(c.age)} tuổi · {realmLabel(c.realm, c.layer)}
        {c.path ? ` · ${PATHS[c.path].name}` : ''} · {describeLean(c.daoTam)}
      </p>
      <p className="note">{c.cause}</p>
      <p>
        Mang sang kiếp sau: <b style={{ fontWeight: 400, color: 'var(--jade)' }}>+{karma.phuc} phúc duyên</b>
        {karma.nghiep > 0 && (
          <>
            {' '}
            và <b style={{ fontWeight: 400, color: 'var(--ta)' }}>+{karma.nghiep} nghiệp</b>
          </>
        )}
        .
      </p>
      <label className="field">
        <span>Khắc lên bia mộ (không bắt buộc)</span>
        <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="vd: Kiếp này không phụ kiếm trong tay" />
      </label>
      <button
        className="btn btn-red btn-big"
        style={{ width: '100%', marginTop: 10 }}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          onDone(text.trim());
        }}
      >
        Lập bia và luân hồi
      </button>
    </Sheet>
  );
}

export { SEASONS };

/* ---------------- Dải chỉ số gọn dưới sân khấu ---------------- */
function Mini({ label, value, pct, color }: { label: string; value: number | string; pct: number; color: string }) {
  return (
    <div className="mini">
      <span className="mini-l">{label}</span>
      <span className="mini-v">{value}</span>
      <span className="mini-bar" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
      </span>
    </div>
  );
}

export function StageStrip({ c, compact }: { c: Character; compact: boolean }) {
  const s = c.stats;
  const cult = c.realm === 0 ? c.cultivation / 40 : cultPct(c);
  const daoPct = (c.daoTam + 100) / 200;
  return (
    <div className="strip">
      <div className="strip-who">
        <span className="strip-name">{c.name}</span>
        <span className={`badge sex ${c.gender}`}>{c.gender === 'nam' ? 'Nam' : 'Nữ'}</span>
        {c.path && <span className="badge path">{PATHS[c.path].short}</span>}
        <span className="strip-realm">{c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer)}</span>
      </div>
      <div className="cult" role="progressbar" aria-label="Tu vi" aria-valuenow={Math.round(cult * 100)} aria-valuemin={0} aria-valuemax={100}>
        <span className="cult-fill" style={{ width: `${Math.min(1, cult) * 100}%` }} />
        <span className="cult-text">Tu vi {Math.round(cult * 100)}%</span>
      </div>
      {!compact && (
        <>
          <div className="minis">
            <Mini label="Thọ" value={`${Math.floor(c.age)}/${c.lifespan}`} pct={1 - c.age / c.lifespan} color="#b8432f" />
            <Mini label="Khỏe" value={s.sucKhoe} pct={s.sucKhoe / 100} color="#d96a4a" />
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
    tu_luyen: [[3, 0, 2, 2, '#7fc8ff'], [2, 2, 4, 2, '#ffe27a'], [1, 4, 6, 2, '#ffe27a'], [0, 6, 8, 2, '#3fa58a']],
    luyen_dan: [[3, 0, 2, 1, '#c9c4ff'], [1, 2, 6, 1, '#3e3228'], [1, 3, 6, 4, '#7a5f44'], [3, 5, 2, 1, '#ff8a3d'], [1, 7, 1, 1, '#3e3228'], [6, 7, 1, 1, '#3e3228']],
    du_ngoan: [[0, 5, 8, 3, '#5fbf95'], [2, 2, 2, 3, '#8fb3a6'], [3, 1, 2, 2, '#8fb3a6'], [5, 3, 2, 2, '#6b9a8a'], [6, 0, 2, 2, '#fff6a8']],
    kiem_tien: [[2, 1, 4, 6, '#ffcf6e'], [1, 2, 6, 4, '#ffcf6e'], [3, 3, 2, 2, '#8a6a1a'], [2, 1, 1, 1, '#fff6d0']],
    ket_duyen: [[1, 1, 2, 1, '#e0507a'], [5, 1, 2, 1, '#e0507a'], [0, 2, 8, 2, '#e0507a'], [1, 4, 6, 1, '#e0507a'], [2, 5, 4, 1, '#e0507a'], [3, 6, 2, 1, '#e0507a'], [1, 2, 1, 1, '#ffb3c6']],
  };
  return (
    <svg viewBox="0 0 8 8" width="22" height="22" shapeRendering="crispEdges" aria-hidden="true">
      {px[f].map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  );
}
