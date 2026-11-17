'use client';

/** 4.6.0 Sơn Môn M5: bản đồ lục giác (kéo để xem, chạm ô) - dùng chung cho M3 chọn ô cắm cờ. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmMap, SmMapO, SmState } from '@/lib/sonmon/api';
import { COI, HUY_MAU, hexDist, SM_CFG } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { DongMinh, fmtN, hhmm, Msg, truoc, useNow, type SmCtx } from './ui';

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

export function HexMap({
  map,
  mine,
  sel,
  onPick,
  pickEmpty = false,
  center,
  recenter,
}: {
  map: SmMap;
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
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean; id: number } | null>(null);
  const idx = useMemo(() => new Map(map.o.map((o) => [`${o[0]},${o[1]}`, o])), [map]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const c = px(center[0], center[1]);
    setOff({ x: el.clientWidth / 2 - c.x, y: el.clientHeight / 2 - c.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], recenter]);
  const pan = (dx: number, dy: number) => setOff((o) => ({ x: o.x + dx, y: o.y + dy }));

  const mau = (id: number | null) => (id == null ? VIEN_TRONG : HUY_MAU[Math.floor((map.mon[String(id)]?.huy_hieu ?? 0) / 5) % 6].hex);
  // viền ô có chủ: màu huy hiệu làm sáng lên (Đen huyền thì dùng xám bạc để không chìm vào nền)
  const vien = (id: number) => {
    const m = mau(id);
    return m === '#2b2b33' ? '#b9b4c8' : tron(m, '#ffffff', 0.25);
  };

  return (
    <>
    <div
      ref={box}
      className="sm-map"
      role="application"
      tabIndex={0}
      onKeyDown={(e) => {
        const d: Record<string, [number, number]> = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] };
        if (d[e.key]) {
          e.preventDefault();
          pan(...d[e.key]);
        } else if ((e.key === 'Enter' || e.key === ' ') && box.current) {
          // Ngày 7: chọn ô bằng bàn phím = ô nằm giữa khung bản đồ
          e.preventDefault();
          const h = fromPx(box.current.clientWidth / 2 - off.x, box.current.clientHeight / 2 - off.y);
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
        const h = fromPx(e.clientX - rect.left - off.x, e.clientY - rect.top - off.y);
        const o = idx.get(`${h.q},${h.r}`);
        if (o && (!pickEmpty || o[4] == null)) onPick(o);
      }}
      onPointerCancel={() => (drag.current = null)}
    >
      <svg width={1200} height={1200} style={{ transform: `translate(${off.x}px, ${off.y}px)`, overflow: 'visible' }} aria-hidden>
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
              {bh && <polygon points={HEX_IN} fill="none" stroke={trong ? '#fff3dc' : '#3a2a14'} strokeWidth={1.2} strokeDasharray="2 2" />}
              {!trong && <HuyHieu id={map.mon[String(chu)]?.huy_hieu ?? 0} size={30} x={-15} y={-14} label="" />}
              {cd && !trong && <rect x={-4} y={-S + 2} width={8} height={5} fill="#e8c35a" stroke="#1f160d" strokeWidth={1} />}
            </g>
          );
        })}
        {map.di.map((d, i) => {
          const a = px(d.tu[0], d.tu[1]), b = px(d.toi[0], d.toi[1]);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={d.mon === mine ? '#6a8fd9' : '#e5483a'} strokeWidth={3} strokeDasharray="5 3" />;
        })}
      </svg>
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

/** khoảng cách tới ô gần nhất của môn ta (null nếu chưa có ô) */
export function gan(st: SmState, q: number, r: number) {
  const tiles = st.mon?.tiles ?? [];
  if (!tiles.length) return null;
  return Math.min(...tiles.map((t) => hexDist(t, { q, r })));
}

