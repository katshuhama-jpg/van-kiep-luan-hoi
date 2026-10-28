'use client';

import { useEffect, useState } from 'react';
import { lang } from '@/lib/i18n';

/**
 * Bản tiếng Anh dựng hoàn toàn ở máy người chơi (dữ liệu game dịch lúc tải trang),
 * nên máy chủ không vẽ trước để khỏi lệch chữ khi hydrate. Tiếng Việt vẫn vẽ trước như cũ.
 */
export default function LangGate({ en, children }: { en: boolean; children: React.ReactNode }) {
  const [ok, setOk] = useState(!en);
  useEffect(() => {
    const want = lang() === 'en';
    if (want !== en) {
      // cookie và máy lệch nhau (xóa cookie, đổi máy...): đồng bộ cookie rồi tải lại một lần
      try {
        document.cookie = `vkl_lang=${want ? 'en' : 'vi'}; path=/; max-age=31536000; samesite=lax`;
      } catch {}
      if (want) location.reload();
    }
    setOk(true);
  }, [en]);
  return ok ? <>{children}</> : null;
}
