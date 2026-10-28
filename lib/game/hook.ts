import { ENDINGS } from './endings';
import type { Career, Character, Meta } from './types';
import { tr } from '../i18n';

/**
 * Giữ chân người chơi: thiên tượng mỗi ngày, chuỗi ngày tu luyện, nhiệm vụ ngày, lời tiên tri cho kiếp sau.
 * Ngày tính theo giờ Việt Nam.
 */

export function vnDay(d: Date = new Date()): string {
  const t = new Date(d.getTime() + 7 * 3600 * 1000);
  return t.toISOString().slice(0, 10);
}

function dayIndex(day: string): number {
  return Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

// ---------------- Thiên tượng hôm nay ----------------
export type OmenId = 'linh_khi' | 'huyet_nguyet' | 'phat_quang' | 'cat_tinh' | 'yeu_trieu' | 'giang_ho_loan' | 'loi_van';
export interface Omen {
  id: OmenId;
  name: string;
  desc: string;
  icon: string;
  nghi: string; // nên làm
  ky: string; // kiêng
}
export const OMENS: Omen[] = [
  { id: 'linh_khi', name: tr('Linh khí triều dâng', "Spirit Qi Tide"), desc: tr('Linh khí trời đất dồi dào: ai tu luyện cũng nhanh hơn 15%.', "Heaven and earth overflow with spirit qi: everyone cultivates 15% faster."), icon: '☁', nghi: tr('Bế quan, tu luyện', "Seclusion, cultivation"), ky: tr('Bỏ phí thời gian', "Wasting time") },
  { id: 'huyet_nguyet', name: tr('Huyết nguyệt', "Blood Moon"), desc: tr('Trăng máu treo cao: tà tu tu luyện nhanh hơn 25%, chính đạo chậm đi một chút.', "A blood moon hangs high: evil cultivators cultivate 25% faster, the Righteous Path a little slower."), icon: '◐', nghi: tr('Tà công, sát phạt', "Evil arts, slaughter"), ky: tr('Đi đêm, tin người lạ', "Night walks, trusting strangers") },
  { id: 'phat_quang', name: tr('Phật quang phổ chiếu', "Buddha's Light Shines"), desc: tr('Chính đạo tu luyện nhanh hơn 20%, tâm ma ai cũng tăng chậm hơn.', "The Righteous Path cultivates 20% faster, and everyone's heart demon grows slower."), icon: '☸', nghi: tr('Hành thiện, tĩnh tọa', "Good deeds, meditation"), ky: tr('Sát sinh', "Killing") },
  { id: 'cat_tinh', name: tr('Cát tinh chiếu mệnh', "Lucky Star Overhead"), desc: tr('Sao lành soi xuống: hạ quái dễ rơi đồ xịn gấp rưỡi.', "An auspicious star shines down: monsters are 1.5x as likely to drop good loot."), icon: '✦', nghi: tr('Trừ yêu, tìm bảo vật', "Hunting demons, treasure seeking"), ky: tr('Ngồi không', "Sitting idle") },
  { id: 'yeu_trieu', name: tr('Yêu triều', "Demon Tide"), desc: tr('Yêu ma tràn khỏi núi: quái chặn đường nhiều gấp đôi, hạ được thì nhiều tu vi hơn.', "Demons pour out of the mountains: twice as many monsters block the road, but beating them gives more cultivation."), icon: '☠', nghi: tr('Trừ yêu luyện công', "Hunting demons to train"), ky: tr('Đi đường một mình', "Traveling alone") },
  { id: 'giang_ho_loan', name: tr('Giang hồ đại loạn', "Jianghu in Chaos"), desc: tr('Võ lâm dậy sóng: gặp người chơi khác nhiều gấp đôi.', "The martial world is in upheaval: you meet other players twice as often."), icon: '⚔', nghi: tr('Luận võ, báo thù', "Sparring, revenge"), ky: tr('Uống trà với người lạ', "Tea with strangers") },
  { id: 'loi_van', name: tr('Lôi vân tụ đỉnh', "Thunderclouds Gather"), desc: tr('Mây sấm vần vũ: đột phá cảnh giới dễ hơn 6%.', "Thunderclouds churn: realm breakthroughs are 6% easier."), icon: '⚡', nghi: tr('Đột phá, độ kiếp', "Breakthrough, tribulation"), ky: tr('Chần chừ', "Hesitating") },
];

const CAN = [tr('Giáp', "Jia"), tr('Ất', "Yi"), tr('Bính', "Bing"), tr('Đinh', "Ding"), tr('Mậu', "Wu"), tr('Kỷ', "Ji"), tr('Canh', "Geng"), tr('Tân', "Xin"), tr('Nhâm', "Ren"), tr('Quý', "Gui")];
const CHI = [tr('Tý', "Zi"), tr('Sửu', "Chou"), tr('Dần', "Yin"), tr('Mão', "Mao"), tr('Thìn', "Chen"), tr('Tỵ', "Si"), tr('Ngọ', "Wu"), tr('Mùi', "Wei"), tr('Thân', "Shen"), tr('Dậu', "You"), tr('Tuất', "Xu"), tr('Hợi', "Hai")];
/** Can chi của ngày (theo lịch âm dương), ví dụ "Mậu Ngọ" */
export function canChiDay(day: string = vnDay()): string {
  const jdn = dayIndex(day) + 2440588;
  return `${CAN[(jdn + 9) % 10]} ${CHI[(jdn + 1) % 12]}`;
}

export function omenToday(day: string = vnDay()): Omen {
  return OMENS[hash('omen' + day) % OMENS.length];
}

/** hệ số tu vi theo thiên tượng */
export function omenCultMul(c: Pick<Character, 'daoTam'>): number {
  const o = omenToday().id;
  if (o === 'linh_khi') return 1.15;
  if (o === 'huyet_nguyet') return c.daoTam <= -15 ? 1.25 : c.daoTam >= 15 ? 0.95 : 1;
  if (o === 'phat_quang') return c.daoTam >= 15 ? 1.2 : 1;
  return 1;
}
export const omenIs = (id: OmenId) => omenToday().id === id;

// ---------------- Chuỗi ngày tu luyện ----------------
/** Cập nhật chuỗi ngày khi vào game. Trả về meta mới (hoặc null nếu không đổi). */
export function bumpStreak(meta: Meta, day: string = vnDay()): Meta | null {
  const s = meta.streak;
  if (s?.day === day) return null;
  const n = s && dayIndex(day) - dayIndex(s.day) === 1 ? s.n + 1 : 1;
  return { ...meta, streak: { day, n } };
}

/** Quà khởi đầu kiếp mới theo chuỗi ngày */
export function streakGift(n: number): { money: number; khiVan: number; item: string | null; text: string } | null {
  if (n < 2) return null;
  const money = Math.min(600, n * 60);
  const khiVan = n >= 3 ? Math.min(15, 3 + n) : 0;
  const item = n >= 7 ? 'ngoc_boi' : null;
  return { money, khiVan, item, text: tr(`Chuỗi tu luyện ${n} ngày: +${money} linh thạch${khiVan ? tr(`, khí vận +${khiVan}`, `, Luck +${khiVan}`) : ''}${item ? tr(', ngọc bội hộ thân', ", a protective jade pendant") : ''}.`, `${n}-day cultivation streak: +${money} spirit stones${khiVan ? tr(`, khí vận +${khiVan}`, `, Luck +${khiVan}`) : ''}${item ? tr(', ngọc bội hộ thân', ", a protective jade pendant") : ''}.`) };
}

// ---------------- Nhiệm vụ ngày ----------------
export interface Quest {
  id: string;
  name: string;
  check: (c: Character, newEnding: boolean) => boolean;
}
const kills = (c: Character) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0);
export const QUESTS: Quest[] = [
  { id: 'song_80', name: tr('Sống qua 80 tuổi', "Live past 80"), check: (c) => c.age >= 80 },
  { id: 'kim_dan', name: tr('Kết Kim Đan', "Form a Golden Core"), check: (c) => c.realm >= 3 },
  { id: 'nguyen_anh', name: tr('Đạt Nguyên Anh', "Reach Nascent Soul"), check: (c) => c.realm >= 4 },
  { id: 'thang_nguoi', name: tr('Thắng một người chơi khác trong kỳ ngộ', "Beat another player in an encounter"), check: (c) => (c.qf?.duelWin ?? 0) >= 1 },
  { id: 'chan_duong', name: tr('Hạ 3 con quái chặn đường', "Defeat 3 roadblock monsters"), check: (c) => (c.qf?.ambushWin ?? 0) >= 3 },
  { id: 'tram_yeu', name: tr('Trảm 20 yêu quái trong một đời', "Slay 20 demons in one life"), check: (c) => kills(c) >= 20 },
  { id: 'nuoi_thu', name: tr('Nuôi một linh thú', "Raise a spirit beast"), check: (c) => !!c.pet },
  { id: 'ket_duyen', name: tr('Kết thành đạo lữ', "Take a Yao companion"), check: (c) => !!c.partner },
  { id: 'phu_ho', name: tr('Có 1.500 linh thạch', "Have 1,500 spirit stones"), check: (c) => c.linhThach >= 1500 },
  { id: 'ket_cuc_moi', name: tr('Mở một kết cục mới trong Sổ Sinh Tử', "Unlock a new ending in the Book of Life and Death"), check: (_c, n) => n },
  { id: 'uong_tra', name: tr('Uống trà với đồng đạo mà sống sót', "Have tea with a fellow Daoist and survive"), check: (c) => (c.qf?.teaSurvive ?? 0) >= 1 },
  { id: 'chinh_dao', name: tr('Đạo tâm chính trực từ 50 trở lên', "Righteous Yao Heart of 50 or more"), check: (c) => c.daoTam >= 50 },
  { id: 'ta_dao', name: tr('Đạo tâm tà ác từ -50 trở xuống', "Evil Yao Heart of -50 or lower"), check: (c) => c.daoTam <= -50 },
  { id: 'bao_vat_moi', name: tr('Có được một món đồ ẩn chưa từng thấy', "Obtain a never-before-seen hidden item"), check: (c) => (c.qf?.newItem ?? 0) >= 1 },
];
export const QUEST_REWARD = 4; // phúc duyên mỗi nhiệm vụ
export const QUEST_BONUS = 6; // xong cả 3

