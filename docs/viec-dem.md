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

> ĐÊM 19/11 (Tyler 20:27): làm HẾT các khối tới hạn 20/11, thứ tự 7 → 7b → 9 → 8e. Không bỏ khối nào. Commit, thử và đẩy `next` sau MỖI khối để phiên dự phòng 01:30 nối tiếp được nếu phiên chính hết giờ.

## Ngày 7 - Phiên đầu của người mới (ƯU TIÊN TRƯỚC MỌI KHỐI, Tyler 19/11 tối)
Lên bản: 2026-11-20 (hoặc 21 nếu chưa kịp).
Lý do (số 13-19/11, xem tang-truong.md mục quảng cáo Chân Thân): người mới vào thẳng /choi thì 951/1.588 (60%) thấy màn "Kiếp đầu tiên" rồi đi sau trung vị 4,5 giây, chưa bấm "Vào kiếp đầu". Người mới quay lại hôm sau chỉ ~12% (cả quảng cáo lẫn tự đến). Người đến qua link mời/chia sẻ (nguồn "other") quay lại ~29%.
- [x] Đo trước: thêm vào `open`/`first_simple` số ms từ lúc điều hướng tới lúc màn đầu hiện (performance.now()) và `navigator.connection.effectiveType` nếu có, để tách "tải chậm" với "không muốn chơi".
- [x] THIẾT KẾ ĐÃ CHỌN (19/11 20:25, Claude chọn khi Tyler hỏi "nếu là chủ game"): hướng A "Cảnh sống" + câu dẫn của C cho người đến từ quảng cáo. Mẫu: docs/design/man-dau/ (A-canh-song.html + .png, C-van-kiep.html + .png), mô tả: nền cảnh pixel trôi ngang, nhân vật đi ở giữa (sprite LPC thật), góc trên Năm/Tuổi tự tăng, hộp thoại giấy gõ chữ câu chào đời (theo xuất thân thật của lá số), chip linh căn/mệnh/nhà, nút "Sống kiếp này" có thanh đếm 4 giây tự vào, nút phụ "Gieo lại", link "Đăng nhập" nhỏ góc trên. Có utm_medium=paid: thêm dòng dẫn nền tối chữ vàng "Ngươi đã chết 40 lần. Mà chưa nhớ ra mình là ai." phía trên cảnh. Thử A/B với màn cũ (chia theo sid, 50/50, đo life_start và quay lại hôm sau), ghi `first_ab` vào sự kiện.
- [x] Người chưa có kiếp nào vào /choi: không dừng ở màn chờ bấm. Màn "Kiếp đầu tiên" thành lớp phủ ngắn rồi tự đầu thai sau khoảng 2 giây (có nút "Vào luôn"); năm đầu trôi nhanh, lựa chọn đầu tiên xuất hiện trong khoảng 10 giây. Cờ mới, mặc định bật. Đo: tỉ lệ người mới có life_start (mục tiêu từ 50% lên 75%), ms tới first_choice.
- [x] Kiếp 1 của người mới gọn hơn (khoảng 3-5 phút tới kết cục), kết kiếp dẫn thẳng vào tạo chân thân; cuối phiên hiện "Quà ngày mai" khóa sẵn (điểm danh ngày 2) để có lý do quay lại. Đo: xong kiếp 1, tạo chân thân, quay lại hôm sau.
- [x] Vòng mời: sau kết cục kiếp 1-2 và ở màn chân thân, nút chia sẻ thẻ kết cục / mời Sư Đồ rõ hơn (link mang ?su= hoặc ref), đo `share` và người đến qua link.
Ghi chú: không chạy quảng cáo tới khi người mới tự đến quay lại hôm sau từ 20% trở lên 3 ngày liền.
- Xong: 2026-11-19 (sha ở commit "Ngày 7")
- Ghi chú đêm 19/11:
  - Đo: `open` và `first_simple` có `navMs` (performance.now) và `net` (effectiveType). `first_simple`, `first_go` (auto 0/1, ms) và `first_reroll` có `ab`.
  - Màn A: `components/FirstScene.tsx` (lớp phủ toàn màn, cảnh /bg/tu_luyen-0.png trôi, sprite LPC thật đi sang phải, Năm thứ/Tuổi nhích tới 3, hộp giấy gõ câu chào đời theo nơi sinh + 5 câu điềm lạ, chip linh căn/mệnh/nhà, "Gieo lại" + "Sống kiếp này" đếm 4 giây sau khi gõ xong, link "Đã có tài khoản? Đăng nhập"). Quảng cáo (utm_medium=paid, utm_source=fb hoặc fbclid) thêm dòng C. Link mời Sơn Môn thay dòng C bằng "<tên> ở <môn> mời bạn".
  - A/B: `abFirst()` trong lib/track.ts, chia theo sid lần đầu rồi giữ theo máy (`vkl.ab.first`). Cờ `NEXT_PUBLIC_FIRST_AB` (0 = mọi người màn cũ, a/b = ép nhóm). Nhóm B (màn gọn cũ) cũng tự vào sau 4 giây (cờ `FIRST_AUTO_ON`), thanh vàng chạy trên nút.
  - Đo Playwright: màn hiện tới lúc tự vào khoảng 6,5 giây (gõ chữ 1,5 giây + đếm 4), lựa chọn đầu tiên (thôi nôi/trốn tìm) hiện ngay sau.
  - Kiếp 1 gọn: số liệu 17-19/11 trung vị 11,5 phút từ life_start tới khép kiếp (398 người, 214 khép). Kiếp 1 trưởng thành trôi x3 trước Trúc Cơ (trước x2), x2 từ Trúc Cơ (trước x1). Chỉ đổi số năm mỗi giây thật, luật theo năm giữ nguyên nên sim-do-kho không đổi. Kết kiếp 1 đã dẫn thẳng vào tạo chân thân (ctWait có sẵn). Hàng điểm danh thêm dòng "Quà ngày mai: ... Mở lúc 5:00 sáng." (khi đã nhận hôm nay, người dưới 20 kiếp).
  - Vòng mời: link thẻ Một đời mang `?su=<tên>&r=life` khi đã có tài khoản (bạn bè vào thành đệ tử, đo bằng `open.q` chứa r=life); kiếp 1-2 có dòng gợi ý dưới nút Khoe. Màn chân thân đã có link ?su sẵn.
  - Giao diện: uiux-pro-max (nút 56px, link đăng nhập 44px, chữ từ 13px, tương phản vàng/nâu đậm, safe-area, prefers-reduced-motion tắt trôi/gõ/thanh). huashu-design chấm 5 mặt (ảnh 390x844): nhất quán 8, thứ bậc 7, chi tiết 8 (chữ gõ + thanh đếm vàng là chi tiết 120%), dễ dùng 8, mới lạ 7. Sửa mức nặng: link đăng nhập nằm giữa trời khó đọc, đổi sang khung nâu viền vàng dưới thẻ Tuổi. Không chạy cổng 3 hướng: màn lặp trong phong cách pixel sẵn có của game (mẫu A đã chọn 19/11). Lỗi nhỏ để sau: tự vào sau 4 giây không có nút dừng (WCAG 2.2.1), người cần đọc chậm bấm Gieo lại để đếm lại.
  - Đo sau 3 ngày: tỉ lệ người mới có life_start theo `ab` (mục tiêu 75%), ms tới first_choice, quay lại hôm sau theo nhóm.

