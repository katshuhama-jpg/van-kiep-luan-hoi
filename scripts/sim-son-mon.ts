/**
 * Mô phỏng Sơn Môn 4.6.0 (plan-4.6.0 Ngày 2): 200 người chơi trong 14 ngày.
 * Ba kiểu: "mot" vào 1 lần/ngày, "bon" vào 4 lần/ngày, "hang" (người hăng) vào 12 lần/ngày.
 * Mục tiêu: người 1 lần/ngày lên Chính Điện cấp 10 khoảng ngày 7; người hăng không quá 2 lần người thường;
 * 3 giới thắng thua lệch không quá 55/45.
 * Chạy: npx tsx scripts/sim-son-mon.ts [số người=200] [số ngày=14] [hạt giống=1]
 */
const root = process.cwd();
const S = require(root + '/lib/sonmon/data');
type Gioi = 'thien' | 'hong_tran' | 'u_minh';
// thử số khác mà không sửa file: SO='{"gia":1.5}' LUAT='{"hangChoXay":4}' npx tsx scripts/sim-son-mon.ts
if (process.env.SO) Object.assign(S.SO, JSON.parse(process.env.SO));
if (process.env.LUAT) Object.assign(S.LUAT, JSON.parse(process.env.LUAT));

const N = Number(process.argv[2] ?? 200);
const DAYS = Number(process.argv[3] ?? 14);
let seed = Number(process.argv[4] ?? 1);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const H = 3600;

type Kind = 'mot' | 'bon' | 'hang';
interface P {
  i: number; kind: Kind; gioi: Gioi;
  res: { ls: number; lt: number; kt: number; lk: number };
  lv: Record<string, number>;
  q: { id: string; lv: number; dur: number; end?: number }[];
  tq: { id: string; n: number; dur: number; end?: number }[];
  army: Record<string, number>;
  rs: { cong: number; thu: number; toc: number };
  last: number; logins: number[]; cd10?: number; x: number; y: number;
}
const LOGINS: Record<Kind, number[]> = {
  mot: [21],
  bon: [7, 12, 18, 22],
  hang: [6, 7.5, 9, 10.5, 12, 13.5, 15, 16.5, 18, 19.5, 21, 22.5],
};
const LK_DAY: Record<Kind, number> = { mot: 40, bon: 100, hang: 220 };

const players: P[] = [];
for (let i = 0; i < N; i++) {
  const r = rnd();
  const kind: Kind = r < 0.6 ? 'mot' : r < 0.9 ? 'bon' : 'hang';
  const gioi = S.GIOI[i % 3] as Gioi;
  const lv: Record<string, number> = {};
  for (const id of S.BUILDING_IDS) lv[id] = 0;
  lv.chinh_dien = 1; lv.linh_mach = 1; lv.duoc_vien = 1; lv.khoang_dong = 1;
  const jitter = (rnd() - 0.5) * 2;
  players.push({ i, kind, gioi, res: { ls: 500, lt: 500, kt: 500, lk: 0 }, lv, q: [], tq: [], army: {}, rs: { cong: 0, thu: 0, toc: 0 }, last: 0,
    logins: LOGINS[kind].map((h) => Math.max(0, Math.min(23.9, h + jitter))), x: Math.floor(rnd() * 31), y: Math.floor(rnd() * 31) });
}

function cap(p: P) { return S.storage(p.lv.tang_bao); }
function prod(p: P, id: string) { return S.prodPerHour(p.lv[id]) * S.gioiProd(p.gioi); }
function upkeep(p: P) { let u = 0; for (const id in p.army) u += S.UNITS[id].upkeep * p.army[id]; return u; }

