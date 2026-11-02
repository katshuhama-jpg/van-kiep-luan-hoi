# Giữ chân người chơi: công pháp và linh thú

Viết 2/11/2026. Đây là đề xuất, chưa chốt lịch.

## Số liệu của mình

| Ngày | Phiên (sid) | Phút chơi trung vị | Phiên chơi trên 15 phút | Phiên chơi trên 30 phút |
|---|---|---|---|---|
| 28/10 | 361 | 3,6 | 115 (32%) | 76 (21%) |
| 29/10 | 281 | 5,5 | 104 (37%) | 61 (22%) |
| 30/10 | 216 | 6,4 | 78 (36%) | 51 (24%) |
| 31/10 (Threads) | 1339 | 2 | 400 (30%) | 259 (19%) |

- Một nửa số phiên dừng trước phút thứ 2-6. Thứ giữ chân phải hiện ra trong kiếp đầu, không phải sau 10 kiếp.
- Khoảng 1/3 người ở lại quá 15 phút. Nhóm này chơi nhiều kiếp, và họ là người cần lý do để quay lại ngày mai.
- Hiện tại thứ mang sang kiếp sau gần như chỉ có bia mộ và số kiếp. Linh thú đã có khoảng 30 loài và sổ `petBook`, nhưng chỉ để ngắm và kể chuyện, không có tác dụng.

## Các game khác làm gì

