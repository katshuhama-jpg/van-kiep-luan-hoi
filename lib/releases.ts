/** Lịch sử phiên bản. Bản mới nhất để đầu; CURRENT_VERSION là bản hiện cáo thị cho người chơi cũ. */

export interface Release {
  v: string;
  date: string; // dd/mm/yyyy
  title: string;
  lead: string;
  stats?: { n: string; label: string }[];
  groups: { h: string; items: string[] }[];
}

export const RELEASES: Release[] = [
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
