'use client';

/** 4.6.0 Sơn Môn M5: bản đồ lục giác (kéo để xem, chạm ô) - dùng chung cho M3 chọn ô cắm cờ. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmDai, SmMap, SmMapO, SmMember, SmState } from '@/lib/sonmon/api';
import { capLc, COI, HUY_MAU, hexDist, khDan, SM_CFG } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { XemMon } from './SmList';
import { DongMinh, fmtN, hhmm, mocGio, Msg, smCo, truoc, useNow, type SmCtx } from './ui';

const S = 24; // bán kính ô (px)
const W = Math.sqrt(3) * S;
const px = (q: number, r: number) => ({ x: W * (q + r / 2), y: 1.5 * S * r });
const HEX = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(S - 1) * Math.cos(a)},${(S - 1) * Math.sin(a)}`;
}).join(' ');
const HEX_IN = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(S - 5) * Math.cos(a)},${(S - 5) * Math.sin(a)}`;
}).join(' ');
const NEN: Record<string, string> = { thien: '#2e2850', hong_tran: '#2a2a40', u_minh: '#221b32' };
// 18/11 (Tyler: ô có người khó nhìn): ô trống lùi vào nền tối; ô có môn giữ nền sáng pha màu huy hiệu, viền màu huy hiệu, quầng sáng, huy hiệu to hơn
const VIEN_TRONG = '#2c2545';
// 18/11 (Tyler: bản đồ nhỏ, chưa hấp dẫn): sao pixel cố định phía sau, trôi theo bản đồ
const SAO = Array.from({ length: 140 }, (_, i) => {
  const h = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: -700 + h(1) * 1400, y: -700 + h(2) * 1400, s: h(3) > 0.85 ? 3 : 2, o: 0.25 + h(4) * 0.5 };
});
const COI_MAU: Record<string, string> = { thien: '#cfc6ff', hong_tran: '#ffd9a8', u_minh: '#b98cff' };
const Z_MIN = 0.7, Z_MAX = 1.9;
/** thời gian bảo hộ còn lại gọn để vẽ trên ô: "47g", "35p"; null nếu hết */
export function bhCon(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600e3);
  return h >= 1 ? tr(`${h}g`, `${h}h`) : tr(`${Math.max(1, Math.ceil(ms / 60e3))}p`, `${Math.max(1, Math.ceil(ms / 60e3))}m`);
}
/** còn lại đầy đủ: "còn 45 giờ 12 phút" */
export function bhConDu(iso: string, now = Date.now()): string {
  const m = Math.max(1, Math.ceil((new Date(iso).getTime() - now) / 60e3));
  const h = Math.floor(m / 60);
  return h > 0 ? tr(`còn ${h} giờ ${m % 60} phút`, `${h}h ${m % 60}m left`) : tr(`còn ${m} phút`, `${m} min left`);
}
/** trộn màu a với b theo tỉ lệ t (0 = a, 1 = b) */
function tron(a: string, b: string, t: number) {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = n(a), y = n(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function fromPx(x: number, y: number) {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / S;
  const r = ((2 / 3) * y) / S;
  let rx = Math.round(q), rz = Math.round(r);
  const ry = Math.round(-q - r);
  const dx = Math.abs(rx - q), dy = Math.abs(ry - (-q - r)), dz = Math.abs(rz - r);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (!(dy > dz)) rz = -rx - ry;
  return { q: rx, r: rz };
}

/** Ngày 8 (game-feel): ô vừa khai hoang - cờ pixel dựng lên 0,6 giây, ô sáng nhấp 3 lần (trong 4 giây sau khi cắm) */
let coMoi: { k: string; t: number } | null = null;

/** 20/11 Kỷ 2 "Đất có giá": loại ô (Linh Mạch, Thiên Trì, yêu thú) */
export type DatO = NonNullable<SmMap['dat']>[number];
export function datOf(map: SmMap | null | undefined, q: number, r: number): DatO | null {
  return map?.dat?.find((d) => d[0] === q && d[1] === r) ?? null;
}
export const laYeu = (map: SmMap | null | undefined, chu: number | null) => chu != null && map?.yeu_mon != null && chu === map.yeu_mon;
/** icon yêu thú cố định theo tọa độ (Cultivation World Simulator, CC BY-NC-SA 4.0) */
export const yeuIcon = (q: number, r: number) => `/cws/thu/a${((((q * 7 + r * 13) % 11) + 11) % 11) + 1}.webp`;
const kN = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));

/** dấu Linh Mạch: viên ngọc xanh; Thiên Trì: hồ sen vàng (vẽ pixel) */
function DauDat({ loai, at = [-17, -19] }: { loai: DatO[2]; at?: [number, number] }) {
  if (loai === 'linh_mach')
    return (
      <g transform={`translate(${at[0]},${at[1]})`} shapeRendering="crispEdges">
        <rect x={3} y={0} width={4} height={2} fill="#bff5e2" />
        <rect x={1} y={2} width={8} height={4} fill="#3fd0a0" />
        <rect x={3} y={6} width={4} height={3} fill="#1f8a68" />
        <rect x={0} y={2} width={1} height={4} fill="#0f3a2c" /><rect x={9} y={2} width={1} height={4} fill="#0f3a2c" />
        <rect x={2} y={2} width={2} height={2} fill="#e8fff6" />
      </g>
    );
  if (loai === 'thien_tri')
    return (
      <g transform={`translate(${at[0]},${at[1]})`} shapeRendering="crispEdges">
        <rect x={0} y={5} width={12} height={4} fill="#3f7fd0" stroke="#10233f" strokeWidth={0.8} />
        <rect x={4} y={1} width={4} height={4} fill="#f2c14e" />
        <rect x={2} y={3} width={2} height={2} fill="#f6a6c8" /><rect x={8} y={3} width={2} height={2} fill="#f6a6c8" />
      </g>
    );
  return null;
}

/** 20/11 Kỷ 2: chú giải Linh Mạch, Thiên Trì, yêu thú */
function DatChuGiai({ map }: { map: SmMap | null }) {
  if (!map?.dat?.length) return null;
  return (
    <>
      <span>
        <svg width="16" height="16" viewBox="-17 -19 12 12" aria-hidden><DauDat loai="linh_mach" /></svg>
        {tr('Linh Mạch: +3 điểm mỗi giờ', 'Spirit Vein: +3 pts/hour')}
      </span>
      <span>
        <svg width="16" height="16" viewBox="-6 -22 12 12" aria-hidden><DauDat loai="thien_tri" at={[-6, -22]} /></svg>
        {tr('Thiên Trì: +5 điểm mỗi giờ', 'Heaven Pool: +5 pts/hour')}
      </span>
      <span>
        <img src="/cws/thu/a1.webp" width={16} height={16} alt="" />
        {tr('yêu thú (số là lực giữ)', 'demon beast (defence shown)')}
      </span>
    </>
  );
}

