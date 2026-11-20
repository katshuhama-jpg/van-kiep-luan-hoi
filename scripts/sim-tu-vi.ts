/* eslint-disable */
/**
 * 21/11 (Ngày 22): mô phỏng tu vi chân thân (Cửu Chuyển) - ngày đạt từng Chuyển cho 3 kiểu người chơi.
 * Luật chép đúng supabase/ct_tu_vi_2026_11_21.sql (máy chủ): thanh tầng, offline 12h đủ + 12h 50% rồi dừng ở giờ 24,
 * kiếp 25 x căn(năm sống) với bậc 5/10 kiếp mỗi ngày, tốc độ x1,11 mỗi Chuyển, bình cảnh, đột phá theo Chuyển đích,
 * trượt (+10% lần sau, lần 3 chắc, mất nửa phần dư). Mỗi lần nhận (mở màn) hoặc khép kiếp là một lần "chốt" ở máy chủ.
 * Giả định có đủ chìa Mộng dẫn chân, bấm Đột phá ngay khi Viên mãn đủ ngưỡng (không áp cảnh) - giống bảng trong doc.
 *
 * Chạy: npx tsx scripts/sim-tu-vi.ts [số lần chạy=300]
 * Đổi: TV_KIEP=262 (tu vi trung bình một kiếp ở Chuyển 1; doc giả định ~260, số thật 14 ngày tới 20/11: 315)
 *      AP_CANH=1 (đợi tới bình cảnh rồi mới bấm), TOC=1.11 (tốc độ tu luyện mỗi Chuyển, chỉ để thử)
 * Mốc trong doc (claude/vong-cay-chan-than.md): C9 Viên mãn khoảng ngày 139 (chơi đều) / 286 (chỉ offline).
 */
const BAR = [
  [1000, 1200, 1300, 1500], [1700, 2000, 2300, 2700], [3100, 3500, 4000, 4700],
  [5400, 6200, 7100, 8100], [9400, 11000, 12000, 14000], [16000, 19000, 22000, 25000],
  [29000, 33000, 38000, 44000], [50000, 58000, 66000, 76000], [88000, 100000, 120000, 130000],
];
const DOC_DONE = { deu: [1, 3, 7, 12, 19, 32, 53, 86, 139], off: [3, 7, 14, 24, 40, 66, 108, 176, 286] };
const RUNS = Number(process.argv[2] ?? 300);
const TV_KIEP = Number(process.env.TV_KIEP ?? 262);
const AP_CANH = process.env.AP_CANH === '1';

const TOC = Number(process.env.TOC ?? 1.11); // tốc độ tu luyện mỗi Chuyển (Tyler chốt 20/11: 1.11 để C9 Viên mãn khoảng ngày 139)
const toc = (c: number) => Math.pow(TOC, c - 1);
const tran = (c: number) => BAR[c - 1][3] * (c >= 9 ? 1 : 2);
const offline = (h: number) => 100 * Math.min(Math.max(h, 0), 12) + 50 * Math.min(Math.max(h - 12, 0), 12);

type St = { chuyen: number; tang: number; tv: number; truot: number; chot: number; ngay: number; kiepNgay: number };
function cong(s: St, them: number) {
  let con = Math.max(them, 0);
  while (con > 0) {
    const bar = BAR[s.chuyen - 1][Math.min(s.tang, 3)];
    if (s.tang < 3) {
      const lay = Math.min(con, bar - s.tv);
      s.tv += lay; con -= lay;
      if (s.tv >= bar) (s.tv = 0), s.tang++;
    } else {
      s.tv += Math.min(con, Math.max(tran(s.chuyen) - s.tv, 0));
      con = 0;
      if (s.tv >= bar) s.tang = 4;
    }
  }
}
function chot(s: St, gio: number) {
  if (gio > s.chot) cong(s, offline(gio - s.chot) * toc(s.chuyen));
  s.chot = Math.max(s.chot, gio);
}
function kiep(s: St, gio: number, tvC1: number) {
  chot(s, gio);
  const d = Math.floor(gio / 24);
  if (d !== s.ngay) (s.ngay = d), (s.kiepNgay = 0);
  s.kiepNgay++;
  const he = s.kiepNgay <= 5 ? 1 : s.kiepNgay <= 10 ? 0.5 : 0.2;
  cong(s, tvC1 * he * toc(s.chuyen));
}
function dotPha(s: St, R: () => number): boolean {
  if (s.tang < 4 || s.chuyen >= 9) return false;
  const nguong = BAR[s.chuyen - 1][3];
  if (AP_CANH && s.tv < tran(s.chuyen)) return false;
  const dich = s.chuyen + 1;
  const goc = dich <= 3 ? 1 : dich <= 6 ? 0.85 : 0.75;
  const x = Math.min(Math.max(s.tv / nguong - 1, 0), 1);
  const p = s.truot >= 2 ? 1 : Math.min(1, goc + (1 - goc) * x + 0.1 * s.truot);
  if (R() < p) {
    s.chuyen++, (s.tang = 0), (s.tv = 0), (s.truot = 0);
    return true;
  }
  s.tv -= (s.tv - nguong) / 2;
  s.truot++;
  return false;
}

