# Tăng trưởng và giữ chân - nhật ký

Tyler chốt 12/11/2026: mỗi đêm sau khi xong khối kế hoạch, xem số liệu, chọn việc có tác động lớn nhất, ghi lại ở đây. Không gỡ tính năng chỉ vì số xấu, cải thiện trước (xem "Sổ cải thiện tính năng"). "Buy me a coffee" không bao giờ bỏ.

Mốc so sánh: còn chơi sau 7 ngày (D7) 11-14% (`docs/so-lieu.md`, mốc trước 4.5.0).

Từ 19/11 (Tyler: tốn token): file này chỉ giữ 2 đêm gần nhất + Câu SQL + Sổ cải thiện + Tính năng đã ẩn. Mỗi đêm ghi nhật ký mới lên trên cùng, rồi chuyển đêm cũ hơn 2 đêm sang `docs/luu-tru/tang-truong-cu.md` (dán vào đầu file đó). Cần số cũ thì grep file lưu trữ.

## Kết quả quảng cáo đợt Chân Thân 13-19/11 (chốt 19/11 tối)
- Chi 264.847đ, 986 click (269đ/click, gấp đôi đợt 1-8/11 là 124đ). 862 người mới từ quảng cáo: 50% vào kiếp, 24% xong kiếp 1, 22% tạo chân thân, khoảng 12% quay lại hôm sau. Cả hai ngưỡng dừng (60% tạo chân thân, 25% còn chơi sau 1 ngày) đều không đạt.
- Theo mẫu (người quay lại hôm sau / tiền): anh40 ~82 người / 128.870đ (~1.600đ một người), Địa Phủ 6 / 52.047đ, manhua1 5 / 55.440đ, Bụi Vàng 1 / 28.490đ. Chỉ anh40 đáng tiền. Từ 16/11 anh40 gần như hết được phân tiền, tiền dồn sang video và manhua nên ngày 16-19 tốn một nửa ngân sách mà gần như không ra người ở lại.
- Người tự đến cùng tuần cũng chỉ quay lại khoảng 11-12%, nên chỗ rò là phiên đầu trong game, không phải tệp người quảng cáo.
- Lần chạy sau: chỉ ảnh tĩnh kiểu anh40 (thử 2-3 ảnh mới cùng kiểu), không video, không manhua chữ dày. Chỉ chạy lại khi người mới tự đến quay lại hôm sau từ 20% trở lên 3 ngày liền. Việc đêm trước đó: giảm 50% người vào mà không bắt đầu kiếp, và kéo tỉ lệ xong kiếp 1.

## Lên bản 5:00 sáng 20/11: lôi đài giữ bóng (Tyler duyệt 11:28 19/11)

Phan Anh Tuấn báo: kiếp Chuẩn Thánh mạnh nhất có thể rơi khỏi danh sách khi chơi thêm kiếp Khai Thiên, và mỗi ngày lôi đài tự đổi sang bóng yếu.
- Máy chủ (đã áp 19/11, `supabase/loi_dai_giu_bong_2026_11_19.sql`): `vkl_arena_candidates2` lấy 40 kiếp + kiếp ra đài gần nhất; `vkl_arena_state2` trả `me.lastLife`.
- Client: `rankCands`/`arenaPower` trong `lib/social.ts` (Huyết x (Công + nửa Thủ)), hiện 12 + giữ kiếp đang ra đài; `components/Arena.tsx` sang ngày mới giữ bóng hôm qua.
- Cáo thị "Sửa lỗi 20/11". Page đã hứa với Tuấn bản 5:00 sáng 20/11.

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

## Đêm 18/11/2026 (lên bản 19/11)

Kế hoạch: 4.6.0 Ngày 8a xong (Phần thưởng Kỷ, 2be814c), Ngày 8 xong 4/5 việc còn lại (dded81d; tin hệ thống Truyền âm chờ áp SQL), Ngày 8c đo và mô phỏng (d813930), Ngày 8d số liệu + thiết kế (dbe6cbf; code quyển III chuyển Ngày 8e). Chi tiết ở Ghi chú từng khối trong plan-4.6.0.

