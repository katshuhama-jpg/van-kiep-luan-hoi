/**
 * 4.4.0 Hồng Hoang giới: thang cảnh giới mới sau chứng đạo, chung cho kẻ đến từ tiên, ma, hư giới.
 * Chuẩn Thánh (Trảm Tam Thi) → Thánh Nhân (lập giáo, Phong Thần) → Hỗn Nguyên Đại La Kim Tiên (chặt xích Thiên Đạo) → Khai Thiên (Vấn Thiên).
 * Kế hoạch: doc "Chân thân - nội dung và cách chơi", mục Hồng Hoang giới.
 */
import { HH_REALM, ITEMS, REALMS } from './data';
import { HH_SET_KT } from './gearHH';
import { addCult, dao, giveItem, hurt, money, needFor, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, HhFight, ThiKind } from './types';
import { tr } from '../i18n';

/** Engine gắn vào lúc khởi động để tránh vòng import (vào cảnh giới mới, chứng đạo tọa hóa kiểu cũ) */
export const hgApi: {
  enter?: (c: Character, realm: number, ctx: EffectCtx) => void;
  chungDao?: (c: Character, ctx: EffectCtx, hoDao: boolean) => string;
} = {};

export const HG_GATE_ID = '__hg_gate__';
export const HG_THI_ID = '__hg_thi__';
export const HG_XICH_ID = '__hg_xich__';
export const HG_VAN_THIEN_ID = '__hg_van_thien__';
export const HG_END_ID = '__hg_end__';
export const HG_TN_ID = '__hg_tn__';

/** Số đồ đệ cần để vượt Thánh Nhân, công đức cần */
export const TN_DE_TU = 3;
export const TN_CONG_DUC = 60;
/** Trận Hồng Hoang dài hơn trận chặn đường */
export const HG_TURNS = 14;
/** Vấn Thiên: số đạo lôi, số đạo cần đỡ */
export const VT_TOTAL = 9;
export const VT_NEED = 6;

const THI_ORDER: ThiKind[] = ['thien', 'ac', 'chap'];
export const THI_NAME: Record<ThiKind, string> = { thien: tr('Thiện thi', 'Good Corpse'), ac: tr('Ác thi', 'Evil Corpse'), chap: tr('Chấp thi', 'Obsession Corpse') };

const hg = (c: Character) => (c.hong ??= { from: 'tien', cd: 0, deTu: 0 });
const has = (c: Character, id: string) => c.inventory.includes(id);

/** Trao một món linh bảo Hồng Hoang (không trùng), trả câu báo */
export function giveHg(c: Character, id: string, ctx: EffectCtx): string {
  if (has(c, id)) return '';
  const it = ITEMS.find((i) => i.id === id);
  if (!it) return '';
  giveItem(c, id, false);
  ctx.fx('buy', it.name);
  return tr(` Bạn có được ${it.name}. Mở Túi đồ để mang.`, ` You obtain ${it.name}. Open your Inventory to equip it.`);
}

function hgDie(c: Character, ctx: EffectCtx, tag: string, cause: string) {
  c.dead = true;
  c.endTag = tag;
  c.cause = cause;
  ctx.fx('death');
}

export function addCd(c: Character, n: number) {
  const s = hg(c);
  s.cd = Math.max(0, s.cd + n);
}

/** Mất một đồ đệ. Phong Thần bảng đang mang thì cứu được một lần mỗi kiếp. */
export function loseDeTu(c: Character, n: number): string {
  const s = hg(c);
  if (s.deTu <= 0) return '';
  if (c.equipped.phu_kien === 'hg_phong_than_bang' && !s.ptUsed) {
    s.ptUsed = true;
    n -= 1;
    if (n <= 0) return tr(' Phong Thần bảng lóe sáng, giữ lại hồn đồ đệ vừa ngã xuống.', ' The Investiture List flares and holds back the soul of the disciple who just fell.');
  }
  const lost = Math.min(s.deTu, n);
  s.deTu -= lost;
  return tr(` Mất ${lost} đồ đệ, còn ${s.deTu}.`, ` You lose ${lost} disciple(s), ${s.deTu} left.`);
}

function addDeTu(c: Character, n = 1) {
  const s = hg(c);
  s.deTu += n;
  s.deTuMax = Math.max(s.deTuMax ?? 0, s.deTu);
}

// ---------------- Khe tím sau chứng đạo ----------------

