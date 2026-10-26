'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { ReleaseBody } from '@/components/Release';
import { RELEASES } from '@/lib/releases';

/** Lịch sử cập nhật: danh sách gọn theo phiên bản, bấm vào một bản mới xem chi tiết */
export default function CapNhat() {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setV(new URLSearchParams(window.location.search).get('v'));
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  const open = (ver: string | null) => {
    setV(ver);
    window.history.pushState(null, '', ver ? `/cap-nhat?v=${ver}` : '/cap-nhat');
    window.scrollTo(0, 0);
  };
  const r = v ? RELEASES.find((x) => x.v === v) : null;
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            {r ? `Bản ${r.v}` : 'Lịch sử cập nhật'}
          </span>
          <span className="meta">{r ? r.title : 'Những lần thiên hạ đổi thay'}</span>
          {r ? (
            <button className="icon-btn" onClick={() => open(null)} aria-label="Về danh sách phiên bản">
              ‹
            </button>
          ) : (
            <BackButton fallback="/" />
          )}
        </div>
      </header>
      {r ? (
        <section className="panel rel-panel">
          <span className="rel-seal sm" aria-hidden="true">
            {r.v}
          </span>
          <p className="rel-kick">
            Bản {r.v} · {r.date}
            {r === RELEASES[0] ? ' · mới nhất' : ''}
          </p>
          <h2>{r.title}</h2>
          <ReleaseBody r={r} />
          <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => open(null)}>
            ‹ Về danh sách phiên bản
          </button>
        </section>
      ) : (
        <ol className="rel-list">
          {RELEASES.map((x, i) => (
            <li key={x.v}>
              <button className={`rel-row ${i === 0 ? 'latest' : ''}`} onClick={() => open(x.v)}>
                <span className="rel-ver">{x.v}</span>
                <span className="rel-sum">
                  <b>{x.title}</b>
                  <small>
                    {x.date}
                    {i === 0 ? ' · mới nhất' : ''} · {x.groups.length} mục
                  </small>
                  <span className="rel-lead">{x.lead}</span>
                </span>
                <span className="rel-go" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
