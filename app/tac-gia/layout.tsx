import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Tác giả', 'Tác giả và nguồn hình ảnh, âm thanh của Vạn Kiếp Luân Hồi (LPC, OpenGameArt).', '/tac-gia');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
