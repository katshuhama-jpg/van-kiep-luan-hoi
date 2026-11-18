'use client';

/** 4.6.0 Sơn Môn: phần dùng chung giữa các màn (đồng hồ, số, ngữ cảnh). */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import type { SmAct, SmApi, SmMap, SmMembers, SmMonRow, SmRankRow, SmState } from '@/lib/sonmon/api';

export type SmView = 'list' | 'lap' | 'chon-o' | 'mon' | 'ban-do' | 'xuat-chinh' | 'chien-su' | 'thanh-vien' | 'ky' | 'luc-chien' | 'luat' | 'chat' | 'thuong';
export const SM_VIEWS: SmView[] = ['list', 'lap', 'chon-o', 'mon', 'ban-do', 'xuat-chinh', 'chien-su', 'thanh-vien', 'ky', 'luc-chien', 'luat', 'chat', 'thuong'];

/** bản nháp lập môn (M2 -> M3) */
export type SmDraft = { ten: [string, string, string]; huy: number; cd: number; dkKiep: number; dkNgay: number; moCua: boolean };

export type SmCtx = {
  api: SmApi;
  st: SmState;
  list: SmMonRow[] | null;
  map: SmMap | null;
  members: SmMembers | null;
  rank: SmRankRow[] | null;
  go: (v: SmView, o?: { target?: [number, number] }) => void;
  /** ô đang chọn trên bản đồ (để mở M6 xem trước khi phát lệnh) */
  target: [number, number] | null;
  draft: SmDraft | null;
  setDraft: (d: SmDraft | null) => void;
  /** gửi lệnh, tự làm mới trạng thái; trả null nếu xong, câu lỗi nếu hỏng */
  run: (a: SmAct, after?: (r: Record<string, unknown>) => void) => Promise<string | null>;
  busy: boolean;
  reload: (what?: ('state' | 'list' | 'map' | 'members' | 'rank')[]) => void;
};

export const fmtN = (n: number) => Math.round(n).toLocaleString('vi-VN');

/** đồng hồ chạy mỗi giây (dừng khi không cần) */
export function useNow(on = true) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  return t;
}

/** còn bao lâu: 00:42:10 (dưới 1 giờ: 42:10) */
export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return h > 0 ? `${p(h)}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}

/** giờ VN dạng 15:10 */
export function hhmm(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
/** ngày VN dạng 1/12 */
export function ngayThang(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** 18/11: mốc giờ kèm ngày, ví dụ "18:58 hôm nay (18/11)", "06:58 ngày mai (19/11)", "06:58 ngày 20/11" */
export function mocGio(iso: string, now = Date.now(), gon = false) {
  const ngay = (t: number) => Math.floor((t + 7 * 3600e3) / 86400e3);
  const d = ngay(new Date(iso).getTime()) - ngay(now);
  const nt = ngayThang(iso);
  if (gon && d === 0) return tr(`${hhmm(iso)} hôm nay`, `${hhmm(iso)} today`);
  if (gon && d === 1) return tr(`${hhmm(iso)} ngày mai`, `${hhmm(iso)} tomorrow`);
  if (d === 0) return tr(`${hhmm(iso)} hôm nay (${nt})`, `${hhmm(iso)} today (${nt})`);
  if (d === 1) return tr(`${hhmm(iso)} ngày mai (${nt})`, `${hhmm(iso)} tomorrow (${nt})`);
  return tr(`${hhmm(iso)} ngày ${nt}`, `${hhmm(iso)} on ${nt}`);
}

/** bao lâu trước: vừa xong, 12 phút, 3 giờ, hôm qua, 3 ngày */
export function truoc(iso: string, now = Date.now()) {
  const m = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (m < 2) return tr('vừa xong', 'just now');
  if (m < 60) return tr(`${m} phút trước`, `${m} min ago`);
  const h = Math.floor(m / 60);
  if (h < 24) return tr(`${h} giờ trước`, `${h} h ago`);
  const d = Math.floor(h / 24);
  return d === 1 ? tr('hôm qua', 'yesterday') : tr(`${d} ngày trước`, `${d} days ago`);
}

export function Msg({ err, ok }: { err?: string | null; ok?: string | null }) {
  if (err) return <p className="sm-err" role="alert">{err}</p>;
  if (ok) return <p className="sm-ok" role="status">{ok}</p>;
  return null;
}

/** dòng đồng minh: chưa làm, không hứa ngày */
export function DongMinh() {
  return <p className="sm-note">{tr('Đồng minh: sắp có - các sơn môn kết minh để không đánh nhau và cùng giữ ô.', 'Alliances: coming - sects will ally so they do not fight and can hold tiles together.')}</p>;
}

/** 18/11: máy chủ đã có bảo hộ môn mới (moi_bh_toi) / đi đường khi đổi ô (di_toi) chưa. Chưa có thì giữ giao diện cũ. */
export function smCo(st: { mon: object | null }) {
  return { bh: !!st.mon && 'moi_bh_toi' in st.mon, di: !!st.mon && 'di_toi' in st.mon };
}

export const chucTen = (c: string) => (c === 'chu' ? tr('Môn chủ', 'Master') : c === 'lao' ? tr('Trưởng lão', 'Elder') : tr('Đệ tử', 'Disciple'));
