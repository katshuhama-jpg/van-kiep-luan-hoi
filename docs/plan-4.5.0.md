# Kế hoạch 4.5.0 - Chân Thân, Khai Mạch, Sư Đồ

Nguồn: brainstorm 9/11/2026 (doc Project `brainstorm-kiep-2-10.md`, báo cáo `giu-chan-sau-cot-truyen.md`), nháp giao diện canvas "Chu Thiên Khai Mạch". Tyler chốt 9-10/11 (xem mục "Đã chốt").

Chỉ làm sau khi 4.4.x Hồng Hoang đã lên main. Luật trả lời góp ý, tặng phúc, thử trước khi đẩy: như đầu `docs/plan-4.1.0.md`. Mỗi lần chạy làm khối đầu tiên còn ô trống, ghi "Xong:" và "Ghi chú:". Toàn bộ 4.5.0 lên cùng một cáo thị khi xong khối Ngày 4 (các khối trước có thể đẩy lên nhưng giấu sau cờ `CHAN_THAN_ON`, tắt mặc định).

## Vì sao (số thật 9/11)

- Kiếp 1 ổn: 79% chơi xong (trung vị 12,6 phút), 71% lên Kim Đan.
- 47% người mới chơi đủ 10 kiếp trong 7 ngày, 79% đủ 3 kiếp. Người chơi không thiếu kiếp, mà thiếu lý do để kiếp sau khác kiếp trước.
- Còn chơi (2 ngày qua) theo số kiếp đã chơi: 2-3 kiếp 1%, 4-10 kiếp 6%, 11-30 kiếp 22%, 31+ kiếp 53%.
- Còn chơi sau 7 ngày: 11% (trước ads 14%, từ ads 9%). Tắt ads còn khoảng 30 tài khoản mới mỗi ngày.

Mục tiêu: mỗi kiếp là một giấc mộng; mộng tan, chân thân còn. Người chơi có một "chính mình" cố định, và mỗi kiếp làm được việc gì đó thì để lại dấu nhìn thấy được trên chân thân.

Chỉ số đo: tỉ lệ còn chơi sau 7 ngày của nhóm vào sau bản này, so với mốc 11-14%. Phụ: % tạo chân thân sau kiếp 1, % đủ 10 huyệt trong 14 ngày.

## Đã chốt (Tyler)

- Làm cho mọi tài khoản, không chỉ người mới. Không khóa hệ thống nào đang có.
- Huyệt KHÔNG mở theo số lần chết (dễ spam). Mở theo thử thách làm được trong một kiếp.
- Chân thân là nhân vật cố định qua mọi kiếp, người chơi chọn ngoại hình và đặt tên. Nhân vật trong mỗi kiếp vẫn đầu thai ngẫu nhiên như cũ.
- Màn tạo chân thân: chọn giới tính, màu da, 1 trong 10 kiểu tóc, màu tóc, và 1 trong 10 bộ trang phục đơn giản, mỗi giới tính 10 tóc và 10 trang phục. Báo rõ cho người chơi: ngoại trang khác sẽ tìm được ở các phần tiếp theo.
- Có đoạn mở đầu dạng animation để người chơi hiểu chân thân là gì, và màn giới thiệu huyệt đạo để hiểu huyệt là gì, khai thế nào, được gì.
- KHÔNG hiện chân thân trong kiếp (kể cả bóng mờ). Chân thân chỉ ở ngoài: màn cáo biệt, trang chủ, bảng Chu Thiên.
- Biên niên giang hồ: Tyler tự đăng lên Page, không làm task tự đăng.

