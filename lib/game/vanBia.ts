import { tr } from '../i18n';
import type { Character, Mile, MileKind } from './types';
import { realmName } from './data';
import { endingOf } from './endings';

/**
 * 4.1.0 Q6: lời viếng mẫu và gợi ý văn bia sinh từ dữ liệu mộ.
 * Câu nào cũng nhắc tên, cảnh giới, kết cục, kẻ giết hay đạo lữ, để người nhận thấy mình được để ý.
 */
export interface GraveInfo {
  name: string;
  age: number;
  realm: string; // nhãn cảnh giới như trên bia ("Trúc Cơ Sơ kỳ", "Luyện Khí tầng 3")
  path?: string | null; // tên con đường ("Kiếm tu")
  ending?: string | null; // tên kết cục
  killer?: string | null;
  partner?: string | null;
  ascended?: boolean;
}

/** Bỏ phần tầng, kỳ: "Trúc Cơ Sơ kỳ" -> "Trúc Cơ" */
export function realmShort(label: string): string {
  return label.replace(/\s+(tầng\s*\d+|Layer\s*\d+|Sơ kỳ|Trung kỳ|Hậu kỳ|Early|Middle|Late)$/i, '').trim();
}

/** "Huyết Ma Lv26" -> "Huyết Ma" */
export const killerName = (k?: string | null) => (k ? k.replace(/\s+Lv\s*\d+$/i, '').trim() : null);

const isMortal = (realm: string) => /^(Phàm Nhân|Mortal)$/i.test(realm);

/** Lời viếng mẫu cho một ngôi mộ, n câu, xoay theo seed để mỗi mộ một khác */
export function condoLines(g: GraveInfo, seed: number | string, n = 3): string[] {
  const realm = realmShort(g.realm || '');
  const who = g.path ? `${g.path} ${g.name}` : g.name;
  const at = isMortal(realm) ? tr('khi còn là phàm nhân', 'while still a mortal') : tr(`ở ${realm}`, `at ${realm}`);
  const killer = killerName(g.killer);
  const out: string[] = [];
  // câu đầu luôn nói về cái chết: kẻ giết, phi thăng, hay cảnh giới và tuổi
  if (g.ascended) out.push(tr(`${who} đã đi tới ${realm}, nhân gian còn ngước nhìn theo.`, `${who} made it to ${realm}. The mortal world still looks up after you.`));
  else if (killer) out.push(tr(`${who} ngã dưới tay ${killer} ${at}, năm ${g.age} tuổi. Mong kiếp sau gặp lại trên lôi đài.`, `${who} fell to ${killer} ${at}, aged ${g.age}. May we meet again in the arena next life.`));
  else out.push(tr(`${who} ngã xuống ${at}, năm ${g.age} tuổi. Một nén hương tiễn đạo hữu.`, `${who} fell ${at}, aged ${g.age}. A stick of incense to see you off, fellow Daoist.`));
  const more: string[] = [];
  if (g.partner) more.push(tr(`${g.partner} chắc còn đợi ở đầu cầu Nại Hà. Đi thong thả, ${g.name}.`, `${g.partner} must still be waiting at the head of the Naihe Bridge. Go gently, ${g.name}.`));
  if (g.ending) more.push(tr(`"${g.ending}", đoạn kết này giang hồ còn nhắc lâu. An nghỉ nhé ${g.name}.`, `"${g.ending}" - the jianghu will talk about that ending for a long time. Rest well, ${g.name}.`));
  if (g.age < 30) more.push(tr(`Mới ${g.age} tuổi đã đi, tiếc cho ${g.name}. Kiếp sau sống lâu hơn nhé.`, `Gone at just ${g.age}. A pity, ${g.name}. Live longer next time.`));
  else if (g.age >= 200) more.push(tr(`${g.age} năm tu hành, ${g.name} nghỉ chân được rồi.`, `${g.age} years of cultivation. You've earned your rest, ${g.name}.`));
  if (g.path) more.push(tr(`Con đường ${g.path} còn dài, ${g.name} đi trước, ta đi tiếp.`, `The ${g.path} road is long. You go ahead, ${g.name}; I'll keep walking.`));
  more.push(tr(`${g.name}, kiếp sau gặp lại, ta mời đạo hữu chén rượu.`, `${g.name}, we'll meet again next life, and the wine is on me.`));
  if (!isMortal(realm)) more.push(tr(`Tu tới ${realm} đâu phải chuyện dễ. Thiên đạo vô tình, nhân gian còn nhớ ${g.name}.`, `Reaching ${realm} is no small thing. The Heavenly Dao is heartless, but the world remembers ${g.name}.`));
  const k = Math.abs(Number(String(seed).replace(/\D/g, '').slice(-6)) || 7);
  for (let i = 0; out.length < n && i < more.length; i++) {
    const t = more[(k + i) % more.length];
    if (!out.includes(t)) out.push(t);
  }
  return out.slice(0, n);
}

