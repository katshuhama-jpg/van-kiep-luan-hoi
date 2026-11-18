'use client';

/** 4.6.0 Sơn Môn M4 môn nhà: thẻ môn, cảnh báo bị đánh, điểm danh chuỗi 7, 3 nhiệm vụ ngày, thanh Khí vận (vạch 30/50). */
import Link from 'next/link';
import { useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { nvChu, SM_CFG } from '@/lib/sonmon/data';
import { ChinhDien, ChuoiO, HuyHieu } from './Pixel';
import { SmBaCau } from './SmLuat';
import { duOCau, khaiDuoc } from './SmMap';
import { chucTen, clock, DongMinh, fmtN, mocGio, Msg, useNow, type SmCtx } from './ui';

const CANH: Record<number, string> = { 0: '-', 1: 'Luyện Khí', 2: 'Trúc Cơ', 3: 'Kim Đan', 4: 'Nguyên Anh', 5: 'Hóa Thần' };
const CANH_EN: Record<number, string> = { 0: '-', 1: 'Qi Refining', 2: 'Foundation', 3: 'Golden Core', 4: 'Nascent Soul', 5: 'Spirit' };
const canhTen = (n: number) => tr(CANH[n] ?? `bậc ${n}`, CANH_EN[n] ?? `tier ${n}`);

export function SmMonNha({ c }: { c: SmCtx }) {
  const { st } = c;
  const m = st.mon!;
  const now = useNow();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const dd = st.diem_danh ?? { hom_nay: false, chuoi: 0, da_thuong: false };
  const nv = st.nv;
  const hang = c.rank ? c.rank.findIndex((x) => x.id === m.id) + 1 : 0;
  const bi = st.bi_danh ?? [];
  const chinh = (st.chinh ?? [])[0];
  const moc1 = SM_CFG.tran.moc1, moc2 = SM_CFG.tran.moc2;
  const kv = m.kv_hom_nay;
  const pct = (x: number) => `${Math.min(100, (x / moc2) * 100)}%`;
  const gop = (dd.hom_nay ? 1 : 0) + (nv ? nv.xong.reduce((s, x, i) => s + (x ? nv.thuong[i] : 0), 0) : 0);
  const diemDanh = async () => {
    setErr(null);
    const e = await c.run({ fn: 'checkin' }, (r) => {
      track('sm_checkin', { chuoi: r.chuoi, thuong: r.thuong || undefined });
      setOk(r.thuong ? tr('Đủ 7 ngày liền: ngoại trang đã vào tủ chân thân.', '7 days in a row: an outfit is in your wardrobe.') : tr('Đã điểm danh: +1 Khí vận cho môn.', 'Checked in: +1 fortune for the sect.'));
    });
    if (e) setErr(e);
  };
  const chuNv = nv ? nvChu(nv.bac) : null;
  const nhoKy = async () => {
    const url = `${location.origin}/son-mon?ky=${m.id}`;
    const text = tr(`Ký giúp ta lập ${m.ten} trong Vạn Kiếp Luân Hồi, chỉ một nút bấm`, `Help me found ${m.ten} in Ten Thousand Rebirths, one tap`);
    track('sm_nho_ky', { so_ky: m.so_ky });
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setOk(tr('Đã chép link. Dán gửi đạo hữu qua Messenger hay Zalo.', 'Link copied. Paste it to a friend.'));
    } catch {
      setOk(tr(`Link: ${url}`, `Link: ${url}`));
    }
  };

  return (
    <>
      <section className="sm-card dark">
        <div className="sm-row">
          <ChinhDien id={m.chinh_dien_hinh} size={64} />
          <div className="sm-grow">
            <div className="sm-row" style={{ gap: 6 }}>
              <HuyHieu id={m.huy_hieu} size={28} />
              <h2 className="sm-clip">{m.ten}</h2>
            </div>
            <p style={{ fontSize: 15 }}>
              {tr(`${m.n}/${SM_CFG.mon.toiDa} người · giữ ${m.o}/${m.o_max} ô`, `${m.n}/${SM_CFG.mon.toiDa} members · ${m.o}/${m.o_max} tiles`)}
              {hang > 0 && tr(` · hạng ${hang}`, ` · rank ${hang}`)}
            </p>
            <p className="sm-note">
              {chucTen(m.chuc)} · {tr('Lực chiến ', 'Power ')}
              <b>{fmtN(st.lc ?? 0)}</b>
            </p>
          </div>
        </div>
        <div className="sm-row">
          <button className="sm-btn small sm-ghost sm-grow" style={{ color: 'var(--gold-l)', borderColor: '#8a6a3d' }} onClick={() => c.go('ky')}>
            {tr('Xếp hạng Kỷ', 'Era ranking')}
          </button>
          <button className="sm-btn small sm-ghost sm-grow" style={{ color: 'var(--gold-l)', borderColor: '#8a6a3d' }} onClick={() => c.go('luc-chien')}>
            {tr('Lực chiến', 'Power')}
          </button>
        </div>
      </section>

      {m.cam_co && <LanhTho c={c} />}

      {m.moi_bh_toi && new Date(m.moi_bh_toi).getTime() > now && (
        <section className="sm-card sm-bh">
          <b>{tr(`Môn mới được bảo hộ, lâu nhất tới ${mocGio(m.moi_bh_toi, now)}`, `New-sect protection, at most until ${mocGio(m.moi_bh_toi, now)}`)}</b>
          <p style={{ fontSize: 15 }}>{tr('Ô cắm cờ được bảo hộ 48 giờ. Ô chiếm thêm được ít dần: ô 2 được 24 giờ, ô 3 được 12 giờ, ô 4 được 6 giờ, từ ô 5 thì không. Chạm ô trên bản đồ để xem còn bao lâu. Xuất chinh vào ô có chủ thì mất hết bảo hộ ngay.', 'The flag tile is protected 48 hours; later tiles get 24, 12, 6 hours, none from the 5th. Tap a tile on the map to see. Marching on an owned tile ends all protection at once.')}</p>
        </section>
      )}

      {!m.du_ky && (
        <section className="sm-card warn">
          <b>{tr(`Cần ${SM_CFG.mon.kyCan} đạo hữu ký cùng lập · đã có ${m.so_ky}/${SM_CFG.mon.kyCan}`, `Needs ${SM_CFG.mon.kyCan} co-signers · ${m.so_ky}/${SM_CFG.mon.kyCan}`)}</b>
          <p style={{ fontSize: 15 }}>
            {tr(`Còn ${clock(new Date(m.het_han_ky).getTime() - now)}. Hết giờ chưa đủ thì môn tự giải tán. Ai có chân thân và tài khoản cũng ký được, không cần đủ kiếp.`, `${clock(new Date(m.het_han_ky).getTime() - now)} left, or the sect disbands. Anyone with a true self and an account can sign.`)}
          </p>
          {/* 17/11 (Tyler: 2 người ký có vẻ khó): gửi link, người bấm link thấy môn này ghim đầu danh sách với nút Ký cùng lập */}
          <button className="sm-btn main wide" onClick={() => nhoKy()}>
            {tr('Gửi link nhờ đạo hữu ký', 'Send a co-sign link')}
          </button>
        </section>
      )}
      {!m.cam_co && m.chuc !== 'de' && (
        <section className="sm-card warn">
          <b>{tr('Môn chưa cắm cờ', 'No flag planted yet')}</b>
          <p style={{ fontSize: 15 }}>{tr('Chọn một ô trống trên bản đồ để có lãnh thổ đầu tiên.', 'Pick an empty tile to get your first land.')}</p>
          <button className="sm-btn dark wide" onClick={() => c.go('chon-o')}>
            {tr('Chọn ô cắm cờ', 'Pick a tile')}
          </button>
        </section>
      )}

      <SmBaCau c={c} anDuoc />
      {bi.map((b) => (
        <button key={b.id} className="sm-card alert" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', minHeight: 44 }} onClick={() => c.go('chien-su')}>
          <span className="sm-between" style={{ width: '100%' }}>
            <b>{tr(`${b.tu_mon} đang tới ${b.ten_o}`, `${b.tu_mon} is marching on ${b.ten_o}`)}</b>
            <b className="sm-clock">{clock(new Date(b.toi_noi_luc).getTime() - now)} ›</b>
          </span>
        </button>
      ))}
      {chinh && (
        <button className="sm-card" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', minHeight: 44 }} onClick={() => c.go('xuat-chinh')}>
          <span className="sm-between" style={{ width: '100%' }}>
            <b>
              {chinh.trang_thai === 'tap_hop' ? tr(`Tập hợp đánh ${chinh.ten_o}`, `Gathering for ${chinh.ten_o}`) : tr(`Đang đi đánh ${chinh.ten_o}`, `Marching on ${chinh.ten_o}`)}
              {chinh.ta_theo ? tr(' · ngươi đã theo', ' · you joined') : ''}
            </b>
            <b className="sm-clock">{clock(new Date(chinh.trang_thai === 'tap_hop' ? chinh.tap_hop_toi : chinh.toi_noi_luc).getTime() - now)} ›</b>
          </span>
        </button>
      )}

      <section className="sm-card">
        <div className="sm-between">
          <h3>{tr(`Điểm danh · chuỗi ${Math.min(dd.chuoi, 7)}/7 ngày`, `Check-in · streak ${Math.min(dd.chuoi, 7)}/7`)}</h3>
        </div>
        <ChuoiO n={Math.min(dd.chuoi, 7)} />
        <p className="sm-note">{dd.da_thuong ? tr('Kỷ này đã nhận ngoại trang chuỗi 7 ngày.', 'Streak outfit already claimed this era.') : tr('Đủ 7 ngày liền tặng một ngoại trang chân thân.', '7 days in a row gives a true-self outfit.')}</p>
        <Msg err={err} ok={ok} />
        {dd.hom_nay ? (
          <p className="sm-ok">{tr('Hôm nay đã điểm danh. Mai quay lại sau 5:00.', 'Checked in today. Come back after 5:00.')}</p>
        ) : (
          <button className="sm-btn main wide" disabled={c.busy} onClick={diemDanh}>
            {tr('ĐIỂM DANH', 'CHECK IN')}
          </button>
        )}
      </section>

      {nv && chuNv && (
        <section className="sm-card">
          <div className="sm-between">
            <h3>{tr('Nhiệm vụ hôm nay', "Today's tasks")}</h3>
            <span className="sm-note">{tr('làm trong kiếp, đổi lúc 5:00', 'done in lives, resets 5:00')}</span>
          </div>
          {[0, 1, 2].map((i) => {
            const xong = nv.xong[i];
            const tien =
              i === 0
                ? tr(`đã xong ${Math.min(nv.kiep, nv.muc[0])}/${nv.muc[0]} kiếp hôm nay`, `${Math.min(nv.kiep, nv.muc[0])}/${nv.muc[0]} lives today`)
                : i === 1
                  ? tr(`kiếp tốt nhất hôm nay: ${nv.tuoi} tuổi`, `best life today: age ${nv.tuoi}`)
                  : tr(`cảnh giới cao nhất hôm nay: ${canhTen(nv.canh)}`, `best realm today: ${canhTen(nv.canh)}`);
            return (
              <div key={i} className={`sm-nv${xong ? ' done' : ''}`}>
                <span className="tick" aria-label={xong ? tr('đã xong', 'done') : tr('chưa xong', 'not done')}>
                  {xong ? '✓' : ''}
                </span>
                <div className="sm-grow">
                  {chuNv[i]}
                  {!xong && <div className="sm-note">{tien}</div>}
                </div>
                <span className="sm-plus">+{nv.thuong[i]}</span>
              </div>
            );
          })}
          {dd.hom_nay ? (
            <Link href="/choi" className="sm-btn main wide">
              {tr('Vào kiếp làm nhiệm vụ', 'Play a life for the tasks')}
            </Link>
          ) : (
            <Link href="/choi" className="sm-btn wide">
              {tr('Vào kiếp làm nhiệm vụ', 'Play a life for the tasks')}
            </Link>
          )}
          <p className="sm-note">{tr('Kiếp khép lại là nhiệm vụ tự xong, không cần bấm nhận.', 'Tasks complete themselves when a life ends.')}</p>
        </section>
      )}

      <section className="sm-card">
        <div className="sm-between">
          <h3>{tr('Khí vận cả môn hôm nay', "Sect fortune today")}</h3>
          <b style={{ fontSize: 20 }}>
            {kv} / {moc2}
          </b>
        </div>
        <div className="sm-bar" role="meter" aria-valuemin={0} aria-valuemax={moc2} aria-valuenow={kv} aria-label={tr('Khí vận', 'Fortune')}>
          <i style={{ width: pct(kv) }} />
          <s style={{ left: pct(moc1) }} />
        </div>
        <div className="sm-marks" aria-hidden>
          <span style={{ left: pct(moc1) }}>{moc1}</span>
          <span style={{ left: 'calc(100% - 8px)' }}>{moc2}</span>
        </div>
        <p style={{ fontSize: 15 }}>{tr(`Đạt ${moc1}: +10% Lực chiến · Đạt ${moc2}: +20%`, `Reach ${moc1}: +10% power · Reach ${moc2}: +20%`)}</p>
        <p className="sm-note">{tr('Tác dụng từ 5:00 sáng mai tới 5:00 hôm sau, cho cả đánh lẫn giữ ô.', 'Applies from 5:00 tomorrow for a day, attack and defence.')}</p>
        <p className="sm-note">
          {tr(`Ngươi góp ${gop} hôm nay.`, `You gave ${gop} today.`)}
          {m.kv_bonus > 0 ? tr(` Hôm nay môn đang được +${Math.round(m.kv_bonus * 100)}% (Khí vận hôm qua ${m.kv_hom_qua}).`, ` Today the sect has +${Math.round(m.kv_bonus * 100)}% (yesterday ${m.kv_hom_qua}).`) : ''}
        </p>
      </section>
      <DongMinh />
    </>
  );
}

