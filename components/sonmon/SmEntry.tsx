'use client';

/** 4.6.0 Sơn Môn: màn khách chưa liên kết, chưa có chân thân, Kỷ chưa mở. */
import Link from 'next/link';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmState } from '@/lib/sonmon/api';
import { ChinhDien, HuyHieu } from './Pixel';
import { ngayThang, hhmm } from './ui';

function Hero() {
  return (
    <div className="sm-row" style={{ justifyContent: 'center', gap: 6 }} aria-hidden>
      <HuyHieu id={15} size={40} />
      <ChinhDien id={0} size={72} />
      <HuyHieu id={3} size={40} />
    </div>
  );
}

export function SmGuest() {
  return (
    <section className="sm-card dark">
      <Hero />
      <h2>{tr('Liên kết tài khoản để vào môn', 'Link your account to join a sect')}</h2>
      <p>{tr('Sơn môn giữ ở máy chủ, nên cần tài khoản. Liên kết xong, kiếp và chân thân của ngươi vẫn giữ nguyên.', 'Sects live on the server, so you need an account. Your lives and true self stay as they are.')}</p>
      <Link href="/dang-nhap" className="sm-btn main wide" onClick={() => track('sm_link_click')}>
        {tr('Liên kết tài khoản', 'Link account')}
      </Link>
      <p className="sm-note">{tr('Vào môn rồi: điểm danh, làm nhiệm vụ trong kiếp, cùng giữ đất trên bản đồ.', 'In a sect: check in, finish tasks in your lives, hold land together.')}</p>
    </section>
  );
}

export function SmNoCt() {
  return (
    <section className="sm-card dark">
      <Hero />
      <h2>{tr('Cần có chân thân trước', 'You need a true self first')}</h2>
      <p>{tr('Khép lại một kiếp để nhớ lại chân thân. Chân thân theo ngươi qua mọi kiếp và vào được sơn môn.', 'End one life to remember your true self. It follows you through every life and can join a sect.')}</p>
      <Link href="/choi" className="sm-btn main wide">
        {tr('Vào luân hồi', 'Enter the cycle')}
      </Link>
    </section>
  );
}

export function SmChuaMo({ st }: { st: SmState }) {
  const k = st.ky;
  const sau = k && new Date(k.bat_dau).getTime() > Date.now();
  // Ngày 7: Kỷ vừa kết (đã qua giờ kết thúc) thì báo đã kết, không ghi "chưa mở"
  const daKet = !!k && new Date(k.ket_thuc).getTime() <= Date.now();
  if (daKet && k)
    return (
      <section className="sm-card dark">
        <Hero />
        <h2>{tr(`Kỷ ${k.id} đã kết`, `Era ${k.id} has ended`)}</h2>
        <p>{tr(`Kỷ ${k.id} kết lúc ${hhmm(k.ket_thuc)} ngày ${ngayThang(k.ket_thuc)}. Mọi ô đã về trống, tên môn và người trong môn giữ nguyên. Kỷ mới sẽ báo trong mục Cập nhật.`, `Era ${k.id} ended at ${hhmm(k.ket_thuc)} on ${ngayThang(k.ket_thuc)}. All tiles are empty again; sect names and members stay. The next era will be announced in Updates.`)}</p>
        <Link href="/so-sinh-tu" className="sm-btn wide">
          {tr('Xem các môn đứng đầu ở Sổ Sinh Tử', 'See the top sects in the Book of Life and Death')}
        </Link>
        <Link href="/choi" className="sm-btn main wide">
          {tr('Chơi thêm kiếp', 'Play another life')}
        </Link>
      </section>
    );
  return (
    <section className="sm-card dark">
      <Hero />
      <h2>{tr('Kỷ chưa mở', 'The era has not begun')}</h2>
      <p>
        {sau && k
          ? tr(`Kỷ ${k.id} mở lúc ${hhmm(k.bat_dau)} ngày ${ngayThang(k.bat_dau)}.`, `Era ${k.id} opens at ${hhmm(k.bat_dau)} on ${ngayThang(k.bat_dau)}.`)
          : !k
            ? tr('Kỷ 1 mở lúc 5:00 sáng 18/11.', 'Era 1 opens at 5:00 AM on Nov 18.')
            : tr('Kỷ mới sắp mở.', 'A new era opens soon.')}
        {tr(' Trong lúc chờ, chơi thêm kiếp để đủ điều kiện lập môn.', ' Meanwhile, play more lives to be able to found a sect.')}
      </p>
      <p className="sm-note">
        {tr(`Của ngươi: ${st.kiep} kiếp · ${st.ngay} ngày chơi. Lập môn cần ${st.lap_can.kiep} kiếp, ${st.lap_can.ngay} ngày.`, `Yours: ${st.kiep} lives · ${st.ngay} days. Founding needs ${st.lap_can.kiep} lives, ${st.lap_can.ngay} days.`)}
      </p>
      <Link href="/choi" className="sm-btn main wide">
        {tr('Chơi thêm kiếp', 'Play another life')}
      </Link>
    </section>
  );
}
