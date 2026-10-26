import type { Career, Character, Meta } from './types';

/**
 * Thiên thư: mạch truyện chính xuyên kiếp. Vì sao bạn cứ phải luân hồi mãi?
 * Mỗi mảnh ký ức mở khi đạt một cột mốc lớn qua các kiếp. Gom đủ 10 mảnh thì ở kiếp sau
 * sẽ gặp lại chính mình thuở ban đầu, và được chọn: thoát khỏi Vạn Kiếp hay ở lại.
 */

export interface LoreFragment {
  id: string;
  book?: 2; // Quyển II: mở sau Vạn Kiếp Quy Nhất
  title: string;
  hint: string; // cách mở, hiện khi chưa có
  text: string;
  check: (m: Meta, c: Character, k: Career, s: LoreSocial | null) => boolean;
}

/** Số liệu giang hồ (lấy từ máy chủ) để mở các mảnh Quyển II */
export interface LoreSocial {
  sworn_lore: number; // huynh đệ kết nghĩa đã có từ 5 mảnh Thiên thư
  truyen: number; // lần truyền công hoặc được truyền công
  vieng: number; // mộ người khác đã viếng
  chien: number; // trận chiến thư đã đánh xong
}

const nEnd = (m: Meta) => Object.keys(m.endings ?? {}).length;

