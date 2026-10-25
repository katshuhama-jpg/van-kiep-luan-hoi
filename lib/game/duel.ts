import { addMile } from './miles';
import { qmark } from './hook';
import { combatLevel, hit, playerStats, type Fighter } from './combat';
import { ITEMS, REALMS, fxText, realmLabel } from './data';
import { demoChar } from './demo';
import { ELEMENT_IDS, elemMul, elemRel, elementOf, type ElemRel } from './nguhanh';
import { genName } from './engine';
import { addCult, fatal, giveItem, money, reward, stat } from './helpers';
import { PROVOKE_MUL, SOCIAL } from './social';
import type { Character, EffectCtx, RivalChar, Slot, Vendetta } from './types';

/**
 * Kỳ ngộ giang hồ: gặp nhân vật của người chơi khác (hoặc chính mình kiếp trước).
 * - Đồng đạo: cùng phe, có thể luận võ, kết giao hoặc cáo từ.
 * - Địch thủ: khác phe, thường mạnh hơn, phải đánh hoặc liều bỏ chạy.
 * - Tâm ma kiếp trước: bóng của chính mình kiếp trước, không chạy được.
 * Có màn cảnh báo trước khi vào trận, nền sân đấu riêng, đánh tối đa 5 hiệp.
 */

export type DuelKind = 'dong_dao' | 'dich_thu' | 'kiep_truoc';
export const DUEL_PER_YEAR = 0.1; // trung bình khoảng 10 năm gặp một lần
export const DUEL_TURNS = 5;

export interface DuelFoe {
  kind: DuelKind;
  rival: RivalChar;
  npc: boolean; // không có người chơi thật phù hợp, giang hồ vô danh thay thế
  rel: 'yeu' | 'ngang' | 'manh';
  reason: string; // lý do gặp, mỗi lần một khác
  betray?: boolean; // đồng đạo trở mặt khi uống trà
  revenge?: Vendetta; // gặp lại kẻ thù cũ để báo thù
  hunt?: boolean; // truy sát chủ động: tự bỏ tiền dò tung tích kẻ thù
  sworn?: boolean; // gặp huynh đệ kết nghĩa
  provoke?: boolean; // từng khiêu khích nhau: thắng thua đều gấp rưỡi
  bounty?: number; // tiền truy nã trên đầu đối thủ
}

export const DUEL_INFO: Record<DuelKind, { title: string; tag: string; warn: string }> = {
  dong_dao: { title: 'Gặp đồng đạo', tag: 'Đồng đạo', warn: 'Một tu sĩ cùng chí hướng chắn đường, chắp tay thi lễ: "Nghe danh đã lâu, xin được lĩnh giáo vài chiêu."' },
  dich_thu: { title: 'Địch thủ xuất hiện!', tag: 'Địch thủ', warn: 'Sát khí ập tới. Kẻ khác đạo đã đợi bạn ở đây từ lâu. Hôm nay chỉ một người được rời đi.' },
  kiep_truoc: { title: 'Tâm ma kiếp trước', tag: 'Kiếp trước', warn: 'Mặt hồ phẳng lặng bỗng in bóng một người. Đó là bạn, của một kiếp đã qua. Muốn đi tiếp, phải vượt qua chính mình.' },
};

function lean(d: number) {
  return d >= 20 ? 1 : d <= -20 ? -1 : 0;
}

/** Ghép nhân vật đầy đủ từ dữ liệu rút gọn, để vẽ hình và tính chỉ số */
export function foeChar(r: RivalChar): Character {
  return demoChar({
    name: r.name,
    gender: r.gender,
    race: r.race ?? 'nhan',
    realm: r.realm,
    layer: r.layer,
    path: r.path,
    daoTam: r.daoTam,
    age: Math.max(20, r.age),
    lifespan: Math.max(r.lifespan ?? 100, r.age + 1),
    hairColor: r.hairColor,
    hairStyle: r.hairStyle,
    outfitTone: r.outfitTone,
    outfitCut: r.outfitCut,
    equipped: r.equipped ?? { ao: 'ao_vai' },
    lookSeed: r.lookSeed,
    element: r.element,
    cultivation: 0,
    stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 10, sucKhoe: 90 },
  });
}

export function foeStats(r: RivalChar, me?: Character): Fighter {
  const s = playerStats(foeChar(r));
  if (!me) return s;
  // luân hồi nhiều kiếp hơn thì kinh nghiệm chiến đấu dày hơn: công và thủ theo hệ số kiếp
  const m = lifeMul(r.lifeNo ?? 1, me.lifeNo);
  return { ...s, atk: Math.round(s.atk * m), def: Math.round(s.def * m) };
}

/**
 * Hệ số kiếp: đối thủ hơn mỗi kiếp +3% công và thủ, tối đa +30%;
 * kém mỗi kiếp -3%, tối đa -20%.
 */
export function lifeMul(foeLife: number, myLife: number): number {
  const d = foeLife - myLife;
  return 1 + Math.max(-0.2, Math.min(0.3, d * 0.03));
}

