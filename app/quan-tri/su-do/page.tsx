/**
 * Sư Đồ: trang quản trị cho Tyler (/quan-tri/su-do, noindex): mọi cặp thầy trò, tiến độ từng đệ tử, đánh dấu nghi gian lận.
 * Máy chủ (vkl_su_admin) chỉ trả dữ liệu cho tên đăng nhập trong vkl_sm_admin_user. Cờ SU_DO_ON tắt thì 404.
 */
import { notFound } from 'next/navigation';
import { SU_DO_ON } from '@/lib/flags';
import SuDoAdmin from '@/components/SuDoAdmin';

export default function QuanTriSuDoPage() {
  if (!SU_DO_ON) notFound();
  return <SuDoAdmin />;
}