Số chính (đọc khoảng 22:30 18/11):
- Tài khoản mới: 15/11 165, 16/11 76, 17/11 49, 18/11 50 (chưa hết ngày). Phiên mỗi ngày (vkl_daily): 15/11 1.639, 16/11 1.329, 17/11 1.252.
- D1: nhóm 14/11 29,5%, 15/11 29,7%, 16/11 26,2% (đầu tháng 34-43%). D7: nhóm 9/11 10,4%, 10/11 5,9% (dưới mốc 11-14%).
- Phễu đủ 2 / đủ 10 kiếp trên số tài khoản: 15/11 96/48 trên 165, 16/11 53/18 trên 76.
- Màn rời nhiều nhất 17/11: đầu thai 611, đang chơi 365, chưa rõ 263, sự kiện 260, chết 103.
- Sơn Môn ngày đầu (24 giờ, số phiên): mở 248, điểm danh 82, vào môn 78, nhiệm vụ xong 45, xem bản đồ 21, Truyền âm 21, trinh sát 29, khai hoang 6, xuất chinh 7, lập môn 16, ký cùng lập 21. Sư Đồ: mời đệ tử 117 lần (12 phiên), tìm đệ tử 22, tìm sư phụ 15.
- Nhóm 411px: 114/394 phiên `open` không có trường mới (`vis`, `iab`) là 411px, nhóm có trường mới chỉ 24 phiên 411px. Nghĩa là phần lớn nhóm này chạy JS cũ (bản lưu sẵn) hoặc không phải trình duyệt thật. Facebook trong app có trường mới: 93 phiên (iab=fb), Zalo 24.
- Lỗi Vercel 24 giờ: không có.
- Người "full" (Ngày 8d): 22 người xong quyển II (73% chơi hôm nay), 191 người đã Khai Thiên.

