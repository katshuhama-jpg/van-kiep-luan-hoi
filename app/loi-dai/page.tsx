'use client';

import { ProtectPrompt } from '@/components/GoogleAuth';
import BackButton from '@/components/BackButton';
import Arena from '@/components/Arena';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';
import Link from 'next/link';
import { TAB_ON } from '@/lib/flags';
import { TabBar, TopMenu } from '@/components/TabBar';

/** Lôi đài hằng ngày: trang riêng, mở từ trang đầu và menu trong game */
export default function LoiDai() {
  const { user, ready } = useAuth();
  return (
    <main className={`app${TAB_ON ? ' has-tabs' : ''}`}>
      {TAB_ON && <TopMenu at="ld" />}
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
      {TAB_ON && (
        <Link href="/bang-xep-hang" className="btn" style={{ textDecoration: 'none', display: 'block', minHeight: 44, marginTop: 10 }}>
          {tr('Bảng xếp hạng', 'Leaderboard')}
        </Link>
      )}
      {TAB_ON && <TabBar cur="ld" />}
    <ProtectPrompt at="loidai" />
      </main>
  );
}
