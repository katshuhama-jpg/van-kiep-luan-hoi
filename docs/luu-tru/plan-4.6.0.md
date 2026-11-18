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
Bổ sung (Tyler chốt 21:07 18/11): bước 1 dùng CẢ `anthropic-skills:uiux-pro-max` VÀ `anthropic-skills:huashu-design` để làm đẹp và đúng trải nghiệm người chơi. Với huashu-design: dùng phần chống "AI slop", "từ nội dung mà ra hình", "một chi tiết làm 120%", và chấm 5 mặt (Step 10 critique: nhất quán, thứ bậc nhìn, chi tiết, dễ dùng, mới lạ) trên ảnh 390x844, ghi điểm và sửa mục "Fix" mức nặng. KHÔNG chạy cổng "3 hướng chờ người chọn" của huashu-design: game đã có phong cách pixel riêng (sonmon.css, globals.css) nên mỗi màn mới là lặp trong phong cách đã chọn (thuộc diện miễn của skill); ghi một dòng lý do vào "Ghi chú:". Giữ luật dự án: chỉ pixel/LPC, không gradient, chữ từ 12px, nút từ 44px.

Luật hiệu năng và chi phí (Tyler chốt 18/11, MỖI ĐÊM, kể cả đêm không có khối nào): trước khi làm khối, dành một phần đêm nghiên cứu và tối ưu tốc độ và tiền:
1. Đo: Vercel (`list_billing_charges`, `get_runtime_logs`, lượt gọi hàm, băng thông, ảnh), Supabase (`get_advisors` performance + security, `pg_stat_statements` 20 câu tốn nhất theo total_exec_time, cỡ bảng lớn nhất, pg_cron chạy bao lâu, số kết nối), cỡ trang `/` và `/son-mon` sau build (JS gửi xuống máy người chơi).
2. Sửa ngay việc rủi ro thấp: thêm chỉ mục cho câu chậm, bỏ gọi trùng ở client, gom RPC, cache/revalidate trang tĩnh, nén ảnh, dọn dữ liệu cũ (vkl_track, vkl_sm_bao quá 30 ngày) bằng hàm MỚI. Đo lại trước/sau.
3. Việc lớn hơn (đổi gói, đổi kiến trúc, tắt tính năng) thì KHÔNG tự làm, ghi đề xuất kèm số tiền tiết kiệm ước tính.
4. Ghi một dòng vào `docs/so-lieu.md` mục "Hiệu năng và chi phí" (ngày, chi phí 24h, 3 câu tốn nhất, đã sửa gì, số trước/sau) và gửi Tyler trong báo cáo sáng.

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
  - Tyler 17/11 tối: 2 người ký cùng lập có vẻ khó. Giữ luật 2 chữ ký (chặn môn một người, 85 người đủ lập so với 20-26 môn dự kiến), bớt khó bằng: nút "Gửi link nhờ đạo hữu ký" ở môn đang chờ ký (link `/son-mon?ky=<id>`, đo `sm_nho_ky`); người mở link thấy môn đó ghim đầu, nút Ký cùng lập, dòng "Ký không bắt ngươi vào môn này"; màn chờ ký ghi rõ ai có chân thân và tài khoản cũng ký được, không cần đủ kiếp. Nếu sau 12 giờ đầu nhiều môn tự giải tán vì thiếu chữ ký thì hạ `vkl_sm_cfg` mon.ky_can còn 1 (chỉ đổi dữ liệu, không đổi code) - báo Tyler trước.
  - Tyler 17/11 tối: "Làm chat tự do trong Sơn môn cho xôm". Đã làm Truyền âm (lên cùng bản 18/11):
    - Máy chủ (migration `son_mon_chat_2026_11_18`, file `supabase/son_mon_chat_2026_11_18.sql`, hàm MỚI): bảng `vkl_sm_chat`, `vkl_sm_chat_bao` (RLS, không policy); `vkl_sm_chat_send/list/n/hide/report`. Chỉ người trong môn đọc/gửi; tối đa 200 chữ; 1 tin mỗi 3 giây, 15 tin mỗi phút; máy chủ che từ tục (danh sách trong `vkl_priv.sm_chat_sach`), ẩn link và số điện thoại; người viết xóa tin mình, môn chủ/trưởng lão ẩn tin; báo xấu ghi `vkl_sm_co` loại `chat_bao` (trang /quan-tri/son-mon), 3 người báo thì tin tự ẩn. Thử Postgres 16 cục bộ: áp 2 lần không hỏng, gửi, gửi nhanh bị chặn, tin trống/dài bị chặn, không chân thân bị chặn, môn khác không đọc được, đệ tử không ẩn tin người khác, tự báo tin mình bị chặn, môn chủ ẩn được, 15 tin/phút.
    - Giao diện (uiux-pro-max): mục "Truyền âm" thay chỗ "Kỷ" trên thanh mục (giữ 5 mục; Kỷ mở từ nút "Xếp hạng Kỷ" ở thẻ môn và màn Luật); chấm khi có tin mới của người khác (hỏi 60 giây một lần); màn chat hỏi tin mới 5 giây một lần khi mở, tin mình bên phải, chạm tin để Xóa/Ẩn/Báo xấu, 4 câu nhanh, ô nhập có nhãn, chữ 16px, nút 48px, vùng tin role=log. Không dùng Supabase Realtime (không đổi cấu hình). Đo `sm_chat`, `sm_chat_an`, `sm_chat_bao`. Thử `scripts/smoke-truyen-am.cjs` 14/14, `smoke-son-mon` 19 màn.
    - Việc của Tyler/Claude mỗi đêm: xem `chat_bao` trong /quan-tri/son-mon; nếu lời tục lọt qua thì thêm từ vào danh sách (tạo hàm mới thay thế).
  - Người chơi góp ý qua Tyler 17/11 tối: chơi cẩn thận từng kiếp thì 50 kiếp là quá xa. Đã hạ điều kiện lập môn còn 30 kiếp + 5 ngày (van an toàn 20 kiếp + 4 ngày), chỉ đổi dòng `lap` trong `vkl_sm_cfg` (migration `son_mon_lap_30_2026_11_18`) và chữ trên màn/cáo thị. Số: người có chân thân chơi trong 7 ngày đủ 50+5: 81, đủ 30+5: 121 (cần khoảng 25 môn). Rủi ro là quá nhiều môn nhỏ: mô phỏng `sim-son-mon 40` với 25 / 32 / 40 môn: môn trung vị 7,5 / 5,9 / 4,7 người, đạt 30 Khí vận 77 / 60 / 34% số ngày. Vẫn còn chặn bằng 2 chữ ký và mỗi người ký tối đa 2 môn. Theo dõi: nếu Kỷ 1 có trên 32 môn hoặc môn trung vị đạt 30 Khí vận dưới 50% số ngày thì Kỷ 2 xem lại (nâng điều kiện hoặc giới hạn số môn).
  - Bước 2 (humanizer): cáo thị 4.6.0 viết câu ngắn, một thứ một tên (Sơn Môn, Khí vận, Lực chiến, Kỷ), không hứa đồng minh hay Kỷ sau; câu mới ở danh sách môn, Chân thân, Kỷ đã kết đã soát.
  - Video 9:16 (25 giây, 1080x1920, dữ liệu giả `?demo=`): danh sách môn - vào môn - điểm danh - nhiệm vụ - bản đồ kéo xem - xuất chinh - chiến sự và chiến báo. Quay lại: `node scripts/video-son-mon.cjs <thư mục>` rồi ffmpeg đổi sang mp4. Đã gửi Tyler, không tự đăng.
  - Trả lời góp ý cho tác vụ 5:00 ngày 18/11 (gửi SAU khi bản 18/11 lên trang; reply_ver '4.6.0'; góp ý báo lỗi tặng 10 phúc như thường lệ; gửi xong đặt status 'da_xong'):
    - Lập tông môn (#174, #185, #201, #221): "Sơn Môn đã mở từ 5:00 sáng 18/11. Vào tab Sơn Môn để vào một môn đang mở cửa, hoặc tự lập môn khi đủ 30 kiếp và 5 ngày chơi. Kỷ 1 kéo tới 21:00 ngày 1/12."
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
  - Bản đồ dễ nhìn hơn (Tyler: ô có người khó nhìn): ô có môn giữ nền sáng pha màu huy hiệu, viền sáng, quầng sáng, huy hiệu 30px; ô môn ta viền vàng đôi; ô trống lùi vào nền.
- Tyler 18/11 sáng: "rời sơn môn hết Kỷ mới được lập thì hơi dở, để là sau 24h". Đổi luật: tự rời môn đã cắm cờ chỉ chờ 24 giờ (không quá lúc hết Kỷ) rồi vào hoặc lập môn khác; bị đuổi vẫn vào ngay. Cấu hình `gio.roi_gio` = 24; sửa hàm `vkl_sm_leave` (chỉ dòng tính khóa), migration `son_mon_roi_24h_2026_11_18`. 1 người đã rời sáng 18/11 được rút khóa còn tới 06:58 ngày 19/11. Chữ trên màn, Luật Sơn Môn, lỗi SM_KHOA đã đổi theo.
- Tyler 18/11 07:00 đổi tiếp: tự rời môn đã cắm cờ thì 12 giờ mới VÀO môn khác (vào thẳng, gửi đơn, được nhận đơn), 24 giờ mới LẬP môn mới (không quá lúc hết Kỷ). Cột MỚI `vkl_sm_member.khoa_vao_toi` (khóa vào), `khoa_toi` giờ là khóa lập; cấu hình `gio.vao_gio` = 12, `gio.roi_gio` = 24. Hàm MỚI `vkl_priv.sm_ranh_lap`; đổi một dòng trong `sm_ranh`, `sm_vao`, `sm_out`, `vkl_sm_found`, `vkl_sm_state` và viết lại `vkl_sm_leave` (migration `son_mon_roi_12_24_2026_11_18`). Màn hiện giờ kèm ngày ("15:07 hôm nay (18/11)", "03:07 ngày mai (19/11)"). Người đã rời sáng 18/11: vào lại từ 18:58 ngày 18/11, lập từ 06:58 ngày 19/11. Demo: `?demo=roi`.
- Tyler 18/11 sáng: Sư Đồ hai chiều. Sư phụ (từ 20 kiếp, có chân thân) tìm người mới theo tên (tài khoản dưới 8 ngày, tối đa 5 kiếp, chưa có sư phụ, chơi trong 3 ngày) rồi bấm Mời, người kia Nhận/Từ chối. Người mới tìm theo tên trong toàn bộ danh sách sư phụ (trước chỉ 8) rồi bấm Xin bái sư, sư phụ Nhận/Từ chối (Tyler chọn: phải duyệt). Link `?su=` vẫn bái ngay như cũ. Mỗi người gửi tối đa 10 lời/ngày, lời chờ quá 3 ngày hết hạn; hai bên cùng gửi cho nhau thì nhận luôn. Bảng MỚI `vkl_su_moi`, hàm MỚI `vkl_su_tim_de/tim_su/gui/hop/tra` (migration `su_moi_2026_11_18`). Luật bái sư và thưởng giữ nguyên. Đo `su_moi_gui`, `su_xin_gui`, `su_tra`, `su_tim_de_open`.
  - Phát hiện: migration `su_tim_2026_11_16` (Tìm sư phụ, bảng `vkl_su_an`) chưa từng được áp lên Supabase, nên từ 16/11 nút Tìm sư phụ và ô "Hiện tên ta" không hiện. Đã áp 18/11.
- Tyler 18/11: Lực chiến ở Nhân vật (43.880, theo huyệt, đạo, đồ) khác Lực chiến Sơn Môn (7.887, theo kiếp). Tyler chọn: đổi tên số ở Nhân vật thành "Tu vi" ngay, trang Nhân vật hiện thêm Lực chiến Sơn Môn; trước Kỷ 2 đề xuất một công thức chung có mô phỏng (không đổi trận giữa Kỷ 1).
- Tyler 18/11: danh sách người trong môn thành thẻ: hình chân thân (khung vàng môn chủ, bạc trưởng lão), chip chức, thanh Lực chiến so với người mạnh nhất môn, "Vào môn 05:22 hôm nay", số kiếp; trong môn thêm "Góp Khí vận hôm nay · đứng ở". Chạm một người: màn chân thân lớn + 8 ô chỉ số (Lực chiến, kiếp, huyệt, hành viên mãn, cảnh giới, kết cục, vào môn, chơi gần nhất); môn chủ/trưởng lão có nút đổi chức/đuổi trong đó. `vkl_sm_mon_ds` trả thêm ct, vao_luc, choi_luc, kiep, phan, tk (chỉ khi cùng môn) - migration `son_mon_ds_mon_ct_2026_11_18`.
- Tyler hay gặp "Không kết nối được máy chủ": máy chủ không có lỗi; do điện thoại vừa mở lại trình duyệt/mạng chập chờn làm lệnh đầu hỏng. Lệnh đọc Sơn Môn giờ tự thử lại 2 lần, có mạng lại thì tự tải lại. Chip "Có bản mới, tải lại" hiện nhiều sáng 18/11 là do lên bản nhiều lần, không phải lỗi.
- Tyler 18/11: (1) môn mới bảo hộ 48 giờ từ lúc cắm cờ, mọi môn không đánh được; môn mới đánh ô có chủ thì mất bảo hộ (chiếm ô trống vẫn giữ). Migration `son_mon_bao_ho_moi_2026_11_18`: cột `vkl_sm_mon.moi_bh_toi`, trigger nâng `vkl_sm_tile.bao_ho_toi` của mọi ô môn đó, `vkl_sm_march` thêm dòng mất bảo hộ, state trả `moi_bh_toi`. Bản đồ: ô bảo hộ viền xanh nét đứt + nhãn khiên "40g"; chạm ô ghi còn bao lâu; xuất chinh khi đang bảo hộ hỏi lại. (2) môn chủ/trưởng lão xếp người vào ô, đệ tử vẫn tự đi; đi đường 20 phút mỗi ô, trong lúc đi không giữ ô nào. Migration `son_mon_xep_o_2026_11_18`: cột `vkl_sm_member.di_toi`, hàm `vkl_priv.sm_di`, `vkl_sm_xep`, viết lại `vkl_sm_guard`, một dòng trong `sm_giu`, `sm_out`, state, members.
  - Tyler tự chạy 2 migration trong SQL Editor lúc ~08:30 18/11 (file gộp). Đã kiểm: 3 môn được bảo hộ (Huyền Hư Cung tới 05:13, Vô Hư Cốc 05:40, môn 4 tới 08:05 ngày 20/11), ô các môn nâng bảo hộ đúng; xếp người đi 20 phút và không tính giữ trong lúc đi; mất bảo hộ thì bảo hộ ô bỏ đúng (thử trong giao dịch rồi hủy). Trước đó: Supabase hỏi xác nhận 2 lần nhưng câu hỏi không tới Tyler. Tyler bảo đẩy luôn: giao diện đã lên `main` nhưng tự nhận máy chủ cũ (state chưa có khóa `moi_bh_toi` / `di_toi` thì giữ giao diện cũ, ẩn nút xếp ô, ẩn 2 câu luật mới). Áp 2 migration xong là tính năng tự hiện, không cần lên bản lại.
- Tyler 18/11 ~08:40: bảo hộ ô giảm dần theo thứ tự mở (chia đôi): ô cắm cờ 48 giờ, ô 2: 24 giờ, ô 3: 12 giờ, ô 4: 6 giờ, từ ô 5: không; tính từ lúc chiếm, không quá mốc 48 giờ của môn. SQL `supabase/son_mon_bao_ho_giam_2026_11_18.sql` (thay trigger `sm_tile_bh`, `sm_mon_bh_o`, tính lại ô đã chiếm). Supabase MCP hỏi xác nhận không tới Tyler nên Tyler tự chạy file trong SQL Editor.

## Ngày 8a - Phần thưởng Sơn Môn: vũ khí theo hạng môn và đóng góp
Lên bản: 2026-11-19. Có cáo thị: thêm dòng vào 4.6.0 ("Phần thưởng Kỷ 1"). LÀM KHỐI NÀY TRƯỚC các việc còn dở của Ngày 8 (Tyler muốn lên sáng 19/11).
Tyler chốt 18/11: top 3 môn có đồ xịn theo hạng; top 7 người đóng góp trong môn có đồ theo đóng góp; môn chủ 2 đồ, còn lại 1 đồ; đồ mặc vào tăng Lực chiến. Tyler chốt thêm 20:04 18/11: đồ là VŨ KHÍ, mỗi món hình dạng khác nhau; môn chủ 2 đồ là vũ khí + phụ kiện. Claude chốt logic (game-design balance-review, product brainstorm):
- **Hai ô mặc** ở trang Chân thân, mục "Pháp bảo Sơn Môn": ô **Vũ khí** và ô **Phụ kiện**.
- **Vũ khí:** 7 suất cho MỖI môn đủ điều kiện, theo hạng Công trong môn. Phẩm theo hạng môn: hạng 1 Thần phẩm, hạng 2 Tiên phẩm, hạng 3 Linh phẩm, hạng 4-10 Bảo phẩm, còn lại Phàm phẩm.
  - **Hình dạng theo hạng Công, 7 hạng 7 loại khác nhau** (top 7 cùng môn không ai trùng hình): hạng 1 Kiếm, hạng 2 Đao, hạng 3 Thương, hạng 4 Quạt, hạng 5 Phất trần, hạng 6 Cung, hạng 7 Song chùy. Nhìn vũ khí là biết người đó đứng thứ mấy trong môn.
  - **Phẩm đổi dáng, không chỉ đổi màu:** Phàm (lưỡi trơn, cán gỗ), Bảo (thêm đai và tua), Linh (khắc vân, chuôi ngọc), Tiên (dài hơn, có cánh/vân mây), Thần (to nhất, có ánh nhấp nháy 2 khung). Viền: Phàm xám, Bảo xanh, Linh tím, Tiên vàng, Thần đỏ.
  - Tên món: "<Phẩm> <tên riêng theo loại>", ví dụ "Thần phẩm Thanh Hư Kiếm", khắc "<tên môn> - Kỷ 1".
- **Môn chủ: vũ khí + phụ kiện (Chưởng Môn Ấn).** Môn chủ luôn nhận 2 đồ cùng phẩm theo hạng môn và chiếm 1 trong 7 suất vũ khí: lọt top 7 thì vũ khí theo hạng Công của mình; không lọt top 7 thì nhận Trấn Môn Kiếm (hình riêng) và top 7 còn 6 suất cho người khác. Ấn có 5 dáng theo phẩm (ấn đá vuông, ấn ngọc, ấn có rồng cuộn...). Môn chủ cũng phải đủ 10 Công; không đủ thì 2 đồ chuyển cho trưởng lão có Công cao nhất.
- **Sức mạnh (chỉ Lực chiến Sơn Môn, không đụng trận trong kiếp):** Thần +12%, Tiên +9%, Linh +7%, Bảo +4%, Phàm +2%. Người đóng góp hạng 1 trong môn thêm +3%, hạng 2-3 thêm +2%. Tổng 2 món tối đa +25%. Phần cộng tính SAU trần 6.000 mỗi người (trần vẫn giữ, người mạnh không vượt quá xa).
- **Chống lăn cầu tuyết:** đồ chỉ có sức mạnh trong **Kỷ kế tiếp** (đồ Kỷ 1 mạnh trong Kỷ 2), hết Kỷ đó thành đồ ngắm (giữ hình, tên khắc "Kỷ 1"). Mỗi người mặc tối đa 1 vũ khí + 1 phụ kiện. Môn hạng 1 Kỷ 1 mạnh hơn khoảng 10-15% ở Kỷ 2, vẫn thua được môn đông và chăm (mô phỏng phải xác nhận).
- **Đóng góp (điểm Công, tính theo người, trong môn đang ở lúc kết Kỷ):** điểm danh +1; nhiệm vụ ngày +2/+3/+5 (đúng Khí vận đã góp); khai hoang +3; theo xuất chinh +3 (thắng thêm +3); đứng giữ ô của môn (không nghỉ, không đi đường) +1 mỗi 6 giờ. Trần 20 Công mỗi ngày. Tính lại được từ dữ liệu có sẵn (`vkl_sm_diem_danh`, `vkl_sm_nv`, `vkl_sm_bao` khai hoang có 'nguoi', `vkl_sm_chinh_theo`) từ 18/11; phần đứng giữ đếm từ cron mỗi giờ (bắt đầu từ lúc lên bản).
- **Điều kiện nhận (chống gian lận, chống nhảy môn):** môn còn tồn tại lúc kết Kỷ, đủ chữ ký, có ít nhất 3 người; người nhận ở trong môn ít nhất 3 ngày trước lúc kết Kỷ, tài khoản từ 7 ngày tuổi, Công từ 10 trở lên. Từ 21:00 ngày 29/11 khóa danh sách: vào môn sau mốc này không được tính. Tài khoản bị `lives_guard` gắn cờ thì không nhận.
- **Phát thưởng:** tự động lúc kết Kỷ (hàm mới gọi sau `sm_ket_ky`), có thư trong game báo đã nhận; đồ nằm trong tủ, người chơi tự bấm mặc.
- [x] Máy chủ (hàm MỚI, không sửa hàm cũ): bảng `vkl_sm_cong` (ky_id, player_id, mon_id, ngay, cong) hoặc view tính từ dữ liệu sẵn có + bảng đứng giữ; `vkl_sm_cong_bang(token)` trả bảng Công của môn mình (top 7 sáng lên, hạng mình); bảng `vkl_sm_bao_vat` (id, player_id, ky_id, mon_id, o 'vu_khi'|'phu_kien', loai 'kiem'|'dao'|'thuong'|'quat'|'phat_tran'|'cung'|'song_chuy'|'tran_mon_kiem'|'an', pham, hang_cong, them_pct, ten, mac, luc); `vkl_sm_bao_vat_ds(token)`, `vkl_sm_bao_vat_mac(token, id)`; `vkl_priv.sm_phat_thuong(ky_id)` (phát đúng luật trên, chạy được nhiều lần không phát trùng); cron đứng giữ mỗi giờ.
- [x] Giao diện: màn "Phần thưởng Kỷ" (mở từ thẻ môn và Xếp hạng Kỷ): 5 phẩm với hình pixel và % sức mạnh, dòng "Nếu Kỷ kết thúc bây giờ, ngươi nhận: ..." theo hạng môn và hạng Công hiện tại; mục "Công đóng góp" trong tab Thành viên (top 7 viền vàng, mình được làm nổi). Trang Chân thân: 2 ô Pháp bảo Sơn Môn (Vũ khí, Phụ kiện) (trống thì ghi "Kết Kỷ 1 (21:00 1/12) nhận"). Thẻ Lãnh thổ ở môn nhà thêm một dòng "Ngươi đang hạng N Công trong môn".
- [x] Hình pixel: 7 loại vũ khí + Trấn Môn Kiếm + Chưởng Môn Ấn, mỗi loại 5 phẩm (45 hình), phẩm cao dáng to và nhiều chi tiết hơn như mô tả trên. Vẽ bằng lưới pixel trong code (SVG rect), chỉ pixel, không gradient. Màn Phần thưởng hiện đủ 7 hình theo hạng Công để người chơi thấy mình đang nhắm món nào.
- [x] Tác dụng trong trận: làm sẵn hàm tính Lực chiến có pháp bảo (`vkl_priv.sm_lc_bv`) nhưng CHỈ nối vào trận từ Kỷ 2 (khối Ngày 11). Kỷ 1 không đổi trận.
- [x] Mô phỏng `scripts/sim-son-mon.ts`: phân bố Công theo người (dữ liệu 18/11), bao nhiêu người đủ 10 Công; Kỷ 2 môn có đồ Thần vs môn không đồ cùng cỡ thắng bao nhiêu %. Ghi số.
- [x] Luật Sơn Môn thêm câu "Phần thưởng Kỷ là gì?"; humanizer cho chữ; smoke-son-mon thêm màn Phần thưởng và bảng Công.
- Xong: 2026-11-18 2be814c
- Ghi chú:
  - Máy chủ (migration `son_mon_thuong_ky_2026_11_19`, file `supabase/son_mon_thuong_ky_2026_11_19.sql`, chỉ bảng/hàm/cron MỚI): Công tính lại từ dữ liệu có sẵn bằng `vkl_priv.sm_cong_ds(ky)` (không cần bảng `vkl_sm_cong`), riêng đứng giữ ghi vào bảng `vkl_sm_cong_giu` bằng cron `vkl_sm_cong_giu` (phút 2 mỗi giờ; chạy 2 lần trong cùng giờ không đếm trùng, đã thử). `vkl_priv.sm_thuong_tinh(ky)` tính ai nhận gì (dùng cho cả "nếu Kỷ kết thúc bây giờ" và lúc phát), `vkl_priv.sm_phat_thuong(ky)` phát và gửi thư `thien_dao`, cron `vkl_sm_phat_thuong` mỗi 10 phút phát cho Kỷ đã kết mà chưa phát (bảng `vkl_sm_bv_phat`). RPC: `vkl_sm_cong_bang(token)` (một lệnh cho màn Phần thưởng, bảng Công, dòng ở thẻ Lãnh thổ; trình duyệt nhớ 60 giây), `vkl_sm_bao_vat_ds`, `vkl_sm_bao_vat_mac` (chạm để mặc, chạm lại để tháo). `vkl_priv.sm_lc_bv(player, ky)` làm sẵn, CHƯA nối trận (Ngày 11).
  - Hạng môn để chọn phẩm tính trong các môn đủ điều kiện (đủ chữ ký, từ 3 người), theo `vkl_sm_ky_kq.hang` khi đã kết. Bằng Công thì người vào môn sớm hơn đứng trên. Môn chủ không đủ điều kiện thì trưởng lão Công cao nhất nhận ấn (và Trấn Môn Kiếm nếu ngoài top 7).
  - Thử trên máy chủ thật trong giao dịch rồi hủy (đặt Kỷ 1 đã kết giả): lần 1 phát 38 món cho 6 môn đủ điều kiện, 32 thư; lần 2 phát 0 (không trùng). Một người mặc Thần phẩm Kiếm +15%: Lực chiến 9.225, sau trần 7.612, có pháp bảo 8.754.
  - Số 18/11 tối (Kỷ chạy khoảng 16 giờ): 91 người có Công, 36 người đủ 10 Công, trung vị 9, cao nhất 20 (chạm trần ngày). Nhiệm vụ ngày chiếm phần lớn (565 Công), điểm danh 80, theo xuất chinh 84, khai hoang 27.
  - Mô phỏng `BV=1 npx tsx scripts/sim-son-mon.ts 5000` (môn 8 người, Lực chiến 315 người chơi thật): không đồ 79,4% / 80,1% (bên đánh thắng, hai chiều); Thần phẩm đánh môn không đồ thắng 83,8%, bị môn không đồ đánh thì bên kia thắng 74,4%; Bảo phẩm 82,0% / 78,2%; Phàm 81,3% / 78,1%. Môn 15 người (`CO=15`): Thần 75,0% / 69,9% so với không đồ 73,0% / 73,6%. Môn có đồ Thần mạnh hơn khoảng 4-6 điểm %, vẫn thua được.
  - Hình pixel: 9 loại x 5 phẩm vẽ bằng code trong `components/sonmon/BaoVat.tsx` (lưới 16x24, viền mực tự dựng; phẩm đổi dáng: Bảo thêm đai và tua, Linh khắc vân và ngọc, Tiên dài hơn và có cánh mây, Thần to nhất và có lửa nhấp nháy 2 khung, tắt khi prefers-reduced-motion). Không gradient.
  - Luật giao diện mới, bước 1 (uiux-pro-max + huashu-design, ảnh 390x844 `?demo=chu|de|chua&m=thuong`, `m=thanh-vien`, `m=mon`): vai người mới: màn Phần thưởng mở bằng "Nếu Kỷ kết thúc bây giờ", lý do chưa có phần ghi ngay dưới (thiếu Công, vào muộn, môn chưa đủ người). Vai người cũ: thẻ môn thêm nút thứ ba "Phần thưởng", nút cũ không đổi chỗ; bảng Công nằm dưới danh sách người. Không tràn ngang, nút từ 44px, chữ từ 12px (smoke-son-mon 22 màn sạch). Chấm 5 mặt huashu: nhất quán 8, thứ bậc nhìn 7, chi tiết 8 (45 hình vũ khí là chi tiết làm tới 120%), dễ dùng 7, mới lạ 7. Sửa mức nặng: tên món Tiên phẩm chữ vàng trên nền giấy thiếu tương phản, đổi sang màu chữ đậm riêng theo phẩm. Không chạy cổng "3 hướng" của huashu-design: game đã có phong cách pixel riêng (sonmon.css), màn mới là lặp trong phong cách đã chọn.
  - Bước 2 (humanizer): chữ màn Phần thưởng, bảng Công, câu Luật mới, dòng cáo thị "Phần thưởng Kỷ 1"; sửa câu "Thưởng chỉ để ngắm" ở cáo thị và Luật (không còn đúng).
  - Đo: `sm_thuong_mo`, `sm_bv_mac`. Vài sự kiện `sm_thuong_mo` tối 18/11 là của Claude lúc chụp ảnh thử (dev nối máy chủ thật), không phải người chơi.
  - Tyler 19/11 tối (sau bản đêm), ĐỔI LUẬT pháp bảo: (1) pháp bảo có chỉ số như đồ trong Mộng: Công, Thủ, Máu, Bạo kích theo loại, nhân bậc phẩm (Phàm 1 ... Thần 5; vũ khí tổng 6 điểm % mỗi bậc, ấn 4), dữ liệu ở `lib/sonmon/baoVat.ts`; (2) KHÔNG mất tác dụng (bỏ luật "chỉ mạnh ở Kỷ kế tiếp, sau thành đồ ngắm"); (3) lắp vào ô Vũ khí / Phụ kiện của chân thân ở tab Nhân vật (máy chủ giữ món đang lắp, chân thân cầm vũ khí bằng lớp LPC nhuộm theo phẩm), mỗi điểm % = 100 Tu vi chân thân (Thần Kiếm 3.000, Thần Ấn 2.000). Chưa đổi trận trong kiếp, làm nền cho tính năng sau. Bỏ mục Pháp bảo riêng ở trang Chân thân. Màn Phần thưởng làm lại kiểu sàn thương mại điện tử: ô ảnh vuông bằng nhau, tên, chỉ số (lưới 3 cột 9 món, 2 cột phần nhận, 5 ô phẩm). Thư phát thưởng đổi lời: hàm MỚI `sm_phat_thuong2`/`sm_phat_tick2`, cron `vkl_sm_phat_thuong` chuyển sang (migration `son_mon_thuong_thu_2026_11_19`). Thử: `scripts/smoke-sm-phap-bao.cjs` (giả máy chủ: lắp đao +3.000, ấn +2.000, tháo đúng). Ngày 11 (Lực chiến Sơn Môn có pháp bảo) phải viết hàm mới không giới hạn Kỷ.
  - Trả lời góp ý cho tác vụ 5:00 ngày 19/11 (gửi SAU khi bản 19/11 lên trang; reply_ver '4.6.0'; góp ý báo lỗi tặng 10 phúc như thường lệ; gửi xong đặt status 'da_xong'):
    - #135, #283 (báo lỗi, tặng 10 phúc mỗi người): "Cảm ơn bạn. Bước qua khe nứt là khép kiếp mà trước giờ nút không ghi ra, nên dễ mất một kiếp đang lên. Từ bản 19/11 nút đó ghi rõ: bước qua là kiếp này khép lại. Mình tặng bạn 10 phúc duyên bù cho kiếp đó."
    - #284: "Cảm ơn bạn đã phân tích kỹ. Bản 19/11 đã ghi rõ Cương và Nhu đổi gì cho từng chiêu. Ý chỉnh Cương/Nhu theo hồi chiêu và cho Nhu tác động cả hiệu ứng buff, mình ghi lại để xem ở lần cân bằng công pháp tới."
    - #285: "Ý hay, cảm ơn bạn. Tụ Khí Đan đúng là yếu dần từ Nguyên Anh. Mình ghi lại cách cộng theo phần trăm tu vi và nút tự dùng đan."
    - #286: "Cảm ơn bạn. Vài thiên phú chỉ cộng chỉ số cơ bản thì đúng là nhạt. Mình ghi lại để xem lại sức mạnh thiên phú, nhất là loại tím."
    - #287: "Cảm ơn bạn. Mình ghi lại ý ghi rõ hiệu quả tu luyện của từng linh căn ngay trên màn, và ý cho linh căn thấp được cường hóa qua cơ duyên."
    - #288: "Cảm ơn bạn. Tạm thời bạn chia thành vài góp ý nhé, mình đọc hết. Mình ghi lại ý nới giới hạn chữ."
    - #289: "Ý hay. Lên tiên rồi còn uống Trúc Cơ Đan thì đúng là lạ. Mình ghi lại để đổi tên đan theo cảnh giới."
    - #290: "Lên ngôi Thiên Đế ở kiếp 5, sống dai thật. Cảm ơn bạn đã chấm 5 sao!"
    - #291: "Cảm ơn bạn. Tự dừng khi máu xuống thấp lúc săn yêu là ý đáng làm. Mình ghi lại cùng nút tạm dừng."
    - #292: "Cảm ơn bạn. Mình ghi lại ý cho bộ đồ mỗi đạo có trạng thái riêng."
    - #293: "Một mình chặn cửa Thiên Cơ Các, ngã xuống cũng oai. Cảm ơn bạn đã chấm 5 sao!"
    - #294: "Cảm ơn bạn. Mình đang làm phần cho người đã chứng đạo: Thiên thư quyển III và chọn thế giới khởi đầu khi đầu thai. Ý luyện khí mình ghi lại."
    - Góp ý tồn từ 31/10-12/11 (status 'moi', chưa ai trả lời), gửi theo nhóm:
      - Chấm kiếp (#52, 65, 66, 68, 71, 72, 73, 75, 80, 88, 91, 95, 108, 109, 113, 115, 122, 136, 142, 144, 146, 150, 156, 157, 160, 166, 176, 177, 180, 183, 184, 188, 191, 192, 193, 196, 199, 207, 212, 217, 219, 232): "Cảm ơn bạn đã chơi và chấm kiếp!"
      - Sau chứng đạo (#35, 42, 44, 45, 56, 57, 63, 81, 100, 106, 110, 125, 127, 145, 153, 155, 169, 175, 179, 186, 187, 198, 200, 231): "Cảm ơn bạn. Mình đang làm phần cho người đã chứng đạo: Thiên thư quyển III với 30 kết cục mới và chọn thế giới khởi đầu khi đầu thai. Ý của bạn mình ghi vào cùng phần này."
      - Bản apk (#69, 137, 147): "Game chạy trên trình duyệt. Bạn mở game bằng Chrome hoặc Safari rồi chọn Thêm vào màn hình chính là dùng như app. Bản apk riêng mình chưa làm."
      - #195: "Cảm ơn bạn. Sơn Môn đã mở từ 18/11, có môn phái và đánh nhau giành đất. Ý công pháp và phụ tu mình ghi lại."
      - #204: "Kết nghĩa và Lôi đài đã có trong game rồi bạn nhé, xem ở tab Lôi đài."
      - #210: "Từ bản 18/11, tuyệt kỹ đã dung hợp vẫn nhặt và mua được tàn quyển để lên tầng."
      - #228: "Bản 19/11 đã ghi rõ Cương và Nhu đổi gì cho từng chiêu. Cảm ơn bạn."
      - Còn lại (#62, 70, 96, 114, 124, 138, 164, 203, 206, 213, 214, 215, 216, 218, 220, 230, 234): "Cảm ơn bạn đã góp ý. Mình đã đọc và ghi lại để xem trong các lần cân bằng tới."

## Ngày 8 - Khai hoang, bản đồ to, hướng dẫn người trong môn
Lên bản: 2026-11-19. Cáo thị: thêm dòng vào 4.6.0 (đã có dòng Khai hoang + bản đồ).
Lý do (số 18/11 chiều): 11 môn, 69 người, 18/127 ô có chủ, 8 xuất chinh đều tới ô trống, 0 trận giữa môn; 2 môn 15 người chỉ giữ 1 ô vì tưởng mở rộng là phải đánh. Chi tiết: docs/brainstorm-son-mon-ky1.md.
- [x] Khai hoang: chạm ô trống kề lãnh thổ, cắm cờ ngay, ai trong môn cũng làm được, theo trần ô. Hàm MỚI `vkl_sm_khai_hoang` (đã áp 18/11). Thẻ "Lãnh thổ X/Y ô" ở môn nhà, dấu + nhấp nháy trên bản đồ, luật 3 câu và luật đủ viết lại, chiến báo "X khai hoang Y". Xong: 18/11 3b0351e.
- [x] Bản đồ to (cao theo màn hình, 360-560px), phóng to/thu nhỏ (nút +/-, lăn chuột, phím +/-), sao pixel và tên 3 cõi phía sau, thẻ ô tự cuộn ra khi chạm. Xong: 18/11 c48dfdd.
- [x] Ba bước đầu cho người mới vào môn (thẻ ở đầu môn nhà, có ô tích, xong thì ẩn): điểm danh, khai hoang một ô (hoặc "môn đủ ô" thì bỏ qua), chọn ô đứng giữ. Đo `sm_3buoc` từng bước.
- [x] Hiệu ứng cắm cờ: khai hoang/chiếm xong thì cờ pixel dựng lên ô (0,6 giây) và ô sáng nhấp 3 lần; ô môn ta có cờ nhỏ bay (tắt khi prefers-reduced-motion). game-feel, chỉ pixel.
- [x] Chấm đỏ tab Sơn Môn (thanh dưới) khi môn còn ô chưa dùng và quanh lãnh thổ còn đất trống, hoặc khi môn đang bị đánh. Mở bản đồ là tắt tới khi có đất mới.
- [ ] Tin hệ thống trong Truyền âm (dòng riêng, không tên người gửi): "X vừa khai hoang Y (3/6 ô)", "Z đang tới Y, tới lúc hh:mm", "Môn thắng/thua trận ở Y". Hàm MỚI ghi vào `vkl_sm_chat` loại hệ thống (không sửa hàm chat cũ), gọi từ trigger trên `vkl_sm_bao`.
- [x] Câu dẫn khi khai hoang theo cõi (story-writing, humanizer), hiện trong thông báo thành công, mỗi cõi 3 câu, chọn ngẫu nhiên.
- Xong (4/5 việc còn lại): 2026-11-18 dded81d
- Ghi chú:
  - Ba bước đầu: thẻ ở đầu môn nhà (điểm danh; khai hoang một ô, bỏ qua khi môn đủ ô hay chưa cắm cờ; chọn ô đứng giữ), một nút chính theo bước đang tới, nút Ẩn. Xong cả ba thì ẩn hẳn. Đo `sm_3buoc` (buoc 1/2/3/xong/an).
  - Cờ: khai hoang xong thì cờ pixel màu huy hiệu dựng lên ô (0,6 giây) và ô sáng nhấp 3 lần; ô môn ta (trừ chính điện) có cờ vàng nhỏ phấp phới. Tắt khi prefers-reduced-motion.
  - Chấm đỏ tab Sơn Môn: đọc từ máy (`vkl.sm.viec`, SonMonHome ghi khi xem môn), không gọi thêm máy chủ: còn ô chưa dùng và có đất trống kề lãnh thổ (mở Bản đồ là đã xem, có đất mới thì báo lại), hoặc môn đang bị đánh (tin trong 2 giờ). Đo `sm_dot_dat`.
  - Câu dẫn khai hoang: 3 câu mỗi cõi (Thiên, Hồng Trần, U Minh) trong `lib/sonmon/data.ts` `KH_DAN`, rà humanizer.
  - Tin hệ thống Truyền âm: CHƯA XONG phần máy chủ. Giao diện đã sẵn (dòng giữa, nền tối, không tên; dùng `vkl_sm_chat_list2`, máy chủ chưa có thì tự dùng hàm cũ). SQL `supabase/son_mon_chat_he_2026_11_19.sql` (bảng MỚI `vkl_sm_chat_he` chung dãy id với chat, trigger nuốt lỗi trên `vkl_sm_bao` và `vkl_sm_chinh`, hàm MỚI `vkl_sm_chat_list2`) bị chặn: Supabase MCP hỏi xác nhận (có trigger trên bảng cũ) mà câu hỏi không tới ai, hết 180 giây. Không lách. Tyler chạy file này trong SQL Editor là tính năng tự hiện, không cần lên bản lại. Để ô [ ] ở việc này.

## Ngày 8c - Đánh không cần đoán: cơ hội thắng, tự trinh sát, rút quân
Lên bản: 2026-11-19 (Tyler 20:16 18/11: làm và đẩy luôn). Xong: 2026-11-18 (Claude làm trong phiên chat).
Tyler chốt 20:20 18/11: KHÔNG có mức ước lượng; chưa trinh sát thì lực giữ vẫn "???". Phát lệnh có 30 phút tập hợp, hết giờ môn tự đi đánh với người đã theo. Mục 1 dưới đây BỎ. Có cáo thị: thêm dòng vào 4.6.0. KHÔNG giấu sau cờ (sửa trải nghiệm Kỷ 1 đang chạy).
Tyler hỏi 18/11: có người không trinh sát mà đánh luôn, thì sao biết cần bao nhiêu người theo để thắng. Claude chốt (game-design balance-review + game-ux-review, gamedev game-ui-ux):
- **Vấn đề:** ô môn khác ghi "Lực giữ ???". Đánh mù mà thua thì mọi người theo nghỉ 2 giờ, nên người chơi hoặc kéo cả môn (bỏ trống nhà) hoặc không dám đánh. Trinh sát là bước thêm mà nhiều người bỏ qua.
- **1. Ước lượng thô, ai cũng thấy, không cần trinh sát:** ô có chủ ghi mức "Lực giữ: Yếu (dưới 3.000) / Vừa (3.000-8.000) / Mạnh (8.000-15.000) / Rất mạnh (trên 15.000)", kèm số người đang giữ ghi "khoảng". Máy chủ tính từ lực giữ thật có cộng nhiễu ±35% cố định theo ô và theo giờ (không dò ra số thật bằng cách bấm lại). Mức này đã gồm sân nhà, Khí vận, ban đêm, còn 1 ô. Trinh sát vẫn có ích: ra số gần đúng (±15%) và số người thật.
- **2. Tự trinh sát khi phát lệnh:** môn chủ xuất chinh vào ô chưa trinh sát trong 1 giờ qua thì máy chủ tự gửi một chuyến trinh sát song song, không tốn lượt của ai. Ô cách 1-3 bước thì kết quả về trước khi hết 30 phút tập hợp; xa hơn thì ghi "trinh sát về lúc HH:MM, sau giờ xuất phát".
- **3. Thanh "Cơ hội thắng" ở màn tập hợp:** cập nhật mỗi khi có người bấm Theo. So lực tấn công hiện có (biết chính xác, đã nhân Khí vận) với lực giữ ước tính:
  - Có số trinh sát: "Đang có 4.200 / cần khoảng 5.800. Thêm khoảng 1.600 Lực chiến (1-2 người)". Mức: Thấp / Ngang ngửa / Cao / Gần như chắc thắng (vượt cả mức trên của sai số +15%).
  - Chỉ có mức thô: so với cả khoảng, ghi "Chưa rõ, đang chờ trinh sát" nếu khoảng phủ cả thắng lẫn thua.
  - Màn tập hợp ghi thêm "Người theo bỏ ô đang giữ. Ô X còn N người giữ" để môn chủ không kéo hết người đi.
  - Thẻ xuất chinh ở môn nhà và tin Truyền âm hệ thống hiện "cần thêm khoảng X" để người online bấm Theo đúng lúc.
- **4. Rút quân:** trong lúc tập hợp, môn chủ hoặc trưởng lão bấm "Rút quân", hủy lệnh, không ai bị nghỉ, không mất gì. Đã xuất phát (đi 20 phút) thì không rút được. Chiến báo ghi "X rút quân".
- **5. Nói rõ sai lệch lúc tới:** lực giữ có thể đổi trong 20 phút đi đường (bên kia gọi người về giữ). Chiến báo ghi lực giữ lúc tới và "lúc trinh sát là ...", để thua không thấy bị lừa.
- Không đổi luật trận, không đổi số nhân. Không tiết lộ số thật cho người chưa trinh sát.
- [x] Máy chủ (hàm MỚI, không sửa hàm cũ; khớp với `vkl_sm_march2` của Ngày 9 nếu làm cùng): `vkl_priv.sm_uoc(ky, q, r)` trả mức thô (nhiễu băm theo ô + giờ); `vkl_sm_map2` hoặc RPC riêng `vkl_sm_uoc_o(token, q, r)` trả mức cho ô có chủ; `vkl_sm_march_tt(token, q, r)` = xuất chinh + tự trinh sát; `vkl_sm_co_hoi(token, chinh_id)` trả lực đang có, ước tính, mức cơ hội, số cần thêm; `vkl_sm_rut_quan(token, chinh_id)` (chỉ khi 'tap_hop', chuc chủ/lão, đặt 'huy' ly_do 'rut_quan', ghi chiến báo).
- [x] Giao diện: mức thô trên thẻ ô (thay "???"), thanh Cơ hội thắng 4 nấc bằng ô pixel (không gradient) có chữ, dòng "cần thêm", cảnh báo bỏ trống ô, nút Rút quân có hỏi lại một lần. Chữ qua humanizer, rà uiux-pro-max 2 vai.
- [x] Mô phỏng `scripts/sim-son-mon.ts`: 1.000 lần xuất chinh mù với/không có thanh cơ hội (người chơi dừng khi "Thấp"): tỉ lệ thua và số giờ nghỉ trung bình; kiểm nhiễu ±35% không đoán ngược ra số thật sau 24 lần xem.
- [x] Đo: `sm_co_hoi_xem`, `sm_rut_quan`, tỉ lệ thắng xuất chinh trước/sau, số người theo trung bình mỗi lệnh. smoke-son-mon thêm màn tập hợp có thanh cơ hội.
- Ghi chú:
  - Máy chủ và giao diện đã làm trong phiên chat 18/11 (e943d07, migration `son_mon_co_hoi_2026_11_18` + `son_mon_co_hoi_bo_uoc_2026_11_18`); mức thô `sm_uoc` BỎ theo Tyler 20:20 (chưa trinh sát vẫn "???"). Đêm 18/11 chỉ thêm đo và mô phỏng (d813930).
  - Mô phỏng `CH=1 npx tsx scripts/sim-son-mon.ts 1000` (Lực chiến 315 người thật, bên giữ đổi ±15% lúc tới): đánh mù thua 47,3%, nghỉ trung bình 3,2 giờ-người mỗi lệnh; có thanh Cơ hội (rút khi "Thấp") rút 40%, đánh 600 lần thua 12,2%, nghỉ 0,6 giờ-người mỗi lệnh. Phần "nhiễu ±35%" không còn (đã bỏ mức thô).
  - Tyler 19/11 (sau bản đêm): bỏ thanh Cơ hội thắng. Trinh sát vẫn còn, túi mù chỉ dành cho ai không trinh sát: ô đã trinh sát hiện "Ước tính trận" như trước 18/11 (thước so lực, câu ước tính), ô chưa trinh sát hiện thẻ "Đánh mù". Bước "Trinh sát" trên thanh bước ghi "tùy ý"/"xong". Phát lệnh dùng lại `vkl_sm_march` (không tự trinh sát, để ai không trinh sát là đánh mù thật). Cáo thị 4.6.0 sửa dòng xuất chinh. Hàm máy chủ `vkl_sm_co_hoi`, `vkl_sm_march_tt` giữ nguyên, không gọi nữa.
  - Đo: `sm_co_hoi_xem` (lần đầu thấy thanh có số trinh sát), `sm_rut_quan` (đã có). Số 18/11: 11 lệnh xuất chinh đều vào ô trống, chưa có trận giữa môn, nên chưa có tỉ lệ thắng trước/sau. Đo lại từ 21/11.

## Ngày 8d - Người chơi đã "full": kết cục mới, cảnh giới mới, chọn thế giới khởi đầu (góp ý Hoang Le)
Lên bản: 2026-11-19. Đêm nay chủ yếu là NGHIÊN CỨU + THIẾT KẾ (tài liệu), chỉ code phần nhỏ chắc chắn xong. Không chen trước 8a.
Tyler 20:44 18/11: suy nghĩ kỹ về bình luận Facebook (bài "Đủ 30: +10% - Đủ 50: +20%", 18/11): Hoang Le: "Ra thêm kết cục và cảnh giới mới đi ông. Ông ra thêm lúc vào chọn 1 thế giới đi với cảnh giới đó luôn cho dễ. Chứ full hết rồi". Ảnh kèm: Sổ Sinh Tử 86/95, Thiên thư 10/10, Bảo khố 297/297, Kiếp Số 10 - Hồn vẹn 100, nhiệm vụ 3/3, đã mua thiên phú (3487 phúc duyên), thiên phú tà đạo (1950 nghiệp lực).
- [x] Số liệu: bao nhiêu người đã gần hết nội dung (Sổ Sinh Tử từ 80/95, Thiên thư 10/10, Bảo khố đầy, đã đạt cảnh giới cao nhất); họ còn chơi mỗi ngày không, chơi gì (Lôi đài, Sơn Môn, chỉ đầu thai cày); kết cục nào ít ai đạt nhất. Ghi vào docs/tang-truong.md.
- [x] Thiết kế (game-design: game-direction, player-experience, balance-review; story-writing cho nội dung), lưu `docs/thiet-ke-hau-ky.md`:
  1. **Kết cục mới - THIÊN THƯ QUYỂN III, 30 kết cục (Tyler chốt 20:48 18/11; 21:04: tổng 30, mạch chính 20):** dùng `anthropic-skills:story-writing` (story-long-write: mạch truyện xuyên kiếp, sổ theo dõi tính liền mạch) và `anthropic-skills:script-writing` (plot-points, drama-planner: móc câu, cú lật) để viết.
     - Phải HỢP LÝ: đọc kỹ `lib/game/lore.ts` (quyển I: 10 mảnh, "vì sao cứ phải luân hồi") và quyển II (Kẻ Gõ Chuông, gõ/đập chuông trong `lib/game/endings.ts`) để quyển III nối tiếp câu chuyện, không mâu thuẫn, trả lời câu hỏi còn treo và mở câu hỏi mới. Lưu dàn ý truyện quyển III vào `docs/thien-thu-3.md` (bối cảnh, nhân vật, các mảnh/chặng, 30 kết cục xếp theo chặng, điều kiện mở từng cái).
     - 30 kết cục chia nhóm: mạch chính quyển III (20, mở theo thứ tự như quyển I/II, chia 4 chặng x 5), kết cục gắn hệ thống mới (Sơn Môn, Sư Đồ, chân thân, Lôi đài, cảnh giới mới, chọn thế giới khởi đầu: 6), kết cục hiếm/bí ẩn cho người tò mò (4). Mỗi kết cục có tên, lời dẫn, `hint` và `how` như kết cục cũ, viết tr('Việt', 'English'), rà humanizer.
     - Mở quyển III khi đã xong quyển II (người full như Hoang Le có việc ngay). Sổ Sinh Tử 95 -> 125.
     - Đêm nay: xong dàn ý `docs/thien-thu-3.md` + viết đủ chữ 30 kết cục. Code: làm chặng 1 (5 kết cục mạch chính) nếu kịp và thử sạch; còn lại chia các đêm sau, ghi vào kế hoạch.
  2. **Cảnh giới mới trên cảnh giới cao nhất hiện tại:** tên, điều kiện mở, làm gì khác (không chỉ số to hơn), mô phỏng `sim-do-kho.ts` để không phá cân bằng kiếp thường.
  3. **"Chọn thế giới đi với cảnh giới đó" (ý chính của Hoang Le):** người đã đạt cảnh giới X ở kiếp trước thì lúc đầu thai được chọn thế giới/cõi khởi đầu tương ứng (ví dụ đã từng Hóa Thần thì có thể sinh thẳng vào giới tu tiên cao, bỏ đoạn đầu), đổi lại phần thưởng/kết cục khác. Đánh giá: tiết kiệm thời gian cho người cũ vs mất cảm giác lớn dần; cách giữ người mới không bị bỏ lại; có nên chỉ mở cho người full Sổ Sinh Tử.
  4. Thứ tự làm và chia đêm, cái nào lên trước (ưu tiên thứ người full thấy ngay: kết cục mới + chọn thế giới).
- [ ] (CHUYỂN sang Ngày 8e) Nếu kịp và chắc chắn: code chặng đầu Thiên thư quyển III (5 kết cục mạch chính chặng 1, thêm chặng 2 nếu kịp), thử như thường lệ (sim-do-kho trước/sau nếu đổi điều kiện kiếp). Chưa đủ chặng thì giấu sau cờ.
- [x] Soạn sẵn câu trả lời bình luận cho Tyler tự đăng (xưng "mình", gọi "bạn", không hứa ngày, nói đang làm gì; humanizer). KHÔNG tự đăng.
- Xong (3/4, phần code chuyển 8e): 2026-11-18 dbe6cbf
- Ghi chú:
  - Số liệu và thiết kế: `docs/thiet-ke-hau-ky.md` (bảng số, cảnh giới Chân Nhân, chọn thế giới khởi đầu, thứ tự làm, câu trả lời Hoang Le). Dàn ý và chữ đủ 30 kết cục: `docs/thien-thu-3.md` (Claude chốt các chỗ còn treo ở mục 1 của thiết kế).
  - Số chính: 22 người xong quyển II (16 chơi hôm nay, 13 ở Sơn Môn); 257 người có Quy Nhất mà chưa xong quyển II; 191 người đã Khai Thiên Lập Địa; chỉ 2 người từ 60/95 kết cục.
  - Claude tự chốt: KHÔNG code chặng 1 đêm nay. Chặng 1 chạm vòng đời kiếp (gắn `c.tt3`, hàm ghi kèm cạnh `alsoEndings`, nút Uống ở cầu Nại Hà) và màn Thiên thư; làm vội sau 3 khối Sơn Môn thì không thử đủ. Chuyển thành khối Ngày 8e (lên bản 20/11, giấu sau cờ).

## Ngày 8e - Thiên thư quyển III: khung + chặng 1 (giấu sau cờ)
Lên bản: 2026-11-20. Giấu sau cờ `TT3_ON` (tắt mặc định) tới khi thử sạch; bật trong cùng khối nếu sạch. Có cáo thị: thêm một dòng vào bản gần nhất "Thiên thư quyển III mở chặng 1 cho ai đã xong quyển II". Làm SAU các khối Sơn Môn tới hạn cùng đêm (Ngày 9). Kỹ năng: `anthropic-skills:gamedev` (save-systems cho trường Meta mới), `anthropic-skills:game-design` (player-experience), `anthropic-skills:story-writing`, `anthropic-skills:humanizer`.
Nguồn: `docs/thien-thu-3.md` mục 4, 5 (chặng 1), 9; `docs/thiet-ke-hau-ky.md` mục 1, 4. Chữ lấy đúng từng chữ trong `docs/thien-thu-3.md`.
- [ ] Khung: `LORE` thêm `book: 3` (trang XXI-XL), tab quyển III ở màn Thiên thư (chưa mở thì ghi lý do ngay trên tab: "Xong quyển II để mở"), `m.tt3Nhanh` (đặt một lần), `c.tt3` lúc đầu thai, hàm `tt3Endings(c, meta)` ghi kèm cạnh `alsoEndings`, mạch chính mở đúng thứ tự. Sổ Sinh Tử đếm đúng số kết cục đã có code.
- [ ] Chặng 1: `tt3_du_am`, `tt3_dong_xanh`, `tt3_lang_duoi_nui`, `tt3_tre_quy_cua` (trọng số `nhan_de_tu` x5 khi `c.tt3 === 3`), `tt3_tieng_dau` (móc nút Uống ở cầu Nại Hà) và `tt3_than_khong_mong`.
- [ ] Thử: `sim-do-kho 3000` trước/sau (kiếp thường không đổi), đo số kiếp trung bình để gặp đứa trẻ quỳ ở trang XXIV (mục tiêu dưới 4), Playwright 390x844 màn Thiên thư quyển III (người mới: không thấy tab; người full: thấy trang XXI), smoke như thường.
- [ ] Đo: `tt3_mo` (mở trang), số người đạt từng kết cục chặng 1 sau 3 ngày.
- Ghi chú:

## Ngày 8f - Chọn thế giới khởi đầu khi đầu thai (giấu sau cờ)
Lên bản: 2026-11-22 (làm 20-21/11, mỗi đêm một phần, giấu sau cờ `KHOI_DAU_ON`). Có cáo thị khi bật. Nguồn: `docs/thiet-ke-hau-ky.md` mục 3 (Phàm, Tu chân, Tiên, Hồng Hoang; mở khi đạt mốc 5 lần; phúc duyên x0,8 / x0,6 / x0,5; ô khóa ghi lý do ngay trên ô).
- [ ] Máy: đếm số lần đạt Kim Đan / phi thăng / Khai Thiên qua các kiếp (Meta), màn chọn ở bước đầu thai (mặc định Phàm giới, người mới không thấy ô khác).
- [ ] Khởi tạo nhân vật theo khởi đầu (tuổi, cảnh giới, chỉ số như người chăm tu); kiếp bỏ qua đoạn đầu không tính bảng xếp hạng tuổi; Lực chiến Sơn Môn chỉ tính năm sống thật.
- [ ] Mô phỏng `sim-do-kho 3000` và `sim-farm 200` trước/sau; đo `khoi_dau`, thời gian một kiếp, số kiếp mỗi ngày của nhóm Khai Thiên.
- [ ] uiux-pro-max + huashu-design (2 vai) + humanizer, rồi bật cờ.
- Ghi chú:

## Ngày 9 - Kỷ 2 làm sớm: máy chủ (giấu sau cờ)
Lên bản: 2026-11-20. Giấu sau cờ `SM_DAT_ON` (tắt mặc định). Có cáo thị: thêm một dòng vào 4.6.0 báo trước "Từ 5:00 ngày 21/11 hạng Kỷ tính theo Điểm giữ đất".
Tyler chốt 18/11: "Làm luôn Kỷ 2 vào 21/11 coi như tính năng". Nguồn ý: báo cáo `claude/nghien-cuu-game-chien-thuat-text-son-mon.md` (Travian oasis, Torn territory, Tribal Wars giữ làng, Utopia/SFC2 dải sức mạnh, Mob Wars boss).
Claude chốt (vai chủ game):
- **Điểm giữ đất thay số ô để xếp hạng Kỷ 1, tính từ 5:00 21/11** (mọi môn bắt đầu từ 0, báo trước 2 ngày nên không ai mất lợi): mỗi giờ mỗi ô môn đang giữ cộng điểm: ô thường 1, Linh Mạch 3, Thiên Trì (ô tâm 0,0) 5. Bằng điểm thì xét số ô rồi tổng Khí vận. Bảng Kỷ hiện điểm và số ô. pg_cron mỗi giờ phút 0.
- **Linh Mạch:** 12 ô (4 mỗi cõi, ở vòng 3-4), đặt tên riêng, biểu tượng mạch ngọc trên bản đồ. Môn giữ Linh Mạch lúc 5:00 được +2 Khí vận mỗi ô cho hôm đó. Không cộng chỉ số vào kiếp.
- **Thiên Trì** (ô tâm): mở từ 21/11, 5 điểm/giờ, người đứng giữ ô này +10% lực giữ (ô ai cũng muốn).
- **Yêu thú chiếm ô (đánh máy):** mỗi ngày 5:00 tối đa 8 ô trống ở vòng ngoài (vòng 5-6) bị yêu thú chiếm, lực giữ cố định 1.500-6.000 theo vòng (mô phỏng chỉnh để môn 5-8 người thắng được). Không khai hoang được ô yêu thú, phải xuất chinh như thường (trinh sát thấy đúng lực). Thắng: ô về môn, mỗi người đi theo +10 phúc duyên. Thua: nghỉ 2 giờ như thường. Yêu thú không đánh ai. Hết ngày chưa ai đánh thì ô về trống.
- **Dải sức mạnh:** chỉ xuất chinh vào ô của môn có tổng Lực chiến (có trần) từ 1/3 môn mình trở lên. Ngoại lệ: Linh Mạch và Thiên Trì ai cũng đánh được (không trốn trên đất quý).
- **Thù 12 giờ:** môn vừa chiếm ô của môn khác thì 12 giờ sau mới đánh tiếp ô khác của môn đó (chống dồn đánh một môn).
- **Môn bỏ hoang:** môn 72 giờ không ai trong môn chơi kiếp hay mở Sơn Môn thì mọi ô trừ chính điện về trống (báo trong chiến báo).
- [ ] Bảng/cột MỚI: `vkl_sm_tile.loai` ('thuong','linh_mach','thien_tri','yeu_thu') + `yeu_luc`; bảng `vkl_sm_diem` (ky_id, mon_id, diem, cap_nhat). Hàm MỚI `vkl_priv.sm_diem_gio()` (cron mỗi giờ), `vkl_priv.sm_yeu_thu_5h()` (cron 5:00), `vkl_priv.sm_bo_hoang()`; đặt 12 Linh Mạch + Thiên Trì cho Kỷ 1 (chỉ ô đang trống; ô đã có chủ thì giữ nguyên chủ, đổi loại).
- [ ] Tính trận với ô yêu thú: hàm MỚI thay thế (không sửa `sm_tran` cũ) và gọi từ tick mới, hoặc nhánh trong hàm mới `vkl_sm_march2` + `sm_tran2`; giữ đúng luật trận cũ cho ô môn khác.
- [ ] Dải sức mạnh + thù 12 giờ: trong `vkl_sm_march2` (hàm mới), giao diện gọi hàm mới khi cờ bật.
- [ ] `vkl_sm_rank2`, `vkl_sm_map2` (trả loại ô, điểm), `vkl_sm_state` thêm điểm Kỷ (hàm mới `vkl_sm_state2` nếu cần).
- [ ] Mô phỏng `scripts/sim-son-mon.ts` thêm điểm giữ đất, Linh Mạch, yêu thú: môn 15 người / 8 người / 3 người cuối Kỷ được bao nhiêu điểm, môn 3 người giữ 1 Linh Mạch có vượt môn 15 người toàn ô thường không (mục tiêu: có, nếu giữ đủ lâu). Ghi số vào Ghi chú.
- [ ] Thử SQL trong giao dịch rồi hủy (như Khai hoang 18/11), cron chạy 2 lần không hỏng.
- Ghi chú:

## Ngày 10 - Kỷ 2 làm sớm: giao diện, bật cờ
Lên bản: 2026-11-21. Bật cờ `SM_DAT_ON` lúc 5:00 21/11 (điểm bắt đầu tính). Có cáo thị 4.6.1 (bản mới): "Đất có giá": Linh Mạch, Thiên Trì, yêu thú, điểm giữ đất, luật dải sức mạnh.
- [ ] Bản đồ: biểu tượng pixel Linh Mạch (mạch ngọc xanh), Thiên Trì (hồ sen vàng), yêu thú (đầu thú đỏ, ghi lực giữ); chú thích; chạm ô ghi "+3 điểm mỗi giờ, +2 Khí vận mỗi sáng".
- [ ] Môn nhà: thẻ Lãnh thổ thêm "Điểm Kỷ: 1.240 · +9 mỗi giờ"; Xếp hạng Kỷ theo điểm (vẫn ghi số ô).
- [ ] Xuất chinh: ô ngoài dải ghi lý do "Môn này yếu hơn 1/3 môn ta, đánh không được trừ ở Linh Mạch và Thiên Trì"; ô yêu thú ghi "Đánh máy, thắng mỗi người +10 phúc duyên".
- [ ] Luật Sơn Môn: thêm câu hỏi "Điểm giữ đất là gì?", "Yêu thú là gì?", "Sao không đánh được môn kia?"; thẻ 3 câu đổi câu 3: "Hết Kỷ, môn nhiều Điểm giữ đất nhất thắng".
- [ ] uiux-pro-max + humanizer cho mọi màn mới; `smoke-son-mon` thêm màn Linh Mạch, yêu thú, ô ngoài dải.
- [ ] Bài đăng Page + Group cho Tyler tự đăng (không tự đăng): "Từ hôm nay đất có giá".
- Ghi chú:

## Ngày 11 - Pháp bảo Sơn Môn có tác dụng trong trận (Kỷ 2)
Lên bản: 2026-12-01. Không cáo thị riêng (đã báo ở 8a).
- [ ] Nối `vkl_priv.sm_lc_bv` vào tính trận và lực giữ (hàm mới thay thế cho Kỷ 2, Kỷ 1 đã kết giữ nguyên). Chạy `sm_phat_thuong(1)` lúc kết Kỷ 1 (21:00 1/12) và kiểm tra ai nhận gì, gửi Tyler danh sách.
- [ ] Tạo Kỷ 2 (từ 2/12) theo luật đã chốt ở Ngày 9-10.
- Ghi chú:

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
