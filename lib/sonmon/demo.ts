/**
 * 4.6.0 Sơn Môn: dữ liệu giả cho `?demo=<vai>` - CHỈ dùng khi chạy dev (NODE_ENV !== 'production'),
 * để chụp ảnh từng màn khi máy chủ thật chưa có Kỷ nào. Bản build production không nạp file này.
 * Vai: 1 hoặc chu (môn chủ), de (đệ tử), cho (môn mới lập, chờ chữ ký), chua (chưa có môn), du (đủ điều kiện lập),
 * trong (ngày đầu, chưa môn nào mở), khach (chưa liên kết), noct (chưa có chân thân), chuamo (Kỷ chưa mở).
 */
import { banDo, coiCua, O_A, O_B } from './data';
import { SmErr, type SmBvNhan, type SmAct, type SmApi, type SmChat, type SmMap, type SmMapO, type SmMembers, type SmMonNguoi, type SmMonRow, type SmRankRow, type SmState } from './api';

const now = Date.now();
const at = (min: number) => new Date(now + min * 60_000).toISOString();

const TEN_DAT: Record<string, string> = {
  '1,0': 'Thanh Vân Lĩnh', '2,0': 'Lạc Hà Cốc', '1,1': 'Tử Trúc Lâm', '2,-1': 'Kim Ô Đài',
  '3,-1': 'Vọng Nguyệt Phong', '4,-1': 'Thiết Huyết Nhai', '3,-2': 'Xích Diễm Động',
  '0,2': 'Bích Thủy Hồ', '-1,2': 'Lưu Vân Xuyên', '0,3': 'Bạch Lộc Nguyên',
  '-3,0': 'Huyền Băng Lĩnh', '-4,1': 'Phi Tuyết Khâu', '2,3': 'Hồng Liên Tuyền', '3,2': 'Cổ Tùng Lâm',
};
const CHU: Record<string, number> = {
  '1,0': 1, '2,0': 1, '1,1': 1, '2,-1': 1,
  '3,-1': 2, '4,-1': 2, '3,-2': 2,
  '0,2': 3, '-1,2': 3, '0,3': 3,
  '-3,0': 4, '-4,1': 4, '2,3': 5, '3,2': 5,
};
const MON: SmMap['mon'] = {
  '1': { ten: 'Thanh Hư Tông', huy_hieu: 15 },
  '2': { ten: 'Huyết Sát Cung', huy_hieu: 3 },
  '3': { ten: 'Vân Hà Các', huy_hieu: 11 },
  '4': { ten: 'Tử Lôi Phái', huy_hieu: 22 },
  '5': { ten: 'Kim Long Điện', huy_hieu: 7 },
};

function map(withMine: boolean): SmMap {
  const o: SmMapO[] = banDo(6).map((h, i) => {
    const k = `${h.q},${h.r}`;
    let chu: number | null = CHU[k] ?? null;
    if (!withMine && chu === 1) chu = null;
    const ten = TEN_DAT[k] ?? `${O_A[(i * 7) % O_A.length]} ${O_B[(i * 5) % O_B.length]}`;
    const cd = ['1,0', '3,-1', '0,2', '-3,0', '2,3'].includes(k);
    // 18/11: môn 4 (Tử Lôi Phái) là môn mới, đang bảo hộ 41 giờ; ô -4,1 bảo hộ 3 giờ sau khi bị chiếm
    return [h.q, h.r, ten, coiCua(h), chu, cd, chu === 4 ? at(41 * 60) : k === '-4,1' ? at(200) : null];
  });
  return {
    ky: { id: 1, bat_dau: at(-8 * 1440), ket_thuc: at(6 * 1440 + 200), ban_kinh: 6 },
    o,
    mon: withMine ? MON : Object.fromEntries(Object.entries(MON).filter(([k]) => k !== '1')),
    di: withMine ? [{ mon: 2, tu: [3, -1], toi: [2, 0], toi_noi_luc: at(42), trang_thai: 'di' }, { mon: 1, tu: [1, 1], toi: [0, 2], toi_noi_luc: at(38), trang_thai: 'tap_hop' }] : [],
  };
}

