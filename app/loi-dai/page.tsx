'use client';

import BackButton from '@/components/BackButton';
import Arena from '@/components/Arena';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

/** Lôi đài hằng ngày: trang riêng, mở từ trang đầu và menu trong game */
export default function LoiDai() {
  const { user, ready } = useAuth();
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            
            {tr("Lôi đài", "Arena")}
          </span>
          <span className="meta">{tr("Mỗi ngày ba trận, mỗi tuần một bá chủ", "Three matches a day, one champion a week")}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      {ready ? <Arena user={user} /> : <p>{tr("Đang dựng lôi đài...", "Setting up the arena...")}</p>}
    </main>
  );
}
