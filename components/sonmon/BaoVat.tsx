/**
 * Ngày 8a: Pháp bảo Sơn Môn - 7 loại vũ khí + Trấn Môn Kiếm + Chưởng Môn Ấn, mỗi loại 5 phẩm (45 hình).
 * Vẽ bằng lưới pixel 16x24 trong code (SVG rect), không ảnh, không gradient. Phẩm đổi DÁNG chứ không chỉ đổi màu:
 *   Phàm: lưỡi trơn, cán gỗ. Bảo: thêm đai và tua. Linh: khắc vân, chuôi ngọc. Tiên: dài hơn, có cánh mây.
 *   Thần: to nhất, có lửa quanh viền nhấp nháy 2 khung (tắt khi prefers-reduced-motion).
 * Viền ngoài tự dựng (ô trống kề ô có màu thành nét mực), nên mọi món cùng một nét vẽ.
 */
import { tr } from '@/lib/i18n';

export type BvLoai = 'kiem' | 'dao' | 'thuong' | 'quat' | 'phat_tran' | 'cung' | 'song_chuy' | 'tran_mon_kiem' | 'an';
export type BvPham = 'pham' | 'bao' | 'linh' | 'tien' | 'than';

export const BV_PHAM: { id: BvPham; vi: string; en: string; pct: number; vien: string; chu: string }[] = [
  { id: 'than', vi: 'Thần phẩm', en: 'Divine', pct: 12, vien: '#d8453a', chu: '#a8281f' },
  { id: 'tien', vi: 'Tiên phẩm', en: 'Immortal', pct: 9, vien: '#e8c35a', chu: '#7d5a0c' },
  { id: 'linh', vi: 'Linh phẩm', en: 'Spirit', pct: 7, vien: '#9a5cc8', chu: '#6a3399' },
  { id: 'bao', vi: 'Bảo phẩm', en: 'Treasure', pct: 4, vien: '#3f86c8', chu: '#235f96' },
  { id: 'pham', vi: 'Phàm phẩm', en: 'Mortal', pct: 2, vien: '#8d877a', chu: 'inherit' },
];
export const bvPham = (p: string) => BV_PHAM.find((x) => x.id === p) ?? BV_PHAM[4];

/** 7 loại theo hạng Công 1-7, rồi 2 món riêng của môn chủ */
export const BV_LOAI: { id: BvLoai; vi: string; en: string }[] = [
  { id: 'kiem', vi: 'Kiếm', en: 'Sword' },
  { id: 'dao', vi: 'Đao', en: 'Saber' },
  { id: 'thuong', vi: 'Thương', en: 'Spear' },
  { id: 'quat', vi: 'Quạt', en: 'Fan' },
  { id: 'phat_tran', vi: 'Phất trần', en: 'Whisk' },
  { id: 'cung', vi: 'Cung', en: 'Bow' },
  { id: 'song_chuy', vi: 'Song chùy', en: 'Twin maces' },
  { id: 'tran_mon_kiem', vi: 'Trấn Môn Kiếm', en: 'Sect Guardian Sword' },
  { id: 'an', vi: 'Chưởng Môn Ấn', en: 'Sect Seal' },
];
export const bvLoai = (l: string) => BV_LOAI.find((x) => x.id === l) ?? BV_LOAI[0];
export const bvTen = (l: string, p: string) => {
  const ph = bvPham(p);
  const lo = bvLoai(l);
  return tr(`${ph.vi} ${lo.vi}`, `${ph.en} ${lo.en}`);
};

const W = 16;
const H = 24;
type Cv = string[][];
const blank = (): Cv => Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
const put = (c: Cv, x: number, y: number, k: string) => {
  if (x >= 0 && x < W && y >= 0 && y < H) c[y][x] = k;
};
const box = (c: Cv, x: number, y: number, w: number, h: number, k: string) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(c, x + i, y + j, k);
};

