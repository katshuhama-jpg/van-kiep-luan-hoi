'use client';

import BackButton from '@/components/BackButton';
import { tr } from '@/lib/i18n';
import { FB_PAGE } from '@/lib/links';

/** Điều khoản sử dụng (cần cho màn đồng ý đăng nhập Google, 4/11/2026) */
export default function DieuKhoan() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 26 }}>{tr('Điều khoản', 'Terms')}</span>
          <span className="meta">{tr('Vạn Kiếp Luân Hồi · cập nhật 04/11/2026', 'Van Kiep Luan Hoi · updated 04/11/2026')}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <section className="panel legal">
        <ul>
          <li>{tr('Vạn Kiếp Luân Hồi là game miễn phí, chơi trên trình duyệt, làm cho vui.', 'Van Kiep Luan Hoi is a free browser game made for fun.')}</li>
          <li>{tr('Mỗi người tự giữ tên đăng nhập, mật khẩu và mã khôi phục của mình.', 'You are responsible for keeping your username, password and recovery code safe.')}</li>
          <li>{tr('Không dùng tên, lời góp ý, văn bia xúc phạm người khác. Không phá game, không lợi dụng lỗi để hại người chơi khác. Vi phạm có thể bị ẩn nội dung hoặc khóa tài khoản.', 'Do not use offensive names, feedback or epitaphs. Do not attack the game or abuse bugs to harm other players. Violations may lead to hidden content or a locked account.')}</li>
          <li>{tr('Game còn đang làm, nội dung và cân bằng có thể thay đổi, có lúc tạm ngừng để bảo trì. Đồ vật, linh thạch trong game không có giá trị tiền thật.', 'The game is in development; content and balance may change and it may pause for maintenance. In-game items and currency have no real-money value.')}</li>
          <li>{tr('Hình nhân vật và hiệu ứng dùng bộ tranh LPC theo giấy phép mở, xem trang Tác giả.', 'Character art and effects use LPC art under open licenses; see the Credits page.')}</li>
        </ul>
        <p>{tr('Có thắc mắc, nhắn Fanpage.', 'Questions? Message our Page.')}</p>
        <a className="btn" href={FB_PAGE} target="_blank" rel="noopener noreferrer">
          {tr('Nhắn Fanpage', 'Message our Page')}
        </a>
      </section>
    </main>
  );
}
