/**
 * Ngày 8e (19/11): Thiên thư quyển III "Cơm Chiều", khung + chặng 1 (Dư Âm). Chữ lấy đúng từ docs/thien-thu-3.md mục 5, 6.
 * - Mở khi đã có go_chuong hoặc dap_chuong. Mạch chính mở đúng thứ tự: kiếp chỉ xét trang kế tiếp (c.tt3 = số trang đã có lúc đầu thai).
 * - Ghi kèm khi kiếp khép (tt3Endings, gọi cạnh alsoEndings). Riêng XXV ghi thẳng ở cầu Nại Hà khi chọn Uống (tt3AtBridge).
 */
import type { Character, Meta } from './types';
import { tr } from '../i18n';
import { TT3_ON } from '../flags';
import { hanhFull, huyetCount } from './khaiMach';

/** Mạch chính đã có code (chặng 1). Thêm chặng thì nối vào đây theo thứ tự. */
export const TT3_MAIN = ['tt3_du_am', 'tt3_dong_xanh', 'tt3_lang_duoi_nui', 'tt3_tre_quy_cua', 'tt3_tieng_dau'] as const;

export const tt3Open = (m: Meta | null | undefined) => TT3_ON && !!(m?.endings?.go_chuong || m?.endings?.dap_chuong);

/** nhánh quyển II: có cả hai thì lấy đập (không biết thứ tự) */
export const tt3NhanhOf = (m: Meta | null | undefined): 'go' | 'dap' => m?.tt3Nhanh ?? (m?.endings?.dap_chuong ? 'dap' : 'go');

/** số trang mạch chính liền nhau đã có */
export function tt3Count(m: Meta | null | undefined): number {
  let n = 0;
  for (const id of TT3_MAIN) {
    if (!m?.endings?.[id]) break;
    n++;
  }
  return n;
}

/** gắn vào nhân vật lúc đầu thai */
export function tt3Born(c: Character, m: Meta) {
  if (!tt3Open(m)) return;
  c.tt3 = tt3Count(m);
  c.tt3Nhanh = tt3NhanhOf(m);
}

const tho = (c: Character) => /thọ nguyên|lifespan/i.test(c.cause ?? '');

/** Kết cục quyển III ghi kèm khi kiếp khép (không thay kết cục chính) */
export function tt3Endings(c: Character, m: Meta | null | undefined): string[] {
  if (!TT3_ON || c.tt3 === undefined || !m) return [];
  const out: string[] = [];
  const has = (id: string) => !!m.endings?.[id];
  const n = c.tt3;
  if (n === 0 && c.age >= 16) out.push('tt3_du_am');
  if (n === 1 && (c.an?.kim ?? 0) >= 3) out.push('tt3_dong_xanh');
  if (n === 2 && !c.cosmos && c.realm >= 5 && tho(c)) out.push('tt3_lang_duoi_nui');
  if (n === 3 && (c.arcs?.de_tu?.s ?? 0) >= 1 && c.arcs?.de_tu?.v !== 'no') out.push('tt3_tre_quy_cua');
  // hệ thống: chân thân (đã có Dư Âm, kể cả vừa mở kiếp này)
  if (!has('tt3_than_khong_mong') && (has('tt3_du_am') || out.includes('tt3_du_am')) && huyetCount(m) >= 10 && hanhFull(m) >= 1) out.push('tt3_than_khong_mong');
  return out.filter((id) => !has(id));
}

/** XXV: ở cầu Nại Hà kế tiếp sau khi có XXIV mà chọn Uống thì mở trang (ghi thẳng). Hất chén thì lần sau thử lại. */
export function tt3AtBridge(m: Meta, drink: boolean): string | null {
  if (!tt3Open(m) || !drink) return null;
  if (!m.endings?.tt3_tre_quy_cua || m.endings?.tt3_tieng_dau) return null;
  return 'tt3_tieng_dau';
}

