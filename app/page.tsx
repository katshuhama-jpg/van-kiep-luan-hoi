'use client';

import Link from 'next/link';
import Sprite from '@/components/Sprite';
import MusicToggle from '@/components/MusicToggle';
import LangToggle from '@/components/LangToggle';
import { signOut } from '@/lib/auth';
import { demoChar } from '@/lib/game/demo';
import { displayName } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { useEffect, useState } from 'react';
import ReleaseNotice, { firstVisit, markSeenLocal, needNotice } from '@/components/Release';
import { CURRENT_VERSION } from '@/lib/releases';
import LoiDaiButton from '@/components/LoiDaiButton';
import { tr } from '@/lib/i18n';
import { ContinueBar, LiveWorld } from '@/components/LiveWorld';
import { HomeVanKiep } from '@/components/TangKiep';

const SHOW = [
  demoChar({ lookSeed: 2, age: 9, lifespan: 70, realm: 0, gender: 'nu', equipped: { ao: 'ao_vai' } }),
  demoChar({ lookSeed: 13, age: 40, realm: 3, path: 'phat', daoTam: 60, equipped: { ao: 'ca_sa', vu_khi: 'phat_tran' } }),
  demoChar({ lookSeed: 1, age: 80, lifespan: 400, realm: 4, path: 'kiem', equipped: { ao: 'tu_kim_bao', phu_kien: 'kiem_bay' } }),
  demoChar({ lookSeed: 10, age: 60, realm: 3, path: 'ma', daoTam: -90, gender: 'nu', equipped: { ao: 'huyet_bao', vu_khi: 'huyet_dao' } }),
  demoChar({ lookSeed: 8, age: 350, lifespan: 400, realm: 3, daoTam: 20, equipped: { ao: 'bach_y' } }),
];

const link = { textDecoration: 'none', display: 'block' } as const;

export default function Home() {
  const { user, ready, enabled } = useAuth();
  const [rel, setRel] = useState(false);
  useEffect(() => {
    // người vào lần đầu chưa cần đọc cáo thị bản mới: ghi nhận đã xem, bản sau mới hiện
    if (firstVisit()) markSeenLocal();
    else if (needNotice()) setRel(true);
  }, []);
  return (
    <main className="app title-screen has-bar">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: -10 }}>
        <LangToggle />
        <MusicToggle />
      </div>
      <h1 className="logo">
        
        {tr("Vạn Kiếp", "Ten Thousand")}
        <br />
        
        {tr("Luân Hồi", "Rebirths")}
        <small>{tr("Một kiếp người, vạn con đường tu tiên", "One life, ten thousand paths to immortality")}</small>
      </h1>

      <div className="showcase" aria-label={tr("Các hình dạng nhân vật", "Character appearances")}>
        {SHOW.map((c, i) => (
          <Sprite key={i} c={c} size={i === 2 ? 96 : 68} />
        ))}
      </div>

      <LiveWorld user={user} />
      <HomeVanKiep user={user} ready={ready} />

      <div className="menu">
        <Link href="/choi" className="btn btn-red btn-big" style={link}>
          
          {tr("Vào luân hồi", "Enter the Cycle")}
        </Link>
        {ready && !user && <small className="guest-note">{tr("Chơi ngay, chưa cần tài khoản", "Play now, no account needed")}</small>}
        <LoiDaiButton />
        <Link href="/bang-xep-hang" className="btn" style={link}>
          
          {tr("Bảng xếp hạng", "Leaderboard")}
        </Link>
        <Link href="/tang-kiep-cac" className="btn" style={link}>
          {tr("Tàng Kiếp Các", "Hall of Past Lives")}
        </Link>
        <Link href="/nghia-trang" className="btn" style={link}>
          
          {tr("Nghĩa trang tu sĩ", "Cultivators' Cemetery")}
        </Link>
        <Link href="/gop-y" className="btn" style={link}>
          
          {tr("Góp ý tính năng", "Feature requests")}
        </Link>
        <Link href="/cap-nhat" className="btn" style={link}>
          
          {tr("Lịch sử cập nhật ", "Update history ")}<small className="ver-tag">{tr("bản ", "ver ")}{CURRENT_VERSION}</small>
        </Link>
        <Link href="/tac-gia" className="btn" style={link}>
          
          {tr("Tác giả hình ảnh", "Art credits")}
        </Link>
        {ready && enabled && !user && (
          <Link href="/dang-nhap" className="btn btn-dark" style={link}>
            
            {tr("Đăng nhập / Đăng ký", "Log in / Sign up")}
          </Link>
        )}
        {user && (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              
              {tr("Đạo hữu ", "Fellow Daoist ")}<b style={{ fontWeight: 700, color: 'var(--red-d)' }}>{displayName(user)}</b>
            </span>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => signOut()}>
              
              {tr("Đăng xuất", "Log out")}
            </button>
          </div>
        )}
      </div>

      <section className="panel" style={{ textAlign: 'left' }}>
        <h2>{tr("Cách chơi", "How to play")}</h2>
        <p style={{ margin: 0 }}>
          
          {tr("Bạn đầu thai ngẫu nhiên: linh căn, xuất thân, giới tính đều do trời định. Thời gian tự trôi, mỗi năm chọn một trọng tâm. Gặp kỳ ngộ thì có 4 lựa chọn, mỗi lựa chọn đẩy Đạo tâm về phía Chính hoặc Tà. Lên Luyện Khí tầng 5 sẽ chọn con đường tu tập. Hết thọ nguyên thì chết, để lại bia mộ và mang phúc duyên sang kiếp sau.", "You are reborn at random: spiritual root, origin and gender are all decided by Heaven. Time flows on its own, and each year you pick a Focus. Fortuitous encounters offer 4 choices, each pushing your Dao Heart toward Righteous or Evil. At Qi Refining Layer 5 you choose your Path. When your lifespan runs out you die, leave a tombstone, and carry your Fortune into the next life.")}
        </p>
      </section>
      <ContinueBar user={user} ready={ready} />
      {rel && <ReleaseNotice onClose={() => setRel(false)} />}
    </main>
  );
}
