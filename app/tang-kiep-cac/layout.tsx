import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Tàng Kiếp Các', 'Hall of Past Lives'), tr('Nơi cất giữ mọi kiếp bạn từng là: dáng vẻ, cảnh giới, lời để lại, thẻ Thất Nhật Lục và ngày giỗ các kiếp.', 'Every life you have ever lived: looks, realms, last words, your Seven-Day Chronicle and memorial days.'), '/tang-kiep-cac');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
