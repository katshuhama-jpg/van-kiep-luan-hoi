import { ARENA_RULES } from './game/arena';

/** Lịch sử phiên bản. Bản mới nhất để đầu; CURRENT_VERSION là bản hiện cáo thị cho người chơi cũ. */

export interface Release {
  v: string;
  date: string; // dd/mm/yyyy
  title: string;
  lead: string;
  stats?: { n: string; label: string }[];
  groups: { h: string; items: string[]; hot?: boolean }[]; // hot: nhóm nổi bật
}

export const RELEASES: Release[] = [
  {
    v: '3.1.1',
    date: '27/10/2026',
    title: 'Hoàn Hồn Đan',
    lead: 'Đạo hữu nghiện quá mà hồn không theo kịp? Tiệm đan dưới chân cầu Nại Hà đã mở. Cùng lúc, Thiên Đạo cân lại đường tu: thọ dài hơn thì tu cũng phải chậm lại một chút.',
    stats: [
      { n: '3', label: 'phẩm đan hồi hồn' },
      { n: '+10', label: 'Hồn lực mỗi nhiệm vụ' },
      { n: 'x1,5', label: 'tu vi cần từ Kim Đan' },
    ],
    groups: [
      {
        h: 'Đan hồi hồn',
        hot: true,
        items: [
          'Ở Cầu Nại Hà, ngay trước khi đầu thai, giờ mua được đan hồi Hồn lực bằng phúc duyên. Cũng mua được trong mục Kiếp Số và Hồn lực ở lá số.',
          'Tụ Hồn Đan (hạ phẩm): +20 Hồn lực, 20 phúc. Dưỡng Hồn Đan (trung phẩm): +45 Hồn lực, 55 phúc. Hoàn Hồn Đan (thượng phẩm): hồi đầy, 140 phúc.',
          'Mỗi ngày 3 viên đầu giá gốc. Từ viên thứ 4, mỗi viên đắt thêm 50% so với viên trước. Nghiện thì vẫn chơi tiếp được, chỉ là tốn phúc.',
          'Mỗi nhiệm vụ ngày hoàn thành hồi thêm 10 Hồn lực.',
        ],
      },
      {
        h: 'Cân bằng lại cơ chế tu luyện',
        items: [
          'Bản 3.1.0 làm thọ dài ra 1,5 lần nên phi thăng dễ quá (người chơi lâu năm phi thăng gần 1/4 số kiếp). Nay tu luyện chậm lại cho cân: tu vi cần để lên tầng từ Kim Đan trở lên tăng 1,5 lần.',
          'Cõi trên: mỗi tầng cần ít nhất 24 năm (trước 17 năm), cảnh giới cuối 16 năm (trước 12 năm).',
          'Thiên kiếp phi thăng khó thêm 5%.',
          'Nhân vật đang chơi giữa kiếp sẽ thấy thanh tu vi tụt một đoạn: tu vi vẫn giữ nguyên, chỉ là mức cần để lên tầng cao hơn.',
        ],
      },
      {
        h: 'Theo góp ý của đạo hữu',
        items: ['Đạo hữu trên Threads xin tắt Hồn lực vì "đang nghiện mà phải dừng". Không tắt được, nhưng có đan rồi.'],
      },
    ],
  },
  {
    v: '3.1.0',
    date: '27/10/2026',
    title: 'Vạn Tông Triều Bái',
    lead: 'Bản này làm theo góp ý của đạo hữu. Thêm bốn tông môn, một con đường nhập Ma giới, mười cốt truyện cho người đã phi thăng, thọ nguyên dài hơn mà đột phá khó hơn, linh thạch không còn dễ như nhặt lá.',
    stats: [
      { n: '+4', label: 'tông môn' },
      { n: '+33', label: 'sự kiện cốt truyện' },
      { n: 'x1,5', label: 'thọ nguyên' },
    ],
    groups: [
      {
        h: 'Bốn tông môn mới',
        hot: true,
        items: [
          'Phổ Đà Sơn (chính): mời Phật tu và người đạo tâm từ 40. Tâm ma tăng chậm, nhưng diệt yêu quá tay sẽ bị Giới luật viện gọi lên.',
          'Kiếm Cốc (chính): mời Kiếm tu. Phải rút được kiếm trên vách đá mới được nhận. Đại bỉ 3 năm một lần, thăng bậc nhanh.',
          'Vạn Độc Môn (tà): mời Đan tu, Ma tu. Có việc thử độc: tu vi tăng mạnh, đổi lại mất sức khỏe, có thể chết.',
          'Yêu Thần Điện (tà): nhận mọi yêu tộc, không xét linh căn. Có huyết tế và lệnh săn.',
          'Mỗi tông có tên bậc đệ tử riêng, áo bào và bảo vật riêng cho từng bậc.',
        ],
      },
      {
        h: 'Mười cốt truyện sau phi thăng',
        hot: true,
        items: [
          'Tổng cộng bản này thêm 33 sự kiện cốt truyện mới: 15 sự kiện sau phi thăng, 16 sự kiện tông môn và chuỗi Ma giới, 2 sự kiện Phản môn.',
          'Tiên giới: Canh bến Thiên Hà (thả hay bắt con giao long, tám năm sau nó quay lại), Cây quế Quảng Hàn (uống rượu với Ngô Cương), Trông lò Bát Quái (đừng mở nắp), Miếu thờ ở nhân gian (lén làm mưa cho hậu nhân).',
          'Ma giới: Huyết Nguyệt, Ma Đế bệnh nặng (theo Đại hoàng tử, Tam công chúa hay đứng ngoài, qua chính biến tới ngày tân Ma Đế lên ngôi), Cửu U Thâm Uyên chín tầng, mỗi lần xuống sâu hơn, tầng cuối có Cửu U Ma Long.',
          'Thái Hư giới: Kẻ giữ đồng hồ cát (đổi thọ lấy đạo hay đạo lấy thọ), Bóng kiếp trước (gặp lại chính mình kiếp trước), Hư không rách (vá trời hay hút linh khí, bảy năm sau trả giá).',
          'Nhiều chuyện kéo dài qua nhiều bước, lựa chọn bước trước quyết định bước sau. Vài chuyện lặp lại để người sống lâu ở cõi trên luôn có việc để làm.',
        ],
      },
      {
        h: 'Phản môn',
        items: [
          'Đạo và tông môn ngược phe (đang ở chính phái mà theo Ma tu hoặc đạo tâm từ -40, đang ở ma môn mà theo Phật tu hoặc đạo tâm từ 40) sẽ gặp sự kiện Phản môn: tự xin rời, giấu thân phận, hoặc phản sư diệt tổ.',
          'Giấu thân phận thì mỗi năm có thể bị lộ: bị trục xuất, mất áo bào và lệnh bài tông môn.',
          'Thiên Cơ Các trung lập không đuổi ai, nhưng người nghiêng hẳn về một phía sẽ kéo chính hoặc tà tới vây đánh cả Các.',
        ],
      },
      {
        h: 'Chuỗi nhập Ma giới',
        items: [
          'Vừa lên Ma giới, đạo hữu đi qua 4 bước trong khoảng 20 năm đầu: Huyết Trì tẩy thân, Nhận chủ, Tranh địa bàn, Ma Đế triệu kiến.',
          'Ba Ma quân cho ba lợi thế suốt kiếp: Huyết Ma Quân tu nhanh hơn, Cốt Ma Quân hồi sức khỏe và giảm tâm ma, Ảnh Ma Quân có thể dẫn tới của cải.',
          'Giành được khe Huyết Phong thì mỗi năm thu linh thạch. Ma Đế ban danh hiệu và bảo vật theo con đường tu.',
        ],
      },
      {
        h: 'Thọ nguyên và đột phá',
        items: [
          'Thọ nguyên mỗi cảnh giới tăng khoảng 1,5 lần: Trúc Cơ 150, Độ Kiếp 300, Ma Đế và Đại La tới 1.050. Trần thọ phàm giới 300, sau phi thăng 1.050.',
          'Đột phá từ Kim Đan trở lên phụ thuộc linh căn: Phế -15%, Tạp -8%, Địa +3%, Thiên +6%.',
          'Hỏng 3 lần liền ở cùng cảnh giới thì rơi vào bình cảnh, phải bế quan 10 năm mới thử lại.',
          'Cảnh giới càng cao, năm trôi càng nhanh, nên mỗi kiếp không dài thêm.',
        ],
      },
      {
        h: 'Linh thạch và phường thị',
        items: [
          'Đồ phường thị đắt dần theo cảnh giới của đạo hữu. Đồ hiếm (Luyện Hư, Độ Kiếp) mỗi kiếp chỉ mua được một lần.',
          'Kiếm tiền và luyện đan liền nhiều năm thì thu ít dần, đổi việc một năm là về lại như cũ. % tiền từ trang bị tối đa +100%.',
          'Đan Tụ Khí, Trúc Cơ đắt theo cảnh giới, Tụ Khí mỗi năm chỉ viên đầu đủ lực. Diên Thọ Đan càng dùng càng kém và càng đắt.',
          'Quá độ nhắc muộn hơn ở cảnh giới cao (Trúc Cơ 10 năm, Nguyên Anh 15, Luyện Hư 20, sau phi thăng 40). Tu luyện không còn bị tính quá độ.',
        ],
      },
      {
        h: 'Lôi đài',
        items: [
          'Trận đấu mới kiểu máu: mỗi lượt chọn một ấn ngũ hành, có nội lực và tuyệt kỹ theo con đường, đỡ tuyệt kỹ của đối thủ bằng nhịp.',
          'Rút đối thủ bằng 3 lá bài thay cho ống xăm. Lá bài ghi rõ cảnh giới thật của bóng và việc lên đài được kéo ngang cảnh giới với bóng của đạo hữu.',
          'Bớt may rủi: tuyệt kỹ tối đa 30% máu một đòn, chí mạng ít hơn. Chơi khéo vẫn thắng nhiều hơn chơi bừa.',
          'Bục Long Ỷ có rồng vàng chầu hai bên, hiện đúng bóng người chơi đã cầm ra đài.',
        ],
      },
      {
        h: 'Theo góp ý của đạo hữu',
        items: [
          '@thien: thêm tông môn và nội dung Ma giới, Phản môn khi đổi phe, lôi đài nói rõ việc kéo ngang cảnh giới, thọ nguyên dài hơn, quá độ nhắc muộn hơn, linh thạch khó kiếm hơn.',
          '@thienkhue: túi đồ có tab và sắp xếp.',
          '@xiaoyu: báo lỗi thọ nguyên Bàn Đào hội bị tụt về.',
        ],
      },
      {
        h: 'Sửa lỗi và giao diện',
        items: [
          'Túi đồ có tab theo loại (Pháp y, Vũ khí, Phụ kiện, Đan dược) và sắp xếp theo mới nhận, phẩm, công, thủ. Đồ đang mặc luôn ở trên.',
          'Sửa lỗi thọ nguyên thêm từ Bàn Đào hội, tiên đan, Diên Thọ Đan đấu giá bị tụt về sau một năm. Thọ thêm từ đan, đào, kỳ ngộ giờ được giữ, cộng ngoài trần thọ.',
          'Sửa lỗi Diên Thọ Đan. Lôi kiếp khó hơn và đổi giao diện pixel. Quái còn hình tự vẽ đã đổi hết sang hình LPC.',
          'Lời kể giao đấu thắng, thua, hòa đa dạng hơn. Màn đầu thai bố cục 2 bước dễ hiểu hơn.',
        ],
      },
    ],
  },
  {
    v: '3.0.0',
    date: '26/10/2026',
    title: 'Luân Hồi Đạo',
    lead: 'Vạn kiếp luân hồi không còn là con đường tắt. Kẻ chết càng nhiều, Thiên đạo càng để mắt; linh hồn đầu thai dồn dập thì mòn đi. Muốn đi xa, phải biết nghỉ, biết quên, và biết đứng trên lôi đài.',
    stats: [
      { n: '10', label: 'bậc Kiếp Số' },
      { n: '+3', label: 'kết cục' },
      { n: '31', label: 'luật lôi đài' },
    ],
    groups: [
      {
        h: 'Kiếp Số: Thiên đạo để mắt',
        items: [
          'Tài khoản có Kiếp Số từ 0 tới 10, tăng theo thành tích: số kiếp đã sống, Thiên thư, phi thăng, chạm đỉnh, Chứng Đạo.',
          'Mỗi bậc thêm một kiếp nạn: thiên kiếp nặng hơn, thần binh truyền kiếp yếu đi, bóng Ngũ Hành Đài và quái mạnh hơn, mỗi kiếp chỉ mua được một thiên phú lớn...',
          'Bù lại, mỗi bậc thêm 5% phúc duyên và 3% đồ rơi. Bảng xếp hạng ghi Kiếp Số cạnh cảnh giới.',
          'Kết cục mới: Nghịch Thiên Hành Đạo (phi thăng khi Kiếp Số từ 5), Vạn Kiếp Bất Diệt (Chứng Đạo ở Kiếp Số 10).',
          'Kiếp tích: người Kiếp Số thấp mà ngã ở Độ Kiếp thì kiếp sau đột phá dễ hơn, tối đa 3 lần.',
        ],
      },
      {
        h: 'Hồn lực và cầu Nại Hà',
        items: [
          'Từ kiếp thứ 15, mỗi lần đầu thai tốn Hồn lực, hồi lại theo giờ thật. Đầu thai dồn dập thì sinh ra hồn mỏi, hồn khuyết, hồn tàn. Nghỉ đủ lâu thì được Hồn viên mãn.',
          'Trước mỗi lần đầu thai, Mạnh Bà đưa chén canh. Uống thì quên thần binh và rương kiếp trước, được tĩnh tâm hạ Kiếp Số, khí vận và phúc duyên dồi dào. Hất chén thì giữ hết, nhưng nợ Địa phủ dồn lại.',
          'Năm lần liền không uống, Câu hồn sứ giả tìm tới. Đánh lui được thì nhận Câu hồn lệnh, thua thì có thể mất mạng.',
          'Luân hồi nhiều không còn là lợi thế khi giao đấu: bên đã đầu thai nhiều hơn thì hồn phách mòn hơn, công và thủ giảm tới 15%.',
        ],
      },
      {
        h: 'Lôi đài hằng ngày',
        hot: true,
        items: [
          'Lôi đài có trang riêng, mở ngay ở trang đầu và menu trong game.',
          'Mỗi ngày chọn bóng xuất chiến: 1 trong 6 nhân vật mạnh nhất bạn từng chơi, giữ nguyên cả ngày.',
          'Lắc ống xăm để rút đối thủ ngẫu nhiên. Màu que báo phẩm của bóng: Phàm, Linh, Huyền, Thiên. Quẻ chưa giải thì không rút lại được.',
          'Bóng đối thủ được kéo về cùng cảnh giới với bóng của bạn. Thắng thua nằm ở bản mệnh, con đường và cách đoán thế.',
          'Mỗi trận ba hiệp, mỗi hiệp chọn Công, Thủ hay Hóa như Ngũ Hành Đài nhưng khó hơn: đối thủ để lộ ý đồ không phải lúc nào cũng thật, và biết đọc thế của bạn.',
          'Mỗi ngày 3 lượt. Thắng trận được 3 điểm, thua 0. Điểm tính lại mỗi thứ Hai; top 3 tuần đứng trên bục Long Ỷ với danh hiệu Bá Chủ, Á Chủ, Tam Kiệt.',
          'Bị ai thắng bóng thì có một lượt báo thù không tính lượt, hạn 48 giờ.',
          'Thiên thư mảnh XV nay mở khi thắng 3 trận lôi đài.',
        ],
      },
      {
        h: 'Lịch 31 luật lôi đài',
        hot: true,
        items: ARENA_RULES.map((r) => `Ngày ${r.day} · ${r.name}: ${r.desc}`),
      },
      {
        h: 'Khác',
        items: ['Lịch sử cập nhật gọn lại thành danh sách phiên bản, bấm vào một bản để xem chi tiết.'],
      },
    ],
  },
  {
    v: '2.0.0',
    date: '26/10/2026',
    title: 'Vạn Mảnh',
    lead: 'Bạn tưởng tiếng chuông đã im. Nhưng nó lại vang lên, lần này không đếm bạn mà đếm những người khác. Vạn Kiếp Chân Nhân không chỉ vỡ làm một mảnh là bạn. Và có kẻ vẫn đang gõ chuông.',
    stats: [
      { n: '+10', label: 'mảnh Thiên thư' },
      { n: '+12', label: 'kết cục' },
      { n: '+1', label: 'đại địch' },
    ],
    groups: [
      {
        h: 'Thiên thư Quyển II',
        items: [
          'Quyển II "Vạn Mảnh" mở sau khi đạt Vạn Kiếp Quy Nhất: 10 mảnh ký ức mới, từ XI tới XX.',
          'Những đạo hữu trên giang hồ cũng là mảnh vỡ. Có mảnh chỉ mở khi kết nghĩa, truyền công, viếng mộ hay giao chiến thư với người chơi khác.',
          'Có mảnh chỉ dành cho bậc cao thủ: từng lên đủ Tiên, Ma, Thái Hư, qua Ngũ Hành Đài mà không ngã lần nào, mở 30 kết cục.',
          'Kẻ Gõ Chuông chờ ở đỉnh cao nhất của các cõi. Phải đỡ đủ ba tiếng chuông, đỡ hụt có thể thân tử đạo tiêu.',
          'Thắng hắn, kiếp sau cầm dùi chuông và tự chọn: gõ tiếp hay đập vỡ. Hai kết cục mới, hai danh hiệu mới.',
          'Trang Sổ Sinh Tử chia Thiên thư thành hai quyển. Quyển II bị phong ấn tới khi bạn gặp lại chính mình.',
        ],
      },
      {
        h: 'Mười kết cục ba cõi',
        items: [
          'Tiên giới: Hạ Phàm Vì Tình, Thủ Môn Thiên Giới, Hóa Chữ Thiên Thư, Thiên Đế Vạn Thế.',
          'Ma giới: Hóa Thân Huyết Hải, Buông Đao Thành Phật, Chết Dưới Tay Tâm Phúc.',
          'Thái Hư giới: ba kết cục bí ẩn, không ghi cách mở. Tự đi tìm.',
          'Mỗi kết cục đi kèm một kỳ ngộ hiếm, phần lớn chỉ đến ở cảnh giới cao, và không phải kiếp nào cũng có duyên gặp.',
          'Chết ở cảnh giới cuối theo một kết cục khác thì Sổ Sinh Tử vẫn ghi nhận Đại La Kim Tiên, Ma Đế hay Hỗn Nguyên Đạo Tổ.',
        ],
      },
      {
        h: 'Vạn Kiếp Quy Nhất',
        items: [
          'Mỗi tài khoản chỉ gặp lại chính mình một lần. Từ đó, đường đi tiếp nằm trong Quyển II.',
          'Lần đầu Quy Nhất được 100 phúc duyên, một chiếc chuông vàng theo bên vai qua mọi kiếp, và danh hiệu 🔔 trên bảng xếp hạng. Ai đã đạt trước đây sẽ nhận ở lần luân hồi tới.',
        ],
      },
      {
        h: 'Theo góp ý của đạo hữu',
        items: [
          '@minimoni báo: mệnh thiên sát cô tinh mà tuổi thơ vẫn có cha mẹ, ông bà; nhận bao nhiêu đồ đệ cũng là "đồ đệ đầu tiên". Nay cô tinh, cô nhi và trẻ bị bỏ ở chùa lớn lên không còn cảnh cha mẹ, ông bà; đồ đệ được đếm thứ hai, thứ ba... Đa tạ đạo hữu!',
        ],
      },
      {
        h: 'Thiên đạo khắt khe hơn',
        items: [
          'Đột phá khó hơn, càng lên cao càng khó. Thiên mệnh chi tử chỉ còn giúp đột phá dễ hơn 10%.',
          'Thiên linh căn và Tiên cốt trời sinh tu nhanh ít hơn trước. Tiên cốt giá 250 phúc, Thiên mệnh 180 phúc.',
          'Phúc duyên mỗi kiếp ít đi khoảng một phần tư.',
          'Sau phi thăng, mỗi cảnh giới mất ít nhất khoảng 50 năm. Thọ nguyên vẫn tối đa 350: chỉ ai phi thăng sớm mới kịp chạm đỉnh và thử Chứng Đạo.',
          'Tu tới Kim Đan, Hóa Thần vẫn như cũ, người mới không bị làm khó.',
        ],
      },
    ],
  },
  {
    v: '1.0.3',
    date: '26/10/2026',
    title: 'Tam Giới Khai Môn',
    lead: 'Cửa trời đã mở. Phi thăng không còn là hồi kết: bên kia là Tiên giới, Ma giới và Thái Hư giới. Nhưng trước cửa trời, mỗi người phải đánh bại chính mình năm lần.',
    stats: [
      { n: '+3', label: 'giới mới' },
      { n: '+12', label: 'cảnh giới' },
      { n: '+20', label: 'kết cục' },
      { n: '+55', label: 'vật phẩm' },
      { n: '+30', label: 'quái vật' },
      { n: '+19', label: 'kỳ ngộ' },
    ],
    groups: [
      {
        h: 'Tam giới sau phi thăng',
        items: [
          'Phi thăng xong vẫn sống tiếp trong cùng kiếp. Chính đạo lên Tiên giới, tà đạo vào Ma giới, người trung lập lạc vào Thái Hư giới.',
          'Mỗi giới 4 cảnh giới, có sự kiện, quái, bảo vật và cảnh nền riêng: Chân Tiên tới Đại La Kim Tiên, Ma Tướng tới Ma Đế, Hư Tiên tới Hỗn Nguyên Đạo Tổ. Kiếp cuối là Chứng Đạo, vượt được thì thoát khỏi mọi giới.',
          'Cảnh phi thăng: cột sáng giáng xuống, nhân vật bay lên cõi mới.',
          'Hào quang riêng mỗi cõi, mạnh dần theo cảnh giới: tiên quang và mây ngũ sắc, huyết nguyệt và xích ma, vòng xoáy hư không và tinh tú.',
          'Quà phi thăng: mỗi cõi một bộ áo, vũ khí, phụ kiện, trao dần khi lên cảnh giới.',
        ],
      },
      {
        h: 'Ngũ Hành Vấn Tâm Đài',
        items: [
          'Trước khi phi thăng phải hạ 5 bóng của chính mình, mỗi bóng một hệ. Bóng cuối khắc bản mệnh của bạn. Phi thăng từ 120 tuổi.',
          'Lật thế bằng Ngũ Hành Ấn (săn quái đúng hệ), lá bùa Công, Thủ, Hóa, Ngũ Hành Phù và tâm cảnh. 15 sân đấu theo giới và theo hệ của bóng.',
          'Qua đài nhận Gương vỡ Vấn Tâm; qua mà chưa ngã lần nào nhận Ngũ Hành Viên Mãn châu. Thua có thể thân tử đạo tiêu, hãy chuẩn bị từ Hóa Thần.',
        ],
      },
      {
        h: 'Sinh tử ba cõi',
        items: [
          'Mỗi cõi có cách chết riêng: Thiên Nhân Ngũ Suy, Lôi Phạt, Trảm Tiên Đài, Ma Thể Mục Ruỗng, Tâm Ma Đoạt Xá, Bị Thôn Phệ, Hóa Thành Tinh Tú, Lạc Khe Nứt Thời Gian, Tử Trận Tiên Ma.',
          '20 năm cuối đời ở ba cõi hiện dần 5 dấu hiệu suy tàn. Tiên nhân để đạo tâm tụt dưới -20 có ngày lên Trảm Tiên Đài.',
          'Bia mộ riêng: Tiên Trủng, Ma Trủng, Hư Trủng.',
          'Ở Độ Kiếp mà không kịp phi thăng: tự chọn tọa hóa chuyển thế (kiếp sau mang theo linh thức) hoặc truyền công cho một đạo hữu trên giang hồ.',
        ],
      },
      {
        h: 'Tông môn ba phe',
        items: [
          'Thanh Vân Tông xếp bậc theo linh căn, Huyết Sát Môn theo độ tàn nhẫn, Thiên Cơ Các theo ngộ tính.',
          'Bốn bậc đệ tử, Đại bỉ tông môn, đồng môn tỷ thí cùng cấp, quái thí luyện riêng, áo bào và lệnh bài theo bậc.',
        ],
      },
      {
        h: 'Thiên thư',
        items: ['Mạch truyện chính 10 mảnh ký ức: vì sao bạn cứ phải luân hồi mãi? Gom đủ để gặp lại chính mình thuở ban đầu.'],
      },
      {
        h: 'Theo góp ý của đạo hữu',
        items: [
          '@minimoni xin thêm cốt truyện, thêm cảnh giới sau phi thăng, và bái sư theo căn cốt: căn cốt tốt làm nội môn, căn cốt thường làm ngoại môn. Cả ba đều đã có trong bản này. Đa tạ đạo hữu!',
        ],
      },
      {
        h: 'Cân bằng',
        items: [
          'Quái và người đều mang ngũ hành, khắc chế khi giao đấu.',
          'Rơi đồ giảm khoảng 25% (quái, người chơi, bóng kiếp trước). Đánh quái quá yếu gần như không rơi đồ; đồ rơi theo cấp của quái.',
          'Thọ nguyên tối đa: 200 khi chưa phi thăng, 350 khi đã lên ba cõi. Sau phi thăng, mỗi cảnh giới mất ít nhất khoảng 50 năm, chỉ ai phi thăng sớm mới kịp chạm tới đỉnh.',
        ],
      },
    ],
  },
  {
    v: '1.0.2',
    date: '25/10/2026',
    title: 'Giang Hồ Ân Oán',
    lead: 'Giang hồ không chỉ có một mình bạn. Ân phải trả, oán phải báo, và mỗi kiếp đều để lại một câu chuyện.',
    groups: [
      {
        h: 'Tính năng',
        items: [
          'Giang hồ: ân oán, kết nghĩa, truy nã, chiến thư, truy sát, lời viếng.',
          'Nghĩa trang: hồi ký một kiếp kể lại 7-10 cột mốc như truyện tranh pixel.',
          'Bảo khố đồ ẩn, báo khi mở khóa, lời đồn trên Thiên tượng, danh hiệu sưu tầm, cách mở chi tiết cho các kết cục.',
        ],
      },
      { h: 'Cân bằng', items: ['Tà đạo: nghiệp lực thành tiền tệ mua thiên phú tà, Huyết Sát Đan, huyết tế; Ma Tôn Độ Kiếp ngang phi thăng.'] },
    ],
  },
  {
    v: '1.0.1',
    date: '25/10/2026',
    title: 'Vạn Tượng Canh Tân',
    lead: 'Thế giới khoác áo mới: nhân vật, quái, cảnh vật đều vẽ lại theo phong cách pixel LPC.',
    groups: [
      {
        h: 'Tính năng',
        items: [
          'Nhân vật, quái, nền 4 mùa vẽ lại bằng LPC; dáng vẻ, kiểu tóc, phụ kiện đa dạng; thú cưng; cánh từ Hóa Thần.',
          '300 trang bị mới chia theo phái, quái chặn đường, tuổi thơ mỗi người một khác.',
          'Thiên tượng hôm nay, chuỗi ngày, nhiệm vụ ngày, thư giang hồ, danh hiệu tuần, 16 thành tựu dài hạn.',
        ],
      },
      { h: 'Cân bằng', items: ['Giảm độ khó khoảng 20%, kiếp đầu được trời thương, cảnh báo sức khỏe nguy kịch.'] },
    ],
  },
  {
    v: '1.0.0',
    date: '25/10/2026',
    title: 'Khai Thiên',
    lead: 'Vạn Kiếp Luân Hồi ra đời: một kiếp người, vạn con đường tu tiên.',
    groups: [
      {
        h: 'Tính năng',
        items: [
          'Đầu thai ngẫu nhiên, 8 cảnh giới từ Phàm Nhân tới Độ Kiếp, 6 con đường tu tập, đạo tâm chính tà.',
          'Trừ yêu kiểu idle, boss, bế quan, thiên kiếp, Sổ Sinh Tử, bảng xếp hạng, nhân quả xuyên kiếp, góp ý tính năng.',
        ],
      },
    ],
  },
];

export const CURRENT_VERSION = RELEASES[0].v;
export const SEEN_KEY = 'vkl.seenVer';

export function seenLocal(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}
export function markSeenLocal() {
  try {
    localStorage.setItem(SEEN_KEY, CURRENT_VERSION);
  } catch {}
}