## Ngày 7b - Sơn Môn kéo người mới (Tyler 19/11 tối, làm ngay sau Ngày 7)
Lên bản: cùng hoặc ngay sau Ngày 7.
Lý do: người đến qua link mời quay lại hôm sau ~29%, gấp đôi rưỡi mọi nguồn khác; người trong môn quay lại 74-91%.
- [x] Link mời của thành viên (nút "Gửi link cho bạn chưa chơi" + thẻ chia sẻ) mang mã môn và người mời (?sm=<mon>&tu=<ten>). Người mới vào qua link: màn đầu ghi "<tên> ở <môn> mời bạn", chơi xong kiếp 1 + tạo chân thân thì được mời vào môn đó (một chạm).
- [x] Quà: người mới đó quay lại ngày thứ 2 thì người mời và cả môn nhận quà (phúc duyên cho người mời, Khí vận nhỏ cho môn), có thư báo và chiến báo "X kéo được Y nhập môn". Hàm MỚI, chống tự mời (cùng thiết bị/sid, tài khoản mới tạo cùng ngày của chính người mời không tính), trần 5 người/ngày/người mời.
- [x] Bảng "Môn kéo người" trong tab Sơn Môn (tuần này). Đo: sm_ref_click, sm_ref_join, sm_ref_d2.
Ghi chú: Kỷ 2 (Ngày 9-11) vẫn làm theo kế hoạch ngay sau, Tyler muốn làm luôn.
- Xong: 2026-11-19 (commit "Ngày 7b")
- Ghi chú đêm 19/11:
  - Máy chủ (đã áp, `supabase/son_mon_keo_nguoi_2026_11_19.sql`): bảng MỚI `vkl_sm_ref` (một dòng mỗi người mới), hàm MỚI `vkl_sm_ref_nhan` (ghi + gửi lời mời vào `vkl_sm_moi` + thư), `vkl_priv.sm_ref_tick` (cron `vkl_sm_ref_tick` phút 7 mỗi giờ: ghi vào môn, ngày 2, phát thưởng +20 phúc qua vkl_gift, +3 Khí vận môn, thư, chiến báo `keo_nguoi`), `vkl_sm_keo_bang` (tuần từ thứ Hai 5:00). Thử trong giao dịch rồi hủy: lần 1 ok + có lời mời, lần 2 'da_co', giả vào môn + ngày 2 thì thưởng 1 và bảng có môn.
  - Chống tự mời: sid của người mới trùng sid người mời trong 7 ngày thì ghi `ly_do = cung_may`, không thưởng; tài khoản người mới phải tạo trong 7 ngày; mỗi người một dòng; trần 5 người thưởng mỗi ngày mỗi người mời. Thưởng cần CẢ vào môn VÀ quay lại ngày 2.
  - Máy: `lib/smRef.ts` (bắt ?sm/tu/mn khi máy chưa chơi kiếp nào, nhớ 7 ngày, đo `sm_ref_click`), màn đầu ghi "<tên> ở <môn> mời bạn", có chân thân + tài khoản thì gọi `vkl_sm_ref_nhan` (đo `sm_ref_moi`). Nút "Gửi link cho bạn chưa chơi" dùng link mới. Chiến báo "X kéo được Y nhập môn". Bảng "Môn kéo người tuần này" ở màn Kỷ.
  - Đo: sm_ref_click (sự kiện), sm_ref_join = `vkl_sm_ref.vao_luc`, sm_ref_d2 = `d2_luc`, thưởng = `thuong_luc`.
  - Giới hạn: người mới vẫn phải đủ điều kiện vào môn (từ X kiếp) do môn chủ đặt; môn đặt điều kiện cao thì người mới chưa Nhận được tới khi đủ kiếp (lời mời giữ 3 ngày). Đêm sau xem số, nếu nhiều lời mời hết hạn vì điều kiện thì cho lời mời qua link bỏ qua điều kiện kiếp (hàm mới).

