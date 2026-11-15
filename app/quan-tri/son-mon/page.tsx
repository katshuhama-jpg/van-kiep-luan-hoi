/**
 * 4.6.0 Sơn Môn, Ngày 6: trang quản trị nhỏ cho Tyler (/quan-tri/son-mon, noindex).
 * Giấu sau cờ SON_MON_ON: cờ tắt thì 404. Máy chủ (vkl_sm_admin) chỉ trả dữ liệu cho tên đăng nhập trong vkl_sm_admin_user.
 */
import { notFound } from 'next/navigation';
import { SON_MON_ON } from '@/lib/flags';
import { SmAdmin } from '@/components/sonmon/SmAdmin';

export default function QuanTriSonMonPage() {
  if (!SON_MON_ON) notFound();
  return <SmAdmin />;
}
