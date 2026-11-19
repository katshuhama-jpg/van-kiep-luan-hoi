'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { flush, loadHints, track } from '@/lib/track';

/**
 * 17/11 (tăng trưởng): 30 giờ qua có ~200 phiên rộng đúng 411px, không nguồn, ẩn sau dưới 10 giây, chỉ ~3% vào kiếp
 * (máy thường ~45%). Nghi là trình duyệt trong app Facebook tải trước hoặc máy duyệt quảng cáo, làm sai phễu kiếp 1.
 * Ghi thêm vài dấu hiệu để tách: trang mở khi đang ẩn (vis), đang tải trước (pre), trình duyệt tự động (wd), trình duyệt trong app (iab).
 */
function openHints(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  try {
    out.vis = document.visibilityState;
    if ((document as Document & { prerendering?: boolean }).prerendering) out.pre = true;
    if (navigator.webdriver) out.wd = true;
    const ua = navigator.userAgent || '';
    const iab = /FBAN|FBAV|FB_IAB|FBIOS/.test(ua) ? 'fb' : /Instagram/.test(ua) ? 'ig' : /Zalo/i.test(ua) ? 'zalo' : /Messenger/.test(ua) ? 'ms' : /Threads|Barcelona/.test(ua) ? 'th' : '';
    if (iab) out.iab = iab;
    if (/bot|crawl|spider|facebookexternalhit|HeadlessChrome|Lighthouse/i.test(ua)) out.bot = true;
  } catch {}
  return out;
}

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
        q: location.search.slice(0, 200), // 14/11: 60 ký tự cắt mất utm_content, không phân biệt được mẫu quảng cáo
        ...openHints(),
        ...loadHints(),
      });
    } else track('page');
  }, [path]);

  useEffect(() => {
    const hb = setInterval(() => {
      if (document.visibilityState === 'visible') track('hb');
    }, 300000); // 5 phút một nhịp; số đang chơi đếm trong 7 phút (vkl_online_now7). Nhịp 1 phút từng làm máy chủ quá tải (31/10)
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