## Ngày 8 - Khai hoang, bản đồ to, hướng dẫn người trong môn
Lên bản: 2026-11-19. Cáo thị: thêm dòng vào 4.6.0 (đã có dòng Khai hoang + bản đồ).
Lý do (số 18/11 chiều): 11 môn, 69 người, 18/127 ô có chủ, 8 xuất chinh đều tới ô trống, 0 trận giữa môn; 2 môn 15 người chỉ giữ 1 ô vì tưởng mở rộng là phải đánh. Chi tiết: docs/brainstorm-son-mon-ky1.md.
- [x] Khai hoang: chạm ô trống kề lãnh thổ, cắm cờ ngay, ai trong môn cũng làm được, theo trần ô. Hàm MỚI `vkl_sm_khai_hoang` (đã áp 18/11). Thẻ "Lãnh thổ X/Y ô" ở môn nhà, dấu + nhấp nháy trên bản đồ, luật 3 câu và luật đủ viết lại, chiến báo "X khai hoang Y". Xong: 18/11 3b0351e.
- [x] Bản đồ to (cao theo màn hình, 360-560px), phóng to/thu nhỏ (nút +/-, lăn chuột, phím +/-), sao pixel và tên 3 cõi phía sau, thẻ ô tự cuộn ra khi chạm. Xong: 18/11 c48dfdd.
- [x] Ba bước đầu cho người mới vào môn (thẻ ở đầu môn nhà, có ô tích, xong thì ẩn): điểm danh, khai hoang một ô (hoặc "môn đủ ô" thì bỏ qua), chọn ô đứng giữ. Đo `sm_3buoc` từng bước.
- [x] Hiệu ứng cắm cờ: khai hoang/chiếm xong thì cờ pixel dựng lên ô (0,6 giây) và ô sáng nhấp 3 lần; ô môn ta có cờ nhỏ bay (tắt khi prefers-reduced-motion). game-feel, chỉ pixel.
- [x] Chấm đỏ tab Sơn Môn (thanh dưới) khi môn còn ô chưa dùng và quanh lãnh thổ còn đất trống, hoặc khi môn đang bị đánh. Mở bản đồ là tắt tới khi có đất mới.
- [ ] Tin hệ thống trong Truyền âm (dòng riêng, không tên người gửi): "X vừa khai hoang Y (3/6 ô)", "Z đang tới Y, tới lúc hh:mm", "Môn thắng/thua trận ở Y". Hàm MỚI ghi vào `vkl_sm_chat` loại hệ thống (không sửa hàm chat cũ), gọi từ trigger trên `vkl_sm_bao`.
- [x] Câu dẫn khi khai hoang theo cõi (story-writing, humanizer), hiện trong thông báo thành công, mỗi cõi 3 câu, chọn ngẫu nhiên.
- Xong (4/5 việc còn lại): 2026-11-18 dded81d
- Ghi chú:
  - Ba bước đầu: thẻ ở đầu môn nhà (điểm danh; khai hoang một ô, bỏ qua khi môn đủ ô hay chưa cắm cờ; chọn ô đứng giữ), một nút chính theo bước đang tới, nút Ẩn. Xong cả ba thì ẩn hẳn. Đo `sm_3buoc` (buoc 1/2/3/xong/an).
  - Cờ: khai hoang xong thì cờ pixel màu huy hiệu dựng lên ô (0,6 giây) và ô sáng nhấp 3 lần; ô môn ta (trừ chính điện) có cờ vàng nhỏ phấp phới. Tắt khi prefers-reduced-motion.
  - Chấm đỏ tab Sơn Môn: đọc từ máy (`vkl.sm.viec`, SonMonHome ghi khi xem môn), không gọi thêm máy chủ: còn ô chưa dùng và có đất trống kề lãnh thổ (mở Bản đồ là đã xem, có đất mới thì báo lại), hoặc môn đang bị đánh (tin trong 2 giờ). Đo `sm_dot_dat`.
  - Câu dẫn khai hoang: 3 câu mỗi cõi (Thiên, Hồng Trần, U Minh) trong `lib/sonmon/data.ts` `KH_DAN`, rà humanizer.
  - Tin hệ thống Truyền âm: CHƯA XONG phần máy chủ. Giao diện đã sẵn (dòng giữa, nền tối, không tên; dùng `vkl_sm_chat_list2`, máy chủ chưa có thì tự dùng hàm cũ). SQL `supabase/son_mon_chat_he_2026_11_19.sql` (bảng MỚI `vkl_sm_chat_he` chung dãy id với chat, trigger nuốt lỗi trên `vkl_sm_bao` và `vkl_sm_chinh`, hàm MỚI `vkl_sm_chat_list2`) bị chặn: Supabase MCP hỏi xác nhận (có trigger trên bảng cũ) mà câu hỏi không tới ai, hết 180 giây. Không lách. Tyler chạy file này trong SQL Editor là tính năng tự hiện, không cần lên bản lại. Để ô [ ] ở việc này.

