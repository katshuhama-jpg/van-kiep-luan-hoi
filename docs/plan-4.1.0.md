# Kế hoạch 4.1.0 - mỗi ngày một phần

Nguồn: docs/research/lam-sau-he-thong.md (báo cáo "Làm sâu hệ thống Vạn Kiếp", mục 4.1.0, bảng Q1-Q8). Tyler chốt 29/10/2026: mỗi ngày đẩy 1-2 việc, không hiện bảng cập nhật; ngày cuối gom thành bản 4.1.0 có thông báo.

Mỗi lần chạy: làm khối **đầu tiên còn ô trống**, đánh dấu [x], ghi ngày và commit vào dòng "Xong:". Nếu khối nào làm dở thì ghi rõ còn thiếu gì ở dòng "Ghi chú:" để lần sau làm tiếp.

## Ngày 1 - Kết cục đúng cách chết, đo đạc, dòng tin ngày
- [ ] Q1: gắn `endTag` cho chết vì quái chặn đường (`khinh_dich` khi quái yếu hơn hoặc ngang, `tu_dia` khi quái mạnh hơn; ambush.ts:92), thua giao đấu (`dao_giang_ho`; duel.ts:530, fightLines.ts:86-93), oan gia thắng (events.ts:1467), sát thủ "cây cao đón gió" (fate.ts:187). `hurtCause` lấy vết thương nặng nhất trong 4 năm gần nhất (engine.ts:496) và gắn tag theo nguồn. Câu nguyên nhân nêu đích danh kẻ giết và tuổi.
- [ ] Đo đạc: track `ambush` và `duel` (kết quả, cảnh giới, tuổi), `forced_gap` (năm game kể từ trận bắt buộc trước); lưu `endTag` và `realm` vào `look` của mộ (đã có endTag, kiểm lại).
- [ ] Dòng "Hôm nay Thiên Đạo đã sửa: ..." ở trang đầu: file `lib/dailyNotes.ts` (mảng `{day, vi, en}`), component nhỏ hiện ghi chú của hôm nay hoặc hôm qua (tối đa 2 ngày), không bật bảng cập nhật. Mỗi lần chạy sau thêm 1 dòng.
- Xong:
- Ghi chú:

## Ngày 2 - Hết chết oan theo cảnh giới, nhịp kẻ địch
- [ ] Q2: rà 32 sự kiện phàm giới có lựa chọn `fatal` mà không có `maxRealm` (viết script đếm như báo cáo). Hoặc gắn `maxRealm`, hoặc nhân tỉ lệ chết theo khoảng cách cảnh giới. `ran_doc`: hết đan thì chết 0,4 chỉ khi realm ≤ 1, từ Trúc Cơ đổi thành mất sức khỏe và tăng tâm ma. `cuop_duong`: `maxRealm: 3`, từ Nguyên Anh trở lên thành bọn cướp quỳ xin tha (câu hài). Góp ý #29 (29/10): Luyện Hư vẫn chết vì nhà sập đè (events3.ts:481-488, động đất kho linh thạch) hoặc sửa cầu trượt chân (events.ts:294 giếng cổ và sự kiện sửa cầu) - từ Trúc Cơ trở lên các tai nạn phàm tục này chỉ gây thương, không chết. Trả lời #29 cùng #23.
- [ ] Q3: khoảng lặng giữa các trận bắt buộc (chặn đường, gặp người chơi, oan gia, cuop_duong, sat_thu): cách nhau ít nhất 3 năm game và 60 giây thời gian thực. Bỏ chặn đường khi sức khỏe dưới 35. Sau trận thua còn sống, tăng trọng số sự kiện cơ duyên trong 5 năm.
- Xong:
- Ghi chú:

## Ngày 3 - Tuổi 16 thành dốc, tích cốc
- [ ] Q4: tỉ lệ chết khi thua trừ yêu hoặc chặn đường nhân 0,3 ở 16 tuổi, tăng dần lên 1,0 ở 22 tuổi (combat.ts:827). Lần thua trừ yêu đầu tiên sau 16 tuổi của mỗi kiếp luôn chỉ trọng thương, kèm một câu "trưởng thành". Linh căn Tạp/Phế được chọn định hướng con đường từ Luyện Khí tầng 3 (engine.ts:878).
- [ ] Q5: từ Trúc Cơ, "tích cốc": bỏ tiền ăn, chi phí đổi tên thành linh dược, động phủ. Thiếu tiền thì tu vi chậm và thêm tâm ma, không trừ sức khỏe, không in câu nhịn đói. `chet_doi` chỉ cho cảnh giới dưới 2 (engine.ts:710-726). Trả lời góp ý #28.
- Xong:
- Ghi chú:

## Ngày 4 - Lời viếng có tên tuổi, lore, tông môn
- [ ] Q6: lời viếng mẫu (components/CondoPresets.tsx) sinh từ dữ liệu mộ: tên, cảnh giới, con đường, kết cục, kẻ giết, đạo lữ. Màn lập bia gợi ý 3 câu văn bia từ khoảnh khắc lớn nhất kiếp.
- [ ] Q7: thiên sát cô tinh không còn cha mẹ trong sự kiện; "đệ tử đầu tiên" theo thứ tự thật (#4). Tông môn chính phái phản ứng khi đệ tử đổi sang ma đạo, dùng cơ chế phản môn và lộ thân phận có sẵn (engine.ts:669-679) (#13).
- Xong:
- Ghi chú:

## Ngày 5 - Kinh tế, gom bản 4.1.0
- [ ] Q8: kéo hệ số bán đồ trùng (1 + 0,5×cảnh giới) và giá phường thị (1 + 0,25×cảnh giới) về cùng nhịp; từ Nguyên Anh giá theo phẩm; đồ cao cấp có số lượng giới hạn làm mới theo năm game (data.ts:892-895, combat.ts:766-794). Trả lời góp ý #14.
- [ ] Gom bản 4.1.0: thêm mục 4.1.0 vào lib/releases.ts (dạng `asked` cho các góp ý #12, #13, #14, #18, #22, #23, #24, #26, #28 với `short`), cập nhật docs/CONTEXT.md (số kết cục, quái, đồ theo code), soạn sẵn bài Threads tối thứ Ba 3/11 lúc 20h (kiếp kỳ lạ nhất tuần + những gì đã sửa) gửi Tyler duyệt, không tự đăng.
- Xong:
- Ghi chú:
