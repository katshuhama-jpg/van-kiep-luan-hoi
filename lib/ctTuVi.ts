/**
 * 21/11 (Ngày 22): gọi máy chủ tu vi chân thân. Mọi số tính ở máy chủ (supabase/ct_tu_vi_2026_11_21.sql);
 * client không gửi số nào, máy chủ tự đọc năm sống từ vkl_lives. Cờ CT_TU_VI_ON tắt thì không gọi gì.
 */
import { CT_TU_VI_ON } from './flags';
import { supabase } from './supabase';
import type { Player } from './auth';

export interface CtTuVi {
  chuyen: number;
  /** số tầng đã đạt 0..4 (4 = Viên mãn, đủ ngưỡng đột phá) */
  tang: number;
  tu_vi: number;
  thanh: number;
  nguong: number | null;
  binh_canh: number | null;
  cham_binh_canh: boolean;
  toc_do_gio: number;
  gio_chot: string;
  tong_tu_vi: number;
  can_co: Record<string, number>;
  so_lan_truot: number;
  so_kiep_ngay: number;
  luc_chien: number;
  dot_pha: { ti_le: number; can_co: number; chia: 'kim_dan' | 'do_kiep' | 'hong_hoang' | null } | null;
  vua_tu?: { offline: number; kiep: number; so_kiep: number; tang_len: number; qua_dau: boolean };
}
export interface CtDotPha {
  ok: boolean;
  ti_le?: number;
  can_co?: number;
  mat?: number;
  chia?: string;
  luc_chien_them?: number;
  trang_thai: CtTuVi;
}

async function call<T>(fn: string, user: Player | null): Promise<T | null> {
  if (!CT_TU_VI_ON || !user) return null;
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc(fn, { p_token: user.token });
  if (error) throw error;
  return data as T;
}

/** mở màn chân thân: chốt offline, tính kiếp mới, trả trạng thái */
export const ctTvGet = (user: Player | null) => call<CtTuVi>('ct_tv_get', user);
/** sau khi khắc bia (vkl_add_life): máy chủ cộng tu vi các kiếp mới */
export const ctTvLife = (user: Player | null) => call<{ kiep: number; so_kiep: number; tang_len: number; trang_thai: CtTuVi }>('ct_tv_life', user);
/** bấm Đột phá (chỉ khi Viên mãn đủ ngưỡng) */
export const ctTvDotPha = (user: Player | null) => call<CtDotPha>('ct_tv_dot_pha', user);
