import { tr } from '@/lib/i18n';

/** Trang quản trị: không cho máy tìm kiếm ghi lại. */
export const metadata = {
  title: tr('Quản trị', 'Admin'),
  robots: { index: false, follow: false, nocache: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
