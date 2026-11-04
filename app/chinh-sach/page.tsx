'use client';

import BackButton from '@/components/BackButton';
import { tr } from '@/lib/i18n';
import { FB_PAGE } from '@/lib/links';

/** Chính sách quyền riêng tư (cần cho màn đồng ý đăng nhập Google, 4/11/2026) */
export default function ChinhSach() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 26 }}>{tr('Quyền riêng tư', 'Privacy')}</span>
          <span className="meta">{tr('Vạn Kiếp Luân Hồi · cập nhật 04/11/2026', 'Van Kiep Luan Hoi · updated 04/11/2026')}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <section className="panel legal">
        <h2>{tr('Game thu thập gì', 'What the game collects')}</h2>
        <ul>
          <li>{tr('Tên đăng nhập và mật khẩu (mật khẩu chỉ lưu dạng mã hóa một chiều, không ai đọc được).', 'Your username and password (the password is stored only as a one-way hash that no one can read).')}</li>
          <li>{tr('Nếu bạn đăng nhập hoặc liên kết bằng Google: mã định danh tài khoản Google và địa chỉ email. Game không đọc danh bạ, Drive, Gmail hay bất cứ dữ liệu nào khác của Google.', 'If you sign in or link with Google: your Google account identifier and email address. The game does not read your contacts, Drive, Gmail or any other Google data.')}</li>
          <li>{tr('Mã khôi phục (chỉ lưu dạng mã hóa một chiều).', 'Your recovery code (stored only as a one-way hash).')}</li>
          <li>{tr('Tiến độ chơi: nhân vật, các kiếp, đồ đạc, bia mộ, kết quả Lôi đài, góp ý bạn gửi.', 'Game progress: characters, lives, items, tombstones, Arena results and feedback you send.')}</li>
          <li>{tr('Số liệu dùng game ẩn danh (mở trang nào, chơi bao lâu) để làm game tốt hơn.', 'Anonymous usage data (which pages you open, how long you play) to improve the game.')}</li>
        </ul>
        <h2>{tr('Dùng để làm gì', 'How it is used')}</h2>
        <ul>
          <li>{tr('Đăng nhập, lưu tiến độ lên mây, giúp bạn lấy lại tài khoản khi quên mật khẩu.', 'To sign you in, save your progress to the cloud and help you recover your account.')}</li>
          <li>{tr('Hiện tên đăng nhập của bạn ở Nghĩa trang, Bảng xếp hạng, Lôi đài. Email không bao giờ hiện cho người chơi khác.', 'To show your username in the Cemetery, Leaderboard and Arena. Your email is never shown to other players.')}</li>
          <li>{tr('Không bán, không chia sẻ dữ liệu cho bên thứ ba, không chạy quảng cáo nhắm theo dữ liệu của bạn.', 'We do not sell or share your data with third parties, and do not target ads using your data.')}</li>
        </ul>
        <h2>{tr('Lưu ở đâu', 'Where it is stored')}</h2>
        <p>{tr('Dữ liệu lưu trên Supabase và Vercel. Một phần tiến độ cũng lưu ngay trong trình duyệt của bạn.', 'Data is stored on Supabase and Vercel. Some progress is also kept in your own browser.')}</p>
        <h2>{tr('Xóa dữ liệu', 'Deleting your data')}</h2>
        <p>
          {tr('Muốn xóa tài khoản và toàn bộ dữ liệu, nhắn Fanpage kèm tên đăng nhập. Muốn bỏ liên kết Google, bạn cũng có thể gỡ quyền của game tại myaccount.google.com/permissions.', 'To delete your account and all data, message our Page with your username. To unlink Google, you can also remove the game at myaccount.google.com/permissions.')}
        </p>
        <a className="btn" href={FB_PAGE} target="_blank" rel="noopener noreferrer">
          {tr('Nhắn Fanpage', 'Message our Page')}
        </a>
      </section>
    </main>
  );
}
