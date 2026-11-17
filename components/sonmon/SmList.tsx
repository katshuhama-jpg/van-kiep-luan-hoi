'use client';

/** 4.6.0 Sơn Môn M1: chưa có môn - danh sách môn, lọc, tự lập môn; màn trống ngày đầu (chỉ có môn chờ ký). */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { smLoi, type SmMonNguoi, type SmMonRow } from '@/lib/sonmon/api';
import { SM_CFG } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { SmBaCau } from './SmLuat';
import { chucTen, clock, fmtN, hhmm, Msg, ngayThang, useNow, type SmCtx } from './ui';

const BAO_KEY = 'vkl.sm.baoMo';

export function SmList({ c }: { c: SmCtx }) {
  const { st, list } = c;
  const [duDk, setDuDk] = useState(false);
  const [conCho, setConCho] = useState(false);
  const [hoi, setHoi] = useState<SmMonRow | null>(null);
  // 18/11: xem người trong môn trước khi vào
  const [xem, setXem] = useState<SmMonRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const now = useNow();
  // Ngày 7 (Sư Đồ): môn của sư phụ đứng đầu danh sách, nút "Vào môn của sư phụ" (vẫn phải đủ điều kiện)
  const [suMon, setSuMon] = useState<number | null>(null);
  // 17/11: mở bằng link nhờ ký (?ky=<id>) thì môn đó ghim đầu, kèm nút Ký cùng lập
  const [kyId] = useState<number | null>(() => {
    try {
      const v = Number(new URLSearchParams(location.search).get('ky'));
      return v > 0 ? v : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    let live = true;
    c.api.suMon().then((x) => live && setSuMon(x), () => {});
    return () => {
      live = false;
    };
  }, [c.api]);
  const mo = (list ?? []).filter((m) => m.du_ky);
  const choAll = (list ?? []).filter((m) => !m.du_ky);
  const kyM = choAll.find((m) => m.id === kyId) ?? null;
  const cho = choAll.filter((m) => m.id !== kyId);
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
  const bamVao = (m: SmMonRow) => {
    setXem(null);
    if (m.o > 0) setHoi(m);
    else vao(m);
  };
  const moXem = (m: SmMonRow) => {
    track('sm_xem_ds', { mon: m.id, n: m.n });
    setXem(m);
  };
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
      {kyM && (
        <section className="sm-card sm-bacau">
          <h3>{tr(`${kyM.mon_chu ?? 'Một đạo hữu'} nhờ ngươi ký cùng lập`, `${kyM.mon_chu ?? 'A friend'} asks you to co-sign`)}</h3>
          <ChoKy m={kyM} now={now} busy={c.busy} onKy={() => cosign(kyM)} />
          <p className="sm-note">{tr('Ký không bắt ngươi vào môn này, chỉ giúp môn đủ người để dựng.', 'Signing does not make you join; it only helps the sect get founded.')}</p>
        </section>
      )}
      <SmBaCau c={c} />
      {khoa && (
        <p className="sm-card warn">
          {tr(`Ngươi đã tự rời môn đã cắm cờ, chờ tới ${hhmm(khoa)} ngày ${ngayThang(khoa)} mới vào hoặc lập môn khác.`, `You left a flagged sect. You can join or found another at ${hhmm(khoa)} on ${ngayThang(khoa)}.`)}
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
            <button
              className="sm-chip"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                track('sm_xem_ban_do', { tu: 'list' });
                c.go('ban-do');
              }}
            >
              {tr('Xem bản đồ', 'See the map')}
            </button>
          </div>
          {suM && <MonRow m={suM} st={c.st} busy={c.busy} su onVao={() => bamVao(suM)} onXem={() => moXem(suM)} />}
          {shown.length === 0 && !suM && <p className="sm-note">{tr('Không có môn nào hợp bộ lọc.', 'No sect matches the filter.')}</p>}
          {shown.map((m) => (
            <MonRow key={m.id} m={m} st={c.st} busy={c.busy} onVao={() => bamVao(m)} onXem={() => moXem(m)} />
          ))}
          <p className="sm-note">{tr('Tự rời môn đã cắm cờ thì chờ 24 giờ mới vào môn khác. Bị đuổi thì vào môn khác được ngay.', 'Leave a flagged sect yourself and you wait 24 hours to join another. If expelled, you can join another at once.')}</p>
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
        {duLap && khoa && <p className="sm-why">{tr(`Chờ tới ${hhmm(khoa)} ngày ${ngayThang(khoa)} mới lập được.`, `You can found one at ${hhmm(khoa)} on ${ngayThang(khoa)}.`)}</p>}
      </section>

      {xem && <XemNguoi c={c} m={xem} onVao={() => bamVao(xem)} onDong={() => setXem(null)} />}

      {hoi && (
        <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr('Xác nhận vào môn', 'Confirm joining')} onClick={() => setHoi(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="sm-row">
              <HuyHieu id={hoi.huy_hieu} size={44} />
              <h2 className="sm-grow">{hoi.mo_cua ? tr(`Vào ${hoi.ten}?`, `Join ${hoi.ten}?`) : tr(`Xin vào ${hoi.ten}?`, `Apply to ${hoi.ten}?`)}</h2>
            </div>
            <p className="sm-card warn">
              {tr('Môn này đã cắm cờ. Nếu ngươi tự rời, phải chờ 24 giờ mới vào môn khác. Bị đuổi thì vào môn khác được ngay.', 'This sect has planted its flag. If you leave on your own, you wait 24 hours to join another. If expelled, you can join another at once.')}
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

function lyDo(m: SmMonRow, st: SmCtx['st']): string | null {
  if (st.khoa_toi) return tr(`Chờ tới ${hhmm(st.khoa_toi)}`, `Wait until ${hhmm(st.khoa_toi)}`);
  if (m.n >= m.toi_da) return tr(`Đã đủ ${m.toi_da} người`, `Full (${m.toi_da})`);
  if (!m.du_dk) return tr(`Cần ${m.dk_kiep} kiếp, ${m.dk_tuoi_dao} ngày chơi`, `Needs ${m.dk_kiep} lives, ${m.dk_tuoi_dao} days`);
  if (st.don.some((d) => d.mon === m.id)) return tr('Đang chờ duyệt', 'Awaiting review');
  return null;
}

function MonRow({ m, st, busy, onVao, onXem, su }: { m: SmMonRow; st: SmCtx['st']; busy: boolean; onVao: () => void; onXem: () => void; su?: boolean }) {
  const daDon = st.don.some((d) => d.mon === m.id);
  const why = lyDo(m, st);
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
        <br />
        <button className="sm-xem" onClick={onXem} aria-label={tr(`Xem người trong ${m.ten}`, `See members of ${m.ten}`)}>
          {tr(`Xem ${m.n} người trong môn`, `See ${m.n} members`)}
        </button>
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
      {cho.length === 0 && <p className="sm-note">{tr('Chưa ai lập môn. Người đủ 30 kiếp và 5 ngày chơi lập được ngay.', 'Nobody has founded a sect yet.')}</p>}
      {cho.map((m) => (
        <ChoKy key={m.id} m={m} now={now} busy={c.busy} onKy={() => cosign(m)} />
      ))}
    </>
  );
}

/** 18/11: xem người trong môn trước khi vào (tên, chức, Lực chiến). Không hiện tài khoản, không hiện chỗ đứng. */
function XemNguoi({ c, m, onVao, onDong }: { c: SmCtx; m: SmMonRow; onVao: () => void; onDong: () => void }) {
  const [ds, setDs] = useState<SmMonNguoi[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    c.api.monDs(m.id).then(
      (x) => live && setDs(x),
      (e: unknown) => live && setErr(smLoi(e)),
    );
    return () => {
      live = false;
    };
  }, [c.api, m.id]);
  const why = lyDo(m, c.st);
  const daDon = c.st.don.some((d) => d.mon === m.id);
  return (
    <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr(`Người trong ${m.ten}`, `Members of ${m.ten}`)} onClick={onDong}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
        <div className="sm-row">
          <HuyHieu id={m.huy_hieu} size={44} />
          <div className="sm-grow">
            <h2>{m.ten}</h2>
            <span className="sm-note">
              {tr(`${m.n}/${m.toi_da} người · Lực chiến cả môn ${fmtN(m.lc)}`, `${m.n}/${m.toi_da} members · total power ${fmtN(m.lc)}`)}
            </span>
          </div>
        </div>
        <Msg err={err} ok={null} />
        <div style={{ overflowY: 'auto', minHeight: 0, flex: '1 1 auto' }}>
          {!ds && !err && <p className="sm-note">{tr('Đang xem người trong môn...', 'Loading members...')}</p>}
          {ds && (
            <table className="sm-table">
              <colgroup>
                <col style={{ width: '64%' }} />
                <col style={{ width: '36%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{tr('Tên · chức', 'Name · rank')}</th>
                  <th className="num">{tr('Lực chiến', 'Power')}</th>
                </tr>
              </thead>
              <tbody>
                {ds.map((x, i) => (
                  <tr key={i} className={x.ta ? 'me' : ''}>
                    <td>
                      <span>{x.ten}</span>
                      <div className="sm-note" style={{ fontSize: 13 }}>
                        {chucTen(x.chuc)}
                        {x.ta ? tr(' · ngươi', ' · you') : ''}
                      </div>
                    </td>
                    <td className="num">{fmtN(x.lc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {why ? (
          <p className="sm-why">{daDon ? tr('Ngươi đã gửi đơn vào môn này, đang chờ duyệt.', 'You applied; awaiting review.') : why}</p>
        ) : (
          <button className="sm-btn main wide" disabled={c.busy} onClick={onVao}>
            {m.mo_cua ? tr('Vào môn này', 'Join this sect') : tr('Xin vào môn này', 'Apply to this sect')}
          </button>
        )}
        <button className="sm-btn sm-ghost wide" onClick={onDong}>
          {tr('Đóng', 'Close')}
        </button>
      </div>
    </div>
  );
}