function enterHongHoang(c: Character, ctx: EffectCtx, ban?: string): string {
  const from = c.cosmos === 'ma' || c.cosmos === 'hu' ? c.cosmos : 'tien';
  c.hong = { from, cd: 0, deTu: 0, ...(ban ? { ban } : {}) };
  c.hgGate = undefined;
  c.endTag = undefined;
  c.cosmos = 'hg';
  c.breakDelay = 0;
  c.suy = undefined;
  hgApi.enter?.(c, HH_REALM, ctx);
  stat(c, 'sucKhoe', 40);
  ctx.fx('breakthrough', tr('HỒNG HOANG', 'HONGHUANG'));
  const who = ban ? tr(` ${ban} nắm chặt tay bạn, cùng bước qua.`, ` ${ban} grips your hand and steps through with you.`) : '';
  return tr(
    `Bạn bước qua khe tím.${who} Phía sau Thiên Đạo là một bầu trời cổ hơn mọi bầu trời: núi Bất Chu chống trời, biển Bắc Minh không đáy, Tử Tiêu Cung lơ lửng trên mây. Ở đây chứng đạo chỉ là bậc đầu tiên. Bạn là Chuẩn Thánh, và trong người còn ba cái thi phải chém.`,
    `You step through the purple rift.${who} Behind the Heavenly Dao lies a sky older than every sky: Mount Buzhou holding up the heavens, the bottomless Beiming sea, the Purple Firmament Palace floating above the clouds. Here, attaining the Dao is only the first step. You are a Quasi-Saint, and three corpses inside you still await the blade.`,
  );
}

function gateEvent(c: Character): GameEvent {
  const hoDao = c.hgGate === 2;
  return {
    id: HG_GATE_ID,
    title: tr('Khe tím sau Thiên Đạo', 'The purple rift behind the Heavenly Dao'),
    text: () =>
      tr(
        `Đại kiếp đã qua. Trời vừa lặng thì nứt ra một khe tím, trong khe có tiếng gọi: "Phía sau Thiên Đạo còn một bầu trời khác." Ở lại thì bạn tọa hóa, đạo để cho đời sau. Bước qua thì mọi thứ phải làm lại từ đầu, quái ở đó mạnh hơn hẳn.${c.partner ? ` ${c.partner} vẫn đứng sau lưng bạn.` : ''}`,
        `The great tribulation is over. The moment the sky goes quiet, a purple rift opens, and a voice calls from inside: "Behind the Heavenly Dao there is another sky." Stay, and you pass away, leaving your Dao to those who come after. Step through, and everything starts again, with monsters far stronger than any before.${c.partner ? ` ${c.partner} still stands behind you.` : ''}`,
      ),
    choices: () => {
      const out: Choice[] = [
        {
          label: tr('Tọa hóa, để đạo lại cho đời sau', 'Pass away and leave your Dao to those after'),
          hint: tr('kết cục chứng đạo như cũ', 'the classic Dao ending'),
          lean: 'trung',
          run: (ch, ctx) => {
            ch.hgGate = undefined;
            return hgApi.chungDao?.(ch, ctx, hoDao) ?? '';
          },
        },
        {
          label: tr('Bước qua khe tím', 'Step through the purple rift'),
          hint: tr('vào Hồng Hoang, giữ cả bộ trang bị', 'enter Honghuang, keep all your gear'),
          lean: 'trung',
          run: (ch, ctx) => enterHongHoang(ch, ctx),
        },
      ];
      if (c.partner)
        out.push({
          label: tr(`Nắm tay ${c.partner}, cùng bước qua`, `Take ${c.partner}'s hand and step through together`),
          hint: tr('người thân kề vai trong các trận lớn', 'your beloved fights beside you in the great battles'),
          lean: 'chinh',
          run: (ch, ctx) => enterHongHoang(ch, ctx, ch.partner ?? undefined),
        });
      return out;
    },
  };
}

// ---------------- Chuẩn Thánh: Trảm Tam Thi ----------------

export function thiTarget(c: Character): ThiKind | null {
  if (c.realm !== HH_REALM) return null;
  return THI_ORDER[c.layer - 1] ?? null;
}

/** Thi lấy hình từ chính lịch sử người chơi */
export function thiFace(c: Character, k: ThiKind): string {
  const p = c.past;
  if (k === 'thien') return p && p.daoTam >= 20 ? tr(`${p.name}, kiếp ${p.lifeNo} của bạn, người từng sống tử tế nhất`, `${p.name}, your life ${p.lifeNo}, the kindest you ever were`) : tr('phần hiền lành nhất từng sống trong bạn', 'the gentlest part that ever lived in you');
  if (k === 'ac') return p && p.daoTam < 0 ? tr(`${p.name}, kiếp ${p.lifeNo} của bạn, kẻ từng ra tay tàn nhẫn nhất`, `${p.name}, your life ${p.lifeNo}, the cruelest you ever were`) : tr('phần tàn nhẫn nhất bạn từng giấu đi', 'the cruelest part you ever hid');
  if (p?.cause) return tr(`bóng ${p.name}, vẫn mang theo cái chết của kiếp trước: ${p.cause.length > 70 ? p.cause.slice(0, 68).trimEnd() + '...' : p.cause}`, `the shade of ${p.name}, still carrying last life's death: ${p.cause.length > 70 ? p.cause.slice(0, 68).trimEnd() + '...' : p.cause}`);
  return c.partner ? tr(`bóng ${c.partner}, thứ bạn không buông được`, `the shade of ${c.partner}, the thing you cannot let go`) : tr('nỗi sợ chết theo bạn qua mọi kiếp', 'the fear of death that followed you through every life');
}

