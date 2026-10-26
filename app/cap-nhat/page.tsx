'use client';

import BackButton from '@/components/BackButton';
import { ReleaseBody } from '@/components/Release';
import { RELEASES } from '@/lib/releases';

export default function CapNhat() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Lịch sử cập nhật
          </span>
          <span className="meta">Những lần thiên hạ đổi thay</span>
          <BackButton fallback="/" />
        </div>
      </header>
      {RELEASES.map((r, i) => (
        <section key={r.v} className="panel rel-panel">
          <span className="rel-seal sm" aria-hidden="true">
            {r.v}
          </span>
          <p className="rel-kick">
            Bản {r.v} · {r.date}
            {i === 0 ? ' · mới nhất' : ''}
          </p>
          <h2>{r.title}</h2>
          <ReleaseBody r={r} />
        </section>
      ))}
    </main>
  );
}
