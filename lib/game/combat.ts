import { forgeDefMul, forgeHpMul, forgeMul, sealAtk, sealDef, sealExp, sealHp } from './forge';
import { ksDrop, ksLegendPer, ksMonster } from './luanHoi';
import { huntDeath, huntLose } from './fightLines';
import { omenIs } from './hook';
import { ITEMS, REALMS, fxText, gearFx } from './data';
import { DO_KIEP_REALM, addCult, addPill, clamp, fatal, giveItem, money, needFor, stat } from './helpers';
import type { Character, EffectCtx, Element } from './types';
import { gainAn } from './nguHanhDai';
import { tr } from '../i18n';

/** Dáng quái dùng để vẽ pixel */
export type MonsterShape = 'thu' | 'ran' | 'nguoi' | 'chim' | 'rong' | 'bo' | 'vo_lam';

export interface Monster {
  id: string;
  name: string;
  lv: number;
  place: string;
  shape: MonsterShape;
  body: string;
  accent: string;
  eye: string;
  desc: string;
  boss?: 'chinh' | 'ta';
  human?: { weapon: 'kiem' | 'dao' | 'quyen' | 'quat'; hat?: boolean; mask?: boolean };
  el?: Element; // ngũ hành của loài quái
  sect?: 'chinh' | 'ta' | 'trung'; // quái trong tông môn: chỉ đệ tử môn đó mới gặp
  cosmos?: 'tien' | 'ma' | 'hu'; // quái tiên giới, ma giới: chỉ gặp sau phi thăng
  doKiep?: boolean; // quái Độ Kiếp: chỉ gặp khi đã Độ Kiếp ở phàm giới
}

