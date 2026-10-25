import { addCult, money, needFor, stat } from './helpers';
import type { Character, EffectCtx } from './types';

/**
 * Tàng Kinh Các khảo thí: bất chợt bắt người chơi trả lời 3 câu hỏi kiếm hiệp (Kim Dung, Cổ Long).
 * Đúng thì được thưởng, sai thì bị phạt.
 */

export interface QuizQ {
  q: string;
  a: [string, string, string, string]; // đáp án đúng luôn ở vị trí 0, khi hiện sẽ xáo trộn
  note: string; // giải thích ngắn sau khi trả lời
}

export const QUIZ_PER_YEAR = 0.1;
export const QUIZ_LEN = 3;

export const QUIZ: QuizQ[] = [
  // ---- Kim Dung ----
  { q: 'Quách Tĩnh là nhân vật chính của bộ truyện nào?', a: ['Anh hùng xạ điêu', 'Thiên long bát bộ', 'Lộc đỉnh ký', 'Tiếu ngạo giang hồ'], note: 'Quách Tĩnh là nhân vật chính của Anh hùng xạ điêu, phần đầu của Xạ điêu tam bộ khúc.' },
  { q: 'Vợ của Quách Tĩnh là ai?', a: ['Hoàng Dung', 'Mục Niệm Từ', 'Hoa Tranh', 'Tiểu Long Nữ'], note: 'Hoàng Dung, con gái Đông Tà Hoàng Dược Sư.' },
  { q: 'Trong Ngũ Tuyệt, "Đông Tà" là ai?', a: ['Hoàng Dược Sư', 'Âu Dương Phong', 'Hồng Thất Công', 'Chu Bá Thông'], note: 'Đông Tà Hoàng Dược Sư, chủ nhân đảo Đào Hoa.' },
  { q: 'Trong Ngũ Tuyệt, "Tây Độc" là ai?', a: ['Âu Dương Phong', 'Hoàng Dược Sư', 'Đoàn Trí Hưng', 'Vương Trùng Dương'], note: 'Tây Độc Âu Dương Phong ở Bạch Đà Sơn.' },
  { q: 'Trong Ngũ Tuyệt, "Bắc Cái" là ai?', a: ['Hồng Thất Công', 'Kiều Phong', 'Lỗ Hữu Cước', 'Chu Bá Thông'], note: 'Bắc Cái Hồng Thất Công, bang chủ Cái Bang, sư phụ của Quách Tĩnh.' },
  { q: 'Trong Ngũ Tuyệt, "Nam Đế" về sau xuất gia lấy pháp hiệu gì?', a: ['Nhất Đăng đại sư', 'Không Kiến thần tăng', 'Huyền Từ phương trượng', 'Hư Trúc'], note: 'Nam Đế Đoàn Trí Hưng, vua Đại Lý, xuất gia thành Nhất Đăng đại sư.' },
  { q: 'Ai giành được Cửu Âm Chân Kinh ở lần Hoa Sơn luận kiếm đầu tiên?', a: ['Vương Trùng Dương', 'Hoàng Dược Sư', 'Hồng Thất Công', 'Âu Dương Phong'], note: 'Trung Thần Thông Vương Trùng Dương, tổ sư phái Toàn Chân.' },
  { q: '"Lão Ngoan Đồng" là biệt hiệu của ai?', a: ['Chu Bá Thông', 'Hồng Thất Công', 'Phong Thanh Dương', 'Bất Giới hòa thượng'], note: 'Chu Bá Thông, sư đệ của Vương Trùng Dương, tính như trẻ con.' },
  { q: 'Người yêu và cũng là sư phụ của Dương Quá là ai?', a: ['Tiểu Long Nữ', 'Lý Mạc Sầu', 'Quách Phù', 'Trình Anh'], note: 'Tiểu Long Nữ của phái Cổ Mộ.' },
  { q: 'Dương Quá bị ai chém đứt một cánh tay?', a: ['Quách Phù', 'Lý Mạc Sầu', 'Kim Luân Pháp Vương', 'Doãn Chí Bình'], note: 'Quách Phù, con gái Quách Tĩnh, chém đứt tay phải của Dương Quá.' },
  { q: '"Xích Luyện Tiên Tử" là biệt hiệu của ai?', a: ['Lý Mạc Sầu', 'Mai Siêu Phong', 'Diệt Tuyệt sư thái', 'Thiên Sơn Đồng Lão'], note: 'Lý Mạc Sầu, sư tỷ của Tiểu Long Nữ, nổi tiếng tàn độc.' },
  { q: 'Độc Cô Cửu Kiếm do ai sáng tạo?', a: ['Độc Cô Cầu Bại', 'Phong Thanh Dương', 'Lệnh Hồ Xung', 'Trương Tam Phong'], note: 'Kiếm Ma Độc Cô Cầu Bại. Về sau Phong Thanh Dương truyền lại cho Lệnh Hồ Xung.' },
  { q: 'Ai truyền Độc Cô Cửu Kiếm cho Lệnh Hồ Xung?', a: ['Phong Thanh Dương', 'Nhạc Bất Quần', 'Nhậm Ngã Hành', 'Phương Chứng đại sư'], note: 'Phong Thanh Dương, trưởng bối ẩn cư sau núi Hoa Sơn.' },
  { q: 'Nhạc Bất Quần là chưởng môn phái nào?', a: ['Hoa Sơn', 'Tung Sơn', 'Hằng Sơn', 'Thái Sơn'], note: 'Nhạc Bất Quần, "Quân tử kiếm" của phái Hoa Sơn, thực chất là ngụy quân tử.' },
  { q: 'Đông Phương Bất Bại luyện bí kíp gì?', a: ['Quỳ Hoa Bảo Điển', 'Cửu Âm Chân Kinh', 'Dịch Cân Kinh', 'Bắc Minh Thần Công'], note: 'Quỳ Hoa Bảo Điển, muốn luyện phải tự cung trước.' },
  { q: 'Nhậm Ngã Hành là giáo chủ của giáo phái nào?', a: ['Nhật Nguyệt Thần Giáo', 'Minh Giáo', 'Tinh Tú Phái', 'Thiên Địa Hội'], note: 'Nhật Nguyệt Thần Giáo trong Tiếu ngạo giang hồ.' },
  { q: 'Hấp Tinh Đại Pháp là tuyệt kỹ của ai?', a: ['Nhậm Ngã Hành', 'Đông Phương Bất Bại', 'Đinh Xuân Thu', 'Tả Lãnh Thiền'], note: 'Nhậm Ngã Hành, hút nội lực của đối thủ làm của mình.' },
  { q: 'Trương Vô Kỵ trở thành giáo chủ của giáo phái nào?', a: ['Minh Giáo', 'Nhật Nguyệt Thần Giáo', 'Cái Bang', 'Bạch Liên Giáo'], note: 'Minh Giáo, trong Ỷ thiên đồ long ký.' },
  { q: '"Kim Mao Sư Vương" là biệt hiệu của ai?', a: ['Tạ Tốn', 'Ân Thiên Chính', 'Vi Nhất Tiếu', 'Thành Côn'], note: 'Tạ Tốn, nghĩa phụ của Trương Vô Kỵ.' },
  { q: 'Trương Tam Phong là tổ sư sáng lập phái nào?', a: ['Võ Đang', 'Thiếu Lâm', 'Nga Mi', 'Côn Lôn'], note: 'Phái Võ Đang, nổi tiếng với Thái Cực Quyền và Thái Cực Kiếm.' },
  { q: 'Thất Thương Quyền là võ công của phái nào?', a: ['Không Động', 'Hoa Sơn', 'Côn Lôn', 'Thiếu Lâm'], note: 'Phái Không Động. Luyện Thất Thương Quyền hại người cũng hại mình.' },
  { q: 'Theo truyện, Ỷ Thiên Kiếm và Đồ Long Đao được đúc lại từ thanh kiếm của ai?', a: ['Dương Quá', 'Quách Tĩnh', 'Độc Cô Cầu Bại', 'Trương Tam Phong'], note: 'Quách Tĩnh và Hoàng Dung đúc lại từ Huyền Thiết Trọng Kiếm của Dương Quá.' },
  { q: 'Kiều Phong từng là bang chủ của bang nào?', a: ['Cái Bang', 'Thiết Chưởng Bang', 'Thanh Bang', 'Cự Kình Bang'], note: 'Kiều Phong, bang chủ Cái Bang, sau mới biết mình là người Khiết Đan.' },
  { q: 'Kiều Phong (Tiêu Phong) thực ra là người tộc nào?', a: ['Khiết Đan', 'Mông Cổ', 'Nữ Chân', 'Tây Hạ'], note: 'Người Khiết Đan, tên thật là Tiêu Phong.' },
  { q: 'Tiêu Phong tự sát ở đâu để ngăn chiến tranh Tống - Liêu?', a: ['Nhạn Môn Quan', 'Tụ Hiền Trang', 'Thiếu Thất Sơn', 'Thiên Sơn'], note: 'Nhạn Môn Quan, nơi cha mẹ ông gặp nạn năm xưa.' },
  { q: 'Lục Mạch Thần Kiếm là tuyệt kỹ của dòng họ nào?', a: ['Họ Đoàn nước Đại Lý', 'Họ Mộ Dung ở Cô Tô', 'Họ Tiêu nước Liêu', 'Họ Vương ở Mạn Đà Sơn Trang'], note: 'Đoàn thị Đại Lý, cất giữ ở chùa Thiên Long.' },
  { q: '"Dĩ bỉ chi đạo, hoàn thi bỉ thân" là phương châm của gia tộc nào?', a: ['Mộ Dung ở Cô Tô', 'Đoàn thị Đại Lý', 'Họ Hoàng đảo Đào Hoa', 'Âu Dương ở Bạch Đà Sơn'], note: 'Cô Tô Mộ Dung: lấy đạo của người trả lại cho người.' },
  { q: 'Hư Trúc xuất thân là tăng nhân của chùa nào?', a: ['Thiếu Lâm', 'Thiên Long', 'Bạch Mã', 'Hàn Sơn'], note: 'Hư Trúc là tiểu hòa thượng chùa Thiếu Lâm, về sau làm chủ Linh Thứu Cung.' },
  { q: 'Đoàn Dự thông thạo bộ pháp nào?', a: ['Lăng Ba Vi Bộ', 'Thê Vân Tung', 'Thần Hành Bách Biến', 'Kim Nhạn Công'], note: 'Lăng Ba Vi Bộ, học được trong động ngọc ở Vô Lượng Sơn.' },
  { q: 'Vi Tiểu Bảo là nhân vật chính của bộ truyện nào?', a: ['Lộc đỉnh ký', 'Bích huyết kiếm', 'Thư kiếm ân cừu lục', 'Hiệp khách hành'], note: 'Lộc đỉnh ký, bộ tiểu thuyết cuối cùng của Kim Dung.' },
  { q: 'Vi Tiểu Bảo có bao nhiêu bà vợ?', a: ['7', '3', '5', '9'], note: 'Bảy bà vợ, trong đó có A Kha và công chúa Kiến Ninh.' },
  { q: 'Vi Tiểu Bảo là bạn thân của vị hoàng đế nào?', a: ['Khang Hy', 'Ung Chính', 'Càn Long', 'Thuận Trị'], note: 'Hoàng đế Khang Hy nhà Thanh.' },
  { q: 'Tác phẩm võ hiệp đầu tay của Kim Dung là bộ nào?', a: ['Thư kiếm ân cừu lục', 'Bích huyết kiếm', 'Anh hùng xạ điêu', 'Tuyết sơn phi hồ'], note: 'Thư kiếm ân cừu lục, đăng báo năm 1955.' },
  { q: 'Tên thật của nhà văn Kim Dung là gì?', a: ['Tra Lương Dung', 'Hùng Diệu Hoa', 'Trần Văn Thống', 'Lương Vũ Sinh'], note: 'Tra Lương Dung. Bút danh Kim Dung là tách chữ Dung trong tên ông.' },
  { q: 'Viên Thừa Chí là nhân vật chính của bộ truyện nào?', a: ['Bích huyết kiếm', 'Uyên ương đao', 'Liên thành quyết', 'Việt nữ kiếm'], note: 'Bích huyết kiếm, bối cảnh cuối đời Minh.' },
  { q: 'Hàng Long Thập Bát Chưởng là tuyệt kỹ trấn bang của bang nào?', a: ['Cái Bang', 'Thiết Chưởng Bang', 'Hải Sa Bang', 'Trường Lạc Bang'], note: 'Cái Bang, thường truyền cho bang chủ cùng Đả Cẩu Bổng Pháp.' },
  // ---- Cổ Long ----
  { q: '"Tiểu Lý Phi Đao" là biệt danh của ai?', a: ['Lý Tầm Hoan', 'Lý Mạc Sầu', 'Lý Thu Thủy', 'Lý Văn Tú'], note: 'Lý Tầm Hoan, phi đao "lệ bất hư phát" (đã ra tay là không trượt).' },
  { q: 'Lý Tầm Hoan là nhân vật chính của bộ truyện nào?', a: ['Đa tình kiếm khách vô tình kiếm', 'Lục Tiểu Phụng truyền kỳ', 'Tuyệt đại song kiêu', 'Biên thành lãng tử'], note: 'Đa tình kiếm khách vô tình kiếm của Cổ Long.' },
  { q: 'Bạn đồng hành trẻ tuổi dùng kiếm nhanh như chớp của Lý Tầm Hoan là ai?', a: ['A Phi', 'Diệp Khai', 'Kinh Vô Mệnh', 'Phó Hồng Tuyết'], note: 'A Phi, kiếm khách trẻ trong Đa tình kiếm khách vô tình kiếm.' },
  { q: 'Lục Tiểu Phụng nổi danh với tuyệt kỹ gì?', a: ['Linh Tê Nhất Chỉ', 'Tiểu Lý Phi Đao', 'Lục Mạch Thần Kiếm', 'Đạn Chỉ Thần Thông'], note: 'Linh Tê Nhất Chỉ: hai ngón tay kẹp được mọi binh khí.' },
  { q: 'Người bạn mù nhưng tinh tường của Lục Tiểu Phụng là ai?', a: ['Hoa Mãn Lâu', 'Tư Không Trích Tinh', 'Tây Môn Xuy Tuyết', 'Lão Thực hòa thượng'], note: 'Hoa Mãn Lâu, mù mắt nhưng yêu đời hơn ai hết.' },
  { q: 'Tây Môn Xuy Tuyết quyết đấu với Diệp Cô Thành ở đâu?', a: ['Tử Cấm Thành', 'Hoa Sơn', 'Thiếu Lâm Tự', 'Bạch Vân Thành'], note: 'Trên nóc điện Thái Hòa trong Tử Cấm Thành, đêm trăng rằm.' },
  { q: '"Đạo Soái" (Hương Soái) là biệt danh của ai?', a: ['Sở Lưu Hương', 'Lục Tiểu Phụng', 'Vi Tiểu Bảo', 'Thẩm Lãng'], note: 'Sở Lưu Hương, siêu trộm phong lưu của Cổ Long.' },
  { q: 'Phó Hồng Tuyết dùng loại binh khí gì?', a: ['Đao', 'Kiếm', 'Phi đao', 'Thương'], note: 'Một thanh đao vỏ đen, chuôi đen, không bao giờ rời tay chàng.' },
  { q: 'Tiểu Ngư Nhi và Hoa Vô Khuyết là nhân vật trong truyện nào?', a: ['Tuyệt đại song kiêu', 'Thất chủng vũ khí', 'Võ lâm ngoại sử', 'Hỏa tính'], note: 'Tuyệt đại song kiêu, hai anh em song sinh bị nuôi để giết nhau.' },
  { q: '"Tam thiếu gia" trong Tam thiếu gia đích kiếm là ai?', a: ['Tạ Hiểu Phong', 'Yến Thập Tam', 'Hoa Vô Khuyết', 'Lục Tiểu Phụng'], note: 'Tạ Hiểu Phong của Thần Kiếm Sơn Trang. Yến Thập Tam là đối thủ của chàng.' },
  { q: 'Tên thật của nhà văn Cổ Long là gì?', a: ['Hùng Diệu Hoa', 'Tra Lương Dung', 'Trần Văn Thống', 'Hoàng Dịch'], note: 'Hùng Diệu Hoa, sinh ở Hồng Kông, lớn lên ở Đài Loan.' },
  { q: 'Thẩm Lãng là nhân vật chính của bộ truyện nào?', a: ['Võ lâm ngoại sử', 'Biên thành lãng tử', 'Lưu tinh hồ điệp kiếm', 'Đại nhân vật'], note: 'Võ lâm ngoại sử của Cổ Long.' },
  { q: 'Đông Phương Bất Bại là nhân vật của nhà văn nào?', a: ['Kim Dung', 'Cổ Long', 'Lương Vũ Sinh', 'Ôn Thụy An'], note: 'Kim Dung, trong Tiếu ngạo giang hồ. Câu này dễ nhầm với Cổ Long!' },
  { q: 'Lục Tiểu Phụng là nhân vật của nhà văn nào?', a: ['Cổ Long', 'Kim Dung', 'Hoàng Dịch', 'Lương Vũ Sinh'], note: 'Cổ Long, bộ Lục Tiểu Phụng truyền kỳ.' },
];

