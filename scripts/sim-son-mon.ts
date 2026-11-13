export {};
/**
 * 4.6.0 Sơn Môn: mô phỏng 200 người chơi trong 14 ngày với đúng công thức ở lib/sonmon/data.ts.
 * Ba kiểu người: 1 lần/ngày (21h), 4 lần/ngày (8h, 12h, 18h, 22h), người hăng (12 lần/ngày từ 7h tới 23h).
 * Mỗi lần vào là một phiên 8 phút: xây (ưu tiên Chính Điện và công trình tài nguyên thấp nhất, Tàng Bảo khi kho gần đầy),
 * luyện đệ tử công với phần dư, cướp yêu động gần nhà. Không mô phỏng đánh nhau giữa người chơi (đo riêng ở bảng 3 giới).
 * Mục tiêu (plan 4.6.0 Ngày 2): người 1 lần/ngày lên Chính Điện cấp 10 khoảng ngày 7; người hăng không quá 2 lần người thường;
 * 3 giới thắng thua lệch không quá 55/45.
 * Chạy: npx tsx scripts/sim-son-mon.ts [số người=200] [số ngày=14]
 */
const root = process.cwd();
const D = require(root + '/lib/sonmon/data');
const { SM, BUILDINGS, UNITS, buildCost, buildSec, prodPerHour, capOf, trainSec, pointsOf, battle, YEU_DONG } = D;
// thử số khác mà không sửa data.ts: SM_OVR='{"timeG":1.5}' npx tsx scripts/sim-son-mon.ts
if (process.env.SM_OVR) Object.assign(SM, JSON.parse(process.env.SM_OVR));

const NP = Number(process.argv[2] ?? 200);
const DAYS = Number(process.argv[3] ?? 14);
const SESSION = 8 * 60; // giây
let seed = Number(process.env.SEED ?? 7);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

type Kind = 'mot' | 'bon' | 'hang';
const KINDS: Kind[] = [];
for (let i = 0; i < NP; i++) KINDS.push(i < NP * 0.5 ? 'mot' : i < NP * 0.85 ? 'bon' : 'hang');
const LOGIN: Record<Kind, number[]> = { mot: [21], bon: [8, 12, 18, 22], hang: [7, 8.5, 10, 11.5, 13, 14.5, 16, 17.5, 19, 20.5, 22, 23] };
const GIOIS = ['thien', 'hong_tran', 'u_minh'];
/** linh khí từ kiếp mỗi ngày (khoảng 1, 4, 6 kiếp/ngày, trung bình 25 mỗi kiếp; trần 300) */
const LK_DAY: Record<Kind, number> = { mot: 30, bon: 100, hang: 150 };

type Q = { loai: 'xay' | 'luyen'; kind: string; level?: number; n?: number; done: number };
type P = { i: number; kind: Kind; gioi: string; t: number; res: { ls: number; lt: number; kt: number; lk: number }; b: Record<string, number>; q: Q[]; troops: Record<string, number>; away: { back: number; army: Record<string, number>; loot: number }[]; yd: { lv: number; res: number; max: number; at: number }[]; cd10?: number; raids: number };