export function questsFor(day: string): string[] {
  const ids = QUESTS.map((q) => q.id);
  const out: string[] = [];
  let h = hash('q' + day);
  while (out.length < 3) {
    const id = ids[h % ids.length];
    // không bắt cùng ngày vừa chính vừa tà
    if (!out.includes(id) && !(id === 'ta_dao' && out.includes('chinh_dao')) && !(id === 'chinh_dao' && out.includes('ta_dao'))) out.push(id);
    h = hash(String(h));
  }
  return out;
}

/** Nhiệm vụ hôm nay của người chơi (tạo mới khi sang ngày) */
export function dailyOf(meta: Meta, day: string = vnDay()): { day: string; quests: string[]; done: string[] } {
  return meta.daily?.day === day ? meta.daily : { day, quests: questsFor(day), done: [] };
}

/** Chấm nhiệm vụ khi một đời kết thúc. Trả về meta mới, danh sách vừa xong, phúc duyên thưởng. */
export function evalQuests(meta: Meta, c: Character, newEnding: boolean): { daily: { day: string; quests: string[]; done: string[] }; newly: string[]; reward: number } {
  const d = dailyOf(meta);
  const newly = d.quests.filter((id) => !d.done.includes(id) && QUESTS.find((q) => q.id === id)?.check(c, newEnding));
  const done = [...d.done, ...newly];
  let reward = newly.length * QUEST_REWARD;
  if (newly.length && done.length === d.quests.length) reward += QUEST_BONUS;
  return { daily: { ...d, done }, newly, reward };
}