/** lý do nút Xuất chinh bị khóa (null = bấm được) */
export function chinhKhoa(st: SmState, o: SmMapO, now: number): string | null {
  const m = st.mon!;
  if (m.chuc === 'de') return tr('Chỉ môn chủ hoặc trưởng lão phát lệnh xuất chinh.', 'Only the master or elders can order a march.');
  if (!m.tiles.length) return tr('Môn chưa cắm cờ ô nào.', 'Your sect has no tile yet.');
  if (m.o >= m.o_max) {
    const can = SM_CFG.mon.toiDa > m.n ? 3 * m.o_max - m.n : 0;
    return can > 0
      ? tr(`Môn đã giữ đủ ${m.o_max} ô. Cần thêm ${can} người mới đánh được ô mới.`, `Your sect holds its limit of ${m.o_max}. Recruit ${can} more to take new land.`)
      : tr(`Môn đã giữ đủ ${m.o_max} ô, tối đa của môn 15 người.`, `Your sect holds the maximum ${m.o_max} tiles.`);
  }
  if (gan(st, o[0], o[1]) !== 1) return tr('Chỉ xuất chinh tới ô kề lãnh thổ.', 'You can only march to a tile next to your land.');
  if (o[6] && o[4] != null && new Date(o[6]).getTime() > now) return tr(`Ô đang được bảo hộ tới ${hhmm(o[6])}.`, `Protected until ${hhmm(o[6])}.`);
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
      </div>
      {sel ? (
        <section className="sm-card">
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
          {sel[6] && new Date(sel[6]).getTime() > now && <p className="sm-note">{tr(`Bảo hộ tới ${hhmm(sel[6])}.`, `Protected until ${hhmm(sel[6])}.`)}</p>}
        </section>
      ) : (
        <p className="sm-card">{tr('Chạm một ô để xem tên ô và môn nào đang giữ.', 'Tap a tile to see its name and which sect holds it.')}</p>
      )}
      <p className="sm-note">{tr('Vào một môn để đứng giữ ô, trinh sát và xuất chinh.', 'Join a sect to guard tiles, scout and march.')}</p>
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
  if (!map) return <p className="sm-note">{tr('Đang mở bản đồ...', 'Opening the map...')}</p>;
  const nTile = map.o.length;
  return (
    <>
      <div className="sm-between">
        <span className="sm-note">{tr(`Kéo để xem cả ${nTile} ô · 3 cõi`, `Drag to see all ${nTile} tiles · 3 realms`)}</span>
        <button className="sm-btn small dark" onClick={() => setRc(rc + 1)}>
          {tr('Về lãnh thổ', 'My land')}
        </button>
      </div>
      <HexMap map={map} mine={m.id} sel={sel ? [sel[0], sel[1]] : null} onPick={(o) => (setSel(o), setErr(null), setOk(null))} center={home} recenter={rc} />
      <div className="sm-legend">
        <span>
          <i className="sm-sw" style={{ borderColor: '#f2c14e', background: '#efdcb0', boxShadow: 'inset 0 0 0 2px #fff6e0, inset 0 0 0 4px #f2c14e' }} />
          {tr('môn ta', 'ours')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#e06a5c', background: '#e5b699' }} />
          {tr('môn khác (theo huy hiệu)', 'other sects (by crest)')}
        </span>
        <span>
          <i className="sm-sw" style={{ borderColor: '#2c2545', background: '#221b32' }} />
          {tr('ô trống', 'empty')}
        </span>
      </div>
      <Msg err={err} ok={ok} />
      {sel ? <OInfo c={c} o={sel} now={now} setErr={setErr} setOk={setOk} /> : <p className="sm-card">{tr('Chạm một ô để xem tên, chủ ô và trinh sát.', 'Tap a tile to see its name, owner and scouting.')}</p>}
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
  const chuTen = chu == null ? tr('Còn trống', 'Empty') : ta ? m.ten : map?.mon[String(chu)]?.ten ?? '?';
  const trinh = (st.trinh ?? []).find((t) => t.o[0] === q && t.o[1] === r);
  const dangTrinh = trinh && !trinh.ket_qua;
  const phut = SM_CFG.gio.trinhPhut * Math.max(1, d ?? 1);
  const khoa = ta ? null : chinhKhoa(st, o, now);
  const dangDung = m.dung ? m.dung[0] === q && m.dung[1] === r : !!m.tiles.find((t) => t.cd && t.q === q && t.r === r);
  return (
    <section className="sm-card">
      <div className="sm-row">
        {chu != null ? <HuyHieu id={map?.mon[String(chu)]?.huy_hieu ?? 0} size={40} /> : <span style={{ width: 40 }} />}
        <div className="sm-grow">
          <h3 className="sm-clip">
            {ten} · {chuTen}
          </h3>
          <p className="sm-note">
            {tr(`Cõi ${COI[coi].name}`, `${COI[coi].name} realm`)}
            {' · '}
            {ta ? tr('ô của môn ta', 'our tile') : d === 1 ? tr('kề lãnh thổ ta · đi 20 phút', 'next to our land · 20 min march') : d != null ? tr(`không kề · cách ${d} ô`, `not adjacent · ${d} tiles away`) : ''}
          </p>
        </div>
      </div>
      {bh && new Date(bh).getTime() > now && <p className="sm-note">{tr(`Bảo hộ tới ${hhmm(bh)}, chưa ai đánh được.`, `Protected until ${hhmm(bh)}.`)}</p>}
      {!ta && (
        <p style={{ fontSize: 15 }}>
          {dangTrinh
            ? tr(`Đang trinh sát, xong lúc ${hhmm(trinh!.xong_luc)}.`, `Scouting, back at ${hhmm(trinh!.xong_luc)}.`)
            : trinh?.ket_qua
              ? trinh.ket_qua.trong
                ? tr(`Trinh sát ${truoc(trinh.xong_luc, now)}: ô trống.`, `Scouted ${truoc(trinh.xong_luc, now)}: empty.`)
                : tr(
                    `Trinh sát ${truoc(trinh.xong_luc, now)}: ${trinh.ket_qua.n} người đứng giữ, Lực chiến khoảng ${fmtN(trinh.ket_qua.lc ?? 0)}.`,
                    `Scouted ${truoc(trinh.xong_luc, now)}: ${trinh.ket_qua.n} guards, power about ${fmtN(trinh.ket_qua.lc ?? 0)}.`,
                  )
              : tr('Chưa trinh sát ô này.', 'Not scouted yet.')}
        </p>
      )}
      {ta ? (
        dangDung ? (
          <p className="sm-ok">{tr('Ngươi đang đứng giữ ô này.', 'You are guarding this tile.')}</p>
        ) : (
          <button
            className="sm-btn main wide"
            disabled={c.busy}
            onClick={async () => {
              const e = await c.run({ fn: 'guard', q, r }, () => track('sm_guard', { from: 'ban_do' }));
              setErr(e);
              if (!e) setOk(tr(`Ngươi sang đứng giữ ${ten}.`, `You now guard ${ten}.`));
            }}
          >
            {tr(`Đứng giữ ${ten}`, `Guard ${ten}`)}
          </button>
        )
      ) : (
        <>
          <div className="sm-grid2">
            <button
              className="sm-btn"
              disabled={c.busy || !!dangTrinh || d == null}
              onClick={async () => {
                const e = await c.run({ fn: 'scout', q, r }, () => track('sm_scout', { d }));
                setErr(e);
                if (!e) setOk(tr(`Đã cử người trinh sát, ${phut} phút nữa có tin.`, `Scout sent, news in ${phut} min.`));
              }}
            >
              {tr(`Trinh sát · ${phut} phút`, `Scout · ${phut} min`)}
            </button>
            <button className="sm-btn main" disabled={!!khoa} onClick={() => c.go('xuat-chinh', { target: [q, r] })}>
              {tr('Xuất chinh', 'March')}
            </button>
          </div>
          {khoa && <p className="sm-why">{khoa}</p>}
        </>
      )}
    </section>
  );
}