## Ngày 1 - Dữ liệu chân thân và huyệt
- [ ] Ghi mốc vào `docs/so-lieu.md`: còn chơi sau 1 và 7 ngày theo tuần vào, phân bố số kiếp, % đủ 10 và 31 kiếp trong 7 và 14 ngày (để lại câu SQL để chạy lại).
- [ ] `meta.chanThan`: `{ name, gender, skin, hair, hairColor, outfit, createdAt, renamed }`, lưu cùng meta (đồng bộ lên `vkl_saves` như các trường meta khác). Chưa có thì là `null`.
- [ ] `lib/game/chanThan.ts`:
  - Bảng màu da: 6 màu, dùng đúng các tông da LPC đang có.
  - 20 kiểu tóc (10 nam, 10 nữ) từ các lớp `hair_*` có trong `public/lpc`.
  - 8 màu tóc dùng chung cho mọi kiểu, nhuộm bằng đúng cách tô màu lớp LPC đang dùng: đen tuyền, nâu đen, nâu hạt dẻ, đỏ sẫm, vàng rơm, bạc, trắng tuyết, xanh lam đậm. Mặc định đen tuyền. Đặt tên ngắn: "Búi cao", "Xõa dài", "Đuôi ngựa"...
  - 20 bộ trang phục khởi đầu (10 nam, 10 nữ), không gồm tóc: áo + màu áo từ các lớp LPC có sẵn (kimono, áo vải, đạo bào...), chỉ kiểu đơn giản, không giáp, không cánh, không hào quang. Đặt tên mộc mạc: "Áo vải thôn dã", "Đạo bào xanh", "Thư sinh"...
  - Hàm vẽ chân thân dùng lại bộ ghép lớp LPC đang có cho nhân vật, tư thế ngồi thiền (hoặc đứng nếu chưa có khung ngồi).
  - Lọc tên: 2-12 ký tự, chữ cái tiếng Việt và khoảng trắng, chặn danh sách từ tục (đưa vào `lib/game/tenCam.ts`, có cả dạng viết tắt, không dấu). Gợi ý tên ngẫu nhiên từ bộ họ tên tu tiên đang dùng.
- [ ] `lib/game/khaiMach.ts`: 36 huyệt Chu Thiên (tên huyệt thật: Dũng Tuyền, Quan Nguyên, Khí Hải, Mệnh Môn, Trung Quản, Cự Khuyết, Đản Trung, Thiên Đột, Ấn Đường, Bách Hội...). Hàm `openHuyet(meta)` tính từ dữ liệu có sẵn (`meta.lives`, `meta.endings`, `meta.itemBook`, `meta.lore`, `meta.career`), không lưu thêm.
  - Huyệt 1-10 (Thập Kiếp Khai Mạch): mỗi huyệt một thử thách, xét lúc kiếp kết thúc, mỗi kiếp mở tối đa 1 huyệt, theo thứ tự. Thử thách dạy dần từng hệ thống: sống qua 30 tuổi; lên Luyện Khí; vào một tông môn; lên Trúc Cơ và chọn con đường; kết đạo lữ hoặc nuôi linh thú; diệt 30 yêu thú trong một kiếp; thắng một trận giang hồ; lên Kim Đan; sống qua 100 tuổi; lên Nguyên Anh. Kiếp chết yểu hay chết vội không mở gì. Tài khoản cũ: xét từ `vkl_lives` và `meta.career`, ai từng đạt thì mở luôn.
  - Mỗi huyệt 1-10 một lợi ích nhỏ áp lúc đầu thai (`newChar`): linh thạch khởi đầu, sức khỏe, thọ, ngộ tính, tâm cảnh, khí vận, tu luyện %, đột phá %, ngọc bội hộ thân lúc 16 tuổi. Huyệt 10 Bách Hội: chân thân thức tỉnh, danh hiệu "Khai Mạch".
  - Huyệt 11-36: mở theo mốc dài hạn, không mốc nào chỉ đếm số kiếp (số kết cục, đồ ẩn, mảnh Thiên thư, lần đầu Hóa Thần, phi thăng, Chứng Đạo, cảnh giới Hồng Hoang). Thưởng chỉ mỹ quan: màu hào quang, khung bia, danh hiệu, và một số bộ ngoại trang mới cho chân thân. Không thêm sức mạnh sau Chứng Đạo.
- [ ] Cân bằng: `npx tsx scripts/sim-do-kho.ts 3000` trước và sau với đủ 10 huyệt. Tỉ lệ lên Hóa Thần tăng không quá 3 điểm, nếu quá thì giảm số.
- Xong:
- Ghi chú:

