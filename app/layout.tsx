import { NavTracker } from '@/components/BackButton';
import VersionWatch from '@/components/VersionWatch';
import Tracker from '@/components/Tracker';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import LangGate from '@/components/LangGate';
import './globals.css';
import { pageMeta, SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta(null, SITE_DESC),
  title: { default: `${SITE_NAME} - Game pixel tu tiên trùng sinh`, template: `%s · ${SITE_NAME}` },
  applicationName: SITE_NAME,
  keywords: ['Vạn Kiếp Luân Hồi', 'game tu tiên', 'game pixel', 'trùng sinh', 'luân hồi', 'tu tiên online', 'game web', 'phi thăng', 'kiếm hiệp', 'game Việt'],
  category: 'game',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b2a1a',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // ngôn ngữ người chơi chọn (cookie do nút đổi ngôn ngữ đặt)
  const en = (await cookies()).get('vkl_lang')?.value === 'en';
  return (
    <html lang={en ? 'en' : 'vi'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Protest+Revolution&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavTracker />
        <Tracker />
        <LangGate en={en}>
          {children}
          <VersionWatch />
        </LangGate>
      </body>
    </html>
  );
}