// bảng màu: m/M kim loại sáng/tối, w/W gỗ, g/G vàng, j/J ngọc, r/R đỏ, e vân khắc, c/C mây, p giấy, s dây cung, d đá, f lửa
const PAL_BASE: Record<string, string> = {
  k: '#1f160d', m: '#e4e8ec', M: '#8b95a3', w: '#9a6234', W: '#6b3f1f', g: '#f0c75a', G: '#a8781f',
  j: '#64c79a', J: '#2f7d5e', r: '#d8453a', R: '#8f2a22', e: '#7fc8ff', c: '#fff6e0', C: '#d9c9a3', s: '#efe2c0', d: '#a19e93', D: '#66635a',
  f: '#ff9a3c', F: '#ffd34d',
};
const PAL_PHAM: Record<BvPham, Record<string, string>> = {
  pham: { m: '#c9c4b8', M: '#7d786c', p: '#e8dcc0', P: '#b8a882' },
  bao: { p: '#9fc8ec', P: '#3f86c8' },
  linh: { p: '#d4b3ef', P: '#9a5cc8' },
  tien: { p: '#ffe9a8', P: '#e0a92e' },
  than: { m: '#fff3f0', M: '#c98a80', p: '#ff8c7a', P: '#c4362b' },
};
const PI: Record<BvPham, number> = { pham: 0, bao: 1, linh: 2, tien: 3, than: 4 };

/** Chuôi kiếm/đao chung: cán, chắn tay, tua theo phẩm. Trả y của chắn tay. */
function chuoi(c: Cv, pi: number, cx: number, guardW: number) {
  const gy = 18;
  // cán (2 px) + đốc
  box(c, cx, gy + 1, 2, 3, pi >= 1 ? 'R' : 'W');
  if (pi >= 1) for (let y = gy + 1; y < gy + 4; y += 2) box(c, cx, y, 2, 1, 'g'); // đai quấn cán
  box(c, cx, gy + 4, 2, 1, pi >= 2 ? 'j' : 'W'); // đốc: ngọc từ Linh
  // chắn tay
  box(c, cx + 1 - Math.floor(guardW / 2), gy, guardW, 1, pi >= 1 ? 'g' : 'M');
  if (pi >= 3) {
    // cánh mây hai bên chắn tay
    put(c, cx - Math.floor(guardW / 2), gy - 1, 'c');
    put(c, cx + 1 + Math.floor(guardW / 2), gy - 1, 'c');
    put(c, cx - Math.floor(guardW / 2) - 1, gy - 2, 'c');
    put(c, cx + 2 + Math.floor(guardW / 2), gy - 2, 'c');
  }
  if (pi >= 1) {
    // tua đỏ treo ở đốc
    put(c, cx + 2, gy + 4, 'r');
    put(c, cx + 3, gy + 5, 'r');
    put(c, cx + 3, gy + 6 > H - 1 ? H - 1 : gy + 5, 'R');
  }
  return gy;
}

function veKiem(c: Cv, pi: number, to = false) {
  const len = [8, 9, 11, 13, 14][pi] + (to ? 1 : 0);
  const cx = 7;
  const gy = chuoi(c, pi, cx, to ? 8 : [4, 6, 6, 6, 8][pi]);
  const w = to ? 4 : 2;
  const x0 = to ? cx - 1 : cx;
  for (let y = gy - len; y < gy; y++) {
    put(c, x0, y, 'm');
    for (let i = 1; i < w; i++) put(c, x0 + i, y, i < w / 2 ? 'm' : 'M');
  }
  // mũi
  put(c, x0, gy - len - 1, 'm');
  if (w > 2) put(c, x0 + 1, gy - len - 1, 'M');
  if (to) put(c, x0 + 1, gy - len - 2, 'm');
  if (pi >= 2) for (let y = gy - len + 2; y < gy - 1; y += 3) put(c, x0 + Math.floor(w / 2) - (w > 2 ? 0 : 1), y, 'e'); // vân khắc
  if (to) {
    box(c, cx, gy - 2, 2, 1, 'r'); // ngọc đỏ trấn môn
    put(c, cx, gy - 4, 'g');
    put(c, cx + 1, gy - 6, 'g');
  }
}

function veDao(c: Cv, pi: number) {
  const len = [8, 9, 11, 12, 14][pi];
  const cx = 6;
  const gy = chuoi(c, pi, cx, [4, 5, 6, 6, 8][pi]);
  for (let y = gy - len; y < gy; y++) {
    const t = (gy - y) / len; // 0 ở chắn tay, 1 ở mũi
    const loe = t > 0.55 ? 1 : 0; // lưỡi phình gần mũi
    put(c, cx, y, 'M'); // sống dao
    put(c, cx + 1, y, 'm');
    put(c, cx + 2, y, 'm');
    if (loe) put(c, cx + 3, y, 'm');
  }
  // mũi cong lên
  put(c, cx + 1, gy - len - 1, 'm');
  put(c, cx + 2, gy - len - 1, 'm');
  put(c, cx + 2, gy - len - 2, 'm');
  put(c, cx + 2, gy - Math.floor(len / 3), '.'); // khấc lưng dao
  if (pi >= 2) for (let y = gy - len + 3; y < gy - 1; y += 3) put(c, cx + 1, y, 'e');
  if (pi >= 1) put(c, cx + 3, gy - 3, 'r'); // vòng đồng trên sống
}

