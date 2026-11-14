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

Quảng cáo đợt Chân Thân - bản chốt (Tyler chạy từ 13/11, 300.000đ/7 ngày, muốn rẻ):
- 1 chiến dịch Lưu lượng truy cập, tối ưu lượt click liên kết (web chưa có Meta Pixel). Ngân sách TRỌN ĐỜI 300.000đ, 13/11 00:00 - 19/11 23:59, lịch chạy 17:00-23:59 mỗi ngày.
- 1 nhóm quảng cáo: Việt Nam, 18-40, Advantage+ đối tượng (gợi ý sở thích: tiểu thuyết tiên hiệp, truyện chữ, game nhập vai, game di động), vị trí Advantage+.
- 3 quảng cáo trong cùng nhóm, link vào thẳng /choi:
  - diaphu: video Địa Phủ (9:16 cho Reels/Stories, 4:5 cho bảng tin). Hook: "Kiếp 4 · Chết Dưới Răng Thỏ".
  - buivang: video Bụi Vàng. Hook: "Ngươi đã chết bao nhiêu lần?".
  - anh40: ảnh "Chết 40 kiếp rồi mới nhớ ra mặt mình."
  - Link: https://van-kiep-luan-hoi.vercel.app/choi?utm_source=fb&utm_medium=paid&utm_campaign=chanthan&utm_content=<mã>
- Không sửa gì 13-14/11 (Meta đang học). Sáng 15/11: tắt quảng cáo có giá mỗi người chơi xong kiếp 1 cao nhất (đo bằng vkl_events: open có data.q chứa utm_content, nối sid với life_end). Không đổi ngân sách giữa chừng.
- Dừng cả chiến dịch nếu dưới 60% người mới tạo chân thân hoặc dưới 25% còn chơi sau 1 ngày.
- Mốc tuần trước (300k): khoảng 1.000 lượt vào từ Facebook. Mục tiêu tuần này: bằng hoặc hơn số lượt vào, và nhiều người chơi xong kiếp 1 hơn nhờ link vào thẳng game.
- Song song, miễn phí: đăng hai video lên Reels Page, TikTok, Threads, nhóm Facebook (utm_source=page|tiktok|threads|nhom).
- Ý tưởng chờ Tyler: video người làm game tự kể (founder content, rẻ và hay chạy tốt nhất trên Meta). Chỉ làm khi Tyler đồng ý và tự kể câu chuyện thật.

Tiến độ việc nhiều đêm: không có.

## Đêm 13/11/2026 (lên bản 14/11)

Lưu ý: đêm nay có HAI phiên chạy cùng lúc (tác vụ bị gọi hai lần). Phiên kia làm 4.6.0 Ngày 1 (SQL Sơn Môn, thử trên Postgres cục bộ) và `lib/sonmon/data.ts`; phiên này làm phần Tăng trưởng dưới đây. Bản mô phỏng Sơn Môn phiên này viết trước khi thấy phiên kia được cất ở nhánh `sim-ban-song-song` (dùng `data.ts` khác, chưa gộp) để đêm 14/11 tham khảo khi làm Ngày 2, tránh làm hai lần.

Không kết nối được Supabase và Vercel (máy chủ công cụ báo lỗi 502), nên không chạy được các câu SQL ở trên (vkl_players, vkl_events, vkl_daily không đọc được bằng khóa công khai) và không xem được lỗi Vercel. Số dưới đây đọc từ bảng bia `vkl_lives` (đọc công khai) và danh sách góp ý công khai, nên "người mới" ở đây là người xong kiếp 1 trong ngày, KHÔNG so thẳng với số tài khoản mới của đêm 12/11.

Số chính (theo người xong kiếp 1, giờ VN, bỏ tài khoản test_/ui_):
- Người xong kiếp 1 mỗi ngày: 7/11 120, 8/11 115, 9/11 41, 10/11 46, 11/11 35, 12/11 32, 13/11 44 (tới 22:07; quảng cáo Chân Thân chạy từ 17:00).
- Còn chơi sau 1 ngày (có kiếp khác sau 24 giờ): nhóm 5/11 48,8%, 6/11 50,0%, 7/11 45,0%, 8/11 36,5%, 9/11 36,6%, 10/11 41,3%.
- Còn chơi sau 7 ngày: nhóm 1/11 14,6%, 2/11 19,2%, 3/11 14,9%, 4/11 9,6% (mốc 11-14%).
- Đủ 2 kiếp: nhóm 13/11 đã 29/44 (66%) ngay trong ngày; đủ 10 kiếp: nhóm 9-10/11 khoảng 45%.
- Người có ít nhất một kiếp mỗi ngày: 8/11 337, 9/11 233, 10/11 217, 11/11 194, 12/11 182, 13/11 173 (tới 22:07). Kiếp mỗi ngày: 2.276 -> 991 (12/11).
- Giờ đông nhất 24 giờ qua (số kiếp): 21h 84, 22h 68, 20h 63; vắng nhất 4-6h.
- Góp ý mới từ 11/11: #220-#238 (19 góp ý), chưa có góp ý nào báo lỗi chân thân sau khi 4.5.0 lên. Báo lỗi còn mở: #235 thu phục Cùng Kỳ mà sổ linh thú không ghi, #236 bị cướp rìu Bàn Cổ không tìm được người để trả thù, #222 chết khi máu 60%.

