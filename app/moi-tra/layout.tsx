import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Mời tác giả chén trà', 'Buy the author a tea'), tr('Vạn Kiếp Luân Hồi miễn phí, không quảng cáo. Thích game thì mời tác giả một chén trà.', 'Ten Thousand Rebirths is free with no ads. If you enjoy it, buy the author a cup of tea.'), '/moi-tra');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
