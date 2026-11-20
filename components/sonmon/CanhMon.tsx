/**
 * 20/11 (Tyler duyệt đợt đồ họa 2): cảnh tông môn từ Cultivation World Simulator (4thfever, CC BY-NC-SA 4.0),
 * ghi công ở /tac-gia. Ảnh giữ nguyên nội dung, chỉ đổi sang webp cho nhẹ.
 * 20/11 7:31 (Tyler: icon chính điện và ảnh không đồng nhất): cảnh chọn theo kiểu chính điện môn đã chọn, không theo mã môn.
 */
import { tr } from '@/lib/i18n';
import { HuyHieu } from './Pixel';

/** kiểu chính điện (CHINH_DIEN 0-9) → số ảnh cảnh gần nhất */
const CANH_CUA_CD = [
  10, // Điện mái cong → điện mái cong giữa vườn đào
  1, // Lầu ba tầng → lầu nhiều tầng trên đỉnh núi
  11, // Tháp đá → tháp đá trên vách
  3, // Am tranh → am bên hồ sương
  2, // Cung trên mây → cung trên đảo mây
  4, // Động đá → động đá có tượng
  6, // Đài sen → đài dưới trăng, rèm hồng
  5, // Thành gỗ → thành lũy
  7, // Miếu cổ → miếu cổ cổng đá
  13, // Lầu bát giác → lầu trên núi có cột sáng
];
export const canhSo = (hinh: number) => CANH_CUA_CD[Math.max(0, Math.min(9, Math.floor(hinh) || 0))];

/** Ảnh lớn đầu thẻ Môn nhà */
export function CanhBanner({ hinh }: { hinh: number }) {
  return <img className="sm-canh" src={`/cws/mon/s${canhSo(hinh)}.webp`} alt={tr('Cảnh sơn môn', 'Sect scenery')} width={512} height={512} loading="lazy" decoding="async" />;
}

/** Ảnh nhỏ trong danh sách môn, huy hiệu đặt ở góc */
export function CanhThumb({ hinh, huy, size = 64 }: { hinh: number; huy: number; size?: number }) {
  return (
    <span className="sm-canh-t" style={{ width: size, height: size }}>
      <img src={`/cws/mon/t${canhSo(hinh)}.webp`} alt="" width={size} height={size} loading="lazy" decoding="async" />
      <span className="sm-canh-hh">
        <HuyHieu id={huy} size={26} />
      </span>
    </span>
  );
}
