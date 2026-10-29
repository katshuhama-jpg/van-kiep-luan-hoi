import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const PATHS = ['', '/choi', '/loi-dai', '/bang-xep-hang', '/cap-nhat', '/gop-y', '/nghia-trang', '/tang-kiep-cac', '/moi-tra', '/tac-gia'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: p === '' || p === '/cap-nhat' ? 'daily' : 'weekly', priority: p === '' ? 1 : 0.6 }));
}