function newP(i: number): P {
  const b: Record<string, number> = {};
  for (const x of BUILDINGS) b[x.id] = SM.startLevels[x.id] ?? 0;
  const lv = () => 1 + Math.floor(rnd() * 4);
  const yd = [lv(), lv(), lv()].map((l) => { const m = YEU_DONG.resA * Math.pow(YEU_DONG.resG, l - 1); return { lv: l, res: m, max: m, at: 0 }; });
  return { i, kind: KINDS[i], gioi: GIOIS[i % 3], t: 0, res: { ...SM.startRes, lk: 0 }, b, q: [], troops: {}, away: [], yd, raids: 0 };
}
const upkeep = (p: P) => {
  let s = 0;
  for (const [u, n] of Object.entries(p.troops)) s += D.UNIT_BY[u].upkeep * n;
  for (const a of p.away) for (const [u, n] of Object.entries(a.army)) s += D.UNIT_BY[u].upkeep * n;
  return s;
};
function accrue(p: P, t1: number) {
  const h = (t1 - p.t) / 3600;
  if (h <= 0) return;
  const cap = capOf(p.b.tang_bao);
  const add = (cur: number, rate: number) => (rate < 0 ? Math.max(0, cur + rate * h) : cur >= cap ? cur : Math.min(cap, cur + rate * h));
  p.res.ls = add(p.res.ls, prodPerHour(p.b.linh_mach, p.gioi));
  p.res.lt = add(p.res.lt, prodPerHour(p.b.duoc_vien, p.gioi) - upkeep(p));
  p.res.kt = add(p.res.kt, prodPerHour(p.b.khoang_dong, p.gioi));
  p.res.lk += (LK_DAY[p.kind] * h) / 24;
  p.t = t1;
}
function settle(p: P, now: number) {
  for (;;) {
    const ev = [...p.q.map((q) => ({ t: q.done, q })), ...p.away.map((a) => ({ t: a.back, a }))].filter((e) => e.t <= now).sort((a, b) => a.t - b.t)[0];
    if (!ev) break;
    accrue(p, ev.t);
    if ('q' in ev && ev.q) {
      const q = ev.q;
      if (q.loai === 'xay') {
        p.b[q.kind] = q.level!;
        if (q.kind === 'chinh_dien' && q.level === 10 && p.cd10 == null) p.cd10 = q.done / 86400;
      } else p.troops[q.kind] = (p.troops[q.kind] ?? 0) + q.n!;
      p.q.splice(p.q.indexOf(q), 1);
    } else if ('a' in ev && ev.a) {
      const a = ev.a;
      for (const [u, n] of Object.entries(a.army)) p.troops[u] = (p.troops[u] ?? 0) + n;
      const cap = capOf(p.b.tang_bao);
      for (const k of ['ls', 'lt', 'kt'] as const) p.res[k] = Math.max(p.res[k], Math.min(cap, p.res[k] + a.loot / 3));
      p.away.splice(p.away.indexOf(a), 1);
    }
  }
  accrue(p, now);
}
const canPay = (p: P, c: any, k = 1) => p.res.ls >= c.ls * k && p.res.lt >= c.lt * k && p.res.kt >= c.kt * k && p.res.lk >= (c.lk ?? 0) * k;
const pay = (p: P, c: any, k = 1) => { p.res.ls -= c.ls * k; p.res.lt -= c.lt * k; p.res.kt -= c.kt * k; p.res.lk -= (c.lk ?? 0) * k; };
const slots = (p: P) => (p.b.chinh_dien >= SM.queue2At ? 2 : 1);
const nextLv = (p: P, id: string) => p.b[id] + p.q.filter((q) => q.loai === 'xay' && q.kind === id).length + 1;

function pickBuild(p: P): string | null {
  const cd = p.b.chinh_dien;
  const cap = capOf(p.b.tang_bao);
  const res = ['linh_mach', 'duoc_vien', 'khoang_dong'].sort((a, b) => nextLv(p, a) - nextLv(p, b));
  const wants: string[] = [];
  if (Math.max(p.res.ls, p.res.lt, p.res.kt) > cap * 0.8 || buildCost('chinh_dien', nextLv(p, 'chinh_dien')).kt > cap * 0.9) wants.push('tang_bao');
  if (cd >= 2 && nextLv(p, 'luyen_vo') <= Math.ceil(cd / 3)) wants.push('luyen_vo');
  if (cd >= 3 && nextLv(p, 'ho_son') <= Math.ceil(cd / 3)) wants.push('ho_son');
  if (nextLv(p, 'chinh_dien') <= nextLv(p, res[0]) + 2) wants.push('chinh_dien');
  wants.push(res[0]);
  wants.push('chinh_dien', res[1], res[2]);
  for (const id of wants) {
    const b = D.BUILDING_BY[id];
    const lv = nextLv(p, id);
    if (lv > SM.maxLevel || cd < b.needCd) continue;
    if (p.q.some((q) => q.loai === 'xay' && q.kind === id)) continue;
    if (canPay(p, buildCost(id, lv))) return id;
    if (id === wants[0]) return null; // để dành cho thứ ưu tiên nhất
  }
  return null;
}

