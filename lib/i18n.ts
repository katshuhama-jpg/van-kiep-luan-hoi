/**
 * Hai ngôn ngữ: tiếng Việt (mặc định) và tiếng Anh.
 * Chữ trong mã viết dạng tr('tiếng Việt', 'English'); ngôn ngữ đọc một lần từ máy khi tải trang,
 * đổi ngôn ngữ thì tải lại trang để mọi dữ liệu dựng sẵn (sự kiện, đồ, kết cục) dịch theo.
 */
export type Lang = 'vi' | 'en';
const KEY = 'vkl.lang';

let cur: Lang | null = null;
export function lang(): Lang {
  if (cur) return cur;
  if (typeof window === 'undefined') return 'vi';
  try {
    cur = localStorage.getItem(KEY) === 'en' ? 'en' : 'vi';
  } catch {
    cur = 'vi';
  }
  return cur;
}

export const isEn = () => lang() === 'en';

/** Chọn chữ theo ngôn ngữ đang dùng */
export function tr(vi: string, en: string): string {
  return lang() === 'en' ? en : vi;
}

/** Đổi ngôn ngữ rồi tải lại trang */
export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
    document.cookie = `vkl_lang=${l}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
  location.reload();
}
