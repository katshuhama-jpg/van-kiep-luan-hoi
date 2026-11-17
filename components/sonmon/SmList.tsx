'use client';

/** 4.6.0 Sơn Môn M1: chưa có môn - danh sách môn, lọc, tự lập môn; màn trống ngày đầu (chỉ có môn chờ ký). */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmMonRow } from '@/lib/sonmon/api';
import { SM_CFG } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { SmBaCau } from './SmLuat';
import { clock, fmtN, Msg, ngayThang, useNow, type SmCtx } from './ui';

const BAO_KEY = 'vkl.sm.baoMo';

export function SmList({ c }: { c: SmCtx }) {
  const { st, list } = c;
  const [duDk, setDuDk] = useState(false);
  const [conCho, setConCho] = useState(false);
  const [hoi, setHoi] = useState<SmMonRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const now = useNow();
  // Ngày 7 (Sư Đồ): môn của sư phụ đứng đầu danh sách, nút "Vào môn của sư phụ" (vẫn phải đủ điều kiện)
  const [suMon, setSuMon] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    c.api.suMon().then((x) => live && setSuMon(x), () => {});
    return () => {
      live = false;
    };
  }, [c.api]);
  const mo = (list ?? []).filter((m) => m.du_ky);
  const cho = (list ?? []).filter((m) => !m.du_ky);
  const khoa = st.khoa_toi;

  const thieuK = Math.max(0, st.lap_can.kiep - st.kiep);
  const thieuN = Math.max(0, st.lap_can.ngay - st.ngay);
  const duLap = thieuK === 0 && thieuN === 0;

  const cosign = async (m: SmMonRow) => {
    setErr(null);
    const e = await c.run({ fn: 'cosign', mon: m.id }, () => {
      track('sm_cosign', { mon: m.id });
      setOk(tr(`Đã ký cùng lập ${m.ten}.`, `You co-signed ${m.ten}.`));
    });
    if (e) setErr(e);
    c.reload(['list']);
  };
  const vao = async (m: SmMonRow) => {
    setHoi(null);
    setErr(null);
    const fn = m.mo_cua ? 'join' : 'apply';
    const e = await c.run({ fn, mon: m.id }, () => {
      track('sm_join', { mode: m.mo_cua ? 'mo_cua' : 'don', mon: m.id });
      if (!m.mo_cua) setOk(tr(`Đã gửi đơn vào ${m.ten}. Môn chủ hoặc trưởng lão sẽ duyệt.`, `Application sent to ${m.ten}.`));
    });
    if (e) setErr(e);
    else if (m.mo_cua) c.go('mon');
    c.reload(['list']);
  };

  const suM = mo.find((m) => m.id === suMon) ?? null;
  const shown = mo.filter((m) => m.id !== suMon && (!duDk || m.du_dk) && (!conCho || m.n < m.toi_da));

  return (
    <>
      <section className="sm-card dark">
        <p>
          <b style={{ color: 'var(--gold-l)' }}>{tr('Ngươi chưa có sơn môn.', 'You have no sect yet.')}</b>{' '}
          {tr('Vào một môn để điểm danh, làm nhiệm vụ mỗi ngày và giành đất trên bản đồ.', 'Join one to check in, do daily tasks and win land on the map.')}
        </p>
        <p className="sm-note">
          {tr(`Của ngươi: ${st.kiep} kiếp · ${st.ngay} ngày chơi · Lực chiến ${fmtN(st.lc ?? 0)}`, `Yours: ${st.kiep} lives · ${st.ngay} days · Power ${fmtN(st.lc ?? 0)}`)}
        </p>
      </section>
      <SmBaCau c={c} />
      {khoa && (
        <p className="sm-card warn">
          {tr(`Ngươi đã tự rời môn đã cắm cờ, phải chờ hết Kỷ (${ngayThang(khoa)}) mới vào môn khác.`, `You left a flagged sect and must wait until the era ends (${ngayThang(khoa)}).`)}
        </p>
      )}
      <Msg err={err} ok={ok} />

      {list === null && <p className="sm-note">{tr('Đang xem các môn...', 'Loading sects...')}</p>}

      {list !== null && mo.length === 0 && <SmTrong c={c} cho={cho} cosign={cosign} now={now} />}

      {mo.length > 0 && (
        <>
          <div className="sm-chips" role="group" aria-label={tr('Lọc', 'Filter')}>
            <button className="sm-chip" aria-pressed={duDk} onClick={() => setDuDk(!duDk)}>
              {tr('Đủ điều kiện', 'I qualify')}
            </button>
            <button className="sm-chip" aria-pressed={conCho} onClick={() => setConCho(!conCho)}>
              {tr('Còn chỗ', 'Has room')}
            </button>
          </div>
          {suM && <MonRow m={suM} st={c.st} busy={c.busy} su onVao={() => (suM.o > 0 ? setHoi(suM) : vao(suM))} />}
          {shown.length === 0 && !suM && <p className="sm-note">{tr('Không có môn nào hợp bộ lọc.', 'No sect matches the filter.')}</p>}
          {shown.map((m) => (
            <MonRow key={m.id} m={m} st={c.st} busy={c.busy} onVao={() => (m.o > 0 ? setHoi(m) : vao(m))} />
          ))}
          <p className="sm-note">{tr('Vào môn đã cắm cờ thì tự rời phải chờ hết Kỷ mới vào môn khác. Bị đuổi thì vào môn khác được ngay.', 'Leave a flagged sect yourself and you wait until the era ends. If expelled, you can join another at once.')}</p>
          {cho.length > 0 && (
            <>
              <h3>{tr(`Môn đang chờ người ký (${cho.length})`, `Sects awaiting co-signers (${cho.length})`)}</h3>
              {cho.map((m) => (
                <ChoKy key={m.id} m={m} now={now} busy={c.busy} onKy={() => cosign(m)} />
              ))}
            </>
          )}
        </>
      )}

      <section className="sm-card dash">
        <div className="sm-row">
          <div className="sm-grow">
            <b>{tr('Tự lập sơn môn', 'Found your own sect')}</b>
            <p style={{ fontSize: 15 }}>
              {tr(`Cần ${st.lap_can.kiep} kiếp, ${st.lap_can.ngay} ngày chơi và 2 đạo hữu ký cùng lập trong 24 giờ.`, `Needs ${st.lap_can.kiep} lives, ${st.lap_can.ngay} days and 2 co-signers within 24 hours.`)}
            </p>
          </div>
          <button className="sm-btn dark small" disabled={!duLap || !!khoa} onClick={() => c.go('lap')}>
            {tr('Lập môn', 'Found')}
          </button>
        </div>
        {!duLap && (
          <p className="sm-why">
            {tr('Ngươi còn thiếu ', 'You still need ')}
            {[thieuK > 0 && tr(`${thieuK} kiếp`, `${thieuK} lives`), thieuN > 0 && tr(`${thieuN} ngày chơi`, `${thieuN} days`)].filter(Boolean).join(', ')}.
            {tr(' Kiếp chết trước 16 tuổi không tính.', ' Lives ending before 16 do not count.')}
          </p>
        )}
        {duLap && khoa && <p className="sm-why">{tr('Đang bị khóa tới hết Kỷ.', 'Locked until the era ends.')}</p>}
      </section>

      {hoi && (
        <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr('Xác nhận vào môn', 'Confirm joining')} onClick={() => setHoi(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="sm-row">
              <HuyHieu id={hoi.huy_hieu} size={44} />
              <h2 className="sm-grow">{hoi.mo_cua ? tr(`Vào ${hoi.ten}?`, `Join ${hoi.ten}?`) : tr(`Xin vào ${hoi.ten}?`, `Apply to ${hoi.ten}?`)}</h2>
            </div>
            <p className="sm-card warn">
              {tr(`Môn này đã cắm cờ. Nếu ngươi tự rời, phải chờ hết Kỷ ${c.st.ky?.id ?? ''} mới vào môn khác. Bị đuổi thì vào môn khác được ngay.`, `This sect has planted its flag. If you leave on your own, you wait until era ${c.st.ky?.id ?? ''} ends. If expelled, you can join another at once.`)}
            </p>
            <button className="sm-btn main wide" disabled={c.busy} onClick={() => vao(hoi)}>
              {hoi.mo_cua ? tr('Vào môn', 'Join') : tr('Gửi đơn', 'Apply')}
            </button>
            <button className="sm-btn sm-ghost wide" onClick={() => setHoi(null)}>
              {tr('Thôi', 'Cancel')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MonRow({ m, st, busy, onVao, su }: { m: SmMonRow; st: SmCtx['st']; busy: boolean; onVao: () => void; su?: boolean }) {
  const day = m.n >= m.toi_da;
  const daDon = st.don.some((d) => d.mon === m.id);
  let why: string | null = null;
  if (st.khoa_toi) why = tr('Đang chờ hết Kỷ', 'Locked until era ends');
  else if (day) why = tr(`Đã đủ ${m.toi_da} người`, `Full (${m.toi_da})`);
  else if (!m.du_dk) why = tr(`Cần ${m.dk_kiep} kiếp, ${m.dk_tuoi_dao} ngày chơi`, `Needs ${m.dk_kiep} lives, ${m.dk_tuoi_dao} days`);
  else if (daDon) why = tr('Đang chờ duyệt', 'Awaiting review');
  const dk = [m.dk_kiep > 0 && tr(`từ ${m.dk_kiep} kiếp`, `${m.dk_kiep}+ lives`), m.dk_tuoi_dao > 0 && tr(`${m.dk_tuoi_dao} ngày chơi`, `${m.dk_tuoi_dao}+ days`)].filter(Boolean).join(', ');
  return (
    <section className={`sm-mon${su ? ' su' : ''}`}>
      <HuyHieu id={m.huy_hieu} size={44} />
      <div className="sm-mon-t">
        {su && <span className="sm-su-tag">{tr('Môn của sư phụ ngươi', "Your master's sect")}</span>}
        <b>{m.ten}</b>
        {tr(`${m.n}/${m.toi_da} người · ${m.o > 0 ? `${m.o} ô` : 'chưa cắm cờ'}`, `${m.n}/${m.toi_da} members · ${m.o > 0 ? `${m.o} tiles` : 'no flag yet'}`)}
        <br />
        <span className="sm-dim">
          {m.mo_cua ? tr('Mở cửa', 'Open') : tr('Duyệt đơn', 'Review')}
          {dk ? ` · ${dk}` : tr(' · ai cũng vào được', ' · anyone')}
        </span>
      </div>
      <div className="sm-mon-act">
        <button className={`sm-btn small ${why ? '' : 'dark'}`} disabled={!!why || busy} onClick={onVao}>
          {daDon ? tr('Đã gửi đơn', 'Applied') : su ? (m.mo_cua ? tr('Vào môn của sư phụ', "Join master's sect") : tr('Xin vào môn của sư phụ', "Apply to master's sect")) : m.mo_cua ? tr('Vào ngay', 'Join') : tr('Xin vào', 'Apply')}
        </button>
        {why && !daDon && <span className="sm-why">{why}</span>}
      </div>
    </section>
  );
}

function ChoKy({ m, now, busy, onKy }: { m: SmMonRow; now: number; busy: boolean; onKy: () => void }) {
  const con = new Date(m.het_han_ky).getTime() - now;
  return (
    <section className="sm-mon">
      <HuyHieu id={m.huy_hieu} size={44} />
      <div className="sm-mon-t">
        <b>{m.ten}</b>
        {tr(`${m.mon_chu ?? 'Môn chủ'} lập · đã có ${m.so_ky}/${SM_CFG.mon.kyCan} chữ ký`, `Founded by ${m.mon_chu ?? 'master'} · ${m.so_ky}/${SM_CFG.mon.kyCan} signatures`)}
        <br />
        <span className="sm-dim">{tr(`Còn ${clock(con)} để đủ chữ ký`, `${clock(con)} left to get signatures`)}</span>
      </div>
      <div className="sm-mon-act">
        <button className="sm-btn small" disabled={m.ta_ky || busy} onClick={onKy}>
          {m.ta_ky ? tr('Đã ký', 'Signed') : tr('Ký cùng lập', 'Co-sign')}
        </button>
      </div>
    </section>
  );
}

/** Ngày đầu Kỷ: chưa có môn nào đủ chữ ký */
function SmTrong({ c, cho, cosign, now }: { c: SmCtx; cho: SmMonRow[]; cosign: (m: SmMonRow) => void; now: number }) {
  const [bao, setBao] = useState(() => {
    try {
      return localStorage.getItem(BAO_KEY) === '1';
    } catch {
      return false;
    }
  });
  return (
    <>
      <section className="sm-card">
        <h2>{tr('Chưa có môn nào mở', 'No sect is open yet')}</h2>
        <p>{tr('Các môn đang chờ người ký. Mỗi môn cần 2 đạo hữu ký cùng lập trong 24 giờ.', 'These sects are waiting for co-signers. Each needs 2 within 24 hours.')}</p>
        {bao ? (
          <p className="sm-ok">{tr('Đã nhớ. Tab Sơn Môn sẽ có chấm đỏ khi có môn mở cửa.', 'Noted. The Sects tab gets a red dot when a sect opens.')}</p>
        ) : (
          <button
            className="sm-btn main wide"
            onClick={() => {
              try {
                localStorage.setItem(BAO_KEY, '1');
              } catch {}
              track('sm_notify');
              setBao(true);
            }}
          >
            {tr('Báo ta khi có môn mở cửa', 'Tell me when a sect opens')}
          </button>
        )}
      </section>
      {cho.length === 0 && <p className="sm-note">{tr('Chưa ai lập môn. Người đủ 50 kiếp và 5 ngày chơi lập được ngay.', 'Nobody has founded a sect yet.')}</p>}
      {cho.map((m) => (
        <ChoKy key={m.id} m={m} now={now} busy={c.busy} onKy={() => cosign(m)} />
      ))}
    </>
  );
}
