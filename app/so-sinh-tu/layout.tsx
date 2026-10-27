import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Sổ Sinh Tử', 'Sổ Sinh Tử ghi lại mọi kiếp của bạn: kết cục, thành tựu, Thiên thư và những đời đã sống.', '/so-sinh-tu');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
