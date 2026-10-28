import { addCult, dao, hurt, money, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

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
  soi_con: { name: tr('sói con', "wolf cub"), w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: tr('Một con sói con bị thương nằm thoi thóp bên suối. Bạn băng bó cho nó, từ đó nó lẽo đẽo theo sau.', "A wounded wolf cub lies gasping by the stream. You bandage it, and from then on it trots along behind you.") },
  ho_ly: { name: tr('tiểu hồ ly', "little fox"), w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: tr('Một con hồ ly đỏ bám theo bạn ba ngày liền, đuổi thế nào cũng không đi.', "A red fox trails you for three days straight and refuses to be chased off.") },
  tuyet_ho: { name: tr('tuyết hồ', "snow fox"), w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: tr('Con hồ ly trắng như tuyết dụi đầu vào tay bạn rồi không chịu rời nữa.', "A snow-white fox nuzzles your hand and will not leave you again.") },
  cho_vang: { name: tr('chó vàng', "yellow dog"), w: 48, h: 48, n: 8, fps: 12, s: 0.6, dur: 7, meet: tr('Con chó vàng lang thang đi theo bạn về nhà, vẫy đuôi rối rít.', "A stray yellow dog follows you home, wagging its tail like mad.") },
  chuot_bach: { name: tr('bạch thử', "white mouse"), w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: tr('Một con chuột bạch chui vào tay áo bạn ngủ. Từ đó bạn có thêm một miệng ăn.', "A white mouse crawls into your sleeve to sleep. Now you have one more mouth to feed.") },
  chuot_xam: { name: tr('chuột xám', "grey rat"), w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: tr('Con chuột xám tinh khôn trộm bánh của bạn, bị bắt quả tang rồi ở lại luôn.', "A clever grey rat steals your bun, gets caught red-handed, and simply stays.") },
  nam_linh: { name: tr('nấm linh', "spirit mushroom"), w: 32, h: 32, n: 4, fps: 6, s: 0.8, dur: 12, meet: tr('Cây nấm sau nhà mọc chân, lạch bạch đi theo bạn như con vịt.', "The mushroom behind your house grows legs and waddles after you like a duckling.") },
  dai_bang: { name: tr('ưng con', "eaglet"), w: 32, h: 32, n: 3, fps: 8, s: 0.85, fly: true, dur: 10, meet: tr('Con ưng non rơi khỏi tổ được bạn nuôi lớn, giờ cứ bay lượn trên đầu bạn.', "An eaglet that fell from its nest, raised by you, now keeps circling above your head.") },
  doi: { name: tr('dơi tinh', "bat spirit"), w: 64, h: 64, n: 7, fps: 12, s: 0.6, fly: true, dur: 7, meet: tr('Một con dơi đen treo ngược ở xà nhà. Đêm nào nó cũng bay theo bạn.', "A black bat hangs upside down from the rafters. Every night it flies after you.") },
  ong_vang: { name: tr('kim phong', "golden bee"), w: 32, h: 32, n: 6, fps: 12, s: 0.75, fly: true, dur: 9, meet: tr('Con ong vàng to bằng ngón tay vo ve quanh bạn, chẳng bao giờ đốt.', "A golden bee as big as a finger buzzes around you and never stings.") },
  slime: { name: tr('linh dịch', "spirit slime"), w: 64, h: 64, n: 8, fps: 8, s: 0.55, dur: 11, meet: tr('Một khối linh dịch xanh nhảy tưng tưng theo bạn từ con suối linh khí.', "A blob of green spirit slime bounces after you from a spirit spring.") },
  ran_con: { name: tr('tiểu thanh xà', "little green snake"), w: 64, h: 64, n: 7, fps: 8, s: 0.55, dur: 12, meet: tr('Con rắn xanh nhỏ quấn lên cổ tay bạn như chiếc vòng, không chịu xuống.', "A small green snake coils around your wrist like a bangle and won't come off.") },
  // ---- thêm 20 loài ----
  hac_lang: { name: tr('hắc lang', "black wolf"), w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: tr('Con sói đen đầu đàn bị thợ săn bắn trọng thương, nằm chờ chết dưới gốc tùng.', "A black alpha wolf, badly wounded by hunters, lies dying under a pine.") },
  xich_lang: { name: tr('xích lang', "red wolf"), w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: tr('Sói lông đỏ như lửa, nghe nói chỉ theo người có sát khí.', "A wolf with fire-red fur, said to follow only those with killing intent."), filter: 'saturate(1.6) hue-rotate(-12deg)' },
  bang_lang: {
    name: tr('băng lang', "ice wolf"),
    w: 64,
    h: 32,
    n: 5,
    fps: 9,
    s: 0.6,
    dur: 9,
    meet: tr('Sói băng ở Tuyết Vực, hơi thở đóng thành sương giá.', "An ice wolf of Xueyu whose breath turns to frost."),
    filter: 'grayscale(0.6) sepia(0.3) hue-rotate(170deg) saturate(1.8) brightness(1.35)',
  },
  bach_lang: {
    name: tr('bạch lang', "white wolf"),
    w: 64,
    h: 32,
    n: 5,
    fps: 9,
    s: 0.6,
    dur: 9,
    meet: tr('Sói trắng như tuyết, mắt xanh biếc, chỉ xuất hiện đêm trăng tròn.', "A snow-white wolf with jade-blue eyes, seen only on full-moon nights."),
    filter: 'grayscale(1) brightness(1.9) contrast(0.9)',
  },
  mai_loc: { name: tr('mai hoa lộc', "plum-blossom deer"), w: 64, h: 96, n: 4, fps: 7, s: 0.4, dur: 12, meet: tr('Con hươu sao lông lốm đốm như hoa mai, đứng uống nước dưới trăng.', "A sika deer with fur spotted like plum blossoms, drinking under the moon.") },
  kim_thu: {
    name: tr('kim thử', "golden rat"),
    w: 32,
    h: 32,
    n: 3,
    fps: 10,
    s: 0.8,
    dur: 6,
    meet: tr('Con chuột lông vàng óng ôm một đồng tiền cổ, đi đến đâu tiền rơi đến đó.', "A golden-furred rat hugging an ancient coin; wherever it goes, money falls."),
    filter: 'sepia(1) saturate(3) hue-rotate(-5deg) brightness(1.1)',
  },
  thuc_nhan_hoa: { name: tr('thực nhân hoa', "man-eating flower"), w: 128, h: 128, n: 3, fps: 4, s: 0.28, dur: 16, meet: tr('Bông hoa ăn thịt trong vườn hoang, được bạn cho ăn thịt nên rễ nhổ lên đi theo.', "A carnivorous flower in an abandoned garden. You fed it meat, so it pulled up its roots to follow you.") },
  bach_xa: {
    name: tr('bạch xà', "white snake"),
    w: 64,
    h: 64,
    n: 7,
    fps: 8,
    s: 0.55,
    dur: 12,
    meet: tr('Con rắn trắng như ngọc cuộn mình bên tượng Phật, mắt long lanh như người.', "A jade-white snake coiled beside a Buddha statue, its eyes glistening like a person's."),
    filter: 'grayscale(1) brightness(1.8) contrast(0.9)',
  },
  tho_long: { name: tr('thổ long', "earth dragon"), w: 64, h: 64, n: 4, fps: 6, s: 0.5, dur: 14, meet: tr('Đào giếng gặp con giun đất to bằng bắp chân, nó chui ra quấn lấy bạn.', "Digging a well, you find an earthworm as thick as a calf. It crawls out and wraps around you.") },
  tam_linh: { name: tr('tằm linh', "spirit silkworm"), w: 64, h: 64, n: 3, fps: 5, s: 0.6, dur: 15, meet: tr('Con tằm ăn lá dâu linh khí lớn dần, cứ bò theo bạn đòi ăn.', "A silkworm fed on spirit mulberry leaves keeps growing and crawls after you begging for food.") },
  thu_vuong: { name: tr('thử vương', "rat king"), w: 80, h: 64, n: 8, fps: 12, s: 0.5, dur: 7, meet: tr('Vua chuột trong kho thóc dẫn cả đàn đến quy phục bạn.', "The king of the granary rats leads his whole horde to submit to you.") },
  xich_chi: { name: tr('xích chi', "red lingzhi"), w: 32, h: 32, n: 4, fps: 6, s: 0.8, dur: 12, meet: tr('Cây nấm đỏ đốm trắng mọc chân, lạch bạch chạy theo bạn.', "A red mushroom with white spots grows legs and toddles after you.") },
  hung_con: { name: tr('hùng con', "bear cub"), w: 64, h: 64, n: 5, fps: 7, s: 0.42, dur: 11, meet: tr('Chú gấu đen con lạc mẹ, ôm chân bạn không chịu buông.', "A black bear cub that lost its mother hugs your leg and won't let go.") },
  tuyet_hung: { name: tr('tuyết hùng', "snow bear"), w: 64, h: 64, n: 5, fps: 7, s: 0.42, dur: 11, meet: tr('Gấu trắng con ở Tuyết Vực, lông mềm như mây, ôm vào ấm cả mùa đông.', "A white bear cub of Xueyu, fur soft as clouds; hug it and you stay warm all winter.") },
  su_tu_con: { name: tr('sư tử con', "lion cub"), w: 64, h: 64, n: 5, fps: 8, s: 0.42, dur: 10, meet: tr('Sư tử con của thương đoàn Tây Vực, bờm mới nhú, gầm nghe như mèo.', "A lion cub from a Xiyu caravan; its mane is just sprouting and its roar sounds like a cat.") },
  linh_loc: { name: tr('linh lộc', "spirit deer"), w: 64, h: 96, n: 4, fps: 7, s: 0.4, dur: 12, meet: tr('Con hươu sừng ngọc trong rừng sâu, ăn cỏ trong lòng bàn tay bạn.', "A jade-antlered deer deep in the forest, eating grass from your palm.") },
  hoa_ho: {
    name: tr('hỏa hồ', "fire fox"),
    w: 64,
    h: 64,
    n: 4,
    fps: 8,
    s: 0.55,
    dur: 8,
    meet: tr('Hồ ly đuôi lửa, đi qua đâu cỏ khô bén lửa đó.', "A fox with a flaming tail; dry grass catches fire wherever it walks."),
    filter: 'saturate(2) hue-rotate(-18deg) brightness(1.05) drop-shadow(0 0 3px #ff6a2a)',
  },
  hoa_linh_dich: {
    name: tr('hỏa linh dịch', "fire slime"),
    w: 64,
    h: 64,
    n: 8,
    fps: 8,
    s: 0.55,
    dur: 11,
    meet: tr('Khối linh dịch đỏ rực từ miệng núi lửa, ấm như cục than hồng.', "A blazing red slime from a volcano's mouth, warm as a glowing coal."),
    filter: 'hue-rotate(-120deg) saturate(1.6)',
  },
  huyet_buc: {
    name: tr('huyết bức', "blood bat"),
    w: 64,
    h: 64,
    n: 7,
    fps: 12,
    s: 0.6,
    fly: true,
    dur: 7,
    meet: tr('Con dơi máu trong hang tối, chỉ uống máu của kẻ thù bạn.', "A blood bat from a dark cave that drinks only your enemies' blood."),
    filter: 'hue-rotate(110deg) saturate(2) brightness(0.9)',
  },
  bang_phong: {
    name: tr('băng phong', "ice bee"),
    w: 32,
    h: 32,
    n: 6,
    fps: 12,
    s: 0.75,
    fly: true,
    dur: 9,
    meet: tr('Con ong băng từ tổ trên đỉnh tuyết, đốt ai người đó đóng băng.', "An ice bee from a nest on a snowy peak; whoever it stings freezes solid."),
    filter: 'hue-rotate(170deg) saturate(1.3) brightness(1.2)',
  },
};
export const PET_IDS = Object.keys(PETS);
// loài chỉ nhận qua kịch bản riêng
const SPECIAL = [
  'soi_con',
  'tuyet_ho',
  'hac_lang',
  'xich_lang',
  'bang_lang',
  'bach_lang',
  'mai_loc',
  'kim_thu',
  'thuc_nhan_hoa',
  'bach_xa',
  'tho_long',
  'tam_linh',
  'thu_vuong',
  'xich_chi',
  'hung_con',
  'tuyet_hung',
  'su_tu_con',
  'linh_loc',
  'hoa_ho',
  'hoa_linh_dich',
  'huyet_buc',
  'bang_phong',
];

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
  title: tr('Có đứa đi theo', "Someone's following you"),
  text: (c) => PETS[petThisYear(c)].meet,
  choices: (c) => {
    const id = petThisYear(c);
    const p = PETS[id];
    return [
      {
        label: tr(`Nhận nuôi ${p.name}`, `Adopt the ${p.name}`),
        lean: 'chinh',
        run: (ch, ctx) => {
          ch.pet = true;
          ch.petKind = id;
          dao(ch, 3);
          stat(ch, 'tamCanh', 5);
          ctx.fx('love', tr('Có thú cưng', "Got a pet"));
          return tr(`Từ nay ${p.name} chạy theo bạn khắp nơi.`, `From now on, the ${p.name} follows you everywhere.`);
        },
      },
      {
        label: tr('Cho ăn rồi đuổi đi', "Feed it and shoo it away"),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'khiVan', 2);
          return tr(`${p.name[0].toUpperCase() + p.name.slice(1)} ăn xong, ngoái nhìn bạn rồi đi mất.`, `${p.name[0].toUpperCase() + p.name.slice(1)} finishes eating, looks back at you, and is gone.`);
        },
      },
      {
        label: tr('Bắt đem bán', "Catch and sell it"),
        lean: 'ta',
        run: (ch) => {
          dao(ch, -3);
          money(ch, 25);
          return tr(`Bạn bán ${p.name} được 25 linh thạch. Đêm đó bạn nằm mơ thấy nó.`, `You sell the ${p.name} for 25 spirit stones. That night you dream of it.`);
        },
      },
    ];
  },
};

