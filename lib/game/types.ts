export type Gender = 'nam' | 'nu';
export type Race = 'nhan' | 'yeu';
export type Focus = 'tu_luyen' | 'luyen_dan' | 'du_ngoan' | 'kiem_tien' | 'ket_duyen' | 'tru_yeu';
export type PathId = 'kiem' | 'dan' | 'tran' | 'phat' | 'ma' | 'yeu';
export type Slot = 'ao' | 'vu_khi' | 'phu_kien';
export type Tone = 'normal' | 'good' | 'bad' | 'big' | 'chinh' | 'ta';
export type Lean = 'chinh' | 'trung' | 'ta';

export interface LogEntry {
  age: number;
  text: string;
  tone: Tone;
}

/** Hiệu ứng hình ảnh tạm thời phát trên nhân vật */
export type FxKind =
  | 'breakthrough'
  | 'layer'
  | 'lightning'
  | 'buy'
  | 'heal'
  | 'hurt'
  | 'love'
  | 'coin'
  | 'death'
  | 'evil';

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
  kiepBonus?: number; // thưởng/phạt từ mini-game thiên kiếp
  mount?: string | null; // tọa kỵ (rồng)
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

export interface WorldEcho {
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
}