## Ngày 8d - Người chơi đã "full": kết cục mới, cảnh giới mới, chọn thế giới khởi đầu (góp ý Hoang Le)
Lên bản: 2026-11-19. Đêm nay chủ yếu là NGHIÊN CỨU + THIẾT KẾ (tài liệu), chỉ code phần nhỏ chắc chắn xong. Không chen trước 8a.
Tyler 20:44 18/11: suy nghĩ kỹ về bình luận Facebook (bài "Đủ 30: +10% - Đủ 50: +20%", 18/11): Hoang Le: "Ra thêm kết cục và cảnh giới mới đi ông. Ông ra thêm lúc vào chọn 1 thế giới đi với cảnh giới đó luôn cho dễ. Chứ full hết rồi". Ảnh kèm: Sổ Sinh Tử 86/95, Thiên thư 10/10, Bảo khố 297/297, Kiếp Số 10 - Hồn vẹn 100, nhiệm vụ 3/3, đã mua thiên phú (3487 phúc duyên), thiên phú tà đạo (1950 nghiệp lực).
- [x] Số liệu: bao nhiêu người đã gần hết nội dung (Sổ Sinh Tử từ 80/95, Thiên thư 10/10, Bảo khố đầy, đã đạt cảnh giới cao nhất); họ còn chơi mỗi ngày không, chơi gì (Lôi đài, Sơn Môn, chỉ đầu thai cày); kết cục nào ít ai đạt nhất. Ghi vào docs/tang-truong.md.
- [x] Thiết kế (game-design: game-direction, player-experience, balance-review; story-writing cho nội dung), lưu `docs/thiet-ke-hau-ky.md`:
  1. **Kết cục mới - THIÊN THƯ QUYỂN III, 30 kết cục (Tyler chốt 20:48 18/11; 21:04: tổng 30, mạch chính 20):** dùng `anthropic-skills:story-writing` (story-long-write: mạch truyện xuyên kiếp, sổ theo dõi tính liền mạch) và `anthropic-skills:script-writing` (plot-points, drama-planner: móc câu, cú lật) để viết.
     - Phải HỢP LÝ: đọc kỹ `lib/game/lore.ts` (quyển I: 10 mảnh, "vì sao cứ phải luân hồi") và quyển II (Kẻ Gõ Chuông, gõ/đập chuông trong `lib/game/endings.ts`) để quyển III nối tiếp câu chuyện, không mâu thuẫn, trả lời câu hỏi còn treo và mở câu hỏi mới. Lưu dàn ý truyện quyển III vào `docs/thien-thu-3.md` (bối cảnh, nhân vật, các mảnh/chặng, 30 kết cục xếp theo chặng, điều kiện mở từng cái).
     - 30 kết cục chia nhóm: mạch chính quyển III (20, mở theo thứ tự như quyển I/II, chia 4 chặng x 5), kết cục gắn hệ thống mới (Sơn Môn, Sư Đồ, chân thân, Lôi đài, cảnh giới mới, chọn thế giới khởi đầu: 6), kết cục hiếm/bí ẩn cho người tò mò (4). Mỗi kết cục có tên, lời dẫn, `hint` và `how` như kết cục cũ, viết tr('Việt', 'English'), rà humanizer.
     - Mở quyển III khi đã xong quyển II (người full như Hoang Le có việc ngay). Sổ Sinh Tử 95 -> 125.
     - Đêm nay: xong dàn ý `docs/thien-thu-3.md` + viết đủ chữ 30 kết cục. Code: làm chặng 1 (5 kết cục mạch chính) nếu kịp và thử sạch; còn lại chia các đêm sau, ghi vào kế hoạch.
  2. **Cảnh giới mới trên cảnh giới cao nhất hiện tại:** tên, điều kiện mở, làm gì khác (không chỉ số to hơn), mô phỏng `sim-do-kho.ts` để không phá cân bằng kiếp thường.
  3. **"Chọn thế giới đi với cảnh giới đó" (ý chính của Hoang Le):** người đã đạt cảnh giới X ở kiếp trước thì lúc đầu thai được chọn thế giới/cõi khởi đầu tương ứng (ví dụ đã từng Hóa Thần thì có thể sinh thẳng vào giới tu tiên cao, bỏ đoạn đầu), đổi lại phần thưởng/kết cục khác. Đánh giá: tiết kiệm thời gian cho người cũ vs mất cảm giác lớn dần; cách giữ người mới không bị bỏ lại; có nên chỉ mở cho người full Sổ Sinh Tử.
  4. Thứ tự làm và chia đêm, cái nào lên trước (ưu tiên thứ người full thấy ngay: kết cục mới + chọn thế giới).
