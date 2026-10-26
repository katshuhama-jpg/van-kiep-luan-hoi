/**
 * Lời kể kết quả giao đấu: mỗi kết quả có nhiều câu, chọn theo thế trận (thắng áp đảo, thắng sát nút, hòa, thua)
 * và chiêu của con đường tu luyện, để thắng thua hòa không lặp đi lặp lại một câu.
 * Chỉ là lời kể. Số liệu thưởng phạt vẫn do duel.ts, ambush.ts, combat.ts tính rồi nối vào sau.
 */
import type { Character } from './types';

type Rnd = () => number;
export const pickLine = <T,>(rnd: Rnd, arr: T[]): T => arr[Math.floor(rnd() * arr.length) % arr.length];

/** Thế trận theo tỉ lệ máu bạn mất: áp đảo, bình thường, sát nút */
export type Margin = 'crush' | 'mid' | 'close';
export const marginOf = (pLoss: number): Margin => (pLoss < 0.3 ? 'crush' : pLoss > 0.65 ? 'close' : 'mid');

/** Chiêu theo con đường tu luyện, để câu kể có màu riêng */
export function chieuOf(c: Character, rnd: Rnd): string {
  const by: Record<string, string[]> = {
    kiem: ['một đường kiếm', 'kiếm khí', 'một chiêu kiếm chém ngang', 'mũi kiếm'],
    dan: ['một nắm độc phấn', 'đan hỏa', 'một viên đan bạo liệt', 'làn khói thuốc'],
    tran: ['trận kỳ', 'một tòa tiểu trận', 'phù trận dưới chân', 'trận pháp'],
    phat: ['một chưởng Phật quang', 'tràng hạt', 'tiếng niệm Phật', 'Kim Cang chưởng'],
    ma: ['ma khí', 'huyết trảo', 'một chưởng âm hàn', 'ma công'],
    yeu: ['yêu lực', 'móng vuốt', 'tiếng gầm yêu thú', 'một cú quật đuôi'],
  };
  return pickLine(rnd, by[c.path ?? ''] ?? ['một quyền', 'cú đá ngang', 'nắm đấm', 'một chưởng']);
}

