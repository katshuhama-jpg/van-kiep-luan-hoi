'use client';

import BackButton from '@/components/BackButton';
import MoiTra from '@/components/MoiTra';
import { tr } from '@/lib/i18n';

export default function MoiTraPage() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            {tr('Mời trà', 'Tea')}
          </span>
          <span className="meta">{tr('Ngộ đạo trà quán', 'Enlightenment Teahouse')}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <MoiTra />
    </main>
  );
}