/** 15 loại quái, xếp theo cấp. Cấp người chơi: Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15... */
export const MONSTERS: Monster[] = [
  { id: 'tho_yeu', name: tr('Thỏ Yêu', "Demon Rabbit"), lv: 1, place: tr('Bãi cỏ đầu làng', "Village-Edge Meadow"), shape: 'thu', body: '#f2f2f6', accent: '#ffb3c6', eye: '#e0202e', desc: tr('Thỏ mới khai linh trí, cắn hơi đau.', "A rabbit that just gained sentience. Its bite stings a little."), el: 'moc' },
  { id: 'soi_xam', name: tr('Sói Xám Thành Tinh', "Grey Wolf Spirit"), lv: 2, place: tr('Rừng Thanh Tùng', "Qingsong Forest"), shape: 'thu', body: '#7d8590', accent: '#4a4f58', eye: '#ffd36b', desc: tr('Đi theo bầy, đêm trăng rất hung.', "Hunts in packs, savage on moonlit nights."), el: 'kim' },
  { id: 'ran_hoa', name: tr('Hoa Văn Mãng', "Patterned Python"), lv: 3, place: tr('Đầm Lầy Xanh', "Green Swamp"), shape: 'ran', body: '#5fbf6a', accent: '#ffd36b', eye: '#e0202e', desc: tr('Rắn lớn hoa văn, có độc nhẹ.', "A big patterned snake with mild venom."), el: 'moc' },
  { id: 'khi_ac', name: tr('Ác Hầu', "Wicked Ape"), lv: 5, place: tr('Hoa Quả Sơn', "Hua Guo Mountain"), shape: 'nguoi', body: '#a0704a', accent: '#e0b48a', eye: '#ffd36b', desc: tr('Khỉ yêu tinh ranh, thích cướp đồ.', "A cunning monkey demon that loves to steal."), el: 'tho' },
  { id: 'heo_rung', name: tr('Thiết Nha Trư', "Iron-Tusk Boar"), lv: 7, place: tr('Rừng Hắc Mộc', "Heimu Forest"), shape: 'thu', body: '#5a4a44', accent: '#e6e6ee', eye: '#ff6a2a', desc: tr('Heo rừng nanh sắt, da dày như giáp.', "A wild boar with iron tusks and hide thick as armor."), el: 'tho' },
  {
    id: 'son_tac',
    name: tr('Sơn Tặc Đầu Lĩnh', "Bandit Chief"),
    lv: 4,
    place: tr('Hắc Phong Trại', "Heifeng Stronghold"),
    shape: 'vo_lam',
    body: '#5a4a3a',
    accent: '#8a2a1e',
    eye: '#1a1a1a',
    desc: tr('Trùm cướp núi, đao pháp thô bạo.', "A mountain bandit boss with brutal saber work."),
    human: { weapon: 'dao' },
    el: 'kim',
  },
  {
    id: 'thich_khach',
    name: tr('Hắc Y Thích Khách', "Black-Clad Assassin"),
    lv: 8,
    place: tr('Ám Ảnh Lâu', "Ám Ảnh Tower"),
    shape: 'vo_lam',
    body: '#1e1e2a',
    accent: '#3a3a4a',
    eye: '#e0202e',
    desc: tr('Sát thủ đến không tiếng, đi không dấu.', "Comes without a sound, leaves without a trace."),
    human: { weapon: 'kiem', mask: true },
    el: 'thuy',
  },
  {
    id: 'bo_cap',
    name: tr('Huyết Phong Vương', "Blood Wasp Monarch"),
    lv: 9,
    place: tr('Sa Mạc Hoàng Sa', "Huang Sha Desert"),
    shape: 'bo',
    body: '#b8302a',
    accent: '#5a1a1a',
    eye: '#ffd36b',
    desc: tr('Ong chúa khổng lồ, kim chích chứa kịch độc.', "A giant wasp queen whose stinger carries deadly venom."),
    el: 'hoa',
  },
  { id: 'ho_yeu', name: tr('Cửu Vĩ Hồ Yêu', "Nine-Tailed Fox Demon"), lv: 11, place: tr('Thanh Khâu', "Qingqiu"), shape: 'thu', body: '#ff9a4a', accent: '#fff4e0', eye: '#9a3ad0', desc: tr('Hồ ly mê hoặc lòng người.', "A fox spirit that bewitches the hearts of men."), el: 'hoa' },
  {
    id: 'thiet_chuong',
    name: tr('Thiết Chưởng Bang Chủ', "Tiezhang Gang Leader"),
    lv: 12,
    place: tr('Thiết Chưởng Bang', "Tiezhang Gang"),
    shape: 'vo_lam',
    body: '#7a5a2a',
    accent: '#3a2a1a',
    eye: '#1a1a1a',
    desc: tr('Một chưởng đánh vỡ tảng đá ngàn cân.', "One palm shatters a thousand-catty boulder."),
    human: { weapon: 'quyen' },
    el: 'kim',
  },
  {
    id: 'cuong_thi',
    name: tr('Thiết Giáp Cương Thi', "Iron-Armored Jiangshi"),
    lv: 13,
    place: tr('Nghĩa Trang Cổ', "Ancient Cemetery"),
    shape: 'nguoi',
    body: '#6a8a7a',
    accent: '#2a3a4a',
    eye: '#9ff0c8',
    desc: tr('Xác chết ngàn năm, đao kiếm khó chém.', "A thousand-year-old corpse that blades can barely cut."),
    el: 'tho',
  },
  {
    id: 'hac_hung',
    name: tr('Hắc Hùng Tinh', "Black Bear Spirit"),
    lv: 15,
    place: tr('Hắc Phong Sơn', "Heifeng Mountain"),
    shape: 'thu',
    body: '#2a2228',
    accent: '#7a5a3a',
    eye: '#ffd36b',
    desc: tr('Gấu đen tu luyện ngàn năm, sức mạnh vô song.', "A black bear that cultivated for a thousand years. Matchless strength."),
    el: 'tho',
  },
  {
    id: 'doc_vuong',
    name: tr('Độc Thủ Dược Vương', "Poison-Hand Medicine King"),
    lv: 16,
    place: tr('Vạn Độc Cốc', "Wandu Valley"),
    shape: 'vo_lam',
    body: '#3a6a3a',
    accent: '#9a3ad0',
    eye: '#9ff0c8',
    desc: tr('Phẩy quạt là độc bay mười dặm.', "One wave of his fan sends poison flying ten miles."),
    human: { weapon: 'quat', hat: true },
    el: 'moc',
  },
  { id: 'ngan_giac', name: tr('Ngân Giác Mãng', "Silver-Horned Python"), lv: 17, place: tr('Vạn Xà Cốc', "Wanshe Valley"), shape: 'ran', body: '#9aa6c0', accent: '#e6eaf6', eye: '#e0202e', desc: tr('Mãng xà có sừng bạc, sắp hóa giao.', "A silver-horned python on the verge of becoming a flood dragon."), el: 'thuy' },
  {
    id: 'dai_bang',
    name: tr('Kim Sí Đại Bằng', "Golden-Winged Roc"),
    lv: 19,
    place: tr('Đỉnh Vân Tiêu', "Yun Xiao Peak"),
    shape: 'chim',
    body: '#e0a030',
    accent: '#ffe27a',
    eye: '#e0202e',
    desc: tr('Chim thần cánh vàng, một cái vỗ cánh chín vạn dặm.', "A golden-winged divine bird; one beat of its wings carries it ninety thousand miles."),
    el: 'kim',
  },
  {
    id: 'cuong_dao',
    name: tr('Cuồng Đao Khách', "Mad Blade Wanderer"),
    lv: 20,
    place: tr('Đoạn Hồn Nhai', "Duanhun Cliff"),
    shape: 'vo_lam',
    body: '#8a1a24',
    accent: '#1a1a1a',
    eye: '#ffd36b',
    desc: tr('Đao chưa ra khỏi vỏ đã có người chết.', "Someone dies before his saber even leaves its sheath."),
    human: { weapon: 'dao', hat: true },
    el: 'kim',
  },
  { id: 'huyet_ma', name: tr('Huyết Ma', "Blood Demon"), lv: 21, place: tr('Huyết Hải', "Sea of Blood"), shape: 'nguoi', body: '#7a0a1e', accent: '#1e1a24', eye: '#ff2a3a', desc: tr('Ma đầu sinh ra từ biển máu.', "A demon lord born from the sea of blood."), el: 'hoa' },
  {
    id: 'bang_giao',
    name: tr('Băng Giao', "Ice Flood Dragon"),
    lv: 23,
    place: tr('Bắc Hải Băng Nguyên', "Beihai Ice Plains"),
    shape: 'rong',
    body: '#7fc8ff',
    accent: '#eaf6ff',
    eye: '#2a3a6a',
    desc: tr('Giao long băng giá, hơi thở đóng băng vạn vật.', "A frost flood dragon whose breath freezes all things."),
    el: 'thuy',
  },
  {
    id: 'kiem_si',
    name: tr('Kiếm Si Vô Danh', "Nameless Sword Fanatic"),
    lv: 24,
    place: tr('Kiếm Trủng', "Sword Tomb"),
    shape: 'vo_lam',
    body: '#e6e6ee',
    accent: '#3d6fb0',
    eye: '#1a1a1a',
    desc: tr('Cả đời chỉ luyện một kiếm. Một kiếm ấy chưa từng thua.', "He trained a single sword move his whole life. That one move has never lost."),
    human: { weapon: 'kiem', hat: true },
    el: 'kim',
  },
  { id: 'ky_lan', name: tr('Hỏa Kỳ Lân', "Fire Qilin"), lv: 25, place: tr('Hỏa Diệm Sơn', "Huoyan Mountain"), shape: 'thu', body: '#e0502a', accent: '#ffd36b', eye: '#ffffff', desc: tr('Thần thú lửa, giẫm đâu cháy đó.', "A divine fire beast; wherever it treads, things burn."), el: 'hoa' },
  {
    id: 'hac_long',
    name: tr('Thượng Cổ Hắc Long', "Ancient Black Dragon"),
    lv: 27,
    place: tr('Vực Vô Tận', "Endless Abyss"),
    shape: 'rong',
    body: '#1e1a2e',
    accent: '#9a3ad0',
    eye: '#ffd36b',
    desc: tr('Long tộc thượng cổ. Phi thăng giả cũng phải dè chừng.', "An ancient dragon. Even those on the verge of Ascension tread carefully."),
    el: 'thuy',
  },
  // Quái thêm
  {
    id: 'nhen_doc',
    name: tr('Độc Nhện Tinh', "Poison Spider Spirit"),
    lv: 6,
    place: tr('Bàn Ti Động', "Pansi Cave"),
    shape: 'bo',
    body: '#3a2a4a',
    accent: '#9a3ad0',
    eye: '#ff2a3a',
    desc: tr('Nhện tinh giăng tơ độc khắp động, con mồi dính vào là xong.', "A spider spirit that webs the whole cave with poison silk. Get stuck and it's over."),
    el: 'moc',
  },
  {
    id: 'lang_vuong',
    name: tr('Huyết Lang Vương', "Blood Wolf King"),
    lv: 10,
    place: tr('Bắc Mạc Hoang Nguyên', "Beimo Wilds"),
    shape: 'thu',
    body: '#5a3a3a',
    accent: '#b8302a',
    eye: '#ffd36b',
    desc: tr('Sói chúa đầu đàn, hú một tiếng trăm sói kéo về.', "Alpha of the pack - one howl and a hundred wolves come running."),
    el: 'kim',
  },
  {
    id: 'am_quy',
    name: tr('Âm Hồn Quỷ Tướng', "Yin Soul Ghost General"),
    lv: 14,
    place: tr('Quỷ Môn Quan', "Gui Sect Pass"),
    shape: 'nguoi',
    body: '#3a4a5a',
    accent: '#9ff0c8',
    eye: '#9ff0c8',
    desc: tr('Tướng quân chết trận không siêu thoát, dẫn âm binh đi tuần.', "A general who died in battle and never moved on, now patrolling with his ghost soldiers."),
    el: 'thuy',
  },
  {
    id: 'huyet_y',
    name: tr('Huyết Y Lão Quái', "Blood-Robed Old Fiend"),
    lv: 18,
    place: tr('Hắc Thủy Trại', "Heishui Stronghold"),
    shape: 'vo_lam',
    body: '#7a1a24',
    accent: '#2a1a1a',
    eye: '#ffd36b',
    desc: tr('Lão ma đầu áo đỏ, sống nhờ hút máu người luyện công.', "A red-robed old devil who cultivates by drinking human blood."),
    human: { weapon: 'quyen', hat: true },
    el: 'hoa',
  },
  {
    id: 'xich_long',
    name: tr('Xích Diễm Giao Long', "Crimson Flame Flood Dragon"),
    lv: 22,
    place: tr('Nham Tương Hải', "Magma Sea"),
    shape: 'rong',
    body: '#c8402a',
    accent: '#ffd36b',
    eye: '#ffffff',
    desc: tr('Giao long tắm trong dung nham, vảy nóng chảy sắt.', "A flood dragon that bathes in lava; its scales melt iron."),
    el: 'hoa',
  },
  {
    id: 'kim_thiem',
    name: tr('Bích Nhãn Kim Thiềm', "Jade-Eyed Golden Toad"),
    lv: 26,
    place: tr('Kim Thiềm Động', "Jinchan Cave"),
    shape: 'thu',
    body: '#d8b030',
    accent: '#3a8a5a',
    eye: '#5ac86a',
    desc: tr('Cóc vàng ngậm tiền, nuốt cả linh bảo của tu sĩ.', "A golden toad with a coin in its mouth that swallows cultivators' treasures whole."),
    el: 'tho',
  },
  // Quái trong tông môn: thí luyện của đệ tử
  {
    id: 'dong_nhan',
    name: tr('Đồng Nhân Khôi Lỗi', "Bronze Puppet"),
    lv: 3,
    place: tr('Thí Luyện Đường Thanh Vân', "Qingyun Trial Hall"),
    shape: 'nguoi',
    body: '#b8803a',
    accent: '#6a4a2a',
    eye: '#ffd36b',
    desc: tr('Người đồng trăm khớp, ngoại môn đệ tử nào cũng phải qua.', "A bronze man with a hundred joints. Every outer disciple must get past it."),
    el: 'kim',
    sect: 'chinh',
  },
  {
    id: 'tien_hac',
    name: tr('Hộ Sơn Tiên Hạc', "Mountain-Guardian Crane"),
    lv: 9,
    place: tr('Hậu sơn Thanh Vân', "Qingyun Rear Mountain"),
    shape: 'chim',
    body: '#f2f2f6',
    accent: '#e0202e',
    eye: '#1a1a1a',
    desc: tr('Hạc giữ núi, chỉ chịu nhường đường cho người thắng được nó.', "The crane guarding the mountain only yields to those who can beat it."),
    el: 'moc',
    sect: 'chinh',
  },
  {
    id: 'kiem_linh',
    name: tr('Kiếm Linh Thí Luyện', "Sword Spirit Trial"),
    lv: 15,
    place: tr('Kiếm Các Thanh Vân', "Qingyun Sword Pavilion"),
    shape: 'vo_lam',
    body: '#cfe0ff',
    accent: '#3d6fb0',
    eye: '#7fc8ff',
    desc: tr('Kiếm ý của tổ sư hóa hình, thử lòng đệ tử chân truyền.', "The founder's sword intent given form, testing the hearts of true disciples."),
    human: { weapon: 'kiem' },
    el: 'kim',
    sect: 'chinh',
  },
  {
    id: 'toa_yeu_giao',
    name: tr('Tỏa Yêu Tháp Thủ Giao', "Demon-Locking Tower Dragon"),
    lv: 21,
    place: tr('Tỏa Yêu Tháp', "Demon-Locking Tower"),
    shape: 'rong',
    body: '#3a6a8a',
    accent: '#c8d8f0',
    eye: '#ffd36b',
    desc: tr('Giao long bị trấn dưới tháp ngàn năm, canh giữ tầng cuối.', "A flood dragon sealed beneath the tower for a thousand years, guarding the final floor."),
    el: 'thuy',
    sect: 'chinh',
  },
  {
    id: 'huyet_khoi',
    name: tr('Huyết Khôi', "Blood Puppet"),
    lv: 3,
    place: tr('Huyết Trì Ngoại Đường', "Blood Pool Outer Hall"),
    shape: 'nguoi',
    body: '#8a2a2a',
    accent: '#3a1a1a',
    eye: '#ff2a3a',
    desc: tr('Xác người luyện thành khôi lỗi, huyết nô dùng để tập giết.', "A corpse refined into a puppet, used by blood slaves for killing practice."),
    el: 'hoa',
    sect: 'ta',
  },
  {
    id: 'thi_lang',
    name: tr('Thi Lang', 'Shilang'),
    lv: 9,
    place: tr('Bãi Xương Huyết Sát', "Xuesha Bone Field"),
    shape: 'thu',
    body: '#4a4a3a',
    accent: '#8a2a2a',
    eye: '#9ff0c8',
    desc: tr('Sói ăn xác chết trong môn, đói thì cắn cả đệ tử.', "Wolves that feed on the sect's corpses; when hungry, they bite disciples too."),
    el: 'tho',
    sect: 'ta',
  },
  {
    id: 'co_trung',
    name: tr('Cổ Trùng Vương', "Gu King"),
    lv: 15,
    place: tr('Vạn Cổ Quật', "Wangu Den"),
    shape: 'bo',
    body: '#3a5a2a',
    accent: '#c8302a',
    eye: '#ffd36b',
    desc: tr('Con cổ sống sót sau khi ăn hết vạn con cổ khác.', "The gu that survived by devouring ten thousand other gu."),
    el: 'moc',
    sect: 'ta',
  },
  {
    id: 'huyet_giao',
    name: tr('Huyết Trì Ma Giao', "Blood Pool Demon Dragon"),
    lv: 21,
    place: tr('Đáy Huyết Trì', "Bottom of the Blood Pool"),
    shape: 'rong',
    body: '#5a0a14',
    accent: '#ff2a3a',
    eye: '#ffffff',
    desc: tr('Giao long nuôi bằng máu ba nghìn người, Thánh tử phải giết nó mới được công nhận.', "A flood dragon fed on the blood of three thousand people. A Holy Son must slay it to be recognized."),
    el: 'hoa',
    sect: 'ta',
  },
  // Thí luyện Thiên Cơ Các
  { id: 'co_quan', name: tr('Khôi Lỗi Cơ Quan', "Mechanism Puppet"), lv: 3, place: tr('Cơ Quan Đường Thiên Cơ', "Tianji Mechanism Hall"), shape: 'nguoi', body: '#8a7a5a', accent: '#3a5a8a', eye: '#7fc8ff', desc: tr('Người gỗ bánh răng, mỗi khớp là một ám khí.', "A wooden man of gears; every joint is a hidden weapon."), el: 'moc', sect: 'trung' },
  { id: 'kinh_anh', name: tr('Kính Ảnh Phân Thân', "Mirror Shadow Clone"), lv: 9, place: tr('Kính Các Thiên Cơ', "Tianji Mirror Pavilion"), shape: 'vo_lam', body: '#c8d8f0', accent: '#5a7ab0', eye: '#ffffff', desc: tr('Bóng của chính bạn bước ra từ gương, biết hết chiêu bạn sắp ra.', "Your own shadow steps out of the mirror, knowing every move you're about to make."), human: { weapon: 'quat' }, el: 'thuy', sect: 'trung' },
  { id: 'tran_linh', name: tr('Cửu Cung Trận Linh', "Nine Palaces Formation Spirit"), lv: 15, place: tr('Cửu Cung Trận Thiên Cơ', "Tianji Nine Palaces Formation"), shape: 'nguoi', body: '#6a5aa0', accent: '#ffd36b', eye: '#ffd36b', desc: tr('Linh hồn của đại trận, đi sai một ô là trận nuốt người.', "The soul of the great formation. Step on one wrong square and it swallows you."), el: 'tho', sect: 'trung' },
  { id: 'thien_co_thach', name: tr('Thiên Cơ Thạch Nhân', "Tianji Stone Man"), lv: 21, place: tr('Đỉnh Quan Tinh Đài', "Stargazing Terrace Summit"), shape: 'nguoi', body: '#5a5a6a', accent: '#c8b0ff', eye: '#7fe0e0', desc: tr('Tượng đá canh đài xem sao, khắc đầy thiên văn, ai đọc sai bị đá nghiền.', "A stone guardian of the stargazing terrace, carved with star charts. Misread them and get crushed."), el: 'kim', sect: 'trung' },
  // Thái Hư giới
  { id: 'hu_khong_thu', name: tr('Hư Không Thú', "Void Beast"), lv: 28, place: tr('Rìa Thái Hư', "Edge of the Great Void"), shape: 'thu', body: '#3a3a6a', accent: '#7fe0e0', eye: '#ffffff', desc: tr('Thú sống trong khe nứt không gian, cắn một miếng là mất một khoảng trời.', "A beast living in cracks in space; one bite takes a chunk out of the sky."), el: 'thuy', cosmos: 'hu' },
  { id: 'tinh_ha_kinh', name: tr('Tinh Hà Cự Kình', "Star River Leviathan"), lv: 31, place: tr('Dải Ngân Hà', "The Milky Way"), shape: 'ran', body: '#2a4a7a', accent: '#ffe27a', eye: '#7fe0e0', desc: tr('Cá voi bơi giữa các vì sao, hát một tiếng sao rơi như mưa.', "A whale swimming among the stars; when it sings, stars fall like rain."), el: 'thuy', cosmos: 'hu' },
  { id: 'hon_don_linh', name: tr('Hỗn Độn Linh', "Chaos Spirit"), lv: 34, place: tr('Hỗn Độn Hải', "Chaos Sea"), shape: 'nguoi', body: '#4a3a5a', accent: '#c8b0ff', eye: '#ff6aff', desc: tr('Sinh linh từ thuở chưa có trời đất, không hình không dạng.', "A being from before heaven and earth existed, without form or shape."), el: 'tho', cosmos: 'hu' },
  { id: 'thon_thien_thu', name: tr('Thái Hư Thôn Thiên Thú', "Great Void Sky-Devourer"), lv: 37, place: tr('Tâm Thái Hư', "Heart of the Great Void"), shape: 'rong', body: '#1e2a3a', accent: '#7fe0e0', eye: '#ffd36b', desc: tr('Con thú nuốt cả ngày lẫn đêm, Thái Hư sinh ra là để giam nó.', "A beast that swallows day and night. The Great Void was born to imprison it."), el: 'hoa', cosmos: 'hu' },
  // Tiên giới
  {
    id: 'thien_binh',
    name: tr('Thiên Binh Tuần Tra', "Heavenly Soldier Patrol"),
    lv: 28,
    place: tr('Nam Thiên Môn', "Southern Heaven Gate"),
    shape: 'vo_lam',
    body: '#e6d8a8',
    accent: '#c8302a',
    eye: '#1a1a1a',
    desc: tr('Lính tuần của Thiên đình, thấy tiên nhân mới lên là hạch hỏi.', "Patrolmen of the Heavenly Court who interrogate every newly ascended immortal."),
    human: { weapon: 'kiem', hat: true },
    el: 'kim',
    cosmos: 'tien',
  },
  {
    id: 'loi_thu',
    name: tr('Cửu Thiên Lôi Thú', "Nine Heavens Thunder Beast"),
    lv: 31,
    place: tr('Lôi Trì', "Thunder Pool"),
    shape: 'thu',
    body: '#5a7ad0',
    accent: '#ffe27a',
    eye: '#ffffff',
    desc: tr('Thú nuôi của Lôi Bộ, lông dựng lên là sét giáng.', "A pet of the Thunder Ministry; when its fur stands on end, lightning strikes."),
    el: 'moc',
    cosmos: 'tien',
  },
  {
    id: 'thien_bang',
    name: tr('Côn Bằng Thiên Ngoại', "Kunpeng of the Outer Heavens"),
    lv: 34,
    place: tr('Bắc Minh Thiên Hải', "Beiming Heavenly Sea"),
    shape: 'chim',
    body: '#3a6a9a',
    accent: '#c8e0ff',
    eye: '#ffd36b',
    desc: tr('Cá Côn hóa chim Bằng, một cánh che nửa bầu trời tiên giới.', "The Kun fish turned Peng bird; one wing shades half the sky of the Immortal Realm."),
    el: 'thuy',
    cosmos: 'tien',
  },
  {
    id: 'kim_long',
    name: tr('Thái Cổ Kim Long', "Primeval Golden Dragon"),
    lv: 37,
    place: tr('Long Cung Thiên Thượng', "Celestial Dragon Palace"),
    shape: 'rong',
    body: '#e0b030',
    accent: '#fff4c0',
    eye: '#c8302a',
    desc: tr('Kim long từ thuở khai thiên, vảy rụng một mảnh cũng thành thần binh.', "A golden dragon from the dawn of creation; even a single shed scale becomes a divine weapon."),
    el: 'kim',
    cosmos: 'tien',
  },
  // Ma giới
  {
    id: 'ma_binh',
    name: tr('Huyết Ma Binh', "Blood Demon Soldier"),
    lv: 28,
    place: tr('Ma Thành Ngoại Ô', "Demon City Outskirts"),
    shape: 'nguoi',
    body: '#5a1a24',
    accent: '#1e0a0e',
    eye: '#ff2a3a',
    desc: tr('Lính ma sinh ra từ huyết hải, chết rồi lại mọc lên.', "Demon soldiers born from the sea of blood; kill them and they rise again."),
    el: 'hoa',
    cosmos: 'ma',
  },
  {
    id: 'dia_nguc_khuyen',
    name: tr('Địa Ngục Tam Đầu Khuyển', "Three-Headed Hellhound"),
    lv: 31,
    place: tr('Cửa Cửu U', "Gate of the Nine Netherworlds"),
    shape: 'thu',
    body: '#2a1a1a',
    accent: '#ff6a2a',
    eye: '#ffd36b',
    desc: tr('Chó ba đầu canh cửa Cửu U, đầu nào cũng phun lửa.', "A three-headed dog guarding the Nine Netherworlds; every head breathes fire."),
    el: 'hoa',
    cosmos: 'ma',
  },
  {
    id: 'ma_bang',
    name: tr('Cửu U Ma Bằng', "Nine Netherworlds Demon Roc"),
    lv: 34,
    place: tr('Bầu trời Ma giới', "Demon Realm Skies"),
    shape: 'chim',
    body: '#1e1a2e',
    accent: '#9a3ad0',
    eye: '#ff2a3a',
    desc: tr('Chim ma cánh đen, bay qua đâu ma khí phủ đó.', "A black-winged demon bird; wherever it flies, demonic qi follows."),
    el: 'thuy',
    cosmos: 'ma',
  },
  {
    id: 'diet_the_long',
    name: tr('Diệt Thế Ma Long', "World-Ending Demon Dragon"),
    lv: 37,
    place: tr('Đáy Huyết Hải', "Bottom of the Blood Sea"),
    shape: 'rong',
    body: '#3a0a14',
    accent: '#ff2a3a',
    eye: '#ffffff',
    desc: tr('Ma long nuốt ba thế giới, Ma Đế cũng phải kiêng dè.', "A demon dragon that devoured three worlds. Even the Demon Emperor treads carefully."),
    el: 'tho',
    cosmos: 'ma',
  },
  // Quái Độ Kiếp: chỉ gặp khi đã Độ Kiếp ở phàm giới (thay quái thấp cấp bị đẩy cấp lên cho khớp)
  { id: 'loi_co_dieu', name: tr('Lôi Cổ Điêu', "Thunder Drum Eagle"), lv: 24, place: tr('Lôi Trạch', "Thunder Marsh"), shape: 'chim', body: '#4a5ab0', accent: '#ffe27a', eye: '#ffffff', desc: tr('Đại bàng vỗ cánh như gõ trống trời, chuyên rình người sắp độ kiếp.', "Its wingbeats sound like heaven's war drums; it stalks those about to face tribulation."), el: 'kim', doKiep: true },
  { id: 'xich_chu', name: tr('Xích Diễm Chu Vương', "Crimson Flame Spider King"), lv: 24, place: tr('Bàn Ti Hỏa Động', "Fiery Silk Cave"), shape: 'bo', body: '#c02a1a', accent: '#ffb04a', eye: '#ffe27a', desc: tr('Nhện chúa nhả tơ lửa, giăng lưới bắt người sắp độ kiếp.', "A spider king that spins threads of fire to snare those about to face tribulation."), el: 'hoa', doKiep: true },
  { id: 'kiep_loi_thu', name: tr('Thiên Kiếp Lôi Thú', "Tribulation Thunder Beast"), lv: 25, place: tr('Thiên Lôi Cốc', "Heavenly Thunder Valley"), shape: 'thu', body: '#2a3a7a', accent: '#9fd8ff', eye: '#ffffff', desc: tr('Sinh ra từ tàn lôi của ngàn lần thiên kiếp, ăn sấm sét mà lớn.', "Born from the leftover lightning of a thousand tribulations; it grows by eating thunder."), el: 'kim', doKiep: true },
  { id: 'luc_nhi', name: tr('Lục Nhĩ Mi Hầu', "Six-Eared Macaque"), lv: 25, place: tr('Hắc Mộc Lâm', "Black Wood Forest"), shape: 'thu', body: '#7a6a3a', accent: '#c0a060', eye: '#ffd36b', desc: tr('Khỉ sáu tai nghe được ý nghĩ người khác, học chiêu chỉ sau một lần nhìn.', "A six-eared macaque that hears others' thoughts and copies a technique after seeing it once."), el: 'moc', doKiep: true },
  { id: 'bach_cot', name: tr('Bạch Cốt Yêu Cơ', "White Bone Enchantress"), lv: 25, place: tr('Bạch Cốt Lĩnh', "White Bone Ridge"), shape: 'nguoi', body: '#eae2d0', accent: '#6a5a7a', eye: '#e0202e', desc: tr('Mỹ nhân bằng xương trắng, ba lần đổi dạng lừa người.', "A beauty made of white bone who changes form three times to deceive."), el: 'tho', doKiep: true },
  { id: 'thien_ngo', name: tr('Kim Giáp Thiên Ngô', "Golden-Armored Centipede"), lv: 26, place: tr('Thiên Ngô Lĩnh', "Centipede Ridge"), shape: 'bo', body: '#c09a2a', accent: '#5a3a1a', eye: '#e0202e', desc: tr('Rết trăm chân giáp vàng, phi kiếm chém vào chỉ tóe lửa.', "A hundred-legged centipede in golden armor; flying swords only throw sparks off it."), el: 'kim', doKiep: true },
  { id: 'bang_phach', name: tr('Băng Phách Tuyết Ma', "Frost Soul Snow Fiend"), lv: 26, place: tr('Tuyết Vực Tận Cùng', "Edge of the Snow Domain"), shape: 'nguoi', body: '#d8eeff', accent: '#5a8ac0', eye: '#2a3a6a', desc: tr('Hồn ma chết cóng ở nơi lạnh nhất nhân gian, chạm vào là đóng băng kinh mạch.', "A ghost frozen in the coldest place in the mortal world; its touch freezes your meridians."), el: 'thuy', doKiep: true },
  { id: 'thi_vuong', name: tr('Độ Ách Thi Vương', "Calamity Corpse King"), lv: 26, place: tr('Vạn Thi Lĩnh', "Ten Thousand Corpse Ridge"), shape: 'nguoi', body: '#5a6a4a', accent: '#2a2a1a', eye: '#9ff0c8', desc: tr('Xác của một tu sĩ chết dưới thiên kiếp, oán khí nuôi thành vua cương thi.', "The corpse of a cultivator killed by tribulation, raised by resentment into a jiangshi king."), el: 'tho', doKiep: true },
  { id: 'cu_giai', name: tr('Cự Giải Vương', "Giant Crab King"), lv: 27, place: tr('Đáy hồ Động Đình', "Bottom of Dongting Lake"), shape: 'bo', body: '#c0502a', accent: '#ffb04a', eye: '#1a1a1a', desc: tr('Cua chúa nghìn năm dưới đáy Động Đình, một càng kẹp gãy phi kiếm.', "A thousand-year crab king of Dongting's depths; one claw snaps a flying sword."), el: 'thuy', doKiep: true },
  { id: 'tu_la', name: tr('Tu La Đao Tôn', "Asura Blade Venerable"), lv: 27, place: tr('Tu La Trường', "Asura Field"), shape: 'vo_lam', body: '#5a0a14', accent: '#ff6a2a', eye: '#ffd36b', desc: tr('Giết đủ vạn người thì thành Tu La. Hắn còn thiếu một.', "Kill ten thousand and you become an Asura. He is one short."), human: { weapon: 'dao', hat: true }, el: 'hoa', doKiep: true },
  { id: 'phi', name: tr('Phỉ Thú', "Fei Plague Beast"), lv: 28, place: tr('Thái Sơn Hậu Cốc', "Valley behind Mount Tai"), shape: 'thu', body: '#6a7a3a', accent: '#e6eaf6', eye: '#e0202e', desc: tr('Trâu một mắt đầu trắng, đi qua sông thì sông cạn, qua cỏ thì cỏ chết.', "A one-eyed white-headed ox; rivers dry and grass dies wherever it walks."), el: 'moc', doKiep: true },
  { id: 'tat_phuong', name: tr('Tất Phương', "Bifang Fire Crane"), lv: 28, place: tr('Chương Nga Sơn', "Zhang'e Mountain"), shape: 'chim', body: '#e0502a', accent: '#3a8a5a', eye: '#ffffff', desc: tr('Hạc lửa một chân, kêu một tiếng là cả thành bốc cháy.', "A one-legged fire crane; one cry and the whole city burns."), el: 'hoa', doKiep: true },
  { id: 'vong_kiep', name: tr('Vong Kiếp Tán Nhân', "Tribulation-Lost Wanderer"), lv: 29, place: tr('Lôi Kiếp Nhai', "Tribulation Cliff"), shape: 'vo_lam', body: '#3a6a4a', accent: '#e6e6ee', eye: '#ff2a3a', desc: tr('Độ kiếp thất bại ba lần, hóa điên, chặn đường ai sắp độ kiếp.', "Failed his tribulation three times, went mad, and now blocks anyone about to face theirs."), human: { weapon: 'kiem', hat: true }, el: 'moc', doKiep: true },
  { id: 'huyen_vu', name: tr('Huyền Vũ Cự Quy', "Black Tortoise Colossus"), lv: 30, place: tr('Bắc Minh', "Northern Abyss"), shape: 'thu', body: '#1e3a3a', accent: '#5a8a7a', eye: '#ffd36b', desc: tr('Rùa thần mang cả hòn đảo trên lưng, ngủ một giấc ngàn năm.', "A divine tortoise that carries an island on its back and sleeps a thousand years at a time."), el: 'thuy', doKiep: true },
  { id: 'dao_ngot', name: tr('Đào Ngột', "Taowu"), lv: 30, place: tr('Hoang Sơn Tây', "Western Wilds"), shape: 'thu', body: '#5a4a2a', accent: '#c09a6a', eye: '#e0202e', desc: tr('Hung thú mặt người chân hổ, cố chấp không bao giờ lùi.', "A fiend with a human face and tiger legs; it never retreats."), el: 'tho', doKiep: true },
  { id: 'thanh_moc_giao', name: tr('Thanh Mộc Thần Giao', "Verdant Wood Flood Dragon"), lv: 31, place: tr('Vạn Mộc Lâm', "Ten Thousand Trees Forest"), shape: 'rong', body: '#2a6a3a', accent: '#9ac06a', eye: '#ffd36b', desc: tr('Giao long trú trong rừng cổ, một hơi thở mọc ra cả khu rừng gai.', "A flood dragon of the ancient forest; one breath grows a whole thicket of thorns."), el: 'moc', doKiep: true },
  { id: 'huyet_than', name: tr('Huyết Thần Tử', "Blood God Scion"), lv: 31, place: tr('Huyết Thần Điện', "Blood God Hall"), shape: 'nguoi', body: '#8a0a1e', accent: '#1e0a0e', eye: '#ff2a3a', desc: tr('Đứa con của biển máu, nuốt tinh huyết người độ kiếp để thành thần.', "A child of the blood sea that devours the essence of those facing tribulation to become a god."), el: 'hoa', doKiep: true },
  { id: 'cung_ky', name: tr('Cùng Kỳ', "Qiongqi"), lv: 32, place: tr('Ngoại vi Bất Chu Sơn', "Outskirts of Mount Buzhou"), shape: 'thu', body: '#7a7a8a', accent: '#3a2a4a', eye: '#ffd36b', desc: tr('Hổ có cánh, ăn người thiện, nuôi kẻ ác. Một trong tứ hung.', "A winged tiger that eats the good and feeds the wicked. One of the Four Fiends."), el: 'kim', doKiep: true },
  { id: 'ung_long', name: tr('Ứng Long', "Yinglong"), lv: 33, place: tr('Hung Lê Thổ Khâu', "Xiongli Mound"), shape: 'rong', body: '#2a4a7a', accent: '#ffe27a', eye: '#ffffff', desc: tr('Rồng có cánh từng giúp Hoàng Đế trị thủy. Không phục ai dưới Tiên.', "A winged dragon that once helped the Yellow Emperor tame the floods. It bows to none below the Immortals."), el: 'thuy', doKiep: true },
  { id: 'thao_thiet', name: tr('Thao Thiết', "Taotie"), lv: 33, place: tr('Câu Ngô Sơn', "Gouwu Mountain"), shape: 'thu', body: '#3a2a1a', accent: '#c0882a', eye: '#e0202e', desc: tr('Hung thú tham ăn nhất tứ hung, nuốt cả linh khí lẫn lôi kiếp.', "The greediest of the Four Fiends; it swallows spiritual qi and tribulation lightning alike."), el: 'tho', doKiep: true },
  // Boss: không thể thắng
  {
    id: 'boss_ta',
    name: tr('Huyết Ma Lão Tổ', "Blood Demon Ancestor"),
    lv: 40,
    place: tr('Tổng đàn Huyết Sát Môn', "Xuesha Sect Headquarters"),
    shape: 'nguoi',
    body: '#e8d0c0',
    accent: '#5a0a14',
    eye: '#ff2a3a',
    desc: tr('Ma đầu sống qua ba lần thiên kiếp, giết người như ngóe.', "A demon lord who has survived three heavenly tribulations and kills people like swatting flies."),
    boss: 'ta',
    el: 'hoa',
  },
  {
    id: 'boss_chinh',
    name: tr('Thái Thượng Kiếm Tôn', "Supreme Sword Venerable"),
    lv: 40,
    place: tr('Đỉnh Thanh Vân', "Qingyun Peak"),
    shape: 'nguoi',
    body: '#f2e6d0',
    accent: '#eef2ff',
    eye: '#3d6fb0',
    desc: tr('Đệ nhất kiếm tiên chính đạo, một kiếm phá vạn pháp.', "The Righteous Path's foremost sword immortal; one sword breaks ten thousand techniques."),
    boss: 'chinh',
    el: 'kim',
  },
];

