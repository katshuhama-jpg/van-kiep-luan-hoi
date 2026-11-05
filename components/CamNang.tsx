'use client';
/**
 * Bản thứ Năm 5/11: Cẩm Nang Tu Tiên, hướng dẫn kiểu đọc truyện tranh.
 * Mỗi chương vài khung tranh: nền pixel, nhân vật LPC, ô dẫn truyện và bong bóng thoại. Chạm để lật trang.
 * Chương 1 tự mở lần đầu vào game; các chương khác tự mở đúng lúc (lên cảnh giới, chọn con đường, Luyện Hư, kiếp thứ hai);
 * mở lại bất cứ lúc nào từ menu.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Sprite from './Sprite';
import { MonsterSprite } from './Battle';
import { demoChar } from '@/lib/game/demo';
import { MONSTERS } from '@/lib/game/combat';
import { REALMS } from '@/lib/game/data';
import type { Anim } from '@/lib/lpc';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';

export type CnChapter = 'mot_kiep' | 'canh_gioi' | 'nga_re' | 'tong_mon' | 'danh_nhau' | 'phi_thang' | 'luan_hoi';
export const CN_ORDER: CnChapter[] = ['mot_kiep', 'canh_gioi', 'nga_re', 'tong_mon', 'danh_nhau', 'phi_thang', 'luan_hoi'];
const KEY = 'vkl.camnang';

export function cnSeen(): CnChapter[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function markSeen(id: CnChapter) {
  try {
    const s = new Set(cnSeen());
    s.add(id);
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {}
}

type Who = 'me' | 'thay' | 'nu' | 'hh' | 'kiem' | 'dan' | 'tran' | 'phat' | 'ma' | 'yeu' | 'tien';
interface Actor {
  who: Who;
  x: number; // % từ trái
  anim?: Anim;
  dir?: number;
  size?: number;
}
interface Panel {
  bg: string;
  cap: string;
  actors?: Actor[];
  say?: { i: number; text: string };
  extra?: 'sects3' | 'ranks' | 'sectsPath' | 'routes' | 'ladder' | 'paths' | 'doors' | 'lean' | 'bolt' | 'monster' | 'carry' | 'shadows' | 'focus';
}

const T = (vi: string, en: string) => tr(vi, en);

function chapters(): Record<CnChapter, { title: string; sub: string; panels: Panel[] }> {
  return {
    mot_kiep: {
      title: T('Hồi 1: Một kiếp người', 'Chapter 1: One lifetime'),
      sub: T('Thời gian, việc chính, lựa chọn', 'Time, focus, choices'),
      panels: [
        { bg: 'tu_luyen-0', cap: T('Bạn sinh ra là phàm nhân. Mỗi giây trôi qua là một năm đời người.', 'You are born a mortal. Every second that passes is a year of your life.'), actors: [{ who: 'me', x: 34 }, { who: 'thay', x: 70, dir: 1 }], say: { i: 1, text: T('Muốn sống lâu, phải tu tiên.', 'To live long, you must cultivate.') } },
        { bg: 'du_ngoan-0', cap: T('Chọn việc chính ở thanh dưới cùng. Mỗi việc dẫn tới một kiểu đời khác.', 'Pick your focus on the bottom bar. Each one leads to a different kind of life.'), actors: [{ who: 'me', x: 50, anim: 'walk', dir: 3 }], extra: 'focus' },
        { bg: 'ket_duyen-0', cap: T('Sự kiện hiện ra là lúc đời rẽ lối. Mỗi lựa chọn kéo đạo tâm về Chính, Trung hoặc Tà.', 'When an event appears, your life forks. Each choice pulls your Dao Heart toward Righteous, Neutral or Evil.'), actors: [{ who: 'me', x: 50 }], extra: 'lean' },
        { bg: 'tu_luyen-1', cap: T('Hết thọ, kiệt sức hay tâm ma đầy là hết kiếp. Thấy tâm ma cao thì đi Kết duyên hoặc uống Thanh Tâm Đan.', 'Run out of lifespan or health, or let heart demons fill up, and the life ends. When heart demons run high, try Romance or a Clear Mind Pill.'), actors: [{ who: 'me', x: 50, anim: 'hurt' }], say: { i: 0, text: T('Lòng ta loạn rồi...', 'My mind is in turmoil...') } },
      ],
    },
    canh_gioi: {
      title: T('Hồi 2: Thang cảnh giới', 'Chapter 2: The realm ladder'),
      sub: T('Đột phá, thiên kiếp, thọ nguyên', 'Breakthroughs, tribulations, lifespan'),
      panels: [
        { bg: 'tu_luyen-2', cap: T('Tu vi đầy thì đột phá lên tầng mới. Cảnh giới càng cao, thọ càng dài.', 'Fill your cultivation to break through. The higher the realm, the longer you live.'), extra: 'ladder' },
        { bg: 'loi-dinh', cap: T('Từ Kim Đan trở đi, mỗi lần lên cảnh giới phải chịu thiên kiếp. Thua là trọng thương, có khi mất mạng.', 'From Golden Core on, every new realm brings a heavenly tribulation. Fail and you are badly hurt, sometimes killed.'), actors: [{ who: 'me', x: 50, anim: 'spellcast' }], extra: 'bolt' },
        { bg: 'luyen_dan-1', cap: T('Trước khi độ kiếp: tâm cảnh cao, tâm ma thấp, có sẵn đan đột phá. Đan tu tự luyện được.', 'Before a tribulation: high Mind, low heart demons, and breakthrough pills ready. Alchemists can make their own.'), actors: [{ who: 'dan', x: 50, anim: 'spellcast' }] },
        { bg: 'tu_luyen-3', cap: T('Kẹt cảnh giới lâu là già chết. Thấy thọ còn ít thì dồn sức tu luyện, đừng mải chơi.', 'Stuck in one realm too long, you die of old age. When lifespan runs low, focus on cultivating.'), actors: [{ who: 'thay', x: 50 }], say: { i: 0, text: T('Thời gian không chờ ai.', 'Time waits for no one.') } },
      ],
    },
    nga_re: {
      title: T('Hồi 3: Ngã rẽ cuộc đời', 'Chapter 3: Crossroads'),
      sub: T('Con đường, đạo tâm, đạo lữ, kết cục', 'Path, Dao Heart, companion, endings'),
      panels: [
        { bg: 'du_ngoan-1', cap: T('Cuối Luyện Khí bạn chọn con đường tu. Chọn rồi không đổi được, cả đời đi theo nó.', 'Near the end of Qi Refining you choose a path. It is for life.'), extra: 'paths' },
        { bg: 'tien-0', cap: T('Đạo tâm quyết định bạn phi thăng về đâu. Sống chính trực lên Tiên giới, lưng chừng vào Thái Hư, tàn nhẫn rơi xuống Ma giới.', 'Your Dao Heart decides where you ascend. Live righteously for the Immortal Realm, stay in between for the Great Void, be ruthless for the Demon Realm.'), extra: 'doors' },
        { bg: 'ket_duyen-2', cap: T('Có đạo lữ thì Kết duyên thành song tu, tu vi vẫn lên. Chưa có thì đạo hữu tặng đan, chỉ điểm.', 'With a Dao companion, Romance becomes dual cultivation and still raises cultivation. Without one, friends give pills and advice.'), actors: [{ who: 'me', x: 36, dir: 3 }, { who: 'nu', x: 64, dir: 1 }], say: { i: 1, text: T('Cùng nhau đi tới cuối đường nhé.', "Let's walk to the end together.") } },
        { bg: 'kiem_tien-1', cap: T('Tông môn cho thầy dạy và thí luyện, nhưng có môn quy. Kẻ thù kiếp trước vẫn có thể tìm tới.', 'A sect gives teachers and trials, but has rules. Enemies from past lives may still find you.'), actors: [{ who: 'kiem', x: 30, dir: 3 }, { who: 'ma', x: 70, dir: 1 }], say: { i: 1, text: T('Ta nhớ mặt ngươi.', 'I remember your face.') } },
        { bg: 'dia-phu', cap: T('Mỗi lối sống dẫn tới một kết cục riêng trong Sổ Sinh Tử. Thử đi một đường khác ở kiếp sau.', 'Every way of living leads to its own ending in the Book of Life and Death. Try another road next life.'), actors: [{ who: 'thay', x: 50 }], say: { i: 0, text: T('Không có đường sai, chỉ có đường khác.', 'There is no wrong road, only a different one.') } },
      ],
    },
    tong_mon: {
      title: T('Hồi 4: Tông môn và chính tà', 'Chapter 4: Sects, righteous and evil'),
      sub: T('Bái sư, các phái, bậc đệ tử, môn quy, tán tu', 'Joining, factions, ranks, rules, rogue cultivators'),
      panels: [
        { bg: 'kiem_tien-0', cap: T('Tầm chín tới mười sáu tuổi, tiên nhân cưỡi hạc xuống trấn tuyển đệ tử. Vào tông hay ở lại làm tán tu là ngã rẽ lớn đầu tiên.', 'Somewhere between nine and sixteen, an immortal on a crane comes to town to recruit. Joining a sect or staying a rogue is your first big fork.'), actors: [{ who: 'me', x: 30, dir: 3 }, { who: 'thay', x: 70, dir: 1 }], say: { i: 1, text: T('Ai muốn cầu tiên đạo, bước lên.', 'Whoever seeks the immortal way, step forward.') } },
        { bg: 'tu_luyen-0', cap: T('Ba nhà mở cửa cùng lúc, mỗi nhà chọn người theo một kiểu. Linh căn, gan dạ hay trí tuệ, bạn có gì thì chọn nhà đó.', 'Three houses open their doors at once, each choosing people its own way. Root, nerve or wits: pick the one that fits what you have.'), extra: 'sects3' },
        { bg: 'tu_luyen-2', cap: T('Vào tông là đệ tử có bậc. Bậc càng cao tu càng nhanh, được phát áo bào, lệnh bài. Thắng Đại bỉ tông môn hoặc đột phá Trúc Cơ, Kim Đan là được thăng.', 'In a sect you hold a rank. Higher ranks cultivate faster and receive robes and tokens. Win the Sect Tournament or reach Foundation and Golden Core to be promoted.'), extra: 'ranks' },
        { bg: 'ma-0', cap: T('Ma môn không hỏi linh căn, chỉ hỏi bạn dám làm gì. Càng tàn nhẫn càng được trọng dụng, tu nhanh nhưng tâm ma nặng, lúc nguy không ai tới cứu.', 'Demonic sects ask nothing about your root, only what you dare to do. The crueler you are, the higher you rise. Fast cultivation, heavy heart demons, and no one saves you in danger.'), actors: [{ who: 'ma', x: 50 }], say: { i: 0, text: T('Muốn lên cao thì giẫm lên đồng môn.', 'To rise, step on your fellow disciples.') } },
        { bg: 'du_ngoan-3', cap: T('Lỡ dịp tuyển cũng đừng lo. Chọn con đường rồi, tông môn hợp đạo sẽ tự tìm tới bạn.', 'Missed the recruitment? No worry. Once you choose a path, a sect that suits it will come looking for you.'), extra: 'sectsPath' },
        { bg: 'kiem_tien-3', cap: T('Mỗi tông có môn quy. Đệ tử chính phái sa vào ma đạo bị trục xuất, mất áo bào lệnh bài. Ma môn cũng đuổi kẻ quay về Phật. Thiên Cơ Các không đuổi ai.', 'Every sect has rules. A righteous disciple who turns demonic is expelled and loses robe and token. Demonic sects expel those who turn to the Buddha. Tianji Pavilion expels no one.'), actors: [{ who: 'me', x: 34, anim: 'hurt', dir: 3 }, { who: 'thay', x: 68, dir: 1 }], say: { i: 1, text: T('Từ nay ngươi không còn là đệ tử của ta.', 'From today you are no longer my disciple.') } },
        { bg: 'du_ngoan-0', cap: T('Không vào tông vẫn tu được: tán tu tự do, không môn quy, nhưng không ai chống lưng. Mỗi hướng đi mở ra một kiểu đời khác.', 'You can cultivate without a sect: a rogue is free and has no rules, but no one has your back. Each road opens a different kind of life.'), extra: 'routes' },
      ],
    },
    danh_nhau: {
      title: T('Hồi 5: Trừ yêu luyện công', 'Chapter 5: Hunt and train'),
      sub: T('Quái, công pháp, trang bị', 'Monsters, techniques, gear'),
      panels: [
        { bg: 'du_ngoan-2', cap: T('Chọn Trừ yêu để đánh quái. Quái vừa sức cho nhiều tu vi và đồ rơi. Quái quá yếu gần như không rơi gì.', 'Pick Hunt demons to fight. Fair fights give cultivation and loot. Monsters far weaker than you drop almost nothing.'), actors: [{ who: 'kiem', x: 30, anim: 'slash', dir: 3 }], extra: 'monster' },
        { bg: 'tu_luyen-2', cap: T('Mở Công pháp ở thanh dưới để nâng tầng chiêu bằng tàn quyển. Mỗi bộ cần quyển riêng, nên nâng đều các ô.', 'Open Techniques on the bottom bar to raise moves with fragments. Each set needs its own, so level your slots evenly.'), actors: [{ who: 'me', x: 50, anim: 'spellcast' }] },
        { bg: 'kiem_tien-2', cap: T('Mặc đồ hợp con đường của mình trong Túi đồ. Mang đồ đi rèn để mạnh thêm.', 'Wear gear that suits your path in the Inventory. Forge it to grow stronger.'), actors: [{ who: 'tran', x: 50 }], say: { i: 0, text: T('Đồ tốt không bằng đồ hợp.', 'Fitting gear beats fancy gear.') } },
      ],
    },
    phi_thang: {
      title: T('Hồi 6: Mẹo phi thăng', 'Chapter 6: Ascension tips'),
      sub: T('Độ Kiếp, Ngũ Hành Đài, thượng giới', 'Tribulation, Five Elements Platform, upper realms'),
      panels: [
        { bg: 'nhd-tien-hoa', cap: T('Tới Độ Kiếp và đủ tuổi, bạn lên Ngũ Hành Đài đánh năm cái bóng của chính mình.', 'At Tribulation and old enough, you climb the Five Elements Platform to fight five shadows of yourself.'), extra: 'shadows' },
        { bg: 'nhd-tien-thuy', cap: T('Bóng cuối khắc hệ bản mệnh của bạn. Lúc chờ đủ tuổi, săn quái để gom Ngũ Hành Ấn và luyện công pháp.', 'The last shadow overcomes your element. While you wait, hunt for Five Elements Seals and train your techniques.'), actors: [{ who: 'kiem', x: 50, anim: 'slash' }] },
        { bg: 'loi-dinh', cap: T('Trước khi lên đài: tâm cảnh cao, tâm ma thấp, mang đủ đan. Đạo tâm lúc này quyết định cửa nào mở.', 'Before you climb: high Mind, low heart demons, plenty of pills. Your Dao Heart now decides which gate opens.'), actors: [{ who: 'me', x: 50, anim: 'spellcast' }], extra: 'bolt' },
        { bg: 'tien-0', cap: T('Lên thượng giới rồi vẫn xuống Hạ phàm được. Linh khí loãng không lên tu vi, nhưng săn đồ để kiếp sau mang theo.', 'After ascending you can still Descend. The thin qi gives no cultivation, but you can hunt gear for your next life.'), actors: [{ who: 'tien', x: 50 }], say: { i: 0, text: T('Nhặt chút quà cho kiếp sau.', 'A little gift for my next life.') } },
      ],
    },
    luan_hoi: {
      title: T('Hồi 7: Luân hồi', 'Chapter 7: Rebirth'),
      sub: T('Kiếp sau mang theo gì', 'What carries over'),
      panels: [
        { bg: 'dia-phu', cap: T('Chết chưa phải hết. Sống tốt thì được phúc duyên, sống ác thì mang nghiệp lực. Cả hai đều mua được thiên phú lúc đầu thai.', 'Death is not the end. Good deeds earn Fortune, cruel ones Karma. Both buy talents at rebirth.'), actors: [{ who: 'me', x: 50 }], extra: 'carry' },
        { bg: 'dia-phu', cap: T('Chiêu luyện tới tầng 9 truyền được cho kiếp sau. Vũ khí thành thần binh, linh thú bậc 3 để lại huyết mạch, rương chôn chờ bạn đào lên.', 'A move raised to stage 9 can be inherited. Your weapon can become a divine weapon, a stage-3 pet leaves a bloodline, and a buried chest waits for you.'), actors: [{ who: 'kiem', x: 50 }] },
        { bg: 'tu_luyen-0', cap: T('Kết cục và đồ hiếm gom vào Sổ Sinh Tử, Bảo khố, giữ qua mọi kiếp. Mỗi kiếp đi một đường để mở hết.', 'Endings and rare items go into the Book of Life and Death and the Treasury, kept forever. Walk a new road each life to unlock them all.'), actors: [{ who: 'me', x: 36, dir: 3 }, { who: 'thay', x: 66, dir: 1 }], say: { i: 1, text: T('Đi đi. Lần này đi đường khác xem.', 'Go. Try another road this time.') } },
      ],
    },
  };
}

function useCast(): Record<Who, Character> {
  return useMemo(
    () => ({
      me: demoChar({ age: 18, equipped: { ao: 'ao_vai' } }),
      thay: demoChar({ age: 90, realm: 5, equipped: { ao: 'bach_y' } }),
      nu: demoChar({ gender: 'nu', age: 20, equipped: { ao: 'thanh_sam' } }),
      hh: demoChar({ gender: 'nu', age: 22, daoTam: -30, equipped: { ao: 'huyet_bao' } }),
      kiem: demoChar({ path: 'kiem', age: 25, equipped: { ao: 'thanh_sam', vu_khi: 'thanh_phong' } }),
      dan: demoChar({ path: 'dan', age: 40, equipped: { ao: 'thanh_sam' } }),
      tran: demoChar({ path: 'tran', age: 40, equipped: { ao: 'ao_da_hanh' } }),
      phat: demoChar({ path: 'phat', age: 40, equipped: { ao: 'ca_sa' } }),
      ma: demoChar({ path: 'ma', age: 40, daoTam: -60, equipped: { ao: 'huyet_bao' } }),
      yeu: demoChar({ path: 'yeu', age: 30, gender: 'nu', equipped: { ao: 'ao_vo_si' } }),
      tien: demoChar({ age: 30, realm: 8, cosmos: 'tien', ascended: true, equipped: { ao: 'bach_y' } }),
    }),
    [],
  );
}

function Extra({ k, cast }: { k: NonNullable<Panel['extra']>; cast: Record<Who, Character> }): ReactNode {
  if (k === 'focus')
    return (
      <div className="cn-chips top">
        {[T('Tu luyện', 'Cultivate'), T('Du ngoạn', 'Wander'), T('Kiếm tiền', 'Earn'), T('Luyện đan', 'Alchemy'), T('Kết duyên', 'Romance'), T('Trừ yêu', 'Hunt')].map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    );
  if (k === 'lean')
    return (
      <div className="cn-lean">
        <span className="chinh">{T('Chính', 'Righteous')}</span>
        <span className="trung">{T('Trung', 'Neutral')}</span>
        <span className="ta">{T('Tà', 'Evil')}</span>
      </div>
    );
  if (k === 'sects3')
    return (
      <div className="cn-cards">
        <span className="chinh">
          <b>{T('Thanh Vân Tông', 'Qingyun Sect')}</b>
          <i>{T('Chính phái', 'Righteous')}</i>
          <small>{T('Xem linh căn. Căn tốt vào thẳng bậc cao, có thầy che chở.', 'Judges your root. A good root starts high, with a master to protect you.')}</small>
        </span>
        <span className="ta">
          <b>{T('Huyết Sát Môn', 'Xuesha Sect')}</b>
          <i>{T('Ma môn', 'Demonic')}</i>
          <small>{T('Ai cũng nhận. Đổi lại đạo tâm nghiêng về tà, tâm ma tăng.', 'Takes anyone. In return your Dao Heart tilts evil and heart demons grow.')}</small>
        </span>
        <span className="trung">
          <b>{T('Thiên Cơ Các', 'Tianji Pavilion')}</b>
          <i>{T('Trung lập', 'Neutral')}</i>
          <small>{T('Ra đề đố, xem ngộ tính. Người thông minh được trọng.', 'Sets riddles and judges Insight. The clever are valued.')}</small>
        </span>
      </div>
    );
  if (k === 'ranks')
    return (
      <div className="cn-ranks">
        {[T('Tạp dịch', 'Handyman'), T('Ngoại môn', 'Outer'), T('Nội môn', 'Inner'), T('Chân truyền', 'True')].map((r, i) => (
          <span key={r} style={{ height: 40 + i * 26 }}>
            <b>{r}</b>
          </span>
        ))}
        <em>{T('Chân truyền được sư phụ cứu một lần', 'A true disciple is saved once by the master')}</em>
      </div>
    );
  if (k === 'sectsPath') {
    const rows: [Who, string, string][] = [
      ['phat', T('Phổ Đà Sơn', 'Putuo Shan'), T('Phật tu, người hiền', 'Buddhists, the kind')],
      ['kiem', T('Kiếm Cốc', 'Jian Valley'), T('Kiếm tu', 'Sword cultivators')],
      ['dan', T('Vạn Độc Môn', 'Wandu Sect'), T('Đan, Ma tu lòng dạ độc', 'Ruthless Alchemists, Demonics')],
      ['yeu', T('Yêu Thần Điện', 'Yaoshen Hall'), T('Yêu tu, yêu tộc', 'Yao cultivators')],
      ['hh', T('Hợp Hoan Tông', 'Hehuan Sect'), T('người lệch về tà', 'those leaning evil')],
    ];
    return (
      <div className="cn-paths five">
        {rows.map(([w, n, d]) => (
          <span key={n}>
            <Sprite c={cast[w]} size={52} anim="idle" dir={2} />
            <b>{n}</b>
            <small>{d}</small>
          </span>
        ))}
      </div>
    );
  }
  if (k === 'routes')
    return (
      <div className="cn-routes">
        <span className="chinh">
          <b>{T('Chính phái', 'Righteous')}</b>
          <small>{T('chậm mà chắc, có thầy che chở, thường lên Tiên giới', 'slow but steady, protected, usually reach the Immortal Realm')}</small>
        </span>
        <span className="trung">
          <b>{T('Trung lập, tán tu', 'Neutral, rogue')}</b>
          <small>{T('tự do, dựa vào trí và vận, hay vào Thái Hư', 'free, live by wits and luck, often enter the Great Void')}</small>
        </span>
        <span className="ta">
          <b>{T('Tà phái', 'Evil')}</b>
          <small>{T('mạnh nhanh, nhiều kẻ thù, rơi xuống Ma giới', 'strong fast, many enemies, fall to the Demon Realm')}</small>
        </span>
      </div>
    );
  if (k === 'ladder')
    return (
      <div className="cn-ladder">
        {REALMS.slice(1, 8).map((r, i) => (
          <span key={r.name} style={{ height: 22 + i * 14 }}>
            <b>{r.name}</b>
          </span>
        ))}
      </div>
    );
  if (k === 'paths') {
    const rows: [Who, string, string][] = [
      ['kiem', T('Kiếm', 'Sword'), T('đánh mạnh, dễ chết trận', 'hits hard, dies in battle')],
      ['dan', T('Đan', 'Alchemy'), T('sống lâu, giàu, tự luyện đan', 'long life, rich, makes pills')],
      ['tran', T('Trận', 'Formation'), T('thủ chắc, bế quan an toàn', 'solid defense, safe seclusion')],
      ['phat', T('Phật', 'Buddhist'), T('ít tâm ma, kéo về Chính', 'few heart demons, leans Righteous')],
      ['ma', T('Ma', 'Demonic'), T('tu nhanh nhất, tâm ma nặng', 'fastest, heavy heart demons')],
      ['yeu', T('Yêu', 'Yao'), T('thân khỏe, sống thọ nhất', 'tough body, longest life')],
    ];
    return (
      <div className="cn-paths">
        {rows.map(([w, n, d]) => (
          <span key={w}>
            <Sprite c={cast[w]} size={52} anim="idle" dir={2} />
            <b>{n}</b>
            <small>{d}</small>
          </span>
        ))}
      </div>
    );
  }
  if (k === 'doors')
    return (
      <div className="cn-doors">
        <span className="tien">
          <i />
          <b>{T('Tiên giới', 'Immortal')}</b>
          <small>{T('Chính', 'Righteous')}</small>
        </span>
        <span className="hu">
          <i />
          <b>{T('Thái Hư', 'Great Void')}</b>
          <small>{T('Trung', 'Neutral')}</small>
        </span>
        <span className="ma">
          <i />
          <b>{T('Ma giới', 'Demon')}</b>
          <small>{T('Tà', 'Evil')}</small>
        </span>
      </div>
    );
  if (k === 'bolt')
    return (
      <svg className="cn-bolt" viewBox="0 0 12 30" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="6" y="0" width="3" height="8" fill="#fff6c8" />
        <rect x="4" y="8" width="3" height="6" fill="#ffe27a" />
        <rect x="6" y="14" width="3" height="6" fill="#fff6c8" />
        <rect x="3" y="20" width="3" height="10" fill="#ffe27a" />
      </svg>
    );
  if (k === 'monster') {
    const m = MONSTERS.find((x) => x.id === 'ngan_giac') ?? MONSTERS[0];
    return (
      <span className="cn-mon">
        <MonsterSprite m={m} size={110} tier={0} />
      </span>
    );
  }
  if (k === 'shadows')
    return (
      <div className="cn-shadows">
        {['#c8c8d0', '#4a8a3a', '#3a6ab0', '#c84a2a', '#a8803a'].map((col, i) => (
          <span key={col} style={{ ['--sc' as string]: col, animationDelay: `${i * 0.15}s` }}>
            <Sprite c={cast.me} size={56} anim="idle" dir={2} />
          </span>
        ))}
      </div>
    );
  if (k === 'carry')
    return (
      <div className="cn-carry">
        {[
          ['tien_tich_ngoc_phu', T('Phúc duyên', 'Fortune')],
          ['huyet_sat', T('Nghiệp lực', 'Karma')],
          ['g_kinh_thu_tan_quyen', T('Truyền thừa', 'Inheritance')],
          ['g_huyet_anh_dao', T('Huyết mạch', 'Bloodline')],
          ['van_co_bao', T('Rương chôn', 'Chest')],
        ].map(([ic, n]) => (
          <span key={ic}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/icons/${ic}.png`} width={40} height={40} alt="" />
            <b>{n}</b>
          </span>
        ))}
      </div>
    );
  return null;
}

/**
 * start: chương mở đầu (null = mục lục). only: chỉ đọc một chương rồi đóng (mở đúng lúc).
 */