/** bắt đầu các mục đang chờ khi còn chỗ */
function start(p: P, t: number) {
  const run = S.LUAT.xayCungLuc(p.lv.chinh_dien);
  for (let k = 0; k < Math.min(run, p.q.length); k++) if (p.q[k].end == null) p.q[k].end = t + p.q[k].dur;
  if (p.tq[0] && p.tq[0].end == null) p.tq[0].end = t + p.tq[0].dur;
}
/** chạy thời gian tới t: sinh tài nguyên, xong công trình và lượt luyện theo đúng thứ tự */
function advance(p: P, t: number) {
  while (p.last < t) {
    start(p, p.last);
    const ends = [...p.q.filter((x) => x.end != null).map((x) => x.end!), ...(p.tq[0]?.end != null ? [p.tq[0].end!] : [])];
    const t1 = Math.min(t, ...ends.filter((x) => x > p.last), ...(ends.some((x) => x <= p.last) ? [p.last] : []));
    const dt = (t1 - p.last) / H;
    const c = cap(p);
    p.res.ls = Math.min(c, p.res.ls + prod(p, 'linh_mach') * dt);
    p.res.kt = Math.min(c, p.res.kt + prod(p, 'khoang_dong') * dt);
    p.res.lt = Math.max(0, Math.min(c, p.res.lt + (prod(p, 'duoc_vien') - upkeep(p)) * dt));
    p.last = t1;
    let changed = false;
    for (let k = 0; k < p.q.length; k++) {
      const it = p.q[k];
      if (it.end != null && it.end <= t1) {
        p.q.splice(k--, 1); changed = true;
        p.lv[it.id] = it.lv;
        if (it.id === 'chinh_dien' && it.lv >= 10 && p.cd10 == null) p.cd10 = t1 / 86400;
      }
    }
    if (p.tq[0]?.end != null && p.tq[0].end <= t1) {
      const it = p.tq.shift()!; changed = true;
      p.army[it.id] = (p.army[it.id] ?? 0) + it.n;
    }
    if (changed) start(p, t1);
    else if (t1 >= t) break;
  }
  start(p, p.last);
}
/** mục chờ lưu "thời lượng" trong end cho tới khi được bắt đầu */
function pendingLv(p: P, id: string) { let l = p.lv[id]; for (const x of p.q) if (x.id === id) l = Math.max(l, x.lv); return l; }
function can(p: P, c: any) { return p.res.ls >= c.ls && p.res.lt >= c.lt && p.res.kt >= c.kt && p.res.lk >= c.lk; }
function pay(p: P, c: any) { p.res.ls -= c.ls; p.res.lt -= c.lt; p.res.kt -= c.kt; p.res.lk -= c.lk; }
function needOk(p: P, need: any) { for (const k in need ?? {}) if (p.lv[k] < need[k]) return false; return true; }

