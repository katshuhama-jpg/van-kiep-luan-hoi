'use client';

/**
 * 16/11 (Tyler yêu cầu): tab Nhân vật kiểu màn nhân vật game: chân thân đứng giữa sân khấu (giống Tàng Kinh Các),
 * ô đồ hai bên (Mũ, Quần áo, Phụ kiện bên trái; Vũ khí, Cánh, Ngoại trang bên phải), lực chiến dưới chân, tab con chia đồ như Túi đồ.
 * Đồ và áo chỉ để ngắm. Công pháp chân thân để trống chờ bản sau.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SON_MON_ON } from '@/lib/flags';
import { realApi } from '@/lib/sonmon/api';
import type { ChanThanLook, Meta } from '@/lib/game/types';
import { ctRobeLayers, type CtOutfit } from '@/lib/game/chanThan';
import { CT_GEAR, CT_GEAR_ON, ctGearOf, ctNgoaiId, ctNgoaiList, ctPower, type CtGearItem, type CtGearSlot } from '@/lib/game/ctGear';
import { LpcFigure } from './ChanThan';
import type { DaoExt } from '@/lib/game/khaiMach';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { LpcCropIcon } from './ItemIcon';
import { BaoVatHinh } from './sonmon/BaoVat';
import { baoVatMac } from '@/lib/sonmon/api';
import { bvFxText, bvTen, smGearId, smGearParse, BV_TU_VI, bvDiem } from '@/lib/sonmon/baoVat';
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
  // 19/11: pháp bảo Sơn Môn dùng hình pixel riêng (cao gấp 1,5 nên thu bề ngang lại cho vừa ô vuông)
  const sm = smGearParse(g.id);
  if (sm) return <BaoVatHinh loai={sm.loai} pham={sm.pham} size={Math.round(size / 1.5)} />;
  if (g.icon) return <img src={`/icons/${g.icon}.png`} width={size} height={size} alt="" className="px-icon" loading="lazy" />;
  return <LpcCropIcon id={`ct-g-${g.id}`} layers={[...(g.back ?? []), ...(g.front ?? [])]} size={size} crop={g.crop ?? GEAR_CROP[g.slot]} />;
}

/** 18/11: Lực chiến Sơn Môn (máy chủ tính, dùng trong trận Sơn Môn) để người chơi khỏi nhầm với Tu vi */
function SmLcLine() {
  const [lc, setLc] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const api = realApi();
    if (api.linked) api.state().then((s) => live && setLc(s.lc ?? 0), () => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <p className="nv-sm-lc">
      {lc != null
        ? tr(`Lực chiến Sơn Môn: ${fmt(lc)}. Đây là số khác, tính theo các kiếp đã chơi (năm sống, cảnh giới, kết cục, ngày chơi, huyệt), dùng khi đánh chiếm đất.`, `Sect power: ${fmt(lc)}. A separate number from your lives played, used in sect battles.`)
        : tr('Lực chiến Sơn Môn là số khác, tính theo các kiếp đã chơi, xem ở tab Sơn Môn.', 'Sect power is a separate number, see the Sects tab.')}{' '}
      <Link href="/son-mon">{tr('Xem', 'See')}</Link>
    </p>
  );
}

/** ngọn lửa pixel 13x13 cạnh số tu vi */
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
  // 16/11 (Tyler chốt): chân thân mọi người hiện là Phàm Nhân. Cách tăng cấp, có đồ, công pháp chân thân làm sau Sơn Môn.
  const title = tr('Phàm Nhân', 'Mortal');
  return (
    <>
      <div className="nv-stage">
        <span className="nv-name">{ct.name}</span>
        <button className="nv-title" onClick={() => (setWhy(false), setTt((v) => !v))} aria-expanded={tt}>
          {title}
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
        <div className="nv-me">
          <LpcFigure layers={layers} size={132} />
        </div>
        {tt && (
          <div className="nv-why nv-tt" role="dialog" aria-label={tr('Danh hiệu', 'Titles')} onClick={() => setTt(false)}>
            <b>{tr('Cấp chân thân: Phàm Nhân', 'True self rank: Mortal')}</b>
            <p>{tr('Chân thân của mọi người hiện đều là Phàm Nhân. Cách tu luyện chân thân, đồ và công pháp sẽ mở sau Sơn Môn.', 'Every true self is still a Mortal for now. True self cultivation, gear and techniques open after the Sects update.')}</p>
            <small>{tr('Chạm để đóng.', 'Tap to close.')}</small>
          </div>
        )}
      </div>
      <button className="nv-power" onClick={() => (setTt(false), setWhy((v) => !v), track('ct_power_open', { lc: p.total }))} aria-expanded={why} aria-label={tr(`Tu vi ${fmt(p.total)}, chạm xem cách tính`, `Cultivation ${fmt(p.total)}, tap to see how it is counted`)}>
        <span className="nv-pw-in">
          <svg className="nv-pw-ic" width="26" height="26" viewBox="0 0 13 13" aria-hidden="true" shapeRendering="crispEdges">
            <path d={FLAME_OUT} fill="#a8202a" />
            <path d={FLAME_IN} fill="#ffd36b" />
          </svg>
          <small className="nv-pw-lbl">{tr('Tu vi', 'Cultivation')}</small>
          <b className="nv-pw-n">{fmt(p.total)}</b>
          <i className={`nv-pw-go${why ? ' up' : ''}`} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 9 9" shapeRendering="crispEdges">
              <path d="M1 2h1v1h-1zM2 3h1v1h-1zM3 4h1v1h-1zM4 5h1v1h-1zM5 4h1v1h-1zM6 3h1v1h-1zM7 2h1v1h-1zM1 3h1v1h-1zM2 4h1v1h-1zM3 5h1v1h-1zM4 6h1v1h-1zM5 5h1v1h-1zM6 4h1v1h-1zM7 3h1v1h-1z" fill="currentColor" />
            </svg>
          </i>
        </span>
      </button>
      {why && (
        <div className="nv-why2" role="region" aria-label={tr('Tu vi tính thế nào', 'How cultivation is counted')}>
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
          <small>{tr('Tu vi tăng khi khai huyệt, ngộ đạo, mở thêm đồ và sống thêm kiếp. Chưa dùng trong Lôi đài.', 'Cultivation grows as you open points, attain Daos, unlock gear and live more lives. Not used in the Arena yet.')}</small>
          {SON_MON_ON && <SmLcLine />}
        </div>
      )}
    </>
  );
}

