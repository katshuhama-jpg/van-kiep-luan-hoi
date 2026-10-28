import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Hạ chiến thư', "Issue a challenge"), tr('Chọn một kiếp của đạo hữu khác, đấu với bóng của kiếp đó bằng phi kiếm. Không cần người kia đang chơi.', "Pick a life of another fellow Daoist and duel its shadow with flying swords. The other player need not be online."), '/thach-dau');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