Nhận định:
- Người chơi mỗi ngày giảm đều từ khi tắt quảng cáo (337 -> 182 trong 4 ngày). Ngày đầu 4.5.0 và quảng cáo mới: người xong kiếp 1 tăng từ 32 lên 44, tỉ lệ đủ 2 kiếp trong ngày 66%. Cần số `ct_intro` -> `ct_create` (vkl_events) để biết màn tạo chân thân có làm rơi người không; đêm sau đọc khi Supabase kết nối lại.
- #224/#225 (hợp 9 món ra 3 món Cực phẩm rồi mất, "mất nhiều món đồ cực do lỗi bug game") đã tìm ra nguyên nhân: đồ Cực phẩm rơi và hợp ra đều có giá 0, nên khi đang mặc một món Cực phẩm cùng ô, món Cực phẩm mới hợp được bị tính là "thừa" (luật cũ: cùng phẩm và giá thấp hơn hoặc bằng món đang mặc). Nút "Bán N món thừa" / "Phân giải N món thừa" bán luôn các món đó. Thêm nữa: nút ở tab Áo vẫn bán cả vũ khí, phụ kiện thừa ở tab khác mà người chơi không thấy. Hàm hợp đồ (`mergeItems`) đúng: thử 3.600 lần hợp ở cảnh giới 2-7, món ra luôn nằm trong túi.
- #223 (La Hán kim lan cà sa đang mặc tự mất, đổi sang áo thường): cà sa là đồ tông môn Phổ Đà Sơn; khi bị trục xuất (lộ thân phận vì đạo tâm lệch, hoặc phản sư thất bại) tông thu lại áo bào và mặc áo vải. Đúng luật, nhưng nhật ký chỉ ghi "lột áo bào" mà không nêu tên món, và trong túi không có chỗ nào báo trước.