export default function CamNang({ start, only, from, onClose }: { start: CnChapter | null; only?: boolean; from: string; onClose: () => void }) {
  const cast = useCast();
  const book = useMemo(chapters, []);
  const [ch, setCh] = useState<CnChapter | null>(start);
  const [pg, setPg] = useState(0);
  const [seen, setSeen] = useState<CnChapter[]>(() => cnSeen());
  const open = (id: CnChapter) => {
    setCh(id);
    setPg(0);
    track('camnang_open', { ch: id, from });
  };
  useEffect(() => {
    if (start) track('camnang_open', { ch: start, from });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => {
    if (ch) track('camnang_close', { ch, pg, of: book[ch].panels.length });
    onClose();
  };
  if (!ch)
    return (
      <div className="cn-wrap" role="dialog" aria-label={T('Cẩm nang tu tiên', 'Cultivation handbook')}>
        <div className="cn-index">
          <b className="cn-cover">{T('Cẩm Nang Tu Tiên', 'Cultivation Handbook')}</b>
          <small>{T('Truyện tranh ngắn, mỗi hồi chưa tới một phút', 'Short comics, under a minute each')}</small>
          {CN_ORDER.map((id) => (
            <button key={id} className={`cn-row ${seen.includes(id) ? 'seen' : ''}`} onClick={() => open(id)}>
              <b>{book[id].title}</b>
              <small>{book[id].sub}</small>
              {seen.includes(id) && <i>{T('đã đọc', 'read')}</i>}
            </button>
          ))}
          <button className="btn" onClick={close}>
            {T('Đóng', 'Close')}
          </button>
        </div>
      </div>
    );
  const chap = book[ch];
  const p = chap.panels[pg];
  const last = pg === chap.panels.length - 1;
  const ci = CN_ORDER.indexOf(ch);
  const next = () => {
    if (!last) return setPg(pg + 1);
    markSeen(ch);
    setSeen(cnSeen());
    track('camnang_done', { ch, from });
    if (only || ci === CN_ORDER.length - 1) return onClose();
    setCh(null);
  };
  const sayer = p.say ? p.actors?.[p.say.i] : undefined;
  return (
    <div className="cn-wrap" role="dialog" aria-label={chap.title}>
      <div className="cn-page">
        <div className="cn-head">
          <b>{chap.title}</b>
          <button className="cn-skip" onClick={close}>
            {T('Bỏ qua', 'Skip')}
          </button>
        </div>
        <button key={`${ch}-${pg}`} className="cn-panel" onClick={next} aria-label={T('Trang sau', 'Next page')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cn-bg" src={`/bg/${p.bg}.png`} alt="" />
          <span className="cn-cap">{p.cap}</span>
          {p.extra && <Extra k={p.extra} cast={cast} />}
          {p.actors?.map((a, i) => (
            <span key={i} className="cn-actor" style={{ left: `${a.x}%` }}>
              <Sprite c={cast[a.who]} size={a.size ?? 120} anim={a.anim ?? 'idle'} dir={a.dir ?? 2} />
            </span>
          ))}
          {p.say && sayer && (
            <span className={`cn-say ${sayer.x > 55 ? 'r' : 'l'}`} style={{ left: `${Math.min(70, Math.max(30, sayer.x))}%` }}>
              {p.say.text}
            </span>
          )}
          <span className="cn-tap">{last ? (only || ci === CN_ORDER.length - 1 ? T('Chạm để đóng', 'Tap to close') : T('Chạm để về mục lục', 'Tap for contents')) : T('Chạm để lật trang', 'Tap to turn the page')}</span>
        </button>
        <div className="cn-foot">
          <button className="chip-btn" disabled={pg === 0} onClick={() => setPg(pg - 1)} aria-label={T('Trang trước', 'Previous page')}>
            ‹
          </button>
          <span className="cn-dots" aria-hidden="true">
            {chap.panels.map((_, i) => (
              <i key={i} className={i === pg ? 'on' : i < pg ? 'past' : ''} />
            ))}
          </span>
          <button className="chip-btn" onClick={next} aria-label={T('Trang sau', 'Next page')}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
