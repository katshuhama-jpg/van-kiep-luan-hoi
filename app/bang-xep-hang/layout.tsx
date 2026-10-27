import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Bảng xếp hạng', 'Ai tu cao nhất, sống lâu nhất, đi xa nhất trong vạn kiếp luân hồi. Xem bảng xếp hạng người chơi Vạn Kiếp Luân Hồi.', '/bang-xep-hang');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