- [ ] (CHUYỂN sang Ngày 8e) Nếu kịp và chắc chắn: code chặng đầu Thiên thư quyển III (5 kết cục mạch chính chặng 1, thêm chặng 2 nếu kịp), thử như thường lệ (sim-do-kho trước/sau nếu đổi điều kiện kiếp). Chưa đủ chặng thì giấu sau cờ.
- [x] Soạn sẵn câu trả lời bình luận cho Tyler tự đăng (xưng "mình", gọi "bạn", không hứa ngày, nói đang làm gì; humanizer). KHÔNG tự đăng.
- Xong (3/4, phần code chuyển 8e): 2026-11-18 dbe6cbf
- Ghi chú:
  - Số liệu và thiết kế: `docs/thiet-ke-hau-ky.md` (bảng số, cảnh giới Chân Nhân, chọn thế giới khởi đầu, thứ tự làm, câu trả lời Hoang Le). Dàn ý và chữ đủ 30 kết cục: `docs/thien-thu-3.md` (Claude chốt các chỗ còn treo ở mục 1 của thiết kế).
  - Số chính: 22 người xong quyển II (16 chơi hôm nay, 13 ở Sơn Môn); 257 người có Quy Nhất mà chưa xong quyển II; 191 người đã Khai Thiên Lập Địa; chỉ 2 người từ 60/95 kết cục.
  - Claude tự chốt: KHÔNG code chặng 1 đêm nay. Chặng 1 chạm vòng đời kiếp (gắn `c.tt3`, hàm ghi kèm cạnh `alsoEndings`, nút Uống ở cầu Nại Hà) và màn Thiên thư; làm vội sau 3 khối Sơn Môn thì không thử đủ. Chuyển thành khối Ngày 8e (lên bản 20/11, giấu sau cờ).

