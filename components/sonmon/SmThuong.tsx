'use client';

/**
 * Ngày 8a: màn "Phần thưởng Kỷ" (mở từ thẻ môn và Xếp hạng Kỷ) + bảng "Công đóng góp" (tab Thành viên).
 * Một lệnh vkl_sm_cong_bang cho cả hai, giữ 60 giây trong bộ nhớ để môn nhà, Thành viên, Phần thưởng không gọi lại.
 */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmApi, SmBvNhan, SmCongBang } from '@/lib/sonmon/api';
import { BaoVatHinh, BV_LOAI, BV_PHAM, bvLoai, bvPham } from './BaoVat';
import { bvFxText, bvTen } from '@/lib/sonmon/baoVat';
import { ngayThang, hhmm, type SmCtx } from './ui';

let nho: { t: number; v: SmCongBang | null; api: SmApi } | null = null;
export function useCongBang(api: SmApi): SmCongBang | null | undefined {
  const [v, setV] = useState<SmCongBang | null | undefined>(() => (nho && nho.api === api && Date.now() - nho.t < 60_000 ? nho.v : undefined));
  useEffect(() => {
    if (nho && nho.api === api && Date.now() - nho.t < 60_000) return;
    let live = true;
    api.congBang().then((x) => {
      nho = { t: Date.now(), v: x, api };
      if (live) setV(x);
    });
    return () => {
      live = false;
    };
  }, [api]);
  return v;
}

const phamTheoHang = (h: number | null | undefined) => (h == null ? null : h === 1 ? 'than' : h === 2 ? 'tien' : h === 3 ? 'linh' : h <= 10 ? 'bao' : 'pham');
const LOAI7 = BV_LOAI.slice(0, 7);

/** 19/11 (Tyler: danh sách thưởng phải ngay ngắn như sàn thương mại điện tử): thẻ món hình vuông bằng nhau */
function BvThe({ loai, pham, tag, ten, ta = false, mo = false }: { loai: string; pham: string; tag?: string; ten?: string; ta?: boolean; mo?: boolean }) {
  const ph = bvPham(pham);
  return (
    <div className={`sm-shop-it${ta ? ' ta' : ''}${mo ? ' mo' : ''}`}>
      <div className="sm-shop-img" style={{ borderColor: ph.vien }}>
        {tag && <i className="sm-shop-tag">{tag}</i>}
        <BaoVatHinh loai={loai} pham={pham} size={44} />
      </div>
      <b className="sm-shop-n" style={{ color: ph.id === 'pham' ? undefined : ph.chu }}>
        {ten ?? tr(bvLoai(loai).vi, bvLoai(loai).en)}
      </b>
      <small className="sm-shop-fx">{bvFxText(loai, pham, true)}</small>
    </div>
  );
}

