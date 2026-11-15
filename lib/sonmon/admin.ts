'use client';

/**
 * 4.6.0 Sơn Môn, Ngày 6: gọi máy chủ cho trang quản trị và Sổ Sinh Tử (supabase/son_mon_ket_ky_2026_11_16.sql).
 * - vkl_sm_admin(token): chỉ trả dữ liệu khi tên đăng nhập nằm trong bảng vkl_sm_admin_user (máy chủ kiểm, trình duyệt không quyết).
 * - vkl_sm_ky_kq(): công khai, kết quả các Kỷ đã kết (tên môn ghi vào Sổ Sinh Tử).
 */
import { currentPlayer } from '../auth';
import { supabase } from '../supabase';
import { SmErr } from './api';

export type SmAdminCo = { id: number; luc: string; loai: string; ct: Record<string, unknown>; mon: string | null; mon_b: string | null; nguoi: string | null };
export type SmAdmin = {
  luc: string;
  ky: { id: number; bat_dau: string; ket_thuc: string; ban_kinh: number; ket_xong: boolean; ket_luc: string | null } | null;
  ky_chay: boolean;
  mon: { dung: number; du_ky: number; cho_ky: number; giai_tan: number };
  nguoi: number;
  diem_danh_hom_nay: number;
  o: { tong: number; co_chu: number };
  tran_ngay: { ngay: string; tran: number; giu_thang: number; cam_co: number }[];
  top: { id: number; ten: string; n: number; o: number; du_ky: boolean }[];
  co: SmAdminCo[];
};
export type SmKyKqMon = { hang: number; ten: string; huy_hieu: number; o: number; kv: number; n: number; khac: boolean; vang: boolean };
export type SmKyKq = { ky: number; bat_dau: string; ket_thuc: string; mon: SmKyKqMon[] };

const codeOf = (msg: string) => (msg.match(/SM_[A-Z_]+/) ?? ['SM_NET'])[0];

export async function smAdmin(): Promise<SmAdmin> {
  const sb = supabase();
  const tok = currentPlayer()?.token;
  if (!sb) throw new SmErr('SM_NET');
  if (!tok) throw new SmErr('SM_AUTH');
  const res = await sb.rpc('vkl_sm_admin', { p_token: tok }).then(
    (r) => r,
    () => null,
  );
  if (!res) throw new SmErr('SM_NET');
  if (res.error) throw new SmErr(codeOf(res.error.message));
  return res.data as SmAdmin;
}

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
