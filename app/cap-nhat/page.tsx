'use client';

import { useEffect, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { ReleaseBody } from '@/components/Release';
import { RELEASES } from '@/lib/releases';
import { tr } from '@/lib/i18n';

/** Lịch sử cập nhật: danh sách gọn theo phiên bản, bấm vào một bản mới xem chi tiết */
export default function CapNhat() {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const q = new URLSearchParams(window.location.search).get('v');
      if (!q) pushed.current = false;
      setV(q);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  // mở chi tiết thì thêm một bước vào lịch sử; quay lại thì lùi đúng bước đó (không đẩy thêm bước mới, tránh kẹt qua lại hai màn)
  const pushed = useRef(false);
  const open = (ver: string | null) => {
    if (ver) {
      setV(ver);
      window.history.pushState(null, '', `/cap-nhat?v=${ver}`);
      pushed.current = true;
    } else if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      setV(null);
      window.history.replaceState(null, '', '/cap-nhat');
    }
    window.scrollTo(0, 0);
  };
  const r = v ? RELEASES.find((x) => x.v === v) : null;
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            {r ? tr(`Bản ${r.v}`, `Version ${r.v}`) : tr('Lịch sử cập nhật', "Update history")}
          </span>
          <span className="meta">{r ? r.title : tr('Những lần thiên hạ đổi thay', "Every time the world changed")}</span>
          {r ? (
            <button className="icon-btn" onClick={() => open(null)} aria-label={tr("Về danh sách phiên bản", "Back to version list")}>
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
            
            {tr("Bản ", "Version ")}{r.v} · {r.date}
            {r === RELEASES[0] ? tr(' · mới nhất', " · latest") : ''}
          </p>
          <h2>{r.title}</h2>
          <ReleaseBody r={r} />
          <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => open(null)}>
            
            {tr("‹ Về danh sách phiên bản", "‹ Back to version list")}
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
                    {i === 0 ? tr(' · mới nhất', " · latest") : ''} · {x.groups.length}{tr(" mục", " items")}
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
