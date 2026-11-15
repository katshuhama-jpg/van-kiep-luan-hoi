'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { currentPlayer, onPlayerChange } from '@/lib/auth';
import { SU_DO_ON } from '@/lib/flags';
import { SU_BOUND_EV, captureSuLink, trySuBind } from '@/lib/suDo';
import { tr } from '@/lib/i18n';

/**
 * 4.6.0 Sư Đồ, gắn ở layout: bắt `?su=<tên>` trên mọi trang; đã đăng nhập mà còn cookie mời thì bái sư
 * (khách chơi thử tạo chân thân trước rồi mới đăng ký); bái xong hiện một dòng nhỏ.
 */
export default function SuDoLink() {
  const path = usePathname();
  const [su, setSu] = useState<string | null>(null);

  useEffect(() => {
    if (SU_DO_ON) captureSuLink();
  }, [path]);

  useEffect(() => {
    if (!SU_DO_ON) return;
    trySuBind(currentPlayer()).catch(() => {});
    const off = onPlayerChange((p) => void trySuBind(p).catch(() => {}));
    const on = (e: Event) => setSu(String((e as CustomEvent).detail ?? ''));
    window.addEventListener(SU_BOUND_EV, on);
    return () => {
      off();
      window.removeEventListener(SU_BOUND_EV, on);
    };
  }, []);

  useEffect(() => {
    if (!su) return;
    const t = setTimeout(() => setSu(null), 15000);
    return () => clearTimeout(t);
  }, [su]);

  if (!su) return null;
  return (
    <div className="su-bound" role="status" onClick={() => setSu(null)}>
      <span>
        {tr(
          `Đã bái ${su} làm sư phụ. Chơi xong 10 kiếp (từ 16 tuổi) trong 7 ngày là thành tài: ngươi và sư phụ mỗi người +20 phúc duyên.`,
          `You are now ${su}'s disciple. Finish 10 lives (reaching age 16) within 7 days to graduate: you and your master each get +20 Fortune.`,
        )}
      </span>
      <button className="su-bound-x" aria-label={tr('Đóng', 'Close')} onClick={() => setSu(null)}>
        X
      </button>
    </div>
  );
}
