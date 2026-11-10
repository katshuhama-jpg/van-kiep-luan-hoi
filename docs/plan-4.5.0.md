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
- Huyệt KHÔNG mở theo số lần chết (dễ spam). Mở theo thử thách làm được trong một kiếp, từ dễ đến rất khó; ai cũng bắt đầu từ huyệt 1, kiếp cũ không tính (người cũ vẫn phải cày).
- Chân thân là nhân vật cố định qua mọi kiếp, người chơi chọn ngoại hình và đặt tên. Nhân vật trong mỗi kiếp vẫn đầu thai ngẫu nhiên như cũ.
- Màn tạo chân thân: chọn giới tính, màu da, 1 trong 10 kiểu tóc, màu tóc, và 1 trong 10 bộ trang phục đơn giản, mỗi giới tính 10 tóc và 10 trang phục. Báo rõ cho người chơi: ngoại trang khác sẽ tìm được ở các phần tiếp theo.
- Có đoạn mở đầu dạng animation để người chơi hiểu chân thân là gì, và màn giới thiệu huyệt đạo để hiểu huyệt là gì, khai thế nào, được gì.
- KHÔNG hiện chân thân trong kiếp (kể cả bóng mờ). Chân thân chỉ ở ngoài: màn cáo biệt, trang chủ, bảng Tam Tài.
- Tam Tài (Tyler 10/11): Thân 10 huyệt + Khí 5 hành + Đạo 27 đạo chia ba cõi: 9 Thiên (sao trên đầu), 9 Hồng Trần (ấn dưới chân), 9 U Minh (hồn đăng trong bóng). Tổng 42 dấu. Bỏ tên "Chu Thiên 36 huyệt". Không dùng "Nhân đạo" (trùng nghĩa nhân từ), không để chữ "Âm" đứng ngay trước "đạo": nhãn ngắn của U Minh là "Âm Ti". Lời dẫn đầy đủ ở doc Docs mục "Kịch bản và lời dẫn".
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
- [ ] `lib/game/khaiMach.ts`: Tam Tài = 10 huyệt (lưu trong meta khi khai) + 5 hành + 27 đạo. Tổng 42 dấu.
  - Huyệt 1-10 (Thập Đại Huyệt, Tyler 10/11: phải có dễ có khó để người cũ vẫn phải cày). Ai cũng bắt đầu từ huyệt 1 kể từ 4.5.0, KHÔNG tính kiếp cũ. Mỗi huyệt một thử thách trong một kiếp, xét lúc kiếp kết thúc, khai theo thứ tự, mỗi kiếp tối đa 1 huyệt. Tỉ lệ đạt lấy từ 21.073 kiếp 1-10/11:
    1. Dũng Tuyền (dễ): lên Kim Đan (76%). Linh thạch khởi đầu +100.
    2. Quan Nguyên (dễ): sống qua 60 tuổi (61%). Sức khỏe khởi đầu +5.
    3. Khí Hải (dễ): lên Nguyên Anh khi đang ở tông môn (ước 45%). Tu luyện +2%.
    4. Mệnh Môn (vừa): lên Hóa Thần, có đạo lữ hoặc linh thú (ước 30%). Thọ +5 năm.
    5. Trung Quản (vừa): lên Luyện Hư và sống qua 200 tuổi (21%). Tâm cảnh +5.
    6. Cự Khuyết (vừa): lên Độ Kiếp với đạo tâm từ 90 hoặc từ -90 (14%). Ngộ tính +5.
    7. Đản Trung (khó): phi thăng (10%). Khí vận +5.
    8. Thiên Đột (khó): Chứng Đạo (6,6%). Đột phá +3%.
    9. Ấn Đường (rất khó): phi thăng trước 350 tuổi (3,9%). Ngọc bội hộ thân lúc 16 tuổi.
    10. Bách Hội (rất khó): Chứng Đạo trước 600 tuổi (2,2%). Chân thân thức tỉnh, danh hiệu "Khai Mạch", hào quang riêng.
  - Tổng kỳ vọng khoảng 120 kiếp; người chơi lâu (khoảng 4 kiếp/ngày) mất 3-5 tuần. Ghi vào meta danh sách huyệt đã khai và kiếp khai (không tính lại từ dữ liệu cũ). Kiểm tra thử thách lúc kiếp kết thúc từ chính Character (tông môn, đạo lữ, linh thú, đạo tâm, tuổi, cảnh giới, phi thăng, Chứng Đạo).
  - Ngũ Hành (Khí): mỗi kiếp mang 1 bản mệnh. Mỗi hành 3 tầng: kiếp mệnh đó lên Hóa Thần / phi thăng / Chứng Đạo. Tầng 1 hào quang màu hành, tầng 2 ngoại trang hành, tầng 3 danh hiệu "{Hành} Viên Mãn". Đủ 5 hành tầng 3: "Ngũ Hành Hợp Nhất". Ước ~75 kiếp mỗi hành, ~170 kiếp cho cả 5. Chỉ mỹ quan.
  - 27 Đạo. Mốc dùng dữ liệu có sẵn thì tính cả thành tích cũ; mốc cần bộ đếm mới thì tính từ 4.5.0. Đạo (ẩn) giấu tên và cách mở.
    - Thiên: Vấn Thiên (lần đầu Hóa Thần, `career.maxRealm`), Phi Thăng (`achievements` phi_thang), Tam Thiên (đủ Tiên, Ma, Thái Hư, `career.cosmoses`), Chứng Đạo (`endings`), Hộ Đạo (Vạn Kiếp Hộ Đạo đỡ lôi, THÊM cờ), Trường Sinh (1000 tuổi, `career.maxAge`), Thiên Thư (10 mảnh Q.I, `lore`), Hồng Hoang (Chuẩn Thánh, `career.maxRealm`), ẩn Thiên Đạo (kết cục Hóa Thành Thiên Đạo, `endings`).
    - Hồng Trần: Nhập Thế (5 tông môn, THÊM `career.sects`), Lục Lộ (6 đường, `career.paths`), Chính Tà (phi thăng một lần đạo tâm ≥90 và một lần ≤-90, THÊM 2 cờ), Nhân Duyên (đạo lữ trong 20 kiếp, THÊM bộ đếm), Ngự Thú (30 loài, `petBook`), Bảo Khí (150 đồ ẩn, `itemBook`), Phú Quý (100.000 linh thạch trong 1 kiếp, THÊM `career.maxMoney`), Giang Hồ (thắng 100 người chơi, `career.duelWins`), ẩn Truyền Đạo (20 môn hạ, cần Sư Đồ).
    - U Minh: Sinh Tử (40 kết cục, `endings`), Lôi Kiếp (chết dưới thiên kiếp 3 lần, THÊM bộ đếm), Nại Hà (5 kiếp liền không uống canh, `noDrink`), Mạnh Bà (uống canh 30 lần, THÊM bộ đếm), Diêm La (chết không phi thăng khi đạo tâm ≤-90, THÊM cờ), Oan Hồn (báo thù 10 người chơi, `career.revenges`), Hương Hỏa (mộ mình được 500 hương, đọc từ Nghĩa trang), ẩn Từ Bi (thắp 100 mộ khác nhau, đọc từ Nghĩa trang), ẩn Minh Chung (đánh bại Kẻ Gõ Chuông, `chuongWin`).
    - Bộ đếm mới gom vào `career` (sects, partnerLives, maxMoney, thienKiepDeaths, soupDrinks, flags: hoDao, ascRight, ascLeft, diemLa). Cập nhật trong `updateCareer` lúc kiếp kết thúc.
    - Thưởng: mỗi đạo một sao / ấn / hồn đăng. Ngoại trang ở Phi Thăng, Chứng Đạo, Chính Tà, Bảo Khí, Diêm La, Minh Chung. Đủ 9 mỗi cõi: "Thiên Tôn", "Hồng Trần Tôn", "U Minh Tôn". Đủ 42 dấu: "Tam Tài Viên Mãn". Chỉ mỹ quan.
