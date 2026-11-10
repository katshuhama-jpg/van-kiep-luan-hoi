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

Thêm 31/10 tối:
- `vkl_rollup_play(d)` (cron 00:10): play_min_total, play_min_med (phút chơi trung vị mỗi phiên sid), sid_5m, sid_15m, sid_30m. Phút chơi = tổng khoảng cách giữa các sự kiện liên tiếp của một sid, bỏ khoảng hơn 10 phút.
- `vkl_nightly_check(d)` (cron 00:15): lives_behind, lives_behind_names (tài khoản có số kiếp thấp hơn bia, phải luôn là 0).
- Cron `vkl_prune_hb` (00:30): xóa sự kiện hb cũ hơn 30 ngày. Các sự kiện khác giữ nguyên.
- Chỉ mục `vkl_events (kind, created_at)` cho truy vấn báo cáo.
- `vkl_meta_hist`: lịch sử hồ sơ (60 bản gần nhất mỗi người) để khôi phục khi mất dữ liệu.

## Mốc trước 4.5.0 (Chân Thân), chạy 10/11/2026 22:30 giờ VN

Chỉ tính tài khoản đăng ký (khách không có player_id). "Còn chơi sau N ngày" = có ít nhất một kiếp kết thúc (bia trong `vkl_lives`) từ ngày thứ N trở đi kể từ lúc tạo tài khoản; "đúng ngày N" = có kiếp trong khoảng ngày thứ N (24 giờ). Chỉ tính người đã đủ ngày để xét. Truy vấn `vkl_events` theo người chơi bị quá thời gian, nên dùng `vkl_lives`.

Còn chơi theo tuần vào (tuần bắt đầu thứ Hai):

| Tuần vào | Tài khoản | Còn chơi sau 1 ngày | Còn chơi sau 7 ngày | Đúng ngày 1 | Đúng ngày 7 |
| --- | --- | --- | --- | --- | --- |
| 19/10 | 31 | 48,4% | 25,8% | 45,2% | 9,7% |
| 26/10 | 566 | 32,0% | 9,5% | 22,8% | 6,5% |
| 2/11 | 1.103 | 36,3% | 12,0% (chỉ người vào trước 3/11) | 30,3% | 10,5% |
| 9/11 | 99 | chưa đủ ngày | chưa đủ ngày | | |

Phân bố số kiếp (tài khoản tạo từ 12/10, 1.799 người): 0 kiếp 390, 1 kiếp 180, 2-3 kiếp 224, 4-10 kiếp 391, 11-30 kiếp 370, 31+ kiếp 244.

Đủ số kiếp: trong 7 ngày đầu, 35,6% đủ 10 kiếp, 14,9% đủ 31 kiếp (945 người đã qua 7 ngày). Trong 14 ngày đầu, 43,8% đủ 10 kiếp, 25,8% đủ 31 kiếp (mới 89 người qua 14 ngày, số còn nhỏ).

Câu SQL để chạy lại (đổi mốc ngày nếu cần):

```sql
-- còn chơi theo tuần vào
with p as (select id, created_at from vkl_players where created_at >= '2026-10-12'),
l as (select l.player_id, floor(extract(epoch from (l.created_at - p.created_at))/86400)::int d
      from vkl_lives l join p on p.id = l.player_id),
agg as (select player_id, bool_or(d = 1) d1, bool_or(d = 7) d7, bool_or(d >= 1) d1p, bool_or(d >= 7) d7p from l group by player_id)
select date_trunc('week', p.created_at at time zone 'Asia/Ho_Chi_Minh')::date wk, count(*) n,
  round(100.0 * avg(coalesce(a.d1p, false)::int) filter (where p.created_at < now() - interval '2 day'), 1) con_choi_sau1,
  round(100.0 * avg(coalesce(a.d7p, false)::int) filter (where p.created_at < now() - interval '8 day'), 1) con_choi_sau7,
  round(100.0 * avg(coalesce(a.d1, false)::int) filter (where p.created_at < now() - interval '2 day'), 1) dung_ngay1,
  round(100.0 * avg(coalesce(a.d7, false)::int) filter (where p.created_at < now() - interval '8 day'), 1) dung_ngay7
from p left join agg a on a.player_id = p.id group by 1 order by 1;

-- phân bố số kiếp, % đủ 10 và 31 kiếp trong 7 và 14 ngày
with p as (select id, created_at from vkl_players where created_at >= '2026-10-12'),
c as (select p.id, p.created_at, count(l.id) n_all,
        count(l.id) filter (where l.created_at < p.created_at + interval '7 day') n7,
        count(l.id) filter (where l.created_at < p.created_at + interval '14 day') n14
      from p left join vkl_lives l on l.player_id = p.id group by p.id, p.created_at)
select count(*) filter (where n_all = 0) k0, count(*) filter (where n_all = 1) k1,
  count(*) filter (where n_all between 2 and 3) k2_3, count(*) filter (where n_all between 4 and 10) k4_10,
  count(*) filter (where n_all between 11 and 30) k11_30, count(*) filter (where n_all >= 31) k31,
  round(100.0 * avg((n7 >= 10)::int) filter (where created_at < now() - interval '7 day'), 1) du10_7n,
  round(100.0 * avg((n7 >= 31)::int) filter (where created_at < now() - interval '7 day'), 1) du31_7n,
  round(100.0 * avg((n14 >= 10)::int) filter (where created_at < now() - interval '14 day'), 1) du10_14n,
  round(100.0 * avg((n14 >= 31)::int) filter (where created_at < now() - interval '14 day'), 1) du31_14n
from c;
```
