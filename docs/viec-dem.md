# Việc đang làm (đọc MỖI ĐÊM, chỉ file này)

Tạo 19/11/2026 (Tyler: bản 4.5, 4.6 đã lên, đọc cả file plan cũ mỗi đêm tốn token). File này chỉ chứa luật thường trực và các khối CÒN Ô TRỐNG.
- Khối làm xong hết: cắt cả khối khỏi file này, dán vào cuối `docs/luu-tru/xong-2026-11.md` (kèm dòng "Xong:"), để file này luôn ngắn.
- Khối mới (Tyler giao, góp ý, tăng trưởng nhiều đêm): thêm vào đây theo mẫu "## Ngày N - tên", dòng "Lên bản: YYYY-MM-DD", các ô [ ], "Ghi chú:".
- Lịch sử cũ ở `docs/luu-tru/` (plan-4.1.0.md, plan-4.5.0.md, plan-4.6.0.md, xong-2026-11.md, tang-truong cũ). KHÔNG đọc cả file; chỉ `grep -n` từ khóa khi khối đang làm nhắc tới.
- Khối đụng Sơn Môn: đọc thêm `docs/son-mon-luat.md`. Bản đồ code: `grep -n '^#' docs/CONTEXT.md` rồi chỉ đọc mục cần, không đọc cả file.
- File thiết kế lớn (`docs/thien-thu-3.md` khoảng 74KB): chỉ đọc mục chặng đang làm (`grep -n "^#"` để tìm), không đọc cả file.

DUYỆT: Tyler 14/11/2026 (các khối trong file này coi như đã duyệt; khối mới Tyler giao trong chat cũng đã duyệt).

## Mục tiêu Kỷ 2 (Tyler 20/11 18:30)
Mọi khối trong sổ này phải lên trang trước 5:00 ngày 1/12, để Kỷ 2 (kết Kỷ 1 lúc 21:00 1/12, mở 2/12) bắt đầu đủ tính năng. Chỉ có phiên đêm 21:17, không có phiên ban ngày (Tyler chốt 20/11). Mỗi đêm làm mọi khối có "Lên bản" bằng hoặc trước ngày lên bản kế tiếp, KHỐI QUÁ HẠN LÀM TRƯỚC. Số liệu chỉ để đo, không chặn lịch. Khối nào tới đêm 30/11 vẫn chưa thể làm sạch thì để sau cờ, ghi lý do và báo Tyler trong tin cuối phiên.

Đêm nào không kịp hết thì làm theo thứ tự: (1) khối quá hạn; (2) khối Kỷ 2 cần để mở đúng 2/12: luật Sơn Môn Ngày 30, vòng cày chân thân Ngày 22-24, đồ chân thân Ngày 26 + 31, đi cảnh Ngày 27-29; (3) Thiên thư III Ngày 8g; (4) đường tu Võ/Nho Ngày 33-34 và công pháp chân thân Ngày 32a/32b; (5) Nhóm CWS Ngày 13-21; (6) cốt truyện Ngày 35, tối thiểu 5 mỗi đêm. Khối bị đẩy lùi thì ghi rõ ngày lên bản mới vào tin cuối phiên.

## Luật thường trực

Lên bản: mỗi đêm làm mọi khối còn ô trống có "Lên bản" bằng hoặc trước ngày lên bản, đẩy `next` khi xong; đánh dấu bằng NHÁNH `len-ban-<YYYY-MM-DD>` (máy chủ chặn tag), chỉ khi thử sạch; tác vụ 5:00 đẩy `main`. Khối ghi "giấu sau cờ" thì tắt mặc định tới khối bật cờ.