/** Trang Thiên thư quyển III (XXI-XXV). `text2` là bản nhánh đập chuông khi trang có hai bản. */
export const TT3_PAGES: { id: string; title: string; hint: string; text: string; text2?: string }[] = [
  {
    id: 'tt3_du_am',
    title: tr('XXI. Dư Âm', 'XXI. Afterring'),
    hint: tr('Xong Thiên thư quyển II (gõ hay đập chuông đều được), rồi khép một kiếp sống qua 16 tuổi.', 'Finish Heavenly Tome Volume II (ring or shatter, either works), then end a life after age 16.'),
    text: tr('Bạn gõ chuông đã nhiều năm. Chiều nay, giữa hai tiếng, bạn nghe thêm một tiếng rất nhỏ từ trong lòng chuông. Bạn không gõ tiếng ấy. Nó không đếm ai, nó giống tiếng người đứng ở cổng gọi vọng ra đồng.', 'You have rung the bell for many years. This evening, between two strokes, you hear one more sound, very small, from inside the bell. You did not strike it. It counts no one; it sounds like someone at a gate, calling out across the fields.'),
    text2: tr('Chuông vỡ rồi, không ai đếm nữa. Vậy mà lúc mặt trời xuống, bạn vẫn nghe một tiếng leng keng rất nhỏ từ phía núi tuyết. Tiếng ấy không đếm. Nó gọi.', 'The bell is broken and no one counts anymore. Yet as the sun goes down, you still hear a faint chime from the snowy peak. It does not count. It calls.'),
  },
  {
    id: 'tt3_dong_xanh',
    title: tr('XXII. Mảnh Đồng Rỉ Xanh', 'XXII. Green-Rusted Bronze'),
    hint: tr('Đã có Dư Âm. Trong một kiếp, gom đủ 3 Ngũ Hành Ấn hệ Kim (diệt quái hệ Kim không ở mức Dễ) rồi khép kiếp.', 'Have Afterring. In one life, collect 3 Metal Five Element Seals (slay Metal monsters above Easy), then end that life.'),
    text: tr('Bạn lật vảy đồng trong lòng bàn tay. Đồng của chuông lớn không phải đồng trời. Nó là đồng làng, loại người ta đúc nồi và lưỡi cày. Trên vảy còn vết răng của một đứa trẻ từng cắn thử xem có phải vàng không.', "You turn the flake over in your palm. The great bell's bronze is not heavenly bronze. It is village bronze, the kind used for cooking pots and plowshares. On it is the bite of a child who once tested whether it was gold."),
  },
  {
    id: 'tt3_lang_duoi_nui',
    title: tr('XXIII. Làng Dưới Chân Núi Tuyết', 'XXIII. The Village Below the Snow'),
    hint: tr('Đã có Mảnh Đồng Rỉ Xanh. Đạt Hóa Thần trở lên nhưng không phi thăng, sống ở phàm giới tới khi hết thọ nguyên.', 'Have Green-Rusted Bronze. Reach Spirit Transformation or higher but do not ascend; live in the mortal world until your lifespan runs out.'),
    text: tr('Bạn không bay lên. Bạn ở lại làng, nhìn lúa chín tám mươi mùa. Bà cụ nhà bên kể: ngày xưa cổng nhà cuối xóm treo một cái chuông nhỏ, chiều nào cũng kêu. Rồi thằng con nhà ấy đi tu, bẻ một góc chuông mang theo cho đỡ nhớ nhà, và không về nữa.', 'You do not rise. You stay in the village and watch the rice ripen eighty times. The old woman next door tells you: long ago, the last house in the hamlet had a small bell at its gate that rang every evening. Then the son went off to cultivate, broke off a corner of the bell to ease his homesickness, and never came back.'),
  },
  {
    id: 'tt3_tre_quy_cua',
    title: tr('XXIV. Đứa Trẻ Quỳ Trước Cửa', 'XXIV. The Child at the Door'),
    hint: tr('Đã có Làng Dưới Chân Núi Tuyết. Trong một kiếp, gặp đứa trẻ quỳ trước động phủ và nhận nó làm đồ đệ, rồi khép kiếp.', 'Have The Village Below the Snow. In one life, meet the child kneeling at your cave abode and take them as a disciple, then end that life.'),
    text: tr('Đứa trẻ trong mơ không quỳ. Nó gõ, ngày nào cũng gõ cổng núi tuyết, ba năm liền, tới khi tay nứt chảy máu. Người trên núi nghe hết mà không mở, vì ông đang tập không cần ai. Năm thứ ba ông mở cổng, đặt tên cho nó là Khấu, nghĩa là gõ.', 'The child in the dream does not kneel. He knocks at the gate on the snowy peak, every day, for three years, until his knuckles crack and bleed. The man on the peak hears every knock and does not open, because he is practicing not needing anyone. In the third year he opens the gate and names the boy Khau, which means to knock.'),
  },
  {
    id: 'tt3_tieng_dau',
    title: tr('XXV. Tiếng Chuông Đầu Tiên', 'XXV. The First Toll'),
    hint: tr('Đã có Đứa Trẻ Quỳ Trước Cửa. Lần qua cầu Nại Hà ngay sau đó, chọn uống canh.', 'Have The Child at the Door. At your very next crossing of Naihe Bridge, choose to drink the soup.'),
    text: tr('Lần này bạn uống. Trước khi múc, Mạnh Bà lắc một chiếc chuông đồng nhỏ, rỉ xanh, sứt một góc. Leng keng, đúng tiếng bạn nghe mỗi chiều. Bà nói mà không nhìn bạn: "Chuông lớn luyện từ cái góc sứt này. Chuông lớn chỉ biết đếm. Cái này mới biết gọi."', 'This time you drink. Before ladling, Meng Po shakes a small bronze bell, green with rust, one corner chipped. Ding, the same sound you hear every evening. She speaks without looking at you: "The great bell was forged from this missing corner. The great bell only knows how to count. This one knows how to call."'),
  },
];

export const tt3PageCount = (m: Meta | null | undefined) => TT3_PAGES.filter((p) => !!m?.endings?.[p.id]).length;
