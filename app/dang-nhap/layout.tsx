import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Đăng nhập', 'Đăng nhập để giữ tiến độ luân hồi, lên bảng xếp hạng và đấu lôi đài với người chơi khác.', '/dang-nhap');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