- [ ] Cân bằng: `npx tsx scripts/sim-do-kho.ts 3000` trước và sau với đủ 10 huyệt. Tỉ lệ lên Hóa Thần tăng không quá 3 điểm, nếu quá thì giảm số.
- Xong:
- Ghi chú:

## Ngày 2 - Đoạn mở đầu, màn tạo chân thân, giới thiệu huyệt đạo
- [ ] Đoạn mở đầu "Mộng Tỉnh" (cảnh pixel trong game, không dùng video): 5 khung, chạm để qua, có nút Bỏ qua, tiếng chuông xa. Giọng dẫn là Thiên Đạo, xưng "ngươi".
  1. Màn tối, nhân vật kiếp vừa rồi tan thành bụi sáng. "Chuông vang. Một giấc mộng vừa tan."
  2. Hư không, bụi sáng trôi lên. "Kẻ vừa chết kia là ngươi. Nhưng cũng không phải ngươi."
  3. Bóng người ngồi thiền, chưa rõ mặt, trời trên đất dưới. "Ngươi vẫn ngồi đây, giữa trời và đất, từ trước kiếp đầu tiên."
  4. Bụi sáng bay vào bóng người, đốm sáng ở lòng bàn chân. "Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Điều ngươi làm được trong mộng sẽ khắc vào thân."
  5. Bóng người ngẩng đầu, mặt còn trống. "Nhưng ngươi đã quên mặt mình. Hãy nhớ lại." Chuyển sang màn tạo.
