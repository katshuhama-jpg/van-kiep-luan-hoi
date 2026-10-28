/**
 * Lời kể kết quả giao đấu: mỗi kết quả có nhiều câu, chọn theo thế trận (thắng áp đảo, thắng sát nút, hòa, thua)
 * và chiêu của con đường tu luyện, để thắng thua hòa không lặp đi lặp lại một câu.
 * Chỉ là lời kể. Số liệu thưởng phạt vẫn do duel.ts, ambush.ts, combat.ts tính rồi nối vào sau.
 */
import type { Character } from './types';
import { tr } from '../i18n';

type Rnd = () => number;
export const pickLine = <T,>(rnd: Rnd, arr: T[]): T => arr[Math.floor(rnd() * arr.length) % arr.length];

/** Thế trận theo tỉ lệ máu bạn mất: áp đảo, bình thường, sát nút */
export type Margin = 'crush' | 'mid' | 'close';
export const marginOf = (pLoss: number): Margin => (pLoss < 0.3 ? 'crush' : pLoss > 0.65 ? 'close' : 'mid');

/** Chiêu theo con đường tu luyện, để câu kể có màu riêng */
export function chieuOf(c: Character, rnd: Rnd): string {
  const by: Record<string, string[]> = {
    kiem: [tr('một đường kiếm', "a sword stroke"), tr('kiếm khí', "sword qi"), tr('một chiêu kiếm chém ngang', "a sweeping sword slash"), tr('mũi kiếm', "the point of a blade")],
    dan: [tr('một nắm độc phấn', "a fistful of poison powder"), tr('đan hỏa', "pill fire"), tr('một viên đan bạo liệt', "an exploding pill"), tr('làn khói thuốc', "a cloud of medicinal smoke")],
    tran: [tr('trận kỳ', "formation flags"), tr('một tòa tiểu trận', "a miniature formation"), tr('phù trận dưới chân', "a talisman array underfoot"), tr('trận pháp', "a formation")],
    phat: [tr('một chưởng Phật quang', "a palm of Buddha light"), tr('tràng hạt', "prayer beads"), tr('tiếng niệm Phật', "a Buddhist chant"), tr('Kim Cang chưởng', "the Vajra Palm")],
    ma: [tr('ma khí', "demonic qi"), tr('huyết trảo', "a blood claw"), tr('một chưởng âm hàn', "a palm of icy yin"), tr('ma công', "a demonic art")],
    yeu: [tr('yêu lực', "yao power"), tr('móng vuốt', "raking claws"), tr('tiếng gầm yêu thú', "a demon beast's roar"), tr('một cú quật đuôi', "a whipping tail")],
  };
  return pickLine(rnd, by[c.path ?? ''] ?? [tr('một quyền', "a punch"), tr('cú đá ngang', "a roundhouse kick"), tr('nắm đấm', "a fist"), tr('một chưởng', "a palm strike")]);
}