// ---------- Kịch bản nhận thú cưng ----------
export function adopt(ch: Character, id: string, ctx: EffectCtx): string {
  const old = ch.pet ? PETS[petOf(ch)]?.name : null;
  ch.pet = true;
  ch.petKind = id;
  ctx.fx('love', tr('Có thú cưng', "Got a pet"));
  return old && old !== PETS[id].name ? tr(` Con ${old} ghen tị, bỏ vào rừng không về.`, ` The jealous ${old} runs off into the forest and never returns.`) : '';
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
    id: 'pet_soi_trang',
    title: tr('Đêm trăng sói tru', "Wolves howl at the moon"),
    minAge: 10,
    weight: 5,
    pick: (c) => (snow(c) ? ((c.lookSeed ?? 0) % 2 ? 'bang_lang' : 'bach_lang') : c.daoTam <= -30 ? 'xich_lang' : 'hac_lang'),
    text: (_c, p) => tr(`Đêm trăng tròn, tiếng sói tru vọng từ núi. ${p.meet}`, `Under the full moon, wolf howls echo from the mountains. ${p.meet}`),
    adoptLabel: tr('Băng bó, đưa về nuôi', "Bandage it and take it home"),
    adoptText: (p) => tr(`Từ đêm ấy, ${p.name} chạy theo bạn như cái bóng.`, `From that night on, the ${p.name} follows you like a shadow.`),
    other: {
      label: tr('Để lại ít thịt rồi đi', "Leave some meat and go"),
      lean: 'chinh',
      run: (ch) => {
        stat(ch, 'khiVan', 2);
        return tr('Sáng hôm sau, dưới cửa nhà có một con thỏ rừng.', "The next morning there is a wild rabbit at your door.");
      },
    },
    evil: {
      label: tr('Lột da bán', "Skin it and sell the hide"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -6);
        money(ch, 60);
        return tr('Da sói bán được giá. Đêm đó cả bầy tru quanh nhà bạn.', "The wolf pelt fetches a good price. That night the whole pack howls around your house.");
      },
    },
  },
  {
    id: 'pet_mieu_hoang',
    title: tr('Bạch xà trong miếu', "White snake in the shrine"),
    minAge: 10,
    weight: 4,
    pick: () => 'bach_xa',
    text: (_c, p) => tr(`Trú mưa trong miếu cổ ven hồ. ${p.meet}`, `You shelter from the rain in an old shrine by the lake. ${p.meet}`),
    adoptLabel: tr('Đưa tay cho nó quấn', "Hold out your hand"),
    adoptText: () => tr('Bạch xà quấn lên cổ tay bạn như chiếc vòng ngọc. Từ đó không rời.', "The white snake coils around your wrist like a jade bangle. It never leaves again."),
    other: {
      label: tr('Thắp nhang rồi đi', "Light incense and go"),
      lean: 'chinh',
      run: (ch) => {
        dao(ch, 3);
        stat(ch, 'tamCanh', 4);
        return tr('Bạch xà gật đầu ba cái như lạy tạ.', "The white snake nods three times, as if bowing in thanks.");
      },
    },
    evil: {
      label: tr('Bắt lấy mật rắn', "Take its gallbladder"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -8);
        addCult(ch, reward(ch, 0.2));
        stat(ch, 'tamMa', 6);
        return tr('Mật rắn trắng đắng ngắt. Đêm ấy mưa to, như trời khóc.', "The white snake's gall is bitter. That night it pours, as if Heaven weeps.");
      },
    },
  },
  {
    id: 'pet_gieng_co',
    title: tr('Đồng tiền dưới giếng', "Coins in the well"),
    minAge: 8,
    weight: 3,
    pick: () => 'kim_thu',
    text: (_c, p) => tr(`Thả gàu xuống giếng cổ, kéo lên toàn tiền xu. ${p.meet}`, `You lower a bucket into an old well and pull up nothing but coins. ${p.meet}`),
    adoptLabel: tr('Nuôi nó', "Keep it"),
    adoptText: () => tr('Kim thử chui vào túi bạn, thỉnh thoảng nhả ra một đồng tiền.', "The golden rat crawls into your pouch and spits out a coin now and then."),
    other: {
      label: tr('Thả lại xuống giếng', "Put it back in the well"),
      lean: 'chinh',
      run: (ch) => {
        stat(ch, 'khiVan', 3);
        return tr('Đêm đó bạn mơ thấy thần tài.', "That night you dream of the God of Wealth.");
      },
    },
    evil: {
      label: tr('Vét sạch tiền trong giếng', "Scoop out every coin"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -3);
        money(ch, 60);
        return tr('Bạn vét được một túi tiền. Giếng từ đó cạn khô.', "You scoop up a bag of money. The well dries up from that day on.");
      },
    },
  },
  {
    id: 'pet_vuon_hoang',
    title: tr('Vườn hoang', "Abandoned garden"),
    minAge: 12,
    weight: 3,
    pick: () => 'thuc_nhan_hoa',
    text: (_c, p) => tr(`Trong vườn hoang có tiếng răng nghiến ken két. ${p.meet}`, `Teeth gnash and grind in an abandoned garden. ${p.meet}`),
    adoptLabel: tr('Cho ăn, mang về', "Feed it and take it home"),
    adoptText: () => tr('Thực nhân hoa ngoan như mèo, chỉ hơi tốn thịt.', "The man-eating flower is as tame as a cat, if a bit costly in meat."),
    other: {
      label: tr('Tưới nước rồi đi', "Water it and go"),
      lean: 'chinh',
      run: (ch) => {
        stat(ch, 'tamCanh', 3);
        return tr('Bông hoa khẽ nghiêng mình như cảm ơn.', "The flower bows gently, as if in thanks.");
      },
    },
    evil: {
      label: tr('Nhổ lấy rễ luyện độc', "Pull its roots for poison"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -4);
        money(ch, 40);
        return tr('Rễ hoa luyện ra thứ độc không màu không mùi.', "The roots yield a colorless, odorless poison.");
      },
    },
  },
  {
    id: 'pet_trung_thu',
    title: tr('Đêm trăng bên suối', "Moonlit stream"),
    minAge: 8,
    weight: 4,
    pick: () => 'mai_loc',
    text: (_c, p) => tr(`Đêm Trung Thu, bạn ra suối ngắm trăng. ${p.meet}`, `On Mid-Autumn night you go to the stream to admire the moon. ${p.meet}`),
    adoptLabel: tr('Chìa tay mời nó lại gần', "Reach out and invite it closer"),
    adoptText: () => tr('Mai hoa lộc dụi đầu vào tay bạn rồi lững thững đi theo.', "The plum-blossom deer nuzzles your hand, then ambles after you."),
    other: {
      label: tr('Ngồi yên ngắm nó', "Sit still and watch"),
      lean: 'chinh',
      run: (ch) => {
        stat(ch, 'tamCanh', 5);
        return tr('Trăng, suối, hươu sao. Lòng bạn tĩnh lặng lạ thường.', "Moon, stream, spotted deer. Your heart is strangely at peace.");
      },
    },
    evil: {
      label: tr('Giương cung săn', "Draw your bow"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -5);
        money(ch, 50);
        return tr('Nhung hươu bán được giá. Suối ấy từ đó không ai thấy hươu nữa.', "The antler velvet sells well. No one ever sees deer at that stream again.");
      },
    },
  },
  {
    id: 'pet_dao_gieng',
    title: tr('Đào giếng, nuôi tằm', "Well-digging and silkworms"),
    minAge: 8,
    weight: 4,
    pick: (c) => ((c.lookSeed ?? 0) % 2 ? 'tho_long' : 'tam_linh'),
    text: (_c, p) => p.meet,
    adoptLabel: tr('Giữ lại nuôi', "Keep and raise it"),
    adoptText: (p) => tr(`${p.name[0].toUpperCase() + p.name.slice(1)} bò quanh chân bạn, chẳng chịu rời.`, `${p.name[0].toUpperCase() + p.name.slice(1)} crawls around your feet and won't leave.`),
    other: {
      label: tr('Thả về đồng', "Release it to the fields"),
      lean: 'trung',
      run: (ch) => {
        stat(ch, 'tamCanh', 2);
        return tr('Mùa ấy lúa nhà bạn tốt bất thường.', "That season your rice grows unusually well.");
      },
    },
    evil: {
      label: tr('Đem làm mồi câu', "Use it as bait"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -2);
        money(ch, 15);
        return tr('Câu được con cá chép đỏ to, bán được giá.', "You hook a big red carp and sell it for a good price.");
      },
    },
  },
  {
    id: 'pet_kho_thoc',
    title: tr('Kho thóc', "The granary"),
    minAge: 8,
    weight: 4,
    pick: (c) => ((c.familyTier ?? 1) <= 1 ? 'thu_vuong' : 'xich_chi'),
    text: (_c, p) => tr(`Dọn kho thóc sau nhà. ${p.meet}`, `You clear out the granary behind the house. ${p.meet}`),
    adoptLabel: tr('Nhận làm bạn', "Befriend it"),
    adoptText: (p) => tr(`Từ đó ${p.name} theo bạn khắp nơi, kho thóc cũng chẳng mất hạt nào.`, `From then on the ${p.name} goes everywhere with you, and the granary never loses a grain.`),
    other: { label: tr('Đuổi đi', "Chase it off"), lean: 'trung', run: () => tr('Nó chạy mất, để lại một hạt thóc vàng óng.', "It runs away, leaving behind one shining golden grain.") },
    evil: {
      label: tr('Đặt bẫy diệt sạch', "Set traps, wipe them out"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -3);
        money(ch, 10);
        return tr('Kho sạch sẽ. Nhưng mùa sau rắn kéo đến.', "The granary is spotless. But next season the snakes move in.");
      },
    },
  },
  {
    id: 'pet_gau_con',
    title: tr('Gấu con lạc mẹ', "Lost bear cub"),
    minAge: 10,
    weight: 4,
    pick: (c) => (snow(c) ? 'tuyet_hung' : 'hung_con'),
    text: (_c, p) => tr(`Trong rừng sâu có tiếng rên ư ử. ${p.meet}`, `A whimpering sound comes from deep in the forest. ${p.meet}`),
    adoptLabel: tr('Nhận nuôi', "Adopt it"),
    adoptText: (p) => tr(`${p.name[0].toUpperCase() + p.name.slice(1)} lớn nhanh như thổi, ăn bằng ba người.`, `${p.name[0].toUpperCase() + p.name.slice(1)} grows like a weed and eats as much as three people.`),
    other: {
      label: tr('Đưa về hang mẹ', "Take it back to its mother's den"),
      lean: 'chinh',
      run: (ch, ctx) => {
        dao(ch, 5);
        if (ctx.rnd() < 0.3) return tr('Gấu mẹ tưởng bạn bắt con nó, đuổi bạn chạy trối chết.', "The mother bear thinks you stole her cub and chases you for your life.") + hurt(ch, 15, ctx);
        stat(ch, 'khiVan', 3);
        return tr('Gấu mẹ liếm con rồi nhìn bạn rất lâu. Bạn thấy lòng nhẹ bẫng.', "The mother bear licks her cub and gazes at you a long while. Your heart feels light.");
      },
    },
    evil: {
      label: tr('Lấy mật gấu', "Take its bile"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -10);
        money(ch, 120);
        stat(ch, 'tamMa', 6);
        return tr('Mật gấu bán được giá cao. Tiếng gấu mẹ gào cả đêm.', "The bear bile sells for a high price. The mother bear roars all night.");
      },
    },
  },
  {
    id: 'pet_thuong_doan',
    title: tr('Thương đoàn Tây Vực', "Xiyu caravan"),
    minAge: 10,
    weight: 3,
    pick: (c) => (c.region === 'tay_vuc' || c.region === 'bac_mac' ? 'su_tu_con' : (c.lookSeed ?? 0) % 2 ? 'su_tu_con' : 'linh_loc'),
    text: (_c, p) => tr(`Thương đoàn từ phương xa dừng chân trong trấn, đem theo thú lạ. ${p.meet}`, `A caravan from distant lands stops in town with strange beasts. ${p.meet}`),
    adoptLabel: tr('Mua về nuôi (-80 linh thạch)', "Buy it (-80 spirit stones)"),
    adoptText: (p) => tr(`Bạn trả tiền, dắt ${p.name} về. Cả trấn kéo đến xem.`, `You pay up and lead the ${p.name} home. The whole town comes to look.`),
    other: {
      label: tr('Chỉ đứng xem', "Just watch"),
      lean: 'trung',
      run: (ch) => {
        stat(ch, 'ngoTinh', 1);
        return tr('Bạn nghe thương nhân kể chuyện xứ cát vàng đến tận khuya.', "You listen to the merchants' tales of the golden sands until late at night.");
      },
    },
    evil: {
      label: tr('Đêm lẻn vào trộm', "Sneak in at night to steal"),
      lean: 'ta',
      run: (ch, ctx) => {
        dao(ch, -6);
        if (ctx.rnd() < 0.5) return tr('Bị lính canh phát hiện, đánh cho một trận.', "The guards catch you and give you a beating.") + hurt(ch, 20, ctx);
        money(ch, 100);
        return tr('Bạn trộm được hàng, bán lại cho chợ đen.', "You steal the goods and resell them on the black market.");
      },
    },
  },
  {
    id: 'pet_hoa_son',
    title: tr('Núi lửa', "Volcano"),
    minAge: 14,
    weight: 3,
    pick: (c) => ((c.lookSeed ?? 0) % 2 ? 'hoa_ho' : 'hoa_linh_dich'),
    text: (_c, p) => tr(`Đi qua chân núi lửa, đá còn nóng bỏng. ${p.meet}`, `You pass the foot of a volcano; the rocks are still scorching. ${p.meet}`),
    adoptLabel: tr('Thu phục', "Tame it"),
    adoptText: (p) => tr(`${p.name[0].toUpperCase() + p.name.slice(1)} nằm gọn bên chân bạn, sưởi ấm cả mùa đông.`, `${p.name[0].toUpperCase() + p.name.slice(1)} curls up by your feet, keeping you warm all winter.`),
    other: { label: tr('Né đi đường khác', "Take another way"), lean: 'trung', run: () => tr('Nó nhìn theo bạn rất lâu.', "It watches you go for a long time.") },
    evil: {
      label: tr('Bắt lấy hỏa tinh luyện đan', "Catch its fire essence for pills"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -5);
        addCult(ch, reward(ch, 0.2));
        return tr('Lò đan bùng lửa đỏ rực. Đan thành, tu vi tăng.', "The pill furnace roars with red flame. The pill forms and your cultivation rises.");
      },
    },
  },
  {
    id: 'pet_hang_toi',
    title: tr('Hang tối, tổ băng', "Dark cave, icy nest"),
    minAge: 12,
    weight: 3,
    pick: (c) => (c.daoTam <= -20 ? 'huyet_buc' : snow(c) ? 'bang_phong' : (c.lookSeed ?? 0) % 2 ? 'huyet_buc' : 'bang_phong'),
    text: (_c, p) => p.meet,
    adoptLabel: tr('Nhận làm linh sủng', "Take it as a spirit pet"),
    adoptText: (p) => tr(`${p.name[0].toUpperCase() + p.name.slice(1)} bay vòng quanh đầu bạn, không cho ai đến gần.`, `${p.name[0].toUpperCase() + p.name.slice(1)} circles your head and lets no one near.`),
    other: { label: tr('Rời đi lặng lẽ', "Leave quietly"), lean: 'trung', run: () => tr('Bạn rời đi, không ngoảnh lại.', "You leave without looking back.") },
    evil: {
      label: tr('Phá tổ lấy độc', "Smash the nest for venom"),
      lean: 'ta',
      run: (ch) => {
        dao(ch, -4);
        money(ch, 50);
        return tr('Lấy được ít độc dịch quý, đổi được linh thạch.', "You collect some precious venom and trade it for spirit stones.");
      },
    },
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
      {
        label: st.adoptLabel,
        lean: 'chinh',
        run: (ch, ctx) => {
          if (st.id === 'pet_thuong_doan') money(ch, -80);
          const note = adopt(ch, id, ctx);
          dao(ch, 2);
          return st.adoptText(p) + note;
        },
      },
      st.other,
      st.evil,
    ];
  },
}));
