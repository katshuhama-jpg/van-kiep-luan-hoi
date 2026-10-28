'use client';

import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';

const MINE = process.env.NEXT_PUBLIC_BUILD ?? '';
const EVERY = 3 * 60 * 1000;

/** Đang giữa một kiếp: chỉ hiện nút nhỏ, không chen ngang */
const busy = () => typeof document !== 'undefined' && document.body.dataset.busy === '1';

/**
 * Báo có bản mới: logic game chạy trên trình duyệt, tab mở từ trước sẽ chạy code cũ.
 * Hỏi máy chủ định kỳ và khi quay lại tab; khác mã build thì mời tải lại.
 */
export default function VersionWatch() {
  const [fresh, setFresh] = useState(false);
  const [later, setLater] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  useEffect(() => {
    if (!MINE) return;
    let stop = false;
    const check = async () => {
      if (stop || document.hidden) return;
      try {
        const r = await fetch('/api/version', { cache: 'no-store' });
        const { v } = (await r.json()) as { v: string };
        if (v && v !== MINE) setFresh(true);
      } catch {
        /* mất mạng: thử lại lần sau */
      }
    };
    void check();
    const t = setInterval(check, EVERY);
    const onVis = () => void check();
    document.addEventListener('visibilitychange', onVis);
    const b = setInterval(() => setIsBusy(busy()), 2000);
    return () => {
      stop = true;
      clearInterval(t);
      clearInterval(b);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  if (!fresh) return null;
  const reload = () => window.location.reload();
  if (isBusy || later)
    return (
      <button className="ver-chip" onClick={reload} aria-label={tr("Có bản mới, tải lại", "New version out, reload")}>
        
        {tr("↻ Bản mới", "↻ New version")}
      </button>
    );
  return (
    <div className="ver-card" role="alertdialog" aria-labelledby="ver-title">
      <span className="rel-seal sm" aria-hidden="true">
        
        {tr("Mới", "New")}
      </span>
      <b id="ver-title">{tr("Thiên đạo đổi thay", "The Heavenly Yao shifts")}</b>
      <p>{tr("Giang hồ vừa có bản mới. Tải lại để nhập thế cùng thiên hạ, kiếp đang chơi vẫn được giữ nguyên.", "The jianghu just got a new version. Reload to rejoin the world - your current life is kept intact.")}</p>
      <div className="ver-acts">
        <button className="btn btn-red" onClick={reload}>
          
          {tr("Tải lại", "Reload")}
        </button>
        <button className="btn" onClick={() => setLater(true)}>
          
          {tr("Để sau", "Later")}
        </button>
      </div>
    </div>
  );
}
