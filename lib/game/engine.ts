import { FOCUS, MAX_LIFE, HAIR_COLORS, HAIR_STYLES, HO, HO_KEP, TEN_NAM_1, TEN_NAM_2, TEN_NU_1, TEN_NU_2, LIFE_FATES, LINH_CAN, ORIGINS, PATHS, PILLS, REALMS, TEN_NAM, TEN_NU, realmLabel } from './data';
import { BREAK_EVENT_ID, EVENTS, PATH_EVENT_ID, pathChoices } from './events';
import { addCult, addPill, clamp, reward, dao, giveItem, hurt, money, needFor, pick, stat, usePill, weighted } from './helpers';
import type { Character, Choice, EffectCtx, Fx, FxKind, GameEvent, Meta, PendingEvent, Tone } from './types';

export const rnd = () => Math.random();

const GAIN = [6, 30, 30, 34, 38, 42, 46, 50];

export function emptyMeta(): Meta {
  return { phucDuyen: 0, nghiep: 0, lives: 0, talents: [], enemy: null };
}

function lifeMult(c: Character, talents: string[] = []) {
  let m = c.lifeMul ?? 1;
  if (talents.includes('tho')) m *= 1.2;
  if (c.path === 'phat') m *= 1.3;
  if (c.race === 'yeu') m *= 1.1;
  return m;
}

export function genName(gender: 'nam' | 'nu'): string {
  const ho = rnd() < 0.15 ? pick(rnd, HO_KEP) : pick(rnd, HO);
  const r = rnd();
  let ten: string;
  if (r < 0.2) ten = pick(rnd, gender === 'nam' ? TEN_NAM : TEN_NU);
  else if (r < 0.35) ten = pick(rnd, gender === 'nam' ? TEN_NAM_2 : TEN_NU_1);
  else ten = gender === 'nam' ? `${pick(rnd, TEN_NAM_1)} ${pick(rnd, TEN_NAM_2)}` : `${pick(rnd, TEN_NU_1)} ${pick(rnd, TEN_NU_2)}`;
  return `${ho} ${ten}`;
}

export function newCharacter(meta: Meta): Character {
  const gender = rnd() < 0.5 ? 'nam' : 'nu';
  let origin = weighted(rnd, ORIGINS);
  let lc = weighted(rnd, LINH_CAN);
  if (meta.talents.includes('linh_can')) {
    while (lc.mul < 1.2) lc = weighted(rnd, LINH_CAN);
  }
  const race = origin.id === 'yeu' ? 'yeu' : 'nhan';
  const hairList = Object.entries(HAIR_COLORS)
    .filter(([, h]) => (race === 'yeu' ? h.yeu || h.w <= 4 : !h.yeu))
    .map(([id, h]) => ({ id, w: h.w }));
  const hairColor = weighted(rnd, hairList).id;
  const hairStyle = Math.floor(rnd() * 3);
  const fate = weighted(rnd, LIFE_FATES);
  const lifeMul = Math.round((fate.lo + rnd() * (fate.hi - fate.lo)) * 100) / 100;
  const r = (lo: number, hi: number) => Math.round(lo + rnd() * (hi - lo));
  const c: Character = {
    name: genName(gender),
    gender,
    race,
    origin: origin.name,
    originId: origin.id,
    linhCan: lc.name,
    linhCanMul: lc.mul,
    lifeNo: meta.lives + 1,
    age: 0,
    lifespan: Math.round(r(60, 82) * lifeMul),
    realm: 0,
    layer: 1,
    cultivation: 0,
    stats: { tamCanh: r(35, 65), ngoTinh: r(25, 65), khiVan: r(25, 65), tamMa: r(0, 10), sucKhoe: r(70, 95) },
    daoTam: 0,
    path: null,
    sect: null,
    linhThach: origin.money,
    inventory: ['ao_vai'],
    equipped: { ao: 'ao_vai' },
    pills: {},
    focus: 'tu_luyen',
    partner: null,
    pet: false,
    log: [],
    dead: false,
    cause: null,
    seenEvents: {},
    ascended: false,
    enemy: meta.enemy,
    breakDelay: 0,
    hairColor,
    hairStyle,
    lifeMul,
    outfitTone: Math.floor(rnd() * 5),
    outfitCut: Math.floor(rnd() * 4),
  };
  if (origin.id === 'chua') c.daoTam = 15;
  const t = meta.talents;
  if (t.includes('ky_uc')) stat(c, 'ngoTinh', 20);
  if (t.includes('tho')) c.lifespan = Math.round(c.lifespan * 1.2);
  if (t.includes('gia_tai')) money(c, 300);
  if (t.includes('phuc')) stat(c, 'khiVan', 25);
  if (t.includes('kiem_tam')) giveItem(c, 'moc_kiem');
  if (meta.nghiep >= 10) {
    stat(c, 'khiVan', -Math.min(20, Math.round(meta.nghiep / 2)));
    c.enemy = c.enemy ?? 'oan hồn đòi nợ từ kiếp trước';
  }
  c.log.push({
    age: 0,
    tone: 'big',
    text: `Kiếp thứ ${c.lifeNo}. Bạn chào đời là ${gender === 'nam' ? 'một bé trai' : 'một bé gái'}, ${origin.name.toLowerCase()}. Thầy bói nói bạn mang ${lc.name}.`,
  });
  c.log.push({
    age: 0,
    tone: fate.lo < 0.85 ? 'bad' : fate.lo > 1.1 ? 'good' : 'normal',
    text: `Tóc ${HAIR_COLORS[hairColor].name}, lớn lên sẽ để ${HAIR_STYLES[gender][hairStyle]}. Bà mụ xem tướng bảo: mệnh ${fate.name}.`,
  });
  if (c.enemy && meta.nghiep >= 10) c.log.push({ age: 0, tone: 'ta', text: 'Ngày bạn sinh ra, quạ đen đậu kín mái nhà. Nghiệp kiếp trước vẫn chưa trả hết.' });
  return c;
}

