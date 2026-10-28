import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Sổ Sinh Tử', "Book of Life and Death"), tr('Sổ Sinh Tử ghi lại mọi kiếp của bạn: kết cục, thành tựu, Thiên thư và những đời đã sống.', "The Book of Life and Death records all your lives: endings, achievements, the Heavenly Tome and every life you've lived."), '/so-sinh-tu');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