export const questName = (id: string) => QUESTS.find((q) => q.id === id)?.name ?? id;

/** Đánh dấu một việc trong đời (dùng cho nhiệm vụ) */
export function qmark(c: Character, k: string, n = 1) {
  c.qf = { ...(c.qf ?? {}), [k]: (c.qf?.[k] ?? 0) + n };
}

// ---------------- Lời tiên tri cho kiếp sau ----------------
export interface Prophecy {
  id: string;
  text: string;
  done: string; // câu ghi khi ứng nghiệm
  apply: (c: Character) => void;
}
export const PROPHECIES: Prophecy[] = [
  {
    id: 'tien_nhan',
    text: tr('Tiên tịch đã bị tước, nhưng ký ức tiên nhân vẫn còn. Kiếp sau, ngươi sẽ nhớ.', "Your immortal status was stripped, but your immortal memories remain. Next life, you will remember."),
    done: tr('Lời tiên tri ứng nghiệm: bạn sinh ra với ký ức của một vị tiên bị giáng trần (ngộ tính +25, khí vận +15, tu luyện nhanh từ nhỏ).', "The prophecy comes true: you are born with the memories of a banished immortal (Insight +25, Luck +15, fast cultivation from childhood)."),
    apply: (c) => {
      c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 25);
      c.stats.khiVan = Math.min(100, c.stats.khiVan + 15);
      c.linhCanMul = Math.max(c.linhCanMul, 1.6);
    },
  },
  {
    id: 'chuyen_the',
    text: tr('Một tia linh thức đã gói ghém những gì ngươi ngộ ra. Kiếp sau, nó sẽ tìm về.', "A thread of spirit sense has bundled up all you came to understand. Next life, it will find its way back."),
    done: tr('Lời tiên tri ứng nghiệm: tia linh thức kiếp trước tìm về (ngộ tính +20, linh căn ít nhất Địa, tâm cảnh +10).', "The prophecy comes true: a thread of spirit sense from your past life returns (Insight +20, spiritual root at least Earth, Mind +10)."),
    apply: (c) => {
      c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 20);
      c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 10);
      c.linhCanMul = Math.max(c.linhCanMul, 1.5);
    },
  },
  {
    id: 'phuc_bao',
    text: tr('Cho đi cả đời công lực, phúc báo sẽ theo ngươi sang kiếp sau.', "You gave away a lifetime of power; the blessing will follow you into the next life."),
    done: tr('Lời tiên tri ứng nghiệm: phúc báo của kiếp trước (khí vận +20, sức khỏe +10, +300 linh thạch).', "The prophecy comes true: blessings from your past life (Luck +20, Health +10, +300 spirit stones)."),
    apply: (c) => {
      c.stats.khiVan = Math.min(100, c.stats.khiVan + 20);
      c.stats.sucKhoe = Math.min(100, c.stats.sucKhoe + 10);
      c.linhThach += 300;
    },
  },
  {
    id: 'tho',
    text: tr('Kiếp sau, ngươi sẽ sống lâu hơn người thường.', "Next life, you will live longer than ordinary folk."),
    done: tr('Lời tiên tri ứng nghiệm: thọ nguyên của bạn dài hơn người thường.', "The prophecy comes true: your lifespan is longer than ordinary folk's."),
    apply: (c) => {
      c.lifeMul = (c.lifeMul ?? 1) * 1.15;
      c.lifespan = Math.round(c.lifespan * 1.15);
    },
  },
  {
    id: 'ngo',
    text: tr('Kiếp sau, ngươi vừa sinh ra đã thông tuệ hơn người.', "Next life, you will be born brighter than others."),
    done: tr('Lời tiên tri ứng nghiệm: bạn sáng dạ lạ thường (ngộ tính +15).', "The prophecy comes true: you are unusually quick-witted (Insight +15)."),
    apply: (c) => (c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 15)),
  },
  {
    id: 'van',
    text: tr('Kiếp sau, sao lành sẽ chiếu mệnh ngươi.', "Next life, a lucky star will shine on your destiny."),
    done: tr('Lời tiên tri ứng nghiệm: sao lành chiếu mệnh (khí vận +15).', "The prophecy comes true: a lucky star shines on your destiny (Luck +15)."),
    apply: (c) => (c.stats.khiVan = Math.min(100, c.stats.khiVan + 15)),
  },
  { id: 'phu', text: tr('Kiếp sau, ngươi sinh ra trong nhung lụa.', "Next life, you will be born into silk and luxury."), done: tr('Lời tiên tri ứng nghiệm: nhà bạn có của ăn của để (+400 linh thạch).', "The prophecy comes true: your family is well off (+400 spirit stones)."), apply: (c) => (c.linhThach += 400) },
  { id: 'kiep', text: tr('Kiếp sau, ngươi sẽ gặp lại kẻ đã giết ngươi.', "Next life, you will meet again the one who killed you."), done: tr('Lời tiên tri ứng nghiệm: trong mơ bạn thấy lại kẻ thù kiếp trước. Hắn vẫn còn ở giang hồ.', "The prophecy comes true: in your dreams you see your past life's enemy. He is still out there in the jianghu."), apply: () => {} },
  {
    id: 'tam_ma',
    text: tr('Kiếp sau, tâm ngươi sẽ tĩnh như mặt hồ.', "Next life, your heart will be as still as a lake."),
    done: tr('Lời tiên tri ứng nghiệm: tâm bạn tĩnh lặng lạ thường (tâm cảnh +15, tâm ma giảm).', "The prophecy comes true: your heart is unusually calm (Mind +15, heart demon reduced)."),
    apply: (c) => ((c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 15)), (c.stats.tamMa = Math.max(0, c.stats.tamMa - 10))),
  },
  {
    id: 'than_luc',
    text: tr('Kiếp sau, ngươi sinh ra đã có sức trâu.', "Next life, you will be born strong as an ox."),
    done: tr('Lời tiên tri ứng nghiệm: bạn khỏe như trâu từ nhỏ (sức khỏe +15).', "The prophecy comes true: you have been strong as an ox since childhood (Health +15)."),
    apply: (c) => (c.stats.sucKhoe = Math.min(100, c.stats.sucKhoe + 15)),
  },
  {
    id: 'hung',
    text: tr('Kiếp sau, ngươi sẽ trả nợ cho những gì đã làm. Hãy cẩn thận.', "Next life, you will pay for what you have done. Beware."),
    done: tr('Lời tiên tri ứng nghiệm: nghiệp cũ đeo bám (khí vận -10), nhưng ý chí bạn sắt đá hơn (tâm cảnh +10).', "The prophecy comes true: old karma clings to you (Luck -10), but your will is iron (Mind +10)."),
    apply: (c) => ((c.stats.khiVan = Math.max(0, c.stats.khiVan - 10)), (c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 10))),
  },
];