/** 20/11 Kỷ 2: ô này đáng giá gì */
function DatInfo({ map, dat }: { map: SmMap | null; dat: DatO | null }) {
  if (!map?.dat?.length) return null;
  const chu = !dat
    ? tr('Ô thường: môn giữ được +1 điểm mỗi giờ.', 'Ordinary tile: +1 point per hour for the holder.')
    : dat[2] === 'linh_mach'
      ? tr('Linh Mạch: môn giữ được +3 điểm mỗi giờ và +2 Khí vận mỗi sáng 5:00. Môn nào cũng đánh được ô này.', 'Spirit Vein: +3 points per hour and +2 fortune each 5:00 for the holder. Any sect may attack it.')
      : dat[2] === 'thien_tri'
        ? tr('Thiên Trì: môn giữ được +5 điểm mỗi giờ, người đứng giữ mạnh thêm 10%. Môn nào cũng đánh được ô này.', 'Heaven Pool: +5 points per hour, guards +10% stronger. Any sect may attack it.')
        : tr('Yêu thú chiếm ô này. Đánh thắng thì ô về môn ta, +1 điểm mỗi giờ như ô thường.', 'A demon beast holds this tile. Beat it and the tile is ours, +1 point per hour.');
  return <p className={`sm-dat-info ${dat?.[2] ?? 'thuong'}`}>{chu}</p>;
}