export function makeCtx(c: Character, fxOut: Fx[]): EffectCtx {
  return {
    rnd,
    fx: (kind: FxKind, label?: string) => fxOut.push({ kind, label, id: Math.random() }),
    log: (text: string, tone: Tone = 'normal') => c.log.push({ age: Math.floor(c.age), text, tone }),
  };
}

function die(c: Character, cause: string, ctx: EffectCtx) {
  if (c.dead) return;
  c.dead = true;
  c.cause = cause;
  ctx.fx('death');
  ctx.log(cause, 'big');
}

function enterRealm(c: Character, realm: number, ctx: EffectCtx, talents: string[]) {
  c.realm = realm;
  c.layer = 1;
  c.cultivation = 0;
  const base = REALMS[realm]?.life ?? c.lifespan;
  c.lifespan = Math.min(MAX_LIFE, Math.max(c.lifespan, Math.round(base * lifeMult(c, talents) * (0.9 + rnd() * 0.2))));
}

export function gearMul(c: Character) {
  let m = 1;
  if (c.equipped.ao === 'huyet_bao') m *= 1.15;
  if (c.equipped.phu_kien === 'kiem_bay') m *= 1.2;
  return m;
}

function pathMul(c: Character) {
  switch (c.path) {
    case 'ma':
      return 1.45;
    case 'kiem':
      return 1.15;
    case 'yeu':
      return 1.1;
    case 'phat':
      return 0.9;
    default:
      return 1;
  }
}

export function yearlyGain(c: Character) {
  const base = GAIN[c.realm] ?? 90;
  return base * c.linhCanMul * (0.6 + c.stats.ngoTinh / 100) * pathMul(c) * gearMul(c) * (c.stats.tamMa > 70 ? 0.8 : 1);
}


