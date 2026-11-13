# Kế hoạch 4.6.0 - Sơn Môn Tranh Bá

Nguồn: báo cáo "Lãnh địa và chiến tranh bất đồng bộ" (10/11/2026), Tyler chốt 10/11 hướng Text-Based Strategy MMO (Travian, Tribal Wars, Ikariam, OGame, Utopia, Torn, Politics and War). Thay cho Sư Đồ đơn lẻ ở Ngày 5-6 của 4.5.0.

DUYỆT: Tyler 10/11/2026

Luật chung như đầu `docs/plan-4.5.0.md`: mỗi lần chạy làm mọi khối còn ô trống có ngày "Lên bản" bằng hoặc trước hôm nay, đẩy `next` khi xong, đẩy `main` đúng 5:00. Mọi thứ giấu sau cờ `SON_MON_ON` (tắt mặc định) cho tới khối Ngày 8.

Đánh dấu lên bản (Tyler để Claude quyết 11/11): máy chủ chặn đẩy tag (lỗi 403), nên thay bước gắn tag `len-ban-<ngày>` bằng đẩy NHÁNH cùng tên: `git push -f origin HEAD:refs/heads/len-ban-<ngày lên bản YYYY-MM-DD>`, chỉ khi thử sạch. Tác vụ 5:00 đã sửa để nhận nhánh này.

## Lịch tổng từ 11/11 (lên trang 5:00 mỗi sáng)

Tyler chốt 10/11: toàn bộ 4.6.0 xong trong đêm 17/11, lên bản 18/11. Mỗi đêm 14-16/11 làm hai khối.

| Ngày | Bản | Việc | Người chơi thấy |
|---|---|---|---|
| 11/11 | 4.5.0 Ngày 1-2 | Dữ liệu chân thân, Tam Tài, Mộng Tỉnh, màn tạo, Tam Tài Đồ | Chưa |
| 12/11 | 4.5.0 Ngày 3 | Cáo biệt, thẻ trang chủ, trang chân thân, chip, thức tỉnh | Chưa |
| 13/11 | 4.5.0 Ngày 4 | Bật chân thân, cáo thị 4.5.0 | Có |
| 14/11 | 4.6.0 Ngày 1 + 2 | Máy chủ Sơn Môn, số liệu, mô phỏng | Chưa |
| 15/11 | 4.6.0 Ngày 3 + 4 | Màn động phủ, bản đồ, xuất quân, chiến báo | Chưa |
| 16/11 | 4.6.0 Ngày 5 + 6 | Sơn môn, Sư Đồ, hero, phúc địa, Thiên Đạo Đài | Chưa |
| 17/11 | 4.6.0 Ngày 7 | Kết Kỷ, thử 30 bot, sửa lỗi. Xong toàn bộ | Chưa |
| 18/11 | 4.6.0 Ngày 8 | Bật Sơn Môn, Kỷ 1 bắt đầu, cáo thị 4.6.0 | Có |
| 1/12 21:00 | | Kỷ 1 kết thúc | |
| 3/12 | | Kỷ 2 bắt đầu | |

## Đã chốt (Tyler 10/11)

- Thể loại: chiến lược xây dựng và xâm chiếm kiểu Travian/Tribal Wars, chơi một tay: mọi thao tác là bấm xây, bấm luyện, bấm xuất quân rồi chờ đồng hồ.
- Mở cho mọi người đã có chân thân (không cần Chứng Đạo).
- Mỗi "Kỷ" (vòng đời thế giới) dài 3 tuần hoặc ít hơn, tùy số người chơi (bảng ở mục Kỷ).
- Mỗi kiếp chơi xong nạp linh khí cho động phủ (có trần mỗi ngày). Kiếp nuôi động phủ, động phủ không cộng sức mạnh ngược vào kiếp.
- Sư Đồ gộp vào đây: sơn môn là liên minh, sư phụ kéo đệ tử vào môn.
- Mở động phủ bắt buộc tài khoản đã liên kết (Google hoặc Sổ Luân Hồi).
- Trần linh khí từ kiếp: 300/ngày/tài khoản (Tyler 10/11).
- Lên trang 5:00: giờ ít người nhất (14 ngày tới 10/11: 4h có 104 người, 5h có 98 người, cao nhất 22h có 438 người). Lịch chạy đêm bắt đầu 21:17 hôm trước để đủ giờ làm hai khối.

