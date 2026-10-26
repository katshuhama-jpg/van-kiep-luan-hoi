'use client';

import { useEffect, useState } from 'react';
import Sprite from './Sprite';
import type { Character } from '@/lib/game/types';

const TEXT = {
  tien: { big: 'Phi thăng Tiên giới', sub: 'Tiên quang giáng xuống, cửa trời mở rộng' },
  ma: { big: 'Nhập Ma giới', sub: 'Chín đạo huyết lôi tan, vạn ma cúi đầu' },
  hu: { big: 'Lạc vào Thái Hư', sub: 'Không trời, không vực, chỉ còn hư không' },
} as const;

/** Cảnh phi thăng vài giây: cột sáng giáng xuống, nhân vật bay lên, nền đổi sang cõi mới. Chạm để bỏ qua. */
export default function AscendScene({ c, cos, onDone }: { c: Character; cos: 'tien' | 'ma' | 'hu'; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 2200), setTimeout(() => setStep(3), 3600), setTimeout(onDone, 5200)];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const t = TEXT[cos];
  return (
    <div className={`asc asc-${cos} s${step}`} role="dialog" aria-label={t.big} onClick={onDone}>
      <div className="asc-bg" style={{ backgroundImage: `url(/bg/${cos}-0.png)` }} aria-hidden="true" />
      <div className="asc-flash" aria-hidden="true" />
      <div className="asc-beam" aria-hidden="true" />
      <div className="asc-hero">
        <Sprite c={c} size={150} anim="spellcast" dir={2} />
      </div>
      <div className="asc-text">
        <b>{t.big}</b>
        <span>{t.sub}</span>
      </div>
      <small className="asc-skip">Chạm để tiếp tục</small>
    </div>
  );
}
