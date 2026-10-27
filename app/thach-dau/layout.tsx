import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Hạ chiến thư', 'Chọn một kiếp của đạo hữu khác, đấu với bóng của kiếp đó bằng phi kiếm. Không cần người kia đang chơi.', '/thach-dau');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
