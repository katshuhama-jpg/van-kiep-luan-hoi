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
  choices: (c: Character) => Choice[];
}

export interface PendingEvent {
  id: string;
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
}