/* ---------------- Địch thủ ---------------- */
export function dichThuWin(who: string, m: Margin, ch: string, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      tr(`${who} chưa kịp ra chiêu thứ ba đã bị ${ch} của bạn đánh văng xuống đất.`, `${who} never got to a third move before ${ch} knocked them flat.`),
      tr(`Bạn ra tay như sấm sét. ${who} đỡ không nổi một chiêu, ngã quỵ giữa đường.`, `You strike like thunder. ${who} can't block a single move and crumples in the road.`),
      tr(`Chỉ vài hiệp, ${who} quỳ rạp, máu trào khóe miệng, không dám ngẩng lên nhìn bạn.`, `A few exchanges, and ${who} is on their knees, blood at the lips, not daring to look up at you.`),
      tr(`${who} vừa rút binh khí thì ${ch} đã tới trước mặt. Trận đấu kết thúc nhanh tới mức người xem chưa kịp hiểu.`, `${who} had barely drawn a weapon when ${ch} was already in their face. It ended so fast the onlookers never saw how.`),
    ],
    mid: [
      tr(`Bạn đánh bại địch thủ ${who}.`, `You defeat your rival ${who}.`),
      tr(`${who} lùi ba bước, buông binh khí nhận thua.`, `${who} staggers back three steps, drops their weapon and yields.`),
      tr(`Đến hiệp thứ tư, ${ch} của bạn trúng ngực ${who}. Hắn ôm vết thương bỏ chạy không kịp.`, `In the fourth exchange, ${ch} catches ${who} square in the chest. He clutches the wound, too slow even to flee.`),
      tr(`Hai bên giằng co một hồi, cuối cùng ${who} sơ hở một nhịp và bị bạn hạ gục.`, `The two of you are locked for a long while, until ${who} slips for a single beat and you cut them down.`),
    ],
    close: [
      tr(`Hai bên đều đẫm máu. Hiệp cuối bạn liều mạng tung ${ch}, ${who} gục trước bạn một hơi thở.`, `Both of you are soaked in blood. In the last exchange you gamble everything on ${ch}, and ${who} falls one breath before you would have.`),
      tr(`Bạn đã tưởng mình sẽ chết. Nhưng ${who} hụt chân một nhịp, và một nhịp là đủ.`, `You thought you would die. But ${who} misstepped for one beat, and one beat was enough.`),
      tr(`Thắng mà tay vẫn run. Thêm một chiêu nữa, người nằm xuống có lẽ là bạn chứ không phải ${who}.`, `You won, yet your hands still shake. One more move and it might have been you on the ground, not ${who}.`),
      tr(`Bạn chống binh khí đứng dậy, nhìn ${who} nằm bất động. Trận này thắng bằng mạng.`, `Leaning on your weapon, you rise and look at ${who} lying still. This one was paid for in blood.`),
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function dichThuRevenge(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Đại thù đã báo! Bạn hạ được ${who}.`, `Vengeance is yours! You have struck down ${who}.`),
    tr(`${who} nằm dưới chân bạn, mắt trợn trừng không tin nổi. Mối hận bao năm, hôm nay trả đủ.`, `${who} lies at your feet, eyes wide in disbelief. A grudge of many years, repaid in full today.`),
    tr(`Bạn nhìn thẳng vào mắt ${who}: "Còn nhớ ta không?" Rồi ra đòn cuối. Nợ máu đã trả.`, `You look ${who} dead in the eye: "Remember me?" Then the final blow. The blood debt is paid.`),
    tr(`Lần trước bạn nằm, lần này là ${who}. Giang hồ xoay vòng, đại thù đã báo.`, `Last time you were the one on the ground. This time it's ${who}. The jianghu turns, and vengeance is done.`),
  ]);
}

export function dichThuDraw(who: string, m: Margin, rnd: Rnd): string {
  const tired = m === 'close';
  return pickLine(rnd, [
    tr(`Năm hiệp chưa phân thắng bại, ${who} hừ lạnh rồi bỏ đi: "Lần sau gặp lại, ta lấy mạng ngươi."`, `Five exchanges and no winner. ${who} snorts coldly and leaves: "Next time we meet, your life is mine."`),
    tr(`Trời đổ mưa lớn, hai bên đều kiệt sức. ${who} quay lưng biến vào màn mưa.`, `A heavy rain breaks and both of you are spent. ${who} turns away and vanishes into the downpour.`),
    tr(`Đánh tới lúc trăng lên vẫn bất phân thắng bại. ${who} nhổ một bãi máu: "Món nợ này còn dài."`, `You fight until the moon rises, still dead even. ${who} spits out a mouthful of blood: "This debt is far from settled."`),
    tr(`Tiếng chuông chùa xa vọng lại, ${who} thu chiêu: "Hôm nay tha cho ngươi." Bạn biết hắn cũng chẳng còn sức.`, `A distant temple bell tolls. ${who} withdraws: "I'll spare you today." You know he has nothing left either.`),
    tr(`Hai binh khí cùng mẻ một góc. Hai người nhìn nhau một lúc rồi mỗi người một ngả.`, "Both weapons come away chipped. You stare at each other for a moment, then go your separate ways."),
    tr(`Quan binh kéo tới, ${who} phi thân lên mái nhà, để lại một câu: "Còn gặp lại."`, `Soldiers come running. ${who} leaps onto the rooftops, leaving only: "We'll meet again."`),
    tired ? tr(`Bạn thở dốc, chân đứng không vững. May mà ${who} cũng bị thương, lùi dần rồi biến mất trong rừng.`, `You're gasping, legs barely holding. Luckily ${who} is hurt too, backing away until they vanish into the forest.`) : tr(`${who} thấy không làm gì được bạn, ném lại một cái nhìn đầy hận ý rồi bỏ đi.`, `Seeing they can't get the better of you, ${who} throws you a look full of hatred and leaves.`),
  ]);
}