/* ---------------- Địch thủ ---------------- */
export function dichThuWin(who: string, m: Margin, ch: string, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      `${who} chưa kịp ra chiêu thứ ba đã bị ${ch} của bạn đánh văng xuống đất.`,
      `Bạn ra tay như sấm sét. ${who} đỡ không nổi một chiêu, ngã quỵ giữa đường.`,
      `Chỉ vài hiệp, ${who} quỳ rạp, máu trào khóe miệng, không dám ngẩng lên nhìn bạn.`,
      `${who} vừa rút binh khí thì ${ch} đã tới trước mặt. Trận đấu kết thúc nhanh tới mức người xem chưa kịp hiểu.`,
    ],
    mid: [
      `Bạn đánh bại địch thủ ${who}.`,
      `${who} lùi ba bước, buông binh khí nhận thua.`,
      `Đến hiệp thứ tư, ${ch} của bạn trúng ngực ${who}. Hắn ôm vết thương bỏ chạy không kịp.`,
      `Hai bên giằng co một hồi, cuối cùng ${who} sơ hở một nhịp và bị bạn hạ gục.`,
    ],
    close: [
      `Hai bên đều đẫm máu. Hiệp cuối bạn liều mạng tung ${ch}, ${who} gục trước bạn một hơi thở.`,
      `Bạn đã tưởng mình sẽ chết. Nhưng ${who} hụt chân một nhịp, và một nhịp là đủ.`,
      `Thắng mà tay vẫn run. Thêm một chiêu nữa, người nằm xuống có lẽ là bạn chứ không phải ${who}.`,
      `Bạn chống binh khí đứng dậy, nhìn ${who} nằm bất động. Trận này thắng bằng mạng.`,
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function dichThuRevenge(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Đại thù đã báo! Bạn hạ được ${who}.`,
    `${who} nằm dưới chân bạn, mắt trợn trừng không tin nổi. Mối hận bao năm, hôm nay trả đủ.`,
    `Bạn nhìn thẳng vào mắt ${who}: "Còn nhớ ta không?" Rồi ra đòn cuối. Nợ máu đã trả.`,
    `Lần trước bạn nằm, lần này là ${who}. Giang hồ xoay vòng, đại thù đã báo.`,
  ]);
}

export function dichThuDraw(who: string, m: Margin, rnd: Rnd): string {
  const tired = m === 'close';
  return pickLine(rnd, [
    `Năm hiệp chưa phân thắng bại, ${who} hừ lạnh rồi bỏ đi: "Lần sau gặp lại, ta lấy mạng ngươi."`,
    `Trời đổ mưa lớn, hai bên đều kiệt sức. ${who} quay lưng biến vào màn mưa.`,
    `Đánh tới lúc trăng lên vẫn bất phân thắng bại. ${who} nhổ một bãi máu: "Món nợ này còn dài."`,
    `Tiếng chuông chùa xa vọng lại, ${who} thu chiêu: "Hôm nay tha cho ngươi." Bạn biết hắn cũng chẳng còn sức.`,
    `Hai binh khí cùng mẻ một góc. Hai người nhìn nhau một lúc rồi mỗi người một ngả.`,
    `Quan binh kéo tới, ${who} phi thân lên mái nhà, để lại một câu: "Còn gặp lại."`,
    tired ? `Bạn thở dốc, chân đứng không vững. May mà ${who} cũng bị thương, lùi dần rồi biến mất trong rừng.` : `${who} thấy không làm gì được bạn, ném lại một cái nhìn đầy hận ý rồi bỏ đi.`,
  ]);
}

export function dichThuLose(who: string, lost: number, rnd: Rnd): string {
  return pickLine(rnd, [
    `Bạn thua ${who}, bị cướp ${lost} linh thạch, lết về trong trọng thương.`,
    `${who} đạp bạn xuống bùn, lục túi lấy ${lost} linh thạch rồi cười khẩy bỏ đi.`,
    `Bạn gục xuống. Lúc tỉnh dậy, ${who} đã đi, túi nhẹ hẳn ${lost} linh thạch, xương sườn gãy mấy cái.`,
    `Một chưởng của ${who} đánh bạn văng vào vách đá. Hắn nhặt ${lost} linh thạch: "Tiền mua mạng."`,
    `Bạn thua thảm. ${who} giẫm lên tay bạn, lấy ${lost} linh thạch. Nỗi nhục này khó quên.`,
  ]);
}

export function dichThuDeath(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Bạn bại dưới tay địch thủ ${who}. Giang hồ lại thêm một nấm mồ.`,
    `${who} rút binh khí khỏi ngực bạn, lau sạch máu rồi đi. Không ai quay đầu lại.`,
    `Chiêu cuối của ${who} đến quá nhanh. Bạn ngã xuống, mắt còn mở nhìn trời.`,
    `Xác bạn nằm bên vệ đường ba ngày mới có người chôn. Kẻ giết bạn là ${who}.`,
  ]);
}