function session(p: P, start: number) {
  let now = start;
  const end = start + SESSION;
  for (let guard = 0; guard < 50; guard++) {
    settle(p, now);
    // xây
    while (p.q.filter((q) => q.loai === 'xay').length < slots(p)) {
      const id = pickBuild(p);
      if (!id) break;
      const lv = nextLv(p, id);
      pay(p, buildCost(id, lv));
      p.q.push({ loai: 'xay', kind: id, level: lv, done: now + buildSec(id, lv, p.b.chinh_dien) });
    }
    // luyện đệ tử công bằng phần dư (giữ đủ cho Chính Điện kế tiếp)
    const cong = UNITS.find((u: any) => u.gioi === p.gioi && u.role === 'cong');
    if (p.b.luyen_vo >= 1 && !p.q.some((q) => q.loai === 'luyen')) {
      const keep = buildCost('chinh_dien', nextLv(p, 'chinh_dien'));
      const spare = Math.min(p.res.ls - keep.ls, p.res.lt - keep.lt, p.res.kt - keep.kt);
      const share = p.kind === 'hang' ? 0.5 : 0.3;
      const n = Math.min(SM.trainMax, Math.floor((spare * share) / Math.max(cong.cost.ls, cong.cost.kt)));
      if (n >= 1) { pay(p, cong.cost, n); p.q.push({ loai: 'luyen', kind: cong.id, n, done: now + trainSec(cong.id, p.b.luyen_vo) * n }); }
    }
    // cướp yêu động gần nhà (khoảng cách 2-4 ô)
    const have = p.troops[cong.id] ?? 0;
    if (have >= 5) {
      const y = p.yd.map((y) => { y.res = Math.min(y.max, y.res + y.max * YEU_DONG.regenPerHour * (now - y.at) / 3600); y.at = now; return y; }).sort((a, b) => b.res - a.res)[0];
      const def = YEU_DONG.defA * Math.pow(YEU_DONG.defG, y.lv - 1);
      const r = battle({ army: { [cong.id]: have } }, { army: {}, npcDef: def }, 'cuop');
      const alive = Math.round(have * (1 - r.attLoss));
      const ret = p.gioi === 'u_minh' ? Math.round((have - alive) * SM.uMinhReturn) : 0;
      p.troops[cong.id] = ret;
      if (alive > 0) {
        const loot = r.win ? Math.min(y.res, alive * cong.carry) : 0;
        y.res -= loot;
        const sec = 2 * D.marchSec({ [cong.id]: alive }, 2 + rnd() * 2, p.b.truyen_tong, 0, p.gioi);
        p.away.push({ back: now + sec, army: { [cong.id]: alive }, loot });
        p.raids++;
      }
    }
    const nextDone = Math.min(...p.q.map((q) => q.done), ...p.away.map((a) => a.back), Infinity);
    if (nextDone > end) break;
    now = nextDone;
  }
}

function run() {
  const ps = Array.from({ length: NP }, (_, i) => newP(i));
  const logs: { t: number; p: P }[] = [];
  for (const p of ps) for (let d = 0; d < DAYS; d++) for (const h of LOGIN[p.kind]) logs.push({ t: d * 86400 + (h + rnd() * 0.5) * 3600, p });
  logs.sort((a, b) => a.t - b.t);
  const snap: Record<number, Record<Kind, number[]>> = {};
  let di = 0;
  for (const l of logs) {
    while (l.t >= (di + 1) * 86400 && di < DAYS) {
      snap[di + 1] = { mot: [], bon: [], hang: [] };
      for (const p of ps) { settle(p, (di + 1) * 86400); snap[di + 1][p.kind].push(pointsOf(p.b)); }
      di++;
    }
    session(l.p, l.t);
  }
  for (const p of ps) settle(p, DAYS * 86400);
  return { ps, snap };
}

