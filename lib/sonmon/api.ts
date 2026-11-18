'use client';

/**
 * 4.6.0 Sơn Môn: gọi máy chủ (RPC vkl_sm_* trong supabase/son_mon_gon_2026_11_15.sql).
 * Trình duyệt chỉ gửi lệnh; mọi kiểm tra quyền, khóa, lượt ở hàm máy chủ.
 * Bản đồ đọc qua /api/pub/sm-map (bộ đệm Vercel 30 giây).
 */
import { currentPlayer } from '../auth';
import { tr } from '../i18n';
import { supabase } from '../supabase';
import { SM_LOI } from './data';

// ---------- Kiểu dữ liệu máy chủ trả về ----------
export type SmKy = { id: number; bat_dau: string; ket_thuc: string; ban_kinh: number; ket_xong?: boolean };
export type SmChuc = 'chu' | 'lao' | 'de';
export type SmTileMine = { q: number; r: number; ten: string; cd: boolean; bao_ho_toi: string | null };
export type SmTheo = { ten: string; lc: number; ta?: boolean };
export type SmChinh = {
  id: number;
  toi: [number, number];
  ten_o: string;
  tap_hop_toi: string;
  toi_noi_luc: string;
  trang_thai: 'tap_hop' | 'di';
  n: number;
  ta_theo: boolean;
  /** chưa có ở máy chủ (vkl_sm_state chỉ trả số người): khi có thì hiện tên từng người */
  theo?: SmTheo[];
  nguoi_phat?: string;
};
export type SmBiDanh = { id: number; o: [number, number]; ten_o: string; tu_mon: string; huy_hieu: number; toi_noi_luc: string; trang_thai: 'tap_hop' | 'di' };
export type SmTrinhKq = { trong: boolean; ten_o: string; mon?: number; n?: number; lc?: number; bao_ho_toi?: string | null };
export type SmTrinh = { id: number; o: [number, number]; xong_luc: string; ket_qua: SmTrinhKq | null };
export type SmBao = {
  id: number;
  luc: string;
  loai: 'tran' | 'cam_co' | 'huy' | 'mat_het';
  a: number | null;
  b: number | null;
  ten_a: string | null;
  ten_b: string | null;
  o: [number, number];
  nd: { kq?: string; ten_o?: string; atk?: number; def?: number; n_atk?: number; n_def?: number; dau?: boolean; ly_do?: string } | null;
};
export type SmLcPhan = {
  nam: number; kiep: number; canh: number; ket_cuc: number; ngay: number; huyet: number; vien_man: number;
  p_nam: number; p_kiep: number; p_canh: number; p_ket_cuc: number; p_ngay: number; nhan: number;
};
export type SmMonMine = {
  id: number; ten: string; ten1: string; ten2: string; ten3: string;
  huy_hieu: number; chinh_dien_hinh: number;
  dk_kiep: number; dk_tuoi_dao: number; mo_cua: boolean;
  du_ky: boolean; het_han_ky: string; cam_co: boolean; so_ky: number;
  n: number; o: number; o_max: number;
  kv_hom_nay: number; kv_hom_qua: number; kv_bonus: number;
  chuc: SmChuc; dung: [number, number] | null;
  tiles: SmTileMine[];
  don_cho: number | null;
};
export type SmNv = { bac: 1 | 2 | 3; kiep: number; tuoi: number; canh: number; xong: [boolean, boolean, boolean]; muc: [number, number, number]; thuong: [number, number, number] };
export type SmState = {
  ky: SmKy | null;
  ky_chay: boolean;
  lc: number | null;
  lc_phan: SmLcPhan | null;
  kiep: number;
  ngay: number;
  lap_can: { kiep: number; ngay: number; ha: boolean };
  /** khóa LẬP môn sau khi tự rời (24 giờ) */
  khoa_toi: string | null;
  /** 18/11: khóa VÀO môn sau khi tự rời (12 giờ); máy chủ cũ không trả thì coi như khoa_toi */
  khoa_vao_toi?: string | null;
  nghi_toi: string | null;
  ky_cung: number[];
  don: { id: number; mon: number; ten: string }[];
  mon: SmMonMine | null;
  diem_danh?: { hom_nay: boolean; chuoi: number; da_thuong: boolean };
  nv?: SmNv | null;
  chinh?: SmChinh[];
  bi_danh?: SmBiDanh[];
  trinh?: SmTrinh[];
  bao?: SmBao[];
};
export type SmMonRow = {
  id: number; ten: string; huy_hieu: number; chinh_dien_hinh: number;
  n: number; toi_da: number; mo_cua: boolean; dk_kiep: number; dk_tuoi_dao: number; du_dk: boolean;
  o: number; du_ky: boolean; so_ky: number; het_han_ky: string; ta_ky: boolean; mon_chu: string | null; lc: number;
};
/** ô bản đồ: [q, r, tên, cõi, môn chủ, chính điện, bảo hộ tới] */
export type SmMapO = [number, number, string, 'thien' | 'hong_tran' | 'u_minh', number | null, boolean, string | null];
export type SmMap = {
  ky: SmKy | null;
  o: SmMapO[];
  mon: Record<string, { ten: string; huy_hieu: number }>;
  di: { mon: number; tu: [number, number]; toi: [number, number]; toi_noi_luc: string; trang_thai: string }[];
};
export type SmMember = { ten: string; tk: string; chuc: SmChuc; lc: number; dung: [number, number] | null; nghi: boolean; kv: number };
/** 18/11: người trong một môn, cho người chưa vào môn xem trước (vkl_sm_mon_ds) */
export type SmMonNguoi = { ten: string; chuc: SmChuc; lc: number; ta?: boolean };
export type SmMembers = { ds: SmMember[]; don: { id: number; ten: string; lc: number; luc: string }[] | null };
export type SmRankRow = { id: number; ten: string; huy_hieu: number; o: number; kv: number; n: number };

