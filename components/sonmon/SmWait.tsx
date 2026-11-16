'use client';

/** cờ SON_MON_ON tắt: màn chờ, không có nội dung môn nào. Tách file riêng (16/11) để tab Sơn Môn không phải tải cả bộ Sơn Môn. */
import './sonmon.css';
import { tr } from '@/lib/i18n';

export function SmWait({ embedded }: { embedded: boolean }) {
  const body = (
    <section className="sm-card dark">
      <h2>{tr('Sơn Môn', 'Sects')}</h2>
      <p>{tr('Lập môn cùng đạo hữu, giữ đất trên bản đồ.', 'Found a sect with friends and hold land on the map.')}</p>
      <p className="sm-big" style={{ fontSize: 22 }}>{tr('Mở cửa 5:00 sáng 18/11', 'Opens 5:00 AM, Nov 18')}</p>
    </section>
  );
  return embedded ? <div className="sm">{body}</div> : <main className="app sm">{body}</main>;
}

