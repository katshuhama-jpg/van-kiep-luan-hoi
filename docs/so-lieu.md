# Số liệu tổng kết theo ngày

- Bảng `vkl_daily` (day date, stats jsonb): mỗi ngày giờ VN một dòng.
- Hàm `vkl_rollup_day(d date)` gom từ `vkl_events`, `vkl_players`, `vkl_lives`, `vkl_feedback`. Chạy lại cho cùng ngày thì ghi đè.
- pg_cron job `vkl_daily_rollup` chạy 00:05 giờ VN (17:05 UTC), gom ngày hôm trước.
- Dữ liệu sự kiện có từ 27/10/2026. 24-26/10 chỉ có số tài khoản và bia mộ.

Các khoá trong stats:
- sid, players, open, open_sid, open_new, open_ret, mobile_sid
- ref (nguồn theo domain), utm
- play_sid, first_choice_sid, life_start, life_bucket (1, 2, 3, 4-10, 11+)
- death, death_age_med, ending
- leave_sc (màn hình lúc rời/ẩn), hour_sid (người theo giờ VN)
- kinds (đếm mọi loại sự kiện)
- signup_acc, graves, feedback, total_acc, total_graves

Khi làm báo cáo: đọc `vkl_daily` cho lịch sử, chỉ truy vấn `vkl_events` cho ngày hôm nay.
