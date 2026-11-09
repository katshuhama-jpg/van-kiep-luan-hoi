/** 4.4.0 Hồng Hoang: chỉ số đối thủ các trận lớn (Trảm Tam Thi, boss, Thiên Đạo). Dùng ở giao diện trận. */
import { MONSTERS, monsterStats, playerStats, type Fighter, type Monster } from './combat';
import { THI_NAME, hgPlayerMul } from './hongHoang';
import type { Character, HhFight, ThiKind } from './types';
import { tr } from '../i18n';

/** Hệ số boss so với quái thường cùng cấp: [máu, công] */
const BOSS_MUL: Record<string, [number, number]> = {
  hg_cong_cong: [1.8, 1.1],
  hg_con_bang: [1.8, 1.1],
  hg_quang_thanh: [1.3, 1],
  hg_phan_do: [1.2, 1],
  hg_su_gia: [1.8, 1.1],
  hg_de_giang: [1.8, 1.1],
  hg_thien_dao: [4, 1.35],
};
/** Thi đánh bằng chính sức của bạn: chém thì ngang sức, thu thì mạnh hơn; thi đã yếu đi thì giảm */
export const THI_MUL = { tram: 1, thu: 1.2, yeu: 0.85 };

export function hgFoe(c: Character, f: HhFight): { m: Monster; ms: Fighter; ps: Fighter; name: string } {
  const id = f.kind === 'thi' ? `hg_thi_${f.id}` : f.id;
  const m = MONSTERS.find((x) => x.id === id) ?? MONSTERS.find((x) => x.id === 'hg_thien_dao')!;
  const base = playerStats(c);
  const pm = hgPlayerMul(c, f);
  const ps: Fighter = { hp: Math.round(base.hp * pm.hp), atk: Math.round(base.atk * pm.atk), def: base.def };
  if (f.kind === 'thi') {
    const k = f.id as ThiKind;
    const mul = THI_MUL[f.mode ?? 'tram'] * (c.hong?.yeu?.includes(k) ? THI_MUL.yeu : 1);
    const ms = { hp: Math.round(base.hp * mul), atk: Math.round(base.atk * mul), def: Math.round(base.def * mul) };
    const who = c.past?.name;
    return { m, ms, ps, name: who && k !== 'chap' ? tr(`${THI_NAME[k]} (${who})`, `${THI_NAME[k]} (${who})`) : THI_NAME[k] };
  }
  const [hm, am] = BOSS_MUL[id] ?? [1.8, 1.1];
  const b = monsterStats(m, m.lv, c);
  return { m, ms: { hp: Math.round(b.hp * hm), atk: Math.round(b.atk * am), def: b.def }, ps, name: m.name };
}
