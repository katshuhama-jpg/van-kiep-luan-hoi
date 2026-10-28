import { FAMILY_RE, addCult, dao, giveItem, hurt, isOrphan, money, sample, stat } from './helpers';
import type { Character, Choice, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * Tuổi thơ mỗi người một khác: kỷ niệm vụn vặt rút ngẫu nhiên theo tuổi, gia cảnh, vùng đất, xuất thân.
 * Không lặp lại trong cùng một kiếp. Thay cho mấy dòng cố định trước đây (ai cũng "sốt cao năm 3 tuổi").
 */

interface Line {
  a: [number, number]; // khoảng tuổi
  t: string;
  ok?: (c: Character) => boolean;
  fx?: (c: Character) => void;
}

const poor = (c: Character) => (c.familyTier ?? 1) <= 1;
const rich = (c: Character) => (c.familyTier ?? 1) >= 3;
const reg =
  (...ids: string[]) =>
  (c: Character) =>
    ids.includes(c.region ?? '');
const ori =
  (...ids: string[]) =>
  (c: Character) =>
    ids.includes(c.originId);
const boy = (c: Character) => c.gender === 'nam';
const girl = (c: Character) => c.gender !== 'nam';

export const CHILD_LINES: Line[] = [
  // 1-2 tuổi
  { a: [1, 2], t: tr('Bạn biết đi rồi, chập chững khắp sân, ngã cái nào cũng tự đứng dậy.', "You learn to walk, toddling all over the yard and picking yourself up after every tumble.") },
  { a: [1, 2], t: tr('Bạn bập bẹ gọi được tiếng "mẹ". Cha giận dỗi cả tuần vì không được gọi trước.', "You babble out your first \"mama\". Your father sulks for a week because he didn't get called first.") },
  { a: [1, 2], t: tr('Bạn bò ra cửa đuổi theo con mèo mướp, bị nó cào một vết, khóc ré lên rồi lại đuổi tiếp.', "You crawl to the door chasing the tabby cat, get clawed, wail - then go right back to chasing it.") },
  { a: [1, 2], t: tr('Đêm nào bạn cũng phải nghe bà ru "ầu ơ" mới chịu ngủ.', "Every night you refuse to sleep until Grandma sings you her \"à ơi\" lullaby.") },
  { a: [1, 2], t: tr('Bạn mọc chiếc răng đầu tiên, cắn ngón tay cha đến bật máu.', "Your first tooth comes in, and you bite your father's finger until it bleeds.") },
  { a: [1, 2], t: tr('Nhà nghèo không có sữa, mẹ bế bạn đi xin bú khắp xóm.', "The family is too poor for milk, so your mother carries you door to door begging neighbours to nurse you."), ok: poor },
  { a: [1, 2], t: tr('Ba bà vú thay nhau bế, bạn chưa từng chạm chân xuống đất.', "Three wet nurses take turns carrying you. Your feet have never touched the ground."), ok: rich },
  { a: [1, 2], t: tr('Bạn ngủ trong chiếc nôi kết bằng lông lạc đà, ngoài kia gió cát rít cả đêm.', "You sleep in a cradle woven from camel hair while the sandstorm howls outside all night."), ok: reg('bac_mac', 'tay_vuc') },
  { a: [1, 2], t: tr('Mẹ địu bạn sau lưng ra bãi biển vá lưới, sóng vỗ thành tiếng hát ru.', "Your mother carries you on her back to the beach to mend nets, and the waves become your lullaby."), ok: reg('dong_hai') },
  { a: [1, 2], t: tr('Sư thầy đặt bạn nằm cạnh tượng Phật, tiếng mõ là thứ đầu tiên bạn nhớ được.', "The monk lays you beside the Buddha statue. The wooden fish drum is the first sound you remember."), ok: ori('chua') },
  { a: [1, 2], t: tr('Lão ăn mày quấn bạn trong tấm chăn rách, nhường hết bát cháo loãng cho bạn.', "The old beggar wraps you in a ragged blanket and gives you his whole bowl of thin gruel."), ok: ori('co_nhi') },
  { a: [1, 2], t: tr('Bạn vẫn còn đuôi cáo, cứ ngủ là cuộn tròn ôm lấy nó.', "You still have a fox tail, and you curl up hugging it every time you sleep."), ok: (c) => c.race === 'yeu' },
  // 3-5 tuổi
  { a: [3, 5], t: tr('Bạn tự trèo lên được cây ổi sau nhà, ăn no rồi không biết đường xuống.', "You climb the guava tree behind the house all by yourself, eat your fill, then can't figure out how to get down.") },
  { a: [3, 5], t: tr('Bạn nuôi một con dế mèn trong hộp diêm, đặt tên nó là "Đại tướng quân".', "You keep a cricket in a matchbox and name it \"Grand General\".") },
  { a: [3, 5], t: tr('Bạn lấy trộm nồi cơm cháy, ăn hết rồi đổ tội cho con chó vàng.', "You steal the pot of crispy rice, eat it all, and blame the yellow dog.") },
  { a: [3, 5], t: tr('Bạn nặn tò he hình con rồng, ai xem cũng bảo giống con giun.', "You sculpt a dough dragon. Everyone who sees it says it looks like a worm.") },
  { a: [3, 5], t: tr('Bạn khóc cả buổi chiều vì con gà mái nhà mình bị đem đi làm cỗ.', "You cry all afternoon because the family hen got taken away for a feast.") },
  { a: [3, 5], t: tr('Bạn theo đám rước đèn trung thu, về nhà mặt mũi lem nhem toàn mực.', "You follow the Mid-Autumn lantern parade and come home with your face smeared in ink.") },
  { a: [3, 5], t: tr('Bạn bị ong đốt sưng vù một bên má, trông như cái bánh bao.', "A bee stings you and one cheek swells up like a steamed bun."), fx: (c) => stat(c, 'sucKhoe', -2) },
  { a: [3, 5], t: tr('Bạn nghịch lửa đốt cháy góc bếp. Cha vụt cho mấy roi, nhớ đời.', "You play with fire and burn a corner of the kitchen. Father gives you a few lashes you'll never forget.") },
  { a: [3, 5], t: tr('Có thầy tướng số đi qua, xoa đầu bạn: "Đứa trẻ này có cốt tiên." Mẹ cho thầy hai quả trứng.', "A wandering fortune-teller pats your head: \"This child has immortal bones.\" Mother pays him two eggs."), fx: (c) => stat(c, 'khiVan', 1) },
  { a: [3, 5], t: tr('Bạn học được câu chửi đầu tiên từ bác hàng thịt. Mẹ súc miệng cho bạn bằng nước muối.', "You learn your first curse word from the butcher. Mother rinses your mouth with salt water.") },
  { a: [3, 5], t: tr('Bạn bị cảm, mẹ nấu nồi lá xông, trùm chăn kín mít. Sáng ra khỏe re.', "You catch a cold, so Mother boils a pot of herbs and wraps you under a blanket to steam. By morning you're right as rain.") },
  { a: [3, 5], t: tr('Đêm giao thừa bạn thức đến khuya đợi pháo, rồi ngủ gục trên đùi ông.', "On New Year's Eve you stay up late waiting for the firecrackers, then fall asleep on Grandpa's lap.") },
  { a: [3, 5], t: tr('Nhà hết gạo, bạn theo mẹ đi mót lúa trên cánh đồng đã gặt.', "The rice jar is empty, so you follow Mother to glean leftover grain from the harvested fields."), ok: poor },
  { a: [3, 5], t: tr('Bạn khóc đòi mua con ngựa gỗ sơn son, cha cõng bạn đi khắp chợ tìm cho bằng được.', "You cry for a red-lacquered wooden horse, and Father carries you all over the market until he finds one."), ok: (c) => !poor(c) },
  { a: [3, 5], t: tr('Ông quản gia dạy bạn đếm linh thạch. Bạn đếm đến một trăm thì ngủ gật.', "The old steward teaches you to count spirit stones. You doze off at one hundred."), ok: rich, fx: (c) => money(c, 5) },
  { a: [3, 5], t: tr('Bạn thấy rắn hai đầu trong bụi tre. Không ai tin, chỉ có bà nội lặng lẽ thắp nhang.', "You see a two-headed snake in the bamboo. Nobody believes you - only Grandma quietly lights incense."), ok: reg('nam_cuong') },
  { a: [3, 5], t: tr('Bạn đắp người tuyết cao hơn cả mình, sáng hôm sau nó đã đi mất. Chỉ còn dấu chân.', "You build a snowman taller than yourself. The next morning it has walked away, leaving only footprints."), ok: reg('tuyet_vuc', 'bac_mac') },
  { a: [3, 5], t: tr('Bạn nhặt được vỏ ốc to bằng nắm tay, áp vào tai nghe thấy tiếng ai đó gọi tên mình.', "You find a conch shell as big as your fist. Holding it to your ear, you hear someone calling your name."), ok: reg('dong_hai') },
  { a: [3, 5], t: tr('Trên trời có tiên nhân ngự kiếm bay qua. Bạn chạy theo đến khi ngã sấp mặt.', "An immortal flies across the sky on a sword. You chase after it until you fall flat on your face."), ok: reg('trung_chau', 'thanh_chau') },
  { a: [3, 5], t: tr('Đêm nào cũng có tiếng ai khóc ngoài rừng chết. Mẹ dặn không được mở cửa.', "Every night someone weeps in the dead forest. Mother warns you never to open the door."), ok: reg('ma_vuc') },
  { a: [3, 5], t: tr('Bạn bắt chước các sư huynh gõ mõ, gõ vỡ luôn cái mõ của sư thầy.', "You copy your senior brothers beating the wooden fish - and break the monk's wooden fish."), ok: ori('chua') },
  { a: [3, 5], t: tr('Lão ăn mày dạy bạn cách đứng xin ăn sao cho người ta thương. Bạn học rất nhanh.', "The old beggar teaches you how to stand when begging so people take pity. You learn very fast."), ok: ori('co_nhi') },
  { a: [3, 5], t: tr('Bạn bị đám con dòng chính đẩy xuống hồ sen. Không ai bênh bạn cả.', "The main-line children push you into the lotus pond. No one takes your side."), ok: ori('the_gia'), fx: (c) => stat(c, 'tamMa', 2) },
  { a: [3, 5], t: tr('Bạn lẻn ra phố xem gánh xiếc khỉ, mải xem quá nên lạc mất mẹ.', "You sneak into town to watch the monkey circus, get so absorbed that you lose your mother."), ok: ori('tieu_thuong') },
  { a: [3, 5], t: tr('Bạn lỡ hóa thành cáo giữa lúc đang ăn cơm. Mẹ bình thản gắp thêm cho miếng thịt.', "You accidentally turn into a fox in the middle of dinner. Mother calmly puts another piece of meat in your bowl."), ok: (c) => c.race === 'yeu' },
  { a: [3, 5], t: tr('Bạn đòi để tóc dài như tiên nữ trong tranh, mẹ phải tết cho bạn mỗi sáng.', "You insist on growing long hair like the fairy in the painting, so Mother has to braid it every morning."), ok: girl },
  { a: [3, 5], t: tr('Bạn cởi truồng chạy khắp làng, bị lũ con gái cười cho đỏ mặt.', "You run naked through the village, and the girls laugh until your face burns red."), ok: boy },
  // 6-12 tuổi
  { a: [6, 12], t: tr('Bạn thả diều trên đê, dây đứt, diều bay mất về phía núi. Bạn đứng nhìn rất lâu.', "You fly a kite on the dyke. The string snaps and it sails off toward the mountains. You watch for a long time.") },
  { a: [6, 12], t: tr('Bạn chơi đá cầu giỏi nhất xóm, lũ trẻ gọi là "chân thần".', "You're the best shuttlecock kicker in the neighbourhood. The kids call you \"Divine Foot\"."), fx: (c) => stat(c, 'sucKhoe', 2) },
  { a: [6, 12], t: tr('Bạn chọi dế thắng liền chín trận, ôm hộp dế ngủ như ôm báu vật.', "Your fighting cricket wins nine bouts in a row. You sleep hugging its box like a treasure.") },
  { a: [6, 12], t: tr('Bạn trèo hái trộm xoài nhà ông Tư, bị ông đứng dưới gốc đợi sẵn.', "You climb Old Si's tree to steal mangoes, and find him waiting at the bottom.") },
  { a: [6, 12], t: tr('Bạn chép phạt một trăm lần chữ "Nhẫn". Chép xong thì quên mất vì sao bị phạt.', "As punishment you write the character \"Patience\" a hundred times. By the end you've forgotten what you did wrong."), fx: (c) => stat(c, 'tamCanh', 1) },
  { a: [6, 12], t: tr('Bạn thổi sáo trên lưng trâu, thổi mãi cũng ra được một khúc.', "You play the flute on the buffalo's back. After endless tries, an actual tune comes out.") },
  { a: [6, 12], t: tr('Hội làng có múa lân, bạn đứng xem từ sáng đến tối, về mơ mình là con lân.', "The village festival has a lion dance. You watch from dawn to dusk and dream that night you are the lion.") },
  { a: [6, 12], t: tr('Bạn đánh nhau với thằng con nhà hàng xóm, cả hai bị phạt quỳ, rồi thành bạn thân.', "You fight the neighbour's boy. Both of you are made to kneel as punishment, and you become best friends.") },
  { a: [6, 12], t: tr('Có em bé mới chào đời. Bạn bế em, lần đầu thấy mình là người lớn.', "A new baby is born. Holding them, you feel grown-up for the first time."), fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: tr('Cha mẹ cãi nhau to. Bạn trốn ra bờ ao ngồi đến khuya.', "Your parents have a huge fight. You hide by the pond until late at night."), fx: (c) => stat(c, 'tamMa', 2) },
  { a: [6, 12], t: tr('Bạn đi câu cả buổi chỉ được con cá bống bằng ngón tay, vẫn hãnh diện mang về.', "You fish all morning and catch one goby the size of your finger, and still bring it home proudly.") },
  { a: [6, 12], t: tr('Bạn tập ngồi thiền theo tranh vẽ, ngồi được nửa nén nhang thì tê chân ngã lăn.', "You try to meditate like the picture shows. Half a stick of incense later your legs go numb and you topple over."), fx: (c) => addCult(c, 2) },
  { a: [6, 12], t: tr('Bạn nhặt được một đồng tiền cổ có khắc chữ lạ, giấu kỹ dưới gối.', "You find an ancient coin carved with strange characters and hide it under your pillow.") },
  { a: [6, 12], t: tr('Mất mùa, cả nhà ăn cháo khoai suốt mùa đông. Bạn nhường phần cho em.', "The harvest fails and the family eats sweet-potato gruel all winter. You give your share to your little sibling."), ok: poor, fx: (c) => dao(c, 3) },
  { a: [6, 12], t: tr('Thầy dạy đàn từ kinh thành về nhà dạy bạn gảy đàn cầm. Ngón tay phồng rộp.', "A music teacher from the capital comes to teach you the zither. Your fingertips blister."), ok: rich, fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: tr('Bạn theo đoàn lạc đà đi một đoạn, học được mấy câu tiếng Hồ.', "You travel a stretch with a camel caravan and pick up a few phrases of the western tongue."), ok: reg('tay_vuc', 'bac_mac') },
  { a: [6, 12], t: tr('Bạn lặn mò ngọc trai cùng lũ trẻ chài, lần nào cũng nín thở lâu nhất.', "You dive for pearls with the fisher kids and always hold your breath the longest."), ok: reg('dong_hai'), fx: (c) => stat(c, 'sucKhoe', 2) },
  { a: [6, 12], t: tr('Bạn theo bà đi hái thuốc trên núi, nhớ được tên ba mươi loại cỏ.', "You follow Grandma to gather herbs on the mountain and learn the names of thirty plants."), ok: reg('nam_cuong', 'thanh_chau'), fx: (c) => stat(c, 'ngoTinh', 1) },
  { a: [6, 12], t: tr('Bạn bị cảm lạnh vì trốn học đi trượt băng trên hồ, nằm bẹp mấy hôm.', "You skip school to skate on the frozen lake, catch a chill, and spend days flat in bed."), ok: reg('tuyet_vuc'), fx: (c) => stat(c, 'sucKhoe', -2) },
  { a: [6, 12], t: tr('Bạn quét sân chùa mỗi sáng, lá rụng bao nhiêu quét bấy nhiêu, lòng dần yên.', "You sweep the temple yard every morning. However many leaves fall, you sweep them all, and your heart slowly grows still."), ok: ori('chua'), fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: tr('Bạn giúp cha trông sạp hàng, tính nhẩm nhanh hơn cả bàn tính.', "You help Father mind the stall and add up sums faster than an abacus."), ok: ori('tieu_thuong'), fx: (c) => money(c, 5) },
  { a: [6, 12], t: tr('Ở gia tộc, bạn được học cùng con dòng chính nhưng phải ngồi bàn cuối.', "In the clan you study alongside the main-line children, but you have to sit at the back."), ok: ori('the_gia') },
  { a: [6, 12], t: tr('Lão ăn mày say rượu kể chuyện ngày xưa lão từng là cao thủ. Bạn nửa tin nửa ngờ.', "The drunk old beggar claims he was once a great master. You half believe him."), ok: ori('co_nhi') },
  { a: [6, 12], t: tr('Bạn tập giữ hình người cả ngày không lòi đuôi, được mẹ thưởng một con gà.', "You manage to hold human form all day without your tail popping out. Mother rewards you with a whole chicken."), ok: (c) => c.race === 'yeu' },
  { a: [6, 12], t: tr('Bạn học thêu khăn, thêu con uyên ương mà ai cũng tưởng là con vịt.', "You learn embroidery. You stitch a pair of mandarin ducks, and everyone thinks they're regular ducks."), ok: girl },
  { a: [6, 12], t: tr('Bạn lén lấy kiếm gỗ của anh họ ra múa, chém gãy luôn cây chổi của mẹ.', "You sneak out your cousin's wooden sword to practise and chop Mother's broom in half."), ok: boy },
];

/** Rút một kỷ niệm chưa gặp trong kiếp này. Trả về null nếu năm nay không có gì đáng nhớ. */
export function childLine(c: Character, age: number, rnd: () => number): string | null {
  const used = c.seenEvents;
  const pool = CHILD_LINES.map((l, i) => ({ l, i })).filter(({ l, i }) => age >= l.a[0] && age <= l.a[1] && !used[`cl${i}`] && (!l.ok || l.ok(c)) && !(isOrphan(c) && FAMILY_RE.test(l.t)));
  if (!pool.length) return null;
  // ưu tiên dòng riêng theo xuất thân, vùng đất
  const weighted = pool.flatMap((p) => (p.l.ok ? [p, p, p] : [p]));
  const { l, i } = weighted[Math.floor(rnd() * weighted.length)];
  used[`cl${i}`] = age;
  l.fx?.(c);
  return l.t;
}

/** Thêm sự kiện có lựa chọn cho tuổi thơ (nhẹ nhàng, ít hiểm nguy) */
export const CHILD_EVENTS: GameEvent[] = [
  {
    id: 'cho_phien',
    minAge: 4,
    maxAge: 11,
    once: true,
    weight: 12,
    title: tr('Phiên chợ Tết', "New Year market"),
    text: () => tr('Mẹ dắt bạn đi chợ phiên cuối năm. Mẹ dúi vào tay bạn mấy đồng: "Thích gì thì mua."', "Mother takes you to the year-end market and presses a few coins into your hand: \"Buy whatever you like.\""),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Mua con tò he hình Tôn Ngộ Không', "Buy a dough figure of the Monkey King"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return tr('Bạn tiếc không dám ăn, để đến khi nó khô cong.', "You can't bear to eat it, and keep it until it dries rock-hard.");
            },
          },
          {
            label: tr('Mua cuốn truyện tranh kiếm hiệp', "Buy a martial-hero picture book"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 3);
              return tr('Bạn đọc đến thuộc lòng, đêm mơ thấy mình là đại hiệp.', "You read it until you know it by heart and dream at night that you're a great hero.");
            },
          },
          {
            label: tr('Mua bánh cho bà cụ ăn xin ở cổng chợ', "Buy cakes for the old beggar woman at the gate"),
            lean: 'chinh',
            run: (c) => {
              dao(c, 5);
              stat(c, 'khiVan', 2);
              return tr('Bà cụ cười móm mém, xoa đầu bạn mãi.', "She gives you a toothless smile and keeps patting your head.");
            },
          },
          {
            label: tr('Giữ tiền lại, bỏ ống heo', "Keep the money in your piggy bank"),
            lean: 'trung',
            run: (c) => {
              money(c, 8);
              return tr('Mẹ khen bạn biết lo xa.', "Mother praises you for thinking ahead.");
            },
          },
          {
            label: tr('Đánh bạc với đám trẻ ở góc chợ', "Gamble with the kids in the market corner"),
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -3);
              if (ctx.rnd() < 0.5) {
                money(c, 15);
                return tr('Bạn thắng gấp đôi, về nhà giấu biệt.', "You double your money and hide it at home.");
              }
              return tr('Bạn thua sạch, về nhà nói dối là đánh rơi.', "You lose it all and lie at home that you dropped it.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'chim_non',
    minAge: 4,
    maxAge: 11,
    once: true,
    weight: 10,
    title: tr('Con chim non', "The fledgling"),
    text: () => tr('Sau trận bão, bạn thấy một con chim non rơi khỏi tổ, run rẩy dưới gốc cây.', "After a storm you find a baby bird fallen from its nest, shivering under a tree."),
    choices: () => [
      {
        label: tr('Nhặt về nuôi', "Take it home and raise it"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 4);
          if (ctx.rnd() < 0.5) {
            stat(c, 'khiVan', 3);
            return tr('Nó lớn lên, bay đi rồi mùa xuân năm sau quay lại đậu trên mái nhà bạn.', "It grows up and flies away, then returns the next spring to perch on your roof.");
          }
          stat(c, 'tamCanh', 2);
          return tr('Nó chết sau ba ngày. Bạn chôn nó dưới gốc khế, khóc một trận.', "It dies after three days. You bury it under the starfruit tree and cry your heart out.");
        },
      },
      {
        label: tr('Trèo lên đặt lại vào tổ', "Climb up and put it back in the nest"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          stat(c, 'sucKhoe', 2);
          return tr('Chim mẹ kêu ríu rít. Bạn thấy mình như anh hùng.', "The mother bird chirps away. You feel like a hero.");
        },
      },
      { label: tr('Để mặc nó', "Leave it be"), lean: 'trung', run: () => tr('Chiều về, gốc cây chỉ còn vài sợi lông.', "By evening, only a few feathers remain under the tree.") },
      {
        label: tr('Mang về cho mèo ăn', "Bring it home for the cat"),
        lean: 'ta',
        run: (c) => {
          dao(c, -4);
          return tr('Con mèo ăn xong liếm mép nhìn bạn.', "The cat finishes, licks its lips, and looks at you.");
        },
      },
    ],
  },
  {
    id: 'truong_lang',
    minAge: 6,
    maxAge: 11,
    once: true,
    weight: 14,
    title: tr('Trường làng', "Village school"),
    text: () => tr('Thầy đồ ra câu đối, ai đối được thì được về sớm: "Mưa rơi trên mái tranh."', "The teacher sets a couplet - whoever matches it may leave early: \"Rain falls on the thatched roof.\""),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('"Gió thổi dưới rặng tre"', "\"Wind blows beneath the bamboo\""),
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 3);
              return tr('Thầy gật gù: "Được." Bạn về sớm đi bắt châu chấu.', "The teacher nods: \"Good.\" You leave early to catch grasshoppers.");
            },
          },
          {
            label: tr('"Kiếm sáng giữa trời mây"', "\"A sword shines amid the clouds\""),
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 2);
              addCult(c, 3);
              return tr('Thầy nhíu mày: "Không chỉnh, nhưng có khí phách." Cả lớp vỗ tay.', "The teacher frowns: \"Doesn't match, but it has spirit.\" The whole class applauds.");
            },
          },
          {
            label: tr('Chép bài của đứa ngồi bên', "Copy the kid next to you"),
            lean: 'ta',
            run: (c) => {
              dao(c, -3);
              return tr('Thầy phát hiện, bắt cả hai ở lại quét lớp.', "The teacher catches you and keeps you both behind to sweep the room.");
            },
          },
          {
            label: tr('Ngủ gật', "Doze off"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', 2);
              return tr('Bạn mơ thấy cá chép hóa rồng. Tỉnh dậy lớp đã về hết.', "You dream of a carp turning into a dragon. When you wake, everyone has gone home.");
            },
          },
          {
            label: tr('Đứng lên cãi thầy rằng câu này dở', "Stand up and tell the teacher the line is bad"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.5) {
                stat(c, 'ngoTinh', 4);
                return tr('Thầy bật cười, cho bạn ra đề lại. Từ đó thầy để ý bạn.', "The teacher laughs and lets you set a new one. From then on he keeps an eye on you.");
              }
              return tr('Bị năm roi vào lòng bàn tay.', "Five strokes of the cane on your palm.") + hurt(c, 3, ctx);
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'lao_cau_ca',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 9,
    title: tr('Lão câu cá', "The old fisherman"),
    text: () => tr('Bên hồ có lão già câu cá bằng lưỡi câu thẳng, ngồi cả ngày không được con nào.', "By the lake an old man fishes with a straight hook, sitting all day without a single bite."),
    choices: () => [
      {
        label: tr('Ngồi xuống câu cùng lão', "Sit and fish with him"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 5);
          return tr('Lão chẳng nói gì. Chiều tối lão bảo: "Người câu, cá câu, ai câu ai?" Bạn nghĩ mãi.', "He says nothing. At dusk he asks: \"The man fishes, the fish is fished - who is fishing whom?\" You ponder it for ages.");
        },
      },
      {
        label: tr('Chỉ cho lão uốn cong lưỡi câu', "Show him how to bend the hook"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 2);
          dao(c, 2);
          return tr('Lão cười ha hả, xoa đầu bạn: "Thằng bé tốt bụng." Rồi lão biến mất trong sương.', "He roars with laughter and pats your head: \"Kind-hearted lad.\" Then he vanishes into the mist.");
        },
      },
      {
        label: tr('Ném đá cho cá chạy hết', "Throw stones to scare the fish"),
        lean: 'ta',
        run: (c) => {
          dao(c, -2);
          return tr('Lão chẳng giận, chỉ thở dài: "Duyên chưa tới."', "He isn't angry, only sighs: \"The time is not yet ripe.\"");
        },
      },
      {
        label: tr('Mang cơm cho lão', "Bring him some rice"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'khiVan', 3);
          return tr('Lão ăn xong, để lại một hòn đá cuội trơn bóng. Cầm vào thấy ấm.', "He eats, then leaves you a smooth, glossy pebble. It feels warm in your hand.");
        },
      },
    ],
  },
  {
    id: 'dom_dom',
    minAge: 4,
    maxAge: 10,
    once: true,
    weight: 9,
    title: tr('Đêm hè', "Summer night"),
    text: () => tr('Đêm hè oi ả, cả xóm trải chiếu ra sân hóng mát. Lũ trẻ rủ nhau...', "On a sweltering summer night the whole neighbourhood lays mats in the yard to cool off. The kids get an idea..."),
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: tr('Bắt đom đóm bỏ vào lọ làm đèn', "Catch fireflies in a jar for a lamp"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return tr('Đèn đom đóm chập chờn bên gối. Bạn ngủ ngon nhất mùa hè.', "The firefly lamp flickers by your pillow. Best sleep of the summer.");
            },
          },
          {
            label: tr('Nằm đếm sao với ông', "Lie counting stars with Grandpa"),
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 2);
              return tr('Ông chỉ cho bạn sao Bắc Đẩu: "Lạc đường thì nhìn nó mà về."', "Grandpa points out the Northern Dipper: \"If you ever get lost, follow it home.\"");
            },
          },
          {
            label: tr('Kể chuyện ma dọa đứa nhỏ nhất', "Tell ghost stories to scare the youngest"),
            lean: 'ta',
            run: (c) => {
              dao(c, -2);
              return tr('Nó khóc ré lên. Cả xóm biết bạn là đứa đầu têu.', "The kid bursts into tears. The whole neighbourhood knows you started it.");
            },
          },
          {
            label: tr('Nghe bà kể chuyện Tấm Cám', "Listen to Grandma tell the tale of Tấm and Cám"),
            lean: 'chinh',
            run: (c) => {
              dao(c, 2);
              stat(c, 'tamCanh', 2);
              return tr('Bạn ghét mụ dì ghẻ đến nghiến răng.', "You hate the wicked stepmother so much you grind your teeth.");
            },
          },
          {
            label: tr('Rủ nhau ra nghĩa địa thử gan', "Dare each other to go to the graveyard"),
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.3) {
                stat(c, 'tamMa', 4);
                return tr('Có đốm lửa xanh lơ lửng trên một ngôi mộ. Cả bọn chạy không kịp thở.', "A blue will-o'-the-wisp hovers over a grave. You all run until you can't breathe.");
              }
              stat(c, 'khiVan', 2);
              return tr('Chẳng có ma nào. Bạn trở thành đứa gan nhất xóm.', "No ghosts at all. You become the bravest kid in the neighbourhood.");
            },
          },
        ],
        4,
      ),
  },
  {
    id: 'ban_than',
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 10,
    title: tr('Bạn thân', "Best friend"),
    text: (c) => tr(`Đứa bạn thân nhất của bạn sắp theo gia đình chuyển ${c.region === 'dong_hai' ? tr('vào đất liền', "inland") : tr('đi phương xa', "far away")}.`, `Your best friend is about to move ${c.region === 'dong_hai' ? tr('vào đất liền', "inland") : tr('đi phương xa', "far away")} with their family.`),
    choices: () => [
      {
        label: tr('Tặng nó món đồ quý nhất của mình', "Give them your most precious thing"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'tamCanh', 3);
          return tr('Nó khóc, hứa lớn lên sẽ quay về tìm bạn.', "They cry and promise to come find you when they grow up.");
        },
      },
      {
        label: tr('Hẹn mười năm sau gặp lại dưới gốc đa', "Promise to meet again under the banyan in ten years"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 2);
          return tr('Hai đứa móc ngoéo. Không biết lời hẹn trẻ con có thành không.', "You hook pinkies. Who knows if a child's promise will hold.");
        },
      },
      {
        label: tr('Giận dỗi không ra tiễn', "Sulk and refuse to see them off"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 3);
          return tr('Đêm đó bạn trùm chăn khóc. Sau này nghĩ lại vẫn thấy tiếc.', "That night you cry under the blanket. Years later you still regret it.");
        },
      },
      {
        label: tr('Trốn nhà đi theo nó', "Run away and follow them"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.6) return tr('Đi được nửa ngày thì bị cha đuổi kịp, xách tai lôi về.', "Half a day out, Father catches up and drags you home by the ear.");
          return tr('Bạn lạc trong rừng một đêm, sáng ra mới mò được về nhà.', "You get lost in the forest overnight and only find your way home at dawn.") + hurt(c, 6, ctx);
        },
      },
    ],
  },
  {
    id: 'kiem_go_ong',
    minAge: 5,
    maxAge: 12,
    once: true,
    weight: 8,
    when: (c) => !c.inventory.includes('moc_kiem'),
    title: tr('Thanh kiếm gỗ của ông', "Grandpa's wooden sword"),
    text: () => tr('Dọn gác xép, bạn tìm thấy thanh kiếm gỗ cũ của ông nội, cán đã mòn nhẵn.', "Clearing out the attic, you find Grandpa's old wooden sword, its hilt worn smooth."),
    choices: () => [
      {
        label: tr('Xin ông cho mình', "Ask Grandpa if you can have it"),
        lean: 'trung',
        run: (c) => {
          giveItem(c, 'moc_kiem', false);
          return tr('Ông cười: "Ngày xưa ông cũng mơ làm kiếm khách." Ông trao kiếm cho bạn.', "He smiles: \"I once dreamed of being a swordsman too.\" He hands you the sword.");
        },
      },
      {
        label: tr('Hỏi ông về ngày xưa', "Ask Grandpa about the old days"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 3);
          return tr('Ông kể về một giang hồ đã mất. Đêm ấy ông kể đến khi ngủ quên.', "He tells you of a jianghu long gone, talking that night until he falls asleep.");
        },
      },
      {
        label: tr('Cất lại chỗ cũ', "Put it back where it was"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 2);
          return tr('Có những thứ nên để yên.', "Some things are best left alone.");
        },
      },
    ],
  },
  {
    id: 'mua_lu',
    minAge: 5,
    maxAge: 12,
    once: true,
    weight: 7,
    title: tr('Mùa nước lên', "Flood season"),
    text: () => tr('Nước sông dâng ngập ruộng. Cả làng dọn đồ lên chỗ cao.', "The river rises and floods the paddies. The whole village hauls its belongings to higher ground."),
    choices: () => [
      {
        label: tr('Giúp hàng xóm khiêng đồ', "Help the neighbours carry their things"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'sucKhoe', 2);
          return tr('Người lớn khen bạn khỏe như con nghé.', "The grown-ups say you're as strong as a young buffalo.");
        },
      },
      {
        label: tr('Chèo chậu gỗ đi vớt cá', "Paddle a wooden tub out to catch fish"),
        lean: 'trung',
        run: (c) => {
          money(c, 6);
          return tr('Bạn vớt được cả giỏ cá rô. Mẹ kho mặn ăn cả tuần.', "You scoop up a whole basket of perch. Mother braises them, and the family eats for a week.");
        },
      },
      {
        label: tr('Vớt đồ trôi về làm của riêng', "Fish out floating goods for yourself"),
        lean: 'ta',
        run: (c) => {
          dao(c, -3);
          money(c, 12);
          return tr('Bạn vớt được cái rương gỗ, trong có mấy món đồ đồng.', "You haul in a wooden chest holding a few bronze trinkets.");
        },
      },
      {
        label: tr('Ngồi trên mái nhà ngắm nước', "Sit on the roof and watch the water"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return tr('Cả cánh đồng biến thành biển. Bạn thấy đất trời thật rộng.', "The whole field has become a sea. The world feels so vast.");
        },
      },
    ],
  },
];
