/* eslint-disable */
/**
 * 4.6.0 Sơn Môn Tranh Bá (bản gọn): mô phỏng Kỷ 14 ngày bằng người chơi THẬT.
 * Dữ liệu: scripts/fixtures/sm-nguoi-choi.txt (Lực chiến, số kiếp, số ngày chơi, số ngày có mặt trong 7 ngày,
 * giờ online theo vkl_events; ẩn danh, lấy 14/11/2026). Công thức trận, trần, Khí vận lấy từ lib/sonmon/data.ts.
 *
 * Chạy: npx tsx scripts/sim-son-mon.ts [số lần chạy=20]
 * Đổi hệ số để thử: SAN_NHA=1.25 TRAN=6000 DEM=2 MOT_O=1.15 VAO=0.6 (tỉ lệ người vào môn) SO_MON=25
 *
 * Đo (mục tiêu ở plan-4.6.0 Ngày 2):
 *  - % trận đánh ô CÓ người giữ mà bên đánh thắng (35-65%)
 *  - số ô môn nhất / môn trung vị cuối Kỷ (không quá 3 lần)
 *  - % ngày môn trung vị đạt Khí vận 30 (50-80%) và 60 (10-40%)
 */
import * as fs from 'fs';
import * as path from 'path';
import { SM_CFG, banDo, hexKe, trongBanDo, oToiDa, nvBac, NV_MUC, NV_THUONG, kvBonus, capLc, Hex } from '../lib/sonmon/data';

const env = (k: string, d: number) => (process.env[k] !== undefined ? Number(process.env[k]) : d);
const SAN_NHA = env('SAN_NHA', SM_CFG.tran.sanNha);
const DEM = env('DEM', SM_CFG.tran.dem);
const MOT_O = env('MOT_O', SM_CFG.tran.motO);
const TRAN = env('TRAN', SM_CFG.tran.tran);
const VAO = env('VAO', 0.6);
const SO_MON = env('SO_MON', 25);
const NGAY = env('NGAY', 14);
const LIEU = env('LIEU', 0.2); // môn chủ liều: vẫn đánh khi ước tính bên giữ hơn ta tới 20%
const RUNS = Number(process.argv[2] ?? 20);
const cap = (lc: number) => Math.min(lc, TRAN) + Math.max(lc - TRAN, 0) / 2;
void capLc;

type P = { lc: number; kiep: number; ngay: number; d7: number; gio: number[]; mon: number; chuc: 'chu' | 'lao' | 'de'; dung: string | null; nghi: number };
type Mon = { id: number; nguoi: number[]; kv: number[]; o: Set<string> };

const raw = fs.readFileSync(path.join(__dirname, 'fixtures/sm-nguoi-choi.txt'), 'utf8')
  .split('\n').filter((l) => l && !l.startsWith('#')).join(';').split(';').filter(Boolean)
  .map((s) => s.split(',').map(Number));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const key = (h: Hex) => `${h.q},${h.r}`;
const unkey = (k: string): Hex => { const [q, r] = k.split(',').map(Number); return { q, r }; };