function enqueueBuild(p: P, t: number): boolean {
  const run = S.LUAT.xayCungLuc(p.lv.chinh_dien);
  if (p.q.length >= run + S.LUAT.hangChoXay) return false;
  const cd = pendingLv(p, 'chinh_dien');
  const mines = ['linh_mach', 'duoc_vien', 'khoang_dong'].map((id) => [id, pendingLv(p, id)] as [string, number]).sort((a, b) => a[1] - b[1]);
  const want: string[] = [];
  const c = cap(p);
  const nextCd = S.buildCost('chinh_dien', cd + 1);
  if (Math.max(nextCd.ls, nextCd.kt, nextCd.lt) > c * 0.9 || Math.max(p.res.ls, p.res.lt, p.res.kt) > c * 0.85) want.push('tang_bao');
  if (cd <= mines[0][1] + 1) want.push('chinh_dien');
  want.push(mines[0][0]);
  if (cd >= 3 && pendingLv(p, 'luyen_vo') < Math.ceil(cd / 2)) want.push('luyen_vo');
  if (cd >= 2 && pendingLv(p, 'ho_son') < Math.floor(cd / 2)) want.push('ho_son');
  if (cd >= 5 && pendingLv(p, 'tang_kinh') < cd - 4) want.push('tang_kinh');
  want.push('chinh_dien');
  for (const id of want) {
    const l = pendingLv(p, id) + 1;
    if (l > S.BUILDINGS[id].max || !needOk(p, S.BUILDINGS[id].need)) continue;
    const cost = S.buildCost(id, l);
    if (!can(p, cost)) continue;
    pay(p, cost);
    const dur = S.buildTime(id, l, p.lv.chinh_dien);
    p.q.push({ id, lv: l, dur });
    start(p, t);
    return true;
  }
  return false;
}
function enqueueTrain(p: P, t: number) {
  if (p.lv.luyen_vo < 1 || p.tq.length > S.LUAT.hangChoLuyen) return;
  // mỗi lần vào dành khoảng 30% tài nguyên đang có cho đệ tử, còn lại để xây
  const keep = 0;
  const budget = (k: 'ls' | 'lt' | 'kt') => p.res[k] * 0.3;
  const role = rnd() < (p.kind === 'mot' ? 0.4 : 0.6) ? 'cong' : 'thu';
  const elite = p.lv.tang_kinh >= 10 && p.lv.luyen_vo >= 10 && rnd() < 0.4;
  const id = S.unitOf(p.gioi, elite ? 'tinh_anh' : role);
  const u = S.UNITS[id];
  const n = Math.floor(Math.min(budget('ls') / u.cost.ls, budget('lt') / u.cost.lt, budget('kt') / u.cost.kt, u.cost.lk ? p.res.lk / u.cost.lk : 1e9));
  if (n < 1) return;
  // lương phải đủ: không luyện quá sản lượng linh thảo
  const room = Math.floor((prod(p, 'duoc_vien') * 0.9 - upkeep(p)) / u.upkeep);
  const m = Math.min(n, room, 200);
  if (m < 1) return;
  pay(p, { ls: u.cost.ls * m, lt: u.cost.lt * m, kt: u.cost.kt * m, lk: u.cost.lk * m });
  const dur = S.trainTime(id, p.lv.luyen_vo) * m;
  p.tq.push({ id, n: m, dur });
  start(p, t);
}
function research(p: P) {
  for (const id of ['cong', 'thu'] as const) {
    const l = p.rs[id] + 1;
    if (l > p.lv.tang_kinh) continue;
    const c = S.researchCost(id, l, p.gioi);
    if (can(p, c) && rnd() < 0.5) { pay(p, c); p.rs[id] = l; }
  }
}

const wins: Record<string, { w: number; l: number }> = { thien: { w: 0, l: 0 }, hong_tran: { w: 0, l: 0 }, u_minh: { w: 0, l: 0 } };
const atkWins: Record<string, { w: number; n: number }> = { thien: { w: 0, n: 0 }, hong_tran: { w: 0, n: 0 }, u_minh: { w: 0, n: 0 } };
let fights = 0, raidsYd = 0;

