'use client';

/**
 * 4.6.0 Sơn Môn, Ngày 6: gọi máy chủ cho Sổ Sinh Tử (trang quản trị /quan-tri/son-mon đã bỏ 19/11, Tyler xem bằng dashboard artifact) (supabase/son_mon_ket_ky_2026_11_16.sql).
 * - vkl_sm_ky_kq(): công khai, kết quả các Kỷ đã kết (tên môn ghi vào Sổ Sinh Tử).
 */
import { supabase } from '../supabase';

export type SmKyKqMon = { hang: number; ten: string; huy_hieu: number; o: number; kv: number; n: number; khac: boolean; vang: boolean };
export type SmKyKq = { ky: number; bat_dau: string; ket_thuc: string; mon: SmKyKqMon[] };


export async function smKyKq(): Promise<SmKyKq[]> {
  const sb = supabase();
  if (!sb) return [];
  const res = await sb.rpc('vkl_sm_ky_kq').then(
    (r) => r,
    () => null,
  );
  if (!res || res.error) return [];
  return (res.data ?? []) as SmKyKq[];
}
