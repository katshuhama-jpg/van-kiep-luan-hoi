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
