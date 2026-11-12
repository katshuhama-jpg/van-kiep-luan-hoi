# Tăng trưởng và giữ chân - nhật ký

Tyler chốt 12/11/2026: mỗi đêm sau khi xong khối kế hoạch, xem số liệu, chọn việc có tác động lớn nhất, ghi lại ở đây. Không gỡ tính năng chỉ vì số xấu, cải thiện trước (xem "Sổ cải thiện tính năng"). "Buy me a coffee" không bao giờ bỏ.

Mốc so sánh: còn chơi sau 7 ngày (D7) 11-14% (`docs/so-lieu.md`, mốc trước 4.5.0).

## Câu SQL dùng mỗi đêm

```sql
-- người mới mỗi ngày, D1, D7, số người đủ 2 và 10 kiếp (tài khoản đăng ký, theo ngày vào giờ VN)
with p as (select id, created_at from vkl_players where created_at >= now() - interval '16 day'),
l as (select l.player_id, floor(extract(epoch from (l.created_at - p.created_at))/86400)::int d from vkl_lives l join p on p.id = l.player_id),
agg as (select player_id, count(*) n, bool_or(d >= 1) d1p, bool_or(d >= 7) d7p from l group by player_id)
select (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date ngay, count(*) n,
 count(*) filter (where coalesce(a.n,0)>=1) co_kiep,
 round(100.0*avg(coalesce(a.d1p,false)::int) filter (where p.created_at < now()-interval '2 day'),1) d1,
 round(100.0*avg(coalesce(a.d7p,false)::int) filter (where p.created_at < now()-interval '8 day'),1) d7,
 count(*) filter (where coalesce(a.n,0)>=2) k2, count(*) filter (where coalesce(a.n,0)>=10) k10
from p left join agg a on a.player_id=p.id group by 1 order by 1;

-- màn rời nhiều nhất, phiên, góp ý (đã gom sẵn mỗi ngày)
select day, stats->>'sid' sid, stats->>'open_new' open_new, stats->>'signup_acc' signup, stats->>'play_min_med' play_med, stats->'leave_sc' leave_sc
from vkl_daily where day >= current_date - 8 order by day;

-- mức dùng tính năng 24 giờ qua (số phiên)
select kind, count(*) n, count(distinct sid) sid from vkl_events
where created_at > now() - interval '24 hour' and kind <> 'hb' group by 1 order by 2 desc limit 60;

-- 4.5.0 (từ 13/11): phễu chân thân. ct_intro = xem Mộng Tỉnh, ct_create = tạo xong, huyet_intro = xem Tam Tài Đồ
select kind, count(distinct sid) sid, count(*) filter (where (data->>'done')::boolean) xem_het
from vkl_events where created_at > now() - interval '24 hour'
  and kind in ('ct_intro','ct_create','huyet_intro','huyet_open','huyet_view','huyet_share','ct_card_tap','ct_rename','ct_look')
group by 1 order by 1;
```

## Đêm 12/11/2026 (lên bản 13/11)

Số chính:
- Người mới đăng ký mỗi ngày: 9/11 48, 10/11 58, 11/11 48, 12/11 31 (tới 21:50). Tuần trước còn ads: 130-230/ngày.
- D1 (còn chơi sau 1 ngày): nhóm 5/11 40,5%, 6/11 41,7%, 7/11 32,1%, 8/11 30,1%, 9/11 29,2%, 10/11 22,0%. Đang đi xuống.
- D7: nhóm 2/11 14,3%, 3/11 11,3%, 4/11 7,8% (mốc 11-14%).
- Phễu nhóm 8/11 (146 tài khoản): có kiếp 1 119 (82%), đủ 2 kiếp 98 (67%), đủ 10 kiếp 53 (36%).
- Phiên mỗi ngày (vkl_daily.sid): 7/11 1.847, 8/11 1.888, 9/11 1.247, 10/11 984, 11/11 930.
- Màn rời nhiều nhất 11/11: màn đầu thai 340, đang chơi 322, chưa rõ 241, sự kiện 201, túi đồ 106, chết 76.
- Giờ đông nhất (24 giờ qua, số phiên): 21h 106, 23h 76, 22h 74, 20h 71. Vắng nhất 3-4h sáng.
- Dùng tính năng 24 giờ qua (số phiên, trên 733 phiên mở game): lò rèn 249, Tàng Kinh Các (cp_tang) 337, đấu giá 355, thu phục linh thú 292, Lôi đài 76-89, điểm danh 214, cẩm nang 77, Hồng Hoang đánh 73.
- Góp ý mới 3 ngày qua: 20 (đều trạng thái mới). Báo lỗi: #227 kẹt Lôi đài, #224 hợp đồ mất món, #223 mất cà sa đang mặc, #222 chết khi máu 60%.
- Lỗi Vercel 48 giờ qua: không có.