/** Bốc lời tiên tri lúc chết; tà nhiều thì dễ ra điềm dữ */
export function pickProphecy(c: Character, rnd: () => number): { id: string; text: string } {
  if (c.endTag === 'giang_tran') return { id: 'tien_nhan', text: PROPHECIES[0].text };
  if (c.endTag === 'toa_hoa' || c.endTag === 'truyen_cong') {
    const p = PROPHECIES.find((x) => x.id === (c.endTag === 'toa_hoa' ? 'chuyen_the' : 'phuc_bao'))!;
    return { id: p.id, text: p.text };
  }
  const pool =
    c.daoTam <= -40 && rnd() < 0.5 ? PROPHECIES.filter((p) => p.id === 'hung') : PROPHECIES.filter((p) => p.id !== 'hung' && p.id !== 'tien_nhan' && p.id !== 'chuyen_the' && p.id !== 'phuc_bao' && (p.id !== 'kiep' || !!c.vendettas?.length));
  const p = pool[Math.floor(rnd() * pool.length)];
  return { id: p.id, text: p.text };
}

export function applyProphecy(c: Character, pr: { id: string } | null | undefined) {
  const p = pr && PROPHECIES.find((x) => x.id === pr.id);
  if (!p) return;
  p.apply(c);
  c.log.push({ age: 0, tone: p.id === 'hung' ? 'bad' : 'good', text: p.done });
}

