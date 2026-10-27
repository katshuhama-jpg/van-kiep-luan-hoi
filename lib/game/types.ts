export type Gender = 'nam' | 'nu';
export type Race = 'nhan' | 'yeu';
export type Focus = 'tu_luyen' | 'luyen_dan' | 'du_ngoan' | 'kiem_tien' | 'ket_duyen' | 'tru_yeu';
export type PathId = 'kiem' | 'dan' | 'tran' | 'phat' | 'ma' | 'yeu';
export type Slot = 'ao' | 'vu_khi' | 'phu_kien';
export type Element = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'; // ngũ hành bản mệnh
export type Tone = 'normal' | 'good' | 'bad' | 'big' | 'chinh' | 'ta';
export type Lean = 'chinh' | 'trung' | 'ta';

export interface LogEntry {
  age: number;
  text: string;
  tone: Tone;
}

/** Hiệu ứng hình ảnh tạm thời phát trên nhân vật */
export type FxKind = 'breakthrough' | 'layer' | 'lightning' | 'buy' | 'heal' | 'hurt' | 'love' | 'coin' | 'death' | 'evil';

export interface Fx {
  kind: FxKind;
  id: number;
  label?: string;
}

export interface Stats {
  tamCanh: number; // 0-100 tâm cảnh
  ngoTinh: number; // 0-100 ngộ tính
  khiVan: number; // 0-100 khí vận
  tamMa: number; // 0-100 tâm ma
  sucKhoe: number; // 0-100 sức khỏe
}

