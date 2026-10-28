'use client';

import Link from 'next/link';
import { track } from '@/lib/track';

/**
 * Chơi thử mà chết ở cảnh giới cao: mời ghi danh để khắc bia lên Nghĩa trang tu sĩ.
 * Chết sớm thì không hiện, để người chơi thử cứ đầu thai tiếp.
 */
export default function GhiDanh({ name, realm, age, ascended, lives, onClose }: { name: string; realm: string; age: number; ascended: boolean; lives: number; onClose: () => void }) {
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-label="Ghi danh vào sổ luân hồi" onClick={onClose}>
      <div className="ss-sheet gd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ss-head">
          <b>Kiếp này đáng ghi danh</b>
          <button className="ss-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <p className="gd-who">
          <b>{name}</b> · {ascended ? 'phi thăng' : realm} · {age} tuổi
        </p>
        <p className="gd-text">Đạo hữu đang chơi thử nên kiếp này chưa có bia ở Nghĩa trang tu sĩ, chưa lên Bảng xếp hạng. Ghi danh để khắc bia, giữ phúc duyên và {lives} kiếp đã đi qua.</p>
        <Link href="/dang-nhap?up=1&next=/choi" className="btn btn-red btn-big" style={{ textDecoration: 'none', textAlign: 'center' }} onClick={() => track('ghi_danh_go')}>
          Ghi danh, khắc bia
          <small>chỉ cần tên và mật khẩu</small>
        </Link>
        <button className="ss-more" onClick={onClose}>
          Để sau, chơi tiếp
        </button>
      </div>
    </div>
  );
}