// ---------------- Kết cục sắp mở ----------------
/** Gợi ý 2 kết cục chưa mở, ưu tiên kết cục hợp con đường đang đi */
export function nearEndings(c: Character, opened: Record<string, number> | undefined): { name: string; hint: string }[] {
  const left = ENDINGS.filter((e) => !opened?.[e.id] && e.id !== 'bat_dac');
  const pref: Record<string, string[]> = {
    kiem: ['kiem_than'],
    dan: ['dan_thanh'],
    phat: ['thanh_phat'],
    ma: ['ma_ton'],
    yeu: ['yeu_vuong'],
    tran: ['phi_thang'],
  };
  const want = [...(pref[c.path ?? ''] ?? []), ...(c.daoTam >= 40 ? ['dai_thien'] : []), ...(c.realm >= 5 ? ['phi_thang'] : []), ...(c.linhThach > 800 ? ['dai_phu'] : [])];
  const sorted = [...left].sort((a, b) => (want.includes(b.id) ? 1 : 0) - (want.includes(a.id) ? 1 : 0) || a.rare - b.rare);
  return sorted.slice(0, 2).map((e) => ({ name: e.name, hint: e.how ?? e.hint }));
}

// ---------------- Thành tựu dài hạn (mục tiêu sau vài kiếp đầu) ----------------
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  reward: number; // phúc duyên
  check: (m: Meta, k: Career) => boolean;
}
const nEnd = (m: Meta) => Object.keys(m.endings ?? {}).length;
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'kiep_10', name: tr('Thập thế luân hồi', "Ten Lives of Rebirth"), desc: tr('Trải qua 10 kiếp', "Live through 10 lives"), reward: 20, check: (m) => m.lives >= 10 },
  { id: 'kiep_50', name: tr('Ngũ thập thế', "Fifty Lives"), desc: tr('Trải qua 50 kiếp', "Live through 50 lives"), reward: 60, check: (m) => m.lives >= 50 },
  { id: 'kiep_100', name: tr('Bách thế bất diệt', "Undying Through a Hundred Lives"), desc: tr('Trải qua 100 kiếp', "Live through 100 lives"), reward: 150, check: (m) => m.lives >= 100 },
  { id: 'nguyen_anh', name: tr('Nguyên Anh xuất khiếu', "Nascent Soul Emerges"), desc: tr('Lần đầu đạt Nguyên Anh', "Reach Nascent Soul for the first time"), reward: 20, check: (_m, k) => k.maxRealm >= 4 },
  { id: 'hoa_than', name: tr('Hóa Thần đại năng', "Spirit Transformation Master"), desc: tr('Lần đầu đạt Hóa Thần', "Reach Spirit Transformation for the first time"), reward: 40, check: (_m, k) => k.maxRealm >= 5 },
  { id: 'do_kiep', name: tr('Độ Kiếp chân nhân', "Tribulation Adept"), desc: tr('Lần đầu đạt Độ Kiếp', "Reach Tribulation for the first time"), reward: 60, check: (_m, k) => k.maxRealm >= 7 },
  { id: 'phi_thang', name: tr('Bạch nhật phi thăng', "Ascension in Broad Daylight"), desc: tr('Phi thăng tiên giới lần đầu', "Ascend to the Immortal Realm for the first time"), reward: 100, check: (_m, k) => k.ascPaths.length >= 1 },
  { id: 'tam_dao', name: tr('Tam đạo phi thăng', "Three Paths to Ascension"), desc: tr('Phi thăng bằng 3 con đường khác nhau', "Ascend via 3 different Paths"), reward: 200, check: (_m, k) => k.ascPaths.length >= 3 },
  { id: 'luc_dao', name: tr('Lục đạo luân hồi', "Six Paths of Rebirth"), desc: tr('Từng đi đủ 6 con đường tu tập', "Have walked all 6 cultivation Paths"), reward: 60, check: (_m, k) => k.paths.length >= 6 },
  { id: 'tho_150', name: tr('Trường sinh', "Longevity"), desc: tr('Sống tới 150 tuổi', "Live to 150"), reward: 50, check: (_m, k) => k.maxAge >= 150 },
  { id: 'ket_cuc_10', name: tr('Nửa cuốn Sổ Sinh Tử', "Half the Book of Life and Death"), desc: tr('Mở 10 kết cục', "Unlock 10 endings"), reward: 40, check: (m) => nEnd(m) >= 10 },
  { id: 'ket_cuc_20', name: tr('Thấu hiểu sinh tử', "Master of Life and Death"), desc: tr('Mở 20 kết cục', "Unlock 20 endings"), reward: 100, check: (m) => nEnd(m) >= 20 },
  { id: 'linh_thu_10', name: tr('Vạn thú chi chủ', "Lord of Ten Thousand Beasts"), desc: tr('Từng nuôi 10 loài linh thú', "Have raised 10 kinds of spirit beasts"), reward: 50, check: (m) => (m.petBook?.length ?? 0) >= 10 },
  { id: 'than_binh_5', name: tr('Thần binh ngũ thế', "Divine Weapon of Five Lives"), desc: tr('Truyền một thần binh qua 5 kiếp', "Pass a divine weapon down through 5 lives"), reward: 60, check: (m) => (m.legend?.lv ?? 0) >= 5 },
  { id: 'bao_thu', name: tr('Có thù tất báo', "Every Grudge Repaid"), desc: tr('Báo thù được một người chơi khác', "Take revenge on another player"), reward: 30, check: (_m, k) => k.revenges >= 1 },
  { id: 'sat_than', name: tr('Giang hồ sát thần', "Death God of the Jianghu"), desc: tr('Thắng người chơi khác 10 lần', "Beat other players 10 times"), reward: 50, check: (_m, k) => k.duelWins >= 10 },
];

