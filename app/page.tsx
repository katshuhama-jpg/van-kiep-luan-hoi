'use client';

import Link from 'next/link';
import MusicToggle from '@/components/MusicToggle';
import LangToggle from '@/components/LangToggle';
import { signOut } from '@/lib/auth';
import { displayName } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { useEffect, useState } from 'react';
import ReleaseNotice, { firstVisit, markSeenLocal, needNotice } from '@/components/Release';
import { CURRENT_VERSION } from '@/lib/releases';
import LoiDaiButton from '@/components/LoiDaiButton';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { ContinueBar, LiveStrip, NewGraves, NewsToast, useLive } from '@/components/LiveWorld';
import { HomeVanKiep } from '@/components/TangKiep';
import { HomeCheckin } from '@/components/HomeCheckin';
import { DailyNote } from '@/components/DailyNote';

const link = { textDecoration: 'none', display: 'block' } as const;

export default function Home() {
  const { user, ready, enabled } = useAuth();
  const [rel, setRel] = useState(false);
  const live = useLive();
  useEffect(() => {
    // người vào lần đầu chưa cần đọc cáo thị bản mới: ghi nhận đã xem, bản sau mới hiện
    if (firstVisit()) markSeenLocal();
    else if (needNotice()) setRel(true);
  }, []);
  return (
    <main className="app title-screen has-bar">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <LangToggle />
        <MusicToggle />
      </div>
      <h1 className={`logo ${tr('', 'logo-en')}`}>
        {tr('Vạn Kiếp Luân Hồi', 'Ten Thousand Rebirths')}
        <small>{tr('Một kiếp người, vạn con đường tu tiên', 'One life, ten thousand paths to immortality')}</small>
      </h1>

      <LiveStrip d={live} />
      <HomeVanKiep user={user} ready={ready} />
      <HomeCheckin user={user} ready={ready} />
      <DailyNote />

      <nav className="menu home-menu" aria-label={tr('Các tính năng', 'Features')}>
        <LoiDaiButton />
        <div className="home-grid">
          <Link href="/bang-xep-hang" className="btn" style={link}>
            {tr('Bảng xếp hạng', 'Leaderboard')}
          </Link>
          <Link href="/tang-kiep-cac" className="btn" style={link}>
            {tr('Tàng Kiếp Các', 'Hall of Lives')}
          </Link>
          <Link href="/nghia-trang" className="btn" style={link}>
            {tr('Nghĩa trang', 'Cemetery')}
          </Link>
          <Link href="/so-sinh-tu" className="btn" style={link}>
            {tr('Sổ Sinh Tử', 'Life & Death')}
          </Link>
          <Link href="/gop-y" className="btn" style={link}>
            {tr('Góp ý', 'Feedback')}
          </Link>
          <Link href="/cap-nhat" className="btn" style={link}>
            {tr('Cập nhật ', 'Updates ')}
            <small className="ver-tag">{CURRENT_VERSION}</small>
          </Link>
        </div>
        <Link href="/moi-tra" className="btn home-tra" style={link} onClick={() => track('tra_open', { from: 'home' })}>
          {tr('Mời tác giả chén trà', 'Buy the author a tea')}
          <small>{tr('game miễn phí, không quảng cáo', 'free, no ads')}</small>
        </Link>
        {ready && enabled && !user && (
          <Link href="/dang-nhap" className="btn btn-dark" style={link}>
            {tr('Đăng nhập / Đăng ký', 'Log in / Sign up')}
          </Link>
        )}
      </nav>

      <NewGraves d={live} user={user} />

      <section className="panel" style={{ textAlign: 'left' }}>
        <h2>{tr("Cách chơi", "How to play")}</h2>
        <p style={{ margin: 0 }}>
          
          {tr("Bạn đầu thai ngẫu nhiên: linh căn, xuất thân, giới tính đều do trời định. Thời gian tự trôi, mỗi năm chọn một trọng tâm. Gặp kỳ ngộ thì có 4 lựa chọn, mỗi lựa chọn đẩy Đạo tâm về phía Chính hoặc Tà. Lên Luyện Khí tầng 5 sẽ chọn con đường tu tập. Hết thọ nguyên thì chết, để lại bia mộ và mang phúc duyên sang kiếp sau.", "You are reborn at random: spiritual root, origin and gender are all decided by Heaven. Time flows on its own, and each year you pick a Focus. Fortuitous encounters offer 4 choices, each pushing your Dao Heart toward Righteous or Evil. At Qi Refining Layer 5 you choose your Path. When your lifespan runs out you die, leave a tombstone, and carry your Fortune into the next life.")}
        </p>
      </section>
      <div className="home-foot">
        {user && (
          <span>
            {tr('Đạo hữu ', 'Fellow Daoist ')}
            <b>{displayName(user)}</b> ·{' '}
            <button className="linklike" onClick={() => signOut()}>
              {tr('Đăng xuất', 'Log out')}
            </button>{' '}
            ·{' '}
          </span>
        )}
        <Link href="/tac-gia">{tr('Tác giả hình ảnh', 'Art credits')}</Link>
      </div>
      <NewsToast d={live} />
      <ContinueBar user={user} ready={ready} guest={ready && !user} />
      {rel && <ReleaseNotice onClose={() => setRel(false)} />}
    </main>
  );
}
