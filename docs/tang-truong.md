# Tăng trưởng và giữ chân - nhật ký

Tyler chốt 12/11/2026: mỗi đêm sau khi xong khối kế hoạch, xem số liệu, chọn việc có tác động lớn nhất, ghi lại ở đây. Không gỡ tính năng chỉ vì số xấu, cải thiện trước (xem "Sổ cải thiện tính năng"). "Buy me a coffee" không bao giờ bỏ.

Mốc so sánh: còn chơi sau 7 ngày (D7) 11-14% (`docs/so-lieu.md`, mốc trước 4.5.0).

Từ 19/11 (Tyler: tốn token): file này chỉ giữ 2 đêm gần nhất + Câu SQL + Sổ cải thiện + Tính năng đã ẩn. Mỗi đêm ghi nhật ký mới lên trên cùng, rồi chuyển đêm cũ hơn 2 đêm sang `docs/luu-tru/tang-truong-cu.md` (dán vào đầu file đó). Cần số cũ thì grep file lưu trữ.

## Kết quả quảng cáo đợt Chân Thân 13-19/11 (chốt 19/11 tối)
- Chi 264.847đ, 986 click (269đ/click, gấp đôi đợt 1-8/11 là 124đ). 862 người mới từ quảng cáo: 50% vào kiếp, 24% xong kiếp 1, 22% tạo chân thân, khoảng 12% quay lại hôm sau. Cả hai ngưỡng dừng (60% tạo chân thân, 25% còn chơi sau 1 ngày) đều không đạt.
- Theo mẫu (người quay lại hôm sau / tiền): anh40 ~82 người / 128.870đ (~1.600đ một người), Địa Phủ 6 / 52.047đ, manhua1 5 / 55.440đ, Bụi Vàng 1 / 28.490đ. Chỉ anh40 đáng tiền. Từ 16/11 anh40 gần như hết được phân tiền, tiền dồn sang video và manhua nên ngày 16-19 tốn một nửa ngân sách mà gần như không ra người ở lại.
- Người tự đến cùng tuần cũng chỉ quay lại khoảng 11-12%, nên chỗ rò là phiên đầu trong game, không phải tệp người quảng cáo.
- Lần chạy sau: chỉ ảnh tĩnh kiểu anh40 (thử 2-3 ảnh mới cùng kiểu), không video, không manhua chữ dày. Chỉ chạy lại khi người mới tự đến quay lại hôm sau từ 20% trở lên 3 ngày liền. Việc đêm trước đó: giảm 50% người vào mà không bắt đầu kiếp, và kéo tỉ lệ xong kiếp 1.

## Lên bản 5:00 sáng 20/11: thần binh chưa rút vẫn chờ kiếp sau (Tyler duyệt 23:08 19/11)

Aurora Vonka hỏi: kiếp sau chết sớm hay không rút kiếm thì thần binh có mất không. Trước đây mất (chỉ truyền món đang cầm lúc khép kiếp).
- `lib/game/types.ts` thêm `legendClaimed`; `lib/game/hookEvents.ts` đặt cờ khi bấm "Rút thần binh lên".
- `app/choi/page.tsx` (finishLife): kiếp chưa rút và không giữ món đó thì giữ nguyên `meta.legend` (cùng bậc). Vẫn mất khi "Để nó yên nghỉ" hoặc uống canh Mạnh Bà.
- Cáo thị "Sửa lỗi 20/11". Page báo lại Aurora sau khi lên bản.

## Lên bản 5:00 sáng 20/11: lôi đài giữ bóng (Tyler duyệt 11:28 19/11)

Phan Anh Tuấn báo: kiếp Chuẩn Thánh mạnh nhất có thể rơi khỏi danh sách khi chơi thêm kiếp Khai Thiên, và mỗi ngày lôi đài tự đổi sang bóng yếu.
- Máy chủ (đã áp 19/11, `supabase/loi_dai_giu_bong_2026_11_19.sql`): `vkl_arena_candidates2` lấy 40 kiếp + kiếp ra đài gần nhất; `vkl_arena_state2` trả `me.lastLife`.
- Client: `rankCands`/`arenaPower` trong `lib/social.ts` (Huyết x (Công + nửa Thủ)), hiện 12 + giữ kiếp đang ra đài; `components/Arena.tsx` sang ngày mới giữ bóng hôm qua.
- Cáo thị "Sửa lỗi 20/11". Page đã hứa với Tuấn bản 5:00 sáng 20/11.

