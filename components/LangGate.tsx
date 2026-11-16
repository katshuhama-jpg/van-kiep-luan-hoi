'use client';

import { useEffect, useState } from 'react';
import { lang } from '@/lib/i18n';

/**
 * Trang được dựng sẵn một lần (tiếng Việt) và lấy từ CDN. Ngôn ngữ chỉ biết ở máy người chơi (localStorage),
 * và dữ liệu game dịch ngay lúc tải mã, nên nội dung trang chỉ vẽ ở máy người chơi để không lệch chữ khi hydrate.
 * (Trước 16/11 máy chủ đọc cookie vkl_lang để vẽ trước bản tiếng Việt; bỏ để trang không phải dựng lại mỗi lần mở.)
 */
export default function LangGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // link chia sẻ ?lang=en (hoặc vi): đặt ngôn ngữ rồi tải lại một lần nếu khác ngôn ngữ đang dùng, bỏ tham số khỏi link
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'vi') {
        localStorage.setItem('vkl.lang', q);
        document.cookie = `vkl_lang=${q}; path=/; max-age=31536000; samesite=lax`;
        const u = new URL(location.href);
        u.searchParams.delete('lang');
        if (lang() !== q) {
          location.replace(u.toString());
          return;
        }
        history.replaceState(null, '', u.toString());
      }
    } catch {}
    document.documentElement.lang = lang();
    setOk(true);
  }, []);
  return ok ? <>{children}</> : null;
}