export function lifeText(foeLife: number, myLife: number): { text: string; tone: 'good' | 'bad' | 'normal' } {
  const d = foeLife - myLife;
  const pct = Math.round((lifeMul(foeLife, myLife) - 1) * 100);
  if (d > 0) return { text: `Đối thủ luân hồi nhiều hơn bạn ${d} kiếp, kinh nghiệm dày hơn: công và thủ +${pct}%.`, tone: 'bad' };
  if (d < 0) return { text: `Bạn luân hồi nhiều hơn ${-d} kiếp, nhìn thấu chiêu thức: đối thủ công và thủ ${pct}%.`, tone: 'good' };
  return { text: 'Cùng số kiếp luân hồi, không ai hơn ai.', tone: 'normal' };
}

function npcRival(c: Character, realm: number, sign: number, rnd: () => number): RivalChar {
  const gender = rnd() < 0.5 ? 'nam' : 'nu';
  const paths = sign < 0 ? ['ma', 'kiem', 'dan'] : sign > 0 ? ['kiem', 'phat', 'tran'] : ['kiem', 'dan', 'tran'];
  const weapons = ITEMS.filter((i) => i.slot === 'vu_khi' && i.minRealm <= realm && !i.path);
  const robes = ITEMS.filter((i) => i.slot === 'ao' && i.minRealm <= realm && !i.path);
  return {
    player: '',
    name: genName(gender),
    gender,
    realm,
    layer: 1 + Math.floor(rnd() * (REALMS[realm]?.layers ?? 3)),
    path: realm >= 2 ? (paths[Math.floor(rnd() * paths.length)] as RivalChar['path']) : null,
    daoTam: sign * (30 + Math.floor(rnd() * 60)),
    age: 20 + Math.floor(rnd() * 60),
    hairColor: ['den', 'nau', 'bac', 'do'][Math.floor(rnd() * 4)],
    hairStyle: Math.floor(rnd() * 10),
    outfitTone: Math.floor(rnd() * 5),
    outfitCut: Math.floor(rnd() * 4),
    equipped: { ao: robes[Math.floor(rnd() * robes.length)]?.id ?? 'ao_vai', vu_khi: weapons[Math.floor(rnd() * weapons.length)]?.id },
    lookSeed: Math.floor(rnd() * 2 ** 31),
    lifeNo: Math.max(1, c.lifeNo + Math.floor(rnd() * 9) - 3),
    alive: true,
  };
}

/** Đổi cấp chiến đấu ra cảnh giới và tầng: Luyện Khí 1-9, từ Trúc Cơ mỗi cảnh giới 3 tầng */
function clToRealm(cl: number): { realm: number; layer: number } {
  if (cl <= 9) return { realm: 1, layer: Math.max(1, cl) };
  const realm = Math.min(7, 2 + Math.floor((cl - 10) / 3));
  return { realm, layer: Math.min(3, cl - (9 + (realm - 2) * 3)) };
}

/** Chọn cuộc gặp năm nay. null nếu không có gì hợp lý. */
export function pickDuel(c: Character, rnd: () => number): DuelFoe | null {
  const f = pickDuel0(c, rnd);
  if (!f || f.npc || !f.rival.player || f.kind === 'kiep_truoc') return f;
  // gắn quan hệ giang hồ với người chơi thật
  const S = SOCIAL.cur;
  const p = f.rival.player;
  if (S.sworn.includes(p) && !f.revenge && !f.hunt) {
    f.kind = 'dong_dao';
    f.sworn = true;
  }
  if (S.provoke.includes(p)) f.provoke = true;
  if (S.bounty[p]) f.bounty = S.bounty[p];
  return f;
}

/** Mức chênh lệch sức mạnh giữa hai bên */
function relOf(c: Character, rival: RivalChar): DuelFoe['rel'] {
  const me = combatLevel(c);
  const foe = combatLevel(foeChar(rival));
  return foe <= me - 2 ? 'yeu' : foe >= me + 2 ? 'manh' : 'ngang';
}