/** Mộ trên Nghĩa trang (Memorial) hay hồ sơ hồi ký -> GraveInfo */
export function graveInfo(m: {
  char_name: string;
  age: number;
  realm: string;
  path: string | null;
  ascended?: boolean;
  killer?: string | null;
  partner?: string | null;
  ending?: string | null;
}): GraveInfo {
  return { name: m.char_name, age: m.age, realm: m.realm, path: m.path, ascended: !!m.ascended, killer: m.killer ?? null, partner: m.partner ?? null, ending: m.ending ?? null };
}

/** Đạo lữ đời này, lấy từ mốc "Kết thành đạo lữ với X" khi mộ cũ chưa lưu tên */
export function partnerFromMiles(miles?: Mile[]): string | null {
  const m = [...(miles ?? [])].reverse().find((x) => x.kind === 'love');
  const hit = m?.text.match(/(?:đạo lữ với|companions with)\s+(.+)$/);
  return hit ? hit[1].trim() : null;
}

/** Thứ tự "lớn" của khoảnh khắc trong đời, để chọn khoảnh khắc lớn nhất */
const BIG: Partial<Record<MileKind, number>> = { revenge: 10, mount: 9, love: 8, treasure: 7, realm: 6, sect: 5, path: 5, duel: 4, wealth: 4, pet: 3, hunt: 3 };

const PATH_LINE: Record<string, () => string> = {
  kiem: () => tr('Kiếp này không phụ kiếm trong tay.', 'In this life I never failed the sword in my hand.'),
  dan: () => tr('Luyện cả đời đan cứu người, không luyện được viên cứu mình.', 'A lifetime of pills to save others, and none to save myself.'),
  tran: () => tr('Trận bày cả đời, cuối cùng vẫn không giữ được mình.', 'A lifetime of formations, and in the end none could hold me here.'),
  phat: () => tr('A Di Đà Phật. Đi một kiếp, buông một kiếp.', 'Amitabha. One life walked, one life let go.'),
  ma: () => tr('Nếu có kiếp sau, ta vẫn chọn làm tà ma.', 'If there is a next life, I would still choose the demon path.'),
  yeu: () => tr('Mang huyết mạch yêu tộc, sống đúng là mình.', 'Born of yao blood, I lived as myself.'),
};

/** 3 câu văn bia gợi ý cho màn lập bia, lấy từ khoảnh khắc lớn nhất kiếp và cái chết */
export function epitaphIdeas(c: Character): string[] {
  const out: string[] = [];
  const realm = c.realm === 0 ? null : realmName(c.realm, c.cosmos);
  // 1. khoảnh khắc lớn nhất
  const big = (c.miles ?? []).filter((m) => BIG[m.kind]).sort((a, b) => (BIG[b.kind] ?? 0) - (BIG[a.kind] ?? 0) || b.age - a.age)[0];
  if (big?.kind === 'love' && c.partner) out.push(tr(`Kiếp này có ${c.partner}, vậy là đủ.`, `In this life I had ${c.partner}. That was enough.`));
  else if (big?.kind === 'revenge') out.push(tr('Thù đã trả, đi không hối tiếc.', 'My vengeance is done. I leave without regret.'));
  else if (big?.kind === 'mount') out.push(tr('Từng cưỡi rồng giữa mây, chết cũng không tiếc.', 'I once rode a dragon through the clouds. I die with no regrets.'));
  else if (big) {
    const t = big.text.charAt(0).toLowerCase() + big.text.slice(1);
    out.push(tr(`Năm ${big.age} tuổi, ${t}. Đời này nhớ nhất khoảnh khắc ấy.`, `At ${big.age}: ${t}. The moment I remember most.`));
  }
  // 2. cái chết
  if (c.ascended) out.push(tr('Phi thăng rồi, nhân gian đừng nhớ ta.', 'I have ascended. Mortal world, do not miss me.'));
  else if (c.killer) out.push(tr(`Nợ ${killerName(c.killer)} một kiếp, kiếp sau đòi lại.`, `${killerName(c.killer)} owes me a life. I'll collect it next time.`));
  else out.push(tr(`${endingOf(c).name}. Thiên đạo khắc vậy, ta không oán.`, `${endingOf(c).name}. So the Heavenly Dao wrote it; I hold no grudge.`));
  // 3. con đường, cảnh giới
  if (realm) out.push(tr(`Một đời tu tới ${realm}, ${Math.floor(c.age)} năm không uổng.`, `A life cultivated to ${realm}. ${Math.floor(c.age)} years not wasted.`));
  if (c.path && PATH_LINE[c.path]) out.push(PATH_LINE[c.path]());
  if (out.length < 3) out.push(tr(`${Math.floor(c.age)} năm phàm trần, kiếp sau ta tu tiếp.`, `${Math.floor(c.age)} mortal years. Next life, I cultivate again.`));
  return Array.from(new Set(out)).slice(0, 3);
}