/** Cộng dồn số liệu sự nghiệp sau một kiếp và chấm thành tựu mới */
export function updateCareer(meta: Meta, c: Character): { career: Career; newly: Achievement[] } {
  const k0: Career = meta.career ?? { maxAge: 0, maxRealm: 0, ascPaths: [], paths: [], duelWins: 0, revenges: 0 };
  const career: Career = {
    maxAge: Math.max(k0.maxAge, Math.floor(c.age)),
    maxRealm: Math.max(k0.maxRealm, c.realm),
    ascPaths: c.ascended && c.path && !k0.ascPaths.includes(c.path) ? [...k0.ascPaths, c.path] : k0.ascPaths,
    paths: c.path && !k0.paths.includes(c.path) ? [...k0.paths, c.path] : k0.paths,
    duelWins: k0.duelWins + (c.qf?.duelWin ?? 0),
    revenges: k0.revenges + (c.qf?.revenge ?? 0),
    cosmoses: c.cosmos && !(k0.cosmoses ?? []).includes(c.cosmos) ? [...(k0.cosmoses ?? []), c.cosmos] : (k0.cosmoses ?? []),
    nhdClean: !!k0.nhdClean || (!!c.nhd?.done && !c.nhd?.lost),
  };
  const have = meta.achievements ?? [];
  const m2 = { ...meta, career };
  const newly = ACHIEVEMENTS.filter((a) => !have.includes(a.id) && a.check(m2, career));
  return { career, newly };
}