// Câu chuyện thường ngày ghép ngẫu nhiên từ nhiều mảnh để hiếm khi lặp lại
const WHEN = ['Đầu xuân,', 'Giữa hè,', 'Cuối thu,', 'Đêm đông,', 'Một đêm trăng tròn,', 'Sau cơn mưa rào,', 'Sáng sớm sương mù,', 'Lúc hoàng hôn,', 'Ngày tuyết đầu mùa,', 'Tiết Thanh Minh,', 'Đêm Trung Thu,', 'Mùa hoa đào nở,'];
const WHERE = ['dưới thác Bạch Long', 'trên đỉnh Vân Vụ', 'bên bờ Thanh Giang', 'trong rừng trúc tím', 'ở hậu sơn', 'trong động phủ', 'dưới gốc tùng ngàn năm', 'trên thuyền giữa hồ Kính Nguyệt', 'ở thạch đình bỏ hoang', 'trên vách đá Tuyệt Bích', 'trong ngôi miếu đổ nát', 'giữa thảo nguyên Bắc Mạc'];
const DOING: Record<string, string[]> = {
  tu_luyen: ['bạn ngồi thiền vận chuyển chu thiên', 'bạn luyện đi luyện lại một chiêu kiếm', 'bạn hấp thụ linh khí nhật nguyệt', 'bạn nghiền ngẫm bộ công pháp cũ', 'bạn thử đả thông một huyệt đạo khó', 'bạn luyện công đến quên ăn'],
  luyen_dan: ['bạn canh lò đan suốt bảy ngày', 'bạn thử một đan phương mới', 'bạn đi hái thảo dược', 'bạn ghi chép lại các lần nổ lò', 'bạn phơi thảo dược trên mái nhà'],
  du_ngoan: ['bạn dừng chân ngắm cảnh', 'bạn nghe người kể chuyện giang hồ', 'bạn vẽ lại phong cảnh', 'bạn uống rượu với một khách lạ', 'bạn lạc đường mất ba ngày'],
  kiem_tien: ['bạn bày sạp bán phù chú', 'bạn nhận làm thuê cho thương hội', 'bạn đi buôn linh thảo', 'bạn chép kinh thuê cho chùa', 'bạn đòi nợ giúp một lão chủ tiệm'],
  ket_duyen: ['bạn uống trà luận đạo với bạn cũ', 'bạn dự hội thơ của tu sĩ trẻ', 'bạn giúp một người lạ sửa xe', 'bạn viết thư cho cố nhân', 'bạn kết giao thêm vài đạo hữu'],
  tru_yeu: ['bạn lau sạch máu yêu thú trên vũ khí', 'bạn băng bó vết cào trên tay', 'bạn đếm lại chiến lợi phẩm', 'bạn nghe tiếng sói tru vọng về'],
};
const RESULT: Record<string, string[]> = {
  tu_luyen: ['chân khí lưu chuyển thêm một vòng.', 'trong đầu chợt sáng ra một điều.', 'không thu được gì, nhưng lòng bình thản.', 'mồ hôi ướt đẫm, tu vi nhích thêm một chút.', 'suýt nữa thì khí huyết nghịch hành.'],
  luyen_dan: ['mùi thuốc thơm khắp núi.', 'lò đan nổ, tóc cháy xém một mảng.', 'ra lò mấy viên đan có vân mây.', 'cuối cùng cũng hiểu vì sao lần trước hỏng.'],
  du_ngoan: ['lòng rộng mở hơn hẳn.', 'nhớ nhà da diết.', 'học được vài câu tiếng địa phương.', 'thấy thiên hạ rộng lớn hơn mình tưởng.'],
  kiem_tien: ['kiếm được kha khá linh thạch.', 'bị quỵt mất một nửa tiền công.', 'gặp được một mối làm ăn lâu dài.', 'mệt rã rời nhưng túi rủng rỉnh.'],
  ket_duyen: ['cười nói đến tận khuya.', 'thấy lòng ấm áp lạ thường.', 'nghe được tin đồn thú vị trên giang hồ.', 'hẹn năm sau gặp lại.'],
  tru_yeu: ['tay vẫn còn run.', 'thấy mình mạnh hơn hôm qua.', 'nhớ lại trận đánh suýt mất mạng.'],
};

function flavorLine(c: Character, focus: string): string {
  const extra: string[] = [];
  if (c.pet) extra.push('Tiểu hồ ly cuộn tròn ngủ bên cạnh.');
  if (c.partner) extra.push(`${c.partner} ở bên pha trà.`);
  if (c.enemy) extra.push(`Bạn chợt nghĩ đến ${c.enemy}.`);
  const tail = extra.length && rnd() < 0.25 ? ' ' + pick(rnd, extra) : '';
  return `${pick(rnd, WHEN)} ${pick(rnd, DOING[focus] ?? DOING.tu_luyen)} ${pick(rnd, WHERE)}, ${pick(rnd, RESULT[focus] ?? RESULT.tu_luyen)}${tail}`;
}

const CHILD: Record<number, string> = {
  1: 'Bạn biết đi rồi, chập chững khắp sân.',
  2: 'Bạn bập bẹ gọi được tiếng "mẹ".',
  3: 'Bạn lên cơn sốt cao, cả nhà thức trắng đêm.',
  4: 'Bạn thích ngồi nghe ông kể chuyện tiên nhân bay trên mây.',
  5: 'Bạn tự trèo lên được cây ổi sau nhà.',
};

