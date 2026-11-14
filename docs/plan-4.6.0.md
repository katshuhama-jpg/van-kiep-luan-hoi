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
| 15/11 | 16/11 | Ngày 3 vào môn, lập môn, môn nhà + Ngày 4 bản đồ, đánh nhau | Chưa |
| 16/11 | 17/11 | Ngày 5 thành viên, Kỷ, Lực chiến, thanh 4 tab + Ngày 6 hết Kỷ, thử 30 bot | Chưa |
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
- [ ] Chuyển `supabase/son_mon_2026_11_14.sql`, `supabase/son_mon_cfg_2026_11_14.sql` sang `supabase/_bo/`.
- [ ] Bảng (tiền tố `vkl_sm_`, RLS bật, không policy, chỉ đọc/ghi qua hàm SECURITY DEFINER): `ky` (id, bắt đầu, kết thúc, bán kính), `tile` (ky, q, r, tên, cõi, mon_id, chinh_dien bool, bao_ho_toi), `mon` (ky_lap, tên 3 phần, huy_hieu 0-29, chinh_dien_hinh 0-9, dk_kiep, dk_tuoi_dao, mo_cua bool, môn chủ, lap_luc, het_han_ky), `mon_ky` (chữ ký cùng lập), `member` (player, mon, chức, dung_o, khoa_toi, nghi_toi), `don` (đơn xin vào), `luc_chien` (player, lc, cập nhật lúc), `ngay` (mon, ngày, khí vận), `diem_danh` (player, ngày, chuỗi), `nv` (player, ngày, 3 nhiệm vụ, tiến độ, xong), `chinh` (lệnh xuất chinh: mon, từ ô, tới ô, tập hợp tới, tới nơi lúc, trạng thái), `chinh_theo`, `bao` (chiến báo), `co` (đánh dấu nghi gian lận).
- [ ] Hàm `vkl_priv.sm_lc(player)` theo công thức; trigger `after insert on vkl_lives` (tên `vkl_lives_zz_son_mon`, nuốt mọi lỗi để không chặn ghi bia): cập nhật Lực chiến và tiến độ nhiệm vụ ngày, cộng Khí vận cho môn.
- [ ] RPC (tiền tố `vkl_sm_`): `state(token)` (môn của ta, nhiệm vụ, khí vận, lệnh đang chạy), `list(token)`, `found(token, tên, huy hiệu, chính điện, dk)`, `cosign(token, mon)`, `pick_tile(token, q, r)`, `join(token, mon)`, `apply`/`accept`/`kick`/`leave`, `checkin(token)`, `guard(token, q, r)`, `scout(token, q, r)`, `march(token, q, r)`, `follow(token, chinh)`, `unfollow`, `map(ky)` (công khai, đọc qua bộ đệm Vercel 30 giây), `rank(ky)`.
- [ ] `pg_cron` mỗi phút: xử lý trinh sát xong, lệnh tới nơi (tính trận, ghi chiến báo), môn hết 24 giờ chưa đủ chữ ký, hạ điều kiện lập môn lúc 5:00 nếu các môn đầy trên 80%.
- [ ] Sinh bản đồ Kỷ (`vkl_priv.sm_ky_create(bắt đầu, kết thúc, bán kính)`): tên ô ghép từ danh sách, 3 cõi chia đều.
- [ ] Thử trên Postgres cục bộ trước, rồi áp lên Supabase bằng apply_migration. Lưu SQL vào `supabase/son_mon_gon_2026_11_15.sql`.
- Xong:
- Ghi chú:

## Ngày 2 - Số liệu và mô phỏng
Lên bản: 2026-11-15 (giấu sau cờ). Kỹ năng: `anthropic-skills:game-design` (balance-review).
- [ ] Viết lại `lib/sonmon/data.ts`: danh sách tên môn 3 phần, tên ô, 30 huy hiệu (màu + hình), 10 chính điện, nhiệm vụ 3 bậc, công thức Lực chiến và trận (bản TypeScript để hiện ước tính; máy chủ là bản thật).
- [ ] Viết lại `scripts/sim-son-mon.ts` bằng Lực chiến THẬT của người chơi (đọc `vkl_sm_luc_chien` hoặc tính từ `vkl_lives`): chia 25 môn theo cách người chơi tự vào (người mạnh lập môn, người khác vào môn mở cửa), 14 ngày, mỗi người online theo giờ thật (`vkl_events` 7 ngày). Đo:
  - % trận đánh ô có người giữ thành công (mục tiêu 35-65%).
  - Số ô của môn nhất / môn trung vị cuối Kỷ (mục tiêu không quá 3 lần).
  - % ngày môn trung vị đạt Khí vận 30 (mục tiêu 50-80%) và 60 (mục tiêu 10-40%).
  - Ngoài mốc thì chỉnh hệ số (sân nhà, trần đóng góp, Khí vận) và ghi số trước/sau vào "Ghi chú:".
- [ ] Đưa số đã chốt vào hàm máy chủ.
- Xong:
- Ghi chú:

