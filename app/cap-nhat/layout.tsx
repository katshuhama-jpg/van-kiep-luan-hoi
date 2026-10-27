import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Lịch sử cập nhật', 'Cáo thị giang hồ: các bản cập nhật của Vạn Kiếp Luân Hồi, tông môn mới, cốt truyện mới, cân bằng và sửa lỗi.', '/cap-nhat');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