function attack(p: P, t: number) {
  const cong = Object.keys(p.army).filter((id) => ['cong', 'tinh_anh'].includes(S.UNITS[id].role) && p.army[id] > 0);
  if (!cong.length) return;
  const army: any = {}; for (const id of cong) army[id] = p.army[id];
  if (t / 86400 < 5 || rnd() < 0.5) {
    // đánh yêu động: thủ theo cấp yêu động
    raidsYd++;
    const yd = { army: { [S.unitOf('hong_tran', 'thu')]: 8 + Math.floor(t / 86400) * 6 }, gioi: 'hong_tran', research: 0 };
    const r = S.battle({ army, gioi: p.gioi, research: p.rs.cong }, yd, S.isNight(t * 1000), 'cuop');
    const { left } = S.afterLoss(army, r.atkLoss, p.gioi);
    for (const id of cong) p.army[id] = left[id];
    if (r.win) { let carry = 0; for (const id of cong) carry += S.UNITS[id].carry * left[id]; const g = Math.min(carry, 600 + 120 * t / 86400) / 3; p.res.ls += g; p.res.lt += g; p.res.kt += g; }
    return;
  }
  // đánh người chơi giới khác, điểm không quá chênh
  const pop = S.population(p.lv);
  const foes = players.filter((o) => o.gioi !== p.gioi && S.population(o.lv) >= pop * S.LUAT.diemToiThieu && S.population(o.lv) <= pop * 2);
  if (!foes.length) return;
  // trinh sát 3 động phủ rồi chọn chỗ thủ yếu nhất
  const pick = [0, 1, 2].map(() => foes[Math.floor(rnd() * foes.length)]);
  for (const f of pick) advance(f, t);
  const o = pick.sort((a, b) => S.armyDef({ army: a.army, gioi: a.gioi, research: a.rs.thu, wall: a.lv.ho_son }, false) - S.armyDef({ army: b.army, gioi: b.gioi, research: b.rs.thu, wall: b.lv.ho_son }, false))[0];
  const r = S.battle({ army, gioi: p.gioi, research: p.rs.cong }, { army: o.army, gioi: o.gioi, research: o.rs.thu, wall: o.lv.ho_son }, S.isNight(t * 1000), 'cuop');
  fights++;
  const a = S.afterLoss(army, r.atkLoss, p.gioi), d = S.afterLoss(o.army, r.defLoss, o.gioi);
  for (const id of cong) p.army[id] = a.left[id] + (a.back[id] ?? 0);
  for (const id in o.army) o.army[id] = d.left[id] + (d.back[id] ?? 0);
  wins[p.gioi][r.win ? 'w' : 'l']++; wins[o.gioi][r.win ? 'l' : 'w']++;
  atkWins[p.gioi].n++; if (r.win) atkWins[p.gioi].w++;
  if (r.win) {
    let carry = 0; for (const id of cong) carry += S.UNITS[id].carry * a.left[id];
    const hid = S.hidden(o.lv.tang_bao, o.gioi);
    for (const k of ['ls', 'lt', 'kt'] as const) { const take = Math.min(Math.max(0, o.res[k] - hid), carry / 3); o.res[k] -= take; p.res[k] += take; }
  }
}

// chạy theo từng lần vào game
const events: { t: number; p: P }[] = [];
for (const p of players) for (let d = 0; d < DAYS; d++) for (const h of p.logins) events.push({ t: Math.round((d * 24 + h) * H), p });
events.sort((a, b) => a.t - b.t);
let lastDay = -1;
for (const e of events) {
  const p = e.p, day = Math.floor(e.t / 86400);
  if (day !== lastDay) { lastDay = day; for (const q of players) q.res.lk = Math.min(q.res.lk + LK_DAY[q.kind], 1e9); }
  advance(p, e.t);
  enqueueTrain(p, e.t);
  let k = 0; while (enqueueBuild(p, e.t) && k++ < 6);
  research(p);
  if (rnd() < (p.kind === 'mot' ? 0.6 : 0.35)) attack(p, e.t);
}
const END = DAYS * 86400;
for (const p of players) advance(p, END);

