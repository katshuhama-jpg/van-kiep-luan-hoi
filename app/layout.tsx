import { NavTracker } from '@/components/BackButton';
import VersionWatch from '@/components/VersionWatch';
import Tracker from '@/components/Tracker';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import LangGate from '@/components/LangGate';
import './globals.css';
import { pageMeta, SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta(null, SITE_DESC),
  title: { default: tr(`${SITE_NAME} - Game pixel tu tiên trùng sinh`, `${SITE_NAME} - Pixel xianxia rebirth game`), template: `%s · ${SITE_NAME}` },
  applicationName: SITE_NAME,
  keywords: [tr('Vạn Kiếp Luân Hồi', "Ten Thousand Rebirths"), tr('game tu tiên', "xianxia game"), 'game pixel', tr('trùng sinh', "rebirth"), tr('luân hồi', "reincarnation"), tr('tu tiên online', "online cultivation"), 'game web', tr('phi thăng', "ascension"), tr('kiếm hiệp', "wuxia"), tr('game Việt', "Vietnamese game")],
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
        {/* 4/11: máy iOS 14-15 (iPhone 7, 8...) thiếu vài hàm mới, bù trước khi mã game chạy */}
        <script dangerouslySetInnerHTML={{ __html: "!function(){var d=Object.defineProperty;function at(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return n<0||n>=this.length?void 0:this[n]}[Array,String].forEach(function(C){C.prototype.at||d(C.prototype,'at',{value:at,writable:!0,configurable:!0})});Object.hasOwn||d(Object,'hasOwn',{value:function(o,k){return Object.prototype.hasOwnProperty.call(o,k)},writable:!0,configurable:!0});window.structuredClone||(window.structuredClone=function(v){return v===void 0?v:JSON.parse(JSON.stringify(v))});if(!(window.CSS&&CSS.supports&&CSS.supports('height','100dvh'))){var h=function(){document.documentElement.style.setProperty('--vh1',window.innerHeight/100+'px')};h();window.addEventListener('resize',h);window.addEventListener('orientationchange',function(){setTimeout(h,300)})}}();" }} />
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