function veThuong(c: Cv, pi: number) {
  const cx = 7;
  const dauLen = [3, 4, 4, 5, 6][pi];
  const top = 1;
  // mũi thương hình lá
  for (let i = 0; i < dauLen; i++) {
    const wHalf = i === 0 ? 0 : i < dauLen - 1 ? 1 : 0;
    for (let d = -wHalf; d <= wHalf + 1; d++) put(c, cx + d, top + i, d <= 0 ? 'm' : 'M');
  }
  const coY = top + dauLen;
  box(c, cx, coY, 2, 1, pi >= 1 ? 'g' : 'M'); // đai cổ
  // tua đỏ dưới mũi
  const tua = [0, 3, 3, 4, 5][pi];
  for (let i = 0; i < tua; i++) {
    put(c, cx - 1 - (i % 2), coY + 1 + i, 'r');
    put(c, cx + 2 + (i % 2), coY + 1 + i, 'R');
  }
  if (pi >= 3) {
    put(c, cx - 2, coY - 1, 'c');
    put(c, cx + 3, coY - 1, 'c');
  }
  // cán dài
  for (let y = coY + 1; y < H - 1; y++) {
    put(c, cx, y, pi >= 2 && y % 4 === 0 ? 'g' : 'w');
    put(c, cx + 1, y, 'W');
  }
  box(c, cx, H - 1, 2, 1, pi >= 2 ? 'j' : 'M');
  if (pi >= 2) put(c, cx, top + 2, 'e');
}

function veQuat(c: Cv, pi: number) {
  const px = 7.5;
  const py = 19;
  const R = [9, 9.5, 10, 10.5, 11][pi];
  const goc = [58, 62, 66, 70, 74][pi];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - px;
      const dy = py - (y + 0.5);
      const r = Math.hypot(dx, dy);
      if (dy <= 0 || r > R || r < 2.5) continue;
      const a = (Math.atan2(dx, dy) * 180) / Math.PI;
      if (Math.abs(a) > goc) continue;
      const nan = Math.round(a / 14) * 14; // nan quạt
      let k = Math.abs(a - nan) < 3.5 ? 'W' : 'p';
      if (r > R - 1.2) k = pi >= 1 ? 'P' : 'W'; // mép quạt
      if (pi >= 2 && k === 'p' && Math.abs(r - (R - 3)) < 0.6 && Math.abs(a) < goc - 8) k = 'P'; // hoa văn vòng
      c[y][x] = k;
    }
  // trục và cán gộp
  box(c, 7, py - 2, 2, 4, 'W');
  box(c, 7, py + 2, 2, 1, pi >= 1 ? 'g' : 'W');
  if (pi >= 1) {
    put(c, 8, py + 3, 'r');
    put(c, 9, py + 4, 'r');
  }
  if (pi >= 3) {
    put(c, 7, py - 6, 'g'); // trăng vàng trên mặt quạt
    put(c, 8, py - 6, 'g');
    put(c, 7, py - 7, 'g');
  }
}

function vePhatTran(c: Cv, pi: number) {
  const cx = 7;
  const capY = [11, 10, 10, 9, 8][pi];
  // cán
  for (let y = capY + 2; y < H - 1; y++) {
    put(c, cx, y, 'w');
    put(c, cx + 1, y, 'W');
  }
  if (pi >= 2) for (let y = capY + 4; y < H - 2; y += 4) box(c, cx, y, 2, 1, 'j');
  box(c, cx, H - 1, 2, 1, pi >= 1 ? 'g' : 'W');
  box(c, cx - 1, capY, 4, 2, pi >= 1 ? 'g' : 'W'); // đầu bịt
  // chùm lông bay lên, uốn sang phải
  const len = [6, 7, 8, 8, 8][pi];
  for (let i = 0; i < len; i++) {
    const y = capY - 1 - i;
    const lech = Math.round(Math.sin((i / len) * Math.PI * 0.9) * 2);
    const rong = Math.max(1, Math.round(3 - (i / len) * 2) + (pi >= 3 ? 1 : 0));
    for (let d = -rong; d <= rong; d++) put(c, cx + lech + d, y, (d + i) % 2 === 0 ? 'c' : 'C');
  }
  if (pi >= 1) {
    put(c, cx + 3, capY + 2, 'r');
    put(c, cx + 3, capY + 3, 'r');
  }
}