export function HexMap({
  map,
  mine,
  sel,
  onPick,
  pickEmpty = false,
  center,
  recenter,
  kh,
}: {
  map: SmMap;
  /** 18/11 khai hoang: ô trống kề lãnh thổ môn ta, còn chỗ mở rộng (vẽ dấu + nhấp nháy) */
  kh?: Set<string>;
  mine: number | null;
  sel: [number, number] | null;
  onPick: (o: SmMapO) => void;
  /** M3: chỉ ô trống chọn được (ô trống viền vàng, ô có chủ mờ đi) */
  pickEmpty?: boolean;
  center: [number, number];
  recenter: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });
  // 18/11: phóng to / thu nhỏ (nút +/-, lăn chuột), mặc định to hơn để ô và huy hiệu dễ nhìn trên điện thoại
  const [z, setZ] = useState(1.25);
  const zoom = (k: number) => {
    const el = box.current;
    if (!el) return;
    const z1 = Math.min(Z_MAX, Math.max(Z_MIN, Math.round(z * k * 100) / 100));
    if (z1 === z) return;
    const cx = el.clientWidth / 2, cy = el.clientHeight / 2;
    setOff((o) => ({ x: cx - (cx - o.x) * (z1 / z), y: cy - (cy - o.y) * (z1 / z) }));
    setZ(z1);
  };
  // tên 3 cõi đặt ở giữa vùng của mỗi cõi
  const coiNhan = useMemo(() => {
    const acc: Record<string, { x: number; y: number; n: number }> = {};
    for (const o of map.o) {
      const p = px(o[0], o[1]);
      const a = (acc[o[3]] ??= { x: 0, y: 0, n: 0 });
      a.x += p.x; a.y += p.y; a.n++;
    }
    return Object.entries(acc).map(([k, a]) => ({ k, x: (a.x / a.n) * 1.35, y: (a.y / a.n) * 1.35 }));
  }, [map]);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean; id: number } | null>(null);
  const idx = useMemo(() => new Map(map.o.map((o) => [`${o[0]},${o[1]}`, o])), [map]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const c = px(center[0], center[1]);
    setOff({ x: el.clientWidth / 2 - c.x * z, y: el.clientHeight / 2 - c.y * z });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], recenter]);
  const pan = (dx: number, dy: number) => setOff((o) => ({ x: o.x + dx, y: o.y + dy }));

  const mau = (id: number | null) => (id == null ? VIEN_TRONG : laYeu(map, id) ? '#7a2a2a' : HUY_MAU[Math.floor((map.mon[String(id)]?.huy_hieu ?? 0) / 5) % 6].hex);
  // viền ô có chủ: màu huy hiệu làm sáng lên (Đen huyền thì dùng xám bạc để không chìm vào nền)
  const vien = (id: number) => {
    const m = mau(id);
    return m === '#2b2b33' ? '#b9b4c8' : tron(m, '#ffffff', 0.25);
  };

  return (
    <>
    <div className="sm-map-wrap">
    <div
      ref={box}
      className="sm-map"
      role="application"
      tabIndex={0}
      onKeyDown={(e) => {
        const d: Record<string, [number, number]> = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] };
        if (e.key === '+' || e.key === '=') zoom(1.2);
        else if (e.key === '-') zoom(1 / 1.2);
        else if (d[e.key]) {
          e.preventDefault();
          pan(...d[e.key]);
        } else if ((e.key === 'Enter' || e.key === ' ') && box.current) {
          // Ngày 7: chọn ô bằng bàn phím = ô nằm giữa khung bản đồ
          e.preventDefault();
          const h = fromPx((box.current.clientWidth / 2 - off.x) / z, (box.current.clientHeight / 2 - off.y) / z);
          const o = idx.get(`${h.q},${h.r}`);
          if (o && (!pickEmpty || o[4] == null)) onPick(o);
        }
      }}
      aria-label={tr('Bản đồ ô lục giác. Kéo để xem, chạm một ô để xem chi tiết. Bàn phím: mũi tên để dời, Enter chọn ô ở giữa.', 'Hex map. Drag to look around, tap a tile for details. Keyboard: arrows to pan, Enter picks the centre tile.')}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y, moved: false, id: e.pointerId };
        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 8) return;
        d.moved = true;
        setOff({ x: d.ox + dx, y: d.oy + dy });
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.moved) return;
        const rect = box.current!.getBoundingClientRect();
        const h = fromPx((e.clientX - rect.left - off.x) / z, (e.clientY - rect.top - off.y) / z);
        const o = idx.get(`${h.q},${h.r}`);
        if (o && (!pickEmpty || o[4] == null)) onPick(o);
      }}
      onPointerCancel={() => (drag.current = null)}
      onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1)}
    >
      <svg width={1200} height={1200} style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${z})`, transformOrigin: '0 0', overflow: 'visible' }} aria-hidden>
        {SAO.map((s, i) => (
          <rect key={`s${i}`} x={s.x} y={s.y} width={s.s} height={s.s} fill="#e9e2ff" opacity={s.o} />
        ))}
        {coiNhan.map((c) => (
          <text key={c.k} x={c.x} y={c.y} textAnchor="middle" fontSize={22} fontWeight={700} fill={COI_MAU[c.k] ?? '#ffffff'} opacity={0.32} fontFamily="inherit" letterSpacing={2}>
            {COI[c.k as keyof typeof COI]?.name.toUpperCase()}
          </text>
        ))}
        {map.o.map((o) => {
          if (o[4] == null) return null;
          const p = px(o[0], o[1]);
          const ta = mine != null && o[4] === mine;
          return <polygon key={`g${o[0]},${o[1]}`} points={HEX} transform={`translate(${p.x},${p.y}) scale(1.12)`} fill="none" stroke={ta ? '#f2c14e' : vien(o[4])} strokeWidth={7} opacity={pickEmpty ? 0.12 : 0.35} />;
        })}
        {map.o.map((o) => {
          const [q, r, , coi, chu, cd, bh] = o;
          const p = px(q, r);
          const ta = mine != null && chu === mine;
          const isSel = sel && sel[0] === q && sel[1] === r;
          const trong = chu == null;
          const stroke = isSel ? '#fff3dc' : ta ? '#f2c14e' : trong ? (pickEmpty ? '#c9952e' : VIEN_TRONG) : vien(chu);
          return (
            <g key={`${q},${r}`} transform={`translate(${p.x},${p.y})`} opacity={pickEmpty && !trong ? 0.45 : 1}>
              <polygon points={HEX} fill={trong ? NEN[coi] : tron(mau(chu), '#f3e6c4', 0.72)} stroke={stroke} strokeWidth={isSel || ta ? 3.5 : trong ? 1.5 : 3} />
              {ta && !isSel && <polygon points={HEX_IN} fill="none" stroke="#f2c14e" strokeWidth={2.5} />}
              {bhCon(bh) && !trong && !laYeu(map, chu) && <polygon points={HEX_IN} fill="none" stroke="#2f8a5a" strokeWidth={2.5} strokeDasharray="4 2" />}
              {!trong && !laYeu(map, chu) && <HuyHieu id={map.mon[String(chu)]?.huy_hieu ?? 0} size={30} x={-15} y={bhCon(bh) ? -17 : -14} label="" />}
              {/* 20/11 Kỷ 2: ô yêu thú: hình yêu thú và lực giữ */}
              {laYeu(map, chu) && (
                <g>
                  <image href={yeuIcon(q, r)} x={-16} y={-21} width={32} height={32} />
                  <rect x={-15} y={8} width={30} height={10} fill="#7a2a2a" stroke="#1f0a0a" strokeWidth={1} />
                  <text x={0} y={16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#ffe3d6" fontFamily="inherit">
                    {kN(datOf(map, q, r)?.[4] ?? 0)}
                  </text>
                </g>
              )}
              {(() => {
                // 20/11: Linh Mạch viền ngọc xanh, Thiên Trì viền vàng; dấu nằm trong ô (giữa dưới khi ô trống, mép trái khi có chủ)
                const d = datOf(map, q, r);
                if (!d || d[2] === 'yeu_thu') return null;
                const lm = d[2] === 'linh_mach';
                return (
                  <>
                    <polygon points={HEX_IN} fill="none" stroke={lm ? '#3fd0a0' : '#f2c14e'} strokeWidth={2.5} />
                    <DauDat loai={d[2]} at={trong ? (lm ? [-5, 4] : [-6, 2]) : lm ? [-22, -5] : [-6, 9]} />
                  </>
                );
              })()}
              {/* 18/11: ô đang bảo hộ: nhãn xanh có khiên và thời gian còn lại */}
              {bhCon(bh) && !trong && !laYeu(map, chu) && (
                <g transform="translate(0, 12)">
                  <rect x={-15} y={-5} width={30} height={11} fill="#2f6b4a" stroke="#0f2a1c" strokeWidth={1} />
                  <path d="M-12 -3h5v3l-2.5 2l-2.5 -2z" fill="#c8f0d4" />
                  <text x={4} y={3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#ffffff" fontFamily="inherit">
                    {bhCon(bh)}
                  </text>
                </g>
              )}
              {cd && !trong && <rect x={-4} y={-S + 2} width={8} height={5} fill="#e8c35a" stroke="#1f160d" strokeWidth={1} />}
              {ta && !cd && (
                <g className="sm-co-bay" transform={`translate(${S * 0.42}, ${-S * 0.62})`}>
                  <rect x={0} y={0} width={1.6} height={11} fill="#1f160d" />
                  <rect x={1.6} y={0} width={7} height={5} fill="#f2c14e" stroke="#1f160d" strokeWidth={0.8} />
                  <rect x={3.5} y={1.6} width={2} height={1.8} fill="#a8303a" />
                </g>
              )}
              {ta && coMoi?.k === `${q},${r}` && Date.now() - coMoi.t < 4000 && (
                <g key={coMoi.t}>
                  <polygon className="sm-o-sang" points={HEX} fill="#fff3dc" />
                  <g className="sm-co-dung">
                    <rect x={-1} y={-20} width={2} height={22} fill="#1f160d" />
                    <rect x={1} y={-20} width={13} height={9} fill={mau(chu)} stroke="#1f160d" strokeWidth={1} />
                    <rect x={5} y={-17.5} width={4} height={4} fill="#f2c14e" />
                  </g>
                </g>
              )}
              {trong && kh?.has(`${q},${r}`) && (
                <g className="sm-kh">
                  <polygon points={HEX_IN} fill="#f2c14e" fillOpacity={0.16} stroke="#f2c14e" strokeWidth={2} strokeDasharray="5 3" />
                  <path d="M-2 -8h4v6h6v4h-6v6h-4v-6h-6v-4h6z" fill="#f2c14e" stroke="#1f160d" strokeWidth={1} />
                </g>
              )}
            </g>
          );
        })}
        {map.di.map((d, i) => {
          const a = px(d.tu[0], d.tu[1]), b = px(d.toi[0], d.toi[1]);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={d.mon === mine ? '#6a8fd9' : '#e5483a'} strokeWidth={3} strokeDasharray="5 3" />;
        })}
      </svg>
    </div>
    <div className="sm-zoom" role="group" aria-label={tr('Phóng to thu nhỏ', 'Zoom')}>
      <button className="sm-btn small" aria-label={tr('Phóng to', 'Zoom in')} onClick={() => zoom(1.25)} disabled={z >= Z_MAX}>
        +
      </button>
      <button className="sm-btn small" aria-label={tr('Thu nhỏ', 'Zoom out')} onClick={() => zoom(1 / 1.25)} disabled={z <= Z_MIN}>
        −
      </button>
    </div>
    </div>
    <div className="sm-pan" role="group" aria-label={tr('Dời bản đồ', 'Pan the map')}>
      {([['left', 80, 0, tr('Sang trái', 'Left')], ['up', 0, 80, tr('Lên trên', 'Up')], ['down', 0, -80, tr('Xuống dưới', 'Down')], ['right', -80, 0, tr('Sang phải', 'Right')]] as const).map(([k, dx, dy, l]) => (
        <button key={k} className="sm-btn small" aria-label={l} onClick={() => pan(dx, dy)}>
          <svg width="16" height="16" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden style={{ transform: `rotate(${{ up: 0, right: 90, down: 180, left: 270 }[k]}deg)` }}>
            <path d="M3 1h2v1h1v1h1v1H5v3H3V4H1V3h1V2h1z" fill="currentColor" />
          </svg>
        </button>
      ))}
    </div>
    </>
  );
}

/** 18/11: ai đang giữ một ô của môn ta và lực giữ (cùng cách máy chủ tính: người đứng ở ô, chưa chọn thì ở chính điện,
 * không đang nghỉ, không đang đi đường; mỗi người tính tới trần; nhân sân nhà và Khí vận hôm nay) */
export function giuO(st: SmState, ds: SmMember[] | null | undefined, q: number, r: number) {
  const m = st.mon;
  if (!m || !ds) return null;
  const cd = m.tiles.find((t) => t.cd);
  const now = Date.now();
  const o = (x: SmMember) => x.dung ?? (cd ? [cd.q, cd.r] : null);
  const tai = ds.filter((x) => {
    const d = o(x);
    return d && d[0] === q && d[1] === r;
  });
  const dangDi = (x: SmMember) => !!x.di_toi && new Date(x.di_toi).getTime() > now;
  const giu = tai.filter((x) => !x.nghi && !dangDi(x));
  const goc = giu.reduce((a, x) => a + capLc(x.lc), 0);
  const he = SM_CFG.tran.sanNha * (1 + (m.kv_bonus ?? 0)) * (m.tiles.length === 1 ? SM_CFG.tran.motO : 1);
  return { giu, toi: tai.filter(dangDi), nghi: tai.filter((x) => x.nghi), goc, luc: Math.round(goc * he), he };
}

/** khoảng cách tới ô gần nhất của môn ta (null nếu chưa có ô) */
export function gan(st: SmState, q: number, r: number) {
  const tiles = st.mon?.tiles ?? [];
  if (!tiles.length) return null;
  return Math.min(...tiles.map((t) => hexDist(t, { q, r })));
}

/** 18/11 khai hoang: các ô trống kề lãnh thổ môn ta mà môn còn chỗ mở rộng (không tính ô đang có môn kéo quân tới) */
export function khaiDuoc(st: SmState, map: SmMap | null): Set<string> {
  const out = new Set<string>();
  const m = st.mon;
  if (!m || !map || !m.tiles.length || m.o >= m.o_max) return out;
  const dangToi = new Set(map.di.map((d) => `${d.toi[0]},${d.toi[1]}`));
  for (const o of map.o) {
    if (o[4] != null || dangToi.has(`${o[0]},${o[1]}`)) continue;
    if (m.tiles.some((t) => hexDist(t, { q: o[0], r: o[1] }) === 1)) out.add(`${o[0]},${o[1]}`);
  }
  return out;
}

/** câu "cần thêm bao nhiêu người để mở thêm ô" khi môn đã đủ ô */
export function duOCau(st: SmState): string {
  const m = st.mon!;
  const can = SM_CFG.mon.toiDa > m.n ? 3 * m.o_max - m.n : 0;
  return can > 0
    ? tr(`Môn đã giữ đủ ${m.o_max} ô: thêm ${can} người vào môn là mở thêm 1 ô. Vẫn xuất chinh giành ô kề của môn khác được, thắng thì bỏ lại ô xa nhất.`, `Your sect holds its limit of ${m.o_max}: ${can} more members open one more tile. You can still march on a neighbouring sect's tile; win and you leave your farthest one.`)
    : tr(`Môn đã giữ đủ ${m.o_max} ô, tối đa của môn 15 người. Muốn đất tốt hơn thì xuất chinh giành ô kề của môn khác, thắng thì bỏ lại ô xa nhất.`, `Your sect holds the maximum ${m.o_max} tiles. For better land, march on a neighbouring sect's tile; win and you leave your farthest one.`);
}