## Ngày 8e - Thiên thư quyển III: khung + chặng 1 (giấu sau cờ)
Lên bản: 2026-11-20. Giấu sau cờ `TT3_ON` (tắt mặc định) tới khi thử sạch; bật trong cùng khối nếu sạch. Có cáo thị: thêm một dòng vào bản gần nhất "Thiên thư quyển III mở chặng 1 cho ai đã xong quyển II". Làm SAU các khối Sơn Môn tới hạn cùng đêm (Ngày 9). Kỹ năng: `anthropic-skills:gamedev` (save-systems cho trường Meta mới), `anthropic-skills:game-design` (player-experience), `anthropic-skills:story-writing`, `anthropic-skills:humanizer`.
Nguồn: `docs/thien-thu-3.md` mục 4, 5 (chặng 1), 9; `docs/thiet-ke-hau-ky.md` mục 1, 4. Chữ lấy đúng từng chữ trong `docs/thien-thu-3.md`.
- [x] Khung: `LORE` thêm `book: 3` (trang XXI-XL), tab quyển III ở màn Thiên thư (chưa mở thì ghi lý do ngay trên tab: "Xong quyển II để mở"), `m.tt3Nhanh` (đặt một lần), `c.tt3` lúc đầu thai, hàm `tt3Endings(c, meta)` ghi kèm cạnh `alsoEndings`, mạch chính mở đúng thứ tự. Sổ Sinh Tử đếm đúng số kết cục đã có code.
- [x] Chặng 1: `tt3_du_am`, `tt3_dong_xanh`, `tt3_lang_duoi_nui`, `tt3_tre_quy_cua` (trọng số `nhan_de_tu` x5 khi `c.tt3 === 3`), `tt3_tieng_dau` (móc nút Uống ở cầu Nại Hà) và `tt3_than_khong_mong`.
- [x] Thử: `sim-do-kho 3000` trước/sau (kiếp thường không đổi), đo số kiếp trung bình để gặp đứa trẻ quỳ ở trang XXIV (mục tiêu dưới 4), Playwright 390x844 màn Thiên thư quyển III (người mới: không thấy tab; người full: thấy trang XXI), smoke như thường.
- [x] Đo: `tt3_mo` (mở trang), số người đạt từng kết cục chặng 1 sau 3 ngày.
- Xong: 2026-11-19 (commit "Ngày 8e")
- Ghi chú:
  - Cờ `TT3_ON` (lib/flags.ts) bật mặc định vì thử sạch; tắt gấp bằng `NEXT_PUBLIC_TT3=0`.
  - Code: `lib/game/tt3.ts` (TT3_MAIN, tt3Born gắn `c.tt3`/`c.tt3Nhanh` lúc đầu thai, tt3Endings ghi kèm, tt3AtBridge cho XXV, TT3_PAGES chữ đúng từng chữ docs/thien-thu-3.md). Trang Thiên thư quyển III làm riêng trong `TT3_PAGES` (không nhét vào LORE để không đụng đếm quyển I/II); `m.tt3Nhanh` đặt một lần khi kiếp khép mà quyển III đã mở; XXI có bản nhánh đập chuông. Kết cục ghi kèm xét SAU khai huyệt nên Thân Không Mơ đọc đúng số huyệt. Sổ Sinh Tử 95 -> 101. Gợi ý "gần mở nhất" không đưa kết cục quyển III cho người chưa mở quyển.
  - Màn Thiên thư: tab quyển III chỉ hiện cho người đã mở quyển II; chưa xong quyển II thì tab ghi "Xong quyển II để mở". Trang chưa tới lượt ghi "Mở trang trước đã.", sau XXV có dòng "XXVI. Còn đang chép.".
  - sim-do-kho 3000 (thêm biến TT3): kiếp thường không đổi (tuổi chết TB 108 và 110, Trúc Cơ 78,0% và 78,7%, sai số ngẫu nhiên). Nhận đồ đệ: 21,3% số kiếp (4,7 kiếp mới gặp) -> 31,4% khi đang ở trang XXIV (3,2 kiếp), đạt mục tiêu dưới 4 (người full lên Trúc Cơ chắc chắn nên còn nhanh hơn).
  - Playwright 390x844: người full thấy 3 tab, quyển III 2/5, XXII mở sẵn, XXIII hiện cách mở; người mới chỉ thấy 2 tab (Quyển II phong ấn). Không lỗi trang. Smoke đủ 5 bộ OK.
  - Đo: sự kiện `tt3_mo` (ids, lifeNo), `tt3_tab`. Sau 3 ngày đếm `vkl_players.meta->'endings'` có từng id tt3_.
  - huashu-design chấm 5 mặt màn quyển III: nhất quán 9 (dùng đúng khung tt-list có sẵn), thứ bậc 8, chi tiết 7, dễ dùng 8, mới lạ 6 (lặp màn cũ, đúng ý đồ). Không có lỗi nặng. Cổng 3 hướng không chạy: màn lặp trong phong cách sẵn có.
  - Cáo thị: nhóm "Mới 20/11" trong 4.6.0 (quyển III + báo trước Điểm giữ đất từ 5:00 21/11 cho Ngày 9).

## Ngày 8f - Chọn thế giới khởi đầu khi đầu thai (giấu sau cờ)
Lên bản: 2026-11-22 (làm 20-21/11, mỗi đêm một phần, giấu sau cờ `KHOI_DAU_ON`). Có cáo thị khi bật. Nguồn: `docs/thiet-ke-hau-ky.md` mục 3 (Phàm, Tu chân, Tiên, Hồng Hoang; mở khi đạt mốc 5 lần; phúc duyên x0,8 / x0,6 / x0,5; ô khóa ghi lý do ngay trên ô).
- [ ] Máy: đếm số lần đạt Kim Đan / phi thăng / Khai Thiên qua các kiếp (Meta), màn chọn ở bước đầu thai (mặc định Phàm giới, người mới không thấy ô khác).
- [ ] Khởi tạo nhân vật theo khởi đầu (tuổi, cảnh giới, chỉ số như người chăm tu); kiếp bỏ qua đoạn đầu không tính bảng xếp hạng tuổi; Lực chiến Sơn Môn chỉ tính năm sống thật.
- [ ] Mô phỏng `sim-do-kho 3000` và `sim-farm 200` trước/sau; đo `khoi_dau`, thời gian một kiếp, số kiếp mỗi ngày của nhóm Khai Thiên.
- [ ] uiux-pro-max + huashu-design (2 vai) + humanizer, rồi bật cờ.
- Ghi chú:

