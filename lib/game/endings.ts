import type { Character } from './types';

/** Sổ Sinh Tử: các kết cục có thể mở. Thứ tự kiểm tra từ hiếm tới thường. */
export interface Ending {
  id: string;
  name: string;
  desc: string;
  hint: string; // gợi ý khi chưa mở
  how?: string; // cách mở chi tiết; không có là kết cục bí ẩn, tự tìm hiểu
  rare: 0 | 1 | 2 | 3 | 4;
  test: (c: Character) => boolean;
}

const cause = (c: Character) => (c.cause ?? '').toLowerCase();

export const ENDINGS: Ending[] = [
  {
    id: 'thoat_van_kiep',
    name: 'Vạn Kiếp Quy Nhất',
    desc: 'Gom lại vạn mảnh của chính mình, hiểu ra câu trả lời, và lần đầu tiên tự chọn dừng lại.',
    hint: 'Câu trả lời nằm trong Thiên thư.',
    how: 'Gom đủ 10 mảnh Thiên thư, rồi ở kiếp sau chọn buông bỏ khi gặp lại chính mình.',
    rare: 4,
    test: (c) => c.endTag === 'thoat_van_kiep',
  },
  {
    id: 'go_chuong',
    name: 'Người Giữ Chuông',
    desc: 'Cầm dùi chuông của Thiên Đạo, thay kẻ kia đếm vạn mảnh để không ai bị quên.',
    hint: 'Có kẻ đang gõ chuông trên đỉnh các cõi.',
    how: 'Quyển II Thiên thư: đánh bại Kẻ Gõ Chuông, rồi ở kiếp sau chọn gõ chuông.',
    rare: 4,
    test: (c) => c.endTag === 'go_chuong',
  },
  {
    id: 'dap_chuong',
    name: 'Chuông Vỡ',
    desc: 'Đập vỡ quả chuông của Thiên Đạo, trả tự do cho vạn mảnh của Chân Nhân.',
    hint: 'Có kẻ đang gõ chuông trên đỉnh các cõi.',
    how: 'Quyển II Thiên thư: đánh bại Kẻ Gõ Chuông, rồi ở kiếp sau chọn đập vỡ chuông.',
    rare: 4,
    test: (c) => c.endTag === 'dap_chuong',
  },
  {
    id: 'chung_dao',
    name: 'Chứng Đạo Vĩnh Hằng',
    desc: 'Vượt kiếp cuối cùng của Đại La Kim Tiên hay Ma Đế, đứng ngoài mọi giới, mọi luân hồi.',
    hint: 'Phi thăng chưa phải là hết.',
    how: 'Phi thăng lên tiên giới (hoặc ma giới), tu tới Đại La Kim Tiên (hoặc Ma Đế) hậu kỳ rồi vượt kiếp cuối cùng.',
    rare: 4,
    test: (c) => c.endTag === 'chung_dao',
  },
  // ---- 10 kết cục hiếm ở ba cõi (2.0.0) ----
  { id: 'ha_pham', name: 'Hạ Phàm Vì Tình', desc: 'Tự xóa tên khỏi tiên tịch, xuống trần sống nốt những mùa xuân cuối cùng với người mình thương.', hint: 'Bên kia Thiên Hà có người đang già đi.', how: 'Ở Tiên giới khi đã có đạo lữ, đêm thất tịch chọn bỏ tiên tịch hạ phàm.', rare: 4, test: (c) => c.endTag === 'ha_pham' },
  { id: 'thu_mon', name: 'Thủ Môn Thiên Giới', desc: 'Một mình giữ Nam Thiên Môn trước mười vạn ma quân, đứng chết mà không lùi.', hint: 'Có ngày cổng trời chỉ còn một người giữ.', how: 'Ở Tiên giới từ cảnh giới thứ hai, khi ma quân phá cổng, chọn một mình giữ cổng và tử trận.', rare: 3, test: (c) => c.endTag === 'thu_mon' },
  { id: 'hoa_chu', name: 'Hóa Chữ Thiên Thư', desc: 'Chép trang cuối của thiên thư rồi hóa vào từng nét chữ, sống mãi trong sách.', hint: 'Có một tòa lầu sách không đáy.', how: 'Ở Tiên giới từ cảnh giới thứ ba, nhận lời Văn Khúc Tinh Quân chép trang cuối.', rare: 4, test: (c) => c.endTag === 'hoa_chu' },
  { id: 'thien_de', name: 'Thiên Đế Vạn Thế', desc: 'Ngồi lên ngai Lăng Tiêu Điện, nhìn thấy mọi thứ mà không bao giờ được chạm vào thứ gì nữa.', hint: 'Ba giới không thể một ngày không có chủ.', how: 'Ở cảnh giới cuối của Tiên giới, đạo tâm từ 40 trở lên, nhận ngôi Thiên Đế.', rare: 4, test: (c) => c.endTag === 'thien_de' },
  { id: 'hoa_huyet_hai', name: 'Hóa Thân Huyết Hải', desc: 'Nuốt trái tim Ma Tổ, tan vào Huyết Hải. Bất tử, nhưng không còn là mình.', hint: 'Giữa biển máu có thứ vẫn còn đập.', how: 'Ở Ma giới từ cảnh giới thứ ba, nuốt trái tim giữa Huyết Hải.', rare: 4, test: (c) => c.endTag === 'hoa_huyet_hai' },
  { id: 'buong_dao', name: 'Buông Đao Thành Phật', desc: 'Giữa Ma giới, ma đầu buông đồ đao, quy y dưới chân một lão tăng.', hint: 'Ma đầu cũng có ngày nghe thấy tiếng chuông chùa.', how: 'Ở Ma giới mà giữ đạo tâm từ 0 trở lên, nghe tiếng chuông chùa và chọn quy y.', rare: 4, test: (c) => c.endTag === 'buong_dao' },
  { id: 'tam_phuc', name: 'Chết Dưới Tay Tâm Phúc', desc: 'Uống chén rượu mừng thọ của kẻ theo mình lâu nhất. Ma giới chỉ có một luật.', hint: 'Kẻ đáng sợ nhất là kẻ đứng sau lưng.', how: 'Ở Ma giới từ cảnh giới thứ hai, uống chén rượu của tả hộ pháp và trúng độc.', rare: 3, test: (c) => c.endTag === 'tam_phuc' },
  { id: 'vo_danh', name: 'Vô Danh', desc: 'Bán tên lấy đạo. Lúc chết, không ai biết bia mộ phải khắc tên gì, kể cả chính bạn.', hint: 'Ở Thái Hư, có kẻ đi mua tên người.' , rare: 3, test: (c) => c.cosmos === 'hu' && !!c.qf?.voDanh },
  { id: 've_tuoi_tho', name: 'Trở Về Thuở Nhỏ', desc: 'Bước qua khe nứt thời gian, làm lại đứa trẻ bảy tuổi trước sân nhà. Lần này không đi tu tiên.', hint: 'Có khe nứt nhìn thấy ngày xưa.', rare: 4, test: (c) => c.endTag === 've_tuoi_tho' },
  { id: 'hoang_luong', name: 'Hoàng Lương Nhất Mộng', desc: 'Tỉnh dậy bên nồi kê chưa chín. Cả đời tu tiên, ba cõi vạn năm, chỉ là một giấc ngủ trưa.', hint: 'Giữa hư không có mùi kê nấu.', rare: 4, test: (c) => c.endTag === 'hoang_luong' },
  {
    id: 'dai_la',
    name: 'Đại La Kim Tiên',
    desc: 'Đứng trên đỉnh tiên giới, vạn tiên triều bái.',
    hint: 'Tiên cũng có cao thấp.',
    how: 'Sau khi phi thăng, tu tới Đại La Kim Tiên rồi mới tọa hóa.',
    rare: 4,
    test: (c) => c.cosmos === 'tien' && c.realm >= 11,
  },
  {
    id: 'ma_de',
    name: 'Ma Đế Vĩnh Dạ',
    desc: 'Ngồi trên ngai xương trắng của Ma giới, ba giới nghe tên đã run.',
    hint: 'Bên kia huyết kiếp là cả một thế giới.',
    how: 'Thành Ma Tôn, vào Ma giới, tu tới Ma Đế rồi mới chết.',
    rare: 4,
    test: (c) => c.cosmos === 'ma' && c.realm >= 11,
  },
  { id: 'hon_nguyen', name: 'Hỗn Nguyên Đạo Tổ', desc: 'Không chính không tà, đứng giữa hư không mà ba giới phải nể.', hint: 'Giữa trời và vực còn một cõi khác.', how: 'Giữ đạo tâm trung lập (-39 đến 19) khi phi thăng để vào Thái Hư giới, tu tới Hỗn Nguyên Đạo Tổ rồi mới chết.', rare: 4, test: (c) => c.cosmos === 'hu' && c.realm >= 11 },
  {
    id: 'giang_tran',
    name: 'Bị Giáng Trần',
    desc: 'Vì thương nhân gian mà phạm thiên quy, bị tước tiên tịch. Kiếp sau đầu thai với ký ức tiên nhân.',
    hint: 'Tiên phàm cách biệt.',
    how: 'Sau khi phi thăng, hạ phàm cứu người mà bị Thiên đình phạt.',
    rare: 3,
    test: (c) => c.endTag === 'giang_tran',
  },
  {
    id: 'ket_guong',
    name: 'Người Trong Gương',
    desc: 'Bóng của bạn bước ra ngoài sống tiếp. Còn bạn ở lại trong gương Ngũ Hành Đài, nhìn mãi.',
    hint: 'Có những tấm gương không nên soi quá nhiều lần.',
    rare: 3,
    test: (c) => c.endTag === 'ket_guong',
  },
  {
    id: 'xuyen_khong',
    name: 'Xuyên Không',
    desc: 'Bước qua khe nứt không gian, tỉnh dậy giữa phố Hà Nội năm 2026.',
    hint: 'Có những khe nứt không nên bước vào... hoặc nên.',
    rare: 4,
    test: (c) => c.endTag === 'xuyen_khong',
  },
  // Độ Kiếp mà không kịp phi thăng: tự chọn cách ra đi
  { id: 'toa_hoa', name: 'Tọa Hóa Chuyển Thế', desc: 'Biết mình không kịp phi thăng, bạn tự tán công, để một tia linh thức mang theo sang kiếp sau.', hint: 'Đứng trước cửa trời mà thọ đã cạn.', how: 'Ở Độ Kiếp, khi thọ còn dưới 10 năm, chọn tọa hóa chuyển thế.', rare: 3, test: (c) => c.endTag === 'toa_hoa' },
  { id: 'truyen_cong', name: 'Truyền Công Tọa Hóa', desc: 'Không mang theo được thì để lại. Bạn truyền hết công lực cho một người trên giang hồ rồi nhắm mắt.', hint: 'Cái gì không mang đi được thì cho đi.', how: 'Ở Độ Kiếp, khi thọ còn dưới 10 năm, chọn truyền công cho người khác.', rare: 3, test: (c) => c.endTag === 'truyen_cong' },
  // Cách chết riêng của ba cõi sau phi thăng (xét theo endTag đặt lúc chết; còn lại rơi vào kết cục chung của cõi)
  { id: 'tu_tran', name: 'Tử Trận Tiên Ma', desc: 'Ngã xuống giữa Tiên Ma đại chiến, máu tiên và máu ma trộn vào nhau.', hint: 'Hai cõi giao chiến, không ai đứng ngoài được.', how: 'Đã phi thăng, chết trong Tiên Ma đại chiến.', rare: 3, test: (c) => c.endTag === 'tu_tran' },
  { id: 'thien_nhan_ngu_suy', name: 'Thiên Nhân Ngũ Suy', desc: 'Áo tiên bám bụi, hoa trên mũ héo, thân hết tỏa sáng. Tiên cũng có ngày tàn.', hint: 'Tiên nhân cũng già.', how: 'Ở Tiên giới đến khi hết thọ nguyên.', rare: 3, test: (c) => c.endTag === 'thien_nhan_ngu_suy' },
  { id: 'loi_phat', name: 'Lôi Phạt Tiên Thân', desc: 'Thiên lôi đánh tan tiên thể, ba hồn bảy vía không còn chỗ về.', hint: 'Ở trên trời, sấm sét càng gần.', how: 'Ở Tiên giới, chết vì thiên kiếp hoặc tâm ma.', rare: 3, test: (c) => c.endTag === 'loi_phat' },
  { id: 'tram_tien_dai', name: 'Trảm Tiên Đài', desc: 'Tiên tâm nhiễm bẩn, Thiên Đình đưa lên Trảm Tiên Đài. Một nhát đao, tiên tịch xóa tên.', hint: 'Thiên quy không dung kẻ tâm tà.', how: 'Ở Tiên giới mà để đạo tâm tụt dưới -20.', rare: 3, test: (c) => c.endTag === 'tram_tien_dai' },
  { id: 'ma_the_muc_ruong', name: 'Ma Thể Mục Ruỗng', desc: 'Da nứt, ma khí rỉ ra từng sợi, ma hồn tan vào huyết hải.', hint: 'Ma cũng không sống mãi.', how: 'Ở Ma giới đến khi hết thọ nguyên.', rare: 3, test: (c) => c.endTag === 'ma_the_muc_ruong' },
  { id: 'tam_ma_doat_xa', name: 'Tâm Ma Đoạt Xá', desc: 'Bóng tối trong lòng cuối cùng cũng bước ra, chiếm lấy thân xác bạn mà sống tiếp.', hint: 'Ở Ma giới, kẻ thù lớn nhất ở bên trong.', how: 'Ở Ma giới, chết vì huyết kiếp hoặc tâm ma.', rare: 3, test: (c) => c.endTag === 'tam_ma_doat_xa' },
  { id: 'bi_thon_phe', name: 'Bị Thôn Phệ', desc: 'Kẻ mạnh nuốt kẻ yếu. Lần này bạn là kẻ yếu.', hint: 'Ma giới chỉ có một luật.', how: 'Ở Ma giới, chết vì giao đấu hay hiểm cảnh.', rare: 3, test: (c) => c.cosmos === 'ma' },
  { id: 'hoa_tinh', name: 'Hóa Thành Tinh Tú', desc: 'Ở giữa hư không quá lâu, bạn hòa vào nó, thành một vì sao lặng lẽ.', hint: 'Nhìn hư không đủ lâu, hư không nhìn lại.', how: 'Ở Thái Hư giới đến khi hết thọ nguyên.', rare: 3, test: (c) => c.endTag === 'hoa_tinh' },
  { id: 'lac_khe_nut', name: 'Lạc Khe Nứt Thời Gian', desc: 'Một bước hụt giữa hư không, bạn trôi vào khe nứt, mãi mãi ở giữa quá khứ và tương lai.', hint: 'Hư không có những chỗ không đáy.', how: 'Ở Thái Hư giới, chết vì kiếp nạn hoặc tâm ma.', rare: 3, test: (c) => c.endTag === 'lac_khe_nut' },
  { id: 'tieu_dao', name: 'Tiêu Dao Thái Hư', desc: 'Không vào tiên tịch, không nhập ma môn, sống tự do giữa hư không đến hơi thở cuối.', hint: 'Không chọn phe cũng là một con đường.', how: 'Phi thăng khi đạo tâm trung lập (-39 đến 19) để vào Thái Hư giới, rồi chết ở đó.', rare: 3, test: (c) => c.cosmos === 'hu' },
  { id: 'tien_vo', name: 'Tiên Thân Tan Vỡ', desc: 'Tiên thể vỡ vụn giữa chín tầng trời, chỉ còn chút tiên quang rơi xuống nhân gian như mưa sao.', hint: 'Tiên giới cũng có hiểm nguy.', how: 'Ở Tiên giới, chết vì giao đấu hay hiểm cảnh.', rare: 3, test: (c) => c.cosmos === 'tien' },
  {
    id: 'ma_ton_do_kiep',
    name: 'Ma Tôn Độ Kiếp',
    desc: 'Nuốt trọn chín đạo huyết lôi, bước lên ngai Ma Tôn, thoát khỏi luân hồi.',
    hint: 'Tà đạo đi đến tận cùng, vượt kiếp cuối cùng.',
    how: 'Giữ đạo tâm từ -40 trở xuống, tu đến Độ Kiếp tầng cuối rồi vượt qua thiên kiếp cuối cùng.',
    rare: 4,
    test: (c) => c.cosmos === 'ma' || c.endTag === 'ma_ton_do_kiep',
  },
  {
    id: 'phi_thang',
    name: 'Phi Thăng Tiên Giới',
    desc: 'Vượt chín đạo lôi kiếp, bước lên tiên giới.',
    hint: 'Đi đến tận cùng con đường tu tiên.',
    how: 'Tu đến Độ Kiếp tầng cuối rồi vượt qua thiên kiếp cuối cùng (đạo tâm trên -40; trung lập thì vào Thái Hư giới).',
    rare: 4,
    test: (c) => c.ascended,
  },
  {
    id: 'ma_ton',
    name: 'Ma Tôn Giáng Thế',
    desc: 'Tà đạo đến cực điểm, thiên hạ nghe tên đã run sợ.',
    hint: 'Đạo tâm đen như mực, tu vi cao ngất.',
    how: 'Chết khi đạo tâm từ -80 trở xuống và đã đạt Hóa Thần trở lên.',
    rare: 3,
    test: (c) => c.daoTam <= -80 && c.realm >= 5,
  },
  {
    id: 'thanh_phat',
    name: 'Lập Địa Thành Phật',
    desc: 'Tọa hóa để lại xá lợi bảy màu, muôn dân lập miếu thờ.',
    hint: 'Từ bi tột cùng, đi đường Phật.',
    how: 'Đạo tâm từ 70 trở lên, đi đường Phật tu hoặc đạt Nguyên Anh, rồi sống đến khi hết thọ nguyên.',
    rare: 3,
    test: (c) => c.daoTam >= 70 && (c.path === 'phat' || c.realm >= 4) && cause(c).includes('thọ nguyên'),
  },
  {
    id: 'cuoi_rong',
    name: 'Long Kỵ Sĩ',
    desc: 'Chết đi khi vẫn còn con rồng mình nuôi từ một quả trứng.',
    hint: 'Một quả trứng lạ trong rừng...',
    how: 'Chăm Du ngoạn để gặp quả trứng lạ, ấp đến khi nở rồng rồi thuần phục nó, giữ rồng bên mình đến cuối đời.',
    rare: 3,
    test: (c) => c.mount === 'rong',
  },
  { id: 'he_thong', name: 'Ký Chủ Của Hệ Thống', desc: 'Cả đời làm nhiệm vụ cho một giọng nói trong đầu.', hint: 'Đinh!', rare: 3, test: (c) => (c.arcs?.he_thong?.s ?? 0) >= 3 },
  {
    id: 'kiem_than',
    name: 'Kiếm Thần',
    desc: 'Một kiếm phá vạn pháp, kiếm đạo đến đỉnh.',
    hint: 'Đi đường kiếm đến tận cùng.',
    how: 'Đi đường Kiếm tu và đạt Hóa Thần trở lên trước khi chết.',
    rare: 3,
    test: (c) => c.path === 'kiem' && c.realm >= 5,
  },
  {
    id: 'dan_thanh',
    name: 'Đan Thánh',
    desc: 'Đan dược do bạn luyện được cả tiên giới tranh mua.',
    hint: 'Lò đan cũng là một con đường.',
    how: 'Đi đường Đan tu và đạt Nguyên Anh trở lên trước khi chết.',
    rare: 3,
    test: (c) => c.path === 'dan' && c.realm >= 4,
  },
  {
    id: 'yeu_vuong',
    name: 'Yêu Vương Bất Diệt',
    desc: 'Từ một con yêu nhỏ, trở thành vua của vạn yêu.',
    hint: 'Sinh ra không phải là người.',
    how: 'Gieo lá số ra xuất thân yêu tộc (bấm Gieo lại đến khi gặp), rồi tu đến Nguyên Anh trở lên.',
    rare: 3,
    test: (c) => c.race === 'yeu' && c.realm >= 4,
  },
  {
    id: 'pham_nhan',
    name: 'Phàm Nhân Hạnh Phúc',
    desc: 'Không tu tiên, sống trọn đời bên người thương, con cháu đầy nhà.',
    hint: 'Đôi khi không tu mới là đắc đạo.',
    how: 'Không tu quá Luyện Khí, kết thành đạo lữ, sống qua 65 tuổi và ra đi vì hết thọ nguyên.',
    rare: 2,
    test: (c) => c.realm <= 1 && c.age >= 65 && !!c.partner && cause(c).includes('thọ nguyên'),
  },
  {
    id: 'tam_nien',
    name: 'Ba Mươi Năm Hà Đông',
    desc: 'Kẻ từng bị từ hôn, cuối cùng đã vả mặt cả thiên hạ.',
    hint: 'Đừng khinh thiếu niên nghèo.',
    rare: 2,
    test: (c) => c.arcs?.tu_hon?.v === 'thang',
  },
  {
    id: 'dai_thien',
    name: 'Đại Thiện Nhân',
    desc: 'Cả đời làm việc thiện, chết đi muôn dân để tang.',
    hint: 'Đạo tâm trong sáng tuyệt đối.',
    how: 'Chết khi đạo tâm từ 90 trở lên: chọn việc thiện thật nhiều.',
    rare: 2,
    test: (c) => c.daoTam >= 90,
  },
  {
    id: 'dai_phu',
    name: 'Phú Khả Địch Quốc',
    desc: 'Chết đi để lại núi linh thạch, con cháu tranh nhau chia gia tài.',
    hint: 'Tiền nhiều để làm gì?',
    how: 'Chết khi trong túi còn từ 8.000 linh thạch trở lên.',
    rare: 2,
    test: (c) => c.linhThach >= 8000,
  },
  {
    id: 'tru_yeu_vuong',
    name: 'Trảm Yêu Vương',
    desc: 'Một đời giết quá trăm yêu ma.',
    hint: 'Giết, giết nữa, giết mãi.',
    how: 'Chọn Trừ yêu, diệt từ 100 yêu thú trở lên trong một đời.',
    rare: 2,
    test: (c) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0) >= 100,
  },
  { id: 'phan_do', name: 'Chết Dưới Tay Đồ Đệ', desc: 'Dạy hết cho đồ đệ, rồi chết bởi chính chiêu mình dạy.', hint: 'Dạy học trò, chớ dạy hết.', rare: 2, test: (c) => c.endTag === 'phan_do' },
  { id: 'lan_kha', name: 'Lạn Kha', desc: 'Xem một ván cờ của tiên nhân, xuống núi đã hết một đời.', hint: 'Một ván cờ trên đỉnh núi.', rare: 2, test: (c) => c.endTag === 'lan_kha' },
  {
    id: 'co_doc',
    name: 'Cô Độc Tu Tiên',
    desc: 'Sống trăm năm không một người thân bên cạnh.',
    hint: 'Tu tiên mà quên mất người bên cạnh.',
    how: 'Không đạo lữ, không linh thú, đạt Trúc Cơ trở lên và sống qua 90 tuổi.',
    rare: 1,
    test: (c) => !c.partner && !c.pet && c.age >= 90 && c.realm >= 2,
  },
  {
    id: 'qua_do',
    name: 'Chết Vì Quá Độ',
    desc: 'Làm một việc quá nhiều năm liền, thân thể không chịu nổi.',
    hint: 'Cái gì nhiều quá cũng không tốt.',
    how: 'Làm đúng một việc hơn 6 năm liền không đổi (dù đã được cảnh báo), đến khi thân thể gục ngã.',
    rare: 1,
    test: (c) => c.endTag === 'qua_do',
  },
  {
    id: 'be_quan',
    name: 'Bộ Xương Trong Động Phủ',
    desc: 'Bế quan mãi không ra, người ta chỉ tìm thấy bộ xương khô.',
    hint: 'Bế quan cũng cần biết điểm dừng.',
    how: 'Chết trong lúc bế quan: bế quan dài ngày, dồn dập, tâm ma càng cao càng dễ.',
    rare: 1,
    test: (c) => c.endTag === 'be_quan',
  },
  {
    id: 'thien_kiep',
    name: 'Tro Bụi Dưới Thiên Kiếp',
    desc: 'Không vượt nổi lôi kiếp.',
    hint: 'Trời không dung.',
    how: 'Đột phá từ Kim Đan trở lên mà không vượt nổi thiên kiếp.',
    rare: 1,
    test: (c) => cause(c).includes('thiên kiếp') || cause(c).includes('lôi'),
  },
  {
    id: 'tau_hoa',
    name: 'Tẩu Hỏa Nhập Ma',
    desc: 'Tâm ma phản phệ, kinh mạch nổ tung.',
    hint: 'Đừng để tâm ma lớn quá.',
    how: 'Để tâm ma lên quá cao rồi chết vì tẩu hỏa nhập ma.',
    rare: 1,
    test: (c) => cause(c).includes('tẩu hỏa') || cause(c).includes('tâm ma'),
  },
  {
    id: 'chet_doi',
    name: 'Chết Đói Đầu Đường',
    desc: 'Tu tiên cũng phải ăn. Túi rỗng, bụng rỗng.',
    hint: 'Đừng để túi rỗng tuếch.',
    how: 'Từ 16 tuổi trở đi, chết khi túi chỉ còn 5 linh thạch trở xuống và sức khỏe cạn kiệt.',
    rare: 1,
    test: (c) => c.linhThach <= 5 && c.age >= 16 && c.stats.sucKhoe <= 5,
  },
  { id: 'chet_yeu', name: 'Yểu Mệnh', desc: 'Ra đi khi còn chưa kịp lớn.', hint: 'Trẻ con cũng có thể chết.', how: 'Chết trước 13 tuổi.', rare: 0, test: (c) => c.age < 13 },
  {
    id: 'tho_tan',
    name: 'Thọ Chung Chính Tẩm',
    desc: 'Thọ nguyên cạn, ra đi thanh thản.',
    hint: 'Sống đến hết tuổi trời.',
    how: 'Sống đến khi hết thọ nguyên.',
    rare: 0,
    test: (c) => cause(c).includes('thọ nguyên'),
  },
  {
    id: 'bat_dac',
    name: 'Chết Không Toàn Thây',
    desc: 'Bỏ mạng giữa giang hồ hiểm ác.',
    hint: 'Giang hồ hiểm ác.',
    how: 'Chết vì bất kỳ lý do nào khác: quái, kẻ thù, tai nạn giang hồ.',
    rare: 0,
    test: () => true,
  },
];

/** Kết cục vào cõi (phi thăng, Ma Tôn, Thái Hư) vẫn được ghi vào Sổ Sinh Tử khi chết ở cõi đó vì một kết cục riêng hơn */
export function alsoEndings(c: Character): string[] {
  if (!c.cosmos) return [];
  const id = c.cosmos === 'ma' ? 'ma_ton_do_kiep' : c.cosmos === 'hu' ? 'tieu_dao' : 'phi_thang';
  const main = endingOf(c).id;
  const out = main === id ? [] : [id];
  // tới cảnh giới cuối mà chết theo kết cục khác: vẫn ghi nhận đỉnh của cõi
  const top = c.realm >= 11 ? (c.cosmos === 'ma' ? 'ma_de' : c.cosmos === 'hu' ? 'hon_nguyen' : 'dai_la') : null;
  if (top && main !== top && main !== 'chung_dao') out.push(top);
  return out;
}

export function endingOf(c: Character): Ending {
  return ENDINGS.find((e) => e.test(c)) ?? ENDINGS[ENDINGS.length - 1];
}

export const RARE_COLOR = ['#8a7a66', '#3d6fb0', '#8a3ad0', '#d9822b', '#d0202e'];
