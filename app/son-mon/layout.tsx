import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = {
  ...pageMeta(tr('Sơn Môn', 'Sects'), tr('Lập sơn môn cùng đạo hữu, điểm danh, làm nhiệm vụ trong kiếp và giữ đất trên bản đồ lục giác.', 'Found a sect with friends, check in, finish tasks in your lives and hold land on the hex map.'), '/son-mon'),
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