/** Lên tầng nhỏ, hoặc trả về sự kiện đột phá nếu đã đầy tầng cuối */
function progress(c: Character, ctx: EffectCtx, talents: string[]): PendingEvent | null {
  if (c.dead) return null;
  if (c.realm === 0) {
    if (c.cultivation >= 40 && c.age >= 8) {
      enterRealm(c, 1, ctx, talents);
      ctx.fx('breakthrough', 'Luyện Khí');
      ctx.log('Dẫn khí nhập thể! Bạn chính thức bước vào Luyện Khí, trở thành tu sĩ.', 'big');
    }
    return null;
  }
  const R = REALMS[c.realm];
  let guard = 0;
  while (c.cultivation >= needFor(c) && guard++ < 20) {
    if (c.layer < R.layers) {
      c.cultivation -= needFor(c);
      c.layer += 1;
      ctx.fx('layer', realmLabel(c.realm, c.layer));
      ctx.log(`Lên ${realmLabel(c.realm, c.layer)}.`, 'good');
    } else {
      c.cultivation = needFor(c);
      if (c.breakDelay > 0) return null;
      return buildPending(c, breakEvent(c));
    }
  }
  return null;
}

function checkDeath(c: Character, ctx: EffectCtx) {
  if (c.dead) return;
  if (c.stats.sucKhoe <= 0) die(c, 'Thương thế quá nặng, bạn trút hơi thở cuối cùng.', ctx);
  else if (c.stats.tamMa >= 100) die(c, 'Tâm ma phản phệ. Bạn tẩu hỏa nhập ma, kinh mạch nổ tung.', ctx);
  else if (c.age >= c.lifespan) die(c, `Thọ nguyên cạn kiệt. Bạn tọa hóa ở tuổi ${Math.floor(c.age)}.`, ctx);
}

function eligible(c: Character, e: GameEvent): boolean {
  const a = c.age;
  if (e.minAge !== undefined && a < e.minAge) return false;
  if (e.maxAge !== undefined && a > e.maxAge) return false;
  if (e.minRealm !== undefined && c.realm < e.minRealm) return false;
  if (e.maxRealm !== undefined && c.realm > e.maxRealm) return false;
  const seen = c.seenEvents[e.id];
  // một sự kiện gặp tối đa 2 lần mỗi kiếp (oan gia, tâm ma 3 lần) để đỡ lặp
  const cap = e.id === 'tam_ma' || e.id === 'ke_thu' ? 3 : 2;
  if ((c.evCount?.[e.id] ?? 0) >= cap) return false;
  if (seen !== undefined) {
    if (e.once) return false;
    if (a - seen < (e.cooldown ?? 10)) return false;
  }
  if (e.when && !e.when(c)) return false;
  return true;
}

function buildPending(c: Character, e: GameEvent): PendingEvent {
  c.seenEvents[e.id] = Math.floor(c.age);
  c.evCount = c.evCount ?? {};
  c.evCount[e.id] = (c.evCount[e.id] ?? 0) + 1;
  return {
    id: e.id,
    title: e.title,
    text: e.text(c),
    choices: e.choices(c).map((ch) => ({ label: ch.label, hint: ch.hint, lean: ch.lean })),
  };
}

function pickEvent(c: Character): GameEvent | null {
  const list = EVENTS.filter((e) => eligible(c, e)).map((e) => {
    let w = e.weight ?? 5;
    if (e.id === 'dao_lu' && c.focus === 'ket_duyen') w *= 4;
    return { e, w };
  });
  if (!list.length) return null;
  return weighted(rnd, list).e;
}

export interface TickOpts {
  noEvents?: boolean;
  closed?: boolean; // đang bế quan
  talents?: string[];
}

