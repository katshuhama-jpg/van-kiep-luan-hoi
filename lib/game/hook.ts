import { ENDINGS } from './endings';
import type { Career, Character, Meta } from './types';

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
  { id: 'linh_khi', name: 'Linh khí triều dâng', desc: 'Linh khí trời đất dồi dào: ai tu luyện cũng nhanh hơn 15%.', icon: '☁', nghi: 'Bế quan, tu luyện', ky: 'Bỏ phí thời gian' },
  { id: 'huyet_nguyet', name: 'Huyết nguyệt', desc: 'Trăng máu treo cao: tà tu tu luyện nhanh hơn 25%, chính đạo chậm đi một chút.', icon: '◐', nghi: 'Tà công, sát phạt', ky: 'Đi đêm, tin người lạ' },
  { id: 'phat_quang', name: 'Phật quang phổ chiếu', desc: 'Chính đạo tu luyện nhanh hơn 20%, tâm ma ai cũng tăng chậm hơn.', icon: '☸', nghi: 'Hành thiện, tĩnh tọa', ky: 'Sát sinh' },
  { id: 'cat_tinh', name: 'Cát tinh chiếu mệnh', desc: 'Sao lành soi xuống: hạ quái dễ rơi đồ xịn gấp rưỡi.', icon: '✦', nghi: 'Trừ yêu, tìm bảo vật', ky: 'Ngồi không' },
  { id: 'yeu_trieu', name: 'Yêu triều', desc: 'Yêu ma tràn khỏi núi: quái chặn đường nhiều gấp đôi, hạ được thì nhiều tu vi hơn.', icon: '☠', nghi: 'Trừ yêu luyện công', ky: 'Đi đường một mình' },
  { id: 'giang_ho_loan', name: 'Giang hồ đại loạn', desc: 'Võ lâm dậy sóng: gặp người chơi khác nhiều gấp đôi.', icon: '⚔', nghi: 'Luận võ, báo thù', ky: 'Uống trà với người lạ' },
  { id: 'loi_van', name: 'Lôi vân tụ đỉnh', desc: 'Mây sấm vần vũ: đột phá cảnh giới dễ hơn 6%.', icon: '⚡', nghi: 'Đột phá, độ kiếp', ky: 'Chần chừ' },
];

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
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
  return { money, khiVan, item, text: `Chuỗi tu luyện ${n} ngày: +${money} linh thạch${khiVan ? `, khí vận +${khiVan}` : ''}${item ? ', ngọc bội hộ thân' : ''}.` };
}