function veCung(c: Cv, pi: number) {
  const ox = 11;
  const oy = 11.5;
  const R = [7, 7.5, 8, 8.5, 9][pi];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const r = Math.hypot(x + 0.5 - ox - 3, (y + 0.5 - oy) * 0.9);
      if (x < ox && Math.abs(r - R - 2) < 1.05) c[y][x] = x % 2 === 0 ? 'w' : 'W';
    }
  // dây cung
  let top = 0;
  let bot = H - 1;
  while (top < H && !c[top].slice(0, ox).some((k) => k !== '.')) top++;
  while (bot > 0 && !c[bot].slice(0, ox).some((k) => k !== '.')) bot--;
  for (let y = top; y <= bot; y++) put(c, ox, y, 's');
  box(c, 1 + Math.max(0, 6 - R + 2), Math.floor(oy) - 1, 2, 3, pi >= 1 ? 'g' : 'W'); // tay cầm
  if (pi >= 2) {
    put(c, 3, top + 3, 'j');
    put(c, 3, bot - 3, 'j');
  }
  if (pi >= 3) {
    // mũi tên đặt sẵn
    for (let x = 2; x < 15; x++) put(c, x, Math.floor(oy), x > 12 ? 'm' : 'w');
    put(c, 14, Math.floor(oy) - 1, 'M');
    put(c, 14, Math.floor(oy) + 1, 'M');
    put(c, 2, Math.floor(oy) - 1, 'r');
    put(c, 2, Math.floor(oy) + 1, 'r');
  }
  if (pi >= 1) {
    put(c, 3, Math.floor(oy) + 2, 'r');
    put(c, 3, Math.floor(oy) + 3, 'r');
  }
}

function chuy(c: Cv, cx: number, pi: number, cao: number) {
  const r = [2.5, 2.5, 3, 3, 3.5][pi];
  const cy = cao;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - (cx + 1), y + 0.5 - cy);
      if (d <= r) c[y][x] = x + 0.5 < cx + 1 ? 'm' : 'M';
    }
  // gai
  if (pi >= 1) {
    put(c, cx, Math.floor(cy - r) - 1, 'M');
    put(c, cx + Math.ceil(r) + 1, Math.floor(cy), 'M');
    put(c, cx - Math.ceil(r) + 1, Math.floor(cy), 'M');
  }
  if (pi >= 2) put(c, cx, Math.floor(cy), 'e');
  for (let y = Math.floor(cy + r); y < H - 2; y++) put(c, cx, y, 'w');
  put(c, cx, H - 2, pi >= 1 ? 'g' : 'W');
}

function veSongChuy(c: Cv, pi: number) {
  chuy(c, 3, pi, [7, 6, 6, 5, 5][pi]);
  chuy(c, 10, pi, [9, 8, 8, 7, 7][pi]);
  if (pi >= 1) {
    // dây xích nối hai cán
    for (let x = 4; x < 10; x += 2) put(c, x, H - 3, 'g');
  }
  if (pi >= 3) {
    put(c, 1, 2, 'c');
    put(c, 13, 3, 'c');
  }
}

function veAn(c: Cv, pi: number) {
  const thanK = pi >= 2 ? 'j' : pi === 1 ? 'd' : 'd';
  const thanD = pi >= 2 ? 'J' : 'D';
  const kh = pi >= 3 ? 'g' : thanK;
  const khD = pi >= 3 ? 'G' : thanD;
  const s = [8, 9, 10, 10, 12][pi];
  const x0 = Math.floor((W - s) / 2);
  const y0 = H - 1 - Math.floor(s * 0.75);
  // khối ấn
  for (let y = y0; y < H - 1; y++)
    for (let x = x0; x < x0 + s; x++) put(c, x, y, x === x0 + s - 1 || y === H - 2 ? thanD : thanK);
  box(c, x0, H - 1, s, 1, 'r'); // mặt son đỏ dưới đáy
  // núm trên đầu ấn
  const nx = 7;
  if (pi === 0) box(c, nx, y0 - 2, 2, 2, thanK);
  if (pi === 1) {
    box(c, nx - 1, y0 - 3, 4, 3, thanK);
    put(c, nx + 3, y0 - 1, 'r');
    put(c, nx + 4, y0, 'r'); // tua
  }
  if (pi === 2) {
    box(c, nx - 1, y0 - 3, 4, 3, 'j');
    put(c, nx, y0 - 4, 'j');
    put(c, nx + 1, y0 - 4, 'J');
    put(c, x0 + 2, y0 + 2, 'e');
  }
  if (pi >= 3) {
    // thú/rồng cuộn trên núm
    const rong = pi === 4;
    const pts: [number, number][] = rong
      ? [[4, 0], [5, 0], [6, 1], [7, 1], [8, 1], [9, 2], [10, 3], [10, 4], [9, 5], [8, 5], [7, 4], [6, 4], [5, 5], [5, 6], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 6]]
      : [[6, 2], [7, 2], [8, 2], [9, 3], [9, 4], [8, 5], [7, 5], [6, 5], [6, 4], [5, 6], [10, 6]];
    for (const [x, y] of pts) {
      put(c, x, y0 - 8 + y, kh);
      put(c, x, y0 - 7 + y, khD);
    }
    if (rong) {
      put(c, 4, y0 - 9, 'r'); // mắt/lưỡi
      put(c, 3, y0 - 8, 'g');
      put(c, 11, y0 - 3, 'g');
    }
    put(c, x0 + 1, y0 + 1, 'g');
    put(c, x0 + s - 2, y0 + 1, 'g');
  }
}

