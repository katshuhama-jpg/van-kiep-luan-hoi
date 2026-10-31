# Kế hoạch 4.2.0 - nháp

Ghi lại các việc Tyler đã chốt cho 4.2.0. Chưa chia ngày; khi 4.1.0 xong (ngày 5) sẽ chia khối "Ngày N" như plan-4.1.0.md.

## Cân bằng độ khó sau 4.0.1 (Tyler chốt 31/10/2026: làm cả 4 cách)

Vì sao: ngày 2 của 4.1.0 (bản 4.0.1) bỏ các cái chết oan nên game dễ hơn rõ. Mô phỏng 4.000 kiếp chọn bừa (`npx tsx scripts/sim-do-kho.ts 4000`), so bản trước ngày 2 (c292647) với bản 4.0.1:

| | Trước | Sau 4.0.1 |
|---|---|---|
| Tuổi chết trung bình | 53 | 72 |
| Lên được Kim Đan | 48% | 57% |
| Lên được Nguyên Anh | 22% | 34% |
| Lên được Hóa Thần | 8,3% | 17,2% |
| Lên được Luyện Hư | 2,9% | 7,6% |

Phần dễ thêm (tính theo tỉ lệ lên Hóa Thần): khoảng lặng 3 năm giữa các trận khoảng +4 điểm, tai họa phàm tục không giết từ Trúc Cơ khoảng +2 điểm, phần còn lại (cướp đường có trần, hết bị ăn hiếp, giữ lại chút sức khỏe sau tai nạn phàm tục) khoảng +3 điểm. Ngày 3 của 4.1.0 (Q4 lá chắn tuổi 16, Q5 tích cốc) sẽ làm dễ thêm nữa, phải đo lại sau ngày 3.

Nguyên tắc: không đưa cái chết vô lý trở lại. Nguy hiểm dời về đúng tầm cảnh giới, và cái chết nào cũng đọc được lý do.

- [ ] C1. Hiểm cảnh xứng tầm từ Kim Đan: mỗi cảnh giới từ Kim Đan tới Độ Kiếp có vài sự kiện có thể chết, gắn `minRealm`, nguyên nhân đọc được và kết cục riêng (tâm ma kiếp, ma tu đoạt xá, bí cảnh sập, kẻ thù có tên theo hướng D1 của báo cáo). Không dùng lại kiểu chết phàm tục.
- [ ] C2. Dồn độ khó vào cửa đột phá: tăng nhẹ rủi ro đột phá và thiên kiếp từ Nguyên Anh, hiện rõ tỉ lệ trước khi bấm để người chơi tự chọn lúc liều.
- [ ] C3. Bù khoảng lặng: rút khoảng lặng từ 3 năm xuống 2 năm (`FORCED_GAP_YEARS` trong lib/game/helpers.ts), và trận đến sau khoảng lặng thì kẻ địch "tích sức" mạnh hơn một chút theo số năm đã lặng (có trần). Giữ 60 giây thật và luật bỏ chặn đường khi sức khỏe dưới 35.
- [ ] C4. Đổi cái chết thành cái giá: từ Trúc Cơ, tai nạn phàm tục (`pham` trong events) không giết nhưng tốn hơn: dưỡng thương vài năm (tu luyện chậm), rớt chút tu vi, có thể hỏng một món đồ không phải đồ truyền kiếp. Câu văn nói rõ đã mất gì.
- [ ] Đo: chạy `scripts/sim-do-kho.ts` trước và sau từng cách, ghi bảng vào đây; đối chiếu số thật từ sự kiện đo `death` (endTag, realm), `ambush`, `duel`, `forced_gap` sau 2-3 ngày.
- Mốc độ khó (Tyler chốt 31/10): không đo bằng một con số mà bằng một dải, để người chơi giỏi luôn có chỗ vượt lên.
  - Số thật 10 ngày tới 31/10 (vkl_lives, gần như toàn bộ trước 4.0.1), tỉ lệ kiếp lên được Hóa Thần: kiếp 1-3 của tài khoản 18,5%; kiếp 4-10 26%; kiếp 11-30 33%; kiếp 31+ 36%. Theo người chơi (59 người có từ 10 kiếp): 1/4 thấp nhất 20%, trung vị 30%, 1/4 cao nhất 43%, giỏi nhất 69%. Mô phỏng chọn bừa chỉ 8%, nên con số mô phỏng là sàn của người chơi ẩu, không phải độ khó người chơi thấy.
  - Mốc: sàn (mô phỏng chọn bừa) khoảng 10-12%; người mới (kiếp 1-3) khoảng 18-20%; trung vị người chơi khoảng 30%; trần để mở, người giỏi lên được 50% trở lên.
  - Cách giữ chỗ cho người giỏi: độ khó C1-C4 phải né được bằng lựa chọn (tỉ lệ hiện rõ, có đường an toàn đổi bằng cái giá khác), không phải xui rủi. Thêm chính sách "chọn khôn" vào sim-do-kho.ts (tránh lựa chọn ghi nguy/liều khi yếu, nghỉ khi sức khỏe thấp, đột phá khi đủ đan) và theo dõi khoảng cách giữa chọn bừa và chọn khôn: khoảng cách này chỉ được rộng ra, không được hẹp lại.
  - Trước khi làm C1-C4: lấy số thật sau 4.0.1 (từ 31/10) để biết 4.0.1 đã đẩy trung vị lên bao nhiêu, rồi mới chọn mức cho từng cách.

## Góp ý từ Threads (chưa chia ngày)

- [ ] T1. Sau phi thăng bế tắc (Threads, wh0scareanyway, 31/10, trả lời dưới bài "tu cao rồi thì dân làng phải tránh đường" - phần dân làng đã sửa ở 4.0.1, giờ là cùng chuyện đó ở tầng tiên giới): "Phi thăng xong farm quái khó mà ít rớt đồ, shop cũng không bán cái gì để mua, không có cách nào mạnh lên, còn bị mấy thằng Đại La Kim Tiên nó trấn lột suốt". Ba ý cần làm:
  - Rớt đồ ở Tiên giới, Ma giới: tăng tỉ lệ và phẩm đồ rớt khi săn quái từ cảnh giới 9 trở lên, rớt đúng tầm cảnh giới.
  - Phường thị sau phi thăng: có hàng để mua ở Tiên giới, Ma giới (đồ, đan theo cảnh giới), nối với Q8 của 4.1.0 (giá theo phẩm, đồ cao cấp giới hạn số lượng làm mới theo năm game).
  - Bị cao nhân trấn lột: kẻ chặn đường cảnh giới cao hơn mình quá nhiều thì phải có lối thoát (nộp ít hơn, chạy, nhờ tông môn), và tần suất giảm khi chênh lệch lớn. Đo trước bằng sự kiện `ambush`, `duel` của các kiếp ở cosmos tien/ma.
  - Trả lời trên Threads khi làm xong; chưa hứa ngày.
