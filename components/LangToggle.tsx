'use client';

import { lang, setLang, type Lang } from '@/lib/i18n';

const OPTS: { l: Lang; flag: string; label: string }[] = [
  { l: 'vi', flag: '🇻🇳', label: 'VI' },
  { l: 'en', flag: '🇬🇧', label: 'EN' },
];

/** Chọn ngôn ngữ: hai nút có cờ, nút đang dùng tô đậm; bấm nút kia thì tải lại trang */
export default function LangToggle() {
  const cur = lang();
  return (
    <div className="lang-seg" role="radiogroup" aria-label={cur === 'en' ? 'Language' : 'Ngôn ngữ'}>
      {OPTS.map((o) => (
        <button key={o.l} role="radio" aria-checked={cur === o.l} className={cur === o.l ? 'on' : ''} onClick={() => cur !== o.l && setLang(o.l)} title={o.l === 'vi' ? 'Tiếng Việt' : 'English'}>
          <span aria-hidden="true">{o.flag}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
