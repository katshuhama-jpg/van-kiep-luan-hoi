# Kế hoạch 4.5.0 - Khai Mạch, Sư Đồ, Biên Niên

Nguồn: brainstorm 9/11/2026 (doc Project `brainstorm-kiep-2-10.md`, báo cáo `giu-chan-sau-cot-truyen.md`). Tyler chốt 9/11: làm cho mọi tài khoản, không chỉ người mới.

Chỉ làm sau khi 4.4.0 Hồng Hoang đã lên main (5h sáng 10/11). Luật trả lời góp ý, tặng phúc, thử trước khi đẩy: như đầu `docs/plan-4.1.0.md`. Mỗi lần chạy làm khối đầu tiên còn ô trống, ghi "Xong:" và "Ghi chú:".

## Vì sao (số thật 9/11)

- Kiếp 1 ổn: 79% chơi xong (trung vị 12,6 phút), 71% lên Kim Đan.
- 47% người mới chơi đủ 10 kiếp trong 7 ngày, 79% đủ 3 kiếp. Vậy người chơi không thiếu kiếp, mà thiếu lý do để kiếp sau khác kiếp trước.
- Còn chơi (2 ngày qua) theo số kiếp đã chơi: 2-3 kiếp 1%, 4-10 kiếp 6%, 11-30 kiếp 22%, 31+ kiếp 53%.
- Còn chơi sau 7 ngày: 11% (trước ads 14%, từ ads 9%). Tắt ads còn khoảng 30 tài khoản mới mỗi ngày.

Mục tiêu: người chơi thấy mỗi kiếp chết đi để lại một thứ nhìn thấy được trên chân thân, kéo dài từ kiếp 1 tới khoảng kiếp 60. Thêm đường cho người cũ kéo người mới vào.

Chỉ số đo: tỉ lệ còn chơi sau 7 ngày của nhóm vào sau bản này, so với mốc 11-14%. Phụ: % có từ 31 kiếp trong 14 ngày.

## Ngày 1 - Đo mốc và dữ liệu Khai Mạch
- [ ] Ghi mốc vào `docs/so-lieu.md`: còn chơi sau 1 và 7 ngày theo tuần vào, phân bố số kiếp, % đủ 10 và 31 kiếp trong 7 và 14 ngày (câu SQL để lại cho lần sau chạy lại).
- [ ] `lib/game/khaiMach.ts`: 36 huyệt Chu Thiên (tên huyệt thật, ví dụ Dũng Tuyền, Quan Nguyên, Khí Hải, Mệnh Môn, Đản Trung, Ấn Đường, Bách Hội...). Hàm `openHuyet(meta)` tính từ `meta.lives`, `meta.endings`, `meta.itemBook`, `meta.lore`, `meta.career`, không lưu thêm gì (tài khoản cũ tự có ngay).
  - Huyệt 1-10 (Thập Kiếp Khai Mạch): mở khi đủ 1, 2, ... 10 kiếp. Mỗi huyệt một lợi ích nhỏ áp lúc đầu thai (`newChar`): linh thạch khởi đầu, sức khỏe, thọ, ngộ tính, tâm cảnh, khí vận, tu luyện %, đột phá %, ngọc bội hộ thân lúc 16 tuổi. Huyệt 10 Bách Hội: chân thân thức tỉnh, danh hiệu "Khai Mạch".
  - Huyệt 11-36: mở theo mốc dài hạn có sẵn (số kiếp 15/20/30/45/60, số kết cục, đồ ẩn, mảnh Thiên thư, lần đầu Kim Đan/Hóa Thần/phi thăng/Chứng Đạo/cảnh giới Hồng Hoang). Chỉ mỹ quan: màu hào quang, khung bia, danh hiệu. Không thêm sức mạnh sau Chứng Đạo.
- [ ] Cân bằng: `npx tsx scripts/sim-do-kho.ts 3000` trước và sau với đủ 10 huyệt. Tỉ lệ lên Hóa Thần tăng không quá 3 điểm, nếu quá thì giảm số.
- Xong:
- Ghi chú:

