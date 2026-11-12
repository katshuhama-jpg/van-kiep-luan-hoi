import { ARENA_RULES } from './game/arena';
import { tr } from './i18n';

/** Lịch sử phiên bản. Bản mới nhất để đầu; CURRENT_VERSION là bản hiện cáo thị cho người chơi cũ. */

export interface Release {
  v: string;
  date: string; // dd/mm/yyyy
  title: string;
  lead: string;
  stats?: { n: string; label: string }[];
  groups: { h: string; items: string[]; hot?: boolean }[]; // hot: nhóm nổi bật
  /** Ý người chơi yêu cầu đã làm: lên đầu bảng tóm tắt của cáo thị */
  asked?: { who: string; short: string; text: string }[];
  /** Điểm mới khác, mỗi ý vài chữ, cho bảng tóm tắt */
  more?: string[];
  /** Bản lớn: tranh mở đầu (cảnh pixel) cho cáo thị */
  hero?: { scene: 'congphap' | 'kiepsau' | 'linhthu'; caption: string };
  /** Bản lớn: các thẻ điểm nhấn (biểu tượng, tên, một câu), hiện ngay ở cáo thị thay cho dòng chữ nhỏ */
  features?: { icon: string; h: string; t: string }[];
  /** Nút làm ngay, ví dụ mở Tàng Kinh Các */
  cta?: { label: string; go: 'congphap' | 'linhthu' | 'camnang' | 'baove' };
}