## Vì sao

- ~220 người chơi/ngày, ~950/tuần (10/11). Người cũ chơi ~4 kiếp/ngày, cần một mục tiêu dài hơi giữa các kiếp và lý do quay lại nhiều lần trong ngày (hàng chờ xong, quân về, bị đánh).
- Thể loại này giữ người nhờ đồng hồ và liên minh: mở lại để thu tài nguyên, đặt hàng chờ mới, xem chiến báo, giúp đồng môn.
- Chỉ số đo: tỉ lệ còn chơi sau 7 ngày (mốc 11-14%), % người có chân thân mở động phủ, số lần mở game/ngày của người có động phủ, số trận/ngày.

## Thế giới

- **Ba giới là ba tộc** (như tộc Travian). Chọn khi mở động phủ, giữ suốt Kỷ, đổi ở Kỷ sau.
  - Thiên: công mạnh, đi nhanh, nghiên cứu rẻ hơn 10%.
  - Hồng Trần: sản xuất +10%, tường thành mạnh, chiêu hàng rẻ.
  - U Minh: trinh sát mạnh, đệ tử tử trận 20% hoàn hồn về động phủ.
- **Bản đồ** ô vuông, cỡ theo số người (Kỷ 1: 31x31). Ba khu hình quạt quanh tâm: Thiên phía bắc, Hồng Trần đông nam, U Minh tây nam. Người chơi chọn khu của giới mình rồi chọn "gần tâm / giữa / rìa" (gần tâm nhiều tài nguyên hơn nhưng dễ bị đánh hơn), máy đặt ô trống ngẫu nhiên trong vùng đó.
- **Tâm bản đồ**: 3 ô Thiên Đạo Đài do Tam Giáo NPC (Xiển, Triệt, Nhân) giữ, mở ở mốc cuối Kỷ.
- **Phúc địa** (như oasis Travian): ô có yêu thú NPC giữ, +25% một loại tài nguyên cho động phủ chiếm được, mỗi động phủ chiếm tối đa 2.
- **Yêu động** (như làng barbarian): động NPC rải đều, để cướp tài nguyên, tự hồi theo giờ. Giữ cho thế giới đông vui khi ít người.

## Động phủ

- **Tài nguyên**: linh thạch, linh thảo, khoáng thạch (sinh theo giờ), và **linh khí** (chỉ từ kiếp, dùng cho nâng cấp lớn, đệ tử tinh anh và Thiên Đạo Đài).
- **Linh khí từ kiếp** (ghi bằng trigger khi `vkl_lives` nhận kiếp mới, theo cảnh giới cao nhất của kiếp): Phàm Nhân/Luyện Khí 5, Trúc Cơ 10, Kim Đan 20, Nguyên Anh 30, Hóa Thần 45, Luyện Hư/Độ Kiếp 60, phi thăng 90, Chứng Đạo 120. Trần 300 linh khí/ngày/tài khoản (kiếp còn tính ở trình duyệt, trần chặn bơm).
- **Công trình** (cấp 1-20, giờ xây tăng theo cấp):
  - Chính Điện: tăng tốc xây, mở công trình khác, cấp 5 được lập sơn môn.
  - Linh Mạch, Dược Viên, Khoáng Động: sinh linh thạch, linh thảo, khoáng thạch.
  - Tàng Bảo Khố: sức chứa; một phần được giấu, không bị cướp.
  - Luyện Võ Trường: luyện đệ tử.
  - Tàng Kinh Các: nghiên cứu (tăng công, thủ, tốc độ).
  - Hộ Sơn Đại Trận: tường thành, cộng % thủ.
  - Truyền Tống Trận: đi nhanh hơn, mở viện binh xa.
