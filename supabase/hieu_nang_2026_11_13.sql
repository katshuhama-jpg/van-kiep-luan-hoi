-- 13/11/2026: giảm tải cơ sở dữ liệu giờ cao điểm (quảng cáo 17h-24h).
-- Đo lúc 21:45: truy vấn đơn giản nhất mất 0,7-1 giây; vkl_leaderboard2 bị hủy vì quá giờ (~4 giây) rồi mới lùi về
-- vkl_leaderboard (~3 giây). Code đã chuyển bảng xếp hạng và trang đầu qua bộ đệm Vercel (app/api/pub).
-- File này thêm chỉ mục cho các truy vấn còn đọc thẳng bảng vkl_lives. Chạy được nhiều lần.

-- kiếp của một người chơi, mới nhất trước (Tàng Kiếp Các, Nghĩa trang "của ta", fetchWorld, bóng người chơi)
create index if not exists vkl_lives_player_name_created_idx on public.vkl_lives (player_name, created_at desc);

-- Đền thờ danh nhân: mộ được thắp hương nhiều nhất
create index if not exists vkl_lives_incense_idx on public.vkl_lives (incense desc) where incense > 0;

-- Bảng Chứng Đạo: lọc trên trường JSON look
create index if not exists vkl_lives_chung_dao_idx on public.vkl_lives (created_at)
  where (look->>'endTag') = 'chung_dao' or (look->>'cosmos') = 'hg';

analyze public.vkl_lives;

-- Việc cần làm tiếp khi có quyền xem máy chủ: chạy
--   explain analyze select * from vkl_leaderboard2('power','all','all','all');
-- để xem vì sao quá giờ, rồi tính sẵn bảng này (bảng tổng hợp cập nhật khi lưu kiếp) thay vì quét lại mỗi lần gọi.
