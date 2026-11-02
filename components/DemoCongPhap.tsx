'use client';
/**
 * DEMO giao diện công pháp và linh thú (chưa nối logic game). Dùng thẳng Scene, Sprite, Panels thật.
 * Chỉ để xem trước trên điện thoại, không link từ đâu, noindex.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Scene from './Scene';
import Sprite from './Sprite';
import { PixelFx, fxBatQuai, fxChuongVang, fxCuuVi, fxDanHoan, fxHuyetNguyet, fxKiem, fxLua, fxMaHoa, fxMaKhi, fxMotes, fxNguSacVan, fxPhatQuang, fxRays, fxRing, fxSen, type FxSpec } from './PixelFx';
import { EventCard, FocusGrid, LogPanel, OverworkBar, StageStrip } from './Panels';
import type { BattleView } from './Battle';
import MonsterLpc from './MonsterLpc';
import type { MonsterLook } from '@/lib/game/monsterLook';
import { MONSTERS } from '@/lib/game/combat';
import { emptyMeta, newCharacter } from '@/lib/game/engine';
import { PETS, PET_IDS } from '@/lib/game/pets';
import type { Character, Fx, LogEntry, PendingEvent } from '@/lib/game/types';

type Scr = 'choi' | 'kinh' | 'thu' | 'dau';

/* ---------- dữ liệu mẫu ---------- */
const PHAM = ['Hoàng', 'Huyền', 'Địa', 'Thiên'];
const PHAM_CLS = ['p0', 'p1', 'p2', 'p3'];
interface CP {
  id: string;
  name: string;
  icon: string;
  kind: 'tam' | 'chieu';
  pham: number;
  tang: number;
  exp: number;
  main: string;
  sub: string[];
  he: string;
  cd?: number;
  em?: () => FxSpec;
}
const CPS: CP[] = [
  { id: 'thanh_lien', name: 'Thanh Liên Kiếm Tâm Quyết', icon: 'g_thanh_phong_kiem_pho', kind: 'tam', pham: 1, tang: 6, exp: 40, main: 'Tu vi +15% mỗi năm', sub: ['Thọ nguyên +8'], he: 'Kiếm' },
  { id: 'liet_hoa', name: 'Liệt Hỏa Kiếm Quyết', icon: 'g_kiem_pho_tan_thien', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Công +12%, 25% thiêu đốt 2 hiệp', sub: ['Đánh kẻ hơn cảnh giới +8%'], he: 'Kiếm', cd: 3 },
  { id: 'kim_xa', name: 'Kim Xà Kiếm Pháp', icon: 'g_doc_co_kiem_pho', kind: 'chieu', pham: 0, tang: 9, exp: 100, main: '20% hút máu bằng 30% sát thương', sub: ['Né +3%', 'Bạo kích +4%'], he: 'Kiếm', cd: 4 },
  { id: 'thai_cuc', name: 'Thái Cực Kiếm', icon: 'g_ho_tam_kinh', kind: 'chieu', pham: 2, tang: 3, exp: 25, main: 'Phản 15% sát thương nhận vào', sub: ['Tâm cảnh +4'], he: 'Kiếm', cd: 5 },
  { id: 'doc_co', name: 'Độc Cô Cửu Kiếm', icon: 'g_kinh_thu_tan_quyen', kind: 'chieu', pham: 3, tang: 0, exp: 0, main: 'Gom đủ 3 tàn quyển để luyện. Mỗi đòn đều phá giáp.', sub: [], he: 'Kiếm', cd: 6 },
];
const FUSED: CP = { id: 'hoa_xa', name: 'Hỏa Xà Phần Thiên Kiếm', icon: 'g_thien_cuong_kiem', kind: 'chieu', pham: 2, tang: 1, exp: 0, main: 'Thiêu đốt kèm hút máu, mỗi hiệp cháy hồi 10 máu', sub: ['Công +10%'], he: 'Kiếm' };
const BOOK_ICONS = ['g_thanh_phong_kiem_pho', 'g_kiem_pho_tan_thien', 'g_doc_co_kiem_pho', 'g_ho_tam_kinh', 'g_kinh_thu_tan_quyen', 'g_bach_thao_kinh', 'g_bat_quai_kinh', 'g_huyet_than_kinh', 'g_kinh_kim_cang', 'g_thai_thuong_dan_kinh', 'g_con_lon_kinh', 'g_tam_kinh_ngoc_gian', 'g_ky_mon_don_giap_thu', 'g_lac_thu', 'g_dai_bi_chu', 'g_thien_cuong_kiem'];
const PET_EVO = ['soi_con', 'xich_lang', 'bach_lang'];
const PET_EVO_NAME = ['Sói con', 'Xích Lang', 'Thiên Lang'];
const PET_EVO_RANK: RankId[] = ['N', 'SR', 'SSR'];
const PET_SEEN = ['soi_con', 'xich_lang', 'tuyet_ho', 'ho_ly', 'cho_vang', 'nam_linh', 'dai_bang', 'slime', 'ong_vang'];

function makeChar(): Character {
  const c = newCharacter(emptyMeta());
  c.age = 58;
  c.realm = 3;
  c.layer = 2;
  c.path = 'kiem';
  c.focus = 'tu_luyen';
  c.pet = true;
  c.petKind = 'xich_lang';
  c.lifeNo = 12;
  c.lifespan = 180;
  c.linhThach = 12450;
  c.cultivation = Math.round(c.cultivation + 200);
  c.equipped = { ...c.equipped, vu_khi: 'thanh_phong' };
  c.stats = { ...c.stats, sucKhoe: 82, tamCanh: 64, ngoTinh: 71, khiVan: 48, tamMa: 12 };
  c.log = [
    { age: 55, tone: 'normal', text: 'Bạn ngồi thiền dưới thác, kiếm ý thêm một phần sắc bén.' },
    { age: 56, tone: 'good', text: 'Liệt Hỏa Kiếm Quyết đạt tầng 9. Lưỡi kiếm tỏa hơi nóng như lò rèn.' },
    { age: 57, tone: 'normal', text: 'Xích Lang tha về một gốc linh thảo, vẫy đuôi chờ khen.' },
    { age: 58, tone: 'good', text: 'Kim Xà Kiếm Pháp đạt tầng 9. Hai bộ kiếm pháp trong người bắt đầu cộng hưởng.' },
  ];
  return c;
}

/* ---------- linh thú: cắt khung từ sprite thật ---------- */
function PetAnim({ id, scale, dir = 1, still, dark, cls, style }: { id: string; scale: number; dir?: 0 | 1; still?: boolean; dark?: boolean; cls?: string; style?: CSSProperties }) {
  const p = PETS[id];
  const w = p.w * scale;
  const h = p.h * scale;
  return (
    <span
      className={`dm-pet ${cls ?? ''}`}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(/lpc/pets/${id}.png)`,
        backgroundSize: `${p.n * w}px ${2 * h}px`,
        backgroundPositionY: dir ? -h : 0,
        ['--lpc-end' as string]: `-${p.n * w}px`,
        animation: still ? 'none' : `lpc-play ${p.n / p.fps}s steps(${p.n}) infinite`,
        filter: dark ? 'brightness(0) opacity(0.35)' : p.filter,
        ...style,
      } as CSSProperties}
      aria-hidden="true"
    />
  );
}

function Icon({ src, size = 40, dark }: { src: string; size?: number; dark?: boolean }) {
  return <img src={`/icons/${src}.png`} width={size} height={size} alt="" className={`px-icon ${dark ? 'dm-dark' : ''}`} />;
}



/* ---------- Công pháp theo con đường tu ---------- */
type PathKey = 'kiem' | 'dan' | 'tran' | 'phat' | 'ma' | 'yeu';
const PATH_CP: Record<PathKey, { name: string; gauge: string; idea: string; tuyet: string; list: CP[] }> = {
  kiem: { name: 'Kiếm tu', gauge: 'Kiếm ý', idea: 'Đánh nhanh, chém liên hoàn. Mỗi đòn trúng tích kiếm ý, đầy thì ra tuyệt kỹ.', tuyet: 'Vạn Kiếm Quy Tông', list: CPS },
  dan: {
    name: 'Đan tu', gauge: 'Đan hỏa', idea: 'Ném đan, rải độc, tự hồi máu. Độc cộng dồn tầng, đánh lâu mới mạnh.', tuyet: 'Cửu Chuyển Luyện Thiên Lô',
    list: [
      { id: 'dan_tam', name: 'Thanh Mộc Trường Sinh Quyết', icon: '', kind: 'tam', pham: 1, tang: 7, exp: 60, main: 'Thọ nguyên +10%, mỗi hiệp hồi 3% máu', sub: ['Luyện đan thành công +8%'], he: 'Mộc', em: () => emGlyph('la') },
      { id: 'dan_no', name: 'Liệt Diễm Đan Bạo', icon: '', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Ném hỏa đan nổ, 30% choáng 1 hiệp', sub: ['Đan dược trong túi cộng thêm sát thương'], he: 'Hỏa', cd: 3, em: () => fxDanHoan() },
      { id: 'dan_doc', name: 'Vạn Độc Vụ', icon: '', kind: 'chieu', pham: 2, tang: 5, exp: 70, main: 'Mỗi đòn cộng 1 tầng độc, tối đa 5 tầng', sub: ['Quái trúng độc đánh yếu đi 10%'], he: 'Độc', cd: 2, em: () => emGlyph('doc') },
      { id: 'dan_hoi', name: 'Hồi Xuân Đan Thuật', icon: '', kind: 'chieu', pham: 0, tang: 4, exp: 30, main: 'Máu dưới 30% thì hồi 20%, mỗi trận 1 lần', sub: [], he: 'Mộc', cd: 6, em: () => emGlyph('tim') },
    ],
  },
  tran: {
    name: 'Trận tu', gauge: 'Trận nhãn', idea: 'Bày trận trước, đánh sau. Chiêu nào cũng dựng một cột trận, đủ 3 cột thì đại trận tự mở.', tuyet: 'Chu Thiên Tinh Đấu Đại Trận',
    list: [
      { id: 'tran_tam', name: 'Chu Thiên Tinh Đấu Quyết', icon: '', kind: 'tam', pham: 2, tang: 6, exp: 50, main: 'Bế quan tu vi +30%, ít bị tập kích', sub: ['Ngộ tính +5'], he: 'Tinh', em: () => emGlyph('sao') },
      { id: 'tran_kim', name: 'Kim Quang Hộ Trận', icon: '', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Khiên vàng chặn trọn 2 đòn', sub: ['Mở trận ngay hiệp đầu'], he: 'Kim', cd: 5, em: () => fxRing('#ffd36b', 30, true) },
      { id: 'tran_loi', name: 'Ngũ Lôi Phù', icon: '', kind: 'chieu', pham: 1, tang: 8, exp: 90, main: 'Ba đạo sét đánh liên tiếp', sub: ['Khắc yêu ma, sát thương +20%'], he: 'Lôi', cd: 3, em: () => emGlyph('loi') },
      { id: 'tran_khon', name: 'Mê Tung Khốn Trận', icon: '', kind: 'chieu', pham: 2, tang: 3, exp: 20, main: 'Quái lạc trong trận, mất 1 lượt', sub: [], he: 'Huyễn', cd: 4, em: () => fxBatQuai('#3d6fb0') },
    ],
  },
  phat: {
    name: 'Phật tu', gauge: 'Định lực', idea: 'Chịu đòn rồi trả đòn. Mỗi lần bị đánh tích định lực, đầy thì phản một chưởng lớn.', tuyet: 'Như Lai Thần Chưởng',
    list: [
      { id: 'phat_tam', name: 'Kim Cang Bất Hoại Thể', icon: '', kind: 'tam', pham: 2, tang: 7, exp: 55, main: 'Thủ +20%, tâm ma khó xâm nhập', sub: ['Máu tối đa +10%'], he: 'Kim', em: () => fxPhatQuang() },
      { id: 'phat_chuong', name: 'Đại Lực Kim Cang Chưởng', icon: '', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Chưởng vàng, 25% phá giáp', sub: ['Đánh ma tu sát thương +30%'], he: 'Kim', cd: 3, em: () => fxRays('#ffd36b') },
      { id: 'phat_chuong_vang', name: 'Kim Chung Tráo', icon: '', kind: 'chieu', pham: 1, tang: 6, exp: 80, main: 'Chuông vàng chặn 1 đòn chí mạng mỗi trận', sub: [], he: 'Kim', cd: 8, em: () => fxChuongVang() },
      { id: 'phat_hong', name: 'Sư Tử Hống', icon: '', kind: 'chieu', pham: 0, tang: 5, exp: 40, main: 'Tiếng gầm làm quái choáng 1 hiệp', sub: ['Quái yếu hơn 2 cảnh giới thì bỏ chạy'], he: 'Âm', cd: 4, em: () => fxRing('#ffcf3e', 30, false) },
    ],
  },
  ma: {
    name: 'Ma tu', gauge: 'Sát khí', idea: 'Đốt máu mình lấy sức mạnh, hút máu quái bù lại. Máu càng thấp sát khí càng lên nhanh.', tuyet: 'Huyết Tế Thiên Ma',
    list: [
      { id: 'ma_tam', name: 'Huyết Hải Ma Công', icon: '', kind: 'tam', pham: 2, tang: 6, exp: 45, main: 'Tu vi +25%, tâm ma +2 mỗi năm', sub: ['Thắng trận hồi 10% máu'], he: 'Huyết', em: () => fxHuyetNguyet() },
      { id: 'ma_trao', name: 'Huyết Ảnh Trảo', icon: '', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Hút 25% sát thương thành máu', sub: [], he: 'Huyết', cd: 2, em: () => emGlyph('trao') },
      { id: 'ma_thon', name: 'Thôn Phệ Ma Công', icon: '', kind: 'chieu', pham: 3, tang: 2, exp: 15, main: 'Thắng trận hút một phần tu vi đối thủ', sub: ['Mỗi lần dùng +3 tâm ma'], he: 'Ma', cd: 6, em: () => fxMaKhi(6) },
      { id: 'ma_cuong', name: 'Cuồng Ma Hóa', icon: '', kind: 'chieu', pham: 1, tang: 7, exp: 60, main: 'Đốt 20% máu, công x1,6 trong 3 hiệp', sub: [], he: 'Ma', cd: 5, em: () => fxMaHoa() },
    ],
  },
  yeu: {
    name: 'Yêu tu', gauge: 'Yêu lực', idea: 'Dựa vào huyết mạch và linh thú. Linh thú cộng hưởng mạnh hơn, đầy yêu lực thì hóa bản thể.', tuyet: 'Hiện Chân Thân',
    list: [
      { id: 'yeu_tam', name: 'Yêu Thần Luyện Thể', icon: '', kind: 'tam', pham: 1, tang: 8, exp: 70, main: 'Máu +25%, ngủ một đêm hồi sạch thương', sub: ['Linh thú thân thiết nhanh gấp đôi'], he: 'Thể', em: () => emGlyph('nanh') },
      { id: 'yeu_mi', name: 'Thiên Hồ Mị Thuật', icon: '', kind: 'chieu', pham: 2, tang: 9, exp: 100, main: 'Quái đánh trượt 30% trong 2 hiệp', sub: ['Đối thủ là người có thể bỏ đi'], he: 'Huyễn', cd: 4, em: () => fxCuuVi(9) },
      { id: 'yeu_trao', name: 'Yêu Trảo Liệt Không', icon: '', kind: 'chieu', pham: 1, tang: 7, exp: 50, main: 'Ba vết vuốt, linh thú đánh theo', sub: [], he: 'Thú', cd: 2, em: () => FX_VUOT },
      { id: 'yeu_hoa', name: 'Hóa Hình Thuật', icon: '', kind: 'chieu', pham: 2, tang: 4, exp: 35, main: 'Hóa thành bản thể 3 hiệp, công x2', sub: ['Bản thể theo huyết mạch'], he: 'Thể', cd: 7, em: () => fxNguSacVan() },
    ],
  },
};
const PATH_KEYS = Object.keys(PATH_CP) as PathKey[];


/** Ấn ký đơn giản cho các chiêu chưa có hiệu ứng riêng */
function emGlyph(kind: 'la' | 'doc' | 'sao' | 'loi' | 'trao' | 'nanh' | 'tim'): FxSpec {
  const D: Record<string, { o: string; f: (p: number, i: number) => string }> = {
    la: { o: '#14300c', f: (_p, i) => `<path d="M4 20 Q4 4 20 4 Q20 20 4 20Z" fill="#5fbf4a"/><path d="M6 18 Q10 12 17 7" stroke="#d8f8a0" stroke-width="1.5" fill="none"/><rect x="${3 + i}" y="3" width="2" height="2" fill="#d8f8a0"/>` },
    doc: { o: '#0c2a10', f: (_p, i) => `<circle cx="8" cy="${14 - (i % 2)}" r="5" fill="#5aa03a"/><circle cx="15" cy="${12 + (i % 2)}" r="6" fill="#7ad04a"/><circle cx="12" cy="17" r="4" fill="#4a8a2a"/><rect x="10" y="10" width="2" height="2" fill="#1a1a1a"/><rect x="15" y="10" width="2" height="2" fill="#1a1a1a"/><rect x="11" y="15" width="5" height="1" fill="#1a1a1a"/>` },
    sao: { o: '#0a1430', f: (_p, i) => { const P = [[3, 6], [7, 4], [11, 6], [14, 9], [18, 8], [20, 13], [17, 17]]; let o = `<polyline points="${P.map((x) => x.join(',')).join(' ')}" stroke="#5a7ab0" stroke-width="1" fill="none"/>`; P.forEach(([x, y], k) => (o += `<rect x="${x - 1}" y="${y - 1}" width="${k === i % 7 ? 3 : 2}" height="${k === i % 7 ? 3 : 2}" fill="${k === i % 7 ? '#ffffff' : '#ffd36b'}"/>`)); return o; } },
    loi: { o: '#1a0a30', f: (_p, i) => `<polygon points="13,1 5,13 11,13 8,23 19,9 13,9 16,1" fill="${i % 2 ? '#ffffff' : '#c9b8ff'}"/><rect x="${2 + i * 3}" y="${18 - i}" width="2" height="2" fill="#c9b8ff"/>` },
    trao: { o: '#2a0408', f: (_p, i) => [0, 1, 2].map((k) => `<line x1="${5 + k * 5}" y1="3" x2="${9 + k * 5}" y2="${8 + Math.min(i + 1, 3) * 4}" stroke="#e0202e" stroke-width="3"/><line x1="${5 + k * 5}" y1="3" x2="${9 + k * 5}" y2="${8 + Math.min(i + 1, 3) * 4}" stroke="#ffb0a0" stroke-width="1"/>`).join('') },
    nanh: { o: '#2a1004', f: (_p, i) => `<path d="M3 6 Q12 ${2 + (i % 2)} 21 6 L19 10 Q12 8 5 10Z" fill="#c8602a"/><polygon points="7,9 10,9 8.5,${18 + (i % 2)}" fill="#fff6e0"/><polygon points="14,9 17,9 15.5,${18 + (i % 2)}" fill="#fff6e0"/><path d="M3 18 Q12 ${22 - (i % 2)} 21 18 L19 15 Q12 17 5 15Z" fill="#c8602a"/>` },
    tim: { o: '#0c2a10', f: (_p, i) => `<path d="M12 21 L3 11 Q1 4 7 4 Q11 4 12 8 Q13 4 17 4 Q23 4 21 11Z" fill="${i % 2 ? '#7ad04a' : '#5fbf4a'}"/><rect x="11" y="9" width="2" height="7" fill="#ffffff"/><rect x="8" y="11" width="8" height="2" fill="#ffffff"/>` },
  };
  const d = D[kind];
  return { key: `dmg${kind}`, w: 24, h: 24, frames: 4, outline: d.o, draw: d.f };
}

/* ---------- Ô chiêu tròn (bát giác pixel) với ấn ký động ---------- */
function emLotus(): FxSpec {
  return {
    key: 'dmlotus',
    w: 26,
    h: 26,
    frames: 4,
    outline: '#2a1430',
    draw: (_p, f) => {
      let o = '';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 360 + f * 6;
        o += `<ellipse cx="13" cy="7" rx="3" ry="6" fill="${i % 2 ? '#ffb0d0' : '#ffe0ee'}" transform="rotate(${a} 13 13)"/>`;
      }
      o += `<circle cx="13" cy="13" r="4" fill="#ffd36b"/><rect x="12" y="12" width="2" height="2" fill="#fff"/>`;
      return o;
    },
  };
}
function emTaiji(): FxSpec {
  return {
    key: 'dmtaiji',
    w: 24,
    h: 24,
    frames: 8,
    outline: '#0a1420',
    draw: (p) => {
      const a = p * 360;
      return `<g transform="rotate(${a} 12 12)"><circle cx="12" cy="12" r="10" fill="#e8f0ff"/><path d="M12 2 A10 10 0 0 1 12 22 A5 5 0 0 1 12 12 A5 5 0 0 0 12 2Z" fill="#3d6fb0"/><circle cx="12" cy="7" r="1.6" fill="#3d6fb0"/><circle cx="12" cy="17" r="1.6" fill="#e8f0ff"/></g>`;
    },
  };
}
function emOf(id: string, cp?: CP): FxSpec {
  if (cp?.em) return cp.em();
  if (id === 'thanh_lien') return emLotus();
  if (id === 'liet_hoa') return FX_LIET;
  if (id === 'kim_xa') return FX_KIMXA;
  if (id === 'thai_cuc') return emTaiji();
  if (id === 'doc_co') return fxKiem(5, '#e8e0d0');
  return FX_HOAXA;
}
const short = (n: string) => n.replace(/ (Kiếm )?(Quyết|Pháp|Tâm Quyết)$/, '').replace('Phần Thiên Kiếm', 'Phần Thiên');
function Orb({ cp, size, dark, lock }: { cp: CP | null; size: number; dark?: boolean; lock?: string }) {
  if (!cp)
    return (
      <span className="dm-orb lock" style={{ width: size, height: size }}>
        <span className="dm-orb-in">
          <small>Mở khi</small>
          <b>{lock}</b>
        </span>
      </span>
    );
  const sp = emOf(cp.id, cp);
  const k = (size * 0.78) / Math.max(sp.w, sp.h);
  return (
    <span className={`dm-orb ${PHAM_CLS[cp.pham]} ${dark ? 'dark' : ''}`} style={{ width: size, height: size }}>
      <span className="dm-orb-in">
        <PixelFx spec={sp} scale={k} dur={0.6} />
      </span>
    </span>
  );
}

/* ---------- Tàng Kinh Các ---------- */
function KinhScene({ c, onClose }: { c: Character; onClose: () => void }) {
  const [tab, setTab] = useState<'luyen' | 'dung' | 'so'>('luyen');
  const [eq, setEq] = useState<string[]>(['thanh_lien', 'liet_hoa', 'kim_xa']);
  const [fuse, setFuse] = useState<'idle' | 'fuse' | 'ok'>('idle');
  const [heir, setHeir] = useState('liet_hoa');
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const [path, setPath] = useState<PathKey>('kiem');
  const P = PATH_CP[path];
  const all = path === 'kiem' && fuse === 'ok' ? [...CPS, FUSED] : P.list;
  function pickPath(k: PathKey) {
    const l = PATH_CP[k].list;
    setPath(k);
    setEq([l[0].id, l[1].id, l[2].id]);
    setSel(l[1].id);
    setTab('luyen');
  }
  const get = (id: string) => all.find((x) => x.id === id)!;
  const [sel, setSel] = useState('liet_hoa');
  // 5 ghế quanh người: tâm pháp trên đỉnh, 2 chiêu, 2 ô khóa theo cảnh giới, ô tuyệt kỹ từ dung hợp
  const seats: { label: string; id?: string; lock?: string; x: number; y: number }[] = [
    { label: 'Tâm pháp', id: eq[0], x: 50, y: 26 },
    { label: 'Chiêu 1', id: eq[1], x: 15, y: 62 },
    { label: 'Chiêu 2', id: eq[2], x: 85, y: 62 },
    { label: 'Chiêu 3', lock: 'Nguyên Anh', x: 13, y: 160 },
    { label: 'Tuyệt kỹ', id: path === 'kiem' && fuse === 'ok' ? 'hoa_xa' : undefined, lock: path === 'kiem' && fuse === 'ok' ? undefined : 'Dung hợp', x: 87, y: 160 },
  ];
  function toggle(cp: CP) {
    if (cp.tang === 0) return;
    if (cp.kind === 'tam') return setEq([cp.id, eq[1], eq[2]]);
    if (eq.includes(cp.id)) return setEq(eq.map((x) => (x === cp.id ? '' : x)));
    const k = !eq[1] ? 1 : !eq[2] ? 2 : 2;
    const n = [...eq];
    n[k] = cp.id;
    setEq(n);
  }
  return (
    <div className="forge-wrap dm-wrap" role="dialog" aria-modal="true" aria-label="Tàng Kinh Các">
      <div className="forge-scene">
        <div className="fs-head">
          <b>Tàng Kinh Các</b>
          <span className="fs-tinh">{P.name} · Kim Đan</span>
          <button className="ss-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="dm-paths">
          {PATH_KEYS.map((k) => (
            <button key={k} className={k === path ? 'on' : ''} onClick={() => pickPath(k)}>
              {PATH_CP[k].name.replace(' tu', '')}
            </button>
          ))}
        </div>
        <div className="dm-kinh-stage dm-ring" style={{ backgroundImage: 'url(/bg/tu_luyen-3.png)' }}>
          <span className="dm-ring-title">Cài chiêu thức</span>
          <div className="dm-ring-floor">
            <PixelFx spec={fxBatQuai('#9ff0c8')} scale={3} dur={2.4} />
          </div>
          <div className="dm-kinh-me">
            <Sprite c={{ ...c, path }} size={132} anim="spellcast" dir={2} />
          </div>
          <div className="dm-ring-sen">
            <PixelFx spec={fxSen()} scale={3} dur={1} />
          </div>
          <span className="dm-qi" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} style={{ left: `${38 + i * 5}%`, animationDelay: `${i * 0.4}s` }} />
            ))}
          </span>
          {seats.map((st, i) => {
            const cp = st.id ? get(st.id) : null;
            return (
              <button key={i} className={`dm-seat ${cp && sel === cp.id ? 'sel' : ''}`} style={{ left: `${st.x}%`, top: st.y }} onClick={() => cp && setSel(cp.id)} aria-label={cp ? cp.name : `${st.label} khóa`}>
                <Orb cp={cp} size={54} lock={st.lock} />
                <small>{cp ? short(cp.name) : st.label}</small>
              </button>
            );
          })}
        </div>
        <div className="fs-info">
          <div className="dm-idea">
            <b>
              {P.name} · thanh <i>{P.gauge}</i>
            </b>
            <span>{P.idea}</span>
            <small>Tuyệt kỹ: {P.tuyet}</small>
          </div>
          <div className="chips">
            <button className={`chip-btn ${tab === 'luyen' ? 'on' : ''}`} onClick={() => setTab('luyen')}>
              Đang luyện
            </button>
            <button className={`chip-btn ${tab === 'dung' ? 'on' : ''}`} onClick={() => setTab('dung')}>
              Dung hợp
            </button>
            <button className={`chip-btn ${tab === 'so' ? 'on' : ''}`} onClick={() => setTab('so')}>
              Sổ {fuse === 'ok' ? 15 : 14}/120
            </button>
          </div>

          {tab === 'luyen' && (
            <div className="dm-list">
              {all.map((cp) => {
                const on = eq.includes(cp.id);
                return (
                  <div key={cp.id} className={`dm-cp2 ${PHAM_CLS[cp.pham]} ${sel === cp.id ? 'sel' : ''} ${cp.tang === 0 ? 'lock' : ''}`} onClick={() => setSel(cp.id)}>
                    {on && <span className="dm-ribbon">Đang mang</span>}
                    <Orb cp={cp} size={46} dark={cp.tang === 0} />
                    <span className="dm-cp-body">
                      <b className="dm-cp-name">
                        {cp.name} <i className={`dm-pham ${PHAM_CLS[cp.pham]}`}>{PHAM[cp.pham]}</i>
                        {cp.tang > 0 && <em>T{cp.tang}</em>}
                      </b>
                      <span className="dm-cp-desc">
                        {cp.main}
                        {cp.sub.length ? `. ${cp.sub.join(', ')}` : ''}
                      </span>
                      {cp.tang > 0 && cp.tang < 9 && (
                        <span className="dm-tang">
                          <span className="dm-tang-n">Thục luyện</span>
                          <span className="dm-prog">
                            <span style={{ width: `${cp.exp}%` }} />
                          </span>
                        </span>
                      )}
                    </span>
                    <span className="dm-cp-side">
                      <span className="dm-cost">
                        <Icon src="g_kinh_thu_tan_quyen" size={18} />
                        {cp.tang === 0 ? '2/3' : cp.tang === 9 ? '-' : `${cp.tang >= 6 ? 1 : 0}/1`}
                      </span>
                      <button
                        className={`dm-up ${cp.tang === 9 ? 'max' : ''}`}
                        disabled={cp.tang === 0 || cp.tang === 9 || cp.exp < 100}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {cp.tang === 0 ? 'Thiếu quyển' : cp.tang === 9 ? 'Viên mãn' : 'Nâng tầng'}
                      </button>
                      <small>{cp.kind === 'tam' ? 'Bị động' : cp.id === 'hoa_xa' ? 'Kiếm ý đầy' : `Hồi ${cp.cd} hiệp`}</small>
                      {cp.tang > 0 && (
                        <button
                          className="dm-eq"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(cp);
                          }}
                        >
                          {on ? 'Tháo' : 'Mang'}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
              <p className="note">Thục luyện tự đầy theo năm. Đầy thanh thì cần 1 tàn quyển để lên tầng.</p>
            </div>
          )}

          {tab === 'dung' && (
            <>
              <div className={`dm-fuse ${fuse}`} style={{ backgroundImage: 'url(/bg/luyen_dan-2.png)' }}>
                <div className="dm-fuse-in">
                  <Icon src="g_kiem_pho_tan_thien" size={48} />
                  <small>Liệt Hỏa · 9</small>
                </div>
                <span className="dm-fuse-x">+</span>
                <div className="dm-fuse-in">
                  <Icon src="g_doc_co_kiem_pho" size={48} />
                  <small>Kim Xà · 9</small>
                </div>
                {fuse === 'fuse' && (
                  <span className="mg-smoke dm-smoke" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, i) => (
                      <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />
                    ))}
                  </span>
                )}
                {fuse === 'ok' && (
                  <span className="mg-out ok dm-fuse-out">
                    <Icon src={FUSED.icon} size={56} />
                  </span>
                )}
                {fuse === 'ok' && <span className="fs-stamp ok">Lĩnh ngộ!</span>}
              </div>
              {fuse === 'ok' ? (
                <p className="fs-res ok">
                  Hai luồng kiếm ý hòa làm một. Bạn lĩnh ngộ <b>{FUSED.name}</b> (Địa phẩm). Công thức đã ghi vào sổ.
                </p>
              ) : (
                <p className="note">Hai chiêu cùng hệ đều viên mãn tầng 9 thì có thể thử dung hợp. Ra chiêu gì thì phải thử mới biết.</p>
              )}
              <dl className="fs-odds">
                <dt>Kết quả</dt>
                <dd>{fuse === 'ok' ? FUSED.name : '??? (chưa ai trong sổ của bạn ra chiêu này)'}</dd>
                <dt>Thành</dt>
                <dd>60%</dd>
                <dt>Hỏng</dt>
                <dd className="bad">hai chiêu tụt về tầng 6, không mất</dd>
                <dt>Tốn</dt>
                <dd>10 năm bế quan</dd>
              </dl>
              <button
                className="btn btn-red btn-big"
                disabled={fuse !== 'idle'}
                onClick={() => {
                  setFuse('fuse');
                  t.current = setTimeout(() => setFuse('ok'), 1600);
                }}
              >
                {fuse === 'fuse' ? 'Đang dung hợp...' : fuse === 'ok' ? 'Đã lĩnh ngộ' : '☯ Dung hợp'}
              </button>
              {fuse === 'ok' && (
                <button className="btn" onClick={() => setFuse('idle')}>
                  Xem lại
                </button>
              )}
            </>
          )}

          {tab === 'so' && (
            <>
              <div className="dm-heir">
                <Icon src={get(heir).icon} size={44} />
                <div>
                  <small>Truyền thừa kiếp sau</small>
                  <b>{get(heir).name}</b>
                  <span>Kiếp 13 sinh ra đã biết bộ này, từ tầng 1.</span>
                </div>
              </div>
              <div className="chips scroll">
                {all
                  .filter((x) => x.tang === 9)
                  .map((x) => (
                    <button key={x.id} className={`chip-btn ${heir === x.id ? 'on' : ''}`} onClick={() => setHeir(x.id)}>
                      {x.name}
                    </button>
                  ))}
              </div>
              <p className="note">Chỉ công pháp viên mãn mới truyền được. Mỗi kiếp chọn 1 bộ.</p>
              <div className="dm-book">
                {BOOK_ICONS.map((s, i) => (
                  <span key={s} className={`dm-book-i ${i < 5 || (i === 15 && fuse === 'ok') ? '' : 'unseen'}`}>
                    <Icon src={s} size={36} dark={!(i < 5 || (i === 15 && fuse === 'ok'))} />
                  </span>
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={`q${i}`} className="dm-book-i unseen">
                    ?
                  </span>
                ))}
              </div>
              <p className="note">Đã gặp qua 12 kiếp. Còn 105 bộ chưa thấy, có bộ chỉ ra từ dung hợp.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Linh thú ---------- */
function ThuScene({ onClose }: { onClose: () => void }) {
  const [evo, setEvo] = useState(1);
  const [view, setView] = useState<string | null>(null);
  return (
    <div className="forge-wrap dm-wrap" role="dialog" aria-modal="true" aria-label="Linh thú">
      <div className="forge-scene">
        <div className="fs-head">
          <b>Linh thú</b>
          <span className="fs-tinh">Sổ {PET_SEEN.length}/{PET_IDS.length}</span>
          <button className="ss-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="dm-thu-stage" style={{ backgroundImage: 'url(/bg/du_ngoan-1.png)' }}>
          {view ? (
            <>
              <span className="dm-thu-name">
                <b>
                  <RankBadge r={rankOfPet(view)} /> {petNameOf(view)}
                </b>
                <small>{PET_SEEN.includes(view) ? 'Đã gặp' : 'Chưa thuần phục · xem trước'}</small>
              </span>
              <div className={`dm-thu-big ${['SSR', 'SSS'].includes(rankOfPet(view)) ? 'b2' : ''}`} key={view}>
                <AnyPet id={view} box={LEGEND[view] ? 170 : 150} />
              </div>
              {rankOfPet(view) === 'SSS' && (
                <span className="dm-evo-rays" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => (
                    <i key={i} style={{ left: `${14 + ((i * 29) % 72)}%`, top: `${14 + ((i * 17) % 60)}%`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              )}
              <button className="dm-back" onClick={() => setView(null)}>
                ← Xích Lang của bạn
              </button>
            </>
          ) : (
            <>
          <span className="dm-thu-name">
              <b>
                <RankBadge r={PET_EVO_RANK[evo]} /> {PET_EVO_NAME[evo]}
              </b>
              <small>Bậc {evo + 1}/3 · Lv {evo === 2 ? 20 : 14}</small>
            </span>
            <div className={`dm-thu-big b${evo}`} key={evo}>
              <PetAnim id={PET_EVO[evo]} scale={evo === 2 ? 3.6 : 3.2} dir={1} />
            </div>
            {evo === 2 && (
              <span className="dm-evo-rays" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} style={{ left: `${24 + ((i * 29) % 52)}%`, top: `${22 + ((i * 17) % 50)}%`, animationDelay: `${i * 0.25}s` }} />
                ))}
              </span>
            )}
            </>
          )}
        </div>
        <div className="fs-info">
          <div className="dm-evo">
            {PET_EVO.map((id, i) => (
              <button key={id} className={`dm-evo-n ${i === evo ? 'on' : ''} ${i < 1 ? 'done' : ''}`} onClick={() => setEvo(i)}>
                <span className="dm-evo-pic">
                  <PetAnim id={id} scale={1} dir={1} still dark={i === 2 && evo !== 2} />
                </span>
                <small>{i === 2 && evo !== 2 ? '???' : PET_EVO_NAME[i]}</small>
                <RankBadge r={PET_EVO_RANK[i]} />
              </button>
            ))}
          </div>
          <p className="note">Mỗi lần tiến hóa, rank tăng. Chạm từng bậc để xem trước.</p>

          <div className="dm-box">
            <div className="dm-row">
              <span>Thân thiết</span>
              <b>Lv 14/20</b>
            </div>
            <span className="dm-prog wide">
              <span style={{ width: '70%' }} />
            </span>
            <small>Đi cùng bạn 23 năm. Mỗi năm bên nhau +1, cùng đánh trận +2.</small>
          </div>

          <div className="dm-box">
            <b className="dm-h">Tác dụng</b>
            <span className="dm-eff">
              <i>Hộ chủ</i> Bị chặn đường thì 30% lao lên cắn một đòn
            </span>
            <span className="dm-eff">
              <i>Bậc 2</i> Công +8% khi trừ yêu
            </span>
            <span className={`dm-eff ${evo === 2 ? '' : 'lock'}`}>
              <i>Bậc 3</i> {evo === 2 ? 'Tru Nguyệt: mỗi trận 1 lần chặn đòn chí mạng' : 'Mở khi tiến hóa'}
            </span>
          </div>

          <div className="dm-box">
            <b className="dm-h">Tiến hóa lên Thiên Lang · rank SR → SSR</b>
            <span className="dm-need ok">✓ Đã qua bậc 2</span>
            <span className="dm-need">✗ Thân thiết Lv 20 (đang 14)</span>
            <span className="dm-need">✗ Chủ đạt Nguyên Anh (đang Kim Đan 2)</span>
            <button className="btn btn-jade" disabled>
              Tiến hóa
            </button>
          </div>

          <div className="dm-box">
            <b className="dm-h">Huyết mạch</b>
            <div className="dm-blood">
              <span className="dm-blood-s">
                <span className="dm-evo-pic">
                  <PetAnim id="tuyet_ho" scale={0.75} dir={1} still />
                </span>
                <span>
                  <b>Tuyết Hồ</b>
                  <small>từ kiếp 7 · +5 phúc duyên mỗi 10 năm</small>
                </span>
              </span>
              <span className="dm-blood-s empty">
                <span className="dm-plus">+</span>
                <span>
                  <b>Ô trống</b>
                  <small>Mở khi Xích Lang lên bậc 3</small>
                </span>
              </span>
            </div>
            <small>Thú bậc 3 khi mất sẽ để lại một giọt huyết mạch cho kiếp sau. Hai huyết mạch khác loài có 15% ra biến dị.</small>
          </div>

          <b className="dm-h">Sổ linh thú theo rank</b>
          <p className="note">Rank càng cao càng hiếm gặp. Tỉ lệ là khi có kỳ ngộ gặp linh thú. Chạm một con để xem.</p>
          {RANKS.map((r) => {
            const ids = ALL_PETS.filter((id) => rankOfPet(id) === r.id);
            const big = r.id === 'SSS';
            return (
              <div key={r.id} className={`dm-rk-row rk-${r.id}`}>
                <div className="dm-rk-head">
                  <RankBadge r={r.id} big />
                  <span>
                    <b>
                      {r.name} <i className="dm-rate">{r.rate}</i>
                    </b>
                    <small>{r.note}</small>
                  </span>
                </div>
                <div className={`dm-petbook ${big ? 'big' : ''}`}>
                  {ids.map((id) => (
                    <button key={id} className={`dm-petbook-i ${LEGEND[id] ? 'big' : ''} ${view === id ? 'on' : ''}`} onClick={() => setView(id)} aria-label={petNameOf(id)}>
                      <AnyPet id={id} box={LEGEND[id] ? 50 : 40} still dark={!PET_SEEN.includes(id) && !LEGEND[id]} />
                      {LEGEND[id] && <small>{petNameOf(id)}</small>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Đánh nhau ---------- */
/* Hiệu ứng pixel riêng cho demo: vẽ SVG độ phân giải thấp, PixelFx làm sắc mép và thêm viền như LPC */
const TAU = Math.PI * 2;
const rnd1 = (i: number, f: number) => ((i * 9301 + f * 49297) % 233280) / 233280;
function fxKiemKhi(a: string, b: string, core: string, edge: string): FxSpec {
  // kiếm khí hình trăng khuyết, đuôi lửa lập lòe
  return {
    key: `dmkk${a}${b}`,
    w: 30,
    h: 26,
    frames: 4,
    outline: edge,
    draw: (_p, f) => {
      let o = '';
      for (let i = 0; i < 7; i++) {
        const x = 2 + i * 2.2 + rnd1(i, f) * 2;
        const y = 5 + rnd1(i + 3, f) * 16;
        const s = 1 + (i % 3);
        o += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s}" height="${s}" fill="${i % 2 ? a : b}"/>`;
      }
      o += `<path d="M16 1 A12 12 0 0 1 16 25 A15 15 0 0 0 16 1Z" fill="${a}"/>`;
      o += `<path d="M18 3 A10 10 0 0 1 18 23 A13 13 0 0 0 18 3Z" fill="${b}"/>`;
      o += `<path d="M21 6 A7 7 0 0 1 21 20 A10 10 0 0 0 21 6Z" fill="${core}"/>`;
      return o;
    },
  };
}
function fxKimXa(): FxSpec {
  // kim xà: thân rắn vàng uốn sóng, đầu to mắt đỏ
  return {
    key: 'dmkimxa',
    w: 52,
    h: 22,
    frames: 6,
    outline: '#3a2408',
    draw: (p) => {
      let o = '';
      for (let j = 0; j <= 11; j++) {
        const x = 3 + j * 3.6;
        const y = 11 + Math.sin(j * 0.75 - p * TAU) * (j === 11 ? 2 : 5);
        const r = j === 11 ? 4.2 : 1.6 + j * 0.13;
        o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${j % 2 ? '#ffcf3e' : '#d9822b'}"/>`;
        if (j === 11) o += `<rect x="${(x + 1).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="1.6" height="1.6" fill="#e0202e"/><rect x="${(x + 3).toFixed(1)}" y="${(y + 1).toFixed(1)}" width="3" height="1" fill="#fff6b0"/>`;
      }
      return o;
    },
  };
}
function fxVuot(): FxSpec {
  // ba vết vuốt của linh thú, rạch dần rồi mờ
  return {
    key: 'dmvuot',
    w: 30,
    h: 30,
    frames: 5,
    draw: (_p, f) => {
      const k = Math.min(1, (f + 1) / 3);
      let o = '';
      for (let i = 0; i < 3; i++) {
        const x0 = 6 + i * 7;
        const x1 = x0 + 10 * k;
        const y1 = 4 + 22 * k;
        o += `<line x1="${x0}" y1="4" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#b0201a" stroke-width="${f > 3 ? 2 : 4}"/>`;
        o += `<line x1="${x0}" y1="4" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#ffffff" stroke-width="${f > 3 ? 1 : 2}"/>`;
      }
      return o;
    },
  };
}
function fxNo(color: string): FxSpec {
  // vụ nổ lúc trúng đòn: sao trắng thu nhỏ, vòng hạt văng ra
  return {
    key: `dmno${color}`,
    w: 36,
    h: 36,
    frames: 6,
    draw: (p) => {
      const c = 18;
      let o = '';
      const s = 12 * (1 - p);
      if (s > 1) o += `<polygon points="${c},${c - s} ${c + s * 0.25},${c - s * 0.25} ${c + s},${c} ${c + s * 0.25},${c + s * 0.25} ${c},${c + s} ${c - s * 0.25},${c + s * 0.25} ${c - s},${c} ${c - s * 0.25},${c - s * 0.25}" fill="#ffffff"/>`;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.3;
        const r = 3 + p * 15;
        const z = p < 0.7 ? 3 : 2;
        o += `<rect x="${(c + Math.cos(a) * r - z / 2).toFixed(1)}" y="${(c + Math.sin(a) * r - z / 2).toFixed(1)}" width="${z}" height="${z}" fill="${i % 2 ? color : '#fff6b0'}"/>`;
      }
      return o;
    },
  };
}
function fxHoaXa(): FxSpec {
  // tuyệt kỹ Hỏa Xà Phần Thiên: rắn lửa khổng lồ
  return {
    key: 'dmhoaxa',
    w: 100,
    h: 44,
    frames: 8,
    outline: '#5a1408',
    draw: (p, f) => {
      let o = '';
      for (let j = 0; j <= 16; j++) {
        const x = 4 + j * 5.4;
        const y = 22 + Math.sin(j * 0.55 - p * TAU) * (j === 16 ? 3 : 10);
        const r = j === 16 ? 9 : 3 + j * 0.3;
        o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 2).toFixed(1)}" fill="#e8401a"/>`;
        o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${j % 3 ? '#ffb02a' : '#ffd36b'}"/>`;
        if (j % 2 === 0) o += `<rect x="${(x - 1).toFixed(1)}" y="${(y - r - 4 - rnd1(j, f) * 4).toFixed(1)}" width="2" height="3" fill="#ffb02a"/>`;
        if (j === 16) o += `<rect x="${(x + 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="3" height="3" fill="#fff6b0"/><path d="M${(x + 6).toFixed(1)} ${(y + 1).toFixed(1)} l7 -2 l-7 5z" fill="#fff6b0"/>`;
      }
      return o;
    },
  };
}
const FX_LIET = fxKiemKhi('#e8401a', '#ffb02a', '#fff6b0', '#5a1408');
const FX_FOE = fxKiemKhi('#a8301a', '#ff6a2a', '#ffd36b', '#2a0804');
const FX_KIMXA = fxKimXa();
const FX_VUOT = fxVuot();
const FX_NO_HOA = fxNo('#ff6a2a');
const FX_NO_KIM = fxNo('#ffcf3e');
const FX_NO_DO = fxNo('#e0202e');
const FX_HOAXA = fxHoaXa();

type Kind = 'liet' | 'foe' | 'vuot' | 'chay' | 'kimxa' | 'ult';
type Step = { kind: Kind; dmg: number; skill?: string; chip?: number; tag?: string; log: string; heal?: number; crit?: boolean; y?: number };
const SCRIPT: Step[] = [
  { kind: 'liet', dmg: 86, skill: 'Liệt Hỏa Kiếm Quyết', chip: 1, tag: 'Thiêu đốt!', log: 'Liệt Hỏa Kiếm Quyết! Kiếm khí đỏ rực chém ngang, Hỏa Kỳ Lân bị thiêu đốt.', y: 25 },
  { kind: 'foe', dmg: 44, log: 'Hỏa Kỳ Lân phun lửa, bạn mất 44 máu.' },
  { kind: 'vuot', dmg: 31, tag: 'Xích Lang!', chip: 3, log: 'Hộ chủ: Xích Lang lao lên vồ, ba vết vuốt rạch ngang sườn, -31.', y: 15 },
  { kind: 'chay', dmg: 18, tag: 'cháy', log: 'Lửa còn bám trên lớp vảy, -18.' },
  { kind: 'kimxa', dmg: 64, skill: 'Kim Xà Kiếm Pháp', chip: 2, heal: 19, crit: true, log: 'Kim Xà Kiếm Pháp: kiếm quang uốn như rắn vàng, bạo kích, hút lại 19 máu.', y: 25 },
  { kind: 'foe', dmg: 38, log: 'Kỳ Lân húc tới, bạn lùi ba bước, -38.' },
  { kind: 'liet', dmg: 92, skill: 'Liệt Hỏa Kiếm Quyết', chip: 1, log: 'Liệt Hỏa Kiếm Quyết lần nữa. Kiếm ý trong người đã căng đầy.', y: 35 },
  { kind: 'ult', dmg: 999, skill: 'Hỏa Xà Phần Thiên Kiếm', crit: true, log: 'Kiếm ý viên mãn! Hỏa Xà Phần Thiên Kiếm: rắn lửa trăm trượng nuốt trọn Hỏa Kỳ Lân.' },
];
// thời điểm trúng đòn và độ dài mỗi bước (ms)
const HIT: Record<Kind, number> = { liet: 620, kimxa: 620, foe: 560, vuot: 430, chay: 120, ult: 2050 };
const DUR: Record<Kind, number> = { liet: 1650, kimxa: 1650, foe: 1450, vuot: 1350, chay: 900, ult: 3700 };