function thiEvent(c: Character): GameEvent {
  const k = thiTarget(c) ?? 'thien';
  const weak = hg(c).yeu?.includes(k);
  return {
    id: HG_THI_ID,
    title: tr(`Trảm Tam Thi - ${THI_NAME[k]}`, `Slaying the Three Corpses - ${THI_NAME[k]}`),
    text: () =>
      tr(
        `Tu vi tầng này đã đầy. Muốn đi tiếp phải chém ${THI_NAME[k].toLowerCase()}. Nó bước ra khỏi người bạn: ${thiFace(c, k)}. Nó đánh đúng như bạn đánh.${weak ? ' Nó yếu hơn bạn tưởng, như đã nghe được câu trả lời của bạn từ trước.' : ''}`,
        `This layer is full. To go on, you must slay your ${THI_NAME[k]}. It steps out of you: ${thiFace(c, k)}. It fights exactly as you do.${weak ? ' It is weaker than you expected, as if it already heard your answer long ago.' : ''}`,
      ),
    choices: () => [
      {
        label: tr('Chém nó', 'Cut it down'),
        hint: tr('trận dễ hơn', 'the easier fight'),
        lean: 'trung',
        run: (ch) => {
          ch.hgFight = { kind: 'thi', id: k, mode: 'tram' };
          return tr('Bạn rút binh khí.', 'You draw your weapon.');
        },
      },
      {
        label: tr('Thu nó vào người', 'Take it back into yourself'),
        hint: tr('trận khó hơn, thắng thì giữ được sức của nó', 'a harder fight; win and keep its strength'),
        lean: 'trung',
        run: (ch) => {
          ch.hgFight = { kind: 'thi', id: k, mode: 'thu' };
          return tr('Bạn dang tay, không rút binh khí.', 'You open your arms and leave your weapon sheathed.');
        },
      },
      {
        label: tr('Chưa sẵn sàng', 'Not ready yet'),
        hint: tr('chờ thêm vài năm', 'wait a few more years'),
        lean: 'trung',
        run: (ch) => {
          ch.breakDelay = 5;
          return tr('Bạn ép nó trở vào trong. Nó cười, bảo sẽ chờ.', 'You force it back inside. It laughs and says it will wait.');
        },
      },
    ],
  };
}

/** Thắng một trận Trảm Thi: ghi lại, trao đồ, lên tầng hay lên Thánh Nhân */
function winThi(c: Character, k: ThiKind, mode: 'tram' | 'thu', ctx: EffectCtx): string {
  const s = hg(c);
  s.thi = { ...(s.thi ?? {}), [k]: mode };
  let t =
    mode === 'thu'
      ? k === 'thien'
        ? tr('Thiện thi tan vào ngực bạn. Lòng bạn lặng hẳn đi.', 'The Good Corpse melts into your chest. Your heart goes quiet.')
        : k === 'ac'
          ? tr('Ác thi gầm lên rồi chịu khuất. Sát khí của nó giờ là của bạn.', 'The Evil Corpse roars, then yields. Its killing intent is now yours.')
          : tr('Chấp thi ngồi xuống, tựa đầu vào vai bạn. Thứ bạn không buông được giờ thành sức mạnh.', 'The Obsession Corpse sits down and leans its head on your shoulder. What you could not let go has become strength.')
      : tr(`Một nhát chém, ${THI_NAME[k].toLowerCase()} tan thành khói. Nhẹ người hẳn.`, `One cut, and the ${THI_NAME[k]} turns to smoke. You feel much lighter.`);
  if (mode === 'thu') {
    if (k === 'thien') (stat(c, 'tamCanh', 15), stat(c, 'tamMa', -20));
    if (k === 'ac') stat(c, 'ngoTinh', 5);
  } else addCd(c, 10);
  const n = Object.keys(s.thi).length;
  if (n === 1) t += giveHg(c, 'hg_tram_thi_ho_lo', ctx);
  if (n === 2) t += giveHg(c, 'hg_tam_thi_bao', ctx);
  if (k === 'chap') {
    hgApi.enter?.(c, HH_REALM + 1, ctx);
    ctx.fx('breakthrough', tr('THÁNH NHÂN', 'SAINT'));
    t += tr(
      ` Ba thi đã xong. Trời đất rung lên chúc mừng một vị Thánh Nhân mới. Bạn lập giáo, mở sơn môn ở chân Côn Lôn. Thọ nguyên lên tới ${c.lifespan} năm.`,
      ` All three corpses are done. Heaven and earth tremble to greet a new Saint. You found your teaching and open a gate at the foot of Kunlun. Lifespan rises to ${c.lifespan} years.`,
    );
    t += giveHg(c, 'hg_lap_giao_y', ctx);
  } else {
    c.cultivation = 0;
    c.layer += 1;
    ctx.fx('layer', `${REALMS[c.realm].name}`);
  }
  return t;
}