export function dichThuLose(who: string, lost: number, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Bạn thua ${who}, bị cướp ${lost} linh thạch, lết về trong trọng thương.`, `You lose to ${who}, who robs you of ${lost} spirit stones. You crawl home badly wounded.`),
    tr(`${who} đạp bạn xuống bùn, lục túi lấy ${lost} linh thạch rồi cười khẩy bỏ đi.`, `${who} kicks you into the mud, rifles your pouch for ${lost} spirit stones and walks off sneering.`),
    tr(`Bạn gục xuống. Lúc tỉnh dậy, ${who} đã đi, túi nhẹ hẳn ${lost} linh thạch, xương sườn gãy mấy cái.`, `You collapse. When you wake, ${who} is gone, your pouch ${lost} spirit stones lighter and a few ribs broken.`),
    tr(`Một chưởng của ${who} đánh bạn văng vào vách đá. Hắn nhặt ${lost} linh thạch: "Tiền mua mạng."`, `A palm from ${who} slams you into a cliff face. He pockets ${lost} spirit stones: "The price of your life."`),
    tr(`Bạn thua thảm. ${who} giẫm lên tay bạn, lấy ${lost} linh thạch. Nỗi nhục này khó quên.`, `A crushing defeat. ${who} grinds a heel on your hand and takes ${lost} spirit stones. This humiliation will not be easily forgotten.`),
  ]);
}

export function dichThuDeath(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Bạn bại dưới tay địch thủ ${who}. Giang hồ lại thêm một nấm mồ.`, `You fall at the hands of your rival ${who}. The jianghu gains one more grave.`),
    tr(`${who} rút binh khí khỏi ngực bạn, lau sạch máu rồi đi. Không ai quay đầu lại.`, `${who} pulls the blade from your chest, wipes it clean and walks away. No one looks back.`),
    tr(`Chiêu cuối của ${who} đến quá nhanh. Bạn ngã xuống, mắt còn mở nhìn trời.`, `The final move of ${who} comes too fast. You fall, eyes still open to the sky.`),
    tr(`Xác bạn nằm bên vệ đường ba ngày mới có người chôn. Kẻ giết bạn là ${who}.`, `Your body lies by the roadside three days before anyone buries it. Your killer was ${who}.`),
  ]);
}

