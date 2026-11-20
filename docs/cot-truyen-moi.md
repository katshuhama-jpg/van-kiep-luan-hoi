# Cốt truyện mới mỗi đêm (Ngày 35)

Nhật ký và sổ liền mạch cho khối lặp "10 cốt truyện mới nối 3 quyển Thiên thư". Luật ở `docs/viec-dem.md` mục Ngày 35.

Cách khai báo (từ đêm 20/11): mỗi bước là một `GameEvent` id `ct_<YYYYMMDD>_<n>` (bước sau thêm hậu tố `b`, `c`), bước lưu trong `c.arcs['ct<YYYYMMDD>_<n>']` bằng `ctSet`, bước sau mở bằng `ctNext(c, key, bước, số năm)` (`lib/game/ctArc.ts`). Phàm giới ở `events2.ts`, Tiên và Ma ở `cosmosStories.ts`, Thái Hư ở `huEvents.ts`, Hồng Hoang ở `hongHoangEvents.ts`. Nối Thiên thư: quyển I, II dùng `hasLore(c, id mảnh)` (`c.loreIds` gắn lúc đầu thai), quyển III dùng `c.tt3` (số trang đã có). Thử: `npx tsx scripts/thu-ct-20261120.ts` (thêm cốt truyện mới vào `SPECS`).

## Sổ liền mạch

Mọi tên người, địa danh, vật phẩm và sự thật mới mà cốt truyện thêm vào thế giới. Kiểm ở đây trước khi đặt tên mới.

| Tên | Loại | Xuất hiện ở | Liên kết quyển | Ghi chú |
|---|---|---|---|---|
| Lão Đồng | người (thợ đúc chuông, phàm nhân) | ct_20261120_1 | I (mảnh I) | Ở trấn Hạ Khê. Chuông trong lò lão tự ngân khi trong trấn có người chết. Chết ở bước 2. Không giải thích vì sao chuông ngân. |
| trấn Hạ Khê | địa danh (phàm giới) | ct_20261120_1 | | Có bến sông, chùa trên núi. |
| Lạc Tam | người (tán tu bán đan giả) | ct_20261120_2 | I (mảnh III) | Bán "Vân Văn Đan" (bột gạo, vỏ khắc kim theo vân thật). |
| em trai Lạc Tam | người (trẻ con, không tên) | ct_20261120_2b | I (mảnh III) | Không biết chữ, đêm nào cũng mơ thấy dòng vân "Ta đã chia mình làm vạn mảnh" rồi vẽ lại. Hỏi "con có phải một mảnh không", truyện KHÔNG trả lời. |
| con quạ ba mắt | yêu (Ma giới) | ct_20261120_3 | | Cho mượn con mắt thứ ba đổi 30 năm thọ, hạn 10 năm. Chủ của nó: một ma tu mù ba nghìn năm, sắp chết (chưa xuất hiện). |
| Thu Âm | người (thiếu nữ nhặt tiếng vọng, Thái Hư) | ct_20261120_4 | III (trang XXI) | Ôm bình rỗng, nhặt tiếng vọng lạc vào hư không. Có thể giữ bình chứa tiếng leng keng. |
| tiếng leng keng (sự thật thêm) | sự thật | ct_20261120_4b | III (trang XXI) | Ở rìa Thái Hư, tiếng ấy vọng lên từ dưới phàm gian, từ phía núi tuyết, không từ chỗ chuông lớn. "Chuông lớn thì đếm, tiếng này chỉ gọi." Không nói tiếng ấy là gì (để XXV). |
| hình nhân đất sét chưa có mặt | sinh linh (Hồng Hoang) | ct_20261120_5 | | Do Nữ Oa nặn dở trước khi đi vá trời. 20 năm sau dẫn một đàn người đất nhỏ. Có thể thành đồ đệ. |
| Mạc Thừa | người (tiên tướng, Tiên giới) | ct_20261120_6 | II (mảnh XV) | Thua tỷ thí ở Nam Thiên Môn vì run tay khi nghe tiếng chuông giữa hai lưỡi kiếm. Cũng nghe tiếng chuông ấy (đúng mảnh XV: có người khác cũng nghe). |
| hồ ly mẹ và hồ ly con | yêu (phàm giới) | ct_20261120_7 | | Hồ ly mẹ gửi con 3 năm. "Yêu không thất hứa." |
| thợ săn họ Triệu | người (phàm nhân) | ct_20261120_7b | | Dắt chó săn lục nhà tìm hồ ly. |
| Văn Khúc Tinh Quân | thần (Tiên giới, đã có) | ct_20261120_8 | I (mảnh VI) | Giữ Tàng Kinh Các, giống `cosmosEnds.ts` (Tàng Kinh Các của Văn Khúc). |
| bức họa núi tuyết | vật (Tiên giới) | ct_20261120_8 | I (mảnh VI) | Một người ngồi quay lưng trên núi tuyết, có trước Thiên Đình, không tên người vẽ, góc ghi "Vẽ lúc chưa vỡ". Năm năm sau có dãy dấu chân dừng cách người ngồi ba bước. KHÔNG cho người trong tranh quay mặt (để mảnh X). Ai vẽ: để ngỏ. |
| bãi mộ không bia | địa danh (Ma giới) | ct_20261120_9 | II (mảnh XIV) | Doi cát giữa Huyết Hải. Tiếng chuông ngập ngừng ở đây. Lão giữ mộ: ma tu chết ở đây trước khi nhắm mắt đều hỏi "sống để làm gì". |
| Diêm Tứ | người (ma tu trẻ) | ct_20261120_9b | II (mảnh XIV) | Đi tìm mộ cha chết ở Huyết Hải. |
| Lục Phong | người (huynh đệ kết nghĩa từ năm 10 tuổi, phàm giới) | ct_20261120_10 | | Luyện ma công đường tắt, bắt ba đứa trẻ làng bên. Có thể chết ở bước 2 (bị bạn giết) hoặc bỏ ma công đi tu, hoặc bị bắt. Ba đứa trẻ luôn về nhà. |