function loseThi(c: Character, k: ThiKind, ctx: EffectCtx): string {
  if (ctx.rnd() < 0.3) {
    if (k === 'thien' && c.daoTam >= 60)
      hgDie(c, ctx, 'hg_thien_thi', tr('Thiện thi thắng. Nó mặc thân xác bạn đi giữa Hồng Hoang, tử tế hơn bạn từng sống.', 'The Good Corpse wins. It walks Honghuang in your body, kinder than you ever lived.'));
    else if (k === 'ac') hgDie(c, ctx, 'hg_ac_thi', tr('Ác thi thắng. Nó khoác thân xác bạn, thành ma đầu mới của Hồng Hoang.', 'The Evil Corpse wins. It wears your body and becomes Honghuang\'s newest demon lord.'));
    else hgDie(c, ctx, 'hg_tram_minh', tr(`Bị chính ${THI_NAME[k].toLowerCase()} của mình chém ngã giữa đường thành thánh.`, `Cut down by your own ${THI_NAME[k]} halfway to sainthood.`));
    return '';
  }
  c.cultivation = Math.round(c.cultivation * 0.7);
  c.breakDelay = 8;
  const h = hurt(c, 30, ctx);
  return tr(`${THI_NAME[k]} đánh bạn ngã quỵ rồi chui lại vào người. Phải tu thêm mới thử lại được.`, `The ${THI_NAME[k]} knocks you down and crawls back inside you. You must cultivate more before trying again.`) + h;
}

// ---------------- Thánh Nhân: cửa đột phá ----------------

export function tnReady(c: Character): string[] {
  const s = hg(c);
  const miss: string[] = [];
  if (s.deTu < TN_DE_TU) miss.push(tr(`có ít nhất ${TN_DE_TU} đồ đệ còn sống (đang có ${s.deTu})`, `at least ${TN_DE_TU} living disciples (you have ${s.deTu})`));
  if (s.cd < TN_CONG_DUC) miss.push(tr(`đủ ${TN_CONG_DUC} công đức (đang có ${s.cd})`, `${TN_CONG_DUC} merit (you have ${s.cd})`));
  if (!(s.pt === 2 || s.pt === 4 || s.pt === 5)) miss.push(tr('qua được đại kiếp Phong Thần', 'come through the Investiture tribulation'));
  return miss;
}

function tnEvent(c: Character): GameEvent {
  const miss = tnReady(c);
  return {
    id: HG_TN_ID,
    title: tr('Cửa Hỗn Nguyên', 'The Hunyuan gate'),
    text: () => tr(`Tu vi Thánh Nhân đã đầy, nhưng cửa Hỗn Nguyên chưa mở. Còn thiếu: ${miss.join('; ')}.`, `Your Saint cultivation is full, but the Hunyuan gate stays shut. Still missing: ${miss.join('; ')}.`),
    choices: () => [
      {
        label: tr('Củng cố, lo cho giáo', 'Consolidate and tend your teaching'),
        lean: 'trung',
        run: (ch) => {
          ch.breakDelay = 6;
          return tr('Bạn trở về giáo, giảng đạo cho đồ đệ.', 'You return to your teaching and lecture your disciples.');
        },
      },
    ],
  };
}

// ---------------- Hỗn Nguyên: chặt xích Thiên Đạo ----------------

