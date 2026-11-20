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
 * SON_MON_ON (4.6.0 Sơn Môn Tranh Bá): bật từ khối Ngày 7 (lên bản 18/11, Kỷ 1 bắt đầu 5:00).
 * Tắt gấp: `NEXT_PUBLIC_SON_MON=0` rồi build lại (tab Sơn Môn về màn chờ).
 */
export const SON_MON_ON = process.env.NEXT_PUBLIC_SON_MON !== '0';

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

/**
 * FIRST_AUTO_ON (Ngày 7, 19/11): người chưa có kiếp nào không dừng ở màn chờ bấm, nút vào kiếp tự đếm 4 giây rồi vào.
 * Lý do: 13-19/11, 60% người mới vào thẳng /choi rời màn "Kiếp đầu tiên" sau trung vị 4,5 giây mà chưa bấm. Tắt: `NEXT_PUBLIC_FIRST_AUTO=0`.
 */
export const FIRST_AUTO_ON = process.env.NEXT_PUBLIC_FIRST_AUTO !== '0';

/**
 * FIRST_AB_ON (Ngày 7, 19/11): thử A/B màn đầu. Nhóm 'a' thấy "Cảnh sống" (components/FirstScene.tsx), nhóm 'b' thấy màn gọn cũ.
 * Chia 50/50 theo máy (lưu `vkl.ab.first`), ghi `ab` vào first_simple, first_go, life_start. Tắt (mọi người về màn cũ): `NEXT_PUBLIC_FIRST_AB=0`.
 * Ép cả nhóm về A: `NEXT_PUBLIC_FIRST_AB=a`.
 */
export const FIRST_AB = process.env.NEXT_PUBLIC_FIRST_AB ?? '1';

/**
 * TT3_ON (Ngày 8e, 19/11): Thiên thư quyển III "Cơm Chiều" chặng 1 (XXI-XXV) và kết cục Thân Không Mơ, cho người đã xong quyển II.
 * Tắt gấp: `NEXT_PUBLIC_TT3=0` rồi build lại (không ghi kết cục mới, ẩn tab quyển III; kết cục đã ghi vẫn giữ).
 */
export const TT3_ON = process.env.NEXT_PUBLIC_TT3 !== '0';

/**
 * CT_TU_VI_ON (Ngày 22, 21/11): tu vi chân thân - Cửu Chuyển, 4 tầng, đột phá / áp cảnh, tính ở máy chủ (supabase/ct_tu_vi_2026_11_21.sql).
 * TẮT mặc định tới Ngày 24: khi tắt, client không gọi ct_tv_get / ct_tv_life / ct_tv_dot_pha. Bật thử: `NEXT_PUBLIC_CT_TU_VI=1`.
 */
export const CT_TU_VI_ON = process.env.NEXT_PUBLIC_CT_TU_VI === '1';