/* ---------------- Đồng đạo luận võ ---------------- */
export function dongDaoWin(who: string, m: Margin, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      tr(`Luận võ với ${who}, bạn thắng gọn gàng. ${who} chắp tay: "Bội phục, bội phục."`, `Sparring with ${who}, you win cleanly. ${who} clasps their hands: "Impressive, truly impressive."`),
      tr(`Ba chiêu đã phân cao thấp. ${who} cười khổ: "Hôm nay mới biết trời cao đất dày."`, `Three moves settle who is stronger. ${who} smiles ruefully: "Only today do I learn how high the heavens are."`),
    ],
    mid: [
      tr(`Luận võ với ${who}, bạn thắng một chiêu. Hai bên cười lớn, chia tay như bạn cũ.`, `Sparring with ${who}, you win by a single move. You both laugh and part like old friends.`),
      tr(`Bạn hơn ${who} nửa bậc. Người ấy không giận, còn rủ bạn uống một chén.`, `You edge out ${who} by half a step. They aren't upset, and even invite you for a drink.`),
    ],
    close: [
      tr(`Đấu tới chiêu thứ chín mươi chín, bạn mới thắng được ${who} một nước. Cả hai ngồi phịch xuống đất mà cười.`, `Only on the ninety-ninth move do you finally beat ${who}. You both drop to the ground, laughing.`),
      tr(`Thắng ${who} trong gang tấc. Người ấy lau mồ hôi: "Lần sau ta sẽ thắng."`, `You beat ${who} by a hair. They wipe their brow: "Next time I'll win."`),
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function dongDaoDraw(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Năm hiệp bất phân thắng bại với ${who}. Bạn ngộ ra vài điều về võ học.`, `Five exchanges with ${who} and no winner. You come away with new insight into the martial way.`),
    tr(`Đánh mãi không ai hơn ai, ${who} thu chiêu bật cười: "Kỳ phùng địch thủ!" Hai người cùng ngồi luận chiêu tới sáng.`, `Neither can get the upper hand. ${who} withdraws, laughing: "A worthy rival at last!" The two of you sit and discuss moves until dawn.`),
    tr(`Chiêu nào của bạn ${who} cũng đỡ được, chiêu nào của ${who} bạn cũng hóa giải. Hòa, nhưng bạn học được nhiều hơn một trận thắng.`, `${who} blocks every move you make, and you undo every move ${who} makes. A draw, but you learned more than any win would teach.`),
  ]);
}

export function dongDaoLose(who: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`${who} hơn bạn một bậc. Thua tâm phục khẩu phục, bạn học được không ít.`, `${who} is a level above you. You lose, fully convinced, and learn quite a lot.`),
    tr(`${who} dừng tay ngay trước cổ bạn: "Chiêu vừa rồi hở sườn trái." Bạn đỏ mặt nhận thua.`, `${who} halts a hand's breadth from your throat: "That last move left your left flank open." Red-faced, you concede.`),
    tr(`Bạn bị đánh ngã ba lần. Lần thứ ba ${who} đưa tay kéo bạn dậy, chỉ cho bạn chỗ sai.`, `You get knocked down three times. The third time, ${who} pulls you up and shows you where you went wrong.`),
  ]);
}

export function swornLine(who: string, result: 'win' | 'lose' | 'draw', rnd: Rnd): string {
  const head = result === 'win' ? pickLine(rnd, [tr('Bạn thắng huynh đệ một chiêu', "You beat your sworn brother by one move"), tr('Bạn nhỉnh hơn huynh đệ nửa bước', "You edge out your sworn brother by half a step")]) : result === 'draw' ? pickLine(rnd, [tr('Hai huynh đệ bất phân thắng bại', "The sworn brothers fight to a draw"), tr('Hai người đánh tới mệt nhoài vẫn hòa', "You both fight to exhaustion and it's still a draw")]) : pickLine(rnd, [tr('Huynh đệ hơn bạn một chiêu', "Your sworn brother bests you by one move"), tr('Bạn bị huynh đệ quật ngã, cả hai cười vang', "Your sworn brother throws you flat, and you both roar with laughter")]);
  const tail = pickLine(rnd, [tr(`${who} cười lớn, chỉ ra chỗ hở trong chiêu thức của bạn.`, `${who} laughs heartily and points out the gaps in your technique.`), tr(`Tối đó hai người nướng thịt bên suối, ${who} giảng lại từng chiêu vừa đánh.`, `That night you roast meat by the stream while ${who} walks back through every move of the fight.`), tr(`${who} vỗ vai bạn: "Năm sau tái đấu!"`, `${who} claps you on the shoulder: "Rematch next year!"`)]);
  return tr(`${head}. ${tail} Cả hai cùng tiến`, `${head}. ${tail} You both grow stronger`);
}