function ve(loai: string, pi: number): Cv {
  const c = blank();
  switch (loai) {
    case 'dao': veDao(c, pi); break;
    case 'thuong': veThuong(c, pi); break;
    case 'quat': veQuat(c, pi); break;
    case 'phat_tran': vePhatTran(c, pi); break;
    case 'cung': veCung(c, pi); break;
    case 'song_chuy': veSongChuy(c, pi); break;
    case 'tran_mon_kiem': veKiem(c, pi, true); break;
    case 'an': veAn(c, pi); break;
    default: veKiem(c, pi);
  }
  // viền mực tự dựng
  const o = c.map((r) => r.slice());
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (c[y][x] !== '.') continue;
      const ke = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (c[y + dy]?.[x + dx] ?? '.') !== '.');
      if (ke) o[y][x] = 'k';
    }
  return o;
}

/** lửa Thần phẩm: ô trống ngay ngoài nét mực, rải thưa, 2 khung so le */
function lua(c: Cv, khung: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (c[y][x] !== '.') continue;
      const ke = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => c[y + dy]?.[x + dx] === 'k');
      if (ke && (x * 3 + y * 5 + khung) % 4 === 0) out.push([x, y]);
    }
  return out;
}

const cache = new Map<string, React.ReactNode[]>();
function rects(loai: string, pham: BvPham) {
  const key = `${loai}-${pham}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = ve(loai, PI[pham]);
  const pal = { ...PAL_BASE, ...PAL_PHAM[pham] };
  const out: React.ReactNode[] = [];
  c.forEach((row, y) => {
    let x = 0;
    while (x < W) {
      const k = row[x];
      let e = x + 1;
      while (e < W && row[e] === k) e++;
      if (k !== '.' && pal[k]) out.push(<rect key={`${x}-${y}`} x={x} y={y} width={e - x} height={1} fill={pal[k]} />);
      x = e;
    }
  });
  if (pham === 'than')
    [0, 2].forEach((f) =>
      out.push(
        <g key={`lua${f}`} className={`sm-bv-lua k${f}`}>
          {lua(c, f).map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={(x + y) % 2 ? PAL_BASE.f : PAL_BASE.F} />
          ))}
        </g>,
      ),
    );
  cache.set(key, out);
  return out;
}

/** Một món pháp bảo. size là bề ngang (px), cao gấp 1,5. */
export function BaoVatHinh({ loai, pham, size = 48, label }: { loai: string; pham: string; size?: number; label?: string }) {
  const ph = bvPham(pham).id;
  return (
    <svg
      width={size}
      height={(size * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block', flex: 'none' }}
      role="img"
      aria-label={label ?? bvTen(loai, ph)}
    >
      {rects(loai, ph)}
    </svg>
  );
}

/** Ô vuông có viền màu phẩm bao quanh hình (dùng trong danh sách, ô mặc) */
export function BaoVatO({ loai, pham, size = 40, mo = false }: { loai: string | null; pham: string; size?: number; mo?: boolean }) {
  const ph = bvPham(pham);
  return (
    <span className="sm-bv-o" style={{ borderColor: loai ? ph.vien : undefined, opacity: mo ? 0.45 : 1 }}>
      {loai ? <BaoVatHinh loai={loai} pham={ph.id} size={size} /> : <span style={{ width: size, height: (size * H) / W, display: 'block' }} />}
    </span>
  );
}
