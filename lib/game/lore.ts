import type { Career, Character, Meta } from './types';

/**
 * Thiên thư: mạch truyện chính xuyên kiếp. Vì sao bạn cứ phải luân hồi mãi?
 * Mỗi mảnh ký ức mở khi đạt một cột mốc lớn qua các kiếp. Gom đủ 10 mảnh thì ở kiếp sau
 * sẽ gặp lại chính mình thuở ban đầu, và được chọn: thoát khỏi Vạn Kiếp hay ở lại.
 */

export interface LoreFragment {
  id: string;
  title: string;
  hint: string; // cách mở, hiện khi chưa có
  text: string;
  check: (m: Meta, c: Character, k: Career) => boolean;
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
];

export const LORE_TOTAL = LORE.length;

/** Các mảnh mới mở khi một kiếp khép lại */
export function newLore(m: Meta, c: Character, k: Career): LoreFragment[] {
  const have = new Set(m.lore ?? []);
  return LORE.filter((f) => !have.has(f.id) && f.check(m, c, k));
}

export const loreDone = (m: Meta | null | undefined) => (m?.lore ?? []).length >= LORE_TOTAL;
