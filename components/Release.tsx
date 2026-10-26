'use client';

import Link from 'next/link';
import { CURRENT_VERSION, RELEASES, markSeenLocal, seenLocal, type Release } from '@/lib/releases';

/** Nội dung một bản cập nhật, dùng cho cáo thị và trang lịch sử */
export function ReleaseBody({ r }: { r: Release }) {
  return (
    <>
      <p className="rel-intro">{r.lead}</p>
      {r.stats && (
        <div className="rel-stats">
          {r.stats.map((s) => (
            <div key={s.label}>
              <b>{s.n}</b>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      )}
      {r.groups.map((g) => (
        <div key={g.h} className="rel-group">
          <h3>{g.h}</h3>
          <ul className="rel-items">
            {g.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Người chơi chưa xem cáo thị bản mới nhất (xét cả bản lưu trên tài khoản và trên máy) */
export function needNotice(seen?: string | null): boolean {
  return seen !== CURRENT_VERSION && seenLocal() !== CURRENT_VERSION;
}

/** Cáo thị giang hồ: hiện một lần cho mỗi bản mới, đóng thì ghi nhận đã xem */
export default function ReleaseNotice({ onClose }: { onClose: (v: string) => void }) {
  const r = RELEASES[0];
  const close = () => {
    markSeenLocal();
    onClose(CURRENT_VERSION);
  };
  return (
    <div className="rel-wrap" role="dialog" aria-modal="true" aria-labelledby="rel-title">
      <div className="rel-scroll">
        <i className="rod" aria-hidden="true" />
        <div className="rel-body">
          <span className="rel-seal" aria-hidden="true">
            {r.v}
          </span>
          <p className="rel-kick">Cáo thị giang hồ · {r.date}</p>
          <h2 id="rel-title">{r.title}</h2>
          <ReleaseBody r={r} />
          <div className="rel-acts">
            <button className="btn btn-red btn-big" onClick={close}>
              Đã rõ, vào luân hồi
            </button>
            <Link href="/cap-nhat" className="rel-link" onClick={close}>
              Xem lịch sử cập nhật
            </Link>
          </div>
        </div>
        <i className="rod" aria-hidden="true" />
      </div>
    </div>
  );
}
