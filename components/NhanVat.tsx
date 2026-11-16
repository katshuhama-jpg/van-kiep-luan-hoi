'use client';

/**
 * 16/11 (Tyler yêu cầu): tab Nhân vật kiểu màn nhân vật game: chân thân đứng giữa sân khấu (giống Tàng Kinh Các),
 * ô đồ hai bên (Mũ, Quần áo, Phụ kiện bên trái; Vũ khí, Cánh, Ngoại trang bên phải), lực chiến dưới chân, tab con chia đồ như Túi đồ.
 * Đồ và áo chỉ để ngắm. Công pháp chân thân để trống chờ bản sau.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { ChanThanLook, Meta } from '@/lib/game/types';
import { ctRobeLayers, type CtOutfit } from '@/lib/game/chanThan';
import { CT_GEAR, CT_GEAR_ON, ctGearOf, ctNgoaiId, ctNgoaiList, ctPower, type CtGearItem, type CtGearSlot } from '@/lib/game/ctGear';
import { LpcFigure } from './ChanThan';
import { ctTitles, type DaoExt } from '@/lib/game/khaiMach';
import { REALMS } from '@/lib/game/data';
import { PixelFx, fxBatQuai, fxSen } from './PixelFx';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { LpcCropIcon } from './ItemIcon';
import { ctLayers } from '@/lib/game/chanThan';

type NvTab = 'ao' | 'ngoai' | CtGearSlot;
const TABS: { id: NvTab; vi: string; en: string }[] = [
  { id: 'ao', vi: 'Quần áo', en: 'Clothes' },
  { id: 'ngoai', vi: 'Ngoại trang', en: 'Costumes' },
  { id: 'mu', vi: 'Mũ', en: 'Hats' },
  { id: 'vu_khi', vi: 'Vũ khí', en: 'Weapons' },
  { id: 'canh', vi: 'Cánh', en: 'Wings' },
  { id: 'phu_kien', vi: 'Phụ kiện', en: 'Trinkets' },
];

/** biểu tượng pixel 9x9 cho ô trống */
const GLYPH: Record<NvTab, string[]> = {
  ao: ['.##...##.', '#########', '#########', '.#######.', '..#####..', '..#####..', '..#####..', '..##.##..', '..##.##..'],
  mu: ['.........', '....#....', '...###...', '..#####..', '.#######.', '#########', '.........', '.........', '.........'],
  vu_khi: ['........#', '.......#.', '......#..', '.....#...', '....#....', '.#.#.....', '..#......', '.#.#.....', '#........'],
  phu_kien: ['..#####..', '.#.....#.', '#.......#', '#.......#', '.#.....#.', '..#.#.#..', '...###...', '..#####..', '...###...'],
  ngoai: ['...###...', '..#####..', '.#######.', '#########', '.#######.', '.#######.', '.#######.', '.#######.', '##.....##'],
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

/** Hình món đồ như icon trong Túi đồ: áo ghép từ lớp áo, mũ và cánh cắt từ lớp LPC, vũ khí và phụ kiện dùng icon có sẵn */
export function OutfitIcon({ o, k, size }: { o: CtOutfit; k: string; size: number }) {
  return <LpcCropIcon id={`ct-ao-${k}`} layers={ctRobeLayers(o)} size={size} crop={[40, 50, 48]} />;
}
const GEAR_CROP: Record<CtGearSlot, [number, number, number]> = { mu: [40, 22, 48], canh: [16, 22, 96], vu_khi: [16, 16, 96], phu_kien: [44, 40, 40] };
export function GearIcon({ g, size }: { g: CtGearItem; size: number }) {
  if (g.icon) return <img src={`/icons/${g.icon}.png`} width={size} height={size} alt="" className="px-icon" loading="lazy" />;
  return <LpcCropIcon id={`ct-g-${g.id}`} layers={[...(g.back ?? []), ...(g.front ?? [])]} size={size} crop={g.crop ?? GEAR_CROP[g.slot]} />;
}

/** ngọn lửa pixel 13x13 cạnh số lực chiến */
const pxPath = (rows: string[]) => rows.flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join('');
const FLAME_OUT = pxPath(['......#......', '.....##......', '.....###.....', '....####.....', '...######.#..', '..#########..', '..##########.', '.###########.', '.###########.', '.###########.', '..#########..', '...#######...', '.....###.....']);
const FLAME_IN = pxPath(['.............', '.............', '.............', '.............', '......#......', '.....###.....', '....####.....', '....#####....', '...#######...', '...#######...', '....#####....', '.....###.....', '.............']);

const fmt = (n: number) => n.toLocaleString('vi-VN');

export function NhanVatStage({ ct, meta, ext, onSlot, active }: { ct: ChanThanLook; meta: Meta; ext: DaoExt; onSlot: (t: NvTab) => void; active: NvTab }) {
  const [why, setWhy] = useState(false);
  const [tt, setTt] = useState(false);
  const p = useMemo(() => ctPower(meta, ext), [meta, ext]);
  const layers = useMemo(() => ctLayers(ct), [ct]);
  const slot = (t: NvTab) => {
    const label = TABS.find((x) => x.id === t)!;
    let name: string | undefined;
    let icon: ReactNode = null;
    if (t === 'ao') {
      // 16/11: chưa ai có quần áo, ô để trống
    } else if (t === 'ngoai') {
      const n = ctNgoaiList().find((x) => x.id === ctNgoaiId(ct));
      if (n) (name = n.name), (icon = <OutfitIcon o={n.spec} k={`ng-${n.id}`} size={44} />);
    } else {
      const gi = ctGearOf(ct.gear?.[t]);
      if (gi) (name = gi.name), (icon = <GearIcon g={gi} size={44} />);
    }
    return (
      <button key={t} className={`nv-slot${name ? ' has' : ''}${active === t ? ' sel' : ''}`} onClick={() => onSlot(t)} aria-label={`${tr(label.vi, label.en)}: ${name ?? tr('trống', 'empty')}`}>
        <span className="nv-slot-box">{icon ?? <Glyph k={t} />}</span>
        <small>{name ?? tr(label.vi, label.en)}</small>
      </button>
    );
  };
  const titles = ctTitles(meta, ext);
  const mr = meta.career?.maxRealm ?? 0;
  // danh hiệu: danh hiệu Tam Tài cao nhất nếu có, nếu chưa thì cảnh giới cao nhất từng lên qua mọi kiếp
  const title = titles[0] ?? (REALMS[mr]?.name || tr('Phàm Nhân', 'Mortal'));
  return (
    <>
      <div className="nv-stage">
        <span className="nv-name">{ct.name}</span>
        <button className="nv-title" onClick={() => (setWhy(false), setTt((v) => !v))} aria-expanded={tt}>
          {title}
          {titles.length > 1 && <small> +{titles.length - 1}</small>}
        </button>
        <div className="nv-col left">
          {slot('mu')}
          {slot('ao')}
          {slot('phu_kien')}
        </div>
        <div className="nv-col right">
          {slot('vu_khi')}
          {slot('canh')}
          {slot('ngoai')}
        </div>
        <div className="tk-floor">
          <PixelFx spec={fxBatQuai('#ffd36b')} scale={3} dur={2.4} />
        </div>
        <div className="nv-me">
          <LpcFigure layers={layers} size={132} />
        </div>
        <div className="tk-sen">
          <PixelFx spec={fxSen()} scale={3} dur={1} />
        </div>
        {tt && (
          <div className="nv-why nv-tt" role="dialog" aria-label={tr('Danh hiệu', 'Titles')} onClick={() => setTt(false)}>
            <b>{tr('Danh hiệu', 'Titles')}</b>
            {titles.length ? (
              <ul>
                {titles.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p>{tr(`Chưa có danh hiệu Tam Tài, nên hiện cảnh giới cao nhất ngươi từng lên qua mọi kiếp: ${title}.`, `No Three Treasures title yet, so this shows the highest realm you ever reached: ${title}.`)}</p>
            )}
            <small>{tr('Danh hiệu có khi khai đủ 10 huyệt, viên mãn một hành, ngộ đủ đạo một cõi. Xem ở tab Tam Tài. Chạm để đóng.', 'Titles come from opening all 10 points, perfecting an element, or attaining every Dao of a realm. See the Treasures tab. Tap to close.')}</small>
          </div>
        )}
      </div>
      <button className="nv-power" onClick={() => (setTt(false), setWhy((v) => !v), track('ct_power_open', { lc: p.total }))} aria-expanded={why} aria-label={tr(`Lực chiến ${fmt(p.total)}, chạm xem cách tính`, `Power ${fmt(p.total)}, tap to see how it is counted`)}>
        <span className="nv-pw-in">
          <svg className="nv-pw-ic" width="26" height="26" viewBox="0 0 13 13" aria-hidden="true" shapeRendering="crispEdges">
            <path d={FLAME_OUT} fill="#a8202a" />
            <path d={FLAME_IN} fill="#ffd36b" />
          </svg>
          <small className="nv-pw-lbl">{tr('Lực chiến', 'Power')}</small>
          <b className="nv-pw-n">{fmt(p.total)}</b>
          <i aria-hidden="true">{why ? '▴' : '▾'}</i>
        </span>
      </button>
      {why && (
        <div className="nv-why2" role="region" aria-label={tr('Lực chiến tính thế nào', 'How power is counted')}>
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
          <small>{tr('Tăng khi khai huyệt, ngộ đạo, mở thêm đồ và sống thêm kiếp. Chưa dùng trong Lôi đài.', 'Grows as you open points, attain Daos, unlock gear and live more lives. Not used in the Arena yet.')}</small>
        </div>
      )}
    </>
  );
}

type Entry = { id: string; name: string; hint: string; has: boolean; on: boolean; icon: ReactNode; wear: () => ChanThanLook };

/** Lưới đồ theo tab con, gọn 4 cột như Túi đồ: hình món đồ, tên, dấu Mặc; món khóa hiện bóng tối, chạm xem cách mở. */
export function NhanVatBag({ ct, meta, ext, tab, setTab, onWear }: { ct: ChanThanLook; meta: Meta; ext: DaoExt; tab: NvTab; setTab: (t: NvTab) => void; onWear: (ct: ChanThanLook) => void }) {
  const [say, setSay] = useState<string | null>(null);
  const gear = ct.gear ?? {};
  // bản cũ mặc ngoại trang bằng outfit >= 100: chuyển sang gear.ngoai, bộ khởi đầu về 0
  const base = ct.outfit >= 100 ? 0 : ct.outfit;
  const put = (k: keyof NonNullable<ChanThanLook['gear']>, id: string | null): ChanThanLook => {
    const g2 = { ...gear };
    if (ct.outfit >= 100 && !g2.ngoai) g2.ngoai = ctNgoaiId(ct);
    // bộ mặc ở ô Quần áo cũ (16/11 sáng) nay là ngoại trang
    if (g2.ao) {
      if (!g2.ngoai) g2.ngoai = g2.ao;
      delete g2.ao;
    }
    if (id) g2[k] = id;
    else delete g2[k];
    return { ...ct, outfit: base, gear: g2 };
  };
  const list: Entry[] =
    tab === 'ao'
      ? []
      : tab === 'ngoai'
        ? ctNgoaiList().map((n) => {
            const on = ctNgoaiId(ct) === n.id;
            return { id: n.id, name: n.name, hint: n.hint, has: n.has(meta, ext), on, icon: <OutfitIcon o={n.spec} k={`ng-${n.id}`} size={40} />, wear: () => put('ngoai', on ? null : n.id) };
          })
        : CT_GEAR.filter((x) => CT_GEAR_ON && x.slot === tab).map((x) => ({ id: x.id, name: x.name, hint: x.hint, has: x.has(meta, ext), on: gear[tab] === x.id, icon: <GearIcon g={x} size={40} />, wear: () => put(tab, gear[tab] === x.id ? null : x.id) }));
  const nHas = list.filter((e) => e.has).length;
  return (
    <section className="nv-bag">
      <div className="nv-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`nv-tab${tab === t.id ? ' on' : ''}`} onClick={() => (setTab(t.id), setSay(null), track('ct_bag_tab', { tab: t.id }))}>
            {tr(t.vi, t.en)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="nv-empty">{tr(`Chưa ai có ${(TABS.find((t) => t.id === tab)?.vi ?? '').toLowerCase()}. Sẽ có ở bản sau. Hiện chỉ có Ngoại trang.`, 'Nobody has these yet; they come in a later version. Only Costumes are available for now.')}</p>
      ) : (
        <p className="nv-count">
          {tr(`Đã có ${nHas}/${list.length}`, `Owned ${nHas}/${list.length}`)}
          {tab === 'ngoai' && !ctNgoaiId(ct) && <small>{tr(' · đang mặc bộ khởi đầu', ' · wearing your starting outfit')}</small>}
        </p>
      )}
      {list.length > 0 && <div className="nv-grid">
        {list.map((e) => (
          <button
            key={e.id}
            className={`nv-cell${e.on ? ' on' : ''}${e.has ? '' : ' lock'}`}
            aria-pressed={e.on}
            aria-label={`${e.name}: ${e.on ? tr('đang mặc', 'wearing') : e.has ? tr('chạm để mặc', 'tap to wear') : tr(`khóa, ${e.hint}`, `locked, ${e.hint}`)}`}
            onClick={() => {
              if (!e.has) return setSay(tr(`${e.name} chưa mở. Cách mở: ${e.hint}.`, `${e.name} is locked. To unlock: ${e.hint}.`));
              const next = e.wear();
              onWear(next);
              setSay(e.on ? tr(`Đã cởi ${e.name}.`, `Took off ${e.name}.`) : tr(`Đang mặc ${e.name}.`, `Now wearing ${e.name}.`));
              track('ct_gear', { slot: tab, id: e.on ? null : e.id });
            }}
          >
            <span className="nv-ico" aria-hidden="true">
              {e.icon}
              {e.on && <i className="nv-badge">{tr('Mặc', 'On')}</i>}
              {!e.has && <i className="nv-badge lk">{tr('Khóa', 'Lock')}</i>}
            </span>
            <small className="nv-cell-n">{e.name}</small>
          </button>
        ))}
      </div>}
      {list.length > 0 && (
      <p className="nv-say" role="status">
        {say ?? tr('Chạm món đã có để mặc, chạm lần nữa để cởi. Chạm món khóa để xem cách mở.', 'Tap an owned item to wear it, tap again to take it off. Tap a locked item to see how to unlock it.')}
      </p>
      )}
      <small className="ct-note">{tr('Đồ chỉ để ngắm, không đổi sức mạnh trong kiếp. Không mặc ngoại trang thì chân thân mặc bộ khởi đầu (đổi ở Đổi ngoại hình).', 'Gear is cosmetic only. Without a costume your true self wears its starting outfit (change it in Change appearance).')}</small>
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