function pickDuel0(c: Character, rnd: () => number): DuelFoe | null {
  const w = c.world;
  const S = SOCIAL.cur;
  // truy sát: người dò tin đã tìm ra kẻ thù, chạm mặt chắc chắn
  if (c.hunt && c.age >= c.hunt.at) {
    const rival = c.hunt.rival;
    c.hunt = null;
    return {
      kind: 'dich_thu',
      rival,
      npc: false,
      rel: relOf(c, rival),
      hunt: true,
      reason: `Người bạn thuê đã dò ra tung tích của @${rival.player}. ${rival.name} đang đứng ngay trước mặt, không còn đường lui. Thắng được thưởng gấp đôi và lấy lại đồ từng bị cướp.`,
    };
  }
  // ghi thù trong sổ (cả từ thư giang hồ) cũng tính là oan gia
  const foesV: Vendetta[] = [
    ...(c.vendettas ?? []),
    ...S.foes.filter((p) => !(c.vendettas ?? []).some((v) => v.player === p)).map((p) => ({ player: p, name: '', items: [], why: `@${p} có tên trong sổ thù của bạn` })),
  ];
  // oan gia ngõ hẹp: có thù với người chơi thật thì 35% gặp lại họ
  for (const v of foesV) {
    const cands = (w?.rivals ?? []).filter((x) => x.player === v.player);
    if (!cands.length || rnd() >= 0.35) continue;
    const rival = cands.find((x) => x.name === v.name) ?? cands[0];
    return {
      kind: 'dich_thu',
      rival,
      npc: false,
      rel: relOf(c, rival),
      revenge: v,
      reason: `Oan gia ngõ hẹp! Bạn chưa quên: ${v.why}. Nay người của @${v.player} lại xuất hiện trước mặt. Báo thù được thưởng gấp đôi và lấy lại đồ đã mất.`,
    };
  }
  // huynh đệ kết nghĩa: 30% gặp lại nhau trên đường
  const bros = (w?.rivals ?? []).filter((x) => S.sworn.includes(x.player));
  if (bros.length && rnd() < 0.3) {
    const rival = bros[Math.floor(rnd() * bros.length)];
    return {
      kind: 'dong_dao',
      rival,
      npc: false,
      rel: relOf(c, rival),
      sworn: true,
      reason: `Giữa đường gặp lại huynh đệ kết nghĩa ${rival.name} (@${rival.player}). Hai người mừng rỡ, rủ nhau luận võ một trận cho đã tay.`,
    };
  }
  const past = w?.past ?? null;
  const kinds: [DuelKind, number][] = [
    ['dong_dao', 45],
    ['dich_thu', 35],
    ['kiep_truoc', past ? 20 : 0],
  ];
  const tot = kinds.reduce((a, k) => a + k[1], 0);
  let x = rnd() * tot;
  let kind: DuelKind = 'dong_dao';
  for (const [k, wt] of kinds)
    if ((x -= wt) < 0) {
      kind = k;
      break;
    }

  // cấp độ đối thủ theo cấp chiến đấu, chia ba bậc rõ ràng để ít gặp người ngang cấp:
  // đồng đạo: yếu 45%, ngang 25%, mạnh 30%; địch thủ: 25/25/50; tâm ma kiếp trước: 20/20/60
  const me0 = combatLevel(c);
  const W: Record<DuelKind, [number, number]> = { dong_dao: [0.45, 0.25], dich_thu: [0.25, 0.25], kiep_truoc: [0.2, 0.2] };
  const [pw, pn] = W[kind];
  const r = rnd();
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const delta = r < pw ? -ri(3, 6) : r < pw + pn ? ri(-1, 1) : ri(3, 6);
  const targetCl = Math.max(1, Math.min(27, me0 + delta));
  const tgt = clToRealm(targetCl);

  let rival: RivalChar | null = null;
  let npc = false;
  // quan hệ ngũ hành mong muốn: bị khắc 30%, khắc 20%, cùng mệnh 15%, sinh 17,5%, được sinh 17,5%
  // (để ngẫu nhiên thì khắc + cùng mệnh chiếm 40%, bị khắc chỉ 20%: người chơi thấy quá dễ)
  const myEl = elementOf(c);
  const er = rnd();
  const wantRel: ElemRel = er < 0.3 ? 'bi_khac' : er < 0.5 ? 'khac' : er < 0.65 ? 'dong' : er < 0.825 ? 'sinh' : 'duoc_sinh';
  if (kind === 'kiep_truoc' && past) {
    // bóng kiếp trước: dáng hình kiếp trước, sức mạnh do tâm ma quyết định; tâm ma lớn thì mạnh thêm
    const t2 = c.stats.tamMa >= 50 && delta > 0 ? clToRealm(Math.min(27, targetCl + 2)) : tgt;
    rival = { ...past, realm: t2.realm, layer: t2.layer, lifeNo: Math.max(1, c.lifeNo - 1) };
  } else {
    const mine = lean(c.daoTam);
    const pool = (w?.rivals ?? []).filter((v) => v.realm >= 1 && Math.abs(combatLevel(foeChar(v)) - targetCl) <= 1);
    const side = pool.filter((v) => (kind === 'dong_dao' ? lean(v.daoTam) === mine || lean(v.daoTam) === 0 : lean(v.daoTam) !== mine || mine === 0));
    const list0 = side.length ? side : pool;
    // ưu tiên đúng quan hệ ngũ hành đã bốc; không có ai hợp thì lấy cả danh sách
    const byElem = list0.filter((v) => elemRel(myEl, elementOf(v)) === wantRel);
    const list = byElem.length ? byElem : list0;
    if (list.length) {
      rival = list[Math.floor(rnd() * list.length)];
    } else {
      npc = true;
      const sign = kind === 'dong_dao' ? mine || 1 : mine > 0 ? -1 : mine < 0 ? 1 : rnd() < 0.5 ? 1 : -1;
      rival = { ...npcRival(c, tgt.realm, sign, rnd), layer: tgt.layer, element: ELEMENT_IDS.find((e) => elemRel(myEl, e) === wantRel) };
    }
  }
  if (!rival) return null;
  const me = combatLevel(c);
  const foe = combatLevel(foeChar(rival));
  const rel = foe <= me - 2 ? 'yeu' : foe >= me + 2 ? 'manh' : 'ngang';
  return { kind, rival, npc, rel, reason: reasonFor(c, kind, rival, rnd) };
}