- [ ] Màn tạo chân thân (một màn, đọc và bấm):
  - Chân thân lớn ở giữa, đổi ngay khi chọn.
  - Hàng 1: giới tính (2 nút). Hàng 2: màu da (6 ô). Hàng 3: kiểu tóc, lướt ngang 10 kiểu của giới tính đã chọn. Hàng 4: màu tóc (8 ô). Hàng 5: trang phục, lướt ngang 10 bộ, mỗi bộ có tên. Đổi giới tính thì kiểu tóc và trang phục về lựa chọn đầu của giới đó, giữ màu da và màu tóc.
  - Tiêu đề "Nhớ lại chân thân". Nút ngẫu nhiên "Thuận theo duyên".
  - Ô "Pháp danh", điền sẵn tên gợi ý, nút xúc xắc "Gợi tên khác". Tên bị chặn: "Tên này Thiên Đạo không nhận. Chọn tên khác."
  - Dòng nhỏ dưới trang phục: "Ngoại trang khác nằm rải trên đường tu: khai huyệt, viên mãn ngũ hành, ngộ đạo."
  - Nút "Định chân thân". Sau khi định: "{Pháp danh}. Ngươi nhớ ra rồi."
- [ ] Màn giới thiệu "Tam Tài Đồ" (ngay sau khi định chân thân, trước màn cáo biệt): 4 khung, chạm để qua, có nút Bỏ qua. Chân thân vừa tạo đứng giữa. Mỗi khung một câu dẫn + một dòng nhỏ luật.
  1. Tam Tài: "Ngươi có thân để mang, có khí để thở, có đạo để đi. Ba thứ ấy là Tam Tài của ngươi." (10 huyệt · 5 hành · 27 đạo)
  2. Thân: "Thân có mười đại huyệt. Trong mộng làm được việc huyệt đòi, mộng tan thì huyệt khai." (Mỗi kiếp tối đa 1 huyệt, dễ trước khó sau. Huyệt khai thì kiếp sau mạnh hơn một chút.)
  3. Khí: "Mỗi giấc mộng mang một bản mệnh: Kim, Mộc, Thủy, Hỏa, Thổ. Mộng đi xa, hành ấy sáng." (Mỗi hành 3 tầng: Hóa Thần, phi thăng, Chứng Đạo.)
  4. Đạo: "Trên đầu, chín Thiên đạo. Dưới chân, chín nẻo Hồng Trần. Trong bóng ngươi, chín ngọn đèn U Minh. Đạo không ngộ trong một kiếp, mà qua vạn kiếp." (Thiên: đường lên trời. Hồng Trần: đường ở đời. U Minh: đường của cái chết.)
  - Kết: "Huyệt đầu tiên, Dũng Tuyền, đợi ngươi lên Kim Đan." Nếu kiếp vừa rồi đã đạt thì cho xem Dũng Tuyền khai ngay (chớp sáng, câu khai huyệt 1), rồi sang màn cáo biệt.
  - Người cũ: xem sau màn tạo, kết thúc như trên. Các đạo và tầng hành đã đạt từ trước hiện sáng sẵn (tính thành tích cũ), huyệt thì vẫn từ 1.
  - Xem lại được: nút "?" ở trang `/chan-than`, trên chip thử thách trong kiếp và ở bảng Tam Tài mở lại 4 khung này.
  - Đo: `huyet_intro` (xem hết hay bỏ ở khung nào, xem lại từ đâu).
- [ ] Lời dẫn khi khai (dữ liệu chữ trong `lib/game/khaiMach.ts`, đủ bộ ở doc Docs "Kịch bản và lời dẫn"): 10 câu khai huyệt, câu kiếp không khai ("Mộng này chưa đủ. Huyệt {tên} vẫn đợi: {thử thách}."), câu khai hành theo mẫu + 5 câu viên mãn + "Năm khí quy về một thân. Ngũ Hành Hợp Nhất.", 27 câu ngộ đạo, câu Thiên Tôn, Hồng Trần Tôn, U Minh Tôn, Tam Tài Viên Mãn.
- [ ] Khi nào hiện:
  - Người mới: ngay sau khi kiếp 1 khép lại, trước màn cáo biệt. Không chen vào trước kiếp 1.
  - Người cũ (đã có kiếp): lần đầu vào sau bản này, từ trang chủ: đoạn mở đầu, màn tạo chân thân, Tam Tài Đồ. Bắt đầu từ huyệt 1 như người mới.
  - Bỏ qua đoạn mở đầu được, nhưng màn tạo chân thân thì phải xong mới đi tiếp (có nút Ngẫu nhiên nên chỉ mất một chạm).