Góp ý (12 góp ý mới #283-#294, cộng 85 góp ý tồn từ 31/10-12/11 chưa ai trả lời, đã xem hết):
- #135, #283 (khe nứt không gian khép kiếp mà không báo): sửa trong đêm, nút "Bước vào" ghi rõ "Bước qua là kiếp này khép lại". Không đổi luật, không cần mô phỏng (chỉ đổi chữ gợi ý). Tặng 10 phúc mỗi người (tác vụ 5:00 gửi kèm trả lời). Dòng mới trong cáo thị 4.6.0 nhóm "Sửa lỗi 19/11".
- Ý lớn ghi lại cho hậu kỳ: góp ý "[Sau chứng đạo]" (24 góp ý) gom vào `docs/thiet-ke-hau-ky.md` (quyển III, chọn thế giới khởi đầu). Cân bằng ghi lại, chưa làm: Cương/Nhu theo hồi chiêu (#284), Tụ Khí Đan theo % (#285), thiên phú tím yếu (#286), linh căn (#287), tự dừng khi săn yêu sắp chết (#291), đồ theo đạo (#292), tên Trúc Cơ Đan ở cảnh giới cao (#289), giới hạn 500 chữ (#288, cần hàm máy chủ mới).
- Câu trả lời đã soạn ở Ghi chú Ngày 8a (plan-4.6.0), gồm cả nhóm góp ý tồn.
- Không đọc được bình luận Facebook: phiên này không có Claude in Chrome. Bình luận Hoang Le (Tyler chuyển) đã xử lý ở Ngày 8d.

Nhận định:
1. D1 của nhóm 14-16/11 thấp hơn đầu tháng khoảng 10 điểm, trùng lúc quảng cáo Chân Thân chạy và nhóm 411px tăng. Phải tách được phiên thật trước khi kết luận kiếp đầu xấu đi.
2. Sơn Môn kéo người cũ: 248 phiên mở ngày đầu. Thứ người trong môn còn thiếu là lý do làm việc mỗi ngày ngoài Khí vận; Công đóng góp và pháp bảo theo hạng Công (8a) là lý do đó, đo bằng `sm_thuong_mo` và số người đủ 10 Công mỗi ngày.
3. Người full ít nhưng rất trung thành và là người viết bình luận công khai. Quyển III và chọn thế giới khởi đầu đáng làm sớm (8e, 8f).

Việc tăng trưởng đêm nay:
1. Sửa #135/#283 (ở trên). Giả thuyết: người chơi bỏ game sau khi mất một kiếp đang mạnh vì bấm thử. Đo: số lần chọn "Bước vào" trên số lần gặp sự kiện `xuyen_khong` trước/sau bản 19/11 (sự kiện `ev` theo id). Cải thiện tiếp: nếu tỉ lệ bước vào vẫn cao ở kiếp trên 10 thì thêm hỏi lại một lần.
   - Đối chiếu: không trùng với plan-4.5.0 (xong), plan-4.6.0 (Sơn Môn, hậu kỳ), không có docs/yeu-cau-lam-tinh-nang.md.
2. Không thêm việc mới khác: đêm nay ba khối Sơn Môn + thiết kế hậu kỳ đã là phần người chơi thấy nhiều nhất; thêm việc nữa sẽ không thử kịp.

Quyết định tự chốt:
- Công tính lại từ dữ liệu có sẵn thay cho bảng `vkl_sm_cong` (ít chỗ hỏng hơn, đúng ngay từ 18/11); hạng môn chọn phẩm chỉ xét môn đủ điều kiện.
- Không code quyển III đêm nay, chuyển thành khối 8e (20/11) và 8f chọn thế giới khởi đầu (22/11); tên cảnh giới mới là Chân Nhân.
- Trả lời cả 85 góp ý tồn theo nhóm thay vì để mãi ở 'moi'.

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn lần 2: vẫn chờ tách nhóm 411px (đo tiếp 19-20/11).
- Sơn Môn: tin hệ thống Truyền âm chờ Tyler chạy `supabase/son_mon_chat_he_2026_11_19.sql`.
- Hậu kỳ: 8e (quyển III chặng 1) 20/11, 8f (chọn thế giới) 22/11, chặng 2-4 sau đó.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Bài Page "Phần thưởng Kỷ 1": "Sơn Môn có phần thưởng rồi. Hết Kỷ 1 (21:00 ngày 1/12), môn hạng 1 nhận pháp bảo Thần phẩm, hạng 2 Tiên phẩm, hạng 3 Linh phẩm. Trong mỗi môn, 7 người góp công nhiều nhất nhận vũ khí, mỗi hạng một loại: kiếm, đao, thương, quạt, phất trần, cung, song chùy. Môn chủ nhận thêm Chưởng Môn Ấn. Công có từ điểm danh, nhiệm vụ trong kiếp, khai hoang, theo xuất chinh và đứng giữ ô. Mở Sơn Môn, bấm Phần thưởng trên thẻ môn để xem nếu Kỷ kết thúc bây giờ ngươi nhận gì. van-kiep-luan-hoi.vercel.app"
- Caption ngắn: "Bảy hạng, bảy món vũ khí. Nhìn vũ khí là biết ai đứng thứ mấy trong môn."
- Kịch bản video 9:16 (15 giây): 0-3s cận 7 vũ khí Thần phẩm nhấp lửa, chữ "Kỷ 1 kết thúc 1/12"; 3-8s màn "Nếu Kỷ kết thúc bây giờ, ngươi nhận: Thần phẩm Đao"; 8-12s bảng Công trong môn, dòng "Ngươi" sáng lên; 12-15s chữ "Vào môn, góp công, giành vũ khí" + link. Quay bằng `?demo=chu&m=thuong` như video Sơn Môn.
- Trả lời Hoang Le: ở `docs/thiet-ke-hau-ky.md` mục 5.

Quảng cáo Facebook: chưa nên chạy thêm tới khi tách xong nhóm 411px (đo 19-20/11). Giữ đề xuất đợt Sơn Môn 20-26/11 (50.000đ/ngày, 17h-24h, Việt Nam 18-40, Lưu lượng truy cập), thêm mẫu thứ ba: ảnh 7 vũ khí Thần phẩm với chữ "Nhìn vũ khí là biết ai đứng thứ mấy". Dừng mẫu nào trên 2.000đ mỗi người xong kiếp 1 sau 2 tối, hoặc D1 nhóm quảng cáo dưới 20%. Chỉ tính phiên có trường `vis` (bỏ nhóm 411px không có trường mới).

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

## Tính năng đã ẩn

(chưa có)