## Ngày 3 - Vào môn, lập môn, môn nhà
Lên bản: 2026-11-16 (giấu sau cờ). Kỹ năng: `anthropic-skills:uiux-pro-max`, `anthropic-skills:humanizer` (chữ trên màn).
- [ ] Trang `/son-mon` theo wireframe M1 (danh sách, lọc Đủ điều kiện / Còn chỗ, thẻ Tự lập môn ghi rõ còn thiếu gì), M2 (lập môn: tên 3 phần + Ngẫu nhiên, 30 huy hiệu, 10 chính điện, điều kiện vào, Mở cửa / Duyệt đơn), M3 (chọn ô trống trên bản đồ, cảnh báo khóa thành viên, chờ 2 chữ ký), M4 (môn nhà: thẻ môn, cảnh báo bị đánh, điểm danh chuỗi 7, 3 nhiệm vụ có tiến độ, thanh Khí vận có vạch 30/60).
- [ ] Màn trống ngày đầu và khách chưa liên kết (xem mục Kiểm tra theo người chơi).
- [ ] 30 huy hiệu và 10 chính điện: pixel, vẽ bằng lưới ô vuông trong code (như icon cũ) hoặc ghép từ tileset LPC sẵn có; KHÔNG dùng emoji.
- [ ] Màn cáo biệt kiếp: dòng Khí vận (có môn / chưa có môn).
- [ ] Đo: `sm_open`, `sm_join` (mở cửa/đơn), `sm_found`, `sm_cosign`, `sm_checkin`, `sm_nv_done`.
- [ ] Mọi nút cao từ 44px, một nút chính mỗi màn, chữ ít nhất 12px, không đoạn chữ quá 3 dòng trên điện thoại.
- Xong:
- Ghi chú:

## Ngày 4 - Bản đồ và đánh nhau
Lên bản: 2026-11-16 (giấu sau cờ). Kỹ năng: `anthropic-skills:uiux-pro-max`, `anthropic-skills:gamedev` (game-ui-ux).
- [ ] M5 bản đồ lục giác (kéo để xem, nút Về lãnh thổ), chạm ô: tên ô, môn chủ, kề hay không, trinh sát gần nhất, nút Trinh sát / Xuất chinh. Đọc bản đồ qua `/api/pub/sm-map` (bộ đệm Vercel 30 giây).
- [ ] M6 xuất chinh: 4 bước (Trinh sát, Tập hợp, Di chuyển, Giao tranh) có đồng hồ, danh sách người theo, nút THEO XUẤT CHINH, thanh Ta/Họ + một câu.
- [ ] M7 chiến sự: cảnh báo bị đánh có đồng hồ, danh sách người đang đứng giữ, nút "Sang giữ <tên ô>", ô ngươi đang đứng giữ + Đổi, chiến báo gần đây bằng chữ.
- [ ] Làm mới trạng thái 60 giây một lần khi tab đang mở (không làm mới khi tab ẩn).
- [ ] Đo: `sm_scout`, `sm_march`, `sm_follow`, `sm_guard`, `sm_battle` (thắng/thua, bên).
- Xong:
- Ghi chú:

## Ngày 5 - Thành viên, Kỷ, Lực chiến, thanh 4 tab
Lên bản: 2026-11-17 (giấu sau cờ). Kỹ năng: `anthropic-skills:uiux-pro-max`.
- [ ] M8 thành viên: bảng (tên, chức, Lực chiến, Khí vận góp hôm nay, đang đứng ở ô nào), đơn xin vào (Nhận/Từ chối), Mời người chưa có môn, Sửa điều kiện vào, luật rời/đuổi.
- [ ] M9 Kỷ: đếm ngược, bảng xếp hạng (số ô, Khí vận), thưởng trang trí, chuyện gì xảy ra khi hết Kỷ.
- [ ] M10 Lực chiến: công thức bằng lời, từng phần của ngươi, trần 6.000, Khí vận.
- [ ] Thanh 4 tab theo wireframe layout (Mộng · Nhân vật · Sơn Môn · Lôi đài), nút Mời trà luôn ở thanh trên. Chỉ bật cùng cờ `SON_MON_ON`; tắt cờ thì giữ menu như cũ.
- Xong:
- Ghi chú:

## Ngày 6 - Hết Kỷ, thử toàn bộ
Lên bản: 2026-11-17 (giấu sau cờ).
- [ ] Kết Kỷ: xếp hạng, phát danh hiệu và ngoại trang, ghi tên môn vào Sổ Sinh Tử, ô về trống, mở khóa thành viên.
- [ ] Thử: Kỷ rút gọn 2 giờ (đồng hồ chia 20) trên Postgres cục bộ với 30 bot (script): lập môn, ký, vào môn, điểm danh, nhiệm vụ qua trigger, xuất chinh, đứng giữ, trận đêm, bảo hộ, môn mất hết ô, kết Kỷ. Playwright 390x844: người mới vào môn mở cửa; môn chủ lập môn, chọn ô, phát lệnh.
- [ ] Trang quản trị nhỏ cho Tyler: số môn, số người trong môn, trận/ngày, các đánh dấu nghi gian lận.
- Xong:
- Ghi chú:

## Ngày 7 - Lên bản, Kỷ 1 bắt đầu
Lên bản: 2026-11-18. Bật cờ `SON_MON_ON`, có cáo thị 4.6.0.
- [ ] Tạo Kỷ 1 (18/11 5:00 - 1/12 21:00, bán kính 6) trước 5:00.
- [ ] Cáo thị 4.6.0 ngắn: sơn môn, điểm danh và nhiệm vụ trong kiếp, bản đồ lục giác, Kỷ 1 tới 1/12. Không hứa đồng minh hay Kỷ sau có gì.
- [ ] Trước khi bật cờ: chạy đủ 2 bước của "Luật giao diện mới" (uiux-pro-max với vai người mới và người cũ, humanizer cho chữ trên màn và cáo thị) trên toàn bộ màn Sơn Môn và thanh 4 tab. Người cũ lần đầu thấy thanh 4 tab phải có một câu hướng dẫn ngắn chỉ chỗ các nút cũ.
- [ ] Video ngắn 9:16 (Playwright quay): vào môn, điểm danh, bản đồ, xuất chinh, chiến báo. Gửi Tyler, không tự đăng.
- Xong:
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
