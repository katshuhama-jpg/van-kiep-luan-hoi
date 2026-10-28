import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Góp ý', "Feedback"), tr('Góp ý cho Vạn Kiếp Luân Hồi: muốn game có gì, cứ viết. Thiên Đạo đọc hết và hồi đáp từng góp ý.', "Feedback for Vạn Kiếp Luân Hồi: tell us what you want in the game. The Heavenly Yao reads every suggestion and answers each one."), '/gop-y');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