const LC_PHAN = { nam: 6400, kiep: 64, canh: 7, ket_cuc: 22, ngay: 7, huyet: 2, vien_man: 0, p_nam: 2400, p_kiep: 835, p_canh: 560, p_ket_cuc: 330, p_ngay: 350, nhan: 1.08 };
const LC_MOI = { nam: 1148, kiep: 8, canh: 3, ket_cuc: 8, ngay: 2, huyet: 0, vien_man: 0, p_nam: 1016, p_kiep: 439, p_canh: 240, p_ket_cuc: 120, p_ngay: 100, nhan: 1 };

function baseState(vai: string): SmState {
  const du = vai === 'du' || vai === 'chu' || vai === 'cho' || vai === 'roi';
  return {
    ky: vai === 'chuamo' ? null : { id: 1, bat_dau: at(-8 * 1440), ket_thuc: at(6 * 1440 + 200), ban_kinh: 6 },
    ky_chay: vai !== 'chuamo',
    lc: du ? 4833 : 1915,
    lc_phan: du ? LC_PHAN : LC_MOI,
    kiep: du ? 64 : 8,
    ngay: du ? 7 : 2,
    lap_can: { kiep: 30, ngay: 5, ha: false },
    // ?demo=roi: vừa tự rời môn đã cắm cờ (vào lại sau 12 giờ, lập sau 24 giờ)
    khoa_toi: vai === 'roi' ? at(20 * 60) : null,
    khoa_vao_toi: vai === 'roi' ? at(8 * 60) : null,
    nghi_toi: null,
    ky_cung: [],
    don: vai === 'chua' ? [{ id: 4, mon: 3, ten: 'Vân Hà Các' }] : [],
    mon: null,
  };
}

function monState(vai: string): SmState {
  const s = baseState(vai === 'de' ? 'chua' : vai);
  const cho = vai === 'cho';
  const tiles = cho
    ? []
    : [
        { q: 1, r: 0, ten: 'Thanh Vân Lĩnh', cd: true, bao_ho_toi: null },
        { q: 2, r: 0, ten: 'Lạc Hà Cốc', cd: false, bao_ho_toi: null },
        { q: 1, r: 1, ten: 'Tử Trúc Lâm', cd: false, bao_ho_toi: null },
        { q: 2, r: -1, ten: 'Kim Ô Đài', cd: false, bao_ho_toi: at(150) },
      ];
  return {
    ...s,
    mon: {
      id: 1, ten: 'Thanh Hư Tông', ten1: 'Thanh', ten2: 'Hư', ten3: 'Tông', huy_hieu: 15, chinh_dien_hinh: 0,
      dk_kiep: 5, dk_tuoi_dao: 2, mo_cua: true, du_ky: !cho, het_han_ky: at(cho ? 1100 : -5000), cam_co: !cho, so_ky: cho ? 1 : 2, moi_bh_toi: cho ? null : at(30 * 60), di_toi: null,
      n: cho ? 2 : 12, o: tiles.length, o_max: cho ? 1 : 5, kv_hom_nay: cho ? 3 : 24, kv_hom_qua: cho ? 0 : 33, kv_bonus: cho ? 0 : 0.1,
      chuc: vai === 'de' ? 'de' : 'chu', dung: cho ? null : [1, 0], tiles, don_cho: vai === 'de' ? null : cho ? 0 : 2,
    },
    diem_danh: { hom_nay: false, chuoi: cho ? 0 : 5, da_thuong: false },
    nv: { bac: vai === 'de' ? 2 : 2, kiep: 2, tuoi: 87, canh: 2, xong: [true, false, false], muc: [2, 120, 3], thuong: [2, 3, 5] },
    chinh: cho
      ? []
      : [{
          id: 7, toi: [0, 2], ten_o: 'Bích Thủy Hồ', tap_hop_toi: at(18.3), toi_noi_luc: at(38.3), trang_thai: 'tap_hop', n: 6, ta_theo: false, nguoi_phat: 'Vân Nhi',
          theo: [{ ten: 'Vân Nhi', lc: 3120 }, { ten: 'Hàn Sương', lc: 2050 }, { ten: 'Mộc Lan', lc: 1830 }, { ten: 'Tiểu Hổ', lc: 1610 }, { ten: 'Lạc Phàm', lc: 1505 }, { ten: 'Đông Phương', lc: 1290 }],
        }],
    bi_danh: cho ? [] : [{ id: 9, o: [2, 0], ten_o: 'Lạc Hà Cốc', tu_mon: 'Huyết Sát Cung', huy_hieu: 3, toi_noi_luc: at(42.2), trang_thai: 'di' }],
    trinh: cho
      ? []
      : [
          { id: 3, o: [0, 2], xong_luc: at(-60), ket_qua: { trong: false, ten_o: 'Bích Thủy Hồ', mon: 3, n: 4, lc: 9800 } },
          { id: 2, o: [3, -1], xong_luc: at(-300), ket_qua: { trong: false, ten_o: 'Vọng Nguyệt Phong', mon: 2, n: 7, lc: 21400 } },
        ],
    bao: cho
      ? []
      : [
          { id: 30, luc: at(-900), loai: 'tran', a: 3, b: 1, ten_a: 'Vân Hà Các', ten_b: 'Thanh Hư Tông', o: [1, 1], nd: { kq: 'thua', ten_o: 'Tử Trúc Lâm', atk: 12900, def: 15200 } },
          { id: 25, luc: at(-2800), loai: 'cam_co', a: 1, b: null, ten_a: 'Thanh Hư Tông', ten_b: null, o: [2, -1], nd: { kq: 'cam_co', ten_o: 'Kim Ô Đài' } },
          { id: 21, luc: at(-4300), loai: 'tran', a: 1, b: 3, ten_a: 'Thanh Hư Tông', ten_b: 'Vân Hà Các', o: [0, 2], nd: { kq: 'thua', ten_o: 'Bích Thủy Hồ', atk: 8800, def: 11300, n_atk: 6 } },
          { id: 12, luc: at(-7000), loai: 'cam_co', a: 1, b: null, ten_a: 'Thanh Hư Tông', ten_b: null, o: [1, 0], nd: { kq: 'cam_co', ten_o: 'Thanh Vân Lĩnh', dau: true } },
        ],
  };
}

