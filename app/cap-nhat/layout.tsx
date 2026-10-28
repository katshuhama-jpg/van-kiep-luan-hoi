import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Lịch sử cập nhật', "Update history"), tr('Cáo thị giang hồ: các bản cập nhật của Vạn Kiếp Luân Hồi, tông môn mới, cốt truyện mới, cân bằng và sửa lỗi.', "Jianghu Proclamation: every update of Vạn Kiếp Luân Hồi - new sects, new stories, balance changes and bug fixes."), '/cap-nhat');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