/* ---------------- Đồng môn ---------------- */
export function dongMonWin(who: string, daiBi: boolean, rnd: Rnd): string {
  return daiBi
    ? pickLine(rnd, [tr(`Bạn thắng ${who} ở Đại bỉ tông môn, cả diễn võ trường vỡ òa.`, `You beat ${who} at the Grand Sect Tournament and the whole training ground erupts.`), tr(`Trên lôi đài Đại bỉ, ${who} bị bạn đánh văng khỏi vòng. Các sư đệ hò reo tên bạn.`, `On the Grand Tournament stage, you knock ${who} out of the ring. The junior disciples chant your name.`), tr(`Đại bỉ tông môn: bạn hạ ${who} trước mặt các trưởng lão. Có người đã bắt đầu gọi bạn là sư huynh.`, `Grand Sect Tournament: you take down ${who} before the elders. Some have already started calling you senior brother.`)])
    : pickLine(rnd, [tr(`Bạn thắng đồng môn ${who} một chiêu.`, `You beat fellow disciple ${who} by a single move.`), tr(`So chiêu với ${who} ở sân sau, bạn thắng. ${who} hậm hực đi luyện công tới khuya.`, `Trading moves with ${who} in the back courtyard, you win. ${who} storms off sulking to train late into the night.`), tr(`${who} thua bạn, ngượng ngùng nói: "Sư huynh giấu nghề kỹ quá."`, `${who} loses to you and mutters sheepishly: "Senior brother, you hid your skill well."`)]);
}

export function dongMonDraw(who: string, rnd: Rnd): string {
  return pickLine(rnd, [tr(`Hòa với ${who}. Trưởng lão đứng xem khẽ gật đầu.`, `A draw with ${who}. The watching elder gives a slight nod.`), tr(`Bạn và ${who} đánh tới khi trưởng lão gõ trượng bảo dừng. Hòa.`, `You and ${who} fight until the elder raps his staff to call a halt. A draw.`), tr(`Hai người cùng xuất một chiêu, chiêu thức va nhau rồi tan. Hòa, cả sân im phăng phắc.`, "You both strike at once; the moves collide and dissolve. A draw, and the whole courtyard goes silent.")]);
}

export function dongMonLose(who: string, daiBi: boolean, rnd: Rnd): string {
  const tail = daiBi ? tr(' Đại bỉ lần này đành chờ kỳ sau.', " The Grand Tournament will have to wait for next time.") : pickLine(rnd, [tr(' Về luyện thêm thôi.', " Back to training, then."), tr(' Sư phụ nhìn bạn, không nói gì. Thế còn khó chịu hơn bị mắng.', " Master looks at you and says nothing. Somehow that's worse than a scolding."), tr(' Đêm đó bạn ra sau núi luyện tới sáng.', " That night you train behind the mountain until dawn.")]);
  return pickLine(rnd, [tr(`Bạn thua đồng môn ${who}.`, `You lose to fellow disciple ${who}.`), tr(`${who} đánh rơi binh khí của bạn trước mặt cả sân.`, `${who} knocks the weapon from your hand in front of the whole courtyard.`), tr(`Bạn bị ${who} ép lùi tới mép lôi đài rồi ngã xuống.`, `${who} drives you back to the edge of the stage and you fall off.`)]) + tail;
}

