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
    // trang tự tải lại (đổi ngôn ngữ qua ?lang=en, /en) vẫn là cùng một lượt vào: chỉ ghi 'open' một lần mỗi tab,
    // nếu không lượt thứ hai ghi nguồn là chính trang mình và đếm trùng người mới
    let again = false;
    try {
      again = !!sessionStorage.getItem('vkl.opened');
      sessionStorage.setItem('vkl.opened', '1');
    } catch {}
    if (first.current && again) {
      first.current = false;
      track('page');
    } else if (first.current) {
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
    }, 150000); // 2,5 phút một nhịp (vừa khung 3 phút của vkl_online_now): nhịp 1 phút làm máy chủ quá tải khi đông người (31/10)
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