/* ---------------- Đồng đạo luận võ ---------------- */
export function dongDaoWin(who: string, m: Margin, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      `Luận võ với ${who}, bạn thắng gọn gàng. ${who} chắp tay: "Bội phục, bội phục."`,
      `Ba chiêu đã phân cao thấp. ${who} cười khổ: "Hôm nay mới biết trời cao đất dày."`,
    ],
    mid: [
      `Luận võ với ${who}, bạn thắng một chiêu. Hai bên cười lớn, chia tay như bạn cũ.`,
      `Bạn hơn ${who} nửa bậc. Người ấy không giận, còn rủ bạn uống một chén.`,
    ],
    close: [
      `Đấu tới chiêu thứ chín mươi chín, bạn mới thắng được ${who} một nước. Cả hai ngồi phịch xuống đất mà cười.`,
      `Thắng ${who} trong gang tấc. Người ấy lau mồ hôi: "Lần sau ta sẽ thắng."`,
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function dongDaoDraw(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Năm hiệp bất phân thắng bại với ${who}. Bạn ngộ ra vài điều về võ học.`,
    `Đánh mãi không ai hơn ai, ${who} thu chiêu bật cười: "Kỳ phùng địch thủ!" Hai người cùng ngồi luận chiêu tới sáng.`,
    `Chiêu nào của bạn ${who} cũng đỡ được, chiêu nào của ${who} bạn cũng hóa giải. Hòa, nhưng bạn học được nhiều hơn một trận thắng.`,
  ]);
}

export function dongDaoLose(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `${who} hơn bạn một bậc. Thua tâm phục khẩu phục, bạn học được không ít.`,
    `${who} dừng tay ngay trước cổ bạn: "Chiêu vừa rồi hở sườn trái." Bạn đỏ mặt nhận thua.`,
    `Bạn bị đánh ngã ba lần. Lần thứ ba ${who} đưa tay kéo bạn dậy, chỉ cho bạn chỗ sai.`,
  ]);
}

export function swornLine(who: string, result: 'win' | 'lose' | 'draw', rnd: Rnd): string {
  const head = result === 'win' ? pickLine(rnd, ['Bạn thắng huynh đệ một chiêu', 'Bạn nhỉnh hơn huynh đệ nửa bước']) : result === 'draw' ? pickLine(rnd, ['Hai huynh đệ bất phân thắng bại', 'Hai người đánh tới mệt nhoài vẫn hòa']) : pickLine(rnd, ['Huynh đệ hơn bạn một chiêu', 'Bạn bị huynh đệ quật ngã, cả hai cười vang']);
  const tail = pickLine(rnd, [`${who} cười lớn, chỉ ra chỗ hở trong chiêu thức của bạn.`, `Tối đó hai người nướng thịt bên suối, ${who} giảng lại từng chiêu vừa đánh.`, `${who} vỗ vai bạn: "Năm sau tái đấu!"`]);
  return `${head}. ${tail} Cả hai cùng tiến`;
}

/* ---------------- Đồng môn ---------------- */
export function dongMonWin(who: string, daiBi: boolean, rnd: Rnd): string {
  return daiBi
    ? pickLine(rnd, [`Bạn thắng ${who} ở Đại bỉ tông môn, cả diễn võ trường vỡ òa.`, `Trên lôi đài Đại bỉ, ${who} bị bạn đánh văng khỏi vòng. Các sư đệ hò reo tên bạn.`, `Đại bỉ tông môn: bạn hạ ${who} trước mặt các trưởng lão. Có người đã bắt đầu gọi bạn là sư huynh.`])
    : pickLine(rnd, [`Bạn thắng đồng môn ${who} một chiêu.`, `So chiêu với ${who} ở sân sau, bạn thắng. ${who} hậm hực đi luyện công tới khuya.`, `${who} thua bạn, ngượng ngùng nói: "Sư huynh giấu nghề kỹ quá."`]);
}

export function dongMonDraw(who: string, rnd: Rnd): string {
  return pickLine(rnd, [`Hòa với ${who}. Trưởng lão đứng xem khẽ gật đầu.`, `Bạn và ${who} đánh tới khi trưởng lão gõ trượng bảo dừng. Hòa.`, `Hai người cùng xuất một chiêu, chiêu thức va nhau rồi tan. Hòa, cả sân im phăng phắc.`]);
}

export function dongMonLose(who: string, daiBi: boolean, rnd: Rnd): string {
  const tail = daiBi ? ' Đại bỉ lần này đành chờ kỳ sau.' : pickLine(rnd, [' Về luyện thêm thôi.', ' Sư phụ nhìn bạn, không nói gì. Thế còn khó chịu hơn bị mắng.', ' Đêm đó bạn ra sau núi luyện tới sáng.']);
  return pickLine(rnd, [`Bạn thua đồng môn ${who}.`, `${who} đánh rơi binh khí của bạn trước mặt cả sân.`, `Bạn bị ${who} ép lùi tới mép lôi đài rồi ngã xuống.`]) + tail;
}

/* ---------------- Bóng kiếp trước (tâm ma) ---------------- */
export function tamMaLine(name: string, result: 'win' | 'lose' | 'draw', rnd: Rnd): string {
  if (result === 'win')
    return pickLine(rnd, [
      `Bạn vượt qua bóng của ${name} kiếp trước. Nghiệp cũ tan như sương sớm, đạo tâm sáng rực.`,
      `Bóng ${name} kiếp trước mỉm cười lần cuối rồi vỡ thành ngàn mảnh sáng. Bạn thấy lòng nhẹ hẳn.`,
      `"Ta là ngươi, ngươi là ta." Bóng ${name} nói xong thì tan vào ngực bạn. Tâm ma đã hóa giải.`,
    ]);
  if (result === 'draw')
    return pickLine(rnd, [
      `Bóng kiếp trước lặng lẽ tan vào mặt hồ. Chưa thắng, cũng chưa thua. Nó sẽ còn quay lại.`,
      `Bạn và bóng ${name} cùng dừng tay. Nó nhìn bạn rất lâu rồi lùi vào sương mù.`,
      `Mặt hồ gợn sóng, bóng ${name} chìm xuống. Trong lòng bạn vẫn còn một nút thắt chưa gỡ.`,
    ]);
  return pickLine(rnd, [
    `Bạn thua chính mình kiếp trước. Tâm ma dâng lên, ngực đau như bị xé.`,
    `Bóng ${name} kiếp trước đè bạn xuống nước: "Ngươi vẫn yếu như xưa." Bạn sặc nước tỉnh dậy, tâm ma cuộn trào.`,
    `Bạn không dám ra đòn cuối với chính mình. Bóng ${name} thì dám. Ngực bạn đau như bị xé.`,
  ]);
}

/* ---------------- Quái chặn đường ---------------- */
export function ambushWin(mName: string, m: Margin, ch: string, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      `Bạn hạ được ${mName} chặn đường.`,
      `${mName} vừa lao tới đã trúng ${ch}, lăn ra chết tại chỗ.`,
      `Chưa hết một hiệp, ${mName} đã nằm im. Bạn phủi bụi đi tiếp.`,
    ],
    mid: [
      `Bạn hạ được ${mName} chặn đường.`,
      `${mName} cắn trượt, bạn nhân cơ hội tung ${ch}. Nó gục xuống.`,
      `Sau mấy hiệp giằng co, ${mName} trúng đòn chí mạng, kêu thét rồi gục ngã.`,
    ],
    close: [
      `Bạn hạ được ${mName} trong gang tấc, người đầy vết cào.`,
      `${mName} suýt cắn đứt cổ bạn. Bạn dồn hết sức tung ${ch}, nó gục trước bạn một khắc.`,
      `Trận này suýt mất mạng. Bạn ngồi bệt cạnh xác ${mName}, thở hổn hển hồi lâu.`,
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function ambushLose(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `${mName} đánh bạn trọng thương rồi bỏ đi`,
    `Bạn bị ${mName} quật ngã, nằm bất động giữa đường tới khi nó chán bỏ đi`,
    `${mName} vờn bạn như mèo vờn chuột, rồi bỏ lại bạn thoi thóp bên vệ cỏ`,
    `Bạn giả chết. ${mName} ngửi ngửi một hồi rồi bỏ đi, để lại bạn đầy thương tích`,
  ]);
}

export function ambushDrawWin(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Ba hiệp chưa phân thắng bại, ${mName} bị thương bỏ chạy.`,
    `${mName} rống lên một tiếng rồi tháo chạy vào rừng, để lại vệt máu dài.`,
    `Bạn đánh gãy một chân ${mName}, nó lết vào bụi rậm biến mất.`,
  ]);
}