/** 19/11 23h (Ngày 7c): ô môn ta sẽ bỏ nếu đang đủ ô mà thắng một ô có chủ: ô xa chính điện nhất, trừ chính điện và ô định chiếm */
export function oBoKhiThang(st: SmState, q: number, r: number): string | null {
  const m = st.mon;
  if (!m || m.o < m.o_max) return null;
  const cd = m.tiles.find((t) => t.cd);
  const ds = m.tiles.filter((t) => !t.cd && !(t.q === q && t.r === r));
  if (!ds.length) return null;
  ds.sort((a, b) => (cd ? hexDist(b, cd) - hexDist(a, cd) : 0));
  return ds[0].ten;
}

/** 19/11 23h (Ngày 7c): ô của môn khác đang kề lãnh thổ, hết bảo hộ: đánh được ngay cả khi môn đủ ô */
export function oDanhDuoc(st: SmState, map: SmMap | null, now: number): SmMapO[] {
  const m = st.mon;
  if (!m || !map || !m.tiles.length) return [];
  const dangToi = new Set(map.di.map((d) => `${d.toi[0]},${d.toi[1]}`));
  return map.o.filter(
    (o) =>
      o[4] != null && o[4] !== m.id && !dangToi.has(`${o[0]},${o[1]}`) &&
      !(o[6] && new Date(o[6]).getTime() > now) &&
      m.tiles.some((t) => hexDist(t, { q: o[0], r: o[1] }) === 1),
  );
}

/** lý do nút Xuất chinh bị khóa (null = bấm được) */
export function chinhKhoa(st: SmState, o: SmMapO, now: number, map?: SmMap | null, dai?: SmDai | null): string | null {
  const m = st.mon!;
  const yeu = laYeu(map, o[4]);
  if (m.chuc === 'de') return tr('Chỉ môn chủ hoặc trưởng lão phát lệnh xuất chinh.', 'Only the master or elders can order a march.');
  if (!m.tiles.length) return tr('Môn chưa cắm cờ ô nào.', 'Your sect has no tile yet.');
  // 19/11 23h (Ngày 7c): đủ ô chỉ chặn ô trống (và ô yêu thú); ô có chủ của môn khác vẫn đánh được (thắng thì bỏ ô xa nhất)
  if (m.o >= m.o_max && (o[4] == null || yeu)) return duOCau(st);
  if (gan(st, o[0], o[1]) !== 1) return tr('Chỉ xuất chinh tới ô kề lãnh thổ.', 'You can only march to a tile next to your land.');
  if (!yeu && o[6] && o[4] != null && new Date(o[6]).getTime() > now) return tr(`Ô đang được bảo hộ tới ${mocGio(o[6], now)}.`, `Protected until ${mocGio(o[6], now)}.`);
  // 20/11 Kỷ 2: thù 12 giờ và dải sức mạnh (Linh Mạch, Thiên Trì không xét dải)
  if (o[4] != null && !yeu && map?.dat?.length) {
    const thu = dai?.thu?.[String(o[4])];
    if (thu && new Date(thu).getTime() > now) return tr(`Môn ta vừa thắng môn này, tới ${mocGio(thu, now)} mới đánh tiếp họ được.`, `We just beat this sect; attack them again after ${mocGio(thu, now)}.`);
    if (dai?.ngoai?.includes(o[4]) && !datOf(map, o[0], o[1])) return tr('Môn này yếu hơn 1/3 môn ta, đánh không được, trừ ở Linh Mạch và Thiên Trì.', 'This sect is under a third of our strength; only Spirit Veins and the Heaven Pool can be attacked.');
  }
  if ((st.chinh ?? []).length) return tr('Môn đang có một lệnh xuất chinh.', 'Your sect already has a march under way.');
  if (st.nghi_toi && new Date(st.nghi_toi).getTime() > now) return tr(`Ngươi đang nghỉ sau trận thua tới ${hhmm(st.nghi_toi)}.`, `You rest after a defeat until ${hhmm(st.nghi_toi)}.`);
  return null;
}

