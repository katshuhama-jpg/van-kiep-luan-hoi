import { pageMeta } from '@/lib/seo';
import { tr } from '@/lib/i18n';

export const metadata = pageMeta(tr('Vào luân hồi', "Enter the Cycle"), tr('Đầu thai vào một đời mới: linh căn, xuất thân, số mệnh ngẫu nhiên. Tu luyện, kết duyên, chọn chính hay tà và sống trọn một kiếp.', "Be reborn into a new life: random spiritual root, origin and destiny. Cultivate, find love, choose Righteous or Evil, and live one full life."), '/choi');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
