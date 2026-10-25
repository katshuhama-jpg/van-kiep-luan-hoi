import { combatLevel, playerStats, type Fighter } from './combat';
import { ITEMS, REALMS, realmLabel } from './data';
import { demoChar } from './demo';
import { genName } from './engine';
import { addCult, fatal, giveItem, money, reward, stat } from './helpers';
import type { Character, EffectCtx, RivalChar } from './types';

/**
 * Kỳ ngộ giang hồ: gặp nhân vật của người chơi khác (hoặc chính mình kiếp trước).
 * - Đồng đạo: cùng phe, có thể luận võ, kết giao hoặc cáo từ.
 * - Địch thủ: khác phe, thường mạnh hơn, phải đánh hoặc liều bỏ chạy.
 * - Tâm ma kiếp trước: bóng của chính mình kiếp trước, không chạy được.
 * Có màn cảnh báo trước khi vào trận, nền sân đấu riêng, đánh tối đa 5 hiệp.
 */

export type DuelKind = 'dong_dao' | 'dich_thu' | 'kiep_truoc';
export const DUEL_PER_YEAR = 0.05;
export const DUEL_TURNS = 5;

export interface DuelFoe {
  kind: DuelKind;
  rival: RivalChar;
  npc: boolean; // không có người chơi thật phù hợp, giang hồ vô danh thay thế
  rel: 'yeu' | 'ngang' | 'manh';
  reason: string; // lý do gặp, mỗi lần một khác
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

export function foeStats(r: RivalChar): Fighter {
  return playerStats(foeChar(r));
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
    alive: true,
  };
}

/** Chọn cuộc gặp năm nay. null nếu không có gì hợp lý. */
export function pickDuel(c: Character, rnd: () => number): DuelFoe | null {
  const w = c.world;
  const past = w?.past ?? null;
  const kinds: [DuelKind, number][] = [
    ['dong_dao', 45],
    ['dich_thu', 35],
    ['kiep_truoc', past ? 20 : 0],
  ];
  const tot = kinds.reduce((a, k) => a + k[1], 0);
  let x = rnd() * tot;
  let kind: DuelKind = 'dong_dao';
  for (const [k, wt] of kinds) if ((x -= wt) < 0) { kind = k; break; }

  // cấp độ đối thủ: đồng đạo thường ngang hoặc yếu hơn, địch thủ và tâm ma hay mạnh hơn
  const r = rnd();
  const up = kind === 'dong_dao' ? 0.2 : 0.45;
  const down = kind === 'dong_dao' ? 0.4 : 0.25;
  const delta = r < down ? -1 : r < down + up ? 1 : 0;
  const target = Math.max(1, Math.min(7, c.realm + delta));

  let rival: RivalChar | null = null;
  let npc = false;
  if (kind === 'kiep_truoc' && past) {
    // tâm ma lớn thì bóng kiếp trước càng mạnh
    const boost = c.stats.tamMa >= 50 ? 1 : 0;
    rival = { ...past, realm: Math.max(1, Math.min(7, Math.max(past.realm, c.realm - 1) + boost)) };
  } else {
    const mine = lean(c.daoTam);
    const pool = (w?.rivals ?? []).filter((v) => v.realm >= 1 && Math.abs(v.realm - target) <= 0 + (delta === 0 ? 0 : 0) + 1);
    const side = pool.filter((v) => (kind === 'dong_dao' ? lean(v.daoTam) === mine || lean(v.daoTam) === 0 : lean(v.daoTam) !== mine || mine === 0));
    const list = (side.length ? side : pool).sort((a, b) => Math.abs(a.realm - target) - Math.abs(b.realm - target));
    if (list.length) {
      const best = list.filter((v) => Math.abs(v.realm - target) === Math.abs(list[0].realm - target));
      rival = best[Math.floor(rnd() * best.length)];
    } else {
      npc = true;
      const sign = kind === 'dong_dao' ? (mine || 1) : mine > 0 ? -1 : mine < 0 ? 1 : rnd() < 0.5 ? 1 : -1;
      rival = npcRival(c, target, sign, rnd);
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

/** Kết thúc trận: thưởng phạt theo loại cuộc gặp */
export function finishDuel(c: Character, f: DuelFoe, result: 'win' | 'lose' | 'draw', pLoss: number, ctx: EffectCtx): string[] {
  const r = f.rival;
  const who = r.player ? `${r.name} (@${r.player})` : r.name;
  const harder = f.rel === 'manh' ? 1.6 : f.rel === 'yeu' ? 0.5 : 1;
  const out: string[] = [];
  if (f.kind === 'dong_dao') {
    if (result === 'win') {
      const exp = Math.round(reward(c, 0.35) * harder);
      addCult(c, exp);
      stat(c, 'khiVan', 2);
      out.push(`Luận võ với ${who}, bạn thắng một chiêu. Hai bên cười lớn, chia tay như bạn cũ (+${exp} tu vi).`);
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
    }
    return out;
  }
  if (f.kind === 'dich_thu') {
    if (result === 'win') {
      const exp = Math.round(reward(c, 0.6) * harder);
      addCult(c, exp);
      const loot = Math.round(40 + r.realm * 60 * harder);
      money(c, loot);
      out.push(`Bạn đánh bại địch thủ ${who} (+${exp} tu vi, +${loot} linh thạch).`);
      const wpn = r.equipped?.vu_khi;
      if (wpn && !c.inventory.includes(wpn) && ctx.rnd() < 0.3) {
        giveItem(c, wpn, false);
        out.push(`Hắn đánh rơi ${ITEMS.find((i) => i.id === wpn)?.name ?? 'binh khí'}. Bạn thu lấy làm chiến lợi phẩm.`);
      }
      stat(c, 'sucKhoe', -Math.round(pLoss * 20));
    } else if (result === 'draw') {
      stat(c, 'sucKhoe', -Math.round(pLoss * 25));
      out.push(`Năm hiệp chưa phân thắng bại, ${who} hừ lạnh rồi bỏ đi: "Lần sau gặp lại, ta lấy mạng ngươi."`);
    } else {
      const fl = fatal(c, ctx, 0.25, `Bạn bại dưới tay địch thủ ${who}. Giang hồ lại thêm một nấm mồ.`);
      if (c.dead) return [fl ?? ''];
      stat(c, 'sucKhoe', -35);
      const lost = Math.round(c.linhThach * 0.2);
      money(c, -lost);
      out.push(`Bạn thua ${who}, bị cướp ${lost} linh thạch, lết về trong trọng thương.${fl ?? ''}`);
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
    out.push(`Bạn vượt qua bóng của ${r.name} kiếp trước. Nghiệp cũ tan như sương sớm, đạo tâm sáng rực (+${exp} tu vi).`);
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
    if (c.daoTam >= 20 && r.daoTam <= -20) pool.push(`Ma đạo ${n} nghe tin bạn ra tay diệt ma, tìm đến báo thù cho đồng môn.`, `${n} cười gằn: "Chính đạo các ngươi giả nhân giả nghĩa, hôm nay ta lột mặt nạ."`);
    if (c.daoTam <= -20 && r.daoTam >= 20) pool.push(`${n} của chính phái lần theo dấu máu bạn để lại. "Hôm nay thay trời hành đạo."`, `Chính phái treo thưởng đầu bạn. ${n} là người đầu tiên tìm tới.`);
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
