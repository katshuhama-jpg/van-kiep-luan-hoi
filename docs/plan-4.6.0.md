# Kế hoạch 4.6.0 - Sơn Môn Tranh Bá (bản gọn)

DUYỆT: Tyler 14/11/2026 (duyệt wireframe Sơn Môn bản gọn, thay bản động phủ/tài nguyên duyệt 10/11)

Wireframe: Design canvas "VKL trang đầu 4.6 - wireframe" (https://claude.ai/artifact/AYtP1hhkiZ4BQ8eajwxS7N), hàng Sơn Môn M1-M10 và các ghi chú n1-n7. Code và chữ trên màn theo đúng wireframe; chỗ nào plan này khác wireframe thì theo plan (plan mới hơn).

Luật chung như đầu `docs/plan-4.5.0.md`: mỗi lần chạy làm mọi khối còn ô trống có ngày "Lên bản" bằng hoặc trước hôm nay, đẩy `next` khi xong; tác vụ 5:00 đẩy `main`. Mọi thứ giấu sau cờ `SON_MON_ON` (tắt mặc định) cho tới khối Ngày 7. Đánh dấu lên bản bằng NHÁNH `len-ban-<YYYY-MM-DD>` (máy chủ chặn đẩy tag), chỉ khi thử sạch.

Luật giao diện mới (Tyler chốt 14/11): mọi thay đổi người chơi THẤY trên màn (màn mới, đổi bố cục, thêm thanh tab, đổi chữ) trước khi đánh dấu `len-ban` phải qua 2 bước, ghi kết quả vào "Ghi chú:" của khối:
1. Dùng skill `anthropic-skills:uiux-pro-max` xem lại giao diện trên ảnh chụp 390x844, đi theo 2 vai:
   - Người mới (chưa có kiếp nào, vào từ link quảng cáo `/choi?utm_source=fb...`): mở ra có hiểu ngay phải bấm gì không, có bị nhiều chữ hay nhiều nút cùng lúc không.
   - Người cũ (đã chơi nhiều kiếp, quen bố cục cũ): thứ họ hay dùng (Đầu thai, túi đồ, Lôi đài, bảng xếp hạng, chân thân) còn ở chỗ dễ thấy không, chỗ nào đổi thì có câu báo ngắn không.
   Sửa hết lỗi mức nặng trước khi lên. Lỗi nhỏ ghi lại, làm đêm sau.
2. Dùng skill `anthropic-skills:humanizer` soát mọi chữ trên màn mới và cáo thị: câu ngắn, từ ngoài đời, một thứ một tên, không trộn tiếng Anh, giữ giọng tu tiên của game.
Chưa qua đủ 2 bước thì không đánh dấu `len-ban`, báo Tyler lý do.

## BỎ bản cũ (đọc trước khi làm)

- Bản 10/11 (động phủ, 3 tài nguyên, công trình, 15 loại đệ tử, yêu động, phúc địa, Thiên Đạo Đài, linh khí từ kiếp) KHÔNG làm nữa. Tyler 13/11: "không đánh quái, không tài nguyên, chưa cần cấp".
- KHÔNG áp `supabase/son_mon_2026_11_14.sql` và `supabase/son_mon_cfg_2026_11_14.sql` lên Supabase. Hai file đã chuyển sang `supabase/_bo/` để tham khảo cách viết (RLS, trigger nuốt lỗi, sinh bản đồ), không dùng.
- `lib/sonmon/data.ts` và `scripts/sim-son-mon.ts` bản cũ: viết lại ở Ngày 2 (giữ tên file).

## Lịch (lên trang 5:00)

| Đêm làm | Lên bản | Khối | Người chơi thấy |
|---|---|---|---|
| 14/11 | 15/11 | Ngày 1 máy chủ + Ngày 2 số liệu, mô phỏng | Chưa |
| 15/11 | 16/11 | Ngày 3 vào môn, lập môn, môn nhà + Ngày 3b Sư Đồ + Ngày 4 bản đồ, đánh nhau + Ngày 5 thành viên, Kỷ, Lực chiến, thanh 4 tab + Ngày 6 hết Kỷ, thử 30 bot (Tyler chốt 14/11 tối: gộp bản 17/11 vào 16/11) | Sư Đồ, thanh 4 tab; tab Sơn Môn chỉ có màn chờ "Mở cửa 5:00 sáng 18/11" |
| 16/11 | 17/11 | Không có khối nào (để sửa lỗi bản 16/11 nếu có, và soát lại trước khi mở 18/11) | Như bản 16/11 |
| 17/11 | 18/11 | Ngày 7 bật cờ, Kỷ 1 bắt đầu, cáo thị 4.6.0 | Có |
| | 1/12 21:00 | Kỷ 1 kết thúc | |

## Vòng chơi

Chơi kiếp như thường → kiếp đạt mốc thì xong nhiệm vụ ngày của môn → môn có Khí vận → Khí vận cộng sức cho mọi trận của môn từ 5:00 hôm sau → môn giữ và chiếm ô trên bản đồ → hết Kỷ xếp hạng theo số ô. Không thêm tiền tệ, không công trình, không cấp. Thứ duy nhất người chơi "tích" là Lực chiến, và Lực chiến chỉ lên khi chơi kiếp.

## Đã chốt (Tyler 13/11 + 14/11, Claude chốt phần Tyler giao)

### Vào môn, lập môn
- Ai có chân thân và tài khoản đã liên kết (Google hoặc Sổ Luân Hồi) đều vào môn được. Khách chơi thử thì thấy màn giải thích và nút liên kết.
- **Lập môn** cần: từ 50 kiếp (không tính kiếp chết trước 16 tuổi), 5 ngày chơi khác nhau, và 2 người khác ký cùng lập trong 24 giờ. Môn dùng được ngay khi lập (vào được, điểm danh được, chọn ô được), hết 24 giờ chưa đủ 2 chữ ký thì tự giải tán, ô trả về trống.
  - Số liệu 13/11: 770 tài khoản chơi trong 7 ngày, 78 người đủ 50 kiếp + 5 ngày → dự kiến 20-26 môn.
  - **Van an toàn (mới, sau review 14/11):** khi các môn đã đầy trên 80% chỗ (đếm lúc 5:00 mỗi ngày), điều kiện lập môn tự hạ còn 30 kiếp + 4 ngày (162 người đủ). Để người mới không bị đứng ngoài vì hết chỗ.
- Mỗi môn tối đa 15 người. Môn chủ đặt điều kiện vào (từ X kiếp, tuổi đạo Y) và chọn "Mở cửa" (vào ngay) hoặc "Duyệt đơn".
- **Tên môn:** ghép từ 3 danh sách chọn sẵn (tiền tố, gốc, hậu tố: "Thanh Hư" + "Tông"...), nút Ngẫu nhiên, không gõ tự do (khỏi kiểm duyệt). Trùng tên thì báo chọn lại.
- **Huy hiệu:** 30 huy hiệu pixel (khiên + biểu tượng, 6 màu x 5 hình). **Chính điện:** 10 hình pixel. Chỉ để nhận diện, không cộng gì.
- **Khóa thành viên:** môn đã cắm cờ thì ai TỰ RỜI phải chờ hết Kỷ mới vào môn khác. Ai BỊ ĐUỔI thì vào môn khác ngay. Được báo rõ trước khi bấm vào môn.
- Chức: Môn chủ (1), Trưởng lão (tối đa 3), Đệ tử. Môn chủ và trưởng lão nhận người, phát lệnh xuất chinh, cắm cờ ô trống. Môn chủ rời môn thì trưởng lão có Lực chiến cao nhất lên thay.

### Hằng ngày (đổi lúc 5:00)
- **Điểm danh:** +1 Khí vận cho môn. Chuỗi 7 ngày liền tặng một ngoại trang chân thân (mỗi Kỷ một lần).
- **3 nhiệm vụ ngày**, làm ngay trong kiếp, tự xong khi kiếp khép lại (trigger trên `vkl_lives`, không cần bấm nhận). Khó theo Lực chiến người chơi (3 bậc). Chỉ dùng mốc người chơi tự điều khiển được: số kiếp chơi xong, tuổi sống tới, cảnh giới đạt được. KHÔNG dùng mốc may rủi (mệnh, linh căn, thiên phú). Thưởng +2, +3, +5 Khí vận.
  - Bậc 1 (Lực chiến dưới 1.500): chơi xong 1 kiếp / một kiếp sống qua 60 tuổi / một kiếp lên Trúc Cơ.
  - Bậc 2 (1.500-5.000): chơi xong 2 kiếp / qua 120 tuổi / lên Kim Đan.
  - Bậc 3 (trên 5.000): chơi xong 3 kiếp / qua 300 tuổi / lên Nguyên Anh.
  - Màn nhiệm vụ hiện "kiếp tốt nhất hôm nay: 87 tuổi" để thấy còn thiếu bao nhiêu.
- **Khí vận cả môn mỗi ngày:** đạt 30 → +10% Lực chiến cả môn từ 5:00 sáng mai tới 5:00 hôm sau (cả đánh lẫn giữ). Đạt 60 → +20%. Khí vận không tiêu, không cộng dồn qua ngày, chỉ là thước đo, nên không có lạm phát.
  - Kiểm tra số: môn 12 người, mỗi người điểm danh (1) và làm 2 nhiệm vụ dễ (2+3) = 6/người → 72. Môn 8 người chăm = 48 (qua mốc 30). Môn 15 người mà chỉ 5 người chơi = 30. Mốc 60 cần khoảng 10 người chăm, là phần thưởng cho môn đông và đều.

### Lực chiến (theo người, theo chân thân)
- `Lực chiến = (30 x √tổng năm đã sống + 200 x ln(1 + số kiếp) + 80 x bậc cảnh giới cao nhất + 15 x số kết cục (tối đa 100) + 50 x số ngày chơi (tối đa 30)) x (1 + 4% mỗi huyệt + 3% mỗi hành viên mãn)`. Kiếp chết trước 16 tuổi không tính.
- Số 13/11 trên dữ liệu thật: người mới khoảng 680, trung vị 2.235, top 10% khoảng 5.660, cao nhất khoảng 17.300.
- **Trần đóng góp (mới, sau review 14/11):** người cao nhất bằng 7,7 người trung vị, nên một môn 3 người rất mạnh có thể thắng môn 12 người chăm. Khi cộng Lực chiến của môn trong trận, mỗi người tính đủ tới 6.000; phần trên 6.000 chỉ tính một nửa. Người cao nhất khi đó bằng khoảng 5,2 người trung vị. Trần này áp như nhau cho mọi người, màn Lực chiến ghi rõ.
- Lực chiến tính lại mỗi khi kiếp khép lại (cùng trigger), lưu trong bảng, không tính lúc đánh.

### Bản đồ
- Ô lục giác, bán kính 6 (127 ô) khi tới 30 môn, bán kính 7 (169 ô) khi 31-45 môn. Cỡ đặt lúc mở Kỷ.
- Mỗi ô có tên riêng (ghép từ danh sách: "Vọng Nguyệt" + "Phong"...), người chơi chỉ thấy tên, tọa độ để code dùng.
- 3 cõi chia đều quanh tâm (Thiên, Hồng Trần, U Minh), chỉ để kể chuyện và nhận diện, không cộng gì.
- Ô có huy hiệu môn chủ ô, ô của môn ta viền vàng, ô trống tối.
- Mỗi môn giữ tối đa 1 + (số người / 3) ô (15 người = 6 ô). Đủ ô thì nút Xuất chinh khóa, ghi "Cần thêm 3 người mới đánh được ô mới". Không có luật giữ tạm.
- Kiểm tra số: 25 môn x tối đa 6 ô = 150 > 127 ô → đủ chỗ cho mọi môn cắm cờ, không đủ để tất cả cùng giữ tối đa, nên phải tranh.

### Đánh nhau
- **Đứng giữ (Claude chốt 13/11, Tyler duyệt 14/11):** mỗi người chọn sẵn một ô của môn để đứng giữ; offline vẫn tính. Chưa chọn thì đứng ở ô cắm cờ đầu tiên (ô chính điện).
- **Trinh sát:** mất 10 phút mỗi ô (đi và về), báo số người đang đứng giữ và Lực chiến ước tính (sai số ±15%).
- **Xuất chinh:** môn chủ hoặc trưởng lão chọn một ô kề lãnh thổ. 30 phút tập hợp, thành viên bấm "Theo" (rút lại được trước khi hết giờ). Rồi đi 20 phút mỗi ô. Môn bị đánh thấy ngay lúc xuất phát; ai đang online có thể dồn sang ô bị đánh trong thời gian đó.
- **Tính trận** khi tới nơi (pg_cron mỗi phút): tổng Lực chiến bên đánh (có trần) x (1 + Khí vận) so với tổng Lực chiến người đứng giữ (có trần) x 1,25 sân nhà x (1 + Khí vận của họ) x 2 nếu tới nơi lúc 0-7h. Bên lớn hơn thắng, không ngẫu nhiên. Bằng nhau thì bên giữ thắng.
- Ô trống: tới nơi là cắm cờ.
- Thắng: ô đổi chủ, được bảo hộ 6 giờ. Người đứng giữ ô vừa mất tự về ô chính điện. Thua: người đi theo nghỉ 2 giờ (không theo, không giữ được), không mất gì khác.
- **Mất ô chính điện:** môn chọn lại ô chính điện trong số ô còn giữ. Mất hết ô thì môn còn nguyên người, được cắm cờ một ô trống bất kỳ (không cần kề), bảo hộ 12 giờ.
- **Chống lăn cầu tuyết (mới, sau review 14/11):** môn đang giữ 1 ô được +15% khi giữ ô đó.
- Mỗi chân thân một việc một lúc: đi đánh, đứng giữ, hoặc đang nghỉ.
- Màn trận KHÔNG hiện phép nhân: chỉ thanh Ta/Họ và một câu kết luận ("Đang thiếu khoảng 1.650 - thêm 1 người như ngươi là đủ"). Công thức nằm ở màn Lực chiến.

### Sư Đồ (thêm 14/11, Claude chốt theo vai đồng sở hữu)
- Bản gọn 13/11 lỡ bỏ Sư Đồ; thêm lại vì đây là đường mời bạn duy nhất của game và là điều kiện của đạo Truyền Đạo (20 đệ tử).
- **Link mời:** `https://van-kiep-luan-hoi.vercel.app/?su=<tên tài khoản>`. Nút "Mời đệ tử" ở tab Nhân vật (màn Chân thân) và màn Thành viên của Sơn Môn. Thẻ chia sẻ có hình chân thân sư phụ và dòng "<pháp danh> mời ngươi bái sư".
- **Bái sư:** người bấm link được nhớ 7 ngày (cookie). Lúc người đó TẠO chân thân thì thành đệ tử của chủ link, một lần, không đổi được. Người đã có chân thân từ trước không thành đệ tử (chặn tự mời tài khoản cũ).
- **Đệ tử thành tài:** đệ tử chơi xong 10 kiếp (không tính kiếp chết trước 16 tuổi) trong 7 ngày đầu. Chỉ đệ tử thành tài mới được tính cho đạo Truyền Đạo và mới có thưởng.
- **Thưởng:** mỗi đệ tử thành tài: sư phụ +20 phúc duyên, đệ tử +20 phúc duyên. Sư phụ nhận thưởng tối đa 5 đệ tử mỗi tuần (vẫn đếm đủ cho Truyền Đạo). Danh hiệu sư phụ ở mốc 5 và 20 đệ tử thành tài.
- **Với Sơn Môn:** sư phụ có môn thì môn đó đứng đầu danh sách của đệ tử, có nút "Vào môn của sư phụ" (vẫn phải đủ điều kiện vào môn). Không bắt buộc vào.
- **Chống gian lận:** đánh dấu cho Tyler xem khi nhiều đệ tử của cùng một sư phụ dùng chung một thiết bị (sid) hoặc thành tài trong cùng một giờ.
- Màn Chân thân hiện: sư phụ của ngươi (nếu có), số đệ tử, số đệ tử thành tài.

### Đồng minh
- Chưa làm. Bản đồ và màn Môn có dòng "Đồng minh: sắp có - các sơn môn kết minh để không đánh nhau và cùng giữ ô". Không hứa ngày.

### Kỷ
- Kỷ 1: 18/11 5:00 - 1/12 21:00. Từ Kỷ 2 mỗi Kỷ 28 ngày (Tyler chốt sau khi xem số Kỷ 1).
- Xếp hạng theo số ô giữ lúc hết Kỷ, bằng nhau thì xét tổng Khí vận cả Kỷ.
- Thưởng chỉ đồ trang trí: hạng 1 hào quang chân thân + tên môn khắc ở Sổ Sinh Tử; hạng 2-3 khung tên môn vàng; mọi người đủ 7 ngày điểm danh nhận ngoại trang. Không thưởng chỉ số.
- Hết Kỷ: mọi ô về trống, khóa thành viên mở. Tên, huy hiệu, người trong môn giữ nguyên.

### Chống gian lận
- Toàn bộ trạng thái ở máy chủ (Supabase), trình duyệt chỉ gửi lệnh; mọi lệnh kiểm tra quyền, khóa, lượt ở hàm.
- Lực chiến tính ở máy chủ từ `vkl_lives` (đã có `lives_guard` và chống sửa save 5/11).
- Đánh dấu để Tyler xem tay: nhiều tài khoản mới vào cùng một môn trong một ngày; một cặp môn đánh nhau một chiều liên tục; tài khoản chưa tới 3 ngày tuổi ký lập môn.

## Kiểm tra theo người chơi (game-design player-experience + balance-review, 14/11)

- Người mới từ quảng cáo (vừa xong kiếp 1): có chân thân nhưng thường chưa liên kết tài khoản → màn Sơn Môn phải nói thẳng "Liên kết tài khoản để vào môn" + nút, không để màn trống. Vào môn rồi có việc ngay: điểm danh + nhiệm vụ bậc 1 làm được trong kiếp kế.
- Người trung vị (8 kiếp, 2 ngày): không lập được môn, vào môn mở cửa. Mỗi ngày 2-3 phút ở tab Sơn Môn (điểm danh, xem nhiệm vụ, chọn ô đứng giữ), còn lại chơi kiếp như cũ. Điểm dừng tự nhiên: 3 nhiệm vụ xong.
- Người chơi lâu: lập môn, tuyển người, phát lệnh. Lý do quay lại trong ngày: lệnh xuất chinh, bị đánh, Khí vận gần mốc.
- Ngày 1 của Kỷ (18/11 5:00) chưa có môn nào: vì môn dùng được ngay khi lập, người đủ điều kiện lập được từ 5:00. Màn danh sách lúc chưa có môn: "Chưa có môn nào mở. Các môn đang chờ người ký" + danh sách chờ ký (người đủ điều kiện ký được) + nút "Báo ta khi có môn mở cửa" (hiện chấm đỏ ở tab Sơn Môn khi có).
- Màn hết kiếp (cáo biệt, 71% người chơi chỉ đi qua đây): một dòng "Kiếp này góp +2 Khí vận cho <tên môn>" nếu có môn, hoặc "Vào một sơn môn để mỗi kiếp góp Khí vận" nếu chưa.
- Rủi ro đã xét: thế bế tắc (bên giữ luôn lợi): bên đánh dồn hết người vào một ô còn bên giữ phải chia người ra nhiều ô, nên dồn quân là cách thắng; mô phỏng ở Ngày 2 phải cho ra 35-65% trận đánh ô có người giữ thành công.

## Ngày 1 - Máy chủ
Lên bản: 2026-11-15 (giấu sau cờ). Kỹ năng: `supabase:supabase-postgres-best-practices` (đọc trước khi viết SQL).
- [x] Chuyển `supabase/son_mon_2026_11_14.sql`, `supabase/son_mon_cfg_2026_11_14.sql` sang `supabase/_bo/`.
- [x] Bảng (tiền tố `vkl_sm_`, RLS bật, không policy, chỉ đọc/ghi qua hàm SECURITY DEFINER): `ky` (id, bắt đầu, kết thúc, bán kính), `tile` (ky, q, r, tên, cõi, mon_id, chinh_dien bool, bao_ho_toi), `mon` (ky_lap, tên 3 phần, huy_hieu 0-29, chinh_dien_hinh 0-9, dk_kiep, dk_tuoi_dao, mo_cua bool, môn chủ, lap_luc, het_han_ky), `mon_ky` (chữ ký cùng lập), `member` (player, mon, chức, dung_o, khoa_toi, nghi_toi), `don` (đơn xin vào), `luc_chien` (player, lc, cập nhật lúc), `ngay` (mon, ngày, khí vận), `diem_danh` (player, ngày, chuỗi), `nv` (player, ngày, 3 nhiệm vụ, tiến độ, xong), `chinh` (lệnh xuất chinh: mon, từ ô, tới ô, tập hợp tới, tới nơi lúc, trạng thái), `chinh_theo`, `bao` (chiến báo), `co` (đánh dấu nghi gian lận).
- [x] Hàm `vkl_priv.sm_lc(player)` theo công thức; trigger `after insert on vkl_lives` (tên `vkl_lives_zz_son_mon`, nuốt mọi lỗi để không chặn ghi bia): cập nhật Lực chiến và tiến độ nhiệm vụ ngày, cộng Khí vận cho môn.
- [x] RPC (tiền tố `vkl_sm_`): `state(token)` (môn của ta, nhiệm vụ, khí vận, lệnh đang chạy), `list(token)`, `found(token, tên, huy hiệu, chính điện, dk)`, `cosign(token, mon)`, `pick_tile(token, q, r)`, `join(token, mon)`, `apply`/`accept`/`kick`/`leave`, `checkin(token)`, `guard(token, q, r)`, `scout(token, q, r)`, `march(token, q, r)`, `follow(token, chinh)`, `unfollow`, `map(ky)` (công khai, đọc qua bộ đệm Vercel 30 giây), `rank(ky)`.
- [x] `pg_cron` mỗi phút: xử lý trinh sát xong, lệnh tới nơi (tính trận, ghi chiến báo), môn hết 24 giờ chưa đủ chữ ký, hạ điều kiện lập môn lúc 5:00 nếu các môn đầy trên 80%.
- [x] Sinh bản đồ Kỷ (`vkl_priv.sm_ky_create(bắt đầu, kết thúc, bán kính)`): tên ô ghép từ danh sách, 3 cõi chia đều.
- [x] Thử trên Postgres cục bộ trước, rồi áp lên Supabase bằng apply_migration. Lưu SQL vào `supabase/son_mon_gon_2026_11_15.sql`.
- Xong: 14/11/2026 7aa34ac (Supabase đủ từ 22:00 14/11, Tyler tự chạy cả file trong SQL Editor).
- Ghi chú: SQL ở `supabase/son_mon_gon_2026_11_15.sql`, viết để áp lại cả file nhiều lần không hỏng (create if not exists, create or replace, on conflict do nothing). Thử trên Postgres 16 cục bộ với 41 tài khoản giả: lập môn (chặn tên ngoài danh sách, trùng tên, chưa đủ 50 kiếp + 5 ngày), ký cùng lập (chặn tự ký, đủ 2 chữ ký thì xong), vào môn mở cửa, xin vào môn duyệt đơn + nhận, cắm cờ ô đầu (chỉ môn chủ/trưởng lão), điểm danh (một lần một ngày), nhiệm vụ qua trigger khi ghi bia (bậc 2 xong 2/3, Khí vận cộng đúng), rời môn đã cắm cờ thì bị khóa tới hết Kỷ, xuất chinh (chặn ô không kề, một lệnh một lúc, đệ tử không phát lệnh), theo/rút theo, trinh sát xong qua `sm_tick`, cắm cờ ô trống khi tới nơi, trận thua (27.111 so với 38.647: sân nhà 1,25 x một ô 1,15), người theo bị nghỉ 2 giờ, môn hết 24 giờ chưa đủ chữ ký tự giải tán, van an toàn lúc 5:00. Cõi của 127 ô khớp từng ô giữa SQL và `lib/sonmon/data.ts`; Lực chiến SQL và TS khớp (4.287).
  - Claude tự chốt (đổi được): "tuổi đạo" trong điều kiện vào môn = số ngày chơi khác nhau (từ 16 tuổi), tối đa 30; mỗi người ký cùng lập tối đa 2 môn mỗi Kỷ; trinh sát tính 10 phút x khoảng cách từ ô gần nhất của môn (tối thiểu 10 phút); mỗi môn một lệnh xuất chinh một lúc, người phát lệnh tự theo; lần cắm cờ đầu không có bảo hộ, cắm lại sau khi mất hết ô thì bảo hộ 12 giờ; đổi chính điện khi mất = ô giữ lâu nhất; bảng thêm ngoài plan: `vkl_sm_cfg` (hệ số), `vkl_sm_trinh` (trinh sát), `vkl_sm_thuong` (ngoại trang chuỗi 7, thưởng Kỷ); RPC thêm: `vkl_sm_members`, `vkl_sm_role`, `vkl_sm_set_dk`, `vkl_sm_unfollow` (cho màn M8 ở Ngày 5). Lỗi trả bằng mã `SM_...`, câu cho người chơi ở `SM_LOI` trong `lib/sonmon/data.ts`. Khách chơi thử không có tài khoản trong `vkl_players` nên mọi tài khoản có token đều coi là đã liên kết; thiếu chân thân thì `SM_NO_CT`.
  - Supabase 14/11: phần 1 (16 bảng có RLS không policy, cấu hình, 17 hàm nội bộ `vkl_priv.sm_*`) đã áp bằng apply_migration. Phần 2 (trigger `vkl_lives_zz_son_mon`, trận, `sm_tick`, mọi RPC `vkl_sm_*`, quyền, pg_cron) bị chặn: máy chủ Supabase hỏi xác nhận (câu lệnh `drop trigger if exists`) mà không ai trả lời trong 180 giây. Theo luật không lách. Đêm 15/11 (hoặc khi Tyler duyệt): áp lại CẢ file `supabase/son_mon_gon_2026_11_15.sql` bằng apply_migration TRƯỚC khi làm Ngày 3; kiểm `select count(*) from pg_proc where proname like 'vkl_sm\_%'` ra 21. Các hàm `vkl_priv` đã áp chưa gọi được từ trình duyệt (anon không có quyền dùng schema `vkl_priv`), bảng đều bật RLS, nên chưa ảnh hưởng người chơi.
  - 14/11 khoảng 22:00: Tyler tự dán cả file vào SQL Editor và chạy. Kiểm lại trên máy thật: 21 hàm `vkl_sm_*`, 28 hàm `vkl_priv.sm_*`, có trigger `vkl_lives_zz_son_mon` (2 kiếp có chân thân ghi sau đó đã có Lực chiến), pg_cron `vkl_sm_tick` mỗi phút chạy thành công, cấu hình `tran` có `moc1: 30`, `moc2: 50`, anon gọi được `vkl_sm_state`, không gọi được `vkl_priv.sm_tick`. Lực chiến của người cũ tính dần mỗi khi họ xong một kiếp (hoặc khi mở màn Sơn Môn).
  - Chưa tạo Kỷ nào trên máy thật (Kỷ 1 tạo ở Ngày 7).

## Ngày 2 - Số liệu và mô phỏng
Lên bản: 2026-11-15 (giấu sau cờ). Kỹ năng: `anthropic-skills:game-design` (balance-review).
- [x] Viết lại `lib/sonmon/data.ts`: danh sách tên môn 3 phần, tên ô, 30 huy hiệu (màu + hình), 10 chính điện, nhiệm vụ 3 bậc, công thức Lực chiến và trận (bản TypeScript để hiện ước tính; máy chủ là bản thật).
- [x] Viết lại `scripts/sim-son-mon.ts` bằng Lực chiến THẬT của người chơi (đọc `vkl_sm_luc_chien` hoặc tính từ `vkl_lives`): chia 25 môn theo cách người chơi tự vào (người mạnh lập môn, người khác vào môn mở cửa), 14 ngày, mỗi người online theo giờ thật (`vkl_events` 7 ngày). Đo:
  - % trận đánh ô có người giữ thành công (mục tiêu 35-65%).
  - Số ô của môn nhất / môn trung vị cuối Kỷ (mục tiêu không quá 3 lần).
  - % ngày môn trung vị đạt Khí vận 30 (mục tiêu 50-80%) và 60 (mục tiêu 10-40%).
  - Ngoài mốc thì chỉnh hệ số (sân nhà, trần đóng góp, Khí vận) và ghi số trước/sau vào "Ghi chú:".
- [x] Đưa số đã chốt vào hàm máy chủ.
- Xong: 14/11/2026 7aa34ac
- Ghi chú: `scripts/sim-son-mon.ts` chạy bằng 315 người chơi THẬT (có chân thân, có mặt trong 7 ngày tới 14/11; Lực chiến, số kiếp, số ngày, ngày có mặt và giờ online từ `vkl_events`, ẩn danh trong `scripts/fixtures/sm-nguoi-choi.txt`). 25 môn do người Lực chiến cao đủ 50 kiếp + 5 ngày lập (60 người đủ), 60% người khác vào môn mở cửa (môn đông được chọn hơn), mỗi người chơi theo xác suất ngày có mặt, online 3 giờ trong các giờ quen, một nửa chọn ô đứng giữ, người online của bên bị đánh 70% dồn sang ô bị đánh, môn chủ đánh khi trinh sát (±15%) thấy đánh được (liều thêm tới 20%). 40 lần chạy, 14 ngày. Chạy: `npx tsx scripts/sim-son-mon.ts 40`.
  - Trước (hệ số trong plan, mốc Khí vận 30/60): trận đánh ô có người giữ thắng 40,3% (mục tiêu 35-65%, đạt); ô môn nhất / trung vị 5,9 / 3,0 = 1,95 lần (mục tiêu <= 3, đạt); môn trung vị (7,5 người) đạt Khí vận 30 77,0% số ngày (50-80%, đạt), đạt 60 chỉ 4,8% (10-40%, KHÔNG đạt).
  - Đã chỉnh: mốc Khí vận thứ hai 60 -> 50 (vẫn +20%). Lý do: môn trung vị chỉ 7-8 người, mốc 60 cần khoảng 10 người chăm nên gần như chỉ môn đầy mới chạm. Sau: đạt 50 20,4% số ngày (đạt), đạt 30 77,3%, trận có người giữ 40,1%, tỉ lệ ô 1,95. Mọi môn: đạt 30 66,0%, đạt 50 31,8%.
  - Đã thử và giữ nguyên: sân nhà 1,1 cho 42,7%, 1,4 cho 36,9% (cả hai vẫn trong mốc) nên giữ 1,25; trần 6.000 giữ; 20 môn thay vì 25: môn trung vị 10 người, đạt 30 86%, đạt 60 25%. Nếu 80% người vào môn: môn trung vị 10,5 người, đạt 30 91% (trên mốc 80%), đạt 50 50%: khi đó xem lại mốc ở Kỷ 2.
  - Số đã đưa vào máy chủ: bảng `vkl_sm_cfg` khóa `tran` thêm `moc1: 30`, `moc2: 50`, hàm `vkl_priv.sm_kv_bonus` đọc hai mốc này (nằm trong phần chưa áp, xem Ghi chú Ngày 1). Chữ trên màn ở Ngày 3 phải ghi "đạt 30 / đạt 50" (wireframe M4 ghi vạch 30/60: theo plan này).
  - Giới hạn mô phỏng: người chơi thật trong 7 ngày có chân thân chỉ 315 (plan ghi 770 tài khoản chơi 7 ngày, nhưng phần lớn chưa có chân thân hoặc không có sự kiện); số trận ít (khoảng 12 trận đánh ô có người giữ mỗi Kỷ) vì môn chủ chỉ phát lệnh khi online và ô kề còn trống thì cắm cờ trước.

## Ngày 3 - Vào môn, lập môn, môn nhà
Lên bản: 2026-11-16 (giấu sau cờ). Kỹ năng: `anthropic-skills:uiux-pro-max`, `anthropic-skills:humanizer` (chữ trên màn).
- [x] Trang `/son-mon` theo wireframe M1 (danh sách, lọc Đủ điều kiện / Còn chỗ, thẻ Tự lập môn ghi rõ còn thiếu gì), M2 (lập môn: tên 3 phần + Ngẫu nhiên, 30 huy hiệu, 10 chính điện, điều kiện vào, Mở cửa / Duyệt đơn), M3 (chọn ô trống trên bản đồ, cảnh báo khóa thành viên, chờ 2 chữ ký), M4 (môn nhà: thẻ môn, cảnh báo bị đánh, điểm danh chuỗi 7, 3 nhiệm vụ có tiến độ, thanh Khí vận có vạch 30/60).
- [x] Màn trống ngày đầu và khách chưa liên kết (xem mục Kiểm tra theo người chơi).
- [x] 30 huy hiệu và 10 chính điện: pixel, vẽ bằng lưới ô vuông trong code (như icon cũ) hoặc ghép từ tileset LPC sẵn có; KHÔNG dùng emoji.
- [x] Màn cáo biệt kiếp: dòng Khí vận (có môn / chưa có môn).
- [x] Đo: `sm_open`, `sm_join` (mở cửa/đơn), `sm_found`, `sm_cosign`, `sm_checkin`, `sm_nv_done`.
- [x] Mọi nút cao từ 44px, một nút chính mỗi màn, chữ ít nhất 12px, không đoạn chữ quá 3 dòng trên điện thoại.
- Xong: 15/11/2026 4924ed7, 7c79bac, cbc26dc
- Ghi chú: Trang `/son-mon` (components/sonmon/*, điểm vào `SonMonHome`), cờ tắt thì chỉ có màn chờ. Huy hiệu và chính điện vẽ pixel bằng SVG rect. Dòng Khí vận ở màn cáo biệt: `components/sonmon/SmFarewell.tsx` (tính trước từ nhiệm vụ ngày, máy chủ cộng thật khi bia được ghi). Thử: `scripts/smoke-son-mon.cjs` 16 màn (dữ liệu giả `?demo=<vai>` chỉ khi chạy dev), không tràn ngang, nút từ 44px, chữ từ 12px. Đo thêm ngoài plan: sm_notify, sm_link_click, sm_pick_tile, sm_invite, sm_accept, sm_set_dk, sm_role, sm_kick, sm_leave.
  - Claude tự chốt: "tuổi đạo" ghi "Tuổi đạo (ngày đã chơi)" 0-30 theo máy chủ; thanh Khí vận đầy ở 50, vạch ở 30; nút "Báo ta khi có môn mở cửa" lưu `localStorage['vkl.sm.baoMo']` (chấm đỏ ở tab Sơn Môn: làm ở Ngày 7); "Mời người chưa có môn" dùng chung link Sư Đồ.
  - Lỗi nhỏ để Ngày 7: M2 có hai nút quay lại; biểu tượng rồng 8x8 trông giống chữ S; chưa chọn ô bằng bàn phím được.


## Ngày 3b - Sư Đồ
Lên bản: 2026-11-16 (người chơi thấy luôn, có cáo thị một dòng trong bản gần nhất). Tyler chốt 14/11: Sư Đồ lên 16/11, Sơn Môn 18/11.
- [x] Sư Đồ (mục "Sư Đồ" ở trên), cờ riêng `SU_DO_ON` (bật mặc định, KHÔNG phụ thuộc `SON_MON_ON`), người chơi thấy từ 16/11. Nút "Vào môn của sư phụ" chỉ hiện khi `SON_MON_ON` bật (18/11): bảng `vkl_su` (sư phụ, đệ tử, bái lúc, thành tài lúc), cookie `?su=` 7 ngày, gắn lúc tạo chân thân, trigger trên `vkl_lives` đếm kiếp đệ tử và cộng phúc duyên (nuốt lỗi), hàm MỚI `vkl_su_count(token)` trả số đệ tử thành tài, client gộp vào `disciples` của DaoExt cho đạo Truyền Đạo (không sửa `vkl_ct_ext` có sẵn), nút Mời đệ tử + thẻ chia sẻ OG, dòng sư phụ/đệ tử ở màn Chân thân. Đo `su_link_open`, `su_bind`, `su_done`. Thử: 3 tài khoản giả (sư phụ, đệ tử mới, tài khoản cũ bấm link không thành đệ tử).
- [x] Đăng ký trước khi Sơn Môn mở: đệ tử bái sư từ 16/11 vẫn được tính, thành tài tính theo 7 ngày kể từ lúc bái.
- Xong: 15/11/2026 168bf79 (máy chủ: migration `su_do_2026_11_16` đã áp lên Supabase)
- Ghi chú: Bảng `vkl_su`, hàm mới `vkl_su_bind`, `vkl_su_info`, `vkl_su_claim`, `vkl_su_count`, trigger mới `vkl_lives_zz_su_do` (nuốt lỗi). SQL ở `supabase/su_do_2026_11_16.sql`. Thử Postgres cục bộ 3+ tài khoản giả: tài khoản cũ SU_OLD, tự bái SU_SELF, bái lần hai SU_DONE, kiếp dưới 16 tuổi không tính, 10 kiếp thì thành tài, nhận thưởng đúng một lần, trần 5 đệ tử/tuần, cờ nghi gian lận su_cung_may/su_cung_gio. `scripts/smoke-su-do.cjs` 19/19 OK. Cờ `SU_DO_ON` bật mặc định.
  - Claude tự chốt: thưởng phúc duyên KHÔNG ghi thẳng vào meta máy chủ (máy khách ghi đè meta), mà máy chủ giữ số "chờ nhận", màn Chân thân gọi `vkl_su_claim` rồi cộng vào hồ sơ. Link chia sẻ là thẻ `/k/<id>?su=<tên>` (có ảnh OG chân thân sư phụ, tiêu đề "<pháp danh> mời ngươi bái sư"); `/?su=<tên>` vẫn dùng được. Bắt link trên mọi trang (components/SuDoLink.tsx ở layout), chỉ nhớ khi máy chưa có chân thân. Tài khoản cũ = tạo quá 8 ngày hoặc đã có quá 5 kiếp. Mã máy mới `vkl.did` để so đệ tử cùng máy. Danh hiệu sư phụ: "Danh sư" (5), "Truyền Đạo Tôn Sư" (20).
  - Thêm 15/11 tối (Tyler yêu cầu): danh sách đệ tử kèm tiến độ từng người ở màn Chân thân (thanh 10 ô, "7/10 kiếp, còn 4 ngày", lần chơi gần nhất, nhãn Đang tu / Thành tài / Hết hạn, 5 người đầu + "Xem cả N đệ tử"), sư phụ của ngươi cũng có thanh 10 ô. Trang quản trị `/quan-tri/su-do` (noindex, chỉ tài khoản trong `vkl_sm_admin_user`): số tổng, mọi cặp thầy trò với tiến độ và trạng thái thưởng, lọc theo trạng thái, tìm theo tên, đánh dấu nghi gian lận. Hàm MỚI `vkl_su_ds`, `vkl_su_admin` (migration `su_do_ds_2026_11_16`, file `supabase/su_do_ds_2026_11_16.sql`), thử trên Supabase trong giao dịch rồi hoàn tác. `scripts/smoke-su-do.cjs` thêm 15 bước, tất cả OK.
  - Chưa làm (chuyển sang Ngày 7): nút "Vào môn của sư phụ" khi `SON_MON_ON` bật.
  - Luật giao diện mới: đã rà ảnh 390x844 (khách chưa đăng nhập: nút khóa ghi lý do ngay dưới; đã đăng nhập: sư phụ, tiến độ, số đệ tử), humanizer: sửa câu trộn "bạn/ngươi" thành "Người mới vào bằng link của ngươi...".

## Ngày 4 - Bản đồ và đánh nhau
Lên bản: 2026-11-16 (giấu sau cờ). Kỹ năng: `anthropic-skills:uiux-pro-max`, `anthropic-skills:gamedev` (game-ui-ux).
- [x] M5 bản đồ lục giác (kéo để xem, nút Về lãnh thổ), chạm ô: tên ô, môn chủ, kề hay không, trinh sát gần nhất, nút Trinh sát / Xuất chinh. Đọc bản đồ qua `/api/pub/sm-map` (bộ đệm Vercel 30 giây).
- [x] M6 xuất chinh: 4 bước (Trinh sát, Tập hợp, Di chuyển, Giao tranh) có đồng hồ, danh sách người theo, nút THEO XUẤT CHINH, thanh Ta/Họ + một câu.
- [x] M7 chiến sự: cảnh báo bị đánh có đồng hồ, danh sách người đang đứng giữ, nút "Sang giữ <tên ô>", ô ngươi đang đứng giữ + Đổi, chiến báo gần đây bằng chữ.
- [x] Làm mới trạng thái 60 giây một lần khi tab đang mở (không làm mới khi tab ẩn).
- [x] Đo: `sm_scout`, `sm_march`, `sm_follow`, `sm_guard`, `sm_battle` (thắng/thua, bên).
- Xong: 15/11/2026 4924ed7, 7c79bac
- Ghi chú: M5-M7 xong sau cờ, route `/api/pub/sm-map` (s-maxage=30, cờ tắt trả 404). Máy chủ chưa trả tên người theo xuất chinh và sức bên đánh trong `bi_danh`: M6 chỉ ghi số người và ước tính, M7 chỉ "Sức giữ khoảng X". Làm hàm MỚI trả thêm hai thứ này ở Ngày 7 nếu kịp (không sửa `vkl_sm_state`).

## Ngày 5 - Thành viên, Kỷ, Lực chiến, thanh 4 tab
Lên bản: 2026-11-16 (giấu sau cờ, riêng thanh 4 tab người chơi thấy luôn; Tyler chốt 14/11 tối gộp bản 17/11 vào 16/11). Kỹ năng: `anthropic-skills:uiux-pro-max`.
- [x] M8 thành viên: bảng (tên, chức, Lực chiến, Khí vận góp hôm nay, đang đứng ở ô nào), đơn xin vào (Nhận/Từ chối), Mời người chưa có môn, Sửa điều kiện vào, luật rời/đuổi.
- [x] M9 Kỷ: đếm ngược, bảng xếp hạng (số ô, Khí vận), thưởng trang trí, chuyện gì xảy ra khi hết Kỷ.
- [x] M10 Lực chiến: công thức bằng lời, từng phần của ngươi, trần 6.000, Khí vận.
- [x] Thanh 4 tab theo wireframe layout (Mộng · Nhân vật · Sơn Môn · Lôi đài), nút Mời trà luôn ở thanh trên. Tyler chốt 14/11: giao diện mới là giao diện có tab, nên thanh tab KHÔNG giấu theo cờ `SON_MON_ON` mà lên trang cùng bản 16/11, có cờ riêng `TAB_ON` (bật mặc định, tắt gấp thì về menu cũ).
  - Tab Sơn Môn trước ngày mở (cờ `SON_MON_ON` tắt): bấm vào chỉ thấy một màn chờ, không có nội dung môn nào: tên "Sơn Môn", một câu ngắn nói đây là gì (lập môn cùng đạo hữu, giữ đất trên bản đồ), và ngày mở "Mở cửa 5:00 sáng 18/11". Không có nút bấm nào khác. Đo `sm_teaser` (số người bấm vào tab khi chưa mở).
  - Từ 18/11 (Ngày 7 bật `SON_MON_ON`): tab Sơn Môn hiện nội dung thật, màn chờ biến mất.
  - Người cũ lần đầu thấy thanh tab: một câu hướng dẫn ngắn chỉ chỗ các nút cũ (Đầu thai, túi đồ, bảng xếp hạng, chân thân nằm ở tab nào).
  - Trước khi đánh dấu lên bản 16/11: chạy đủ 2 bước của "Luật giao diện mới" cho thanh tab và màn chờ Sơn Môn.
- Xong: 15/11/2026 4924ed7, cbc26dc
- Ghi chú: M8-M10 sau cờ. Thanh 4 tab: `components/TabBar.tsx`, cờ `TAB_ON` (bật mặc định), có ở trang đầu (Mộng), /chan-than (Nhân vật), /son-mon (Sơn Môn, màn chờ, đo `sm_teaser`), /loi-dai (thêm nút Bảng xếp hạng). Thanh trên: Mời trà + Menu (Cập nhật, Góp ý, Facebook, Mời tác giả chén trà, ngôn ngữ, nhạc, đăng nhập/đăng xuất). Trang đầu bỏ 3 nút Góp ý, Cập nhật, Facebook khỏi lưới (đã vào Menu), giữ Lôi đài hằng ngày, Bảng xếp hạng, Tàng Kiếp Các, Nghĩa trang, Sổ Sinh Tử, thẻ Mời tác giả chén trà, nút Đầu thai. Đo thêm: `tab_open`, `tab_hint_ok`, `menu_open`.
  - Luật giao diện mới, bước 1 (uiux-pro-max, ảnh 390x844 `scripts/smoke-tab.cjs`): vai người mới: thấy logo, chân thân (nếu có), nút Đầu thai ngay ở đáy, thanh tab; không có câu hướng dẫn thêm, ít nút hơn trước (bỏ 3 nút). Vai người cũ: câu "Bố cục mới. Đầu thai và túi đồ ở Mộng, chân thân ở Nhân vật, bảng xếp hạng ở Lôi đài. Góp ý, Cập nhật nằm trong nút Menu ở góc trên." hiện một lần. Lỗi nặng tìm được và đã sửa: câu hướng dẫn che nút Đầu thai ngay ở đáy, đã dời lên dưới thanh trên. Kiểm: nút tab và thanh trên cao từ 44px, không tràn ngang, cuối trang không bị thanh tab che, màn chờ Sơn Môn không có nút nào khác. Lỗi nhỏ: màn chờ Sơn Môn còn trống nhiều (theo plan chỉ một thẻ).
  - Bước 2 (humanizer): chữ tab, Menu, câu hướng dẫn, màn chờ và cáo thị: câu ngắn, một thứ một tên ("Menu", "Mời trà"), không trộn tiếng Anh ngoài chữ "Menu" đã có trong wireframe.

## Ngày 6 - Hết Kỷ, thử toàn bộ
Lên bản: 2026-11-16 (giấu sau cờ; Tyler chốt 14/11 tối gộp bản 17/11 vào 16/11).
- [x] Kết Kỷ: xếp hạng, phát danh hiệu và ngoại trang, ghi tên môn vào Sổ Sinh Tử, ô về trống, mở khóa thành viên.
- [x] Thử: Kỷ rút gọn 2 giờ (đồng hồ chia 20) trên Postgres cục bộ với 30 bot (script): lập môn, ký, vào môn, điểm danh, nhiệm vụ qua trigger, xuất chinh, đứng giữ, trận đêm, bảo hộ, môn mất hết ô, kết Kỷ. Playwright 390x844: người mới vào môn mở cửa; môn chủ lập môn, chọn ô, phát lệnh.
- [x] Trang quản trị nhỏ cho Tyler: số môn, số người trong môn, trận/ngày, các đánh dấu nghi gian lận.
- Xong: 15/11/2026 0c6efdc (máy chủ: migration `son_mon_ket_ky_2026_11_16` đã áp lên Supabase)
- Ghi chú: Hàm mới `vkl_priv.sm_ket_ky`, `sm_ket_ky_tick` (pg_cron mới `vkl_sm_ket_ky` mỗi phút), `sm_ky_moi` (mở Kỷ sau, mang môn sang), RPC mới `vkl_sm_ky_kq`, `vkl_sm_admin`; bảng mới `vkl_sm_ky_kq`, `vkl_sm_admin_user` (có `tudang`). `scripts/bot-son-mon.sh`: 30 bot, Kỷ rút gọn 2 giờ trên Postgres 16 cục bộ, 107/107 bước đạt (lập môn, ký, vào môn, điểm danh, nhiệm vụ qua trigger, xuất chinh, đứng giữ, trận đêm, bảo hộ, mất hết ô, kết Kỷ, Kỷ sau). Trang `/quan-tri/son-mon` (noindex, sau cờ). Sổ Sinh Tử có mục "Sơn môn các Kỷ" khi cờ bật. Playwright người mới/môn chủ: ảnh từ dữ liệu giả qua `scripts/smoke-son-mon.cjs`.
  - Claude tự chốt: hạng chỉ có thưởng khi môn còn ít nhất 1 ô; bằng ô và Khí vận thì môn lập trước đứng trên; "đủ 7 ngày điểm danh" = 7 ngày khác nhau trong Kỷ.
  - Để Ngày 7: Kỷ 2 phải tạo bằng `vkl_priv.sm_ky_moi`; màn M9 khi Kỷ đã kết còn đếm ngược về 0 (nên báo "Kỷ đã kết"); hào quang, khung vàng, ngoại trang mới ghi vào `vkl_sm_thuong`, chưa có màn nào hiện.
  - Trả lời góp ý (tác vụ 5:00 gửi SAU khi bản 16/11 lên trang; reply_ver '4.5.0'; gửi xong đặt status 'da_xong'):
    - Đã có câu trả lời nhưng còn status 'moi', chỉ cần đặt 'da_xong': #30, #60, #90, #92, #94, #99, #111, #134, #223, #224, #225, #227, #229, #235, #236.
    - #208: "Cảm ơn bạn đã báo. Mấy con số 1 tỷ linh thạch đó là bản lưu bị chỉnh tay, mình đã gỡ khỏi bảng xếp hạng, giờ bảng chỉ còn số chơi thật."
    - #211: "Bạn nói đúng, ai đã mở gần hết đồ ẩn hay kết cục thì nhiệm vụ đó không làm được. Từ bản 16/11, nhiệm vụ như vậy tự đổi sang việc khác làm được."
    - #222: "Mình hiểu cảm giác đó. Quái mạnh hơn nhiều có thể đánh một đòn rất nặng, nên ngưỡng rút lui 30% có lúc không kịp. Mình ghi lại ý cho tự chọn mức máu rút lui."
    - #233: "Cảm ơn bạn. Mình ghi lại chuyện nhiệm vụ dễ bị trôi, sẽ xem chỗ hiện cho rõ hơn."
    - #226, #242: "Bạn nói đúng, đồ truyền đời chưa ghi cộng bao nhiêu. Mình ghi lại để hiện số cộng ngay trên món đồ. Thiên phú mới và đao tu mình cũng ghi vào danh sách."
    - #237: "Thanks for playing! Poison tea is a harsh early lesson. Hope your next life goes further."
    - #238: "Cảm ơn bạn đã chơi tới kiếp 200. Mình ghi nhận chuyện kẻ thù kiếp trước tới quá đột ngột, sẽ xem có nên báo trước để bạn kịp tránh."
    - #239, #240: "Cảm ơn bạn. Chuyện tranh đất giữa các thế lực mình đang làm theo hướng Sơn Môn, có gì mới sẽ báo trong cáo thị. Chủng tộc mới mình ghi vào danh sách."
    - #249: "Cảm ơn bạn đã viết kỹ. Mình ghi nhận: ngộ tính chưa có tác dụng rõ, đột phá còn dễ, và muốn có thêm NPC. Hệ cảnh giới kiểu Già Thiên thì chưa đổi được ngay vì cả game dựng trên hệ hiện tại."
    - #252, #253, #254: "Cảm ơn bạn đã chấm từng kiếp. Bị sét đánh lúc Luyện Khí thường là do lên quá nhanh, kiếp sau thử chậm lại một chút nhé."
    - #255: "Kiếp 50 Khai Thiên, quá đỉnh. Cảm ơn bạn!"
    - #256: "Ý này hay, cảm ơn bạn. Mình ghi lại để làm phần tra cứu tông môn và kỹ năng."
    - #257: "Cảm ơn bạn. Mình đang nghĩ tiếp phần sau Hồng Hoang, có gì mới sẽ báo trong cáo thị."
    - #241, #244, #245, #246, #247, #248: "Cảm ơn bạn đã chơi và chấm kiếp!"
    - Sư Đồ (#55, #64, #67, #76, #119, #205): "Từ bản 16/11 đã có Sư Đồ: ở trang Chân thân bấm Mời đệ tử để lấy link. Người mới vào bằng link của bạn và chơi xong 10 kiếp trong 7 ngày thì hai thầy trò mỗi người được 20 phúc duyên."
    - Lập tông môn (#174, #185, #201, #221): CHƯA gửi, để tác vụ 5:00 ngày 18/11 trả lời khi Sơn Môn mở.

## Ngày 7 - Lên bản, Kỷ 1 bắt đầu
Lên bản: 2026-11-18. Bật cờ `SON_MON_ON`, có cáo thị 4.6.0.
- [x] Tạo Kỷ 1 (18/11 5:00 - 1/12 21:00, bán kính 6) trước 5:00.
- [x] Cáo thị 4.6.0 ngắn: sơn môn, điểm danh và nhiệm vụ trong kiếp, bản đồ lục giác, Kỷ 1 tới 1/12. Không hứa đồng minh hay Kỷ sau có gì.
- [x] Trước khi bật cờ: chạy đủ 2 bước của "Luật giao diện mới" (uiux-pro-max với vai người mới và người cũ, humanizer cho chữ trên màn và cáo thị) trên toàn bộ màn Sơn Môn (thanh 4 tab đã soát ở bản 16/11). Bật cờ thì màn chờ của tab Sơn Môn phải biến mất.
- [x] Nút "Vào môn của sư phụ" (Sư Đồ, khi `SON_MON_ON` bật) và chấm đỏ tab Sơn Môn khi có môn mở cửa (`vkl.sm.baoMo`). Sửa lỗi nhỏ ghi ở Ngày 3, 4, 6.
- [x] Video ngắn 9:16 (Playwright quay): vào môn, điểm danh, bản đồ, xuất chinh, chiến báo. Gửi Tyler, không tự đăng.
- Xong: 17/11/2026 7e5a9be (máy chủ: Kỷ 1 đã tạo, migration `son_mon_ky1_2026_11_18`, `son_mon_su_mon_2026_11_18`, `son_mon_mo_n_2026_11_18`)
- Ghi chú:
  - Kỷ 1 trên Supabase: id 1, 18/11 05:00 - 1/12 21:00 (giờ VN), bán kính 6, 127 ô, đủ 3 cõi. Trước 5:00 `sm_ky_now()` trả null nên màn ghi "Kỷ 1 mở lúc 05:00 ngày 18/11". SQL: `supabase/son_mon_ky1_2026_11_18.sql` (chỉ tạo khi chưa có Kỷ nào).
  - Cờ `SON_MON_ON` bật mặc định (tắt gấp `NEXT_PUBLIC_SON_MON=0`). Tab Sơn Môn bỏ màn chờ, vào thẳng Sơn Môn.
  - Hàm MỚI (không sửa hàm cũ): `vkl_sm_su_mon(token)` trả môn sư phụ đang ở; `vkl_sm_mo_n()` công khai, đếm môn đủ chữ ký, mở cửa, còn chỗ. Danh sách môn đưa môn sư phụ lên đầu (thẻ viền vàng "Môn của sư phụ ngươi", nút "Vào môn của sư phụ" / "Xin vào môn của sư phụ"); trang Chân thân có nút "Vào môn của sư phụ" khi sư phụ đã vào môn. Chấm đỏ tab Sơn Môn: chỉ người đã bấm "Báo ta khi có môn mở cửa", mở tab Sơn Môn thì thôi báo (`vkl.sm.baoMo` = 'da'), đo `sm_dot_seen`, `su_mon_open`.
  - Lỗi nhỏ đã sửa: M2/M3 chỉ còn một nút quay lại (nút trên thanh đầu quay về bước trước trong Sơn Môn); huy hiệu rồng vẽ lại thành đầu rồng có sừng và mắt; bản đồ chọn ô bằng Enter (ô giữa khung), mũi tên để dời; Kỷ đã kết thì ghi "Kỷ 1 đã kết" (trước ghi "Kỷ chưa mở").
  - Chưa làm (để sau, không chặn mở Kỷ): tên người theo xuất chinh và sức bên đánh trong cảnh báo (cần hàm mới, Ngày 4); màn hiện hào quang, khung vàng (chỉ phát lúc kết Kỷ 1/12, còn 2 tuần).
  - Luật giao diện mới, bước 1 (uiux-pro-max, ảnh 390x844 `scripts/smoke-son-mon.cjs` 17 màn + `scripts/smoke-son-mon-mo.cjs` máy chủ thật): vai người mới từ quảng cáo (`/son-mon?utm_source=fb`, khách): một thẻ "Liên kết tài khoản để vào môn", một nút chính, thanh tab giữ nguyên. Vai người cũ: cáo thị 4.6.0 hiện một lần, các tab cũ (Mộng, Tam Tài, Nhân vật, Lôi đài) không đổi chỗ; môn sư phụ đứng đầu. Mọi màn: không tràn ngang, nút từ 44px, chữ từ 12px, không lỗi JS. Lỗi nặng: không có. Lỗi nhỏ ghi lại: thẻ cáo thị gọn chỉ có chip "Còn có" (chưa có tranh mở đầu riêng cho Sơn Môn).
  - Tyler xem 17/11 tối: cáo thị xấu, Tàng Kinh Các rối. Đã sửa: cáo thị 4.6.0 có câu dẫn, 4 thẻ điểm nhấn với hình pixel Sơn Môn (chính điện, huy hiệu), nút chính "Vào Sơn Môn", "Xem chi tiết" thành dòng chữ thay cho nút lớn thứ ba. Tàng Kinh Các: nút bên phải chỉ còn "Chạm trần", lời giải thích dời sang khung đỏ trong thân thẻ ("Nâng Thanh Liên lên T4 để luyện tiếp" + gợi ý chép quyển), ẩn dòng trần T và dòng biến chiêu khi đang chạm trần.
  - Tyler 17/11 tối: luật nghe lằng nhằng, người chơi khó hiểu. Không đổi luật (Kỷ 1 mở 5:00), chỉ đổi cách kể (game-design game-ux-review: kể dần từng lớp): thẻ "Sơn Môn trong 3 câu" (chơi kiếp góp Khí vận, Khí vận làm môn mạnh hơn, hết Kỷ môn nhiều đất nhất thắng) ở đầu danh sách môn và môn nhà (môn nhà có nút Đã hiểu để ẩn); màn mới "Luật Sơn Môn" dạng hỏi - đáp 8 câu (mỗi ngày làm gì, Khí vận, Lực chiến, đánh nhau, vắng mặt, thua mất gì, hết Kỷ, rời môn), mở từ thẻ 3 câu và màn Kỷ; số nhân của trận chỉ nói bằng lời. Đo `sm_luat`, `sm_bacau_ok`. Để Kỷ 2 xem số rồi mới tính bỏ bớt luật (ví dụ ban đêm gấp đôi).
  - Bước 2 (humanizer): cáo thị 4.6.0 viết câu ngắn, một thứ một tên (Sơn Môn, Khí vận, Lực chiến, Kỷ), không hứa đồng minh hay Kỷ sau; câu mới ở danh sách môn, Chân thân, Kỷ đã kết đã soát.
  - Video 9:16 (25 giây, 1080x1920, dữ liệu giả `?demo=`): danh sách môn - vào môn - điểm danh - nhiệm vụ - bản đồ kéo xem - xuất chinh - chiến sự và chiến báo. Quay lại: `node scripts/video-son-mon.cjs <thư mục>` rồi ffmpeg đổi sang mp4. Đã gửi Tyler, không tự đăng.
  - Trả lời góp ý cho tác vụ 5:00 ngày 18/11 (gửi SAU khi bản 18/11 lên trang; reply_ver '4.6.0'; góp ý báo lỗi tặng 10 phúc như thường lệ; gửi xong đặt status 'da_xong'):
    - Lập tông môn (#174, #185, #201, #221): "Sơn Môn đã mở từ 5:00 sáng 18/11. Vào tab Sơn Môn để vào một môn đang mở cửa, hoặc tự lập môn khi đủ 50 kiếp và 5 ngày chơi. Kỷ 1 kéo tới 21:00 ngày 1/12."
    - #271: "Kiếp đầu mà lên tới Huyền Tiên, giỏi thật. Cảm ơn bạn đã chấm 5 sao!"
    - #272: "Cảm ơn bạn. Hiện đan dược chưa bán lại được ở Phường thị. Mình ghi ý này lại để xem cùng phần kinh tế."
    - #273: "Ý hay, cảm ơn bạn. Hiện công pháp đi theo con đường tu chứ chưa theo linh căn. Mình ghi lại ý cho công pháp cùng hệ với linh căn được mạnh hơn."
    - #274: "Cảm ơn bạn. Mình ghi lại ý cho đệ tử chân truyền được tông môn phát linh thạch."
    - #275, #280, #281: "Cảm ơn bạn đã chơi và chấm kiếp!"
    - #276: "Khai Thiên Hậu kỳ, mở được cả thế giới mang tên mình. Quá đỉnh, cảm ơn bạn!"
    - #277: "Tiếc thật. Ôm nhiều linh thạch mà hay đi đêm thì dễ bị cướp nhắm tới, kiếp sau thử tránh đi đêm hoặc tiêu bớt nhé."
    - #278: "Cảm ơn bạn. Mỗi đạo có chiêu riêng và vài chiêu chung. Mình ghi lại ý mở thêm chiêu học được ngoài đạo."
    - #279 (báo lỗi, tặng 10 phúc): "Cảm ơn bạn. Luyện Hư rồi mà còn bắt trộm vặt thì đúng là lạc giọng. Từ bản 18/11, từ Hóa Thần trở lên không còn gặp sự kiện trộm này nữa."
    - #282: "Cảm ơn bạn. Kim Sí Đại Bằng cấp 19 rất mạnh so với Kim Đan sơ kỳ, gặp quái cao hơn nhiều cấp thì nên tránh hoặc nghỉ cho lành thương rồi hẵng đánh."
  - Trả lời góp ý từ đêm 16/11 (tác vụ 5:00 ngày 17/11 gửi SAU khi bản 17/11 lên trang; reply_ver '4.5.0'; tặng 10 phúc mỗi góp ý báo lỗi như thường lệ; gửi xong đặt status 'da_xong'):
    - #262: "Bạn nói đúng, Thiên sinh kiếm cốt (rút lúc đầu thai) và Kiếm tâm thông minh (mua bằng phúc duyên) là hai thứ khác nhau. Kiếm cốt vốn chỉ cộng 10% công mà không ghi ra, nên còn yếu hơn thiên phú Linh. Từ bản 17/11 kiếm cốt cộng 30% công trong mọi trận và ghi rõ trên thẻ."
    - #263: "Cảm ơn bạn. Huyết Ma Đao chờ chủ vốn cầm được ngay từ nhỏ, chỗ sai là dòng mô tả. Bản 17/11 đã sửa mô tả cho đúng, cách chạy giữ nguyên."
    - #265: "Cảm ơn bạn đã báo. Trưa 16/11 nút Ra đài bị thanh tab dưới đáy che, mình sửa ngay chiều hôm đó, giờ Lôi đài đánh bình thường rồi. Mình tặng bạn chút phúc duyên bù cho mấy lượt bị kẹt."
    - #261: "Mình hiểu, có thành tựu cần chỉ số thấp mà chỉ số cứ tăng. Mình ghi lại ý thêm cách tự hạ chỉ số."
    - #264: "Mình ghi nhận: tâm pháp lên cấp cao mà không thêm gì thì phí công. Mình sẽ xem lại để mỗi cấp tâm pháp có thêm tác dụng."
    - #269: "Ý hay, cảm ơn bạn. Sơn Môn mở 5:00 sáng 18/11, số kết cục bạn đã mở được tính vào Lực chiến ở đó. Thưởng riêng cho kết cục chết mình ghi lại."
    - #270: "Cảm ơn bạn. Kiếp 2 đã lên Chân Tiên thì đúng là nhanh. Mình ghi lại ý cho chọn độ khó."
    - #259: "Cảm ơn bạn đã chấm. Thua giao đấu để lại thương nặng, nghỉ vài năm cho lành rồi hẵng đánh tiếp sẽ đỡ hơn."
    - #260: "Kiếp hay nhất trong 13 kiếp, nghe vui quá. Cảm ơn bạn!"
    - #258, #266, #267: "Cảm ơn bạn đã chơi và chấm kiếp!"
    - #268: "Thanks for the review! Noted that passing on the relic weapon wasn't clear. I'll look at showing the rule right on the item."

## Ngoài game (Tyler tự làm)
- Đăng "Biên niên Kỷ" mỗi tuần và lúc kết Kỷ (Claude soạn khi Tyler hỏi): môn giữ nhiều ô nhất, trận lớn, môn lật ngược thế cờ.

## Để sau
- Đồng minh (kết minh giữa các môn).
- Tài nguyên, công trình, cấp môn (bản 10/11) nếu Kỷ 1 cho thấy người chơi muốn thêm chiều sâu.
- Chat tự do trong môn (cần kiểm duyệt).
- Thông báo đẩy khi bị đánh.

## Điều kiện dừng
- Sau 7 ngày Kỷ 1: dưới 25% người có chân thân (đã liên kết) vào môn, hoặc dưới 30% người trong môn điểm danh sau 3 ngày → rút Kỷ 2 xuống 14 ngày, xem lại màn vào môn và nhiệm vụ.
- Nếu tỉ lệ còn chơi sau 7 ngày của người trong môn không cao hơn người không vào môn: dừng mở rộng, xem lại.
- Trận đánh ô có người giữ thành công dưới 20% hoặc trên 80% trong 3 ngày liền: chỉnh hệ số sân nhà (báo Tyler trước).
