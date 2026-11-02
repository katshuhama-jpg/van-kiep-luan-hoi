/**
 * 4.2.0: mô phỏng tàn quyển theo từng bộ - một kiếm tu nhặt tàn quyển suốt một kiếp rồi nâng theo các cách khác nhau.
 * Đo: tầng các bộ cuối kiếp và lực đánh trung bình 30 hiệp (có tính tâm pháp) cho từng cách nâng.
 * Chạy: npx tsx scripts/sim-tan-quyen.ts [số kiếp] [số lần rơi mỗi kiếp]
 */
import { emptyMeta, newCharacter } from '../lib/game/engine';
import { hit } from '../lib/game/combat';
import { act, cpOf, cpStats, dropTq, loadoutOf, newSide, owned, skipTurn, swapTq, takeHit, tqOf, upgrade, upgradeBlock, type Bien, type TqSrc } from '../lib/game/congPhap';
import { REALMS } from '../lib/game/data';
import type { Character, Element, PathId } from '../lib/game/types';
export {};
const N = Number(process.argv[2] ?? 300);
const DROPS = Number(process.argv[3] ?? 40);
const rnd = Math.random;
const ELS: Element[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'];
type Way = 'don_1' | 'deu_tay' | 'bua' | 'tam_truoc';
const NAME: Record<Way, string> = { don_1: 'Dồn chiêu mạnh nhất', deu_tay: 'Đều tay', bua: 'Nâng bừa', tam_truoc: 'Tâm pháp trước' };
const PATHS: PathId[] = ['kiem', 'dan', 'tran', 'phat', 'ma', 'yeu'];
const FOE_HP = Number(process.env.FOE_HP ?? 2400);
const FOE_ATK = Number(process.env.FOE_ATK ?? 190);
const BUDGET = Number(process.env.BUDGET ?? 0.6); // phần tu vi một cảnh giới chịu bỏ ra cho công pháp

function fresh(path: PathId): Character {
  const c = newCharacter(emptyMeta());
  c.path = path;
  c.realm = 4;
  c.age = 120;
  loadoutOf(c);
  for (const o of c.cp!.own) o.tang = 3;
  return c;
}
/** Lực đánh: thắng/thua 300 trận 8 hiệp với một đối thủ cố định cùng cảnh giới (đánh như /choi) */
function power(c: Character): number {
  const f = cpStats(c, { hp: 1000, atk: 100, def: 40 });
  const lo = loadoutOf(c);
  let win = 0;
  for (let k = 0; k < 300; k++) {
    const P = newSide();
    const M = newSide();
    let p = f.hp, m = FOE_HP;
    for (let t = 0; t < 8 && p > 0 && m > 0; t++) {
      if (!skipTurn(P)) {
        const r = act(lo, P, M, f.atk, 40, p, f.hp, rnd, 0.15, hit, null);
        m -= r.dmg + r.dot;
        p = Math.min(f.hp, p + r.heal - r.self);
      }
      if (m <= 0) break;
      if (!skipTurn(M)) {
        const k2 = takeHit(lo, P, hit(FOE_ATK, f.def, rnd).dmg, rnd);
        p -= k2.dmg;
        m -= k2.reflect;
      }
    }
    if (m <= 0 || (p > 0 && m / FOE_HP < p / f.hp)) win++;
  }
  return win / 300;
}
function spend(c: Character, way: Way, bien: Bien | 'mix') {
  c.cultivation = Math.round(BUDGET * REALMS[c.realm].need);
  const t = (id: string) => owned(c, id)!.tang;
  for (let guard = 0; guard < 200; guard++) {
    for (const o of c.cp!.own) o.exp = 100;
    const eq = c.cp!.eq.filter(Boolean);
    if (way !== 'bua')
      for (const o of c.cp!.own) {
        if (eq.includes(o.id) || tqOf(c, o.id) < 3) continue;
        const need = eq.find((id) => upgradeBlock(c, id) === 'tq' && cpOf(id)!.path === cpOf(o.id)!.path);
        if (need) swapTq(c, o.id, need);
      }
    const ok = (id: string) => [null, 'bien'].includes(upgradeBlock(c, id));
    const cand = (way === 'bua' ? c.cp!.own.map((o) => o.id) : eq).filter(ok);
    if (!cand.length) return;
    let pick = cand[0];
    if (way === 'don_1') pick = cand.filter((x) => x !== eq[0]).sort((a, b) => t(b) - t(a))[0] ?? eq[0];
    if (way === 'deu_tay') pick = cand.sort((a, b) => t(a) - t(b))[0];
    if (way === 'bua') pick = cand[Math.floor(rnd() * cand.length)];
    if (way === 'tam_truoc') pick = cand.includes(eq[0]) ? eq[0] : cand.sort((a, b) => t(b) - t(a))[0];
    const b: Bien = bien === 'mix' ? (rnd() < 0.5 ? 'cuong' : 'nhu') : bien;
    if (!upgrade(c, pick, false, b)) return;
  }
}

console.log(`Nguyên Anh, mỗi kiếp ${DROPS} lần rơi, bỏ ${BUDGET * 100}% tu vi một cảnh giới cho công pháp. Số là tỉ lệ thắng đối thủ cố định.`);
for (const path of PATHS) {
  const acc: Record<string, number> = {};
  let base = 0;
  for (let i = 0; i < N; i++) {
    const c0 = fresh(path);
    if (i < 20) base += power(c0);
    for (let k = 0; k < DROPS; k++) {
      const x = rnd();
      const src: TqSrc = x < 0.7 ? { kind: 'quai', el: ELS[Math.floor(rnd() * 5)] } : x < 0.85 ? { kind: 'quai', el: ELS[Math.floor(rnd() * 5)], strong: true } : { kind: 'nguoi', path: rnd() < 0.3 ? path : 'ma', el: ELS[Math.floor(rnd() * 5)] };
      dropTq(c0, src, rnd);
    }
    for (const w of Object.keys(NAME) as Way[])
      for (const b of ['cuong', 'nhu'] as Bien[]) {
        const c = JSON.parse(JSON.stringify(c0)) as Character;
        spend(c, w, b);
        const k = `${NAME[w]} + ${b === 'cuong' ? 'Cương' : 'Nhu'}`;
        acc[k] = (acc[k] ?? 0) + power(c);
      }
  }
  const rows = Object.entries(acc).sort((a, b) => b[1] - a[1]);
  console.log(`\n${path} (chưa nâng ${((base / 20) * 100).toFixed(0)}%): ` + rows.map(([k, v]) => `${k} ${((v / N) * 100).toFixed(0)}%`).join(' | '));
}
