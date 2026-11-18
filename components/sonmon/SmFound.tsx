'use client';

/** 4.6.0 Sơn Môn M2 lập môn (tên 3 phần, 30 huy hiệu, 10 chính điện, điều kiện vào) và M3 chọn ô cắm cờ. */
import { useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmMapO } from '@/lib/sonmon/api';
import { CHINH_DIEN, COI, HUY_HINH, HUY_MAU, hexDist, hexKe, SM_CFG, TEN1, TEN2, TEN3, tenNgauNhien } from '@/lib/sonmon/data';
import { ChinhDien, HuyHieu } from './Pixel';
import { HexMap } from './SmMap';
import { clock, Msg, useNow, type SmCtx, type SmDraft } from './ui';

function Stepper({ label, value, set, step, max, unit }: { label: string; value: number; set: (n: number) => void; step: number; max: number; unit: string }) {
  return (
    <div className="sm-between" style={{ alignItems: 'center' }}>
      <span style={{ fontSize: 16 }}>{label}</span>
      <div className="sm-step-in">
        <button className="sm-btn small" style={{ minWidth: 44 }} aria-label={tr(`Bớt ${label}`, `Less ${label}`)} disabled={value <= 0} onClick={() => set(Math.max(0, value - step))}>
          -
        </button>
        <output aria-live="polite">
          {value}
          <small style={{ fontSize: 13 }}> {unit}</small>
        </output>
        <button className="sm-btn small" style={{ minWidth: 44 }} aria-label={tr(`Thêm ${label}`, `More ${label}`)} disabled={value >= max} onClick={() => set(Math.min(max, value + step))}>
          +
        </button>
      </div>
    </div>
  );
}

/** điều kiện vào môn (dùng ở M2 và màn Thành viên) */
export function DkForm({ d, set }: { d: Pick<SmDraft, 'dkKiep' | 'dkNgay' | 'moCua'>; set: (p: Partial<SmDraft>) => void }) {
  return (
    <>
      <Stepper label={tr('Ít nhất bao nhiêu kiếp', 'Minimum lives')} value={d.dkKiep} set={(n) => set({ dkKiep: n })} step={5} max={1000} unit={tr('kiếp', 'lives')} />
      <Stepper label={tr('Tuổi đạo (ngày đã chơi)', 'Dao age (days played)')} value={d.dkNgay} set={(n) => set({ dkNgay: n })} step={1} max={30} unit={tr('ngày', 'days')} />
      <div className="sm-seg" role="group" aria-label={tr('Cách vào môn', 'How to join')}>
        <button aria-pressed={d.moCua} onClick={() => set({ moCua: true })}>
          {tr('Mở cửa, vào ngay', 'Open, join now')}
        </button>
        <button aria-pressed={!d.moCua} onClick={() => set({ moCua: false })}>
          {tr('Duyệt đơn', 'Review')}
        </button>
      </div>
    </>
  );
}