/** Chạy hết một năm. c.age đã được cộng trước khi gọi. */
export function yearTick(c: Character, ctx: EffectCtx, opts: TickOpts = {}): PendingEvent | null {
  if (c.dead) return null;
  const age = Math.floor(c.age);
  const talents = opts.talents ?? [];
  if (c.breakDelay > 0) c.breakDelay -= 1;

  // Trọng tâm năm nay
  const focus = opts.closed ? 'tu_luyen' : age >= FOCUS[c.focus].minAge ? c.focus : null;
  const jitter = 0.8 + rnd() * 0.4;
  if (age >= 6) {
    const g = yearlyGain(c) * jitter;
    if (focus === 'tu_luyen') addCult(c, g * (opts.closed ? 1.5 : 1));
    else if (c.realm >= 1) addCult(c, g * 0.25);
  }
  if (focus === 'luyen_dan') {
    const mul = (c.path === 'dan' ? 2 : 1) * (c.equipped.vu_khi === 'lo_dan' ? 2 : 1);
    money(c, (15 + 25 * c.realm) * mul * jitter);
    if (rnd() < 0.3 * (c.path === 'dan' ? 1.6 : 1)) {
      const p = c.path === 'dan' && rnd() < 0.25 ? 'truc_co' : pick(rnd, ['tu_khi', 'hoi_xuan', 'thanh_tam']);
      addPill(c, p);
      ctx.log(`Luyện thành một viên ${PILLS.find((x) => x.id === p)?.name}.`, 'good');
    }
  } else if (focus === 'kiem_tien') {
    money(c, (c.realm === 0 ? 12 : 10 + 30 * c.realm) * (0.6 + rnd() * 0.8));
  } else if (focus === 'du_ngoan') {
    if (rnd() < 0.3) stat(c, 'khiVan', 1);
    stat(c, 'tamCanh', 1);
  } else if (focus === 'ket_duyen') {
    stat(c, 'tamCanh', 2);
    stat(c, 'tamMa', -2);
  }

  // Trạng thái thường niên
  const ratio = c.age / c.lifespan;
  if (ratio > 0.85) { if (c.stats.sucKhoe > 12) stat(c, 'sucKhoe', -3); } else stat(c, 'sucKhoe', ratio > 0.7 ? 0 : 3);
  if (c.stats.tamCanh > 60) stat(c, 'tamMa', -1);
  if (c.path === 'ma') stat(c, 'tamMa', 2);
  if (c.path === 'phat') stat(c, 'tamMa', -2);
  if (c.equipped.ao === 'huyet_bao') stat(c, 'tamMa', 1);
  if (c.equipped.ao === 'ca_sa') stat(c, 'tamMa', -2);
  if (c.equipped.ao === 'thanh_sam' || c.equipped.phu_kien === 'ho_lo' || c.equipped.vu_khi === 'phat_tran') stat(c, 'tamCanh', 1);
  if (c.partner) stat(c, 'tamCanh', 1);

  // Thọ nguyên không vượt quá 1.4 lần mức chuẩn của cảnh giới
  const cap = Math.min(MAX_LIFE, Math.round((REALMS[c.realm]?.life ?? 70) * 1.25 * lifeMult(c, talents)));
  if (c.lifespan > cap) c.lifespan = cap;

  // Sự kiện tuổi thơ cố định
  if (!opts.closed && CHILD[age]) ctx.log(CHILD[age]);

  // Tầng / cảnh giới
  const brk = progress(c, ctx, talents);
  checkDeath(c, ctx);
  if (c.dead) return null;
  if (brk) return brk;
  if (c.realm >= 2 && !c.path) return buildPending(c, pathEvent(c));

  if (opts.noEvents || opts.closed) return null;
  const chance = age < 6 ? 0.3 : focus === 'du_ngoan' ? 0.6 : 0.3;
  if (rnd() < chance) {
    const e = pickEvent(c);
    if (e) return buildPending(c, e);
  }
  if (age >= 6 && rnd() < 0.35 && focus) ctx.log(flavorLine(c, focus));
  return null;
}

// --------- Sự kiện đặc biệt ---------

function pathEvent(c: Character): GameEvent {
  return {
    id: PATH_EVENT_ID,
    title: 'Chọn con đường tu tập',
    text: () => 'Trúc Cơ đã thành, đạo cơ vững chắc. Đã đến lúc chọn con đường sẽ đi suốt phần đời còn lại.',
    choices: pathChoices,
  };
}

function breakChance(c: Character) {
  return clamp(
    0.42 - Math.max(0, c.realm - 2) * 0.07 + c.stats.ngoTinh / 450 + c.stats.tamCanh / 500 - c.stats.tamMa / 200 + (c.stats.khiVan - 50) / 500 + c.linhCanMul * 0.05,
    0.08,
    0.9,
  );
}

