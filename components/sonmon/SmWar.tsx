'use client';

/** 4.6.0 Sơn Môn M6 xuất chinh (4 bước, người theo, thanh Ta/Họ) và M7 chiến sự (bị đánh, đứng giữ, chiến báo). */
import { useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmBao, SmMember, SmState } from '@/lib/sonmon/api';
import { capLc, SM_CFG, tranCau } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { chinhKhoa } from './SmMap';
import { clock, fmtN, hhmm, mocGio, Msg, truoc, useNow, type SmCtx } from './ui';

const vnGio = (t: number) => new Date(t + 7 * 3600e3).getUTCHours();
const laDem = (t: number) => vnGio(t) >= SM_CFG.demTu && vnGio(t) < SM_CFG.demToi;

function VsBar({ ta, ho }: { ta: number; ho: number }) {
  const tong = Math.max(1, ta + ho);
  return (
    <>
      <div className="sm-between" style={{ fontSize: 15 }}>
        <span>{tr(`Ta ${fmtN(ta)}`, `Us ${fmtN(ta)}`)}</span>
        <span>{tr(`Họ ${fmtN(ho)}`, `Them ${fmtN(ho)}`)}</span>
      </div>
      <div className="sm-vs" role="img" aria-label={tr(`Ta ${fmtN(ta)}, họ ${fmtN(ho)}`, `Us ${fmtN(ta)}, them ${fmtN(ho)}`)}>
        <i className="ta" style={{ width: `${(ta / tong) * 100}%` }} />
        <i className="ho" style={{ width: `${(ho / tong) * 100}%` }} />
      </div>
    </>
  );
}

function Step({ ten, chu, kieu }: { ten: string; chu: string; kieu: 'done' | 'now' | '' }) {
  return (
    <div className={`sm-step ${kieu}`}>
      <b>{ten}</b>
      <span>{chu}</span>
    </div>
  );
}