export function foeLabel(f: DuelFoe): string {
  const r = f.rival;
  return `${r.name}${r.player ? ` (@${r.player})` : ''} · ${r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer)}`;
}

const RARE_NAME = ['Phàm', 'Tốt', 'Hiếm', 'Cực phẩm'];

/**
 * Lấy một món trong đồ đối thủ đang mang (vũ khí, áo, phụ kiện...). Ưu tiên món mình chưa có;
 * món nào cũng có rồi thì bán lấy linh thạch.
 */
function rivalLoot(c: Character, r: RivalChar, ctx: EffectCtx, chance: number, say: (name: string) => string): string | null {
  if (ctx.rnd() >= chance) return null;
  const items = Object.values(r.equipped ?? {})
    .map((id) => ITEMS.find((i) => i.id === id))
    .filter((i): i is (typeof ITEMS)[number] => !!i && i.id !== 'ao_vai');
  if (!items.length) return null;
  const fresh = items.filter((i) => !c.inventory.includes(i.id));
  const it = (fresh.length ? fresh : items)[Math.floor(ctx.rnd() * (fresh.length ? fresh : items).length)];
  const tag = `[${RARE_NAME[it.rare ?? 0]}]`;
  if (c.inventory.includes(it.id)) {
    const sell = Math.round(40 + (it.price || 80) * 0.5 + (it.rare ?? 0) * 120);
    money(c, sell);
    return `${say(`${tag} ${it.name}`)} Bạn đã có món này nên đem bán được ${sell} linh thạch.`;
  }
  giveItem(c, it.id, false);
  ctx.fx((it.rare ?? 0) >= 3 ? 'layer' : 'buy', it.name);
  return `${say(`${tag} ${it.name}`)} (${fxText(it.fx)}) Mở Túi đồ để mặc.`;
}

/** Bị lột n món đang mặc (bỏ qua áo vải khởi đầu). Mặc từ 2 món trở lên thì luôn chừa lại ít nhất một món. */
export function robGear(c: Character, ctx: EffectCtx, n: number, ids?: string[]): string[] {
  const worn = (Object.entries(c.equipped) as [Slot, string | undefined][]).filter(([, id]) => id && id !== 'ao_vai') as [Slot, string][];
  const k = Math.min(n, worn.length <= 1 ? worn.length : worn.length - 1);
  const names: string[] = [];
  for (let i = 0; i < k; i++) {
    const j = Math.floor(ctx.rnd() * worn.length);
    const [slot, id] = worn.splice(j, 1)[0];
    c.equipped[slot] = slot === 'ao' ? 'ao_vai' : undefined;
    c.inventory = c.inventory.filter((x) => x !== id);
    ids?.push(id);
    names.push(ITEMS.find((it) => it.id === id)?.name ?? 'một món đồ');
  }
  if (names.length) ctx.fx('hurt', 'Bị lột đồ');
  return names;
}

/** Ghi thù với người chơi thật để kiếp này hoặc kiếp sau báo thù (giữ tối đa 3 mối thù) */
export function addVendetta(c: Character, f: DuelFoe, items: string[], why: string) {
  if (!f.rival.player || f.npc || f.kind === 'kiep_truoc') return;
  const rest = (c.vendettas ?? []).filter((v) => v.player !== f.rival.player);
  const old = (c.vendettas ?? []).find((v) => v.player === f.rival.player);
  c.vendettas = [...rest, { player: f.rival.player, name: f.rival.name, items: [...(old?.items ?? []), ...items].slice(-4), why }].slice(-3);
}

