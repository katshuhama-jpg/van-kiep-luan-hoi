# Thiết kế hậu kỳ: cho người đã "full" (Ngày 8d, 18/11/2026)

Nguồn: bình luận Hoang Le dưới bài "Đủ 30: +10% - Đủ 50: +20%" (18/11): "Ra thêm kết cục và cảnh giới mới đi ông. Ông ra thêm lúc vào chọn 1 thế giới đi với cảnh giới đó luôn cho dễ. Chứ full hết rồi". Ảnh kèm: Sổ Sinh Tử 86/95, Thiên thư 10/10, Bảo khố 297/297.
Kỹ năng đã dùng: `anthropic-skills:game-design` (game-direction, player-experience, balance-review), `anthropic-skills:story-writing` + `anthropic-skills:script-writing` (dàn ý quyển III, ở `docs/thien-thu-3.md`), `anthropic-skills:humanizer` (chữ).

## 0. Số liệu (Supabase, 18/11 tối)

| Nhóm | Số người | Chơi trong 24 giờ | Chơi trong 3 ngày | Đang ở Sơn Môn |
|---|---|---|---|---|
| Xong Thiên thư quyển II (có `go_chuong` hoặc `dap_chuong`) | 22 | 16 (73%) | 17 | 13 |
| Có Vạn Kiếp Quy Nhất nhưng chưa xong quyển II | 257 | 67 (26%) | 108 | 46 |
| Đạt Khai Thiên Lập Địa (cảnh giới cao nhất, Hồng Hoang) | 191 | | | |
| Sổ Sinh Tử từ 30/95 | 101 | | | |
| Sổ Sinh Tử từ 60/95 | 2 | | | |
| Sổ Sinh Tử từ 80/95 | 1 (nhiều khả năng là Hoang Le) | | | |
| Thiên thư từ 10 mảnh / đủ 20 mảnh | 402 / 15 | | | |

Kết cục ít người đạt nhất: `hoa_tinh` 2, `hg_phan_sat` 2, `hg_va_troi` 3, `hg_giao_diet` 4, `van_kiep_bat_diet` 5, `hg_thien_thi` 5, `tinh_cu_doi_mang` 6, `buong_dao` 6.

Nhận định:
- Người "full" thật (xong quyển II) ít, 22 người, nhưng rất trung thành: 73% chơi hôm nay, 13/22 đã vào Sơn Môn. Họ là người đánh giá game trên Facebook, nên đáng làm.
- Nhóm lớn hơn là 191 người đã lên Khai Thiên: cảnh giới không còn gì để leo. Với họ, mỗi kiếp mới phải đi lại đoạn phàm nhân dài. Đây là chỗ Hoang Le nói "chọn 1 thế giới đi với cảnh giới đó cho dễ".
- Sổ Sinh Tử không phải nút thắt cho đa số (chỉ 2 người từ 60/95). Kết cục mới chủ yếu phục vụ nhóm 22 + 257 người đang đi quyển II.

## 1. Kết cục mới: Thiên thư quyển III "Cơm Chiều" (30 kết cục, Sổ Sinh Tử 95 -> 125)

Dàn ý, nhân vật, sổ liền mạch và chữ đủ 30 kết cục: `docs/thien-thu-3.md`.
- Mạch chính 20 kết cục, 4 chặng: Dư Âm, Người Gõ Cổng, Bờ Vong Xuyên, Cơm Chiều. Mở theo thứ tự, mỗi kết cục là một trang Thiên thư XXI-XL.
- 6 kết cục gắn hệ thống: Sơn Môn (cắm cờ bên Vong Xuyên), Sư Đồ, chân thân, Lôi đài, cảnh giới mới, chọn thế giới khởi đầu.
- 4 kết cục bí ẩn (chỉ có hint).
- Trả lời câu hỏi treo của quyển II: tiếng chuông đánh vỡ Chân Nhân là tiếng mẹ ông (Mạnh Bà) gọi con về ăn cơm, Khấu (Kẻ Gõ Chuông, đệ tử duy nhất) gõ theo lời nhờ của bà. Câu hỏi gốc "vì sao phải sống": vì có người chờ mình về.
- Hai nhánh gõ/đập chuông đều vào được quyển III (trường mới `m.tt3Nhanh`).

Claude chốt các chỗ còn treo trong mục 10 của `docs/thien-thu-3.md`:
- Tên cảnh giới mới: **Chân Nhân** (xem mục 2).
- Trang XXIV (`nhan_de_tu`): khi đang ở trang này, trọng số sự kiện x5. Đêm code chạy `sim-do-kho` đo số kiếp trung bình để gặp; mục tiêu dưới 4 kiếp.
- XXVIII/XXXVII (Ngũ Hành Đài) và XXXIII (lore chủ mộ): kiểm dữ liệu ở đêm code chặng 2-3; không đọc được thì đổi điều kiện sang thứ đo được, giữ nguyên chữ.
- `tt3_su_gia_khong_mat`: chữ sự kiện nói rõ đây là một sứ giả khác, không phá lời hứa cũ.

## 2. Cảnh giới mới trên Khai Thiên: Chân Nhân