## Ngày 2 - Khai Mạch trên giao diện (có cáo thị 4.5.0 nếu Tyler cho lên riêng)
- [ ] Màn cáo biệt: hình chân thân pixel (thân LPC của nhân vật, ngồi thiền) với các huyệt là chấm pixel. Huyệt vừa mở chớp sáng, một dòng "Huyệt Khí Hải khai: tu luyện +2% từ kiếp sau". Dòng tiếp: "Còn 2 kiếp nữa mở Mệnh Môn: ..." hoặc mốc gần nhất cho huyệt 11-36.
- [ ] Màn đầu thai: một dòng nhỏ "Chu Thiên 7/36" chạm vào mở bảng huyệt (tên, đã mở, cách mở; 6 huyệt cuối giữ bí ẩn như kết cục bí ẩn).
- [ ] Tài khoản đã có từ 10 kiếp: lần đầu vào sau bản này hiện cảnh "Chân thân thức tỉnh" một lần (10 huyệt sáng lần lượt, chạm để bỏ qua), đánh dấu đã xem trong meta.
- [ ] Thẻ khoe Khai Mạch (dùng `lib/shareCard.ts`): chân thân với số huyệt đã mở.
- [ ] Đo: `huyet_open` (id, lifeNo), `huyet_view`, `huyet_share`.
- [ ] Thử: Playwright 390x844 cho màn cáo biệt kiếp 1, kiếp 10, tài khoản cũ 40 kiếp; chụp ảnh gửi Tyler.
- Xong:
- Ghi chú:

## Ngày 3-4 - Sư Đồ
- [ ] Supabase (hàm mới, không sửa hàm cũ): bảng `vkl_master` (disciple pk, master, via 'link'|'auto', created_at, milestones jsonb). RPC `vkl_master_bind(token, master)`: chỉ gắn khi đệ tử có tối đa 3 kiếp và chưa có sư phụ, không tự bái mình. RPC `vkl_master_auto(token)`: ghép người đã Chứng Đạo, chơi trong 3 ngày qua, ít đệ tử nhất.
- [ ] Trigger trên `vkl_lives` (sau `lives_guard`): kiếp của đệ tử đạt Trúc Cơ, Kim Đan, phi thăng, Chứng Đạo lần đầu thì ghi mốc và gửi thư giang hồ cho sư phụ. Chống clone: chỉ tính đệ tử từ kiếp 3 trở đi, sư phụ tính tối đa 5 đệ tử mới mỗi ngày.
- [ ] Link mời `/?su=<tên>`: lưu cookie, gắn khi đăng ký. Nút "Thu đệ tử" ở màn Chứng Đạo và Tàng Kiếp Các mở bảng chia sẻ có thẻ OG riêng ("<tên> mời ngươi nhập môn").
- [ ] Trong kiếp đệ tử (kiếp 1-10): sự kiện "Sư phụ truyền đạo" một lần mỗi kiếp, bóng sư phụ hiện, 4 lựa chọn như sự kiện thường (nhận đan, nhận chỉ điểm, xin theo đi trừ yêu, cáo từ). Kiếp 1-3: sư phụ đỡ một lần chết.
- [ ] Danh hiệu sư phụ "Môn hạ 5/20/50 người" và khung bia, chỉ mỹ quan.
- [ ] Đo: `master_bind` (via), `master_event`, `master_mail_open`.
- Xong:
- Ghi chú:

## Ngoài game - Biên niên giang hồ (chờ Tyler bật)
- [ ] Task chạy 8h sáng thứ Hai: rút số tuần trước từ `vkl_lives`, `vkl_arena_champ` (tổng kiếp, Chứng Đạo kiếp đầu, mộ nhiều hương, kết cục hiếm, thọ tinh, Lôi đài), soạn bài cho Page và Threads, gửi Tyler duyệt. Không tự đăng.
- [ ] Mời khoảng 20-30 người đã Chứng Đạo còn chơi vào nhóm Facebook (cáo thị trong game), danh hiệu "Khai Tông Nguyên Lão" cho người vào đầu.

## Để sau
- Chạy ads lại: chỉ khi nhóm vào sau 4.5.0 có tỉ lệ còn chơi sau 7 ngày cao hơn mốc.
- 4.6.0 Mộng chung mỗi ngày (cả server cùng lá số, bảng ngày): cần máy chủ chấm lại kiếp trước.
- Lớp chân thân idle đầy đủ (đi cảnh, leo tháp, bản đồ nút, chọn 1/3): nối tiếp từ huyệt Bách Hội.

## Điều kiện dừng
Sau 2 tuần, nếu tỉ lệ còn chơi sau 7 ngày không tăng: giữ huyệt (rẻ, không hại), xem lại phần lợi ích; nếu Sư Đồ có dưới 5% người mới được gắn qua link thì bỏ phần link, giữ ghép tự động.
