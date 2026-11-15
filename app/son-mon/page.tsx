/**
 * 4.6.0 Sơn Môn Tranh Bá: trang /son-mon, cũng là tab Sơn Môn của thanh 4 tab.
 * Cờ SON_MON_ON tắt: chỉ màn chờ khi thanh tab bật (TAB_ON), không lộ nội dung môn; cả hai cờ tắt thì 404.
 * Nội dung ở components/sonmon/SonMonHome.tsx, khung tab ở components/SonMonTab.tsx.
 */
import { notFound } from 'next/navigation';
import { SON_MON_ON, TAB_ON } from '@/lib/flags';
import SonMonTab from '@/components/SonMonTab';

export default function SonMonPage() {
  if (!SON_MON_ON && !TAB_ON) notFound();
  return <SonMonTab />;
}
