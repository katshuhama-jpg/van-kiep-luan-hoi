/**
 * 4.1.0: mô phỏng Hệ Thống - số nhiệm vụ làm xong/thất bại mỗi kiếp, cấp Hệ Thống cuối kiếp, và so cảnh giới đạt được với người không có.
 * Chạy: npx tsx scripts/sim-he-thong.ts [số kiếp]
 */
export {};
const root = process.cwd();
const E = require(root + '/lib/game/engine');
const H = require(root + '/lib/game/heThong');
const N = Number(process.argv[2] ?? 1000);
const rnd = Math.random;
function life(bind: boolean) {
  const c = E.newCharacter({ ...E.emptyMeta(), lives: 10 });
  c.focus = 'tu_luyen';
  const ctx = E.makeCtx(c, []);
  let fail = 0;
  const log = ctx.log;
  ctx.log = (t: string, tone: string) => { if (/Nhiệm vụ thất bại/.test(t)) fail++; return log(t, tone); };
  let g = 0, maxR = 0;
  while (!c.dead && g++ < 400 && !c.cosmos) {
    c.age += 1;
    if (bind && c.age === 12) { c.arcs = { ...(c.arcs ?? {}), he_thong: { s: 1, at: 12 } }; H.htBind(c); }
    // đổi trọng tâm theo nhiệm vụ như người chơi tinh ý
    const q = c.ht?.q?.k;
    c.focus = q === 'tram_yeu' && c.age >= 10 ? 'tru_yeu' : q === 'tich_tien' ? 'kiem_tien' : q === 'dao_lu' && c.age >= 16 ? 'ket_duyen' : 'tu_luyen';
    // trừ yêu trong /choi chạy ngoài yearTick: một năm trảm khoảng 12 con
    if (c.focus === 'tru_yeu') c.kills = { ...(c.kills ?? {}), sim: (c.kills?.sim ?? 0) + 12 };
    let p = E.yearTick(c, ctx); let k = 0;
    while (p && !c.dead && k++ < 10) p = E.resolveChoice(c, p, Math.floor(rnd() * p.choices.length), ctx);
    if (!c.dead) { let q2 = E.checkProgress(c, ctx); let j = 0; while (q2 && !c.dead && j++ < 10) q2 = E.resolveChoice(c, q2, Math.floor(rnd() * q2.choices.length), ctx); }
    maxR = Math.max(maxR, c.realm);
  }
  return { done: c.ht?.done ?? 0, fail, lv: c.ht?.lv ?? 0, maxR, age: c.age };
}
for (const bind of [false, true]) {
  let done = 0, fail = 0, lv = 0, r4 = 0, r6 = 0, age = 0;
  for (let i = 0; i < N; i++) { const r = life(bind); done += r.done; fail += r.fail; lv += r.lv; age += r.age; if (r.maxR >= 4) r4++; if (r.maxR >= 6) r6++; }
  console.log(`${bind ? 'Có Hệ Thống' : 'Không có  '}: xong ${(done / N).toFixed(1)}, hỏng ${(fail / N).toFixed(1)} nhiệm vụ/kiếp, cấp cuối ${(lv / N).toFixed(1)}, tuổi chết ${(age / N).toFixed(0)}, tới Nguyên Anh ${((r4 / N) * 100).toFixed(1)}%, Luyện Hư ${((r6 / N) * 100).toFixed(1)}%`);
}