// ---------- Lỗi ----------
/** Mã lỗi có trong SM_LOI (lib/sonmon/data.ts) dùng câu ở đó; các mã còn lại ở đây. */
const LOI_THEM: Record<string, string> = {
  SM_TEN: tr('Tên môn phải chọn từ danh sách.', 'Pick the sect name from the lists.'),
  SM_HINH: tr('Chọn lại huy hiệu và chính điện.', 'Pick the crest and hall again.'),
  SM_DK: tr('Điều kiện vào không hợp lệ.', 'Invalid entry requirements.'),
  SM_KHONG_CO_MON: tr('Môn này không còn nữa.', 'This sect no longer exists.'),
  SM_DA_DU_KY: tr('Môn đã đủ chữ ký.', 'This sect already has enough signatures.'),
  SM_TU_KY: tr('Không tự ký môn của chính mình.', 'You cannot sign your own sect.'),
  SM_DA_KY: tr('Ngươi đã ký môn này.', 'You already signed this sect.'),
  SM_KY_NHIEU: tr('Mỗi Kỷ chỉ ký cùng lập tối đa 2 môn.', 'You can co-sign at most 2 sects per era.'),
  SM_CHUA_CO_MON: tr('Ngươi chưa vào môn nào.', 'You are not in a sect.'),
  SM_DA_CO_O: tr('Môn đã cắm cờ rồi.', 'Your sect already planted its flag.'),
  SM_O: tr('Không có ô này.', 'No such tile.'),
  SM_O_CO_CHU: tr('Ô này đã có chủ. Chọn ô trống khác.', 'This tile is taken. Pick an empty one.'),
  SM_O_DANG_BI_TOI: tr('Có môn đang tới ô này. Chọn ô khác.', 'A sect is marching on this tile. Pick another.'),
  SM_MO_CUA: tr('Môn này mở cửa, vào ngay được.', 'This sect is open, join directly.'),
  SM_DON_NHIEU: tr('Ngươi đã có 3 đơn đang chờ.', 'You already have 3 pending applications.'),
  SM_DON: tr('Đơn này đã được xử lý.', 'This application was already handled.'),
  SM_CHUC: tr('Chức không hợp lệ.', 'Invalid rank.'),
  SM_LAO_DU: tr('Môn đã đủ 3 trưởng lão.', 'The sect already has 3 elders.'),
  SM_O_KHONG_CUA_TA: tr('Chỉ đứng giữ ô của môn ta.', 'You can only guard your own tiles.'),
  SM_DANG_DI: tr('Ngươi đang đi xuất chinh, chưa đổi ô được.', 'You are on the march and cannot switch tiles.'),
  SM_DANG_TRINH: tr('Ngươi đang có một chuyến trinh sát.', 'You already have a scout out.'),
  SM_CHUA_CO_O: tr('Môn chưa cắm cờ ô nào.', 'Your sect has not planted a flag yet.'),
  SM_O_CUA_TA: tr('Ô này đã là của môn ta.', 'This tile is already ours.'),
  SM_TEN_O_THIEU: tr('Máy chủ thiếu tên ô.', 'Server is missing tile names.'),
  SM_NET: tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later."),
};
export class SmErr extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
export const smLoi = (e: unknown): string => {
  const code = e instanceof SmErr ? e.code : 'SM_NET';
  return SM_LOI[code] ?? LOI_THEM[code] ?? LOI_THEM.SM_NET;
};
const codeOf = (msg: string) => (msg.match(/SM_[A-Z_]+/) ?? ['SM_NET'])[0];

// ---------- Giao tiếp chung (bản thật và bản giả ?demo=1 cùng một kiểu) ----------
export type SmAct =
  | { fn: 'found'; ten: [string, string, string]; huy: number; cd: number; dkKiep: number; dkNgay: number; moCua: boolean }
  | { fn: 'cosign' | 'join' | 'apply'; mon: number }
  | { fn: 'pick_tile' | 'guard' | 'scout' | 'march'; q: number; r: number }
  | { fn: 'follow' | 'unfollow'; chinh: number }
  | { fn: 'accept'; don: number; nhan: boolean }
  | { fn: 'kick'; tk: string }
  | { fn: 'role'; tk: string; chuc: 'lao' | 'de' }
  | { fn: 'set_dk'; dkKiep: number; dkNgay: number; moCua: boolean }
  | { fn: 'leave' | 'checkin' };