- **Hàng chờ**: 1 công trình và 1 lượt luyện cùng lúc (2 khi Chính Điện cấp 10).
- **Chân thân là hero**: dẫn một đạo quân; 10 huyệt cộng công/thủ nhỏ, hành viên mãn cộng theo tương khắc với ô đánh tới, đạo chỉ mỹ quan. Chân thân không chết, bị thương thì nghỉ 6 giờ.

## Đệ tử (quân)

| Giới | Công | Thủ | Trinh sát | Chiêu hàng |
|---|---|---|---|---|
| Thiên | Thiên Binh | Kim Giáp Vệ | Tuần Thiên Ưng | Tuyên Chỉ Sứ |
| Hồng Trần | Kiếm Tu | Thiết Vệ | Du Hiệp | Thuyết Khách |
| U Minh | Quỷ Binh | Cốt Vệ | U Hồn | Câu Hồn Sứ |

- Mỗi giới thêm 1 đệ tử tinh anh (tốn linh khí) mở ở Tàng Kinh Các cấp 10.
- Chỉ số, giá, giờ luyện, tốc độ ở `lib/sonmon/data.ts`, cân bằng bằng mô phỏng (Ngày 2).

## Đánh nhau

- **Xuất quân** (3 lần bấm): chọn ô trên bản đồ, chọn kiểu (Cướp, Công phá, Trinh sát, Chiêu hàng, Viện binh), chọn bộ quân sẵn (Toàn quân, Nửa quân, Chỉ trinh sát) hoặc chỉnh số. Giờ đi theo khoảng cách và đệ tử chậm nhất.
- Bên bị đánh thấy "có quân đang tới" và giờ tới, kịp gọi viện binh đồng môn.
- **Tính trận ở máy chủ**: tổng công so tổng thủ x (1 + tường), thiệt hại theo tỉ lệ lũy thừa như Travian. Chiến báo bằng chữ, giọng giang hồ.
- **Cướp** lấy tài nguyên ngoài phần giấu. **Công phá** hạ cấp tường hoặc một công trình. **Chiêu hàng** giảm lòng quy thuận của động phủ hoặc phúc địa; về 0 thì chiếm (động phủ bị chiếm thì chủ cũ được dời phủ về rìa, giữ 50% tài nguyên, không mất tài khoản).
- **Giờ đêm 0:00-7:00** (giờ Việt Nam): thủ x2 (như Tribal Wars), để không ai phải thức canh.
- **Bảo hộ người mới**: 5 ngày đầu hoặc tới khi tự đánh người chơi khác. Không bị đánh, chỉ đánh được yêu động.
- **Bế quan**: tối thiểu 2 ngày, tổng tối đa 7 ngày/Kỷ. Không bị đánh, không sản xuất.
- Chỉ ghi điểm xếp hạng khi đánh động phủ có điểm từ 1/3 điểm mình trở lên (chống bắt nạt người mới).

## Sơn môn (liên minh) và Sư Đồ

- Lập khi Chính Điện cấp 5. Tên ghép từ danh sách chữ có sẵn (2 chữ + Tông/Môn/Cung/Các), có nút "Ngẫu nhiên" ghép sẵn một tên, không gõ tự do (Tyler 10/11).
- Tối đa 12 người ở Kỷ 1. Rời môn chờ 24 giờ mới vào môn khác.
- Trong môn: viện binh cho nhau, xem quân đang tới đồng môn, tin trong môn (câu chọn sẵn, không chat tự do ở bản này).
- **Sư Đồ**: link mời `/?su=<tên chân thân>`. Người mới vào bằng link thì vào thẳng môn của sư phụ, động phủ đặt gần sư phụ. Sư phụ nhận thưởng khi đệ tử đạt mốc (Chính Điện cấp 5 và 10, 7 ngày chơi khác nhau), không nhận lúc bái sư. Mỗi sư phụ tối đa 5 đệ tử mới/tuần.

