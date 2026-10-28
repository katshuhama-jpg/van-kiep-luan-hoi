import type { Career, Character, Meta } from './types';
import { tr } from '../i18n';

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
  loi_dai?: number; // trận lôi đài đã thắng
}

const nEnd = (m: Meta) => Object.keys(m.endings ?? {}).length;

export const LORE: LoreFragment[] = [
  {
    id: 'chuong',
    title: tr('I. Tiếng chuông', "I. The bell"),
    hint: tr('Sống trọn một kiếp người.', "Live one full life."),
    text: tr('Mỗi lần chết đi, bạn nghe một tiếng chuông. Không phải chuông chùa, không phải chuông Diêm La. Nó vang lên từ một nơi rất xa, rất cũ, như thể ai đó đang đếm. Lần này, bạn đếm cùng nó: một.', "Each time you die, you hear a bell. Not a temple bell, not the bell of Yama. It rings from somewhere very far and very old, as if someone were counting. This time, you count along with it: one."),
    check: (m) => m.lives >= 1,
  },
  {
    id: 'mat',
    title: tr('II. Khuôn mặt quen', "II. A familiar face"),
    hint: tr('Trải qua 5 kiếp.', "Live through 5 lives."),
    text: tr('Năm kiếp, năm khuôn mặt khác nhau. Nhưng trong giấc mơ nào bạn cũng thấy một người đứng quay lưng trên đỉnh núi tuyết. Người đó không bao giờ quay lại. Bạn bắt đầu ngờ rằng người đó cũng đang chờ bạn.', "Five lives, five different faces. Yet in every dream you see someone standing with their back to you atop a snowy peak. They never turn around. You begin to suspect they are waiting for you, too."),
    check: (m) => m.lives >= 5,
  },
  {
    id: 'kim_dan',
    title: tr('III. Viên đan có vân', "III. The veined pill"),
    hint: tr('Lần đầu kết Kim Đan.', "Form a Golden Core for the first time."),
    text: tr('Khi Kim Đan thành, bạn nhìn vào nội thị và thấy trên đan có vân, như chữ viết. Không ai đọc được thứ chữ ấy, trừ bạn. Nó chỉ có một câu: "Ta đã chia mình làm vạn mảnh."', "When your Golden Core forms, you turn your gaze inward and see veins on its surface, like writing. No one can read that script but you. It holds a single line: \"I have split myself into ten thousand pieces.\""),
    check: (_m, _c, k) => k.maxRealm >= 3,
  },
  {
    id: 'so_sinh_tu',
    title: tr('IV. Những cái chết', "IV. The deaths"),
    hint: tr('Mở 5 kết cục trong Sổ Sinh Tử.', "Unlock 5 endings in the Book of Life and Death."),
    text: tr('Chết vì kiếm, vì độc, vì đói, vì già. Mỗi cái chết là một câu trả lời sai cho cùng một câu hỏi. Bạn vẫn chưa biết câu hỏi là gì, nhưng đã biết nó không nằm ở cái chết.', "Death by sword, by poison, by hunger, by old age. Each death is a wrong answer to the same question. You still don't know what the question is, but you know it does not lie in death."),
    check: (m) => nEnd(m) >= 5,
  },
  {
    id: 'an_oan',
    title: tr('V. Ân và oán', "V. Kindness and grudges"),
    hint: tr('Thắng người chơi khác 3 lần qua các kiếp.', "Defeat other players 3 times across your lives."),
    text: tr('Những người bạn gặp trên giang hồ, có kẻ cũng nghe tiếng chuông ấy. Có lần, trước khi gục xuống, đối thủ thì thầm: "Hóa ra ngươi cũng là một mảnh." Bạn chưa kịp hỏi thêm thì hắn đã đi luân hồi.', "Some of those you meet in the jianghu hear that bell too. Once, before falling, an opponent whispered: \"So you're a piece as well.\" Before you could ask more, he was gone to reincarnation."),
    check: (_m, _c, k) => k.duelWins >= 3,
  },
  {
    id: 'hoa_than',
    title: tr('VI. Người trên núi tuyết', "VI. The one on the snowy peak"),
    hint: tr('Lần đầu đạt Hóa Thần.', "Reach Spirit Transformation for the first time."),
    text: tr('Nguyên thần xuất khiếu, bạn bay lên đỉnh núi tuyết trong mơ. Người kia vẫn quay lưng, nhưng lần này nói: "Vạn kiếp trước, ta là Vạn Kiếp Chân Nhân. Ta tu đến tận cùng mà không hiểu vì sao phải sống. Nên ta đập vỡ mình, để mỗi mảnh đi tìm câu trả lời."', "Your primordial spirit leaves your body and flies to the snowy peak of your dreams. The figure still faces away, but this time speaks: \"Ten thousand lives ago, I was Wanjie Zhenren. I cultivated to the very end and still did not understand why one must live. So I shattered myself, and sent each piece to find the answer.\""),
    check: (_m, _c, k) => k.maxRealm >= 5,
  },
  {
    id: 'phi_thang',
    title: tr('VII. Cửa trời', "VII. The gate of heaven"),
    hint: tr('Phi thăng lên tiên giới hoặc vào ma giới lần đầu.', "Ascend to the Immortal Realm or enter the Demon Realm for the first time."),
    text: tr('Tiên giới không có câu trả lời. Ma giới cũng không. Ở cả hai nơi đều có những kẻ đã sống vạn năm mà vẫn hỏi đúng câu ấy. Bạn hiểu ra: lên cao không phải là đến nơi.', "The Immortal Realm holds no answer. Nor does the Demon Realm. In both live beings ten thousand years old who still ask that same question. You understand now: rising higher is not arriving."),
    check: (_m, c, k) => !!c.cosmos || k.ascPaths.length >= 1,
  },
  {
    id: 'hai_duong',
    title: tr('VIII. Hai con đường', "VIII. Two roads"),
    hint: tr('Từng đi qua 4 con đường tu tập khác nhau.', "Walk 4 different cultivation Paths."),
    text: tr('Kiếm, đan, trận, Phật, ma, yêu. Mỗi đường là một mảnh của Vạn Kiếp Chân Nhân đã thử. Không đường nào sai, không đường nào đủ. Câu trả lời không nằm ở cách sống, mà ở người sống.', "Sword, alchemy, formation, Buddha, demon, yao. Each Path is a piece of Wanjie Zhenren trying. No Path is wrong, and none is enough. The answer is not in how one lives, but in the one who lives."),
    check: (_m, _c, k) => k.paths.length >= 4,
  },
  {
    id: 'nua_so',
    title: tr('IX. Nửa cuốn sổ', "IX. Half a book"),
    hint: tr('Mở 13 kết cục trong Sổ Sinh Tử.', "Unlock 13 endings in the Book of Life and Death."),
    text: tr('Mạnh Bà đưa chén canh, bạn đẩy ra. Bà không ép, chỉ nói: "Ngươi đã chết đủ nhiều để nhớ. Lần sau, đừng tìm câu trả lời nữa. Hãy nhìn lại những người đã đi cùng ngươi."', "Meng Po offers you the bowl of soup, and you push it away. She does not insist, only says: \"You have died enough times to remember. Next time, stop searching for the answer. Look back at those who walked beside you.\""),
    check: (m) => nEnd(m) >= 13,
  },
  {
    id: 'dinh',
    title: tr('X. Đỉnh cao nhất', "X. The highest peak"),
    hint: tr('Tu tới Đại La Kim Tiên hoặc Ma Đế.', "Reach Daluo Golden Immortal or Demon Emperor."),
    text: tr('Đứng trên đỉnh ba giới, bạn quay lại. Người trên núi tuyết cuối cùng cũng quay mặt. Đó là khuôn mặt của bạn, của mọi kiếp bạn từng sống, của cả những người bạn từng thương, từng ghét. "Ta tìm câu trả lời vạn kiếp," người ấy nói, "hóa ra câu trả lời là chính những kiếp ấy."', "Standing atop the Three Realms, you turn around. The one on the snowy peak finally turns too. It is your face - the face of every life you have lived, of everyone you ever loved and ever hated. \"I sought the answer for ten thousand lives,\" they say, \"and the answer was those lives themselves.\""),
    check: (_m, _c, k) => k.maxRealm >= 11,
  },
  // ---------- Quyển II: Vạn Mảnh ----------
  {
    id: 'chuong_11',
    book: 2,
    title: tr('XI. Tiếng chuông thứ mười một', "XI. The eleventh toll"),
    hint: tr('Đạt kết cục Vạn Kiếp Quy Nhất.', "Reach the ending Ten Thousand Lives Become One."),
    text: tr('Bạn tưởng tiếng chuông đã im. Nhưng khi linh hồn vừa thoát ra, nó lại vang lên, lần này không đếm bạn. Nó đếm những người khác. Hóa ra Vạn Kiếp Chân Nhân không chỉ vỡ làm một mảnh là bạn.', "You thought the bell had fallen silent. But as your soul slips free, it rings again - and this time it is not counting you. It is counting the others. Wanjie Zhenren did not shatter into just one piece called you."),
    check: (m) => quyNhatDone(m),
  },
  {
    id: 'manh_khac',
    book: 2,
    title: tr('XII. Mảnh khác', "XII. Another piece"),
    hint: tr('Kết nghĩa với một đạo hữu đã mở từ 5 mảnh Thiên thư.', "Become sworn kin with a fellow Daoist who has unlocked 5 or more Heavenly Tome fragments."),
    text: tr('Uống chén rượu kết nghĩa, bạn thấy trong mắt huynh đệ có bóng núi tuyết. Hắn cũng nghe tiếng chuông. "Ta cứ tưởng chỉ mình ta," hắn cười. Hai mảnh vỡ chạm nhau, vết nứt khớp vào nhau như chưa từng rời.', "Drinking the cup of brotherhood, you see the shadow of a snowy peak in your sworn brother's eyes. He hears the bell too. \"I thought it was only me,\" he laughs. Two shards touch, and their cracks fit together as if they had never parted."),
    check: (_m, _c, _k, s) => (s?.sworn_lore ?? 0) >= 1,
  },
  {
    id: 'truyen_cong',
    book: 2,
    title: tr('XIII. Kẻ cũng nghe chuông', "XIII. Another who hears the bell"),
    hint: tr('Truyền công cho người khác, hoặc nhận truyền công từ một tiền bối.', "Transfer your power to another, or receive a senior's transmitted power."),
    text: tr('Công lực chảy từ người này sang người khác, mang theo một mẩu ký ức không phải của mình. Bạn nhớ ra một ngọn đèn, một căn nhà, một người mẹ chưa từng gặp. Chân Nhân vỡ ra, nhưng các mảnh vẫn chảy về nhau.', "Power flows from one person into another, carrying a scrap of memory that is not your own. You remember a lamp, a house, a mother you have never met. The Zhen Ren shattered, yet the pieces still flow back toward each other."),
    check: (_m, _c, _k, s) => (s?.truyen ?? 0) >= 1,
  },
  {
    id: 'loi_vieng',
    book: 2,
    title: tr('XIV. Lời viếng', "XIV. The mourner"),
    hint: tr('Viếng 5 ngôi mộ của người khác ở nghĩa trang.', "Visit 5 other players' graves in the cemetery."),
    text: tr('Đứng trước năm ngôi mộ lạ, bạn đọc từng dòng bia. Ai cũng chết vì một câu hỏi giống nhau. Bạn thắp hương cho họ như thắp cho chính mình, và lần đầu tiên thấy tiếng chuông ngập ngừng, như kẻ đếm bị đếm nhầm.', "Standing before five strangers' graves, you read each epitaph. Every one of them died of the same question. You burn incense for them as if for yourself, and for the first time you hear the bell falter, like a counter who has lost count."),
    check: (_m, _c, _k, s) => (s?.vieng ?? 0) >= 5,
  },
  {
    id: 'chien_thu',
    book: 2,
    title: tr('XV. Lôi đài', "XV. The Arena"),
    hint: tr('Thắng 3 trận lôi đài (hoặc đánh xong một trận chiến thư).', "Win 3 Arena bouts (or finish one challenge)."),
    text: tr('Kiếm chạm kiếm, bạn nghe thấy tiếng chuông vang ngay giữa hai lưỡi thép. Có kẻ muốn các mảnh đánh nhau, muốn các mảnh mãi không ghép lại được. Đối thủ hạ kiếm trước: "Ngươi cũng nghe thấy, đúng không?"', "Blade meets blade, and you hear the bell ring right between the two edges of steel. Someone wants the pieces to fight each other, wants them never to fit back together. Your opponent lowers their sword first: \"You hear it too, don't you?\""),
    check: (_m, _c, _k, s) => (s?.chien ?? 0) >= 1 || (s?.loi_dai ?? 0) >= 3,
  },
  {
    id: 'ba_coi',
    book: 2,
    title: tr('XVI. Ba cõi một trời', "XVI. Three realms, one sky"),
    hint: tr('Qua các kiếp, từng lên đủ Tiên giới, Ma giới và Thái Hư giới.', "Across your lives, reach the Immortal Realm, the Demon Realm and the Great Void Realm."),
    text: tr('Tiên, ma, hư không. Ba cõi khác nhau mà cùng chung một bầu trời, và trên bầu trời ấy treo một quả chuông không ai nhìn thấy. Nó không thuộc cõi nào. Nó là thứ dựng nên cả ba.', "Immortal, demon, void. Three different realms under one shared sky, and in that sky hangs a bell no one can see. It belongs to no realm. It is what built all three."),
    check: (_m, _c, k) => (k.cosmoses ?? []).length >= 3,
  },
  {
    id: 'guong_lanh',
    book: 2,
    title: tr('XVII. Gương không nứt', "XVII. The uncracked mirror"),
    hint: tr('Qua Ngũ Hành Vấn Tâm Đài mà không ngã lần nào.', "Clear the Five Elements Heart-Trial Platform without falling once."),
    text: tr('Năm bóng của bạn lần lượt cúi đầu. Bóng cuối không tan đi mà nói nhỏ: "Chân Nhân không tự đập vỡ mình. Có kẻ đã đánh ông, bằng một tiếng chuông. Ông chỉ kịp nói dối chúng ta, để các mảnh đừng sợ."', "Your five shadows bow their heads one by one. The last does not fade, but whispers: \"The Zhen Ren did not shatter himself. Someone struck him - with the toll of a bell. He only had time to lie to us, so the pieces would not be afraid.\""),
    check: (m, _c, k) => !!k.nhdClean || (m.itemBook ?? []).includes('ngu_hanh_vien_man_chau'),
  },
  {
    id: 'so_day',
    book: 2,
    title: tr('XVIII. Sổ đầy', "XVIII. The full book"),
    hint: tr('Mở 30 kết cục trong Sổ Sinh Tử.', "Unlock 30 endings in the Book of Life and Death."),
    text: tr('Sổ Sinh Tử đã kín ba mươi trang. Mạnh Bà gấp sổ lại, lần đầu tiên nhìn thẳng vào bạn: "Ta chép sổ thay cho kẻ ấy. Hắn ở trên đỉnh cao nhất của các cõi, gõ chuông mỗi khi một mảnh chết. Ngươi đủ sức gặp hắn rồi."', "Thirty pages of the Book of Life and Death are filled. Meng Po closes it and, for the first time, looks you straight in the eye: \"I keep this book on behalf of another. He sits on the highest peak of all the realms and strikes the bell each time a piece dies. You are strong enough to face him now.\""),
    check: (m) => nEnd(m) >= 30,
  },
  {
    id: 'ke_go_chuong',
    book: 2,
    title: tr('XIX. Kẻ Gõ Chuông', "XIX. The Bell Ringer"),
    hint: tr('Ở cảnh giới cuối của một cõi, đánh bại kẻ đang gõ chuông.', "At the final realm of a world, defeat the one who rings the bell."),
    text: tr('Kẻ Gõ Chuông không có mặt. Hắn chỉ là một bàn tay cầm dùi và một giọng nói: "Không có ta, các ngươi đã quên nhau từ vạn kiếp trước. Ta đếm để các ngươi còn nhớ mình từng là một." Dùi chuông rơi xuống chân bạn.', "The Bell Ringer has no face. He is only a hand holding a mallet, and a voice: \"Without me, you would have forgotten each other ten thousand lives ago. I count so you remember that you were once one.\" The mallet falls at your feet."),
    check: (m) => !!m.chuongWin,
  },
  {
    id: 'chuong_vo',
    book: 2,
    title: tr('XX. Chuông vỡ', "XX. The broken bell"),
    hint: tr('Cầm dùi chuông, tự chọn: gõ tiếp hay đập vỡ.', "Take the mallet and choose: keep ringing, or shatter the bell."),
    text: tr('Bạn đã chọn. Dù tiếng chuông còn vang hay đã tắt, vạn mảnh từ nay biết tên nhau. Chúng không cần một Chân Nhân nữa. Chúng có nhau.', "You have chosen. Whether the bell still rings or has gone silent, the ten thousand pieces now know each other's names. They no longer need a Zhen Ren. They have each other."),
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