/** một tin Truyền âm; nd đã được máy chủ che từ tục, ẩn link và số điện thoại */
export type SmChat = { id: number; luc: string; nd: string; ta: boolean; tk: string; ten: string; chuc: 'chu' | 'lao' | 'de' | null };

export interface SmApi {
  demo: boolean;
  /** có tài khoản (token) hay không: khách chơi thử thì false */
  linked: boolean;
  username: string | null;
  state(): Promise<SmState>;
  list(): Promise<SmMonRow[]>;
  map(): Promise<SmMap>;
  rank(): Promise<SmRankRow[]>;
  members(): Promise<SmMembers>;
  /** 18/11: xem người trong một môn trước khi vào */
  monDs(mon: number): Promise<SmMonNguoi[]>;
  /** 17/11 Truyền âm (chat trong môn) */
  chatList(sau: number): Promise<SmChat[]>;
  chatSend(nd: string): Promise<SmChat>;
  chatN(sau: number): Promise<number>;
  chatHide(id: number): Promise<unknown>;
  chatReport(id: number): Promise<{ so_bao: number; an: boolean }>;
  /** id môn sư phụ đang ở (Sư Đồ), null nếu không có */
  suMon(): Promise<number | null>;
  act(a: SmAct): Promise<Record<string, unknown>>;
}

function args(a: SmAct): Record<string, unknown> {
  switch (a.fn) {
    case 'found':
      return { p_ten1: a.ten[0], p_ten2: a.ten[1], p_ten3: a.ten[2], p_huy_hieu: a.huy, p_chinh_dien: a.cd, p_dk_kiep: a.dkKiep, p_dk_tuoi_dao: a.dkNgay, p_mo_cua: a.moCua };
    case 'cosign':
    case 'join':
    case 'apply':
      return { p_mon: a.mon };
    case 'pick_tile':
    case 'guard':
    case 'scout':
    case 'march':
      return { p_q: a.q, p_r: a.r };
    case 'follow':
    case 'unfollow':
      return { p_chinh: a.chinh };
    case 'accept':
      return { p_don: a.don, p_nhan: a.nhan };
    case 'kick':
      return { p_username: a.tk };
    case 'role':
      return { p_username: a.tk, p_chuc: a.chuc };
    case 'set_dk':
      return { p_dk_kiep: a.dkKiep, p_dk_tuoi_dao: a.dkNgay, p_mo_cua: a.moCua };
    default:
      return {};
  }
}

async function rpc<T>(fn: string, a: Record<string, unknown>, withToken = true): Promise<T> {
  const sb = supabase();
  if (!sb) throw new SmErr('SM_NET');
  const tok = currentPlayer()?.token;
  if (withToken && !tok) throw new SmErr('SM_AUTH');
  let res;
  try {
    res = await sb.rpc(fn, withToken ? { p_token: tok, ...a } : a);
  } catch {
    throw new SmErr('SM_NET');
  }
  if (res.error) throw new SmErr(codeOf(res.error.message));
  return res.data as T;
}

export function realApi(): SmApi {
  const p = currentPlayer();
  return {
    demo: false,
    linked: !!p,
    username: p?.username ?? null,
    state: () => rpc<SmState>('vkl_sm_state', {}),
    list: () => rpc<SmMonRow[]>('vkl_sm_list', {}),
    members: () => rpc<SmMembers>('vkl_sm_members', {}),
    monDs: (mon) => rpc<SmMonNguoi[]>('vkl_sm_mon_ds', { p_mon: mon }),
    rank: () => rpc<SmRankRow[]>('vkl_sm_rank', {}, false),
    chatList: (sau) => rpc<SmChat[]>('vkl_sm_chat_list', { p_sau: sau }),
    chatSend: (nd) => rpc<SmChat>('vkl_sm_chat_send', { p_nd: nd }),
    chatN: (sau) => rpc<number>('vkl_sm_chat_n', { p_sau: sau }).then((x) => Number(x) || 0, () => 0),
    chatHide: (id) => rpc('vkl_sm_chat_hide', { p_id: id }),
    chatReport: (id) => rpc<{ so_bao: number; an: boolean }>('vkl_sm_chat_report', { p_id: id }),
    suMon: () => rpc<number | null>('vkl_sm_su_mon', {}).then((x) => (x == null ? null : Number(x)), () => null),
    map: async () => {
      let r: Response;
      try {
        r = await fetch('/api/pub/sm-map');
      } catch {
        throw new SmErr('SM_NET');
      }
      if (!r.ok) throw new SmErr(r.status === 404 ? 'SM_CHUA_MO' : 'SM_NET');
      return (await r.json()) as SmMap;
    },
    act: (a) => rpc<Record<string, unknown>>(`vkl_sm_${a.fn}`, args(a)),
  };
}
