/**
 * Cờ bật tắt tính năng.
 * CHAN_THAN_ON (4.5.0 Chân Thân, Tam Tài): bật từ khối Ngày 4 (lên bản 13/11).
 * Muốn tắt gấp: đặt biến môi trường `NEXT_PUBLIC_CHAN_THAN=0` rồi build lại.
 */
export const CHAN_THAN_ON = process.env.NEXT_PUBLIC_CHAN_THAN !== '0';

/**
 * FIRST_SIMPLE_ON (14/11, tăng trưởng): kiếp đầu tiên của người mới chỉ còn một màn gọn - lá số, một câu mở đầu, một nút lớn.
 * Lý do: 13/11 một nửa người mới (và 123/140 người từ quảng cáo không vào kiếp) rời ở màn Lá số kiếp 1, trung vị 21 giây.
 * Muốn tắt: `NEXT_PUBLIC_FIRST_SIMPLE=0` rồi build lại.
 */
export const FIRST_SIMPLE_ON = process.env.NEXT_PUBLIC_FIRST_SIMPLE !== '0';

/**
 * SON_MON_ON (4.6.0 Sơn Môn Tranh Bá): tắt mặc định, bật ở khối Ngày 7 (lên bản 18/11).
 * Thử trên máy: `NEXT_PUBLIC_SON_MON=1 npx next dev`.
 */
export const SON_MON_ON = process.env.NEXT_PUBLIC_SON_MON === '1';

/**
 * KIEP1_CN_GON (15/11, tăng trưởng, cải thiện "Kiếp đầu gọn" lần 2): kiếp 1 của người mới không tự mở cẩm nang
 * (Hồi 1 Một kiếp người, Hồi 2 Thang cảnh giới, Hồi 3, Hồi 4...). Các hồi dời sang kiếp 2-4, vẫn mở tay được từ nút Cẩm nang.
 * Lý do: 14/11, trong 91 người vào kiếp 1 rồi bỏ giữa chừng, 42 người (46%) có việc cuối cùng là đọc cẩm nang tự mở.
 * Bật mặc định từ đêm 15/11 (bản 16/11) sau khi đo: 44% người bỏ giữa kiếp 1 có việc cuối là cẩm nang tự mở. Tắt: `NEXT_PUBLIC_KIEP1_CN_GON=0`.
 */
export const KIEP1_CN_GON = process.env.NEXT_PUBLIC_KIEP1_CN_GON !== '0';

/**
 * SU_DO_ON (4.6.0 Ngày 3b Sư Đồ): bật mặc định, người chơi thấy từ 16/11. KHÔNG phụ thuộc SON_MON_ON.
 * Muốn tắt gấp: `NEXT_PUBLIC_SU_DO=0` rồi build lại (máy chủ vẫn giữ bảng vkl_su, chỉ ẩn giao diện và link mời).
 */
export const SU_DO_ON = process.env.NEXT_PUBLIC_SU_DO !== '0';

/**
 * TAB_ON (4.6.0 Ngày 5, lên 16/11): thanh 4 tab (Mộng · Nhân vật · Sơn Môn · Lôi đài) + thanh trên có Mời trà và Menu.
 * Bật mặc định, KHÔNG phụ thuộc SON_MON_ON. Tắt gấp: `NEXT_PUBLIC_TAB=0` rồi build lại, trang đầu về menu cũ.
 */
export const TAB_ON = process.env.NEXT_PUBLIC_TAB !== '0';
