import { addCult, dao, hurt, money, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent } from './types';

/** Thú cưng: ảnh trong /public/lpc/pets/<id>.png, hàng 0 quay trái, hàng 1 quay phải */
export interface PetDef {
  name: string;
  w: number; // cỡ khung gốc
  h: number;
  n: number; // số khung
  fps: number;
  s: number; // tỉ lệ điểm ảnh so với nhân vật (nhỏ hơn 1 vì chạy phía sau, ở xa hơn)
  fly?: boolean;
  dur: number; // giây cho một vòng chạy qua lại
  meet: string; // câu kể lúc gặp
  filter?: string; // nhuộm màu biến thể
}

export const PETS: Record<string, PetDef> = {
  soi_con: { name: 'sói con', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Một con sói con bị thương nằm thoi thóp bên suối. Bạn băng bó cho nó, từ đó nó lẽo đẽo theo sau.' },
  ho_ly: { name: 'tiểu hồ ly', w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: 'Một con hồ ly đỏ bám theo bạn ba ngày liền, đuổi thế nào cũng không đi.' },
  tuyet_ho: { name: 'tuyết hồ', w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: 'Con hồ ly trắng như tuyết dụi đầu vào tay bạn rồi không chịu rời nữa.' },
  cho_vang: { name: 'chó vàng', w: 48, h: 48, n: 8, fps: 12, s: 0.6, dur: 7, meet: 'Con chó vàng lang thang đi theo bạn về nhà, vẫy đuôi rối rít.' },
  chuot_bach: { name: 'bạch thử', w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: 'Một con chuột bạch chui vào tay áo bạn ngủ. Từ đó bạn có thêm một miệng ăn.' },
  chuot_xam: { name: 'chuột xám', w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: 'Con chuột xám tinh khôn trộm bánh của bạn, bị bắt quả tang rồi ở lại luôn.' },
  nam_linh: { name: 'nấm linh', w: 32, h: 32, n: 4, fps: 6, s: 0.8, dur: 12, meet: 'Cây nấm sau nhà mọc chân, lạch bạch đi theo bạn như con vịt.' },
  dai_bang: { name: 'ưng con', w: 32, h: 32, n: 3, fps: 8, s: 0.85, fly: true, dur: 10, meet: 'Con ưng non rơi khỏi tổ được bạn nuôi lớn, giờ cứ bay lượn trên đầu bạn.' },
  doi: { name: 'dơi tinh', w: 64, h: 64, n: 7, fps: 12, s: 0.6, fly: true, dur: 7, meet: 'Một con dơi đen treo ngược ở xà nhà. Đêm nào nó cũng bay theo bạn.' },
  ong_vang: { name: 'kim phong', w: 32, h: 32, n: 6, fps: 12, s: 0.75, fly: true, dur: 9, meet: 'Con ong vàng to bằng ngón tay vo ve quanh bạn, chẳng bao giờ đốt.' },
  slime: { name: 'linh dịch', w: 64, h: 64, n: 8, fps: 8, s: 0.55, dur: 11, meet: 'Một khối linh dịch xanh nhảy tưng tưng theo bạn từ con suối linh khí.' },
  ran_con: { name: 'tiểu thanh xà', w: 64, h: 64, n: 7, fps: 8, s: 0.55, dur: 12, meet: 'Con rắn xanh nhỏ quấn lên cổ tay bạn như chiếc vòng, không chịu xuống.' },
  // ---- thêm 20 loài ----
  hac_lang: { name: 'hắc lang', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Con sói đen đầu đàn bị thợ săn bắn trọng thương, nằm chờ chết dưới gốc tùng.' },
  xich_lang: { name: 'xích lang', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Sói lông đỏ như lửa, nghe nói chỉ theo người có sát khí.', filter: 'saturate(1.6) hue-rotate(-12deg)' },
  bang_lang: { name: 'băng lang', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Sói băng ở Tuyết Vực, hơi thở đóng thành sương giá.', filter: 'grayscale(0.6) sepia(0.3) hue-rotate(170deg) saturate(1.8) brightness(1.35)' },
  bach_lang: { name: 'bạch lang', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Sói trắng như tuyết, mắt xanh biếc, chỉ xuất hiện đêm trăng tròn.', filter: 'grayscale(1) brightness(1.9) contrast(0.9)' },
  mai_loc: { name: 'mai hoa lộc', w: 64, h: 96, n: 4, fps: 7, s: 0.4, dur: 12, meet: 'Con hươu sao lông lốm đốm như hoa mai, đứng uống nước dưới trăng.' },
  kim_thu: { name: 'kim thử', w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: 'Con chuột lông vàng óng ôm một đồng tiền cổ, đi đến đâu tiền rơi đến đó.', filter: 'sepia(1) saturate(3) hue-rotate(-5deg) brightness(1.1)' },
  thuc_nhan_hoa: { name: 'thực nhân hoa', w: 128, h: 128, n: 3, fps: 4, s: 0.28, dur: 16, meet: 'Bông hoa ăn thịt trong vườn hoang, được bạn cho ăn thịt nên rễ nhổ lên đi theo.' },
  bach_xa: { name: 'bạch xà', w: 64, h: 64, n: 7, fps: 8, s: 0.55, dur: 12, meet: 'Con rắn trắng như ngọc cuộn mình bên tượng Phật, mắt long lanh như người.', filter: 'grayscale(1) brightness(1.8) contrast(0.9)' },
  tho_long: { name: 'thổ long', w: 64, h: 64, n: 4, fps: 6, s: 0.5, dur: 14, meet: 'Đào giếng gặp con giun đất to bằng bắp chân, nó chui ra quấn lấy bạn.' },
  tam_linh: { name: 'tằm linh', w: 64, h: 64, n: 3, fps: 5, s: 0.6, dur: 15, meet: 'Con tằm ăn lá dâu linh khí lớn dần, cứ bò theo bạn đòi ăn.' },
  thu_vuong: { name: 'thử vương', w: 80, h: 64, n: 8, fps: 12, s: 0.5, dur: 7, meet: 'Vua chuột trong kho thóc dẫn cả đàn đến quy phục bạn.' },
  xich_chi: { name: 'xích chi', w: 32, h: 32, n: 4, fps: 6, s: 0.8, dur: 12, meet: 'Cây nấm đỏ đốm trắng mọc chân, lạch bạch chạy theo bạn.' },
  hung_con: { name: 'hùng con', w: 64, h: 64, n: 5, fps: 7, s: 0.42, dur: 11, meet: 'Chú gấu đen con lạc mẹ, ôm chân bạn không chịu buông.' },
  tuyet_hung: { name: 'tuyết hùng', w: 64, h: 64, n: 5, fps: 7, s: 0.42, dur: 11, meet: 'Gấu trắng con ở Tuyết Vực, lông mềm như mây, ôm vào ấm cả mùa đông.' },
  su_tu_con: { name: 'sư tử con', w: 64, h: 64, n: 5, fps: 8, s: 0.42, dur: 10, meet: 'Sư tử con của thương đoàn Tây Vực, bờm mới nhú, gầm nghe như mèo.' },
  linh_loc: { name: 'linh lộc', w: 64, h: 96, n: 4, fps: 7, s: 0.4, dur: 12, meet: 'Con hươu sừng ngọc trong rừng sâu, ăn cỏ trong lòng bàn tay bạn.' },
  hoa_ho: { name: 'hỏa hồ', w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: 'Hồ ly đuôi lửa, đi qua đâu cỏ khô bén lửa đó.', filter: 'saturate(2) hue-rotate(-18deg) brightness(1.05) drop-shadow(0 0 3px #ff6a2a)' },
  hoa_linh_dich: { name: 'hỏa linh dịch', w: 64, h: 64, n: 8, fps: 8, s: 0.55, dur: 11, meet: 'Khối linh dịch đỏ rực từ miệng núi lửa, ấm như cục than hồng.', filter: 'hue-rotate(-120deg) saturate(1.6)' },
  huyet_buc: { name: 'huyết bức', w: 64, h: 64, n: 7, fps: 12, s: 0.6, fly: true, dur: 7, meet: 'Con dơi máu trong hang tối, chỉ uống máu của kẻ thù bạn.', filter: 'hue-rotate(110deg) saturate(2) brightness(0.9)' },
  bang_phong: { name: 'băng phong', w: 32, h: 32, n: 6, fps: 12, s: 0.75, fly: true, dur: 9, meet: 'Con ong băng từ tổ trên đỉnh tuyết, đốt ai người đó đóng băng.', filter: 'hue-rotate(170deg) saturate(1.3) brightness(1.2)' },
};
export const PET_IDS = Object.keys(PETS);
// loài chỉ nhận qua kịch bản riêng
const SPECIAL = ['soi_con', 'tuyet_ho', 'hac_lang', 'xich_lang', 'bang_lang', 'bach_lang', 'mai_loc', 'kim_thu', 'thuc_nhan_hoa', 'bach_xa', 'tho_long', 'tam_linh', 'thu_vuong', 'xich_chi', 'hung_con', 'tuyet_hung', 'su_tu_con', 'linh_loc', 'hoa_ho', 'hoa_linh_dich', 'huyet_buc', 'bang_phong'];

/** Loại thú cưng của nhân vật; nhân vật cũ chưa có thì suy từ hạt giống */
export function petOf(c: Pick<Character, 'petKind' | 'lookSeed' | 'name'>): string {
  if (c.petKind && PETS[c.petKind]) return c.petKind;
  let h = c.lookSeed ?? 0;
  if (!h) for (let i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) >>> 0;
  return PET_IDS[h % PET_IDS.length];
}

export function petName(c: Pick<Character, 'petKind' | 'lookSeed' | 'name'>): string {
  return PETS[petOf(c)].name;
}

/** Thú cưng gặp năm nay (cố định theo tuổi để lời kể và kết quả khớp nhau) */
function petThisYear(c: Character): string {
  const pool = PET_IDS.filter((p) => !SPECIAL.includes(p));
  return pool[((c.lookSeed ?? 7) + Math.floor(c.age) * 13) % pool.length];
}

export const PET_EVENT: GameEvent = {
  id: 'thu_cung',
  minAge: 6,
  weight: 7,
  once: true,
  when: (c) => !c.pet,
  title: 'Có đứa đi theo',
  text: (c) => PETS[petThisYear(c)].meet,
  choices: (c) => {
    const id = petThisYear(c);
    const p = PETS[id];
    return [
      { label: `Nhận nuôi ${p.name}`, lean: 'chinh', run: (ch, ctx) => { ch.pet = true; ch.petKind = id; dao(ch, 3); stat(ch, 'tamCanh', 5); ctx.fx('love', 'Có thú cưng'); return `Từ nay ${p.name} chạy theo bạn khắp nơi.`; } },
      { label: 'Cho ăn rồi đuổi đi', lean: 'trung', run: (ch) => { stat(ch, 'khiVan', 2); return `${p.name[0].toUpperCase() + p.name.slice(1)} ăn xong, ngoái nhìn bạn rồi đi mất.`; } },
      { label: 'Bắt đem bán', lean: 'ta', run: (ch) => { dao(ch, -3); money(ch, 25); return `Bạn bán ${p.name} được 25 linh thạch. Đêm đó bạn nằm mơ thấy nó.`; } },
    ];
  },
};

// ---------- Kịch bản nhận thú cưng ----------
export function adopt(ch: Character, id: string, ctx: EffectCtx): string {
  const old = ch.pet ? PETS[petOf(ch)]?.name : null;
  ch.pet = true;
  ch.petKind = id;
  ctx.fx('love', 'Có thú cưng');
  return old && old !== PETS[id].name ? ` Con ${old} ghen tị, bỏ vào rừng không về.` : '';
}

interface PetStory {
  id: string;
  title: string;
  minAge?: number;
  weight?: number;
  when?: (c: Character) => boolean;
  pick: (c: Character) => string; // chọn loài theo hoàn cảnh
  text: (c: Character, pet: PetDef) => string;
  adoptLabel: string;
  adoptText: (pet: PetDef) => string;
  other: Choice; // lựa chọn khác (thả, cho ăn...)
  evil: Choice; // lựa chọn tà
}

const snow = (c: Character) => c.region === 'tuyet_vuc' || c.region === 'bac_mac';

const STORIES: PetStory[] = [
  {
    id: 'pet_soi_trang', title: 'Đêm trăng sói tru', minAge: 10, weight: 5,
    pick: (c) => (snow(c) ? (c.lookSeed ?? 0) % 2 ? 'bang_lang' : 'bach_lang' : c.daoTam <= -30 ? 'xich_lang' : 'hac_lang'),
    text: (_c, p) => `Đêm trăng tròn, tiếng sói tru vọng từ núi. ${p.meet}`,
    adoptLabel: 'Băng bó, đưa về nuôi', adoptText: (p) => `Từ đêm ấy, ${p.name} chạy theo bạn như cái bóng.`,
    other: { label: 'Để lại ít thịt rồi đi', lean: 'chinh', run: (ch) => { stat(ch, 'khiVan', 2); return 'Sáng hôm sau, dưới cửa nhà có một con thỏ rừng.'; } },
    evil: { label: 'Lột da bán', lean: 'ta', run: (ch) => { dao(ch, -6); money(ch, 60); return 'Da sói bán được giá. Đêm đó cả bầy tru quanh nhà bạn.'; } },
  },
  {
    id: 'pet_mieu_hoang', title: 'Bạch xà trong miếu', minAge: 10, weight: 4,
    pick: () => 'bach_xa',
    text: (_c, p) => `Trú mưa trong miếu cổ ven hồ. ${p.meet}`,
    adoptLabel: 'Đưa tay cho nó quấn', adoptText: () => 'Bạch xà quấn lên cổ tay bạn như chiếc vòng ngọc. Từ đó không rời.',
    other: { label: 'Thắp nhang rồi đi', lean: 'chinh', run: (ch) => { dao(ch, 3); stat(ch, 'tamCanh', 4); return 'Bạch xà gật đầu ba cái như lạy tạ.'; } },
    evil: { label: 'Bắt lấy mật rắn', lean: 'ta', run: (ch) => { dao(ch, -8); addCult(ch, reward(ch, 0.2)); stat(ch, 'tamMa', 6); return 'Mật rắn trắng đắng ngắt. Đêm ấy mưa to, như trời khóc.'; } },
  },
  {
    id: 'pet_gieng_co', title: 'Đồng tiền dưới giếng', minAge: 8, weight: 3,
    pick: () => 'kim_thu',
    text: (_c, p) => `Thả gàu xuống giếng cổ, kéo lên toàn tiền xu. ${p.meet}`,
    adoptLabel: 'Nuôi nó', adoptText: () => 'Kim thử chui vào túi bạn, thỉnh thoảng nhả ra một đồng tiền.',
    other: { label: 'Thả lại xuống giếng', lean: 'chinh', run: (ch) => { stat(ch, 'khiVan', 3); return 'Đêm đó bạn mơ thấy thần tài.'; } },
    evil: { label: 'Vét sạch tiền trong giếng', lean: 'ta', run: (ch) => { dao(ch, -3); money(ch, 60); return 'Bạn vét được một túi tiền. Giếng từ đó cạn khô.'; } },
  },
  {
    id: 'pet_vuon_hoang', title: 'Vườn hoang', minAge: 12, weight: 3,
    pick: () => 'thuc_nhan_hoa',
    text: (_c, p) => `Trong vườn hoang có tiếng răng nghiến ken két. ${p.meet}`,
    adoptLabel: 'Cho ăn, mang về', adoptText: () => 'Thực nhân hoa ngoan như mèo, chỉ hơi tốn thịt.',
    other: { label: 'Tưới nước rồi đi', lean: 'chinh', run: (ch) => { stat(ch, 'tamCanh', 3); return 'Bông hoa khẽ nghiêng mình như cảm ơn.'; } },
    evil: { label: 'Nhổ lấy rễ luyện độc', lean: 'ta', run: (ch) => { dao(ch, -4); money(ch, 40); return 'Rễ hoa luyện ra thứ độc không màu không mùi.'; } },
  },
  {
    id: 'pet_trung_thu', title: 'Đêm trăng bên suối', minAge: 8, weight: 4,
    pick: () => 'mai_loc',
    text: (_c, p) => `Đêm Trung Thu, bạn ra suối ngắm trăng. ${p.meet}`,
    adoptLabel: 'Chìa tay mời nó lại gần', adoptText: () => 'Mai hoa lộc dụi đầu vào tay bạn rồi lững thững đi theo.',
    other: { label: 'Ngồi yên ngắm nó', lean: 'chinh', run: (ch) => { stat(ch, 'tamCanh', 5); return 'Trăng, suối, hươu sao. Lòng bạn tĩnh lặng lạ thường.'; } },
    evil: { label: 'Giương cung săn', lean: 'ta', run: (ch) => { dao(ch, -5); money(ch, 50); return 'Nhung hươu bán được giá. Suối ấy từ đó không ai thấy hươu nữa.'; } },
  },
  {
    id: 'pet_dao_gieng', title: 'Đào giếng, nuôi tằm', minAge: 8, weight: 4,
    pick: (c) => ((c.lookSeed ?? 0) % 2 ? 'tho_long' : 'tam_linh'),
    text: (_c, p) => p.meet,
    adoptLabel: 'Giữ lại nuôi', adoptText: (p) => `${p.name[0].toUpperCase() + p.name.slice(1)} bò quanh chân bạn, chẳng chịu rời.`,
    other: { label: 'Thả về đồng', lean: 'trung', run: (ch) => { stat(ch, 'tamCanh', 2); return 'Mùa ấy lúa nhà bạn tốt bất thường.'; } },
    evil: { label: 'Đem làm mồi câu', lean: 'ta', run: (ch) => { dao(ch, -2); money(ch, 15); return 'Câu được con cá chép đỏ to, bán được giá.'; } },
  },
  {
    id: 'pet_kho_thoc', title: 'Kho thóc', minAge: 8, weight: 4,
    pick: (c) => ((c.familyTier ?? 1) <= 1 ? 'thu_vuong' : 'xich_chi'),
    text: (_c, p) => `Dọn kho thóc sau nhà. ${p.meet}`,
    adoptLabel: 'Nhận làm bạn', adoptText: (p) => `Từ đó ${p.name} theo bạn khắp nơi, kho thóc cũng chẳng mất hạt nào.`,
    other: { label: 'Đuổi đi', lean: 'trung', run: () => 'Nó chạy mất, để lại một hạt thóc vàng óng.' },
    evil: { label: 'Đặt bẫy diệt sạch', lean: 'ta', run: (ch) => { dao(ch, -3); money(ch, 10); return 'Kho sạch sẽ. Nhưng mùa sau rắn kéo đến.'; } },
  },
  {
    id: 'pet_gau_con', title: 'Gấu con lạc mẹ', minAge: 10, weight: 4,
    pick: (c) => (snow(c) ? 'tuyet_hung' : 'hung_con'),
    text: (_c, p) => `Trong rừng sâu có tiếng rên ư ử. ${p.meet}`,
    adoptLabel: 'Nhận nuôi', adoptText: (p) => `${p.name[0].toUpperCase() + p.name.slice(1)} lớn nhanh như thổi, ăn bằng ba người.`,
    other: { label: 'Đưa về hang mẹ', lean: 'chinh', run: (ch, ctx) => { dao(ch, 5); if (ctx.rnd() < 0.3) return 'Gấu mẹ tưởng bạn bắt con nó, đuổi bạn chạy trối chết.' + hurt(ch, 15, ctx); stat(ch, 'khiVan', 3); return 'Gấu mẹ liếm con rồi nhìn bạn rất lâu. Bạn thấy lòng nhẹ bẫng.'; } },
    evil: { label: 'Lấy mật gấu', lean: 'ta', run: (ch) => { dao(ch, -10); money(ch, 120); stat(ch, 'tamMa', 6); return 'Mật gấu bán được giá cao. Tiếng gấu mẹ gào cả đêm.'; } },
  },
  {
    id: 'pet_thuong_doan', title: 'Thương đoàn Tây Vực', minAge: 10, weight: 3,
    pick: (c) => (c.region === 'tay_vuc' || c.region === 'bac_mac' ? 'su_tu_con' : (c.lookSeed ?? 0) % 2 ? 'su_tu_con' : 'linh_loc'),
    text: (_c, p) => `Thương đoàn từ phương xa dừng chân trong trấn, đem theo thú lạ. ${p.meet}`,
    adoptLabel: 'Mua về nuôi (-80 linh thạch)', adoptText: (p) => `Bạn trả tiền, dắt ${p.name} về. Cả trấn kéo đến xem.`,
    other: { label: 'Chỉ đứng xem', lean: 'trung', run: (ch) => { stat(ch, 'ngoTinh', 1); return 'Bạn nghe thương nhân kể chuyện xứ cát vàng đến tận khuya.'; } },
    evil: { label: 'Đêm lẻn vào trộm', lean: 'ta', run: (ch, ctx) => { dao(ch, -6); if (ctx.rnd() < 0.5) return 'Bị lính canh phát hiện, đánh cho một trận.' + hurt(ch, 20, ctx); money(ch, 100); return 'Bạn trộm được hàng, bán lại cho chợ đen.'; } },
  },
  {
    id: 'pet_hoa_son', title: 'Núi lửa', minAge: 14, weight: 3,
    pick: (c) => ((c.lookSeed ?? 0) % 2 ? 'hoa_ho' : 'hoa_linh_dich'),
    text: (_c, p) => `Đi qua chân núi lửa, đá còn nóng bỏng. ${p.meet}`,
    adoptLabel: 'Thu phục', adoptText: (p) => `${p.name[0].toUpperCase() + p.name.slice(1)} nằm gọn bên chân bạn, sưởi ấm cả mùa đông.`,
    other: { label: 'Né đi đường khác', lean: 'trung', run: () => 'Nó nhìn theo bạn rất lâu.' },
    evil: { label: 'Bắt lấy hỏa tinh luyện đan', lean: 'ta', run: (ch) => { dao(ch, -5); addCult(ch, reward(ch, 0.2)); return 'Lò đan bùng lửa đỏ rực. Đan thành, tu vi tăng.'; } },
  },
  {
    id: 'pet_hang_toi', title: 'Hang tối, tổ băng', minAge: 12, weight: 3,
    pick: (c) => (c.daoTam <= -20 ? 'huyet_buc' : snow(c) ? 'bang_phong' : (c.lookSeed ?? 0) % 2 ? 'huyet_buc' : 'bang_phong'),
    text: (_c, p) => p.meet,
    adoptLabel: 'Nhận làm linh sủng', adoptText: (p) => `${p.name[0].toUpperCase() + p.name.slice(1)} bay vòng quanh đầu bạn, không cho ai đến gần.`,
    other: { label: 'Rời đi lặng lẽ', lean: 'trung', run: () => 'Bạn rời đi, không ngoảnh lại.' },
    evil: { label: 'Phá tổ lấy độc', lean: 'ta', run: (ch) => { dao(ch, -4); money(ch, 50); return 'Lấy được ít độc dịch quý, đổi được linh thạch.'; } },
  },
];

export const PET_STORIES: GameEvent[] = STORIES.map((st) => ({
  id: st.id,
  minAge: st.minAge,
  weight: st.weight ?? 3,
  once: true,
  when: st.when,
  title: st.title,
  text: (c) => st.text(c, PETS[st.pick(c)]),
  choices: (c) => {
    const id = st.pick(c);
    const p = PETS[id];
    return [
      { label: st.adoptLabel, lean: 'chinh', run: (ch, ctx) => { if (st.id === 'pet_thuong_doan') money(ch, -80); const note = adopt(ch, id, ctx); dao(ch, 2); return st.adoptText(p) + note; } },
      st.other,
      st.evil,
    ];
  },
}));