const LIST: SmMonRow[] = [
  { id: 1, ten: 'Thanh Hư Tông', huy_hieu: 15, chinh_dien_hinh: 0, n: 12, toi_da: 15, mo_cua: true, dk_kiep: 5, dk_tuoi_dao: 2, du_dk: true, o: 4, du_ky: true, so_ky: 2, het_han_ky: at(-5000), ta_ky: false, mon_chu: 'Lạc Phàm', lc: 31400 },
  { id: 3, ten: 'Vân Hà Các', huy_hieu: 11, chinh_dien_hinh: 4, n: 7, toi_da: 15, mo_cua: false, dk_kiep: 3, dk_tuoi_dao: 0, du_dk: true, o: 0, du_ky: true, so_ky: 2, het_han_ky: at(-3000), ta_ky: false, mon_chu: 'Vân Nhi', lc: 14200 },
  { id: 2, ten: 'Huyết Sát Cung', huy_hieu: 3, chinh_dien_hinh: 2, n: 15, toi_da: 15, mo_cua: true, dk_kiep: 40, dk_tuoi_dao: 5, du_dk: false, o: 6, du_ky: true, so_ky: 2, het_han_ky: at(-6000), ta_ky: false, mon_chu: 'Huyết Ma', lc: 52100 },
  { id: 4, ten: 'Tử Lôi Phái', huy_hieu: 22, chinh_dien_hinh: 6, n: 9, toi_da: 15, mo_cua: true, dk_kiep: 20, dk_tuoi_dao: 3, du_dk: false, o: 2, du_ky: true, so_ky: 2, het_han_ky: at(-6000), ta_ky: false, mon_chu: 'Lôi Tử', lc: 21000 },
];
const CHO_KY: SmMonRow[] = [
  { id: 8, ten: 'Bích Phượng Cốc', huy_hieu: 13, chinh_dien_hinh: 6, n: 1, toi_da: 15, mo_cua: true, dk_kiep: 0, dk_tuoi_dao: 0, du_dk: true, o: 1, du_ky: false, so_ky: 1, het_han_ky: at(16 * 60 + 12), ta_ky: false, mon_chu: 'Phượng Nhi', lc: 6100 },
  { id: 9, ten: 'Hàn Sơn Kiếm Phái', huy_hieu: 25, chinh_dien_hinh: 5, n: 2, toi_da: 15, mo_cua: false, dk_kiep: 10, dk_tuoi_dao: 0, du_dk: false, o: 0, du_ky: false, so_ky: 0, het_han_ky: at(22 * 60 + 40), ta_ky: false, mon_chu: 'Hàn Băng', lc: 9400 },
];