export interface QuizRun {
  qs: { q: string; opts: string[]; ok: number; note: string }[];
}

export function makeQuiz(rnd: () => number): QuizRun {
  const pool = [...QUIZ];
  const qs: QuizRun['qs'] = [];
  for (let i = 0; i < QUIZ_LEN && pool.length; i++) {
    const it = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    const order = [0, 1, 2, 3].sort(() => rnd() - 0.5);
    qs.push({ q: it.q, opts: order.map((k) => it.a[k]), ok: order.indexOf(0), note: it.note });
  }
  return { qs };
}

/** Thưởng phạt theo số câu đúng. Trả về câu tổng kết. */
export function quizReward(c: Character, right: number, ctx: EffectCtx): string {
  const wrong = QUIZ_LEN - right;
  const parts: string[] = [];
  if (right > 0) {
    const exp = Math.max(2, Math.round(needFor(c) * 0.04 * right));
    addCult(c, exp);
    parts.push(`+${exp} tu vi`);
  }
  if (right === QUIZ_LEN) {
    const lt = 30 + c.realm * 40;
    money(c, lt);
    stat(c, 'ngoTinh', 2);
    stat(c, 'khiVan', 1);
    parts.push(`+${lt} linh thạch, ngộ tính +2, khí vận +1`);
    ctx.fx('layer', 'Thông kim bác cổ');
  } else if (right === 2) {
    stat(c, 'ngoTinh', 1);
    parts.push('ngộ tính +1');
  }
  if (wrong > 0) {
    stat(c, 'tamMa', wrong * 3);
    parts.push(`tâm ma +${wrong * 3}`);
  }
  if (wrong === QUIZ_LEN) {
    const lost = Math.round(c.cultivation * 0.08);
    c.cultivation = Math.max(0, c.cultivation - lost);
    stat(c, 'tamCanh', -2);
    parts.push(`mất ${lost} tu vi, tâm cảnh -2`);
    ctx.fx('hurt', 'Thẹn quá');
  }
  const head =
    right === QUIZ_LEN
      ? 'Trả lời trôi chảy cả ba câu, trưởng lão Tàng Kinh Các gật gù khen ngợi.'
      : right === 0
        ? 'Không trả lời được câu nào, bị trưởng lão mắng một trận, xấu hổ đến mất ngủ.'
        : `Trả lời đúng ${right}/${QUIZ_LEN} câu hỏi của trưởng lão Tàng Kinh Các.`;
  return `${head} (${parts.join(', ')})`;
}