export const RELEASES: Release[] = [
  {
    v: '4.5.0',
    date: '13/11/2026',
    title: tr('Chân Thân', 'True Self'),
    lead: tr('Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Điều ngươi làm được trong mộng sẽ khắc vào thân.', 'Every life is a dream. The dream fades, the true self remains. What you achieve in the dream is carved into your body.'),
    groups: [
      {
        h: tr('Chân thân', 'True self'),
        hot: true,
        items: [
          tr('Ngươi có một chân thân cố định qua mọi kiếp: tự chọn ngoại hình và đặt pháp danh. Nhân vật trong mỗi kiếp vẫn đầu thai ngẫu nhiên như cũ.', 'You now have a true self that stays across every life: choose its look and give it a name. Each life is still born at random as before.'),
          tr('Đạo hữu đã chơi từ trước: lần đầu vào sẽ nhớ lại chân thân ngay ở trang đầu. Người mới: sau khi kiếp đầu khép lại.', 'Returning players remember their true self on the home page the first time they come back. New players: after the first life ends.'),
          tr('Đổi ngoại hình bất cứ lúc nào, đổi tên lần đầu không tốn gì, ở trang Chân thân.', 'Change your look any time, and your first rename is free, on the True Self page.'),
        ],
      },
      {
        h: tr('Tam Tài: huyệt, hành, đạo', 'Three Talents: points, elements, Daos'),
        items: [
          tr('Thân: thập đại huyệt. Trong mộng làm được việc huyệt đòi, mộng tan thì huyệt khai, kiếp sau mạnh hơn một chút. Dễ trước khó sau, ai cũng bắt đầu từ huyệt đầu tiên.', 'Body: ten great points. Do what a point asks within a dream and it opens when the dream ends, making later lives a little stronger. Easy first, hard later, everyone starts from the first point.'),
          tr('Khí: mỗi kiếp mang một bản mệnh ngũ hành. Mộng đi xa, hành ấy sáng.', 'Breath: every life carries one of the five elements. The further the dream goes, the brighter that element shines.'),
          tr('Đạo: Thiên, Hồng Trần, U Minh. Thành tích cũ được tính sẵn.', 'Dao: Heaven, the Mortal World, the Underworld. Past achievements already count.'),
          tr('Ngoại trang khác nằm rải trên đường tu: khai huyệt, viên mãn ngũ hành, ngộ đạo.', 'More outfits lie scattered along the path: opening points, perfecting elements, grasping Daos.'),
        ],
      },
      {
        h: tr('Sửa lỗi', 'Fixes'),
        items: [tr('Lôi đài: tắt game giữa trận rồi quay lại thì đánh nốt được trận đang chờ, không còn bị báo đang có trận mà không vào được.', 'Arena: if you close the game mid-match, coming back now lets you finish the waiting match instead of being stuck.')],
      },
    ],
    more: [tr('Chân thân của riêng ngươi', 'Your own true self'), tr('Khai huyệt qua từng kiếp', 'Open points life by life'), tr('Ngoại trang mới', 'New outfits')],
  },
  {
    v: '4.4.4',
    date: '12/11/2026',
    title: tr('Trảm Tam Thi Không Còn Lặp', 'Three Corpses, No More Loops'),
    lead: tr('Có bạn chém Ác thi xong lại bị bắt chém Thiện thi mãi không lên được. Lỗi đã sửa, ai đang kẹt vào game là đi tiếp được.', 'A player slew the Evil Corpse and then got stuck slaying the Good Corpse over and over. Fixed - anyone stuck can move on now.'),
    groups: [
      {
        h: tr('Hồng Hoang', 'Honghuang'),
        hot: true,
        items: [
          tr('Thi đã chém rồi thì không bị đánh lại lần nữa.', 'A corpse already slain is never fought again.'),
          tr('Ai đang kẹt ở Chuẩn Thánh được đưa về đúng tầng, thi tiếp theo là thi chưa chém.', 'Anyone stuck at Quasi-Saint is put back on the right layer, facing the corpse not yet slain.'),
        ],
      },
    ],
  },
  {
    v: '4.4.3',
    date: '10/11/2026',
    title: tr('Thiên Phú Lớn Nói Rõ Lý Do', 'Major Talents, Explained'),
    lead: tr('Đạo hữu chọn Tiên cốt rồi không chọn được Thiên mệnh mà không biết vì sao. Giờ thẻ bị khóa ghi rõ lý do.', 'A fellow cultivator picked Immortal Bones and could not pick Child of Destiny without knowing why. Locked cards now say why.'),
    groups: [
      {
        h: tr('Đầu thai', 'Rebirth'),
        hot: true,
        items: [tr('Từ Kiếp Số 5, mỗi kiếp chỉ chọn một trong Tiên cốt hoặc Thiên mệnh. Thẻ bị khóa nay ghi rõ điều này.', 'From Calamity Count 5, each life can take only one of Immortal Bones or Child of Destiny. The locked card now says so.')],
      },
    ],
  },
  {
    v: '4.4.2',
    date: '10/11/2026',
    title: tr('Hệ Ngũ Hành Nói Cho Rõ', 'Elements, Clearly Explained'),
    lead: tr('Đạo hữu đổi giáp hệ Kim mà công không lên. Hệ vẫn cộng, chỉ là có giới hạn mà trước giờ không ai ghi ra.', 'A fellow cultivator swapped to Metal armor and attack stayed put. Elements do count, there was just a cap nobody wrote down.'),
    groups: [
      {
        h: tr('Trang bị', 'Gear'),
        hot: true,
        items: [
          tr('Cấp hệ cộng dồn từ mọi món đang mặc cùng hệ, tối đa 5. Lò rèn nay ghi rõ điều này.', 'Element levels add up across every worn item of that element, up to 5. The forge now says so.'),
          tr('Hành trang hiện các hệ đang có hiệu lực và cấp của từng hệ.', 'The bag shows your active elements and their levels.'),
          tr('Xem một món đã rèn sẽ biết mặc vào có cộng thêm hệ hay không.', 'Viewing a forged item tells you whether wearing it would raise its element.'),
        ],
      },
    ],
  },
  {
    v: '4.4.1',
    date: '10/11/2026',
    title: tr('Khai Thiên Cho Ra Khai Thiên', 'A Proper World-Opening'),
    lead: tr('Đạo hữu khai thiên xong thấy mình hẹo luôn. Thiên Đạo kể lại cho rõ: đó là kết cục, không phải cái chết lãng xẹt.', 'A fellow cultivator opened a new world and felt they just dropped dead. The Heavenly Dao now tells it properly: it is an ending, not a pointless death.'),
    groups: [
      {
        h: tr('Hồng Hoang', 'Honghuang'),
        hot: true,
        items: [
          tr('Khai Thiên Lập Địa kể rõ thân bạn hóa thành trời đất mới, như Bàn Cổ năm xưa.', 'Opening Heaven now tells how your body becomes the new world, as Pangu once did.'),
          tr('Ba kết cục sau Vấn Thiên mừng như chứng đạo, không còn tiếng chết.', 'The three endings after Questioning Heaven celebrate like attaining the Dao, with no death toll.'),
          tr('Thương nhân lưu động và hội đấu giá không còn lạc vào Hồng Hoang.', 'The wandering merchant and the auction no longer stray into Honghuang.'),
        ],
      },
    ],
  },
  {
    v: '4.4.0',
    date: '10/11/2026',
    title: tr('Hồng Hoang Giới', 'The Honghuang Realm'),
    lead: tr('Chứng đạo chưa phải hết. Sau Thiên Đạo nứt ra một khe tím, bên kia là Hồng Hoang: thang cảnh giới mới cho người đã đi tới đỉnh.', 'Attaining the Dao is not the end. Behind the Heavenly Dao a purple rift opens, and beyond it lies Honghuang: a new ladder for those who reached the top.'),
    features: [
      { icon: 'hg_tram_thi_ho_lo', h: tr('Khe tím sau chứng đạo', 'The purple rift'), t: tr('Chứng đạo xong được chọn: tọa hóa như cũ, hay bước vào Hồng Hoang với cả bộ trang bị.', 'After attaining the Dao, choose: pass away as before, or enter Honghuang with all your gear.') },
      { icon: 'hg_phong_than_bang', h: tr('Bốn cảnh giới mới', 'Four new realms'), t: tr('Chuẩn Thánh chém ba thi của chính mình, Thánh Nhân lập giáo qua Phong Thần, Hỗn Nguyên chặt xích trời, Khai Thiên Vấn Thiên.', 'Quasi-Saints slay their own three corpses, Saints found a teaching through the Investiture, Hunyuan cuts heaven\'s chains, World Openers question heaven.') },
      { icon: 'hg_ban_co_phu', h: tr('Quái mạnh, đồ mới', 'Strong foes, new treasures'), t: tr('Quái Hồng Hoang mạnh hơn hẳn. Linh bảo mới chỉ có qua sự kiện và boss thần thoại.', 'Honghuang monsters hit far harder. New treasures come only from events and mythic bosses.') },
      { icon: 'hg_tao_hoa_diep', h: tr('Kết cục mới', 'New endings'), t: tr('Mở ra thế giới mang tên mình, ngồi vào ghế trời, hay một kết cục ẩn.', 'Open a world bearing your name, take heaven\'s seat, or find a hidden ending.') },
    ],
    groups: [
      {
        h: tr('Hồng Hoang giới', 'The Honghuang Realm'),
        hot: true,
        items: [
          tr('Chứng đạo ở Tiên, Ma, Thái Hư giới xong thì khe tím mở ra. Tọa hóa vẫn ra kết cục chứng đạo như cũ.', 'After attaining the Dao in the Immortal, Demon or Great Void realm, the purple rift opens. Passing away still gives the classic Dao ending.'),
          tr('Bước qua khe tím giữ nguyên trang bị. Có đạo lữ thì được nắm tay cùng bước qua.', 'Stepping through keeps all your gear. With a Dao partner, you may step through hand in hand.'),
          tr('Chuẩn Thánh: mỗi tầng là một trận Trảm Tam Thi. Chém thì dễ, thu vào người thì khó hơn mà giữ được sức của thi.', 'Quasi-Saint: every layer is a Three Corpses fight. Cutting is easier; taking it back is harder but keeps its strength.'),
          tr('Thánh Nhân: thu đồ đệ, tích công đức, qua đại kiếp Phong Thần rồi mới mở được cửa Hỗn Nguyên.', 'Saint: take disciples, gather merit and survive the Investiture before the Hunyuan gate opens.'),
          tr('Hỗn Nguyên Đại La Kim Tiên: chặt ba sợi xích Nhân Quả, Thọ Nguyên, Danh.', 'Hunyuan Daluo: cut the three chains of Karma, Lifespan and Name.'),
          tr('Khai Thiên: chín đạo thiên lôi rồi đánh Thiên Đạo.', 'World Opener: nine bolts, then a fight with the Heavenly Dao itself.'),
          tr('Gặp Hồng Quân, Nữ Oa, Cộng Công, Côn Bằng, Đế Giang và các giáo trong Phong Thần.', 'Meet Hongjun, Nüwa, Gonggong, Kunpeng, Dijiang and the teachings of the Investiture.'),
          tr('Kiếp vào Hồng Hoang vẫn được tính là đã chứng đạo trên bảng Chứng Đạo.', 'A life that enters Honghuang still counts as attaining the Dao on the Dao board.'),
        ],
      },
    ],
    more: [tr('Bốn cảnh giới mới', 'Four new realms'), tr('Boss thần thoại', 'Mythic bosses'), tr('Kết cục mới', 'New endings')],
  },
  {
    v: '4.3.2',
    date: '09/11/2026',
    title: tr('Bớt Chết Lãng Xẹt', 'Fewer Pointless Deaths'),
    lead: tr('Đạo hữu than chết nhảm, Thiên Đạo nghe rồi: những cái chết vô lý giờ hiếm hơn, chuyện nhỏ cũng gọn hơn.', 'Fellow cultivators complained of pointless deaths, and the Heavenly Dao heard: senseless deaths are rarer, and small things are tidier.'),
    groups: [
      {
        h: tr('Bớt chết nhảm', 'Fewer pointless deaths'),
        hot: true,
        items: [
          tr('Trẻ con chết yểu hiếm hơn nữa.', 'Childhood deaths are even rarer.'),
          tr('Bế quan khi tâm ma còn thấp chỉ bị thương, không chết.', 'Seclusion with a low heart demon only wounds, never kills.'),
          tr('Người tu đạo và tiên nhân lạc chướng khí chỉ bị thương.', 'Cultivators and immortals lost in miasma are only wounded.'),
          tr('Từ Trúc Cơ, đá của dân làng không còn ném trúng bạn.', 'From Foundation, villagers\' stones no longer hit you.'),
        ],
      },
      {
        h: tr('Tiện ích', 'Quality of life'),
        items: [
          tr('Số năm trên ô trọng tâm dễ đọc hơn.', 'The year count on focus tiles is easier to read.'),
          tr('Bấm gửi góp ý nhiều lần chỉ gửi một.', 'Tapping send repeatedly only sends feedback once.'),
        ],
      },
    ],
    more: [tr('Bớt chết nhảm', 'Fewer pointless deaths'), tr('Số năm dễ đọc', 'Readable year count')],
  },
  {
    v: '4.3.1',
    date: '09/11/2026',
    title: tr('Tuyệt Kỹ Xứng Danh', 'Ultimates Worth the Name'),
    lead: tr('Đạo hữu góp ý, Thiên Đạo sửa: tuyệt kỹ dung hợp nay mạnh hơn bộc phát, người tu cao không còn bị giang hồ phàm tục làm khó.', 'Fellow cultivators spoke, the Heavenly Dao listened: fused ultimates now beat a burst, and high cultivators are no longer troubled by mortal thugs.'),
    groups: [
      {
        h: tr('Công pháp', 'Techniques'),
        hot: true,
        items: [
          tr('Tuyệt kỹ dung hợp khởi điểm cao hơn, tự luyện theo năm, luôn mạnh hơn bộc phát. Ai đã dung hợp được nâng luôn.', 'Fused ultimates start at a higher stage, train each year and always beat a burst. Existing ones are raised too.'),
          tr('Hiện Chân Thân có thêm choáng và hồi máu.', 'Reveal True Body now stuns and heals.'),
          tr('Né đòn có giới hạn. Tuyệt kỹ và đòn xuyên giáp không né được, bóng ở Vấn Tâm Đài né kém hơn.', 'Dodge is capped. Ultimates and armor-piercing strikes cannot be dodged, and Trial shadows dodge less.'),
        ],
      },
      {
        h: tr('Giang hồ', 'Jianghu'),
        items: [
          tr('Sửa lỗi sự kiện trừ máu hai lần.', 'Fixed events that took health twice.'),
          tr('Người tu cao gặp ác bá, sát thủ thì dễ thắng, có thưởng.', 'High cultivators now beat thugs and assassins easily, with rewards.'),
          tr('Ma tu không còn bị đồn hiền lành.', 'Demonic cultivators are no longer gossiped about as meek.'),
          tr('Phổ Đà Sơn bớt bị Giới luật viện gọi, có thêm việc siêu độ kiếm linh thạch.', 'Putuo is summoned by the Precepts Hall less often and can earn stones performing last rites.'),
        ],
      },
      {
        h: tr('Tiện ích', 'Quality of life'),
        items: [
          tr('Sổ linh thú ghi cả thú đã bỏ đi.', 'The beast book records beasts that left you.'),
          tr('Chết sau phi thăng vẫn truyền được thần binh.', 'You can pass down your divine weapon after ascending.'),
          tr('Đổi bộ trang bị ngay ở thẻ đột phá.', 'Switch gear sets right on the breakthrough card.'),
          tr('Nút phân giải tất cả đồ thừa.', 'A button to dismantle all spare gear.'),
        ],
      },
    ],
    more: [tr('Tuyệt kỹ mạnh hơn', 'Stronger ultimates'), tr('Sửa trừ máu hai lần', 'Double damage fixed'), tr('Phân giải tất cả', 'Dismantle all')],
  },
  {
    v: '4.3.0',
    date: '06/11/2026',
    title: tr('Linh Thú Xuất Thế', 'Spirit Beasts Awaken'),
    lead: tr('Núi sâu rừng thẳm đã có chủ. Linh thú nay phân hạng, phải đánh mới thu phục được, nuôi lâu thì thân thiết và tiến hóa, ra trận thì cùng bạn xông pha. Tứ linh và dị thú Sơn Hải Kinh đã xuất thế, chỉ chờ người có duyên.', 'The deep mountains and forests have masters now. Spirit beasts are ranked, must be fought before they can be tamed, grow close and evolve the longer you raise them, and charge into battle at your side. The Four Symbols and the strange beasts of the Classic of Mountains and Seas have awakened, waiting only for the fated.'),
    hero: { scene: 'linhthu', caption: tr('Thanh Long xuất thế!', 'The Azure Dragon awakens!') },
    features: [
      { icon: 'g_ky_lan_giac', h: tr('Linh thú có hạng', 'Ranked spirit beasts'), t: tr('Từ thú thường tới tứ linh. Tu càng cao, gặp thú càng xịn, xem sổ linh thú để biết mình còn thiếu con nào.', 'From common beasts to the Four Symbols. The higher you cultivate, the finer the beasts you meet. Check the beast book to see what you are still missing.') },
      { icon: 'g_ho_trao', h: tr('Đánh rồi mới thu phục', 'Fight first, then tame'), t: tr('Gặp thú phải giao chiến, thắng mới có cơ hội thu về. Thú quá mạnh so với chủ có thể bỏ đi.', 'Meet a beast and you must fight it; only a win gives you a chance to tame it. A beast far stronger than its master may leave.') },
      { icon: 'g_long_lan', h: tr('Tiến hóa và huyết mạch', 'Evolution and bloodlines'), t: tr('Nuôi lâu thì thân thiết, tiến hóa ba bậc. Thú bậc cuối để lại huyết mạch cho kiếp sau.', 'Raise it long enough and it grows close and evolves through three stages. A fully evolved beast leaves its bloodline to your next life.') },
      { icon: 'g_can_khon_dai', h: tr('Túi đồ gọn gàng', 'A tidier bag'), t: tr('Đồ trùng cất vào túi, khóa đồ và đổi bộ trang bị một chạm. Mở Túi đồ là thấy.', 'Duplicates go into your bag, plus item locks and one-tap gear sets. Open your bag to see.') },
    ],
    cta: { label: tr('Mở màn Linh thú', 'Open Spirit Beasts'), go: 'linhthu' },
    more: [
      tr('Linh thú có hạng, đánh rồi mới thu phục', 'Ranked beasts, fight before you tame'),
      tr('Tiến hóa ba bậc, huyết mạch kiếp sau', 'Three-stage evolution, bloodlines'),
      tr('Túi đồ: đồ trùng, khóa đồ, bộ trang bị', 'Bag: duplicates, locks, gear sets'),
    ],
    groups: [
      {
        h: tr('Linh thú', 'Spirit beasts'),
        hot: true,
        items: [
          tr('Linh thú nay có hạng, gặp thú phải giao chiến, thắng mới có cơ hội thu phục. Tu càng cao gặp thú càng xịn, còn thú quá mạnh so với chủ có thể bỏ đi.', 'Spirit beasts are now ranked. Meet one and you must fight it; only a win gives a chance to tame it. The higher you cultivate the finer the beasts, and a beast far stronger than its master may leave.'),
          tr('Nuôi lâu thì thân thiết và tiến hóa ba bậc. Thú hộ chủ lao vào đánh cùng bạn, thú chiêu phúc mang vận, thú dưỡng thân giữ sức; thú bậc cuối để lại huyết mạch cho kiếp sau.', 'Raise a beast and it grows close and evolves through three stages. Guardians fight at your side, fortune beasts bring luck, nurturing beasts keep you healthy; a fully evolved beast leaves its bloodline to your next life.'),
          tr('Tứ linh và dị thú Sơn Hải Kinh đã xuất thế, ai có duyên thì gặp. Chạm huy hiệu linh thú trên sân khấu để xem sổ.', 'The Four Symbols and the strange beasts of the Classic of Mountains and Seas have awakened, for those with the fate to meet them. Tap the beast badge on the stage to open the book.'),
        ],
      },
      {
        h: tr('Túi đồ', 'Bag'),
        items: [
          tr('Đồ rơi trùng nay cất vào túi để bạn tự bán đúng giá.', 'Duplicate drops now go into your bag so you can sell them at full price yourself.'),
          tr('Khóa đồ và ba bộ trang bị đổi một chạm, không còn bán nhầm.', 'Item locks and three gear sets you swap with one tap, so nothing gets sold by mistake.'),
          tr('Phường thị bán tàn quyển công pháp đang mang, tàn quyển cũng rơi nhiều hơn.', 'The market sells fragments for the techniques you carry, and fragments drop more often too.'),
        ],
      },
    ],
  },
  {
    v: '4.2.1',
    date: '05/11/2026',
    title: tr('Kiếp Sau Có Gì', 'What the Next Life Holds'),
    lead: tr('Mỗi kiếp khép lại, bạn thấy ngay mình mang được gì sang kiếp sau. Tiên nhân chán trời cao thì hạ phàm săn đồ, còn người mới bước chân vào giang hồ đã có cẩm nang truyện tranh dẫn đường.', 'When a life closes, you see at once what you carry into the next. Immortals weary of the heavens can descend to hunt treasure, and newcomers to the jianghu now have an illustrated handbook to guide them.'),
    hero: { scene: 'kiepsau', caption: tr('Hành trang kiếp sau', 'Baggage for the next life') },
    features: [
      { icon: 'tien_tich_ngoc_phu', h: tr('Hành trang kiếp sau', 'Baggage for the next life'), t: tr('Màn chết hiện lần lượt những gì kiếp sau mang theo, ngay dưới tên bạn.', 'The death screen lists, one by one, what your next life carries, right under your name.') },
      { icon: 'van_co_bao', h: tr('Hạ phàm săn đồ', 'Descend to hunt'), t: tr('Đã phi thăng thì mở Trừ yêu, chọn Hạ phàm mà xuống săn quái phàm giới.', 'Once ascended, open Demon Hunt and pick Descend to hunt mortal-realm monsters.') },
      { icon: 'g_kinh_thu_tan_quyen', h: tr('Cẩm nang truyện tranh', 'Illustrated handbook'), t: tr('Truyện tranh kể từng chặng đường tu tiên, mở trong menu.', 'A comic telling each stage of the cultivation road, opened from the menu.') },
      { icon: 'g_thien_co_lenh', h: tr('Giữ tài khoản', 'Keep your account'), t: tr('Mã khôi phục hoặc tài khoản Google, quên mật khẩu vẫn tự lấy lại được.', 'A recovery code or a Google account, so a forgotten password is no longer the end.') },
    ],
    cta: { label: tr('Đọc Cẩm nang', 'Read the Handbook'), go: 'camnang' },
    more: [
      tr('Hành trang kiếp sau', 'Baggage for the next life'),
      tr('Hạ phàm săn đồ', 'Descend to hunt'),
      tr('Cẩm nang truyện tranh', 'Illustrated handbook'),
    ],
    groups: [
      {
        h: tr('Luân hồi', 'Rebirth'),
        hot: true,
        items: [
          tr('Màn chết có thẻ Hành trang kiếp sau: phúc duyên, chiêu truyền thừa, thần binh, rương chôn.', 'The death screen has a Baggage for the next life card: fortune, inherited moves, divine weapons, buried chests.'),
          tr('Tiên nhân cũng chôn được rương, nhưng chỉ giữ đồ phàm giới.', 'Immortals can bury chests too, but they only keep mortal-realm gear.'),
        ],
      },
      {
        h: tr('Hạ phàm', 'Descending'),
        items: [
          tr('Đã phi thăng thì mở Trừ yêu, chọn Hạ phàm để xuống săn quái phàm giới.', 'Once ascended, open Demon Hunt and choose Descend to hunt mortal-realm monsters.'),
          tr('Linh khí hạ giới loãng nên không lên tu vi, bù lại dễ ra đồ hơn.', 'The mortal realm\'s qi is thin so you gain no cultivation, but loot comes more easily.'),
        ],
      },
      {
        h: tr('Tài khoản', 'Account'),
        hot: true,
        items: [
          tr('Mỗi tài khoản nay có mã khôi phục, quên mật khẩu tự lấy lại được, xem ở menu Bảo vệ tài khoản.', 'Every account now has a recovery code, so you can recover a forgotten password yourself. See Protect account in the menu.'),
          tr('Giữ tài khoản lần đầu được thưởng phúc duyên.', 'Protecting your account for the first time earns you fortune.'),
          tr('Đăng nhập, liên kết bằng tài khoản Google.', 'Sign in and link with your Google account.'),
        ],
      },
      {
        h: tr('Đấu giá', 'Auctions'),
        items: [
          tr('Vạn Bảo Lâu ra giá sát túi tiền người tu hơn, ai chịu khó tích cóp sẽ có cơ hội. Món càng quý giá càng cao.', 'The Myriad Treasures Pavilion now prices closer to what cultivators can afford, so those who save up get their chance. The rarer the piece, the higher the price.'),
        ],
      },
      {
        h: tr('Cẩm nang', 'Handbook'),
        items: [
          tr('Cẩm nang tu tiên dạng truyện tranh, mở trong menu.', 'The Cultivation Handbook comes as a comic, opened from the menu.'),
          tr('Kể ngắn từng chặng: cảnh giới, ngã rẽ cuộc đời, tông môn chính tà, mẹo phi thăng, luân hồi.', 'It briefly tells each stage: realms, life\'s crossroads, righteous and demonic sects, ascension tips, rebirth.'),
        ],
      },
    ],
  },
  {
    v: '4.2.0',
    date: '04/11/2026',
    title: tr('Công Pháp Nhập Thế', 'Techniques Enter the World'),
    lead: tr('Thời của đánh thường đã hết. Từ nay mỗi đạo có bí kíp riêng: kiếm tu tung kiếm khí, đan tu ném đan hỏa, ma tu hút máu, phật tu dựng kim thân. Chiêu bạn luyện là chiêu bạn ra, trận nào cũng khác.', 'The age of plain attacks is over. Every path now has its own secret arts: sword cultivators loose sword qi, alchemists hurl pill fire, demonic cultivators drain blood, Buddhists raise golden bodies. The moves you train are the moves you fight with.'),
    hero: { scene: 'congphap', caption: tr('Vạn Kiếm Quy Tông!', 'Ten Thousand Swords Return!') },
    features: [
      { icon: 'g_kinh_thu_tan_quyen', h: tr('Tàng Kinh Các', 'Scripture Pavilion'), t: tr('Cài tâm pháp và chiêu thức vào vòng ấn, xem tuyệt kỹ của đạo mình. Mở bằng nút Công pháp dưới màn chơi.', 'Set your heart method and moves in the seal ring, see your path\'s ultimate. Open it with the Techniques button.') },
      { icon: 'doc_hat_kiem', h: tr('Chiêu nào ra chiêu nấy', 'Every move hits its own way'), t: tr('Thiêu đốt, trúng độc, hút máu, choáng, khiên, phản đòn. Toàn bộ chiêu thức vẽ lại bằng pixel.', 'Burn, poison, lifesteal, stun, shields, counters. Every move redrawn in pixel art.') },
      { icon: 'g_hien_vien_kiem', h: tr('Tuyệt kỹ có màn riêng', 'Ultimates get their own scene'), t: tr('Đánh đầy thanh khí của đạo là tung tuyệt kỹ, màn hình tối lại chỉ để bạn tỏa sáng.', 'Fill your path\'s energy bar to unleash an ultimate, and the screen dims just for you.') },
      { icon: 'g_dan_phuong_tan_quyen', h: tr('Luyện kiếp này, truyền kiếp sau', 'Train now, inherit later'), t: tr('Tàn quyển rơi khắp giang hồ, mỗi bộ một loại phải tự đi tìm. Chiêu luyện tới đỉnh truyền được cho kiếp sau.', 'Fragments drop across the jianghu, each set found its own way. Moves trained to the peak can pass to your next life.') },
    ],
    cta: { label: tr('Mở Tàng Kinh Các', 'Open the Scripture Pavilion'), go: 'congphap' },
    more: [
      tr('Tàng Kinh Các: cài chiêu, nâng tầng', 'Scripture Pavilion: equip moves, raise stages'),
      tr('Chiêu thức vẽ pixel mới', 'New pixel-art moves'),
      tr('Mỗi đạo một tuyệt kỹ riêng', 'An ultimate for every path'),
    ],
    groups: [
      {
        h: tr('Công pháp', 'Techniques'),
        hot: true,
        items: [
          tr('Nút Công pháp dưới màn chơi mở Tàng Kinh Các: cài tâm pháp, chiêu thức, xem tuyệt kỹ của đạo mình.', 'The Techniques button below the stage opens the Scripture Pavilion: equip your heart method and moves, and see your path\'s ultimate.'),
          tr('Chiêu luyện lâu thì lên tầng. Tàn quyển rơi trên giang hồ, mỗi bộ một loại, đi đâu nhặt được gì thì tự tìm.', 'Moves you practise long enough rise in stage. Scripture fragments drop across the jianghu, each set its own kind; where to find which is for you to discover.'),
          tr('Có chỗ phải chọn hướng luyện, và có thể truyền một bộ cho kiếp sau.', 'Some points ask you to choose a direction, and you can pass one set on to your next life.'),
        ],
      },
      {
        h: tr('Trận đánh', 'Battles'),
        items: [
          tr('Trừ yêu, chặn đường, người giang hồ, bóng kiếp trước đều đánh bằng chiêu thức, có hiệu ứng riêng từng chiêu.', 'Demon hunts, ambushes, wanderers of the jianghu and shadows of past lives are all fought with moves, each with its own effect.'),
          tr('Mỗi đạo có một thanh khí riêng, đầy thì ra tuyệt kỹ.', 'Each path has its own energy bar; fill it to unleash the ultimate.'),
          tr('Người chơi khác gặp trên giang hồ mang đúng công pháp họ đang luyện. Lôi đài giữ nguyên.', 'Other players you meet in the jianghu carry the very techniques they are practising. The Arena stays as it was.'),
        ],
      },
    ],
  },
  {
    v: '4.1.0',
    date: '03/11/2026',
    title: tr('Phường Thị Đổi Đời', 'The Market Reborn'),
    lead: tr('Phường thị nay có giá theo phẩm, hàng mới về, hội đấu giá và thương nhân lưu động. Kết duyên và Hệ Thống có ích thật, còn người đã phi thăng thì có đồ tiên giới để săn.', 'The market now prices by grade, restocks new goods, and hosts auctions and wandering merchants. Romance and the System finally pay off, and those who have ascended now have immortal-realm gear to hunt.'),
    asked: [
      { who: '@thien', short: tr('Giá theo phẩm, hàng hiếm có hạn', 'Prices by grade, limited rare goods'), text: tr('Đồ trong phường thị nay có giá theo cảnh giới và phẩm, hàng tốt không còn lúc nào cũng có và rẻ như cho. Bán lại chỉ được một phần nhỏ giá mua.', 'Market goods are now priced by realm and grade, and good gear is no longer always in stock and dirt cheap. Selling back only returns a small part of the price.') },
      { who: '@bachct', short: tr('Bùa rèn: rèn hỏng không vỡ đồ, tăng tỉ lệ', 'Forge charms: failures no longer break gear, better odds'), text: tr('Hộ Khí Phù giữ đồ không vỡ khi rèn hỏng, Linh Hỏa giúp rèn dễ thành hơn. Chọn dùng ngay trong lò rèn.', 'The Item Ward Talisman keeps gear from shattering on a failed forge, and Spirit Flame makes forging more likely to succeed. Pick them right in the forge.') },
      { who: '@vickary', short: tr('Kẻ thù không còn mạnh hơn bạn quá xa', 'Enemies are no longer worlds above you'), text: tr('Oan gia và kẻ truy sát nay không vượt quá tầm bạn quá xa. Chưa phi thăng thì không còn bị người tiên giới tìm tới.', 'Nemeses and hunters can no longer be far beyond your level. Until you ascend, no one from the Immortal Realm comes for you.') },
      { who: '@shizun', short: tr('Kết duyên có tác dụng thật', 'Romance actually does something'), text: tr('Có đạo lữ thì song tu cùng tiến, chưa có thì đạo hữu thỉnh thoảng giúp một tay.', 'With a Dao companion you cultivate together; without one, friends lend a hand now and then.') },
      { who: '@madaochiton', short: tr('Hệ Thống thành buff vàng thật', 'The System is a true golden buff'), text: tr('Hệ Thống nay phát nhiệm vụ có hạn, làm xong thì thưởng lớn và Hệ Thống lên cấp, càng cấp cao tu càng nhanh.', 'The System now hands out timed quests; finish them for big rewards and to level the System up, and the higher it goes the faster you cultivate.') },
      { who: '@tungmx1234', short: tr('Trang bị sau phi thăng', 'Gear after ascension'), text: tr('Tiên giới, Ma giới, Thái Hư nay có trang bị riêng, rơi từ quái từng cõi và bày bán ở chợ tiên giới.', 'The Immortal, Demon and Great Void realms now have their own gear, dropped by each realm\'s monsters and sold at the immortal markets.') },
    ],
    more: [
      tr('Hội đấu giá Vạn Bảo Lâu', 'The Myriad Treasures auction'),
      tr('Thương nhân lưu động ghé qua', 'Wandering merchants drop by'),
      tr('Lò hợp bảo cạnh lò rèn', 'A treasure cauldron beside the forge'),
      tr('Tiên nhân, Ma vương giáng trần', 'Immortals and Demon Lords descend'),
    ],
    groups: [
      {
        h: tr('Phường thị mới', 'The new market'),
        hot: true,
        items: [
          tr('Giá theo cảnh giới và phẩm của món đồ, bán lại chỉ được một phần nhỏ. Cày quái đem bán không còn giàu nhanh như trước.', 'Prices follow the realm and grade of each item, and selling back only returns a small part. Farming monsters to sell loot no longer makes you rich overnight.'),
          tr('Tab Hàng mới về thay hàng theo năm tháng, có lúc lẫn hàng hiếm. Phi thăng rồi thì ghé Tiên thị, Ma thị, Hư thị. Đồ hiếm nay là Sổ đồ rơi.', 'The New arrivals tab restocks over the years, sometimes with rare goods. Once ascended, visit the Immortal, Demon and Void markets. Rare Items is now the Drop Log.'),
          tr('Thị tượng đổi theo vòng đời kiếp, hiện ở đầu Phường thị: lúc được mùa, lúc loạn giá. Để ý mà mua bán.', 'Market moods shift over your life and show at the top of the Market: boom years, chaotic prices. Watch them when you trade.'),
        ],
      },
      {
        h: tr('Đấu giá, thương nhân', 'Auctions and merchants'),
        items: [
          tr('Vạn Bảo Lâu nhiều năm mới mở hội đấu giá một lần: đấu giá kín ngay trong thẻ sự kiện, có so với món đang mặc.', 'The Myriad Treasures Pavilion holds its auction only once every many years: bid in secret right on the event card, compared with what you wear.'),
          tr('Thương nhân lưu động thỉnh thoảng ghé qua: mua, mặc cả, hoặc liều cướp.', 'A wandering merchant drops by now and then: buy, haggle, or risk a robbery.'),
          tr('Theo cướp người thắng giá ở hội đấu giá cũ nay đánh với hộ vệ đúng tầm, Độ Kiếp không còn thua hộ vệ Kim Đan.', 'Robbing the winning bidder after the old auction now pits you against guards of a fitting level. A Tribulation cultivator no longer loses to Golden Core guards.'),
        ],
      },
      {
        h: tr('Lò rèn', 'The forge'),
        items: [
          tr('Hộ Khí Phù giữ đồ không vỡ khi rèn hỏng, hàng hiếm, phải tìm ở Hàng mới về hoặc thương nhân.', 'The Item Ward Talisman keeps gear whole on a failed forge. It is rare: look for it in New arrivals or from merchants.'),
          tr('Linh Hỏa giúp rèn dễ thành hơn, bán ở tab Đan dược. Cả hai chọn dùng ngay trong lò rèn.', 'Spirit Flame makes forging more likely to succeed and is sold in the Pills tab. Both are picked right in the forge.'),
          tr('Lò hợp bảo đặt cạnh lò rèn trong Túi đồ.', 'A treasure cauldron now stands beside the forge in your Bag.'),
        ],
      },
      {
        h: tr('Kết duyên và Hệ Thống', 'Romance and the System'),
        items: [
          tr('Kết duyên nay có ích thật: có đạo lữ thì song tu, chưa có thì đạo hữu thỉnh thoảng giúp một tay.', 'Romance now really helps: with a Dao companion you dual-cultivate, without one your friends lend a hand now and then.'),
          tr('Hệ Thống trói định xong sẽ phát nhiệm vụ có hạn, làm xong thì có thưởng và Hệ Thống lên cấp.', 'Once bound, the System hands out timed quests. Finish them for rewards and to level the System up.'),
          tr('Ai mang thiên phú Hệ Thống thì được thêm gói quà tân thủ.', 'Those born with the System talent get a starter gift pack too.'),
        ],
      },
      {
        h: tr('Trang bị tiên giới', 'Immortal-realm gear'),
        items: [
          tr('Tiên giới, Ma giới, Thái Hư nay có trang bị riêng của từng cõi, rơi từ quái nơi đó và lên kệ chợ tiên giới.', 'The Immortal, Demon and Great Void realms now have gear of their own, dropped by local monsters and stocked in the immortal markets.'),
        ],
      },
      {
        h: tr('Giang hồ', 'The jianghu'),
        items: [
          tr('Oan gia, kẻ truy sát không còn vượt tầm bạn quá xa, chưa phi thăng thì không gặp người tiên giới.', 'Nemeses and hunters are no longer far beyond you, and until you ascend you will not meet anyone from the Immortal Realm.'),
          tr('Hiếm lắm mới có Tiên nhân hoặc Ma vương giáng trần. Quỳ bái, dâng lễ hay liều ra tay là tùy bạn.', 'Very rarely an Immortal or Demon Lord descends. Kneel, make an offering, or dare to strike: your call.'),
        ],
      },
    ],
  },
  {
    v: '4.0.3',
    date: '02/11/2026',
    title: tr('Thọ Nguyên Giữ Vững, Lời Viếng Có Tên', 'Lifespan Holds, Condolences Know Your Name'),
    lead: tr('Đan dược thêm thọ không còn bị đột phá nuốt mất. Lời viếng ở Nghĩa trang nay nói đúng về người đã khuất, và Lôi đài cho đổi kiếp ra đài giữa các trận.', 'Lifespan from pills is no longer swallowed by a breakthrough. Condolences in the Cemetery now speak of the departed by name, and the Arena lets you swap which life you send in between matches.'),
    asked: [
      { who: '@ckthaovu', short: tr('Thọ thêm từ đan không bị cắt khi đột phá', 'Pill lifespan no longer cut by breakthroughs'), text: tr('Thọ nguyên thêm từ đan, đào, kỳ ngộ nay được giữ khi đột phá đại cảnh giới. Thử 300 lần đột phá Luyện Hư với thọ 308: trước đây lần nào cũng tụt về 300, nay lần nào cũng giữ được.', 'Lifespan added by pills, peaches and encounters is now kept through a major breakthrough. In 300 test breakthroughs into Void Refinement at lifespan 308, it used to drop back to 300 every time; now it holds every time.') },
    ],
    more: [
      tr('Lời viếng nhắc tên, cảnh giới, kẻ giết, đạo lữ', 'Condolences name the realm, the killer, the companion'),
      tr('Màn lập bia gợi ý 3 câu văn bia', 'The tombstone screen suggests 3 epitaphs'),
      tr('Lôi đài: đổi kiếp ra đài giữa các trận', 'Arena: swap your fighter between matches'),
      tr('Cân bằng lại nhịp chơi và chỉ số game', 'Rebalanced game pacing and stats'),
    ],
    groups: [
      {
        h: tr('Thọ nguyên', 'Lifespan'),
        hot: true,
        items: [
          tr('Năm thọ thêm từ đan, đào tiên, kỳ ngộ không còn bị trần thọ cắt khi đột phá đại cảnh giới. Nguyên Anh thọ 308 nhờ đan thì lên Luyện Hư vẫn còn ít nhất 308.', 'Years added by pills, immortal peaches and encounters are no longer cut by the lifespan cap on a major breakthrough. A Nascent Soul at 308 thanks to pills keeps at least 308 on reaching Void Refinement.'),
        ],
      },
      {
        h: tr('Lời viếng, văn bia', 'Condolences and epitaphs'),
        items: [
          tr('Câu viếng mẫu ở Nghĩa trang và trong hồi ký nay viết riêng cho từng ngôi mộ: con đường, tên, cảnh giới, tuổi, kẻ đã giết, đạo lữ, kết cục. Ví dụ: "Kiếm tu Cố Thanh Vân ngã dưới tay Huyết Ma ở Trúc Cơ, năm 34 tuổi. Mong kiếp sau gặp lại trên lôi đài."', 'Preset condolences in the Cemetery and in memoirs are now written for each grave: path, name, realm, age, killer, companion, ending. For example: "Sword Cultivator Gu Qingyun fell to Blood Demon at Foundation, aged 34. May we meet again in the arena next life."'),
          tr('Màn lập bia gợi ý 3 câu văn bia lấy từ khoảnh khắc lớn nhất kiếp và cái chết, bấm là điền, sửa thêm tùy ý.', 'The tombstone screen suggests 3 epitaphs drawn from the biggest moment of your life and your death. Tap to fill in, then edit as you like.'),
        ],
      },
      {
        h: tr('Thế giới', 'The world'),
        items: [
          tr('Đệ tử chính phái vừa theo ma đạo, hay đạo tâm sa đọa, thì tông môn phản ứng ngay năm đó: tự xin rời, giấu thân phận hoặc phản sư, không còn ở lại như không có chuyện gì.', 'A righteous sect disciple who turns to the demonic path, or whose Dao heart falls, now faces the sect that very year: leave, hide it, or betray the master. No more staying on as if nothing happened.'),
          tr('Cô nhi, trẻ bị bỏ ở chùa và người mang mệnh thiên sát cô tinh lớn lên rồi cũng không còn thư cha mẹ gửi: thư là của người đã nuôi mình (lão ăn mày, sư thầy, bà hàng xóm).', 'Orphans, temple foundlings and those born under the Lone Star no longer receive letters from parents as adults: the letter comes from whoever raised them (the old beggar, the monk, the neighbor woman).'),
          tr('Trẻ mồ côi (cô nhi, trẻ chùa, thiên sát cô tinh) trước nay không bao giờ gặp ngày tông môn tuyển đệ tử. Nay các em cũng được thử vào Thanh Vân Tông, Huyết Sát Môn, Thiên Cơ Các như mọi người, hoặc ở lại trấn làm thuê.', 'Orphans (street orphans, temple foundlings, Lone Star children) never used to see the sect recruitment day. Now they can try for Qingyun Sect, Xuesha Sect or Tianji Pavilion like everyone else, or stay in town and work for hire.'),
          tr('Nhận đồ đệ từ đứa trẻ quỳ trước cửa cũng được đếm thứ tự thật: đầu tiên, thứ hai, thứ ba.', 'Disciples taken in from the child kneeling at your door are counted in real order: first, second, third.'),
        ],
      },
      {
        h: tr('Lôi đài', 'Arena'),
        items: [tr('Nút "⇄ Đổi kiếp" ở sảnh Lôi đài: chọn kiếp ra đài trong 12 kiếp mạnh nhất, đổi qua lại bất cứ lúc nào giữa các trận.', 'The "⇄ Change life" button in the Arena lobby: pick your fighter from your 12 strongest lives, and swap any time between matches.')],
      },
      {
        h: tr('Cân bằng', 'Balance'),
        items: [tr('Cân bằng lại nhịp chơi và chỉ số game.', 'Rebalanced game pacing and stats.')],
      },
    ],
  },
  {
    v: '4.0.2',
    date: '31/10/2026',
    title: tr('Tích Cốc, Thiên Đạo Siết Tu Vi', 'Inedia, and the Heavens Tighten Cultivation'),
    lead: tr('Sau 4.0.1 đạo hữu lên Hóa Thần dễ quá, Thiên Đạo siết lại tu vi từ Kim Đan trở lên. Bù lại, từ Trúc Cơ đã tích cốc không còn chết đói, và tuổi 16 không còn là vách đá.', 'After 4.0.1 reaching Spirit Transformation became too easy, so the Heavens tighten cultivation from Golden Core up. In return, from Foundation you have transcended food and can no longer starve, and turning 16 is no longer a cliff.'),
    asked: [
      { who: '@thien', short: tr('Tu vi cần tăng theo cảnh giới', 'Cultivation needed now rises by realm'), text: tr('Luyện Khí, Trúc Cơ giữ nguyên. Kim Đan cần tu vi gấp 1,75 lần, Nguyên Anh và Hóa Thần gấp 2,25 lần, từ Luyện Hư và cả tiên giới, ma giới gấp 2,5 lần.', 'Qi Refining and Foundation are unchanged. Golden Core needs 1.75x the cultivation, Nascent Soul and Spirit Transformation 2.25x, and from Void Refinement through the Immortal and Demon Realms 2.5x.') },
      { who: '@comiu', short: tr('Tích cốc: từ Trúc Cơ không còn chết đói', 'Inedia: no more starving from Foundation on'), text: tr('Từ Trúc Cơ, linh thạch dùng cho linh dược, động phủ thay cho tiền ăn. Túi rỗng thì tu luyện chậm và sinh tâm ma, nhưng không mất sức khỏe, không chết đói. Kết cục Chết Đói Đầu Đường chỉ còn ở Phàm nhân và Luyện Khí.', 'From Foundation on, your stones pay for spirit herbs and your cave abode instead of food. An empty pouch slows cultivation and breeds heart demons, but costs no health and cannot starve you. The Starved in the Street ending now only happens to mortals and Qi Refiners.') },
    ],
    more: [
      tr('Tuổi 16 không còn là vách đá', 'Turning 16 is no longer a cliff'),
      tr('Tạp, Phế linh căn chọn đường sớm hơn', 'Mixed and Crippled roots choose a path sooner'),
      tr('Khung số tài khoản Mời trà dễ đọc', 'Easier-to-read account number on the Tea page'),
    ],
    stats: [
      { n: '2,5x', label: tr('tu vi cần từ Luyện Hư', 'cultivation needed from Void Refinement') },
      { n: '0', label: tr('cái chết đói từ Trúc Cơ', 'starvation deaths from Foundation on') },
    ],
    groups: [
      {
        h: tr('Thiên Đạo siết tu vi', 'The Heavens tighten cultivation'),
        hot: true,
        items: [
          tr('Sau bản 4.0.1, gần một nửa số kiếp lên tới Hóa Thần, quá dễ so với ý Thiên Đạo. Nay tu vi cần để lên tầng tăng theo cảnh giới: Luyện Khí, Trúc Cơ giữ nguyên cho người mới; Kim Đan ×1,75; Nguyên Anh, Hóa Thần ×2,25; Luyện Hư, Độ Kiếp và tiên giới, ma giới ×2,5.', 'After 4.0.1 almost half of all lives reached Spirit Transformation, far too easy. Cultivation needed per layer now rises by realm: Qi Refining and Foundation unchanged for newcomers; Golden Core x1.75; Nascent Soul and Spirit Transformation x2.25; Void Refinement, Tribulation and the Immortal and Demon Realms x2.5.'),
          tr('Kiếp đang chơi dở cũng theo luật mới từ tầng tiếp theo.', 'Lives in progress follow the new rule from their next layer.'),
        ],
      },
      {
        h: tr('Tích cốc', 'Inedia'),
        items: [
          tr('Từ Trúc Cơ, người tu đạo đã tích cốc, không cần ăn. Linh thạch hằng năm dùng cho linh dược và động phủ. Thiếu tiền thì tu vi chậm lại và tâm ma tăng, không còn trừ sức khỏe, không còn câu nhịn đói.', 'From Foundation on, cultivators have transcended food. Your yearly stones go to spirit herbs and your cave abode. Running short slows your cultivation and feeds your heart demon, but no longer drains health or leaves you going hungry.'),
        ],
      },
      {
        h: tr('Tuổi 16 không còn là vách đá', 'Turning 16 is no longer a cliff'),
        items: [
          tr('Lần đầu thua quái sau 16 tuổi của mỗi kiếp chỉ bị trọng thương, kèm lời nhắc đã trưởng thành. Sau đó hiểm nguy khi thua tăng dần, tới 22 tuổi mới bằng người lớn.', 'The first time you lose to a monster after 16 in each life you are only badly wounded, with a reminder that you have grown up. After that the danger of losing rises gradually and only reaches full adult level at 22.'),
          tr('Tạp linh căn, Phế linh căn được chọn con đường tu luyện từ Luyện Khí tầng 3 thay vì tầng 5.', 'Mixed and Crippled Spiritual Roots can choose a cultivation path from Qi Refining layer 3 instead of layer 5.'),
        ],
      },
      {
        h: tr('Sửa nhỏ', 'Small fixes'),
        items: [
          tr('Khung số tài khoản ở trang Mời trà: nền sáng, chữ tối, dễ đọc hơn.', 'The account number box on the Tea page now has a light background and dark text, easier to read.'),
          tr('Bớt giật khi chơi ở cảnh giới cao, tốc độ cao và lúc treo máy trừ yêu.', 'Less stutter at high realms, at high speed and while idle-hunting.'),
        ],
      },
    ],
  },
  {
    v: '4.0.1',
    date: '30/10/2026',
    title: tr('Hết Chết Oan', 'No More Senseless Deaths'),
    lead: tr('Hai ngày sửa theo góp ý của đạo hữu: chết thì biết vì ai, tu cao thì phàm nhân phải tránh đường, kẻ thù không còn kéo tới ba trận liền. Hợp Hoan Tông cũng đã mở cửa.', 'Two days of fixes from your feedback: when you die you know who did it, once you are strong the mortals step aside, and enemies no longer come three fights in a row. Hehuan Sect has also opened its gates.'),
    asked: [
      { who: '@thien', short: tr('Từ Trúc Cơ, tai nạn phàm tục không giết được nữa', 'From Foundation on, mortal accidents can no longer kill you'), text: tr('Sập nhà, cầu treo, giếng, rắn độc, nấm độc, nghẹn bánh, trượt chân: từ Trúc Cơ chỉ làm bị thương. Cướp vặt chỉ chặn tới Kim Đan, gặp Nguyên Anh thì quỳ xin tha.', 'Collapsing houses, rope bridges, wells, snakes, poison mushrooms, choking, slipping: from Foundation on they only wound you. Petty bandits stop at Golden Core, and kneel for mercy before a Nascent Soul.') },
      { who: '@vickary', short: tr('Tu cao không còn bị phàm nhân ăn hiếp', 'No more bullying by mortals once you are strong'), text: tr('Từ Trúc Cơ, côn đồ, vu oan, trộm, thương hội không làm gì được bạn, có lựa chọn Ra tay, Dọa cho chạy. Mất linh thạch tối đa 5%, từ Nguyên Anh phàm nhân không cướp được. Đồng môn hút tu vi thì tố cáo, thách đấu hay hút ngược.', 'From Foundation on, thugs, false accusers, thieves and merchant guilds cannot touch you, and you get Act and Scare Them Off choices. You lose at most 5% of your stones, and from Nascent Soul mortals cannot rob you at all. A disciple stealing your cultivation can be reported, challenged or drained back.') },
      { who: '@shizun', short: tr('Hợp Hoan Tông: 15 sự kiện, 2 kết cục mới', 'Hehuan Sect: 15 events, 2 new endings'), text: tr('Hợp Hoan Tông, tông tà thứ ba: lô đỉnh, mị thuật, Bách Hoa Yến, tranh ngôi Thánh tử/Thánh nữ, người thật lòng, bỏ tông vì tình. Kết cục mới: Tình Cũ Đòi Mạng, Vì Tình Bỏ Tông.', 'Hehuan Sect, the third evil sect: cauldrons, charm arts, the Feast of a Hundred Flowers, the race for Holy Son or Daughter, someone who truly loves you, leaving the sect for love. New endings: An Old Flame Collects, Left the Sect for Love.') },
      { who: '@shizun @thien', short: tr('Kẻ thù không dồn cục, thua thì dễ gặp cơ duyên', 'Enemies no longer pile up; losing brings more fortune'), text: tr('Hai trận bắt buộc (chặn đường, gặp người, oan gia, cướp đường, sát thủ) cách nhau ít nhất 3 năm và 60 giây. Sức khỏe dưới 35 không bị chặn đường. Thua trận còn sống thì 5 năm sau dễ gặp cơ duyên gấp 3.', 'Forced fights (ambushes, duels, nemeses, robbers, assassins) are at least 3 years and 60 seconds apart. Below 35 Health you will not be ambushed. Survive a loss and you are three times as likely to find good fortune for 5 years.') },
    ],
    more: [
      tr('Văn bia nêu đích danh kẻ giết', 'Epitaphs name your killer'),
      tr('Kết cục đúng cách chết', 'Endings that match how you died'),
      tr('Chính đạo không bị coi là hiền nhát', 'Righteous choices are not seen as weakness'),
    ],
    stats: [
      { n: '0', label: tr('cái chết vì rắn rết từ Trúc Cơ', 'snake deaths from Foundation on') },
      { n: '3', label: tr('năm lặng giữa hai trận', 'quiet years between fights') },
      { n: '15', label: tr('sự kiện Hợp Hoan Tông', 'Hehuan Sect events') },
    ],
    groups: [
      {
        h: tr('Chết thì biết vì ai', 'Know who killed you'),
        hot: true,
        items: [
          tr('Chết vì quái chặn đường, thua giao đấu, oan gia, sát thủ giờ có kết cục riêng: Khinh Địch Mất Mạng khi quái yếu hơn hoặc ngang sức, Liều Mình Vào Tử Địa khi quái mạnh hơn, Chết Dưới Đao Giang Hồ khi thua người. Câu nguyên nhân nêu đích danh kẻ giết và tuổi.', 'Deaths to ambushes, duels, nemeses and assassins now have their own endings: Death by Overconfidence against a weaker or equal monster, Charging Into the Death Zone against a stronger one, Cut Down in the Jianghu when a person beats you. The cause names your killer and your age.'),
          tr('Chết vì thương thế thì tính theo vết thương nặng nhất 4 năm gần đây, ai gây ra thì kết cục theo người ấy. "Chết Không Toàn Thây" giảm từ hơn 20% xuống dưới 7% số kiếp.', 'Dying of wounds now counts the worst wound of the last 4 years, and the ending follows whoever dealt it. "No Body Left Whole" drops from over 20% of lives to under 7%.'),
        ],
      },
      {
        h: tr('Tu cao thì phàm nhân tránh đường', 'Mortals step aside for the strong'),
        items: [
          tr('Từ Trúc Cơ, 25 tai họa phàm tục chỉ gây thương, không chết, và không thành giọt nước tràn ly khi đang yếu. Rắn độc hết đan thì sốt mấy ngày, thêm chút tâm ma.', 'From Foundation on, 25 mortal disasters only wound you, never kill, and never become the last straw when you are weak. A snake bite with no pills just means a few days of fever and a little heart demon.'),
          tr('Ba tên tán tu chỉ chặn đường tới Kim Đan, và ở Trúc Cơ, Kim Đan thì đánh là thắng. Từ Nguyên Anh có chuyện mới: bọn cướp nhận ra bạn, quỳ xuống dập đầu.', 'The three rogue cultivators only rob up to Golden Core, and at Foundation and Golden Core you win if you fight. From Nascent Soul there is a new event: the robbers recognize you and kowtow.'),
          tr('Côn đồ đầu làng, nhà giàu vu oan, kẻ tiểu nhân, trộm vào kho: từ Trúc Cơ thành chuyện cười. Thương hội chèn ép có lựa chọn Ra tay. Mất linh thạch vì kẻ yếu tối đa 5% và không quá 60 lần cảnh giới.', 'Village thugs, rich men framing you, swindlers, burglars: from Foundation on they become a joke. Merchant guilds get an Act choice. Losses to the weak are capped at 5% and at 60 times your realm.'),
          tr('Đồng môn hút trộm tu vi: mất tối đa 5%, rồi chọn tố cáo trưởng lão, thách đấu lôi đài (thắng lấy lại gấp rưỡi), hút ngược hay nhịn.', 'A fellow disciple stealing your cultivation takes at most 5%, then you choose: report to the elders, challenge in the arena (win back 1.5x), drain them back, or let it go.'),
          tr('Chọn đường chính nghĩa không còn làm người ta coi bạn hiền dễ bắt nạt. Trước đây người theo chính đạo bị ăn hiếp gấp nhiều lần tà đạo, nay ngang nhau.', 'Choosing the righteous option no longer marks you as easy prey. Righteous players used to be bullied many times more than evil ones; now it is even.'),
        ],
      },
      {
        h: tr('Nhịp kẻ địch', 'Enemy pacing'),
        items: [
          tr('Chặn đường, gặp người, oan gia, cướp đường, sát thủ cách nhau ít nhất 3 năm game và 60 giây thật. Không còn cảnh ba trận liền.', 'Ambushes, duels, nemeses, robbers and assassins are at least 3 game years and 60 real seconds apart. No more three fights in a row.'),
          tr('Sức khỏe dưới 35 thì quái không chặn đường. Thua trận mà còn sống, 5 năm sau gặp kỳ ngộ, cao nhân, bí cảnh nhiều gấp 3.', 'Below 35 Health, monsters will not ambush you. Survive a loss and for 5 years you meet encounters, masters and secret realms three times as often.'),
        ],
      },
      {
        h: tr('Hợp Hoan Tông', 'Hehuan Sect'),
        items: [
          tr('Tán tu tà tâm, hoặc từng lợi dụng song tu, sẽ gặp Mị Cơ mời nhập môn. Bốn bậc: Hoa nô, Mị đồ, Hoan Hỷ sứ, Thánh tử/Thánh nữ. Bốn món đồ tông: hai áo sa, Hoan Hỷ đào hoa bào, Mị hồn châu.', 'Evil-hearted rogues, or anyone who once exploited dual cultivation, will meet the Charm Lady. Four ranks: Flower Slave, Charm Apprentice, Envoy of Joy, Holy Son or Daughter. Four sect items: gauze robes, the Peach Blossom Robe of Joy, the Soul-Charming Pearl.'),
          tr('Mỗi lô đỉnh tu nhanh thêm 3% nhưng thêm tâm ma mỗi năm. Thắng giao đấu thì Thái âm bổ dương, hút thêm tu vi. Bách Hoa Yến thay Đại bỉ, Thánh tử/Thánh nữ phải qua tuyển.', 'Each cauldron speeds cultivation by 3% but adds heart demon every year. Win a duel and Yin nourishes yang for extra cultivation. The Feast of a Hundred Flowers replaces the Grand Tournament, and the Holy Son or Daughter must win the selection.'),
          tr('15 sự kiện nối nhau: người bị hút cạn quay lại báo thù, gặp người thật lòng, tông chủ phát hiện, bỏ trốn vì tình, chính phái vây cốc. Hai kết cục mới: Tình Cũ Đòi Mạng, Vì Tình Bỏ Tông.', '15 linked events: those you drained come back for revenge, someone truly loves you, the Sect Master finds out, you run away for love, the righteous besiege the valley. Two new endings: An Old Flame Collects, Left the Sect for Love.'),
        ],
      },
    ],
  },
  {
    v: '4.0.0',
    date: '29/10/2026',
    title: tr('Vạn Kiếp Hộ Đạo', 'Guarded by Ten Thousand Lives'),
    lead: tr('Bản này làm theo góp ý của đạo hữu: Chứng Đạo thành bốn kiếp vấn đạo và mười ba đạo lôi, các kiếp trước hiện về đỡ lôi thay bạn. Độ Kiếp có quái riêng, oan gia bớt dày, đồ thừa có chỗ dùng, được hạ chiến thư cho bóng của người khác.', 'This update follows your feedback: attaining the Dao now means four trials and thirteen bolts, and your past lives return to take the lightning for you. Tribulation has its own monsters, nemeses show up less, spare gear finally has a use, and you can challenge other players\' shadows.'),
    asked: [
      { who: '@thien', short: tr('Chứng Đạo mới: 4 kiếp vấn đạo, 13 đạo lôi, vạn kiếp hộ đạo', 'New Dao attainment: 4 trials, 13 bolts, past lives shield you'), text: tr('Chứng Đạo mới: Tứ Kiếp Vấn Đạo (Tâm Ma, Ái Nộ, Vấn Tâm, Vấn Thiên), rồi 13 đạo lôi. Hụt nhiều thì vạn kiếp trước hiện về đỡ thay.', 'New Dao attainment: the Four Trials (Heart Demon, Love and Wrath, Questioning the Heart, Questioning Heaven), then 13 bolts. Miss too many and your past lives return to take them for you.') },
      { who: '@thien', short: tr('Độ Kiếp có 20 quái riêng, hết chết vì cướp vặt, rắn rết', 'Tribulation gets 20 monsters of its own, no more deaths to petty bandits'), text: tr('Độ Kiếp không còn chết vì cướp vặt, rắn rết: 20 loài quái chỉ gặp ở Độ Kiếp, cướp và sát thủ đổi thành kẻ thù xứng tầm.', 'No more Tribulation deaths to petty bandits and snakes: 20 monsters found only at Tribulation, and bandits and assassins are replaced by worthy foes.') },
      { who: '@hna @thien @shizun', short: tr('Oan gia bớt dày, bớt chênh 20%', 'Nemeses 20% less frequent and less overpowered'), text: tr('Oan gia bớt dày: gặp lại ít hơn, kẻ thù mạnh hơn cũng bớt chênh, Luyện Khí không gặp địch quá mạnh.', 'Fewer nemeses: they return less often, stronger foes are less overpowered, and Qi Refining no longer meets enemies far above you.') },
      { who: '@thien', short: tr('Hạ chiến thư cho bóng kiếp của người khác', 'Challenge other players\' shadows'), text: tr('Hạ chiến thư cho bóng một kiếp của người khác, đấu bằng cảnh giới thật, hai bên lệch tối đa 3 đại cảnh giới.', 'Challenge a shadow of another player\'s life, fought at true realms, at most 3 major realms apart.') },
      { who: '@minimoni', short: tr('Bán, phân giải đồ thừa, lò rèn +5, túi đồ búp bê', 'Sell or salvage spare gear, forge to +5, paper-doll bag'), text: tr('Đồ thừa bán lấy linh thạch hoặc phân giải ra tinh thiết; lò rèn nâng vũ khí tới +5; túi đồ kiểu búp bê.', 'Sell spare gear for spirit stones or break it into refined iron; the forge upgrades weapons up to +5; a paper-doll inventory.') },
    ],
    more: [
      tr('Tàng Kiếp Các', 'Hall of Past Lives'),
      tr('Thất Nhật Lục', 'Seven-Day Chronicle'),
      tr('Ngày giỗ các kiếp', 'Memorial days'),
      tr('Bảng Chứng Đạo', 'Dao Board'),
      tr('Kiếp trước hộ đạo ở Ngũ Hành Đài', 'Past lives at the Five Elements Platform'),
      tr('Tán công chuyển đạo', 'Switching paths mid-life'),
      tr('Trang đầu sống động', 'A livelier home page'),
      tr('Kiếp đầu nhanh hơn', 'A faster first life'),
    ],
    stats: [
      { n: '4+13', label: tr('kiếp vấn đạo + đạo lôi', 'trials + bolts') },
      { n: '20', label: tr('quái Độ Kiếp mới', 'new Tribulation monsters') },
      { n: '-20%', label: tr('độ dày oan gia', 'nemesis pressure') },
    ],
    groups: [
      {
        h: tr('Chứng Đạo mới và Vạn Kiếp', 'New Dao attainment and your past lives'),
        hot: true,
        items: [
          tr('Ở Tiên giới, Ma giới, Chứng Đạo là bốn kiếp vấn đạo: mỗi kiếp chọn một trong mấy cách, tỉ lệ hiện sẵn. Trượt một kiếp là rớt một đại cảnh giới, còn 1 máu, 10 năm sau mới thử lại.', 'In the Immortal and Demon Realms, attaining the Dao means four trials: each offers a few answers with the odds shown. Fail one and you drop a major realm with 1 HP left, and must wait 10 years to try again.'),
          tr('Qua đủ bốn kiếp thì đỡ 13 đạo lôi, hụt tối đa 3 đạo là chứng đạo.', 'Pass all four, then face 13 bolts; miss no more than 3 and you attain the Dao.'),
          tr('Hụt từ 4 đạo: các kiếp trước của bạn hiện về thành bóng, chạm từng kiếp để gửi lên đỡ lôi, kèm câu khắc bia bạn từng viết. Kiếp từng chết dưới thiên kiếp đỡ gấp rưỡi. Tối đa 13 kiếp, nên chơi nhiều kiếp chết yểu không giúp gì.', 'Miss 4 or more and your past lives return as shadows: tap each one to send them up, each carrying the epitaph you once wrote. Lives once killed by tribulation take 1.5x. At most 13 lives answer, so farming short lives does not help.'),
          tr('Thiên kiếp phi thăng hụt đạo nào thì kiếp trước từ Hóa Thần trở lên đỡ thêm, tối đa 3 đạo. Thua một vòng ở Ngũ Hành Đài thì một kiếp trước ra đỡ, đánh lại gương đó, mỗi đời một lần.', 'At the ascension tribulation, past lives from Spirit Transformation up can take up to 3 missed bolts. Lose a round at the Five Elements Platform and a past life steps in so you can fight that mirror again, once per life.'),
          tr('Màn cáo biệt của mọi kiếp có hàng bóng các kiếp trước. Tàng Kiếp Các cất mọi kiếp bạn từng là, chạm vào xem lời để lại.', 'Every farewell screen shows the line of your past lives. The Hall of Past Lives keeps everyone you have been; tap one to read their last words.'),
          tr('Thất Nhật Lục ghi bảy ngày luân hồi của bạn, khoe được thành thẻ. Ngày giỗ một kiếp (7, 49, 100 ngày, tròn năm) thắp hương được thêm phúc duyên.', 'The Seven-Day Chronicle records your last seven days and turns it into a card to share. On a past life\'s memorial day (7, 49, 100 days, each year) you can light incense for extra Fortune.'),
          tr('Bảng Chứng Đạo: ai chứng đạo nhiều nhất, nhanh nhất, nhờ vạn kiếp hộ đạo. Chứng đạo xong có khung chỉ bước tiếp theo và ô hỏi đạo hữu muốn Thiên Đạo thêm gì.', 'The Dao Board: who attained the Dao most often, fastest, and with the help of past lives. Afterward a panel shows your next step and asks what you would like the Heavenly Dao to add.'),
        ],
      },
      {
        h: tr('Độ Kiếp và oan gia', 'Tribulation and nemeses'),
        items: [
          tr('20 loài quái chỉ gặp khi đã Độ Kiếp (Lv24-33, 4 loài mỗi hệ), hình pixel dáng mới. Quái chặn đường ở Độ Kiếp chỉ rút từ nhóm này.', '20 monsters found only at Tribulation (Lv24-33, 4 per element), with new pixel shapes. Ambushes at Tribulation draw only from them.'),
          tr('Cướp đêm thành Đoạt Kiếp Minh bày Khốn Long Trận, sát thủ thành lôi kiếp người khác nhận nhầm. Vẫn nguy hiểm, nhưng hợp tầm Độ Kiếp.', 'Night bandits become the Calamity Thieves\' League with its Dragon-Trapping Array, and assassins become another cultivator\'s tribulation striking you by mistake. Still dangerous, but fit for Tribulation.'),
          tr('Oan gia gặp lại 28% thay vì 35%, kẻ thù mạnh hơn chỉ giữ 80% khoảng cách sức mạnh, Luyện Khí gặp địch mạnh hơn 2-5 cấp thay vì 3-6.', 'Nemeses return 28% of the time instead of 35%, stronger foes keep only 80% of the power gap, and Qi Refining meets foes 2-5 levels above instead of 3-6.'),
        ],
      },
      {
        h: tr('Đồ đạc, lò rèn, chiến thư', 'Gear, forge and challenges'),
        items: [
          tr('Túi đồ kiểu búp bê: nhân vật đứng giữa, ô trang bị quanh người.', 'Paper-doll inventory: your character in the middle, gear slots around them.'),
          tr('Đồ thừa bán lấy linh thạch hoặc phân giải ra tinh thiết. Lò rèn nâng vũ khí tới +5, mỗi món mang một hệ ngũ hành; từ +2 lên +3 trở đi có thể vỡ.', 'Sell spare gear for spirit stones or break it into refined iron. The forge upgrades weapons to +5, each carrying a random element; from +2 to +3 onward the item may shatter.'),
          tr('Hạ chiến thư: đấu Phi Kiếm với bóng một kiếp của người khác (từ nghĩa trang, bảng xếp hạng, giang hồ), đấu bằng cảnh giới thật, lệch tối đa 3 đại cảnh giới.', 'Issue a challenge: a Flying Sword duel with a shadow of another player\'s life (from the cemetery, leaderboard or jianghu), at true realms, at most 3 major realms apart.'),
          tr('Tán công chuyển đạo: 10 kỳ ngộ cho phép đổi con đường giữa kiếp, mất 30% tu vi, mỗi kiếp một lần.', 'Switching paths: 10 rare encounters let you change your path mid-life, losing 30% cultivation, once per life.'),
        ],
      },
      {
        h: tr('Trang đầu và người mới', 'Home page and newcomers'),
        items: [
          tr('Trang đầu hiện số đạo hữu đang luân hồi, dòng tin các kiếp vừa hết, thiên tượng hôm nay, 3 bia mới có thắp hương, và thanh Tiếp tục ghim dưới đáy.', 'The home page shows how many Daoists are playing, a ticker of lives just ended, today\'s omen, the 3 newest graves with incense, and a pinned Continue bar.'),
          tr('Kiếp đầu: chuyện thôi nôi tới ngay, mặc định tốc độ Nhanh, tuổi thơ ba kiếp đầu trôi nhanh hơn. Sáu bảng hướng dẫn được thay bằng gợi ý nhỏ đúng lúc cần.', 'First life: the first-birthday event comes right away, speed defaults to Fast, and childhood in the first three lives passes faster. The six tutorial panels are replaced by small hints when you need them.'),
        ],
      },
    ],
  },
  {
    v: '3.2.0',
    date: '27/10/2026',
    title: tr('Phi Kiếm Luận Anh Hùng', "Flying Swords and Heroes"),
    lead: tr('Lôi đài giờ chỉ cần một ngón tay và 25 giây. Bóng mạnh nhất được thả vào giang hồ làm ma đầu. Đời nào đáng khoe thì có thẻ để khoe, dán link lên mạng là hiện hình nhân vật.', "The Arena now takes one finger and 25 seconds. The strongest shadows are unleashed on the jianghu as demon lords. Lives worth bragging about get a card to brag with - paste the link anywhere and your character shows up."),
    stats: [
      { n: '25s', label: tr('một trận lôi đài', "per arena match") },
      { n: '7', label: tr('ngày điểm danh', "daily check-ins") },
      { n: 'x0,4', label: tr('tử nạn 3 kiếp đầu', "death rate, first 3 lives") },
    ],
    groups: [
      {
        h: tr('Lôi đài Phi Kiếm', "Flying Sword Arena"),
        hot: true,
        items: [
          tr('Bấm Ra đài là vào trận ngay: game tự lấy kiếp mạnh nhất của bạn làm bóng và rút đối thủ. Vẫn tự chọn bóng được.', "Tap Enter the arena and you're in: the game picks your strongest life as your shadow and draws an opponent. You can still choose your shadow yourself."),
          tr('12 giây phóng phi kiếm phá hộ thể đối thủ: chạm để phóng, đâm vào kiếm đã cắm là Phản phệ. Đủ 10 kiếm vỡ một tầng, tầng sau xoay thất thường hơn.', "12 seconds to hurl flying swords at your opponent's protective barrier: tap to throw, and hitting a sword already stuck in it means Backlash. Every 10 swords shatter a layer, and the next layer spins more erratically."),
          tr('Càng nhiều kiếm, bóng càng mạnh: 0 kiếm còn 70% sức, mỗi kiếm thêm 2%, tối đa 130%. Sau đó hai bóng tự đánh, sắp gục được tuyệt địa phản kích một lần.', "More swords, stronger shadow: 0 swords leaves 70% power, each sword adds 2%, up to 130%. Then the two shadows fight on their own, and one about to fall gets a single desperate counterattack."),
          tr('Thắng +3 điểm và 10 phúc duyên. Thua vẫn +1 điểm và 3 phúc duyên. Đủ 3 trận trong ngày thêm 15 Hồn lực.', "Win for +3 points and 10 Fortune. Lose and still get +1 point and 3 Fortune. Play 3 matches in a day for an extra 15 Soul Power."),
          tr('Bậc lôi đài theo điểm tuần: Luyện Khí 3, Trúc Cơ 9, Kim Đan 18, Nguyên Anh 30, Hóa Thần 42, Độ Kiếp 54. Đầu tuần mới nhận 5 phúc duyên mỗi bậc.', "Arena tiers by weekly points: Qi Refining 3, Foundation 9, Golden Core 18, Nascent Soul 30, Spirit Transformation 42, Tribulation 54. Each new week pays 5 Fortune per tier."),
          tr('Bị ai hạ thì có thư và nút Báo thù, không tốn lượt. Nút Lôi đài có chấm đỏ khi còn lượt.', "Get beaten and you receive a letter and a Revenge button that costs no turn. The Arena button shows a red dot while you have turns left."),
        ],
      },
      {
        h: tr('Bóng thành ma đầu', "Shadows become demon lords"),
        hot: true,
        items: [
          tr('Bóng thắng 2 trận lôi đài trong một ngày hóa ma đầu, được thả vào giang hồ 24 giờ, chặn đường người chơi khác (từ Trúc Cơ, tối đa 2 lần mỗi kiếp).', "A shadow that wins 2 arena matches in a day turns into a demon lord and is unleashed on the jianghu for 24 hours, blocking other players' paths (from Foundation, at most 2 times per life)."),
          tr('Đánh tan ma đầu: +10 phúc duyên và đồ rơi. Thua: trọng thương, mất 10% linh thạch (tối đa 500), nhưng không chết.', "Defeat a demon lord: +10 Fortune and loot. Lose: grievous wounds and 10% of your spirit stones gone (max 500), but you don't die."),
          tr('Bóng của bạn hạ được ai thì bạn nhận thư và 5 phúc duyên, tối đa 30 mỗi ngày.', "Whenever your shadow takes someone down, you get a letter and 5 Fortune, up to 30 a day."),
        ],
      },
      {
        h: tr('Thẻ Một đời', "Life Card"),
        items: [
          tr('Màn lập bia có thẻ khoe: xếp loại S, A, B, C, D, đời này vượt bao nhiêu phần trăm các kiếp trong giang hồ, 3 dòng đáng nhớ.', "The tombstone screen now has a card to show off: an S, A, B, C or D grade, what percent of lives in the jianghu this one beat, and 3 memorable lines."),
          tr('Bấm Khoe đời này để chia sẻ link. Dán lên Facebook, Threads, Zalo sẽ hiện hình nhân vật của bạn. Có nút Chép chữ để dán vào nhóm.', "Tap Show off this life to share a link. Paste it on Facebook, Threads or Zalo and your character appears. There's a Copy text button for pasting into group chats."),
          tr('Bảng khoe có nút đi thẳng Threads, Facebook, Messenger và Chép link để dán Zalo, không phải tìm trong bảng chia sẻ của máy.', "The share panel has direct buttons for Threads, Facebook, Messenger, plus Copy link for Zalo - no digging through your phone's share sheet."),
          tr('Sau mỗi trận lôi đài cũng có nút Khoe trận.', "Every arena match also ends with a Show off match button."),
        ],
      },
      {
        h: tr('Người mới và điểm danh', "Newcomers and check-ins"),
        items: [
          tr('Ba kiếp đầu trời thương: hiểm cảnh khó giết người hơn nhiều cho tới khi chọn con đường. Mỗi kiếp đầu có một mục tiêu, đạt thì thưởng phúc duyên.', "Heaven pities your first three lives: perils are far less deadly until you choose a Path. Each early life has a goal that pays Fortune when reached."),
          tr('Điểm danh 7 ngày ngay ở màn đầu thai: phúc duyên, đan hồi hồn, linh thạch, ngày 7 là Hoàn Hồn Đan và ngọc bội. Bỏ một ngày thì về ngày 1.', "7-day check-in right on the rebirth screen: Fortune, soul pills, spirit stones, and on day 7 a Soul Return Pill and a jade pendant. Miss a day and you're back to day 1."),
          tr('Nhiệm vụ ngày nằm ngay dưới hàng điểm danh.', "Daily quests sit right below the check-in row."),
        ],
      },
      {
        h: tr('Đan tu và tiếng đồn', "Alchemists and rumours"),
        items: [
          tr('Kiếp sau một đời Đan tu mua đan hồi hồn rẻ hơn 30%: còn nhớ cách luyện.', "After a life as an Alchemist, your next life buys soul pills 30% cheaper: you still remember the recipe."),
          tr('Mỗi ngày một tiếng đồn ở màn đầu thai, gợi mờ một kết cục ít người mở nhất.', "A daily rumour on the rebirth screen hints at one of the least-unlocked endings."),
          tr('Ai mở một kết cục đầu tiên trong giang hồ, cả server nhận thư Thiên Đạo. Sổ Sinh Tử ghi số người đã mở và người đầu tiên.', "Whoever unlocks an ending first in the jianghu, the whole server gets a letter from the Heavenly Dao. The Book of Life and Death records how many have unlocked it and who was first."),
        ],
      },
    ],
  },
  {
    v: '3.1.1',
    date: '27/10/2026',
    title: tr('Hoàn Hồn Đan', "Soul Return Pill"),
    lead: tr('Đạo hữu nghiện quá mà hồn không theo kịp? Tiệm đan dưới chân cầu Nại Hà đã mở. Cùng lúc, Thiên Đạo cân lại đường tu: thọ dài hơn thì tu cũng phải chậm lại một chút.', "Fellow Daoist, too hooked for your soul to keep up? A pill shop has opened at the foot of Naihe Bridge. Meanwhile, the Heavenly Dao rebalances cultivation: a longer lifespan means a slightly slower climb."),
    stats: [
      { n: '3', label: tr('phẩm đan hồi hồn', "grades of soul pill") },
      { n: '+10', label: tr('Hồn lực mỗi nhiệm vụ', "Soul Power per quest") },
      { n: 'x1,5', label: tr('tu vi cần từ Kim Đan', "cultivation needed from Golden Core") },
    ],
    groups: [
      {
        h: tr('Đan hồi hồn', "Soul pills"),
        hot: true,
        items: [
          tr('Ở Cầu Nại Hà, ngay trước khi đầu thai, giờ mua được đan hồi Hồn lực bằng phúc duyên. Cũng mua được trong mục Kiếp Số và Hồn lực ở lá số.', "At Naihe Bridge, right before rebirth, you can now buy Soul Power pills with Fortune. They're also sold in the Calamity Count and Soul Power section of your fate chart."),
          tr('Tụ Hồn Đan (hạ phẩm): +20 Hồn lực, 20 phúc. Dưỡng Hồn Đan (trung phẩm): +45 Hồn lực, 55 phúc. Hoàn Hồn Đan (thượng phẩm): hồi đầy, 140 phúc.', "Soul Gathering Pill (low grade): +20 Soul Power, 20 Fortune. Soul Nurturing Pill (mid grade): +45 Soul Power, 55 Fortune. Soul Return Pill (high grade): full restore, 140 Fortune."),
          tr('Mỗi ngày 3 viên đầu giá gốc. Từ viên thứ 4, mỗi viên đắt thêm 50% so với viên trước. Nghiện thì vẫn chơi tiếp được, chỉ là tốn phúc.', "The first 3 pills each day are base price. From the 4th, each costs 50% more than the last. Hooked? You can keep playing - it just costs Fortune."),
          tr('Mỗi nhiệm vụ ngày hoàn thành hồi thêm 10 Hồn lực.', "Each completed daily quest restores an extra 10 Soul Power."),
        ],
      },
      {
        h: tr('Cân bằng lại cơ chế tu luyện', "Cultivation rebalance"),
        items: [
          tr('Bản 3.1.0 làm thọ dài ra 1,5 lần nên phi thăng dễ quá (người chơi lâu năm phi thăng gần 1/4 số kiếp). Nay tu luyện chậm lại cho cân: tu vi cần để lên tầng từ Kim Đan trở lên tăng 1,5 lần.', "Version 3.1.0 made lifespans 1.5x longer, so Ascension got too easy (veteran players ascended in nearly 1/4 of their lives). Cultivation now slows to match: cultivation needed per layer from Golden Core up is 1.5x."),
          tr('Cõi trên: mỗi tầng cần ít nhất 24 năm (trước 17 năm), cảnh giới cuối 16 năm (trước 12 năm).', "Upper realms: each layer takes at least 24 years (was 17), the final realm 16 years (was 12)."),
          tr('Thiên kiếp phi thăng khó thêm 5%.', "The Ascension tribulation is 5% harder."),
          tr('Nhân vật đang chơi giữa kiếp sẽ thấy thanh tu vi tụt một đoạn: tu vi vẫn giữ nguyên, chỉ là mức cần để lên tầng cao hơn.', "Characters mid-life will see their cultivation bar drop a bit: your cultivation is untouched, the next layer just costs more."),
        ],
      },
      {
        h: tr('Theo góp ý của đạo hữu', "From fellow Daoists' feedback"),
        items: [tr('Đạo hữu trên Threads xin tắt Hồn lực vì "đang nghiện mà phải dừng". Không tắt được, nhưng có đan rồi.', "A fellow Daoist on Threads begged us to remove Soul Power because \"I'm hooked and have to stop\". Can't remove it, but now there are pills.")],
      },
    ],
  },
  {
    v: '3.1.0',
    date: '27/10/2026',
    title: tr('Vạn Tông Triều Bái', "Ten Thousand Sects Pay Homage"),
    lead: tr('Bản này làm theo góp ý của đạo hữu. Thêm bốn tông môn, một con đường nhập Ma giới, mười cốt truyện cho người đã phi thăng, thọ nguyên dài hơn mà đột phá khó hơn, linh thạch không còn dễ như nhặt lá.', "This version is built on fellow Daoists' feedback. Four new sects, a path into the Demon Realm, ten storylines for the ascended, longer lifespans but harder breakthroughs, and spirit stones no longer as easy as picking up leaves."),
    stats: [
      { n: '+4', label: tr('tông môn', "sects") },
      { n: '+33', label: tr('sự kiện cốt truyện', "story events") },
      { n: 'x1,5', label: tr('thọ nguyên', "lifespan") },
    ],
    groups: [
      {
        h: tr('Bốn tông môn mới', "Four new sects"),
        hot: true,
        items: [
          tr('Phổ Đà Sơn (chính): mời Phật tu và người đạo tâm từ 40. Tâm ma tăng chậm, nhưng diệt yêu quá tay sẽ bị Giới luật viện gọi lên.', "Putuo Shan (Righteous): welcomes Buddhist Cultivators and anyone with Dao Heart 40+. Heart demons grow slowly, but slay demons too zealously and the Discipline Hall will summon you."),
          tr('Kiếm Cốc (chính): mời Kiếm tu. Phải rút được kiếm trên vách đá mới được nhận. Đại bỉ 3 năm một lần, thăng bậc nhanh.', "Jian Valley (Righteous): welcomes Sword Cultivators. You must pull the sword from the cliff face to be accepted. A Grand Contest every 3 years, fast promotion."),
          tr('Vạn Độc Môn (tà): mời Đan tu, Ma tu. Có việc thử độc: tu vi tăng mạnh, đổi lại mất sức khỏe, có thể chết.', "Wandu Sect (Evil): welcomes Alchemists and Demonic Cultivators. Poison-testing jobs: big cultivation gains in exchange for Health, and you might die."),
          tr('Yêu Thần Điện (tà): nhận mọi yêu tộc, không xét linh căn. Có huyết tế và lệnh săn.', "Yaoshen Hall (Evil): accepts all yao races, no spiritual root check. Blood sacrifices and hunting orders."),
          tr('Mỗi tông có tên bậc đệ tử riêng, áo bào và bảo vật riêng cho từng bậc.', "Each sect has its own disciple rank names, plus robes and treasures for every rank."),
        ],
      },
      {
        h: tr('Mười cốt truyện sau phi thăng', "Ten post-Ascension storylines"),
        hot: true,
        items: [
          tr('Tổng cộng bản này thêm 33 sự kiện cốt truyện mới: 15 sự kiện sau phi thăng, 16 sự kiện tông môn và chuỗi Ma giới, 2 sự kiện Phản môn.', "In total this version adds 33 new story events: 15 post-Ascension events, 16 sect and Demon Realm chain events, 2 Betrayal events."),
          tr('Tiên giới: Canh bến Thiên Hà (thả hay bắt con giao long, tám năm sau nó quay lại), Cây quế Quảng Hàn (uống rượu với Ngô Cương), Trông lò Bát Quái (đừng mở nắp), Miếu thờ ở nhân gian (lén làm mưa cho hậu nhân).', "Immortal Realm: Guarding the Heavenly River Ford (free or catch the flood dragon - it comes back eight years later), The Osmanthus of Guanghan (drinks with Wu Gang), Minding the Eight Trigrams Furnace (don't lift the lid), A Shrine in the Mortal World (secretly make rain for your descendants)."),
          tr('Ma giới: Huyết Nguyệt, Ma Đế bệnh nặng (theo Đại hoàng tử, Tam công chúa hay đứng ngoài, qua chính biến tới ngày tân Ma Đế lên ngôi), Cửu U Thâm Uyên chín tầng, mỗi lần xuống sâu hơn, tầng cuối có Cửu U Ma Long.', "Demon Realm: Blood Moon, The Demon Emperor Falls Ill (back the Eldest Prince, the Third Princess, or stay out, through the coup to the new Demon Emperor's coronation), the nine-layered Nine Netherworld Abyss, deeper each time, with the Nine Netherworld Demon Dragon at the bottom."),
          tr('Thái Hư giới: Kẻ giữ đồng hồ cát (đổi thọ lấy đạo hay đạo lấy thọ), Bóng kiếp trước (gặp lại chính mình kiếp trước), Hư không rách (vá trời hay hút linh khí, bảy năm sau trả giá).', "Great Void Realm: The Hourglass Keeper (trade lifespan for Dao or Dao for lifespan), Shadow of a Past Life (meet yourself from a past life), The Torn Void (mend the sky or drink its spirit qi, and pay the price seven years later)."),
          tr('Nhiều chuyện kéo dài qua nhiều bước, lựa chọn bước trước quyết định bước sau. Vài chuyện lặp lại để người sống lâu ở cõi trên luôn có việc để làm.', "Many stories span several steps, and your choice in one step decides the next. Some repeat, so those who live long in the upper realms always have something to do."),
        ],
      },
      {
        h: tr('Phản môn', "Betrayal"),
        items: [
          tr('Đạo và tông môn ngược phe (đang ở chính phái mà theo Ma tu hoặc đạo tâm từ -40, đang ở ma môn mà theo Phật tu hoặc đạo tâm từ 40) sẽ gặp sự kiện Phản môn: tự xin rời, giấu thân phận, hoặc phản sư diệt tổ.', "When your Dao and your sect are on opposite sides (in a righteous sect but following the Demonic Path or Dao Heart -40 or below, in a demonic sect but a Buddhist Cultivator or Dao Heart 40+), you'll face a Betrayal event: ask to leave, hide your identity, or betray your master and destroy your sect."),
          tr('Giấu thân phận thì mỗi năm có thể bị lộ: bị trục xuất, mất áo bào và lệnh bài tông môn.', "Hide your identity and each year you might be exposed: expelled, stripped of your robe and sect token."),
          tr('Thiên Cơ Các trung lập không đuổi ai, nhưng người nghiêng hẳn về một phía sẽ kéo chính hoặc tà tới vây đánh cả Các.', "The neutral Tianji Pavilion expels no one, but those leaning hard to one side will draw the Righteous or the Evil to besiege the whole Pavilion."),
        ],
      },
      {
        h: tr('Chuỗi nhập Ma giới', "Demon Realm entry chain"),
        items: [
          tr('Vừa lên Ma giới, đạo hữu đi qua 4 bước trong khoảng 20 năm đầu: Huyết Trì tẩy thân, Nhận chủ, Tranh địa bàn, Ma Đế triệu kiến.', "Fresh in the Demon Realm, fellow Daoists go through 4 steps over the first ~20 years: Blood Pool Cleansing, Choosing a Lord, Turf War, Summoned by the Demon Emperor."),
          tr('Ba Ma quân cho ba lợi thế suốt kiếp: Huyết Ma Quân tu nhanh hơn, Cốt Ma Quân hồi sức khỏe và giảm tâm ma, Ảnh Ma Quân có thể dẫn tới của cải.', "Three Demon Lords grant three lifelong perks: the Blood Demon Lord speeds cultivation, the Bone Demon Lord restores Health and reduces heart demons, the Shadow Demon Lord may lead you to riches."),
          tr('Giành được khe Huyết Phong thì mỗi năm thu linh thạch. Ma Đế ban danh hiệu và bảo vật theo con đường tu.', "Seize the Xuefeng Rift and collect spirit stones every year. The Demon Emperor grants titles and treasures by Path."),
        ],
      },
      {
        h: tr('Thọ nguyên và đột phá', "Lifespan and breakthroughs"),
        items: [
          tr('Thọ nguyên mỗi cảnh giới tăng khoảng 1,5 lần: Trúc Cơ 150, Độ Kiếp 300, Ma Đế và Đại La tới 1.050. Trần thọ phàm giới 300, sau phi thăng 1.050.', "Lifespan per realm is up about 1.5x: Foundation 150, Tribulation 300, Demon Emperor and Daluo up to 1,050. Mortal-world lifespan cap 300, after Ascension 1,050."),
          tr('Đột phá từ Kim Đan trở lên phụ thuộc linh căn: Phế -15%, Tạp -8%, Địa +3%, Thiên +6%.', "Breakthroughs from Golden Core up depend on spiritual root: Crippled -15%, Mixed -8%, Earth +3%, Heavenly +6%."),
          tr('Hỏng 3 lần liền ở cùng cảnh giới thì rơi vào bình cảnh, phải bế quan 10 năm mới thử lại.', "Fail 3 times in a row at the same realm and you hit a bottleneck: 10 years of closed-door cultivation before you can try again."),
          tr('Cảnh giới càng cao, năm trôi càng nhanh, nên mỗi kiếp không dài thêm.', "The higher the realm, the faster the years fly, so lives don't get longer."),
        ],
      },
      {
        h: tr('Linh thạch và phường thị', "Spirit stones and the Market"),
        items: [
          tr('Đồ phường thị đắt dần theo cảnh giới của đạo hữu. Đồ hiếm (Luyện Hư, Độ Kiếp) mỗi kiếp chỉ mua được một lần.', "Market prices rise with your realm. Rare goods (Void Refinement, Tribulation) can be bought only once per life."),
          tr('Kiếm tiền và luyện đan liền nhiều năm thì thu ít dần, đổi việc một năm là về lại như cũ. % tiền từ trang bị tối đa +100%.', "Earning money or doing alchemy for many years straight yields less and less; switch jobs for a year and it resets. % money from gear caps at +100%."),
          tr('Đan Tụ Khí, Trúc Cơ đắt theo cảnh giới, Tụ Khí mỗi năm chỉ viên đầu đủ lực. Diên Thọ Đan càng dùng càng kém và càng đắt.', "Qi Gathering and Foundation pills scale in price with realm, and only the first Qi Gathering pill each year works at full strength. Longevity Pills get weaker and pricier the more you use them."),
          tr('Quá độ nhắc muộn hơn ở cảnh giới cao (Trúc Cơ 10 năm, Nguyên Anh 15, Luyện Hư 20, sau phi thăng 40). Tu luyện không còn bị tính quá độ.', "Overwork warnings come later at high realms (Foundation 10 years, Nascent Soul 15, Void Refinement 20, after Ascension 40). Cultivation no longer counts as overwork."),
        ],
      },
      {
        h: tr('Lôi đài', "Arena"),
        items: [
          tr('Trận đấu mới kiểu máu: mỗi lượt chọn một ấn ngũ hành, có nội lực và tuyệt kỹ theo con đường, đỡ tuyệt kỹ của đối thủ bằng nhịp.', "New HP-style matches: each turn pick a Five Elements seal, with inner force and Path-based ultimates, and parry your opponent's ultimate with timing."),
          tr('Rút đối thủ bằng 3 lá bài thay cho ống xăm. Lá bài ghi rõ cảnh giới thật của bóng và việc lên đài được kéo ngang cảnh giới với bóng của đạo hữu.', "Draw opponents with 3 cards instead of a fortune-stick tube. Cards show the shadow's true realm and that entering the arena scales it to your shadow's realm."),
          tr('Bớt may rủi: tuyệt kỹ tối đa 30% máu một đòn, chí mạng ít hơn. Chơi khéo vẫn thắng nhiều hơn chơi bừa.', "Less luck: ultimates deal at most 30% HP per hit, fewer crits. Skilled play still beats button mashing."),
          tr('Bục Long Ỷ có rồng vàng chầu hai bên, hiện đúng bóng người chơi đã cầm ra đài.', "The Dragon Throne podium now has golden dragons on both sides and shows exactly the shadow each player took into the arena."),
        ],
      },
      {
        h: tr('Theo góp ý của đạo hữu', "From fellow Daoists' feedback"),
        items: [
          tr('@thien: thêm tông môn và nội dung Ma giới, Phản môn khi đổi phe, lôi đài nói rõ việc kéo ngang cảnh giới, thọ nguyên dài hơn, quá độ nhắc muộn hơn, linh thạch khó kiếm hơn.', "@thien: more sects and Demon Realm content, Betrayal when switching sides, arena explains realm scaling, longer lifespans, later overwork warnings, harder-earned spirit stones."),
          tr('@thienkhue: túi đồ có tab và sắp xếp.', "@thienkhue: inventory tabs and sorting."),
          tr('@xiaoyu: báo lỗi thọ nguyên Bàn Đào hội bị tụt về.', "@xiaoyu: reported the Peach Banquet lifespan bonus reverting."),
        ],
      },
      {
        h: tr('Sửa lỗi và giao diện', "Fixes and UI"),
        items: [
          tr('Túi đồ có tab theo loại (Pháp y, Vũ khí, Phụ kiện, Đan dược) và sắp xếp theo mới nhận, phẩm, công, thủ. Đồ đang mặc luôn ở trên.', "The inventory has tabs by type (Robes, Weapons, Accessories, Pills) and sorts by newest, grade, attack, defense. Equipped items always stay on top."),
          tr('Sửa lỗi thọ nguyên thêm từ Bàn Đào hội, tiên đan, Diên Thọ Đan đấu giá bị tụt về sau một năm. Thọ thêm từ đan, đào, kỳ ngộ giờ được giữ, cộng ngoài trần thọ.', "Fixed bonus lifespan from the Peach Banquet, immortal pills and auctioned Longevity Pills reverting after a year. Lifespan from pills, peaches and fortuitous encounters now sticks, on top of the lifespan cap."),
          tr('Sửa lỗi Diên Thọ Đan. Lôi kiếp khó hơn và đổi giao diện pixel. Quái còn hình tự vẽ đã đổi hết sang hình LPC.', "Fixed Longevity Pills. Lightning tribulations are harder and got a pixel UI makeover. Monsters that still had hand-drawn art are all LPC sprites now."),
          tr('Lời kể giao đấu thắng, thua, hòa đa dạng hơn. Màn đầu thai bố cục 2 bước dễ hiểu hơn.', "More varied combat narration for wins, losses and draws. The rebirth screen is a clearer 2-step layout."),
        ],
      },
    ],
  },
  {
    v: '3.0.0',
    date: '26/10/2026',
    title: tr('Luân Hồi Đạo', "The Way of Reincarnation"),
    lead: tr('Vạn kiếp luân hồi không còn là con đường tắt. Kẻ chết càng nhiều, Thiên đạo càng để mắt; linh hồn đầu thai dồn dập thì mòn đi. Muốn đi xa, phải biết nghỉ, biết quên, và biết đứng trên lôi đài.', "Ten thousand rebirths are no longer a shortcut. The more you die, the more the Heavenly Dao watches; souls reborn too often wear thin. To go far, learn to rest, to forget, and to stand in the arena."),
    stats: [
      { n: '10', label: tr('bậc Kiếp Số', "Calamity Count tiers") },
      { n: '+3', label: tr('kết cục', "endings") },
      { n: '31', label: tr('luật lôi đài', "arena rules") },
    ],
    groups: [
      {
        h: tr('Kiếp Số: Thiên đạo để mắt', "Calamity Count: the Heavenly Dao is watching"),
        items: [
          tr('Tài khoản có Kiếp Số từ 0 tới 10, tăng theo thành tích: số kiếp đã sống, Thiên thư, phi thăng, chạm đỉnh, Chứng Đạo.', "Accounts have a Calamity Count from 0 to 10, rising with achievements: lives lived, Heavenly Tome, Ascensions, reaching the peak, Attaining the Dao."),
          tr('Mỗi bậc thêm một kiếp nạn: thiên kiếp nặng hơn, thần binh truyền kiếp yếu đi, bóng Ngũ Hành Đài và quái mạnh hơn, mỗi kiếp chỉ mua được một thiên phú lớn...', "Each tier adds a calamity: heavier tribulations, weaker inherited divine weapons, stronger Five Elements Platform shadows and monsters, only one major talent purchase per life..."),
          tr('Bù lại, mỗi bậc thêm 5% phúc duyên và 3% đồ rơi. Bảng xếp hạng ghi Kiếp Số cạnh cảnh giới.', "In return, each tier adds 5% Fortune and 3% loot. The Leaderboard shows Calamity Count next to realm."),
          tr('Kết cục mới: Nghịch Thiên Hành Đạo (phi thăng khi Kiếp Số từ 5), Vạn Kiếp Bất Diệt (Chứng Đạo ở Kiếp Số 10).', "New endings: Defying Heaven (ascend at Calamity Count 5+), Eternal Through Ten Thousand Lives (Attain the Dao at Calamity Count 10)."),
          tr('Kiếp tích: người Kiếp Số thấp mà ngã ở Độ Kiếp thì kiếp sau đột phá dễ hơn, tối đa 3 lần.', "Calamity Scars: low Calamity Count players who fall at Tribulation get easier breakthroughs next life, up to 3 times."),
        ],
      },
      {
        h: tr('Hồn lực và cầu Nại Hà', "Soul Power and Naihe Bridge"),
        items: [
          tr('Từ kiếp thứ 15, mỗi lần đầu thai tốn Hồn lực, hồi lại theo giờ thật. Đầu thai dồn dập thì sinh ra hồn mỏi, hồn khuyết, hồn tàn. Nghỉ đủ lâu thì được Hồn viên mãn.', "From your 15th life, each rebirth costs Soul Power, which regenerates in real time. Reincarnate too fast and you're born with a weary, flawed or shattered soul. Rest long enough for a Perfect Soul."),
          tr('Trước mỗi lần đầu thai, Mạnh Bà đưa chén canh. Uống thì quên thần binh và rương kiếp trước, được tĩnh tâm hạ Kiếp Số, khí vận và phúc duyên dồi dào. Hất chén thì giữ hết, nhưng nợ Địa phủ dồn lại.', "Before each rebirth, Meng Po hands you a bowl of soup. Drink it to forget your divine weapon and past-life chest, gain calm that lowers Calamity Count, and plenty of luck and Fortune. Toss the bowl to keep everything, but your debt to the Underworld piles up."),
          tr('Năm lần liền không uống, Câu hồn sứ giả tìm tới. Đánh lui được thì nhận Câu hồn lệnh, thua thì có thể mất mạng.', "Refuse five times in a row and the Soul-Hooking Envoy comes for you. Drive him off for a Soul-Hooking Envoy Token; lose and you may lose your life."),
          tr('Luân hồi nhiều không còn là lợi thế khi giao đấu: bên đã đầu thai nhiều hơn thì hồn phách mòn hơn, công và thủ giảm tới 15%.', "Reincarnating a lot is no longer an edge in duels: whoever has been reborn more has a more worn soul, with up to 15% less attack and defense."),
        ],
      },
      {
        h: tr('Lôi đài hằng ngày', "Daily Arena"),
        hot: true,
        items: [
          tr('Lôi đài có trang riêng, mở ngay ở trang đầu và menu trong game.', "The Arena has its own page, opened right from the home page and the in-game menu."),
          tr('Mỗi ngày chọn bóng xuất chiến: 1 trong 6 nhân vật mạnh nhất bạn từng chơi, giữ nguyên cả ngày.', "Each day pick a shadow to fight: 1 of the 6 strongest characters you've played, locked in for the day."),
          tr('Lắc ống xăm để rút đối thủ ngẫu nhiên. Màu que báo phẩm của bóng: Phàm, Linh, Huyền, Thiên. Quẻ chưa giải thì không rút lại được.', "Shake the fortune-stick tube to draw a random opponent. Stick colour shows the shadow's grade: Mortal, Spirit, Mystic, Heaven. Until the draw is resolved, no redraws."),
          tr('Bóng đối thủ được kéo về cùng cảnh giới với bóng của bạn. Thắng thua nằm ở bản mệnh, con đường và cách đoán thế.', "The opponent's shadow is scaled to your shadow's realm. Victory comes down to natal element, Path, and reading the stance."),
          tr('Mỗi trận ba hiệp, mỗi hiệp chọn Công, Thủ hay Hóa như Ngũ Hành Đài nhưng khó hơn: đối thủ để lộ ý đồ không phải lúc nào cũng thật, và biết đọc thế của bạn.', "Three rounds per match, each round pick Attack, Defend or Deflect like the Five Elements Platform, but harder: the opponent's tells aren't always honest, and they can read yours."),
          tr('Mỗi ngày 3 lượt. Thắng trận được 3 điểm, thua 0. Điểm tính lại mỗi thứ Hai; top 3 tuần đứng trên bục Long Ỷ với danh hiệu Bá Chủ, Á Chủ, Tam Kiệt.', "3 turns a day. Win a match for 3 points, lose for 0. Points reset every Monday; the weekly top 3 stand on the Dragon Throne podium as Overlord, Second Lord and Third Hero."),
          tr('Bị ai thắng bóng thì có một lượt báo thù không tính lượt, hạn 48 giờ.', "If someone beats your shadow, you get one free revenge match, valid for 48 hours."),
          tr('Thiên thư mảnh XV nay mở khi thắng 3 trận lôi đài.', "Heavenly Tome fragment XV now unlocks after winning 3 arena matches."),
        ],
      },
      {
        h: tr('Lịch 31 luật lôi đài', "Calendar of 31 arena rules"),
        hot: true,
        items: ARENA_RULES.map((r) => tr(`Ngày ${r.day} · ${r.name}: ${r.desc}`, `Day ${r.day} · ${r.name}: ${r.desc}`)),
      },
      {
        h: tr('Khác', "Other"),
        items: [tr('Lịch sử cập nhật gọn lại thành danh sách phiên bản, bấm vào một bản để xem chi tiết.', "Update history is now a compact version list; tap a version for details.")],
      },
    ],
  },
  {
    v: '2.0.0',
    date: '26/10/2026',
    title: tr('Vạn Mảnh', "Ten Thousand Shards"),
    lead: tr('Bạn tưởng tiếng chuông đã im. Nhưng nó lại vang lên, lần này không đếm bạn mà đếm những người khác. Vạn Kiếp Chân Nhân không chỉ vỡ làm một mảnh là bạn. Và có kẻ vẫn đang gõ chuông.', "You thought the bell had gone silent. But it rings again, and this time it counts not you but others. Wanjie Zhenren did not shatter into just one shard named you. And someone is still striking the bell."),
    stats: [
      { n: '+10', label: tr('mảnh Thiên thư', "Heavenly Tome fragments") },
      { n: '+12', label: tr('kết cục', "endings") },
      { n: '+1', label: tr('đại địch', "archenemy") },
    ],
    groups: [
      {
        h: tr('Thiên thư Quyển II', "Heavenly Tome Volume II"),
        items: [
          tr('Quyển II "Vạn Mảnh" mở sau khi đạt Vạn Kiếp Quy Nhất: 10 mảnh ký ức mới, từ XI tới XX.', "Volume II \"Ten Thousand Shards\" opens after reaching Ten Thousand Lives Become One: 10 new memory fragments, XI to XX."),
          tr('Những đạo hữu trên giang hồ cũng là mảnh vỡ. Có mảnh chỉ mở khi kết nghĩa, truyền công, viếng mộ hay giao chiến thư với người chơi khác.', "Fellow Daoists in the jianghu are shards too. Some fragments unlock only by swearing brotherhood, passing on cultivation, visiting graves, or trading challenges with other players."),
          tr('Có mảnh chỉ dành cho bậc cao thủ: từng lên đủ Tiên, Ma, Thái Hư, qua Ngũ Hành Đài mà không ngã lần nào, mở 30 kết cục.', "Some fragments are for true masters only: reached all of Immortal, Demon and Great Void, cleared the Five Elements Platform without a single fall, unlocked 30 endings."),
          tr('Kẻ Gõ Chuông chờ ở đỉnh cao nhất của các cõi. Phải đỡ đủ ba tiếng chuông, đỡ hụt có thể thân tử đạo tiêu.', "The Bell Ringer waits at the highest peak of all realms. You must withstand all three tolls; fail one and body and Dao may perish together."),
          tr('Thắng hắn, kiếp sau cầm dùi chuông và tự chọn: gõ tiếp hay đập vỡ. Hai kết cục mới, hai danh hiệu mới.', "Beat him, and next life you hold the bell mallet and choose: keep ringing or smash it. Two new endings, two new titles."),
          tr('Trang Sổ Sinh Tử chia Thiên thư thành hai quyển. Quyển II bị phong ấn tới khi bạn gặp lại chính mình.', "The Book of Life and Death splits the Heavenly Tome into two volumes. Volume II stays sealed until you meet yourself again."),
        ],
      },
      {
        h: tr('Mười kết cục ba cõi', "Ten endings across three realms"),
        items: [
          tr('Tiên giới: Hạ Phàm Vì Tình, Thủ Môn Thiên Giới, Hóa Chữ Thiên Thư, Thiên Đế Vạn Thế.', "Immortal Realm: Descending for Love, Gatekeeper of Heaven, Becoming the Tome's Words, Heavenly Emperor of All Ages."),
          tr('Ma giới: Hóa Thân Huyết Hải, Buông Đao Thành Phật, Chết Dưới Tay Tâm Phúc.', "Demon Realm: One with the Blood Sea, Drop the Blade, Become a Buddha, Slain by a Trusted Aide."),
          tr('Thái Hư giới: ba kết cục bí ẩn, không ghi cách mở. Tự đi tìm.', "Great Void Realm: three mysterious endings, unlock conditions unlisted. Find them yourself."),
          tr('Mỗi kết cục đi kèm một kỳ ngộ hiếm, phần lớn chỉ đến ở cảnh giới cao, và không phải kiếp nào cũng có duyên gặp.', "Each ending comes with a rare fortuitous encounter, mostly at high realms, and not every life is fated to meet it."),
          tr('Chết ở cảnh giới cuối theo một kết cục khác thì Sổ Sinh Tử vẫn ghi nhận Đại La Kim Tiên, Ma Đế hay Hỗn Nguyên Đạo Tổ.', "Die at the final realm through a different ending and the Book of Life and Death still records Daluo Golden Immortal, Demon Emperor or Hunyuan Daozu."),
        ],
      },
      {
        h: tr('Vạn Kiếp Quy Nhất', "Ten Thousand Lives Become One"),
        items: [
          tr('Mỗi tài khoản chỉ gặp lại chính mình một lần. Từ đó, đường đi tiếp nằm trong Quyển II.', "Each account meets itself only once. From then on, the road ahead lies in Volume II."),
          tr('Lần đầu Quy Nhất được 100 phúc duyên, một chiếc chuông vàng theo bên vai qua mọi kiếp, và danh hiệu 🔔 trên bảng xếp hạng. Ai đã đạt trước đây sẽ nhận ở lần luân hồi tới.', "Your first Becoming One grants 100 Fortune, a golden bell floating by your shoulder through every life, and a 🔔 title on the Leaderboard. Those who reached it before get theirs on their next reincarnation."),
        ],
      },
      {
        h: tr('Theo góp ý của đạo hữu', "From fellow Daoists' feedback"),
        items: [
          tr('@minimoni báo: mệnh thiên sát cô tinh mà tuổi thơ vẫn có cha mẹ, ông bà; nhận bao nhiêu đồ đệ cũng là "đồ đệ đầu tiên". Nay cô tinh, cô nhi và trẻ bị bỏ ở chùa lớn lên không còn cảnh cha mẹ, ông bà; đồ đệ được đếm thứ hai, thứ ba... Đa tạ đạo hữu!', "@minimoni reported: a Lone Star fate still had parents and grandparents in childhood, and every disciple taken was \"the first disciple\". Now Lone Stars, orphans and children abandoned at temples grow up without parent and grandparent scenes, and disciples are counted second, third... Many thanks, fellow Daoist!"),
        ],
      },
      {
        h: tr('Thiên đạo khắt khe hơn', "A stricter Heavenly Dao"),
        items: [
          tr('Đột phá khó hơn, càng lên cao càng khó. Thiên mệnh chi tử chỉ còn giúp đột phá dễ hơn 10%.', "Breakthroughs are harder, and harder still the higher you go. Child of Destiny now only makes breakthroughs 10% easier."),
          tr('Thiên linh căn và Tiên cốt trời sinh tu nhanh ít hơn trước. Tiên cốt giá 250 phúc, Thiên mệnh 180 phúc.', "Heavenly Spiritual Root and Innate Immortal Bones speed cultivation less than before. Immortal Bones cost 250 Fortune, Child of Destiny 180 Fortune."),
          tr('Phúc duyên mỗi kiếp ít đi khoảng một phần tư.', "Fortune per life is down by about a quarter."),
          tr('Sau phi thăng, mỗi cảnh giới mất ít nhất khoảng 50 năm. Thọ nguyên vẫn tối đa 350: chỉ ai phi thăng sớm mới kịp chạm đỉnh và thử Chứng Đạo.', "After Ascension, each realm takes at least about 50 years. Lifespan still caps at 350: only early ascenders can reach the peak and attempt to Attain the Dao."),
          tr('Tu tới Kim Đan, Hóa Thần vẫn như cũ, người mới không bị làm khó.', "Cultivating up to Golden Core and Spirit Transformation is unchanged - no extra pain for newcomers."),
        ],
      },
    ],
  },
  {
    v: '1.0.3',
    date: '26/10/2026',
    title: tr('Tam Giới Khai Môn', "The Three Realms Open"),
    lead: tr('Cửa trời đã mở. Phi thăng không còn là hồi kết: bên kia là Tiên giới, Ma giới và Thái Hư giới. Nhưng trước cửa trời, mỗi người phải đánh bại chính mình năm lần.', "The gates of heaven are open. Ascension is no longer the end: beyond lie the Immortal Realm, the Demon Realm and the Great Void Realm. But before the gate, everyone must defeat themselves five times."),
    stats: [
      { n: '+3', label: tr('giới mới', "new realms") },
      { n: '+12', label: tr('cảnh giới', "realms") },
      { n: '+20', label: tr('kết cục', "endings") },
      { n: '+55', label: tr('vật phẩm', "items") },
      { n: '+30', label: tr('quái vật', "monsters") },
      { n: '+19', label: tr('kỳ ngộ', "fortuitous encounters") },
    ],
    groups: [
      {
        h: tr('Tam giới sau phi thăng', "Three realms after Ascension"),
        items: [
          tr('Phi thăng xong vẫn sống tiếp trong cùng kiếp. Chính đạo lên Tiên giới, tà đạo vào Ma giới, người trung lập lạc vào Thái Hư giới.', "After Ascension you keep living the same life. The Righteous rise to the Immortal Realm, the Evil enter the Demon Realm, and the Neutral drift into the Great Void Realm."),
          tr('Mỗi giới 4 cảnh giới, có sự kiện, quái, bảo vật và cảnh nền riêng: Chân Tiên tới Đại La Kim Tiên, Ma Tướng tới Ma Đế, Hư Tiên tới Hỗn Nguyên Đạo Tổ. Kiếp cuối là Chứng Đạo, vượt được thì thoát khỏi mọi giới.', "Each realm has 4 cultivation realms plus its own events, monsters, treasures and backdrops: True Immortal to Daluo Golden Immortal, Demon General to Demon Emperor, Void Immortal to Hunyuan Daozu. The final trial is Attaining the Dao - pass it and escape every realm."),
          tr('Cảnh phi thăng: cột sáng giáng xuống, nhân vật bay lên cõi mới.', "Ascension scene: a pillar of light descends and your character flies up to the new realm."),
          tr('Hào quang riêng mỗi cõi, mạnh dần theo cảnh giới: tiên quang và mây ngũ sắc, huyết nguyệt và xích ma, vòng xoáy hư không và tinh tú.', "Each realm has its own aura that grows with your realm: immortal light and five-coloured clouds, blood moon and crimson demons, void vortex and stars."),
          tr('Quà phi thăng: mỗi cõi một bộ áo, vũ khí, phụ kiện, trao dần khi lên cảnh giới.', "Ascension gifts: each realm has a robe, weapon and accessory set, granted as you climb realms."),
        ],
      },
      {
        h: tr('Ngũ Hành Vấn Tâm Đài', "Five Elements Heart-Trial Platform"),
        items: [
          tr('Trước khi phi thăng phải hạ 5 bóng của chính mình, mỗi bóng một hệ. Bóng cuối khắc bản mệnh của bạn. Phi thăng từ 120 tuổi.', "Before Ascension you must defeat 5 shadows of yourself, one per element. The last overcomes your natal element. Ascension from age 120."),
          tr('Lật thế bằng Ngũ Hành Ấn (săn quái đúng hệ), lá bùa Công, Thủ, Hóa, Ngũ Hành Phù và tâm cảnh. 15 sân đấu theo giới và theo hệ của bóng.', "Turn the tide with Five Elements Seals (hunt monsters of the right element), Attack, Defend and Deflect talismans, Five Elements Charms and your state of mind. 15 arenas by realm and by the shadow's element."),
          tr('Qua đài nhận Gương vỡ Vấn Tâm; qua mà chưa ngã lần nào nhận Ngũ Hành Viên Mãn châu. Thua có thể thân tử đạo tiêu, hãy chuẩn bị từ Hóa Thần.', "Clear the platform for a Broken Heart-Questioning Mirror; clear it without falling once for a Five Elements Perfection Pearl. Losing can mean body and Dao perish, so prepare from Spirit Transformation."),
        ],
      },
      {
        h: tr('Sinh tử ba cõi', "Life and death in three realms"),
        items: [
          tr('Mỗi cõi có cách chết riêng: Thiên Nhân Ngũ Suy, Lôi Phạt, Trảm Tiên Đài, Ma Thể Mục Ruỗng, Tâm Ma Đoạt Xá, Bị Thôn Phệ, Hóa Thành Tinh Tú, Lạc Khe Nứt Thời Gian, Tử Trận Tiên Ma.', "Each realm has its own deaths: Five Decays of the Heavenly Being, Thunder Punishment, Immortal-Slaying Platform, Rotting Demon Body, Heart Demon Possession, Devoured, Turned to Stars, Lost in a Time Rift, Fallen in the Immortal-Demon War."),
          tr('20 năm cuối đời ở ba cõi hiện dần 5 dấu hiệu suy tàn. Tiên nhân để đạo tâm tụt dưới -20 có ngày lên Trảm Tiên Đài.', "In the last 20 years of life in the three realms, 5 signs of decline appear one by one. Immortals who let their Dao Heart drop below -20 will one day face the Immortal-Slaying Platform."),
          tr('Bia mộ riêng: Tiên Trủng, Ma Trủng, Hư Trủng.', "Unique tombs: Immortal Tomb, Demon Tomb, Void Tomb."),
          tr('Ở Độ Kiếp mà không kịp phi thăng: tự chọn tọa hóa chuyển thế (kiếp sau mang theo linh thức) hoặc truyền công cho một đạo hữu trên giang hồ.', "At Tribulation without time to ascend: choose to pass away and reincarnate (carrying your spiritual sense into the next life) or pass on your cultivation to a fellow Daoist in the jianghu."),
        ],
      },
      {
        h: tr('Tông môn ba phe', "Sects of three factions"),
        items: [
          tr('Thanh Vân Tông xếp bậc theo linh căn, Huyết Sát Môn theo độ tàn nhẫn, Thiên Cơ Các theo ngộ tính.', "Qingyun Sect ranks by spiritual root, Xuesha Sect by ruthlessness, Tianji Pavilion by insight."),
          tr('Bốn bậc đệ tử, Đại bỉ tông môn, đồng môn tỷ thí cùng cấp, quái thí luyện riêng, áo bào và lệnh bài theo bậc.', "Four disciple ranks, sect Grand Contests, same-rank sparring, special trial monsters, robes and tokens by rank."),
        ],
      },
      {
        h: tr('Thiên thư', "Heavenly Tome"),
        items: [tr('Mạch truyện chính 10 mảnh ký ức: vì sao bạn cứ phải luân hồi mãi? Gom đủ để gặp lại chính mình thuở ban đầu.', "A 10-fragment main storyline of memories: why must you keep reincarnating forever? Collect them all to meet the self you were at the very beginning.")],
      },
      {
        h: tr('Theo góp ý của đạo hữu', "From fellow Daoists' feedback"),
        items: [
          tr('@minimoni xin thêm cốt truyện, thêm cảnh giới sau phi thăng, và bái sư theo căn cốt: căn cốt tốt làm nội môn, căn cốt thường làm ngoại môn. Cả ba đều đã có trong bản này. Đa tạ đạo hữu!', "@minimoni asked for more story, realms after Ascension, and apprenticeship by aptitude: good aptitude for inner sect, ordinary for outer sect. All three are in this version. Many thanks, fellow Daoist!"),
        ],
      },
      {
        h: tr('Cân bằng', "Balance"),
        items: [
          tr('Quái và người đều mang ngũ hành, khắc chế khi giao đấu.', "Monsters and people all carry an element, and elements counter each other in combat."),
          tr('Rơi đồ giảm khoảng 25% (quái, người chơi, bóng kiếp trước). Đánh quái quá yếu gần như không rơi đồ; đồ rơi theo cấp của quái.', "Loot down about 25% (monsters, players, past-life shadows). Monsters far too weak barely drop anything; loot scales with monster level."),
          tr('Thọ nguyên tối đa: 200 khi chưa phi thăng, 350 khi đã lên ba cõi. Sau phi thăng, mỗi cảnh giới mất ít nhất khoảng 50 năm, chỉ ai phi thăng sớm mới kịp chạm tới đỉnh.', "Max lifespan: 200 before Ascension, 350 in the three realms. After Ascension each realm takes at least about 50 years, so only early ascenders reach the peak."),
        ],
      },
    ],
  },
  {
    v: '1.0.2',
    date: '25/10/2026',
    title: tr('Giang Hồ Ân Oán', "Grudges and Debts of the Jianghu"),
    lead: tr('Giang hồ không chỉ có một mình bạn. Ân phải trả, oán phải báo, và mỗi kiếp đều để lại một câu chuyện.', "You're not alone in the jianghu. Kindness must be repaid, grudges avenged, and every life leaves a story behind."),
    groups: [
      {
        h: tr('Tính năng', "Features"),
        items: [
          tr('Giang hồ: ân oán, kết nghĩa, truy nã, chiến thư, truy sát, lời viếng.', "Jianghu: kindness and grudges, sworn brotherhood, bounties, challenges, assassinations, condolences."),
          tr('Nghĩa trang: hồi ký một kiếp kể lại 7-10 cột mốc như truyện tranh pixel.', "Cemetery: a life memoir retelling 7-10 milestones like a pixel comic."),
          tr('Bảo khố đồ ẩn, báo khi mở khóa, lời đồn trên Thiên tượng, danh hiệu sưu tầm, cách mở chi tiết cho các kết cục.', "Hidden item vault, unlock alerts, rumours in the Celestial Signs, collector titles, detailed unlock guides for endings."),
        ],
      },
      { h: tr('Cân bằng', "Balance"), items: [tr('Tà đạo: nghiệp lực thành tiền tệ mua thiên phú tà, Huyết Sát Đan, huyết tế; Ma Tôn Độ Kiếp ngang phi thăng.', "Evil Path: Karma becomes currency for evil talents, Blood Fiend Pills, blood sacrifices; a Demon Sovereign's Tribulation counts as Ascension.")] },
    ],
  },
  {
    v: '1.0.1',
    date: '25/10/2026',
    title: tr('Vạn Tượng Canh Tân', "All Things Renewed"),
    lead: tr('Thế giới khoác áo mới: nhân vật, quái, cảnh vật đều vẽ lại theo phong cách pixel LPC.', "The world gets a new coat: characters, monsters and scenery all redrawn in LPC pixel style."),
    groups: [
      {
        h: tr('Tính năng', "Features"),
        items: [
          tr('Nhân vật, quái, nền 4 mùa vẽ lại bằng LPC; dáng vẻ, kiểu tóc, phụ kiện đa dạng; thú cưng; cánh từ Hóa Thần.', "Characters, monsters and four-season backgrounds redrawn in LPC; varied looks, hairstyles, accessories; pets; wings from Spirit Transformation."),
          tr('300 trang bị mới chia theo phái, quái chặn đường, tuổi thơ mỗi người một khác.', "300 new pieces of gear by faction, roadblock monsters, and a different childhood for everyone."),
          tr('Thiên tượng hôm nay, chuỗi ngày, nhiệm vụ ngày, thư giang hồ, danh hiệu tuần, 16 thành tựu dài hạn.', "Today's Celestial Signs, streaks, daily quests, jianghu letters, weekly titles, 16 long-term achievements."),
        ],
      },
      { h: tr('Cân bằng', "Balance"), items: [tr('Giảm độ khó khoảng 20%, kiếp đầu được trời thương, cảnh báo sức khỏe nguy kịch.', "Difficulty down about 20%, heaven pities your first life, critical Health warnings.")] },
    ],
  },
  {
    v: '1.0.0',
    date: '25/10/2026',
    title: tr('Khai Thiên', "Genesis"),
    lead: tr('Vạn Kiếp Luân Hồi ra đời: một kiếp người, vạn con đường tu tiên.', "Ten Thousand Rebirths is born: one human life, ten thousand paths to immortality."),
    groups: [
      {
        h: tr('Tính năng', "Features"),
        items: [
          tr('Đầu thai ngẫu nhiên, 8 cảnh giới từ Phàm Nhân tới Độ Kiếp, 6 con đường tu tập, đạo tâm chính tà.', "Random rebirths, 8 realms from Mortal to Tribulation, 6 cultivation Paths, Righteous and Evil Dao Hearts."),
          tr('Trừ yêu kiểu idle, boss, bế quan, thiên kiếp, Sổ Sinh Tử, bảng xếp hạng, nhân quả xuyên kiếp, góp ý tính năng.', "Idle demon hunting, bosses, seclusion, heavenly tribulations, the Book of Life and Death, Leaderboard, karma across lives, feature requests."),
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