export function ambushFlee(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Ba hiệp không hạ được ${mName}, bạn đành bỏ chạy, trúng một đòn sau lưng`,
    `Thấy không địch nổi, bạn quay đầu chạy. ${mName} đuổi theo cào một đường dài sau lưng`,
    `Bạn ném đá đánh lạc hướng rồi chạy thục mạng, vẫn bị ${mName} đuổi kịp cắn một miếng`,
    `Bạn nhảy xuống suối trốn ${mName}, bị nó vồ trúng vai trước khi kịp lặn`,
  ]);
}

/* ---------------- Trừ yêu thua (quái thường) ---------------- */
export function huntLose(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Bạn thua ${mName}, lết được về nhà, trọng thương.`,
    `${mName} quá mạnh. Bạn bò ra khỏi hang của nó, máu chảy suốt đường về.`,
    `Bạn bị ${mName} đánh ngất. Tỉnh dậy đã thấy mình nằm ở nhà, không nhớ ai đưa về.`,
    `Trừ yêu không thành, bạn bị ${mName} đuổi chạy ba dặm, trọng thương.`,
  ]);
}

export function huntDeath(mName: string, place: string, rnd: Rnd): string {
  return pickLine(rnd, [
    `Bạn bị ${mName} giết chết ở ${place}, thi thể không còn nguyên vẹn.`,
    `${mName} kéo xác bạn vào sâu trong ${place}. Không ai tìm thấy nữa.`,
    `Ở ${place}, ${mName} kết liễu bạn. Chỉ còn thanh binh khí gãy cắm trên đất.`,
  ]);
}
