import { addCult, dao, fatal, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';

/**
 * 10 kết cục hiếm ở ba cõi (bản 2.0.0). Mỗi kết cục đi kèm một sự kiện ít gặp,
 * phần lớn chỉ xuất hiện ở cảnh giới cao, một lần mỗi kiếp. Cố ý khó gặp.
 */

/** Duyên phận định sẵn mỗi kiếp: chỉ một phần kiếp có duyên gặp sự kiện này (cố định theo kiếp, không đổi khi tải lại) */
function fated(c: Character, id: string, p: number): boolean {
  let h = 2166136261 ^ ((c.lookSeed ?? 0) * 31 + c.lifeNo);
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000 < p;
}

/** Kết thúc kiếp bằng một lựa chọn: không phải cái chết thường, mà là một kết cục */
function endWith(c: Character, ctx: EffectCtx, tag: string, cause: string, fx: string) {
  c.dead = true;
  c.endTag = tag;
  c.cause = cause;
  ctx.fx('breakthrough', fx);
}

/** Hiểm cảnh có thể chết; nếu chết thì gắn kết cục riêng */
function risk(c: Character, ctx: EffectCtx, chance: number, tag: string, cause: string): string | null {
  const d = fatal(c, ctx, chance, cause);
  if (c.dead) c.endTag = tag;
  return d;
}

/** tỉ lệ kiếp có duyên với mỗi sự kiện kết cục */
const FATE = 0.3;

export const COSMOS_END_EVENTS: GameEvent[] = [
  // ---------------- Tiên giới ----------------
  {
    id: 'end_thien_ha',
    cosmos: 'tien',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_thien_ha', FATE) && !!c.partner,
    title: 'Thiên Hà cách trở',
    text: (c) =>
      `Đêm thất tịch, bạn đứng bên bờ Thiên Hà nhìn xuống nhân gian. Bóng ${c.partner} vẫn ở đó, tóc đã bạc. Tiên thọ vạn năm, người phàm chỉ còn vài mùa xuân. Tiên quy cấm tiên nhân hạ phàm.`,
    choices: (c) => [
      {
        label: 'Bỏ tiên tịch, hạ phàm sống nốt đời cùng người ấy',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'chinh',
        run: (ch, ctx) => {
          endWith(ch, ctx, 'ha_pham', `Bỏ tiên tịch, hạ phàm sống trọn kiếp người cùng ${c.partner}`, 'HẠ PHÀM');
          return `Bạn tự xóa tên khỏi tiên tịch, rơi xuống nhân gian như một ngôi sao. Mấy mùa xuân còn lại, bạn cùng ${c.partner} ngồi trước hiên nhà, nhìn Thiên Hà mà cười. Không có tiên nào sống vui hơn thế.`;
        },
      },
      {
        label: 'Gửi một giấc mộng đẹp xuống cho người ấy',
        hint: 'tâm cảnh +, tâm ma -',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 10);
          stat(ch, 'tamMa', -10);
          return 'Đêm ấy người dưới trần mơ thấy bạn. Sáng ra, người ấy mỉm cười kể cho con cháu nghe về một vị tiên quen.';
        },
      },
      {
        label: 'Quay lưng, tiên phàm đã khác đường',
        hint: 'tu vi +, đạo tâm -',
        lean: 'ta',
        run: (ch) => {
          dao(ch, -6);
          addCult(ch, reward(ch, 1));
          return 'Bạn quay đi, dồn hết tâm trí vào tu luyện. Tu vi tăng nhanh, nhưng đêm nào cũng nghe tiếng sông Thiên Hà chảy.';
        },
      },
    ],
  },
  {
    id: 'end_thu_mon',
    cosmos: 'tien',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_thu_mon', FATE),
    title: 'Ma quân phá Nam Thiên Môn',
    text: () => 'Trống trận dồn dập. Mười vạn ma quân tràn tới Nam Thiên Môn, thiên binh tan tác. Chỉ còn bạn đứng trước cổng.',
    choices: () => [
      {
        label: 'Một mình giữ cổng tới hơi thở cuối',
        hint: 'tu vi ++, rất nguy hiểm',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          const d = risk(c, ctx, 0.5, 'thu_mon', 'Một mình giữ Nam Thiên Môn trước mười vạn ma quân, đứng chết mà không lùi một bước');
          if (d) return 'Bạn chém tới khi kiếm gãy, rồi đứng chết giữa cổng trời. Ma quân không dám bước qua xác bạn.' + d;
          addCult(c, reward(c, 2.5));
          return 'Ba ngày ba đêm, ma quân không qua được cổng. Viện binh tới, thấy bạn vẫn đứng, áo đẫm máu. Thiên Đình ghi công lớn.';
        },
      },
      {
        label: 'Rút về Lăng Tiêu Điện cầu viện',
        hint: 'an toàn',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 6);
          return 'Bạn rút lui. Nam Thiên Môn thất thủ một đêm rồi được chiếm lại. Không ai trách, nhưng bạn tự trách.';
        },
      },
    ],
  },
  {
    id: 'end_thien_thu',
    cosmos: 'tien',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_thien_thu', FATE),
    title: 'Tàng Kinh Các của Văn Khúc',
    text: () =>
      'Văn Khúc Tinh Quân dẫn bạn vào một tòa lầu không đáy, sách chất cao tận mây. "Mọi đạo pháp đều nằm ở đây, chỉ thiếu một người chép nốt trang cuối. Kẻ chép xong sẽ hóa vào sách mà sống mãi."',
    choices: () => [
      {
        label: 'Cầm bút, chép trang cuối của thiên thư',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 'hoa_chu', 'Chép trang cuối của thiên thư, hóa thành chữ trong sách mà sống mãi', 'HÓA CHỮ');
          return 'Ngòi bút chạm giấy, tay bạn hóa thành mực, rồi cả người hóa thành từng nét chữ. Từ nay ai mở thiên thư đều đọc được bạn.';
        },
      },
      {
        label: 'Chỉ đọc vài trang rồi đi',
        hint: 'ngộ tính +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 12);
          return 'Bạn đọc ba trang, ngộ ra ba đạo lý. Ra khỏi lầu mới biết ở nhân gian đã qua ba trăm năm.';
        },
      },
    ],
  },
  {
    id: 'end_thien_de',
    cosmos: 'tien',
    once: true,
    minRealm: 11,
    weight: 1,
    when: (c) => fated(c, 'end_thien_de', FATE) && c.daoTam >= 40,
    title: 'Ngai vàng Lăng Tiêu Điện',
    text: () =>
      'Thiên Đế cũ đã tọa hóa. Chúng tiên quỳ trước bạn: "Ba giới không thể một ngày không có chủ." Nhưng ai ngồi lên ngai vàng ấy, sẽ không bao giờ được rời Lăng Tiêu Điện nữa.',
    choices: () => [
      {
        label: 'Ngồi lên ngai, gánh ba giới trên vai',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'chinh',
        run: (c, ctx) => {
          endWith(c, ctx, 'thien_de', 'Lên ngôi Thiên Đế, vĩnh viễn ngồi trên ngai Lăng Tiêu Điện', 'THIÊN ĐẾ');
          return 'Bạn ngồi xuống. Mây ngũ sắc kéo về, ba giới cùng cúi đầu. Từ đó trở đi, bạn nhìn thấy mọi thứ, mà không bao giờ được chạm vào thứ gì nữa.';
        },
      },
      {
        label: 'Từ chối, tiên đạo không ở trên ngai',
        hint: 'tâm cảnh +, khí vận +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 12);
          stat(c, 'khiVan', 10);
          return 'Bạn cúi chào rồi bỏ đi. Chúng tiên xôn xao, nhưng mấy vị lão tiên lại gật gù.';
        },
      },
    ],
  },
  // ---------------- Ma giới ----------------
  {
    id: 'end_huyet_hai',
    cosmos: 'ma',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_huyet_hai', FATE),
    title: 'Trái tim Huyết Hải',
    text: () =>
      'Giữa Huyết Hải có một trái tim đỏ thẫm vẫn đập, là tàn hồn của Ma Tổ. Ai nuốt được nó sẽ thành chính Huyết Hải: bất tử, nhưng không còn là mình.',
    choices: () => [
      {
        label: 'Nuốt trái tim, hóa thân vào Huyết Hải',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          endWith(c, ctx, 'hoa_huyet_hai', 'Nuốt trái tim Ma Tổ, hóa thân thành Huyết Hải vô tận', 'HÓA HUYẾT HẢI');
          return 'Bạn tan ra, chảy vào từng con sóng đỏ. Huyết Hải dâng cao ba trượng. Từ đó, ma tu nào chết ở Ma giới cũng chảy về bạn.';
        },
      },
      {
        label: 'Rút một giọt máu tim, luyện vào ma thể',
        hint: 'tu vi ++, tâm ma ++',
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 2));
          stat(c, 'tamMa', 18);
          return 'Một giọt thôi mà ma thể nóng như lửa. Đêm đêm bạn nghe thấy tiếng tim đập không phải của mình.';
        },
      },
      {
        label: 'Bỏ đi, thứ này không nên đụng vào',
        hint: 'an toàn',
        lean: 'trung',
        run: () => 'Bạn quay lưng. Sau lưng, trái tim đập chậm lại, như thất vọng.',
      },
    ],
  },
  {
    id: 'end_buong_dao',
    cosmos: 'ma',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_buong_dao', FATE) && c.daoTam >= 0,
    title: 'Tiếng chuông chùa ở Ma giới',
    text: () =>
      'Ở nơi chỉ có máu và lửa, bạn bỗng nghe tiếng chuông chùa. Một lão tăng ngồi giữa đống xương, tay lần tràng hạt: "Ma đầu mà còn nghe được tiếng này, là vẫn còn đường về."',
    choices: () => [
      {
        label: 'Buông đồ đao, quy y dưới chân lão tăng',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 30);
          endWith(c, ctx, 'buong_dao', 'Buông đồ đao giữa Ma giới, quy y thành Phật', 'BUÔNG ĐAO');
          return 'Ma đao rơi xuống, vỡ thành tro. Bạn ngồi xuống bên lão tăng, tụng kinh tới khi ma khí trong người tan hết. Ma giới mất một ma đầu, thế gian thêm một vị Phật.';
        },
      },
      {
        label: 'Nghe hết một hồi chuông rồi đi',
        hint: 'tâm ma --',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -20);
          return 'Bạn nghe hết một hồi chuông, lòng nhẹ đi. Lúc quay lại, lão tăng đã không còn ở đó.';
        },
      },
      {
        label: 'Giết lão tăng, ở Ma giới không có chỗ cho Phật',
        hint: 'đạo tâm --',
        lean: 'ta',
        run: (c) => {
          dao(c, -25);
          addCult(c, reward(c, 1));
          return 'Lão tăng không chống cự, chỉ cười. Tiếng chuông tắt, nhưng thỉnh thoảng bạn vẫn nghe thấy nó trong mơ.';
        },
      },
    ],
  },
  {
    id: 'end_tam_phuc',
    cosmos: 'ma',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_tam_phuc', FATE),
    title: 'Tâm phúc',
    text: () =>
      'Tả hộ pháp theo bạn từ ngày mới vào Ma giới, chưa từng phản. Đêm nay hắn dâng chén rượu mừng thọ, tay hơi run. Mùi rượu có gì đó lạ.',
    choices: () => [
      {
        label: 'Uống cạn, tin hắn thêm lần nữa',
        hint: 'đánh cược tính mạng',
        lean: 'chinh',
        run: (c, ctx) => {
          const d = risk(c, ctx, 0.45, 'tam_phuc', 'Uống chén rượu độc của tâm phúc, chết trên ngai Ma giới');
          if (d) return 'Rượu xuống tới bụng thì ma hồn bốc cháy. Hắn quỳ xuống khóc: "Chủ thượng, Ma giới chỉ có một luật."' + d;
          stat(c, 'khiVan', 12);
          return 'Bạn uống cạn. Hắn quỳ xuống khóc, thú nhận rượu có độc nhưng hắn đã đổi chén. Từ đó hắn theo bạn tới chết.';
        },
      },
      {
        label: 'Hất chén rượu, giết hắn trước',
        hint: 'đạo tâm -, an toàn',
        lean: 'ta',
        run: (c) => {
          dao(c, -10);
          stat(c, 'tamMa', 8);
          return 'Bạn giết hắn trước khi hắn kịp nói. Rượu đổ xuống nền đá, không sủi bọt. Có lẽ nó không có độc.';
        },
      },
    ],
  },
  // ---------------- Thái Hư ----------------
  {
    id: 'end_doi_ten',
    cosmos: 'hu',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_doi_ten', FATE),
    title: 'Kẻ mua tên',
    text: () =>
      'Một bóng người không mặt chặn đường: "Ở Thái Hư, tên là gánh nặng. Bán tên cho ta, ta trả ngươi trăm năm tu vi. Chỉ là từ nay không ai nhớ ngươi là ai, kể cả ngươi."',
    choices: () => [
      {
        label: 'Bán tên lấy đạo',
        hint: 'tu vi +++, khi chết thành kẻ vô danh',
        lean: 'ta',
        run: (c) => {
          c.qf = { ...(c.qf ?? {}), voDanh: 1 };
          addCult(c, reward(c, 4));
          return 'Hắn lấy đi tên bạn như rút một sợi chỉ. Tu vi tăng vọt. Bạn mở miệng định nói mình là ai, rồi ngập ngừng.';
        },
      },
      {
        label: 'Giữ tên, không bán',
        hint: 'tâm cảnh +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          return 'Bạn đọc to tên mình ba lần. Bóng người tan đi như khói.';
        },
      },
    ],
  },
  {
    id: 'end_tuoi_tho',
    cosmos: 'hu',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_tuoi_tho', FATE),
    title: 'Khe nứt về thuở nhỏ',
    text: () =>
      'Qua một khe nứt thời gian, bạn thấy chính mình lúc bảy tuổi đang chơi trước sân nhà, mẹ gọi vào ăn cơm. Khe nứt đủ rộng để bước qua. Bước qua rồi thì không quay lại được.',
    choices: () => [
      {
        label: 'Bước qua, làm lại đứa trẻ ấy',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 've_tuoi_tho', 'Bước qua khe nứt thời gian, trở về làm đứa trẻ bảy tuổi trước sân nhà', 'VỀ TUỔI THƠ');
          return 'Bạn bước qua. Tu vi, thần thông, vạn năm ký ức rơi rụng từng thứ một. Khi mẹ gọi lần nữa, bạn chạy vào nhà, không còn nhớ mình từng là ai. Lần này, bạn không đi tu tiên.';
        },
      },
      {
        label: 'Đứng nhìn một lúc rồi đi tiếp',
        hint: 'tâm cảnh ++',
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 15);
          return 'Bạn đứng nhìn tới khi đứa trẻ ăn xong bữa cơm. Rồi khe nứt khép lại.';
        },
      },
    ],
  },
  {
    id: 'end_hoang_luong',
    cosmos: 'hu',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_hoang_luong', FATE),
    title: 'Mùi kê chín',
    text: () =>
      'Giữa hư không, bạn bỗng ngửi thấy mùi kê đang nấu. Một lão đạo sĩ ngồi bên bếp lửa, cười: "Ngươi ngủ lâu quá rồi. Nồi kê sắp chín, có muốn tỉnh dậy không?"',
    choices: () => [
      {
        label: 'Tỉnh dậy',
        hint: 'kết thúc kiếp · kết cục hiếm',
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 'hoang_luong', 'Tỉnh dậy bên nồi kê chưa chín, cả đời tu tiên chỉ là một giấc mộng', 'TỈNH MỘNG');
          return 'Bạn mở mắt trong một quán trọ ven đường. Nồi kê vẫn chưa chín. Phi thăng, ba cõi, vạn năm tu luyện, tất cả chỉ là một giấc ngủ trưa. Bạn ngồi dậy, thấy lòng nhẹ tênh.';
        },
      },
      {
        label: 'Ngủ tiếp, giấc mộng này còn hay',
        hint: 'khí vận +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 10);
          return 'Lão đạo sĩ lắc đầu, đậy nắp nồi lại. Bạn quay về hư không, không chắc đâu là thật nữa.';
        },
      },
    ],
  },
];
