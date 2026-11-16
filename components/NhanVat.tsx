'use client';

/**
 * 16/11 (Tyler yêu cầu): tab Nhân vật kiểu màn nhân vật game: chân thân đứng giữa sân khấu (giống Tàng Kinh Các),
 * ô đồ hai bên (Áo, Mũ bên trái; Vũ khí, Cánh bên phải), lực chiến dưới chân, tab con chia đồ như Túi đồ.
 * Đồ và áo chỉ để ngắm. Công pháp chân thân để trống chờ bản sau.
 */
import { useMemo, useState } from 'react';
import type { ChanThanLook, Meta } from '@/lib/game/types';
import { CT_OUTFITS, CT_REWARD_BASE, CT_REWARD_OUTFITS, ctOutfitOf } from '@/lib/game/chanThan';
import { CT_GEAR, ctGearOf, ctOutfitHas, ctPower, type CtGearSlot } from '@/lib/game/ctGear';
import { CT_REWARDS, type DaoExt } from '@/lib/game/khaiMach';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { LpcFigure } from './ChanThan';
import { ctLayers } from '@/lib/game/chanThan';

type NvTab = 'ao' | CtGearSlot;
const TABS: { id: NvTab; vi: string; en: string }[] = [
  { id: 'ao', vi: 'Quần áo', en: 'Clothes' },
  { id: 'mu', vi: 'Mũ', en: 'Hats' },
  { id: 'vu_khi', vi: 'Vũ khí', en: 'Weapons' },
  { id: 'canh', vi: 'Cánh', en: 'Wings' },
];

/** biểu tượng pixel 9x9 cho ô trống */
const GLYPH: Record<NvTab, string[]> = {
  ao: ['.##...##.', '#########', '#########', '.#######.', '..#####..', '..#####..', '..#####..', '..##.##..', '..##.##..'],
  mu: ['.........', '....#....', '...###...', '..#####..', '.#######.', '#########', '.........', '.........', '.........'],
  vu_khi: ['........#', '.......#.', '......#..', '.....#...', '....#....', '.#.#.....', '..#......', '.#.#.....', '#........'],
  canh: ['#.......#', '##.....##', '###...###', '####.####', '#########', '.###.###.', '..##.##..', '...#.#...', '.........'],
};
const GLYPH_D = Object.fromEntries(
  (Object.keys(GLYPH) as NvTab[]).map((k) => [k, GLYPH[k].flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join('')]),
) as Record<NvTab, string>;
function Glyph({ k, size = 26 }: { k: NvTab; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 9 9" aria-hidden="true" shapeRendering="crispEdges">
      <path d={GLYPH_D[k]} fill="currentColor" />
    </svg>
  );
}

const fmt = (n: number) => n.toLocaleString('vi-VN');

export function NhanVatStage({ ct, meta, ext, onSlot, active }: { ct: ChanThanLook; meta: Meta; ext: DaoExt; onSlot: (t: NvTab) => void; active: NvTab }) {
  const [why, setWhy] = useState(false);
  const p = useMemo(() => ctPower(meta, ext), [meta, ext]);
  const layers = useMemo(() => ctLayers(ct), [ct]);
  const g = ct.gender === 'nu' ? 'nu' : 'nam';
  const slot = (t: NvTab) => {
    const name = t === 'ao' ? ctOutfitOf(g, ct.outfit).name : ctGearOf(ct.gear?.[t])?.name;
    const label = TABS.find((x) => x.id === t)!;
    const outfitName = t === 'ao' && ct.outfit >= CT_REWARD_BASE ? CT_REWARDS()[ct.outfit - CT_REWARD_BASE]?.name : name;
    return (
      <button key={t} className={`nv-slot${name ? ' has' : ''}${active === t ? ' sel' : ''}`} onClick={() => onSlot(t)} aria-label={`${tr(label.vi, label.en)}: ${outfitName ?? tr('trống', 'empty')}`}>
        <span className="nv-slot-box">
          <Glyph k={t} />
        </span>
        <small>{outfitName ?? tr(label.vi, label.en)}</small>
      </button>
    );
  };
  return (
    <div className="nv-stage">
      <span className="nv-name">{ct.name}</span>
      <div className="nv-col left">
        {slot('mu')}
        {slot('ao')}
      </div>
      <div className="nv-col right">
        {slot('vu_khi')}
        {slot('canh')}
      </div>
      <div className="nv-me">
        <LpcFigure layers={layers} size={170} />
      </div>
      <button className="nv-power" onClick={() => (setWhy((v) => !v), track('ct_power_open', { lc: p.total }))} aria-expanded={why}>
        <small>{tr('Lực chiến', 'Power')}</small>
        <b>{fmt(p.total)}</b>
      </button>
      {why && (
        <div className="nv-why" role="dialog" aria-label={tr('Lực chiến tính thế nào', 'How power is counted')} onClick={() => setWhy(false)}>
          <b>{tr('Lực chiến chân thân', 'True self power')}</b>
          <ul>
            <li>
              <span>{tr('Gốc', 'Base')}</span>
              <span>1.000</span>
            </li>
            {p.parts.map((x) => (
              <li key={x.name}>
                <span>
                  {x.name} ({x.n} × {fmt(x.each)})
                </span>
                <span>{fmt(x.n * x.each)}</span>
              </li>
            ))}
          </ul>
          <small>{tr('Tăng khi khai huyệt, ngộ đạo, mở thêm đồ và sống thêm kiếp. Chưa dùng trong Lôi đài. Chạm để đóng.', 'Grows as you open points, attain Daos, unlock gear and live more lives. Not used in the Arena yet. Tap to close.')}</small>
        </div>
      )}
    </div>
  );
}