## Nhật ký

| Đêm | 10 cốt truyện (id, tên) | Liên kết quyển | Soát cũ: đã xem / đã sửa | Số mô phỏng (chết, phi thăng trước/sau) |
|---|---|---|---|---|
| 20/11 | 1 Lò đúc chuông (phàm, 2 bước); 2 Đan có vân chữ (phàm, Kim Đan-Độ Kiếp, 2 bước); 3 Con quạ ba mắt (Ma, 3 bước, 1 nhánh chết); 4 Người nhặt tiếng vọng (Hư, 2 bước); 5 Hình nhân chưa có mặt (Hồng Hoang, 2 bước); 6 Chuông giữa hai lưỡi kiếm (Tiên, 2 bước); 7 Hồ ly gửi con (phàm, kiếp 2-10, 3 bước); 8 Bức họa núi tuyết (Tiên, 2 bước); 9 Bãi mộ không bia (Ma, 2 bước); 10 Huynh đệ về làng (phàm, Luyện Khí-Hóa Thần, 2 bước, 1 nhánh chết) | 6/10: 1 (I-I), 2 (I-III), 4 (III-XXI), 6 (II-XV), 8 (I-VI), 9 (II-XIV) | 12 xem / 8 sửa (chi tiết bên dưới) + góp ý treo máy (sửa) | sim-do-kho 3000, trung bình 4 lần trước / 3 lần sau: phi thăng 0% / 0%; tuổi chết TB 112 / 112; tới Trúc Cơ 78,3% / 78,5%, Kim Đan 63,1% / 63,1%, Nguyên Anh 39,9% / 40,0%, Hóa Thần 19,6% / 19,8%, Luyện Hư 7,1% / 7,2%, Độ Kiếp 1,45% / 1,6%. Lệch dưới 0,3 điểm %. |

Lựa chọn kiểu mới đêm 20/11: thú nhận chuyện kiếp trước (1), gõ chuông đếm số kiếp (1b), so vân với Kim Đan mình (2), nhường Trúc Cơ Đan (2b), đổi thọ lấy con mắt yêu và trả thêm thọ (3, 3c), đổi một ký ức kiếp trước lấy tin (4), nhường cơ duyên cho người tìm lâu hơn (4b, 6b), nặn mặt cho hình nhân (5), giao kèo với yêu đổi lời hứa (7), im lặng nhìn thẳng thợ săn (7b), đi nốt ba bước trong tranh (8b), chỉ đại một nấm mộ cho người ta yên lòng (9b).

Nợ: không. Đêm nay làm đủ 10. Vũ khí, quái mới theo cốt truyện: chưa thêm (không bắt buộc đêm này).

### Soát cũ đêm 20/11 (vkl_lives 24 giờ qua, góp ý có chữ "vô lý", "chết nhảm", "không hiểu")

Góp ý 10 ngày qua chỉ có 2 cái khớp chữ, cả hai không nói về cái chết (một cái hỏi công đức lúc thành thánh, một cái về trộm ở Luyện Hư đã xong). Nên 10 cái dưới lấy từ vkl_lives: chết trẻ, chết đột ngột, nguyên nhân lạ so với tuổi và cảnh giới. Bỏ qua "kiếm tiền ở giới trên bị cướp giết bên bờ sông" (phiên chính đang sửa, Ngày 12 mục 1).

