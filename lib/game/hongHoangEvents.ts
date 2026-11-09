/**
 * 4.4.0 Hồng Hoang giới: sự kiện ngẫu nhiên theo từng bậc. Cửa ải (Trảm Tam Thi, xích Thiên Đạo, Vấn Thiên) ở hongHoang.ts.
 * Nhân vật thần thoại dùng tên có sẵn: Hồng Quân, Nữ Oa, Cộng Công, Quảng Thành Tử, Tiếp Dẫn, Chuẩn Đề, Côn Bằng, Đế Giang, Bàn Cổ.
 */
import { addCd, giveHg, loseDeTu } from './hongHoang';
import { addCult, dao, hurt, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

const s = (c: Character) => (c.hong ??= { from: 'tien', cd: 0, deTu: 0 });
const CT = 12;
const TN = 13;
const HN = 14;
const KT = 15;

function die(c: Character, ctx: EffectCtx, tag: string, cause: string) {
  c.dead = true;
  c.endTag = tag;
  c.cause = cause;
  ctx.fx('death');
}

const gain = (c: Character, x: number) => Math.round(addCult(c, reward(c, x)));

export const HG_EVENTS: GameEvent[] = [
  // ================= Chuẩn Thánh =================
  {
    id: 'hg_quang_thanh_thu',
    cosmos: 'hg',
    minRealm: CT,
    maxRealm: CT,
    weight: 30,
    cap: 2,
    title: tr('Thiên ngoại khách', 'A guest from beyond heaven'),
    text: () => tr('Quảng Thành Tử của Xiển giáo chặn đường, phất trần chỉ thẳng vào bạn: "Kẻ mới từ dưới kia lên. Để bần đạo xem ngươi được mấy cân."', 'Guangchengzi of the Chan teaching blocks your path, pointing his whisk straight at you: "A newcomer from down below. Let this poor Daoist see how much you weigh."'),
    choices: () => [
      { label: tr('Giao đấu', 'Fight him'), hint: tr('thắng được tu vi, thua bị thương', 'win cultivation, lose and get hurt'), lean: 'trung', run: (c, ctx) => {
        if (ctx.rnd() < 0.5 + c.stats.khiVan / 400) {
          addCd(c, 5);
          const g = gain(c, 1);
          return tr(`Ba trăm chiêu, phất trần của hắn rụng mất mấy sợi. Quảng Thành Tử chắp tay rút lui (+${g} tu vi).`, `Three hundred exchanges, and his whisk loses a few strands. Guangchengzi bows and withdraws (+${g} cultivation).`);
        }
        const h = hurt(c, 20, ctx);
        return tr('Phất trần quét qua, bạn lăn xuống chân mây.', 'The whisk sweeps past and you tumble off the cloud.') + h;
      } },
      { label: tr('Đàm đạo', 'Discuss the Dao'), hint: tr('cần tâm cảnh vững', 'needs a steady mind'), lean: 'chinh', run: (c) => {
        if (c.stats.tamCanh >= 60 || c.daoTam >= 20) {
          stat(c, 'ngoTinh', 3);
          const g = gain(c, 0.6);
          return tr(`Hai người ngồi luận đạo ba ngày ba đêm. Hắn bỏ đi, lẩm bẩm: "Không tệ." (+${g} tu vi, ngộ tính +3)`, `You sit and debate the Dao for three days and nights. He leaves muttering: "Not bad." (+${g} cultivation, insight +3)`);
        }
        stat(c, 'tamMa', 4);
        return tr('Hắn hỏi ba câu, bạn đáp không nổi câu nào. Tâm ma rục rịch.', 'He asks three questions and you cannot answer one. Your heart demon stirs.');
      } },
      { label: tr('Né đi', 'Avoid him'), lean: 'trung', run: (c) => {
        stat(c, 'tamMa', 3);
        return tr('Bạn đi đường vòng. Sau lưng có tiếng cười khẩy.', 'You take the long way round. Behind you, someone snickers.');
      } },
    ],
  },
  {
    id: 'hg_bat_chu',
    cosmos: 'hg',
    minRealm: CT,
    maxRealm: TN,
    weight: 25,
    once: true,
    title: tr('Bất Chu Sơn rung chuyển', 'Mount Buzhou shakes'),
    text: () => tr('Cộng Công thua trận, húc đầu vào Bất Chu Sơn. Cột chống trời nứt một đường, nước trời đổ xuống. Nữ Oa đang luyện đá Ngũ Sắc để vá trời, mồ hôi ướt đẫm.', 'Gonggong, beaten in battle, rams his head into Mount Buzhou. The pillar holding up the sky cracks, and heaven\'s water pours down. Nüwa is smelting Five-Color Stone to mend the sky, drenched in sweat.'),
    choices: () => [
      { label: tr('Giúp Nữ Oa vá trời', 'Help Nüwa mend the sky'), hint: tr('mất tu vi, thêm nhiều công đức, rất mệt', 'lose cultivation, much merit, exhausting'), lean: 'chinh', run: (c, ctx) => {
        if (c.stats.sucKhoe < 30) {
          die(c, ctx, 'hg_va_troi', tr('Đem chút sức cuối cùng vá trời cùng Nữ Oa, ngã xuống khi lỗ thủng vừa khép.', 'Spent your last strength mending the sky with Nüwa and fell just as the hole closed.'));
          return tr('Sức đã cạn từ trước. Viên đá cuối cùng đặt xong thì bạn cũng ngã xuống.', 'Your strength was already spent. You set the last stone, and fall.');
        }
        c.cultivation = Math.round(c.cultivation * 0.8);
        addCd(c, 20);
        s(c).nuOa = true;
        const h = hurt(c, 15, ctx);
        return tr('Bạn đội đá lên vai suốt bốn mươi chín ngày. Trời liền lại. Nữ Oa nhớ mặt bạn.', 'You carry stones on your shoulders for forty-nine days. The sky closes. Nüwa remembers your face.') + h;
      } },
      { label: tr('Cạy đá Ngũ Sắc', 'Pry off some Five-Color Stone'), hint: tr('được vũ khí, mất công đức', 'get a weapon, lose merit'), lean: 'ta', run: (c, ctx) => {
        addCd(c, -10);
        dao(c, -5);
        return tr('Nhân lúc hỗn loạn, bạn cạy một khối đá Ngũ Sắc mang về mài thành kiếm.', 'In the chaos, you pry off a block of Five-Color Stone and grind it into a sword.') + giveHg(c, 'hg_ngu_sac_kiem', ctx);
      } },
      { label: tr('Đánh Cộng Công', 'Fight Gonggong'), hint: tr('trận boss', 'a boss fight'), lean: 'chinh', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_cong_cong' };
        return tr('Bạn lao xuống chân núi, chặn trước mặt kẻ vừa húc đổ cột trời.', 'You dive to the foot of the mountain and stand before the one who just toppled the pillar of heaven.');
      } },
    ],
  },
  {
    id: 'hg_bong_kiep',
    cosmos: 'hg',
    minRealm: CT,
    maxRealm: CT,
    weight: 25,
    cap: 2,
    when: (c) => (c.hong?.yeu?.length ?? 0) < 3,
    title: tr('Bóng của chính mình', 'Your own shadow'),
    text: (c) => tr(`Giữa sương núi hiện ra một người mặc áo cũ. Là ${c.past?.name ?? 'bạn'}, kiếp trước của bạn. Người ấy hỏi: "Nếu được sống lại, ngươi có cứu ta không?"`, `A figure in old clothes appears in the mountain mist. It is ${c.past?.name ?? 'you'}, your past life. They ask: "If you could live it again, would you save me?"`),
    choices: () => [
      { label: tr('Có', 'Yes'), hint: tr('thiện thi yếu đi', 'the Good Corpse weakens'), lean: 'chinh', run: (c) => {
        s(c).yeu = [...new Set([...(s(c).yeu ?? []), 'thien' as const])];
        return tr('Bóng mỉm cười rồi tan. Trong người bạn, một thứ gì đó hiền lành bớt đi sức nặng.', 'The shadow smiles and fades. Inside you, something gentle grows lighter.');
      } },
      { label: tr('Không', 'No'), hint: tr('ác thi yếu đi', 'the Evil Corpse weakens'), lean: 'ta', run: (c) => {
        s(c).yeu = [...new Set([...(s(c).yeu ?? []), 'ac' as const])];
        return tr('Bóng gật đầu, như đã biết trước. Phần tàn nhẫn trong bạn bỗng thấy mình bị hiểu.', 'The shadow nods, as if it knew. The cruel part of you suddenly feels understood.');
      } },
      { label: tr('Im lặng', 'Stay silent'), hint: tr('chấp thi yếu đi', 'the Obsession Corpse weakens'), lean: 'trung', run: (c) => {
        s(c).yeu = [...new Set([...(s(c).yeu ?? []), 'chap' as const])];
        return tr('Hai người đứng nhìn nhau đến khi sương tan. Có câu hỏi không cần trả lời.', 'You stand looking at each other until the mist clears. Some questions need no answer.');
      } },
    ],
  },
  {
    id: 'hg_tu_tieu',
    cosmos: 'hg',
    minRealm: CT,
    weight: 18,
    cap: 6,
    cooldown: 30,
    title: tr('Hồng Quân giảng đạo', 'Hongjun lectures on the Dao'),
    text: (c) => tr(`Chuông Tử Tiêu Cung ngân. Hồng Quân lão tổ mở giảng, ba nghìn khách Hồng Hoang tranh nhau bồ đoàn.${(c.hong?.nghe ?? 0) >= 2 ? ' Bạn đã nghe nhiều lần, mỗi lần lại muốn ở lâu hơn.' : ''}`, `The bell of the Purple Firmament Palace rings. Patriarch Hongjun begins to lecture, and three thousand guests of Honghuang fight over prayer cushions.${(c.hong?.nghe ?? 0) >= 2 ? ' You have listened many times, and each time you want to stay longer.' : ''}`),
    choices: (c) => [
      { label: tr('Ngồi hàng đầu', 'Sit in the front row'), hint: tr('cần tu vi cao, ngộ nhiều', 'needs high cultivation, great insight'), lean: 'trung', run: (ch, ctx) => {
        s(ch).nghe = (s(ch).nghe ?? 0) + 1;
        if (ch.realm >= TN || ch.layer >= 2) {
          stat(ch, 'ngoTinh', 4);
          const g = gain(ch, 1.5);
          return tr(`Một câu của Hồng Quân bằng trăm năm tự ngộ (+${g} tu vi, ngộ tính +4).`, `One sentence from Hongjun is worth a hundred years of solitary insight (+${g} cultivation, insight +4).`);
        }
        const h = hurt(ch, 10, ctx);
        return tr('Đạo áp ở hàng đầu quá nặng, bạn bị đẩy văng ra cửa.', 'The Dao pressure in the front row is too heavy; you are flung out the door.') + h;
      } },
      { label: tr('Ngồi hàng cuối', 'Sit in the back row'), lean: 'trung', run: (ch) => {
        s(ch).nghe = (s(ch).nghe ?? 0) + 1;
        stat(ch, 'ngoTinh', 1);
        const g = gain(ch, 0.5);
        return tr(`Nghe không rõ lắm, nhưng vẫn hơn không (+${g} tu vi).`, `You cannot hear it all, but it is better than nothing (+${g} cultivation).`);
      } },
      { label: tr('Nhường bồ đoàn cho Tiếp Dẫn, Chuẩn Đề', 'Give your cushion to Jieyin and Zhunti'), hint: tr('thêm công đức, kết duyên', 'merit, and a bond'), lean: 'chinh', run: (ch) => {
        addCd(ch, 15);
        s(ch).tdHelp = true;
        return tr('Hai vị đạo nhân phương Tây khóc ròng cảm tạ, hứa ngày bạn Vấn Thiên sẽ đỡ thay một đạo lôi.', 'The two Daoists from the West weep with gratitude and promise to take one bolt for you on the day you Question Heaven.');
      } },
      ...((c.hong?.nghe ?? 0) >= 3
        ? [{ label: tr('Ở lại nghe mãi, không về nữa', 'Stay and listen forever'), hint: tr('kết thúc kiếp này', 'ends this life'), lean: 'trung' as const, run: (ch: Character, ctx: EffectCtx) => {
            die(ch, ctx, 'hg_nghe_giang', tr('Ngồi nghe Hồng Quân giảng ngàn năm, tọa hóa trên bồ đoàn lúc nào không hay.', 'Sat listening to Hongjun for a thousand years and passed away on the cushion without noticing.'));
            return tr('Bạn ngồi xuống bồ đoàn. Ngàn năm trôi qua như một buổi chiều.', 'You sit on the cushion. A thousand years pass like one afternoon.');
          } }]
        : []),
    ],
  },
  // ================= Thánh Nhân =================
  {
    id: 'hg_bai_su',
    cosmos: 'hg',
    minRealm: TN,
    weight: 45,
    cap: 8,
    cooldown: 8,
    title: tr('Xin bái sư', 'A request to become your disciple'),
    text: (c) => {
      const who = [tr('một đứa trẻ mồ côi ở chân Côn Lôn', 'an orphan from the foot of Kunlun'), tr('một tiểu yêu vừa hóa hình', 'a little yao that just took human form'), tr('một ma tu muốn bỏ tà theo chính', 'a demonic cultivator who wants to turn righteous')][Math.floor(c.age) % 3];
      return tr(`Trước cổng giáo có ${who} quỳ suốt ba ngày, xin được bái sư. Giáo của bạn đang có ${c.hong?.deTu ?? 0} đồ đệ.`, `Before your gate, ${who} has knelt for three days, begging to become your disciple. Your teaching has ${c.hong?.deTu ?? 0} disciples.`);
    },
    choices: () => [
      { label: tr('Nhận', 'Accept'), hint: tr('thêm đồ đệ', 'one more disciple'), lean: 'chinh', run: (c) => {
        const st = s(c);
        st.deTu += 1;
        st.deTuMax = Math.max(st.deTuMax ?? 0, st.deTu);
        addCd(c, 5);
        return tr(`Bạn đặt tay lên đầu người ấy. Giáo có thêm một đồ đệ (${st.deTu}).`, `You lay your hand on their head. Your teaching gains a disciple (${st.deTu}).`);
      } },
      { label: tr('Thử lòng trước', 'Test their heart first'), hint: tr('có thể không qua', 'they might fail'), lean: 'trung', run: (c, ctx) => {
        if (ctx.rnd() < 0.7) {
          const st = s(c);
          st.deTu += 1;
          st.deTuMax = Math.max(st.deTuMax ?? 0, st.deTu);
          addCd(c, 8);
          return tr(`Người ấy qua cả ba thử thách. Một đồ đệ đáng tin (${st.deTu}).`, `They pass all three trials. A disciple you can trust (${st.deTu}).`);
        }
        return tr('Người ấy bỏ đi giữa thử thách thứ hai.', 'They walk away in the middle of the second trial.');
      } },
      { label: tr('Đuổi đi', 'Send them away'), lean: 'trung', run: () => tr('Cổng đóng lại. Tiếng khóc xa dần.', 'The gate closes. The crying fades into the distance.') },
    ],
  },
  {
    id: 'hg_pt_1',
    cosmos: 'hg',
    minRealm: TN,
    weight: 60,
    once: true,
    when: (c) => !c.hong?.pt && (c.hong?.deTu ?? 0) >= 1,
    title: tr('Phong Thần bảng', 'The Investiture List'),
    text: () => tr('Hồng Quân triệu các giáo về Tử Tiêu Cung. Trên án thư là một tấm bảng vàng: "Đại kiếp sắp đến. Mỗi giáo phải nộp tên đồ đệ lên bảng. Ai lên bảng thì thành thần, đời đời không được tự do."', 'Hongjun summons every teaching to the Purple Firmament Palace. On the desk lies a golden list: "The great tribulation is coming. Every teaching must write its disciples\' names on this list. Those who are written become gods, never free again."'),
    choices: () => [
      { label: tr('Đến nghe chỉ', 'Go and hear the decree'), lean: 'trung', run: (c) => {
        s(c).pt = 1;
        return tr('Bạn đứng giữa các giáo chủ. Xiển giáo và Triệt giáo đã ký. Mọi ánh mắt quay sang bạn.', 'You stand among the founders. The Chan and Jie teachings have already signed. Every eye turns to you.');
      } },
      { label: tr('Giả như không nghe', 'Pretend you did not hear'), lean: 'trung', run: (c) => {
        s(c).pt = 1;
        stat(c, 'tamMa', 5);
        return tr('Bạn đóng cổng giáo. Ba ngày sau, tấm bảng tự tìm đến trước cửa.', 'You shut your gate. Three days later, the list finds its own way to your door.');
      } },
    ],
  },
  {
    id: 'hg_pt_2',
    cosmos: 'hg',
    minRealm: TN,
    weight: 80,
    once: true,
    when: (c) => c.hong?.pt === 1,
    title: tr('Ký hay không ký', 'Sign or not'),
    text: (c) => tr(`Phong Thần bảng nằm trước mặt bạn. Giáo đang có ${c.hong?.deTu ?? 0} đồ đệ.`, `The Investiture List lies before you. Your teaching has ${c.hong?.deTu ?? 0} disciples.`),
    choices: () => [
      { label: tr('Ký tên đồ đệ', 'Sign your disciples\' names'), hint: tr('mất nửa số đồ đệ, giáo yên ổn', 'lose half your disciples, your teaching is safe'), lean: 'trung', run: (c, ctx) => {
        const st = s(c);
        st.pt = 2;
        addCd(c, 20);
        const l = loseDeTu(c, Math.max(1, Math.ceil(st.deTu / 2)));
        return tr('Bạn đặt bút. Từng cái tên sáng lên rồi biến khỏi giáo của bạn.', 'You put brush to paper. Name after name glows, then vanishes from your teaching.') + l + giveHg(c, 'hg_phong_than_bang', ctx);
      } },
      { label: tr('Đứng ngoài', 'Stay out of it'), hint: tr('giáo bị các giáo khác nhắm', 'other teachings will target yours'), lean: 'trung', run: (c) => {
        s(c).pt = 3;
        return tr('Bạn đẩy tấm bảng trả lại. Hồng Quân không nói gì, nhưng Xiển giáo và Triệt giáo đã nhìn bạn khác đi.', 'You push the list back. Hongjun says nothing, but the Chan and Jie teachings look at you differently now.');
      } },
      { label: tr('Xé bảng', 'Tear the list'), hint: tr('trận boss, thua có thể mất mạng', 'a boss fight; losing may cost your life'), lean: 'ta', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_quang_thanh' };
        return tr('Bạn vươn tay xé bảng. Quảng Thành Tử rút kiếm chắn trước.', 'You reach to tear the list. Guangchengzi draws his sword to stop you.');
      } },
    ],
  },
  {
    id: 'hg_pt_3',
    cosmos: 'hg',
    minRealm: TN,
    weight: 80,
    once: true,
    when: (c) => c.hong?.pt === 3,
    title: tr('Đại kiếp Phong Thần', 'The Investiture tribulation'),
    text: () => tr('Xiển giáo và Triệt giáo kéo quân đến chân Côn Lôn: giáo nào không ký thì phải lên bảng bằng cách khác.', 'The Chan and Jie teachings march to the foot of Kunlun: any teaching that will not sign must get onto the list some other way.'),
    choices: () => [
      { label: tr('Tử chiến', 'Fight to the death'), hint: tr('thắng thì thêm công đức, thua mất đồ đệ', 'win merit, lose disciples'), lean: 'chinh', run: (c, ctx) => {
        s(c).pt = 5;
        if (ctx.rnd() < 0.55) {
          addCd(c, 15);
          return tr('Bạn đứng chắn cổng ba ngày ba đêm. Hai giáo rút quân.', 'You hold the gate for three days and nights. Both teachings withdraw.');
        }
        if (ctx.rnd() < 0.25) {
          die(c, ctx, 'hg_phong_than', tr('Đứng chắn cổng giáo trong đại kiếp Phong Thần, Thánh Nhân vẫn lạc.', 'Held the gate during the Investiture tribulation; a Saint fell.'));
          return tr('Bạn ngã xuống trước cổng giáo.', 'You fall before your gate.');
        }
        const l = loseDeTu(c, 1);
        const h = hurt(c, 30, ctx);
        return tr('Giữ được cổng, nhưng có người không về.', 'You hold the gate, but someone does not come back.') + l + h;
      } },
      { label: tr('Dẫn đồ đệ trốn vào Bắc Minh', 'Lead your disciples into hiding in Beiming'), hint: tr('đồ đệ an toàn, mất tu vi', 'disciples safe, lose cultivation'), lean: 'trung', run: (c) => {
        s(c).pt = 5;
        c.cultivation = Math.round(c.cultivation * 0.7);
        return tr('Cả giáo lặn xuống đáy Bắc Minh trăm năm. Khi trở lên, đại kiếp đã qua.', 'Your whole teaching dives to the bottom of Beiming for a hundred years. When you surface, the tribulation is over.');
      } },
    ],
  },
  {
    id: 'hg_thien_tai',
    cosmos: 'hg',
    minRealm: TN,
    weight: 25,
    cap: 3,
    cooldown: 20,
    title: tr('Thiên tai hạ giới', 'Calamity in the world below'),
    text: () => tr('Từ Hồng Hoang nhìn xuống, hạ giới đang có lũ lớn rồi dịch bệnh. Người chết như rạ.', 'Looking down from Honghuang, the world below is drowning in floods, then plague. People die like cut grass.'),
    choices: (c) => [
      { label: tr('Hạ phàm cứu người', 'Descend and save them'), hint: tr('tốn tu vi, nhiều công đức', 'costs cultivation, much merit'), lean: 'chinh', run: (ch) => {
        ch.cultivation = Math.round(ch.cultivation * 0.8);
        addCd(ch, 20);
        dao(ch, 5);
        return tr('Bạn ngăn lũ, chữa dịch, rồi lặng lẽ trở về. Ở hạ giới có thêm một ngôi miếu không biết thờ ai.', 'You stop the flood, cure the plague, then quietly return. Below, a new shrine appears to no one in particular.');
      } },
      ...((c.hong?.deTu ?? 0) > 0
        ? [{ label: tr('Sai đồ đệ đi', 'Send your disciples'), hint: tr('đồ đệ mạnh lên, có thể chết', 'they grow stronger, may die'), lean: 'trung' as const, run: (ch: Character, ctx: EffectCtx) => {
            addCd(ch, 10);
            if (ctx.rnd() < 0.6) return tr('Đồ đệ trở về, gầy đi nhưng mắt sáng hơn.', 'Your disciples return thinner, but with brighter eyes.');
            return tr('Một đồ đệ ở lại hạ giới mãi mãi.', 'One disciple stays below forever.') + loseDeTu(ch, 1);
          } }]
        : []),
      { label: tr('Mặc kệ', 'Ignore it'), lean: 'ta', run: (ch) => {
        addCd(ch, -5);
        return tr('Thánh nhân bất nhân, coi vạn vật như chó rơm.', 'The sage is not benevolent; he treats all things as straw dogs.');
      } },
    ],
  },
  {
    id: 'hg_phan_su',
    cosmos: 'hg',
    minRealm: TN,
    weight: 20,
    cap: 2,
    cooldown: 25,
    when: (c) => (c.hong?.deTu ?? 0) >= 2,
    title: tr('Đồ đệ phản sư', 'A disciple turns'),
    text: () => tr('Đồ đệ bạn tin nhất lén chép kinh điển của giáo, cấu kết với người ngoài. Bị bắt quả tang, hắn rút kiếm.', 'The disciple you trusted most has been secretly copying your scriptures and conspiring with outsiders. Caught in the act, he draws his sword.'),
    choices: () => [
      { label: tr('Thanh lý môn hộ', 'Purge the traitor'), hint: tr('trận boss, thua có thể mất mạng', 'a boss fight; losing may cost your life'), lean: 'trung', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_phan_do' };
        return tr('Bạn bước ra giữa sân.', 'You step into the middle of the courtyard.');
      } },
      { label: tr('Tha cho đi', 'Let him go'), lean: 'chinh', run: (c) => {
        stat(c, 'tamMa', 5);
        return tr('Bạn mở cổng. Hắn đi không ngoảnh lại.', 'You open the gate. He leaves without looking back.') + loseDeTu(c, 1);
      } },
      { label: tr('Tự kiểm điểm', 'Look at your own faults'), hint: tr('mất công đức, đồ đệ ở lại', 'lose merit, he stays'), lean: 'chinh', run: (c) => {
        addCd(c, -10);
        return tr('Bạn quỳ xuống trước đồ đệ: "Là sư phụ dạy chưa tới." Hắn buông kiếm, khóc.', 'You kneel before him: "I did not teach you well enough." He drops his sword and weeps.');
      } },
    ],
  },
  {
    id: 'hg_con_bang',
    cosmos: 'hg',
    minRealm: TN,
    maxRealm: HN,
    weight: 18,
    cap: 2,
    cooldown: 30,
    when: (c) => !c.hong?.boss?.includes('hg_con_bang'),
    title: tr('Côn Bằng hóa cánh', 'Kunpeng spreads its wings'),
    text: () => tr('Ở Bắc Minh Côn Uyên, cá Côn hóa chim Bằng, một cánh che kín nửa trời. Bóng cánh phủ tới đâu, đồ đệ trong giáo không dám thở tới đó.', 'In the Beiming Kun Abyss, the Kun fish becomes the Peng bird; one wing covers half the sky. Wherever its shadow falls, your disciples dare not breathe.'),
    choices: () => [
      { label: tr('Đánh Côn Bằng', 'Fight Kunpeng'), hint: tr('trận boss', 'a boss fight'), lean: 'trung', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_con_bang' };
        return tr('Bạn đạp mây lên chặn cánh Bằng.', 'You ride a cloud up to block the Peng\'s wing.');
      } },
      { label: tr('Đóng cổng chờ nó bay qua', 'Shut the gate and wait it out'), lean: 'trung', run: () => tr('Ba năm sau nó mới bay qua.', 'It takes three years to pass.') },
    ],
  },
  {
    id: 'hg_giao_diet',
    cosmos: 'hg',
    minRealm: TN,
    weight: 200,
    once: true,
    when: (c) => (c.hong?.deTuMax ?? 0) >= 2 && (c.hong?.deTu ?? 0) === 0,
    title: tr('Giáo không còn ai', 'No one left'),
    text: () => tr('Đồ đệ cuối cùng đã đi. Sân giáo phủ lá, chuông không ai gõ.', 'The last disciple is gone. Leaves cover the courtyard, and no one rings the bell.'),
    choices: () => [
      { label: tr('Một mình đi vào hư không', 'Walk alone into the void'), hint: tr('kết thúc kiếp này', 'ends this life'), lean: 'trung', run: (c, ctx) => {
        die(c, ctx, 'hg_giao_diet', tr('Giáo diệt, thánh nhân một mình đi vào hư không.', 'The teaching died out, and the Saint walked alone into the void.'));
        return tr('Bạn khép cổng giáo lần cuối rồi bước đi, không mang theo gì.', 'You close the gate one last time and walk away, taking nothing.');
      } },
      { label: tr('Thu đồ đệ lại từ đầu', 'Start taking disciples again'), lean: 'chinh', run: (c) => {
        stat(c, 'tamMa', 10);
        return tr('Bạn quét lá, treo lại tấm biển. Sẽ có người đến.', 'You sweep the leaves and hang the sign again. Someone will come.');
      } },
    ],
  },
  // ================= Hỗn Nguyên Đại La Kim Tiên =================
  {
    id: 'hg_set_den',
    cosmos: 'hg',
    minRealm: HN,
    weight: 25,
    cap: 4,
    cooldown: 15,
    title: tr('Sét đen', 'Black lightning'),
    text: () => tr('Kẻ đang chặt xích Thiên Đạo thì trời không để yên. Một đạo sét đen giáng xuống không báo trước.', 'Heaven gives no peace to one cutting its chains. A bolt of black lightning falls without warning.'),
    choices: () => [
      { label: tr('Đỡ', 'Take it'), hint: tr('mất máu, thêm tu vi', 'lose health, gain cultivation'), lean: 'trung', run: (c, ctx) => {
        const h = hurt(c, 25, ctx);
        const g = gain(c, 1);
        return tr(`Bạn đỡ trọn đạo sét, nuốt luôn lôi lực vào người (+${g} tu vi).`, `You take the whole bolt and swallow its power (+${g} cultivation).`) + h;
      } },
      { label: tr('Né', 'Dodge'), lean: 'trung', run: () => tr('Sét đánh trúng chỗ bạn vừa đứng, để lại một hố đen sâu hoắm.', 'It strikes where you just stood, leaving a deep black crater.') },
    ],
  },
  {
    id: 'hg_su_gia',
    cosmos: 'hg',
    minRealm: HN,
    weight: 30,
    cap: 3,
    cooldown: 20,
    when: (c) => !c.hong?.boss?.includes('hg_su_gia'),
    title: tr('Sứ giả Thiên Đạo', 'The Heavenly Dao\'s envoy'),
    text: () => tr('Một người cánh đen đáp xuống, mặt không có mắt mũi. "Thiên Đạo cần người giữ trật tự. Làm hành giả của trời thì sống mãi, khỏi phải chặt xích nào nữa."', 'A black-winged figure lands, its face without eyes or nose. "The Heavenly Dao needs someone to keep order. Become heaven\'s agent and live forever, with no more chains to cut."'),
    choices: () => [
      { label: tr('Nhận lời', 'Accept'), hint: tr('kết thúc kiếp này', 'ends this life'), lean: 'ta', run: (c, ctx) => {
        die(c, ctx, 'hg_hanh_gia', tr('Nhận lời sứ giả, làm hành giả của Thiên Đạo: sống mãi, không còn là mình.', 'Accepted the envoy\'s offer to serve the Heavenly Dao: living forever, no longer yourself.'));
        return tr('Đôi cánh đen mọc ra sau lưng bạn. Bạn quên mất mình định chặt xích để làm gì.', 'Black wings grow from your back. You forget why you wanted to cut the chains.');
      } },
      { label: tr('Từ chối', 'Refuse'), hint: tr('trận boss', 'a boss fight'), lean: 'chinh', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_su_gia' };
        return tr('"Vậy thì ngươi là mắt xích tiếp theo." Sứ giả rút kiếm.', '"Then you are the next link." The envoy draws its sword.');
      } },
    ],
  },
  {
    id: 'hg_kiep_cu',
    cosmos: 'hg',
    minRealm: HN,
    weight: 22,
    once: true,
    title: tr('Một kiếp cũ bị trói', 'A past life in chains'),
    text: (c) => tr(`Bạn thấy ${c.past?.name ?? 'một kiếp cũ của mình'} bị xích Thiên Đạo trói giữa hư không, đang bị xóa dần khỏi luân hồi.`, `You see ${c.past?.name ?? 'one of your past lives'} bound by the Heavenly Dao's chains in the void, slowly being erased from the wheel of rebirth.`),
    choices: () => [
      { label: tr('Cứu', 'Save them'), hint: tr('nhiều rủi ro', 'very risky'), lean: 'chinh', run: (c, ctx) => {
        if (ctx.rnd() < 0.5) {
          s(c).cuuKiep = true;
          const h = hurt(c, 20, ctx);
          return tr('Bạn giật đứt sợi xích. Kiếp cũ ngước lên nhìn bạn, rồi trở về luân hồi.', 'You tear the chain loose. Your past self looks up at you, then returns to the wheel.') + h;
        }
        const h = hurt(c, 40, ctx);
        return tr('Xích siết lại, bạn bị hất văng. Kiếp cũ vẫn mờ dần.', 'The chain tightens and flings you away. Your past self keeps fading.') + h;
      } },
      { label: tr('Bỏ mặc', 'Leave them'), lean: 'ta', run: (c) => {
        stat(c, 'tamMa', 8);
        return tr('Bạn quay đi. Đêm đó bạn mơ thấy chính mình bị xóa.', 'You turn away. That night you dream of being erased yourself.');
      } },
    ],
  },
  {
    id: 'hg_de_giang',
    cosmos: 'hg',
    minRealm: HN,
    weight: 18,
    cap: 2,
    cooldown: 30,
    when: (c) => !c.hong?.boss?.includes('hg_de_giang'),
    title: tr('Đế Giang múa trước Hỗn Độn', 'Dijiang dances before the Chaos'),
    text: () => tr('Ngoài Hỗn Độn, Đế Giang sáu chân bốn cánh, không mặt không mũi, đội một cái chuông vàng, múa mãi không ngừng.', 'Beyond the Chaos, Dijiang, six-legged and four-winged, faceless, wearing a golden bell on its head, dances without end.'),
    choices: () => [
      { label: tr('Đánh Đế Giang', 'Fight Dijiang'), hint: tr('trận boss', 'a boss fight'), lean: 'trung', run: (c) => {
        c.hgFight = { kind: 'boss', id: 'hg_de_giang' };
        return tr('Bạn bước vào vòng múa.', 'You step into the dance.');
      } },
      { label: tr('Ngồi xem múa', 'Sit and watch'), lean: 'trung', run: (c) => {
        stat(c, 'ngoTinh', 3);
        return tr('Xem ba năm, bạn hiểu vì sao hỗn độn không có mặt.', 'After three years of watching, you understand why chaos has no face.');
      } },
    ],
  },
  // ================= Khai Thiên =================
  {
    id: 'hg_ban_co',
    cosmos: 'hg',
    minRealm: KT,
    weight: 40,
    cap: 3,
    when: (c) => !c.inventory.includes('hg_ban_co_phu'),
    title: tr('Di cốt Bàn Cổ', 'Pangu\'s remains'),
    text: () => tr('Sâu trong Hỗn Độn, bạn gặp một bộ xương lớn như dãy núi. Bàn tay xương vẫn nắm cán một lưỡi rìu.', 'Deep in the Chaos you find a skeleton as large as a mountain range. Its bony hand still grips the haft of an axe.'),
    choices: () => [
      { label: tr('Gỡ lấy rìu', 'Take the axe'), lean: 'trung', run: (c, ctx) => tr('Bàn tay xương nới ra, như đã chờ người đến nhận.', 'The bony hand loosens, as if it had been waiting for someone.') + giveHg(c, 'hg_ban_co_phu', ctx) },
      { label: tr('Cúi lạy rồi đi', 'Bow and leave'), lean: 'chinh', run: (c) => {
        stat(c, 'ngoTinh', 5);
        const g = gain(c, 1);
        return tr(`Bạn lạy ba lạy. Trong đầu vang lên tiếng rìu bổ hỗn độn (+${g} tu vi).`, `You bow three times. In your head echoes the sound of an axe splitting chaos (+${g} cultivation).`);
      } },
    ],
  },
];