export const LORE: LoreFragment[] = [
  {
    id: 'chuong',
    title: 'I. Tiếng chuông',
    hint: 'Sống trọn một kiếp người.',
    text: 'Mỗi lần chết đi, bạn nghe một tiếng chuông. Không phải chuông chùa, không phải chuông Diêm La. Nó vang lên từ một nơi rất xa, rất cũ, như thể ai đó đang đếm. Lần này, bạn đếm cùng nó: một.',
    check: (m) => m.lives >= 1,
  },
  {
    id: 'mat',
    title: 'II. Khuôn mặt quen',
    hint: 'Trải qua 5 kiếp.',
    text: 'Năm kiếp, năm khuôn mặt khác nhau. Nhưng trong giấc mơ nào bạn cũng thấy một người đứng quay lưng trên đỉnh núi tuyết. Người đó không bao giờ quay lại. Bạn bắt đầu ngờ rằng người đó cũng đang chờ bạn.',
    check: (m) => m.lives >= 5,
  },
  {
    id: 'kim_dan',
    title: 'III. Viên đan có vân',
    hint: 'Lần đầu kết Kim Đan.',
    text: 'Khi Kim Đan thành, bạn nhìn vào nội thị và thấy trên đan có vân, như chữ viết. Không ai đọc được thứ chữ ấy, trừ bạn. Nó chỉ có một câu: "Ta đã chia mình làm vạn mảnh."',
    check: (_m, _c, k) => k.maxRealm >= 3,
  },
  {
    id: 'so_sinh_tu',
    title: 'IV. Những cái chết',
    hint: 'Mở 5 kết cục trong Sổ Sinh Tử.',
    text: 'Chết vì kiếm, vì độc, vì đói, vì già. Mỗi cái chết là một câu trả lời sai cho cùng một câu hỏi. Bạn vẫn chưa biết câu hỏi là gì, nhưng đã biết nó không nằm ở cái chết.',
    check: (m) => nEnd(m) >= 5,
  },
  {
    id: 'an_oan',
    title: 'V. Ân và oán',
    hint: 'Thắng người chơi khác 3 lần qua các kiếp.',
    text: 'Những người bạn gặp trên giang hồ, có kẻ cũng nghe tiếng chuông ấy. Có lần, trước khi gục xuống, đối thủ thì thầm: "Hóa ra ngươi cũng là một mảnh." Bạn chưa kịp hỏi thêm thì hắn đã đi luân hồi.',
    check: (_m, _c, k) => k.duelWins >= 3,
  },
  {
    id: 'hoa_than',
    title: 'VI. Người trên núi tuyết',
    hint: 'Lần đầu đạt Hóa Thần.',
    text: 'Nguyên thần xuất khiếu, bạn bay lên đỉnh núi tuyết trong mơ. Người kia vẫn quay lưng, nhưng lần này nói: "Vạn kiếp trước, ta là Vạn Kiếp Chân Nhân. Ta tu đến tận cùng mà không hiểu vì sao phải sống. Nên ta đập vỡ mình, để mỗi mảnh đi tìm câu trả lời."',
    check: (_m, _c, k) => k.maxRealm >= 5,
  },
  {
    id: 'phi_thang',
    title: 'VII. Cửa trời',
    hint: 'Phi thăng lên tiên giới hoặc vào ma giới lần đầu.',
    text: 'Tiên giới không có câu trả lời. Ma giới cũng không. Ở cả hai nơi đều có những kẻ đã sống vạn năm mà vẫn hỏi đúng câu ấy. Bạn hiểu ra: lên cao không phải là đến nơi.',
    check: (_m, c, k) => !!c.cosmos || k.ascPaths.length >= 1,
  },
  {
    id: 'hai_duong',
    title: 'VIII. Hai con đường',
    hint: 'Từng đi qua 4 con đường tu tập khác nhau.',
    text: 'Kiếm, đan, trận, Phật, ma, yêu. Mỗi đường là một mảnh của Vạn Kiếp Chân Nhân đã thử. Không đường nào sai, không đường nào đủ. Câu trả lời không nằm ở cách sống, mà ở người sống.',
    check: (_m, _c, k) => k.paths.length >= 4,
  },
  {
    id: 'nua_so',
    title: 'IX. Nửa cuốn sổ',
    hint: 'Mở 13 kết cục trong Sổ Sinh Tử.',
    text: 'Mạnh Bà đưa chén canh, bạn đẩy ra. Bà không ép, chỉ nói: "Ngươi đã chết đủ nhiều để nhớ. Lần sau, đừng tìm câu trả lời nữa. Hãy nhìn lại những người đã đi cùng ngươi."',
    check: (m) => nEnd(m) >= 13,
  },
  {
    id: 'dinh',
    title: 'X. Đỉnh cao nhất',
    hint: 'Tu tới Đại La Kim Tiên hoặc Ma Đế.',
    text: 'Đứng trên đỉnh ba giới, bạn quay lại. Người trên núi tuyết cuối cùng cũng quay mặt. Đó là khuôn mặt của bạn, của mọi kiếp bạn từng sống, của cả những người bạn từng thương, từng ghét. "Ta tìm câu trả lời vạn kiếp," người ấy nói, "hóa ra câu trả lời là chính những kiếp ấy."',
    check: (_m, _c, k) => k.maxRealm >= 11,
  },
  // ---------- Quyển II: Vạn Mảnh ----------
  {
    id: 'chuong_11',
    book: 2,
    title: 'XI. Tiếng chuông thứ mười một',
    hint: 'Đạt kết cục Vạn Kiếp Quy Nhất.',
    text: 'Bạn tưởng tiếng chuông đã im. Nhưng khi linh hồn vừa thoát ra, nó lại vang lên, lần này không đếm bạn. Nó đếm những người khác. Hóa ra Vạn Kiếp Chân Nhân không chỉ vỡ làm một mảnh là bạn.',
    check: (m) => quyNhatDone(m),
  },
  {
    id: 'manh_khac',
    book: 2,
    title: 'XII. Mảnh khác',
    hint: 'Kết nghĩa với một đạo hữu đã mở từ 5 mảnh Thiên thư.',
    text: 'Uống chén rượu kết nghĩa, bạn thấy trong mắt huynh đệ có bóng núi tuyết. Hắn cũng nghe tiếng chuông. "Ta cứ tưởng chỉ mình ta," hắn cười. Hai mảnh vỡ chạm nhau, vết nứt khớp vào nhau như chưa từng rời.',
    check: (_m, _c, _k, s) => (s?.sworn_lore ?? 0) >= 1,
  },
  {
    id: 'truyen_cong',
    book: 2,
    title: 'XIII. Kẻ cũng nghe chuông',
    hint: 'Truyền công cho người khác, hoặc nhận truyền công từ một tiền bối.',
    text: 'Công lực chảy từ người này sang người khác, mang theo một mẩu ký ức không phải của mình. Bạn nhớ ra một ngọn đèn, một căn nhà, một người mẹ chưa từng gặp. Chân Nhân vỡ ra, nhưng các mảnh vẫn chảy về nhau.',
    check: (_m, _c, _k, s) => (s?.truyen ?? 0) >= 1,
  },
  {
    id: 'loi_vieng',
    book: 2,
    title: 'XIV. Lời viếng',
    hint: 'Viếng 5 ngôi mộ của người khác ở nghĩa trang.',
    text: 'Đứng trước năm ngôi mộ lạ, bạn đọc từng dòng bia. Ai cũng chết vì một câu hỏi giống nhau. Bạn thắp hương cho họ như thắp cho chính mình, và lần đầu tiên thấy tiếng chuông ngập ngừng, như kẻ đếm bị đếm nhầm.',
    check: (_m, _c, _k, s) => (s?.vieng ?? 0) >= 5,
  },
  {
    id: 'chien_thu',
    book: 2,
    title: 'XV. Chiến thư',
    hint: 'Đánh xong một trận chiến thư với người chơi khác.',
    text: 'Kiếm chạm kiếm, bạn nghe thấy tiếng chuông vang ngay giữa hai lưỡi thép. Có kẻ muốn các mảnh đánh nhau, muốn các mảnh mãi không ghép lại được. Đối thủ hạ kiếm trước: "Ngươi cũng nghe thấy, đúng không?"',
    check: (_m, _c, _k, s) => (s?.chien ?? 0) >= 1,
  },
  {
    id: 'ba_coi',
    book: 2,
    title: 'XVI. Ba cõi một trời',
    hint: 'Qua các kiếp, từng lên đủ Tiên giới, Ma giới và Thái Hư giới.',
    text: 'Tiên, ma, hư không. Ba cõi khác nhau mà cùng chung một bầu trời, và trên bầu trời ấy treo một quả chuông không ai nhìn thấy. Nó không thuộc cõi nào. Nó là thứ dựng nên cả ba.',
    check: (_m, _c, k) => (k.cosmoses ?? []).length >= 3,
  },
  {
    id: 'guong_lanh',
    book: 2,
    title: 'XVII. Gương không nứt',
    hint: 'Qua Ngũ Hành Vấn Tâm Đài mà không ngã lần nào.',
    text: 'Năm bóng của bạn lần lượt cúi đầu. Bóng cuối không tan đi mà nói nhỏ: "Chân Nhân không tự đập vỡ mình. Có kẻ đã đánh ông, bằng một tiếng chuông. Ông chỉ kịp nói dối chúng ta, để các mảnh đừng sợ."',
    check: (m, _c, k) => !!k.nhdClean || (m.itemBook ?? []).includes('ngu_hanh_vien_man_chau'),
  },
  {
    id: 'so_day',
    book: 2,
    title: 'XVIII. Sổ đầy',
    hint: 'Mở 30 kết cục trong Sổ Sinh Tử.',
    text: 'Sổ Sinh Tử đã kín ba mươi trang. Mạnh Bà gấp sổ lại, lần đầu tiên nhìn thẳng vào bạn: "Ta chép sổ thay cho kẻ ấy. Hắn ở trên đỉnh cao nhất của các cõi, gõ chuông mỗi khi một mảnh chết. Ngươi đủ sức gặp hắn rồi."',
    check: (m) => nEnd(m) >= 30,
  },
  {
    id: 'ke_go_chuong',
    book: 2,
    title: 'XIX. Kẻ Gõ Chuông',
    hint: 'Ở cảnh giới cuối của một cõi, đánh bại kẻ đang gõ chuông.',
    text: 'Kẻ Gõ Chuông không có mặt. Hắn chỉ là một bàn tay cầm dùi và một giọng nói: "Không có ta, các ngươi đã quên nhau từ vạn kiếp trước. Ta đếm để các ngươi còn nhớ mình từng là một." Dùi chuông rơi xuống chân bạn.',
    check: (m) => !!m.chuongWin,
  },
  {
    id: 'chuong_vo',
    book: 2,
    title: 'XX. Chuông vỡ',
    hint: 'Cầm dùi chuông, tự chọn: gõ tiếp hay đập vỡ.',
    text: 'Bạn đã chọn. Dù tiếng chuông còn vang hay đã tắt, vạn mảnh từ nay biết tên nhau. Chúng không cần một Chân Nhân nữa. Chúng có nhau.',
    check: (m) => !!m.endings?.go_chuong || !!m.endings?.dap_chuong,
  },
];

