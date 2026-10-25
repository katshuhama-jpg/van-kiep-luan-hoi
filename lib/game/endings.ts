import type { Character } from './types';

/** Sổ Sinh Tử: các kết cục có thể mở. Thứ tự kiểm tra từ hiếm tới thường. */
export interface Ending {
  id: string;
  name: string;
  desc: string;
  hint: string; // gợi ý khi chưa mở
  rare: 0 | 1 | 2 | 3 | 4;
  test: (c: Character) => boolean;
}

const cause = (c: Character) => (c.cause ?? '').toLowerCase();

export const ENDINGS: Ending[] = [
  { id: 'xuyen_khong', name: 'Xuyên Không', desc: 'Bước qua khe nứt không gian, tỉnh dậy giữa phố Hà Nội năm 2026.', hint: 'Có những khe nứt không nên bước vào... hoặc nên.', rare: 4, test: (c) => c.endTag === 'xuyen_khong' },
  { id: 'phi_thang', name: 'Phi Thăng Tiên Giới', desc: 'Vượt chín đạo lôi kiếp, bước lên tiên giới.', hint: 'Đi đến tận cùng con đường tu tiên.', rare: 4, test: (c) => c.ascended },
  { id: 'ma_ton', name: 'Ma Tôn Giáng Thế', desc: 'Tà đạo đến cực điểm, thiên hạ nghe tên đã run sợ.', hint: 'Đạo tâm đen như mực, tu vi cao ngất.', rare: 3, test: (c) => c.daoTam <= -80 && c.realm >= 5 },
  { id: 'thanh_phat', name: 'Lập Địa Thành Phật', desc: 'Tọa hóa để lại xá lợi bảy màu, muôn dân lập miếu thờ.', hint: 'Từ bi tột cùng, đi đường Phật.', rare: 3, test: (c) => c.daoTam >= 70 && (c.path === 'phat' || c.realm >= 4) && cause(c).includes('thọ nguyên') },
  { id: 'cuoi_rong', name: 'Long Kỵ Sĩ', desc: 'Chết đi khi vẫn còn con rồng mình nuôi từ một quả trứng.', hint: 'Một quả trứng lạ trong rừng...', rare: 3, test: (c) => c.mount === 'rong' },
  { id: 'he_thong', name: 'Ký Chủ Của Hệ Thống', desc: 'Cả đời làm nhiệm vụ cho một giọng nói trong đầu.', hint: 'Đinh!', rare: 3, test: (c) => (c.arcs?.he_thong?.s ?? 0) >= 3 },
  { id: 'pham_nhan', name: 'Phàm Nhân Hạnh Phúc', desc: 'Không tu tiên, sống trọn đời bên người thương, con cháu đầy nhà.', hint: 'Đôi khi không tu mới là đắc đạo.', rare: 2, test: (c) => c.realm <= 1 && c.age >= 65 && !!c.partner && cause(c).includes('thọ nguyên') },
  { id: 'tam_nien', name: 'Ba Mươi Năm Hà Đông', desc: 'Kẻ từng bị từ hôn, cuối cùng đã vả mặt cả thiên hạ.', hint: 'Đừng khinh thiếu niên nghèo.', rare: 2, test: (c) => c.arcs?.tu_hon?.v === 'thang' },
  { id: 'dai_phu', name: 'Phú Khả Địch Quốc', desc: 'Chết đi để lại núi linh thạch, con cháu tranh nhau chia gia tài.', hint: 'Tiền nhiều để làm gì?', rare: 2, test: (c) => c.linhThach >= 8000 },
  { id: 'tru_yeu_vuong', name: 'Trảm Yêu Vương', desc: 'Một đời giết quá trăm yêu ma.', hint: 'Giết, giết nữa, giết mãi.', rare: 2, test: (c) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0) >= 100 },
  { id: 'phan_do', name: 'Chết Dưới Tay Đồ Đệ', desc: 'Dạy hết cho đồ đệ, rồi chết bởi chính chiêu mình dạy.', hint: 'Dạy học trò, chớ dạy hết.', rare: 2, test: (c) => c.endTag === 'phan_do' },
  { id: 'lan_kha', name: 'Lạn Kha', desc: 'Xem một ván cờ của tiên nhân, xuống núi đã hết một đời.', hint: 'Một ván cờ trên đỉnh núi.', rare: 2, test: (c) => c.endTag === 'lan_kha' },
  { id: 'qua_do', name: 'Chết Vì Quá Độ', desc: 'Làm một việc quá nhiều năm liền, thân thể không chịu nổi.', hint: 'Cái gì nhiều quá cũng không tốt.', rare: 1, test: (c) => c.endTag === 'qua_do' },
  { id: 'be_quan', name: 'Bộ Xương Trong Động Phủ', desc: 'Bế quan mãi không ra, người ta chỉ tìm thấy bộ xương khô.', hint: 'Bế quan cũng cần biết điểm dừng.', rare: 1, test: (c) => c.endTag === 'be_quan' },
  { id: 'thien_kiep', name: 'Tro Bụi Dưới Thiên Kiếp', desc: 'Không vượt nổi lôi kiếp.', hint: 'Trời không dung.', rare: 1, test: (c) => cause(c).includes('thiên kiếp') || cause(c).includes('lôi') },
  { id: 'tau_hoa', name: 'Tẩu Hỏa Nhập Ma', desc: 'Tâm ma phản phệ, kinh mạch nổ tung.', hint: 'Đừng để tâm ma lớn quá.', rare: 1, test: (c) => cause(c).includes('tẩu hỏa') || cause(c).includes('tâm ma') },
  { id: 'chet_yeu', name: 'Yểu Mệnh', desc: 'Ra đi khi còn chưa kịp lớn.', hint: 'Trẻ con cũng có thể chết.', rare: 0, test: (c) => c.age < 13 },
  { id: 'tho_tan', name: 'Thọ Chung Chính Tẩm', desc: 'Thọ nguyên cạn, ra đi thanh thản.', hint: 'Sống đến hết tuổi trời.', rare: 0, test: (c) => cause(c).includes('thọ nguyên') },
  { id: 'bat_dac', name: 'Chết Không Toàn Thây', desc: 'Bỏ mạng giữa giang hồ hiểm ác.', hint: 'Giang hồ hiểm ác.', rare: 0, test: () => true },
];

export function endingOf(c: Character): Ending {
  return ENDINGS.find((e) => e.test(c)) ?? ENDINGS[ENDINGS.length - 1];
}

export const RARE_COLOR = ['#8a7a66', '#3d6fb0', '#8a3ad0', '#d9822b', '#d0202e'];
