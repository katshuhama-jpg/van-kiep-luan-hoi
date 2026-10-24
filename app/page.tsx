'use client';

import Link from 'next/link';
import Sprite from '@/components/Sprite';
import { signOut } from '@/lib/auth';
import { demoChar } from '@/lib/game/demo';
import { displayName } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const SHOW = [
  demoChar({ age: 9, lifespan: 70, realm: 0, gender: 'nu', equipped: { ao: 'ao_vai' } }),
  demoChar({ age: 40, realm: 3, path: 'phat', daoTam: 60, equipped: { ao: 'ca_sa', vu_khi: 'phat_tran' } }),
  demoChar({ age: 80, lifespan: 400, realm: 4, path: 'kiem', equipped: { ao: 'tu_kim_bao', phu_kien: 'kiem_bay' } }),
  demoChar({ age: 60, realm: 3, path: 'ma', daoTam: -90, gender: 'nu', equipped: { ao: 'huyet_bao', vu_khi: 'huyet_dao' } }),
  demoChar({ age: 350, lifespan: 400, realm: 3, daoTam: 20, equipped: { ao: 'bach_y' } }),
];

const link = { textDecoration: 'none', display: 'block' } as const;

export default function Home() {
  const { user, ready, enabled } = useAuth();
  return (
    <main className="app title-screen">
      <h1 className="logo">
        Vạn Kiếp
        <br />
        Luân Hồi
        <small>Một kiếp người, vạn con đường tu tiên</small>
      </h1>

      <div className="showcase" aria-label="Các hình dạng nhân vật">
        {SHOW.map((c, i) => (
          <Sprite key={i} c={c} size={i === 2 ? 96 : 68} />
        ))}
      </div>

      <div className="menu">
        <Link href="/choi" className="btn btn-red btn-big" style={link}>
          Vào luân hồi
        </Link>
        <Link href="/bang-xep-hang" className="btn" style={link}>
          Bảng xếp hạng
        </Link>
        <Link href="/nghia-trang" className="btn" style={link}>
          Nghĩa trang tu sĩ
        </Link>
        {ready && enabled && !user && (
          <Link href="/dang-nhap" className="btn btn-dark" style={link}>
            Đăng nhập / Đăng ký
          </Link>
        )}
        {user && (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              Đạo hữu <b style={{ fontWeight: 400, color: 'var(--red-d)' }}>{displayName(user)}</b>
            </span>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => signOut()}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      <section className="panel" style={{ textAlign: 'left' }}>
        <h2>Cách chơi</h2>
        <p style={{ margin: 0 }}>
          Bạn đầu thai ngẫu nhiên: linh căn, xuất thân, giới tính đều do trời định. Thời gian tự trôi, mỗi năm chọn một trọng tâm. Gặp kỳ ngộ thì có 4 lựa chọn, mỗi lựa chọn đẩy Đạo tâm về phía Chính hoặc Tà. Lên Trúc Cơ sẽ chọn con đường tu tập. Hết thọ nguyên thì chết, để lại bia mộ và mang phúc duyên sang kiếp sau.
        </p>
      </section>
    </main>
  );
}