export function SmXuatChinh({ c }: { c: SmCtx }) {
  const { st, map, members } = c;
  const m = st.mon!;
  const now = useNow();
  const [err, setErr] = useState<string | null>(null);
  const [hoiBh, setHoiBh] = useState(false);
  const chinh = (st.chinh ?? [])[0] ?? null;
  const toi: [number, number] | null = chinh ? chinh.toi : c.target;
  if (!toi) {
    return (
      <section className="sm-card">
        <p>{tr('Chưa chọn ô để xuất chinh. Mở bản đồ, chạm một ô kề lãnh thổ.', 'No target yet. Open the map and tap a tile next to your land.')}</p>
        <button className="sm-btn main wide" onClick={() => c.go('ban-do')}>
          {tr('Mở bản đồ', 'Open map')}
        </button>
      </section>
    );
  }
  const o = map?.o.find((x) => x[0] === toi[0] && x[1] === toi[1]) ?? null;
  const tenO = chinh?.ten_o ?? o?.[2] ?? '?';
  const chuO = o?.[4] ?? null;
  const chuTen = chuO == null ? null : map?.mon[String(chuO)]?.ten ?? null;
  const trinh = (st.trinh ?? []).find((t) => t.o[0] === toi[0] && t.o[1] === toi[1] && t.ket_qua);
  const tapHop = chinh ? new Date(chinh.tap_hop_toi).getTime() : now + SM_CFG.gio.tapHopPhut * 60e3;
  const toiNoi = chinh ? new Date(chinh.toi_noi_luc).getTime() : tapHop + SM_CFG.gio.diPhut * 60e3;
  const dangTap = chinh?.trang_thai === 'tap_hop' && tapHop > now;
  const dangDi = chinh && !dangTap;

  // Ta: tổng Lực chiến người theo (có trần) x (1 + Khí vận)
  const lcTa = st.lc ?? 0;
  const avg = members && members.ds.length ? members.ds.reduce((s, x) => s + capLc(x.lc), 0) / members.ds.length : capLc(lcTa);
  const goc = chinh ? (chinh.theo ? chinh.theo.reduce((s, x) => s + capLc(x.lc), 0) : chinh.n * avg) : capLc(lcTa);
  const ta = goc * (1 + m.kv_bonus);
  // Họ: số trinh sát (đã gồm sân nhà, sai số ±15%), đêm 0-7h nhân đôi, môn chỉ còn 1 ô thêm 15%
  const motO = chuO != null && (map?.o.filter((x) => x[4] === chuO).length ?? 0) === 1;
  const ho = trinh?.ket_qua && !trinh.ket_qua.trong ? (trinh.ket_qua.lc ?? 0) * (laDem(toiNoi) ? SM_CFG.tran.dem : 1) * (motO ? SM_CFG.tran.motO : 1) : 0;
  const cau =
    chuO == null
      ? tr('Ô trống: tới nơi là cắm cờ.', 'Empty tile: arrive and plant the flag.')
      : !trinh
        ? tr('Chưa trinh sát ô này nên chưa ước tính được. Nên trinh sát trước.', 'Not scouted yet, so no estimate. Scout first.')
        : ta > ho
          ? tr(`Đang hơn khoảng ${fmtN(ta - ho)} - nhiều khả năng thắng.`, `Ahead by about ${fmtN(ta - ho)} - likely to win.`)
          : tranCau(ta, ho, lcTa);
  const khoa = !chinh && o ? chinhKhoa(st, o, now) : null;

  // 18/11: môn ta đang bảo hộ môn mới mà đánh ô có chủ thì mất bảo hộ: hỏi lại trước
  const bhTa = st.mon?.moi_bh_toi && new Date(st.mon.moi_bh_toi).getTime() > now ? st.mon.moi_bh_toi : null;
  const phat = async () => {
    if (bhTa && chuO != null && !hoiBh) return setHoiBh(true);
    setHoiBh(false);
    setErr(null);
    const e = await c.run({ fn: 'march', q: toi[0], r: toi[1] }, () => track('sm_march', { trong: chuO == null, trinh: !!trinh }));
    setErr(e);
    c.reload(['map']);
  };
  const theo = async (on: boolean) => {
    if (!chinh) return;
    setErr(null);
    const e = await c.run({ fn: on ? 'follow' : 'unfollow', chinh: chinh.id }, () => track('sm_follow', { on }));
    setErr(e);
  };

  return (
    <>
      <div className="sm-row">
        <button className="sm-btn small" onClick={() => c.go('ban-do')} aria-label={tr('Về bản đồ', 'Back to map')}>
          ‹
        </button>
        <div className="sm-grow">
          <h2 className="sm-clip">{tr(`Xuất chinh: ${tenO}`, `March: ${tenO}`)}</h2>
          <p className="sm-note">{chuTen ? tr(`của ${chuTen}`, `held by ${chuTen}`) : tr('ô trống', 'empty tile')}</p>
        </div>
        {chuO != null && <HuyHieu id={map?.mon[String(chuO)]?.huy_hieu ?? 0} size={36} />}
      </div>
      <div className="sm-steps">
        <Step ten={tr('Trinh sát', 'Scout')} chu={trinh ? tr('xong', 'done') : tr('chưa', 'not yet')} kieu={trinh ? 'done' : ''} />
        <Step ten={tr('Tập hợp', 'Gather')} chu={!chinh ? tr('30 phút', '30 min') : dangTap ? tr(`còn ${clock(tapHop - now)}`, `${clock(tapHop - now)} left`) : tr('xong', 'done')} kieu={!chinh ? '' : dangTap ? 'now' : 'done'} />
        <Step ten={tr('Di chuyển', 'Move')} chu={dangDi ? tr(`còn ${clock(toiNoi - now)}`, `${clock(toiNoi - now)} left`) : tr(`${SM_CFG.gio.diPhut} phút`, `${SM_CFG.gio.diPhut} min`)} kieu={dangDi ? 'now' : ''} />
        <Step ten={tr('Giao tranh', 'Battle')} chu={hhmm(new Date(toiNoi).toISOString())} kieu="" />
      </div>

      <section className="sm-card">
        <div className="sm-between">
          <h3>{tr(`Người đi theo (${chinh ? chinh.n : 1})`, `Marching (${chinh ? chinh.n : 1})`)}</h3>
          {chinh?.nguoi_phat && <span className="sm-note">{tr(`${chinh.nguoi_phat} phát lệnh`, `ordered by ${chinh.nguoi_phat}`)}</span>}
        </div>
        {chinh?.theo ? (
          <>
            {chinh.theo.slice(0, 4).map((x, i) => (
              <div key={i} className="sm-between" style={{ fontSize: 16 }}>
                <span className="sm-clip">{x.ten}</span>
                <b>{fmtN(x.lc)}</b>
              </div>
            ))}
            {chinh.theo.length > 4 && (
              <div className="sm-between sm-dim" style={{ fontSize: 16 }}>
                <span>{tr(`+ ${chinh.theo.length - 4} người nữa`, `+ ${chinh.theo.length - 4} more`)}</span>
                <b>{fmtN(chinh.theo.slice(4).reduce((s, x) => s + x.lc, 0))}</b>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 15 }}>
            {chinh ? (chinh.ta_theo ? tr(`Ngươi và ${chinh.n - 1} người nữa đã theo.`, `You and ${chinh.n - 1} others have joined.`) : tr(`${chinh.n} người đã theo.`, `${chinh.n} have joined.`)) : tr('Người phát lệnh tự đi theo. Thành viên có 30 phút để bấm Theo.', 'Whoever orders marches too. Members have 30 minutes to join.')}
          </p>
        )}
        <Msg err={err} />
        {!chinh ? (
          <>
            <button className="sm-btn main wide" disabled={!!khoa || c.busy} onClick={phat}>
              {tr('PHÁT LỆNH XUẤT CHINH', 'ORDER THE MARCH')}
            </button>
            {khoa && <p className="sm-why">{khoa}</p>}
            {!khoa && bhTa && chuO != null && (
              <p className="sm-why">{tr('Môn ta đang được bảo hộ môn mới. Đánh ô có chủ thì mất hết bảo hộ ngay.', 'We are under new-sect protection. Attacking an owned tile ends it at once.')}</p>
            )}
            {hoiBh && bhTa && (
              <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr('Mất bảo hộ?', 'Lose protection?')} onClick={() => setHoiBh(false)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <h2>{tr('Bỏ bảo hộ để đánh?', 'Drop protection to attack?')}</h2>
                  <p className="sm-card warn">
                    {tr(`Các ô của môn ta đang được bảo hộ môn mới (ô cắm cờ tới ${mocGio(bhTa, now)}). Phát lệnh đánh ô có chủ thì mất hết bảo hộ ngay, mọi môn đánh được ô của ta.`, `Our tiles are under new-sect protection (flag tile until ${mocGio(bhTa, now)}). Ordering an attack on an owned tile ends it all now.`)}
                  </p>
                  <button className="sm-btn main wide" disabled={c.busy} onClick={phat}>
                    {tr('Vẫn xuất chinh', 'March anyway')}
                  </button>
                  <button className="sm-btn sm-ghost wide" onClick={() => setHoiBh(false)}>
                    {tr('Thôi, giữ bảo hộ', 'Keep protection')}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : dangTap ? (
          chinh.ta_theo ? (
            <>
              <p className="sm-ok">{tr('Ngươi đã theo xuất chinh.', 'You joined the march.')}</p>
              <button className="sm-btn wide" disabled={c.busy} onClick={() => theo(false)}>
                {tr('Rút lại', 'Withdraw')}
              </button>
            </>
          ) : (
            <>
              <button className="sm-btn main wide" disabled={c.busy || !!(st.nghi_toi && new Date(st.nghi_toi).getTime() > now)} onClick={() => theo(true)}>
                {tr('THEO XUẤT CHINH', 'JOIN THE MARCH')}
              </button>
              {st.nghi_toi && new Date(st.nghi_toi).getTime() > now && <p className="sm-why">{tr(`Ngươi đang nghỉ sau trận thua tới ${hhmm(st.nghi_toi)}.`, `Resting until ${hhmm(st.nghi_toi)}.`)}</p>}
            </>
          )
        ) : (
          <p className="sm-ok">{tr(`Đang trên đường, tới nơi lúc ${hhmm(chinh.toi_noi_luc)}.`, `On the way, arriving ${hhmm(chinh.toi_noi_luc)}.`)}</p>
        )}
        <p className="sm-note">{tr('Đã theo thì chân thân bận tới khi về, không giữ ô khác được. Rút lại được trước khi hết giờ tập hợp.', 'Once joined you are busy until you return. You can withdraw before gathering ends.')}</p>
      </section>

      <section className="sm-card">
        <h3>{tr('Ước tính trận', 'Battle estimate')}</h3>
        {chuO != null && trinh && <VsBar ta={ta} ho={ho} />}
        <b style={{ color: ta > ho || chuO == null ? 'var(--jade)' : 'var(--red-d)', fontSize: 17 }}>{cau}</b>
        <p className="sm-note">
          {tr('Đã tính Khí vận của môn ta và lợi thế sân nhà của họ. Họ thấy ta lúc xuất phát, ai đang online có 20 phút sang giữ thêm. Tới nơi lúc 0-7h thì bên giữ mạnh gấp đôi.', 'Includes our fortune and their home advantage. They see us leave and may reinforce. Arriving 0-7h doubles the defence.')}
        </p>
        <p className="sm-note">
          {tr(`Thắng: ô về tay môn ta, bảo hộ ${SM_CFG.gio.baoHoGio} giờ. Thua: người đi theo nghỉ ${SM_CFG.gio.nghiGio} giờ, không mất gì khác.`, `Win: the tile is ours, protected ${SM_CFG.gio.baoHoGio} h. Lose: marchers rest ${SM_CFG.gio.nghiGio} h, nothing else lost.`)}
        </p>
      </section>
    </>
  );
}

/** người đang đứng giữ một ô: ai chưa chọn thì đứng ở ô chính điện */
function dungO(st: SmState, ds: SmMember[], q: number, r: number) {
  const cd = st.mon?.tiles.find((t) => t.cd);
  const laCd = cd && cd.q === q && cd.r === r;
  return ds.filter((x) => !x.nghi && (x.dung ? x.dung[0] === q && x.dung[1] === r : laCd));
}

function baoCau(b: SmBao, mine: number): { tag: string; cls: string; chu: string } {
  const o = b.nd?.ten_o ?? '';
  if (b.loai === 'cam_co') return { tag: tr('Cờ', 'Flag'), cls: 'flag', chu: tr(`Cắm cờ ${o}${b.nd?.dau ? ', ô đầu tiên của môn' : ''}`, `Planted the flag on ${o}`) };
  if (b.loai === 'huy') return { tag: tr('Hủy', 'Off'), cls: 'lose', chu: tr(`Lệnh xuất chinh tới ${o} bị hủy vì không ai theo`, `March to ${o} called off, nobody joined`) };
  if (b.loai === 'mat_het') return { tag: tr('Mất', 'Lost'), cls: 'lose', chu: tr('Môn mất hết ô. Cắm cờ lại một ô trống bất kỳ, bảo hộ 12 giờ.', 'The sect lost all tiles. Plant again anywhere, protected 12 h.') };
  const danh = b.a === mine;
  const thangA = b.nd?.kq === 'thang';
  if (danh)
    return thangA
      ? { tag: tr('Thắng', 'Won'), cls: 'win', chu: tr(`Chiếm ${o} của ${b.ten_b ?? '?'}`, `Took ${o} from ${b.ten_b ?? '?'}`) }
      : { tag: tr('Thua', 'Lost'), cls: 'lose', chu: tr(`Đánh ${o} của ${b.ten_b ?? '?'} không được, người đi theo nghỉ 2 giờ`, `Failed to take ${o} from ${b.ten_b ?? '?'}, marchers rest 2 h`) };
  return thangA
    ? { tag: tr('Thua', 'Lost'), cls: 'lose', chu: tr(`${b.ten_a ?? '?'} chiếm ${o}`, `${b.ten_a ?? '?'} took ${o}`) }
    : { tag: tr('Thắng', 'Won'), cls: 'win', chu: tr(`Giữ ${o} trước ${b.ten_a ?? '?'}`, `Held ${o} against ${b.ten_a ?? '?'}`) };
}

export function SmChienSu({ c }: { c: SmCtx }) {
  const { st, members } = c;
  const m = st.mon!;
  const now = useNow();
  const [doi, setDoi] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const bi = st.bi_danh ?? [];
  const cd = m.tiles.find((t) => t.cd);
  const dangDung = m.dung ?? (cd ? [cd.q, cd.r] : null);
  const oDung = dangDung ? m.tiles.find((t) => t.q === dangDung[0] && t.r === dangDung[1]) : null;
  const nghi = st.nghi_toi && new Date(st.nghi_toi).getTime() > now;
  const diDanh = (st.chinh ?? []).some((x) => x.ta_theo && x.trang_thai === 'di');
  const sang = async (q: number, r: number, ten: string) => {
    setErr(null);
    const e = await c.run({ fn: 'guard', q, r }, () => track('sm_guard', { from: 'chien_su', bi: bi.length > 0 }));
    setErr(e);
    if (!e) {
      setOk(tr(`Ngươi sang đứng giữ ${ten}.`, `You now guard ${ten}.`));
      setDoi(false);
      c.reload(['members']);
    }
  };
  const motO = m.tiles.length === 1;

  return (
    <>
      <Msg err={err} ok={ok} />
      {bi.length === 0 && <p className="sm-card">{tr('Không có môn nào đang tới đánh. Chọn sẵn ô đứng giữ, offline vẫn tính.', 'Nobody is marching on us. Pick a tile to guard; it counts while offline.')}</p>}
      {bi.map((b, i) => {
        const toi = new Date(b.toi_noi_luc).getTime();
        const ds = members ? dungO(st, members.ds, b.o[0], b.o[1]) : [];
        const tong = ds.reduce((s, x) => s + capLc(x.lc), 0) * SM_CFG.tran.sanNha * (1 + m.kv_bonus) * (laDem(toi) ? SM_CFG.tran.dem : 1) * (motO ? SM_CFG.tran.motO : 1);
        const oDay = dangDung && dangDung[0] === b.o[0] && dangDung[1] === b.o[1];
        return (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <section className="sm-card alert">
              <div className="sm-between">
                <b style={{ fontSize: 17 }}>{tr(`${b.tu_mon} đánh ${b.ten_o}`, `${b.tu_mon} attacks ${b.ten_o}`)}</b>
                <b className="sm-clock" style={{ fontSize: 20 }}>{clock(toi - now)}</b>
              </div>
              <p className="sm-note">
                {b.trang_thai === 'tap_hop' ? tr('Họ đang tập hợp.', 'They are gathering.') : tr('Họ đang trên đường.', 'They are on the way.')} {tr(`Tới nơi lúc ${hhmm(b.toi_noi_luc)}.`, `Arrives at ${hhmm(b.toi_noi_luc)}.`)}
                {laDem(toi) ? tr(' Tới lúc đêm: bên giữ mạnh gấp đôi.', ' Night arrival: defence doubled.') : ''}
              </p>
            </section>
            <section className="sm-card">
              <div className="sm-between">
                <h3>{tr(`Đang đứng giữ (${ds.length})`, `Guarding (${ds.length})`)}</h3>
                <span className="sm-note">{tr('kể cả người offline', 'offline included')}</span>
              </div>
              {!members && <p className="sm-note">{tr('Đang xem...', 'Loading...')}</p>}
              {ds.slice(0, 3).map((x) => (
                <div key={x.tk} className="sm-between" style={{ fontSize: 16 }}>
                  <span className="sm-clip">{x.ten}</span>
                  <b>{fmtN(x.lc)}</b>
                </div>
              ))}
              {ds.length > 3 && (
                <div className="sm-between sm-dim" style={{ fontSize: 16 }}>
                  <span>{tr(`+ ${ds.length - 3} người nữa`, `+ ${ds.length - 3} more`)}</span>
                  <b>{fmtN(ds.slice(3).reduce((s, x) => s + x.lc, 0))}</b>
                </div>
              )}
              <p style={{ fontSize: 15 }}>
                {tr(`Sức giữ khoảng ${fmtN(tong)} (đã tính sân nhà và Khí vận).`, `Defence about ${fmtN(tong)} (home advantage and fortune included).`)}
              </p>
              {i === 0 &&
                (oDay ? (
                  <p className="sm-ok">{tr(`Ngươi đang đứng giữ ${b.ten_o}.`, `You are guarding ${b.ten_o}.`)}</p>
                ) : (
                  <>
                    <button className="sm-btn main wide" disabled={c.busy || !!nghi || diDanh} onClick={() => sang(b.o[0], b.o[1], b.ten_o)}>
                      {tr(`SANG GIỮ ${b.ten_o.toUpperCase()} · +${fmtN(capLc(st.lc ?? 0))}`, `GUARD ${b.ten_o.toUpperCase()} · +${fmtN(capLc(st.lc ?? 0))}`)}
                    </button>
                    {nghi && <p className="sm-why">{tr(`Ngươi đang nghỉ sau trận thua tới ${hhmm(st.nghi_toi!)}.`, `Resting until ${hhmm(st.nghi_toi!)}.`)}</p>}
                    {diDanh && <p className="sm-why">{tr('Ngươi đang đi xuất chinh, chưa sang giữ được.', 'You are on a march and cannot switch.')}</p>}
                  </>
                ))}
            </section>
          </div>
        );
      })}

      <section className="sm-card">
        <div className="sm-row">
          <p className="sm-grow" style={{ fontSize: 16 }}>
            {oDung ? tr(`Ngươi đang đứng giữ ${oDung.ten}${m.dung ? '' : ' (ô chính điện)'}.`, `You guard ${oDung.ten}${m.dung ? '' : ' (main hall)'}.`) : tr('Môn chưa có ô để đứng giữ.', 'No tile to guard yet.')}
          </p>
          {m.tiles.length > 1 && (
            <button className="sm-btn small" aria-expanded={doi} onClick={() => setDoi(!doi)}>
              {tr('Đổi', 'Change')}
            </button>
          )}
        </div>
        {doi && (
          <div className="sm-grid2">
            {m.tiles.map((t) => (
              <button
                key={`${t.q},${t.r}`}
                className="sm-btn small"
                disabled={c.busy || !!nghi || diDanh || (!!dangDung && dangDung[0] === t.q && dangDung[1] === t.r)}
                onClick={() => sang(t.q, t.r, t.ten)}
              >
                {t.ten}
                {t.cd ? tr(' · chính điện', ' · hall') : ''}
              </button>
            ))}
          </div>
        )}
        <p className="sm-note">{tr('Mỗi người chọn sẵn một ô để đứng, offline vẫn tính. Lúc bị đánh, ai đang online có 20 phút dồn sang ô đó.', 'Everyone guards a chosen tile, even offline. When attacked, those online have 20 minutes to move over.')}</p>
      </section>

      <section className="sm-card">
        <h3>{tr('Chiến báo gần đây', 'Recent reports')}</h3>
        {(st.bao ?? []).length === 0 && <p className="sm-note">{tr('Chưa có trận nào.', 'No battles yet.')}</p>}
        {(st.bao ?? []).slice(0, 8).map((b) => {
          const x = baoCau(b, m.id);
          return (
            <div key={b.id} className="sm-bao">
              <span className={`sm-tag ${x.cls}`}>{x.tag}</span>
              <span className="sm-grow" style={{ flex: 1, minWidth: 0 }}>
                {x.chu}
              </span>
              <span className="sm-time">{truoc(b.luc, now)}</span>
            </div>
          );
        })}
      </section>
      <p className="sm-card warn" style={{ fontSize: 15 }}>
        {tr(`Mỗi chân thân một việc một lúc: đi đánh, đứng giữ, hoặc nghỉ. Ô vừa đổi chủ được bảo hộ ${SM_CFG.gio.baoHoGio} giờ.`, `One task at a time: march, guard or rest. A tile that just changed hands is protected ${SM_CFG.gio.baoHoGio} h.`)}
      </p>
    </>
  );
}

