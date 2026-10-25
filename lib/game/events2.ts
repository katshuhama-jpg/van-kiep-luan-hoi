import { ITEMS, REALMS } from './data';
import { hasGift } from './gacha';
import { addCult, addPill, dao, fatal, giveItem, hurt, luck, money, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, Grave } from './types';

const itemName = (id: string | null) => (id ? ITEMS.find((i) => i.id === id)?.name ?? id : null);
const arc = (c: Character, k: string) => c.arcs?.[k];
const setArc = (c: Character, k: string, s: number, v?: string) => {
  c.arcs = c.arcs ?? {};
  c.arcs[k] = { s, at: Math.floor(c.age), v: v ?? c.arcs[k]?.v };
};
const since = (c: Character, k: string) => Math.floor(c.age) - (arc(c, k)?.at ?? 0);
const realmName = (r: number) => REALMS[r]?.name ?? 'Phàm nhân';

function grave(c: Character): Grave | null {
  const g = c.world?.graves ?? [];
  if (!g.length) return null;
  const n = Math.max(1, c.evCount?.mo_dao_huu ?? 1);
  return g[(n - 1) % g.length];
}

/** Đánh nhau với một đối thủ có cảnh giới r: thắng hay chết */
function duel(c: Character, ctx: EffectCtx, r: number, cause: string): { win: boolean; text: string } {
  const gap = c.realm - r;
  const p = Math.max(0.05, Math.min(0.92, luck(c, 0.45 + gap * 0.18)));
  if (ctx.rnd() < p) return { win: true, text: '' };
  const f = fatal(c, ctx, Math.max(0.1, Math.min(0.85, 0.35 - gap * 0.2)), cause);
  if (c.dead) return { win: false, text: f ?? '' };
  return { win: false, text: (f ?? '') + hurt(c, 30, ctx) };
}