export interface FightFx {
  k: number;
  kind: Kind;
  skill?: string;
}

function useBattle(c: Character | null) {
  const m = MONSTERS.find((x) => x.id === 'ky_lan') ?? MONSTERS[0];
  const MAX_M = 420;
  const MAX_P = 300;
  const [b, setB] = useState<BattleView | null>(null);
  const [chip, setChip] = useState<number | null>(null);
  const [petHit, setPetHit] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [fx, setFx] = useState<FightFx | null>(null);
  const [gauge, setGauge] = useState(0);
  const [burn, setBurn] = useState(0);
  const [stop, setStop] = useState(false);
  const [shake, setShake] = useState<0 | 1 | 2>(0);
  const [hitAt, setHitAt] = useState<{ k: number; kind: Kind } | null>(null);
  useEffect(() => {
    if (!c) return;
    let live = true;
    const T: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, f: () => void) => T.push(setTimeout(() => live && f(), ms));
    let id = 1;
    const base = { m, name: m.name, lv: 25, tier: 0, pMax: MAX_P, mMax: MAX_M, kills: 3, melem: { me: 'kim', foe: 'hoa', rel: 'bi_khac' } } as const;
    const run = () => {
      let mHp = MAX_M;
      let pHp = 248;
      let hist: BattleView['last'] = [];
      let g = 0;
      let lines: LogEntry[] = [{ age: 58, tone: 'normal', text: 'Trừ yêu ở Hỏa Diệm Sơn. Hỏa Kỳ Lân Lv25 chặn đường.' }];
      setB({ ...base, pHp, mHp, phase: 'fight', last: [] } as unknown as BattleView);
      setLog(lines);
      setGauge(0);
      setBurn(0);
      setFx(null);
      let t = 700;
      SCRIPT.forEach((s, k) => {
        at(t, () => {
          setFx({ k: id, kind: s.kind, skill: s.skill });
          setChip(s.chip ?? null);
          if (s.kind === 'vuot') setPetHit((x) => x + 1);
        });
        at(t + HIT[s.kind], () => {
          const big = s.kind === 'ult' || !!s.crit;
          setStop(true);
          at(big ? 200 : 80, () => {
            setStop(false);
            setShake(big ? 2 : s.kind === 'chay' ? 0 : 1);
            at(big ? 450 : 260, () => setShake(0));
          });
          if (s.kind === 'foe') pHp = Math.max(1, pHp - s.dmg);
          else mHp = s.kind === 'ult' ? 0 : Math.max(1, mHp - s.dmg);
          if (s.heal) pHp = Math.min(MAX_P, pHp + s.heal);
          if (s.kind === 'liet' || s.kind === 'kimxa' || s.kind === 'vuot') g = Math.min(100, g + (s.kind === 'vuot' ? 20 : 27));
          if (s.kind === 'ult') g = 0;
          setGauge(g);
          if (s.kind === 'liet') setBurn(2);
          if (s.kind === 'chay') setBurn((x) => Math.max(0, x - 1));
          if (s.kind === 'ult') setBurn(0);
          setHitAt({ k: id, kind: s.kind });
          hist = [...hist.slice(-3), { id: id++, side: s.kind === 'foe' ? 'm' : 'p', dmg: s.dmg, crit: !!s.crit, text: s.kind === 'ult' ? 'TRẢM!' : s.heal ? `-${s.dmg} · +${s.heal}` : undefined, tag: s.tag }];
          lines = [...lines, { age: 58, tone: s.kind === 'foe' ? 'bad' : s.chip || s.kind === 'ult' ? 'good' : 'normal', text: s.log }];
          setLog(lines);
          setB({ ...base, pHp, mHp, phase: s.kind === 'ult' ? 'rest' : 'fight', outcome: s.kind === 'ult' ? 'win' : undefined, last: hist } as unknown as BattleView);
          if (s.kind === 'ult') {
            lines = [...lines, { age: 58, tone: 'good', text: 'Hỏa Kỳ Lân ngã xuống. Liệt Hỏa Kiếm Quyết thục luyện +3, Xích Lang thân thiết +2.' }];
            setLog(lines);
          }
        });
        t += DUR[s.kind];
        if (k === SCRIPT.length - 1) at(t + 2200, run);
      });
    };
    run();
    return () => {
      live = false;
      T.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c]);
  return { b, chip, petHit, log, fx, gauge, burn, stop, shake, hitAt };
}

