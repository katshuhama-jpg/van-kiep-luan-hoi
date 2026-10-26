'use client';

import BackButton from '@/components/BackButton';
import Arena from '@/components/Arena';
import { useAuth } from '@/lib/useAuth';

/** Lôi đài hằng ngày: trang riêng, mở từ trang đầu và menu trong game */
export default function LoiDai() {
  const { user, ready } = useAuth();
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Lôi đài
          </span>
          <span className="meta">Mỗi ngày ba trận, mỗi tuần một bá chủ</span>
          <BackButton fallback="/" />
        </div>
      </header>
      {ready ? <Arena user={user} /> : <p>Đang dựng lôi đài...</p>}
    </main>
  );
}