const MEMBERS: SmMembers = {
  ds: [
    { ten: 'Lạc Phàm', tk: 'lacpham', chuc: 'chu', lc: 4833, dung: [1, 0], nghi: false, kv: 3 },
    { ten: 'Vân Nhi', tk: 'vannhi', chuc: 'lao', lc: 3120, dung: [2, 0], nghi: false, kv: 9 },
    { ten: 'Hàn Sương', tk: 'hansuong', chuc: 'lao', lc: 2050, dung: [1, 0], nghi: false, kv: 6 },
    { ten: 'Mộc Lan', tk: 'moclan', chuc: 'de', lc: 1830, dung: null, nghi: false, kv: 6 },
    { ten: 'Tiểu Hổ', tk: 'tieuho', chuc: 'de', lc: 1610, dung: [1, 1], nghi: true, kv: 1 },
    { ten: 'Đông Phương Bất Bại Thiên Hạ', tk: 'dongphuong', chuc: 'de', lc: 1290, dung: [2, -1], nghi: false, kv: 0 },
    { ten: 'Thủy Tiên', tk: 'thuytien', chuc: 'de', lc: 1180, dung: [2, 0], nghi: false, kv: 0 },
    { ten: 'Bạch Vân', tk: 'bachvan', chuc: 'de', lc: 960, dung: null, nghi: false, kv: 1 },
  ],
  don: [
    { id: 41, ten: 'Tiểu Bạch', lc: 1900, luc: at(-80) },
    { id: 42, ten: 'Mộc Miên', lc: 1150, luc: at(-30) },
  ],
};
const RANK: SmRankRow[] = [
  { id: 2, ten: 'Huyết Sát Cung', huy_hieu: 3, o: 6, kv: 512, n: 15 },
  { id: 5, ten: 'Kim Long Điện', huy_hieu: 7, o: 5, kv: 470, n: 14 },
  { id: 1, ten: 'Thanh Hư Tông', huy_hieu: 15, o: 4, kv: 388, n: 12 },
  { id: 3, ten: 'Vân Hà Các', huy_hieu: 11, o: 3, kv: 301, n: 7 },
  { id: 4, ten: 'Tử Lôi Phái', huy_hieu: 22, o: 2, kv: 260, n: 9 },
  { id: 6, ten: 'Huyền Nguyệt Môn', huy_hieu: 27, o: 2, kv: 198, n: 6 },
  { id: 7, ten: 'Lăng Tiêu Các', huy_hieu: 19, o: 1, kv: 121, n: 4 },
];

const CHAT: SmChat[] = [
  { id: 1, luc: at(-190), nd: 'Chào cả môn! Tối nay ai online thì điểm danh nhé.', ta: false, tk: 'vannhi', ten: 'Vân Nhi', chuc: 'lao' },
  { id: 2, luc: at(-150), nd: 'Đã điểm danh. Kiếp này ta lên Kim Đan rồi, +5 Khí vận.', ta: false, tk: 'hanbang', ten: 'Hàn Băng', chuc: 'de' },
  { id: 3, luc: at(-60), nd: 'Huyết Sát Cung đang đánh Lạc Hà Cốc, ai rảnh sang giữ với.', ta: false, tk: 'thuyte', ten: 'Thủy Tề', chuc: 'de' },
  { id: 3.5, luc: at(-45), nd: 'Hàn Băng vừa khai hoang Bích Thủy Hồ (4/5 ô).', nd_en: 'Han Bang claimed Bich Thuy Ho (4/5 tiles).', ta: false, tk: '', ten: '', chuc: null, he: true },
  { id: 4, luc: at(-40), nd: 'Ta sang ngay. Còn 40 phút nữa họ tới.', ta: true, tk: 'lacpham', ten: 'Lạc Phàm', chuc: 'chu' },
  { id: 5, luc: at(-5), nd: '30 Khí vận rồi, mai cả môn +10% nhé các vị.', ta: false, tk: 'vannhi', ten: 'Vân Nhi', chuc: 'lao' },
];