export function SmThuong({ c }: { c: SmCtx }) {
  const d = useCongBang(c.api);
  useEffect(() => track('sm_thuong_mo', {}), []);
  const kyId = c.st.ky?.id ?? 1;
  if (d === undefined) return <p className="sm-note">{tr('Đang xem phần thưởng...', 'Loading rewards...')}</p>;
  if (!d || !d.ky)
    return (
      <section className="sm-card">
        <p>{tr('Chưa xem được phần thưởng. Thử lại sau ít phút.', 'Rewards are not available yet. Try again shortly.')}</p>
      </section>
    );
  const ta = d.ta;
  const nhan = d.nhan ?? [];
  const can = d.can ?? 10;
  const phMon = phamTheoHang(d.mon_hang ?? null) ?? 'pham';
  const ds = d.ds ?? [];
  const thu7 = ds.filter((x) => x.cong >= can)[6];
  const ket = `21:00 ${ngayThang(d.ky.ket_thuc)}`;
  const lyDo: string[] = [];
  if (ta && !nhan.length) {
    if (!d.mon_du) lyDo.push(tr('Môn cần đủ chữ ký và từ 3 người mới có thưởng.', 'The sect needs its signatures and at least 3 members.'));
    if (ta.cong < can) lyDo.push(tr(`Ngươi có ${ta.cong} Công, cần ${can} mới vào danh sách nhận.`, `You have ${ta.cong} merit; ${can} are needed to qualify.`));
    if (!ta.vao_som) lyDo.push(tr(`Ngươi vào môn sau ${hhmm(d.ky.khoa)} ngày ${ngayThang(d.ky.khoa)}, Kỷ này chưa được tính.`, `You joined after ${hhmm(d.ky.khoa)} ${ngayThang(d.ky.khoa)}, so this era does not count.`));
    if (d.tk_du === false) lyDo.push(tr('Tài khoản cần từ 7 ngày tuổi lúc kết Kỷ.', 'Your account must be at least 7 days old when the era ends.'));
    if (!lyDo.length && thu7) lyDo.push(tr(`Ngươi đang hạng ${ta.hang} Công. Top 7 mới có vũ khí, thêm khoảng ${Math.max(1, thu7.cong - ta.cong + 1)} Công là vào.`, `You rank ${ta.hang} in merit. Only the top 7 get weapons; about ${Math.max(1, thu7.cong - ta.cong + 1)} more merit gets you in.`));
  }
  return (
    <>
      <section className="sm-card dark">
        <h2>{tr(`Phần thưởng Kỷ ${kyId}`, `Era ${kyId} rewards`)}</h2>
        <p className="sm-note">
          {tr(
            `Thưởng chỉ phát một lần, lúc Kỷ khép lại (${ket}), không phát trong Kỷ. Ba môn đứng đầu nhận pháp bảo phẩm cao, bảy người nhiều Công nhất mỗi môn nhận vũ khí, môn chủ nhận thêm ấn. Pháp bảo có chỉ số, lắp vào chân thân, dùng mãi.`,
            `Rewards are handed out once, when the era closes (${ket}), not during it. Top sects get higher grades; the 7 members with the most merit in each sect get weapons; the leader also gets a seal. Treasures carry stats, go on your true self, and last forever.`,
          )}
        </p>
      </section>

      <section className={nhan.length ? 'sm-card sm-bv-nhan' : 'sm-card'}>
        <h3>{tr('Dự kiến phần thưởng cuối Kỷ', 'Expected end-of-era reward')}</h3>
        {nhan.length ? (
          <>
            <p style={{ fontSize: 15 }}>{tr(`Giữ được hạng như bây giờ thì ${ket} ngươi nhận:`, `Hold your current rank and at ${ket} you receive:`)}</p>
            <div className="sm-shop c2">
              {nhan.map((x) => (
                <BvThe key={x.o} loai={x.loai} pham={x.pham} tag={x.o === 'phu_kien' ? tr('Phụ kiện', 'Trinket') : tr('Vũ khí', 'Weapon')} ten={x.ten ?? bvTen(x.loai, x.pham)} />
              ))}
            </div>
          </>
        ) : !ta ? (
          <p style={{ fontSize: 15 }}>{tr('Vào một môn để có Công và phần thưởng.', 'Join a sect to earn merit and rewards.')}</p>
        ) : (
          <>
            <p style={{ fontSize: 15 }}>{tr(`Theo hạng bây giờ, ${ket} ngươi chưa có phần.`, `At your current rank, you get nothing at ${ket}.`)}</p>
            {lyDo.map((l) => (
              <p key={l} className="sm-why">
                {l}
              </p>
            ))}
          </>
        )}
        {ta && (
          <p className="sm-note">
            {tr(`Ngươi: ${ta.cong} Công, hạng ${ta.hang} trong môn.`, `You: ${ta.cong} merit, rank ${ta.hang} in the sect.`)}
            {d.mon_hang ? tr(` Môn đang hạng ${d.mon_hang}: ${bvPham(phMon).vi}.`, ` Sect rank ${d.mon_hang}: ${bvPham(phMon).en}.`) : ''}
          </p>
        )}
      </section>

      <section className="sm-card">
        <h3>{tr('Vũ khí theo hạng Công trong môn', 'Weapon by merit rank')}</h3>
        <p className="sm-note">{tr('Mỗi hạng một loại, nhìn vũ khí là biết ai đứng thứ mấy.', 'One kind per rank, so the weapon shows where you stand.')}</p>
        <div className="sm-shop">
          {LOAI7.map((l, i) => (
            <BvThe key={l.id} loai={l.id} pham={phMon} tag={tr(`Hạng ${i + 1}`, `#${i + 1}`)} ta={!!ta && ta.hang === i + 1 && ta.cong >= can} />
          ))}
          <BvThe loai="tran_mon_kiem" pham={phMon} tag={tr('Môn chủ', 'Leader')} ten={tr('Trấn Môn Kiếm', 'Guardian Sword')} />
          <BvThe loai="an" pham={phMon} tag={tr('Môn chủ', 'Leader')} ten={tr('Chưởng Môn Ấn', 'Sect Seal')} />
        </div>
        <p className="sm-note">
          {tr('Môn chủ luôn nhận Chưởng Môn Ấn. Môn chủ ngoài top 7 nhận Trấn Môn Kiếm thay vũ khí theo hạng, top 7 còn 6 suất.', 'The leader always gets the Sect Seal. A leader outside the top 7 gets the Guardian Sword instead, leaving 6 slots.')}
        </p>
      </section>

      <section className="sm-card">
        <h3>{tr('Phẩm theo hạng môn', 'Grade by sect rank')}</h3>
        <div className="sm-shop c5">
          {BV_PHAM.map((p, i) => (
            <div key={p.id} className={`sm-shop-it${p.id === phMon && d.mon_hang ? ' ta' : ''}`}>
              <div className="sm-shop-img" style={{ borderColor: p.vien }}>
                <BaoVatHinh loai="kiem" pham={p.id} size={26} />
              </div>
              <b className="sm-shop-n" style={{ color: p.id === 'pham' ? undefined : p.chu }}>{tr(p.vi.replace(' phẩm', ''), p.en)}</b>
              <small className="sm-shop-fx">{[tr('Hạng 1', '#1'), tr('Hạng 2', '#2'), tr('Hạng 3', '#3'), tr('Hạng 4-10', '#4-10'), tr('Từ 11', '#11+')][i]}</small>
            </div>
          ))}
        </div>
        <p className="sm-note">
          {tr(
            'Phẩm càng cao chỉ số càng lớn: Thần gấp 5 lần Phàm. Pháp bảo không mất tác dụng: lắp vào ô Vũ khí, Phụ kiện của chân thân (tab Nhân vật) để cộng Tu vi.',
            'Higher grades carry bigger stats: Divine is 5x Mortal. Treasures never expire: equip them in your true self’s Weapon and Trinket slots (Character tab) to raise cultivation.',
          )}
        </p>
      </section>

      <section className="sm-card">
        <h3>{tr('Kiếm Công thế nào', 'How to earn merit')}</h3>
        <table className="sm-table sm-bv-cong">
          <tbody>
            {[
              [tr('Điểm danh', 'Check in'), '+1', ta?.dd],
              [tr('Nhiệm vụ ngày', 'Daily tasks'), '+2/3/5', ta?.nv],
              [tr('Khai hoang một ô', 'Claim a tile'), '+3', ta?.kh],
              [tr('Theo xuất chinh (thắng thêm +3)', 'Join a march (+3 more on win)'), '+3', ta?.xc],
              [tr('Đứng giữ ô của môn, mỗi 6 giờ', 'Guard a sect tile, per 6 hours'), '+1', ta?.giu],
            ].map(([a, b, n]) => (
              <tr key={String(a)}>
                <td>{a}</td>
                <td className="num">{b}</td>
                <td className="num">{n != null ? tr(`ta: ${n}`, `me: ${n}`) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="sm-note">
          {tr(
            `Mỗi ngày tính tối đa 20 Công. Cần từ ${can} Công, vào môn trước ${hhmm(d.ky.khoa)} ngày ${ngayThang(d.ky.khoa)}, tài khoản từ 7 ngày tuổi. Công tính trong môn ngươi đang ở lúc kết Kỷ.`,
            `At most 20 merit per day. Need ${can}+ merit, joined before ${hhmm(d.ky.khoa)} ${ngayThang(d.ky.khoa)}, account 7+ days old. Merit counts for the sect you are in when the era ends.`,
          )}
        </p>
        {c.st.mon && (
          <button className="sm-btn wide" onClick={() => c.go('thanh-vien')}>
            {tr('Xem bảng Công trong môn', 'See the sect merit board')}
          </button>
        )}
      </section>
    </>
  );
}

/** Tab Thành viên: bảng Công đóng góp (top 7 viền vàng, mình được làm nổi) */
export function SmCongDs({ c }: { c: SmCtx }) {
  const d = useCongBang(c.api);
  const [mo, setMo] = useState(false);
  if (!d || !d.ds?.length) return null;
  const can = d.can ?? 10;
  const ds = mo ? d.ds : d.ds.slice(0, 7).concat(d.ds.slice(7).filter((x) => x.ta));
  return (
    <section className="sm-card">
      <div className="sm-between">
        <h3>{tr('Công đóng góp', 'Merit')}</h3>
        <button className="sm-btn small sm-ghost" onClick={() => c.go('thuong')}>
          {tr('Phần thưởng', 'Rewards')}
        </button>
      </div>
      <p className="sm-note">{tr(`Kết Kỷ, 7 người nhiều Công nhất (từ ${can} Công) nhận vũ khí.`, `At era end, the top 7 by merit (${can}+) get weapons.`)}</p>
      <ol className="sm-cong-ds">
        {ds.map((x) => {
          const vk = x.nhan?.find((n) => n.o === 'vu_khi');
          return (
            <li key={x.tk} className={`${x.hang <= 7 && x.cong >= can ? 'top' : ''} ${x.ta ? 'ta' : ''}`}>
              <span className="h">{x.hang}</span>
              {vk ? <BaoVatHinh loai={vk.loai} pham={vk.pham} size={16} /> : <span style={{ width: 16 }} />}
              <span className="sm-grow sm-clip">
                {x.ta ? tr('Ngươi', 'You') : x.ten}
                {x.chuc === 'chu' ? tr(' · môn chủ', ' · leader') : x.chuc === 'lao' ? tr(' · trưởng lão', ' · elder') : ''}
              </span>
              <b>{x.cong}</b>
            </li>
          );
        })}
      </ol>
      {d.ds.length > ds.length && (
        <button className="sm-btn small wide" onClick={() => setMo(true)}>
          {tr(`Xem đủ ${d.ds.length} người`, `Show all ${d.ds.length}`)}
        </button>
      )}
    </section>
  );
}

/** Thẻ Lãnh thổ ở môn nhà: một dòng "Ngươi đang hạng N Công trong môn" */
export function SmCongDong({ c }: { c: SmCtx }) {
  const d = useCongBang(c.api);
  if (!d?.ta) return null;
  return (
    <button className="sm-linkline" onClick={() => c.go('thuong')}>
      {tr(`Ngươi đang hạng ${d.ta.hang} Công trong môn (${d.ta.cong} Công) ›`, `You rank ${d.ta.hang} in merit (${d.ta.cong}) ›`)}
    </button>
  );
}
