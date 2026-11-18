# Sơn Môn sau ngày đầu Kỷ 1 - brainstorm tối ưu và tính năng (18/11/2026)

Dùng: game-design (player-experience, game-ux-review, game-direction), gamedev (game-ui-ux, game-feel), story-writing.

## Số liệu ngày đầu (16:30 18/11, khoảng 11 giờ sau khi mở Kỷ 1)

- 11 môn, 69 người trong môn / 269 người chơi 24 giờ qua (26%).
- 127 ô, mới 18 ô có chủ (14%). 8 lệnh xuất chinh, cả 8 đều tới ô trống, 0 trận giữa hai môn.
- Bạch Long Cung và Vô Hư Cốc mỗi môn 15 người (được giữ 6 ô) nhưng chỉ có 1 ô. Chỉ Huyền Hư Cung dùng hết 6/6 ô.
- 4 môn chỉ có 1 người, 2 môn 3 người.

## Vì sao người chơi không mở rộng (đi như người chơi)

1. **Mở rộng nằm sau chữ "Xuất chinh".** Muốn lấy ô trống phải bấm Xuất chinh, qua các bước Trinh sát, Tập hợp 30 phút, Di chuyển 20 phút và Giao tranh. Người chơi đọc là "đi đánh nhau" nên không bấm.
2. **Chỉ môn chủ và trưởng lão bấm được.** 13/15 người của môn đông là đệ tử, họ thấy nút khóa. Môn chủ thì offline.
3. **Không có chỗ nào nói "môn còn 5 ô chưa dùng".** Môn nhà chỉ ghi "giữ 1/6 ô" bằng chữ nhỏ.
4. **Bản đồ không chỉ chỗ có thể đi.** Ô trống kề lãnh thổ trông y hệt ô trống ở xa.
5. Luật 3 câu nói về Khí vận và đánh nhau, không nói về mở rộng.

## Đã làm hôm nay (đẩy `next`, lên trang 5:00 19/11)

- **Khai hoang:** chạm ô trống kề lãnh thổ rồi bấm KHAI HOANG là cắm cờ ngay. Không tập hợp, không đi đường, không đánh. Ai trong môn cũng làm được, cả đệ tử. Vẫn theo trần số ô (1 + số người / 3). Bảo hộ ô mới theo luật cũ. Hàm mới `vkl_sm_khai_hoang`, đã chạy trên máy chủ.
- **Thẻ "Lãnh thổ X/Y ô"** ở đầu môn nhà, có ô vuông đếm, câu "quanh lãnh thổ có N ô đất trống" và nút KHAI HOANG THÊM ĐẤT. Đủ ô thì ghi cần thêm mấy người.
- **Bản đồ:** ô khai hoang được có dấu + vàng nhấp nháy, chú thích "khai hoang được", thẻ hướng dẫn trên bản đồ.
- **Ô trống** chỉ còn nút Khai hoang. Xuất chinh chỉ còn cho ô có chủ.
- Luật 3 câu và luật đủ viết lại: câu đầu là Khai hoang. Chiến báo ghi "X khai hoang Y".

Đo: số lần khai hoang mỗi ngày, tỉ lệ môn dùng hết ô, tỉ lệ thành viên có ít nhất 1 hành động trên bản đồ.

## Ý tưởng tiếp theo (xếp theo tác động / công sức)

### Đợt 1 - làm ngay (1-2 đêm, giải đúng hai vấn đề Tyler nêu)

1. **Ba bước đầu cho người mới vào môn:** điểm danh, khai hoang một ô, chọn ô đứng giữ. Có ô tích. Làm xong thì ẩn.
2. **Cờ phấp phới và hiệu ứng cắm cờ:** cắm cờ xong có cờ pixel dựng lên ô (0,6 giây), ô mới sáng nhấp 3 lần. Ô môn ta có cờ nhỏ bay. Trang Sơn Môn đỡ khô như bảng tính. (game-feel)
3. **Chấm đỏ trên tab Sơn Môn ở trang chủ** khi môn còn ô chưa dùng mà quanh lãnh thổ còn đất trống, hoặc khi môn bị đánh.
4. **Tin hệ thống trong Truyền âm:** "Hàn Sương vừa khai hoang Vọng Nguyệt Lâm (3/6 ô)", "Huyết Sát Cung đang tới Lạc Hà Cốc, 42 phút". Chat có cớ để nói chuyện.
5. **Lời dẫn khi khai hoang theo cõi** (story-writing), hiện ở thông báo thành công:
   - Thiên: "Mây tách ra một khoảng. Ngọn cờ của môn cắm xuống, gió trên đỉnh núi đổi chiều."
   - Hồng Trần: "Dân làng dưới chân đồi ra xem. Từ nay mảnh đất này gọi tên môn ngươi."
   - U Minh: "Đèn ma dạt sang hai bên. Cờ cắm xuống đất lạnh, không ai dám nhổ."

### Đợt 2 - làm cho bản đồ đáng tranh (3-5 đêm, để sau cờ trước khi bật)

6. **Ô đặc biệt:** khoảng 12/127 ô có tên riêng và lợi nhỏ, hiện biểu tượng trên bản đồ:
   - Linh Mạch: +2 Khí vận mỗi ngày cho môn giữ.
   - Cổ Mộ: người đứng giữ +5 phúc duyên mỗi ngày.
   - Thiên Trì: +10% lực giữ ô kề.

   Có lý do tranh một ô cụ thể, không chỉ đếm số ô. Cần mô phỏng trước, không cộng chỉ số vào kiếp.
7. **Yêu thú chiếm ô (đánh máy, không đánh người):** mỗi ngày 5:00 vài ô trống bị yêu thú chiếm, lực giữ cố định theo cõi. Môn xuất chinh đánh yêu thú để lấy ô và một phần thưởng nhỏ. Người chơi học luồng trinh sát, xuất chinh, giao tranh mà không sợ mất gì của ai. Đây là cách dạy đánh nhau không áp lực.
8. **Đồng minh** (đã hứa "sắp có"): hai môn kết minh thì không đánh nhau được, cùng giữ ô kề. Giảm sợ bị đánh, cho môn nhỏ chỗ đứng.
9. **Chiến báo cả server ở trang chủ:** một dòng chạy "Huyền Hư Cung vừa khai hoang..." kéo người chưa vào môn.

### Đợt 3 - sau Kỷ 1, xem số rồi quyết

10. **Môn 1 người:** sau 48 giờ chưa thêm người thì gợi ý gộp vào môn khác cùng cõi, hoặc tự đóng để trả ô.
11. **Kiếp gặp môn:** trong kiếp có sự kiện nhắc tới môn của người chơi, ví dụ gặp đệ tử cùng môn, nghe tin môn mất ô. Nối Sơn Môn với vòng chơi chính.
12. **Danh hiệu theo ô giữ lâu nhất:** ô giữ đủ 7 ngày thì khắc tên môn lên ô (chữ nhỏ), hết Kỷ ghi vào Sổ Sinh Tử.

## Không làm

- Không thêm tiền tệ hay công trình mới. Vẫn giữ luật "không tích thứ gì ngoài Lực chiến".
- Không bắt đánh nhau để có ô đầu: ô trống luôn khai hoang được.