const REALM_BASE = [0, 0, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

/** Cấp chiến đấu của nhân vật: Phàm 0, Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15, ... Độ Kiếp 25-27 */
export function combatLevel(c: Character): number {
  if (c.realm === 0) return 0;
  return (REALM_BASE[c.realm] ?? 24) + c.layer;
}

const GROW = 1.15;

export interface Fighter {
  hp: number;
  atk: number;
  def: number;
}

// ---------- Quái trưởng thành ----------
/** Mỗi lần bị giết, cả loài quái đó mạnh lên (nhanh hơn bạn lên cấp). Lâu không bị săn thì hồi lại. */
export const GROW_PER_KILL = 0.4;
export const MAX_GROWTH = 12;

export function growth(c: Character, m: Monster): number {
  return Math.floor(c.monLv?.[m.id] ?? 0);
}

export function effLv(c: Character, m: Monster): number {
  return m.lv + growth(c, m);
}

/** Bậc tiến hóa theo cấp tăng thêm: 0 thường, 1 tinh anh, 2 vương, 3 thánh */
export function tierOf(c: Character, m: Monster): number {
  const g = growth(c, m);
  return g >= 10 ? 3 : g >= 6 ? 2 : g >= 3 ? 1 : 0;
}

const TIER_YEU = ['', tr('Tinh Anh ', "Elite "), tr('Yêu Vương ', "Yao King "), tr('Yêu Thánh ', "Yao Saint ")];
const TIER_NHAN = ['', tr('Cao Thủ ', "Expert "), tr('Tông Sư ', "Master "), tr('Đại Tông Sư ', "Grandmaster ")];
export function monsterName(c: Character, m: Monster): string {
  const t = tierOf(c, m);
  if (!t || m.boss) return m.name;
  return (m.human ? TIER_NHAN : TIER_YEU)[t] + m.name;
}

export function growMonster(c: Character, m: Monster): boolean {
  if (m.boss) return false;
  c.monLv = c.monLv ?? {};
  const before = tierOf(c, m);
  const beforeLv = growth(c, m);
  c.monLv[m.id] = Math.min(MAX_GROWTH, (c.monLv[m.id] ?? 0) + GROW_PER_KILL);
  return tierOf(c, m) !== before || growth(c, m) !== beforeLv;
}

export function playerStats(c: Character): Fighter {
  const L = combatLevel(c) + (c.cultivation / needFor(c)) * 0.6;
  const s = Math.pow(GROW, L);
  let atk = 15 * s;
  let def = 4 * s;
  let hp = 125 * s * (0.6 + c.stats.sucKhoe / 250);
  if (c.path === 'kiem') atk *= 1.22;
  if (c.path === 'ma') atk *= 1.25;
  if (c.path === 'yeu') hp *= 1.25;
  if (c.path === 'tran') def *= 1.4;
  if (c.path === 'phat') ((hp *= 1.3), (def *= 1.3), (atk *= 1.1));
  if (c.path === 'dan') ((hp *= 1.15), (def *= 1.1)); // đan dược hộ thân
  if (c.gifts?.includes('g_than_luc')) atk *= 1.25;
  if (c.gifts?.includes('g_kiem_cot')) atk *= 1.1;
  if (c.mount === 'rong') ((atk *= 1.2), (hp *= 1.2));
  // trang bị
  const g = gearFx(c.equipped);
  atk *= 1 + g.atk / 100;
  def *= 1 + g.def / 100;
  hp *= 1 + g.hp / 100;
  // thần binh truyền kiếp: mỗi đời truyền qua +8% công (tối đa 10 đời)
  if (c.legend && c.equipped.vu_khi === c.legend.item) atk *= 1 + Math.min(10, c.legend.lv) * ksLegendPer(c);
  // vũ khí đã rèn
  atk *= forgeMul(c) * sealAtk(c);
  def *= sealDef(c) * forgeDefMul(c);
  hp *= sealHp(c) * forgeHpMul(c);
  // tuổi già sức yếu
  if (c.age / c.lifespan > 0.85) ((atk *= 0.85), (hp *= 0.85));
  return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
}

export function monsterStats(m: Monster, lv: number = m.lv, c?: Character | null): Fighter {
  if (m.boss) return { hp: 9e15, atk: 9e12, def: 9e12 };
  // Kiếp Số từ 4: quái hung hơn
  const s = Math.pow(GROW, lv) * ksMonster(c);
  return { hp: Math.round(115 * s), atk: Math.round(13.8 * s), def: Math.round(4 * s) };
}

export type Danger = 'de' | 'vua' | 'nguy' | 'tu';

export function dangerOf(c: Character, m: Monster): Danger {
  if (m.boss) return 'tu';
  const d = effLv(c, m) - combatLevel(c);
  if (d <= -3) return 'de';
  if (d <= 0) return 'vua';
  if (d <= 2) return 'nguy';
  return 'tu';
}

export const DANGER_TEXT: Record<Danger, string> = { de: tr('Dễ', "Easy"), vua: tr('Vừa sức', "Fair fight"), nguy: tr('Nguy hiểm', "Dangerous"), tu: tr('Tử địa', "Death zone") };

/** Sát thương một đòn */
export function hit(atk: number, def: number, rnd: () => number, critRate = 0.15): { dmg: number; crit: boolean } {
  if (rnd() < 0.12) return { dmg: 0, crit: false }; // né được
  const crit = rnd() < critRate;
  const raw = atk * (0.7 + rnd() * 0.6) * (crit ? 2 : 1);
  return { dmg: Math.max(1, Math.round(raw - def * 0.5)), crit };
}

/** Ước tính tu vi nhận được khi thắng (để hiện ở bảng chọn quái) */
export function killExp(c: Character, m: Monster): number {
  if (m.boss) return 0;
  const d = effLv(c, m) - combatLevel(c);
  // mỗi con quái vừa sức cho khoảng 1/3 năm tu luyện, một năm trảm 4-6 con nên nhanh gấp 2-3 lần ngồi thiền
  const yearly = ([6, 30, 30, 34, 38, 42, 46, 50][c.realm] ?? 50) * (0.6 + c.stats.ngoTinh / 100);
  const base = Math.max((REALMS[c.realm]?.need ?? 60) * 0.03, yearly * 0.35);
  const factor = d <= -4 ? 0.15 : clamp(1 + 0.35 * d, 0.3, 2.4);
  // quái tiến hóa cho nhiều tu vi hơn
  const tierBonus = (1 + tierOf(c, m) * 0.25) * (omenIs('yeu_trieu') ? 1.25 : 1);
  return Math.max(1, Math.round(base * factor * tierBonus * c.linhCanMul * (1 + gearFx(c.equipped).exp / 100) * sealExp(c)));
}

/** Hệ số rơi đồ chung (26/10: giảm 25% vì người chơi nhặt đồ quá dễ) */
export const DROP_MUL = 0.75;

export function killReward(c: Character, m: Monster, ctx: EffectCtx, lootChance = 0.12): string[] {
  const notes: string[] = [];
  addCult(c, killExp(c, m));
  money(c, Math.round((2 + m.lv * 3) * (0.7 + ctx.rnd() * 0.6)));
  c.kills = c.kills ?? {};
  const n = (c.kills[m.id] = (c.kills[m.id] ?? 0) + 1);
  if (n === 1) {
    // lần đầu trảm: thưởng lớn
    const bonus = killExp(c, m) * 2;
    addCult(c, bonus);
    notes.push(tr(`Lần đầu hạ được ${m.name} ở ${m.place}. Lĩnh ngộ được cách đánh của nó (+${bonus} tu vi).`, `First time defeating ${m.name} at ${m.place}. You grasp how it fights (+${bonus} cultivation).`));
  }
  if (n === 10 || n === 50) {
    const bonus = killExp(c, m) * (n === 10 ? 5 : 12);
    addCult(c, bonus);
    money(c, m.lv * (n === 10 ? 20 : 60));
    ctx.fx('layer', tr(`Trảm ${n}`, `${n} slain`));
    notes.push(tr(`Đã trảm ${n} ${m.name}. Chiến kỹ tinh thông hơn (+${bonus} tu vi).`, `${n} ${m.name} slain. Your combat skills sharpen (+${bonus} cultivation).`));
  }
  // rơi đồ độc quyền của loài quái (đánh quái quá yếu thì gần như không rơi, chống farm)
  const drops = ITEMS.filter((i) => i.from?.includes(m.id));
  const df = dropFactor(c, m);
  if (drops.length && df > 0) {
    const g = gearFx(c.equipped);
    const p = (0.05 + (c.stats.khiVan - 50) / 2500) * (1 + tierOf(c, m) * 0.5) * (1 + g.drop / 100) * df * DROP_MUL * ksDrop(c);
    if (ctx.rnd() < p) {
      const it = drops[Math.floor(ctx.rnd() * drops.length)];
      if (c.inventory.includes(it.id)) {
        const sell = 60 + m.lv * 25;
        money(c, sell);
        notes.push(tr(`${m.name} rơi ra thêm một ${it.name}. Bạn đã có rồi nên bán được ${sell} linh thạch.`, `${m.name} dropped another ${it.name}. You already have one, so you sold it for ${sell} spirit stones.`));
      } else {
        giveItem(c, it.id, false);
        ctx.fx('buy', it.name);
        notes.push(tr(`${m.name} rơi ra ${it.name}! (${fxText(it.fx)}) Mở Túi đồ để mặc.`, `${m.name} dropped ${it.name}! (${fxText(it.fx)}) Open your Inventory to equip it.`));
      }
    }
  }
  if (ctx.rnd() < lootChance * df * DROP_MUL * ksDrop(c)) {
    const l = lootDrop(c, m, ctx);
    if (l) notes.push(l);
  }
  const tierBefore = tierOf(c, m);
  if (growMonster(c, m)) {
    const t = tierOf(c, m);
    if (t > tierBefore) {
      notes.push(tr(`Bị săn quá nhiều, loài ${m.name} tiến hóa thành ${monsterName(c, m)} (Lv${effLv(c, m)})! Chúng mạnh lên nhanh hơn bạn.`, `Hunted too much, the ${m.name} evolved into ${monsterName(c, m)} (Lv${effLv(c, m)})! They grow stronger faster than you do.`));
      ctx.fx('evil', monsterName(c, m));
    }
  }
  if (m.human && (m.id === 'son_tac' || m.id === 'thich_khach' || m.id === 'doc_vuong')) c.daoTam = Math.min(100, c.daoTam + 1);
  if (n === 100) notes.push(tr(`Đã trảm 100 con ${m.name}. Giang hồ gọi bạn là khắc tinh của chúng.`, `You have slain 100 ${m.name}. The jianghu calls you their bane.`));
  const r = ctx.rnd() / Math.max(0.05, df * DROP_MUL * ksDrop(c));
  if (r < 0.02) {
    addCult(c, killExp(c, m) * 6);
    ctx.fx('layer', tr('Yêu đan!', "Demon core!"));
    notes.push(tr(`${m.name} rơi ra một viên yêu đan, nuốt vào tu vi tăng vọt.`, `${m.name} dropped a demon core. You swallow it and your cultivation soars.`));
  } else if (r < 0.1) {
    const pill = m.lv >= 13 && ctx.rnd() < 0.3 ? 'truc_co' : ctx.rnd() < 0.5 ? 'tu_khi' : 'hoi_xuan';
    addPill(c, pill);
    ctx.fx('buy', pill === 'truc_co' ? tr('+Trúc Cơ Đan', "+Foundation Pill") : pill === 'tu_khi' ? tr('+Tụ Khí Đan', "+Qi Gathering Pill") : tr('+Hồi Xuân Đan', "+Rejuvenation Pill"));
  }
  if (m.lv >= 11 && ctx.rnd() < 0.02) stat(c, 'khiVan', 1);
  // Ngũ Hành Ấn và Ngũ Hành Phù cho Ngũ Hành Đài trước phi thăng
  const an = gainAn(c, m.el, dangerOf(c, m) === 'de', ctx.rnd);
  if (an) notes.push(an);
  if (m.el && !c.cosmos && m.lv >= 16 && dangerOf(c, m) !== 'de' && (c.phu ?? 0) < 3 && ctx.rnd() < 0.01 * DROP_MUL) {
    c.phu = (c.phu ?? 0) + 1;
    ctx.fx('buy', tr('Ngũ Hành Phù', "Five Elements Talisman"));
    notes.push(tr(`${m.name} rơi ra một tấm Ngũ Hành Phù (${c.phu}/3). Trên Ngũ Hành Đài, phù đổi bản mệnh của bạn sang hệ khắc bóng trong một vòng.`, `${m.name} dropped a Five Elements Talisman (${c.phu}/3). On the Five Elements Platform, it switches your natal element to one that overcomes the shadow's for one round.`));
  }
  return notes;
}

/** Cảnh giới tương ứng cấp quái: Lv1-9 Luyện Khí, 10-12 Trúc Cơ, 13-15 Kim Đan... */
export function monsterRealm(lv: number): number {
  if (lv <= 0) return 0;
  if (lv <= 9) return 1;
  return Math.min(11, 2 + Math.floor((lv - 10) / 3));
}

/** Loài quái người chơi gặp được ở giới hiện tại: phàm giới, tiên giới hay ma giới, cộng quái thí luyện tông môn */
export function monstersFor(c: Character, sectSide: 'chinh' | 'ta' | 'trung' | null): Monster[] {
  if (c.cosmos) return MONSTERS.filter((m) => m.cosmos === c.cosmos);
  return MONSTERS.filter((m) => !m.cosmos && (!m.doKiep || c.realm >= DO_KIEP_REALM) && (!m.sect || m.sect === sectSide));
}

/**
 * Hệ số rơi đồ theo chênh lệch cấp: đánh quái quá yếu để farm thì gần như không rơi.
 * Yếu hơn 6 cấp trở lên: 0; 4-5 cấp: 25%; 2-3 cấp: 60%; ngang: 100%; mạnh hơn từ 2 cấp: 130%.
 */
export function dropFactor(c: Character, m: Monster): number {
  const d = effLv(c, m) - combatLevel(c);
  return d <= -6 ? 0 : d <= -4 ? 0.25 : d <= -2 ? 0.6 : d >= 2 ? 1.3 : 1;
}

const RARE_NAME = [tr('Phàm', "Common"), tr('Tốt', "Fine"), tr('Hiếm', "Rare"), tr('Cực phẩm', "Supreme")];
/** đồ chỉ rơi từ quái thí luyện trong tông môn, không rơi ngẫu nhiên ngoài giang hồ */
const SECT_ONLY = new Set(ITEMS.filter((i) => i.from?.length && i.from.every((id) => MONSTERS.find((m) => m.id === id)?.sect)).map((i) => i.id));
const RARE_SELL = [15, 60, 220, 800];

/**
 * Chiến lợi phẩm ngẫu nhiên khi hạ quái: phần lớn là đồ lởm, thỉnh thoảng ra đồ xịn.
 * Tỉ lệ độ hiếm: phàm 60%, tốt 30%, hiếm 8%, cực phẩm 2% (khí vận, đồ tăng rơi đồ, quái tiến hóa nâng tỉ lệ đồ tốt).
 * Đồ hợp cảnh giới hiện tại (lệch xuống tối đa 2 cảnh giới). Trùng đồ đã có thì bán lấy linh thạch.
 */
export function lootDrop(c: Character, m: Monster, ctx: EffectCtx): string | null {
  const g = gearFx(c.equipped);
  const luck = (1 + Math.max(0, c.stats.khiVan - 50) / 100) * (1 + g.drop / 100) * (1 + tierOf(c, m) * 0.3) * (omenIs('cat_tinh') ? 1.5 : 1);
  const r = ctx.rnd();
  // quái yếu hơn mình từ 3 cấp chỉ rơi đồ phàm, tốt; cực phẩm chỉ ở quái ngang hoặc mạnh hơn
  const gap = effLv(c, m) - combatLevel(c);
  const cap = gap <= -3 ? 1 : gap <= -1 ? 2 : 3;
  const rare = Math.min(cap, r < 0.02 * luck ? 3 : r < 0.1 * luck ? 2 : r < 0.4 * luck ? 1 : 0);
  // đồ theo cấp của quái chứ không theo cảnh giới người chơi
  const mr = Math.min(c.realm, monsterRealm(effLv(c, m)));
  const lo = Math.max(0, mr - 2);
  const ok = (i: (typeof ITEMS)[number]) => i.src !== 'event' && !SECT_ONLY.has(i.id) && (i.rare ?? 0) === rare && i.minRealm <= mr;
  let pool = ITEMS.filter((i) => ok(i) && i.minRealm >= lo);
  if (!pool.length) pool = ITEMS.filter(ok);
  if (!pool.length) return null;
  const fresh = pool.filter((i) => !c.inventory.includes(i.id));
  // 80% ưu tiên món chưa có
  const src = fresh.length && ctx.rnd() < 0.8 ? fresh : pool;
  const it = src[Math.floor(ctx.rnd() * src.length)];
  const tag = `[${RARE_NAME[rare]}]`;
  if (c.inventory.includes(it.id)) {
    const sell = Math.round(RARE_SELL[rare] * (1 + c.realm * 0.5));
    money(c, sell);
    return tr(`${m.name} rơi ra ${tag} ${it.name}, bạn đã có rồi nên đem bán được ${sell} linh thạch.`, `${m.name} dropped ${tag} ${it.name}. You already have it, so you sold it for ${sell} spirit stones.`);
  }
  giveItem(c, it.id, false);
  if (rare >= 3) ctx.fx('layer', tr(`Cực phẩm: ${it.name}`, `Supreme: ${it.name}`));
  else ctx.fx('buy', it.name);
  if (rare === 0) return tr(`Lục được trên xác ${m.name} một ${it.name} cũ kỹ ${tag}. (${fxText(it.fx)})`, `You loot a battered ${it.name} ${tag} from the corpse of ${m.name}. (${fxText(it.fx)})`);
  return tr(`${m.name} rơi ra ${tag} ${it.name}${rare >= 2 ? '!' : '.'} (${fxText(it.fx)}) Mở Túi đồ để mặc.`, `${m.name} dropped ${tag} ${it.name}${rare >= 2 ? '!' : '.'} (${fxText(it.fx)}) Open your Inventory to equip it.`);
}

/** Thua trận: có thể chết. Trả về câu mô tả. */
export function loseFight(c: Character, m: Monster, ctx: EffectCtx): string {
  if (m.boss) {
    // đánh boss chắc chắn thua: hên thì trọng thương, xui thì chết
    if (m.boss === 'chinh') stat(c, 'tamMa', 5);
    const cause =
      m.boss === 'ta'
        ? tr(`Huyết Ma Lão Tổ chỉ khẽ búng tay. Máu trong người bạn sôi lên rồi nổ tung. Bạn chết ở tổng đàn Huyết Sát Môn.`, "The Blood Demon Ancestor merely flicks a finger. The blood in your body boils, then bursts. You die at the Xuesha Sect headquarters.")
        : tr(`Thái Thượng Kiếm Tôn không rút kiếm, chỉ một đạo kiếm ý đã chém bạn làm đôi. Bạn chết dưới chân đỉnh Thanh Vân.`, "The Supreme Sword Venerable doesn't even draw his sword - a single strand of sword intent cleaves you in two. You die at the foot of Qingyun Peak.");
    const f = fatal(c, ctx, 0.5, cause);
    if (c.dead) return tr(`Bạn không biết lượng sức.${f}`, `You overestimated yourself.${f}`);
    stat(c, 'sucKhoe', -60);
    c.cultivation = Math.round(c.cultivation * 0.6);
    return m.boss === 'ta'
      ? tr(`Huyết Ma Lão Tổ cười khẩy, hút đi một phần tu vi rồi ném bạn ra khỏi tổng đàn. Bạn trọng thương, may còn giữ được mạng.${f ?? ''}`, `The Blood Demon Ancestor sneers, drains part of your cultivation and tosses you out of the headquarters. Gravely wounded, you barely escape with your life.${f ?? ''}`)
      : tr(`Kiếm Tôn thu kiếm: "Còn trẻ, đừng phí mạng." Kiếm khí phế mất một phần tu vi của bạn. Bạn trọng thương trở về.${f ?? ''}`, `The Sword Venerable sheathes his sword: "You are young. Don't throw your life away." His sword qi cripples part of your cultivation. You return gravely wounded.${f ?? ''}`);
  }
  // dưới 16 tuổi thua quái không chết (người làng, sư huynh kịp cứu); quái không mạnh hơn mình thì bớt hiểm
  if (c.age < 16) {
    stat(c, 'sucKhoe', -25);
    return tr(`Bạn thua ${m.name}, may có người qua đường kịp xua nó đi. Bạn được cõng về, trọng thương nhưng còn sống.`, `You lose to ${m.name}, but a passerby drives it off just in time. You're carried home, badly hurt but alive.`);
  }
  const d = dangerOf(c, m);
  const f = fatal(c, ctx, d === 'de' || d === 'vua' ? 0.5 : 0.85, huntDeath(m.name, m.place, ctx.rnd));
  // kết cục riêng khi chết vì quái (ở ba cõi đã có kết cục của cõi)
  if (c.dead && !c.cosmos && !c.endTag)
    c.endTag = m.id === 'tho_yeu' ? 'tho_yeu' : m.sect ? 'thi_luyen' : m.human ? 'dao_giang_ho' : d === 'de' || d === 'vua' ? 'khinh_dich' : 'tu_dia';
  if (c.dead) return tr(`Trừ yêu thất bại.${f}`, `The hunt failed.${f}`);
  stat(c, 'sucKhoe', -35);
  return `${huntLose(m.name, ctx.rnd)}${f ?? ''}`;
}

export function fleeChance(c: Character, m: Monster): number {
  if (m.boss) return 0.05;
  const d = effLv(c, m) - combatLevel(c);
  return clamp(0.85 - Math.max(0, d) * 0.12 + gearFx(c.equipped).flee / 100, 0.15, 0.95);
}