- **Tên:** Chân Nhân (3 tầng: Tọa Chuông, Gọi Tên, Cơm Chiều). Tên nối thẳng vào truyện: chỗ trống giữa núi tuyết mà Vạn Kiếp Chân Nhân để lại.
- **Điều kiện mở:** đã có `hg_khai_thien` + xong chặng 2 quyển III (`tt3_chet_do`). Không ai lên được bằng cày số, phải đi truyện.
- **Làm gì khác (không chỉ số to hơn):**
  1. Tọa Chuông: mỗi năm trong kiếp chọn "nghe" một mảnh (một người chơi thật vừa khép kiếp, lấy từ `vkl_lives` gần đây): đọc một dòng kiếp của họ, bấm Gọi để gửi họ một lời chúc (thư hệ thống, không chữ tự do). Người nhận +1 phúc duyên, mỗi ngày tối đa 5 lời.
  2. Gọi Tên: đặt một "luật thế giới" cho thế giới mình mở ở Khai Thiên Lập Địa (3 luật chọn một: Đất Lành, Trời Thử, Chuông Gọi), luật này áp vào lựa chọn Hồng Hoang ở mục 3.
  3. Cơm Chiều: tầng cuối mở `tt3_cho_ong_ngoi` khi chọn ngồi vào chỗ trống hay rời đi.
- **Cân bằng:** chỉ có trong Hồng Hoang sau Khai Thiên, không đổi kiếp thường. Lực chiến Sơn Môn không tính tầng mới (trần 6.000 giữ nguyên). Lôi đài giữ trần 51 như hiện tại. Đêm code chạy `sim-do-kho 3000` trước/sau để chắc tỉ lệ các cảnh giới dưới không đổi.

## 3. Chọn thế giới khởi đầu (ý chính của Hoang Le)

Lúc đầu thai, người đã từng đạt một mốc nhiều lần được chọn nơi bắt đầu:

| Khởi đầu | Mở khi (qua các kiếp) | Bắt đầu ở | Đổi lại |
|---|---|---|---|
| Phàm giới (mặc định) | luôn có | 0 tuổi, như cũ | đủ mọi thứ |
| Tu chân giới | từng đạt Kim Đan 5 lần | 16 tuổi, Trúc Cơ sơ kỳ, chỉ số như người chăm tu | không mở kết cục chết trẻ, không gặp sự kiện tuổi thơ; phúc duyên kiếp này x0,8 |
| Tiên giới | từng phi thăng 5 lần | vừa phi thăng, Tiên giới tầng 1 | như trên, phúc duyên x0,6 |
| Hồng Hoang | có `hg_khai_thien` | vào thẳng Hồng Hoang | phúc duyên x0,5; kiếp này không tính vào bảng xếp hạng tuổi |

Lý do chọn như vậy:
- Tiết kiệm thời gian cho người cũ mà không bỏ cảm giác lớn dần: mặc định vẫn là Phàm giới, chỉ hiện các ô khác khi đã làm được 5 lần (người mới không thấy, không bị rối, giữ luật "không cần nghĩ, chỉ đọc và bấm").
- Không mở cho riêng người full Sổ Sinh Tử, vì nhóm cần nhất là 191 người ở Khai Thiên chứ không phải 1 người 86/95.
- Phúc duyên giảm theo đoạn bỏ qua để không thành cách cày nhanh hơn. Lực chiến Sơn Môn tính năm đã sống thật, nên bỏ đoạn đầu không làm Lực chiến tăng nhanh hơn.
- Ô bị khóa ghi rõ lý do ngay trên ô ("Cần đạt Kim Đan 5 lần, ngươi đã có 3"), không dùng tooltip.
- Đo: `khoi_dau` (chọn ô nào), thời gian một kiếp trước/sau, số kiếp mỗi ngày của nhóm Khai Thiên, có ai chọn lại Phàm giới không.

## 4. Thứ tự làm và chia đêm

Ưu tiên thứ người full thấy ngay: kết cục mới và chọn thế giới.

| Đêm | Khối | Nội dung | Lên bản |
|---|---|---|---|
| 19/11 | 8e | Khung quyển III (LORE `book: 3`, tab quyển III ở màn Thiên thư, `m.tt3Nhanh`, `c.tt3`, hàm `tt3Endings`) + chặng 1 (XXI-XXV) + `tt3_than_khong_mong`. Giấu sau cờ `TT3_ON` tới khi thử sạch. | 20/11 |
| 20-21/11 | 8f | Chọn thế giới khởi đầu (Phàm, Tu chân, Tiên, Hồng Hoang), mô phỏng `sim-do-kho` và `sim-farm` trước/sau. Giấu sau cờ `KHOI_DAU_ON`, bật khi sạch. | 22/11 |
| 22-25/11 | 8g | Chặng 2, 3, 4 quyển III, mỗi đêm một chặng (theo mục 9 của `docs/thien-thu-3.md`). | theo chặng |
| sau Kỷ 2 Sơn Môn | 8h | Cảnh giới Chân Nhân + `tt3_cho_ong_ngoi`, `tt3_khong_lang`. | chưa hẹn |

Không chen trước Ngày 9-10 (Kỷ 2 Sơn Môn, lên 20-21/11): các khối 8e-8g làm sau khi khối Sơn Môn tới hạn đã xong trong đêm.

## 5. Câu trả lời bình luận cho Tyler tự đăng (không tự đăng)

Trả lời Hoang Le:
> Cảm ơn bạn, ảnh của bạn là lý do mình ngồi viết tiếp đó. Mình đang viết Thiên thư quyển III: thêm 30 kết cục, nối tiếp chuyện Kẻ Gõ Chuông, ai đã xong quyển II là vào được. Ý chọn thế giới lúc đầu thai mình cũng đang làm: ai từng lên Kim Đan, phi thăng hay Khai Thiên nhiều lần thì được bắt đầu thẳng ở cõi đó, khỏi đi lại đoạn phàm nhân. Xong phần nào mình báo ở cáo thị trong game nha.

Bản ngắn cho bình luận chung dưới bài:
> Ai đã "full" như bạn Hoang Le: mình đang làm Thiên thư quyển III (30 kết cục mới) và chọn thế giới khởi đầu khi đầu thai. Có gì mới mình báo ở cáo thị trong game.
