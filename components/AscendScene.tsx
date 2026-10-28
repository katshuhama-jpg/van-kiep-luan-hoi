'use client';

import { useEffect, useState } from 'react';
import Sprite from './Sprite';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

const TEXT = {
  tien: { big: tr('Phi thăng Tiên giới', "Ascend to the Immortal Realm"), sub: tr('Tiên quang giáng xuống, cửa trời mở rộng', "Immortal light descends and the gate of heaven swings wide") },
  ma: { big: tr('Nhập Ma giới', "Enter the Demon Realm"), sub: tr('Chín đạo huyết lôi tan, vạn ma cúi đầu', "Nine bolts of blood lightning fade, and ten thousand demons bow") },
  hu: { big: tr('Lạc vào Thái Hư', "Lost in the Taixu"), sub: tr('Không trời, không vực, chỉ còn hư không', "No heaven, no abyss, only the void") },
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
      <small className="asc-skip">{tr("Chạm để tiếp tục", "Tap to continue")}</small>
    </div>
  );
}
