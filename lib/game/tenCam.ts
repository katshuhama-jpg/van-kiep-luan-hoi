/**
 * 4.5.0: từ cấm trong pháp danh chân thân (tên hiện cho người khác thấy).
 * So sau khi bỏ dấu, viết thường, bỏ khoảng trắng và ký tự lặp. Máy chủ có bản lọc riêng (supabase/chan_than_2026_11_11.sql), hai bản giữ giống nhau.
 * - TU_CAM: chuỗi bị chặn khi xuất hiện ở bất cứ đâu trong tên (đủ dài để không dính tên thường).
 * - TU_CAM_DAU, TU_CAM_RIENG: chữ ngắn, chỉ chặn khi đứng riêng thành một chữ (tránh chặn nhầm "Long", "Dư", "Cù"...).
 */
export const TU_CAM: string[] = [
  // tục tiếng Việt viết liền, đã bỏ dấu (đủ dài, không dính tên thường)
  'ditme', 'ditmia', 'dmm', 'dcmm', 'dkm', 'dmcs', 'vcl', 'vkl', 'vcc', 'clgt', 'cmm', 'cmnr', 'occho', 'occac', 'nunglon', 'nungloz', 'phangteo', 'dilon', 'lozz', 'buoj', 'concac', 'conkac', 'thangcho', 'conchode', 'chodeo',
];
/** tiếng Anh: so cả sau khi gộp ký tự lặp ("fuuuck") */
export const TU_CAM_EN: string[] = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'porn', 'sex', 'nigg', 'hitler', 'nazi', 'rape', 'whore', 'slut',
];
/** Chữ đứng riêng, so CÓ dấu (để "Dư", "Cù", "Ngư" không bị chặn) */
export const TU_CAM_DAU: string[] = ['đụ', 'địt', 'đít', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đcm', 'đm'];
/** Chữ đứng riêng, so sau khi bỏ dấu: các kiểu viết tắt, viết không dấu thường gặp */
export const TU_CAM_RIENG: string[] = ['dm', 'dcm', 'cl', 'vl', 'cc', 'lz', 'loz', 'dj', 'djt', 'dit', 'deo', 'lon', 'buoi', 'cac', 'cak', 'cax', 'dmm'];

/** Bỏ dấu tiếng Việt, đ -> d, viết thường */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Tên có chứa từ cấm không */
export function tenTuc(name: string): boolean {
  const flat = boDau(name);
  const words = flat.split(/\s+/).filter(Boolean);
  // gộp ký tự lặp: "fuuuck" -> "fuck"
  const joined = words.join('').replace(/(.)\1+/g, '$1');
  const joinedRaw = words.join('');
  if (TU_CAM.some((w) => joinedRaw.includes(w))) return true;
  if (TU_CAM_EN.some((w) => joinedRaw.includes(w) || joined.includes(w.replace(/(.)\1+/g, '$1')))) return true;
  if (words.some((w) => TU_CAM_RIENG.includes(w))) return true;
  return name.toLowerCase().split(/\s+/).some((w) => TU_CAM_DAU.includes(w.normalize('NFC')));
}
