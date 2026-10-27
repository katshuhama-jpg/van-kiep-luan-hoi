import type { Metadata } from 'next';

export const SITE_URL = 'https://kiep-luan-hoi.vercel.app';
export const SITE_NAME = 'Vạn Kiếp Luân Hồi';
export const SITE_DESC =
  'Game pixel tu tiên trùng sinh trên trình duyệt: đầu thai ngẫu nhiên, tu luyện từ phàm nhân tới phi thăng, chọn chính hay tà, vào tông môn, đấu lôi đài hằng ngày. Chơi miễn phí, không cần cài đặt.';
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Vạn Kiếp Luân Hồi - game pixel tu tiên' };

/** Thẻ chia sẻ mạng xã hội (Facebook, Zalo, Messenger, Threads, X) cho một trang */
export function pageMeta(title: string | null, description: string, path = '/'): Metadata {
  const full = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} - Game pixel tu tiên trùng sinh`;
  return {
    title: title ?? { absolute: full },
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'vi_VN', siteName: SITE_NAME, url: path, title: full, description, images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url] },
  };
}
