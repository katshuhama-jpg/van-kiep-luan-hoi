/**
 * 4.4.0: chạy thử cả đường Hồng Hoang không cần giao diện: chứng đạo → khe tím → Trảm Tam Thi → Thánh Nhân → xích → Khai Thiên → kết.
 * Chạy: npx tsx scripts/smoke-hong-hoang.ts
 */
import { checkProgress, chungDao, emptyMeta, makeCtx, newCharacter, pendingOf, resolveChoice, yearTick } from '../lib/game/engine';
import { HG_END_ID, HG_GATE_ID, finishHgFight, vanThienLoi } from '../lib/game/hongHoang';
import { needFor } from '../lib/game/helpers';
import { endingOf, alsoEndings } from '../lib/game/endings';
import { realmLabel } from '../lib/game/data';
import { monstersFor } from '../lib/game/combat';
import type { Character, Fx, PendingEvent } from '../lib/game/types';

const out: Fx[] = [];
function base(): Character {
  const c = newCharacter(emptyMeta());
  c.path = 'kiem';
  c.realm = 11;
  c.layer = 3;
  c.cosmos = 'tien';
  c.ascended = true;
  c.age = 900;
  c.lifespan = 1050;
  c.partner = 'Lâm Uyển';
  c.stats.sucKhoe = 100;
  return c;
}
const ok = (b: unknown, m: string) => {
  if (!b) throw new Error('FAIL: ' + m);
  console.log('ok -', m);
};
const ctxOf = (c: Character) => makeCtx(c, out);
function pick(c: Character, p: PendingEvent | null, i: number): PendingEvent | null {
  ok(!!p, `có thẻ ${p?.id}`);
  console.log('   ', p!.title, '→', p!.choices[i]?.label);
  return resolveChoice(c, p!, i, ctxOf(c));
}
function fill(c: Character) {
  c.cultivation = needFor(c);
  c.breakDelay = 0;
  return checkProgress(c, ctxOf(c));
}
function win(c: Character) {
  const f = c.hgFight!;
  ok(!!f, `mở trận ${f?.kind} ${f?.id}`);
  c.hgFight = null;
  const r = finishHgFight(c, f, 'win', ctxOf(c));
  console.log('   ', r.text.slice(0, 110));
  return r;
}
// 1. chứng đạo
let c = base();
const t = chungDao(c, ctxOf(c));
ok(!c.dead && c.hgGate === 1, 'chứng đạo chưa chết, khe tím mở: ' + t.slice(0, 60));
// tải lại trang: yearTick trả lại khe tím
c.age += 1;
ok(yearTick(c, ctxOf(c))?.id === HG_GATE_ID, 'tải lại thì khe tím vẫn chờ');
// tọa hóa như cũ
const c2 = structuredClone(c);
pick(c2, pendingOf(c2, HG_GATE_ID), 0);
ok(c2.dead && c2.endTag === 'chung_dao' && endingOf(c2).id === 'chung_dao', 'chọn tọa hóa: kết cục chứng đạo cũ');
// bước qua cùng người thân
let p = pendingOf(c, HG_GATE_ID);
ok(p!.choices.length === 3, 'có lựa chọn ẩn kéo người thân');
pick(c, p, 2);
ok(c.cosmos === 'hg' && c.realm === 12 && c.hong?.ban === 'Lâm Uyển', 'vào Hồng Hoang: ' + realmLabel(c.realm, c.layer, c.cosmos));
ok(monstersFor(c, null).length === 6, 'quái Chuẩn Thánh: ' + monstersFor(c, null).map((m) => m.name).join(', '));
// 2. Trảm Tam Thi
for (const mode of [0, 1, 0]) {
  p = fill(c);
  pick(c, p, mode);
  win(c);
}
ok(c.realm === 13 && c.inventory.includes('hg_lap_giao_y') && c.inventory.includes('hg_tram_thi_ho_lo') && c.inventory.includes('hg_tam_thi_bao'), 'chém đủ ba thi, lên Thánh Nhân, có ba món đồ');
// 3. Thánh Nhân: chưa đủ điều kiện
c.layer = 3;
p = fill(c);
ok(p?.id === '__hg_tn__', 'Thánh Nhân đầy mà thiếu đồ đệ, công đức: thẻ chặn: ' + p?.text.slice(0, 80));
pick(c, p, 0);
c.hong!.deTu = 3;
c.hong!.cd = 80;
c.hong!.pt = 2;
p = fill(c);
ok(p?.id === '__break__' || /đột phá/i.test(p?.title ?? ''), 'đủ điều kiện: thẻ đột phá có lôi kiếp: ' + p?.title);
// lôi kiếp do giao diện chơi; giả như thắng
for (let i = 0; i < 30 && c.realm === 13; i++) {
  c.cultivation = needFor(c);
  c.breakDelay = 0;
  c.stats.sucKhoe = 100;
  c.kiepBonus = 0.9;
  resolveChoice(c, fill(c)!, 1, ctxOf(c));
}
ok(c.realm === 14, 'lên Hỗn Nguyên Đại La: ' + realmLabel(c.realm, c.layer, c.cosmos));
// 4. ba xích
for (let k = 0; k < 3; k++) {
  p = fill(c);
  pick(c, p, 0);
}
ok(c.realm === 15 && c.inventory.includes('hg_tao_hoa_diep') && c.inventory.includes('hg_vo_danh_y'), 'chặt ba xích, lên Khai Thiên');
// 5. Vấn Thiên
c.layer = 3;
p = fill(c);
ok(p?.id === '__hg_van_thien__', 'Khai Thiên đầy: thẻ Vấn Thiên');
console.log('   ', vanThienLoi(c, 7, ctxOf(c)));
const r = win(c);
ok(r.next === HG_END_ID, 'thắng Thiên Đạo mở thẻ kết');
const end = pendingOf(c, HG_END_ID)!;
ok(end.choices.length === 3, 'có kết ẩn về làm người (có đạo lữ)');
const c3 = structuredClone(c);
pick(c3, end, 0);
ok(c3.dead && endingOf(c3).id === 'hg_khai_thien', 'Khai Thiên Lập Địa; ghi thêm: ' + alsoEndings(c3).join(', '));
// 6. năm tháng ở Hồng Hoang: sự kiện ngẫu nhiên không lỗi
const seen = new Map<string, number>();
for (const realm of [12, 13, 14, 15]) {
  for (let run = 0; run < 15; run++) {
    const d = base();
    chungDao(d, ctxOf(d));
    resolveChoice(d, pendingOf(d, HG_GATE_ID)!, 1, ctxOf(d));
    d.realm = realm;
    d.hong!.deTu = 2;
    d.hong!.deTuMax = 2;
    for (let y = 0; y < 300 && !d.dead; y++) {
      d.age = Math.floor(d.age) + 1;
      d.stats.sucKhoe = Math.max(d.stats.sucKhoe, 60);
      const q = yearTick(d, ctxOf(d));
      if (q) {
        seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
        const i = Math.floor(Math.random() * q.choices.length);
        resolveChoice(d, q, i, ctxOf(d));
        if (d.hgFight) {
          const f = d.hgFight;
          d.hgFight = null;
          finishHgFight(d, f, Math.random() < 0.6 ? 'win' : 'lose', ctxOf(d));
        }
      }
    }
  }
}
console.log('sự kiện đã gặp:', [...seen.entries()].filter(([k]) => k.startsWith('hg_') || k.startsWith('__hg')).map(([k, n]) => `${k}:${n}`).join(' '));
const other = [...seen.keys()].filter((k) => !k.startsWith('hg_') && !k.startsWith('__'));
console.log('sự kiện khác lọt vào Hồng Hoang:', other.join(', ') || 'không');
