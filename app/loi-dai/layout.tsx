import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Lôi đài', "Arena"), tr('Lôi đài hằng ngày: chọn bóng nhân vật mạnh nhất từng chơi, rút đối thủ, đấu ngũ hành, tranh ngôi Bá Chủ trên bục Long Ỷ.', "Daily Arena: pick a shadow of the strongest character you've played, draw an opponent, duel with the Five Elements, and fight for the Overlord's seat on the Dragon Throne podium."), '/loi-dai');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
