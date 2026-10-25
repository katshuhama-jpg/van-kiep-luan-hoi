import { NavTracker } from '@/components/BackButton';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vạn Kiếp Luân Hồi',
  description: 'Game pixel trùng sinh tu tiên: đầu thai ngẫu nhiên, tu luyện, chọn chính tà, sống trọn một kiếp rồi luân hồi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b2a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavTracker />
        {children}
      </body>
    </html>
  );
}