// ---------------- Nhiệm vụ ngày ----------------
export interface Quest {
  id: string;
  name: string;
  check: (c: Character, newEnding: boolean) => boolean;
}
const kills = (c: Character) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0);
export const QUESTS: Quest[] = [
  { id: 'song_80', name: 'Sống qua 80 tuổi', check: (c) => c.age >= 80 },
  { id: 'kim_dan', name: 'Kết Kim Đan', check: (c) => c.realm >= 3 },
  { id: 'nguyen_anh', name: 'Đạt Nguyên Anh', check: (c) => c.realm >= 4 },
  { id: 'thang_nguoi', name: 'Thắng một người chơi khác trong kỳ ngộ', check: (c) => (c.qf?.duelWin ?? 0) >= 1 },
  { id: 'chan_duong', name: 'Hạ 3 con quái chặn đường', check: (c) => (c.qf?.ambushWin ?? 0) >= 3 },
  { id: 'tram_yeu', name: 'Trảm 20 yêu quái trong một đời', check: (c) => kills(c) >= 20 },
  { id: 'nuoi_thu', name: 'Nuôi một linh thú', check: (c) => !!c.pet },
  { id: 'ket_duyen', name: 'Kết thành đạo lữ', check: (c) => !!c.partner },
  { id: 'phu_ho', name: 'Có 1.500 linh thạch', check: (c) => c.linhThach >= 1500 },
  { id: 'ket_cuc_moi', name: 'Mở một kết cục mới trong Sổ Sinh Tử', check: (_c, n) => n },
  { id: 'uong_tra', name: 'Uống trà với đồng đạo mà sống sót', check: (c) => (c.qf?.teaSurvive ?? 0) >= 1 },
  { id: 'chinh_dao', name: 'Đạo tâm chính trực từ 50 trở lên', check: (c) => c.daoTam >= 50 },
  { id: 'ta_dao', name: 'Đạo tâm tà ác từ -50 trở xuống', check: (c) => c.daoTam <= -50 },
  { id: 'bao_vat_moi', name: 'Có được một món đồ ẩn chưa từng thấy', check: (c) => (c.qf?.newItem ?? 0) >= 1 },
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
    text: 'Tiên tịch đã bị tước, nhưng ký ức tiên nhân vẫn còn. Kiếp sau, ngươi sẽ nhớ.',
    done: 'Lời tiên tri ứng nghiệm: bạn sinh ra với ký ức của một vị tiên bị giáng trần (ngộ tính +25, khí vận +15, tu luyện nhanh từ nhỏ).',
    apply: (c) => {
      c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 25);
      c.stats.khiVan = Math.min(100, c.stats.khiVan + 15);
      c.linhCanMul = Math.max(c.linhCanMul, 1.6);
    },
  },
  {
    id: 'chuyen_the',
    text: 'Một tia linh thức đã gói ghém những gì ngươi ngộ ra. Kiếp sau, nó sẽ tìm về.',
    done: 'Lời tiên tri ứng nghiệm: tia linh thức kiếp trước tìm về (ngộ tính +20, linh căn ít nhất Địa, tâm cảnh +10).',
    apply: (c) => {
      c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 20);
      c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 10);
      c.linhCanMul = Math.max(c.linhCanMul, 1.5);
    },
  },
  {
    id: 'phuc_bao',
    text: 'Cho đi cả đời công lực, phúc báo sẽ theo ngươi sang kiếp sau.',
    done: 'Lời tiên tri ứng nghiệm: phúc báo của kiếp trước (khí vận +20, sức khỏe +10, +300 linh thạch).',
    apply: (c) => {
      c.stats.khiVan = Math.min(100, c.stats.khiVan + 20);
      c.stats.sucKhoe = Math.min(100, c.stats.sucKhoe + 10);
      c.linhThach += 300;
    },
  },
  {
    id: 'tho',
    text: 'Kiếp sau, ngươi sẽ sống lâu hơn người thường.',
    done: 'Lời tiên tri ứng nghiệm: thọ nguyên của bạn dài hơn người thường.',
    apply: (c) => (c.lifespan = Math.round(c.lifespan * 1.15)),
  },
  {
    id: 'ngo',
    text: 'Kiếp sau, ngươi vừa sinh ra đã thông tuệ hơn người.',
    done: 'Lời tiên tri ứng nghiệm: bạn sáng dạ lạ thường (ngộ tính +15).',
    apply: (c) => (c.stats.ngoTinh = Math.min(100, c.stats.ngoTinh + 15)),
  },
  {
    id: 'van',
    text: 'Kiếp sau, sao lành sẽ chiếu mệnh ngươi.',
    done: 'Lời tiên tri ứng nghiệm: sao lành chiếu mệnh (khí vận +15).',
    apply: (c) => (c.stats.khiVan = Math.min(100, c.stats.khiVan + 15)),
  },
  { id: 'phu', text: 'Kiếp sau, ngươi sinh ra trong nhung lụa.', done: 'Lời tiên tri ứng nghiệm: nhà bạn có của ăn của để (+400 linh thạch).', apply: (c) => (c.linhThach += 400) },
  { id: 'kiep', text: 'Kiếp sau, ngươi sẽ gặp lại kẻ đã giết ngươi.', done: 'Lời tiên tri ứng nghiệm: trong mơ bạn thấy lại kẻ thù kiếp trước. Hắn vẫn còn ở giang hồ.', apply: () => {} },
  {
    id: 'tam_ma',
    text: 'Kiếp sau, tâm ngươi sẽ tĩnh như mặt hồ.',
    done: 'Lời tiên tri ứng nghiệm: tâm bạn tĩnh lặng lạ thường (tâm cảnh +15, tâm ma giảm).',
    apply: (c) => ((c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 15)), (c.stats.tamMa = Math.max(0, c.stats.tamMa - 10))),
  },
  {
    id: 'than_luc',
    text: 'Kiếp sau, ngươi sinh ra đã có sức trâu.',
    done: 'Lời tiên tri ứng nghiệm: bạn khỏe như trâu từ nhỏ (sức khỏe +15).',
    apply: (c) => (c.stats.sucKhoe = Math.min(100, c.stats.sucKhoe + 15)),
  },
  {
    id: 'hung',
    text: 'Kiếp sau, ngươi sẽ trả nợ cho những gì đã làm. Hãy cẩn thận.',
    done: 'Lời tiên tri ứng nghiệm: nghiệp cũ đeo bám (khí vận -10), nhưng ý chí bạn sắt đá hơn (tâm cảnh +10).',
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
  { id: 'kiep_10', name: 'Thập thế luân hồi', desc: 'Trải qua 10 kiếp', reward: 20, check: (m) => m.lives >= 10 },
  { id: 'kiep_50', name: 'Ngũ thập thế', desc: 'Trải qua 50 kiếp', reward: 60, check: (m) => m.lives >= 50 },
  { id: 'kiep_100', name: 'Bách thế bất diệt', desc: 'Trải qua 100 kiếp', reward: 150, check: (m) => m.lives >= 100 },
  { id: 'nguyen_anh', name: 'Nguyên Anh xuất khiếu', desc: 'Lần đầu đạt Nguyên Anh', reward: 20, check: (_m, k) => k.maxRealm >= 4 },
  { id: 'hoa_than', name: 'Hóa Thần đại năng', desc: 'Lần đầu đạt Hóa Thần', reward: 40, check: (_m, k) => k.maxRealm >= 5 },
  { id: 'do_kiep', name: 'Độ Kiếp chân nhân', desc: 'Lần đầu đạt Độ Kiếp', reward: 60, check: (_m, k) => k.maxRealm >= 7 },
  { id: 'phi_thang', name: 'Bạch nhật phi thăng', desc: 'Phi thăng tiên giới lần đầu', reward: 100, check: (_m, k) => k.ascPaths.length >= 1 },
  { id: 'tam_dao', name: 'Tam đạo phi thăng', desc: 'Phi thăng bằng 3 con đường khác nhau', reward: 200, check: (_m, k) => k.ascPaths.length >= 3 },
  { id: 'luc_dao', name: 'Lục đạo luân hồi', desc: 'Từng đi đủ 6 con đường tu tập', reward: 60, check: (_m, k) => k.paths.length >= 6 },
  { id: 'tho_150', name: 'Trường sinh', desc: 'Sống tới 150 tuổi', reward: 50, check: (_m, k) => k.maxAge >= 150 },
  { id: 'ket_cuc_10', name: 'Nửa cuốn Sổ Sinh Tử', desc: 'Mở 10 kết cục', reward: 40, check: (m) => nEnd(m) >= 10 },
  { id: 'ket_cuc_20', name: 'Thấu hiểu sinh tử', desc: 'Mở 20 kết cục', reward: 100, check: (m) => nEnd(m) >= 20 },
  { id: 'linh_thu_10', name: 'Vạn thú chi chủ', desc: 'Từng nuôi 10 loài linh thú', reward: 50, check: (m) => (m.petBook?.length ?? 0) >= 10 },
  { id: 'than_binh_5', name: 'Thần binh ngũ thế', desc: 'Truyền một thần binh qua 5 kiếp', reward: 60, check: (m) => (m.legend?.lv ?? 0) >= 5 },
  { id: 'bao_thu', name: 'Có thù tất báo', desc: 'Báo thù được một người chơi khác', reward: 30, check: (_m, k) => k.revenges >= 1 },
  { id: 'sat_than', name: 'Giang hồ sát thần', desc: 'Thắng người chơi khác 10 lần', reward: 50, check: (_m, k) => k.duelWins >= 10 },
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
  };
  const have = meta.achievements ?? [];
  const m2 = { ...meta, career };
  const newly = ACHIEVEMENTS.filter((a) => !have.includes(a.id) && a.check(m2, career));
  return { career, newly };
}
