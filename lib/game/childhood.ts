import { FAMILY_RE, addCult, dao, giveItem, hurt, isOrphan, money, sample, stat } from './helpers';
import type { Character, Choice, GameEvent } from './types';

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
  { a: [1, 2], t: 'Bạn biết đi rồi, chập chững khắp sân, ngã cái nào cũng tự đứng dậy.' },
  { a: [1, 2], t: 'Bạn bập bẹ gọi được tiếng "mẹ". Cha giận dỗi cả tuần vì không được gọi trước.' },
  { a: [1, 2], t: 'Bạn bò ra cửa đuổi theo con mèo mướp, bị nó cào một vết, khóc ré lên rồi lại đuổi tiếp.' },
  { a: [1, 2], t: 'Đêm nào bạn cũng phải nghe bà ru "ầu ơ" mới chịu ngủ.' },
  { a: [1, 2], t: 'Bạn mọc chiếc răng đầu tiên, cắn ngón tay cha đến bật máu.' },
  { a: [1, 2], t: 'Nhà nghèo không có sữa, mẹ bế bạn đi xin bú khắp xóm.', ok: poor },
  { a: [1, 2], t: 'Ba bà vú thay nhau bế, bạn chưa từng chạm chân xuống đất.', ok: rich },
  { a: [1, 2], t: 'Bạn ngủ trong chiếc nôi kết bằng lông lạc đà, ngoài kia gió cát rít cả đêm.', ok: reg('bac_mac', 'tay_vuc') },
  { a: [1, 2], t: 'Mẹ địu bạn sau lưng ra bãi biển vá lưới, sóng vỗ thành tiếng hát ru.', ok: reg('dong_hai') },
  { a: [1, 2], t: 'Sư thầy đặt bạn nằm cạnh tượng Phật, tiếng mõ là thứ đầu tiên bạn nhớ được.', ok: ori('chua') },
  { a: [1, 2], t: 'Lão ăn mày quấn bạn trong tấm chăn rách, nhường hết bát cháo loãng cho bạn.', ok: ori('co_nhi') },
  { a: [1, 2], t: 'Bạn vẫn còn đuôi cáo, cứ ngủ là cuộn tròn ôm lấy nó.', ok: (c) => c.race === 'yeu' },
  // 3-5 tuổi
  { a: [3, 5], t: 'Bạn tự trèo lên được cây ổi sau nhà, ăn no rồi không biết đường xuống.' },
  { a: [3, 5], t: 'Bạn nuôi một con dế mèn trong hộp diêm, đặt tên nó là "Đại tướng quân".' },
  { a: [3, 5], t: 'Bạn lấy trộm nồi cơm cháy, ăn hết rồi đổ tội cho con chó vàng.' },
  { a: [3, 5], t: 'Bạn nặn tò he hình con rồng, ai xem cũng bảo giống con giun.' },
  { a: [3, 5], t: 'Bạn khóc cả buổi chiều vì con gà mái nhà mình bị đem đi làm cỗ.' },
  { a: [3, 5], t: 'Bạn theo đám rước đèn trung thu, về nhà mặt mũi lem nhem toàn mực.' },
  { a: [3, 5], t: 'Bạn bị ong đốt sưng vù một bên má, trông như cái bánh bao.', fx: (c) => stat(c, 'sucKhoe', -2) },
  { a: [3, 5], t: 'Bạn nghịch lửa đốt cháy góc bếp. Cha vụt cho mấy roi, nhớ đời.' },
  { a: [3, 5], t: 'Có thầy tướng số đi qua, xoa đầu bạn: "Đứa trẻ này có cốt tiên." Mẹ cho thầy hai quả trứng.', fx: (c) => stat(c, 'khiVan', 1) },
  { a: [3, 5], t: 'Bạn học được câu chửi đầu tiên từ bác hàng thịt. Mẹ súc miệng cho bạn bằng nước muối.' },
  { a: [3, 5], t: 'Bạn bị cảm, mẹ nấu nồi lá xông, trùm chăn kín mít. Sáng ra khỏe re.' },
  { a: [3, 5], t: 'Đêm giao thừa bạn thức đến khuya đợi pháo, rồi ngủ gục trên đùi ông.' },
  { a: [3, 5], t: 'Nhà hết gạo, bạn theo mẹ đi mót lúa trên cánh đồng đã gặt.', ok: poor },
  { a: [3, 5], t: 'Bạn khóc đòi mua con ngựa gỗ sơn son, cha cõng bạn đi khắp chợ tìm cho bằng được.', ok: (c) => !poor(c) },
  { a: [3, 5], t: 'Ông quản gia dạy bạn đếm linh thạch. Bạn đếm đến một trăm thì ngủ gật.', ok: rich, fx: (c) => money(c, 5) },
  { a: [3, 5], t: 'Bạn thấy rắn hai đầu trong bụi tre. Không ai tin, chỉ có bà nội lặng lẽ thắp nhang.', ok: reg('nam_cuong') },
  { a: [3, 5], t: 'Bạn đắp người tuyết cao hơn cả mình, sáng hôm sau nó đã đi mất. Chỉ còn dấu chân.', ok: reg('tuyet_vuc', 'bac_mac') },
  { a: [3, 5], t: 'Bạn nhặt được vỏ ốc to bằng nắm tay, áp vào tai nghe thấy tiếng ai đó gọi tên mình.', ok: reg('dong_hai') },
  { a: [3, 5], t: 'Trên trời có tiên nhân ngự kiếm bay qua. Bạn chạy theo đến khi ngã sấp mặt.', ok: reg('trung_chau', 'thanh_chau') },
  { a: [3, 5], t: 'Đêm nào cũng có tiếng ai khóc ngoài rừng chết. Mẹ dặn không được mở cửa.', ok: reg('ma_vuc') },
  { a: [3, 5], t: 'Bạn bắt chước các sư huynh gõ mõ, gõ vỡ luôn cái mõ của sư thầy.', ok: ori('chua') },
  { a: [3, 5], t: 'Lão ăn mày dạy bạn cách đứng xin ăn sao cho người ta thương. Bạn học rất nhanh.', ok: ori('co_nhi') },
  { a: [3, 5], t: 'Bạn bị đám con dòng chính đẩy xuống hồ sen. Không ai bênh bạn cả.', ok: ori('the_gia'), fx: (c) => stat(c, 'tamMa', 2) },
  { a: [3, 5], t: 'Bạn lẻn ra phố xem gánh xiếc khỉ, mải xem quá nên lạc mất mẹ.', ok: ori('tieu_thuong') },
  { a: [3, 5], t: 'Bạn lỡ hóa thành cáo giữa lúc đang ăn cơm. Mẹ bình thản gắp thêm cho miếng thịt.', ok: (c) => c.race === 'yeu' },
  { a: [3, 5], t: 'Bạn đòi để tóc dài như tiên nữ trong tranh, mẹ phải tết cho bạn mỗi sáng.', ok: girl },
  { a: [3, 5], t: 'Bạn cởi truồng chạy khắp làng, bị lũ con gái cười cho đỏ mặt.', ok: boy },
  // 6-12 tuổi
  { a: [6, 12], t: 'Bạn thả diều trên đê, dây đứt, diều bay mất về phía núi. Bạn đứng nhìn rất lâu.' },
  { a: [6, 12], t: 'Bạn chơi đá cầu giỏi nhất xóm, lũ trẻ gọi là "chân thần".', fx: (c) => stat(c, 'sucKhoe', 2) },
  { a: [6, 12], t: 'Bạn chọi dế thắng liền chín trận, ôm hộp dế ngủ như ôm báu vật.' },
  { a: [6, 12], t: 'Bạn trèo hái trộm xoài nhà ông Tư, bị ông đứng dưới gốc đợi sẵn.' },
  { a: [6, 12], t: 'Bạn chép phạt một trăm lần chữ "Nhẫn". Chép xong thì quên mất vì sao bị phạt.', fx: (c) => stat(c, 'tamCanh', 1) },
  { a: [6, 12], t: 'Bạn thổi sáo trên lưng trâu, thổi mãi cũng ra được một khúc.' },
  { a: [6, 12], t: 'Hội làng có múa lân, bạn đứng xem từ sáng đến tối, về mơ mình là con lân.' },
  { a: [6, 12], t: 'Bạn đánh nhau với thằng con nhà hàng xóm, cả hai bị phạt quỳ, rồi thành bạn thân.' },
  { a: [6, 12], t: 'Có em bé mới chào đời. Bạn bế em, lần đầu thấy mình là người lớn.', fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: 'Cha mẹ cãi nhau to. Bạn trốn ra bờ ao ngồi đến khuya.', fx: (c) => stat(c, 'tamMa', 2) },
  { a: [6, 12], t: 'Bạn đi câu cả buổi chỉ được con cá bống bằng ngón tay, vẫn hãnh diện mang về.' },
  { a: [6, 12], t: 'Bạn tập ngồi thiền theo tranh vẽ, ngồi được nửa nén nhang thì tê chân ngã lăn.', fx: (c) => addCult(c, 2) },
  { a: [6, 12], t: 'Bạn nhặt được một đồng tiền cổ có khắc chữ lạ, giấu kỹ dưới gối.' },
  { a: [6, 12], t: 'Mất mùa, cả nhà ăn cháo khoai suốt mùa đông. Bạn nhường phần cho em.', ok: poor, fx: (c) => dao(c, 3) },
  { a: [6, 12], t: 'Thầy dạy đàn từ kinh thành về nhà dạy bạn gảy đàn cầm. Ngón tay phồng rộp.', ok: rich, fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: 'Bạn theo đoàn lạc đà đi một đoạn, học được mấy câu tiếng Hồ.', ok: reg('tay_vuc', 'bac_mac') },
  { a: [6, 12], t: 'Bạn lặn mò ngọc trai cùng lũ trẻ chài, lần nào cũng nín thở lâu nhất.', ok: reg('dong_hai'), fx: (c) => stat(c, 'sucKhoe', 2) },
  { a: [6, 12], t: 'Bạn theo bà đi hái thuốc trên núi, nhớ được tên ba mươi loại cỏ.', ok: reg('nam_cuong', 'thanh_chau'), fx: (c) => stat(c, 'ngoTinh', 1) },
  { a: [6, 12], t: 'Bạn bị cảm lạnh vì trốn học đi trượt băng trên hồ, nằm bẹp mấy hôm.', ok: reg('tuyet_vuc'), fx: (c) => stat(c, 'sucKhoe', -2) },
  { a: [6, 12], t: 'Bạn quét sân chùa mỗi sáng, lá rụng bao nhiêu quét bấy nhiêu, lòng dần yên.', ok: ori('chua'), fx: (c) => stat(c, 'tamCanh', 2) },
  { a: [6, 12], t: 'Bạn giúp cha trông sạp hàng, tính nhẩm nhanh hơn cả bàn tính.', ok: ori('tieu_thuong'), fx: (c) => money(c, 5) },
  { a: [6, 12], t: 'Ở gia tộc, bạn được học cùng con dòng chính nhưng phải ngồi bàn cuối.', ok: ori('the_gia') },
  { a: [6, 12], t: 'Lão ăn mày say rượu kể chuyện ngày xưa lão từng là cao thủ. Bạn nửa tin nửa ngờ.', ok: ori('co_nhi') },
  { a: [6, 12], t: 'Bạn tập giữ hình người cả ngày không lòi đuôi, được mẹ thưởng một con gà.', ok: (c) => c.race === 'yeu' },
  { a: [6, 12], t: 'Bạn học thêu khăn, thêu con uyên ương mà ai cũng tưởng là con vịt.', ok: girl },
  { a: [6, 12], t: 'Bạn lén lấy kiếm gỗ của anh họ ra múa, chém gãy luôn cây chổi của mẹ.', ok: boy },
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
    title: 'Phiên chợ Tết',
    text: () => 'Mẹ dắt bạn đi chợ phiên cuối năm. Mẹ dúi vào tay bạn mấy đồng: "Thích gì thì mua."',
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: 'Mua con tò he hình Tôn Ngộ Không',
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return 'Bạn tiếc không dám ăn, để đến khi nó khô cong.';
            },
          },
          {
            label: 'Mua cuốn truyện tranh kiếm hiệp',
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 3);
              return 'Bạn đọc đến thuộc lòng, đêm mơ thấy mình là đại hiệp.';
            },
          },
          {
            label: 'Mua bánh cho bà cụ ăn xin ở cổng chợ',
            lean: 'chinh',
            run: (c) => {
              dao(c, 5);
              stat(c, 'khiVan', 2);
              return 'Bà cụ cười móm mém, xoa đầu bạn mãi.';
            },
          },
          {
            label: 'Giữ tiền lại, bỏ ống heo',
            lean: 'trung',
            run: (c) => {
              money(c, 8);
              return 'Mẹ khen bạn biết lo xa.';
            },
          },
          {
            label: 'Đánh bạc với đám trẻ ở góc chợ',
            lean: 'ta',
            run: (c, ctx) => {
              dao(c, -3);
              if (ctx.rnd() < 0.5) {
                money(c, 15);
                return 'Bạn thắng gấp đôi, về nhà giấu biệt.';
              }
              return 'Bạn thua sạch, về nhà nói dối là đánh rơi.';
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
    title: 'Con chim non',
    text: () => 'Sau trận bão, bạn thấy một con chim non rơi khỏi tổ, run rẩy dưới gốc cây.',
    choices: () => [
      {
        label: 'Nhặt về nuôi',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 4);
          if (ctx.rnd() < 0.5) {
            stat(c, 'khiVan', 3);
            return 'Nó lớn lên, bay đi rồi mùa xuân năm sau quay lại đậu trên mái nhà bạn.';
          }
          stat(c, 'tamCanh', 2);
          return 'Nó chết sau ba ngày. Bạn chôn nó dưới gốc khế, khóc một trận.';
        },
      },
      {
        label: 'Trèo lên đặt lại vào tổ',
        lean: 'chinh',
        run: (c) => {
          dao(c, 5);
          stat(c, 'sucKhoe', 2);
          return 'Chim mẹ kêu ríu rít. Bạn thấy mình như anh hùng.';
        },
      },
      { label: 'Để mặc nó', lean: 'trung', run: () => 'Chiều về, gốc cây chỉ còn vài sợi lông.' },
      {
        label: 'Mang về cho mèo ăn',
        lean: 'ta',
        run: (c) => {
          dao(c, -4);
          return 'Con mèo ăn xong liếm mép nhìn bạn.';
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
    title: 'Trường làng',
    text: () => 'Thầy đồ ra câu đối, ai đối được thì được về sớm: "Mưa rơi trên mái tranh."',
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: '"Gió thổi dưới rặng tre"',
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 3);
              return 'Thầy gật gù: "Được." Bạn về sớm đi bắt châu chấu.';
            },
          },
          {
            label: '"Kiếm sáng giữa trời mây"',
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 2);
              addCult(c, 3);
              return 'Thầy nhíu mày: "Không chỉnh, nhưng có khí phách." Cả lớp vỗ tay.';
            },
          },
          {
            label: 'Chép bài của đứa ngồi bên',
            lean: 'ta',
            run: (c) => {
              dao(c, -3);
              return 'Thầy phát hiện, bắt cả hai ở lại quét lớp.';
            },
          },
          {
            label: 'Ngủ gật',
            lean: 'trung',
            run: (c) => {
              stat(c, 'sucKhoe', 2);
              return 'Bạn mơ thấy cá chép hóa rồng. Tỉnh dậy lớp đã về hết.';
            },
          },
          {
            label: 'Đứng lên cãi thầy rằng câu này dở',
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.5) {
                stat(c, 'ngoTinh', 4);
                return 'Thầy bật cười, cho bạn ra đề lại. Từ đó thầy để ý bạn.';
              }
              return 'Bị năm roi vào lòng bàn tay.' + hurt(c, 3, ctx);
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
    title: 'Lão câu cá',
    text: () => 'Bên hồ có lão già câu cá bằng lưỡi câu thẳng, ngồi cả ngày không được con nào.',
    choices: () => [
      {
        label: 'Ngồi xuống câu cùng lão',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 5);
          return 'Lão chẳng nói gì. Chiều tối lão bảo: "Người câu, cá câu, ai câu ai?" Bạn nghĩ mãi.';
        },
      },
      {
        label: 'Chỉ cho lão uốn cong lưỡi câu',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'ngoTinh', 2);
          dao(c, 2);
          return 'Lão cười ha hả, xoa đầu bạn: "Thằng bé tốt bụng." Rồi lão biến mất trong sương.';
        },
      },
      {
        label: 'Ném đá cho cá chạy hết',
        lean: 'ta',
        run: (c) => {
          dao(c, -2);
          return 'Lão chẳng giận, chỉ thở dài: "Duyên chưa tới."';
        },
      },
      {
        label: 'Mang cơm cho lão',
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'khiVan', 3);
          return 'Lão ăn xong, để lại một hòn đá cuội trơn bóng. Cầm vào thấy ấm.';
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
    title: 'Đêm hè',
    text: () => 'Đêm hè oi ả, cả xóm trải chiếu ra sân hóng mát. Lũ trẻ rủ nhau...',
    choices: (_c, seed) =>
      sample<Choice>(
        seed,
        [
          {
            label: 'Bắt đom đóm bỏ vào lọ làm đèn',
            lean: 'trung',
            run: (c) => {
              stat(c, 'tamCanh', 3);
              return 'Đèn đom đóm chập chờn bên gối. Bạn ngủ ngon nhất mùa hè.';
            },
          },
          {
            label: 'Nằm đếm sao với ông',
            lean: 'trung',
            run: (c) => {
              stat(c, 'ngoTinh', 2);
              return 'Ông chỉ cho bạn sao Bắc Đẩu: "Lạc đường thì nhìn nó mà về."';
            },
          },
          {
            label: 'Kể chuyện ma dọa đứa nhỏ nhất',
            lean: 'ta',
            run: (c) => {
              dao(c, -2);
              return 'Nó khóc ré lên. Cả xóm biết bạn là đứa đầu têu.';
            },
          },
          {
            label: 'Nghe bà kể chuyện Tấm Cám',
            lean: 'chinh',
            run: (c) => {
              dao(c, 2);
              stat(c, 'tamCanh', 2);
              return 'Bạn ghét mụ dì ghẻ đến nghiến răng.';
            },
          },
          {
            label: 'Rủ nhau ra nghĩa địa thử gan',
            lean: 'trung',
            run: (c, ctx) => {
              if (ctx.rnd() < 0.3) {
                stat(c, 'tamMa', 4);
                return 'Có đốm lửa xanh lơ lửng trên một ngôi mộ. Cả bọn chạy không kịp thở.';
              }
              stat(c, 'khiVan', 2);
              return 'Chẳng có ma nào. Bạn trở thành đứa gan nhất xóm.';
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
    title: 'Bạn thân',
    text: (c) => `Đứa bạn thân nhất của bạn sắp theo gia đình chuyển ${c.region === 'dong_hai' ? 'vào đất liền' : 'đi phương xa'}.`,
    choices: () => [
      {
        label: 'Tặng nó món đồ quý nhất của mình',
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'tamCanh', 3);
          return 'Nó khóc, hứa lớn lên sẽ quay về tìm bạn.';
        },
      },
      {
        label: 'Hẹn mười năm sau gặp lại dưới gốc đa',
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 2);
          return 'Hai đứa móc ngoéo. Không biết lời hẹn trẻ con có thành không.';
        },
      },
      {
        label: 'Giận dỗi không ra tiễn',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 3);
          return 'Đêm đó bạn trùm chăn khóc. Sau này nghĩ lại vẫn thấy tiếc.';
        },
      },
      {
        label: 'Trốn nhà đi theo nó',
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.6) return 'Đi được nửa ngày thì bị cha đuổi kịp, xách tai lôi về.';
          return 'Bạn lạc trong rừng một đêm, sáng ra mới mò được về nhà.' + hurt(c, 6, ctx);
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
    title: 'Thanh kiếm gỗ của ông',
    text: () => 'Dọn gác xép, bạn tìm thấy thanh kiếm gỗ cũ của ông nội, cán đã mòn nhẵn.',
    choices: () => [
      {
        label: 'Xin ông cho mình',
        lean: 'trung',
        run: (c) => {
          giveItem(c, 'moc_kiem', false);
          return 'Ông cười: "Ngày xưa ông cũng mơ làm kiếm khách." Ông trao kiếm cho bạn.';
        },
      },
      {
        label: 'Hỏi ông về ngày xưa',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 3);
          return 'Ông kể về một giang hồ đã mất. Đêm ấy ông kể đến khi ngủ quên.';
        },
      },
      {
        label: 'Cất lại chỗ cũ',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 2);
          return 'Có những thứ nên để yên.';
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
    title: 'Mùa nước lên',
    text: () => 'Nước sông dâng ngập ruộng. Cả làng dọn đồ lên chỗ cao.',
    choices: () => [
      {
        label: 'Giúp hàng xóm khiêng đồ',
        lean: 'chinh',
        run: (c) => {
          dao(c, 4);
          stat(c, 'sucKhoe', 2);
          return 'Người lớn khen bạn khỏe như con nghé.';
        },
      },
      {
        label: 'Chèo chậu gỗ đi vớt cá',
        lean: 'trung',
        run: (c) => {
          money(c, 6);
          return 'Bạn vớt được cả giỏ cá rô. Mẹ kho mặn ăn cả tuần.';
        },
      },
      {
        label: 'Vớt đồ trôi về làm của riêng',
        lean: 'ta',
        run: (c) => {
          dao(c, -3);
          money(c, 12);
          return 'Bạn vớt được cái rương gỗ, trong có mấy món đồ đồng.';
        },
      },
      {
        label: 'Ngồi trên mái nhà ngắm nước',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return 'Cả cánh đồng biến thành biển. Bạn thấy đất trời thật rộng.';
        },
      },
    ],
  },
];
