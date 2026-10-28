import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import EnGo from './EnGo';

/**
 * Link chia sẻ cho người chơi nước ngoài: /en có ảnh và mô tả tiếng Anh khi dán lên mạng xã hội
 * (máy quét link không chạy JS nên không đọc được ?lang=en), rồi chuyển sang bản tiếng Anh.
 */
const TITLE = 'Ten Thousand Rebirths - Pixel Xianxia Rebirth Game';
const DESC = 'A pixel-art xianxia life sim in your browser: be reborn with a random fate, cultivate from mortal to Ascension, choose the Righteous or Demonic Path and battle other players. Free, no install.';
const IMG = { url: '/og-en.png', width: 1200, height: 630, alt: 'Ten Thousand Rebirths - pixel xianxia life sim' };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: '/en' },
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Ten Thousand Rebirths', url: '/en', title: TITLE, description: DESC, images: [IMG] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: [IMG.url] },
};

export default function En() {
  return <EnGo />;
}