## Kỷ (vòng đời thế giới)

- Dài theo số người mở động phủ trong tuần trước khi Kỷ bắt đầu:

| Người chơi Sơn Môn/tuần | Dài Kỷ | Bản đồ |
|---|---|---|
| Dưới 120 | 10 ngày | 25x25 |
| 120-300 | 14 ngày | 31x31 |
| Trên 300 | 21 ngày | 41x41 |

- Kỷ 1: 14 ngày (31x31), bắt đầu 5:00 ngày 18/11/2026, kết thúc 21:00 ngày 1/12/2026. Nghỉ 1 ngày giữa hai Kỷ (2/12), Kỷ 2 bắt đầu 5:00 ngày 3/12.
- **Mốc cuối Kỷ**: còn 4 ngày (Kỷ 10 ngày: còn 3) thì Thiên Đạo Đài mở. Sơn môn chiếm một Đài từ tay Tam Giáo, rồi góp tài nguyên và linh khí xây tầng 1-20. Đài bị công phá thì mất tầng. Môn đầu tiên xây tới tầng 20, hoặc tầng cao nhất khi hết giờ, **Khai Thiên Lập Địa**: Kỷ sau mang tên môn đó ("Kỷ Thanh Hư").
- **Hết Kỷ**: thế giới reset. Giữ vĩnh viễn: danh hiệu, ngoại trang chân thân, tên trên bia Kỷ ở Nghĩa trang. Không mang tài nguyên hay quân sang Kỷ sau.
- **Sự kiện**: mỗi Thứ 7 20:00 có Yêu Triều (sóng NPC đánh mọi động phủ, thủ được thì nhận thưởng). Tam Giới Hội Chiến tháng để Kỷ 3 trở đi khi đủ người.

## Thưởng

- Xếp hạng Kỷ: công, thủ, cướp, dân số động phủ, sơn môn. Top mỗi bảng nhận danh hiệu Kỷ và một món ngoại trang chân thân.
- Sơn môn Khai Thiên Lập Địa: tên trên Kỷ sau, hào quang môn cho mọi thành viên, bia trong Nghĩa trang.
- Mọi người chơi tới cuối Kỷ có động phủ cấp 10 trở lên: huy hiệu Kỷ. Không thưởng sức mạnh vào kiếp.

## Chống gian lận

- Toàn bộ trạng thái ở máy chủ (Supabase): tài nguyên tính lười theo thời gian khi đọc, hàng chờ và quân đi đường xử lý bằng hàm và `pg_cron` mỗi phút. Trình duyệt chỉ gửi lệnh, mọi lệnh kiểm tra đủ tài nguyên, đủ quân, đúng lượt.
- Mỗi tài khoản một động phủ. Mở động phủ cần tài khoản đã liên kết (Google hoặc Sổ Luân Hồi), không cho khách vãng lai.
- Không cho gửi tài nguyên giữa người chơi ở Kỷ 1 (chặn nuôi acc phụ). Viện binh được, nhưng quân viện ăn lương của chủ động phủ.
- Linh khí từ kiếp có trần 300/ngày. Máy đánh dấu để Tyler xem tay: nhiều tài khoản mới vào cùng một môn trong một ngày, cặp động phủ đánh nhau một chiều liên tục, linh khí chạm trần nhiều ngày liền.