export function SmBanDo({ c }: { c: SmCtx }) {
  if (!c.st.mon) return <SmBanDoXem c={c} />;
  return <SmBanDoMon c={c} />;
}

/** 18/11: người chưa vào môn xem bản đồ (chỉ xem: tên ô, cõi, môn nào giữ). Không trinh sát, không xuất chinh. */
function SmBanDoXem({ c }: { c: SmCtx }) {
  const { map } = c;
  const [sel, setSel] = useState<SmMapO | null>(null);
  // 18/11: chạm ô có chủ: xem môn đó, chưa có môn thì vào hoặc xin vào luôn
  const [xem, setXem] = useState<number | null>(null);
  const [rc, setRc] = useState(0);
  const now = useNow();
  const back = (
    <button className="sm-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => c.go('list')}>
      ‹ {tr('Danh sách môn', 'Sect list')}
    </button>
  );
  if (!map)
    return (
      <>
        {back}
        <p className="sm-note">{tr('Đang mở bản đồ...', 'Opening the map...')}</p>
      </>
    );
  const giu = new Map<number, number>();
  for (const o of map.o) if (o[4] != null) giu.set(o[4], (giu.get(o[4]) ?? 0) + 1);
  const chu = sel?.[4] ?? null;
  return (
    <>
      {back}
      <div className="sm-between">
        <span className="sm-note">{tr(`Kéo để xem cả ${map.o.length} ô · ${giu.size} môn đã cắm cờ`, `Drag to see all ${map.o.length} tiles · ${giu.size} sects flagged`)}</span>
        <button className="sm-btn small" onClick={() => setRc(rc + 1)}>
          {tr('Về giữa', 'Center')}
        </button>
      </div>
      <HexMap map={map} mine={null} sel={sel ? [sel[0], sel[1]] : null} onPick={setSel} center={[0, 0]} recenter={rc} />
      <div className="sm-legend">
        <span>
          <i className="sm-sw" style={{ borderColor: '#e06a5c', background: '#e5b699' }} />
          {tr('ô có môn giữ (theo huy hiệu)', 'held by a sect (by crest)')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#2c2545', background: '#221b32' }} />
          {tr('ô trống', 'empty')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#2f8a5a', borderStyle: 'dashed', background: '#2f6b4a' }} />
          {tr('đang bảo hộ (số giờ còn lại)', 'protected (hours left)')}
        </span>
        <DatChuGiai map={map} />
      </div>
      {/* 19/11 (Tyler: chạm ô không thấy gì vì thẻ nằm dưới bản đồ cao): thông tin ô và môn hiện ở bottom sheet */}
      {sel && xem == null ? (
        <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={sel[2]} onClick={() => setSel(null)}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className="sm-row">
            {chu != null ? <HuyHieu id={map.mon[String(chu)]?.huy_hieu ?? 0} size={40} /> : <span style={{ width: 40 }} />}
            <div className="sm-grow">
              <h3 className="sm-clip">
                {sel[2]} · {chu == null ? tr('Còn trống', 'Empty') : (map.mon[String(chu)]?.ten ?? '?')}
              </h3>
              <p className="sm-note">
                {tr(`Cõi ${COI[sel[3]].name}`, `${COI[sel[3]].name} realm`)}
                {chu != null ? tr(` · môn này giữ ${giu.get(chu) ?? 0} ô`, ` · this sect holds ${giu.get(chu) ?? 0} tiles`) : ''}
              </p>
            </div>
          </div>
          {chu != null && sel[6] && new Date(sel[6]).getTime() > now && (
            <p className="sm-bh-o">
              <b>{tr('Đang được bảo hộ', 'Protected')}</b> · {bhConDu(sel[6], now)}
              <br />
              {tr(`Tới ${mocGio(sel[6], now)}, chưa môn nào đánh được ô này.`, `Until ${mocGio(sel[6], now)}; no sect can attack it.`)}
            </p>
          )}
          {chu != null && (
            <div className="sm-giu la">
              <div className="sm-between">
                <b>{tr('Lực giữ ô', 'Tile defence')}</b>
                <b className="sm-giu-n">???</b>
              </div>
              <p className="sm-note">{tr('Phải trinh sát mới biết. Vào một môn để trinh sát.', 'Scout to find out. Join a sect to scout.')}</p>
            </div>
          )}
          {chu != null && (() => {
            const row = (c.list ?? []).find((x) => x.id === chu);
            return row ? (
              <p className="sm-note">
                {tr(`${row.n}/${SM_CFG.mon.toiDa} người · ${row.mo_cua ? 'mở cửa, vào ngay được' : 'phải gửi đơn, chờ duyệt'}`, `${row.n}/${SM_CFG.mon.toiDa} members · ${row.mo_cua ? 'open, join at once' : 'apply and wait'}`)}
              </p>
            ) : null;
          })()}
          {chu != null && (
            <button className="sm-btn main wide" onClick={() => (setXem(chu), track('sm_xem_mon', { tu: 'ban_do' }))}>
              {tr(`Xem người trong ${map.mon[String(chu)]?.ten ?? 'môn này'}`, `See members of ${map.mon[String(chu)]?.ten ?? 'this sect'}`)}
            </button>
          )}
          <button className="sm-btn sm-ghost wide" onClick={() => setSel(null)}>
            {tr('Đóng', 'Close')}
          </button>
        </div>
        </div>
      ) : (
        <p className="sm-card">{tr('Chạm một ô để xem tên ô và môn nào đang giữ.', 'Tap a tile to see its name and which sect holds it.')}</p>
      )}
      <p className="sm-note">{tr('Vào một môn để đứng giữ ô, trinh sát và xuất chinh.', 'Join a sect to guard tiles, scout and march.')}</p>
      {xem != null && (
        <XemMon c={c} id={xem} ten={map.mon[String(xem)]?.ten ?? '?'} huy={map.mon[String(xem)]?.huy_hieu ?? 0} row={(c.list ?? []).find((x) => x.id === xem) ?? null} onDong={() => (setXem(null), setSel(null))} />
      )}
    </>
  );
}

function SmBanDoMon({ c }: { c: SmCtx }) {
  const { st, map } = c;
  const m = st.mon!;
  const cd = m.tiles.find((t) => t.cd) ?? m.tiles[0];
  const home: [number, number] = cd ? [cd.q, cd.r] : [0, 0];
  const [sel, setSel] = useState<SmMapO | null>(null);
  const [rc, setRc] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const now = useNow();
  // 19/11 23h: mở bản đồ từ thẻ "Ô kề có thể đánh" thì chọn sẵn ô đó
  useEffect(() => {
    if (!c.target || !map) return;
    const o = map.o.find((x) => x[0] === c.target![0] && x[1] === c.target![1]);
    if (o) setSel(o);
  }, [c.target, map]);
  if (!map) return <p className="sm-note">{tr('Đang mở bản đồ...', 'Opening the map...')}</p>;
  const nTile = map.o.length;
  const danh = m.o >= m.o_max ? oDanhDuoc(st, map, now) : [];
  const kh = khaiDuoc(st, map);
  // ô đang chọn lấy bản mới nhất từ bản đồ (vừa khai hoang xong thì ô đổi chủ)
  const cur = sel ? map.o.find((x) => x[0] === sel[0] && x[1] === sel[1]) ?? sel : null;
  return (
    <>
      <div className="sm-between">
        <span className="sm-note">{tr(`Kéo để xem cả ${nTile} ô · 3 cõi`, `Drag to see all ${nTile} tiles · 3 realms`)}</span>
        <button className="sm-btn small dark" onClick={() => setRc(rc + 1)}>
          {tr('Về lãnh thổ', 'My land')}
        </button>
      </div>
      {m.tiles.length > 0 && (
        <p className={m.o < m.o_max && kh.size ? 'sm-card sm-kh-tip' : 'sm-note'}>
          {m.o < m.o_max
            ? kh.size
              ? tr(`Môn giữ ${m.o}/${m.o_max} ô. Ô có dấu + là đất trống kề lãnh thổ: chạm vào rồi bấm Khai hoang, cắm cờ ngay, không phải đánh ai.`, `We hold ${m.o}/${m.o_max} tiles. Tiles marked + are empty land next to ours: tap one and Claim it at once, no fighting.`)
              : tr(`Môn giữ ${m.o}/${m.o_max} ô. Quanh lãnh thổ hết đất trống, muốn thêm ô thì phải giành của môn khác.`, `We hold ${m.o}/${m.o_max} tiles. No empty land next to ours; take tiles from other sects to grow.`)
            : duOCau(st)}
        </p>
      )}
      {danh.length > 0 && (
        <div className="sm-card sm-danh-tip">
          <b>{tr('Ô kề có thể đánh', 'Tiles we can attack')}</b>
          <div className="sm-chips">
            {danh.slice(0, 4).map((o) => (
              <button key={`${o[0]},${o[1]}`} className="sm-btn small" onClick={() => (setSel(o), setErr(null), setOk(null), track('sm_danh_tip', { tu: 'ban_do' }))}>
                {o[2]} · {map.mon[String(o[4])]?.ten ?? '?'}
              </button>
            ))}
          </div>
        </div>
      )}
      <HexMap map={map} mine={m.id} sel={sel ? [sel[0], sel[1]] : null} onPick={(o) => {
          setSel(o);
          setErr(null);
          setOk(null);
          // bản đồ cao, thẻ ô nằm dưới: cuộn nhẹ cho thẻ hiện ra
          setTimeout(() => document.querySelector('.sm-o-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
        }} center={home} recenter={rc} kh={kh} />
      <div className="sm-legend">
        <span>
          <i className="sm-sw" style={{ borderColor: '#f2c14e', background: '#efdcb0', boxShadow: 'inset 0 0 0 2px #fff6e0, inset 0 0 0 4px #f2c14e' }} />
          {tr('môn ta', 'ours')}
        </span>
        {kh.size > 0 && (
          <span>
            <i className="sm-sw" style={{ borderColor: '#f2c14e', borderStyle: 'dashed', background: '#3a3150', color: '#f2c14e', textAlign: 'center', lineHeight: '12px', fontWeight: 700 }}>+</i>
            {tr('khai hoang được', 'claimable')}
          </span>
        )}
        <span>
          <i className="sm-sw" style={{ borderColor: '#e06a5c', background: '#e5b699' }} />
          {tr('môn khác (theo huy hiệu)', 'other sects (by crest)')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#2c2545', background: '#221b32' }} />
          {tr('ô trống', 'empty')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#2f8a5a', borderStyle: 'dashed', background: '#2f6b4a' }} />
          {tr('đang bảo hộ (số giờ còn lại)', 'protected (hours left)')}
        </span>
        <DatChuGiai map={map} />
      </div>
      <Msg err={err} ok={ok} />
      {cur ? <OInfo key={`${cur[0]},${cur[1]},${cur[4]}`} c={c} o={cur} now={now} setErr={setErr} setOk={setOk} /> : <p className="sm-card">{tr('Chạm một ô để xem tên, chủ ô. Ô có dấu + thì khai hoang được ngay.', 'Tap a tile to see its name and owner. Tiles marked + can be claimed now.')}</p>}
      <DongMinh />
    </>
  );
}

function OInfo({ c, o, now, setErr, setOk }: { c: SmCtx; o: SmMapO; now: number; setErr: (s: string | null) => void; setOk: (s: string | null) => void }) {
  const { st, map } = c;
  const m = st.mon!;
  const [q, r, ten, coi, chu, , bh] = o;
  const ta = chu === m.id;
  const d = gan(st, q, r);
  const yeu = laYeu(map, chu);
  const dat = datOf(map, q, r);
  const chuTen = chu == null ? tr('Còn trống', 'Empty') : ta ? m.ten : yeu ? tr('Yêu thú', 'Demon beast') : map?.mon[String(chu)]?.ten ?? '?';
  const [xemMon, setXemMon] = useState(false);
  const trinh = (st.trinh ?? []).find((t) => t.o[0] === q && t.o[1] === r);
  const dangTrinh = trinh && !trinh.ket_qua;
  const phut = SM_CFG.gio.trinhPhut * Math.max(1, d ?? 1);
  const khoa = ta ? null : chinhKhoa(st, o, now, map, c.dai);
  const dangDung = m.dung ? m.dung[0] === q && m.dung[1] === r : !!m.tiles.find((t) => t.cd && t.q === q && t.r === r);
  // 18/11: sang ô khác mất 20 phút mỗi ô, tính từ ô đang đứng (chưa chọn: chính điện)
  const cdT = m.tiles.find((t) => t.cd) ?? m.tiles[0];
  const tu = m.dung ?? (cdT ? [cdT.q, cdT.r] : null);
  const diPhut = tu ? SM_CFG.gio.diPhut * Math.max(1, hexDist({ q: tu[0], r: tu[1] }, { q, r })) : SM_CFG.gio.diPhut;
  const dangDi = dangDung && m.di_toi && new Date(m.di_toi).getTime() > now;
  const coDi = smCo(st).di;
  return (
    <section className="sm-card sm-o-card">
      <div className="sm-row">
        {yeu ? <img src={yeuIcon(q, r)} width={40} height={40} alt="" /> : chu != null ? <HuyHieu id={map?.mon[String(chu)]?.huy_hieu ?? 0} size={40} /> : <span style={{ width: 40 }} />}
        <div className="sm-grow">
          <h3 className="sm-clip">
            {dat?.[3] ?? ten} · {chuTen}
          </h3>
          <p className="sm-note">
            {tr(`Cõi ${COI[coi].name}`, `${COI[coi].name} realm`)}
            {' · '}
            {ta ? tr('ô của môn ta', 'our tile') : d === 1 ? (chu == null ? tr('kề lãnh thổ ta · khai hoang được', 'next to our land · claimable') : tr('kề lãnh thổ ta · đi 20 phút', 'next to our land · 20 min march')) : d != null ? tr(`không kề · cách ${d} ô`, `not adjacent · ${d} tiles away`) : ''}
          </p>
        </div>
      </div>
      <DatInfo map={map} dat={dat} />
      {bh && chu != null && !yeu && new Date(bh).getTime() > now && (
        <p className="sm-bh-o">
          <b>{tr('Đang được bảo hộ', 'Protected')}</b> · {bhConDu(bh, now)}
          <br />
          {tr(`Tới ${mocGio(bh, now)}, chưa môn nào đánh được ô này.`, `Until ${mocGio(bh, now)}; no sect can attack this tile.`)}
        </p>
      )}
      {!ta && chu != null && !yeu && (
        <button className="sm-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => (setXemMon(true), track('sm_xem_mon', { tu: 'ban_do_mon' }))}>
          {tr(`Xem người ${chuTen}`, `View ${chuTen}`)}
        </button>
      )}
      {xemMon && chu != null && <XemMon c={c} id={chu} ten={chuTen} huy={map?.mon[String(chu)]?.huy_hieu ?? 0} onDong={() => setXemMon(false)} />}
      {yeu && (
        <div className="sm-giu la">
          <div className="sm-between">
            <b>{tr('Lực giữ của yêu thú', 'Beast defence')}</b>
            <b className="sm-giu-n">{fmtN(dat?.[4] ?? 0)}</b>
          </div>
          <p className="sm-note">
            {tr('Lực giữ cố định, không cần trinh sát. Thắng thì ô về tay môn, mỗi người đi theo +10 phúc duyên. Sáng mai 5:00 ô yêu thú chưa ai đánh sẽ về trống, yêu thú mới hiện ở chỗ khác.', 'Fixed defence, no scouting needed. Win and the tile is ours, each marcher gets +10 blessing. At 5:00 tomorrow unbeaten beasts leave and new ones appear elsewhere.')}
          </p>
        </div>
      )}
      {!ta && chu != null && !yeu && (
        <div className="sm-giu la">
          <div className="sm-between">
            <b>{tr('Lực giữ ô', 'Tile defence')}</b>
            <b className="sm-giu-n">{trinh?.ket_qua && !trinh.ket_qua.trong ? fmtN(trinh.ket_qua.lc ?? 0) : '???'}</b>
          </div>
          <p className="sm-note">
            {dangTrinh
              ? tr(`Đang trinh sát, có tin lúc ${hhmm(trinh!.xong_luc)}.`, `Scouting, back at ${hhmm(trinh!.xong_luc)}.`)
              : trinh?.ket_qua
                ? trinh.ket_qua.trong
                  ? tr(`Trinh sát ${truoc(trinh.xong_luc, now)}: ô trống.`, `Scouted ${truoc(trinh.xong_luc, now)}: empty.`)
                  : tr(`Trinh sát ${truoc(trinh.xong_luc, now)}: ${trinh.ket_qua.n} người đứng giữ (chưa tính sân nhà). Người giữ có thể đã đổi, trinh sát lại trước khi đánh.`, `Scouted ${truoc(trinh.xong_luc, now)}: ${trinh.ket_qua.n} guards (before home bonus).`)
                : tr('Phải trinh sát mới biết ô này có bao nhiêu người giữ, Lực chiến bao nhiêu.', 'Scout to learn how many guard this tile and their power.')}
          </p>
        </div>
      )}
      {!ta && chu == null && (
        <p style={{ fontSize: 15 }}>{tr('Đất trống, chưa môn nào giữ.', 'Empty land, held by no sect.')}</p>
      )}
      {ta && <GiuO c={c} q={q} r={r} />}
      {ta ? (
        dangDung ? (
          dangDi ? (
            <p className="sm-ok">{tr(`Ngươi đang đi tới ô này, tới lúc ${hhmm(m.di_toi!)}. Trong lúc đi chưa giữ ô nào.`, `On your way here, arriving ${hhmm(m.di_toi!)}. You guard nothing on the way.`)}</p>
          ) : (
            <p className="sm-ok">{tr('Ngươi đang đứng giữ ô này.', 'You are guarding this tile.')}</p>
          )
        ) : (
          <button
            className="sm-btn main wide"
            disabled={c.busy}
            onClick={async () => {
              const e = await c.run({ fn: 'guard', q, r }, () => track('sm_guard', { from: 'ban_do', phut: coDi ? diPhut : 0 }));
              setErr(e);
              if (!e)
                setOk(
                  coDi
                    ? tr(`Ngươi lên đường sang giữ ${ten}, ${diPhut} phút nữa tới. Trong lúc đi chưa giữ ô nào.`, `Heading to ${ten}, arriving in ${diPhut} min. You guard nothing on the way.`)
                    : tr(`Ngươi sang đứng giữ ${ten}.`, `You now guard ${ten}.`),
                );
            }}
          >
            {coDi ? tr(`Sang giữ ${ten} · đi ${diPhut} phút`, `Guard ${ten} · ${diPhut} min walk`) : tr(`Đứng giữ ${ten}`, `Guard ${ten}`)}
          </button>
        )
      ) : chu == null ? (
        <KhaiHoang c={c} o={o} d={d} now={now} setErr={setErr} setOk={setOk} />
      ) : (
        <>
          <div className={yeu ? 'sm-grid1' : 'sm-grid2'}>
            {!yeu && <button
              className="sm-btn"
              disabled={c.busy || !!dangTrinh || d == null}
              onClick={async () => {
                const e = await c.run({ fn: 'scout', q, r }, () => track('sm_scout', { d }));
                setErr(e);
                if (!e) setOk(tr(`Đã cử người trinh sát, ${phut} phút nữa có tin.`, `Scout sent, news in ${phut} min.`));
              }}
            >
              {tr(`Trinh sát · ${phut} phút`, `Scout · ${phut} min`)}
            </button>}
            <button className="sm-btn main" disabled={!!khoa} onClick={() => c.go('xuat-chinh', { target: [q, r] })}>
              {tr('Xuất chinh', 'March')}
            </button>
          </div>
          {khoa && <p className="sm-why">{khoa}</p>}
          {!khoa && !yeu && oBoKhiThang(c.st, q, r) && (
            <p className="sm-note">{tr(`Môn đang giữ đủ ${m.o_max} ô: thắng thì ô này về tay ta, môn bỏ lại ${oBoKhiThang(c.st, q, r)} (ô xa chính điện nhất).`, `We hold our ${m.o_max}-tile limit: win and this tile is ours, we leave ${oBoKhiThang(c.st, q, r)} (farthest from the main hall).`)}</p>
          )}
          {!khoa && chu != null && !yeu && m.moi_bh_toi && new Date(m.moi_bh_toi).getTime() > now && (
            <p className="sm-why">{tr('Môn ta đang được bảo hộ môn mới. Xuất chinh vào ô có chủ thì mất bảo hộ ngay.', 'Our sect is under new-sect protection. Marching on an owned tile ends it at once.')}</p>
          )}
        </>
      )}
    </section>
  );
}

/** 18/11 (Tyler: người chơi không biết mở rộng ô, tưởng phải đánh nhau): ô trống kề lãnh thổ thì khai hoang, cắm cờ ngay.
 * Ai trong môn cũng làm được, theo trần số ô của môn. */
function KhaiHoang({ c, o, d, now, setErr, setOk }: { c: SmCtx; o: SmMapO; d: number | null; now: number; setErr: (s: string | null) => void; setOk: (s: string | null) => void }) {
  const { st, map } = c;
  const m = st.mon!;
  const [q, r, ten] = o;
  const dangToi = !!map?.di.some((x) => x.toi[0] === q && x.toi[1] === r);
  const khoa = !m.tiles.length
    ? tr('Môn chưa cắm cờ ô nào.', 'Your sect has no tile yet.')
    : m.o >= m.o_max
      ? duOCau(st)
      : d !== 1
        ? tr(`Ô này cách lãnh thổ ${d ?? '?'} ô. Chỉ khai hoang được ô kề đất ta (ô có dấu +), mở dần ra.`, `This tile is ${d ?? '?'} away. Only tiles next to our land (marked +) can be claimed.`)
        : dangToi
          ? tr('Có môn đang kéo quân tới ô này.', 'A sect is marching on this tile.')
          : st.nghi_toi && new Date(st.nghi_toi).getTime() > now
            ? tr(`Ngươi đang nghỉ sau trận thua tới ${hhmm(st.nghi_toi)}.`, `You rest until ${hhmm(st.nghi_toi)}.`)
            : null;
  return (
    <>
      <button
        className="sm-btn main wide"
        disabled={c.busy || !!khoa}
        onClick={async () => {
          let kq: Record<string, unknown> | null = null;
          const e = await c.run({ fn: 'khai_hoang', q, r }, (x) => {
            kq = x ?? null;
            track('sm_khai_hoang', { o: m.o + 1, chuc: m.chuc });
          });
          setErr(e);
          if (!e) {
            const bh = (kq as { bao_ho_toi?: string | null } | null)?.bao_ho_toi;
            const dan = khDan(o[3]);
            coMoi = { k: `${q},${r}`, t: Date.now() };
            try {
              localStorage.setItem('vkl.sm.kh1', '1');
            } catch {}
            setOk(
              dan + ' ' + (bh
                ? tr(`Đã cắm cờ ${ten}! Đất này được bảo hộ tới ${mocGio(bh, Date.now())}. Nhớ cử người sang đứng giữ.`, `Flag planted on ${ten}! Protected until ${mocGio(bh, Date.now())}. Send someone to guard it.`)
                : tr(`Đã cắm cờ ${ten}! Ô này chưa có ai giữ, nhớ cử người sang đứng giữ.`, `Flag planted on ${ten}! Nobody guards it yet, send someone over.`)),
            );
            c.reload(['state', 'map']);
          }
        }}
      >
        {tr(`KHAI HOANG ${ten.toUpperCase()}`, `CLAIM ${ten.toUpperCase()}`)}
      </button>
      {khoa ? (
        <p className="sm-why">{khoa}</p>
      ) : (
        <p className="sm-note">{tr('Cắm cờ ngay, không phải đánh ai. Ai trong môn cũng khai hoang được.', 'Plant the flag right away, no fighting. Any member can claim.')}</p>
      )}
    </>
  );
}

/** 18/11: ô của môn ta: lực giữ và ai đang giữ, ai đang đi tới, ai đang nghỉ */
function GiuO({ c, q, r }: { c: SmCtx; q: number; r: number }) {
  const g = giuO(c.st, c.members?.ds, q, r);
  if (!g) return <p className="sm-note">{tr('Đang xem ai giữ ô...', 'Loading guards...')}</p>;
  const ten = (ds: SmMember[]) => ds.map((x) => x.ten).join(', ');
  return (
    <div className="sm-giu">
      <div className="sm-between">
        <b>{tr('Lực giữ ô', 'Tile defence')}</b>
        <b className="sm-giu-n">{fmtN(g.luc)}</b>
      </div>
      <p className="sm-note">
        {tr(`${g.giu.length} người đang giữ, Lực chiến ${fmtN(Math.round(g.goc))}, nhân sân nhà${c.st.mon?.kv_bonus ? ` và Khí vận +${Math.round((c.st.mon.kv_bonus) * 100)}%` : ''}${(c.st.mon?.tiles.length ?? 0) === 1 ? ', thêm 15% vì là ô cuối' : ''}. Đánh ban đêm (0-7h) bên giữ còn gấp đôi.`, `${g.giu.length} guarding, power ${fmtN(Math.round(g.goc))}, with home bonus. Doubled at night (0-7h).`)}
      </p>
      {g.giu.length > 0 ? (
        <ul className="sm-giu-ds">
          {[...g.giu].sort((a, b) => b.lc - a.lc).map((x) => (
            <li key={x.tk}>
              <span>{x.ten}</span>
              <span>{fmtN(x.lc)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sm-why">{tr('Chưa ai giữ ô này. Bị đánh là mất ngay.', 'Nobody guards this tile. It falls to any attack.')}</p>
      )}
      {g.toi.length > 0 && <p className="sm-note">{tr(`Đang đi tới: ${ten(g.toi)}`, `On the way: ${ten(g.toi)}`)}</p>}
      {g.nghi.length > 0 && <p className="sm-note">{tr(`Đang nghỉ (không tính): ${ten(g.nghi)}`, `Resting (not counted): ${ten(g.nghi)}`)}</p>}
    </div>
  );
}
