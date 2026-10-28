import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Tác giả', "Art credits"), tr('Tác giả và nguồn hình ảnh, âm thanh của Vạn Kiếp Luân Hồi (LPC, OpenGameArt).', "Credits and sources for the art and audio of Vạn Kiếp Luân Hồi (LPC, OpenGameArt)."), '/tac-gia');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