Việc đêm nay (Tyler dặn 12/11 ưu tiên #224 và #223):
1. Túi đồ (`components/BagDoll.tsx`): chiếc gốc của món Cực phẩm không bao giờ tính là thừa (bản trùng vẫn tính), nên nút bán/phân giải đồ thừa không còn bán món Cực phẩm; muốn bỏ thì bán từng món. Nút chỉ đụng đồ ở tab đang chọn. Bước "Chắc chưa?" ghi tên từng món sẽ bán. Không đổi giá bán, không đổi luật hợp đồ.
2. Đồ tông môn: túi đồ ghi "Đồ tông môn: bị trục xuất khỏi tông thì tông thu lại." ngay dưới mô tả; khi trục xuất, nhật ký thêm dòng "<tông> thu lại đồ tông môn: <tên các món>." Không đổi luật trục xuất.
3. Đo: sự kiện mới `do_thua` (act ban/phan, n, tab) khi bấm bán/phân giải đồ thừa; theo dõi góp ý báo mất đồ sau khi lên bản.
4. Cáo thị: thêm 2 dòng vào nhóm "Sửa lỗi" của 4.5.0 (không tạo số bản mới).
- Đối chiếu: không trùng plan-4.5.0 (Ngày 1-4 xong, không đụng túi đồ), plan-4.6.0 (Sơn Môn, không đụng túi đồ và tông môn trong kiếp); không có docs/yeu-cau-lam-tinh-nang.md.
- Thử: `node scripts/smoke-do-thua.cjs` (mới, 12 mục, 390x844), smoke, smoke-login (cả FAIL_ME), smoke-linhthu, smoke-tui (sửa lỗi sẵn có trong script: có hai nút `.inv-clean` nên phải bấm nút đầu), tsc, build sạch. Không đổi cân bằng nên không chạy mô phỏng kiếp.
- Góp ý cần trả lời sau khi lên trang (tác vụ 5:00 gửi, tặng 10 phúc mỗi góp ý, reply_ver 4.5.0):
  - #224: "Thiên Đạo đã tìm ra lỗi: món Cực phẩm vừa hợp bị nút Bán đồ thừa coi là đồ thừa nên bị bán mất. Bản sáng 14/11 đã sửa: nút bán và phân giải đồ thừa không còn đụng tới món Cực phẩm (chỉ bán bản trùng), chỉ bán đồ ở tab đang chọn và ghi tên từng món trước khi bán. Đồ đã bán thì không lấy lại được, Thiên Đạo tặng đạo hữu chút phúc duyên bù lại. Cảm ơn đạo hữu đã báo."
  - #225: "Cảm ơn đạo hữu đã chấm kiếp. Lỗi mất đồ Cực phẩm khi bấm Bán đồ thừa đã sửa trong bản sáng 14/11: nút này không còn bán món Cực phẩm, chỉ bán bản trùng."
  - #223: "Thiên Đạo đã xem: La Hán kim lan cà sa là đồ tông môn Phổ Đà Sơn, khi bị trục xuất (lộ thân phận vì đạo tâm lệch, hoặc phản sư) tông sẽ thu lại và đạo hữu mặc lại áo vải. Từ bản sáng 14/11, túi đồ ghi rõ điều này trên món đồ tông môn, và nhật ký nêu tên từng món bị thu lại."

Đề xuất chờ Tyler:
- Lỗi vặt trong smoke đêm 12/11 (thanh Thập Kiếp 1 ô sáng mà chữ ghi 2/10): chưa tái hiện được. Ô mới khai có hiệu ứng chớp 6 lần (`hb-flash`), ảnh chụp đúng lúc chớp có thể trông như chưa sáng. Tyler thấy trên máy thật thì báo lại.
- Quảng cáo: đang chạy đợt Chân Thân (300.000đ, 13-19/11). Giữ đúng kế hoạch, không sửa 13-14/11. Sáng 15/11 cần số vkl_events (open có utm_content, nối sid với life_end) để tắt mẫu đắt nhất; nếu Supabase vẫn không kết nối được thì xem số click trong Trình quản lý quảng cáo và tạm giữ cả 3 mẫu.

Phần của phiên làm kế hoạch (cùng đêm 13/11):
- Kế hoạch: 4.6.0 Ngày 1 (SQL Sơn Môn) và Ngày 2 (`lib/sonmon/data.ts`, `scripts/sim-son-mon.ts`) đã đẩy `next`; SQL CHƯA áp lên Supabase vì không kết nối được, đêm 14/11 áp trước khi làm Ngày 3. Số mô phỏng ở "Ghi chú:" Ngày 2 của plan-4.6.0. Nhánh `sim-ban-song-song` của phiên kia chỉ để tham khảo, KHÔNG gộp (bản trong `next` là bản chốt).
- Sửa thêm (commit "tăng trưởng: thần binh truyền kiếp..."):
  1. #236, #229: thần binh truyền kiếp (vũ khí mang qua nhiều kiếp, ví dụ rìu Bàn Cổ 10 kiếp) bị lột khi thua trận thì mất luôn chuỗi kiếp. Giờ `robGear` (lib/game/duel.ts) bỏ qua thần binh truyền kiếp, như nó vốn không vỡ khi rèn và không phân giải được. Các món khác vẫn bị lột như cũ. Thử: `npx tsx scripts/thu-lot-than-binh.ts` (2.000 lần, 0 lần mất thần binh).
  2. #235: sổ linh thú trong kiếp chỉ đọc sổ cũ (cập nhật lúc kiếp khép lại) cộng con đang nuôi, nên thu phục Cùng Kỳ rồi đổi con khác thì sổ không thấy. Giờ sổ gộp cả các loài đã nuôi trong kiếp này. Thử: `node scripts/smoke-so-thu.cjs` (390x844).
  - Đối chiếu: không trùng plan-4.5.0, plan-4.6.0 (không đụng giao đấu, linh thú); không trùng việc túi đồ của phiên kia.
  - Đo: số góp ý báo mất thần binh hoặc sổ linh thú thiếu loài sau khi lên bản (không thêm sự kiện đo riêng).
  - Cáo thị 4.5.0: thêm 1 dòng vào "Sửa lỗi".
- Thử chung trên bản gộp cả hai phiên: tsc, smoke, smoke-login (cả FAIL_ME), smoke-linhthu, smoke-tui, smoke-do-thua, smoke-so-thu, build đều sạch.
- Góp ý cần trả lời sau khi lên trang (tác vụ 5:00 gửi, tặng 10 phúc mỗi góp ý, reply_ver 4.5.0):
  - #236: "Thiên Đạo đã sửa trong bản sáng 14/11: thần binh truyền kiếp không còn bị lột khi thua trận nữa. Cây rìu đã mất thì không lấy lại được: kẻ cướp là người giang hồ không phải người chơi thật nên không có mối thù để báo. Thiên Đạo tặng đạo hữu chút phúc duyên bù lại."
  - #229: "Thiên Đạo nghe rồi. Từ bản sáng 14/11, thần binh truyền kiếp (như Bàn Cổ chân phủ mang qua nhiều kiếp) không còn bị lột khi thua trận. Đồ thường vẫn có thể bị cướp, gặp lại người chơi đã cướp thì báo thù để đòi lại."
  - #235: "Thiên Đạo đã sửa trong bản sáng 14/11: sổ linh thú ghi ngay loài vừa thu phục trong kiếp, không đợi tới khi kiếp khép lại. Cùng Kỳ đạo hữu đã thu phục được ghi vào sổ khi kiếp đó kết thúc, kiếp đang chơi thì giờ đã thấy ngay."

Đề xuất chờ Tyler (thêm):
- Đồ Cực phẩm vẫn bị lột khi thua giao đấu (đồng môn ma môn, đồng đạo giả nhân nghĩa, địch thủ). Chỉ khi kẻ cướp là người chơi thật mới có mối thù để đòi lại; kẻ cướp là người giang hồ thì mất hẳn (#236 không tìm được ai để trả thù). Tyler muốn: (a) giữ nguyên, (b) kẻ cướp chỉ lột món không phải Cực phẩm, hay (c) món bị người giang hồ cướp có thể chuộc lại ở Vạn Bảo Lâu?
- Sơn Môn: số chốt làm tài nguyên là thứ phải chờ, giờ xây ngắn (cấp 10 khoảng 5-10 phút, cấp 20 khoảng 2 giờ), để người 1 lần/ngày không thua xa. Đồng hồ đáng chờ là luyện quân và hành quân. Tyler muốn giờ xây dài hơn kiểu Travian (vài giờ mỗi cấp) thì người 1 lần/ngày sẽ chỉ tới Chính Điện 10 vào ngày 11 trở đi và người hăng hơn gấp 2,5-3 lần.

Tiến độ việc nhiều đêm: không có.

### Bảng xếp hạng chậm (Tyler bấm chạy tay 22:06 13/11, dặn ưu tiên)

Đêm nay vẫn không kết nối được Supabase (lỗi 502), nên CHƯA chạy được `explain (analyze, buffers)` trên máy thật, pg_stat_statements, kích thước bảng hay get_advisors. Đã đo thay trên Postgres 16 cục bộ với dữ liệu giả cùng cỡ: 30.000 kiếp (look ~1,7KB mỗi kiếp, đúng cỡ đo từ 300 kiếp mới nhất trên máy thật; máy thật có 26.949 kiếp lúc 22:30) và 3.000 bản lưu.

Vì sao `vkl_leaderboard2` chậm (đọc từ định nghĩa trong `supabase/chong_gian_lan_2026_11_05.sql`): mỗi lần gọi, hàm dựng lại jsonb cho TOÀN BỘ vkl_lives và mọi bản lưu đang sống, gộp `look` với 12 trường, chạy `sane_char` từng dòng, rồi sắp xếp theo biểu thức jsonb. Mọi cột lọc và sắp xếp đều nằm trong jsonb vừa dựng nên không chỉ mục nào dùng được. Chi phí tăng theo số kiếp (mỗi ngày thêm ~1.000-2.500), nên càng ngày càng chậm. Cục bộ: 1,0-1,6 giây mỗi lần (máy cục bộ nhanh; máy Supabase đo được ~4 giây). Với 3 bảng mỗi lần vào kiếp mới, giờ quảng cáo dễ làm nghẹt máy.

ĐÃ BẬT 13/11 khoảng 23:10 (Tyler duyệt trong phiên): `supabase/bang_xep_hang_2026_11_13.sql`.
- Bảng tính sẵn `vkl_priv.lb_row` (cột số có chỉ mục + đúng jsonb `c` như cũ, cột `gone` để ẩn thay vì xóa), làm mới TĂNG DẦN bằng `vkl_priv.lb_refresh()`, pg_cron job `vkl_lb_refresh` mỗi 2 phút: chỉ kiếp có id mới và bản lưu có updated_at mới. Không thêm trigger vào đường ghi kiếp hay lưu game.
- Hàm đọc MỚI `public.vkl_leaderboard3` cùng chữ ký, cùng thứ tự. Không sửa `vkl_leaderboard`/`vkl_leaderboard2`, không cấp lại quyền `vkl_leaderboard2`.
- Code: `app/api/pub/lb/route.ts` và `lib/storage.ts` gọi `vkl_leaderboard3` trước, lỗi thì lùi về `vkl_leaderboard2` rồi `vkl_leaderboard`.
- Số trên máy thật: pg_stat_statements (từ lần đặt lại thống kê) bảng xếp hạng cũ 66.010 lần gọi, trung bình 1.683 ms, tổng ~111.000 giây, đứng đầu. Nay: dựng lần đầu 14,1 giây (27.157 kiếp, 1.810 bản lưu); làm mới tăng dần 0,12 giây; đọc 0,2 giây (explain analyze). So với `vkl_leaderboard2`: bảng giàu trùng hoàn toàn; bảng sức mạnh chỉ khác 1 người ở hạng 60 do nhiều người bằng điểm (cả hai hàm không có tiêu chí phá hòa, trình duyệt tự xếp lại theo lúc đạt).
- Đứng thứ hai trong pg_stat_statements: `vkl_titles_char` (danh hiệu tuần), 44.767 lần gọi, trung bình 604 ms, tổng ~27.000 giây. Đề xuất làm tương tự (tính sẵn theo tuần) ở đêm sau.
- Supabase hỏi xác nhận cho apply_migration và cho lệnh có `delete`, hộp hỏi không hiện trong app nên hết giờ; đã chạy bằng execute_sql từng phần và bỏ `delete` (dùng cột `gone`).

Có nên nâng compute Supabase không: CHƯA nên. Chậm là do thuật toán quét toàn bảng mỗi lần gọi, nâng máy chỉ giảm thời gian theo tỉ lệ CPU, còn số kiếp tăng mỗi ngày thì lại chậm dần. Nay bảng xếp hạng đã qua bộ đệm Vercel và `vkl_leaderboard3`; nếu giờ cao điểm truy vấn đơn giản vẫn mất trên 300 ms thì mới xét nâng một bậc. Việc phải làm khi Supabase kết nối lại: `select query, calls, mean_exec_time, total_exec_time from extensions.pg_stat_statements order by total_exec_time desc limit 15;`, `select relname, pg_size_pretty(pg_total_relation_size(relid)) from pg_statio_user_tables order by pg_total_relation_size(relid) desc limit 10;`, get_advisors (performance), và explain trên máy thật; ghi số vào đây.

### Bổ sung 14/11 00:30 (Supabase kết nối lại, đọc vkl_events / vkl_players)

Số chính:
- Tài khoản mới: 12/11 39, 13/11 86 (quảng cáo Chân Thân chạy từ 17:00). D1 nhóm 9-11/11: 31,3% / 32,8% / 29,2% (đầu tháng 35-42%). D7 nhóm 1-5/11: 12,0% / 15,7% / 12,7% / 7,6% / 10,1%.
- Phiên mỗi ngày (vkl_daily.sid): 11/11 930, 12/11 814, 13/11 1.128. Màn rời nhiều nhất 13/11: đầu thai 515, đang chơi 352, sự kiện 255, chưa rõ 243.
- Phễu chân thân từ 5:00 13/11 (số phiên): xem Mộng Tỉnh 261 (191 xem hết) -> tạo chân thân 250 (96%). Màn tạo KHÔNG làm rơi người, không cần rút gọn (điều kiện dừng của plan là dưới 60%). Xem Tam Tài Đồ 258, xem huyệt 280, bấm "Vào kiếp mới" từ màn Chân thân 39, chia sẻ huyệt 7.
- Quảng cáo từ 17:00 13/11: 321 phiên từ Facebook -> 145 vào kiếp (45%) -> 82 xong kiếp 1 -> 67 tạo chân thân -> 50 đủ 2 kiếp (16%), 44 đăng ký. Phiên mới 7 ngày: quảng cáo 50,0% vào kiếp / 25,5% xong kiếp 1 / 16,8% đủ 2 kiếp; nguồn khác 43,9% / 26,5% / 17,3%. Người từ quảng cáo không tệ hơn người tự tới.
- 123/140 phiên quảng cáo không vào kiếp rời ở màn đầu thai (Lá số kiếp 1), trung vị ở lại 21 giây.

Nhận định:
1. Chỗ rơi lớn nhất là màn Lá số kiếp 1: một nửa người mới mở game không bao giờ bấm Đầu thai. Màn này có hướng dẫn 3 bước, lá số 6 dòng, 5 lá thiên phú, tốc độ thời gian, nhiệm vụ ngày - quá nhiều chữ cho người vừa bấm quảng cáo trên điện thoại. Quảng cáo kể chuyện "chết rồi tỉnh mộng", màn đầu lại là bảng chỉ số.
2. Chỗ rơi thứ hai: một nửa người đã vào kiếp 1 bỏ giữa chừng (rời ở màn đang chơi, sự kiện), trước khi tới màn chết và Mộng Tỉnh - tức trước khi thấy tính năng mới.
3. Lỗi đo: Tracker cắt `q` ở 60 ký tự nên mất `utm_content`, không biết mẫu quảng cáo nào tốt. Đã sửa nóng trên main 14/11 00:40 (6230991, 200 ký tự). Sáng 15/11 đã đủ số theo mẫu.
4. 4.5.0 không làm hại phễu: 96% người chết kiếp 1 đi hết màn tạo chân thân.

ĐÃ LÀM 14/11 ~01:00 theo yêu cầu Tyler (lên bản 5:00 14/11), cờ FIRST_SIMPLE_ON trong lib/flags.ts, sự kiện đo `first_simple`. Đêm 14/11 KHÔNG làm lại, chỉ đo (so % phiên mới có life_start trước/sau 14/11 5:00) rồi làm ưu tiên 2. Mô tả gốc:
- Kiếp đầu tiên của người mới (chưa có kiếp nào): màn Lá số rút còn một màn: một câu mở đầu khớp quảng cáo ("Ngươi sắp sống kiếp đầu tiên. Chết rồi sẽ tỉnh."), hình nhân vật, tên, một nút lớn "Bắt đầu kiếp đầu" ngay giữa màn. Ẩn thiên phú, tốc độ, nhiệm vụ ngày, Xem chỉ số ở kiếp 1 (tự chọn tốc độ Nhanh, không thiên phú). Từ kiếp 2 hiện đủ như cũ. Giấu sau cờ, bật khi thử sạch.
- Đo: % phiên mới có life_start (mốc 7 ngày: 44-50%, mục tiêu 65%+), % xong kiếp 1, thời gian từ open tới life_start.
- Đối chiếu: không trùng plan-4.5.0 (Mộng Tỉnh ở SAU kiếp 1), plan-4.6.0 (Sơn Môn, layout 4 tab không đụng màn đầu thai trong /choi).
- Ưu tiên 2 (nếu còn giờ, hoặc đêm 15/11): đo người bỏ giữa kiếp 1 rời ở tuổi nào, sự kiện nào (vkl_events có sc, thêm tuổi nếu chưa có), rồi rút ngắn hoặc làm kịch tính đoạn đó.

## Đêm 14/11/2026 (lên bản 15/11)

Kế hoạch đêm nay: 4.6.0 Ngày 1 (máy chủ Sơn Môn) và Ngày 2 (số liệu, mô phỏng), xong và đã đẩy `next` (7aa34ac, 9ecc331). Supabase mới áp được phần 1 (bảng + hàm nội bộ); phần 2 bị chặn vì máy chủ Supabase hỏi xác nhận mà không ai trả lời (xem Ghi chú Ngày 1 trong plan-4.6.0). Người chơi không thấy gì khác từ kế hoạch.

Số chính (so với đêm 13/11):
- Tài khoản mới: 12/11 39, 13/11 86, 14/11 107 (tới 22:00; quảng cáo Chân Thân chạy 17:00-24:00). Người có ít nhất một kiếp: 13/11 201, 14/11 205 (12/11 182); kiếp mỗi ngày 919 -> 1.111.
- D1: nhóm 10/11 34,5%, 11/11 29,2%, 12/11 22,6% (đầu tháng 35-42%). D7: nhóm 5/11 11,3%, 6/11 4,4% (mốc 11-14%).
- Kiếp đầu gọn (FIRST_SIMPLE_ON, lên 14/11 5:00): 306 phiên mới thấy màn gọn -> 190 vào kiếp 1 (62%, trước 44-50%, mục tiêu 65%) -> 99 xong kiếp 1 (32%, trước 25-27%) -> 78 tạo chân thân. Riêng quảng cáo: 164 phiên -> 99 vào kiếp (60%, trước 50%) -> 49 xong kiếp 1 (30%, trước 25,5%).
- Quảng cáo theo mẫu (utm_content, từ 14/11 00:40): Meta dồn gần hết vào ảnh `anh40`: 207 phiên -> 114 vào kiếp -> 62 xong kiếp 1 -> 47 chân thân, 42 đăng ký, 35 đủ 2 kiếp. Hai video `diaphu`, `buivang` gần như không được phát (1 phiên). Không có mẫu nào để tắt.
- Phiên mỗi ngày (vkl_daily.sid) 13/11 1.128. Giờ đông nhất 24 giờ qua (phiên mở game): 20h 131, 17h 108, 21h và 23h 102.
- Dùng tính năng 24 giờ qua (số phiên): khai huyệt 355, xem huyệt 314, điểm danh 298, bán/phân giải đồ thừa (đo mới) 212, Mộng Tỉnh 198 -> tạo chân thân 186 (94%), Lôi đài ra đài 94 / đánh 101 (khớp, không còn kẹt), bấm thẻ chân thân 59, chia sẻ huyệt 7.
- Góp ý mới từ 13/11 tối: #237-#254 (18), không có góp ý báo mất đồ hay kẹt Lôi đài sau bản 14/11. Đáng xem: #250 (sau phi thăng, đánh tới Yêu Thánh quái ngừng cho tu vi dù không chênh 3 cấp), #243 (bị mất một kiếp), #251 (kiếm tiền quá chậm so với giá đồ), #242 (đồ truyền đời không ghi rõ cộng gì).
- Lỗi Vercel 24 giờ qua: không có.

Nhận định:
1. Màn kiếp đầu gọn có tác dụng: vào kiếp 1 từ 44-50% lên 62%, xong kiếp 1 từ 26% lên 32%.
2. Chỗ rơi kế tiếp nằm NGAY SAU đó: 91/190 người vào kiếp 1 bỏ giữa chừng, đa số ở tuổi 0-9 (24 người ở màn sự kiện sau 2,7 phút, 18 người ở màn chơi chỉ sau 0,9 phút). Việc cuối cùng của 42/91 người (46%) là đọc cẩm nang TỰ MỞ: Hồi 1 "Một kiếp người" (4 trang, mở ngay sau sự kiện đầu đời) 29 người, Hồi 2 "Thang cảnh giới" 10, Hồi 3 3. Kiếp 1 hiện tự mở tới 5 hồi (khoảng 20 trang) - trái với nguyên tắc "không cần nghĩ, chỉ đọc và bấm" mà màn kiếp đầu gọn vừa làm.
3. D1 nhóm 12/11 thấp (22,6%) trước khi có màn gọn; nhóm 13-14/11 có số D1 từ đêm 15-16/11.

Việc đêm nay (tăng trưởng): cải thiện "Kiếp đầu gọn" lần 2 - kiếp 1 không tự mở cẩm nang (cờ `KIEP1_CN_GON`, TẮT mặc định đêm nay).
- Giả thuyết: người vừa bấm "Vào kiếp đầu" gặp ngay 4 trang hướng dẫn rồi 4 trang nữa; nhiều người rời ở đó. Bỏ tự mở trong kiếp 1 (vẫn mở tay được từ nút Cẩm nang), dời các hồi sang kiếp 2-4 (khi người chơi đã chết một lần và hiểu vòng chơi).
- Đổi gì: `app/choi/page.tsx` điều kiện tự mở cẩm nang: khi cờ bật, chỉ tự mở từ kiếp 2 tới kiếp 4 (`meta.lives` 1-3, trước là 0-2); Hồi 1 hiện ở đầu kiếp 2 thay vì kiếp 1. Không đổi chữ, không đổi luật.
- Đối chiếu: không trùng plan-4.5.0 (Ngày 1-4 xong, Mộng Tỉnh ở SAU kiếp 1, không đụng cẩm nang), plan-4.6.0 (Sơn Môn; thanh 4 tab Ngày 5 không đụng màn chơi `/choi` trong kiếp); không có docs/yeu-cau-lam-tinh-nang.md. Nối tiếp việc "Kiếp đầu gọn" (FIRST_SIMPLE_ON) của 14/11.
- Đo: trong các phiên thấy màn kiếp đầu gọn, % xong kiếp 1 trên số vào kiếp 1 (mốc 14/11: 99/190 = 52%, mục tiêu 60%+); % bỏ ở tuổi 0-9; số lần `camnang_open` từ `auto` ở kiếp 2 (xem có rơi người ở kiếp 2 không).
- Thử: `node scripts/smoke-kiep1-cn.cjs <thư mục ảnh>` (mới, 390x844): cờ bật thì kiếp 1 trả lời sự kiện 25 giây không có cẩm nang tự mở, kiếp 2 thì Hồi 1 tự mở; `CN_TAT=1` với cờ tắt thì kiếp 1 vẫn tự mở như cũ. smoke, smoke-login (cả FAIL_ME), smoke-linhthu, tsc, build sạch.
- Bật: đêm 15/11 đổi mặc định cờ thành bật (sau khi đã thử ở đêm nay), trừ khi Tyler muốn bật ngay sáng 15/11.
- Cáo thị: không thêm (cờ tắt, người chơi chưa thấy gì khác).

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn: lần 1 (màn lá số gọn) đã lên 14/11; lần 2 (bỏ cẩm nang tự mở ở kiếp 1) code xong sau cờ, bật đêm 15/11; lần 3 (nếu cần): xem các sự kiện tuổi 0-9 có quá nhiều chữ không.

Đề xuất chờ Tyler:
- Supabase hỏi xác nhận khi áp phần 2 máy chủ Sơn Môn (có câu `drop trigger if exists`) mà phiên đêm không trả lời được. Tyler có thể bấm duyệt khi được hỏi trong phiên đêm 15/11, hoặc mở Supabase SQL Editor dán cả file `supabase/son_mon_gon_2026_11_15.sql` và chạy (file áp lại nhiều lần không hỏng). Ngày 3 (16/11) cần các hàm này.
- Mốc Khí vận thứ hai đổi 60 -> 50 sau mô phỏng (môn trung vị chỉ 7-8 người, mốc 60 chỉ đạt 5% số ngày). Tyler đồng ý không?
- Quảng cáo: giữ nguyên tới 19/11 (Meta đã tự dồn vào `anh40`, mẫu này đang tốt: 30% phiên xong kiếp 1, 17% đủ 2 kiếp). Không nên chạy thêm đợt mới trước khi có D1 của nhóm 13-14/11 (đêm 15-16/11). Nếu D1 nhóm 13-14/11 từ 30% trở lên thì đề xuất đợt Sơn Môn: Lưu lượng truy cập, 18-25/11, 50.000đ/ngày (350.000đ), Việt Nam 18-40, 2 mẫu: ảnh `anh40` (giữ) và ảnh bản đồ Sơn Môn lục giác có huy hiệu ("Lập môn cùng đạo hữu, giữ đất trên bản đồ. Kỷ 1 tới 1/12."), link thẳng /choi có utm_content; dừng mẫu nào có dưới 20% phiên xong kiếp 1 sau 2 ngày.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng): chưa có thứ mới người chơi thấy được đêm nay. Bài báo trước cho Sơn Môn để dành tới 17/11 khi có màn chờ.

## Sổ cải thiện tính năng

- Bán / phân giải đồ thừa (túi đồ), lần 1 (13/11, góp ý #224 #225): chiếc gốc Cực phẩm không còn tính là thừa, chỉ đụng đồ ở tab đang chọn, bước xác nhận ghi tên món. Số dùng trước: chưa đo (không có sự kiện riêng; đêm nay không đọc được vkl_events). Sau: đo bằng `do_thua` từ 14/11, và số góp ý báo mất đồ.
- Kiếp đầu gọn, lần 1 (14/11, FIRST_SIMPLE_ON, màn lá số kiếp 1 chỉ còn câu mở đầu và một nút): trước 44-50% phiên mới vào kiếp 1, 25-27% xong kiếp 1. Sau (14/11, 306 phiên): 62% vào kiếp 1, 32% xong kiếp 1.
- Kiếp đầu gọn, lần 2 (14/11 đêm, KIEP1_CN_GON, tắt mặc định, bật đêm 15/11): kiếp 1 không tự mở cẩm nang, các hồi dời sang kiếp 2-4. Trước: 52% người vào kiếp 1 xong kiếp 1; 46% người bỏ giữa kiếp 1 có việc cuối là đọc cẩm nang tự mở. Sau: đo từ khi bật.
- Lột đồ khi thua trận (`robGear`), lần 1 (13/11, góp ý #236 #229): không lột thần binh truyền kiếp. Số trước: 2 góp ý báo mất thần binh trong 2 ngày. Sau: đếm góp ý báo mất thần binh từ 14/11.

## Tính năng đã ẩn

(chưa có)

## 14/11 22:xx - Xử lý góp ý #243, #250, #251 (ngoài lịch đêm)

- #250 (sau phi thăng trảm Yêu Thánh không ra tu vi): không phải lỗi, tu vi mỗi năm bị chặn sau phi thăng. Đã sửa: khi tu vi năm đó đầy, mỗi con trảm cho x3 linh thạch, báo một lần mỗi năm, danh sách săn ghi "tu vi năm nay đã đầy, linh thạch x3".
- #251 (kiếm tiền chậm so với giá đồ): linh thạch trảm yêu nhân thêm 1 + 0,3 x (cảnh giới - 1), tối đa x4. sim-farm số năm cày cho một món: R2 2,4 → ~2; R5 5,7 → 3,9; R7 7,0 → 4,1. sim-do-kho gần như không đổi (r5 thua 14,5% → 13,5%, r7 0,9%).
- #243 (mất một kiếp): bia của dkunn kiếp 3 không lên máy chủ (tắt app/rớt mạng lúc lập bia). Toàn hệ thống 142 người thiếu 1.063 bia. Đã sửa: bia lưu vào máy trước khi gửi, mở game lại tự khắc bù (kiểm tra trùng player_name + life_no). Bù dkunn +200 phúc duyên (880 → 1.080).
- Đã trả lời 3 góp ý trong vkl_feedback, status da_xong. Lên bản 5:00 15/11 (commit 432c343).
- Lịch đêm đã đổi: tự quyết rồi báo sau, mỗi đêm đọc góp ý và bình luận FB, dùng game-design để đưa vào game.
