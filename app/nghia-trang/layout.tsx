import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Nghĩa trang', "Cultivators' Cemetery"), tr('Nơi yên nghỉ của vạn kiếp: đọc hồi ký, thắp hương, để lại lời viếng cho những nhân vật đã qua đời.', "The resting place of ten thousand lives: read memoirs, burn incense and leave condolences for characters who have passed on."), '/nghia-trang');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
