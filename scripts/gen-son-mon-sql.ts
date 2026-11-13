export {};
/**
 * Sinh hàm máy chủ vkl_priv.sm_cfg() từ lib/sonmon/data.ts để máy chủ và giao diện dùng đúng một bộ số.
 * Chạy: npx tsx scripts/gen-son-mon-sql.ts > supabase/son_mon_cfg_<ngày>.sql
 */
const root = process.cwd();
const D = require(root + '/lib/sonmon/data');
const cfg = {
  sm: D.SM,
  b: Object.fromEntries(D.BUILDINGS.map((b: any) => [b.id, { base: b.base, baseSec: b.baseSec, needCd: b.needCd, pop: b.pop }])),
  u: Object.fromEntries(
    D.UNITS.map((x: any) => [x.id, { gioi: x.gioi, role: x.role, atk: x.atk, def: x.def, speed: x.speed, carry: x.carry, cost: x.cost, trainSec: x.trainSec, upkeep: x.upkeep, needLv: x.needLv, needTk: x.needTk, scout: x.scout ?? 0 }]),
  ),
  yd: D.YEU_DONG,
  pd: D.PHUC_DIA,
};
const json = JSON.stringify(cfg).replace(/'/g, "''");
process.stdout.write(`-- 4.6.0 Sơn Môn: bộ số cho máy chủ. SINH TỰ ĐỘNG từ lib/sonmon/data.ts bằng scripts/gen-son-mon-sql.ts, đừng sửa tay.
-- Chỉ thay hàm vkl_priv.sm_cfg (hàm riêng của Sơn Môn), không đụng hàm cũ.
create schema if not exists vkl_priv;
create or replace function vkl_priv.sm_cfg() returns jsonb
language sql immutable set search_path = '' as $cfg$
  select '${json}'::jsonb
$cfg$;
revoke all on function vkl_priv.sm_cfg() from public;
`);