## Ngày 9 - Kỷ 2 làm sớm: máy chủ (giấu sau cờ)
Lên bản: 2026-11-20. Giấu sau cờ `SM_DAT_ON` (tắt mặc định). Có cáo thị: thêm một dòng vào 4.6.0 báo trước "Từ 5:00 ngày 21/11 hạng Kỷ tính theo Điểm giữ đất".
Tyler chốt 18/11: "Làm luôn Kỷ 2 vào 21/11 coi như tính năng". Nguồn ý: báo cáo `claude/nghien-cuu-game-chien-thuat-text-son-mon.md` (Travian oasis, Torn territory, Tribal Wars giữ làng, Utopia/SFC2 dải sức mạnh, Mob Wars boss).
Claude chốt (vai chủ game):
- **Điểm giữ đất thay số ô để xếp hạng Kỷ 1, tính từ 5:00 21/11** (mọi môn bắt đầu từ 0, báo trước 2 ngày nên không ai mất lợi): mỗi giờ mỗi ô môn đang giữ cộng điểm: ô thường 1, Linh Mạch 3, Thiên Trì (ô tâm 0,0) 5. Bằng điểm thì xét số ô rồi tổng Khí vận. Bảng Kỷ hiện điểm và số ô. pg_cron mỗi giờ phút 0.
- **Linh Mạch:** 12 ô (4 mỗi cõi, ở vòng 3-4), đặt tên riêng, biểu tượng mạch ngọc trên bản đồ. Môn giữ Linh Mạch lúc 5:00 được +2 Khí vận mỗi ô cho hôm đó. Không cộng chỉ số vào kiếp.
- **Thiên Trì** (ô tâm): mở từ 21/11, 5 điểm/giờ, người đứng giữ ô này +10% lực giữ (ô ai cũng muốn).
- **Yêu thú chiếm ô (đánh máy):** mỗi ngày 5:00 tối đa 8 ô trống ở vòng ngoài (vòng 5-6) bị yêu thú chiếm, lực giữ cố định 1.500-6.000 theo vòng (mô phỏng chỉnh để môn 5-8 người thắng được). Không khai hoang được ô yêu thú, phải xuất chinh như thường (trinh sát thấy đúng lực). Thắng: ô về môn, mỗi người đi theo +10 phúc duyên. Thua: nghỉ 2 giờ như thường. Yêu thú không đánh ai. Hết ngày chưa ai đánh thì ô về trống.
- **Dải sức mạnh:** chỉ xuất chinh vào ô của môn có tổng Lực chiến (có trần) từ 1/3 môn mình trở lên. Ngoại lệ: Linh Mạch và Thiên Trì ai cũng đánh được (không trốn trên đất quý).
- **Thù 12 giờ:** môn vừa chiếm ô của môn khác thì 12 giờ sau mới đánh tiếp ô khác của môn đó (chống dồn đánh một môn).
- **Môn bỏ hoang:** môn 72 giờ không ai trong môn chơi kiếp hay mở Sơn Môn thì mọi ô trừ chính điện về trống (báo trong chiến báo).
- [x] Bảng/cột MỚI: `vkl_sm_tile.loai` ('thuong','linh_mach','thien_tri','yeu_thu') + `yeu_luc`; bảng `vkl_sm_diem` (ky_id, mon_id, diem, cap_nhat). Hàm MỚI `vkl_priv.sm_diem_gio()` (cron mỗi giờ), `vkl_priv.sm_yeu_thu_5h()` (cron 5:00), `vkl_priv.sm_bo_hoang()`; đặt 12 Linh Mạch + Thiên Trì cho Kỷ 1 (chỉ ô đang trống; ô đã có chủ thì giữ nguyên chủ, đổi loại).
- [x] Tính trận với ô yêu thú: hàm MỚI thay thế (không sửa `sm_tran` cũ) và gọi từ tick mới, hoặc nhánh trong hàm mới `vkl_sm_march2` + `sm_tran2`; giữ đúng luật trận cũ cho ô môn khác.
- [x] Dải sức mạnh + thù 12 giờ: trong `vkl_sm_march2` (hàm mới), giao diện gọi hàm mới khi cờ bật.
- [x] `vkl_sm_rank2`, `vkl_sm_map2` (trả loại ô, điểm), `vkl_sm_state` thêm điểm Kỷ (hàm mới `vkl_sm_state2` nếu cần).
- [x] Mô phỏng `scripts/sim-son-mon.ts` thêm điểm giữ đất, Linh Mạch, yêu thú: môn 15 người / 8 người / 3 người cuối Kỷ được bao nhiêu điểm, môn 3 người giữ 1 Linh Mạch có vượt môn 15 người toàn ô thường không (mục tiêu: có, nếu giữ đủ lâu). Ghi số vào Ghi chú.
- [x] Thử SQL trong giao dịch rồi hủy (như Khai hoang 18/11), cron chạy 2 lần không hỏng.
- Xong: 2026-11-19 (máy chủ; giao diện ở Ngày 10)
- Ghi chú:
  - SQL: `supabase/son_mon_dat_ky2_2026_11_19.sql`. Không thêm cột vào bảng cũ: loại ô ở bảng MỚI `vkl_sm_dat` (q, r, loai, ten_rieng, yeu_luc), điểm ở `vkl_sm_diem`, thù ở `vkl_sm_thu`, cấu hình ở `vkl_sm_cfg` khóa 'dat' (bat_dau 2026-11-20T22:00Z, mọi hàm mới chỉ chạy từ đó). Cron MỚI: `vkl_sm_diem_gio` (phút 0), `vkl_sm_dat_5h` (22:00 UTC), `vkl_sm_tick2` (mỗi phút).
  - Yêu thú do một môn hệ thống "Yêu Thú" giữ (giải tán sẵn nên không hiện ở danh sách, xếp hạng), ô có bảo hộ 100 năm: hàm cũ không khai hoang, không xuất chinh vào được; chỉ `vkl_sm_march2` đánh được. `sm_tick2` tính trước đoàn sắp tới nơi (70 giây) bằng `sm_tran2` (bản sao `sm_tran` + yêu thú + Thiên Trì x1,1 + ghi thù), tick cũ thấy đoàn đã xong thì bỏ qua.
  - Áp: phần bảng qua MCP; phần hàm Supabase MCP hỏi xác nhận không ai trả lời nên Tyler chạy trong SQL Editor (3 lần, có 2 lỗi bắt được khi thử: cột `ten` là cột sinh; biến vòng lặp `r` trùng cột `r`).
  - Thử trong giao dịch rồi hủy (dời bat_dau về trước): 5:00 lần 1 = 12 Linh Mạch + Thiên Trì, 8 yêu thú, 3 ô Linh Mạch đang có chủ được cộng Khí vận, 0 môn bỏ hoang; lần 2 = 'da_chay'. Điểm giờ lần 1 ghi 14 môn, lần 2 = 0. Xếp hạng 2: Vô Hư Cốc và Thái Đỉnh Đạo Viện 10 điểm/giờ (có Linh Mạch hoặc Thiên Trì), Cửu Kiếm Phái 6. Đánh ô yêu thú: môn đủ ô thì hủy 'du_o' đúng luật; môn 9 (6 người, 32.606 lực) đánh ô yêu 5.000 thì thắng, ô về môn, 6 người nhận +10 phúc.
  - Mô phỏng (số thật 19/11): người trong môn trung vị 6.357 Lực chiến có trần; môn 15 người 77.000-123.000, môn 6 người 32.600, môn 1 người 6.300-7.700. Lực yêu thú 1.500-6.000 trong kế hoạch thì một người cũng thắng, nên Claude chốt vòng 5: 10.000-18.000, vòng 6: 18.000-30.000 (cần 2-5 người theo; môn 6 người thắng vòng 5 với 2-3 người theo). Điểm tới hết Kỷ 1 (280 giờ): môn 15 người giữ 6 ô thường 1.680 điểm; môn 3 người (2 ô) giữ Thiên Trì + 1 Linh Mạch 8/giờ = 2.240, vượt môn 15 người nếu giữ đủ lâu (đúng mục tiêu). Dải 1/3: môn 15 người (80.000+) không đánh được môn 1 người (dưới 27.000), môn nhỏ vẫn đánh được môn lớn.
  - Đợi Tyler chạy đoạn chỉnh lực yêu thú (cfg y5/y6 + `sm_dat_5h` đọc cfg). Chưa chạy thì mọi thứ vẫn chạy, chỉ là yêu thú dễ (1.500-6.000, một người cũng thắng). Nên chạy trước 5:00 21/11.

