/**
 * 4.6.0 Sơn Môn Tranh Bá: trang /son-mon. Giấu sau cờ SON_MON_ON (tắt mặc định): cờ tắt thì 404, không lộ nội dung.
 * Nội dung ở components/sonmon/SonMonHome.tsx (cũng dùng làm tab Sơn Môn).
 */
import { notFound } from 'next/navigation';
import { SON_MON_ON } from '@/lib/flags';
import { SonMonHome } from '@/components/sonmon/SonMonHome';

export default function SonMonPage() {
  if (!SON_MON_ON) notFound();
  return <SonMonHome />;
}