function xichEvent(c: Character): GameEvent {
  const s = hg(c);
  const step = s.xich ?? 0;
  const debtor = c.enemy ?? c.past?.name ?? tr('một người bạn từng phụ', 'someone you once wronged');
  if (step === 0)
    return {
      id: HG_XICH_ID,
      title: tr('Xích Nhân Quả', 'The Chain of Karma'),
      text: () => tr(`Sợi xích đầu tiên của Thiên Đạo quấn quanh cổ chân bạn, mỗi mắt xích là một món nợ của các kiếp. Mắt xích nặng nhất mang tên ${debtor}.`, `The Heavenly Dao's first chain wraps your ankle; every link is a debt from your lives. The heaviest link bears the name ${debtor}.`),
      choices: () => [
        { label: tr('Trả bằng tu vi', 'Repay with cultivation'), hint: tr('mất nhiều tu vi, chắc chắn đứt', 'lose much cultivation, sure to break'), lean: 'chinh', run: (ch, ctx) => {
          ch.cultivation = Math.round(ch.cultivation * 0.4);
          return xichDone(ch, ctx, tr('Bạn trả từng món nợ bằng chính tu vi của mình. Mắt xích cuối cùng rơi xuống, kêu một tiếng trong veo.', 'You repay every debt with your own cultivation. The last link falls with a clear ring.'));
        } },
        { label: tr('Trả bằng linh thạch', 'Repay with spirit stones'), hint: tr('mất nửa linh thạch, có thể không đủ', 'lose half your stones, may not be enough'), lean: 'trung', run: (ch, ctx) => {
          const pay = Math.round(ch.linhThach / 2);
          money(ch, -pay);
          if (pay >= 20000 || ctx.rnd() < 0.5) return xichDone(ch, ctx, tr('Linh thạch đổ xuống như mưa. Nợ nào trả được bằng tiền thì đã trả.', 'Spirit stones pour down like rain. Every debt that money can pay is paid.'));
          ch.breakDelay = 6;
          return tr('Có những món nợ tiền không trả được. Sợi xích vẫn còn đó.', 'Some debts cannot be paid with money. The chain is still there.');
        } },
        { label: tr('Chém đứt, không trả', 'Cut it, pay nothing'), hint: tr('không mất gì, dễ phản phệ', 'costs nothing, may backfire'), lean: 'ta', run: (ch, ctx) => {
          dao(ch, -10);
          if (ctx.rnd() < 0.6) return xichDone(ch, ctx, tr('Một kiếm, xích đứt. Nợ thì vẫn còn, chỉ là không ai đòi được nữa.', 'One stroke, and the chain snaps. The debts remain; there is just no one left who can collect.'));
          stat(ch, 'tamMa', 15);
          ch.breakDelay = 6;
          const h = hurt(ch, 35, ctx);
          return tr('Xích bật ngược, quất vào ngực bạn.', 'The chain whips back across your chest.') + h;
        } },
      ],
    };
  if (step === 1)
    return {
      id: HG_XICH_ID,
      title: tr('Xích Thọ Nguyên', 'The Chain of Lifespan'),
      text: () => tr('Sợi xích thứ hai là thọ nguyên. Thiên Đạo đòi cắt bớt đời bạn, trừ khi bạn đổi bằng thứ khác.', 'The second chain is lifespan. The Heavenly Dao demands to cut your life short, unless you trade something else.'),
      choices: () => [
        { label: tr('Đổi bằng tu vi', 'Trade cultivation'), lean: 'trung', run: (ch, ctx) => {
          ch.cultivation = 0;
          return xichDone(ch, ctx, tr('Tu vi tầng này tan sạch. Thọ nguyên còn nguyên.', 'This layer\'s cultivation vanishes. Your lifespan stays whole.'));
        } },
        ...(hg(c).deTu > 0
          ? [{ label: tr('Đổi bằng một đồ đệ', 'Trade a disciple'), hint: tr('đồ đệ chết thay', 'a disciple dies in your place'), lean: 'ta' as const, run: (ch: Character, ctx: EffectCtx) => {
              dao(ch, -15);
              const l = loseDeTu(ch, 1);
              return xichDone(ch, ctx, tr('Một đồ đệ quỳ xuống nhận thay phần của bạn.', 'A disciple kneels and takes your share.') + l);
            } }]
          : []),
        { label: tr('Không đổi gì, để trời cắt', 'Trade nothing, let heaven cut'), hint: tr('thọ nguyên giảm mạnh', 'a big lifespan loss'), lean: 'chinh', run: (ch, ctx) => {
          ch.lifespan = Math.max(ch.age + 60, ch.lifespan - 1200);
          return xichDone(ch, ctx, tr(`Thiên Đạo cắt đi một đoạn đời. Thọ nguyên còn ${ch.lifespan} năm, nhưng xích đã đứt.`, `The Heavenly Dao cuts away a stretch of your life. Lifespan now ${ch.lifespan} years, but the chain is broken.`));
        } },
      ],
    };
  const q = s.quen ?? 0;
  return {
    id: HG_XICH_ID,
    title: tr('Xích Danh', 'The Chain of Name'),
    text: () => tr(`Sợi xích cuối là cái tên. Thiên Đạo xóa dần tên bạn khỏi trí nhớ chúng sinh.${q ? ' Lần trước đã có người quên.' : ''} Phải khiến ít nhất một người còn nhớ.`, `The last chain is your name. The Heavenly Dao is erasing it from every mind.${q ? ' Last time, someone already forgot.' : ''} You must make at least one person remember.`),
    choices: () => {
      const out: Choice[] = [];
      if (c.partner || hg(c).ban) out.push({ label: tr(`Tìm ${hg(c).ban ?? c.partner}`, `Find ${hg(c).ban ?? c.partner}`), hint: tr('dễ nhất', 'the surest'), lean: 'chinh', run: (ch, ctx) => danhTry(ch, ctx, 0.8, tr('Người ấy nhìn bạn rất lâu rồi gọi đúng tên bạn.', 'They look at you for a long time, then say your name.')) });
      if (hg(c).deTu > 0) out.push({ label: tr('Về thăm giáo', 'Visit your teaching'), lean: 'trung', run: (ch, ctx) => danhTry(ch, ctx, 0.7, tr('Đồ đệ nhỏ nhất chạy ra: "Sư phụ về rồi!"', 'Your youngest disciple runs out: "Master is back!"')) });
      out.push({ label: tr('Khắc tên lên Bất Chu Sơn', 'Carve your name into Mount Buzhou'), hint: tr('nhờ công đức', 'relies on merit'), lean: 'trung', run: (ch, ctx) => danhTry(ch, ctx, Math.min(0.75, 0.35 + hg(ch).cd / 400), tr('Tên khắc vào đá chống trời. Người qua núi đọc lên, và nhớ.', 'The name is carved into the stone that holds up heaven. Travelers read it aloud, and remember.')) });
      return out;
    },
  };
}