**Đại hiệp xin hãy quay lại (大侠请重来).** Mỗi kiếp là một đời random, chết thì mở đời mới. Thiên phú chọn lại mỗi đời và mở khóa dần. Võ học được lĩnh hội nhanh chậm theo ngộ tính, ghép thành chuỗi chiêu để khắc từng loại đối thủ, có hiệu ứng trúng độc, điểm huyệt, trọng thương. Cập nhật đều tay: bản 7.9.5 thêm 170 câu chuyện, 122 kỳ ngộ, 34 võ học. Trang giới thiệu không nói về thú cưng hay cơ chế truyền thừa chi tiết. ([51wan](https://www.51wan.com/azgame/dxqzl/))

**Capybara Go.** Mỗi lượt chơi, kể cả lượt thua, đều cộng vào nhiều thanh tiến trình song song. Năng lượng dư không mất mà để dành tới 6 ngày, nên nghỉ chơi không bị phạt. Tính năng mở dần theo chương, nên vài tuần sau vẫn có thứ mới. ([Mechanics Playbook](https://mechanics-playbook-next.pages.dev/case-studies/capybara-go/))

**Gold & Goblins** (D1 56% lúc ra mắt). Không dùng nhiệm vụ hằng ngày kiểu danh sách việc. Khi vòng chính chậm lại thì luôn có một mục tiêu gần để làm. Mỗi lần nâng cấp cho hệ số ngẫu nhiên x2 tới x100. Đơn vị mạnh nhất có được bằng cách ghép 4 thẻ hiếm. ([PocketGamer.biz](https://www.pocketgamer.biz/the-ins-and-outs-of-retention-in-an-idle-game-with-merge-and-puzzle-elements))

**Quỷ Cốc Bát Hoang (鬼谷八荒).** Công pháp có dòng thuộc tính ngẫu nhiên, hợp linh căn thì mạnh hơn, luyện lâu thì thục luyện tăng. Người chơi săn đúng bộ dòng mình cần. Phần này mình viết theo hiểu biết chung về game, chưa đối chiếu nguồn mới.

Rút ra 4 điều cho Vạn Kiếp:
1. Kiếp nào cũng phải để lại một thứ gì đó, kể cả kiếp chết năm 17 tuổi.
2. Thứ mang sang kiếp sau phải chọn được, không chỉ cộng dồn. Chọn mang gì là lý do bắt đầu kiếp mới.
3. Kết hợp tạo ra thứ mới mà người chơi chưa thấy. Họ sẽ đi tìm công thức và kể cho nhau nghe.
4. Không thêm nhiệm vụ ngày, không thêm năng lượng. Phiên của mình ngắn, cứ để người chơi chơi.

## Đề xuất 1: Công pháp có thật

Hiện "công pháp" chỉ là chữ trong sự kiện. Đề xuất biến nó thành đồ vật có tác dụng.

- **Có được từ đâu:** kỳ ngộ, kệ công pháp tông môn (đã có sự kiện), đoạt từ địch thủ, hội đấu giá, thương nhân. Kiếp đầu bảo đảm có 1 công pháp trước Luyện Khí 5, để người mới thấy hệ thống trong vài phút đầu.
- **Một công pháp gồm:** hệ (Kiếm, Đan, Phật, Ma, Thể, Phù... theo con đường), phẩm (Phàm tới Thiên), 1 tác dụng chính, 1-2 dòng phụ ngẫu nhiên. Ví dụ "Liệt Hỏa Kiếm Quyết (Huyền phẩm): +12% công. Dòng phụ: đánh kẻ hơn cảnh giới +8%".
- **Ô trang bị:** 1 tâm pháp (bị động, tu vi hoặc thọ nguyên) và 2 chiêu thức (xuất hiện trong câu đánh nhau, có hiệu ứng như phá giáp, trúng độc, hút máu).
- **Lên cấp:** thục luyện tự tăng theo năm game, tầng 1 tới 9. Không cần bấm gì thêm, hợp nhịp năm trôi nhanh.
- **Kết hợp:** hai chiêu cùng hệ đều tầng 9 thì có thể "dung hợp" ra một chiêu mới. Công thức ẩn, tìm ra thì ghi vào sổ.
- **Tàng Kinh Các:** sổ ghi mọi công pháp từng học qua các kiếp (đúng ý góp ý "học rồi mà không biết là công pháp gì").
- **Truyền thừa:** cuối kiếp, chọn 1 công pháp đã đạt tầng 9 để kiếp sau mang theo ở tầng 1. Đây là móc chính để bắt đầu kiếp mới.

## Đề xuất 2: Linh thú có tác dụng, tiến hóa, huyết mạch

Dựa trên 30 loài đã có sprite.

- **Tác dụng mỗi loài:** sói con +công khi bị chặn đường, hồ ly +phúc duyên, nấm linh hồi sức khỏe, ưng con báo trước để né 1 trận bắt buộc, chuột xám thỉnh thoảng tha linh thạch về... Mỗi loài 1 tác dụng, dễ nhớ.
- **Cấp:** linh thú lên cấp theo số năm đi cùng chủ.
- **Tiến hóa:** 3 bậc (ấu thú, linh thú, thần thú). Bậc tiến hóa cần chủ đạt cảnh giới đủ cao. Đổi tên, đổi màu sprite, tác dụng mạnh lên. Ví dụ sói con thành Huyết Lang rồi Thiên Lang.
- **Kết hợp (huyết mạch):** linh thú tiến hóa tới bậc 3 để lại một giọt huyết mạch trong sổ. Kiếp sau, linh thú mới có thể nhận huyết mạch đó, thừa hưởng 1 tác dụng phụ. Hai huyết mạch khác loài có tỉ lệ ra biến dị (màu lạ, tác dụng đôi). Mình không ghép hai con vật thành một, vì sẽ khó viết cho tử tế.
- **Sổ linh thú:** đã có `petBook`, chỉ cần thêm bậc tiến hóa và huyết mạch.

## Thứ tự gợi ý

| Việc | Công | Gợi ý bản |
|---|---|---|
| Linh thú có tác dụng, lên cấp, tiến hóa 3 bậc | M | 4.2.0 (đã có #26, #30 và lời hứa với người chơi) |
| Tàng Kinh Các (xem công pháp đã học) | S | 4.2.0 |
| Công pháp có tác dụng, ô trang bị, thục luyện | M-L | 4.2.0 hoặc 4.3.0 |
| Truyền thừa công pháp sang kiếp sau | S | cùng bản với công pháp |
| Dung hợp chiêu, huyết mạch linh thú | M | bản sau đó |

## Đo gì để biết có hiệu quả

- Thêm sự kiện `cp_get`, `cp_lv`, `cp_fuse`, `pet_evo`, `pet_blood`, `inherit_pick`.
- Mục tiêu: tỉ lệ phiên trên 15 phút từ khoảng 33% lên 40%, số kiếp trung bình mỗi tài khoản tăng, tỉ lệ quay lại hôm sau của người đã chọn truyền thừa cao hơn người chưa chọn.