export const LORE1 = LORE.filter((f) => !f.book);
export const LORE2 = LORE.filter((f) => f.book === 2);
/** Số mảnh Quyển I, mở đủ thì gặp lại chính mình */
export const LORE_TOTAL = LORE1.length;
export const LORE2_TOTAL = LORE2.length;

const ids1 = new Set(LORE1.map((f) => f.id));
const ids2 = new Set(LORE2.map((f) => f.id));
export const lore1Count = (m: Meta | null | undefined) => (m?.lore ?? []).filter((id) => ids1.has(id)).length;
export const lore2Count = (m: Meta | null | undefined) => (m?.lore ?? []).filter((id) => ids2.has(id)).length;

/** Phúc duyên thưởng cho lần đầu đạt Vạn Kiếp Quy Nhất */
export const QUY_NHAT_PHUC = 100;

/** Đã từng đạt Vạn Kiếp Quy Nhất (mỗi tài khoản chỉ một lần) */
export const quyNhatDone = (m: Meta | null | undefined) => (m?.endings?.thoat_van_kiep ?? 0) > 0;

/** Các mảnh mới mở khi một kiếp khép lại. Quyển II chỉ mở sau Quy Nhất. */
export function newLore(m: Meta, c: Character, k: Career, s: LoreSocial | null = null): LoreFragment[] {
  const have = new Set(m.lore ?? []);
  const book2 = quyNhatDone(m);
  return LORE.filter((f) => !have.has(f.id) && (!f.book || book2) && f.check(m, c, k, s));
}

export const loreDone = (m: Meta | null | undefined) => lore1Count(m) >= LORE_TOTAL;
