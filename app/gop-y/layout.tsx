import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Góp ý', 'Góp ý cho Vạn Kiếp Luân Hồi: muốn game có gì, cứ viết. Thiên Đạo đọc hết và hồi đáp từng góp ý.', '/gop-y');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
