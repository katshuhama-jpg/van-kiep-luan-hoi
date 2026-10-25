/**
 * Quan hệ giang hồ giữa người chơi thật: huynh đệ kết nghĩa, sổ thù, khiêu khích, truy nã, kẻ né chiến.
 * Dữ liệu tải từ máy chủ rồi giữ ở đây để logic trận đấu dùng (không lưu vào bản lưu nhân vật).
 */

export interface SocialState {
  me: string;
  sworn: string[]; // huynh đệ kết nghĩa
  swornToday: string[]; // huynh đệ hôm nay có vào chơi
  foes: string[]; // mình ghi thù họ
  hatedBy: string[]; // họ ghi thù mình
  provoke: string[]; // khiêu khích qua lại (bên nào gửi cũng tính)
  peace: string[]; // đã hòa giải
  swornReq: string[]; // họ mời mình kết nghĩa, chờ trả lời
  swornSent: string[]; // mình đã mời, chờ họ trả lời
  bounty: Record<string, number>; // tiền truy nã trên đầu từng người
  dodgers: string[]; // kẻ né chiến trong 24 giờ qua
}

export const emptySocial = (): SocialState => ({ me: '', sworn: [], swornToday: [], foes: [], hatedBy: [], provoke: [], peace: [], swornReq: [], swornSent: [], bounty: {}, dodgers: [] });

export const SOCIAL: { cur: SocialState } = { cur: emptySocial() };

export type RelTag = { id: 'thu' | 'huynh_de' | 'hoa' | 'khieu' | 'truy_na' | 'ne_chien' | 'bi_thu'; text: string };

/** Nhãn quan hệ để hiện ở thẻ giao đấu, bảng xếp hạng, nghĩa trang */
export function relTags(player: string | null | undefined, s: SocialState = SOCIAL.cur): RelTag[] {
  if (!player || player === s.me) return [];
  const out: RelTag[] = [];
  if (s.sworn.includes(player)) out.push({ id: 'huynh_de', text: 'Huynh đệ' });
  if (s.foes.includes(player)) out.push({ id: 'thu', text: 'Kẻ thù của bạn' });
  else if (s.hatedBy.includes(player)) out.push({ id: 'bi_thu', text: 'Đang thù bạn' });
  if (s.peace.includes(player) && !s.sworn.includes(player)) out.push({ id: 'hoa', text: 'Đã hòa giải' });
  if (s.provoke.includes(player)) out.push({ id: 'khieu', text: 'Khiêu khích' });
  if (s.bounty[player]) out.push({ id: 'truy_na', text: `Truy nã ${s.bounty[player]} linh thạch` });
  if (s.dodgers.includes(player)) out.push({ id: 'ne_chien', text: 'Kẻ né chiến' });
  return out;
}

/** Hôm nay có huynh đệ cùng vào chơi: tu luyện thêm 5% */
export function swornCultMul(s: SocialState = SOCIAL.cur): number {
  return s.swornToday.length ? 1.05 : 1;
}

export const HUNT_COST = 200; // tiền thuê người dò tung tích kẻ thù
export const BOUNTY_STEPS = [100, 300, 1000];
export const PROVOKE_MUL = 1.5;
