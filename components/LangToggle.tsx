'use client';

import { lang, setLang } from '@/lib/i18n';

/** Nút đổi ngôn ngữ Việt / Anh, bấm thì tải lại trang */
export default function LangToggle({ className = '' }: { className?: string }) {
  const en = lang() === 'en';
  return (
    <button className={`icon-btn lang-btn ${className}`} onClick={() => setLang(en ? 'vi' : 'en')} aria-label={en ? 'Chuyển sang tiếng Việt' : 'Switch to English'} title={en ? 'Tiếng Việt' : 'English'}>
      {en ? 'VI' : 'EN'}
    </button>
  );
}