function med(a: number[]) { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; }
const out: string[] = [];
for (const k of ['mot', 'bon', 'hang'] as Kind[]) {
  const ps = players.filter((p) => p.kind === k);
  const cd10 = ps.map((p) => p.cd10 ?? 99);
  const pop = ps.map((p) => S.population(p.lv));
  const atk = ps.map((p) => S.armyAtk({ army: p.army, gioi: p.gioi, research: p.rs.cong }));
  out.push(`${k.padEnd(4)} n=${String(ps.length).padStart(3)}  Chính Điện 10 ngày (trung vị) ${med(cd10).toFixed(1)}  đạt trong 14 ngày ${Math.round(100 * cd10.filter((x) => x < 99).length / ps.length)}%  CĐ ngày 14 ${med(ps.map((p) => p.lv.chinh_dien))}  dân số ${med(pop)}  sức công ${Math.round(med(atk))}`);
}
const popOf = (k: Kind) => med(players.filter((p) => p.kind === k).map((p) => S.population(p.lv)));
out.push(`hăng/1 lần: dân số x${(popOf('hang') / popOf('mot')).toFixed(2)}; hăng/4 lần: x${(popOf('hang') / popOf('bon')).toFixed(2)}`);
const pc = (w: number, l: number) => (w + l ? Math.round((100 * w) / (w + l)) : 0);
out.push(`trận người chơi ${fights}, đánh yêu động ${raidsYd}`);
out.push('thắng (cả công và thủ): ' + S.GIOI.map((g: string) => `${g} ${pc(wins[g].w, wins[g].l)}%`).join(', '));
out.push('thắng khi đi đánh:      ' + S.GIOI.map((g: string) => `${g} ${pc(atkWins[g].w, atkWins[g].n - atkWins[g].w)}%`).join(', '));
for (const g of S.GIOI) {
  const ps = players.filter((p) => p.gioi === g);
  const nArmy = ps.map((p) => Object.values(p.army).reduce((a: number, b: any) => a + b, 0));
  out.push(`${g.padEnd(9)} dân số ${med(ps.map((p) => S.population(p.lv)))}  CĐ10 ngày ${med(ps.map((p) => p.cd10 ?? 99)).toFixed(1)}  đệ tử ${med(nArmy)}  tường ${med(ps.map((p) => p.lv.ho_son))}  thủ ${Math.round(med(ps.map((p) => S.armyDef({ army: p.army, gioi: p.gioi, research: p.rs.thu, wall: p.lv.ho_son }, false))))}  công ${Math.round(med(ps.map((p) => S.armyAtk({ army: p.army, gioi: p.gioi, research: p.rs.cong }))))}`);
}
console.log(out.join('\n'));

// Trận cân tài nguyên: hai động phủ cùng số tài nguyên bỏ vào đệ tử (tỉ lệ công/thủ, tường, nghiên cứu ngẫu nhiên như nhau),
// đánh nhau 20.000 lần mỗi cặp giới. Đây là số dùng để xét "lệch không quá 55/45" (số ở trên bị lệch vì người ta né chỗ thủ mạnh).
function armyFor(g: Gioi, budget: number, congShare: number) {
  const a: any = {};
  for (const [role, share] of [['cong', congShare], ['thu', 1 - congShare]] as [string, number][]) {
    const id = S.unitOf(g, role), u = S.UNITS[id];
    a[id] = Math.floor((budget * share) / (u.cost.ls + u.cost.lt + u.cost.kt));
  }
  return a;
}
const fair: Record<string, { w: number; n: number }> = { thien: { w: 0, n: 0 }, hong_tran: { w: 0, n: 0 }, u_minh: { w: 0, n: 0 } };
for (const ga of S.GIOI as Gioi[]) for (const gd of S.GIOI as Gioi[]) {
  if (ga === gd) continue;
  for (let k = 0; k < 20000; k++) {
    const budget = 20000 + rnd() * 80000, wall = Math.floor(rnd() * 11), rs = Math.floor(rnd() * 6);
    // bên thủ chỉ có phần thủ và phần công ở nhà; bên đánh mang phần công đi
    const shA = 0.4 + rnd() * 0.4, shD = 0.4 + rnd() * 0.4;
    const A = armyFor(ga, budget * (0.8 + rnd() * 0.4), shA), D = armyFor(gd, budget * (0.8 + rnd() * 0.4), shD);
    const send: any = { [S.unitOf(ga, 'cong')]: A[S.unitOf(ga, 'cong')] };
    const r = S.battle({ army: send, gioi: ga, research: rs }, { army: D, gioi: gd, research: rs, wall }, rnd() < 0.29, 'cuop');
    fair[ga].n++; fair[gd].n++;
    if (r.win) fair[ga].w++; else fair[gd].w++;
  }
}
console.log('trận cân tài nguyên (thắng cả công và thủ): ' + S.GIOI.map((g: string) => `${g} ${Math.round((100 * fair[g].w) / fair[g].n)}%`).join(', '));
