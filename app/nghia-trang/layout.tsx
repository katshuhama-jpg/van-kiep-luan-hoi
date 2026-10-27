import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Nghĩa trang', 'Nơi yên nghỉ của vạn kiếp: đọc hồi ký, thắp hương, để lại lời viếng cho những nhân vật đã qua đời.', '/nghia-trang');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