export interface Character {
  name: string;
  gender: Gender;
  race: Race;
  origin: string;
  originId: string;
  linhCan: string;
  linhCanMul: number;
  lifeNo: number;
  age: number;
  lifespan: number;
  realm: number;
  layer: number;
  cultivation: number;
  stats: Stats;
  daoTam: number; // -100 Tà .. +100 Chính
  path: PathId | null;
  sect: string | null;
  linhThach: number;
  inventory: string[];
  equipped: Partial<Record<Slot, string>>;
  pills: Record<string, number>;
  bought?: string[]; // đồ Luyện Hư, Độ Kiếp đã mua ở phường thị kiếp này (mỗi món một lần)
  pillBuy?: Record<string, number>; // số viên đã mua ở phường thị trong kiếp này (Diên Thọ đắt dần)
  dtUsed?: number; // số Diên Thọ Đan đã uống trong kiếp này (kháng dược)
  lifeExtra?: number; // thọ nguyên cộng thêm từ đan dược, được giữ ngoài mức trần thọ của cảnh giới
  focus: Focus;
  partner: string | null;
  pet: boolean;
  log: LogEntry[];
  dead: boolean;
  cause: string | null;
  seenEvents: Record<string, number>;
  ascended: boolean;
  enemy: string | null;
  breakDelay: number; // số năm còn phải chờ trước khi thử đột phá lại
  breakFail?: { r: number; n: number }; // 3.1.0: số lần đột phá hỏng liên tiếp ở cảnh giới r
  hairColor?: string; // khóa màu tóc bẩm sinh (HAIR_COLORS)
  hairStyle?: number; // 0-2 kiểu tóc
  lifeMul?: number; // thọ mệnh bẩm sinh: <1 đoản thọ, >1 trường thọ
  outfitTone?: number; // phối màu áo bẩm sinh
  outfitCut?: number; // kiểu dáng áo 0-3
  huntTarget?: string; // quái đang chọn đánh
  autoFlee?: boolean; // tự rút lui khi máu thấp
  kills?: Record<string, number>;
  evCount?: Record<string, number>; // số lần đã gặp mỗi sự kiện trong kiếp này
  income?: number; // thu nhập thụ động mỗi năm (ruộng, cửa tiệm, cho vay)
  monLv?: Record<string, number>; // cấp tăng thêm của từng loài quái do bị săn nhiều
  region?: string; // vùng đất nơi sinh
  birthPlace?: string; // làng/trấn nơi sinh
  familyTier?: number; // gia cảnh lúc sinh 0-4
  streak?: { f: string; n: number }; // số năm liên tiếp làm cùng một việc
  lastClosed?: number; // tuổi lần xuất quan gần nhất
  gifts?: string[]; // thiên phú rút được lúc đầu thai
  past?: PastLife | null; // kiếp trước của chính mình
  stash?: Stash | null; // rương kiếp trước chôn lại, chưa tìm thấy
  world?: WorldEcho; // dấu vết của người chơi khác
  arcs?: Record<string, { s: number; at: number; v?: string }>; // chuỗi sự kiện nhiều năm
  endTag?: string; // đánh dấu kết cục đặc biệt
  element?: Element; // ngũ hành bản mệnh
  danDoc?: { y: number; n: number }; // số viên đan đã uống trong năm (đan độc)
  petKind?: string; // loại thú cưng (xem lib/game/pets.ts)
  lookSeed?: number; // nét riêng của ngoại hình: da, khuôn mặt, râu, trang sức
  legend?: Legend | null; // thần binh truyền kiếp đang mang
  vendettas?: Vendetta[];
  hunt?: { rival: RivalChar; at: number } | null;
  loreDone?: boolean; // đã gom đủ Thiên thư: kiếp này sẽ gặp lại chính mình
  quyNhat?: boolean; // tài khoản đã từng đạt Vạn Kiếp Quy Nhất: không gặp lại, đeo chuông vàng
  lore2?: number; // số mảnh Quyển II đã mở lúc đầu thai
  bell?: number; // Kẻ Gõ Chuông: 1 đã đánh bại (cầm dùi chuông), 2 đã chọn gõ hay đập
  kiepSo?: number; // Kiếp Số hiệu lực lúc đầu thai (Luân Hồi Đạo)
  kiepTich?: number; // kiếp tích: mỗi điểm +5% đột phá
  tanHon?: boolean; // vừa uống canh Mạnh Bà: phúc duyên kiếp này +20%
  cauHon?: boolean; // không uống canh 5 lần liền: Câu hồn sứ giả truy theo
  cosmos?: 'tien' | 'ma' | 'hu' | null; // đã phi thăng lên tiên giới hay ma giới
  ascendAge?: number; // tuổi lúc phi thăng
  sectRank?: number; // bậc trong tông môn: 0 tạp dịch, 1 ngoại môn, 2 nội môn, 3 chân truyền
  sectHide?: boolean; // ngược phe nhưng giấu thân phận ở lại tông
  maStep?: number; // 3.1.0 chuỗi nhập Ma giới: đã qua mấy bước (0-4)
  arc?: Record<string, number>; // 3.1.0 cốt truyện sau phi thăng: đang ở bước nào
  arcAt?: Record<string, number>; // tuổi lúc qua bước đó
  maAt?: number; // tuổi lúc qua bước gần nhất của chuỗi Ma giới
  maLord?: 'huyet' | 'cot' | 'anh'; // Ma quân đã nhận làm chủ
  maLand?: number; // địa bàn ở Ma giới: thu linh thạch mỗi năm
  maTitle?: string; // danh hiệu Ma Đế ban
  tcVay?: number; // số lần Thiên Cơ Các bị chính tà vây đánh trong kiếp
  daiBiAt?: number; // tuổi tới kỳ Đại bỉ tông môn kế tiếp
  sectSaved?: boolean; // chân truyền đã được sư phụ cứu một lần // truy sát: thuê người dò tung tích, năm sau chạm mặt
  qf?: Record<string, number>; // đếm việc làm trong đời cho nhiệm vụ ngày
  miles?: Mile[]; // cột mốc chính của đời, để xem lại ở nghĩa trang
  mileSnap?: { realm: number; path: string | null; partner: string | null; pet: string | null; mount: string | null; sect?: string | null; wealth?: number; rare?: string[]; kills?: number };
  maKien?: boolean; // tâm ma tăng chậm
  oanHon?: boolean; // oan hồn đỡ một lần chết
  maTon?: boolean; // ma tôn chuyển thế: tu nhanh hơn
  grace16?: boolean; // được trời thương đến 16 tuổi
  hpWarnAt?: number; // năm gần nhất đã cảnh báo sức khỏe
  ambushSeen?: string[]; // mấy loài quái chặn đường gần nhất, để không lặp lại
  timid?: number; // số lựa chọn an toàn liên tiếp gần đây: hiền quá dễ bị bắt nạt
  kiepBonus?: number; // thưởng/phạt từ mini-game thiên kiếp
  an?: Partial<Record<Element, number>>; // Ngũ Hành Ấn thu được khi diệt quái có hệ (tối đa 5 mỗi hệ)
  cgY?: number; // năm đang tính trần tu vi sau phi thăng
  cgN?: number; // tu vi đã hấp thu trong năm đó
  daiHan?: boolean; // đã gặp đại hạn ở Độ Kiếp (tọa hóa hay truyền công)
  truyenCong?: boolean; // chọn truyền công lúc tọa hóa: game gửi phúc duyên cho người khác
  suy?: number; // dấu hiệu suy tàn đã hiện ở ba cõi (0-4)
  tqWarn?: number; // năm gần nhất bị thiên quy cảnh cáo
  ascWait?: number; // năm gần nhất đã nhắc chưa đủ tuổi phi thăng
  phu?: number; // Ngũ Hành Phù: đổi bản mệnh một vòng trên Ngũ Hành Đài
  nhd?: { won: number; lose5: number; tries: number; done?: boolean; warned?: boolean; lost?: number }; // Ngũ Hành Vấn Tâm Đài trước khi phi thăng
  mount?: string | null; // tọa kỵ (rồng)
  fateName?: string; // tướng số lúc sinh
}

