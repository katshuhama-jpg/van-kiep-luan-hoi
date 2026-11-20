# Việc đang làm (đọc MỖI ĐÊM, chỉ file này)

Tạo 19/11/2026 (Tyler: bản 4.5, 4.6 đã lên, đọc cả file plan cũ mỗi đêm tốn token). File này chỉ chứa luật thường trực và các khối CÒN Ô TRỐNG.
- Khối làm xong hết: cắt cả khối khỏi file này, dán vào cuối `docs/luu-tru/xong-2026-11.md` (kèm dòng "Xong:"), để file này luôn ngắn.
- Khối mới (Tyler giao, góp ý, tăng trưởng nhiều đêm): thêm vào đây theo mẫu "## Ngày N - tên", dòng "Lên bản: YYYY-MM-DD", các ô [ ], "Ghi chú:".
- Lịch sử cũ ở `docs/luu-tru/` (plan-4.1.0.md, plan-4.5.0.md, plan-4.6.0.md, xong-2026-11.md, tang-truong cũ). KHÔNG đọc cả file; chỉ `grep -n` từ khóa khi khối đang làm nhắc tới.
- Khối đụng Sơn Môn: đọc thêm `docs/son-mon-luat.md`. Bản đồ code: `grep -n '^#' docs/CONTEXT.md` rồi chỉ đọc mục cần, không đọc cả file.
- File thiết kế lớn (`docs/thien-thu-3.md` khoảng 74KB): chỉ đọc mục chặng đang làm (`grep -n "^#"` để tìm), không đọc cả file.

DUYỆT: Tyler 14/11/2026 (các khối trong file này coi như đã duyệt; khối mới Tyler giao trong chat cũng đã duyệt).

## Luật thường trực

Lên bản: mỗi đêm làm mọi khối còn ô trống có "Lên bản" bằng hoặc trước ngày lên bản, đẩy `next` khi xong; đánh dấu bằng NHÁNH `len-ban-<YYYY-MM-DD>` (máy chủ chặn tag), chỉ khi thử sạch; tác vụ 5:00 đẩy `main`. Khối ghi "giấu sau cờ" thì tắt mặc định tới khối bật cờ.

Trả lời góp ý (Tyler 31/10): việc chưa làm, chưa có trong plan có ngày thì KHÔNG trả lời, để status `moi`. Chỉ trả lời khi đã làm xong, hoặc đã có lịch thì nêu ngày và bản. Không viết "bản sau", "đang làm", "vài ngày tới", "đã ghi nhận". Mỗi lần trả lời một góp ý tặng 10 phúc (Tyler 6/11); `vkl_gift.to_player` là USERNAME, không phải player_id.

Cáo thị (Tyler 2/11, 4/11): mỗi ý một câu ngắn nói CÓ GÌ MỚI và GỢI Ý CHỖ TÌM; không số tỉ lệ, công thức, bảng giá, % buff, danh sách tên đầy đủ; mỗi nhóm tối đa 3 ý. Bản lớn có `hero`, `lead` 2-3 câu, `features` 3-4 thẻ, `cta` (mẫu: mục 4.2.0 trong lib/releases.ts); `more` chỉ cho bản nhỏ.

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

## Ngày 8f - Chọn thế giới khởi đầu khi đầu thai (giấu sau cờ)
Lên bản: 2026-11-22 (làm 20-21/11, mỗi đêm một phần, giấu sau cờ `KHOI_DAU_ON`). Có cáo thị khi bật. Nguồn: `docs/thiet-ke-hau-ky.md` mục 3 (Phàm, Tu chân, Tiên, Hồng Hoang; mở khi đạt mốc 5 lần; phúc duyên x0,8 / x0,6 / x0,5; ô khóa ghi lý do ngay trên ô).
- [ ] Máy: đếm số lần đạt Kim Đan / phi thăng / Khai Thiên qua các kiếp (Meta), màn chọn ở bước đầu thai (mặc định Phàm giới, người mới không thấy ô khác).
- [ ] Khởi tạo nhân vật theo khởi đầu (tuổi, cảnh giới, chỉ số như người chăm tu); kiếp bỏ qua đoạn đầu không tính bảng xếp hạng tuổi; Lực chiến Sơn Môn chỉ tính năm sống thật.
- [ ] Mô phỏng `sim-do-kho 3000` và `sim-farm 200` trước/sau; đo `khoi_dau`, thời gian một kiếp, số kiếp mỗi ngày của nhóm Khai Thiên.
- [ ] uiux-pro-max + huashu-design (2 vai) + humanizer, rồi bật cờ.
- Ghi chú:

## Ngày 10 - Kỷ 2 làm sớm: giao diện, bật cờ
Lên bản: 2026-11-21. Bật cờ `SM_DAT_ON` lúc 5:00 21/11 (điểm bắt đầu tính). Có cáo thị 4.6.2 (bản mới; 4.6.1 đã dùng cho 20/11): "Đất có giá": Linh Mạch, Thiên Trì, yêu thú, điểm giữ đất, luật dải sức mạnh.
- [ ] Bản đồ: biểu tượng pixel Linh Mạch (mạch ngọc xanh), Thiên Trì (hồ sen vàng), yêu thú (đầu thú đỏ, ghi lực giữ); chú thích; chạm ô ghi "+3 điểm mỗi giờ, +2 Khí vận mỗi sáng".
- [ ] Yêu thú dùng icon có sẵn ở `public/cws/thu/a1..a11.webp` (128px, Cultivation World Simulator, CC BY-NC-SA 4.0; Tyler duyệt 20/11): thỏ trắng a1, trâu lửa a2, xà băng a3, sói đen a4, hươu ngọc a5... (xem ảnh để chọn); mỗi ô yêu thú một con cố định theo tọa độ. Không phóng to quá 128px; ô nhỏ hơn thì để trình duyệt thu nhỏ (không image-rendering pixelated khi thu không nguyên lần). Thêm dòng "Biểu tượng yêu thú" vào mục Cảnh sơn môn ở /tac-gia.
- [ ] Môn nhà: thẻ Lãnh thổ thêm "Điểm Kỷ: 1.240 · +9 mỗi giờ"; Xếp hạng Kỷ theo điểm (vẫn ghi số ô).
- [ ] Xuất chinh: ô ngoài dải ghi lý do "Môn này yếu hơn 1/3 môn ta, đánh không được trừ ở Linh Mạch và Thiên Trì"; ô yêu thú ghi "Đánh máy, thắng mỗi người +10 phúc duyên".
- [ ] Luật Sơn Môn: thêm câu hỏi "Điểm giữ đất là gì?", "Yêu thú là gì?", "Sao không đánh được môn kia?"; thẻ 3 câu đổi câu 3: "Hết Kỷ, môn nhiều Điểm giữ đất nhất thắng".
- [ ] uiux-pro-max + humanizer cho mọi màn mới; `smoke-son-mon` thêm màn Linh Mạch, yêu thú, ô ngoài dải.
- [ ] Bài đăng Page + Group cho Tyler tự đăng (không tự đăng): "Từ hôm nay đất có giá".
- Ghi chú:
  - Trả lời góp ý cho tác vụ 5:00 gửi (đêm 19/11, kèm 10 phúc, `vkl_gift.to_player` là username):
    - #297 (godwhale99), reply_ver '4.6.0': "Cảm ơn bạn đã báo. Từ bản sáng 20/11, danh sách Trừ yêu xếp theo cấp quái từ thấp tới cao rồi nhé. Mình gửi bạn 10 phúc duyên."

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
