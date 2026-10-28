import type { Metadata } from 'next';
import { tr } from './i18n';

export const SITE_URL = 'https://van-kiep-luan-hoi.vercel.app';
export const SITE_NAME = tr('Vạn Kiếp Luân Hồi', "Ten Thousand Rebirths");
export const SITE_DESC =
  tr('Game pixel tu tiên trùng sinh trên trình duyệt: đầu thai ngẫu nhiên, tu luyện từ phàm nhân tới phi thăng, chọn chính hay tà, vào tông môn, đấu lôi đài hằng ngày. Chơi miễn phí, không cần cài đặt.', "A pixel-art xianxia rebirth game in your browser: be reborn with a random fate, cultivate from mortal to Ascension, choose the Righteous or Demonic Path, join a sect and battle in the daily Arena. Free to play, no install needed.");
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: tr('Vạn Kiếp Luân Hồi - game pixel tu tiên', "Ten Thousand Rebirths - Pixel Xianxia Cultivation Game") };

/** Thẻ chia sẻ mạng xã hội (Facebook, Zalo, Messenger, Threads, X) cho một trang */
export function pageMeta(title: string | null, description: string, path = '/'): Metadata {
  const full = title ? `${title} · ${SITE_NAME}` : tr(`${SITE_NAME} - Game pixel tu tiên trùng sinh`, `${SITE_NAME} - Pixel Xianxia Rebirth Game`);
  return {
    title: title ?? { absolute: full },
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'vi_VN', siteName: SITE_NAME, url: path, title: full, description, images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url] },
  };
}