// ---------------- Mục tiêu ba kiếp đầu (3.2.0) ----------------
export interface NewbieGoal {
  life: number;
  name: string;
  reward: number; // phúc duyên, nhận khi luân hồi
  check: (c: Character) => boolean;
}
export const NEWBIE_GOALS: NewbieGoal[] = [
  { life: 1, name: tr('Lên Trúc Cơ', "Reach Foundation Establishment"), reward: 30, check: (c) => c.realm >= 2 },
  { life: 2, name: tr('Chọn con đường và sống qua 60 tuổi', "Choose a Path and live past 60"), reward: 30, check: (c) => !!c.path && c.age >= 60 },
  { life: 3, name: tr('Kết Kim Đan', "Form a Golden Core"), reward: 40, check: (c) => c.realm >= 3 },
];
export const newbieGoal = (c: Character) => NEWBIE_GOALS.find((g) => g.life === c.lifeNo) ?? null;
/** Kiểm tra mục tiêu kiếp đầu mỗi năm: đạt thì đánh dấu và trả câu báo */
export function checkNewbieGoal(c: Character): string | null {
  const g = newbieGoal(c);
  if (!g || c.goalDone || !g.check(c)) return null;
  c.goalDone = true;
  return tr(`Đạt mục tiêu kiếp ${c.lifeNo}: ${g.name}. Luân hồi xong sẽ nhận ${g.reward} phúc duyên.`, `Life ${c.lifeNo} goal reached: ${g.name}. You'll receive ${g.reward} Fortune after reincarnating.`);
}

// ---------------- Điểm danh 7 ngày (3.2.0) ----------------
/** Quà theo ngày trong chuỗi (lặp lại sau ngày 7). hon: Hồn lực; khi chưa có Hồn lực (dưới kiếp 15) đổi sang phúc duyên */
export interface CheckinGift {
  phuc?: number;
  hon?: number;
  honPhuc?: number; // phúc thay cho Hồn lực khi chưa mở Hồn lực
  money?: number; // linh thạch cho kiếp kế tiếp
  item?: string; // đồ cho kiếp kế tiếp
  label: string;
}
export const CHECKIN: CheckinGift[] = [
  { phuc: 10, label: tr('10 phúc', "10 Fortune") },
  { hon: 20, honPhuc: 10, label: tr('Tụ Hồn Đan', "Soul Gathering Pill") },
  { phuc: 20, label: tr('20 phúc', "20 Fortune") },
  { hon: 45, honPhuc: 20, label: tr('Dưỡng Hồn Đan', "Soul Nurturing Pill") },
  { phuc: 30, label: tr('30 phúc', "30 Fortune") },
  { money: 600, label: tr('600 linh thạch', "600 spirit stones") },
  { hon: 100, honPhuc: 40, item: 'ngoc_boi', label: tr('Hoàn Hồn Đan, ngọc bội', "Soul Return Pill, jade pendant") },
];
/** Ngày thứ mấy trong vòng 7 ngày (1-7) theo chuỗi hiện tại */
export const checkinDay = (meta: Meta) => (((meta.streak?.n ?? 1) - 1) % 7) + 1;
export const checkinClaimed = (meta: Meta, day: string = vnDay()) => meta.checkin === day;
