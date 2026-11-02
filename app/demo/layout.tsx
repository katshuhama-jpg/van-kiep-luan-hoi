import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './demo.css';

export const metadata: Metadata = { title: 'Demo công pháp, linh thú', robots: { index: false, follow: false } };

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