| # | Nguyên nhân (số ca 24 giờ) | Kết luận | Sửa |
|---|---|---|---|
| 1 | "Bạn ngã từ trên cây cao xuống" lúc 1 và 3 tuổi (3 ca) | Vô lý: trẻ 1 tuổi không trèo cây. Chết yểu ngẫu nhiên bốc lời chết không theo tuổi. | `engine.ts`: lời chết yểu theo tuổi. Dưới 4 tuổi chỉ sốt, dịch, đói, rét. Từ 4 tuổi thêm ngã giếng, từ 6 tuổi thêm rắn cắn khi chăn trâu, đuối nước, ngã cây. Tỉ lệ chết yểu giữ nguyên. |
| 2 | "Bạn trượt chân ngã xuống giếng sau nhà" lúc 2 tuổi | Cùng lỗi trên. | Như trên. |
| 3 | "Bạn bị lính canh bắt được, đánh chết trước cổng kho" lúc 3 tuổi; "Bạn nhường hết phần ăn" lúc 3 tuổi (3 ca) | Vô lý: Năm mất mùa mở từ 3 tuổi, đứa trẻ 3 tuổi tự lẻn vào kho lương nhà quan hay nhường phần ăn cho em. | `events.ts` Năm mất mùa: từ 6 tuổi. |
| 4 | "Tu vi chưa đủ để ngự khí. Bạn rơi giữa chừng" (5 ca, có ca Luyện Khí 1 chưa có đạo) | Chết nhảm: lựa chọn chỉ ghi "cần tu vi", người Luyện Khí tưởng mình đủ. Rủi ro 40% mà không nói. | `events3.ts` Cầu treo: chưa Trúc Cơ thì gợi ý ghi "chưa tới Trúc Cơ: dễ rơi xuống vực". |
| 5 | "Tia sét thứ hai đánh trúng mũi kiếm" (16 ca, Luyện Khí-Kim Đan) | Có báo trước (sét đánh ngay cạnh, gợi ý "cực liều"), nhưng nhiều người đọc "cực liều" như lời rủ. | `events3.ts` Sấm sét: gợi ý "cực liều, có thể chết". |
| 6 | "Mãng xà quấn chặt lấy bạn" (Luyện Khí 3-9, 7 ca) | Đâm mắt có ghi "liều". Nhưng "Nằm im giả chết" (15%) không ghi gì, "Thì thầm với nó" ghi "yêu tộc?" làm người tộc nhân tưởng vô hại (30%). | `events3.ts` Mãng xà: giả chết ghi "liều"; người không phải yêu tộc thấy "không phải yêu tộc thì rất liều". |
| 7 | "Lão giả hồi quang phản chiếu" (9 ca, có Phàm Nhân 24 tuổi) | Lão đang hấp hối, gợi ý chỉ "tà công", người chơi không biết lão còn sức. Một lựa chọn tà, có lý do (hồi quang phản chiếu). | `events.ts`: gợi ý "tà công, lão còn sức phản đòn". |
| 8 | "Kẻ thù kiếp trước đâm một nhát xuyên tim" (6 ca, có Luyện Khí 1 lúc 12 tuổi) | Kẻ thù mạnh cỡ cảnh giới kiếp trước trừ một, người chơi không biết. Gợi ý chỉ "nguy hiểm". | `events2.ts` Món nợ kiếp trước: hắn mạnh hơn thì gợi ý ghi rõ cảnh giới hắn "mạnh hơn bạn: dễ chết". |
| 9 | "Bạn bị bắt cóc, bán sang biên ải" 3-7 tuổi (4 ca) | Ổn: người lạ cho kẹo là dấu hiệu rõ, có lựa chọn "chạy về nhà". Từ Trúc Cơ chỉ bị thương. Không sửa. | |
| 10 | "Thọ nguyên cạn kiệt. Bạn tọa hóa ở tuổi 1" (2 ca, một tài khoản) | Không phải lỗi game: bản lưu có thọ 1, kiếp 139 đã Kim Đan lúc 0 tuổi, mốc "Bước vào Luyện Khí" lúc 4 tuổi mà chết lúc 1 tuổi. Bản lưu bị sửa tay. Không sửa. | |
| 11 | "Bạn đẩy được đứa bé ra ngoài, rồi bức tường đổ" (Luyện Khí 9, kiếp 1, 3 ca) | Ổn: người chơi tự chọn cứu người, câu chết nói rõ. | |
| 12 | "Thọ nguyên cạn kiệt" ở Nguyên Anh, Hóa Thần, Luyện Hư (49 ca) và góp ý Group (Nguyễn Vũ): "lỡ treo xíu bị quá năm chết mất" | Đúng là lỗ hổng: ở /choi thời gian tự trôi mỗi khi màn hình mở (chỉ dừng khi ẩn tab, có sự kiện, cảnh báo sức khỏe). Trước lúc hết thọ không có gì dừng lại, trừ đại hạn Độ Kiếp (còn 10 năm). Để máy một lúc ở Nguyên Anh (2 năm game mỗi giây) là chết già, không kịp uống Diên Thọ Đan hay đột phá. Bế quan nhiều năm và nút tua 40 năm cũng chạy thẳng tới chết. | `engine.ts`: thọ còn khoảng 5% (5-30 năm) thì ghi cảnh báo và hiệu ứng, mỗi mức thọ một lần (thọ tăng thì nhắc lại). `/choi`: cảnh báo này tạm dừng thời gian như cảnh báo sức khỏe; bế quan xuất quan sớm; tua 40 năm dừng lại. Không đổi luật tuổi thọ. |