export const EVENTS2: GameEvent[] = [
  // ================= Nhân quả xuyên kiếp =================
  {
    id: 'ruong_tien_kiep',
    minAge: 8,
    once: true,
    weight: 30,
    when: (c) => !!c.stash,
    title: 'Chiếc rương kiếp trước',
    text: (c) => `Cuốc đất ở ${c.stash!.place}, bạn chạm phải một chiếc rương gỗ mục. Trên nắp khắc: "${c.stash!.from} - kiếp thứ ${c.stash!.lifeNo}". Tim bạn thắt lại. Đó là tên của chính bạn ở kiếp trước.`,
    choices: (c) => {
      const s = c.stash!;
      const open = (ch: Character, ctx: EffectCtx, mul: number) => {
        money(ch, s.money * mul);
        if (s.item) giveItem(ch, s.item, false);
        ctx.fx('coin', `+${Math.round(s.money * mul)}`);
        ch.stash = null;
        const note = s.note ? ` Trong rương có lá thư, nét chữ quen thuộc lạ lùng: "${s.note}"` : ' Trong rương không có thư, chỉ có một nhúm tóc đã bạc.';
        return `Bạn nhận lại ${Math.round(s.money * mul)} linh thạch${s.item ? ` và ${itemName(s.item)}` : ''}.${note}`;
      };
      return [
        { label: 'Mở rương', lean: 'trung', run: (ch, ctx) => open(ch, ctx, 1) },
        { label: 'Thắp hương cho chính mình rồi mới mở', hint: 'tâm cảnh +', lean: 'chinh', run: (ch, ctx) => { stat(ch, 'tamCanh', 10); stat(ch, 'tamMa', -8); return 'Khói hương bay lên, bạn thấy như được ai đó vỗ vai. ' + open(ch, ctx, 1); } },
        { label: 'Đem cả rương cúng chùa', hint: 'đạo tâm +, khí vận +', lean: 'chinh', run: (ch) => { dao(ch, 12); stat(ch, 'khiVan', 12); ch.stash = null; return 'Sư trụ trì chắp tay: "Thí chủ đã buông được cả chính mình." Đêm đó bạn ngủ rất ngon.'; } },
        { label: 'Bán cả rương cho thương nhân', hint: 'x1.5 tiền, mất thư và đồ', lean: 'trung', run: (ch, ctx) => { money(ch, s.money * 1.5 + 30); ctx.fx('coin'); ch.stash = null; return 'Thương nhân trả giá hời. Bạn không bao giờ biết kiếp trước mình muốn nhắn gì.'; } },
      ];
    },
  },
  {
    id: 'an_nhan_tien_kiep',
    minAge: 14,
    once: true,
    weight: 12,
    when: (c) => !!c.past && c.past.daoTam >= 25,
    title: 'Ân nhân kiếp trước',
    text: (c) => `Một đoàn xe ngựa dừng trước cửa nhà. Vị tông chủ tóc bạc phơ bước xuống, quỳ sụp trước mặt bạn: "Ân công! Ngày ấy con chỉ là đứa bé ăn mày, chính ngài, ${c.past!.name}, đã cứu con. Con đợi ngài luân hồi đã bao năm."`,
    choices: () => [
      { label: 'Nhận lễ tạ ơn', hint: '+linh thạch', lean: 'trung', run: (c, ctx) => { const m = 200 + c.realm * 250; money(c, m); ctx.fx('coin', `+${m}`); return `Ông dâng lên ${m} linh thạch và một hộp đan dược.` + (addPill(c, 'truc_co'), ''); } },
      { label: 'Xin được bái vào tông môn', hint: 'có sư môn', lean: 'chinh', run: (c) => { c.sect = 'Báo Ân Tông'; stat(c, 'khiVan', 8); return 'Bạn trở thành thái thượng trưởng lão danh dự của Báo Ân Tông khi còn chưa kịp lớn.'; } },
      { label: 'Xin ông truyền công', hint: 'tu vi lớn', lean: 'trung', run: (c, ctx) => { addCult(c, reward(c, 2.5)); ctx.fx('breakthrough', 'Truyền công'); return 'Ông đặt tay lên đỉnh đầu bạn. Một dòng chân khí ấm áp chảy khắp kinh mạch.'; } },
      { label: '"Ta không nhớ gì cả. Ông về đi."', hint: 'phúc duyên', lean: 'chinh', run: (c) => { dao(c, 10); stat(c, 'tamCanh', 12); return 'Ông khóc rồi cười: "Vẫn y như ngày ấy." Ông để lại một lá bùa hộ mệnh rồi đi.' + (giveItem(c, 'ngoc_boi'), ''); } },
    ],
  },
  {
    id: 'oan_hon_tien_kiep',
    minAge: 12,
    once: true,
    weight: 12,
    when: (c) => !!c.past && c.past.daoTam <= -25,
    title: 'Món nợ kiếp trước',
    text: (c) => `Một kẻ lạ mặt chặn đường, mắt đỏ ngầu: "Ta nhận ra hồn phách ngươi. Kiếp trước ngươi là ${c.past!.name}, đã thảm sát cả nhà ta. Ta luân hồi chỉ để chờ ngày hôm nay."`,
    choices: (c) => [
      { label: 'Quỳ xuống chuộc tội', hint: c.linhThach >= 100 ? '-100 linh thạch' : 'đạo tâm +', lean: 'chinh', run: (ch) => { money(ch, -100); dao(ch, 15); stat(ch, 'tamMa', -10); return 'Hắn đứng lặng rất lâu, rồi quay đi. "Món nợ này... coi như ta xóa."'; } },
      { label: 'Ra tay trước', hint: 'nguy hiểm', lean: 'ta', run: (ch, ctx) => { dao(ch, -10); const d = duel(ch, ctx, Math.max(1, c.past!.realm - 1), `Kẻ thù kiếp trước đâm một nhát xuyên tim. "Nợ máu, trả bằng máu."`); if (ch.dead) return 'Hắn mạnh hơn bạn tưởng.' + d.text; if (d.win) { money(ch, 80); return 'Bạn giết hắn. Thêm một vòng oán hận nữa trong luân hồi.'; } return 'Bạn trọng thương nhưng chạy thoát.' + d.text; } },
      { label: 'Bỏ chạy', lean: 'trung', run: (ch, ctx) => { ch.enemy = 'kẻ thù từ kiếp trước'; if (ctx.rnd() < 0.5) return 'Bạn chạy thoát. Nhưng từ nay luôn có kẻ bám theo.'; return 'Hắn ném theo một mũi tiêu độc.' + hurt(ch, 20, ctx); } },
      { label: 'Mời thầy cầu siêu cho cả nhà hắn', hint: '-60 linh thạch', lean: 'chinh', run: (ch) => { money(ch, -60); dao(ch, 8); stat(ch, 'khiVan', 6); return 'Ba ngày ba đêm tụng kinh. Kẻ lạ mặt bật khóc, rồi biến mất như chưa từng tồn tại.'; } },
    ],
  },
  {
    id: 'mo_tien_kiep',
    minAge: 10,
    once: true,
    weight: 8,
    when: (c) => !!c.past,
    title: 'Ngôi mộ quen thuộc',
    text: (c) => `Đi ngang một gò đất phủ đầy cỏ dại, bạn khựng lại. Bia mộ ghi: "${c.past!.name}, ${c.past!.age} tuổi, ${c.past!.realmName}". Dòng chữ nhỏ bên dưới: "${c.past!.cause ?? 'Không rõ nguyên do.'}". Không hiểu sao nước mắt bạn rơi.`,
    choices: (c) => [
      { label: 'Nhổ cỏ, thắp hương', hint: 'tâm cảnh +, khí vận +', lean: 'chinh', run: (ch) => { stat(ch, 'tamCanh', 8); stat(ch, 'khiVan', 6); return 'Gió thổi qua, lá rơi đầy vai bạn như một cái ôm.'; } },
      { label: 'Ngồi thiền bên mộ', hint: 'nhớ lại công pháp cũ', lean: 'trung', run: (ch, ctx) => { addCult(ch, reward(ch, 0.8 + c.past!.realm * 0.3)); ctx.fx('layer', 'Ký ức'); return `Từng mảnh ký ức ùa về. Bạn nhớ lại cách vận khí của ${c.past!.realmName}.`; } },
      { label: 'Đào mộ xem có gì', hint: 'tà, có thể bị nguyền', lean: 'ta', run: (ch, ctx) => { dao(ch, -8); if (ctx.rnd() < 0.5) { money(ch, 60 + c.past!.realm * 60); return 'Trong quan tài có ít đồ tùy táng. Bạn đang đào mộ chính mình.'; } stat(ch, 'tamMa', 15); return 'Bộ xương trong quan tài quay đầu nhìn bạn. Đêm đó bạn sốt cao, mê sảng gọi tên kiếp trước.'; } },
      ...(c.past!.partner ? [{ label: `Hỏi thăm về ${c.past!.partner}`, lean: 'trung' as const, run: (ch: Character) => { stat(ch, 'tamCanh', -4); stat(ch, 'ngoTinh', 6); return `Ông lão giữ mộ kể: ${c.past!.partner} đã ngồi bên mộ này suốt mười năm, rồi một ngày không đến nữa.`; } }] : [{ label: 'Lặng lẽ bỏ đi', lean: 'trung' as const, run: () => 'Bạn tự nhủ: kiếp này, mình sẽ sống khác.' }]),
    ],
  },

  // ================= Dấu vết người chơi khác =================
  {
    id: 'mo_dao_huu',
    minAge: 10,
    cooldown: 8,
    weight: 10,
    when: (c) => (c.world?.graves.length ?? 0) > 0,
    title: 'Mộ của một đạo hữu',
    text: (c) => {
      const g = grave(c)!;
      return `Bên đường có một ngôi mộ: "${g.char}, ${g.age} tuổi, ${g.realm}". Phía dưới khắc nhỏ: "Linh hồn của đạo hữu ${g.player}". ${g.epitaph ? `Bia đề: "${g.epitaph}"` : 'Bia không đề chữ nào.'}`;
    },
    choices: (c) => {
      const g = grave(c)!;
      const lv = /Phàm/.test(g.realm) ? 0 : /Luyện Khí/.test(g.realm) ? 1 : /Trúc Cơ/.test(g.realm) ? 2 : /Kim Đan/.test(g.realm) ? 3 : 4;
      return [
        { label: 'Thắp nén nhang', hint: 'khí vận +', lean: 'chinh', run: (ch) => { stat(ch, 'khiVan', 5); dao(ch, 3); return `Bạn vái ba vái. Không biết ${g.player} ở phương nào, có cảm nhận được không.`; } },
        { label: 'Đọc di thư trong bia', hint: 'tu vi', lean: 'trung', run: (ch, ctx) => { addCult(ch, reward(ch, 0.5 + lv * 0.3)); ctx.fx('layer', 'Di thư'); return `Trong khe bia giấu mấy trang tâm đắc tu luyện của ${g.char}. ${g.cause ? `Trang cuối viết: "${g.cause}"` : ''}`; } },
        { label: 'Đào lấy đồ tùy táng', hint: 'tà, có thể gặp oán hồn', lean: 'ta', run: (ch, ctx) => { dao(ch, -8); if (ctx.rnd() < 0.55) { const m = 40 + lv * 80; money(ch, m); return `Bạn lấy được ${m} linh thạch. Gió rít lên như tiếng ai chửi rủa.`; } const f = fatal(ch, ctx, 0.12 + lv * 0.04, `Oán hồn của ${g.char} bóp cổ bạn đến chết ngay trên miệng huyệt.`); if (ch.dead) return 'Nắp quan tài bật mở...' + f; stat(ch, 'tamMa', 12); return `Oán hồn của ${g.char} hiện ra. Bạn bỏ chạy, mất mấy năm không dám ngủ tối.` + (f ?? ''); } },
        { label: 'Khắc thêm một dòng lên bia', hint: 'tâm cảnh +', lean: 'trung', run: (ch) => { stat(ch, 'tamCanh', 6); return `Bạn khắc: "${ch.name} từng ghé qua". Có lẽ một ngày ai đó cũng sẽ đọc được.`; } },
      ];
    },
  },
  {
    id: 'ma_dau_the_gian',
    minAge: 16,
    minRealm: 1,
    once: true,
    weight: 8,
    when: (c) => !!c.world?.ma,
    title: 'Ma đầu hiện thế',
    text: (c) => `Tin dữ truyền khắp nơi: ma đầu ${c.world!.ma!.name} (${c.world!.ma!.realmName}) - kẻ đứng đầu Tà phái, linh hồn của đạo hữu ${c.world!.ma!.player} - đang tàn sát một trấn nhỏ gần đây.`,
    choices: (c) => {
      const m = c.world!.ma!;
      return [
        { label: 'Xông tới ngăn hắn lại', hint: m.realm > c.realm ? 'rất nguy hiểm' : 'có cơ hội', lean: 'chinh', run: (ch, ctx) => { dao(ch, 12); const d = duel(ch, ctx, m.realm, `Ma đầu ${m.name} chỉ phẩy tay. Bạn chết, trở thành một cái tên trong danh sách nạn nhân của hắn.`); if (ch.dead) return 'Bạn lao tới...' + d.text; if (d.win) { addCult(ch, reward(ch, 2)); stat(ch, 'khiVan', 15); ctx.fx('breakthrough', 'Trảm ma'); return `Bạn đánh lui ${m.name}! Dân trấn lập đền thờ sống cho bạn.`; } return `${m.name} cười khẩy rồi bỏ đi. Bạn may mắn giữ được mạng.` + d.text; } },
        { label: 'Xin làm thuộc hạ của hắn', hint: 'tà, được công pháp', lean: 'ta', run: (ch, ctx) => { dao(ch, -20); addCult(ch, reward(ch, 1.5)); stat(ch, 'tamMa', 12); ctx.fx('evil', 'Nhập ma môn'); return `${m.name} nhìn bạn một hồi: "Được. Từ nay ngươi là chó của ta." Hắn ném cho bạn một cuốn ma công.`; } },
        { label: 'Sơ tán dân làng', hint: 'đạo tâm +', lean: 'chinh', run: (ch, ctx) => { dao(ch, 8); if (ctx.rnd() < 0.2) return 'Bạn dẫn được hơn trăm người chạy thoát, nhưng bị ma khí quét trúng.' + hurt(ch, 25, ctx); return 'Bạn dẫn được hơn trăm người chạy thoát trong đêm.'; } },
        { label: 'Đóng cửa trốn', lean: 'trung', run: (ch) => { stat(ch, 'tamCanh', -5); return 'Tiếng kêu khóc vọng về suốt ba đêm. Bạn bịt tai lại.'; } },
      ];
    },
  },
  {
    id: 'minh_chu_chinh_dao',
    minAge: 16,
    once: true,
    weight: 6,
    when: (c) => !!c.world?.chinh,
    title: 'Gặp minh chủ chính đạo',
    text: (c) => `Trên quan đạo, một người áo trắng cưỡi hạc đi qua. Người qua đường xì xào: đó là ${c.world!.chinh!.name} (${c.world!.chinh!.realmName}), đệ nhất chính đạo đương thời, linh hồn của đạo hữu ${c.world!.chinh!.player}.`,
    choices: (c) => {
      const m = c.world!.chinh!;
      return [
        { label: 'Quỳ xin chỉ điểm', hint: 'tu vi', lean: 'chinh', run: (ch, ctx) => { addCult(ch, reward(ch, 1.2)); stat(ch, 'ngoTinh', 6); ctx.fx('layer', 'Chỉ điểm'); return `${m.name} chỉ nói một câu, mà bạn ngẫm cả mười năm.`; } },
        { label: 'Thách đấu', hint: 'liều', lean: 'trung', run: (ch, ctx) => { if (ctx.rnd() < 0.1 + (ch.realm - m.realm) * 0.2) { stat(ch, 'khiVan', 20); return `Bạn đỡ được ba chiêu của ${m.name}! Cả giang hồ biết tên bạn.`; } return `${m.name} chỉ dùng một ngón tay đã hạ bạn. "Còn non lắm."` + hurt(ch, 20, ctx); } },
        { label: 'Trộm túi càn khôn của người', hint: 'rất tà', lean: 'ta', run: (ch, ctx) => { dao(ch, -15); const f = fatal(ch, ctx, 0.25, `${m.name} quay lại, ánh kiếm lóe lên. Bạn chết trước khi kịp chạm vào túi.`); if (ch.dead) return 'Bạn vừa đưa tay...' + f; money(ch, 300); return 'Bạn móc được ít linh thạch rồi lặn mất. Người cố ý tha cho bạn chăng?' + (f ?? ''); } },
        { label: 'Đứng nhìn theo', lean: 'trung', run: (ch) => { stat(ch, 'tamCanh', 4); return 'Bạn thầm thề: một ngày nào đó mình cũng sẽ bay như thế.'; } },
      ];
    },
  },

  // ================= Chuỗi: Trứng rồng =================
  {
    id: 'trung_la',
    minAge: 8,
    maxAge: 60,
    once: true,
    weight: 6,
    title: 'Quả trứng lạ',
    text: () => 'Sau trận lũ, bạn nhặt được một quả trứng to bằng cái gáo, vỏ có vảy, ấm như hòn than.',
    choices: () => [
      { label: 'Ôm về ấp', hint: 'bắt đầu một chuyện dài', lean: 'trung', run: (c) => { setArc(c, 'rong', 1); return 'Bạn quấn trứng trong chăn bông, đêm nào cũng ôm ngủ.'; } },
      { label: 'Bán ở phường thị', hint: '+linh thạch', lean: 'trung', run: (c, ctx) => { money(c, 120); ctx.fx('coin', '+120'); return 'Lão thương nhân trả 120 linh thạch mà mắt sáng rực. Bạn hơi chột dạ.'; } },
      { label: 'Luộc ăn', hint: 'sức khỏe ++', lean: 'ta', run: (c) => { stat(c, 'sucKhoe', 25); addCult(c, reward(c, 0.6)); dao(c, -3); return 'Ngon đến mức bạn liếm cả vỏ. Người nóng như lửa suốt ba ngày.'; } },
      { label: 'Trả về chỗ cũ', lean: 'chinh', run: (c) => { dao(c, 3); stat(c, 'khiVan', 4); return 'Đêm đó có tiếng gầm rất xa vọng về, như một lời cảm ơn.'; } },
    ],
  },
  {
    id: 'trung_no',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 1 && since(c, 'rong') >= 4,
    title: 'Trứng nở',
    text: () => 'Rắc! Quả trứng nứt đôi. Một con rồng con bằng con mèo bò ra, kêu "éc éc" rồi cắn vào ngón tay bạn.',
    choices: () => [
      { label: 'Cho ăn linh thạch', hint: '-80 linh thạch', lean: 'trung', run: (c) => { money(c, -80); setArc(c, 'rong', 2, 'thien'); return 'Nó nhai linh thạch rau ráu, vảy sáng lên như ngọc.'; } },
      { label: 'Cho uống máu của mình', hint: 'tà, rồng mạnh hơn', lean: 'ta', run: (c, ctx) => { dao(c, -6); setArc(c, 'rong', 2, 'ma'); return 'Nó uống máu bạn, mắt đỏ rực lên. Từ đó nó chỉ nghe lời mình bạn.' + hurt(c, 10, ctx); } },
      { label: 'Đặt tên là Bé Bự', lean: 'chinh', run: (c) => { stat(c, 'tamCanh', 8); setArc(c, 'rong', 2, 'thien'); return 'Bé Bự vẫy đuôi. Bạn có thêm một người nhà.'; } },
      { label: 'Thả về rừng', lean: 'chinh', run: (c) => { dao(c, 5); setArc(c, 'rong', 9); return 'Nó ngoái lại ba lần trước khi biến vào rừng.'; } },
    ],
  },
  {
    id: 'rong_lon',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 2 && since(c, 'rong') >= 6,
    title: 'Rồng con nổi điên',
    text: (c) => `Con rồng giờ đã dài ba trượng. Đêm qua nó ${arc(c, 'rong')?.v === 'ma' ? 'cắn chết cả đàn bò của làng bên' : 'phá nát nửa vườn nhà hàng xóm'}. Dân làng kéo đến đòi giết nó.`,
    choices: () => [
      { label: 'Đền bù cho dân làng', hint: '-200 linh thạch', lean: 'chinh', run: (c) => { money(c, -200); setArc(c, 'rong', 3); return 'Bạn bồi thường đến đồng cuối cùng. Rồng gục đầu vào lòng bạn.'; } },
      { label: 'Đứng chắn trước rồng', hint: 'có thể bị thương', lean: 'trung', run: (c, ctx) => { setArc(c, 'rong', 3); if (ctx.rnd() < 0.5) return 'Dân làng ném đá trúng đầu bạn.' + hurt(c, 20, ctx); return 'Dân làng thấy bạn liều mạng, đành bỏ về.'; } },
      { label: 'Thả rồng ra cho nó xử', hint: 'tà', lean: 'ta', run: (c) => { dao(c, -20); setArc(c, 'rong', 3, 'ma'); stat(c, 'tamMa', 10); return 'Một tiếng gầm. Rồi im lặng. Không ai dám đến nữa.'; } },
      { label: 'Đành bán rồng cho tông môn', hint: '+600 linh thạch', lean: 'trung', run: (c, ctx) => { money(c, 600); ctx.fx('coin', '+600'); setArc(c, 'rong', 9); stat(c, 'tamCanh', -10); return 'Lúc bị dắt đi, nó vẫn ngoái nhìn bạn.'; } },
    ],
  },
  {
    id: 'cuoi_rong',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'rong')?.s === 3 && since(c, 'rong') >= 5,
    title: 'Long kỵ',
    text: () => 'Một buổi sáng, con rồng cúi đầu xuống trước mặt bạn, như mời bạn trèo lên lưng.',
    choices: () => [
      { label: 'Trèo lên!', hint: 'có tọa kỵ', lean: 'trung', run: (c, ctx) => { c.mount = 'rong'; setArc(c, 'rong', 4); stat(c, 'khiVan', 15); ctx.fx('breakthrough', 'Long kỵ'); return 'Rồng vút lên mây. Cả làng ngửa cổ nhìn theo, há hốc mồm. Từ nay bạn là Long Kỵ Sĩ.'; } },
      { label: 'Để nó tự do bay đi', lean: 'chinh', run: (c) => { dao(c, 6); stat(c, 'tamCanh', 12); setArc(c, 'rong', 9); return 'Nó bay vòng quanh nhà ba vòng rồi biến mất giữa trời xanh.'; } },
      { label: 'Lấy một vảy rồng làm kỷ niệm', hint: 'tu vi', lean: 'trung', run: (c) => { addCult(c, reward(c, 1.5)); c.mount = 'rong'; setArc(c, 'rong', 4); return 'Vảy rồng nóng hổi trong tay, linh khí cuồn cuộn. Rồng vẫn ở lại bên bạn.'; } },
    ],
  },

  // ================= Chuỗi: Đồ đệ =================
  {
    id: 'nhan_de_tu',
    minAge: 25,
    minRealm: 2,
    once: true,
    weight: 7,
    title: 'Đứa trẻ quỳ trước cửa',
    text: () => 'Một đứa trẻ rách rưới quỳ trước động phủ suốt ba ngày ba đêm giữa trời tuyết, chỉ để xin được làm đồ đệ.',
    choices: () => [
      { label: 'Nhận làm đồ đệ', hint: 'bắt đầu một chuyện dài', lean: 'chinh', run: (c) => { setArc(c, 'de_tu', 1); stat(c, 'tamCanh', 5); return 'Bạn khoác áo cho nó. Nó lạy chín lạy, trán chảy máu.'; } },
      { label: 'Cho ít tiền rồi đuổi đi', lean: 'trung', run: (c) => { money(c, -10); return 'Đứa trẻ cầm tiền, nhìn bạn rất lâu rồi đi.'; } },
      { label: 'Bắt làm nô bộc', hint: 'tà', lean: 'ta', run: (c) => { dao(c, -8); money(c, 20); setArc(c, 'de_tu', 1, 'no'); return 'Nó gánh nước bổ củi cho bạn không công. Ánh mắt nó ngày càng lạnh.'; } },
    ],
  },
  {
    id: 'day_de_tu',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'de_tu')?.s === 1 && since(c, 'de_tu') >= 6,
    title: 'Truyền nghề',
    text: () => 'Đồ đệ ngày càng giỏi. Đêm nay nó xin bạn truyền tuyệt học áp đáy hòm.',
    choices: () => [
      { label: 'Truyền hết, không giữ gì', hint: 'tâm cảnh +', lean: 'chinh', run: (c) => { setArc(c, 'de_tu', 2, 'het'); stat(c, 'tamCanh', 6); return 'Bạn dạy nó tất cả. Nó cảm động đến bật khóc.'; } },
      { label: 'Giữ lại một chiêu', hint: 'phòng thân', lean: 'trung', run: (c) => { setArc(c, 'de_tu', 2, 'giu'); return 'Bạn dạy chín phần, giữ lại một. Sư phụ nào cũng vậy.'; } },
      { label: 'Dạy nó ma công', hint: 'tà', lean: 'ta', run: (c) => { setArc(c, 'de_tu', 2, 'ma'); dao(c, -10); return 'Nó học rất nhanh. Quá nhanh.'; } },
      { label: 'Dùng nó làm lô đỉnh tu luyện', hint: 'rất tà, tu vi lớn', lean: 'ta', run: (c, ctx) => { dao(c, -30); addCult(c, reward(c, 2.5)); stat(c, 'tamMa', 20); setArc(c, 'de_tu', 9); ctx.fx('evil', 'Hút công'); return 'Bạn hút cạn tu vi của nó. Thân xác nó khô quắt như lá mùa thu.'; } },
    ],
  },
  {
    id: 'de_tu_xuat_su',
    once: true,
    weight: 60,
    when: (c) => arc(c, 'de_tu')?.s === 2 && since(c, 'de_tu') >= 8,
    title: 'Đồ đệ trở về',
    text: (c) => {
      const v = arc(c, 'de_tu')?.v;
      return v === 'het' || v === 'ma' || v === 'no'
        ? 'Đồ đệ trở về sau nhiều năm du lịch. Nhưng ánh mắt nó lạ lắm. Sau lưng nó là một đám hắc y nhân.'
        : 'Đồ đệ trở về, mặt lạnh như băng: "Sư phụ, xin người giao ra chức chưởng môn."';
    },
    choices: (c) => {
      const v = arc(c, 'de_tu')?.v;
      const betray = v === 'ma' || v === 'no' || (v === 'het' && c.daoTam < 20);
      const fight: Choice = {
        label: v === 'giu' ? 'Dùng chiêu giữ lại' : 'Giao đấu với đồ đệ',
        hint: v === 'giu' ? 'nó không biết chiêu này' : 'nó biết hết chiêu của bạn',
        lean: 'trung',
        run: (ch, ctx) => {
          setArc(ch, 'de_tu', 3);
          if (v === 'giu') { addCult(ch, reward(ch, 1)); return 'Nó dùng đúng chiêu bạn dạy. Bạn dùng chiêu bạn chưa dạy. Nó quỳ xuống, máu ứa nơi khóe miệng.'; }
          const f = fatal(ch, ctx, betray ? 0.55 : 0.25, 'Đồ đệ dùng chính chiêu bạn dạy, một kiếm xuyên tim. "Sư phụ, người dạy con chu đáo quá."');
          if (ch.dead) { ch.endTag = 'phan_do'; return 'Hai thầy trò giao chiến...' + f; }
          return 'Bạn thắng sát nút. Đồ đệ bỏ đi trong đêm.' + (f ?? '') + hurt(ch, 25, ctx);
        },
      };
      return [
        fight,
        { label: 'Nhường chức cho nó', lean: 'chinh', run: (ch) => { setArc(ch, 'de_tu', 3); ch.sect = null; stat(ch, 'tamCanh', betray ? -10 : 10); return betray ? 'Nó lên ngôi rồi đuổi bạn xuống núi giữa mùa đông.' : 'Nó lên ngôi, rồi quỳ trước mặt bạn: "Con chỉ muốn sư phụ được nghỉ ngơi."'; } },
        { label: 'Bỏ trốn khỏi sơn môn', lean: 'trung', run: (ch) => { setArc(ch, 'de_tu', 3); ch.enemy = 'đồ đệ phản sư'; money(ch, -Math.round(ch.linhThach * 0.4)); return 'Bạn mang theo được một ít, còn lại đều để lại cho nó.'; } },
      ];
    },
  },

  // ================= Chuỗi: Từ hôn =================
  {
    id: 'tu_hon',
    minAge: 15,
    maxAge: 24,
    maxRealm: 1,
    once: true,
    weight: 10,
    title: 'Từ hôn',
    text: (c) => `${c.gender === 'nam' ? 'Hôn thê' : 'Hôn phu'} từ nhỏ của bạn - nay đã là đệ tử nội môn Thiên Kiếm Tông - đến tận nhà, ném tờ hôn thư xuống đất trước mặt cả họ: "Phế vật như ngươi, không xứng với ta."`,
    choices: () => [
      { label: '"Ba mươi năm Hà Đông, ba mươi năm Hà Tây! Hẹn ba năm sau!"', hint: 'hẹn ước 3 năm', lean: 'trung', run: (c) => { setArc(c, 'tu_hon', 1); stat(c, 'ngoTinh', 5); stat(c, 'tamMa', 6); return 'Cả sảnh đường im phăng phắc. Rồi ai đó bật cười. Bạn nắm chặt tay đến bật máu.'; } },
      { label: 'Nhặt hôn thư lên, xé đôi', hint: 'tâm cảnh +', lean: 'chinh', run: (c) => { stat(c, 'tamCanh', 10); return '"Ngươi đi đi." Bạn quay lưng. Lòng nhẹ bẫng.'; } },
      { label: 'Quỳ xuống van xin', lean: 'trung', run: (c) => { stat(c, 'tamMa', 12); stat(c, 'khiVan', -5); return 'Người ấy cười khinh rồi bỏ đi. Cả làng bàn tán suốt mấy năm.'; } },
      { label: 'Tát hộ vệ của người ấy', hint: 'nguy hiểm', lean: 'ta', run: (c, ctx) => { const f = fatal(c, ctx, 0.08, 'Tên hộ vệ Trúc Cơ kỳ phản đòn một chưởng. Bạn chết ngay trong ngày bị từ hôn.'); if (c.dead) return 'Bạn vung tay...' + f; return 'Bạn bị đánh gãy ba cái xương sườn, nhưng thấy rất đã.' + (f ?? '') + hurt(c, 25, ctx); } },
    ],
  },
  {
    id: 'tam_nien_chi_uoc',
    once: true,
    weight: 80,
    when: (c) => arc(c, 'tu_hon')?.s === 1 && since(c, 'tu_hon') >= 3,
    title: 'Ước hẹn ba năm',
    text: (c) => `Ba năm đã đến. Trên lôi đài Thiên Kiếm Tông, người từng từ hôn bạn đang đợi, đã là ${realmName(Math.max(2, c.realm))}. Cả thiên hạ đến xem.`,
    choices: () => {
      const go = (bonus: number, extra?: (c: Character, ctx: EffectCtx) => string): Choice['run'] => (c, ctx) => {
        const pre = extra ? extra(c, ctx) : '';
        if (c.dead) return pre;
        const p = luck(c, 0.15 + c.realm * 0.2 + bonus);
        if (ctx.rnd() < p) {
          setArc(c, 'tu_hon', 2, 'thang');
          stat(c, 'khiVan', 20);
          money(c, 300);
          ctx.fx('breakthrough', 'Vả mặt!');
          return pre + 'Một chưởng. Người ấy bay khỏi lôi đài. Cả quảng trường nín thở rồi vỡ òa. "Đừng khinh thiếu niên nghèo!"';
        }
        setArc(c, 'tu_hon', 2, 'thua');
        stat(c, 'tamMa', 15);
        return pre + 'Bạn thua thảm. Người ấy nói nhỏ: "Ba năm nữa, ta vẫn đợi." Hóa ra người ấy chưa từng quên bạn.' + hurt(c, 20, ctx);
      };
      return [
        { label: 'Bước lên lôi đài', lean: 'trung', run: go(0) },
        { label: 'Uống cấm đan trước khi lên đài', hint: 'tà, mạnh hơn, hại thân', lean: 'ta', run: go(0.25, (c, ctx) => { dao(c, -6); return hurt(c, 15, ctx); }) },
        { label: 'Nhờ sư phụ đứng sau lưng', hint: '-100 linh thạch', lean: 'trung', run: go(0.12, (c) => { money(c, -100); return ''; }) },
        { label: 'Không đến', lean: 'trung', run: (c) => { setArc(c, 'tu_hon', 2, 'tron'); stat(c, 'tamMa', 10); stat(c, 'khiVan', -8); return 'Bạn trốn trong núi. Thiên hạ cười suốt mười năm.'; } },
      ];
    },
  },

  // ================= Meme: Hệ Thống =================
  {
    id: 'he_thong',
    minAge: 12,
    once: true,
    weight: 0.5,
    when: (c) => !arc(c, 'he_thong'),
    title: 'Đinh!',
    text: () => '"Đinh! Phát hiện ký chủ phù hợp. Hệ Thống Tu Tiên Vô Địch Siêu Cấp đang được kích hoạt... 99%... Xin ký chủ xác nhận trói định."',
    choices: () => [
      { label: 'Đồng ý trói định', hint: 'nhận quà tân thủ', lean: 'trung', run: (c, ctx) => { setArc(c, 'he_thong', 1); money(c, 100); addPill(c, 'tu_khi', 3); ctx.fx('coin', 'Quà tân thủ'); return '"Đinh! Trói định thành công. Tặng ký chủ gói quà tân thủ: 100 linh thạch, 3 Tụ Khí Đan."'; } },
      { label: 'Hỏi có gói VIP không', hint: '-648 linh thạch', lean: 'trung', run: (c, ctx) => { const pay = Math.min(648, c.linhThach); money(c, -pay); setArc(c, 'he_thong', 1); addCult(c, reward(c, 1.5)); stat(c, 'khiVan', 10); ctx.fx('breakthrough', 'VIP'); return `"Đinh! Ký chủ nạp ${pay} linh thạch. Tặng danh hiệu: Đại Gia Tu Tiên." Không hiểu sao bạn thấy mình bị lừa.`; } },
      { label: 'Từ chối', lean: 'trung', run: (c, ctx) => { setArc(c, 'he_thong', 9); return '"Đinh! Ký chủ từ chối. Hệ thống tự hủy sau 3... 2... 1..." Bùm.' + hurt(c, 25, ctx); } },
      { label: 'Đi chùa trừ tà', hint: 'đạo tâm +', lean: 'chinh', run: (c) => { setArc(c, 'he_thong', 9); dao(c, 5); return 'Sư thầy gõ mõ ba ngày. Giọng nói lẩm bẩm "Đinh... đinh..." rồi tắt hẳn.'; } },
    ],
  },
  {
    id: 'he_thong_nv',
    weight: 40,
    cooldown: 4,
    when: (c) => { const a = arc(c, 'he_thong'); return !!a && a.s >= 1 && a.s < 3 && since(c, 'he_thong') >= 4; },
    title: 'Nhiệm vụ hệ thống',
    text: (c) => (arc(c, 'he_thong')?.s === 1 ? '"Đinh! Nhiệm vụ hằng ngày: hãy đi tát một tên công tử nhà giàu. Phần thưởng: bí ẩn."' : '"Đinh! Nhiệm vụ chính tuyến: tỏ tình với người đẹp nhất trấn trong vòng 1 canh giờ. Thất bại: điện giật."'),
    choices: () => [
      { label: 'Làm nhiệm vụ', lean: 'trung', run: (c, ctx) => { const a = arc(c, 'he_thong')!; setArc(c, 'he_thong', a.s + 1); addCult(c, reward(c, 1.2)); ctx.fx('layer', 'Hoàn thành'); if (ctx.rnd() < 0.3) return '"Đinh! Hoàn thành." Bạn nhận phần thưởng, nhưng cũng nhận một trận đòn.' + hurt(c, 15, ctx); return '"Đinh! Nhiệm vụ hoàn thành. Thưởng: tu vi." Thiên hạ nhìn bạn như nhìn kẻ điên.'; } },
      { label: 'Mặc cả với hệ thống', lean: 'trung', run: (c) => { const a = arc(c, 'he_thong')!; setArc(c, 'he_thong', a.s + 1); money(c, 50); return '"Đinh! Hệ thống không hiểu ký chủ nói gì... nhưng thôi, thưởng 50 linh thạch cho đỡ phiền."'; } },
      { label: 'Phớt lờ', lean: 'trung', run: (c, ctx) => '"Đinh! Nhiệm vụ thất bại. Trừng phạt: điện giật 10 vạn vôn." Tóc bạn dựng đứng suốt một tháng.' + hurt(c, 18, ctx) },
    ],
  },

  // ================= Meme: Xuyên không =================
  {
    id: 'xuyen_khong',
    minAge: 16,
    once: true,
    weight: 0.6,
    title: 'Khe nứt không gian',
    text: () => 'Trời quang mây tạnh, không gian trước mặt bỗng nứt toác. Bên kia có ánh đèn rực rỡ, tiếng còi inh ỏi và mùi... phở?',
    choices: () => [
      { label: 'Bước vào', hint: '???', lean: 'trung', run: (c, ctx) => { c.dead = true; c.endTag = 'xuyen_khong'; c.cause = 'Bước qua khe nứt không gian. Bạn tỉnh dậy giữa ngã tư Cửa Nam, Hà Nội năm 2026. Một bác xe ôm hỏi: "Đi đâu cháu?"'; ctx.fx('breakthrough', 'XUYÊN KHÔNG'); return c.cause; } },
      { label: 'Ném một hòn đá sang', lean: 'trung', run: (c) => { stat(c, 'khiVan', 8); return 'Một lúc sau có thứ bay ngược lại: một cục gạch phát sáng, có chữ "Nokia". Nó không bao giờ vỡ.'; } },
      { label: 'Kéo một người bên kia sang', hint: 'có đạo lữ?', lean: 'trung', run: (c) => { if (c.partner) return 'Bạn kéo được một anh shipper. Anh ấy giao xong đơn rồi đòi về.'; c.partner = c.gender === 'nam' ? 'Linh, cô nhân viên văn phòng' : 'Tùng, anh shipper'; stat(c, 'tamCanh', 10); return `Bạn kéo sang được ${c.partner}. Hai người nhìn nhau ngơ ngác, rồi phá lên cười.`; } },
      { label: 'Lấy bùa dán kín lại', lean: 'chinh', run: (c) => { dao(c, 3); return 'Khe nứt khép lại. Bạn mãi không biết bên kia là thế giới nào.'; } },
    ],
  },

  // ================= Thiên phú: Hộp bí ẩn =================
  {
    id: 'hop_bi_an',
    minAge: 70,
    once: true,
    weight: 200,
    when: (c) => hasGift(c, 'g_hop'),
    title: 'Chiếc hộp bí ẩn',
    text: () => 'Năm nay bạn tròn bảy mươi. Chiếc hộp mang theo từ lúc lọt lòng bỗng tự phát sáng, nắp hé mở.',
    choices: () => [
      { label: 'Mở hộp', lean: 'trung', run: (c, ctx) => { const r = ctx.rnd(); if (r < 0.45) { addCult(c, reward(c, 6)); c.lifespan = Math.min(150, c.lifespan + 30); ctx.fx('breakthrough', 'Tiên duyên'); return 'Trong hộp là một viên tiên đan cổ. Bạn trẻ lại ba mươi tuổi, tu vi tăng vọt.'; } if (r < 0.8) { money(c, 3000); ctx.fx('coin', '+3000'); return 'Trong hộp là một tấm bản đồ kho báu. Bạn trở thành phú ông.'; } return 'Trong hộp là một tờ giấy: "Cảm ơn đã chờ đợi. Đây chỉ là một cái hộp." Bạn cười đến chảy nước mắt.'; } },
      { label: 'Không mở, truyền lại cho con cháu', lean: 'chinh', run: (c) => { dao(c, 8); stat(c, 'tamCanh', 15); return 'Có những bí ẩn để dành mới đẹp.'; } },
    ],
  },
];