const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const { ps, snap } = run();
console.log(`Mô phỏng Sơn Môn: ${NP} người, ${DAYS} ngày`);
for (const k of ['mot', 'bon', 'hang'] as Kind[]) {
  const g = ps.filter((p) => p.kind === k);
  const cd10 = g.map((p) => p.cd10 ?? 99);
  const cdEnd = g.map((p) => p.b.chinh_dien);
  console.log(`  ${k.padEnd(4)} n=${g.length} LV ${med(g.map((p) => p.b.luyen_vo))} quân ${med(g.map((p) => Object.values(p.troops).reduce((a: number, b: any) => a + b, 0) as number))} CĐ10 ngày (trung vị) ${med(cd10).toFixed(1)}  đạt CĐ10 ${(100 * cd10.filter((x) => x < 99).length / g.length).toFixed(0)}%  CĐ cuối ${med(cdEnd)}  điểm cuối ${med(g.map((p) => pointsOf(p.b)))}  lượt cướp/người ${med(g.map((p) => p.raids))}`);
}
const line = (d: number) => `ngày ${String(d).padStart(2)}: điểm trung vị 1 lần ${med(snap[d].mot)} | 4 lần ${med(snap[d].bon)} | hăng ${med(snap[d].hang)} | hăng/1 lần ${(med(snap[d].hang) / med(snap[d].mot)).toFixed(2)}`;
for (const d of [1, 3, 5, 7, 10, 13]) if (snap[d]) console.log('  ' + line(d));

// --- 3 giới: trận ngẫu nhiên với cùng ngân sách (dao động 0,6-1,6 lần), tường 0-10, giờ đêm 30% ---
const G = GIOIS;
const byRole = (g: string, r: string) => UNITS.find((u: any) => u.gioi === g && u.role === r);
const costOf = (u: any) => u.cost.ls + u.cost.lt + u.cost.kt;
const tally: Record<string, { w: number; l: number }> = Object.fromEntries(G.map((g) => [g, { w: 0, l: 0 }]));
const pair: Record<string, number> = {};
const N2 = 30000;
for (let i = 0; i < N2; i++) {
  const ga = G[Math.floor(rnd() * 3)];
  const gd = G[Math.floor(rnd() * 3)];
  if (ga === gd) { i--; continue; }
  const budget = 20000 + rnd() * 200000;
  const ua = byRole(ga, 'cong');
  const ud = byRole(gd, 'thu');
  const wallLv = Math.floor(rnd() * 11);
  const night = rnd() < 0.3;
  const na = Math.floor((budget * (0.8 + 1.6 * rnd())) / costOf(ua));
  const nd = Math.floor(budget / costOf(ud));
  const r = battle({ army: { [ua.id]: na } }, { army: { [ud.id]: nd }, wall: D.wallOf(wallLv, gd), night }, 'cong_pha');
  // thắng = công phá thành (bên đánh) hoặc giữ được thành (bên thủ). U Minh hoàn hồn 20% không đổi thắng thua, chỉ đỡ thiệt hại.
  const aWin = r.win;
  tally[ga][aWin ? 'w' : 'l']++;
  tally[gd][aWin ? 'l' : 'w']++;
  const key = `${ga}>${gd}`;
  pair[key] = (pair[key] ?? 0) + (aWin ? 1 : 0);
  pair[key + '#'] = (pair[key + '#'] ?? 0) + 1;
}
console.log('  3 giới (bên đánh mang 0,8-2,4 lần ngân sách bên thủ, tường 0-10, 30% giờ đêm; 30.000 trận):');
for (const g of G) console.log(`    ${g.padEnd(9)} thắng ${(100 * tally[g].w / (tally[g].w + tally[g].l)).toFixed(1)}%`);
for (const a of G) for (const d of G) if (a !== d) console.log(`    ${a} đánh ${d}: bên đánh thắng ${(100 * pair[`${a}>${d}`] / pair[`${a}>${d}#`]).toFixed(1)}%`);