const wait = <T,>(v: T) => new Promise<T>((ok) => setTimeout(() => ok(structuredClone(v)), 120));

export function demoApi(vaiIn: string): SmApi {
  const vai = vaiIn === '1' ? 'chu' : vaiIn;
  const coMon = vai === 'chu' || vai === 'de' || vai === 'cho';
  let st: SmState = coMon ? monState(vai) : baseState(vai);
  const list = vai === 'trong' ? CHO_KY : [...LIST, ...CHO_KY];
  let chat: SmChat[] = vai === 'chu' || vai === 'de' ? structuredClone(CHAT) : [];
  return {
    demo: true,
    linked: vai !== 'khach',
    username: vai === 'khach' ? null : 'lacpham',
    state: () => (vai === 'noct' ? Promise.reject(new SmErr('SM_NO_CT')) : wait(st)),
    list: () => wait(list),
    map: () => wait(map(coMon && vai !== 'cho')),
    rank: () => wait(RANK),
    suMon: () => wait(vai === 'su' ? (LIST[1]?.id ?? null) : null),
    chatList: (sau) => wait(chat.filter((x) => x.id > sau)),
    chatSend: async (nd) => {
      const x: SmChat = { id: chat.length + 1, luc: new Date().toISOString(), nd, ta: true, tk: 'lacpham', ten: 'Lạc Phàm', chuc: vai === 'de' ? 'de' : 'chu' };
      chat.push(x);
      return wait(x);
    },
    chatN: () => wait(vai === 'chu' ? 3 : 0),
    chatHide: async (id) => {
      chat = chat.filter((x) => x.id !== id);
      return wait({ ok: true });
    },
    chatReport: () => wait({ so_bao: 1, an: false }),
    members: () => wait(vai === 'de' ? { ...MEMBERS, don: null } : MEMBERS),
    monDs: (mon) => {
      const n = [...LIST, ...CHO_KY].find((m) => m.id === mon)?.n ?? 0;
      const nhaMinh = st.mon?.id === mon;
      return wait(
        MEMBERS.ds
          .concat(MEMBERS.ds)
          .slice(0, n)
          .map((x, i): SmMonNguoi => ({
            ten: i < MEMBERS.ds.length ? x.ten : `${x.ten} ${i}`,
            chuc: i === 0 ? 'chu' : x.chuc === 'chu' ? 'de' : x.chuc,
            lc: Math.max(300, x.lc - i * 40),
            tk: nhaMinh ? (i < MEMBERS.ds.length ? x.tk : `${x.tk}${i}`) : null,
            ct: { gender: i % 2 ? 'nu' : 'nam', skin: i % 4, hair: i % 3, hairColor: (i * 3) % 8, outfit: i % 6 },
            vao_luc: at(-(i * 97 + 30)),
            choi_luc: at(-(i * 23 + 5)),
            kiep: 120 - i * 9,
            phan: { huyet: Math.max(0, 10 - i), vien_man: Math.max(0, 5 - (i >> 1)), canh: 15 - (i % 6), ket_cuc: 60 - i * 4, kiep: 100 },
          })),
      );
    },
    // 18/11 tối: ?demo=de thấy môn chủ vắng 3 ngày, đang có cuộc bầu; vai khác thấy môn chủ vừa ghé
    bau: () =>
      wait(
        vai === 'de'
          ? {
              vang_gio: 48,
              chu_hd: at(-3 * 1440),
              mo_duoc: false,
              dang: { id: 1, het_luc: at(17 * 60), mo_boi: 'Tử Doanh', n: 8, bau_duoc: true, ta_chon: null, phieu: [{ tk: MEMBERS.ds[1]?.tk ?? 'x', ten: MEMBERS.ds[1]?.ten ?? 'X', n: 2 }] },
              gan_nhat: null,
            }
          : { vang_gio: 48, chu_hd: at(-30), mo_duoc: false, dang: null, gan_nhat: null },
      ),
    // Ngày 8a: bảng Công. ?demo=chu đứng hạng 2, môn hạng 1 (Thần phẩm); ?demo=de hạng 9 (ngoài top 7)
    congBang: () => {
      if (!st.mon) return wait({ ky: { id: 1, ket_thuc: at(13 * 1440), ket_xong: false, khoa: at(10 * 1440) } });
      const ten = ['Tử Doanh', 'Lâm Phong', 'Hạ Vy', 'Mộc Thanh', 'Bạch Y', 'Lưu Ly', 'Vân Khê', 'Thiết Ngưu', 'Tiểu Hồ', 'Lục Trúc'];
      const toi = vai === 'de' ? 8 : 1;
      const LOAI = ['kiem', 'dao', 'thuong', 'quat', 'phat_tran', 'cung', 'song_chuy'];
      const ds = ten.map((t, i) => ({
        ten: i === toi ? 'Ta' : t, tk: i === toi ? 'ta' : `u${i}`, chuc: (i === 1 ? 'chu' : i === 3 ? 'lao' : 'de') as 'chu' | 'lao' | 'de',
        cong: Math.max(0, 62 - i * 6 - (i > 6 ? 8 : 0)), hang: i + 1, ta: i === toi,
        nhan: (i < 7 && 62 - i * 6 >= 10 ? [{ o: 'vu_khi', loai: LOAI[i], pham: 'than' }] : null) as SmBvNhan[] | null,
      }));
      ds[1].nhan = [...(ds[1].nhan ?? []), { o: 'phu_kien', loai: 'an', pham: 'than' }];
      const me = ds[toi];
      return wait({
        ky: { id: 1, ket_thuc: at(13 * 1440), ket_xong: false, khoa: at(10 * 1440) },
        ds,
        ta: { hang: me.hang, cong: me.cong, dd: 1, nv: Math.max(0, me.cong - 7), kh: 3, xc: 3, giu: 0, vao_som: true },
        nhan: (me.nhan ?? []).map((x) => ({ ...x, pct: x.o === 'phu_kien' ? 12 : me.hang === 1 ? 15 : me.hang <= 3 ? 14 : 12, ten: x.o === 'phu_kien' ? 'Thần phẩm Thanh Hư Chưởng Môn Ấn' : 'Thần phẩm Thanh Hư Đao', hang_cong: me.hang })),
        mon_hang: 1, mon_du: true, tk_du: true, can: 10,
      });
    },
    coHoi: (q, r) => {
      const tr = (st.trinh ?? []).find((t) => t.o[0] === q && t.o[1] === r && t.ket_qua && !t.ket_qua.trong);
      const ta = (st.chinh?.[0]?.theo ?? []).reduce((s, x) => s + x.lc, 0) || (st.lc ?? 0);
      if (!tr?.ket_qua) return wait({ nguon: 'chua' as const, ta, n_ta: st.chinh?.[0]?.n ?? 1, avg: 2000, trinh_ve: at(6) });
      const giu = (tr.ket_qua.lc ?? 0) * 1.1;
      return wait({ nguon: 'trinh' as const, ta, n_ta: st.chinh?.[0]?.n ?? 1, avg: 2000, giu, lo: giu / 1.15, hi: giu / 0.85, n: tr.ket_qua.n, trinh_luc: tr.xong_luc });
    },
    moiTim: (q) =>
      wait({
        day: false,
        ds: [
          { ten: 'lamphong', phap_danh: 'Lâm Phong', kiep: 34, lc: 3120, choi_luc: at(-20), da_moi: false, du_dk: true },
          { ten: 'tuyetnhi', phap_danh: 'Tuyết Nhi', kiep: 12, lc: 1480, choi_luc: at(-95), da_moi: true, du_dk: true },
          { ten: 'hoangca', phap_danh: null, kiep: 3, lc: 420, choi_luc: at(-600), da_moi: false, du_dk: false },
        ].filter((x) => !q || x.ten.includes(q.toLowerCase()) || (x.phap_danh ?? '').toLowerCase().includes(q.toLowerCase())),
      }),
    kyTim: (q) =>
      wait(
        [
          { ten: 'lamphong', phap_danh: 'Lâm Phong', kiep: 34, choi_luc: at(-20), da_nho: false },
          { ten: 'tuyetnhi', phap_danh: 'Tuyết Nhi', kiep: 12, choi_luc: at(-95), da_nho: true },
        ].filter((x) => !q || x.ten.includes(q.toLowerCase()) || (x.phap_danh ?? '').toLowerCase().includes(q.toLowerCase())),
      ),
    kyDs: () =>
      wait(vai === 'chua' || vai === 'chu' ? [{ id: 7, mon: 12, ten_mon: 'Thanh Linh Cung', huy_hieu: 5, so_ky: 1, het_han: at(600), nguoi: 'tieuho', phap_danh: 'Tiểu Hổ', luc: at(-15) }] : []),
    moiDs: () =>
      wait(
        vai === 'chua' || vai === 'trong'
          ? [{ id: 5, mon: 2, ten_mon: 'Vô Hư Cốc', huy_hieu: 3, n: 9, nguoi: 'hansuong', phap_danh: 'Hàn Sương', luc: at(-40), du_dk: true, dk_kiep: 0, dk_ngay: 0 }]
          : [],
      ),
    act: async (a: SmAct) => {
      await wait(null);
      const m = st.mon;
      switch (a.fn) {
        case 'checkin':
          if (st.diem_danh?.hom_nay) throw new SmErr('SM_DA_DIEM_DANH');
          st = { ...st, diem_danh: { hom_nay: true, chuoi: (st.diem_danh?.chuoi ?? 0) + 1, da_thuong: false }, mon: m && { ...m, kv_hom_nay: m.kv_hom_nay + 1 } };
          return { chuoi: st.diem_danh!.chuoi, thuong: false };
        case 'follow':
        case 'unfollow':
          st = { ...st, chinh: st.chinh?.map((c) => (c.id === a.chinh ? { ...c, ta_theo: a.fn === 'follow', n: c.n + (a.fn === 'follow' ? 1 : -1) } : c)) };
          return { ok: true };
        case 'guard':
          if (m) st = { ...st, mon: { ...m, dung: [a.q, a.r] } };
          return { ok: true };
        case 'scout':
          st = { ...st, trinh: [{ id: 99, o: [a.q, a.r], xong_luc: at(10), ket_qua: null }, ...(st.trinh ?? [])] };
          return { xong_luc: at(10) };
        case 'march':
        case 'march_tt':
          if (st.chinh?.length) throw new SmErr('SM_DANG_CHINH');
          return { id: 8, tu_trinh: a.fn === 'march_tt' ? at(10) : undefined };
        case 'moi_gui':
        case 'ky_nho':
          return { ok: true, vao: false };
        case 'ky_tra':
          return { ok: true, so_ky: 2, du_ky: true };
        case 'moi_tra':
          return { ok: true, mon: 2 };
        case 'rut_quan':
          st = { ...st, chinh: [] };
          return { ok: true };
        case 'khai_hoang':
          if (m && m.o >= m.o_max) throw new SmErr('SM_DU_O');
          if (m) st = { ...st, mon: { ...m, o: m.o + 1, tiles: [...m.tiles, { q: a.q, r: a.r, ten: 'Vọng Nguyệt Lâm', cd: false, bao_ho_toi: at(24 * 60) }] } };
          return { ok: true, ten_o: 'Vọng Nguyệt Lâm', o: (m?.o ?? 0) + 1, o_max: m?.o_max ?? 6 };
        case 'found':
          st = monState('cho');
          if (st.mon) st.mon = { ...st.mon, ten: a.ten.join(' '), ten1: a.ten[0], ten2: a.ten[1], ten3: a.ten[2], huy_hieu: a.huy, chinh_dien_hinh: a.cd };
          return { id: 1 };
        case 'pick_tile':
          if (st.mon) st.mon = { ...st.mon, cam_co: true, o: 1, tiles: [{ q: a.q, r: a.r, ten: 'Tử Trúc Lâm', cd: true, bao_ho_toi: null }] };
          return { ok: true };
        case 'join':
          st = monState('de');
          return { ok: true };
        case 'apply':
          st = { ...st, don: [...st.don, { id: 50, mon: a.mon, ten: list.find((x) => x.id === a.mon)?.ten ?? '' }] };
          return { ok: true };
        case 'cosign':
          st = { ...st, ky_cung: [...st.ky_cung, a.mon] };
          return { so_ky: 2, du_ky: true };
        case 'leave':
          st = baseState('chua');
          return { ok: true };
        case 'xep':
          return { ok: true, di_toi: at(20) };
        default:
          return { ok: true };
      }
    },
  };
}
