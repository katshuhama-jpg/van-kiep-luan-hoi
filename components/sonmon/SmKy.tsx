'use client';

/** 4.6.0 Sơn Môn M9 Kỷ (đếm ngược, xếp hạng, thưởng, hết Kỷ) và M10 Lực chiến (công thức bằng lời, từng phần, trần 6.000, Khí vận). */
import Link from 'next/link';
import { tr } from '@/lib/i18n';
import { capLc, SM_CFG } from '@/lib/sonmon/data';
import { HuyHieu } from './Pixel';
import { fmtN, ngayThang, useNow, type SmCtx } from './ui';

function demNguoc(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return tr(`${d} ngày ${h} giờ`, `${d} d ${h} h`);
  if (h > 0) return tr(`${h} giờ ${m} phút`, `${h} h ${m} min`);
  return tr(`${m} phút`, `${m} min`);
}

export function SmKy({ c }: { c: SmCtx }) {
  const { st, rank } = c;
  const ky = st.ky!;
  const now = useNow();
  const mine = st.mon?.id ?? null;
  return (
    <>
      {!mine && (
        <button className="sm-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => c.go('list')}>
          ‹ {tr('Danh sách môn', 'Sect list')}
        </button>
      )}
      <section className="sm-card dark">
        <p className="sm-note">{tr(`Kỷ ${ky.id} kết thúc sau`, `Era ${ky.id} ends in`)}</p>
        <p className="sm-big">{demNguoc(new Date(ky.ket_thuc).getTime() - now)}</p>
        <p className="sm-note">
          {tr(`Kỷ ${ky.id}: ${ngayThang(ky.bat_dau)} - ${ngayThang(ky.ket_thuc)}. Từ Kỷ 2 mỗi Kỷ 28 ngày.`, `Era ${ky.id}: ${ngayThang(ky.bat_dau)} - ${ngayThang(ky.ket_thuc)}. From era 2, each lasts 28 days.`)}
        </p>
      </section>
      <section className="sm-card" style={{ padding: '8px 6px' }}>
        {!rank ? (
          <p className="sm-note">{tr('Đang xem bảng xếp hạng...', 'Loading ranking...')}</p>
        ) : rank.length === 0 ? (
          <p className="sm-note">{tr('Chưa có môn nào trên bảng.', 'No sects ranked yet.')}</p>
        ) : (
          <table className="sm-table">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '54%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>{tr('Sơn môn', 'Sect')}</th>
                <th className="num">{tr('Ô', 'Tiles')}</th>
                <th className="num">{tr('Khí vận', 'Fortune')}</th>
              </tr>
            </thead>
            <tbody>
              {rank.slice(0, 20).map((r, i) => (
                <tr key={r.id} className={r.id === mine ? 'me' : ''}>
                  <td>{i + 1}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <HuyHieu id={r.huy_hieu} size={22} label="" />
                      <span className="sm-clip">{r.ten}</span>
                    </span>
                  </td>
                  <td className="num">{r.o}</td>
                  <td className="num">{fmtN(r.kv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="sm-note" style={{ padding: '4px 4px 0' }}>
          {tr('Xếp theo số ô giữ lúc hết Kỷ, bằng nhau thì xét tổng Khí vận cả Kỷ.', 'Ranked by tiles held at the end, ties broken by total fortune.')}
        </p>
      </section>
      <section className="sm-card">
        <h3>{tr('Thưởng cuối Kỷ (chỉ đồ trang trí)', 'End-of-era rewards (cosmetic)')}</h3>
        <p style={{ fontSize: 15 }}>{tr('Hạng 1: hào quang chân thân, tên môn khắc vào Sổ Sinh Tử.', 'Rank 1: a true-self aura, sect name carved in the Book of Life and Death.')}</p>
        <p style={{ fontSize: 15 }}>{tr('Hạng 2-3: khung tên môn vàng.', 'Ranks 2-3: a golden sect name frame.')}</p>
        <p style={{ fontSize: 15 }}>{tr('Ai đủ 7 ngày điểm danh liền: một ngoại trang.', '7 check-ins in a row: an outfit.')}</p>
        <p className="sm-note">{tr('Không thưởng chỉ số, để người vào Kỷ sau không bị bỏ xa.', 'No stat rewards, so newcomers next era are not left behind.')}</p>
      </section>
      <section className="sm-card warn">
        <h3>{tr('Khi hết Kỷ', 'When the era ends')}</h3>
        <p style={{ fontSize: 15 }}>{tr('Mọi ô về trống, khóa thành viên được mở, ai muốn đổi môn thì đổi. Tên, huy hiệu và người trong môn giữ nguyên.', 'All tiles become empty and member locks lift. Names, crests and members stay.')}</p>
      </section>
    </>
  );
}

export function SmLucChien({ c }: { c: SmCtx }) {
  const { st } = c;
  const lc = st.lc ?? 0;
  const p = st.lc_phan;
  const rows: [string, string, number][] = p
    ? [
        [tr('Tuổi đạo', 'Years lived'), tr(`tổng năm đã sống: ${fmtN(p.nam)}`, `total years: ${fmtN(p.nam)}`), p.p_nam],
        [tr('Luân hồi', 'Rebirths'), tr(`số kiếp: ${fmtN(p.kiep)}`, `lives: ${fmtN(p.kiep)}`), p.p_kiep],
        [tr('Cảnh giới', 'Realm'), tr(`cao nhất: bậc ${p.canh}`, `highest: tier ${p.canh}`), p.p_canh],
        [tr('Kết cục', 'Endings'), tr(`trong Sổ Sinh Tử: ${p.ket_cuc}`, `in the Book: ${p.ket_cuc}`), p.p_ket_cuc],
        [tr('Thâm niên', 'Seniority'), tr(`số ngày đã chơi: ${p.ngay}`, `days played: ${p.ngay}`), p.p_ngay],
      ]
    : [];
  const tinh = capLc(lc);
  return (
    <>
      <button className="sm-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => c.go(st.mon ? 'mon' : 'list')}>
        ‹ {st.mon ? tr('Về môn', 'Back to sect') : tr('Danh sách môn', 'Sect list')}
      </button>
      <section className="sm-card dark">
        <p className="sm-note">{tr('Lực chiến của ngươi', 'Your power')}</p>
        <p className="sm-big">{fmtN(lc)}</p>
        <p className="sm-note">{tr('Tăng mỗi kiếp ngươi chơi xong. Kiếp chết trước 16 tuổi không tính.', 'Grows with every life you finish. Lives ending before 16 do not count.')}</p>
      </section>
      <section className="sm-card">
        <h3>{tr('Từng phần', 'Breakdown')}</h3>
        {!p && <p className="sm-note">{tr('Chơi xong một kiếp để máy chủ tính Lực chiến.', 'Finish a life so the server can compute it.')}</p>}
        {rows.map(([a, b, v]) => (
          <div key={a} className="sm-between" style={{ borderTop: '1px solid #d9c493', paddingTop: 5 }}>
            <span style={{ fontSize: 16, minWidth: 0 }}>
              <b>{a}</b> <span className="sm-dim" style={{ fontSize: 14 }}>· {b}</span>
            </span>
            <b>+{fmtN(v)}</b>
          </div>
        ))}
        {p && (
          <div className="sm-between" style={{ borderTop: '1px solid #d9c493', paddingTop: 5 }}>
            <span style={{ fontSize: 16, minWidth: 0 }}>
              <b>{tr('Tam Tài', 'Three Treasures')}</b>{' '}
              <span className="sm-dim" style={{ fontSize: 14 }}>· {tr(`${p.huyet} huyệt, ${p.vien_man} hành viên mãn`, `${p.huyet} points, ${p.vien_man} full elements`)}</span>
            </span>
            <b>x{p.nhan.toFixed(2).replace('.', ',')}</b>
          </div>
        )}
        <div className="sm-between" style={{ borderTop: '1px solid #d9c493', paddingTop: 5 }}>
          <span className="sm-dim" style={{ fontSize: 16 }}>{tr('Đồ, công pháp, linh thú', 'Gear, arts, beasts')}</span>
          <span className="sm-dim">{tr('sắp có', 'coming')}</span>
        </div>
      </section>
      <section className="sm-card">
        <h3>{tr('Cách tính', 'Formula')}</h3>
        <p style={{ fontSize: 15 }}>{tr('Cộng năm phần:', 'Add five parts:')}</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15 }}>
          <li>{tr('Tuổi đạo: 30 lần căn bậc hai của tổng năm đã sống', 'Years: 30 x square root of all years lived')}</li>
          <li>{tr('Luân hồi: theo số kiếp, càng nhiều càng lên chậm', 'Rebirths: by number of lives, slower as it grows')}</li>
          <li>{tr('Cảnh giới: 80 mỗi bậc cao nhất từng đạt', 'Realm: 80 per highest tier reached')}</li>
          <li>{tr('Kết cục: 15 mỗi kết cục, tối đa 100', 'Endings: 15 each, up to 100')}</li>
          <li>{tr('Thâm niên: 50 mỗi ngày chơi, tối đa 30 ngày', 'Seniority: 50 per day played, up to 30')}</li>
        </ul>
        <p style={{ fontSize: 15 }}>{tr('Rồi nhân thêm 4% mỗi huyệt đã khai và 3% mỗi hành viên mãn.', 'Then add 4% per opened point and 3% per full element.')}</p>
      </section>
      <section className="sm-card">
        <h3>{tr(`Trần ${fmtN(SM_CFG.tran.tran)}`, `Cap ${fmtN(SM_CFG.tran.tran)}`)}</h3>
        <p style={{ fontSize: 15 }}>{tr(`Trong trận, mỗi người tính đủ tới ${fmtN(SM_CFG.tran.tran)}; phần trên ${fmtN(SM_CFG.tran.tran)} chỉ tính một nửa. Như nhau với mọi người, để môn đông người chăm vẫn thắng được môn có 1-2 người rất mạnh.`, `In battle each person counts fully up to ${fmtN(SM_CFG.tran.tran)}; anything above counts half. Same for everyone.`)}</p>
        <p className="sm-note">{lc > SM_CFG.tran.tran ? tr(`Ngươi tính vào trận: ${fmtN(tinh)}.`, `You count as ${fmtN(tinh)} in battle.`) : tr(`Ngươi chưa chạm trần: tính đủ ${fmtN(lc)}.`, `Below the cap: you count fully, ${fmtN(lc)}.`)}</p>
      </section>
      <section className="sm-card">
        <h3>{tr('Khí vận và trận', 'Fortune and battle')}</h3>
        <p style={{ fontSize: 15 }}>{tr(`Môn đạt ${SM_CFG.tran.moc1} Khí vận trong ngày: cả môn +10% từ 5:00 sáng mai. Đạt ${SM_CFG.tran.moc2}: +20%. Có cho cả đánh lẫn giữ.`, `Reach ${SM_CFG.tran.moc1} fortune in a day: +10% for the whole sect from 5:00 tomorrow. Reach ${SM_CFG.tran.moc2}: +20%.`)}</p>
        <p style={{ fontSize: 15 }}>{tr('Bên giữ được thêm 25% sân nhà, gấp đôi nếu bên đánh tới lúc 0-7h, thêm 15% nếu môn chỉ còn 1 ô. Bên lớn hơn thắng, bằng nhau bên giữ thắng.', 'Defenders get +25% home advantage, double if attackers arrive 0-7h, +15% if it is their last tile. Bigger side wins; ties go to the defender.')}</p>
      </section>
      <Link href="/choi" className="sm-btn main wide">
        {tr('Vào kiếp mới', 'Start a new life')}
      </Link>
    </>
  );
}