## Đêm 20/11/2026 (lên bản 21/11, bản 4.6.4)

Kế hoạch: làm 7 khối tới hạn, chia cho 6 agent chạy song song trong worktree riêng, phiên chính ghép và thử lại toàn bộ. Ngày 12 (góp ý Fanpage, 4 mục), Ngày 36 (soát 143 quái), Ngày 38 (kênh Thế giới, đã bật), Ngày 30 (luật Sơn Môn mới, chạy từ 5:00 21/11), Ngày 22 (đổi tên Lực chiến + nền tu vi sau cờ), Ngày 10 (2 ô còn lại), Ngày 35 (10 cốt truyện). apply_migration của phiên phải chờ người duyệt nên hết giờ 3 lần; Tyler tự dán 3 file SQL vào Supabase lúc ~22:40.

Số chính: CHƯA ĐỌC ĐÊM NAY. Sau lần chờ duyệt bị hết giờ, công cụ execute_sql không cho gọi lại trong lượt này, nên không chạy được các câu SQL đếm người mới, D1, phễu. Đêm 21/11 đọc bù 2 ngày.
- Lỗi Vercel 24 giờ: không có. Chi phí Vercel 18-19/11: $1,91 cho 2 ngày (~$0,96/ngày; gói Pro $0,67/ngày, build $0,14/ngày, bộ nhớ hàm $0,06/ngày).