Trả lời góp ý (Tyler 31/10): việc chưa làm, chưa có trong plan có ngày thì KHÔNG trả lời, để status `moi`. Chỉ trả lời khi đã làm xong, hoặc đã có lịch thì nêu ngày và bản. Không viết "bản sau", "đang làm", "vài ngày tới", "đã ghi nhận". Mỗi lần trả lời một góp ý tặng 10 phúc (Tyler 6/11); `vkl_gift.to_player` là USERNAME, không phải player_id. Góp ý đã làm xong thì ghi kèm status `da_xong` để tác vụ 5:00 đổi luôn (Tyler 20/11: #297 có trả lời mà vẫn nằm ở mục chưa giải quyết); reply_ver là đúng số bản cáo thị chứa việc đó.

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
- [ ] Chọn con đường khi khởi đầu ngoài Phàm giới (Tyler hỏi 20/11 17:45): Tu chân giới bắt đầu ở Trúc Cơ nên bỏ qua lúc chọn con đường thường lệ. Sau khi chọn ô thế giới (khác Phàm giới), hiện thêm một hàng chọn con đường: Kiếm, Đan, Trận, Phật, Ma, Yêu tu. Chỉ mở những đường người chơi đã từng đi ít nhất 1 kiếp (đếm từ vkl_lives.path); đường chưa đi thì khóa và ghi ngay trên ô "Chưa từng đi đường này". Vẫn giữ điều kiện cũ: Phật tu cần nghiêng chính, Ma tu cần nghiêng tà (đạo tâm khởi đầu đặt theo đường chọn), Yêu tu chỉ khi xuất thân yêu tộc. Mặc định chọn sẵn đường của kiếp gần nhất, nên người không muốn nghĩ chỉ cần bấm Đầu thai. Tiên giới: Ma tu vào Ma giới tầng 1 thay vì Tiên giới (ô ghi "Thượng giới" và đổi theo đường). Hồng Hoang: thêm chọn hướng tiên / ma / hư theo thang Hồng Hoang đã chốt, mặc định hướng của lần chứng đạo gần nhất. Ghi `khoi_dau_path` vào vkl_events để đo.
- [ ] Khởi tạo nhân vật theo khởi đầu (tuổi, cảnh giới, chỉ số như người chăm tu); kiếp bỏ qua đoạn đầu không tính bảng xếp hạng tuổi; Lực chiến Sơn Môn chỉ tính năm sống thật.
- [ ] Mô phỏng `sim-do-kho 3000` và `sim-farm 200` trước/sau; đo `khoi_dau`, thời gian một kiếp, số kiếp mỗi ngày của nhóm Khai Thiên.
- [ ] uiux-pro-max + huashu-design (2 vai) + humanizer, rồi bật cờ.
- Ghi chú:

## Ngày 10 - Kỷ 2 làm sớm: giao diện, bật cờ
Lên bản: 2026-11-21. Bật cờ `SM_DAT_ON` lúc 5:00 21/11 (điểm bắt đầu tính). Có cáo thị 4.6.2 (bản mới; 4.6.1 đã dùng cho 20/11): "Đất có giá": Linh Mạch, Thiên Trì, yêu thú, điểm giữ đất, luật dải sức mạnh.
- [x] Bản đồ: biểu tượng pixel Linh Mạch (mạch ngọc xanh), Thiên Trì (hồ sen vàng), yêu thú (đầu thú đỏ, ghi lực giữ); chú thích; chạm ô ghi "+3 điểm mỗi giờ, +2 Khí vận mỗi sáng".
- [x] Yêu thú dùng icon có sẵn ở `public/cws/thu/a1..a11.webp` (128px, Cultivation World Simulator, CC BY-NC-SA 4.0; Tyler duyệt 20/11): thỏ trắng a1, trâu lửa a2, xà băng a3, sói đen a4, hươu ngọc a5... (xem ảnh để chọn); mỗi ô yêu thú một con cố định theo tọa độ. Không phóng to quá 128px; ô nhỏ hơn thì để trình duyệt thu nhỏ (không image-rendering pixelated khi thu không nguyên lần). Thêm dòng "Biểu tượng yêu thú" vào mục Cảnh sơn môn ở /tac-gia.
- [x] Môn nhà: thẻ Lãnh thổ thêm "Điểm Kỷ: 1.240 · +9 mỗi giờ"; Xếp hạng Kỷ theo điểm (vẫn ghi số ô).
- [x] Xuất chinh: ô ngoài dải ghi lý do "Môn này yếu hơn 1/3 môn ta, đánh không được trừ ở Linh Mạch và Thiên Trì"; ô yêu thú ghi "Đánh máy, thắng mỗi người +10 phúc duyên".
- [x] Luật Sơn Môn: thêm câu hỏi "Điểm giữ đất là gì?", "Yêu thú là gì?", "Sao không đánh được môn kia?"; thẻ 3 câu đổi câu 3: "Hết Kỷ, môn nhiều Điểm giữ đất nhất thắng".
- [ ] uiux-pro-max + humanizer cho mọi màn mới; `smoke-son-mon` thêm màn Linh Mạch, yêu thú, ô ngoài dải.
- [ ] Bài đăng Page + Group cho Tyler tự đăng (không tự đăng): "Từ hôm nay đất có giá".
- Ghi chú:
  - 20/11 ~8h (Tyler: "cho ô yêu thú lên luôn", chọn bật cả Kỷ 2 ngay): bật cờ sớm (cfg dat.bat_dau = lúc bật), chạy sm_dat_5h tay: 8 yêu thú, 12 Linh Mạch, Thiên Trì; điểm tính từ giờ chẵn kế tiếp. Cáo thị 4.6.2 làm luôn; dòng "Từ 5:00 21/11" ở 4.6.1 đã bỏ. Còn: thêm màn Linh Mạch/yêu thú/ngoài dải vào smoke-son-mon, bài đăng Page + Group.
  - Trả lời góp ý cho tác vụ 5:00 gửi (đêm 19/11, kèm 10 phúc, `vkl_gift.to_player` là username):
    - #297 (godwhale99), reply_ver '4.6.0': "Cảm ơn bạn đã báo. Từ bản sáng 20/11, danh sách Trừ yêu xếp theo cấp quái từ thấp tới cao rồi nhé. Mình gửi bạn 10 phúc duyên."

## Ngày 11 - Pháp bảo Sơn Môn có tác dụng trong trận (Kỷ 2)
Lên bản: 2026-12-01. Không cáo thị riêng (đã báo ở 8a).
- [ ] Nối `vkl_priv.sm_lc_bv` vào tính trận và lực giữ (hàm mới thay thế cho Kỷ 2, Kỷ 1 đã kết giữ nguyên). Chạy `sm_phat_thuong(1)` lúc kết Kỷ 1 (21:00 1/12) và kiểm tra ai nhận gì, gửi Tyler danh sách.
- [ ] Tạo Kỷ 2 (từ 2/12) theo luật đã chốt ở Ngày 9-10.
- Ghi chú:

## Kế hoạch học từ Cultivation World Simulator - nhóm A, B, D (Tyler duyệt 20/11 13:47)
Nguồn chi tiết: doc Docs "Kế hoạch VKLH học từ CWS (A-B-C-D)" (container {"kind":"project","id":"8d528041-e043-4ee5-9220-1323e6324b5b"}), báo cáo Project `claude/hoc-tu-cultivation-world-simulator.md`. Nhóm C CHƯA làm (chờ D7 sau Kỷ 2, xem lại từ 8/12).
Luật chung cho các khối Ngày 13-21:
- Kiếp 1 không nặng thêm: việc thêm màn, thêm hệ thống, thêm chữ chỉ bật từ kiếp 2 (trừ A2, A4 ghi rõ).
- Mỗi hệ quả có một dòng "vì sao" ngay trên màn, nêu tên người hoặc việc gây ra (vd "Tình kiếp - vì ngươi đã kết đạo lữ với Lâm Nhi").
- Kiểm trạng thái trước khi bật sự kiện: người đã chết, đã đổi kiếp, quan hệ đã đứt thì không kéo vào như người sống. Viết test ép từng trường hợp.
- Mỗi việc giấu sau cờ riêng, bật trong cùng đêm khi thử sạch. Có cáo thị ngắn theo luật cáo thị. Thêm dòng vào "Sổ cải thiện tính năng" (tang-truong.md) với chỉ số đo ghi trong khối.
- Chữ mới: story-writing + script-writing + humanizer, tra bảng thuật ngữ Project `claude/glossary-tu-tien-cws.csv`; thuật ngữ game đã dùng thì giữ.
- Thưởng mới phải nhỏ; đụng phúc duyên hay đồ thì chạy `sim-farm`/`sim-do-kho` trước/sau.
- Lịch dời 20/11 17:15 để chen vòng tu vi chân thân (Ngày 22-24) lên trước; nhóm A từ 24/11. Mục tiêu chung: còn chơi nhóm 2-3 kiếp 1% → 5%, nhóm 4-10 kiếp 6% → 12%, D1 người mới 26-30% → 35%. Xem lại 30/11 và 7/12, ghi vào tang-truong.md.

## Ngày 13 - A1 Kiếp nạn duyên nợ + D phần 1
Lên bản: 2026-11-23. Cờ `KN_DUYEN_ON`. Có cáo thị.
- [ ] Lúc độ kiếp lớn (Trúc Cơ trở lên), nếu kiếp này có quan hệ thì kiếp nạn đổi loại: có đạo lữ/kết duyên → Tình kiếp (đạo lữ bị bắt, bị tâm ma nhập, hoặc chọn giữa đạo lữ và đạo); có kẻ thù (ghi thù, truy nã, giết người có thân nhân) → Báo thù tìm tới đúng lúc độ kiếp; có sư đồ (Sư Đồ, đồ đệ phản sư hay bị bỏ) → Đồ đệ quay về (trợ lực hoặc tâm ma). Nhiều loại thì chọn loại có quan hệ gần nhất. Không có quan hệ thì kiếp nạn như cũ.
- [ ] Mỗi loại 4 lựa chọn như sự kiện thường; đầu màn dòng "vì sao" có tên người. Tỉ lệ sống chết GIỮ NGUYÊN như kiếp nạn hiện tại (chỉ đổi lời và lựa chọn); lựa chọn đúng với quan hệ (cứu đạo lữ, hóa giải thù) cho thưởng nhỏ hoặc mở kết cục mới. Người liên quan đã chết → bản "di nguyện"/"hồn ma".
- [ ] Chữ: 3 loại × 4 giới (phàm, tiên, ma, hư) × 2 nhánh (qua, không qua) = 24 đoạn + 12 câu lựa chọn, mỗi đoạn tối đa 3 câu. Có thể thêm 1-3 kết cục Sổ Sinh Tử ("Vì tình mà tan", "Nợ máu trả bằng máu"...), tìm trùng trước.
- [ ] Thử: `sim-do-kho 3000` không đổi tỉ lệ chết; test ép rnd cho cả 3 loại, cả người liên quan còn sống và đã chết.
- [ ] D phần 1: lấy 20 sự kiện người chơi gặp nhiều nhất ở kiếp 2-10 từ vkl_events (ghi danh sách vào Ghi chú khối này để các đêm sau dùng). Viết 5 sự kiện đầu × 3 giọng: sử ký (trang trọng), chợ búa (người qua đường kể, hơi hài), thơ (câu ngắn, vần nhẹ). Luật: kiếp 1 luôn giọng gốc; từ kiếp 2, gặp lại sự kiện cũ có khoảng 30% ra giọng khác. Cờ `GIONG_VAN_ON`.
- [ ] Đo: tỉ lệ người gặp kiếp nạn duyên nợ chơi tiếp kiếp kế so với kiếp nạn thường; số kết cục mới mở.
- Ghi chú:

## Ngày 14 - A3 Ý nguyện kiếp này + D phần 2
Lên bản: 2026-11-24. Cờ `Y_NGUYEN_ON`. Có cáo thị.
- [ ] Từ kiếp 2, màn đầu thai có 3 ý nguyện bốc ngẫu nhiên từ khoảng 12 cái (vd Tìm một đạo lữ, Lọt bảng xếp hạng tuần, Báo thù kiếp trước, Sống qua 500 tuổi, Vào Kim Đan trước 100 tuổi, Lập môn phái, Nuôi linh thú tới bậc cao, Không giết ai...) và nút "Tùy duyên" bỏ qua. Một lần bấm, không thêm màn. Người mới (kiếp 1) không thấy.
- [ ] "Báo thù kiếp trước" chỉ hiện khi kiếp trước có kẻ thù thật. Sự kiện trong kiếp nghiêng nhẹ theo ý nguyện (tăng trọng số loại sự kiện liên quan, không ép).
- [ ] Toại nguyện: thưởng nhỏ phúc duyên, bia mộ thêm "Đã toại nguyện: ..."; không xong: bia ghi "Ôm hận: ...". Đủ 10 ý nguyện khác nhau toại nguyện thì mở một danh hiệu (nối vào hệ danh hiệu sưu tầm đang có).
- [ ] Chữ: 12 ý nguyện × (câu mở, câu toại nguyện, câu ôm hận).
- [ ] D phần 2: sự kiện 6-10 × 3 giọng.
- [ ] Đo: tỉ lệ chọn ý nguyện thay vì Tùy duyên, tỉ lệ toại nguyện, còn chơi nhóm 2-3 và 4-10 kiếp.
- Ghi chú:

## Ngày 15 - A2 Cơ duyên có manh mối + D phần 3
Lên bản: 2026-11-24. Cờ `DIEM_CO_DUYEN_ON`. Có cáo thị. Bật cả kiếp 1 (chỉ một dòng chữ, dùng lại nút trọng tâm năm sẵn có).
- [ ] Một số kỳ ngộ để lại "điềm" (vd "Phía Tây Nam có ánh tử khí bốc lên ba đêm liền"), hiện ở góc màn 3-5 năm game, mỗi điềm gắn với một trọng tâm năm. Năm nào người chơi chọn trọng tâm khớp thì cơ duyên mở. Mỗi kiếp tối đa 2 điềm.
- [ ] Kết quả: khoảng 35% đồ, 35% phúc (tu vi, tuổi thọ), 20% tay trắng (lời dẫn hài, không tức), 10% bị thương nhẹ. Hết hạn chưa đuổi: điềm tan, một dòng "Cơ duyên đã lỡ". Đồ và phúc theo dải cảnh giới, không lạm phát.
- [ ] Chữ: 12 điềm × 4 kết quả = 48 đoạn ngắn.
- [ ] D phần 3: sự kiện 11-15 × 3 giọng.
- [ ] Đo: tỉ lệ đuổi theo điềm; tỉ lệ xong kiếp 1 ở người có điềm so với không có.
- Ghi chú:

## Ngày 16 - A4 Lời sấm đầu kiếp, A5 Biệt hiệu tự sinh + D phần 4
Lên bản: 2026-11-25. Cờ `SAM_DAU_KIEP_ON`, `BIET_HIEU_ON`. Có cáo thị (A5; A4 đang thử thì chưa báo).
- [ ] A4: kiếp 1 và kiếp đầu tiên mỗi ngày mở bằng một câu sấm mơ hồ (vd "Kẻ mặc áo trắng sẽ cứu ngươi hai lần"), gắn với một loại sự kiện có sẵn để ứng nghiệm NGAY trong kiếp đó; lúc ứng hiện lại câu sấm kèm dấu đỏ. Chỉ là chữ, không đổi chỉ số. Khác lời tiên tri cuối kiếp đang có (hook.ts, ứng ở kiếp sau), không đụng cái cũ. 20 câu sấm.
- [ ] A4 chạy A/B 50/50 theo sid ở người mới tới 30/11, ghi nhóm vào vkl_events; đêm 30/11 so tỉ lệ xong kiếp 1 và D1, nhóm tốt hơn thắng (bật cho mọi người mới trước Kỷ 2 nếu thắng), ghi kết luận vào Sổ cải thiện.
- [ ] A5: kiếp đủ khoảng 3 chuyện lớn và 20 chuyện nhỏ thì được biệt hiệu ghép từ danh sách: tiền tố theo hành vi nổi nhất (giết nhiều, sống lâu, nhiều đạo lữ, chết lãng xẹt, giàu...) + hậu tố theo đường tu (vd "Độc Thủ Thư Sinh", "Kiếm Si", "Lão Quái Ngàn Năm"). Hiện ở bia, nghĩa trang, thẻ Lôi Đài. Không gõ tự do. Nối vào hệ danh hiệu đang có (danh hiệu tuần `vkl_titles_char`, danh hiệu sưu tầm), không làm hệ thứ hai.
- [ ] D phần 4: sự kiện 16-20 × 3 giọng, rồi bật hẳn `GIONG_VAN_ON` nếu chưa bật.
- [ ] Đo: A4 theo A/B; A5 số lượt xem nghĩa trang và bia có biệt hiệu.
- Ghi chú:

## Ngày 17 - B1 Nhân/Địa/Thiên bảng theo dải cảnh giới
Lên bản: 2026-11-25. Cờ `BANG_DAI_ON`. Có cáo thị.
- [ ] `/bang-xep-hang` thêm 3 tab bảng tuần: Nhân bảng (Luyện Khí tới Kim Đan), Địa bảng (Nguyên Anh tới Độ Kiếp), Thiên bảng (sau phi thăng và Hồng Hoang). Mỗi bảng top 10, xếp theo thành tích tốt nhất trong tuần ở dải đó. Một người đứng được nhiều bảng.
- [ ] Thưởng chỉ mỹ quan (khung tên, danh hiệu tuần), không chỉ số. RPC mới, không sửa vkl_leaderboard cũ.
- [ ] Đo: số người mở tab bảng mỗi ngày; còn chơi ở người từng lọt Nhân bảng.
- Ghi chú:

## Ngày 18 - B5 Thẻ "Một đời" và "Ân oán hai ta"
Lên bản: 2026-11-26. Cờ `THE_MOT_DOI_ON`. Có cáo thị.
- [ ] Một đời: hết kiếp có nút "Lưu thẻ" ra ảnh dọc pixel (tên, biệt hiệu, cảnh giới, 3 chuyện lớn nhất, cách chết, câu sấm hay ý nguyện nếu có, link game kèm mã mời). Dùng lại hạ tầng Thất Nhật Lục (`lib/wrapCard.ts`, link `/k/<mã>`), không làm hạ tầng mới.
- [ ] Ân oán hai ta: hai người chơi thật đã chạm mặt nhau từ 3 lần trở lên (đồng đạo, địch thủ, kết nghĩa, truy nã, Oan gia) thì mở được thẻ tóm tắt các lần gặp, gửi link cho đối phương.
- [ ] Không lộ tên đăng nhập; người tắt hiện mình trong kiếp người khác thì không lên thẻ Ân oán. Người mới vào qua link thẻ tính như kênh mời.
- [ ] Đo: số thẻ lưu mỗi ngày, lượt mở link thẻ, người mới và D1 từ link thẻ (kênh mời hiện giữ chân khoảng 29%).
- Ghi chú:

## Ngày 19 - B2 Di vật trong mộ
Lên bản: 2026-11-29. Cờ `DI_VAT_ON`. Có cáo thị.
- [ ] Mỗi bia giữ một "di vật" là BẢN SAO một món đồ của kiếp đó, yếu hơn bản gốc một bậc. Kiếp người khác có thể gặp kỳ ngộ "Cúng mộ tiền bối" (bóng người chơi thật): chọn cúng thì nhận di vật. Chủ mộ không mất gì, nhận thư "Có hậu nhân kế thừa di vật của ngươi" và một ít phúc duyên. Mỗi mộ cho tối đa 3 người nhận.
- [ ] Chỉ hành động tích cực: KHÔNG có đào trộm lấy đồ người thật.
- [ ] `sim-farm` trước/sau để di vật không thành nguồn đồ dễ.
- [ ] Đo: số lượt cúng mộ; tỉ lệ chủ mộ quay lại sau khi nhận thư.
- Ghi chú:

## Ngày 20 - B4 Người Hồng Hoang chọn thiên tượng ngày mai
Lên bản: 2026-12-01. Cờ `PHIEU_THIEN_TUONG_ON`. Có cáo thị.
- [ ] Mỗi tối người đã Khai Thiên (hoặc Chân Nhân nếu đã có) bỏ phiếu 1 trong 3 thiên tượng cho cả server ngày hôm sau; thiên tượng thắng thay cho thiên tượng ngẫu nhiên. Trang chủ ghi "Thiên tượng hôm nay do X và N người khác định" (X = người bỏ phiếu sớm nhất cho thiên tượng thắng). Một phiếu mỗi ngày.
- [ ] Làm như bản cả-server của tầng "Gọi Tên" trong Chân Nhân (`docs/thiet-ke-hau-ky.md`), dùng chung chỗ hiển thị, không làm hệ riêng. Nếu Chân Nhân chưa có thì mở cho người Khai Thiên trước, sau gắn vào Gọi Tên.
- [ ] Chốt phiếu bằng pg_cron trước 5:00, tránh đè giờ phát thưởng Kỷ 1 (21:00 1/12).
- [ ] Đo: tỉ lệ người Hồng Hoang bỏ phiếu mỗi ngày; còn chơi nhóm Khai Thiên.
- Ghi chú:

## Ngày 21 - B3 Thiên cơ theo Kỷ
Lên bản: 2026-11-29. Cờ `THIEN_CO_ON`. Có cáo thị (chỉ gợi ý có "chân tướng", không lộ nội dung).
- [ ] Mỗi Kỷ Sơn Môn có một "chân tướng" bí ẩn (vd "Bầu trời là một tấm lưới"). Mảnh rơi ngẫu nhiên, hiếm, trong kiếp. Ai gom đủ 7 mảnh đầu tiên được chọn: Công bố (cả server buff một ngày, tên lên trang chủ và Biên niên) hoặc Giữ kín (mở một kết cục ẩn chỉ người đó có). Quyết xong thì mảnh ngừng rơi tới Kỷ sau.
- [ ] Viết thành nhánh phụ của Thiên thư (dùng chỗ hiển thị Sổ Sinh Tử / Thiên thư), không làm hệ mới. Chân tướng Kỷ 2 viết bằng story-writing, nối với mạch Vạn Kiếp Chân Nhân.
- [ ] Đo: số người có ít nhất 1 mảnh; số người nhắc tới chân tướng trên Fanpage và Group (nếu đọc được).
- Ghi chú:

## Ngày 30 - Sơn Môn: phạt đánh thua, bỏ ô, đất liền, yêu thú ngẫu nhiên, Linh Mạch ẩn
Lên bản: 2026-11-21. Tyler giao 20/11 17:32. Làm SAU Ngày 12, TRƯỚC Ngày 22. Có cáo thị (vào bản 4.6.4 hoặc bản mới nhất chưa lên). Đọc `docs/son-mon-luat.md` trước; sửa luật trong file đó và màn Luật Sơn Môn (`components/sonmon/SmLuat.tsx`) cho khớp. Hàm và cron mới bằng apply_migration, không sửa hàm cũ (tạo hàm mới thay thế, đổi chỗ gọi).
- [ ] 1. Phạt bên công khi đánh thua: mọi người theo xuất chinh của trận thua bị giảm Lực chiến Sơn Môn theo số trận thua trong ngày: lần 1 -10% trong 1 giờ, lần 2 -30% trong 3 giờ, từ lần 3 -50% tới 5:00. Đếm và hồi hết lúc 5:00 mỗi ngày. Giữ luật "nghỉ 2 giờ" đang có. Hiện ngay trên thẻ người chơi và màn xuất chinh: "Trọng thương: Lực chiến -30%, hồi lúc 14:20" (không tooltip). Mục đích: chặn đánh liều liên tục.
- [ ] 2. Nút "Bỏ ô" cho môn: chưởng môn (và người có quyền phát lệnh xuất chinh) bỏ được một ô của môn, trừ chính điện và ô đang có quân đi tới. Hỏi xác nhận một lần. Ô về trống, người đứng giữ ở đó tự về chính điện, ghi vào chiến báo môn. Luật cũ "đủ ô thì tự bỏ ô xa nhất khi chiếm thêm" giữ nguyên.
- [ ] 3. Đất phải liền nhau: sau mỗi lần môn mất ô hoặc bỏ ô, tính các ô còn nối với chính điện (kề nhau trên lưới lục giác). Ô bị đứt khỏi chính điện về trống, người đứng giữ ở đó tự về chính điện, chiến báo ghi "Đất đứt mạch, mất N ô". Áp cho cả ô Linh Mạch, Thiên Trì, yêu thú đã chiếm. Kiểm trường hợp chính điện bị vây.
- [ ] 4. Linh Mạch và Thiên Trì mới xuất hiện: ngẫu nhiên có hoặc không có yêu thú giữ (gợi ý 50%, ghi số chọn vào Ghi chú). Có yêu thú thì đánh như ô yêu thú hiện tại; không có thì môn đầu tiên tới chiếm được ngay.
- [ ] 5. Linh Mạch ẩn: Linh Mạch mới sinh không hiện trên bản đồ, phải trinh sát ô đó mới thấy (kết quả trinh sát thêm dòng "Có Linh Mạch"); môn đã trinh sát thấy thì giữ thấy tới hết Kỷ. Linh Mạch không sinh ở ô đã có chủ, và một ô không có Linh Mạch 2 lần trong một Kỷ (lưu ô đã từng có). Linh Mạch đang hiện từ 20/11 giữ nguyên tới khi bị chiếm hoặc đổi lượt sinh; từ lượt sinh kế tiếp mới ẩn. Thiên Trì vẫn hiện.
- [ ] Thử: `sim-son-mon` trước/sau (tỉ lệ thủ thành công phải còn trong 20-80% như Điều kiện dừng); `SMOKE_URL=http://localhost:3314 node scripts/smoke-son-mon.cjs` thêm: bỏ ô, đứt mạch, trinh sát thấy Linh Mạch, phạt thua 3 lần trong ngày; test SQL cho đứt mạch (ô cách 2-3 bước, nhánh vòng).
- [ ] Cáo thị ngắn, không lộ tỉ lệ: "Sơn Môn: đánh thua liên tiếp sẽ trọng thương; môn tự bỏ ô được; đất phải liền với chính điện; Linh Mạch giờ phải trinh sát mới thấy." Soạn bài cho Tyler tự đăng Group người chơi.
- Ghi chú:

## Vòng tu vi chân thân - Cửu Chuyển, Mộng thạch, Luyện lô, đi cảnh (Tyler duyệt 20/11 17:14, "áp dụng từ hôm nay")
Thiết kế đầy đủ và mọi con số: doc Project `claude/vong-cay-chan-than.md` (Projects tool, project_read). Đọc mục cần trước khi làm từng khối, đừng đọc lại cả file mỗi lần.
Đã chốt (không hỏi lại):
- Ba vòng ba vai: giờ thật → tu vi → Cửu Chuyển; kiếp (nhập mộng) → Mộng thạch = số lượng đồ; đi cảnh → bậc Luyện lô = chất lượng đồ. Kiếp KHÔNG rơi đồ thẳng.
- Cửu Chuyển: Tỉnh Mộng, Ngưng Thần, Định Tâm, Quy Nguyên, Thông Huyền, Kiến Tính, Siêu Kiếp, Vô Lượng, Luân Hồi Chủ. Mỗi Chuyển 4 tầng Sơ / Trung / Cao / Viên mãn (36 bậc). Lên tầng tự động khi đầy (+10% Lực chiến của Chuyển). Viên mãn đầy mới hiện nút Đột phá sang Chuyển mới (+60% × (1 + căn cơ)).
- Thanh tầng (tu vi): C1 1000/1200/1300/1500; C2 1700/2000/2300/2700; C3 3100/3500/4000/4700; C4 5400/6200/7100/8100; C5 9400/11000/12000/14000; C6 16000/19000/22000/25000; C7 29000/33000/38000/44000; C8 50000/58000/66000/76000; C9 88000/100000/120000/130000. Lực chiến cả Chuyển: 300, 400, 500, 700, 900, 1100, 1400, 1700, 2000. Mục tiêu nhịp: chơi đều tới C9 Viên mãn khoảng ngày 139, chỉ offline khoảng ngày 286.
- Tu vi: offline 100/giờ (giờ 0-12), 50/giờ (giờ 12-24), dừng sau 24 giờ; mỗi kiếp khép 25 × √năm sống (chết trước 16 tuổi = 0); 5 kiếp đầu mỗi ngày đủ, kiếp 6-10 50%, từ kiếp 11 20%. Tốc độ tu luyện +15% mỗi Chuyển. KHÔNG thưởng theo giờ mở tab.
- Đột phá (chỉ ở Viên mãn): người chơi tự chọn bấm hay áp cảnh. Ngưỡng = 100% thanh Viên mãn, bình cảnh = 200% (tu vi dừng tăng). Tỉ lệ ở ngưỡng: C1-3 100%, C4-6 85%, C7-9 75%, tăng đều tới 100% ở bình cảnh. Căn cơ +0% tới +20% tăng đều. Trượt: mất 50% phần dư trên ngưỡng, +10% lần sau, lần thứ 3 chắc chắn; không bắt chờ; trượt đúng ở 100% không mất gì. Lời dẫn trượt "tâm ma quấy nhiễu".
- Mộng dẫn chân: vào Chuyển 3 cần từng tới Kim Đan, Chuyển 6 cần từng tới Độ Kiếp, Chuyển 9 cần từng vào Hồng Hoang trong một kiếp nào đó (đọc từ vkl_lives). Nút đột phá ghi lý do ngay trên đó.
- Đổi tên: số "Tu vi" hiện ở tab Nhân vật (ctPower) → "Lực chiến"; thẻ pháp bảo "Tu vi +X" → "Lực chiến +X"; câu giải thích đổi theo. Thêm "Tổng tu vi đã tu" (chỉ tăng). Chữ "Tu vi" từ nay chỉ dùng cho thanh tiến độ.
- Sơn Môn: cảnh giới chân thân cộng +1%/Chuyển vào Lực chiến Sơn Môn, sau trần 6.000, chung trần +25% với pháp bảo, CHỈ từ Kỷ 3 (không đụng Kỷ 2). Đồ lò luyện không vào trận Sơn Môn.
- Tất cả tính ở MÁY CHỦ: lưu tu vi + giờ chốt, tính khi mở hoặc khi tiêu (không cron mỗi phút); roll lò ở máy chủ. Toàn bộ ẩn tới khi người chơi có chân thân; lúc tạo chân thân tặng sẵn đủ tu vi để lên tầng đầu ngay.
- Lịch: Ngày 22 lên 21/11, Ngày 23 lên 22/11, Ngày 24 bật cho người chơi 23/11. Tyler 20/11 18:30: mọi khối phải lên trước 5:00 1/12 để Kỷ 2 bắt đầu đủ tính năng. Các con số (40% người lên tầng...) chỉ để ĐO và cải thiện, KHÔNG chặn lịch.

## Ngày 22 - Chân thân lát 1a: đổi tên Lực chiến + nền máy chủ tu vi (giấu sau cờ)
Lên bản: 2026-11-21. Làm SAU Ngày 10 và Ngày 12. Cờ `CT_TU_VI_ON` (tắt). Cáo thị một dòng cho phần đổi tên.
- [ ] Đổi tên ở tab Nhân vật, thẻ pháp bảo Sơn Môn (`components/sonmon/BaoVat.tsx` và chỗ hiện "Tu vi +"), câu giải thích: "Tu vi" → "Lực chiến" (tr VI/EN). Grep toàn repo chữ "Tu vi" dùng cho ctPower, không đổi chữ tu vi trong kiếp.
- [ ] Bảng mới (apply_migration, file trong supabase/): tu vi chân thân (player, tu_vi, chuyen, tang, can_co theo từng Chuyển, giờ chốt, tổng tu vi, số lần trượt hiện tại, số kiếp tính trong ngày). RLS chỉ đọc của mình; ghi chỉ qua hàm SECURITY DEFINER.
- [ ] Hàm mới: `ct_tv_get` (chốt offline theo luật 12h + 12h/50%, dừng ở 24 giờ và ở bình cảnh, tự lên tầng khi đầy, trả trạng thái), `ct_tv_life` (gọi từ chỗ ghi kiếp, cộng 25×√năm theo bậc kiếp trong ngày, tốc độ theo Chuyển), `ct_tv_dot_pha` (kiểm Mộng dẫn chân, tung tỉ lệ ở máy chủ, áp luật trượt/căn cơ). Hàm cũ không sửa: nối `ct_tv_life` bằng hàm mới hoặc gọi thêm từ client sau vkl_add_life, miễn là máy chủ tự đọc năm sống từ vkl_lives chứ không tin số client gửi.
- [ ] Test SQL: offline 6h, 18h, 40h; kiếp thứ 1, 6, 11 trong ngày; đột phá ở 100%, 150%, 200%; trượt 3 lần; thiếu chìa Kim Đan.
- [ ] `scripts/sim-tu-vi.ts` mới: mô phỏng 3 kiểu người chơi (chơi đều 5 kiếp + 2 lần/ngày, chỉ offline 2 lần, chỉ offline 1 lần) ra ngày đạt từng Chuyển; phải gần mốc trong doc (C9 Viên mãn khoảng ngày 139 / 286). Lệch quá 15% thì ghi vào Ghi chú.
- Ghi chú:

## Ngày 23 - Chân thân lát 1b: màn tu vi, đột phá, áp cảnh (giấu sau cờ)
Lên bản: 2026-11-22. Làm SAU Ngày 8f. Cờ `CT_TU_VI_ON` vẫn tắt.
- [ ] Màn chân thân: chân thân ngồi thiền ở giữa (LPC), dưới là thanh tu vi có 2 mốc vạch (Ngưỡng, Bình cảnh) ở tầng Viên mãn; dòng "Chuyển 3 - Định Tâm · Trung tầng"; tốc độ tu luyện mỗi giờ; giờ còn lại tới khi đầy 12 giờ.
- [ ] Mở màn: gọi `ct_tv_get`, hiện "Trong lúc vắng, ngươi đã tu được +X tu vi" (một dòng, không popup dồn dập). Lên tầng tự động thì hiện một dòng "Lên Trung tầng, Lực chiến +Y".
- [ ] Nút Đột phá (chỉ khi Viên mãn đủ ngưỡng): ghi tỉ lệ và căn cơ hiện tại ngay trên nút ("Đột phá - 85% thành, căn cơ +0%"). Bên cạnh một dòng nhỏ "Tu thêm để chắc hơn: tới bình cảnh 100% và căn cơ +20%". Thiếu chìa Mộng dẫn chân thì nút khóa, ghi lý do ngay trên nút.
- [ ] Kết quả đột phá: thành → hào quang/hiệu ứng pixel ngắn + "Tu vi đã hóa thành cảnh giới, Lực chiến +Z"; trượt → "Tâm ma quấy nhiễu..." + số tu vi còn lại + tỉ lệ lần sau. Lời dẫn qua story-writing + humanizer, tra glossary.
- [ ] Hồ sơ chân thân: dòng "Tổng tu vi đã tu", và danh sách căn cơ từng Chuyển.
- [ ] Thử: Playwright 390x844 các trạng thái (mới tạo, đang tu, đủ ngưỡng, bình cảnh, thiếu chìa, trượt); chấm 5 mặt huashu-design; uiux-pro-max. Chỉ pixel/LPC, không gradient.
- Ghi chú:

## Ngày 24 - Chân thân lát 1c: bật cho người chơi
Lên bản: 2026-11-23. Bật `CT_TU_VI_ON`. Có cáo thị (ngắn, không số chi tiết): "Chân thân bắt đầu tu luyện: tu vi tăng theo giờ và theo mỗi giấc mộng, đủ thì tự chọn đột phá hay áp cảnh. Cửu Chuyển có 36 tầng."
- [ ] Tặng mọi người đang có chân thân đủ tu vi để lên Sơ tầng ngay lần mở đầu (quà mở màn), kể cả người cũ. Người tạo chân thân mới cũng nhận.
- [ ] Ghi sự kiện vkl_events: ct_tv_open, ct_tv_tang, ct_dot_pha (kết quả, % lúc bấm, căn cơ), ct_tv_gate (bị chìa chặn).
- [ ] Thêm vào "Sổ cải thiện tính năng": % người có chân thân lên ≥1 tầng trong 24 giờ, % ngày có 2 phiên, D1/D7 nhóm có chân thân, % đột phá có áp cảnh, quay lại của nhóm Khai Thiên. Ghi số mốc hôm trước khi bật.
- [ ] 26/11: đọc số 3 ngày, ghi vào Sổ cải thiện; lát 2 vẫn làm đúng lịch, chỉ sửa lát 1 nếu có lỗi.
- Ghi chú:

## Ngày 25 - Chân thân lát 2a: Mộng thạch, Luyện lô bậc 1-2 (giấu sau cờ)
Lên bản: 2026-11-27. Cờ `CT_LO_ON`. Chỉ làm khi đạt điều kiện ở đầu mục.
- [ ] Mộng thạch mỗi kiếp khép: 10 + 2 × bậc cảnh giới cao nhất + 1 mỗi 50 năm (tối đa +10) + 15 nếu kết cục mới; cùng bậc giảm theo số kiếp trong ngày như tu vi. Máy chủ tính từ vkl_lives.
- [ ] Mộng thạch offline: 1/giờ, cùng luật trần như tu vi (phần +1 mỗi 10 ải để lát 3).
- [ ] Dùng danh mục đồ chân thân của Ngày 31 (5 ô: Vũ khí mở ở C1, Quần áo C1, Mũ C2, Phụ kiện C4, Lưng C5). Lò chọn ô ngẫu nhiên đều trong các ô đã mở, rồi chọn 1 trong 4 món của phẩm vừa ra. Pháp bảo Sơn Môn vẫn là nguồn riêng, tự so với đồ lò ở ô Vũ khí/Phụ kiện. Thần binh truyền kiếp không đụng.
- [ ] Luyện lô: 10 Mộng thạch một lượt, roll ở máy chủ; bậc 1 (C1): Phàm 90 / Bảo 10; bậc 2 (C3): Phàm 70 / Bảo 27 / Linh 3. Lực chiến mỗi món ±20%: Phàm 60, Bảo 150, Linh 350, Tiên 800, Thần 1.800. Món mạnh hơn tự lắp; nút "Luyện hết" một chạm.
- Ghi chú:

## Ngày 26 - Chân thân lát 2b: dung luyện 3→1, Chân soi mộng, bật
Lên bản: 2026-11-28. Bật `CT_LO_ON`. Có cáo thị.
- [ ] Túi đồ chân thân: 3 món cùng phẩm dung thành 1 món phẩm trên, nút "Dung hết" một chạm.
- [ ] Chân soi mộng: mỗi Chuyển cho kiếp mới một khởi đầu nhỏ (gợi ý +1 năm tuổi thọ mỗi Chuyển, hoặc tỉ lệ linh căn tốt +0,5%/Chuyển; tự chọn sau khi chạy `sim-do-kho 3000` trước/sau, tỉ lệ phi thăng không được tăng quá 1 điểm %).
- [ ] `sim-farm` và `sim-tu-vi` cho kinh tế Mộng thạch: chơi đều khoảng 12-15 lượt luyện/ngày; tỉ lệ kiếp chết trước 16 tuổi không được tăng.
- [ ] Đo: % người chơi trong ngày có luyện; số kiếp/ngày nhóm 4-10 kiếp; tỉ lệ kiếp chết nhanh.
- Ghi chú:

## Ngày 27-29 - Chân thân lát 3: đi cảnh, boss, Luyện lô bậc 3-6 (giấu sau cờ, bật 1/12)
Lên bản: 2026-12-01 (làm 2 đêm 29-30/11, bật 1/12). Cờ `CT_DI_CANH_ON`. KHÔNG chờ số lát 2 (Tyler 20/11 18:30: phải đủ hết trước Kỷ 2).
- [ ] Đêm 29/11: 3 chương ải (mở ở C3, C6, C8), boss mỗi 5 ải; thắng thua theo Lực chiến so với yêu cầu ải, chút ngẫu nhiên, tính ở máy chủ; lần đầu thắng boss chắc rơi 1 món; Luyện lô bậc 3 (boss ải 10), 4 (ải 20), 5 (ải 30), 6 (ải 45) theo bảng trong doc. Mộng thạch offline +1/giờ mỗi 10 ải đã qua.
- [ ] Đêm 30/11: trận nhìn nghiêng kiểu Fire Emblem (chân thân LPC vs yêu thú pixel, 3-6 lượt, thanh máu) CHỈ ở lần đầu đánh boss, có nút Bỏ qua; mọi lần khác là thẻ kết quả. Quét 1 chạm ải đã qua (mở ở C6).
- [ ] Cuối đêm 30/11: thử đủ, cáo thị, bật cờ 1/12. Đo phân bố ải cao nhất, % kẹt một boss quá 3 ngày, độ dài phiên ngắn (mục tiêu trung vị 2-5 phút).
- Ghi chú:

## Võ tu, Nho tu, đồ chân thân, công pháp chân thân (Tyler giao 20/11 17:51)
Thiết kế đầy đủ, danh mục đồ định sẵn, bảng tên cảnh giới, công pháp: doc Project `claude/ke-hoach-dao-do-cong-phap.md` (Projects tool, project_read). Đọc mục cần trước khi làm từng khối. Không chờ cổng số liệu: mọi khối lên trước 1/12 (Tyler 20/11 18:30). Dùng gamedev + game-design; chữ mới qua story-writing + humanizer, tra glossary; hình chỉ LPC có sẵn và PixelFx, không phóng to ảnh, không vẽ pixel bằng code.

## Ngày 31 - Đồ chân thân từ toàn bộ dáng LPC, ô Quần áo, ô Lưng, Bảo khố (giấu sau cờ)
Lên bản: 2026-11-26. Cờ `CT_LO_ON` (chưa bật).
- [ ] LẤY HẾT DÁNG LPC TRƯỚC (Tyler chốt 20/11 18:21): mỗi dáng LPC dùng được là một món, KHÔNG đổi màu thay dáng (chốt 18:03). Không cần đủ 20 món mỗi ô hay đủ 100 món; ước tính khoảng 170 món (Vũ khí ~40, Mũ ~60, Phụ kiện ~32, Quần áo ~30, Lưng ~13). Nguồn: https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator (clone nông, sparse `spritesheets/weapon hat neck arms backpack quiver cape torso dress shoulders tools body/wings body/tail`). Bỏ dáng hiện đại/lễ hội (mũ Noel, elf, chóp cao, bowler, cà vạt, jabot, jetpack...). Cắt khung như lớp đang có trong `public/lpc`, ghi nguồn/tác giả vào `public/lpc/sources.json` và trang Credits. Script kiểm: không có 2 món cùng ô dùng chung dáng chính.
- [ ] Danh mục: dùng các món đặt tên sẵn trong doc làm khung phẩm, thêm mọi dáng còn lại, đặt tên kiểu phương Đông (story-writing + glossary, tìm trùng với 472 món trong kiếp), chia vào 5 phẩm (phẩm cao ít món hơn). Lực chiến gốc Phàm 60, Bảo 150, Linh 350, Tiên 800, Thần 1.800 (±20% khi roll). Món CT_GEAR/CT_AO cũ trùng dáng thì gộp, ai đã mở bằng thành tựu giữ nguyên. Icon túi đồ: icon có sẵn, thiếu thì icon Cultivation World Simulator (ghi nguồn).
- [ ] Ô Quần áo có chỉ số (mở C1). Ô Lưng thay ô Cánh: 7 dáng cánh, 4 dáng đuôi, 2 dáng áo choàng (mở C5). Pháp tướng bằng hiệu ứng để đợt sau.
- [ ] Món Tiên, Thần có hào quang PixelFx nhỏ; kiểm 390x844 không rối, không vỡ pixel.
- [ ] Bảo khố (0/tổng số món): sổ món đã từng có, danh hiệu khi đủ hết món một ô, khung tên khi đủ hết.
- [ ] Nhiều món: một đêm không kịp thì làm theo thứ tự Vũ khí, Quần áo, Mũ, Phụ kiện, Lưng; bật với số món đã xong, phần còn lại thêm ở đêm sau (ghi vào Ghi chú).
- Ghi chú:

## Ngày 32a - Công pháp chân thân: Tàng Kinh Các chân thân, khắc công pháp (giấu sau cờ)
Lên bản: 2026-11-27. Cờ `CT_CP_ON` (tắt).
- [ ] Kiếp khép có công pháp tầng 9 thì khắc vào chân thân (máy chủ ghi, đọc từ dữ liệu kiếp đã gửi; kiểm hợp lý như lives_guard). Lại tầng 9 ở kiếp khác thì +1 tầng chân (Sơ ngộ → Viên dung, 5 tầng).
- [ ] Khắc sẵn cho người cũ từ sổ công pháp 4.2.0 (công pháp từng tầng 9). Ghi số người được khắc vào Ghi chú.
- [ ] Ba ô: Tâm pháp (C1), Chiêu 1 (C1), Chiêu 2 (C4). Tâm pháp tăng tốc tu vi chân thân Hoàng +2% / Huyền +4% / Địa +6% / Thiên +10% × tầng chân/5. Lực chiến công pháp: Hoàng 100, Huyền 250, Địa 500, Thiên 1.000 ở Viên dung, tầng thấp theo tỉ lệ. Chạy `sim-tu-vi` trước/sau, nhịp C9 Viên mãn không được nhanh hơn 10%.
- [ ] Tab Nhân vật: ô công pháp đang trống thành 3 ô; bấm mở Tàng Kinh Các chân thân, dùng lại giao diện vòng ấn của `components/TangKinhCac.tsx`.
- Ghi chú:

## Ngày 32b - Bật công pháp chân thân
Lên bản: 2026-11-28. Bật `CT_CP_ON` cùng lúc `CT_LO_ON` (Ngày 26). Có cáo thị chung với đồ chân thân.
- [ ] Thử Playwright 390x844, chấm 5 mặt huashu-design; sự kiện ct_cp_khac, ct_cp_tang, ct_cp_lap.
- [ ] Đo: % người có chân thân đã khắc ít nhất 1 công pháp; ghi Sổ cải thiện.
- Ghi chú:

## Ngày 33a - Võ tu (làm cùng đêm với 33b, bật luôn nếu thử sạch)
Lên bản: 2026-11-28. Cờ `VO_TU_ON` (tắt). Làm sau Ngày 11.
- [ ] Con đường Võ tu theo doc: chọn ở Trúc Cơ, mọi linh căn kể cả phế linh căn; hệ số 0,95; máu +30%, đột phá +10%, thọ -10%. Thanh Khí huyết trong trận.
- [ ] Công pháp Võ tu vào bộ CP 4.2.0: Thái Cổ Luyện Thể Quyết; Băng Sơn Quyền, Thiết Sơn Kháo, Long Tượng Bàn Nhược Công, Bát Cực Băng; tuyệt kỹ Phá Thiên Nhất Quyền. Hiệu ứng PixelFx sẵn có.
- [ ] Khoảng 20 sự kiện riêng và 3 kết cục (doc). Ngoại hình LPC: body_musc, band_thick, gloves.
- [ ] `sim-do-kho 3000` có Võ tu: tỉ lệ phi thăng Võ tu nằm giữa Kiếm tu và Trận tu.
- Ghi chú:

## Ngày 33b - Bật Võ tu, tên cảnh giới Võ tu
Lên bản: 2026-11-28. Bật `VO_TU_ON`. Có cáo thị.
- [ ] Tên cảnh giới phàm giới cho Võ tu (Luyện Bì, Dịch Cân, Tẩy Tủy, Kim Cương Thể, Pháp Tướng, Bất Diệt Thể, Thánh Thể), kèm chữ nhỏ cảnh giới chung bên cạnh ở bảng xếp hạng và bia mộ.
- [ ] Thêm Võ tu vào bộ lọc bảng xếp hạng, 8f (chọn đường khi khởi đầu), Lôi Đài.
- [ ] Đo: % kiếp chọn Võ tu 7 ngày; còn chơi nhóm phế linh căn.
- Ghi chú:

## Ngày 34a - Nho tu (làm cùng đêm với 34b, bật luôn nếu thử sạch)
Lên bản: 2026-11-29. Cờ `NHO_TU_ON` (tắt).
- [ ] Con đường Nho tu theo doc: đạo tâm từ 0 trở lên; hệ số 0,90; tâm ma rất thấp, thọ dài; có đồ đệ thật (Sư Đồ) thì +10% tu mỗi người, tối đa +20%. Thanh Hạo nhiên trong trận.
- [ ] Công pháp: Hạo Nhiên Chính Khí Quyết; Bút Lạc Kinh Phong, Xuân Thu Bút Pháp, Thiên Địa Chính Khí, Văn Tâm Điêu Long; tuyệt kỹ Văn Thánh Lâm Thế.
- [ ] Khoảng 20 sự kiện riêng (tư thục, khoa cử, làm quan, văn bảo, văn tự ngục) và 3 kết cục. Ngoại hình: kimono dài tay, hairtie, w_cane tạm làm bút/quạt.
- [ ] `sim-do-kho 3000` có Nho tu.
- Ghi chú:

## Ngày 34b - Bật Nho tu, tên cảnh giới Nho tu và Phật tu, Bát đạo
Lên bản: 2026-11-29. Bật `NHO_TU_ON`. Có cáo thị.
- [ ] Tên cảnh giới phàm giới cho Nho tu (Đồng Sinh, Tú Tài, Cử Nhân, Tiến Sĩ, Hàn Lâm, Đại Nho, Bán Thánh) và Phật tu (Sa Di, Tỳ Kheo, Thiền Sư, La Hán, Bồ Tát, Đại Bồ Tát, Phật Đà), cùng cách hiện như Võ tu.
- [ ] Thành tựu "Bát đạo" (đủ 8 con đường); "Lục đạo luân hồi" giữ ở 6. Thêm Nho tu vào bộ lọc, 8f, Lôi Đài.
- [ ] Đo: % kiếp chọn Nho tu 7 ngày; số người Nho tu có đồ đệ thật. Không đường nào trên 35% số kiếp mới.
- Ghi chú:

Lát 3 chân thân (Ngày 27-29) thêm, cuối đêm 30/11: đưa chiêu công pháp chân thân vào trận đi cảnh, tuyệt kỹ khi đủ tâm pháp và 2 chiêu cùng đạo ở Viên dung.

## Ngày 8g - Thiên thư quyển III: chặng 2, 3, 4 (bỏ sót, xếp lại 20/11)
Lên bản: 2026-11-24 (mỗi ô có ngày riêng: chặng 2 lên 24/11, chặng 3 lên 26/11, chặng 4 lên 29/11; khối cắt sang lưu trữ khi xong cả 3 ô).
Hiện code mới có chặng 1 quyển III (6 kết cục `tt3_*` trong `lib/game/tt3.ts`). Chặng 2-4 theo `docs/thien-thu-3.md` mục 5, 8, 9 chưa có khối nên chưa làm. Phải xong trước Kỷ 2. Dùng story-writing + script-writing + humanizer, giữ đúng chữ trong `docs/thien-thu-3.md`; kiểm sổ liền mạch (mục 3) và chỗ chưa kiểm (mục 10). Có cáo thị khi mở từng chặng.
- [ ] Chặng 2 (5 kết cục mạch chính). Lên bản: 2026-11-24.
- [ ] Chặng 3 (5 kết cục). Lên bản: 2026-11-26.
- [ ] Chặng 4 (5 kết cục, gồm Cơm Chiều) + 6 kết cục gắn hệ thống có thể làm ngay (Sơn Môn, Sư Đồ, chân thân, Lôi đài, chọn thế giới khởi đầu; kết cục cảnh giới Chân Nhân để khi có Chân Nhân) + 4 kết cục bí ẩn. Lên bản: 2026-11-29.
- Ghi chú:

## Ngày 35 - MỖI ĐÊM: 10 cốt truyện mới nối 3 quyển Thiên thư + soát logic (khối lặp, Tyler giao 20/11 18:54)
Lên bản: 2026-11-21 (LẶP LẠI MỖI ĐÊM từ 20/11. Không đánh [x] cả khối, không cắt khối này sang lưu trữ; mỗi đêm ghi một dòng nhật ký vào `docs/cot-truyen-moi.md`.)
Làm sau các khối tới hạn của lịch Kỷ 2. Đêm quá tải: tới 3:00 chưa bắt đầu thì làm ít nhất 5 cốt truyện, ghi nợ, đêm sau bù.
- Mỗi đêm viết 10 cốt truyện mới. Một cốt truyện = chuỗi 2-4 bước sự kiện, mỗi bước 4 lựa chọn, có ít nhất một lựa chọn kiểu mới chưa dùng trong game (vd im lặng chờ thời, đổi tuổi thọ lấy tin, giao kèo với yêu, nhường cơ duyên cho người khác). Rải đều: phàm giới, Tiên/Ma giới, Hư, Hồng Hoang; đủ con đường (cả Võ tu, Nho tu khi đã bật); ưu tiên kiếp 2-10.
- Nguồn ý: cơ chế Cultivation World Simulator đã tổng hợp ở Project `claude/hoc-tu-cultivation-world-simulator.md` (bí mật thế giới, kiếp nạn theo quan hệ, đấu giá, bí cảnh, mệnh cách, ý chí tông môn, phàm nhân nền, thiên tượng). CHỈ lấy ý, KHÔNG chép chữ của CWS.
- Nối 3 quyển: ít nhất 4/10 cốt truyện mỗi đêm có liên kết với Quyển I (Vạn Kiếp Chân Nhân, mảnh ký ức), Quyển II (Vạn Mảnh, Kẻ Gõ Chuông, chiến thư) hoặc Quyển III (Mạnh Bà, Khấu, Vong Xuyên, Cơm Chiều): một vang vọng, một nhân vật phụ, một manh mối. Chỉ hiện cho người đã mở quyển đó (đọc tiến độ Thiên thư), KHÔNG lộ trước nội dung quyển chưa mở, KHÔNG trái với `lib/game/lore.ts` và `docs/thien-thu-3.md`. Ghi mọi tên, địa danh, sự thật mới vào sổ liền mạch trong `docs/cot-truyen-moi.md`.
- Quy trình mỗi cốt truyện: `anthropic-skills:story-writing` (ý, mạch, móc) → `anthropic-skills:script-writing` (nhịp từng bước, lựa chọn, hậu quả) → `anthropic-skills:humanizer` (chữ, mỗi đoạn tối đa 3 câu) → tra glossary `claude/glossary-tu-tien-cws.csv` → `anthropic-skills:the-fool` (pre-mortem, red team) soát: nhân quả có hợp lý không, có trái tuổi, cảnh giới, quan hệ, người đã chết không, có chết nhảm không. Sửa xong mới code.
- Luật chết: KHÔNG chết nhảm. Một lựa chọn chỉ được dẫn tới chết khi bước trước đã có dấu hiệu nguy hiểm rõ và người chơi chọn liều; câu chết nói rõ vì sao. Mỗi cốt truyện tối đa 1 nhánh chết. `sim-do-kho 3000` trước/sau mỗi đêm: tỉ lệ chết và phi thăng không lệch quá 1 điểm %.
- Soát cũ mỗi đêm (the-fool): lấy 10 sự kiện hoặc nguyên nhân chết đáng ngờ nhất (từ vkl_lives 24 giờ qua: chết trẻ, chết đột ngột không có sự kiện báo trước, nguyên nhân lạ so với giới/cảnh giới; và góp ý có chữ "vô lý", "chết nhảm", "không hiểu"). Mỗi cái: lỗi logic thì sửa (thêm điều kiện, thêm bước báo trước, đổi lời), ổn thì ghi lý do. Ghi vào nhật ký.
- Code: thêm vào bộ sự kiện sẵn có (đúng file theo giới/loại), id tiền tố `ct_<YYYYMMDD>_<n>`; chữ tr('VI','EN'); không thêm màn mới. Bật luôn khi thử sạch (không cần cờ riêng).
- Đo: vkl_events lượt gặp mỗi cốt truyện, phân bố lựa chọn, tỉ lệ chết mỗi chuỗi. Chuỗi có hơn 40% người chơi chết hoặc hơn 80% chọn cùng một lựa chọn thì sửa ở đêm sau.
- Cáo thị: mỗi tuần một dòng chung ("Thêm N cốt truyện mới, có chuyện nối Thiên thư"), không liệt kê chi tiết.
- Báo Tyler trong tin cuối phiên: 10 tên cốt truyện (một dòng mỗi cái, ghi quyển liên kết nếu có), số sự kiện cũ đã soát và đã sửa.

## Ngày 36 - Soát quái vỡ hạt trong trận (Tyler báo 20/11 20:18, con Hổ)
Lên bản: 2026-11-21. Đã sửa sẵn ở commit 12be60c (phóng ảnh pixel theo hệ số nguyên trong `components/MonsterLpc.tsx` và `PetPic`; làm sạch `dk_tiger`, `dk_monkey`, `dk_toad` bằng `scripts/mkbeast_dokiep.py`). Đêm nay chỉ kiểm và làm nốt.
- [ ] Playwright 390x844, deviceScaleFactor 2: vào trận với từng quái có ngoại hình LPC (MONSTER_LOOK, thần thú petLegend, linh thú trận thu phục), chụp khung 1-2. Soi: hạt không đều, khung lấn sang khung bên, viền mờ, mẩu hình lạ ở mép. Ghi tên quái còn lỗi vào Ghi chú và sửa luôn (cùng cách: làm sạch ảnh gốc, không vẽ mới, không phóng to ảnh nguồn).
- [ ] So cỡ quái trước/sau (đổi hệ số nguyên làm quái người nhỏ đi khoảng 6%): nếu quái nào nhỏ quá so với nhân vật thì tăng `scale` của quái đó tới bậc nguyên kế tiếp.
- [ ] Không đổi nhân vật người chơi (`components/Sprite.tsx`) trong khối này; nếu thấy vỡ hạt ở nhân vật thì ghi vào Ghi chú và báo Tyler.
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