## Ngày 1 - Máy chủ: dữ liệu và động phủ
Lên bản: 2026-11-14 (giấu sau cờ). Chỉ làm khi 4.5.0 (bật 13/11) không có lỗi chặn: Vercel runtime errors không tăng bất thường, không có góp ý báo lỗi chân thân chưa sửa. Có lỗi thì sửa lỗi 4.5.0 trước, khối này dời sang đêm sau, báo Tyler.
- [ ] Supabase (bảng và hàm mới, không sửa hàm cũ): `vkl_ky` (Kỷ: id, tên, bắt đầu, kết thúc, cỡ bản đồ), `vkl_tile` (ô: x, y, loại, chủ), `vkl_phu` (động phủ: player, ky, x, y, gioi, tài nguyên, last_at, bảo hộ, bế quan), `vkl_phu_building`, `vkl_phu_queue`, `vkl_phu_troop`, `vkl_march`, `vkl_report`, `vkl_mon`, `vkl_mon_member`, `vkl_linh_khi_log`. RLS: chỉ đọc qua hàm.
- [ ] RPC: `phu_found(token, gioi, vung)`, `phu_state(token)` (tính tài nguyên lười), `phu_build(token, building)`, `phu_train(token, unit, n)`. Kiểm tra đủ điều kiện ở máy chủ.
- [ ] Trigger trên `vkl_lives` (sau `lives_guard`): cộng linh khí theo bảng, trần 300/ngày.
- [ ] Sinh bản đồ Kỷ: yêu động, phúc địa, 3 ô Thiên Đạo Đài, chia 3 khu.
- Xong:
- Ghi chú: Đêm 13/11 chưa làm được, dời sang đêm 14/11 (làm cùng Ngày 3 + 4). Lý do: phiên chạy đêm 13/11 không kết nối được Supabase và Vercel (máy chủ công cụ báo lỗi 502), nên không tạo được bảng/hàm (`apply_migration`) và không kiểm được điều kiện "Vercel runtime errors không tăng". Phần kiểm được: từ khi 4.5.0 lên (13/11 5:00) tới 22:00 không có góp ý nào báo lỗi chân thân (#233-#238: đánh giá kiếp, đề nghị tính năng, #235 linh thú Cùng Kỳ không ghi sổ, #236 bị cướp rìu không thấy người để trả thù). Hàm khu và vùng cho bản đồ (`zoneOf`, `ringOf`, `kyTheoSoNguoi`) đã có ở `lib/sonmon/data.ts` để viết SQL sinh bản đồ theo đúng số. Bản nháp SQL (chưa chạy trên Supabase): xem `supabase/son_mon_2026_11_14_nhap.sql` nếu có.

## Ngày 2 - Số liệu và mô phỏng
Lên bản: 2026-11-14 (giấu sau cờ).
- [x] `lib/sonmon/data.ts`: công trình (giá, giờ theo cấp), 15 loại đệ tử, nghiên cứu, công thức trận (bản TypeScript dùng để hiện ước tính; máy chủ là bản thật).
- [x] `scripts/sim-son-mon.ts`: mô phỏng 200 người chơi 14 ngày (người chơi 1 lần/ngày, 4 lần/ngày, người hăng). Mục tiêu: người 1 lần/ngày lên Chính Điện cấp 10 vào khoảng ngày 7; người hăng không quá 2 lần người thường; 3 giới thắng thua lệch không quá 55/45. Ghi số vào "Ghi chú:".
- [ ] Đưa số đã cân bằng vào hàm máy chủ.
- Xong: 13/11/2026 (hai việc đầu) 7c5b50e
- Ghi chú: Việc 3 chờ Ngày 1 (hàm máy chủ chưa có vì đêm 13/11 không kết nối được Supabase); khi viết `phu_build`, `phu_train`, công thức trận trong SQL thì chép đúng số ở `lib/sonmon/data.ts`. Số chốt: giá công trình x1,4 (`SO.gia`), hàng chờ xây 1 mục đang xây + 5 mục chờ (đã trả tài nguyên lúc đặt; 2 mục cùng lúc khi Chính Điện 10), luyện 1 lượt + 2 lượt chờ; sản lượng mỏ cấp L = 20 x 1,21^(L-1) + 4L mỗi giờ; kho 1.200 x 1,3^cấp; trận kiểu Travian lũy thừa 1,5, cướp thì hai bên cùng mất. `npx tsx scripts/sim-son-mon.ts 200 14 <hạt giống>` (hạt 1-3): người 1 lần/ngày lên Chính Điện 10 ở ngày 6,1 (trung vị, tức trong ngày thứ 7), 100% đạt trong 14 ngày; 4 lần/ngày ngày 5,4; người hăng 12 lần/ngày ngày 7,3 (đi đánh nhiều nên mất quân và tài nguyên). Dân số ngày 14: người hăng gấp 1,07-1,08 lần người 1 lần/ngày (trần 2 lần), 0,88-0,89 lần người 4 lần/ngày. Trận cân tài nguyên (20.000 trận mỗi cặp giới, cùng tài nguyên, tường và nghiên cứu ngẫu nhiên, 29% trận rơi vào giờ đêm): Thiên 48%, Hồng Trần 52-53%, U Minh 50% (trong 55/45). Số thắng trong mô phỏng cả thế giới lệch hơn (Hồng Trần 44-47%, U Minh 52-55%) vì người đánh trinh sát rồi né chỗ thủ mạnh nên Hồng Trần (thủ dày nhất) ít phải làm bên thủ, không phải do giới yếu; xem lại khi có số thật Kỷ 1. Trước khi chốt: hàng chờ 2 thì người 1 lần/ngày tới ngày 13 mới lên Chính Điện 10 và người hăng gấp 2,1-2,9 lần, nên nới hàng chờ. Người đi đánh thắng 28-44% (trinh sát 3 nơi rồi chọn chỗ thủ yếu nhất).

## Ngày 3 - Giao diện động phủ
Lên bản: 2026-11-15 (giấu sau cờ).
- [ ] Trang `/son-mon`: lần đầu là màn chọn giới (3 thẻ, mỗi thẻ 1 câu lợi thế và bộ đệ tử) rồi chọn vùng (gần tâm, giữa, rìa). Lời dẫn giọng Thiên Đạo.
- [ ] Màn động phủ: tài nguyên, sơ đồ công trình dạng ô pixel, hàng chờ có đồng hồ, nút xây và luyện to, dùng được một tay.
- [ ] Trang chủ: thẻ "Động phủ" cạnh thẻ chân thân (hàng chờ xong, quân đang tới). Màn cáo biệt kiếp: dòng "+20 linh khí về động phủ".
- [ ] Đo: `phu_found` (gioi, vung), `phu_build`, `phu_train`, `phu_open`.
- Xong:
- Ghi chú:

## Ngày 4 - Bản đồ, xuất quân, chiến báo
Lên bản: 2026-11-15 (giấu sau cờ).
- [ ] Bản đồ cuộn ô pixel, chạm ô xem chủ, cấp, khoảng cách. Lọc: yêu động gần nhất, phúc địa trống.
- [ ] Xuất quân 3 lần bấm (ô, kiểu, bộ quân). Quân đi đường hiện ở thẻ động phủ.
- [ ] `pg_cron` mỗi phút xử lý quân tới nơi: tính trận, cướp, công phá, chiêu hàng, viện binh, quân về. Giờ đêm thủ x2.
- [ ] Chiến báo bằng chữ (mẫu câu theo giới), hộp thư chiến báo.
- [ ] Đo: `march_send` (kiểu), `report_open`.
- Xong:
- Ghi chú:

## Ngày 5 - Sơn môn và Sư Đồ
Lên bản: 2026-11-16 (giấu sau cờ).
- [ ] Lập sơn môn (Chính Điện cấp 5, tên ghép từ chữ có sẵn, nút Ngẫu nhiên), mời, rời (chờ 24 giờ), trần 12 người.
- [ ] Viện binh, xem quân đang tới đồng môn, tin trong môn bằng câu chọn sẵn.
- [ ] Link Sư Đồ `/?su=<tên>`: lưu cookie, người mới vào thẳng môn, động phủ đặt gần sư phụ. Thưởng sư phụ theo mốc đệ tử, tối đa 5 đệ tử mới/tuần. Thẻ chia sẻ OG: chân thân sư phụ và dòng "<tên> mời ngươi nhập môn".
- [ ] Đo: `mon_create`, `mon_join` (via link/tự vào), `su_bind`, `reinforce_send`.
- Xong:
- Ghi chú:

## Ngày 6 - Chân thân làm hero, phúc địa, Thiên Đạo Đài
Lên bản: 2026-11-16 (giấu sau cờ).
- [ ] Chân thân dẫn quân: cộng từ huyệt và hành, bị thương nghỉ 6 giờ.
- [ ] Chiếm phúc địa (tối đa 2), chiêu hàng động phủ, dời phủ cho người bị chiếm.
- [ ] Thiên Đạo Đài: mở ở mốc cuối Kỷ, chiếm từ Tam Giáo, góp xây tầng, bị công phá mất tầng, Khai Thiên Lập Địa.
- [ ] Bảo hộ người mới, bế quan, Yêu Triều Thứ 7 20:00.
- Xong:
- Ghi chú:

## Ngày 7 - Hết Kỷ, xếp hạng, thử toàn bộ
Lên bản: 2026-11-17 (giấu sau cờ).
- [ ] Kết Kỷ: xếp hạng, phát danh hiệu và ngoại trang, bia Kỷ trong Nghĩa trang, reset, sinh bản đồ Kỷ mới theo bảng số người.
- [ ] Thử: chạy một Kỷ rút gọn 2 giờ trên nhánh preview với 30 bot (script) để kiểm tra cron, trận, Đài, kết Kỷ. Playwright 390x844 cho người mới: chọn giới, xây, luyện, đánh yêu động, vào môn qua link.
- [ ] Trang quản trị nhỏ cho Tyler: số động phủ mỗi giới, trận/ngày, các tài khoản bị đánh dấu.
- Xong:
- Ghi chú:

## Ngày 8 - Lên bản, Kỷ 1 bắt đầu
Lên bản: 2026-11-18. Bật cờ `SON_MON_ON`, có cáo thị 4.6.0.
- [ ] Tạo Kỷ 1 (14 ngày, 31x31) bắt đầu đúng 5:00.
- [ ] Cáo thị 4.6.0 ngắn: động phủ, ba giới, sơn môn, sư đồ, Kỷ 14 ngày, Khai Thiên Lập Địa. Không hứa ngày Kỷ sau.
- [ ] Video ngắn 9:16 (Playwright quay): chọn giới, xây, xuất quân, chiến báo. Gửi Tyler, không tự đăng.
- Xong:
- Ghi chú:

## Ngoài game (Tyler tự làm)
- Đăng "Biên niên Kỷ" mỗi tuần và lúc kết Kỷ (Claude soạn khi Tyler hỏi): sơn môn mạnh nhất, trận lớn, ai Khai Thiên Lập Địa.

## Để sau
- Trao đổi tài nguyên giữa người chơi, chợ.
- Tam Giới Hội Chiến tháng (từ Kỷ 3 nếu đủ người).
- Chat tự do trong môn (cần kiểm duyệt).
- Thông báo đẩy khi bị đánh.

## Điều kiện dừng
- Sau Kỷ 1: nếu dưới 25% người có chân thân mở động phủ, hoặc dưới 30% người mở động phủ còn vào sau 3 ngày: rút Kỷ 2 xuống 10 ngày, bản đồ 25x25, xem lại tốc độ đầu game.
- Nếu tỉ lệ còn chơi sau 7 ngày của nhóm mở động phủ không cao hơn nhóm không mở: dừng mở rộng, xem lại.