function danhTry(c: Character, ctx: EffectCtx, p: number, ok: string): string {
  if (ctx.rnd() < p) return xichDone(c, ctx, ok);
  const s = hg(c);
  s.quen = (s.quen ?? 0) + 1;
  if (s.quen >= 2) {
    hgDie(c, ctx, 'hg_vo_danh', tr('Thiên Đạo xóa xong cái tên. Không ai còn nhớ từng có bạn, kể cả chính bạn.', 'The Heavenly Dao finishes erasing the name. No one remembers you ever existed, not even you.'));
    return '';
  }
  c.breakDelay = 8;
  return tr('Người ấy nhìn bạn như nhìn người lạ. Tên bạn mờ thêm một nét.', 'They look at you like a stranger. Your name fades one more stroke.');
}

function xichDone(c: Character, ctx: EffectCtx, text: string): string {
  const s = hg(c);
  s.xich = (s.xich ?? 0) + 1;
  let t = text;
  if (s.xich === 1) t += giveHg(c, 'hg_nhan_qua_kinh', ctx);
  if (s.xich === 3) {
    t += giveHg(c, 'hg_vo_danh_y', ctx);
    hgApi.enter?.(c, HH_REALM + 3, ctx);
    ctx.fx('breakthrough', tr('KHAI THIÊN', 'WORLD OPENER'));
    t += tr(` Ba xích đã đứt. Bạn đứng ngoài mọi quy tắc của trời, thành bậc Khai Thiên. Thọ nguyên lên tới ${c.lifespan} năm.`, ` All three chains are broken. You stand outside every rule of heaven, a World Opener. Lifespan rises to ${c.lifespan} years.`);
    t += giveHg(c, 'hg_tao_hoa_diep', ctx);
  } else {
    c.cultivation = 0;
    c.layer += 1;
    ctx.fx('layer', REALMS[c.realm].name);
  }
  return t;
}

// ---------------- Khai Thiên: Vấn Thiên ----------------

function vanThienEvent(c: Character): GameEvent {
  return {
    id: HG_VAN_THIEN_ID,
    title: tr('Vấn Thiên', 'Questioning Heaven'),
    text: () =>
      tr(
        `Tu vi Khai Thiên đã đầy. Muốn tạo ra trời của riêng mình thì phải hỏi tội trời cũ. Chín đạo thiên lôi trước, đỡ được ít nhất ${VT_NEED} đạo thì Thiên Đạo (Hồng Quân đã hợp đạo) mới hiện thân.${hg(c).deTu ? ` ${hg(c).deTu} đồ đệ đứng sau lưng bạn.` : ''}`,
        `Your World Opener cultivation is full. To make a heaven of your own, you must put the old one on trial. Nine bolts first; block at least ${VT_NEED} and the Heavenly Dao (Hongjun, merged with the Dao) will show itself.${hg(c).deTu ? ` ${hg(c).deTu} disciples stand behind you.` : ''}`,
      ),
    choices: () => [
      { label: tr('Vấn Thiên', 'Question Heaven'), hint: tr(`9 đạo lôi rồi đánh Thiên Đạo`, '9 bolts, then fight the Heavenly Dao'), lean: 'trung', run: () => '' },
      { label: tr('Củng cố thêm', 'Consolidate more'), lean: 'trung', run: (ch) => {
        ch.breakDelay = 10;
        return tr('Bạn ngồi xuống, chờ một ngày trời quang hơn.', 'You sit down to wait for a clearer day.');
      } },
    ],
  };
}

/** Kết quả chín đạo lôi Vấn Thiên (gọi từ giao diện) */
export function vanThienLoi(c: Character, blocked: number, ctx: EffectCtx): string {
  const s = hg(c);
  s.tdTry = (s.tdTry ?? 0) + 1;
  const help = s.tdHelp && blocked < VT_TOTAL ? 1 : 0;
  blocked += help;
  const helpT = help ? tr(' Tiếp Dẫn, Chuẩn Đề giữ lời, đỡ thay một đạo.', ' Jieyin and Zhunti keep their word and take one bolt for you.') : '';
  if (blocked >= VT_NEED) {
    c.hgFight = { kind: 'thien_dao', id: 'hg_thien_dao' };
    return tr(`Đỡ được ${blocked}/${VT_TOTAL} đạo lôi.${helpT} Bầu trời mở ra một con mắt vàng.`, `You block ${blocked}/${VT_TOTAL} bolts.${helpT} The sky opens a golden eye.`);
  }
  c.breakDelay = 15;
  c.cultivation = Math.round(c.cultivation * 0.7);
  const h = hurt(c, 40, ctx);
  return tr(`Chỉ đỡ được ${blocked}/${VT_TOTAL} đạo lôi.${helpT} Thiên Đạo chưa thèm hiện thân.`, `Only ${blocked}/${VT_TOTAL} bolts blocked.${helpT} The Heavenly Dao does not even bother to appear.`) + h;
}