/** lịch một ngày: các lần mở màn (giờ) và các kiếp khép (giờ) */
type Kieu = { id: 'deu' | 'off2' | 'off1'; ten: string; mo: number[]; kiep: number[] };
const KIEU: Kieu[] = [
  // chơi đều: mở sáng 8:00, tối 20:00 chơi 5 kiếp (khép lúc 20:20 .. 21:40), nhận lại lúc 21:45
  { id: 'deu', ten: 'Chơi đều (2 lần mở + 5 kiếp/ngày)', mo: [8, 21.75], kiep: [20.33, 20.67, 21, 21.33, 21.67] },
  // chỉ offline, vào 2 lần không đều: 8:00 và 22:00 (cách 14 giờ và 10 giờ)
  { id: 'off2', ten: 'Chỉ offline, 2 lần/ngày (8:00, 22:00)', mo: [8, 22], kiep: [] },
  // chỉ offline, 1 lần/ngày 20:00
  { id: 'off1', ten: 'Chỉ offline, 1 lần/ngày (20:00)', mo: [20], kiep: [] },
];

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** trả ngày (tính từ 1) đạt: vào Chuyển 2..9 (index 1..8) và C9 Viên mãn (index 9). index 0 = ngày xong C1 (vào C2) */
function chay(k: Kieu, seed: number): number[] {
  const R = mulberry(seed);
  // tạo chân thân lúc lần mở đầu ngày 1: quà đủ lên Sơ tầng
  const s: St = { chuyen: 1, tang: 0, tv: 0, truot: 0, chot: k.mo[0], ngay: 0, kiepNgay: 0 };
  cong(s, BAR[0][0]);
  const xong: number[] = [];
  const ev = [...k.mo.map((g) => ({ g, t: 'mo' as const })), ...k.kiep.map((g) => ({ g, t: 'kiep' as const }))].sort((a, b) => a.g - b.g);
  for (let d = 0; d < 1500 && xong.length < 9; d++) {
    for (const e of ev) {
      const gio = d * 24 + e.g;
      if (d === 0 && e.g < k.mo[0]) continue;
      if (e.t === 'kiep') kiep(s, gio, TV_KIEP);
      else chot(s, gio);
      // xong Chuyển c = bấm đột phá thành sang c+1 (C1..C8); C9 xong = đạt Viên mãn
      while (dotPha(s, R)) xong.push(d + 1);
      if (s.chuyen === 9 && s.tang === 4 && xong.length === 8) xong.push(d + 1);
    }
  }
  return xong;
}

const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p90 = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.9)];
console.log(`Tu vi chân thân: ${RUNS} lần chạy mỗi kiểu, tu vi một kiếp ở C1 = ${TV_KIEP}${AP_CANH ? ', ÁP CẢNH tới bình cảnh' : ', bấm ngay ở ngưỡng'}`);
const kq: Record<string, number[]> = {};
for (const k of KIEU) {
  const all = Array.from({ length: RUNS }, (_, i) => chay(k, 1000 + i));
  const m = Array.from({ length: 9 }, (_, c) => med(all.map((x) => x[c] ?? Infinity)));
  const q = Array.from({ length: 9 }, (_, c) => p90(all.map((x) => x[c] ?? Infinity)));
  kq[k.id] = m;
  const doc = k.id === 'deu' ? DOC_DONE.deu : DOC_DONE.off;
  console.log(`\n${k.ten}`);
  console.log('Chuyển | xong ngày (trung vị) | p90 | doc | lệch');
  for (let c = 0; c < 9; c++) {
    const lech = ((m[c] - doc[c]) / doc[c]) * 100;
    console.log(`C${c + 1}     | ${String(m[c]).padStart(4)} | ${String(q[c]).padStart(4)} | ${String(doc[c]).padStart(4)} | ${lech >= 0 ? '+' : ''}${lech.toFixed(0)}%${Math.abs(lech) > 15 ? '  (>15%)' : ''}`);
  }
}
const lech = (a: number, b: number) => `${(((a - b) / b) * 100).toFixed(0)}%`;
console.log(`\nC9 Viên mãn: chơi đều ngày ${kq.deu[8]} (doc 139, lệch ${lech(kq.deu[8], 139)}); offline 2 lần ngày ${kq.off2[8]}, 1 lần ngày ${kq.off1[8]} (doc 286, lệch ${lech(kq.off2[8], 286)} / ${lech(kq.off1[8], 286)})`);