function breakEvent(c: Character): GameEvent {
  const target = c.realm + 1;
  const name = REALMS[target]?.name ?? 'Phi Thăng';
  const kiep = target >= 3;
  return {
    id: BREAK_EVENT_ID,
    title: kiep ? `Thiên kiếp - đột phá ${name}` : `Đột phá ${name}`,
    text: () =>
      kiep
        ? `Mây đen kéo tới che kín trời. Lôi kiếp đang chờ. Tỉ lệ ước tính khoảng ${Math.round(breakChance(c) * 100)}%.`
        : `Tu vi đã đến đỉnh, bình cảnh rung động. Tỉ lệ ước tính khoảng ${Math.round(breakChance(c) * 100)}%.`,
    choices: breakChoices,
  };
}

function attempt(c: Character, ctx: EffectCtx, bonus: number): string {
  const target = c.realm + 1;
  const name = REALMS[target]?.name ?? 'Phi Thăng';
  const kiep = target >= 3;
  if (kiep) ctx.fx('lightning');
  const ok = rnd() < clamp(breakChance(c) + bonus, 0.05, 0.97);
  if (ok) {
    if (target >= REALMS.length) {
      c.ascended = true;
      c.dead = true;
      c.cause = 'Phi thăng tiên giới';
      ctx.fx('breakthrough', 'PHI THĂNG');
      return 'Chín đạo lôi kiếp tan biến, tiên quang giáng xuống. Bạn phi thăng tiên giới!';
    }
    enterRealm(c, target, ctx, []);
    ctx.fx('breakthrough', name);
    stat(c, 'sucKhoe', 20);
    return `Đột phá thành công! Bạn bước vào ${name}. Thọ nguyên tăng lên ${c.lifespan} năm.`;
  }
  c.cultivation = Math.round(c.cultivation * 0.6);
  c.breakDelay = 3;
  stat(c, 'tamMa', 8);
  const t = hurt(c, kiep ? 40 + (target - 3) * 12 : 25, ctx);
  if (c.stats.sucKhoe <= 0) {
    die(c, kiep ? 'Bạn hóa thành tro bụi dưới thiên kiếp.' : 'Xung quan thất bại, kinh mạch đứt đoạn.', ctx);
    return 'Đột phá thất bại.';
  }
  return 'Đột phá thất bại, tu vi tụt mất một đoạn.' + t;
}

function breakChoices(c: Character): Choice[] {
  const havePill = (c.pills.truc_co ?? 0) > 0;
  const fourth: Choice =
    c.daoTam < -10 || c.path === 'ma'
      ? {
          label: 'Huyết tế để phá quan',
          hint: '+35% tỉ lệ, rất tà',
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -15);
            stat(ch, 'tamMa', 10);
            ctx.fx('evil', 'Huyết tế');
            return 'Bạn bày huyết trận, dùng máu tươi mở đường. ' + attempt(ch, ctx, 0.35);
          },
        }
      : c.partner
        ? { label: `Nhờ ${c.partner} hộ pháp`, hint: '+15%', lean: 'chinh', run: (ch, ctx) => attempt(ch, ctx, 0.15) }
        : c.sect
          ? { label: 'Xin sư môn hộ pháp', hint: '-300 linh thạch, +20%', lean: 'chinh', run: (ch, ctx) => { money(ch, -300); return attempt(ch, ctx, 0.2); } }
          : { label: 'Chọn ngày lành, cầu trời', hint: '+8%', lean: 'trung', run: (ch, ctx) => attempt(ch, ctx, 0.08) };
  return [
    {
      label: havePill ? 'Uống Trúc Cơ Đan rồi xung quan' : 'Mua đan dược rồi xung quan',
      hint: havePill ? `+25%, còn ${c.pills.truc_co}` : '-200 linh thạch, +25%',
      lean: 'trung',
      run: (ch, ctx) => {
        if (!usePill(ch, 'truc_co')) money(ch, -200);
        return attempt(ch, ctx, 0.25);
      },
    },
    { label: 'Cưỡng ép xung quan ngay', hint: 'không thêm gì', lean: 'trung', run: (ch, ctx) => attempt(ch, ctx, 0) },
    {
      label: 'Củng cố thêm 5 năm',
      hint: 'tâm cảnh +, ngộ tính +',
      lean: 'chinh',
      run: (ch) => {
        ch.breakDelay = 5;
        stat(ch, 'tamCanh', 8);
        stat(ch, 'ngoTinh', 4);
        stat(ch, 'tamMa', -6);
        return 'Bạn quyết định chưa vội. Đạo cơ cần thêm thời gian.';
      },
    },
    fourth,
  ];
}