/** Kết thúc trận: thưởng phạt theo loại cuộc gặp */
export function finishDuel(c: Character, f: DuelFoe, result: 'win' | 'lose' | 'draw', pLoss: number, ctx: EffectCtx): string[] {
  const r = f.rival;
  const who = r.player ? `${r.name} (@${r.player})` : r.name;
  const harder = (f.rel === 'manh' ? 1.6 : f.rel === 'yeu' ? 0.5 : 1) * (f.provoke ? PROVOKE_MUL : 1);
  const out: string[] = [];
  if (f.provoke) out.push('Hai bên từng khiêu khích nhau, trận này thắng thua đều gấp rưỡi.');
  if (f.kind === 'dong_dao' && f.sworn) {
    // huynh đệ luận võ: không ai lột đồ ai, cả hai cùng tiến
    const exp = Math.round(reward(c, result === 'win' ? 0.45 : result === 'draw' ? 0.35 : 0.25) * Math.max(1, harder));
    addCult(c, exp);
    stat(c, 'tamCanh', 3);
    stat(c, 'khiVan', 2);
    out.push(
      `${result === 'win' ? 'Bạn thắng huynh đệ một chiêu' : result === 'draw' ? 'Hai huynh đệ bất phân thắng bại' : 'Huynh đệ hơn bạn một chiêu'}. ${r.name} cười lớn, chỉ ra chỗ hở trong chiêu thức của bạn. Cả hai cùng tiến (+${exp} tu vi).`,
    );
    return out;
  }
  if (f.kind === 'dong_dao') {
    if (result === 'win') {
      const exp = Math.round(reward(c, 0.35) * harder);
      addCult(c, exp);
      stat(c, 'khiVan', 2);
      out.push(`Luận võ với ${who}, bạn thắng một chiêu. Hai bên cười lớn, chia tay như bạn cũ (+${exp} tu vi).`);
      const g = rivalLoot(c, r, ctx, 0.35, (n) => `${r.name} phục tài, tháo ${n} tặng bạn làm kỷ niệm.`);
      if (g) out.push(g);
    } else if (result === 'draw') {
      const exp = Math.round(reward(c, 0.2) * harder);
      addCult(c, exp);
      stat(c, 'tamCanh', 3);
      out.push(`Năm hiệp bất phân thắng bại với ${who}. Bạn ngộ ra vài điều về võ học (+${exp} tu vi).`);
    } else {
      const exp = Math.round(reward(c, 0.12) * harder);
      addCult(c, exp);
      stat(c, 'sucKhoe', -12);
      out.push(`${who} hơn bạn một bậc. Thua tâm phục khẩu phục, bạn học được không ít (+${exp} tu vi).`);
      // đồng đạo cũng có kẻ giả nhân giả nghĩa: thắng xong trở mặt lột đồ (người nghiêng tà dễ trở mặt hơn)
      if (ctx.rnd() < (r.daoTam < 0 ? 0.35 : 0.15)) {
        const ids: string[] = [];
        const taken = robGear(c, ctx, ctx.rnd() < 0.3 ? 2 : 1, ids);
        if (taken.length) addVendetta(c, f, ids, `${r.name} giả nhân giả nghĩa lột đồ bạn`);
        if (taken.length) out.push(`Nào ngờ ${r.name} là kẻ giả nhân giả nghĩa. Thấy bạn kiệt sức, hắn trở mặt lột mất ${taken.join(' và ')} rồi cười lớn bỏ đi.`);
      }
    }
    return out;
  }
  if (f.kind === 'dich_thu') {
    if (result === 'win') {
      const rv = f.revenge || f.hunt ? 2 : 1; // báo thù, truy sát được thưởng gấp đôi
      const vend = f.revenge ?? (f.hunt ? (c.vendettas ?? []).find((v) => v.player === r.player) : undefined);
      const exp = Math.round(reward(c, 0.6) * harder * rv);
      addCult(c, exp);
      const loot = Math.round((40 + r.realm * 60 * harder) * rv);
      money(c, loot);
      if (r.player && !f.npc) addMile(c, f.revenge || f.hunt ? 'revenge' : 'duel', f.revenge ? `Báo được đại thù với ${r.name} (@${r.player})` : `Đánh bại địch thủ ${r.name} (@${r.player})`);
      out.push(f.revenge || f.hunt ? `Đại thù đã báo! Bạn hạ được ${who} (+${exp} tu vi, +${loot} linh thạch, gấp đôi).` : `Bạn đánh bại địch thủ ${who} (+${exp} tu vi, +${loot} linh thạch).`);
      if (vend) {
        const back = vend.items.filter((id) => ITEMS.some((i) => i.id === id));
        back.forEach((id) => giveItem(c, id, false));
        if (back.length) out.push(`Bạn lấy lại ${back.map((id) => ITEMS.find((i) => i.id === id)?.name).join(', ')} từng bị cướp.`);
        c.vendettas = (c.vendettas ?? []).filter((v) => v.player !== vend.player);
        qmark(c, 'revenge');
      }
      // thắng địch thủ: lấy 1 món, 30% lấy được 2 món, không bao giờ lấy hết
      const g = rivalLoot(c, r, ctx, 0.7, (n) => `Bạn lột được ${n} của ${r.name} làm chiến lợi phẩm.`);
      if (g) {
        out.push(g);
        const g2 = rivalLoot(c, r, ctx, 0.3, (n) => `Lục thêm được ${n}.`);
        if (g2) out.push(g2);
      }
      stat(c, 'sucKhoe', -Math.round(pLoss * 20));
    } else if (result === 'draw') {
      stat(c, 'sucKhoe', -Math.round(pLoss * 25));
      out.push(`Năm hiệp chưa phân thắng bại, ${who} hừ lạnh rồi bỏ đi: "Lần sau gặp lại, ta lấy mạng ngươi."`);
    } else {
      // bị đồng đạo trở mặt đánh úp thì càng dễ chết
      const fl = fatal(
        c,
        ctx,
        f.betray ? 0.45 : 0.25,
        f.betray ? `Bạn tin nhầm ${who}. Chén trà còn chưa nguội, người đã thành thi thể.` : `Bạn bại dưới tay địch thủ ${who}. Giang hồ lại thêm một nấm mồ.`,
      );
      if (c.dead) {
        addVendetta(c, f, [], f.betray ? `${r.name} trở mặt giết bạn bên bàn trà` : `${r.name} đã giết bạn`);
        return [fl ?? ''];
      }
      stat(c, 'sucKhoe', -35);
      const lost = Math.round(c.linhThach * (f.provoke ? 0.3 : 0.2));
      money(c, -lost);
      out.push(`Bạn thua ${who}, bị cướp ${lost} linh thạch, lết về trong trọng thương.${fl ?? ''}`);
      // bị lột 1-2 món đang mặc, không bao giờ mất hết
      const ids: string[] = [];
      const taken = robGear(c, ctx, ctx.rnd() < 0.3 ? 2 : 1, ids);
      if (taken.length) out.push(`${r.name} còn lột mất ${taken.join(' và ')} của bạn.`);
      addVendetta(c, f, ids, f.betray ? `${r.name} trở mặt đánh úp bạn` : `${r.name} đánh bại và cướp của bạn`);
    }
    return out;
  }
  // tâm ma kiếp trước
  if (result === 'win') {
    const exp = Math.round(reward(c, 0.8) * harder);
    addCult(c, exp);
    stat(c, 'tamMa', -20);
    stat(c, 'tamCanh', 8);
    stat(c, 'khiVan', 3);
    addMile(c, 'duel', 'Vượt qua tâm ma của chính mình kiếp trước');
    out.push(`Bạn vượt qua bóng của ${r.name} kiếp trước. Nghiệp cũ tan như sương sớm, đạo tâm sáng rực (+${exp} tu vi).`);
    const g = rivalLoot(c, r, ctx, 0.6, (n) => `Bóng kiếp trước tan đi, để lại ${n}, di vật bạn từng mang kiếp trước.`);
    if (g) out.push(g);
  } else if (result === 'draw') {
    stat(c, 'tamMa', 5);
    out.push(`Bóng kiếp trước lặng lẽ tan vào mặt hồ. Chưa thắng, cũng chưa thua. Nó sẽ còn quay lại.`);
  } else {
    const fl = fatal(c, ctx, 0.1, `Bạn thua chính mình kiếp trước. Hai kiếp người hóa thành một nắm tro bên hồ.`);
    if (c.dead) return [fl ?? ''];
    stat(c, 'tamMa', 15);
    stat(c, 'sucKhoe', -25);
    out.push(`Bạn thua chính mình kiếp trước. Tâm ma dâng lên, ngực đau như bị xé.${fl ?? ''}`);
  }
  return out;
}

