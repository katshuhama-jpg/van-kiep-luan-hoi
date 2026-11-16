/**
 * Đo huyệt Khí Hải (lên Nguyên Anh khi đang ở tông môn) theo từng con đường tu.
 * FAST=1: nhân vật tu nhanh như người chơi lâu năm (linh căn x2,2, ngộ tính +40, Ma tôn chuyển thế).
 * JOIN=1: luôn nhận lời mời vào tông (đo trường hợp tốt nhất). Mặc định: chọn bừa.
 * Chạy: npx tsx scripts/sim-khi-hai.ts [số kiếp]
 */
import { emptyMeta, makeCtx, newCharacter, resolveChoice, yearTick, checkProgress } from '../lib/game/engine';
import type { Character, Fx, PendingEvent } from '../lib/game/types';
import { forcedClock } from '../lib/game/helpers';

const INVITES = new Set(['tuyen_de_tu', 'bai_pho_da', 'bai_kiem_coc', 'bai_van_doc', 'bai_yeu_than', 'hh_bai_su', 'an_nhan_tien_kiep', 'tong_mon_tim_den']);
const JOIN = !!process.env.JOIN;
const N = Number(process.argv[2] ?? 3000);
let clock = 0;
forcedClock.now = () => clock;

type Row = { lives: number; na: number; naSect: number; sawInvite: number; ageNA: number; agePath: number; pathed: number };
const by: Record<string, Row> = {};
const row = (k: string) => (by[k] ??= { lives: 0, na: 0, naSect: 0, sawInvite: 0, ageNA: 0, agePath: 0, pathed: 0 });

function pick(c: Character, p: PendingEvent, seen: { v: boolean }): number {
  if (INVITES.has(p.id) && !c.sect && c.realm < 4) {
    seen.v = true;
    if (JOIN) return 0;
  }
  return Math.floor(Math.random() * p.choices.length);
}

for (let i = 0; i < N; i++) {
  const meta = { ...emptyMeta(), lives: 10 };
  const c = newCharacter(meta);
  c.focus = 'tu_luyen' as Character['focus'];
  if (process.env.FAST) { c.linhCanMul = 2.2; c.stats.ngoTinh += 40; c.maTon = true; }
  const out: Fx[] = [];
  const ctx = makeCtx(c, out);
  const seen = { v: false };
  let naAge = -1, naSect = false, pathAge = -1, pathAtNA = '';
  let g = 0;
  while (!c.dead && g++ < 400 && !c.cosmos) {
    c.age += 1;
    clock += 20000;
    const before = c.realm;
    let p = yearTick(c, ctx);
    let k = 0;
    while (p && !c.dead && k++ < 10) p = resolveChoice(c, p, pick(c, p, seen), ctx);
    if (!c.dead) {
      let q = checkProgress(c, ctx);
      let j = 0;
      while (q && !c.dead && j++ < 10) q = resolveChoice(c, q, pick(c, q, seen), ctx);
    }
    if (c.path && pathAge < 0) pathAge = c.age;
    if (naAge < 0 && c.realm >= 4) {
      naAge = c.age;
      pathAtNA = c.path ?? 'none';
      naSect = !!c.qf?.naSect;
      void before;
    }
  }
  const key = pathAtNA || c.path || 'none';
  const r = row(key);
  r.lives++;
  if (pathAge >= 0) { r.pathed++; r.agePath += pathAge; }
  if (naAge >= 0) {
    r.na++;
    r.ageNA += naAge;
    if (naSect) r.naSect++;
    if (seen.v) r.sawInvite++;
  }
}
console.log(`${JOIN ? 'LUÔN NHẬN LỜI MỜI' : 'CHỌN BỪA'} · ${N} kiếp`);
console.log('đường     kiếp  lên NA  NA trong tông  gặp lời mời trước NA  tuổi chọn đường  tuổi lên NA');
for (const [k, r] of Object.entries(by).sort((a, b) => b[1].lives - a[1].lives)) {
  const pc = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(0) + '%' : '-');
  console.log(
    `${k.padEnd(9)} ${String(r.lives).padStart(4)}  ${String(r.na).padStart(6)}  ${pc(r.naSect, r.na).padStart(13)}  ${pc(r.sawInvite, r.na).padStart(20)}  ${(r.agePath / Math.max(1, r.pathed)).toFixed(0).padStart(15)}  ${(r.ageNA / Math.max(1, r.na)).toFixed(0).padStart(11)}`,
  );
}