Nhận định:
- Người mới giảm vì tắt ads; D1 cũng giảm theo nhóm (22-30% so với 35-41% đầu tháng). Không phải lỗi kỹ thuật (Vercel sạch).
- Màn đầu thai là nơi người chơi rời nhiều nhất. 4.5.0 chen Mộng Tỉnh và màn tạo chân thân ngay ở đây (sau kiếp 1), nên phải theo sát phễu `ct_intro` -> `ct_create` từ 13/11. Plan 4.5.0 đã có điều kiện dừng: dưới 60% tạo chân thân thì rút gọn màn tạo.
- Kiếp 2-10 vẫn là chỗ rơi lớn nhất (82% -> 36%), đúng mục tiêu của 4.5.0.

Việc đêm nay:
1. Sửa lỗi chặn người chơi: Lôi đài kẹt khi tắt game giữa trận (góp ý #227). Nguyên nhân: rút đối thủ xong thì máy chủ giữ "trận chờ"; quay lại trong ngày, trang Lôi đài xin khóa bóng trước khi rút, máy chủ trả `PENDING` và trang dừng ở câu báo lỗi, không có cách đánh nốt. Sửa ở trình duyệt (`components/Arena.tsx`): gặp `PENDING` khi ra đài thì dùng đúng bóng máy chủ đang giữ, rút lại ra đúng đối thủ cũ và đánh nốt. Không đổi hàm máy chủ, không đổi luật.
   - Đối chiếu: không trùng với plan-4.5.0 (Ngày 1-4), plan-4.6.0 (Ngày 1-8, Sơn Môn chưa đụng Lôi đài); không có docs/yeu-cau-lam-tinh-nang.md.
   - Đo: `arena_go` so với `arena_fight` mỗi ngày (khoảng cách nhỏ lại), không còn góp ý báo kẹt Lôi đài.
   - Cáo thị: thêm một dòng "Sửa lỗi" vào cáo thị 4.5.0.
2. Không làm thêm thay đổi người chơi thấy được: đêm nay bật 4.5.0 cho mọi người, giữ bản gọn để dễ đọc số chân thân.

Đề xuất chờ Tyler:
- Hai lỗi mất đồ (#224 hợp 9 món ra 3 món cực mà túi không thấy, #223 cà sa đang mặc tự mất) cần soi kỹ dữ liệu túi đồ của người báo; Tyler có muốn ưu tiên đêm 13/11 không?
- Quảng cáo Facebook: CHƯA nên chạy. Plan 4.5.0 đặt điều kiện: chỉ chạy lại khi nhóm vào sau 4.5.0 có D7 cao hơn mốc. Nhóm 13/11 có D7 sớm nhất ngày 21/11. Nếu D7 >= 14% thì đề xuất chạy trước Kỷ 1 (18/11) là không kịp đo; hợp lý hơn là chạy từ 21-22/11.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Video Mộng Tỉnh 9:16, 27 giây, có tiếng chuông (đã gửi Tyler 12/11).
- Caption Page: "Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Từ hôm nay, Vạn Kiếp Luân Hồi có chân thân của riêng ngươi: tự chọn dáng, đặt pháp danh, mỗi kiếp làm được việc gì thì khắc vào thân một huyệt. Kẻ vừa chết kia là ngươi. Nhưng cũng không phải ngươi. Chơi miễn phí trên trình duyệt."
- Caption Threads ngắn: "Chết 40 kiếp rồi mới nhớ ra mặt mình. Bản 4.5.0: chân thân, thập đại huyệt, Tam Tài."

Tyler trả lời 12/11 tối:
- Đồng ý ưu tiên hai lỗi mất đồ #224 (hợp 9 món ra 3 món cực mà túi không thấy) và #223 (cà sa đang mặc tự mất) trong đêm 13/11. Việc đầu tiên của phần Tăng trưởng đêm 13/11: soi `mergeItems` (lib/game/market.ts) và luồng mặc/tháo đồ, tìm đường làm mất đồ, sửa, viết smoke tái hiện.
- Hỏi lại về quảng cáo: không chạy thì người chơi tụt. Claude đề xuất chạy thử nhỏ ngay từ 13/11 thay vì chờ 21/11, chờ Tyler chốt ngân sách.

- Cần xem đêm 13/11: ở màn cáo biệt, ảnh chụp thanh Thập Kiếp chỉ thấy 1 ô sáng trong khi chữ ghi "2/10" (dù class của 2 ô đều là `on`). Kiểm lại trên điện thoại thật.

- Tyler cho biết 12/11: đợt quảng cáo trước chi 300.000đ trong 7 ngày (khoảng 43.000đ/ngày). Đợt đó mang về khoảng 1.000 lượt vào từ Facebook (utm fb 2-9/11), tức khoảng 300đ một lượt vào. Claude đề xuất đợt mới 100.000đ/ngày x 5 ngày, chạy song song ảnh manhua và ảnh hình game thật, mỗi mẫu một utm_content riêng.

Quảng cáo đợt Chân Thân (Tyler giao Claude quyết 12/11, "nghĩ như đồng sở hữu"):
- Hai video, chạy song song, mỗi video 2 khổ (4:5 bảng tin, 9:16 Reels/Stories):
  - "Địa Phủ": hồn các kiếp xếp hàng qua cầu Nại Hà, bảng gỗ ghi kết cục thật (Chết Dưới Răng Thỏ, Chết Đói Đầu Đường...), tan thành bụi vàng, tụ thành chân thân, 10 huyệt sáng có chuông. 18,5 giây. utm_content=diaphu45 / diaphu916.
  - "Bụi Vàng": "Ngươi đã chết bao nhiêu lần?", 10 kiếp lướt nhanh, lưới 40 kiếp tan thành bụi, chân thân và huyệt. 20 giây. utm_content=buivang45 / buivang916.
- Ngân sách đề xuất 100.000đ/ngày, 5 ngày (13-17/11), chia đều hai video. Link: https://van-kiep-luan-hoi.vercel.app/?utm_source=fb&utm_campaign=chanthan&utm_content=<mã trên>.
- Mỗi đêm đo theo utm_content: lượt vào, tài khoản mới, chơi xong kiếp 1, tạo chân thân, còn chơi sau 1 ngày. Sau 2 ngày video thua thì tắt, dồn tiền cho video thắng.
- Dừng hẳn nếu dưới 60% tạo chân thân hoặc dưới 25% còn chơi sau 1 ngày. Qua cả hai mốc thì tăng lên 150-200k/ngày tới 18/11.
- Video dựng từ nhân vật LPC và nền Địa Phủ có sẵn của game, nhạc ngũ cung 8-bit tự sinh như nhạc trong game, không dùng ảnh AI.

Tiến độ việc nhiều đêm: không có.

## Sổ cải thiện tính năng

(chưa có tính năng nào đang cải thiện)

## Tính năng đã ẩn

(chưa có)