/** Lý do gặp: rút ngẫu nhiên theo loại cuộc gặp và hoàn cảnh hai bên, để mỗi lần một khác */
function reasonFor(c: Character, kind: DuelKind, r: RivalChar, rnd: () => number): string {
  const n = r.name;
  const pathName = r.path ? { kiem: 'kiếm', dan: 'đan', tran: 'trận', phat: 'Phật', ma: 'ma công', yeu: 'yêu thuật' }[r.path] : 'võ';
  const pool: string[] = [];
  if (kind === 'dong_dao') {
    pool.push(
      `${n} chắn đường, chắp tay thi lễ: "Nghe danh đã lâu, xin được lĩnh giáo vài chiêu."`,
      `Trên đỉnh núi vắng, ${n} đang luyện ${pathName}. Thấy bạn, người ấy dừng tay mỉm cười: "Đến đúng lúc, cùng luận một trận chứ?"`,
      `Hai người cùng nhắm một cây linh chi trên vách đá. ${n} cười: "Ai thắng thì người đó hái, thế nào?"`,
      `Trong tửu lâu, ${n} nâng chén mời bạn. Uống đến chén thứ ba thì nói: "Rượu ngon phải có kiếm hay. Xin chỉ giáo!"`,
      `Đại hội luận võ mở ở trấn bên. Bốc thăm thế nào lại trúng đúng ${n}.`,
      `${n} được sư phụ dặn đi khắp thiên hạ tìm người ngang tài để mài giũa. Người ấy tìm đến bạn.`,
      `Bến đò chỉ còn một chuyến cuối ngày. ${n} đề nghị: "Đấu một trận, ai thắng qua sông trước."`,
      `${n} nhặt được bức thư bạn đánh rơi, trả lại rồi nói: "Coi như duyên phận, đấu với ta vài chiêu."`,
    );
    if (r.alive === false && r.player) pool.push(`Anh linh của ${n} chưa tan, vẫn ngồi bên bia mộ chờ người đáng mặt luận võ.`);
  } else if (kind === 'dich_thu') {
    pool.push(
      `Sát khí ập tới. ${n} đã đợi bạn ở đây từ lâu. Hôm nay chỉ một người được rời đi.`,
      `${n} nhận lệnh truy nã bạn với giá cao. "Đầu ngươi đáng giá lắm," hắn nói.`,
      `Bạn vô tình giẫm vào lãnh địa của ${n}. Hắn không cần biết lý do.`,
      `Hai người cùng phát hiện một bí cảnh vừa mở. Bí cảnh chỉ đủ cho một người vào.`,
      `${n} tưởng bạn là kẻ đã giết đồng môn của hắn. Giải thích cũng vô ích.`,
      `Giữa đường, ${n} chặn đoàn xe bạn đang hộ tống. "Để hàng lại, hoặc để mạng lại."`,
      `Ở phường thị, bạn mua được món bảo vật ${n} để mắt từ lâu. Hắn theo bạn ra tận ngoài thành.`,
      `${n} tuyên bố trước giang hồ: ai mạnh nhất vùng này thì hắn sẽ đến khiêu chiến. Hôm nay là lượt bạn.`,
    );
    if (c.daoTam >= 20 && r.daoTam <= -20)
      pool.push(`Ma đạo ${n} nghe tin bạn ra tay diệt ma, tìm đến báo thù cho đồng môn.`, `${n} cười gằn: "Chính đạo các ngươi giả nhân giả nghĩa, hôm nay ta lột mặt nạ."`);
    if (c.daoTam <= -20 && r.daoTam >= 20)
      pool.push(`${n} của chính phái lần theo dấu máu bạn để lại. "Hôm nay thay trời hành đạo."`, `Chính phái treo thưởng đầu bạn. ${n} là người đầu tiên tìm tới.`);
    if (c.enemy) pool.push(`${n} được ${c.enemy} thuê đến lấy mạng bạn.`);
    if (c.partner) pool.push(`${n} từng thầm thương ${c.partner}. Thấy bạn, hắn rút vũ khí không nói một lời.`);
  } else {
    pool.push(
      `Mặt hồ phẳng lặng bỗng in bóng một người. Đó là bạn, của một kiếp đã qua. Muốn đi tiếp, phải vượt qua chính mình.`,
      `Đang tọa thiền, bạn rơi vào tâm cảnh. ${n} đứng trước mặt, hỏi: "Kiếp này ngươi có sống tốt hơn ta không?"`,
      `Trong giấc mơ, ${n} cầm vũ khí cũ của kiếp trước chặn đường: "Nợ cũ chưa trả, đừng mong đi xa."`,
      `Đột phá đến cửa ải, tâm ma hóa thành hình dáng kiếp trước. ${n} cười nhạt: "Ngươi vẫn yếu như ta năm xưa."`,
      `Đi qua nơi kiếp trước từng chết, bóng ${n} hiện lên giữa sương mù, ánh mắt đầy tiếc nuối.`,
      `Chiếc gương đồng trong miếu cổ phản chiếu không phải bạn, mà là ${n}. Bóng trong gương bước ra.`,
    );
  }
  return pool[Math.floor(rnd() * pool.length)];
}

