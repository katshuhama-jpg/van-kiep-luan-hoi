import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Chân thân', 'True Self'), tr('Chân thân của ngươi: ngoại hình, pháp danh và Tam Tài.', 'Your true self: appearance, dharma name and the Three Treasures.'), '/chan-than');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
