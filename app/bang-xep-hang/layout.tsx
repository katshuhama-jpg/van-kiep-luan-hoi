import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Bảng xếp hạng', "Leaderboard"), tr('Ai tu cao nhất, sống lâu nhất, đi xa nhất trong vạn kiếp luân hồi. Xem bảng xếp hạng người chơi Vạn Kiếp Luân Hồi.', "Who cultivated highest, lived longest and went furthest across ten thousand rebirths? See the Ten Thousand Rebirths player leaderboard."), '/bang-xep-hang');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