## Ngày 2 - Đoạn mở đầu, màn tạo chân thân, giới thiệu huyệt đạo
- [ ] Đoạn mở đầu "Mộng Tỉnh" (cảnh pixel trong game, không dùng video): 5 khung, chạm để qua, có nút Bỏ qua, nhạc nền hiện có.
  1. Màn tối, nhân vật kiếp vừa rồi tan thành bụi sáng. "Ngươi vừa chết. Nhưng đó chỉ là một giấc mộng."
  2. Giữa hư không, một bóng người ngồi thiền, chưa rõ mặt.
  3. Bụi sáng bay vào bóng người, một huyệt ở lòng bàn chân sáng lên.
  4. "Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Khai đủ Chu Thiên, chân thân thức tỉnh."
  5. Bóng người hiện rõ, chuyển sang màn tạo chân thân.
- [ ] Màn tạo chân thân (một màn, đọc và bấm):
  - Chân thân lớn ở giữa, đổi ngay khi chọn.
  - Hàng 1: giới tính (2 nút). Hàng 2: màu da (6 ô). Hàng 3: kiểu tóc, lướt ngang 10 kiểu của giới tính đã chọn. Hàng 4: màu tóc (8 ô). Hàng 5: trang phục, lướt ngang 10 bộ, mỗi bộ có tên. Đổi giới tính thì kiểu tóc và trang phục về lựa chọn đầu của giới đó, giữ màu da và màu tóc.
  - Nút "Ngẫu nhiên".
  - Ô tên, điền sẵn tên gợi ý, nút xúc xắc đổi tên gợi ý.
  - Dòng nhỏ dưới trang phục: "Ngoại trang khác sẽ tìm được trên đường tu: khai huyệt, kết cục hiếm, cõi trên."
  - Nút "Định chân thân".
- [ ] Màn giới thiệu huyệt đạo "Chu Thiên Đồ" (ngay sau khi định chân thân, trước màn cáo biệt): 3 khung, chạm để qua, có nút Bỏ qua. Chân thân người chơi vừa tạo đứng giữa, các huyệt hiện dần theo lời.
  1. Huyệt là gì: "Trên chân thân có 36 huyệt Chu Thiên. Mỗi huyệt khai là một phần đạo của ngươi được giữ lại qua các giấc mộng." Các chấm huyệt hiện mờ dọc thân.
  2. Khai thế nào: "Mỗi kiếp làm được việc huyệt đòi hỏi, mộng tan thì huyệt khai. Mỗi kiếp khai nhiều nhất một huyệt. Chết vội không khai gì." Ví dụ huyệt đầu: Dũng Tuyền - sống qua 30 tuổi.
  3. Được gì: "Mười huyệt đầu giúp kiếp sau mạnh hơn một chút. Khai đủ mười, chân thân thức tỉnh. Hai mươi sáu huyệt còn lại cho hào quang, ngoại trang, danh hiệu." Chỉ thanh 10 ô và lưới 26 ô.
  - Sau khung 3: nếu kiếp vừa rồi đã đạt thử thách huyệt 1 thì cho xem huyệt Dũng Tuyền khai ngay trên màn này (chớp sáng, dòng lợi ích), rồi sang màn cáo biệt. Chưa đạt thì hiện "Huyệt kế: Dũng Tuyền - sống qua 30 tuổi" và sang màn cáo biệt.
  - Người cũ: xem sau màn tạo, rồi tới cảnh thức tỉnh (nếu đủ 10) hoặc màn số huyệt đã khai.
  - Xem lại được: nút "?" ở trang `/chan-than`, trên chip thử thách trong kiếp và ở bảng Chu Thiên mở lại 3 khung này.
  - Đo: `huyet_intro` (xem hết hay bỏ ở khung nào, xem lại từ đâu).