function run(seed: number) {
  const R = rng(seed);
  const ps: P[] = raw.map(([lc, kiep, ngay, d7, m]) => ({
    lc, kiep, ngay, d7, gio: Array.from({ length: 24 }, (_, h) => h).filter((h) => (m >> h) & 1),
    mon: -1, chuc: 'de', dung: null, nghi: -1,
  }));
  // người mạnh lập môn: đủ 50 kiếp + 5 ngày, Lực chiến cao trước; thiếu thì hạ còn 30 + 4 (van an toàn)
  const order = ps.map((_, i) => i).sort((a, b) => ps[b].lc - ps[a].lc);
  let lap = order.filter((i) => ps[i].kiep >= SM_CFG.lap.kiep && ps[i].ngay >= SM_CFG.lap.ngay);
  if (lap.length < SO_MON) lap = lap.concat(order.filter((i) => !lap.includes(i) && ps[i].kiep >= SM_CFG.lap.kiepHa && ps[i].ngay >= SM_CFG.lap.ngayHa));
  lap = lap.slice(0, SO_MON);
  const mons: Mon[] = lap.map((pi, id) => { ps[pi].mon = id; ps[pi].chuc = 'chu'; return { id, nguoi: [pi], kv: [], o: new Set() }; });
  // người khác vào môn mở cửa (môn đông được chọn hơn một chút)
  for (const i of order) {
    if (ps[i].mon >= 0 || R() > VAO) continue;
    const open = mons.filter((m) => m.nguoi.length < SM_CFG.mon.toiDa);
    if (!open.length) break;
    const w = open.map((m) => 1 + m.nguoi.length * 0.3);
    let x = R() * w.reduce((a, b) => a + b, 0), k = 0;
    while (x > w[k]) x -= w[k++];
    open[k].nguoi.push(i); ps[i].mon = open[k].id;
  }
  for (const m of mons) m.nguoi.slice(1).sort((a, b) => ps[b].lc - ps[a].lc).slice(0, 3).forEach((i) => (ps[i].chuc = 'lao'));

  const banKinh = SO_MON <= 30 ? 6 : 7;
  const owner = new Map<string, number>();
  const baoHo = new Map<string, number>();
  const cd = new Map<number, string>();
  // cắm cờ ô đầu: ô trống ngẫu nhiên
  const all = banDo(banKinh).map(key);
  for (const m of mons) {
    const free = all.filter((k) => !owner.has(k));
    const k = free[Math.floor(R() * free.length)];
    owner.set(k, m.id); m.o.add(k); cd.set(m.id, k);
  }
  // nửa số người chọn ô đứng giữ (chia đều), nửa kia đứng ở chính điện
  const chonGiu = new Set(ps.map((_, i) => i).filter(() => R() < 0.5));
  const stats = { tranCoNguoi: 0, thangCoNguoi: 0, tranTrong: 0, camCo: 0 };

  for (let d = 0; d < NGAY; d++) {
    // ai chơi hôm nay, online giờ nào
    const choi = ps.map((p) => R() < p.d7 / 7);
    const online: Set<number>[] = Array.from({ length: 24 }, () => new Set());
    ps.forEach((p, i) => {
      if (!choi[i] || !p.gio.length) return;
      const pr = Math.min(1, 3 / p.gio.length);
      for (const h of p.gio) if (R() < pr) online[h].add(i);
    });
    // Khí vận hôm nay: điểm danh + nhiệm vụ
    const kvHom = mons.map(() => 0);
    ps.forEach((p, i) => {
      if (p.mon < 0 || !choi[i]) return;
      if (R() < 0.85) kvHom[p.mon] += 1;
      const lives = Math.max(1, Math.round((p.kiep / Math.max(1, p.ngay)) * (0.5 + R())));
      const bac = nvBac(p.lc);
      const [k] = NV_MUC[bac];
      const pT = [0.61, 0.4, 0.22][bac - 1], pC = [0.85, 0.76, 0.5][bac - 1];
      if (lives >= k) kvHom[p.mon] += NV_THUONG[0];
      if (R() < 1 - Math.pow(1 - pT, lives)) kvHom[p.mon] += NV_THUONG[1];
      if (R() < 1 - Math.pow(1 - pC, lives)) kvHom[p.mon] += NV_THUONG[2];
    });
    const kvQua = mons.map((m) => (d > 0 ? m.kv[d - 1] : 0));

    for (let h = 0; h < 24; h++) {
      const t = d * 24 + h;
      // chỗ đứng giữ: người chọn giữ chia đều các ô của môn
      const giuO = (i: number) => {
        const m = mons[ps[i].mon];
        if (!chonGiu.has(i)) return cd.get(m.id)!;
        const os = [...m.o].sort();
        return os[i % os.length] ?? cd.get(m.id)!;
      };
      for (const m of [...mons].sort(() => R() - 0.5)) {
        const ldr = m.nguoi.some((i) => online[h].has(i) && ps[i].chuc !== 'de');
        if (!ldr || m.o.size >= oToiDa(m.nguoi.length)) continue;
        const ke = new Set<string>();
        for (const k of m.o) for (const n of hexKe(unkey(k))) if (trongBanDo(n, banKinh) && !m.o.has(key(n))) ke.add(key(n));
        const theo = m.nguoi.filter((i) => online[h].has(i) && ps[i].nghi <= t);
        if (!theo.length) continue;
        const atk = theo.reduce((s, i) => s + cap(ps[i].lc), 0) * (1 + kvBonus(kvQua[m.id]));
        const trong = [...ke].filter((k) => !owner.has(k));
        // tới nơi sau 50 phút: giờ kế tiếp
        const toiH = (h + 1) % 24;
        const dem = toiH < SM_CFG.demToi;
        if (trong.length) {
          const k = trong[Math.floor(R() * trong.length)];
          owner.set(k, m.id); m.o.add(k); stats.camCo++;
          continue;
        }
        // trinh sát các ô kề của môn khác, chọn ô yếu nhất mà ước tính đánh được
        let best: { k: string; est: number } | null = null;
        for (const k of ke) {
          if ((baoHo.get(k) ?? -1) > t) continue;
          const b = owner.get(k)!;
          const mb = mons[b];
          const giu = mb.nguoi.filter((i) => giuO(i) === k && ps[i].nghi <= t);
          const motO = mb.o.size === 1;
          const def = giu.reduce((s, i) => s + cap(ps[i].lc), 0) * SAN_NHA * (1 + kvBonus(kvQua[b])) * (dem ? DEM : 1) * (motO ? MOT_O : 1);
          const est = def * (0.85 + R() * 0.3);
          if (est < atk * (1 + LIEU * R()) && (!best || est < best.est)) best = { k, est };
        }
        if (!best) continue;
        const k = best.k, b = owner.get(k)!, mb = mons[b];
        // bên bị đánh: ai online thì 70% dồn sang ô bị đánh
        const giu = mb.nguoi.filter((i) => ps[i].nghi <= t && (giuO(i) === k || ((online[h].has(i) || online[toiH].has(i)) && R() < 0.7)));
        const motO = mb.o.size === 1;
        const def = giu.reduce((s, i) => s + cap(ps[i].lc), 0) * SAN_NHA * (1 + kvBonus(kvQua[b])) * (dem ? DEM : 1) * (motO ? MOT_O : 1);
        const co = giu.length > 0;
        if (co) stats.tranCoNguoi++; else stats.tranTrong++;
        if (atk > def) {
          if (co) stats.thangCoNguoi++;
          owner.set(k, m.id); m.o.add(k); mb.o.delete(k); baoHo.set(k, t + SM_CFG.gio.baoHoGio);
          if (cd.get(b) === k) {
            const con = [...mb.o];
            if (con.length) cd.set(b, con[0]);
            else {
              const free = all.filter((x) => !owner.has(x));
              const nk = free[Math.floor(R() * free.length)];
              if (nk) { owner.set(nk, b); mb.o.add(nk); cd.set(b, nk); baoHo.set(nk, t + SM_CFG.gio.baoHoMatHetGio); }
            }
          }
        } else {
          for (const i of theo) ps[i].nghi = t + SM_CFG.gio.nghiGio;
        }
      }
    }
    mons.forEach((m) => m.kv.push(kvHom[m.id]));
  }
  const oS = mons.map((m) => m.o.size).sort((a, b) => a - b);
  const med = oS[Math.floor(oS.length / 2)];
  const medMon = [...mons].sort((a, b) => a.nguoi.length - b.nguoi.length)[Math.floor(mons.length / 2)];
  const kvDays = mons.flatMap((m) => m.kv);
  return {
    pct: stats.tranCoNguoi ? stats.thangCoNguoi / stats.tranCoNguoi : NaN,
    tranCoNguoi: stats.tranCoNguoi, thang: stats.thangCoNguoi, duLap: ps.filter((p) => p.kiep >= SM_CFG.lap.kiep && p.ngay >= SM_CFG.lap.ngay).length, tranTrong: stats.tranTrong, camCo: stats.camCo,
    tiLeO: oS[oS.length - 1] / Math.max(1, med), oMax: oS[oS.length - 1], oMed: med,
    kv30Med: medMon.kv.filter((x) => x >= 30).length / medMon.kv.length,
    kv60Med: medMon.kv.filter((x) => x >= SM_CFG.tran.moc2).length / medMon.kv.length,
    kv50Med: medMon.kv.filter((x) => x >= 50).length / medMon.kv.length,
    kv45Med: medMon.kv.filter((x) => x >= 45).length / medMon.kv.length,
    kv30All: kvDays.filter((x) => x >= 30).length / kvDays.length,
    kv60All: kvDays.filter((x) => x >= SM_CFG.tran.moc2).length / kvDays.length,
    nguoiMed: medMon.nguoi.length,
    vao: ps.filter((p) => p.mon >= 0).length / ps.length,
  };
}

