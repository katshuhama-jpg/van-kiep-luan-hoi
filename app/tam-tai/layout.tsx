import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Tam Tài', 'Three Treasures'), tr('Mười đại huyệt, ngũ hành và các đạo đã ngộ của chân thân.', 'The ten great points, five elements and Daos of your true self.'), '/tam-tai');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