/** Lớp hiệu ứng chưởng pháp phủ lên sân khấu */
function FightLayer({ f, c }: { f: ReturnType<typeof useBattle>; c: Character }) {
  const x = f.fx;
  const h = f.hitAt;
  return (
    <div className="dm-fl" aria-hidden="true">
      <div className="dm-gauge">
        <small>Kiếm ý</small>
        <span className={`dm-gauge-bar ${f.gauge >= 100 ? 'full' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={f.gauge >= (i + 1) * 25 ? 'on' : f.gauge > i * 25 ? 'half' : ''} />
          ))}
        </span>
      </div>
      {f.burn > 0 && (
        <>
          <PixelFx spec={fxLua(5)} scale={3} dur={0.5} className="dm-burn" />
          <span className="dm-burn-tag">Thiêu đốt · {f.burn}</span>
        </>
      )}
      {x && (x.kind === 'liet' || x.kind === 'kimxa') && (
        <div key={x.k}>
          <PixelFx spec={fxMotes(12, x.kind === 'liet' ? '#ff6a2a' : '#ffcf3e')} scale={3} dur={0.6} className="dm-charge" />
          {x.skill && <span className={`dm-callout ${x.kind}`}>{x.skill}</span>}
          <span className="dm-proj">
            <PixelFx spec={x.kind === 'liet' ? FX_LIET : FX_KIMXA} scale={3} dur={0.32} />
          </span>
        </div>
      )}
      {x && x.kind === 'foe' && (
        <span className="dm-proj foe" key={x.k}>
          <PixelFx spec={FX_FOE} scale={3} dur={0.32} />
        </span>
      )}
      {x && x.kind === 'vuot' && (
        <span className="dm-claw" key={x.k}>
          <PixelFx spec={FX_VUOT} scale={3} dur={0.3} />
        </span>
      )}
      {x && x.kind === 'ult' && (
        <div key={x.k}>
          {createPortal(<div className="af-cut dm-cut">
            <PixelFx spec={fxRays('#ff6a2a')} scale={4} dur={0.8} className="pa af-cut-fx" />
            <PixelFx spec={fxMotes(14, '#ffb02a')} scale={4} dur={1.2} className="pa af-cut-motes" />
            <span className="af-cut-fig">
              <Sprite c={c} size={176} anim="spellcast" dir={3} />
            </span>
            <span className="af-cut-band">
              <small>Kiếm ý viên mãn · Tuyệt kỹ</small>
              <b>Hỏa Xà Phần Thiên Kiếm</b>
            </span>
          </div>, document.body)}
          <span className="dm-ult">
            <PixelFx spec={FX_HOAXA} scale={3} dur={0.5} />
          </span>
          <span className="dm-ult-flash" />
        </div>
      )}
      {h && h.kind !== 'chay' && (
        <span className={`dm-boom ${h.kind === 'foe' ? 'me' : ''} ${h.kind === 'ult' ? 'big' : ''}`} key={`b${h.k}`}>
          <PixelFx spec={h.kind === 'kimxa' ? FX_NO_KIM : h.kind === 'vuot' ? FX_NO_DO : FX_NO_HOA} scale={h.kind === 'ult' ? 5 : 3} dur={0.36} />
        </span>
      )}
      {h && h.kind === 'ult' && <span className="fs-stamp ok dm-ko" key={`ko${h.k}`}>Trảm!</span>}
    </div>
  );
}


/* ---------- Rank linh thú ---------- */
const RANKS = [
  { id: 'N', name: 'Phổ thông', rate: '45%', note: 'Thú thường, gặp ở làng, ở rừng' },
  { id: 'R', name: 'Hiếm', rate: '30%', note: 'Có linh tính, sống quanh linh mạch' },
  { id: 'SR', name: 'Siêu hiếm', rate: '17%', note: 'Khai linh trí, mang ngũ hành' },
  { id: 'SSR', name: 'Yêu vương, dị thú', rate: '7,5%', note: 'Bá chủ một phương, dị thú Sơn Hải Kinh' },
  { id: 'SSS', name: 'Thần thú', rate: '0,5%', note: 'Tứ linh. Cả server thấy tên chủ' },
] as const;
type RankId = (typeof RANKS)[number]['id'];
const PET_RANK: Record<string, RankId> = {
  // N: thú thường, gặp ở làng, ở rừng
  cho_vang: 'N', chuot_xam: 'N', chuot_bach: 'N', dai_bang: 'N', doi: 'N', soi_con: 'N', ho_ly: 'N', hung_con: 'N',
  // R: có linh tính, sống quanh linh mạch
  ong_vang: 'R', nam_linh: 'R', slime: 'R', ran_con: 'R', su_tu_con: 'R', mai_loc: 'R', tam_linh: 'R',
  // SR: đã khai linh trí
  hac_lang: 'SR', xich_lang: 'SR', tuyet_ho: 'SR', linh_loc: 'SR', thuc_nhan_hoa: 'SR', bang_phong: 'SR', hoa_linh_dich: 'SR', kim_thu: 'SR',
  // SSR: dị chủng mang ngũ hành
  bang_lang: 'SR', hoa_ho: 'SR', huyet_buc: 'SR', tuyet_hung: 'SR', bach_xa: 'SR', xich_chi: 'SR',
  // A: yêu vương một phương
  bach_lang: 'SSR', thu_vuong: 'SSR', tho_long: 'SSR', kim_si: 'SSR',
  // S: dị thú Sơn Hải Kinh
  tat_phuong: 'SSR', cuu_vi: 'SSR', con_bang: 'SSR',
  // SS: tứ tượng, thượng cổ
  bach_ho: 'SSR', thanh_giao: 'SSR', cung_ky: 'SSR',
  // SSS: tứ linh
  thanh_long: 'SSS', ky_lan: 'SSS', huyen_vu: 'SSS', hoa_phuong: 'SSS',
};
/** Linh thú truyền thuyết: dùng thú LPC lớn có sẵn trong bộ quái */
const LEGEND: Record<string, { name: string; look: MonsterLook }> = {
  kim_si: { name: 'Kim Sí Đại Bằng', look: { kind: 'beast', sheet: 'eagle', frames: 3, cell: 64, scale: 1.4, strip: true, fps: 6, filter: 'sepia(0.4) saturate(1.6) drop-shadow(0 0 3px #ffd36b)' } },
  tat_phuong: { name: 'Tất Phương', look: { kind: 'beast', sheet: 'dk_crane', frames: 3, cell: 48, scale: 1.3, strip: true, fps: 3, filter: 'sepia(1) saturate(5) hue-rotate(-30deg)' } },
  cuu_vi: { name: 'Cửu Vĩ Thiên Hồ', look: { kind: 'beast', sheet: 'fox_r', frames: 4, cell: 64, scale: 1.2, strip: true, fps: 7, filter: 'grayscale(1) brightness(1.8) drop-shadow(0 0 4px #b8a0ff)' } },
  con_bang: { name: 'Côn Bằng', look: { kind: 'beast', sheet: 'eagle', frames: 3, cell: 64, scale: 1.7, strip: true, fps: 5, filter: 'hue-rotate(170deg) saturate(1.5) drop-shadow(0 0 4px #9fd8ff)' } },
  bach_ho: { name: 'Bạch Hổ', look: { kind: 'beast', sheet: 'dk_tiger', frames: 3, cell: 64, scale: 1.4, strip: true, fps: 5, filter: 'grayscale(1) brightness(1.6) drop-shadow(0 0 4px #e8f0ff)' } },
  thanh_giao: { name: 'Thanh Giao', look: { kind: 'beast', sheet: 'dk_serpent', frames: 8, cell: 64, scale: 1.5, strip: true, fps: 8, filter: 'sepia(1) hue-rotate(70deg) saturate(3) brightness(1.2)' } },
  cung_ky: { name: 'Cùng Kỳ', look: { kind: 'beast', sheet: 'dk_tiger', frames: 3, cell: 64, scale: 1.4, strip: true, fps: 5, filter: 'grayscale(0.5) hue-rotate(220deg) saturate(1.5) drop-shadow(0 0 4px #9a6aff)' } },
  thanh_long: { name: 'Thanh Long', look: { kind: 'beast', sheet: 'dk_flydragon', frames: 3, cell: 144, scale: 0.75, strip: true, fps: 5, filter: 'hue-rotate(80deg) saturate(1.4) drop-shadow(0 0 5px #9ff0c8)' } },
  ky_lan: { name: 'Kỳ Lân', look: { kind: 'beast', sheet: 'dk_qilin', frames: 3, cell: 85, scale: 1, strip: true, fps: 5, filter: 'saturate(1.3) drop-shadow(0 0 5px #ffd36b)' } },
  huyen_vu: { name: 'Huyền Vũ', look: { kind: 'beast', sheet: 'dk_turtle', frames: 8, cell: 64, scale: 1.3, strip: true, fps: 6, filter: 'hue-rotate(140deg) saturate(1.2) brightness(0.9) drop-shadow(0 0 4px #5ad0c0)' } },
  hoa_phuong: { name: 'Hỏa Phượng', look: { kind: 'beast', sheet: 'dk_crane', frames: 3, cell: 48, scale: 1.8, strip: true, fps: 3, filter: 'sepia(1) saturate(6) hue-rotate(-15deg) brightness(1.2) drop-shadow(0 0 6px #ffb02a)' } },
};
const ALL_PETS = [...PET_IDS, ...Object.keys(LEGEND)];
const petNameOf = (id: string) => LEGEND[id]?.name ?? (PETS[id] ? PETS[id].name.replace(/^./, (x) => x.toUpperCase()) : id);
/** Vẽ một linh thú bất kỳ: sprite pet nhỏ hoặc thú truyền thuyết */
function AnyPet({ id, box, dark, still }: { id: string; box: number; dark?: boolean; still?: boolean }) {
  const L = LEGEND[id];
  if (L)
    return (
      <span className={dark ? 'dm-dark' : ''} style={{ display: 'grid', placeItems: 'end center' }}>
        <MonsterLpc look={L.look} size={box} still={still} />
      </span>
    );
  const p = PETS[id];
  return <PetAnim id={id} scale={(box / 64) * (p.w <= 32 ? 1.6 : p.w >= 80 ? 0.8 : 1)} dir={1} still={still} dark={dark} />;
}
const rankOfPet = (id: string): RankId => PET_RANK[id] ?? 'R';
function RankBadge({ r, big }: { r: RankId; big?: boolean }) {
  return <span className={`dm-rank rk-${r} ${big ? 'big' : ''}`}>{r}</span>;
}

/* ---------- App ---------- */
const KY_NGO: PendingEvent = {
  id: 'demo_bi_kip',
  title: 'Kỳ ngộ · Hang đá sau thác',
  text: 'Xích Lang sủa vào vách đá. Sau lớp rêu là một hộp gỗ mục, bên trong có cuộn lụa cháy sém mép: "Liệt Hỏa Kiếm Quyết". Chữ còn đọc được.',
  choices: [
    { label: 'Ngồi xuống luyện ngay', hint: 'học công pháp Huyền phẩm', lean: 'chinh' },
    { label: 'Mang ra phường thị bán', hint: '+1.800 linh thạch', lean: 'trung' },
  ],
};

export default function DemoApp() {
  const [c, setC] = useState<Character | null>(null);
  const [scr, setScr] = useState<Scr>('choi');
  const [pending, setPending] = useState<PendingEvent | null>(KY_NGO);
  const [fx, setFx] = useState<Fx[]>([]);
  useEffect(() => setC(makeChar()), []);
  const fight = useBattle(scr === 'dau' ? c : null);
  if (!c) return <main className="game" />;
  const inFight = scr === 'dau';
  return (
    <div className="dm-root">
      <nav className="dm-bar" aria-label="Chọn màn demo">
        <b>DEMO</b>
        {(
          [
            ['choi', 'Màn chơi'],
            ['kinh', 'Công pháp'],
            ['thu', 'Linh thú'],
            ['dau', 'Đánh nhau'],
          ] as const
        ).map(([k, n]) => (
          <button key={k} className={scr === k ? 'on' : ''} onClick={() => setScr(k)}>
            {n}
          </button>
        ))}
      </nav>
      <main className={`game dm-game ${pending && scr === 'choi' ? 'has-event' : ''}`}>
        <header className="topbar">
          <div className="topbar-row">
            <span className="age-big">{c.age}</span>
            <span className="meta">
              tuổi · Hạ · Kiếp {c.lifeNo}
              <br />
              <b>12.450</b> linh thạch · Khá giả
            </span>
            <div className="top-icons">
              <button className="icon-btn menu-btn" aria-label="Menu">
                ≡
              </button>
            </div>
          </div>
          <div className="year-bar" aria-hidden="true">
            <div style={{ width: '40%' }} />
          </div>
          <div className="speeds">
            <button className="play">❚❚</button>
            {[1, 2, 4, 8, 16].map((s) => (
              <button key={s} className={s === 2 ? 'on' : ''}>
                {s}×
              </button>
            ))}
            <button className="next">»</button>
          </div>
        </header>

        <section className="stage">
          <div className={`dm-sw ${inFight && fight.stop ? 'dm-stop' : ''} ${inFight && fight.shake ? `dm-shake${fight.shake}` : ''}`}>
            <Scene c={inFight ? { ...c, pet: false, focus: 'tru_yeu' } : c} fx={fx} paused={false} season={1} battle={inFight ? fight.b : null} />
            {inFight && <FightLayer f={fight} c={c} />}
          </div>
          {!inFight && (
            <button className="dm-petbadge" onClick={() => setScr('thu')} aria-label="Xem linh thú Xích Lang">
              <span className="dm-petbadge-pic">
                <PetAnim id="xich_lang" scale={0.62} dir={1} still />
              </span>
              <span>
                <b>Xích Lang</b>
                <small>SR · Lv 14</small>
              </span>
            </button>
          )}
          {inFight && (
            <span className={`dm-fight-pet ${fight.petHit % 2 ? 'hit-a' : fight.petHit ? 'hit-b' : ''}`} key={fight.petHit}>
              <PetAnim id="xich_lang" scale={1.15} dir={1} />
            </span>
          )}
          <button className="strip-btn" aria-label="Chỉ số">
            <StageStrip c={c} compact={(!!pending && scr === 'choi') || inFight} />
          </button>
        </section>

        <div className="game-scroll">
          <LogPanel log={inFight ? fight.log : c.log} />
        </div>

        <footer className="game-bottom">
          {inFight ? (
            <div className="dock-inner dm-fightbar">
              <b className="dm-h">Đang mang</b>
              <div className="dm-fight-cps">
                {[CPS[1], CPS[2]].map((cp, i) => (
                  <span key={cp.id} className={`dm-fcp ${PHAM_CLS[cp.pham]} ${fight.chip === i + 1 ? 'fire' : ''}`}>
                    <Orb cp={cp} size={40} />
                    <span>
                      <b>{cp.name}</b>
                      <small>Tầng {cp.tang} · {i === 0 ? '25% thiêu đốt' : '20% hút máu'}</small>
                    </span>
                  </span>
                ))}
                <span className={`dm-fcp pet ${fight.chip === 3 ? 'fire' : ''}`}>
                  <span className="dm-evo-pic sm">
                    <PetAnim id="xich_lang" scale={0.62} dir={1} still />
                  </span>
                  <span>
                    <b>
                      Xích Lang <RankBadge r="SR" />
                    </b>
                    <small>Hộ chủ 30%</small>
                  </span>
                </span>
              </div>
              <div className="dock-actions">
                <button className="btn btn-dark">Bỏ chạy</button>
                <button className="btn btn-dark" onClick={() => setScr('kinh')}>
                  Công pháp
                </button>
              </div>
            </div>
          ) : pending ? (
            <EventCard
              p={pending}
              onChoose={(i) => {
                setPending(null);
                if (i === 0) {
                  setFx([{ id: Date.now(), kind: 'layer', label: 'Lĩnh ngộ: Liệt Hỏa Kiếm Quyết' }]);
                  setTimeout(() => setFx([]), 2400);
                }
              }}
            />
          ) : (
            <div className="dock-inner">
              <OverworkBar c={c} />
              <FocusGrid c={c} onPick={() => {}} />
              <div className="dock-actions dm-four">
                <button className="btn btn-dark">Phường thị</button>
                <button className="btn btn-dark">Túi đồ</button>
                <button className="btn btn-dark dm-new" onClick={() => setScr('kinh')}>
                  Công pháp
                </button>
                <button className="btn btn-jade">Bế quan</button>
              </div>
              <button className="btn dm-again" onClick={() => setPending(KY_NGO)}>
                Xem lại kỳ ngộ nhặt bí kíp
              </button>
            </div>
          )}
        </footer>
      </main>
      {scr === 'kinh' && <KinhScene c={c} onClose={() => setScr('choi')} />}
      {scr === 'thu' && <ThuScene onClose={() => setScr('choi')} />}
    </div>
  );
}