/* ---------------- Bóng kiếp trước (tâm ma) ---------------- */
export function tamMaLine(name: string, result: 'win' | 'lose' | 'draw', rnd: Rnd): string {
  if (result === 'win')
    return pickLine(rnd, [
      tr(`Bạn vượt qua bóng của ${name} kiếp trước. Nghiệp cũ tan như sương sớm, đạo tâm sáng rực.`, `You overcome the shadow of your past life as ${name}. Old karma melts like morning mist, and your Dao Heart blazes bright.`),
      tr(`Bóng ${name} kiếp trước mỉm cười lần cuối rồi vỡ thành ngàn mảnh sáng. Bạn thấy lòng nhẹ hẳn.`, `The shadow of ${name} from your past life smiles one last time, then shatters into a thousand shards of light. Your heart feels lighter.`),
      tr(`"Ta là ngươi, ngươi là ta." Bóng ${name} nói xong thì tan vào ngực bạn. Tâm ma đã hóa giải.`, `"I am you, you are me." With that, the shadow of ${name} melts into your chest. The heart demon is dissolved.`),
    ]);
  if (result === 'draw')
    return pickLine(rnd, [
      tr(`Bóng kiếp trước lặng lẽ tan vào mặt hồ. Chưa thắng, cũng chưa thua. Nó sẽ còn quay lại.`, "The shadow of your past life quietly sinks into the lake. No win, no loss. It will be back."),
      tr(`Bạn và bóng ${name} cùng dừng tay. Nó nhìn bạn rất lâu rồi lùi vào sương mù.`, `You and the shadow of ${name} lower your hands at the same moment. It gazes at you a long time, then retreats into the mist.`),
      tr(`Mặt hồ gợn sóng, bóng ${name} chìm xuống. Trong lòng bạn vẫn còn một nút thắt chưa gỡ.`, `The lake ripples and the shadow of ${name} sinks away. A knot in your heart still remains untied.`),
    ]);
  return pickLine(rnd, [
    tr(`Bạn thua chính mình kiếp trước. Tâm ma dâng lên, ngực đau như bị xé.`, "You lose to your own past self. A heart demon surges up, and your chest aches as if torn apart."),
    tr(`Bóng ${name} kiếp trước đè bạn xuống nước: "Ngươi vẫn yếu như xưa." Bạn sặc nước tỉnh dậy, tâm ma cuộn trào.`, `The shadow of ${name} from your past life holds you under the water: "You're as weak as ever." You wake up choking, heart demon churning.`),
    tr(`Bạn không dám ra đòn cuối với chính mình. Bóng ${name} thì dám. Ngực bạn đau như bị xé.`, `You can't bring yourself to deal the final blow to yourself. The shadow of ${name} can. Your chest aches as if torn apart.`),
  ]);
}

/* ---------------- Quái chặn đường ---------------- */
export function ambushWin(mName: string, m: Margin, ch: string, rnd: Rnd): string {
  const pool: Record<Margin, string[]> = {
    crush: [
      tr(`Bạn hạ được ${mName} chặn đường.`, `You slay the ${mName} blocking your path.`),
      tr(`${mName} vừa lao tới đã trúng ${ch}, lăn ra chết tại chỗ.`, `The ${mName} lunges and takes ${ch} head-on, dropping dead on the spot.`),
      tr(`Chưa hết một hiệp, ${mName} đã nằm im. Bạn phủi bụi đi tiếp.`, `Before one exchange is done, the ${mName} lies still. You dust yourself off and move on.`),
    ],
    mid: [
      tr(`Bạn hạ được ${mName} chặn đường.`, `You slay the ${mName} blocking your path.`),
      tr(`${mName} cắn trượt, bạn nhân cơ hội tung ${ch}. Nó gục xuống.`, `The ${mName} snaps and misses, and you seize the opening with ${ch}. It goes down.`),
      tr(`Sau mấy hiệp giằng co, ${mName} trúng đòn chí mạng, kêu thét rồi gục ngã.`, `After a drawn-out struggle, the ${mName} takes a fatal blow, shrieks and collapses.`),
    ],
    close: [
      tr(`Bạn hạ được ${mName} trong gang tấc, người đầy vết cào.`, `You bring down the ${mName} by a hair, covered in claw marks.`),
      tr(`${mName} suýt cắn đứt cổ bạn. Bạn dồn hết sức tung ${ch}, nó gục trước bạn một khắc.`, `The ${mName} nearly tears your throat out. You pour everything into ${ch}, and it falls a moment before you would have.`),
      tr(`Trận này suýt mất mạng. Bạn ngồi bệt cạnh xác ${mName}, thở hổn hển hồi lâu.`, `That one nearly cost your life. You slump beside the ${mName}'s carcass, panting for a long while.`),
    ],
  };
  return pickLine(rnd, pool[m]);
}

