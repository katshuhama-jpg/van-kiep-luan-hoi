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
}

export const RELEASES: Release[] = [
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
          tr('Ai mở một kết cục đầu tiên trong giang hồ, cả server nhận thư Thiên Đạo. Sổ Sinh Tử ghi số người đã mở và người đầu tiên.', "Whoever unlocks an ending first in the jianghu, the whole server gets a letter from the Heavenly Yao. The Book of Life and Death records how many have unlocked it and who was first."),
        ],
      },
    ],
  },
  {
    v: '3.1.1',
    date: '27/10/2026',
    title: tr('Hoàn Hồn Đan', "Soul Return Pill"),
    lead: tr('Đạo hữu nghiện quá mà hồn không theo kịp? Tiệm đan dưới chân cầu Nại Hà đã mở. Cùng lúc, Thiên Đạo cân lại đường tu: thọ dài hơn thì tu cũng phải chậm lại một chút.', "Fellow Daoist, too hooked for your soul to keep up? A pill shop has opened at the foot of Naihe Bridge. Meanwhile, the Heavenly Yao rebalances cultivation: a longer lifespan means a slightly slower climb."),
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
          tr('Phổ Đà Sơn (chính): mời Phật tu và người đạo tâm từ 40. Tâm ma tăng chậm, nhưng diệt yêu quá tay sẽ bị Giới luật viện gọi lên.', "Putuo Shan (Righteous): welcomes Buddhist Cultivators and anyone with Yao Heart 40+. Heart demons grow slowly, but slay demons too zealously and the Discipline Hall will summon you."),
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
          tr('Thái Hư giới: Kẻ giữ đồng hồ cát (đổi thọ lấy đạo hay đạo lấy thọ), Bóng kiếp trước (gặp lại chính mình kiếp trước), Hư không rách (vá trời hay hút linh khí, bảy năm sau trả giá).', "Great Void Realm: The Hourglass Keeper (trade lifespan for Yao or Yao for lifespan), Shadow of a Past Life (meet yourself from a past life), The Torn Void (mend the sky or drink its spirit qi, and pay the price seven years later)."),
          tr('Nhiều chuyện kéo dài qua nhiều bước, lựa chọn bước trước quyết định bước sau. Vài chuyện lặp lại để người sống lâu ở cõi trên luôn có việc để làm.', "Many stories span several steps, and your choice in one step decides the next. Some repeat, so those who live long in the upper realms always have something to do."),
        ],
      },
      {
        h: tr('Phản môn', "Betrayal"),
        items: [
          tr('Đạo và tông môn ngược phe (đang ở chính phái mà theo Ma tu hoặc đạo tâm từ -40, đang ở ma môn mà theo Phật tu hoặc đạo tâm từ 40) sẽ gặp sự kiện Phản môn: tự xin rời, giấu thân phận, hoặc phản sư diệt tổ.', "When your Yao and your sect are on opposite sides (in a righteous sect but following the Demonic Path or Yao Heart -40 or below, in a demonic sect but a Buddhist Cultivator or Yao Heart 40+), you'll face a Betrayal event: ask to leave, hide your identity, or betray your master and destroy your sect."),
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
    lead: tr('Vạn kiếp luân hồi không còn là con đường tắt. Kẻ chết càng nhiều, Thiên đạo càng để mắt; linh hồn đầu thai dồn dập thì mòn đi. Muốn đi xa, phải biết nghỉ, biết quên, và biết đứng trên lôi đài.', "Ten thousand rebirths are no longer a shortcut. The more you die, the more the Heavenly Yao watches; souls reborn too often wear thin. To go far, learn to rest, to forget, and to stand in the arena."),
    stats: [
      { n: '10', label: tr('bậc Kiếp Số', "Calamity Count tiers") },
      { n: '+3', label: tr('kết cục', "endings") },
      { n: '31', label: tr('luật lôi đài', "arena rules") },
    ],
    groups: [
      {
        h: tr('Kiếp Số: Thiên đạo để mắt', "Calamity Count: the Heavenly Yao is watching"),
        items: [
          tr('Tài khoản có Kiếp Số từ 0 tới 10, tăng theo thành tích: số kiếp đã sống, Thiên thư, phi thăng, chạm đỉnh, Chứng Đạo.', "Accounts have a Calamity Count from 0 to 10, rising with achievements: lives lived, Heavenly Tome, Ascensions, reaching the peak, Attaining the Yao."),
          tr('Mỗi bậc thêm một kiếp nạn: thiên kiếp nặng hơn, thần binh truyền kiếp yếu đi, bóng Ngũ Hành Đài và quái mạnh hơn, mỗi kiếp chỉ mua được một thiên phú lớn...', "Each tier adds a calamity: heavier tribulations, weaker inherited divine weapons, stronger Five Elements Platform shadows and monsters, only one major talent purchase per life..."),
          tr('Bù lại, mỗi bậc thêm 5% phúc duyên và 3% đồ rơi. Bảng xếp hạng ghi Kiếp Số cạnh cảnh giới.', "In return, each tier adds 5% Fortune and 3% loot. The Leaderboard shows Calamity Count next to realm."),
          tr('Kết cục mới: Nghịch Thiên Hành Đạo (phi thăng khi Kiếp Số từ 5), Vạn Kiếp Bất Diệt (Chứng Đạo ở Kiếp Số 10).', "New endings: Defying Heaven (ascend at Calamity Count 5+), Eternal Through Ten Thousand Lives (Attain the Yao at Calamity Count 10)."),
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
          tr('Kẻ Gõ Chuông chờ ở đỉnh cao nhất của các cõi. Phải đỡ đủ ba tiếng chuông, đỡ hụt có thể thân tử đạo tiêu.', "The Bell Ringer waits at the highest peak of all realms. You must withstand all three tolls; fail one and body and Yao may perish together."),
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
        h: tr('Thiên đạo khắt khe hơn', "A stricter Heavenly Yao"),
        items: [
          tr('Đột phá khó hơn, càng lên cao càng khó. Thiên mệnh chi tử chỉ còn giúp đột phá dễ hơn 10%.', "Breakthroughs are harder, and harder still the higher you go. Child of Destiny now only makes breakthroughs 10% easier."),
          tr('Thiên linh căn và Tiên cốt trời sinh tu nhanh ít hơn trước. Tiên cốt giá 250 phúc, Thiên mệnh 180 phúc.', "Heavenly Spiritual Root and Innate Immortal Bones speed cultivation less than before. Immortal Bones cost 250 Fortune, Child of Destiny 180 Fortune."),
          tr('Phúc duyên mỗi kiếp ít đi khoảng một phần tư.', "Fortune per life is down by about a quarter."),
          tr('Sau phi thăng, mỗi cảnh giới mất ít nhất khoảng 50 năm. Thọ nguyên vẫn tối đa 350: chỉ ai phi thăng sớm mới kịp chạm đỉnh và thử Chứng Đạo.', "After Ascension, each realm takes at least about 50 years. Lifespan still caps at 350: only early ascenders can reach the peak and attempt to Attain the Yao."),
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
          tr('Mỗi giới 4 cảnh giới, có sự kiện, quái, bảo vật và cảnh nền riêng: Chân Tiên tới Đại La Kim Tiên, Ma Tướng tới Ma Đế, Hư Tiên tới Hỗn Nguyên Đạo Tổ. Kiếp cuối là Chứng Đạo, vượt được thì thoát khỏi mọi giới.', "Each realm has 4 cultivation realms plus its own events, monsters, treasures and backdrops: True Immortal to Daluo Golden Immortal, Demon General to Demon Emperor, Void Immortal to Hunyuan Daozu. The final trial is Attaining the Yao - pass it and escape every realm."),
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
          tr('Qua đài nhận Gương vỡ Vấn Tâm; qua mà chưa ngã lần nào nhận Ngũ Hành Viên Mãn châu. Thua có thể thân tử đạo tiêu, hãy chuẩn bị từ Hóa Thần.', "Clear the platform for a Broken Heart-Questioning Mirror; clear it without falling once for a Five Elements Perfection Pearl. Losing can mean body and Yao perish, so prepare from Spirit Transformation."),
        ],
      },
      {
        h: tr('Sinh tử ba cõi', "Life and death in three realms"),
        items: [
          tr('Mỗi cõi có cách chết riêng: Thiên Nhân Ngũ Suy, Lôi Phạt, Trảm Tiên Đài, Ma Thể Mục Ruỗng, Tâm Ma Đoạt Xá, Bị Thôn Phệ, Hóa Thành Tinh Tú, Lạc Khe Nứt Thời Gian, Tử Trận Tiên Ma.', "Each realm has its own deaths: Five Decays of the Heavenly Being, Thunder Punishment, Immortal-Slaying Platform, Rotting Demon Body, Heart Demon Possession, Devoured, Turned to Stars, Lost in a Time Rift, Fallen in the Immortal-Demon War."),
          tr('20 năm cuối đời ở ba cõi hiện dần 5 dấu hiệu suy tàn. Tiên nhân để đạo tâm tụt dưới -20 có ngày lên Trảm Tiên Đài.', "In the last 20 years of life in the three realms, 5 signs of decline appear one by one. Immortals who let their Yao Heart drop below -20 will one day face the Immortal-Slaying Platform."),
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
    lead: tr('Vạn Kiếp Luân Hồi ra đời: một kiếp người, vạn con đường tu tiên.', "Vạn Kiếp Luân Hồi is born: one human life, ten thousand paths to immortality."),
    groups: [
      {
        h: tr('Tính năng', "Features"),
        items: [
          tr('Đầu thai ngẫu nhiên, 8 cảnh giới từ Phàm Nhân tới Độ Kiếp, 6 con đường tu tập, đạo tâm chính tà.', "Random rebirths, 8 realms from Mortal to Tribulation, 6 cultivation Paths, Righteous and Evil Yao Hearts."),
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
