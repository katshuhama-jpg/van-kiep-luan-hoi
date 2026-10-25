'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const KEY = 'vkl.nav';

/** Ghi lại các trang đã đi trong phiên, để nút quay lại biết có trang trước hay không */
export function NavTracker() {
  const path = usePathname();
  useEffect(() => {
    try {
      const n = Number(sessionStorage.getItem(KEY) ?? '0');
      sessionStorage.setItem(KEY, String(n + 1));
    } catch {}
  }, [path]);
  return null;
}

/** Nút ‹ quay về đúng trang trước đó; mở thẳng link thì về trang dự phòng */
export default function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      className="icon-btn"
      aria-label="Quay lại"
      onClick={() => {
        let n = 0;
        try {
          n = Number(sessionStorage.getItem(KEY) ?? '0');
        } catch {}
        if (n > 1) router.back();
        else router.push(fallback);
      }}
    >
      ‹
    </button>
  );
}