export interface PastLife {
  name: string;
  lifeNo: number;
  age: number;
  realm: number;
  realmName: string;
  daoTam: number;
  cause: string | null;
  path: string | null;
  partner: string | null;
}

export interface Stash {
  from: string; // tên kiếp trước
  lifeNo: number;
  money: number;
  item: string | null;
  note: string;
  place: string;
}

export interface Grave {
  char: string;
  player: string;
  age: number;
  realm: string;
  cause: string | null;
  epitaph: string | null;
  dao: number;
}

/** Nhân vật của người chơi khác (rút gọn) để gặp trong giang hồ */
export interface RivalChar {
  player: string;
  name: string;
  gender: 'nam' | 'nu';
  race?: 'nhan' | 'yeu';
  realm: number;
  layer: number;
  path: PathId | null;
  daoTam: number;
  age: number;
  lifespan?: number;
  hairColor?: string;
  hairStyle?: number;
  outfitTone?: number;
  outfitCut?: number;
  equipped?: Partial<Record<Slot, string>>;
  lookSeed?: number;
  element?: Element;
  lifeNo?: number; // kiếp thứ mấy của người chơi đó
  sect?: string | null;
  sectRank?: number;
  cosmos?: 'tien' | 'ma' | 'hu' | null;
  alive: boolean;
  lifeId?: number; // lôi đài: kiếp nào làm bóng (0 là nhân vật đang sống)
}

export interface WorldEcho {
  rivals?: RivalChar[]; // nhân vật người chơi khác, để gặp đồng đạo, địch thủ
  past?: RivalChar | null; // chính mình kiếp trước
  graves: Grave[];
  ma?: { name: string; player: string; realm: number; realmName: string } | null;
  chinh?: { name: string; player: string; realm: number; realmName: string } | null;
}

export interface Choice {
  label: string;
  hint?: string;
  lean: Lean;
  run: (c: Character, ctx: EffectCtx) => string;
}

export interface GameEvent {
  id: string;
  cosmos?: 'tien' | 'ma' | 'hu' | 'both'; // sự kiện chỉ có ở tiên giới, ma giới; sự kiện phàm giới không xảy ra sau phi thăng
  minAge?: number;
  maxAge?: number;
  minRealm?: number;
  maxRealm?: number;
  weight?: number;
  once?: boolean;
  cooldown?: number;
  when?: (c: Character) => boolean;
  title: string;
  text: (c: Character) => string;
  choices: (c: Character, seed: number) => Choice[];
}