/** Lưới đồ theo tab con. Quần áo vẽ bằng mảng màu cho nhẹ; mũ, vũ khí, cánh vẽ chân thân đang mang thử món đó. */
export function NhanVatBag({ ct, meta, ext, tab, setTab, onWear }: { ct: ChanThanLook; meta: Meta; ext: DaoExt; tab: NvTab; setTab: (t: NvTab) => void; onWear: (ct: ChanThanLook) => void }) {
  const g = ct.gender === 'nu' ? 'nu' : 'nam';
  return (
    <section className="nv-bag">
      <div className="nv-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`nv-tab${tab === t.id ? ' on' : ''}`} onClick={() => (setTab(t.id), track('ct_bag_tab', { tab: t.id }))}>
            {tr(t.vi, t.en)}
          </button>
        ))}
      </div>
      {tab === 'ao' ? (
        <div className="nv-grid">
          {[...CT_OUTFITS[g].map((o, i) => ({ id: i, o, name: o.name, hint: '' })), ...CT_REWARD_OUTFITS.map((o, k) => ({ id: CT_REWARD_BASE + k, o, name: CT_REWARDS()[k]?.name ?? '', hint: CT_REWARDS()[k]?.hint ?? '' }))].map(({ id, o, name, hint }) => {
            const has = ctOutfitHas(meta, ext, id);
            const on = ct.outfit === id;
            return (
              <button
                key={id}
                className={`nv-cell${on ? ' on' : ''}${has ? '' : ' lock'}`}
                aria-pressed={on}
                disabled={!has}
                onClick={() => {
                  if (on) return;
                  onWear({ ...ct, outfit: id });
                  track('ct_look', { gender: ct.gender, hair: ct.hair, hairColor: ct.hairColor, outfit: id });
                }}
              >
                <span className="nv-swatch" aria-hidden="true">
                  <i style={{ background: o.body }} />
                  <i style={{ background: o.trim }} />
                  <i style={{ background: o.sleeves ?? o.pants }} />
                </span>
                <small className="nv-cell-n">{name}</small>
                <small className="nv-cell-s">{on ? tr('Đang mặc', 'Wearing') : has ? tr('Chạm để mặc', 'Tap to wear') : tr(`Khóa: ${hint}`, `Locked: ${hint}`)}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="nv-grid">
          {CT_GEAR.filter((x) => x.slot === tab).map((x) => {
            const has = x.has(meta, ext);
            const on = ct.gear?.[tab] === x.id;
            return (
              <button
                key={x.id}
                className={`nv-cell${on ? ' on' : ''}${has ? '' : ' lock'}`}
                aria-pressed={on}
                disabled={!has}
                onClick={() => {
                  const gear = { ...(ct.gear ?? {}) };
                  if (on) delete gear[tab];
                  else gear[tab] = x.id;
                  onWear({ ...ct, gear });
                  track('ct_gear', { slot: tab, id: on ? null : x.id });
                }}
              >
                {has ? <LpcFigure layers={ctLayers({ ...ct, gear: { [tab]: x.id } })} size={64} /> : <span className="nv-lock" aria-hidden="true" />}
                <small className="nv-cell-n">{x.name}</small>
                <small className="nv-cell-s">{on ? tr('Đang mang · chạm để bỏ', 'Wearing · tap to remove') : has ? tr('Chạm để mang', 'Tap to wear') : tr(`Khóa: ${x.hint}`, `Locked: ${x.hint}`)}</small>
              </button>
            );
          })}
        </div>
      )}
      <small className="ct-note">{tr('Đồ và ngoại trang chỉ để ngắm, không đổi sức mạnh trong kiếp. Thẻ khoe chân thân cũng vẽ đồ đang mang.', 'Gear and outfits are cosmetic and do not change power inside a life. Your share card shows what you wear.')}</small>
    </section>
  );
}

/** Công pháp chân thân: để trống, chờ bản sau */
export function NhanVatCongPhap() {
  return (
    <section className="nv-cp">
      <h3>{tr('Công pháp chân thân', 'True self techniques')}</h3>
      <div className="nv-cp-row" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="tk-orb lock" style={{ width: 52, height: 52 }}>
            <span className="tk-orb-in">
              <b>{tr('Sắp mở', 'Soon')}</b>
            </span>
          </span>
        ))}
      </div>
      <small className="ct-note">{tr('Năm ô công pháp mang theo mọi kiếp. Tính năng này đang làm, sẽ báo trong cáo thị khi mở.', 'Five technique slots carried through every life. Still in the works; the release notes will say when it opens.')}</small>
    </section>
  );
}

export type { NvTab };