- [ ] Khi nào hiện:
  - Người mới: ngay sau khi kiếp 1 khép lại, trước màn cáo biệt. Không chen vào trước kiếp 1.
  - Người cũ (đã có kiếp): lần đầu vào sau bản này, từ trang chủ: đoạn mở đầu, màn tạo chân thân, rồi cảnh "Chân thân thức tỉnh" nếu đã đủ 10 huyệt.
  - Bỏ qua đoạn mở đầu được, nhưng màn tạo chân thân thì phải xong mới đi tiếp (có nút Ngẫu nhiên nên chỉ mất một chạm).
- [ ] Đổi về sau (trong trang `/chan-than`): đổi ngoại hình miễn phí bất cứ lúc nào. Đổi tên: lần đầu miễn phí, từ lần thứ hai tốn phúc duyên. Tên đi qua bộ lọc trên cả máy chủ (hàm Supabase mới), không chỉ trên trình duyệt.
- [ ] Đo: `ct_intro` (xem hết hay bỏ qua, khung bỏ), `ct_create` (gender, hair, hairColor, outfit, random hay tự chọn, sửa tên hay giữ gợi ý), `ct_rename`.
- Xong:
- Ghi chú:

## Ngày 3 - Huyệt trên giao diện
- [ ] Màn cáo biệt: chân thân của người chơi (không phải nhân vật kiếp vừa rồi) với các huyệt là chấm pixel dọc thân. Huyệt vừa khai to hơn và chớp sáng, kèm dòng "Huyệt Khí Hải khai: tu luyện +2% từ kiếp sau". Bên dưới: thanh 10 ô Thập Kiếp và thử thách của huyệt kế. Kiếp không khai huyệt thì chỉ hiện thử thách đang chờ.
- [ ] Trang chủ: thẻ "Chân thân" dưới dải giang hồ, trên nút Lôi đài (dòng Thất Nhật Lục dời vào Tàng Kiếp Các). Thẻ có hình chân thân nhỏ với huyệt sáng, tên chân thân, thanh 10 ô, thử thách của huyệt kế, lợi ích đang hưởng. Chạm mở `/chan-than`.
- [ ] Trang `/chan-than`: chân thân lớn, tên, nút đổi ngoại hình và tên, bảng Chu Thiên (10 huyệt Thập Kiếp với thử thách và lợi ích; 26 huyệt Chu Thiên dạng lưới, 6 ô cuối để "?"), tủ ngoại trang (bộ đã có và ô khóa ghi gợi ý cách mở).
- [ ] Trong kiếp: chip nhỏ góc trên trái sân khấu chỉ ghi thử thách, ví dụ "Huyệt Thiên Đột: lên Kim Đan" (không vẽ chân thân trong kiếp). Chạm mở bảng. Khi kiếp này đạt thử thách: thông báo "Kiếp này đã đủ khai huyệt X, huyệt khai khi kiếp khép lại", chip đổi sang vàng.
- [ ] Màn đầu thai: một dòng nhỏ "Chu Thiên 7/36", chạm mở bảng.
- [ ] Cảnh "Chân thân thức tỉnh" khi khai huyệt 10 (và một lần cho người cũ đã đủ 10): nền tinh không, 10 huyệt sáng lần lượt, nhận danh hiệu "Khai Mạch", chạm để bỏ qua.
- [ ] Thẻ khoe chân thân (dùng `lib/shareCard.ts`): chân thân, tên, số huyệt, danh hiệu.
- [ ] Đo: `huyet_open` (id, lifeNo), `huyet_view`, `huyet_share`, `ct_card_tap`.
- Xong:
- Ghi chú:

## Ngày 4 - Thử, cáo thị, lên bản
- [ ] Thử: Playwright 390x844 cho người mới (kiếp 1 xong, mở đầu, tạo chân thân, giới thiệu huyệt, cáo biệt có huyệt 1), người cũ 40 kiếp (mở đầu, tạo, thức tỉnh), tên tục bị chặn, đổi tên lần hai trừ phúc. Chụp ảnh gửi Tyler.
- [ ] Quay lại đoạn mở đầu thành video ngắn dọc 9:16 (Playwright quay màn) để Tyler đăng Page và Threads làm teaser. Gửi file cho Tyler, không tự đăng.
- [ ] Bật cờ `CHAN_THAN_ON`. Cáo thị 4.5.0 ngắn: chân thân, Chu Thiên, ngoại trang sẽ có thêm. Không ghi số cụ thể.
- Xong:
- Ghi chú:

## Ngày 5-6 - Sư Đồ (sau khi 4.5.0 chạy ổn 3 ngày)
- [ ] Supabase (hàm mới, không sửa hàm cũ): bảng `vkl_master` (disciple pk, master, via 'link'|'auto', created_at, milestones jsonb). RPC `vkl_master_bind(token, master)`: chỉ gắn khi đệ tử có tối đa 3 kiếp và chưa có sư phụ, không tự bái mình. RPC `vkl_master_auto(token)`: ghép người đã Chứng Đạo, chơi trong 3 ngày qua, ít đệ tử nhất.
- [ ] Trigger trên `vkl_lives` (sau `lives_guard`): kiếp của đệ tử đạt Trúc Cơ, Kim Đan, phi thăng, Chứng Đạo lần đầu thì ghi mốc và gửi thư giang hồ cho sư phụ. Chống clone: chỉ tính đệ tử từ kiếp 3 trở đi, sư phụ tính tối đa 5 đệ tử mới mỗi ngày.
- [ ] Link mời `/?su=<tên>`: lưu cookie, gắn khi đăng ký. Nút "Thu đệ tử" ở màn Chứng Đạo và `/chan-than` mở bảng chia sẻ có thẻ OG riêng: chân thân của sư phụ và dòng "<tên chân thân> mời ngươi nhập môn".
- [ ] Trong kiếp đệ tử (kiếp 1-10): sự kiện "Sư phụ truyền đạo" một lần mỗi kiếp, hiện tên chân thân của sư phụ (chỉ chữ và chân dung nhỏ trong khung sự kiện, như các NPC khác), 4 lựa chọn như sự kiện thường (nhận đan, nhận chỉ điểm, xin theo đi trừ yêu, cáo từ). Kiếp 1-3: sư phụ đỡ một lần chết.
- [ ] Danh hiệu sư phụ "Môn hạ 5/20/50 người", khung bia và một bộ ngoại trang chân thân, chỉ mỹ quan.
- [ ] Đo: `master_bind` (via), `master_event`, `master_mail_open`.
- Xong:
- Ghi chú:

## Ngoài game (Tyler tự làm)
- Biên niên giang hồ hằng tuần trên Page. Claude soạn khi Tyler hỏi.
- Mời khoảng 20-30 người đã Chứng Đạo còn chơi vào nhóm Facebook, danh hiệu "Khai Tông Nguyên Lão" cho người vào đầu (thêm danh hiệu khi Tyler có danh sách).

## Để sau
- Chạy ads lại: chỉ khi nhóm vào sau 4.5.0 có tỉ lệ còn chơi sau 7 ngày cao hơn mốc. Dùng video "Mộng Tỉnh" làm quảng cáo.
- 4.6.0 Mộng chung mỗi ngày (cả server cùng lá số, bảng ngày): cần máy chủ chấm lại kiếp trước.
- Chân thân ngồi thiền idle đầy đủ (đi cảnh, leo tháp, bản đồ nút, chọn 1/3): nối tiếp từ thẻ chân thân ở trang chủ và huyệt Bách Hội.
- Chân thân hiện ở sảnh tọa thiền chung và động phủ cùng nhau (đã chốt từ trước), dùng đúng tên và ngoại hình người chơi đặt.

## Điều kiện dừng
Sau 2 tuần, nếu tỉ lệ còn chơi sau 7 ngày không tăng: giữ chân thân và huyệt (rẻ, không hại), xem lại thử thách và lợi ích. Nếu dưới 60% người mới tạo chân thân sau kiếp 1 (bỏ ngang ở màn tạo), rút gọn màn tạo còn một nút "Ngẫu nhiên" và cho chỉnh sau. Nếu Sư Đồ có dưới 5% người mới được gắn qua link thì bỏ phần link, giữ ghép tự động.
