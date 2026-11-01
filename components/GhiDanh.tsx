'use client';

import Link from 'next/link';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

/**
 * Chơi thử mà chết ở cảnh giới cao: mời ghi danh để khắc bia lên Nghĩa trang tu sĩ.
 * Chết sớm thì không hiện, để người chơi thử cứ đầu thai tiếp.
 */
export default function GhiDanh({ name, realm, age, ascended, lives, worthy = true, onClose }: { name: string; realm: string; age: number; ascended: boolean; lives: number; worthy?: boolean; onClose: () => void }) {
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-label={tr("Ghi danh vào sổ luân hồi", "Register in the Book of Reincarnation")} onClick={onClose}>
      <div className="ss-sheet gd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ss-head">
          <b>{worthy ? tr("Kiếp này đáng ghi danh", "This life deserves a record") : tr("Giữ lại kiếp này", "Keep this life")}</b>
          <button className="ss-x" onClick={onClose} aria-label={tr("Đóng", "Close")}>
            ✕
          </button>
        </div>
        <p className="gd-who">
          <b>{name}</b> · {ascended ? tr('phi thăng', "ascended") : realm} · {age}{tr(" tuổi", " years old")}
        </p>
        <p className="gd-text">{tr("Đạo hữu đang chơi thử: kiếp này chỉ nằm trên máy, chưa có bia ở Nghĩa trang, chưa lên Bảng xếp hạng. Ghi danh thì:", "You're playing as a guest: this life lives only on this device, with no tombstone in the Cemetery and no place on the Leaderboard. Register and:")}</p>
        <ul className="gd-perks">
          <li>{tr(`Bia của ${lives} kiếp đã qua được khắc lên Nghĩa trang, xếp hạng cùng giang hồ`, `The tombstones of your ${lives} lives so far go up in the Cemetery, ranked with everyone`)}</li>
          <li>{tr("Bóng kiếp của bạn lên Lôi đài, đấu với người chơi khác cả khi bạn vắng mặt", "Your past selves fight other players in the Arena even while you're away")}</li>
          <li>{tr("Giữ phúc duyên, chuỗi điểm danh 7 ngày (ngày 7 có đồ Cực phẩm), chơi tiếp trên máy khác", "Keep your Fortune and 7-day check-in streak (day 7 gives a Supreme item), and continue on another device")}</li>
        </ul>
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
