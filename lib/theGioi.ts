'use client';

/**
 * Ngày 38 (lên 21/11, góp ý #302): kênh chat Thế giới. Máy chủ: supabase/the_gioi_chat_2026_11_21.sql.
 * Chi phí: KHÔNG dùng kênh realtime.
 *   - Tấm đang mở và tab đang hiện: hỏi tin mới (vkl_wc_list sau id) 8 giây một lần.
 *   - Tấm đóng: chỉ đếm tin mới (vkl_wc_n) 90 giây một lần khi tab đang hiện, để bật chấm đỏ.
 *   - Tab ẩn: dừng hẳn. Tab hiện lại thì hỏi một lần nếu đã quá hạn.
 * Máy chủ chưa có hàm (chưa áp SQL) thì tự tắt nút cho tới khi tải lại trang.
 */
import { currentPlayer } from './auth';
import { WC_ON } from './flags';
import { tr } from './i18n';
import { supabase } from './supabase';

export type WcTin = {
  id: number;
  luc: string;
  nd: string;
  ta?: boolean;
  he?: boolean;
  nd_en?: string | null;
  /** tên chân thân */
  ten?: string;
  /** cảnh giới cao nhất từng đạt (số) và cõi */
  rn?: number;
  co?: 'tien' | 'ma' | 'hu' | 'hg' | null;
  /** con đường của kiếp gần nhất */
  p?: string;
  mon?: string;
};
export type WcLy = 'WC_AUTH' | 'WC_NO_CT' | 'WC_NO_GG' | 'WC_CAM';
export type WcList = { tin: WcTin[]; gui: boolean; ly: WcLy | null; toi: string | null };

export const WC_MAX = 512;
export const WC_MO_MS = 8000;
export const WC_DONG_MS = 90000;
const SEEN = 'vkl.wc.seen';

export class WcErr extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

let off = false;
/** máy chủ chưa có hàm kênh Thế giới: ẩn nút */
export const wcOff = () => !WC_ON || off;

async function rpc<T>(fn: string, a: Record<string, unknown>): Promise<T> {
  const sb = supabase();
  const tok = currentPlayer()?.token;
  if (!sb) throw new WcErr('WC_NET');
  if (!tok) throw new WcErr('WC_AUTH');
  let res;
  try {
    res = await sb.rpc(fn, { p_token: tok, ...a });
  } catch {
    throw new WcErr('WC_NET');
  }
  if (res.error) {
    const e = res.error as { code?: string; message?: string };
    if (e.code === 'PGRST202' || e.code === '42883') off = true;
    throw new WcErr((e.message ?? '').match(/WC_[A-Z_]+/)?.[0] ?? 'WC_NET');
  }
  return res.data as T;
}

export const wcList = (sau: number) =>
  rpc<WcList>('vkl_wc_list', { p_sau: sau }).then((x) => ({ tin: x?.tin ?? [], gui: !!x?.gui, ly: (x?.ly ?? null) as WcLy | null, toi: x?.toi ?? null }));
export const wcN = (sau: number) => rpc<number>('vkl_wc_n', { p_sau: sau }).then((x) => Number(x) || 0);
export const wcSend = (nd: string) => rpc<WcTin>('vkl_wc_send', { p_nd: nd });
export const wcReport = (id: number) => rpc<{ so_bao: number; an: boolean; cam?: boolean }>('vkl_wc_report', { p_id: id });

export function wcSeen(id: number) {
  try {
    if (id > wcLastSeen()) localStorage.setItem(SEEN, String(id));
  } catch {}
}
export function wcLastSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** lời báo lỗi khi gửi hoặc báo xấu */
export function wcLoi(code: string): string {
  switch (code) {
    case 'WC_NHANH':
      return tr('Chậm lại chút: mỗi tin cách nhau 10 giây.', 'Slow down: one message every 10 seconds.');
    case 'WC_NHIEU':
      return tr('Bạn gửi 20 tin trong 5 phút rồi. Nghỉ tay một lát nhé.', 'You sent 20 messages in 5 minutes. Take a short break.');
    case 'WC_TRUNG':
      return tr('Tin này giống hệt tin bạn vừa gửi.', 'This is the same as your last message.');
    case 'WC_DAI':
      return tr(`Tin dài quá, tối đa ${WC_MAX} chữ.`, `Too long, ${WC_MAX} characters at most.`);
    case 'WC_TRONG':
      return tr('Tin còn trống.', 'The message is empty.');
    case 'WC_CAM':
      return tr('Bạn đang bị khóa chat.', 'You are muted for now.');
    case 'WC_NO_GG':
    case 'WC_NO_CT':
    case 'WC_AUTH':
      return tr('Tài khoản chưa đủ điều kiện để gửi.', 'Your account cannot send yet.');
    case 'WC_KHONG_CO':
      return tr('Tin này không còn nữa.', 'This message is gone.');
    case 'WC_QUYEN':
      return tr('Không báo được tin này.', 'You cannot report this message.');
    default:
      return tr('Không kết nối được máy chủ, thử lại sau.', 'Could not reach the server, try again.');
  }
}