function findEvent(c: Character, id: string): GameEvent | null {
  if (id === PATH_EVENT_ID) return pathEvent(c);
  if (id === BREAK_EVENT_ID) return breakEvent(c);
  return EVENTS.find((e) => e.id === id) ?? null;
}

export function resolveChoice(c: Character, p: PendingEvent, idx: number, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  const e = findEvent(c, p.id);
  if (!e) return null;
  const choice = e.choices(c)[idx];
  if (!choice) return null;
  const result = choice.run(c, ctx);
  const tone: Tone = choice.lean === 'chinh' ? 'chinh' : choice.lean === 'ta' ? 'ta' : 'normal';
  ctx.log(`${p.title}: ${choice.label}. ${result}`, c.dead ? 'big' : tone);
  checkDeath(c, ctx);
  if (c.dead) return null;
  const brk = progress(c, ctx, talents);
  if (brk) return brk;
  if (c.realm >= 2 && !c.path) return buildPending(c, pathEvent(c));
  return null;
}

/** Tua nhiều năm khi bế quan. Dừng khi tới bình cảnh hoặc chết. */
export function closedDoor(c: Character, years: number, ctx: EffectCtx, talents: string[] = []): { pending: PendingEvent | null; done: number } {
  ctx.log(`Bạn đóng cửa động phủ, bế quan ${years} năm.`, 'normal');
  let done = 0;
  for (let i = 0; i < years; i++) {
    c.age = Math.floor(c.age) + 1;
    done++;
    const p = yearTick(c, ctx, { closed: true, talents });
    if (c.dead) break;
    if (p) return { pending: p, done };
  }
  if (!c.dead) ctx.log(`Xuất quan sau ${done} năm.`, 'good');
  return { pending: null, done };
}

export function usePillNow(c: Character, id: string, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  if (!usePill(c, id)) return null;
  if (id === 'tu_khi') {
    addCult(c, reward(c, 0.25));
    ctx.fx('layer', '+tu vi');
  } else if (id === 'dien_tho') {
    c.lifespan = Math.min(MAX_LIFE, c.lifespan + 8);
    ctx.fx('heal', '+thọ nguyên');
  } else if (id === 'thanh_tam') {
    stat(c, 'tamMa', -25);
    ctx.fx('heal', 'Thanh tâm');
  } else if (id === 'hoi_xuan') {
    stat(c, 'sucKhoe', 40);
    ctx.fx('heal', '+sức khỏe');
  } else if (id === 'truc_co') {
    // dùng khi đột phá; uống lúc thường chỉ tăng chút tu vi
    addCult(c, reward(c, 0.15));
    ctx.fx('layer');
  }
  ctx.log(`Bạn uống ${PILLS.find((p) => p.id === id)?.name}.`, 'good');
  return progress(c, ctx, talents);
}

/** Sau khi được cộng tu vi ngoài vòng năm (đánh quái...): lên tầng, đột phá, chọn đường, kiểm tra chết */
export function checkProgress(c: Character, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  checkDeath(c, ctx);
  if (c.dead) return null;
  const brk = progress(c, ctx, talents);
  if (brk) return brk;
  if (c.realm >= 2 && !c.path) return buildPending(c, pathEvent(c));
  return null;
}

export function karmaOf(c: Character) {
  const points = 5 + c.realm * 8 + Math.floor(c.age / 20) + (c.ascended ? 100 : 0);
  const phuc = points + Math.max(0, Math.round(c.daoTam / 4));
  const nghiep = c.daoTam < -30 ? Math.round(-c.daoTam / 4) : 0;
  return { phuc, nghiep };
}

export function seasonOf(age: number) {
  return Math.floor((age % 1) * 4);
}

export function describeLean(daoTam: number) {
  if (daoTam >= 60) return 'Chính đạo';
  if (daoTam >= 20) return 'Hướng thiện';
  if (daoTam > -20) return 'Trung lập';
  if (daoTam > -60) return 'Hướng tà';
  return 'Ma đạo';
}

export { PATHS };