/** 18/11 (Tyler: người chơi không biết mở rộng ô): thẻ lãnh thổ ở môn nhà, đếm ô đã giữ và đất trống kề bên, nút khai hoang */
function LanhTho({ c }: { c: SmCtx }) {
  const m = c.st.mon!;
  const kh = khaiDuoc(c.st, c.map);
  const con = m.o < m.o_max;
  return (
    <section className={con && kh.size ? 'sm-card sm-kh-tip' : 'sm-card'}>
      <div className="sm-between">
        <h3>{tr(`Lãnh thổ ${m.o}/${m.o_max} ô`, `Land ${m.o}/${m.o_max} tiles`)}</h3>
        <span className="sm-o-pips" aria-hidden>
          {Array.from({ length: m.o_max }, (_, i) => (
            <i key={i} className={i < m.o ? 'on' : ''} />
          ))}
        </span>
      </div>
      {con ? (
        <>
          <p style={{ fontSize: 15 }}>
            {c.map
              ? kh.size
                ? tr(`Còn ${m.o_max - m.o} ô chưa dùng. Quanh lãnh thổ có ${kh.size} ô đất trống: khai hoang là cắm cờ ngay, không phải đánh ai. Ai trong môn cũng làm được.`, `${m.o_max - m.o} tiles unused. ${kh.size} empty tiles border our land: claim them at once, no fighting. Any member can.`)
                : tr('Quanh lãnh thổ hết đất trống. Muốn thêm ô thì trinh sát rồi xuất chinh giành ô của môn khác.', 'No empty land next to ours. Scout and march to take tiles from other sects.')
              : tr(`Còn ${m.o_max - m.o} ô chưa dùng. Khai hoang ô trống kề lãnh thổ là cắm cờ ngay, không phải đánh ai.`, `${m.o_max - m.o} tiles unused. Claim empty land next to ours at once, no fighting.`)}
          </p>
          <button className="sm-btn main wide" onClick={() => (track('sm_kh_mo', { o: m.o, max: m.o_max, n: kh.size }), c.go('ban-do'))}>
            {tr('KHAI HOANG THÊM ĐẤT', 'CLAIM MORE LAND')}
          </button>
        </>
      ) : (
        <p style={{ fontSize: 15 }}>{duOCau(c.st)}</p>
      )}
    </section>
  );
}