type Entry = { id: string; name: string; hint: string; has: boolean; on: boolean; icon: ReactNode; wear: () => ChanThanLook; sm?: number; fx?: string };

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
        : [
            // 19/11: pháp bảo Sơn Môn đã nhận (máy chủ giữ ai có món nào, món nào đang lắp)
            ...(SON_MON_ON && (tab === 'vu_khi' || tab === 'phu_kien')
              ? (ext.smBv ?? [])
                  .filter((b) => b.o === tab)
                  .map((b): Entry => {
                    const gid = smGearId(b.loai, b.pham);
                    return {
                      id: `smbv-${b.id}`,
                      name: bvTen(b.loai, b.pham),
                      hint: '',
                      has: true,
                      on: b.mac,
                      icon: <BaoVatHinh loai={b.loai} pham={b.pham} size={27} />,
                      wear: () => put(tab, b.mac ? null : gid),
                      sm: b.id,
                      fx: `${bvFxText(b.loai, b.pham)} · ${tr(`Tu vi +${fmt(bvDiem(b.loai, b.pham) * BV_TU_VI)}`, `Cultivation +${fmt(bvDiem(b.loai, b.pham) * BV_TU_VI)}`)}${b.khac ? ` · ${b.khac}` : ''}`,
                    };
                  })
              : []),
            ...CT_GEAR.filter((x) => CT_GEAR_ON && x.slot === tab).map((x) => ({ id: x.id, name: x.name, hint: x.hint, has: x.has(meta, ext), on: gear[tab] === x.id, icon: <GearIcon g={x} size={40} />, wear: () => put(tab, gear[tab] === x.id ? null : x.id) })),
          ];
  const smTab = SON_MON_ON && (tab === 'vu_khi' || tab === 'phu_kien');
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
      {list.length === 0 && smTab ? (
        <p className="nv-empty">
          {tr(
            `Chưa có ${tab === 'vu_khi' ? 'vũ khí' : 'phụ kiện'}. Pháp bảo Sơn Môn phát lúc kết Kỷ 1 (21:00 1/12): 7 người nhiều Công nhất mỗi môn nhận vũ khí, môn chủ nhận thêm ấn. Lắp vào đây để cộng Tu vi chân thân.`,
            `No ${tab === 'vu_khi' ? 'weapons' : 'trinkets'} yet. Sect treasures are handed out when Era 1 ends (Dec 1, 9 PM): the top 7 by merit in each sect get weapons, the leader also gets a seal. Equip them here to raise cultivation.`,
          )}
        </p>
      ) : list.length === 0 ? (
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
              if (e.sm != null) {
                // pháp bảo Sơn Môn: máy chủ ghi món đang lắp (mỗi ô một món), rồi chân thân cầm món đó
                baoVatMac(e.sm).then(
                  (ds) => {
                    window.dispatchEvent(new CustomEvent('vkl-sm-bv', { detail: ds }));
                    onWear(e.wear());
                    setSay(e.on ? tr(`Đã tháo ${e.name}.`, `Removed ${e.name}.`) : tr(`Đã lắp ${e.name}: ${e.fx}.`, `Equipped ${e.name}: ${e.fx}.`));
                    track('sm_bv_mac', { o: tab, thao: e.on });
                  },
                  () => setSay(tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later.")),
                );
                return;
              }
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
      {smTab && <small className="ct-note">{tr('Pháp bảo Sơn Môn có chỉ số như đồ trong Mộng và không mất tác dụng. Lắp vào thì cộng Tu vi chân thân; chưa đổi trận trong kiếp.', 'Sect treasures carry stats like dream gear and never expire. Equipped, they add to your cultivation; lives are not affected yet.')}</small>}
      {!smTab && <small className="ct-note">{tr('Đồ chỉ để ngắm, không đổi sức mạnh trong kiếp. Không mặc ngoại trang thì chân thân mặc bộ khởi đầu (đổi ở Đổi ngoại hình).', 'Gear is cosmetic only. Without a costume your true self wears its starting outfit (change it in Change appearance).')}</small>}
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
