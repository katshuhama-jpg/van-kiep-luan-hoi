/**
 * Thử cốt truyện đêm 20/11 (Ngày 35, ct_20261120_*): ép rnd đi qua mọi lựa chọn của mọi bước.
 * - Người chưa mở mảnh Thiên thư liên quan thì không gặp bước đầu.
 * - Mỗi lựa chọn: chạy với rnd = 0 (xấu nhất) và 0,999 (tốt nhất), chữ trả về không rỗng, không có "undefined"; chỉ nhánh đã khai báo mới được chết.
 * - Bước sau chỉ mở đúng sau số năm chờ.
 * - Cảnh báo thọ sắp cạn (góp ý treo máy): nhắc đúng một lần cho mỗi mức thọ.
 * Chạy: npx tsx scripts/thu-ct-20261120.ts
 */
export {};
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const { EVENTS } = require(root + '/lib/game/events');
const ev = (id: string) => {
  const e = EVENTS.find((x: any) => x.id === id);
  if (!e) throw new Error('thiếu sự kiện ' + id);
  return e;
};
const quiet = { fx() {}, log() {} };
let fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fail++;
    console.log('LỖI:', msg);
  }
};

/** điều kiện xuất hiện như engine.eligible (phần cõi, cảnh giới, when) */
function canSee(c: any, e: any) {
  if (c.cosmos) {
    if (!e.cosmos || (e.cosmos !== 'both' && e.cosmos !== c.cosmos)) return false;
  } else if (e.cosmos) return false;
  if (e.minAge !== undefined && c.age < e.minAge) return false;
  if (e.maxAge !== undefined && c.age > e.maxAge) return false;
  if (e.minRealm !== undefined && c.realm < e.minRealm) return false;
  if (e.maxRealm !== undefined && c.realm > e.maxRealm) return false;
  return !e.when || e.when(c);
}

interface Spec {
  key: string;
  steps: { id: string; wait: number }[];
  setup: (c: any) => void;
  noLore?: (c: any) => void; // bỏ điều kiện Thiên thư để kiểm là bị ẩn
  deaths: string[]; // 'id#chỉ số lựa chọn' được phép chết
}

const SPECS: Spec[] = [
  { key: 'ct20261120_1', steps: [{ id: 'ct_20261120_1', wait: 0 }, { id: 'ct_20261120_1b', wait: 3 }], setup: (c) => { c.age = 30; c.realm = 2; c.loreIds = ['chuong']; }, noLore: (c) => { c.loreIds = []; }, deaths: [] },
  { key: 'ct20261120_2', steps: [{ id: 'ct_20261120_2', wait: 0 }, { id: 'ct_20261120_2b', wait: 2 }], setup: (c) => { c.age = 60; c.realm = 3; c.loreIds = ['chuong', 'kim_dan']; c.linhThach = 500; c.pills.truc_co = 1; }, noLore: (c) => { c.loreIds = ['chuong']; }, deaths: [] },
  { key: 'ct20261120_3', steps: [{ id: 'ct_20261120_3', wait: 0 }, { id: 'ct_20261120_3b', wait: 4 }, { id: 'ct_20261120_3c', wait: 6 }], setup: (c) => { c.age = 500; c.realm = 8; c.cosmos = 'ma'; c.lifespan = 900; c.linhThach = 5000; }, deaths: ['ct_20261120_3c#3'] },
  { key: 'ct20261120_4', steps: [{ id: 'ct_20261120_4', wait: 0 }, { id: 'ct_20261120_4b', wait: 5 }], setup: (c) => { c.age = 500; c.realm = 8; c.cosmos = 'hu'; c.tt3 = 1; c.tt3Nhanh = 'dap'; }, noLore: (c) => { c.tt3 = undefined; }, deaths: [] },
  { key: 'ct20261120_5', steps: [{ id: 'ct_20261120_5', wait: 0 }, { id: 'ct_20261120_5b', wait: 20 }], setup: (c) => { c.age = 3000; c.realm = 12; c.cosmos = 'hg'; c.lifespan = 9000; c.hong = { from: 'tien', cd: 0, deTu: 2 }; c.partner = 'Lâm Nguyệt'; }, deaths: [] },
  { key: 'ct20261120_6', steps: [{ id: 'ct_20261120_6', wait: 0 }, { id: 'ct_20261120_6b', wait: 6 }], setup: (c) => { c.age = 500; c.realm = 8; c.cosmos = 'tien'; c.loreIds = ['chien_thu']; }, noLore: (c) => { c.loreIds = []; }, deaths: [] },
];

