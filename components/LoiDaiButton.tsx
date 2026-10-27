'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { currentPlayer } from '@/lib/auth';
import { ruleOf } from '@/lib/game/arena';
import { arenaTierInfo } from '@/lib/social';

/** Số lượt lôi đài còn hôm nay và nợ báo thù (null khi chưa đăng nhập hoặc chưa tải xong) */
export function useArenaLeft(): { left: number; revenge: number } | null {
  const [v, setV] = useState<{ left: number; revenge: number } | null>(null);
  useEffect(() => {
    const u = currentPlayer();
    if (!u) return;
    arenaTierInfo(u)
      .then((r) => r && setV({ left: r.left, revenge: r.revenge }))
      .catch(() => {});
  }, []);
  return v;
}

/** Nút ra đài nhanh ở màn chết: chỉ hiện khi còn lượt hoặc có nợ báo thù */
export function ArenaNudge({ onClick }: { onClick?: () => void }) {
  const v = useArenaLeft();
  if (!v || (v.left <= 0 && v.revenge <= 0)) return null;
  return (
    <Link href="/loi-dai" className="btn arena-nudge" onClick={onClick}>
      ⚔ Ra đài 25 giây
      <small>{v.left > 0 ? `còn ${v.left} lượt hôm nay` : `${v.revenge} kẻ chờ báo thù`}</small>
    </Link>
  );
}

/** Kiếm bắt chéo vẽ pixel */
function Swords() {
  return (
    <svg className="ml-swords" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="1" width="1" height="1" fill="#fff8dc" />
      <rect x="14" y="1" width="1" height="1" fill="#fff8dc" />
      <rect x="2" y="2" width="1" height="1" fill="#fff8dc" />
      <rect x="13" y="2" width="1" height="1" fill="#fff8dc" />
      <rect x="3" y="3" width="1" height="1" fill="#d8d8e8" />
      <rect x="12" y="3" width="1" height="1" fill="#d8d8e8" />
      <rect x="4" y="3" width="1" height="1" fill="#9898b0" />
      <rect x="11" y="3" width="1" height="1" fill="#9898b0" />
      <rect x="4" y="4" width="1" height="1" fill="#d8d8e8" />
      <rect x="11" y="4" width="1" height="1" fill="#d8d8e8" />
      <rect x="5" y="4" width="1" height="1" fill="#9898b0" />
      <rect x="10" y="4" width="1" height="1" fill="#9898b0" />
      <rect x="5" y="5" width="1" height="1" fill="#d8d8e8" />
      <rect x="10" y="5" width="1" height="1" fill="#d8d8e8" />
      <rect x="6" y="5" width="1" height="1" fill="#9898b0" />
      <rect x="9" y="5" width="1" height="1" fill="#9898b0" />
      <rect x="6" y="6" width="1" height="1" fill="#d8d8e8" />
      <rect x="9" y="6" width="1" height="1" fill="#d8d8e8" />
      <rect x="7" y="6" width="1" height="1" fill="#9898b0" />
      <rect x="8" y="6" width="1" height="1" fill="#9898b0" />
      <rect x="7" y="7" width="1" height="1" fill="#d8d8e8" />
      <rect x="8" y="7" width="1" height="1" fill="#d8d8e8" />
      <rect x="8" y="7" width="1" height="1" fill="#9898b0" />
      <rect x="7" y="7" width="1" height="1" fill="#9898b0" />
      <rect x="8" y="8" width="1" height="1" fill="#d8d8e8" />
      <rect x="7" y="8" width="1" height="1" fill="#d8d8e8" />
      <rect x="9" y="8" width="1" height="1" fill="#9898b0" />
      <rect x="6" y="8" width="1" height="1" fill="#9898b0" />
      <rect x="9" y="9" width="1" height="1" fill="#d8d8e8" />
      <rect x="6" y="9" width="1" height="1" fill="#d8d8e8" />
      <rect x="10" y="9" width="1" height="1" fill="#9898b0" />
      <rect x="5" y="9" width="1" height="1" fill="#9898b0" />
      <rect x="10" y="10" width="1" height="1" fill="#d8d8e8" />
      <rect x="5" y="10" width="1" height="1" fill="#d8d8e8" />
      <rect x="11" y="10" width="1" height="1" fill="#9898b0" />
      <rect x="4" y="10" width="1" height="1" fill="#9898b0" />
      <rect x="9" y="10" width="4" height="1" fill="#ffd36b" />
      <rect x="10" y="9" width="1" height="3" fill="#ffd36b" />
      <rect x="3" y="10" width="4" height="1" fill="#ffd36b" />
      <rect x="5" y="9" width="1" height="3" fill="#ffd36b" />
      <rect x="12" y="12" width="1" height="1" fill="#8a4a1e" />
      <rect x="13" y="13" width="1" height="1" fill="#8a4a1e" />
      <rect x="3" y="12" width="1" height="1" fill="#8a4a1e" />
      <rect x="2" y="13" width="1" height="1" fill="#8a4a1e" />
      <rect x="14" y="14" width="1" height="1" fill="#b0201a" />
      <rect x="1" y="14" width="1" height="1" fill="#b0201a" />
    </svg>
  );
}

/** Nút Lôi đài nổi bật kiểu pixel: nền đỏ son, viền vát sáng tối, đinh vàng ở góc, sao lấp lánh theo nhịp */
export default function LoiDaiButton({ onClick }: { onClick?: () => void }) {
  const v = useArenaLeft();
  const dot = v ? v.left + v.revenge : 0;
  return (
    <Link href="/loi-dai" className="menu-loidai" onClick={onClick}>
      {dot > 0 && (
        <b className="ml-dot" aria-label={`Còn ${v!.left} lượt`}>
          {dot}
        </b>
      )}
      <i className="ml-stud a" aria-hidden="true" />
      <i className="ml-stud b" aria-hidden="true" />
      <i className="ml-stud c" aria-hidden="true" />
      <i className="ml-stud d" aria-hidden="true" />
      <i className="ml-star s1" aria-hidden="true" />
      <i className="ml-star s2" aria-hidden="true" />
      <span className="ml-title">
        <Swords />
        Lôi đài hằng ngày
        <Swords />
      </span>
      <small className="ml-rule">Luật hôm nay: {ruleOf().name}</small>
    </Link>
  );
}