function endEvent(): GameEvent {
  return {
    id: HG_END_ID,
    title: tr('Sau Vấn Thiên', 'After Questioning Heaven'),
    text: (c) => tr('Con mắt vàng nhắm lại lần cuối. Hồng Quân thở dài: "Ghế này để trống thì trời sập. Ngươi tính sao?"', 'The golden eye closes for the last time. Hongjun sighs: "If this seat stays empty, heaven falls. What will you do?"') + (c.partner ? tr(` ${c.partner} chờ bạn ở chân Côn Lôn.`, ` ${c.partner} waits for you at the foot of Kunlun.`) : ''),
    choices: (c) => {
      const out: Choice[] = [
        { label: tr('Khai Thiên Lập Địa', 'Open Heaven, Found Earth'), hint: tr('mở ra một thế giới mới mang tên bạn', 'open a new world bearing your name'), lean: 'chinh', run: (ch, ctx) => {
          hgDie(ch, ctx, 'hg_khai_thien', tr(`Một nhát tách hỗn độn, mở ra thế giới mới mang tên ${ch.name}.`, `Split chaos with one stroke and opened a new world bearing the name ${ch.name}.`));
          return tr(`Bạn vung tay. Hỗn độn tách làm đôi, nhẹ bay lên thành trời, nặng chìm xuống thành đất. Thế giới mới mang tên ${ch.name}, tên ấy khắc lên bia đá đầu tiên.`, `You strike. Chaos splits in two: the light rises into sky, the heavy sinks into earth. The new world bears the name ${ch.name}, carved into its first stone.`);
        } },
        { label: tr('Ngồi vào chỗ Thiên Đạo', 'Take the Heavenly Dao\'s seat'), hint: tr('thành trời của trời cũ', 'become the old heaven\'s heaven'), lean: 'ta', run: (ch, ctx) => {
          hgDie(ch, ctx, 'hg_thien_dao', tr('Ngồi vào ghế Thiên Đạo, mắt vàng mở ra trên mọi bầu trời.', 'Took the Heavenly Dao\'s seat; a golden eye opened over every sky.'));
          return tr('Bạn ngồi xuống. Từ nay mỗi đạo lôi kiếp nơi phàm giới đều là bạn giáng xuống.', 'You sit. From now on, every tribulation bolt in the mortal world falls by your hand.');
        } },
      ];
      if (c.partner || hg(c).cuuKiep)
        out.push({ label: tr('Buông hết, về làm người', 'Let it all go and be human'), hint: tr('?', '?'), lean: 'trung', run: (ch, ctx) => {
          hgDie(ch, ctx, 'hg_pham_nhan', tr('Thắng cả trời rồi buông hết, về làm một người cày ruộng.', 'Beat heaven itself, then let it all go to become a farmer.'));
          return tr(`Bạn buông tay. Sáng hôm sau, ở một làng nhỏ dưới chân núi, có người thấy ${ch.partner ? `${ch.partner} và ` : ''}một người lạ đang cày ruộng, cười rất hiền.`, `You let go. Next morning, in a small village below the mountain, someone sees ${ch.partner ? `${ch.partner} and ` : ''}a stranger plowing a field, smiling gently.`);
        } });
      return out;
    },
  };
}

// ---------------- Trận Hồng Hoang ----------------