- [ ] Đổi về sau (trong trang `/chan-than`): đổi ngoại hình miễn phí bất cứ lúc nào. Đổi tên: lần đầu miễn phí, từ lần thứ hai tốn phúc duyên. Tên đi qua bộ lọc trên cả máy chủ (hàm Supabase mới), không chỉ trên trình duyệt.
- [ ] Đo: `ct_intro` (xem hết hay bỏ qua, khung bỏ), `ct_create` (gender, hair, hairColor, outfit, random hay tự chọn, sửa tên hay giữ gợi ý), `ct_rename`.
- Xong:
- Ghi chú:

## Ngày 3 - Huyệt trên giao diện
- [ ] Màn cáo biệt: chân thân của người chơi (không phải nhân vật kiếp vừa rồi) với các huyệt là chấm pixel dọc thân. Huyệt vừa khai to hơn và chớp sáng, kèm dòng "Huyệt Khí Hải khai: tu luyện +2% từ kiếp sau". Bên dưới: thanh 10 ô Thập Kiếp và thử thách của huyệt kế. Kiếp không khai huyệt thì chỉ hiện thử thách đang chờ.
- [ ] Trang chủ: thẻ "Chân thân" dưới dải giang hồ, trên nút Lôi đài (dòng Thất Nhật Lục dời vào Tàng Kiếp Các). Thẻ có hình chân thân nhỏ với huyệt sáng, tên chân thân, thanh 10 ô, thử thách của huyệt kế, lợi ích đang hưởng. Chạm mở `/chan-than`.
- [ ] Trang `/chan-than`: chân thân lớn, tên, nút đổi ngoại hình và tên, bảng Tam Tài 3 tab: Thân (10 huyệt với thử thách và lợi ích), Khí (5 hành x 3 tầng), Đạo (9 sao Thiên trên đầu, 9 ấn Hồng Trần dưới chân, 9 hồn đăng U Minh trong bóng; đạo ẩn để "?"), tủ ngoại trang (bộ đã có và ô khóa ghi gợi ý cách mở).
- [ ] Trong kiếp: chip nhỏ góc trên trái sân khấu chỉ ghi thử thách, ví dụ "Huyệt Thiên Đột: lên Kim Đan" (không vẽ chân thân trong kiếp). Chạm mở bảng. Khi kiếp này đạt thử thách: thông báo "Kiếp này đã đủ khai huyệt X, huyệt khai khi kiếp khép lại", chip đổi sang vàng.
- [ ] Màn đầu thai: một dòng nhỏ "Tam Tài 20/42", chạm mở bảng.
- [ ] Cảnh "Chân thân thức tỉnh" khi khai huyệt 10, 4 nhịp: chân thân ngồi nhắm mắt (im lặng); 10 huyệt sáng từ chân lên đỉnh đầu, mỗi huyệt một tiếng chuông, "Mười tiếng chuông."; chân thân mở mắt, "Lần này, người tỉnh dậy là ngươi."; danh hiệu "Khai Mạch.". Chạm để bỏ qua.
- [ ] Màn cáo biệt cũng hiện câu khai hành / ngộ đạo khi kiếp đó vừa đạt (tối đa 2 dòng, huyệt ưu tiên).
- [ ] Thẻ khoe chân thân (dùng `lib/shareCard.ts`): chân thân, tên, số huyệt, danh hiệu.
- [ ] Đo: `huyet_open` (id, lifeNo), `huyet_view`, `huyet_share`, `ct_card_tap`.
- Xong:
- Ghi chú:

## Ngày 4 - Thử, cáo thị, lên bản
- [ ] Thử: Playwright 390x844 cho người mới (kiếp 1 xong, mở đầu, tạo chân thân, giới thiệu huyệt, cáo biệt có huyệt 1), người cũ 40 kiếp (mở đầu, tạo, bắt đầu từ huyệt 1), kiếp đạt huyệt khó chỉ khai huyệt kế tiếp, tên tục bị chặn, đổi tên lần hai trừ phúc. Chụp ảnh gửi Tyler.
- [ ] Quay lại đoạn mở đầu thành video ngắn dọc 9:16 (Playwright quay màn) để Tyler đăng Page và Threads làm teaser. Gửi file cho Tyler, không tự đăng.
- [ ] Bật cờ `CHAN_THAN_ON`. Cáo thị 4.5.0 ngắn: chân thân, Tam Tài (huyệt, hành, đạo), ngoại trang sẽ có thêm. Không ghi số cụ thể.
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