## Ngày 10 - Kỷ 2 làm sớm: giao diện, bật cờ
Lên bản: 2026-11-21. Bật cờ `SM_DAT_ON` lúc 5:00 21/11 (điểm bắt đầu tính). Có cáo thị 4.6.1 (bản mới): "Đất có giá": Linh Mạch, Thiên Trì, yêu thú, điểm giữ đất, luật dải sức mạnh.
- [ ] Bản đồ: biểu tượng pixel Linh Mạch (mạch ngọc xanh), Thiên Trì (hồ sen vàng), yêu thú (đầu thú đỏ, ghi lực giữ); chú thích; chạm ô ghi "+3 điểm mỗi giờ, +2 Khí vận mỗi sáng".
- [ ] Môn nhà: thẻ Lãnh thổ thêm "Điểm Kỷ: 1.240 · +9 mỗi giờ"; Xếp hạng Kỷ theo điểm (vẫn ghi số ô).
- [ ] Xuất chinh: ô ngoài dải ghi lý do "Môn này yếu hơn 1/3 môn ta, đánh không được trừ ở Linh Mạch và Thiên Trì"; ô yêu thú ghi "Đánh máy, thắng mỗi người +10 phúc duyên".
- [ ] Luật Sơn Môn: thêm câu hỏi "Điểm giữ đất là gì?", "Yêu thú là gì?", "Sao không đánh được môn kia?"; thẻ 3 câu đổi câu 3: "Hết Kỷ, môn nhiều Điểm giữ đất nhất thắng".
- [ ] uiux-pro-max + humanizer cho mọi màn mới; `smoke-son-mon` thêm màn Linh Mạch, yêu thú, ô ngoài dải.
- [ ] Bài đăng Page + Group cho Tyler tự đăng (không tự đăng): "Từ hôm nay đất có giá".
- Ghi chú:

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