export function ambushLose(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`${mName} đánh bạn trọng thương rồi bỏ đi`, `The ${mName} leaves you badly wounded and wanders off`),
    tr(`Bạn bị ${mName} quật ngã, nằm bất động giữa đường tới khi nó chán bỏ đi`, `The ${mName} throws you down, and you lie motionless in the road until it gets bored and leaves`),
    tr(`${mName} vờn bạn như mèo vờn chuột, rồi bỏ lại bạn thoi thóp bên vệ cỏ`, `The ${mName} toys with you like a cat with a mouse, then leaves you gasping in the grass`),
    tr(`Bạn giả chết. ${mName} ngửi ngửi một hồi rồi bỏ đi, để lại bạn đầy thương tích`, `You play dead. The ${mName} sniffs around for a while, then leaves you covered in wounds`),
  ]);
}

export function ambushDrawWin(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Ba hiệp chưa phân thắng bại, ${mName} bị thương bỏ chạy.`, `Three exchanges and no winner. The ${mName} is hurt and flees.`),
    tr(`${mName} rống lên một tiếng rồi tháo chạy vào rừng, để lại vệt máu dài.`, `The ${mName} lets out a roar and bolts into the forest, leaving a long trail of blood.`),
    tr(`Bạn đánh gãy một chân ${mName}, nó lết vào bụi rậm biến mất.`, `You break one of the ${mName}'s legs, and it drags itself into the thicket and disappears.`),
  ]);
}

export function ambushFlee(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Ba hiệp không hạ được ${mName}, bạn đành bỏ chạy, trúng một đòn sau lưng`, `Three exchanges and you still can't bring down the ${mName}. You flee, taking a hit in the back`),
    tr(`Thấy không địch nổi, bạn quay đầu chạy. ${mName} đuổi theo cào một đường dài sau lưng`, `Outmatched, you turn and run. The ${mName} gives chase and rakes a long gash down your back`),
    tr(`Bạn ném đá đánh lạc hướng rồi chạy thục mạng, vẫn bị ${mName} đuổi kịp cắn một miếng`, `You throw a stone as a distraction and run for your life, but the ${mName} still catches up and takes a bite`),
    tr(`Bạn nhảy xuống suối trốn ${mName}, bị nó vồ trúng vai trước khi kịp lặn`, `You dive into a stream to escape the ${mName}, but it gets your shoulder before you can go under`),
  ]);
}

/* ---------------- Trừ yêu thua (quái thường) ---------------- */
export function huntLose(mName: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Bạn thua ${mName}, lết được về nhà, trọng thương.`, `You lose to the ${mName} and drag yourself home, badly wounded.`),
    tr(`${mName} quá mạnh. Bạn bò ra khỏi hang của nó, máu chảy suốt đường về.`, `The ${mName} is too strong. You crawl out of its lair, bleeding all the way home.`),
    tr(`Bạn bị ${mName} đánh ngất. Tỉnh dậy đã thấy mình nằm ở nhà, không nhớ ai đưa về.`, `The ${mName} knocks you out. You wake up at home with no memory of who brought you back.`),
    tr(`Trừ yêu không thành, bạn bị ${mName} đuổi chạy ba dặm, trọng thương.`, `The hunt fails. The ${mName} chases you for three li, and you end up badly wounded.`),
  ]);
}

export function huntDeath(mName: string, place: string, rnd: Rnd): string {
  return pickLine(rnd, [
    tr(`Bạn bị ${mName} giết chết ở ${place}, thi thể không còn nguyên vẹn.`, `You are killed by the ${mName} at ${place}, your body torn apart.`),
    tr(`${mName} kéo xác bạn vào sâu trong ${place}. Không ai tìm thấy nữa.`, `The ${mName} drags your body deep into ${place}. No one ever finds it.`),
    tr(`Ở ${place}, ${mName} kết liễu bạn. Chỉ còn thanh binh khí gãy cắm trên đất.`, `At ${place}, the ${mName} finishes you. Only a broken weapon is left, stuck in the earth.`),
  ]);
}