const rs = Array.from({ length: RUNS }, (_, i) => run(1000 + i));
const avg = (f: (r: ReturnType<typeof run>) => number) => rs.reduce((s, r) => s + f(r), 0) / rs.length;
const pc = (x: number) => (100 * x).toFixed(1) + '%';
console.log(`Người chơi thật: ${raw.length}. Môn: ${SO_MON}. Vào môn: ${pc(avg((r) => r.vao))}. ${RUNS} lần chạy, ${NGAY} ngày.`);
console.log(`Hệ số: sân nhà ${SAN_NHA}, trần ${TRAN}, đêm x${DEM}, một ô x${MOT_O}`);
const tong = rs.reduce((s, r) => s + r.tranCoNguoi, 0), thang = rs.reduce((s, r) => s + r.thang, 0);
console.log(`Môn chủ đủ điều kiện lập (50 kiếp + 5 ngày): ${rs[0].duLap}. Trận đánh ô có người giữ: ${avg((r) => r.tranCoNguoi).toFixed(0)}/Kỷ, bên đánh thắng ${pc(thang / Math.max(1, tong))} (mục tiêu 35-65%). Trận vào ô không người: ${avg((r) => r.tranTrong).toFixed(0)}. Cắm cờ ô trống: ${avg((r) => r.camCo).toFixed(0)}`);
console.log(`Ô cuối Kỷ: môn nhất ${avg((r) => r.oMax).toFixed(1)}, trung vị ${avg((r) => r.oMed).toFixed(1)}, tỉ lệ ${avg((r) => r.tiLeO).toFixed(2)} lần (mục tiêu <= 3)`);
console.log(`Khí vận môn trung vị (${avg((r) => r.nguoiMed).toFixed(1)} người): đạt 30 ${pc(avg((r) => r.kv30Med))} ngày (50-80%), đạt mốc 2 (${SM_CFG.tran.moc2}) ${pc(avg((r) => r.kv60Med))} ngày (10-40%); nếu mốc 2 là 50: ${pc(avg((r) => r.kv50Med))}, 45: ${pc(avg((r) => r.kv45Med))}`);
console.log(`Khí vận mọi môn: đạt 30 ${pc(avg((r) => r.kv30All))}, đạt mốc 2 ${pc(avg((r) => r.kv60All))}`);