export interface PendingEvent {
  id: string;
  seed?: number; // để bộ lựa chọn ngẫu nhiên giữ nguyên khi chọn
  title: string;
  text: string;
  choices: { label: string; hint?: string; lean: Lean }[];
}

export interface EffectCtx {
  rnd: () => number;
  fx: (kind: FxKind, label?: string) => void;
  log: (text: string, tone?: Tone) => void;
}

export interface Talent {
  id: string;
  name: string;
  desc: string;
  cost: number;
  ta?: boolean; // trả bằng nghiệp lực thay vì phúc duyên
}

export interface Meta {
  phucDuyen: number; // điểm phúc (chính)
  nghiep: number; // điểm nghiệp (tà)
  lives: number;
  talents: string[]; // thiên phú đã mua cho kiếp sau
  enemy: string | null; // kẻ thù kiếp trước
  past?: PastLife | null;
  stash?: Stash | null;
  endings?: Record<string, number>; // Sổ Sinh Tử: kết cục đã mở
  daily?: { day: string; quests: string[]; done: string[] }; // nhiệm vụ ngày
  streak?: { day: string; n: number; giftDay?: string }; // chuỗi ngày tu luyện
  prophecy?: { id: string; text: string } | null; // lời tiên tri cho kiếp sau
  legend?: Legend | null; // thần binh truyền kiếp
  vendettas?: Vendetta[]; // kẻ thù là người chơi thật, để báo thù
  feud?: Record<string, number[]>;
  lore?: string[]; // Thiên thư: các mảnh ký ức đã mở
  itemBook?: string[]; // Bảo khố: đồ ẩn đã từng có được
  seenVer?: string; // bản cập nhật đã xem cáo thị
  seenBook?: { e: number; i: number }; // số kết cục, đồ ẩn đã xem (để báo mục mới) // huyết hải thâm thù: các kiếp đã giao đấu với từng người chơi
  petBook?: string[]; // các loài linh thú đã từng nuôi
  achievements?: string[]; // thành tựu dài hạn đã đạt
  career?: Career; // số liệu cộng dồn qua các kiếp
  quyThuong?: boolean; // đã nhận thưởng Vạn Kiếp Quy Nhất
  chuongWin?: boolean; // đã đánh bại Kẻ Gõ Chuông
  honPill?: { day: string; n: number }; // Hoàn Hồn Đan đã uống trong ngày
  hon?: { v: number; at: number }; // Hồn lực lúc đầu thai gần nhất (at: giờ máy chủ, ms)
  tinhTam?: number; // tĩnh tâm từ canh Mạnh Bà: mỗi bậc giảm 1 Kiếp Số hiệu lực
  noDrink?: number; // số lần liên tiếp không uống canh
  ttDecay?: number; // đếm để tĩnh tâm phai dần
  kiepTich?: number; // kiếp tích mang sang kiếp sau
}

export interface Career {
  maxAge: number;
  maxRealm: number;
  ascPaths: string[]; // các đạo đã phi thăng
  paths: string[]; // các đạo đã từng đi
  duelWins: number;
  revenges: number;
  cosmoses?: string[]; // các cõi đã từng lên: tien, ma, hu
  nhdClean?: boolean; // từng qua Ngũ Hành Đài mà chưa ngã lần nào
}

export type MileKind = 'birth' | 'path' | 'realm' | 'love' | 'pet' | 'mount' | 'duel' | 'revenge' | 'sect' | 'wealth' | 'treasure' | 'hunt' | 'journey' | 'fate' | 'death';
export interface Mile {
  age: number;
  kind: MileKind;
  text: string;
  realm?: number;
}

export interface Legend {
  item: string; // id món vũ khí gốc
  name: string; // tên người chơi đặt
  lv: number; // số đời đã truyền
}

export interface Vendetta {
  player: string;
  name: string; // tên nhân vật kẻ thù
  items: string[]; // đồ bị cướp
  why: string;
}
