/**
 * 4.4.0: cân trận Hồng Hoang bằng nhân vật thật (save Đại La, lấy từ máy chủ ra file JSON, đã bỏ log, tên).
 * Chạy: npx tsx scripts/sim-hong-hoang.ts <chars.json>
 * Mỗi trận mô phỏng như khung trận chặn đường: người chơi ra chiêu công pháp, quái đánh thường, tối đa HG_TURNS hiệp.
 */
import fs from 'fs';
import { MONSTERS, hit, monsterStats, playerStats, type Fighter } from '../lib/game/combat';
import { act, loadoutOf, newSide, takeHit } from '../lib/game/congPhap';
import { gearFx } from '../lib/game/data';
import { HG_TURNS } from '../lib/game/hongHoang';
import { hgFoe } from '../lib/game/hongHoangFight';
import type { Character, HhFight } from '../lib/game/types';

const TIER: Record<number, string[]> = {
  12: ['hg_ngu_sac_kiem', 'hg_tam_thi_bao', 'hg_tram_thi_ho_lo'],
  13: ['hg_thanh_binh_kiem', 'hg_lap_giao_y', 'hg_phong_than_bang'],
  14: ['hg_doan_xich_kiem', 'hg_vo_danh_y', 'hg_nhan_qua_kinh'],
  15: ['hg_ban_co_phu', 'hg_hon_don_chung', 'hg_tao_hoa_diep'],
};
function asHg(c0: Character, realm: number, layer: number, gearTier: number | null, opts: { dx?: boolean } = {}): Character {
  const c = structuredClone(c0) as Character;
  c.realm = realm;
  c.layer = layer;
  c.cultivation = 0;
  c.hong = { from: (c0.cosmos as 'tien') ?? 'tien', cd: 0, deTu: 4 };
  c.cosmos = 'hg';
  c.inventory = c.inventory ?? [];
  c.equipped = { ...(c.equipped ?? {}) };
  if (gearTier) {
    const [w, a, p] = TIER[gearTier];
    c.equipped.vu_khi = opts.dx ? 'hg_doan_xich_kiem' : w;
    c.equipped.ao = a;
    c.equipped.phu_kien = p;
  }
  return c;
}
function fight(c: Character, ps: Fighter, ms: Fighter): { win: boolean; draw: boolean; hpLeft: number } {
  const lo = loadoutOf(c);
  const fsP = newSide();
  const fsM = newSide();
  let pHp = ps.hp;
  let mHp = ms.hp;
  const crit = 0.15 + gearFx(c.equipped).crit / 100;
  for (let t = 0; t < HG_TURNS; t++) {
    const r = act(lo, fsP, fsM, ps.atk, ms.def, pHp, ps.hp, Math.random, crit, hit, c);
    mHp -= r.dmg + r.dot;
    pHp = Math.min(ps.hp, pHp + r.heal - r.self);
    if (mHp <= 0) return { win: true, draw: false, hpLeft: pHp / ps.hp };
    const h = hit(ms.atk, ps.def, Math.random);
    pHp -= takeHit(lo, fsP, h.dmg, Math.random).dmg;
    if (pHp <= 0) return { win: false, draw: false, hpLeft: 0 };
  }
  return { win: false, draw: true, hpLeft: pHp / ps.hp };
}
function rate(chars: Character[], mk: (c: Character) => { ps: Fighter; ms: Fighter; c: Character }, n = 200) {
  const rs = chars.map((c0) => {
    let w = 0;
    for (let i = 0; i < n; i++) {
      const { ps, ms, c } = mk(c0);
      if (fight(c, ps, ms).win) w++;
    }
    return w / n;
  });
  rs.sort((a, b) => a - b);
  const pct = (x: number) => Math.round(x * 100);
  return `yếu nhất ${pct(rs[0])}% · giữa ${pct(rs[Math.floor(rs.length / 2)])}% · mạnh nhất ${pct(rs[rs.length - 1])}%`;
}
const all = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) as Character[];
const top = all.filter((c) => c.realm === 11);
console.log('nhân vật Đại La:', top.length);
const mon = (id: string, realm: number, layer: number, tier: number | null) => rate(top, (c0) => {
  const c = asHg(c0, realm, layer, tier);
  const m = MONSTERS.find((x) => x.id === id)!;
  return { c, ps: playerStats(c), ms: monsterStats(m, m.lv, c) };
});
const big = (f: HhFight, realm: number, layer: number, tier: number | null, opts: { dx?: boolean } = {}) => rate(top, (c0) => {
  const c = asHg(c0, realm, layer, tier, opts);
  const r = hgFoe(c, f);
  return { c, ps: r.ps, ms: r.ms };
});
console.log('--- Chuẩn Thánh tầng 1, đồ tiên giới cũ');
console.log('Quỳ Ngưu lv42', mon('hg_quy_nguu', 12, 1, null));
console.log('Bạch Trạch lv45', mon('hg_bach_trach', 12, 1, null));
console.log('Thiện thi chém', big({ kind: 'thi', id: 'thien', mode: 'tram' }, 12, 1, null));
console.log('Thiện thi thu', big({ kind: 'thi', id: 'thien', mode: 'thu' }, 12, 1, null));
console.log('Cộng Công', big({ kind: 'boss', id: 'hg_cong_cong' }, 12, 1, null));
console.log('Cộng Công (tầng 3, đồ CT)', big({ kind: 'boss', id: 'hg_cong_cong' }, 12, 3, 12));
console.log('--- Thánh Nhân tầng 1, đồ CT');
console.log('Côn Ngư lv45', mon('hg_con_ngu', 13, 1, 12));
console.log('Đạo Đồng lv48', mon('hg_dao_dong', 13, 1, 12));
console.log('Quảng Thành Tử', big({ kind: 'boss', id: 'hg_quang_thanh' }, 13, 1, 12));
console.log('Côn Bằng (tầng 3)', big({ kind: 'boss', id: 'hg_con_bang' }, 13, 3, 12));
console.log('Đồ đệ phản sư', big({ kind: 'boss', id: 'hg_phan_do' }, 13, 2, 12));
console.log('--- Hỗn Nguyên tầng 1, đồ TN');
console.log('Đào Ngột lv49', mon('hg_dao_ngot', 14, 1, 13));
console.log('Hư Không Trùng lv51', mon('hg_hu_khong_trung', 14, 1, 13));
console.log('Sứ giả', big({ kind: 'boss', id: 'hg_su_gia' }, 14, 2, 13));
console.log('Đế Giang (tầng 3)', big({ kind: 'boss', id: 'hg_de_giang' }, 14, 3, 13));
console.log('--- Khai Thiên tầng 3');
console.log('Hỗn Độn lv53 (đồ HN)', mon('hg_hon_don', 15, 3, 14));
console.log('Thiên Đạo, đồ KT, không Đoạn Xích', big({ kind: 'thien_dao', id: 'hg_thien_dao' }, 15, 3, 15));
console.log('Thiên Đạo, đồ KT + Đoạn Xích', big({ kind: 'thien_dao', id: 'hg_thien_dao' }, 15, 3, 15, { dx: true }));