function fresh(spec: Spec) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 5 });
  c.lifespan = Math.max(c.lifespan, 900);
  c.stats.sucKhoe = 80;
  spec.setup(c);
  return c;
}

let runs = 0;
for (const spec of SPECS) {
  // bị ẩn khi chưa mở Thiên thư
  if (spec.noLore) {
    const c = fresh(spec);
    spec.noLore(c);
    ok(!canSee(c, ev(spec.steps[0].id)), `${spec.steps[0].id} hiện cho người chưa mở quyển`);
  }
  // đi qua mọi đường: mỗi bước thử mọi lựa chọn với 2 mức rnd, rồi đi tiếp bằng lựa chọn đầu tiên đưa sang bước sau
  const walk = (c: any, si: number, path: string) => {
    if (si >= spec.steps.length) return;
    const st = spec.steps[si];
    const e = ev(st.id);
    if (si > 0) {
      c.age += st.wait - 1;
      ok(!canSee(c, e), `${st.id} mở sớm hơn ${st.wait} năm (${path})`);
      c.age += 1;
    }
    ok(canSee(c, e), `${st.id} không mở được (${path})`);
    const text = e.text(c);
    ok(!!text && !/undefined|NaN/.test(text), `${st.id} chữ dẫn lỗi`);
    const n = e.choices(c, 1).length;
    ok(n === 4, `${st.id} có ${n} lựa chọn, cần 4`);
    let next: any = null;
    for (let i = 0; i < n; i++) {
      for (const r of [0, 0.999]) {
        const ch = structuredClone(c);
        const choice = e.choices(ch, 1)[i];
        if (choice.off) continue;
        const out = choice.run(ch, { ...quiet, rnd: () => r });
        runs++;
        ok(typeof out === 'string' && out.length > 10 && !/undefined|NaN/.test(out), `${st.id}#${i} rnd=${r} chữ lỗi: ${out}`);
        if (ch.dead) ok(spec.deaths.includes(`${st.id}#${i}`), `${st.id}#${i} chết ngoài nhánh cho phép: ${ch.cause}`);
        ok(ch.lifespan > ch.age || ch.dead, `${st.id}#${i} thọ xuống dưới tuổi`);
        const s = ch.arcs?.[spec.key]?.s ?? 0;
        if (!ch.dead && s === si + 1 && !next && r > 0.5) next = ch;
      }
    }
    if (si + 1 < spec.steps.length) {
      ok(!!next, `${st.id}: không lựa chọn nào dẫn sang bước sau`);
      if (next) walk(next, si + 1, path + '>' + st.id);
    }
  };
  walk(fresh(spec), 0, '');
}

// Cảnh báo thọ sắp cạn: thọ 100, tuổi 90 (5% của 100 = 5 năm, sàn 5) -> nhắc ở tuổi 95, chỉ một lần
{
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 5 });
  c.realm = 1;
  c.lifespan = 100;
  c.lifeExtra = 0;
  c.lifeMul = 1;
  c.stats.sucKhoe = 90;
  c.stats.tamMa = 0;
  c.focus = 'du_ngoan';
  const logs: string[] = [];
  const ctx = { fx() {}, log: (t: string) => logs.push(t), rnd: () => 0.5 };
  let warnAge = -1;
  let warns = 0;
  for (let a = 90; a < 99 && !c.dead; a++) {
    c.age = a;
    c.lifespan = 100;
    const t0 = c.thoWarn;
    E.yearTick(c, ctx);
    c.pending = null;
    if (c.thoWarn !== t0) {
      warns++;
      if (warnAge < 0) warnAge = a;
    }
  }
  ok(warns === 1, `cảnh báo thọ nhắc ${warns} lần, cần 1`);
  ok(warnAge === 95, `cảnh báo thọ ở tuổi ${warnAge}, cần 95`);
  ok(logs.some((l) => l.includes('Thọ nguyên chỉ còn') || l.includes('years of lifespan remain')), 'không có dòng cảnh báo thọ');
}

console.log(`${runs} lần chạy lựa chọn, ${fail ? fail + ' lỗi' : 'không lỗi'}`);
process.exit(fail ? 1 : 0);