Góp ý (Ngày 37): trong game 13 dòng `moi` (#295-#308), sổ mọi kênh 6 dòng (Fanpage 4, Group 2). Không có Claude in Chrome nên không đọc trực tiếp Fanpage/Group.
- Chết vô lý khi kiếm tiền ở giới trên: 2 người (Huy Phạm trên Fanpage, juno199x #304 #306, rất có thể cùng một người). Đã sửa (Ngày 12 mục 1), bù juno199x 30 phúc.
- Treo máy hết thọ: 1 người (Nguyễn Vũ). Đã sửa: thọ còn khoảng 5% thì game tự dừng thời gian.
- Đồ rơi quái cao cấp, Lôi Đài Khai Thiên: 1 người (Phan Anh Tuấn). Đã thêm đồ rơi. Lôi Đài không phải lỗi, đã ghi luật trên màn.
- Chú giải Linh Mạch: 1 người. Đã sửa. Kênh chat Thế giới: 1 người, 3 phiếu (#302). Đã làm.
- Tỉ lệ đột phá 90% + 35% vẫn hỏng: 1 người (#303). Do trần 97%, đã ghi trên màn.
- Việc lớn sang khối Ngày 39 (lên 25/11): tìm ô yêu thú (#307), người mới bị đánh liên tục (#300 và Gia Phuc Nguyen, 2 người), số liệu buff rõ (#298), hệ đồ và hợp luyện (#305, #308), cân bằng chiêu khống chế (#299).

Nhận định: 3/6 góp ý mới là "chết hay thiệt mà không hiểu vì sao" (bờ sông, treo máy, 97%). Lỗi kiểu này làm người kiếp 2-10 bỏ game nhiều nhất, nên đêm nay ưu tiên nói rõ lý do ngay trên màn, không đổi tỉ lệ.

Việc đêm nay và cách đo:
- Kênh Thế giới: `wc_open`, `wc_send`, `wc_report` (vkl_events), số tin/24 giờ trong vkl_wc_chat, số tin ẩn, số người bị cấm. Mục tiêu tuần đầu: 10% người chơi mỗi ngày mở kênh.
- Thọ sắp cạn tự dừng: đếm kiếp chết vì hết thọ khi đang chạy tự động (cause hết thọ, trước 24 giờ / sau 24 giờ).
- Đồ rơi Độ Kiếp, Hồng Hoang: tổng linh thạch nhóm Hồng Hoang theo ngày; tăng hơn 30%/tuần thì hạ `RIENG_DROP.hg`.
- Sơn Môn Ngày 30: trọng thương/ngày, số lần bỏ ô, ô đứt mạch, tỉ lệ thủ thành công (giữ trong 20-80%).

Tiến độ việc nhiều đêm: Ngày 8f (chọn thế giới khởi đầu, lên 22/11) chưa bắt đầu, đêm 21/11 phải làm cả máy lẫn giao diện. Ngày 23 (màn tu vi) lên 22/11. Ngày 22 sim lệch so với doc (C9 ngày 113 so với 139), cần quyết tốc độ trước khi bật 23/11.

Quyết định lớn đã tự chốt: bật kênh Thế giới khi file thử SQL mới chạy trên Postgres cục bộ, máy chủ thật chỉ kiểm RPC đọc (cờ `NEXT_PUBLIC_WC=0` tắt ngay được). Trọng thương Sơn Môn tính từ lúc hết 2 giờ nghỉ. Yêu thú canh mạch mới 50%. Món riêng Hồng Hoang 35 món, boss giữ linh bảo cũ.

Marketing (soạn sẵn cho Tyler tự đăng, đã qua humanizer):
- Page, sáng 21/11: "Vạn Kiếp Luân Hồi có kênh Thế giới rồi. Bấm nút bong bóng trên màn chơi là nói chuyện được với đạo hữu khắp thiên hạ: hỏi ai vừa phi thăng, môn nào đang tuyển đệ tử, hay kể kiếp này chết lãng xẹt ra sao. Có chân thân và liên kết Google là gửi tin được. Ai Khai Thiên hay mở kết cục hiếm đầu tiên, kênh tự báo cho cả thiên hạ biết."
- Group người chơi (Ngày 10 + 30), "Từ hôm nay đất có giá": "Sơn Môn có luật mới từ 5:00 sáng nay. Đánh thua thì người đi theo bị trọng thương, thua càng nhiều trận trong ngày càng nặng, 5:00 sáng hồi hết. Môn chủ, trưởng lão bỏ được ô không cần. Đất phải liền với chính điện: mất ô nối thì các ô bị tách cũng mất theo, nên mở đất thành khối. Linh Mạch mới sinh nằm ẩn, phải trinh sát mới thấy, có mạch còn có yêu thú canh. Chi tiết ở mục Luật trong Sơn Môn."
- Video 9:16 (15 giây): cảnh 1 chữ "Kiếp này chết lãng xẹt quá" gõ vào kênh Thế giới; cảnh 2 tin hệ thống chữ nghiêng "Hàn Lập vừa phi thăng lần đầu"; cảnh 3 Thao Thiết nuốt túi linh thạch; chữ cuối "Vạn Kiếp Luân Hồi, chơi miễn phí trên web".
- Quảng cáo: chưa nên chạy, chưa có số D1 đêm nay để so mốc (điều kiện cũ: người tự đến quay lại hôm sau từ 20% ba ngày liền).

Kỹ năng: gamedev, game-design, uiux-pro-max, huashu-design (chấm 5 mặt), humanizer, story-writing, script-writing, the-fool, supabase-postgres-best-practices (qua các agent).

## Đêm 19/11/2026 (lên bản 20/11)

Kế hoạch: làm hết 4 khối tới hạn theo thứ tự Tyler dặn: Ngày 7 (màn đầu Cảnh sống A/B, tự vào kiếp, kiếp 1 trôi nhanh, quà ngày mai, link thẻ Một đời mời đệ tử), Ngày 7b (Sơn Môn kéo người mới), Ngày 9 (máy chủ Kỷ 2 đất có giá, tính từ 5:00 21/11), Ngày 8e (Thiên thư quyển III chặng 1). Chi tiết ở Ghi chú từng khối trong viec-dem.md. Supabase MCP hỏi xác nhận với SQL có UPDATE/DELETE, Tyler chạy tay phần đó trong SQL Editor.

Số chính (đọc 19/11 tối, tài khoản mới theo ngày tạo, giờ VN):
- Tài khoản mới: 16/11 76, 17/11 49, 18/11 61, 19/11 103 (chưa hết ngày).
- Có kiếp ngày hôm sau (tài khoản): 15/11 37,0%, 16/11 36,8%, 17/11 26,5%, 18/11 47,5%.
- Màn đầu: phiên thấy `first_simple` rồi có life_start kiếp 1 cùng ngày: 17/11 113/409 (28%), 18/11 119/265 (45%), 19/11 145/222 (65%, chưa hết ngày). Đây là mốc TRƯỚC bản 20/11 (tự vào + A/B).
- Lỗi Vercel 24 giờ: không có. Chi phí Vercel khoảng $1,00/ngày.

Góp ý mới #295-#302 (đã xem hết):
- #297 (godwhale99): danh sách Trừ yêu không xếp theo cấp. Sửa trong đêm: xếp theo cấp tăng dần (không đổi luật, không cần mô phỏng). Câu trả lời ở Ghi chú Ngày 10 (gửi 5:00 kèm 10 phúc).
- #298 (khí vận khởi đầu đa dạng hơn, công đức sau thành thánh), #299 (cân sát thương chiêu có khống chế), #300 (chế độ không bị lột đồ cho người mới), #302 (kênh chat thế giới): ghi lại, chưa có lịch nên chưa trả lời. #300 đáng làm sớm vì chạm người mới: đề xuất khối sau "người dưới 10 kiếp không bị lột đồ khi gặp người chơi khác" (cần mô phỏng duel).
- #295, #296, #301: đánh giá 5 sao, không cần trả lời.
- Không đọc được Fanpage/Group: phiên này không có Claude in Chrome.

Nhận định:
1. Tỉ lệ vào kiếp ở màn đầu đã tăng dần trong 3 ngày (28% -> 65%) trước cả bản này, nhờ các lần sửa 14-18/11. Bản 20/11 thêm tự vào sau 4 giây, nên kỳ vọng nhóm B (màn cũ + tự vào) lên trên 80%; nhóm A đo thêm tác động của cảnh.
2. Vòng mời hiện là kênh tốt nhất (quay lại ~29%); đêm nay có thêm 2 đường link mang tên người mời (thẻ Một đời và link Sơn Môn).

Việc đêm nay và cách đo:
- A/B màn đầu: `first_simple.ab`, `first_go` (auto, ms), life_start, quay lại hôm sau theo nhóm. Đọc sau 3 ngày (23/11).
- Kiếp 1 nhanh hơn (x3 trước Trúc Cơ, x2 sau): đo trung vị phút từ life_start tới life_end kiếp 1 (mốc 11,5 phút).
- Mời: `open.q` có `r=life` hoặc `sm=`, `sm_ref_click`, `vkl_sm_ref`.
- Thiên thư III: `tt3_mo`, `tt3_tab`.

Tiến độ việc nhiều đêm: Ngày 10 (giao diện Kỷ 2, bật cờ 5:00 21/11) làm đêm 20/11. Ngày 8f (chọn thế giới khởi đầu) đêm 20-21/11. Ngày 8 còn một ô: tin hệ thống Truyền âm chờ Tyler chạy `supabase/son_mon_chat_he_2026_11_19.sql`.

Quyết định lớn đã tự chốt: lực yêu thú 10.000-30.000 (kế hoạch ghi 1.500-6.000, một người đã thắng); thưởng kéo người cần cả vào môn và quay lại ngày 2; quyển III bật luôn (thử sạch).

Marketing: chưa nên chạy quảng cáo (điều kiện: người tự đến quay lại hôm sau từ 20% ba ngày liền theo cách đo phiên). Có thứ đáng khoe từ 21/11: "Đất có giá" (Ngày 10 soạn bài).

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

## Sổ cải thiện tính năng

- Bán / phân giải đồ thừa (túi đồ), lần 1 (13/11, góp ý #224 #225): chiếc gốc Cực phẩm không còn tính là thừa, chỉ đụng đồ ở tab đang chọn, bước xác nhận ghi tên món. Số dùng trước: chưa đo (không có sự kiện riêng; đêm nay không đọc được vkl_events). Sau: đo bằng `do_thua` từ 14/11, và số góp ý báo mất đồ.
- Kiếp đầu gọn, lần 1 (14/11, FIRST_SIMPLE_ON, màn lá số kiếp 1 chỉ còn câu mở đầu và một nút): trước 44-50% phiên mới vào kiếp 1, 25-27% xong kiếp 1. Sau (14/11, 306 phiên): 62% vào kiếp 1, 32% xong kiếp 1.
- Kiếp đầu gọn, lần 2 (14/11 đêm, KIEP1_CN_GON, tắt mặc định, bật đêm 15/11): kiếp 1 không tự mở cẩm nang, các hồi dời sang kiếp 2-4. Trước: 52% người vào kiếp 1 xong kiếp 1; 46% người bỏ giữa kiếp 1 có việc cuối là đọc cẩm nang tự mở. Sau: đo từ khi bật.
- Kiếp đầu gọn, lần 2 (bật từ bản 16/11): trước (15/11, cờ tắt) 43% người vào kiếp 1 xong kiếp 1, 44% người bỏ có việc cuối là cẩm nang tự mở, 55% bỏ trong 2 phút đầu. Sau: đo từ 16/11 (ít nhất 3 ngày).
- Nhiệm vụ ngày, lần 1 (15/11, góp ý #211): người đã mở gần hết đồ ẩn hay kết cục không còn nhận nhiệm vụ không làm được. Trước: 1 góp ý. Sau: đếm góp ý về nhiệm vụ ngày.
- Thiên sinh kiếm cốt (thiên phú), lần 1 (16/11, góp ý #262): công x1,1 không ghi -> x1,3 có ghi trên thẻ. Đo: góp ý về thiên phú yếu.
- Tàng Kinh Các - nút nâng chiêu khi chạm trần tâm pháp, lần 1 (17/11, Truong Pham hỏi): "Luyện tâm pháp" -> "Cần tâm pháp T{n}" + lý do + gợi ý chép 3 thành 1. Số trước: 1 tin hỏi qua Messenger; `cp_tang` 450 phiên/24 giờ. Sau: đếm góp ý hỏi về nút này, `cp_tang` -> nâng tầng.
- Tuyệt kỹ sau dung hợp, lần 1 (17/11, Phan Anh Tuấn báo): có tàn quyển rơi và bán tới tầng 9. Số trước: `cp_dung_hop` 101 phiên/24 giờ, tuyệt kỹ kẹt ở tầng 5. Sau: đếm `mua_tq` cho tuyệt kỹ và tầng tuyệt kỹ trong bia.
- Lột đồ khi thua trận (`robGear`), lần 1 (13/11, góp ý #236 #229): không lột thần binh truyền kiếp. Số trước: 2 góp ý báo mất thần binh trong 2 ngày. Sau: đếm góp ý báo mất thần binh từ 14/11.

- Khe nứt không gian (sự kiện `xuyen_khong`), lần 1 (18/11): ghi rõ "bước qua là kiếp này khép lại" trên nút. Số trước: 2 góp ý than mất kiếp (#135, #283). Đo sau 3 ngày: tỉ lệ chọn Bước vào.

- Kênh Thế giới, lần 0 (bật 21/11, Ngày 38): đo % người chơi mỗi ngày mở kênh (`wc_open`), số người gửi, số tin bị ẩn. Mốc: 0.
- Kiếm tiền quá độ ở giới trên, lần 1 (21/11, góp ý Huy Phạm, juno199x): lời dẫn đúng cõi, tỉ lệ giữ nguyên. Số trước: 2 góp ý "chết vớ vẩn" trong 1 ngày. Đo: góp ý cùng loại 7 ngày sau.
- Tự chạy thời gian, lần 1 (21/11, Nguyễn Vũ): thọ còn khoảng 5% thì tự dừng. Đo: kiếp chết vì hết thọ lúc thời gian đang tự trôi.

## Tính năng đã ẩn

(chưa có)
