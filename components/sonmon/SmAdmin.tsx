'use client';

/**
 * 4.6.0 Sơn Môn, Ngày 6: trang quản trị nhỏ cho Tyler (/quan-tri/son-mon).
 * Số môn, số người trong môn, trận theo ngày, các đánh dấu nghi gian lận (vkl_sm_co) để xem tay.
 * Máy chủ chỉ trả dữ liệu khi tên đăng nhập nằm trong bảng vkl_sm_admin_user.
 * Dữ liệu giả `?demo=1` chỉ có khi chạy dev (để chụp màn).
 */
import './sonmon.css';
import { useCallback, useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { tr } from '@/lib/i18n';
import { SmErr } from '@/lib/sonmon/api';
import { smAdmin, type SmAdmin as SmAdminData, type SmAdminCo } from '@/lib/sonmon/admin';
import { fmtN, hhmm, Msg, ngayThang, truoc } from './ui';

const LOAI_CO: Record<string, [string, string]> = {
  moi_vao_dong: ['Nhiều tài khoản mới vào cùng một môn trong một ngày', 'Many new accounts joined one sect in a day'],
  mot_chieu: ['Một cặp môn đánh nhau một chiều liên tục', 'One sect keeps attacking the same sect'],
  ky_moi: ['Tài khoản chưa tới 3 ngày tuổi ký lập môn', 'Account under 3 days old co-signed a sect'],
  chat_bao: ['Tin Truyền âm bị báo xấu', 'Sect chat message reported'],
};

function coChu(c: SmAdminCo): string {
  const t = LOAI_CO[c.loai];
  const loai = t ? tr(t[0], t[1]) : c.loai;
  const them: string[] = [];
  if (c.mon) them.push(c.mon);
  if (c.mon_b) them.push(tr(`đánh ${c.mon_b}`, `vs ${c.mon_b}`));
  if (c.nguoi) them.push(`@${c.nguoi}`);
  if (typeof c.ct.n === 'number') them.push(tr(`${c.ct.n} người`, `${c.ct.n} people`));
  return them.length ? `${loai}: ${them.join(' · ')}` : loai;
}

function demoData(): SmAdminData {
  const now = Date.now();
  const iso = (m: number) => new Date(now - m * 60000).toISOString();
  return {
    luc: iso(0),
    ky: { id: 1, bat_dau: '2026-11-17T22:00:00Z', ket_thuc: '2026-12-01T14:00:00Z', ban_kinh: 6, ket_xong: false, ket_luc: null },
    ky_chay: true,
    mon: { dung: 22, du_ky: 19, cho_ky: 3, giai_tan: 2 },
    nguoi: 214,
    diem_danh_hom_nay: 151,
    o: { tong: 127, co_chu: 61 },
    tran_ngay: [
      { ngay: '2026-11-20', tran: 9, giu_thang: 5, cam_co: 4 },
      { ngay: '2026-11-19', tran: 14, giu_thang: 6, cam_co: 11 },
      { ngay: '2026-11-18', tran: 3, giu_thang: 1, cam_co: 38 },
    ],
    top: [
      { id: 3, ten: 'Thanh Hư Tông', n: 15, o: 6, du_ky: true },
      { id: 7, ten: 'Huyền Lôi Môn', n: 13, o: 5, du_ky: true },
      { id: 1, ten: 'Tử Kiếm Phái', n: 11, o: 4, du_ky: true },
      { id: 12, ten: 'Bích Hà Cung', n: 4, o: 1, du_ky: false },
    ],
    co: [
      { id: 9, luc: iso(35), loai: 'mot_chieu', ct: { a: 3, b: 12 }, mon: 'Thanh Hư Tông', mon_b: 'Bích Hà Cung', nguoi: null },
      { id: 8, luc: iso(190), loai: 'moi_vao_dong', ct: { mon: 12, n: 4 }, mon: 'Bích Hà Cung', mon_b: null, nguoi: null },
      { id: 7, luc: iso(1500), loai: 'ky_moi', ct: { mon: 12 }, mon: 'Bích Hà Cung', mon_b: null, nguoi: 'nhoxx01' },
    ],
  };
}

export function SmAdmin() {
  const [d, setD] = useState<SmAdminData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    if (process.env.NODE_ENV !== 'production' && typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo')) {
      setD(demoData());
      return;
    }
    setBusy(true);
    smAdmin()
      .then((x) => {
        setD(x);
        setErr(null);
      })
      .catch((e) => {
        const code = e instanceof SmErr ? e.code : 'SM_NET';
        setErr(
          code === 'SM_AUTH'
            ? tr('Đăng nhập tài khoản quản trị để xem trang này.', 'Log in with an admin account to view this page.')
            : code === 'SM_QUYEN'
              ? tr('Tài khoản này không có quyền xem trang quản trị.', 'This account cannot view the admin page.')
              : tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later."),
        );
      })
      .finally(() => setBusy(false));
  }, []);
  useEffect(load, [load]);

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 24 }}>{tr('Quản trị Sơn Môn', 'Sect admin')}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <div className="sm">
        <Msg err={err} />
        {!d && !err && <p className="sm-note">{tr('Đang tải...', 'Loading...')}</p>}
        {d && (
          <>
            <section className="sm-card dark">
              <div className="sm-between">
                <h2>{d.ky ? tr(`Kỷ ${d.ky.id}`, `Era ${d.ky.id}`) : tr('Chưa có Kỷ', 'No era yet')}</h2>
                <small>
                  {d.ky
                    ? d.ky.ket_xong
                      ? tr('Đã kết', 'Ended')
                      : d.ky_chay
                        ? tr(`Đang chạy tới ${ngayThang(d.ky.ket_thuc)} ${hhmm(d.ky.ket_thuc)}`, `Running until ${ngayThang(d.ky.ket_thuc)} ${hhmm(d.ky.ket_thuc)}`)
                        : tr(`Mở ${ngayThang(d.ky.bat_dau)} ${hhmm(d.ky.bat_dau)}`, `Opens ${ngayThang(d.ky.bat_dau)} ${hhmm(d.ky.bat_dau)}`)
                    : ''}
                </small>
              </div>
              <div className="sm-grid2">
                <So n={d.mon.dung} label={tr('môn đang có', 'active sects')} />
                <So n={d.nguoi} label={tr('người trong môn', 'members')} />
                <So n={d.diem_danh_hom_nay} label={tr('điểm danh hôm nay', 'check-ins today')} />
                <So n={d.o.co_chu} of={d.o.tong} label={tr('ô có chủ', 'tiles held')} />
              </div>
              <p className="sm-note">
                {tr(
                  `${d.mon.du_ky} môn đủ chữ ký, ${d.mon.cho_ky} môn đang chờ ký, ${d.mon.giai_tan} môn đã giải tán.`,
                  `${d.mon.du_ky} fully signed, ${d.mon.cho_ky} waiting for signatures, ${d.mon.giai_tan} disbanded.`,
                )}
              </p>
            </section>

            <section className="sm-card">
              <h3>{tr('Trận theo ngày', 'Battles per day')}</h3>
              {d.tran_ngay.length === 0 ? (
                <p className="sm-note">{tr('Chưa có trận nào.', 'No battles yet.')}</p>
              ) : (
                <table className="sm-table">
                  <thead>
                    <tr>
                      <th>{tr('Ngày', 'Day')}</th>
                      <th className="num">{tr('Trận', 'Battles')}</th>
                      <th className="num">{tr('Giữ được', 'Held')}</th>
                      <th className="num">{tr('Cắm cờ', 'Flags')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.tran_ngay.map((x) => (
                      <tr key={x.ngay}>
                        <td>{ngayThang(x.ngay + 'T12:00:00Z')}</td>
                        <td className="num">{x.tran}</td>
                        <td className="num">{x.tran ? `${x.giu_thang} (${Math.round((x.giu_thang / x.tran) * 100)}%)` : '-'}</td>
                        <td className="num">{x.cam_co}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="sm-note">{tr('Giữ được dưới 20% hoặc trên 80% ba ngày liền: xem lại hệ số sân nhà.', 'Held under 20% or over 80% for 3 days in a row: review the home bonus.')}</p>
            </section>

            <section className="sm-card">
              <h3>{tr(`Nghi gian lận (${d.co.length})`, `Suspicious (${d.co.length})`)}</h3>
              {d.co.length === 0 ? (
                <p className="sm-note">{tr('Chưa có đánh dấu nào.', 'No flags yet.')}</p>
              ) : (
                <ul className="sm-co">
                  {d.co.map((c) => (
                    <li key={c.id}>
                      <small>{truoc(c.luc)}</small>
                      <span>{coChu(c)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="sm-card">
              <h3>{tr('Các môn', 'Sects')}</h3>
              {d.top.length === 0 ? (
                <p className="sm-note">{tr('Chưa có môn nào.', 'No sects yet.')}</p>
              ) : (
                <table className="sm-table">
                  <colgroup>
                    <col style={{ width: '58%' }} />
                    <col style={{ width: '21%' }} />
                    <col style={{ width: '21%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{tr('Môn', 'Sect')}</th>
                      <th className="num">{tr('Người', 'People')}</th>
                      <th className="num">{tr('Ô', 'Tiles')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.top.map((m) => (
                      <tr key={m.id}>
                        <td>{m.du_ky ? m.ten : tr(`${m.ten} (chờ ký)`, `${m.ten} (unsigned)`)}</td>
                        <td className="num">{m.n}</td>
                        <td className="num">{m.o}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <p className="sm-note">{tr(`Số lúc ${hhmm(d.luc)}.`, `As of ${hhmm(d.luc)}.`)}</p>
          </>
        )}
        <button className="sm-btn" disabled={busy} onClick={load}>
          {busy ? tr('Đang tải...', 'Loading...') : tr('Làm mới', 'Refresh')}
        </button>
      </div>
    </main>
  );
}

function So({ n, of, label }: { n: number; of?: number; label: string }) {
  return (
    <div className="sm-so">
      <b>
        {fmtN(n)}
        {of != null && <small>/{fmtN(of)}</small>}
      </b>
      <small>{label}</small>
    </div>
  );
}