/** Kết quả trận Hồng Hoang. Trả về lời kể; có thể mở thẻ kết thúc (HG_END_ID) qua c.hgEnd */
export function finishHgFight(c: Character, f: HhFight, result: 'win' | 'lose' | 'draw', ctx: EffectCtx): { text: string; next?: string } {
  const s = hg(c);
  if (f.kind === 'thi') {
    const k = f.id as ThiKind;
    if (result === 'win') return { text: winThi(c, k, f.mode ?? 'tram', ctx) };
    return { text: loseThi(c, k, ctx) };
  }
  if (f.kind === 'thien_dao') {
    if (result === 'win') return { text: tr('Thiên Đạo lùi lại một bước. Lần đầu tiên từ thuở khai thiên, trời thua.', 'The Heavenly Dao takes one step back. For the first time since creation, heaven loses.'), next: HG_END_ID };
    c.breakDelay = 15;
    c.cultivation = Math.round(c.cultivation * 0.6);
    const h = hurt(c, 45, ctx);
    return { text: tr('Con mắt vàng nhìn xuống, bạn bị ép quỳ. Còn sống là may.', 'The golden eye looks down and forces you to your knees. Surviving is luck enough.') + h };
  }
  // boss
  const win = result === 'win';
  s.boss = win ? [...new Set([...(s.boss ?? []), f.id])] : s.boss;
  switch (f.id) {
    case 'hg_cong_cong':
      if (win) return { text: (addCd(c, 15), tr('Cộng Công ngã xuống chân núi. Nữ Oa gật đầu với bạn từ xa.', 'Gonggong falls at the foot of the mountain. Nüwa nods to you from afar.')) + giveHg(c, 'hg_ngu_sac_kiem', ctx) };
      break;
    case 'hg_con_bang':
      if (win) return { text: (addCd(c, 10), tr('Côn Bằng thu cánh, lặn xuống đáy Bắc Minh. Trên mặt nước nổi lên một thanh kiếm.', 'Kunpeng folds its wings and dives to the bottom of Beiming. A sword floats up to the surface.')) + giveHg(c, 'hg_thanh_binh_kiem', ctx) };
      break;
    case 'hg_quang_thanh':
      if (win) {
        s.pt = 4;
        addCd(c, 20);
        return { text: tr('Quảng Thành Tử thua, Phong Thần bảng bị bạn xé làm đôi. Không đồ đệ nào của bạn phải lên bảng.', 'Guangchengzi loses, and you tear the Investiture List in two. None of your disciples will be written on it.') + giveHg(c, 'hg_thanh_binh_kiem', ctx) };
      }
      if (ctx.rnd() < 0.4) {
        hgDie(c, ctx, 'hg_phong_than', tr('Xé Phong Thần bảng không thành, Thánh Nhân vẫn lạc giữa đại kiếp.', 'Failed to tear the Investiture List; a Saint fell in the great tribulation.'));
        return { text: '' };
      }
      s.pt = 3;
      return { text: tr('Bạn thua, bảng vẫn nguyên. Hai đồ đệ chắn đòn cho bạn.', 'You lose and the list stays whole. Two disciples take the blows for you.') + loseDeTu(c, 2) };
    case 'hg_phan_do':
      if (win) return { text: tr('Bạn thanh lý môn hộ. Giáo yên trở lại, nhưng ít đi một người.', 'You purge the traitor. Your teaching is quiet again, one person fewer.') + loseDeTu(c, 1) };
      if (ctx.rnd() < 0.4) {
        hgDie(c, ctx, 'hg_phan_sat', tr('Bị chính đồ đệ mình dạy dỗ phản sát.', 'Slain by the very disciple you raised.'));
        return { text: '' };
      }
      return { text: tr('Đồ đệ phản sư bỏ trốn, mang theo một nửa kinh điển của giáo.', 'The traitor flees with half your teaching\'s scriptures.') + loseDeTu(c, 1) + hurt(c, 25, ctx) };
    case 'hg_su_gia':
      if (win) return { text: tr('Sứ giả vỡ tan như gương. Từ mảnh vỡ, bạn rèn được một thanh kiếm.', 'The envoy shatters like a mirror. From the shards you forge a sword.') + giveHg(c, 'hg_doan_xich_kiem', ctx) };
      break;
    case 'hg_de_giang':
      if (win) return { text: tr('Đế Giang ngừng múa. Cái chuông nó vẫn đội trên đầu rơi xuống trước mặt bạn.', 'Dijiang stops dancing. The bell it wore on its head drops in front of you.') + giveHg(c, 'hg_hon_don_chung', ctx) };
      break;
  }
  const h = hurt(c, result === 'draw' ? 15 : 30, ctx);
  return { text: (result === 'draw' ? tr('Hai bên không ai hạ được ai, đành tách ra.', 'Neither side can bring the other down, so you break apart.') : tr('Bạn thua, phải lui về dưỡng thương.', 'You lose and retreat to heal.')) + h };
}

// ---------------- Tiến độ ----------------

/**
 * Tu vi đã đầy tầng ở Hồng Hoang: trả về id thẻ cửa ải cần mở, hoặc null nếu cứ lên tầng như thường.
 * Gọi từ engine progress(). 'break' = dùng thẻ đột phá có lôi kiếp như thường.
 */
export function hgGateFor(c: Character): string | 'break' | null {
  const r = c.realm;
  if (r === HH_REALM) return HG_THI_ID;
  if (r === HH_REALM + 1) return c.layer < 3 ? null : tnReady(c).length ? HG_TN_ID : 'break';
  if (r === HH_REALM + 2) return HG_XICH_ID;
  if (r === HH_REALM + 3) return c.layer < 3 ? null : HG_VAN_THIEN_ID;
  return null;
}

export function hgFindEvent(c: Character, id: string): GameEvent | null {
  if (id === HG_GATE_ID) return gateEvent(c);
  if (id === HG_THI_ID) return thiEvent(c);
  if (id === HG_TN_ID) return tnEvent(c);
  if (id === HG_XICH_ID) return xichEvent(c);
  if (id === HG_VAN_THIEN_ID) return vanThienEvent(c);
  if (id === HG_END_ID) return endEvent();
  return null;
}

/** Thu thêm tu luyện từ thi đã thu (ác thi) */
export const hgCultMul = (c: Character) => (c.hong?.thi?.ac === 'thu' ? 1.1 : 1);

/** Hệ số máu, công của người chơi trong trận Hồng Hoang lớn */
export function hgPlayerMul(c: Character, f: HhFight): { hp: number; atk: number } {
  let hp = 1;
  let atk = 1;
  if (c.hong?.ban) hp *= 1.1; // người thân kề vai
  if (c.hong?.thi?.chap === 'thu') hp *= 1.1;
  if ((f.kind === 'thien_dao' || f.id === 'hg_su_gia') && c.equipped.vu_khi === 'hg_doan_xich_kiem') atk *= 2;
  if (f.kind === 'thien_dao' && HH_SET_KT.every((id) => Object.values(c.equipped).includes(id))) hp *= 1.25;
  if (f.kind === 'thien_dao') atk *= 1 + Math.min(10, c.hong?.deTu ?? 0) * 0.03; // đồ đệ trợ trận
  return { hp, atk };
}

/** Tu vi thưởng cỡ vừa ở Hồng Hoang */
export const hgReward = (c: Character, x: number) => addCult(c, reward(c, x));
export { needFor };
