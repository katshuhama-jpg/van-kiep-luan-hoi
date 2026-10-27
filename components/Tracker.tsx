'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { flush, track } from '@/lib/track';

/** Đo phiên chơi: mở game, đổi trang, nhịp 60 giây khi tab đang mở, ẩn tab và quay lại */
export default function Tracker() {
  const path = usePathname();
  const first = useRef(true);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    if (first.current) {
      first.current = false;
      let ret = false;
      try {
        ret = !!localStorage.getItem('vkl.seenAt');
        localStorage.setItem('vkl.seenAt', String(Date.now()));
      } catch {}
      track('open', {
        ref: document.referrer ? new URL(document.referrer).hostname : '',
        mobile: matchMedia('(pointer: coarse)').matches,
        w: innerWidth,
        ret,
        q: location.search.slice(0, 60),
      });
    } else track('page');
  }, [path]);

  useEffect(() => {
    const hb = setInterval(() => {
      if (document.visibilityState === 'visible') track('hb');
    }, 60000);
    const vis = () => {
      if (document.visibilityState === 'hidden') {
        track('hide', { ms: Date.now() - shownAt.current });
        flush(true);
      } else {
        shownAt.current = Date.now();
        track('show');
      }
    };
    const leave = () => {
      track('leave', { ms: Date.now() - shownAt.current });
      flush(true);
    };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', leave);
    return () => {
      clearInterval(hb);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pagehide', leave);
    };
  }, []);

  return null;
}