export function SmLap({ c }: { c: SmCtx }) {
  const { st } = c;
  const [d, setD] = useState<SmDraft>(() => c.draft ?? { ten: tenNgauNhien(), huy: Math.floor(Math.random() * 30), cd: 0, dkKiep: 0, dkNgay: 0, moCua: true });
  const set = (p: Partial<SmDraft>) => setD((x) => ({ ...x, ...p }));
  const ten = d.ten.join(' ');
  const trung = (c.list ?? []).some((m) => m.ten === ten);
  const thieuK = Math.max(0, st.lap_can.kiep - st.kiep);
  const thieuN = Math.max(0, st.lap_can.ngay - st.ngay);
  const chuaDu = thieuK > 0 || thieuN > 0;
  const setTen = (i: number, v: string) => set({ ten: d.ten.map((x, j) => (j === i ? v : x)) as SmDraft['ten'] });
  return (
    <>
      <div className="sm-row">
        <h2 className="sm-grow">{tr('Lập sơn môn', 'Found a sect')}</h2>
        <span className="sm-note">{tr('bước 1/2', 'step 1/2')}</span>
      </div>
      <section className="sm-card dark">
        <div className="sm-row">
          <ChinhDien id={d.cd} size={64} />
          <HuyHieu id={d.huy} size={44} />
          <div className="sm-grow">
            <h2 className="sm-clip">{ten}</h2>
            <p className="sm-note">{CHINH_DIEN[d.cd]}</p>
          </div>
        </div>
      </section>
      <section className="sm-card">
        <h3>{tr('Tên môn', 'Sect name')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr 44px', gap: 6 }}>
          {[TEN1, TEN2, TEN3].map((xs, i) => (
            <select key={i} className="sm-sel" aria-label={tr(`Phần tên ${i + 1}`, `Name part ${i + 1}`)} value={d.ten[i]} onChange={(e) => setTen(i, e.target.value)}>
              {xs.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          ))}
          <button className="sm-btn small" style={{ padding: 0 }} aria-label={tr('Tên ngẫu nhiên', 'Random name')} onClick={() => set({ ten: tenNgauNhien() })}>
            <svg width="20" height="20" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
              <path d="M1 1h8v8H1z" fill="#fff8e6" stroke="#1f160d" />
              <path d="M2 2h2v2H2zM6 2h2v2H6zM4 4h2v2H4zM2 6h2v2H2zM6 6h2v2H6z" fill="#1f160d" />
            </svg>
          </button>
        </div>
        <p className="sm-note">{tr('Bấm ô xúc xắc để lấy tên ngẫu nhiên. Tên ghép từ danh sách có sẵn.', 'Tap the die for a random name. Names come from fixed lists.')}</p>
        {trung && <p className="sm-why">{tr('Tên này đã có môn dùng. Chọn tên khác.', 'That name is taken. Pick another.')}</p>}
      </section>
      <section className="sm-card">
        <h3>{tr('Huy hiệu · 30 mẫu', 'Crest · 30 designs')}</h3>
        <div className="sm-pick c6">
          {HUY_HINH.map((_, hinh) =>
            HUY_MAU.map((_, mau) => {
              const id = mau * 5 + hinh;
              return (
                <button key={id} aria-pressed={d.huy === id} aria-label={tr(`Huy hiệu ${id + 1}`, `Crest ${id + 1}`)} onClick={() => set({ huy: id })}>
                  <HuyHieu id={id} size={32} label="" />
                </button>
              );
            }),
          )}
        </div>
      </section>
      <section className="sm-card">
        <h3>{tr('Chính điện · 10 hình', 'Main hall · 10 designs')}</h3>
        <div className="sm-pick c5">
          {CHINH_DIEN.map((n, i) => (
            <button key={i} aria-pressed={d.cd === i} aria-label={n} onClick={() => set({ cd: i })}>
              <ChinhDien id={i} size={40} />
            </button>
          ))}
        </div>
        <p className="sm-note">{tr('Huy hiệu và chính điện chỉ để nhận diện, không cộng gì.', 'Crest and hall are for looks only, no bonus.')}</p>
      </section>
      <section className="sm-card">
        <h3>{tr('Ai được vào môn', 'Who may join')}</h3>
        <DkForm d={d} set={set} />
      </section>
      <button
        className="sm-btn main wide"
        disabled={chuaDu || trung || !!st.khoa_toi}
        onClick={() => {
          c.setDraft(d);
          c.go('chon-o');
        }}
      >
        {tr('TIẾP: CHỌN Ô CẮM CỜ', 'NEXT: PICK A TILE')}
      </button>
      {chuaDu && (
        <p className="sm-why">
          {tr(`Chưa đủ điều kiện lập môn: còn thiếu ${thieuK} kiếp, ${thieuN} ngày chơi.`, `Not eligible yet: ${thieuK} lives and ${thieuN} days to go.`)}
        </p>
      )}
    </>
  );
}

export function SmChonO({ c }: { c: SmCtx }) {
  const { st, map, draft } = c;
  const mon = st.mon;
  const [sel, setSel] = useState<SmMapO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const now = useNow();
  if (!mon && !draft) {
    return (
      <section className="sm-card">
        <p>{tr('Chưa có tên và huy hiệu cho môn.', 'No sect name or crest yet.')}</p>
        <button className="sm-btn main wide" onClick={() => c.go('lap')}>
          {tr('Về bước 1: lập môn', 'Back to step 1')}
        </button>
      </section>
    );
  }
  const ten = mon?.ten ?? draft!.ten.join(' ');
  const soKy = mon?.so_ky ?? 0;
  const duKy = mon?.du_ky ?? false;
  const idx = new Map((map?.o ?? []).map((o) => [`${o[0]},${o[1]}`, o]));
  const keTrong = sel ? hexKe({ q: sel[0], r: sel[1] }).filter((h) => idx.get(`${h.q},${h.r}`)?.[4] == null && idx.has(`${h.q},${h.r}`)).length : 0;
  const ganNhat = sel
    ? (map?.o ?? [])
        .filter((o) => o[4] != null)
        .map((o) => ({ o, d: hexDist({ q: o[0], r: o[1] }, { q: sel[0], r: sel[1] }) }))
        .sort((a, b) => a.d - b.d)[0]
    : null;

  const camCo = async () => {
    if (!sel) return;
    setErr(null);
    if (!mon && draft) {
      const e = await c.run({ fn: 'found', ...draft }, (r) => track('sm_found', { id: r.id, huy: draft.huy, cd: draft.cd, mo_cua: draft.moCua }));
      if (e) return setErr(e);
    }
    const e2 = await c.run({ fn: 'pick_tile', q: sel[0], r: sel[1] }, () => track('sm_pick_tile', { coi: sel[3] }));
    if (e2) {
      setErr(e2);
      c.reload(['map']);
      return;
    }
    c.setDraft(null);
    c.reload(['map', 'list']);
    c.go('mon');
  };

  return (
    <>
      <div className="sm-row">
        <h2 className="sm-grow">{tr('Chọn ô cắm cờ', 'Pick a tile')}</h2>
        {!mon && <span className="sm-note">{tr('bước 2/2', 'step 2/2')}</span>}
      </div>
      <p className="sm-note">{tr('Chạm một ô trống (viền vàng). Ô có huy hiệu là của môn khác.', 'Tap an empty tile (gold edge). Tiles with crests belong to other sects.')}</p>
      {map ? (
        <HexMap map={map} mine={mon?.id ?? null} sel={sel ? [sel[0], sel[1]] : null} onPick={setSel} pickEmpty center={[0, 0]} recenter={0} />
      ) : (
        <p className="sm-note">{tr('Đang mở bản đồ...', 'Opening the map...')}</p>
      )}
      <section className="sm-card">
        {sel ? (
          <>
            <h3>
              {sel[2]} · {tr(`cõi ${COI[sel[3]].name}`, `${COI[sel[3]].name} realm`)}
            </h3>
            <p style={{ fontSize: 15 }}>
              {tr(`Kề ${keTrong} ô trống`, `${keTrong} empty neighbours`)}
              {ganNhat ? tr(`, cách ${map?.mon[String(ganNhat.o[4])]?.ten ?? 'môn gần nhất'} ${ganNhat.d} ô.`, `, ${ganNhat.d} tiles from ${map?.mon[String(ganNhat.o[4])]?.ten ?? 'the nearest sect'}.`) : '.'}
            </p>
          </>
        ) : (
          <p>{tr('Chưa chọn ô nào.', 'No tile chosen yet.')}</p>
        )}
        <p className="sm-card warn" style={{ fontSize: 15 }}>
          {tr('Cắm cờ xong, ai trong ', 'Once the flag is planted, anyone in ')}
          <b>{ten}</b>
          {tr(' tự rời thì phải chờ 12 giờ mới vào môn khác, 24 giờ mới lập môn mới (bị đuổi thì vào được ngay).', ' who leaves on their own waits 12 hours to join another and 24 hours to found one (expelled members can join elsewhere at once).')}
          {!duKy &&
            (mon
              ? tr(` Cần ${SM_CFG.mon.kyCan} đạo hữu ký cùng lập, đã có ${soKy}/${SM_CFG.mon.kyCan}, còn ${clock(new Date(mon.het_han_ky).getTime() - now)}.`, ` Needs ${SM_CFG.mon.kyCan} co-signers: ${soKy}/${SM_CFG.mon.kyCan}, ${clock(new Date(mon.het_han_ky).getTime() - now)} left.`)
              : tr(` Sau đó cần ${SM_CFG.mon.kyCan} đạo hữu ký cùng lập trong 24 giờ, nếu không môn tự giải tán.`, ` Then ${SM_CFG.mon.kyCan} co-signers are needed within 24 hours, or the sect disbands.`))}
        </p>
      </section>
      <Msg err={err} />
      <button className="sm-btn main wide" disabled={!sel || c.busy} onClick={camCo}>
        {mon ? tr('CẮM CỜ', 'PLANT FLAG') : tr('CẮM CỜ, LẬP MÔN', 'PLANT FLAG, FOUND SECT')}
      </button>
      {!sel && <p className="sm-why">{tr('Chạm một ô trống trên bản đồ trước.', 'Tap an empty tile on the map first.')}</p>}
    </>
  );
}
