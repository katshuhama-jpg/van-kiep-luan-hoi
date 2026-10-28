import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Đăng nhập', "Log in"), tr('Đăng nhập để giữ tiến độ luân hồi, lên bảng xếp hạng và đấu lôi đài với người chơi khác.', "Log in to keep your reincarnation progress, climb the Leaderboard and fight other players in the Arena."), '/dang-nhap');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