/**
 * Kết giao uống trà với đồng đạo: lòng người khó đoán.
 * 40% bị ám toán ngầm (độc, thuốc mê, cổ trùng...), 40% trở mặt ra tay (đánh lén, phục binh...), 20% là thật lòng.
 */
export type TeaResult = { kind: 'am_toan'; text: string } | { kind: 'tro_mat'; text: string } | { kind: 'that_long' };

const AM_TOAN: ((w: string, h: string) => string)[] = [
  (w, h) => `Chén trà của ${w} có vị đắng lạ. Uống xong, bụng bạn quặn thắt: trà có độc.`,
  (w, h) => `${w} đốt một nén "an thần hương". Bạn ngửi một lúc thì mê man, tỉnh dậy đã nằm giữa bãi cỏ.`,
  (w, h) => `Rượu ${w} mời ngấm Thập Hương Nhuyễn Cân Tán, gân cốt bạn mềm nhũn như bún.`,
  (w, h) => `Trong ấm trà của ${w} có thả cổ trùng. Mấy ngày sau bạn mới thấy nó cựa quậy trong bụng.`,
  (w, h) => `${w} rót trà bằng chiếc ấm hai ngăn: chén của ${h} trà thường, chén của bạn trà độc.`,
  (w, h) => `Đang luận đạo say sưa, ${w} vỗ vai thân thiết. Trên tay ${h} dính kim độc mảnh như lông trâu.`,
  (w, h) => `Bánh ngọt ${w} mời có trộn Tán Công Tán. Bạn vận khí thì thấy chân khí tán loạn.`,
  (w, h) => `${w} dùng "Tỏa Hồn Khúc" thổi sáo giúp vui. Bạn nghe xong đầu óc quay cuồng, ngã gục.`,
];
const TRO_MAT: ((w: string, h: string) => string)[] = [
  (w, h) => `Chén trà vừa nâng lên, ${w} đã rút kiếm đâm thẳng tới: "Đồng đạo? Giang hồ làm gì có đồng đạo!"`,
  (w, h) => `Uống được nửa chén, từ bụi rậm nhảy ra ba tên phục binh. ${w} cười nhạt rồi cùng xông vào.`,
  (w, h) => `${w} thấy túi đồ của bạn căng phồng, bỗng nổi lòng tham, hất bàn trà ra tay.`,
  (w, h) => `Hóa ra ${w} nhận tiền thưởng truy nã cái đầu của bạn. Ấm trà chỉ là cái cớ để lại gần.`,
  (w, h) => `${w} nhắc chuyện cũ, càng nói càng cay: hóa ra sư phụ ${h} từng chết dưới tay người cùng môn với bạn.`,
  (w, h) => `Bàn tới công pháp, ${w} đòi bạn đưa bí kíp ra xem. Bạn chưa kịp từ chối, ${h} đã ra tay cướp.`,
  (w, h) => `${w} uống say, tâm ma nổi dậy, mắt đỏ ngầu, quay sang đánh bạn như đánh kẻ thù.`,
  (w, h) => `Ấm trà vỡ tan, bên trong giấu một con dao găm. ${w} đã chuẩn bị từ trước.`,
];

