'use client';

import Link from 'next/link';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

/**
 * Chơi thử mà chết ở cảnh giới cao: mời ghi danh để khắc bia lên Nghĩa trang tu sĩ.
 * Chết sớm thì không hiện, để người chơi thử cứ đầu thai tiếp.
 */
export default function GhiDanh({ name, realm, age, ascended, lives, onClose }: { name: string; realm: string; age: number; ascended: boolean; lives: number; onClose: () => void }) {
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-label={tr("Ghi danh vào sổ luân hồi", "Register in the Book of Reincarnation")} onClick={onClose}>
      <div className="ss-sheet gd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ss-head">
          <b>{tr("Kiếp này đáng ghi danh", "This life deserves a record")}</b>
          <button className="ss-x" onClick={onClose} aria-label={tr("Đóng", "Close")}>
            ✕
          </button>
        </div>
        <p className="gd-who">
          <b>{name}</b> · {ascended ? tr('phi thăng', "ascended") : realm} · {age}{tr(" tuổi", " years old")}
        </p>
        <p className="gd-text">{tr("Đạo hữu đang chơi thử nên kiếp này chưa có bia ở Nghĩa trang tu sĩ, chưa lên Bảng xếp hạng. Ghi danh để khắc bia, giữ phúc duyên và ", "You're playing as a guest, fellow Daoist, so this life has no tombstone in the Cultivators' Cemetery and isn't on the Leaderboard. Register to carve your tombstone and keep your Fortune and the ")}{lives}{tr(" kiếp đã đi qua.", " lives you have lived.")}</p>
        <Link href="/dang-nhap?up=1&next=/choi" className="btn btn-red btn-big" style={{ textDecoration: 'none', textAlign: 'center' }} onClick={() => track('ghi_danh_go')}>
          
          {tr("Ghi danh, khắc bia", "Register, carve tombstone")}
          <small>{tr("chỉ cần tên và mật khẩu", "just a name and password")}</small>
        </Link>
        <button className="ss-more" onClick={onClose}>
          
          {tr("Để sau, chơi tiếp", "Later, keep playing")}
        </button>
      </div>
    </div>
  );
}
