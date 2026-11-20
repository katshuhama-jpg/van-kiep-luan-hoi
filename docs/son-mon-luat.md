# Sơn Môn - luật đã chốt (tách từ docs/luu-tru/plan-4.6.0.md ngày 19/11)

Đọc file này khi khối việc đụng Sơn Môn. Wireframe: Design canvas "VKL trang đầu 4.6 - wireframe" (https://claude.ai/artifact/AYtP1hhkiZ4BQ8eajwxS7N). Lịch sử chi tiết từng khối đã làm: `docs/luu-tru/plan-4.6.0.md` (chỉ grep khi cần).

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
- **Bỏ ô (Ngày 30):** môn chủ, trưởng lão bỏ được một ô của môn (`vkl_sm_bo_o`), trừ chính điện và ô đang có quân hay yêu thú kéo tới. Hỏi xác nhận một lần (màn xác nhận báo trước nếu bỏ ô làm đứt mạch). Ô về trống, người đứng giữ về chính điện, chiến báo 'bo_o'. Luật cũ "đủ ô mà chiếm thêm thì tự bỏ ô xa chính điện nhất" giữ nguyên.
- **Đất liền (Ngày 30):** đất của môn phải nối với chính điện qua ô kề (lưới lục giác). Sau mỗi lần môn mất ô (bị chiếm, yêu thú tràn, bỏ ô, tự bỏ ô xa) máy chủ tính lại; ô đứt về trống, người đứng ở đó về chính điện, chiến báo 'dut_mach' "Đất đứt mạch, mất N ô". Áp cả cho Linh Mạch, Thiên Trì, ô yêu thú đã chiếm. Mất chính điện thì chọn chính điện mới (ô chiếm sớm nhất) rồi mới tính. Thử: `supabase/son_mon_dem30_thu_2026_11_20.sql`.

### Đánh nhau
- **Đứng giữ (Claude chốt 13/11, Tyler duyệt 14/11):** mỗi người chọn sẵn một ô của môn để đứng giữ; offline vẫn tính. Chưa chọn thì đứng ở ô cắm cờ đầu tiên (ô chính điện).
- **Trinh sát:** mất 10 phút mỗi ô (đi và về), báo số người đang đứng giữ và Lực chiến ước tính (sai số ±15%).
- **Xuất chinh:** môn chủ hoặc trưởng lão chọn một ô kề lãnh thổ. 30 phút tập hợp, thành viên bấm "Theo" (rút lại được trước khi hết giờ). Rồi đi 20 phút mỗi ô. Môn bị đánh thấy ngay lúc xuất phát; ai đang online có thể dồn sang ô bị đánh trong thời gian đó.
- **Tính trận** khi tới nơi (pg_cron mỗi phút): tổng Lực chiến bên đánh (có trần) x (1 + Khí vận) so với tổng Lực chiến người đứng giữ (có trần) x 1,25 sân nhà x (1 + Khí vận của họ) x 2 nếu tới nơi lúc 0-7h. Bên lớn hơn thắng, không ngẫu nhiên. Bằng nhau thì bên giữ thắng.
- Ô trống: tới nơi là cắm cờ.
- Thắng: ô đổi chủ, được bảo hộ 6 giờ. Người đứng giữ ô vừa mất tự về ô chính điện. Thua: người đi theo nghỉ 2 giờ (không theo, không giữ được), không mất đồ.
- **Trọng thương (Ngày 30, từ 5:00 21/11):** hết 2 giờ nghỉ, người theo đoàn thua (cả đánh yêu thú) còn bị giảm Lực chiến Sơn Môn theo số trận thua trong ngày: lần 1 -10% thêm 1 giờ, lần 2 -30% thêm 3 giờ, từ lần 3 -50% tới 5:00. 5:00 hồi hết và đếm lại. Giảm cả khi đánh lẫn khi đứng giữ (máy chủ: trigger trên `vkl_sm_luc_chien`, số gốc ở `phan.lc_goc`). Thẻ người (Thành viên), thẻ môn nhà và màn Xuất chinh ghi "Trọng thương: Lực chiến -30%, hồi lúc 14:20". Mục đích: chặn đánh liều liên tục. Giờ tính từ lúc hết nghỉ vì trong 2 giờ nghỉ người đó vốn không đánh, không giữ được.
- **Mất ô chính điện:** môn chọn lại ô chính điện trong số ô còn giữ. Mất hết ô thì môn còn nguyên người, được cắm cờ một ô trống bất kỳ (không cần kề), bảo hộ 12 giờ.
- **Chống lăn cầu tuyết (mới, sau review 14/11):** môn đang giữ 1 ô được +15% khi giữ ô đó.
- Mỗi chân thân một việc một lúc: đi đánh, đứng giữ, hoặc đang nghỉ.
- Màn trận KHÔNG hiện phép nhân: chỉ thanh Ta/Họ và một câu kết luận ("Đang thiếu khoảng 1.650 - thêm 1 người như ngươi là đủ"). Công thức nằm ở màn Lực chiến.

### Điểm chiếm ô (Tyler 20/11 23:49, từ 5:00 21/11)
- Xuất chinh THẮNG mà lấy được ô từ môn khác hoặc từ yêu thú: môn đánh +2 Điểm giữ đất ngay lúc tính trận. Khai hoang ô trống không tính (chặn Bỏ ô rồi khai hoang lại để cày). Trần +10 mỗi môn mỗi ngày (5 trận). Thù 12 giờ giữ nguyên.
- Máy chủ: trigger `vkl_sm_diem_chiem` trên `vkl_sm_chinh`, sổ `vkl_sm_diem_chiem` (mỗi trận cộng một lần), cfg `diem_chiem` (bat_dau, diem, tran_ngay). File `supabase/son_mon_diem_chiem_2026_11_21.sql`.

### Linh Mạch, Thiên Trì, yêu thú (Kỷ 2 "Đất có giá", bổ sung Ngày 30)
- Linh Mạch và Thiên Trì MỚI xuất hiện (mạch cạn dời chỗ, Kỷ mới) có 50% có yêu thú canh (cfg `d30.yeu_dat`), lực như yêu thú vòng 5. Có yêu thú thì đánh như ô yêu thú (đệ tử cũng phát lệnh được, thắng +10 phúc mỗi người). Yêu thú canh mạch không tự về lúc 5:00, không làm ổ đánh ô khác. Không có yêu thú thì môn đầu tiên tới chiếm ngay.
- **Linh Mạch ẩn:** mạch mới sinh không hiện trên bản đồ công khai (`vkl_sm_map4`). Môn trinh sát ô đó thì kết quả có dòng "Có Linh Mạch" và môn thấy mạch tới hết Kỷ (`vkl_sm_lm_thay`); môn đang giữ ô mạch luôn thấy. Mạch ẩn có yêu thú canh thì bản đồ chung chỉ hiện như ô yêu thú. Chiến báo mạch dời không ghi chỗ mới. Một ô không có Linh Mạch hai lần trong một Kỷ (`vkl_sm_lm_su`), mạch không sinh ở ô đã có chủ. Mạch đang hiện từ 20/11 giữ nguyên tới khi cạn dời. Thiên Trì luôn hiện.
- Yêu thú thường (vòng 5-6) vẫn về trống mỗi 5:00 và hiện ở chỗ mới; ổ yêu có thể lan hoặc chiếm ô khi đánh thắng (Yêu tộc 20/11).

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