export function teaTrap(c: Character, f: DuelFoe, ctx: EffectCtx): TeaResult {
  const who = f.rival.name;
  const h = f.rival.gender === 'nu' ? 'ả' : 'hắn';
  // huynh đệ kết nghĩa thì trà luôn là trà thật
  if (f.sworn) return { kind: 'that_long' };
  const r = ctx.rnd();
  if (r < 0.4) {
    const pick = AM_TOAN[Math.floor(ctx.rnd() * AM_TOAN.length)];
    let text = pick(who, h);
    const hurt = 18 + Math.floor(ctx.rnd() * 14);
    stat(c, 'sucKhoe', -hurt);
    c.cultivation = Math.max(0, Math.round(c.cultivation * 0.95));
    ctx.fx('hurt', 'Trúng ám toán');
    text += ` (-${hurt} sức khỏe, tu vi tổn hao).`;
    // lúc bạn mê man, hắn lục túi
    if (ctx.rnd() < 0.5) {
      const ids: string[] = [];
      const taken = robGear(c, ctx, 1, ids);
      addVendetta(c, f, ids, `${who} bỏ độc vào trà rồi lục túi bạn`);
      const lost = Math.round(c.linhThach * 0.15);
      money(c, -lost);
      text += ` Lúc bạn mê man, ${h} lấy mất ${taken.length ? taken.join(', ') + ' và ' : ''}${lost} linh thạch.`;
    }
    const fl = fatal(c, ctx, 0.3, `Độc trong chén trà của ${who} ngấm vào tâm mạch. Bạn chết bên bàn trà còn ấm.`);
    if (fl) text += fl;
    return { kind: 'am_toan', text };
  }
  if (r < 0.8) return { kind: 'tro_mat', text: TRO_MAT[Math.floor(ctx.rnd() * TRO_MAT.length)](who, h) };
  return { kind: 'that_long' };
}

/**
 * Chiến thư: hai bóng nhân vật tự đánh 5 hiệp (dùng cho trận hẹn đấu khi chủ nhân vắng mặt).
 * Hết 5 hiệp ai còn nhiều máu hơn (theo phần trăm) thì thắng, chênh dưới 5% là hòa.
 */
export function simulateDuel(me: RivalChar, foe: RivalChar, rnd: () => number): { result: 'win' | 'lose' | 'draw'; hpMe: number; hpFoe: number; rounds: number } {
  const a = foeStats(me);
  const b = foeStats(foe);
  const ma = lifeMul(me.lifeNo ?? 1, foe.lifeNo ?? 1);
  const mb = lifeMul(foe.lifeNo ?? 1, me.lifeNo ?? 1);
  const ea = elemMul(elementOf(me), elementOf(foe));
  const eb = elemMul(elementOf(foe), elementOf(me));
  let ha = a.hp;
  let hb = b.hp;
  let rounds = 0;
  for (let t = 0; t < DUEL_TURNS * 2 && ha > 0 && hb > 0; t++) {
    rounds = Math.floor(t / 2) + 1;
    if (t % 2 === 0) hb -= Math.round(hit(a.atk * ma * ea, b.def * mb, rnd).dmg);
    else ha -= Math.round(hit(b.atk * mb * eb, a.def * ma, rnd).dmg);
  }
  const pa = Math.max(0, ha) / a.hp;
  const pb = Math.max(0, hb) / b.hp;
  const result = hb <= 0 ? 'win' : ha <= 0 ? 'lose' : Math.abs(pa - pb) < 0.05 ? 'draw' : pa > pb ? 'win' : 'lose';
  return { result, hpMe: Math.round(pa * 100), hpFoe: Math.round(pb * 100), rounds };
}

/** Rút gọn nhân vật đang chơi thành bóng để đem đi đấu */
export function toRival(player: string, c: Character): RivalChar {
  return {
    player,
    name: c.name,
    gender: c.gender === 'nu' ? 'nu' : 'nam',
    race: c.race,
    realm: c.realm,
    layer: c.layer,
    path: c.path,
    daoTam: c.daoTam,
    age: Math.floor(c.age),
    lifespan: c.lifespan,
    hairColor: c.hairColor,
    hairStyle: c.hairStyle,
    outfitTone: c.outfitTone,
    outfitCut: c.outfitCut,
    equipped: c.equipped,
    lookSeed: c.lookSeed,
    element: c.element,
    lifeNo: c.lifeNo,
    alive: !c.dead,
  };
}
