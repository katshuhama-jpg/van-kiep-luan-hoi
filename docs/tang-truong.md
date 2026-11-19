# Tăng trưởng và giữ chân - nhật ký

Tyler chốt 12/11/2026: mỗi đêm sau khi xong khối kế hoạch, xem số liệu, chọn việc có tác động lớn nhất, ghi lại ở đây. Không gỡ tính năng chỉ vì số xấu, cải thiện trước (xem "Sổ cải thiện tính năng"). "Buy me a coffee" không bao giờ bỏ.

Mốc so sánh: còn chơi sau 7 ngày (D7) 11-14% (`docs/so-lieu.md`, mốc trước 4.5.0).

## Đêm 18/11/2026 (lên bản 19/11)

Kế hoạch: 4.6.0 Ngày 8a xong (Phần thưởng Kỷ, 2be814c), Ngày 8 xong 4/5 việc còn lại (dded81d; tin hệ thống Truyền âm chờ áp SQL), Ngày 8c đo và mô phỏng (d813930), Ngày 8d số liệu + thiết kế (dbe6cbf; code quyển III chuyển Ngày 8e). Chi tiết ở Ghi chú từng khối trong plan-4.6.0.

Số chính (đọc khoảng 22:30 18/11):
- Tài khoản mới: 15/11 165, 16/11 76, 17/11 49, 18/11 50 (chưa hết ngày). Phiên mỗi ngày (vkl_daily): 15/11 1.639, 16/11 1.329, 17/11 1.252.
- D1: nhóm 14/11 29,5%, 15/11 29,7%, 16/11 26,2% (đầu tháng 34-43%). D7: nhóm 9/11 10,4%, 10/11 5,9% (dưới mốc 11-14%).
- Phễu đủ 2 / đủ 10 kiếp trên số tài khoản: 15/11 96/48 trên 165, 16/11 53/18 trên 76.
- Màn rời nhiều nhất 17/11: đầu thai 611, đang chơi 365, chưa rõ 263, sự kiện 260, chết 103.
- Sơn Môn ngày đầu (24 giờ, số phiên): mở 248, điểm danh 82, vào môn 78, nhiệm vụ xong 45, xem bản đồ 21, Truyền âm 21, trinh sát 29, khai hoang 6, xuất chinh 7, lập môn 16, ký cùng lập 21. Sư Đồ: mời đệ tử 117 lần (12 phiên), tìm đệ tử 22, tìm sư phụ 15.
- Nhóm 411px: 114/394 phiên `open` không có trường mới (`vis`, `iab`) là 411px, nhóm có trường mới chỉ 24 phiên 411px. Nghĩa là phần lớn nhóm này chạy JS cũ (bản lưu sẵn) hoặc không phải trình duyệt thật. Facebook trong app có trường mới: 93 phiên (iab=fb), Zalo 24.
- Lỗi Vercel 24 giờ: không có.
- Người "full" (Ngày 8d): 22 người xong quyển II (73% chơi hôm nay), 191 người đã Khai Thiên.

Góp ý (12 góp ý mới #283-#294, cộng 85 góp ý tồn từ 31/10-12/11 chưa ai trả lời, đã xem hết):
- #135, #283 (khe nứt không gian khép kiếp mà không báo): sửa trong đêm, nút "Bước vào" ghi rõ "Bước qua là kiếp này khép lại". Không đổi luật, không cần mô phỏng (chỉ đổi chữ gợi ý). Tặng 10 phúc mỗi người (tác vụ 5:00 gửi kèm trả lời). Dòng mới trong cáo thị 4.6.0 nhóm "Sửa lỗi 19/11".
- Ý lớn ghi lại cho hậu kỳ: góp ý "[Sau chứng đạo]" (24 góp ý) gom vào `docs/thiet-ke-hau-ky.md` (quyển III, chọn thế giới khởi đầu). Cân bằng ghi lại, chưa làm: Cương/Nhu theo hồi chiêu (#284), Tụ Khí Đan theo % (#285), thiên phú tím yếu (#286), linh căn (#287), tự dừng khi săn yêu sắp chết (#291), đồ theo đạo (#292), tên Trúc Cơ Đan ở cảnh giới cao (#289), giới hạn 500 chữ (#288, cần hàm máy chủ mới).
- Câu trả lời đã soạn ở Ghi chú Ngày 8a (plan-4.6.0), gồm cả nhóm góp ý tồn.
- Không đọc được bình luận Facebook: phiên này không có Claude in Chrome. Bình luận Hoang Le (Tyler chuyển) đã xử lý ở Ngày 8d.

Nhận định:
1. D1 của nhóm 14-16/11 thấp hơn đầu tháng khoảng 10 điểm, trùng lúc quảng cáo Chân Thân chạy và nhóm 411px tăng. Phải tách được phiên thật trước khi kết luận kiếp đầu xấu đi.
2. Sơn Môn kéo người cũ: 248 phiên mở ngày đầu. Thứ người trong môn còn thiếu là lý do làm việc mỗi ngày ngoài Khí vận; Công đóng góp và pháp bảo theo hạng Công (8a) là lý do đó, đo bằng `sm_thuong_mo` và số người đủ 10 Công mỗi ngày.
3. Người full ít nhưng rất trung thành và là người viết bình luận công khai. Quyển III và chọn thế giới khởi đầu đáng làm sớm (8e, 8f).

Việc tăng trưởng đêm nay:
1. Sửa #135/#283 (ở trên). Giả thuyết: người chơi bỏ game sau khi mất một kiếp đang mạnh vì bấm thử. Đo: số lần chọn "Bước vào" trên số lần gặp sự kiện `xuyen_khong` trước/sau bản 19/11 (sự kiện `ev` theo id). Cải thiện tiếp: nếu tỉ lệ bước vào vẫn cao ở kiếp trên 10 thì thêm hỏi lại một lần.
   - Đối chiếu: không trùng với plan-4.5.0 (xong), plan-4.6.0 (Sơn Môn, hậu kỳ), không có docs/yeu-cau-lam-tinh-nang.md.
2. Không thêm việc mới khác: đêm nay ba khối Sơn Môn + thiết kế hậu kỳ đã là phần người chơi thấy nhiều nhất; thêm việc nữa sẽ không thử kịp.

Quyết định tự chốt:
- Công tính lại từ dữ liệu có sẵn thay cho bảng `vkl_sm_cong` (ít chỗ hỏng hơn, đúng ngay từ 18/11); hạng môn chọn phẩm chỉ xét môn đủ điều kiện.
- Không code quyển III đêm nay, chuyển thành khối 8e (20/11) và 8f chọn thế giới khởi đầu (22/11); tên cảnh giới mới là Chân Nhân.
- Trả lời cả 85 góp ý tồn theo nhóm thay vì để mãi ở 'moi'.

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn lần 2: vẫn chờ tách nhóm 411px (đo tiếp 19-20/11).
- Sơn Môn: tin hệ thống Truyền âm chờ Tyler chạy `supabase/son_mon_chat_he_2026_11_19.sql`.
- Hậu kỳ: 8e (quyển III chặng 1) 20/11, 8f (chọn thế giới) 22/11, chặng 2-4 sau đó.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Bài Page "Phần thưởng Kỷ 1": "Sơn Môn có phần thưởng rồi. Hết Kỷ 1 (21:00 ngày 1/12), môn hạng 1 nhận pháp bảo Thần phẩm, hạng 2 Tiên phẩm, hạng 3 Linh phẩm. Trong mỗi môn, 7 người góp công nhiều nhất nhận vũ khí, mỗi hạng một loại: kiếm, đao, thương, quạt, phất trần, cung, song chùy. Môn chủ nhận thêm Chưởng Môn Ấn. Công có từ điểm danh, nhiệm vụ trong kiếp, khai hoang, theo xuất chinh và đứng giữ ô. Mở Sơn Môn, bấm Phần thưởng trên thẻ môn để xem nếu Kỷ kết thúc bây giờ ngươi nhận gì. van-kiep-luan-hoi.vercel.app"
- Caption ngắn: "Bảy hạng, bảy món vũ khí. Nhìn vũ khí là biết ai đứng thứ mấy trong môn."
- Kịch bản video 9:16 (15 giây): 0-3s cận 7 vũ khí Thần phẩm nhấp lửa, chữ "Kỷ 1 kết thúc 1/12"; 3-8s màn "Nếu Kỷ kết thúc bây giờ, ngươi nhận: Thần phẩm Đao"; 8-12s bảng Công trong môn, dòng "Ngươi" sáng lên; 12-15s chữ "Vào môn, góp công, giành vũ khí" + link. Quay bằng `?demo=chu&m=thuong` như video Sơn Môn.
- Trả lời Hoang Le: ở `docs/thiet-ke-hau-ky.md` mục 5.

Quảng cáo Facebook: chưa nên chạy thêm tới khi tách xong nhóm 411px (đo 19-20/11). Giữ đề xuất đợt Sơn Môn 20-26/11 (50.000đ/ngày, 17h-24h, Việt Nam 18-40, Lưu lượng truy cập), thêm mẫu thứ ba: ảnh 7 vũ khí Thần phẩm với chữ "Nhìn vũ khí là biết ai đứng thứ mấy". Dừng mẫu nào trên 2.000đ mỗi người xong kiếp 1 sau 2 tối, hoặc D1 nhóm quảng cáo dưới 20%. Chỉ tính phiên có trường `vis` (bỏ nhóm 411px không có trường mới).

## Lên bản 5:00 sáng 20/11: lôi đài giữ bóng (Tyler duyệt 11:28 19/11)

Phan Anh Tuấn báo: kiếp Chuẩn Thánh mạnh nhất có thể rơi khỏi danh sách khi chơi thêm kiếp Khai Thiên, và mỗi ngày lôi đài tự đổi sang bóng yếu.
- Máy chủ (đã áp 19/11, `supabase/loi_dai_giu_bong_2026_11_19.sql`): `vkl_arena_candidates2` lấy 40 kiếp + kiếp ra đài gần nhất; `vkl_arena_state2` trả `me.lastLife`.
- Client: `rankCands`/`arenaPower` trong `lib/social.ts` (Huyết x (Công + nửa Thủ)), hiện 12 + giữ kiếp đang ra đài; `components/Arena.tsx` sang ngày mới giữ bóng hôm qua.
- Cáo thị "Sửa lỗi 20/11". Page đã hứa với Tuấn bản 5:00 sáng 20/11.

## Việc Tyler giao 18/11 tối - lên bản 5:00 sáng 19/11

**Chữ biến chiêu Nhu - ĐÃ LÀM 18/11 tối** (sót ở bản 18/11; Tyler chốt sửa và hứa với Nguyễn Quang).

- `lib/game/congPhap.ts`: `BIEN_DESC.nhu` ghi đúng theo `bienDef` (độc +1 tầng, khiên +1 đòn, các hiệu ứng khác +30%, chiêu không có hiệu ứng phụ thì chỉ nhanh 1 lượt); hàm mới `bienLine(d, b)` tính dòng riêng cho từng chiêu, ví dụ Kim Chung Tráo "Nhu: chặn 1 → 2 đòn, phản 50% → 65% sát thương, hồi chiêu 6 → 5 lượt", Kim Cang Chưởng "chỉ đổi hồi chiêu 3 → 2 lượt".
- `components/TangKinhCac.tsx`: ở tầng 5 (báo trước) và lúc chọn biến chiêu, ghi hai dòng Cương/Nhu cho đúng chiêu đó. Không đổi số.
- Cáo thị: nhóm "Sửa lỗi 19/11" trong 4.6.0. tsc, build, smoke-congphap sạch.
- Sau khi lên bản: page đã hứa với Quang bản 5:00 sáng 19/11.
- SmList "50 kiếp" đã sửa thành 30 trong commit khác của 18/11. Đền bù lôi đài của `tudang`: Tyler chốt giữ.

## Việc Tyler giao cho đêm 17/11 - lên bản 5:00 sáng 18/11 cùng chuyến Sơn Môn 4.6.0 (bắt buộc)

ĐÃ LÀM đêm 17/11 (4401b40, cáo thị trong 4.6.0 nhóm "Sửa lỗi 18/11"): cả ba việc bắt buộc, và ghi mã lỗi Lôi đài ra log Vercel (`console.warn`, để không lẫn vào lỗi thật). Chưa làm phần tự chọn bóng lại khi `NO_SHADOW` vì máy chủ đã gỡ gốc lỗi; xem lại nếu log còn `NO_SHADOW`. Xem "Đêm 17/11" bên dưới.

**Nút "Luyện tâm pháp" khó hiểu khi chiêu chạm trần** (Truong Pham hỏi qua Messenger 17/11 19:07: đủ quyển, đủ thục luyện mà không nâng được; page đã hứa sửa chữ trong bản sáng 18/11).

- Hiện tượng: chiêu chỉ lên tối đa tầng tâm pháp + 2 (`capOf`, `TAM_GAP`). Khi chạm trần, nút xám ghi "Luyện tâm pháp" (`components/TangKinhCac.tsx` nhánh `blk === 'cap'`) nên người chơi tưởng lỗi.
- Cách sửa: nút ghi rõ "Cần tâm pháp T{n}" (n = tầng chiêu - 1), kèm một dòng nhỏ "Chiêu cao hơn tâm pháp tối đa 2 tầng". Nếu tâm pháp đang thiếu quyển mà có quyển chiêu khác dư để chép 3 thành 1 thì gợi ý luôn. Có bản tiếng Anh, chạm vào là đọc được trên điện thoại.
- Cáo thị 18/11 gộp dòng: "Tàng Kinh Các ghi rõ khi nào cần nâng tâm pháp trước."
- Sau khi lên bản: Tyler duyệt rồi nhắn Truong "bản sáng nay 18/11 sửa chữ rồi nha bạn".

**Lôi đài kẹt trận treo - ĐÃ SỬA TRÊN MÁY CHỦ 17/11 20:40, không cần lên bản** (Hoang Le, tài khoản `ton`).

- Nguyên nhân: `vkl_arena_state2` reset lượt khi sang ngày mới nhưng không xóa `pending`; bóng ngày cũ hết hạn nên `/api/loi-dai` trả `NO_SHADOW` -> "Máy chủ chưa ghi được trận này". 22 tài khoản kẹt, sớm nhất từ 2/11.
- Đã làm (`supabase/loi_dai_tran_treo_2026_11_17.sql`): state2 xóa trận treo khi sang ngày mới hoặc khi bóng đã hết hạn; pick2 cho chọn bóng mới khi trận treo thuộc bóng ngày cũ; Tyler chốt đền bù 100 phúc duyên + thư tạ lỗi cho 22 tài khoản; đã gỡ hết trận treo. Kiểm tra: 0 tài khoản còn kẹt, `ton` chạy thử chọn bóng - rút đối thủ - ghi trận thành công.
- Còn lại cho đêm nay (không bắt buộc): khi `/api/loi-dai` trả `NO_SHADOW` thì game tự gọi chọn bóng lại rồi rút trận mới, thay vì báo "Máy chủ chưa ghi được"; ghi `console.error` mã lỗi ở route để lần sau xem được log.

**Chữ biến chiêu Nhu ghi sai một phần** (Nguyễn Quang hỏi qua Messenger 17/11 23:32 "hiệu ứng đậm 30% là sao", ảnh Đại Lực Kim Cang Chưởng T5; page hứa sửa chữ trong bản sáng 18/11).

- Hiện tượng: `BIEN_DESC.nhu` ghi "thiêu/độc/hút máu/choáng/khiên/phản đòn đậm hơn 30%", nhưng `bienDef` cho độc +1 tầng và khiên +1 đòn (không phải 30%), còn né và hồi máu cũng +30% mà chữ không nhắc. Chiêu chỉ có `mul`/`pierce` (như `kim_cang_chuong`) thì Nhu chỉ còn hồi nhanh 1 lượt, chữ không nói nên người chơi chọn nhầm.
- Cách sửa: chỉ đổi chữ, không đổi số. Ở màn chọn biến chiêu (tầng 6), mỗi nút ghi kết quả cụ thể cho đúng chiêu đó, tính từ `bienDef`: ví dụ Kim Chung Tráo "Nhu: chặn 2 đòn, phản 65%, hồi nhanh 1 lượt"; Kim Cang Chưởng "Nhu: chỉ hồi nhanh 1 lượt". Sửa luôn `BIEN_DESC.nhu` chung cho đúng (độc thêm 1 tầng, khiên chặn thêm 1 đòn, các hiệu ứng khác mạnh hơn 30%). Có bản tiếng Anh.
- Cáo thị 18/11 gộp chung dòng chữ chiêu thức.

**Chữ mô tả chiêu hút máu chưa thống nhất** (Nguyễn Quang hỏi qua Messenger 17/11 10:23, page đã hứa sửa chữ trong bản sáng 18/11).

- Hiện tượng: 4 chiêu hút máu ghi mỗi chỗ một kiểu, người chơi tưởng "hút 50% máu" là lấy 50% máu quái. Trong `lib/game/congPhap.ts` (dòng `main:`): `kim_xa` "hút 30% máu", `huyet_anh_trao` "Hút 30% sát thương thành máu", `thon_phe` "Đòn nặng, hút 50% máu", `huyet_te` "Đòn máu, hút nửa sát thương". Cả 4 cùng cơ chế `leech`: hồi cho mình theo % sát thương vừa gây ra.
- Cách sửa: chỉ đổi chữ, không đổi số. Một mẫu chung cho mọi chiêu có `leech`: "..., hồi máu bằng X% sát thương gây ra" (tiếng Anh "heals you for X% of damage dealt"). Soát luôn chỗ khác hiện mô tả chiêu (Tàng Kinh Các, Phường thị, cẩm nang) cho cùng một cách gọi. Dùng /humanizer, dùng "-" không dùng "—".
- Cáo thị 18/11 gộp chung dòng với lỗi tuyệt kỹ, ngắn: "Mô tả các chiêu hút máu ghi rõ là hồi máu theo sát thương gây ra. Cảm ơn Nguyễn Quang và Phan Anh Tuấn."
- Sau khi lên bản: Tyler duyệt rồi nhắn Quang "bản sáng nay 18/11 sửa chữ rồi nha bạn".

**Tuyệt kỹ đã dung hợp bị kẹt tầng** (Phan Anh Tuấn báo trong bình luận bài bia mộ 16/11, page đã trả lời hứa sửa trong bản 5:00 sáng 18/11).

- Hiện tượng: tuyệt kỹ dung hợp xong (tầng 5 trong ảnh của Tuấn) đầy thục luyện nhưng không có tàn quyển để lên tầng.
- Nguyên nhân (`lib/game/congPhap.ts`): rơi tàn quyển tuyệt kỹ chỉ khi `s.tuyet !== tu.id` (dòng ~386), nên đã lĩnh ngộ là thôi rơi; Phường thị `tuyetForSale` trả null khi đã lĩnh ngộ và `tqShopEq` lọc bỏ `kind === 'tuyet'`. Còn lại chỉ tàn quyển vạn năng rất hiếm.
- Cách sửa: sau khi đã dung hợp, tàn quyển tuyệt kỹ tiếp tục rơi từ trận khó cho tới khi đủ quyển lên tầng 9 (như bộ thường, giảm dần khi đang ôm nhiều), và Phường thị bán tàn quyển tuyệt kỹ đang có cho tới tầng 9 (giá `TQ_TUYET_MUL`, chung giới hạn mỗi năm). Không đổi giá, không đổi `TQ_COST`.
- Kiểm tra: mô phỏng một kiếp có tuyệt kỹ tầng 5 đầy thục luyện, xác nhận có đường lên tầng 6-9 bằng rơi và bằng Phường thị; tsc, build, smoke.
- Cáo thị 18/11 (ngắn, không số): "Tuyệt kỹ đã dung hợp giờ vẫn nhặt và mua được tàn quyển để lên tầng. Cảm ơn Phan Anh Tuấn đã báo."
- Sau khi lên bản và kiểm tra site chạy thật: Tyler duyệt rồi trả lời Tuấn dưới bình luận "bản sáng nay 18/11 sửa rồi nha bạn".

## Việc Tyler giao cho đêm 16/11 - lên bản 5:00 sáng 17/11 (bắt buộc)

**Lỗi chữ "oan hồn đỡ đòn vô cớ"** (Nguyễn Quang báo qua Messenger 16/11 15:00, đã hứa với bạn ấy là sửa).

- Hiện tượng: chọn lựa chọn có rủi ro chết (`fatal()`), xúc xắc ra chết nhưng được cứu (oan hồn `c.oanHon`, sư phụ cứu `masterSaves`, hoặc thân tu đạo `phamGuard` chỉ bị thương). Sự kiện vẫn in đoạn kết "bình an" và vẫn cộng thưởng, rồi mới nối câu cứu mạng. Ví dụ `canh_doc` (Quán trọ ven đường): "Canh ngon thật. Hóa ra chủ quán chỉ là người tốt bụng." + "Một bóng oan hồn... lao ra chắn đòn", còn +10 sức khỏe. Tiệc Hồng Môn cũng vậy (+200 linh thạch).
- Phạm vi: 65 chỗ dạng `return <kết bình an> + (f ?? '')` - events.ts 49, hopHoan.ts 8, events2.ts 5, events3.ts 2, ambush.ts 1.
- Cách sửa: khi `f` khác null thì người chơi đã gặp nạn thật. Mỗi chỗ đổi thành: một câu ngắn kể nạn có thật (canh có độc, rượu có độc, kẻ phục kích ra tay...) + `f`, không in kết bình an, không cộng phần thưởng của nhánh bình an. Viết câu theo từng sự kiện cho khớp lời kể (dùng /humanizer, có bản tiếng Anh, dùng "-" không dùng "—"). Câu cứu mạng trong `fatal()` giữ nguyên.
- Kiểm tra: thêm script chạy từng lựa chọn trong 65 chỗ với `c.oanHon = true` và xúc xắc ép ra chết, xác nhận chữ trả về không còn câu kết bình an và không cộng thưởng; tsc, build, smoke như thường lệ.
- Cáo thị 17/11 (ngắn, không số): "Khi oan hồn hay sư phụ cứu ngươi khỏi cửa tử, sự kiện giờ kể đúng là ngươi vừa thoát chết. Cảm ơn Nguyễn Quang đã báo."
- Sau khi lên bản và kiểm tra site chạy thật: nhắn Quang một dòng ngắn "bản sáng nay 17/11 sửa rồi nha bạn" (Tyler duyệt gửi trước).
- ĐÃ LÀM đêm 16/11 (d706964): xem "Đêm 16/11" bên dưới. Hai việc nhỏ (trục Tài, sức khỏe tối đa 100) cũng đã làm (4e5e0cf).

Hai việc nhỏ cùng nguồn (Quang hỏi 16/11), làm nếu còn thời gian, không bắt buộc cho 17/11:
- Biểu đồ chỉ số nhân vật: trục "Tài" (điểm giàu theo linh thạch, `wealthScore`) dễ hiểu nhầm. Chạm vào trục hiện một dòng giải thích, hoặc đổi nhãn rõ hơn.
- Thiên phú cộng sức khỏe bị chặn ở 100 mà người chơi không biết. Màn mua thiên phú ghi rõ "sức khỏe tối đa 100", hoặc phần dư đổi thành thọ nguyên (cần mô phỏng cân bằng trước).

## Đêm 17/11/2026 (lên bản 18/11)

Kế hoạch: 4.6.0 Ngày 7 xong (7e5a9be): bật Sơn Môn, Kỷ 1 đã tạo trên Supabase (18/11 5:00 - 1/12 21:00, 127 ô), cáo thị 4.6.0, nút "Vào môn của sư phụ", chấm đỏ tab Sơn Môn, sửa lỗi nhỏ Ngày 3/6, video 9:16. Chi tiết ở Ghi chú Ngày 7 trong plan-4.6.0.

Việc Tyler giao (4401b40):
- Nút tâm pháp: chiêu chạm trần ghi "Cần tâm pháp T{n}" + dòng "Chiêu chỉ cao hơn tâm pháp tối đa 2 tầng." + gợi ý "Thiếu quyển tâm pháp? Chép 3 quyển X thành 1." khi tâm pháp thiếu quyển mà có chiêu cùng đạo dư từ 3 quyển. Thử: `scripts/smoke-tam-phap-cap.cjs` (Playwright 390x844), 5/5 OK.
- Chiêu hút máu: 4 chiêu cùng mẫu "hồi máu bằng X% sát thương gây ra" (Anh: "heals you for X% of damage dealt"), mô tả đạo Ma và Nhu đổi theo. Không đổi số.
- Tuyệt kỹ đã dung hợp: tàn quyển tuyệt kỹ tiếp tục rơi từ trận khó và bán ở Phường thị (giá cũ `TQ_TUYET_MUL`, chung giới hạn mỗi năm) cho tới khi đủ quyển lên tầng 9; thẻ Phường thị ghi "Tuyệt kỹ · đang tầng N". Thử: `npx tsx scripts/thu-tuyet-tang.ts`: cả 6 đạo, tầng 5 sau dung hợp, rơi đủ 10 quyển (đủ tới tầng 9) rồi thôi rơi, Phường thị bán khi còn thiếu và thôi bán khi đủ, chưa có chiêu tầng 9 thì vẫn không rơi tuyệt kỹ. `sim-tan-quyen` không đổi (mô phỏng chưa tới tuyệt kỹ).

Số chính (đọc khoảng 21:30):
- Tài khoản mới: 15/11 165, 16/11 76, 17/11 41 (tới 21:30). Phiên mỗi ngày (vkl_daily): 15/11 1.639, 16/11 1.329.
- D1: nhóm 13/11 38,4%, 14/11 28,8%, 15/11 29,1%. D7: nhóm 8/11 9,6%, 9/11 7,5% (dưới mốc 11-14%).
- Phễu tài khoản theo ngày vào (đủ 2 kiếp / đủ 10 kiếp): 14/11 92/43 trên 139, 15/11 96/44 trên 165.
- Màn rời nhiều nhất 16/11: đầu thai 542, đang chơi 417, chưa rõ 369, sự kiện 311, chết 142.
- Phát hiện mới: 30 giờ qua có khoảng 200 phiên rộng đúng 411px, không nguồn (hoặc từ quảng cáo), ẩn trong vòng 10 giây, chỉ khoảng 3% vào kiếp (máy khác 40-50%). 17/11 chiếm 168/325 phiên thấy màn kiếp đầu gọn. Nghi trình duyệt trong app Facebook tải trước hoặc máy duyệt quảng cáo. Bỏ nhóm này ra thì vào kiếp 1 / thấy màn kiếp đầu: 14/11 66%, 15/11 65%, 16/11 64%, 17/11 52% (ngày chưa hết).
- Tính năng 24 giờ (phiên): Tàng Kinh Các 450, lò rèn 297, mua tàn quyển 304, đấu giá 459, điểm danh 252, khai huyệt 254, Lôi đài ra đài 102 / đánh 112 (khớp), màn chờ Sơn Môn 107 (16/11 130), Sư Đồ: Mời đệ tử 28, mở link mời 14, bái sư 3 (16/11: 46 / 8 / 1). Tạo chân thân 85/85 người xem Mộng Tỉnh.
- Lỗi Vercel 24 giờ: không có.

Góp ý (12 góp ý 'moi' từ #271 tới #282, đã xem hết):
- #279 (Luyện Hư còn gặp sự kiện bắt trộm vặt): sửa trong đêm, sự kiện "Trộm đột nhập" chỉ ra khi dưới Hóa Thần. Mô phỏng `sim-do-kho 3000` trước/sau: tới Trúc Cơ 79,6/79,8%, Kim Đan 66,5/66,1%, Nguyên Anh 45,0/45,8%, Hóa Thần 23,4/23,9%, Luyện Hư 9,6/8,6%, Độ Kiếp 2,1/1,8%; tuổi chết TB 119/120; thắng trận 72,7/72,9%. Trong sai số. Thêm một dòng vào cáo thị 4.6.0.
- Ghi lại, chưa làm: #272 bán lại đan dược; #273 công pháp cùng hệ linh căn mạnh hơn; #274 chân truyền được phát linh thạch; #278 học chiêu ngoài đạo. #277 bị cướp giết vì ôm nhiều tiền đi đêm: đúng luật, trả lời cách tránh. Còn lại là chấm sao.
- Câu trả lời đã soạn ở Ghi chú Ngày 7 (plan-4.6.0), kèm nhóm lập tông môn (#174, #185, #201, #221) để gửi khi Sơn Môn mở. Không ai bị thiệt vì lỗi cần bù đêm nay.
- Không đọc được bình luận Facebook: phiên này không có Claude in Chrome.

Nhận định:
1. Phễu kiếp 1 đo bằng `first_simple` đang bị nhóm 411px kéo xuống mạnh (17/11 còn 33% nếu tính cả). Trước khi cải thiện kiếp đầu lần 3 phải tách được nhóm này, nếu không sẽ sửa nhầm chỗ.
2. Người mới đang ít đi (quảng cáo Chân Thân gần hết ngân sách, tới 19/11). Sơn Môn mở 18/11 là thứ mới lớn nhất để kéo người cũ quay lại; người mới chưa vào được môn ngay vì cần tài khoản và chân thân, nên màn Sơn Môn cho khách dẫn thẳng tới Liên kết tài khoản.

Việc tăng trưởng đêm nay:
1. Đo sạch phễu (tăng trưởng, Tracker): sự kiện `open` ghi thêm `vis` (trang mở khi đang ẩn), `pre` (tải trước), `wd` (trình duyệt tự động), `iab` (fb/ig/ms/zalo/th), `bot`. Người chơi không thấy gì khác.
   - Giả thuyết: nhóm 411px là phiên không phải người (tải trước trong app Facebook). Chỉ số: tỉ lệ phiên `open` có `vis = hidden` hoặc `bot`, và tỉ lệ vào kiếp 1 khi bỏ các phiên đó. Cải thiện tiếp: nếu đúng là tải trước thì sửa câu SQL hằng đêm loại các phiên này, và báo Tyler loại vị trí quảng cáo gây ra (nếu `iab` cho thấy một nguồn).
   - Đối chiếu: không trùng với plan-4.5.0 (xong), plan-4.6.0 (Ngày 7 chỉ Sơn Môn), không có docs/yeu-cau-lam-tinh-nang.md.
2. Sửa #279 (ở trên).

Quyết định tự chốt:
- Bật `SON_MON_ON` bằng cách đổi mặc định trong code (không đổi biến môi trường trên Vercel, vì không được sửa cấu hình).
- Màn lập môn và chọn ô: nút quay lại trên thanh đầu quay về bước trước trong Sơn Môn thay vì rời trang; bỏ nút "‹" thứ hai.
- Chấm đỏ tab Sơn Môn chỉ cho người đã bấm "Báo ta khi có môn mở cửa", tắt sau khi họ mở tab (không thành thông báo dồn dập).

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn lần 2: đo tới 19/11, nhưng phải tách nhóm 411px trước (dữ liệu mới từ bản 18/11).
- Sơn Môn: Kỷ 1 mở 18/11 5:00. Đo theo "Điều kiện dừng" của plan-4.6.0 từ 25/11. Còn lại: tên người theo xuất chinh, màn thưởng Kỷ.
- Xem lại tâm pháp cấp cao (#264): chưa làm.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Bài Page (sáng 18/11): "Sơn Môn mở cửa rồi. Từ 5:00 sáng nay, đạo hữu nào đủ 30 kiếp và 5 ngày chơi có thể lập môn, mời hai người ký cùng lập là dựng cờ được ngay. Chưa đủ thì vào một môn đang mở cửa: mỗi ngày điểm danh, làm 3 nhiệm vụ ngay trong kiếp, góp Khí vận cho cả môn. Môn chủ phát lệnh xuất chinh trên bản đồ ô lục giác, ai cũng chọn được ô để đứng giữ. Kỷ 1 kéo tới 21:00 ngày 1/12, môn chiếm nhiều ô đất nhất xếp hạng nhất. Trong môn có Truyền âm để bàn nhau. Không có gì phải mua, Lực chiến chỉ lên khi ngươi chơi. Chơi trên trình duyệt: van-kiep-luan-hoi.vercel.app"
- Caption ngắn: "Sơn Môn mở cửa. Lập môn cùng đạo hữu, giữ đất tới 1/12."
- Video 9:16 25 giây (đã gửi Tyler, file `son-mon-9x16.mp4`): vào môn - điểm danh - nhiệm vụ - bản đồ - xuất chinh - chiến báo. Gợi ý chữ trên video: 0-4s "Ngươi chưa có sơn môn?", 4-10s "Điểm danh, 3 nhiệm vụ mỗi ngày", 10-15s "Giữ đất trên bản đồ", 15-21s "Môn chủ ra lệnh, đệ tử theo", 21-25s "Kỷ 1 tới 1/12" + link.

Quảng cáo Facebook: giữ đề xuất đêm 16/11 (đợt Sơn Môn 20-26/11, 50.000đ/ngày, 17h-24h, Việt Nam 18-40, mục tiêu Lưu lượng truy cập, 2 mẫu: anh40 và ảnh bản đồ Sơn Môn; dừng mẫu nào trên 2.000đ mỗi người xong kiếp 1 sau 2 tối, hoặc D1 nhóm quảng cáo dưới 20%). Thêm một điều kiện trước khi chạy: đêm 18-19/11 xem `iab`/`vis` của nhóm 411px; nếu là tải trước của Facebook thì tính giá mỗi người xong kiếp 1 trên phiên thật, và nếu nhóm này đến từ một vị trí quảng cáo (Audience Network) thì bỏ vị trí đó.

## Câu SQL dùng mỗi đêm

```sql
-- người mới mỗi ngày, D1, D7, số người đủ 2 và 10 kiếp (tài khoản đăng ký, theo ngày vào giờ VN)
with p as (select id, created_at from vkl_players where created_at >= now() - interval '16 day'),
l as (select l.player_id, floor(extract(epoch from (l.created_at - p.created_at))/86400)::int d from vkl_lives l join p on p.id = l.player_id),
agg as (select player_id, count(*) n, bool_or(d >= 1) d1p, bool_or(d >= 7) d7p from l group by player_id)
select (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date ngay, count(*) n,
 count(*) filter (where coalesce(a.n,0)>=1) co_kiep,
 round(100.0*avg(coalesce(a.d1p,false)::int) filter (where p.created_at < now()-interval '2 day'),1) d1,
 round(100.0*avg(coalesce(a.d7p,false)::int) filter (where p.created_at < now()-interval '8 day'),1) d7,
 count(*) filter (where coalesce(a.n,0)>=2) k2, count(*) filter (where coalesce(a.n,0)>=10) k10
from p left join agg a on a.player_id=p.id group by 1 order by 1;

-- màn rời nhiều nhất, phiên, góp ý (đã gom sẵn mỗi ngày)
select day, stats->>'sid' sid, stats->>'open_new' open_new, stats->>'signup_acc' signup, stats->>'play_min_med' play_med, stats->'leave_sc' leave_sc
from vkl_daily where day >= current_date - 8 order by day;

-- mức dùng tính năng 24 giờ qua (số phiên)
select kind, count(*) n, count(distinct sid) sid from vkl_events
where created_at > now() - interval '24 hour' and kind <> 'hb' group by 1 order by 2 desc limit 60;

-- 4.5.0 (từ 13/11): phễu chân thân. ct_intro = xem Mộng Tỉnh, ct_create = tạo xong, huyet_intro = xem Tam Tài Đồ
select kind, count(distinct sid) sid, count(*) filter (where (data->>'done')::boolean) xem_het
from vkl_events where created_at > now() - interval '24 hour'
  and kind in ('ct_intro','ct_create','huyet_intro','huyet_open','huyet_view','huyet_share','ct_card_tap','ct_rename','ct_look')
group by 1 order by 1;
```

## Đêm 12/11/2026 (lên bản 13/11)

Số chính:
- Người mới đăng ký mỗi ngày: 9/11 48, 10/11 58, 11/11 48, 12/11 31 (tới 21:50). Tuần trước còn ads: 130-230/ngày.
- D1 (còn chơi sau 1 ngày): nhóm 5/11 40,5%, 6/11 41,7%, 7/11 32,1%, 8/11 30,1%, 9/11 29,2%, 10/11 22,0%. Đang đi xuống.
- D7: nhóm 2/11 14,3%, 3/11 11,3%, 4/11 7,8% (mốc 11-14%).
- Phễu nhóm 8/11 (146 tài khoản): có kiếp 1 119 (82%), đủ 2 kiếp 98 (67%), đủ 10 kiếp 53 (36%).
- Phiên mỗi ngày (vkl_daily.sid): 7/11 1.847, 8/11 1.888, 9/11 1.247, 10/11 984, 11/11 930.
- Màn rời nhiều nhất 11/11: màn đầu thai 340, đang chơi 322, chưa rõ 241, sự kiện 201, túi đồ 106, chết 76.
- Giờ đông nhất (24 giờ qua, số phiên): 21h 106, 23h 76, 22h 74, 20h 71. Vắng nhất 3-4h sáng.
- Dùng tính năng 24 giờ qua (số phiên, trên 733 phiên mở game): lò rèn 249, Tàng Kinh Các (cp_tang) 337, đấu giá 355, thu phục linh thú 292, Lôi đài 76-89, điểm danh 214, cẩm nang 77, Hồng Hoang đánh 73.
- Góp ý mới 3 ngày qua: 20 (đều trạng thái mới). Báo lỗi: #227 kẹt Lôi đài, #224 hợp đồ mất món, #223 mất cà sa đang mặc, #222 chết khi máu 60%.
- Lỗi Vercel 48 giờ qua: không có.

Nhận định:
- Người mới giảm vì tắt ads; D1 cũng giảm theo nhóm (22-30% so với 35-41% đầu tháng). Không phải lỗi kỹ thuật (Vercel sạch).
- Màn đầu thai là nơi người chơi rời nhiều nhất. 4.5.0 chen Mộng Tỉnh và màn tạo chân thân ngay ở đây (sau kiếp 1), nên phải theo sát phễu `ct_intro` -> `ct_create` từ 13/11. Plan 4.5.0 đã có điều kiện dừng: dưới 60% tạo chân thân thì rút gọn màn tạo.
- Kiếp 2-10 vẫn là chỗ rơi lớn nhất (82% -> 36%), đúng mục tiêu của 4.5.0.

Việc đêm nay:
1. Sửa lỗi chặn người chơi: Lôi đài kẹt khi tắt game giữa trận (góp ý #227). Nguyên nhân: rút đối thủ xong thì máy chủ giữ "trận chờ"; quay lại trong ngày, trang Lôi đài xin khóa bóng trước khi rút, máy chủ trả `PENDING` và trang dừng ở câu báo lỗi, không có cách đánh nốt. Sửa ở trình duyệt (`components/Arena.tsx`): gặp `PENDING` khi ra đài thì dùng đúng bóng máy chủ đang giữ, rút lại ra đúng đối thủ cũ và đánh nốt. Không đổi hàm máy chủ, không đổi luật.
   - Đối chiếu: không trùng với plan-4.5.0 (Ngày 1-4), plan-4.6.0 (Ngày 1-8, Sơn Môn chưa đụng Lôi đài); không có docs/yeu-cau-lam-tinh-nang.md.
   - Đo: `arena_go` so với `arena_fight` mỗi ngày (khoảng cách nhỏ lại), không còn góp ý báo kẹt Lôi đài.
   - Cáo thị: thêm một dòng "Sửa lỗi" vào cáo thị 4.5.0.
2. Không làm thêm thay đổi người chơi thấy được: đêm nay bật 4.5.0 cho mọi người, giữ bản gọn để dễ đọc số chân thân.

Đề xuất chờ Tyler:
- Hai lỗi mất đồ (#224 hợp 9 món ra 3 món cực mà túi không thấy, #223 cà sa đang mặc tự mất) cần soi kỹ dữ liệu túi đồ của người báo; Tyler có muốn ưu tiên đêm 13/11 không?
- Quảng cáo Facebook: CHƯA nên chạy. Plan 4.5.0 đặt điều kiện: chỉ chạy lại khi nhóm vào sau 4.5.0 có D7 cao hơn mốc. Nhóm 13/11 có D7 sớm nhất ngày 21/11. Nếu D7 >= 14% thì đề xuất chạy trước Kỷ 1 (18/11) là không kịp đo; hợp lý hơn là chạy từ 21-22/11.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Video Mộng Tỉnh 9:16, 27 giây, có tiếng chuông (đã gửi Tyler 12/11).
- Caption Page: "Mỗi kiếp là một giấc mộng. Mộng tan, chân thân còn. Từ hôm nay, Vạn Kiếp Luân Hồi có chân thân của riêng ngươi: tự chọn dáng, đặt pháp danh, mỗi kiếp làm được việc gì thì khắc vào thân một huyệt. Kẻ vừa chết kia là ngươi. Nhưng cũng không phải ngươi. Chơi miễn phí trên trình duyệt."
- Caption Threads ngắn: "Chết 40 kiếp rồi mới nhớ ra mặt mình. Bản 4.5.0: chân thân, thập đại huyệt, Tam Tài."

Tyler trả lời 12/11 tối:
- Đồng ý ưu tiên hai lỗi mất đồ #224 (hợp 9 món ra 3 món cực mà túi không thấy) và #223 (cà sa đang mặc tự mất) trong đêm 13/11. Việc đầu tiên của phần Tăng trưởng đêm 13/11: soi `mergeItems` (lib/game/market.ts) và luồng mặc/tháo đồ, tìm đường làm mất đồ, sửa, viết smoke tái hiện.
- Hỏi lại về quảng cáo: không chạy thì người chơi tụt. Claude đề xuất chạy thử nhỏ ngay từ 13/11 thay vì chờ 21/11, chờ Tyler chốt ngân sách.

- Cần xem đêm 13/11: ở màn cáo biệt, ảnh chụp thanh Thập Kiếp chỉ thấy 1 ô sáng trong khi chữ ghi "2/10" (dù class của 2 ô đều là `on`). Kiểm lại trên điện thoại thật.

- Tyler cho biết 12/11: đợt quảng cáo trước chi 300.000đ trong 7 ngày (khoảng 43.000đ/ngày). Đợt đó mang về khoảng 1.000 lượt vào từ Facebook (utm fb 2-9/11), tức khoảng 300đ một lượt vào. Claude đề xuất đợt mới 100.000đ/ngày x 5 ngày, chạy song song ảnh manhua và ảnh hình game thật, mỗi mẫu một utm_content riêng.

Quảng cáo đợt Chân Thân - bản chốt (Tyler chạy từ 13/11, 300.000đ/7 ngày, muốn rẻ):
- 1 chiến dịch Lưu lượng truy cập, tối ưu lượt click liên kết (web chưa có Meta Pixel). Ngân sách TRỌN ĐỜI 300.000đ, 13/11 00:00 - 19/11 23:59, lịch chạy 17:00-23:59 mỗi ngày.
- 1 nhóm quảng cáo: Việt Nam, 18-40, Advantage+ đối tượng (gợi ý sở thích: tiểu thuyết tiên hiệp, truyện chữ, game nhập vai, game di động), vị trí Advantage+.
- 3 quảng cáo trong cùng nhóm, link vào thẳng /choi:
  - diaphu: video Địa Phủ (9:16 cho Reels/Stories, 4:5 cho bảng tin). Hook: "Kiếp 4 · Chết Dưới Răng Thỏ".
  - buivang: video Bụi Vàng. Hook: "Ngươi đã chết bao nhiêu lần?".
  - anh40: ảnh "Chết 40 kiếp rồi mới nhớ ra mặt mình."
  - Link: https://van-kiep-luan-hoi.vercel.app/choi?utm_source=fb&utm_medium=paid&utm_campaign=chanthan&utm_content=<mã>
- Không sửa gì 13-14/11 (Meta đang học). Sáng 15/11: tắt quảng cáo có giá mỗi người chơi xong kiếp 1 cao nhất (đo bằng vkl_events: open có data.q chứa utm_content, nối sid với life_end). Không đổi ngân sách giữa chừng.
- Dừng cả chiến dịch nếu dưới 60% người mới tạo chân thân hoặc dưới 25% còn chơi sau 1 ngày.
- Mốc tuần trước (300k): khoảng 1.000 lượt vào từ Facebook. Mục tiêu tuần này: bằng hoặc hơn số lượt vào, và nhiều người chơi xong kiếp 1 hơn nhờ link vào thẳng game.
- Song song, miễn phí: đăng hai video lên Reels Page, TikTok, Threads, nhóm Facebook (utm_source=page|tiktok|threads|nhom).
- Ý tưởng chờ Tyler: video người làm game tự kể (founder content, rẻ và hay chạy tốt nhất trên Meta). Chỉ làm khi Tyler đồng ý và tự kể câu chuyện thật.

Tiến độ việc nhiều đêm: không có.

## Đêm 13/11/2026 (lên bản 14/11)

Lưu ý: đêm nay có HAI phiên chạy cùng lúc (tác vụ bị gọi hai lần). Phiên kia làm 4.6.0 Ngày 1 (SQL Sơn Môn, thử trên Postgres cục bộ) và `lib/sonmon/data.ts`; phiên này làm phần Tăng trưởng dưới đây. Bản mô phỏng Sơn Môn phiên này viết trước khi thấy phiên kia được cất ở nhánh `sim-ban-song-song` (dùng `data.ts` khác, chưa gộp) để đêm 14/11 tham khảo khi làm Ngày 2, tránh làm hai lần.

Không kết nối được Supabase và Vercel (máy chủ công cụ báo lỗi 502), nên không chạy được các câu SQL ở trên (vkl_players, vkl_events, vkl_daily không đọc được bằng khóa công khai) và không xem được lỗi Vercel. Số dưới đây đọc từ bảng bia `vkl_lives` (đọc công khai) và danh sách góp ý công khai, nên "người mới" ở đây là người xong kiếp 1 trong ngày, KHÔNG so thẳng với số tài khoản mới của đêm 12/11.

Số chính (theo người xong kiếp 1, giờ VN, bỏ tài khoản test_/ui_):
- Người xong kiếp 1 mỗi ngày: 7/11 120, 8/11 115, 9/11 41, 10/11 46, 11/11 35, 12/11 32, 13/11 44 (tới 22:07; quảng cáo Chân Thân chạy từ 17:00).
- Còn chơi sau 1 ngày (có kiếp khác sau 24 giờ): nhóm 5/11 48,8%, 6/11 50,0%, 7/11 45,0%, 8/11 36,5%, 9/11 36,6%, 10/11 41,3%.
- Còn chơi sau 7 ngày: nhóm 1/11 14,6%, 2/11 19,2%, 3/11 14,9%, 4/11 9,6% (mốc 11-14%).
- Đủ 2 kiếp: nhóm 13/11 đã 29/44 (66%) ngay trong ngày; đủ 10 kiếp: nhóm 9-10/11 khoảng 45%.
- Người có ít nhất một kiếp mỗi ngày: 8/11 337, 9/11 233, 10/11 217, 11/11 194, 12/11 182, 13/11 173 (tới 22:07). Kiếp mỗi ngày: 2.276 -> 991 (12/11).
- Giờ đông nhất 24 giờ qua (số kiếp): 21h 84, 22h 68, 20h 63; vắng nhất 4-6h.
- Góp ý mới từ 11/11: #220-#238 (19 góp ý), chưa có góp ý nào báo lỗi chân thân sau khi 4.5.0 lên. Báo lỗi còn mở: #235 thu phục Cùng Kỳ mà sổ linh thú không ghi, #236 bị cướp rìu Bàn Cổ không tìm được người để trả thù, #222 chết khi máu 60%.

Nhận định:
- Người chơi mỗi ngày giảm đều từ khi tắt quảng cáo (337 -> 182 trong 4 ngày). Ngày đầu 4.5.0 và quảng cáo mới: người xong kiếp 1 tăng từ 32 lên 44, tỉ lệ đủ 2 kiếp trong ngày 66%. Cần số `ct_intro` -> `ct_create` (vkl_events) để biết màn tạo chân thân có làm rơi người không; đêm sau đọc khi Supabase kết nối lại.
- #224/#225 (hợp 9 món ra 3 món Cực phẩm rồi mất, "mất nhiều món đồ cực do lỗi bug game") đã tìm ra nguyên nhân: đồ Cực phẩm rơi và hợp ra đều có giá 0, nên khi đang mặc một món Cực phẩm cùng ô, món Cực phẩm mới hợp được bị tính là "thừa" (luật cũ: cùng phẩm và giá thấp hơn hoặc bằng món đang mặc). Nút "Bán N món thừa" / "Phân giải N món thừa" bán luôn các món đó. Thêm nữa: nút ở tab Áo vẫn bán cả vũ khí, phụ kiện thừa ở tab khác mà người chơi không thấy. Hàm hợp đồ (`mergeItems`) đúng: thử 3.600 lần hợp ở cảnh giới 2-7, món ra luôn nằm trong túi.
- #223 (La Hán kim lan cà sa đang mặc tự mất, đổi sang áo thường): cà sa là đồ tông môn Phổ Đà Sơn; khi bị trục xuất (lộ thân phận vì đạo tâm lệch, hoặc phản sư thất bại) tông thu lại áo bào và mặc áo vải. Đúng luật, nhưng nhật ký chỉ ghi "lột áo bào" mà không nêu tên món, và trong túi không có chỗ nào báo trước.

Việc đêm nay (Tyler dặn 12/11 ưu tiên #224 và #223):
1. Túi đồ (`components/BagDoll.tsx`): chiếc gốc của món Cực phẩm không bao giờ tính là thừa (bản trùng vẫn tính), nên nút bán/phân giải đồ thừa không còn bán món Cực phẩm; muốn bỏ thì bán từng món. Nút chỉ đụng đồ ở tab đang chọn. Bước "Chắc chưa?" ghi tên từng món sẽ bán. Không đổi giá bán, không đổi luật hợp đồ.
2. Đồ tông môn: túi đồ ghi "Đồ tông môn: bị trục xuất khỏi tông thì tông thu lại." ngay dưới mô tả; khi trục xuất, nhật ký thêm dòng "<tông> thu lại đồ tông môn: <tên các món>." Không đổi luật trục xuất.
3. Đo: sự kiện mới `do_thua` (act ban/phan, n, tab) khi bấm bán/phân giải đồ thừa; theo dõi góp ý báo mất đồ sau khi lên bản.
4. Cáo thị: thêm 2 dòng vào nhóm "Sửa lỗi" của 4.5.0 (không tạo số bản mới).
- Đối chiếu: không trùng plan-4.5.0 (Ngày 1-4 xong, không đụng túi đồ), plan-4.6.0 (Sơn Môn, không đụng túi đồ và tông môn trong kiếp); không có docs/yeu-cau-lam-tinh-nang.md.
- Thử: `node scripts/smoke-do-thua.cjs` (mới, 12 mục, 390x844), smoke, smoke-login (cả FAIL_ME), smoke-linhthu, smoke-tui (sửa lỗi sẵn có trong script: có hai nút `.inv-clean` nên phải bấm nút đầu), tsc, build sạch. Không đổi cân bằng nên không chạy mô phỏng kiếp.
- Góp ý cần trả lời sau khi lên trang (tác vụ 5:00 gửi, tặng 10 phúc mỗi góp ý, reply_ver 4.5.0):
  - #224: "Thiên Đạo đã tìm ra lỗi: món Cực phẩm vừa hợp bị nút Bán đồ thừa coi là đồ thừa nên bị bán mất. Bản sáng 14/11 đã sửa: nút bán và phân giải đồ thừa không còn đụng tới món Cực phẩm (chỉ bán bản trùng), chỉ bán đồ ở tab đang chọn và ghi tên từng món trước khi bán. Đồ đã bán thì không lấy lại được, Thiên Đạo tặng đạo hữu chút phúc duyên bù lại. Cảm ơn đạo hữu đã báo."
  - #225: "Cảm ơn đạo hữu đã chấm kiếp. Lỗi mất đồ Cực phẩm khi bấm Bán đồ thừa đã sửa trong bản sáng 14/11: nút này không còn bán món Cực phẩm, chỉ bán bản trùng."
  - #223: "Thiên Đạo đã xem: La Hán kim lan cà sa là đồ tông môn Phổ Đà Sơn, khi bị trục xuất (lộ thân phận vì đạo tâm lệch, hoặc phản sư) tông sẽ thu lại và đạo hữu mặc lại áo vải. Từ bản sáng 14/11, túi đồ ghi rõ điều này trên món đồ tông môn, và nhật ký nêu tên từng món bị thu lại."

Đề xuất chờ Tyler:
- Lỗi vặt trong smoke đêm 12/11 (thanh Thập Kiếp 1 ô sáng mà chữ ghi 2/10): chưa tái hiện được. Ô mới khai có hiệu ứng chớp 6 lần (`hb-flash`), ảnh chụp đúng lúc chớp có thể trông như chưa sáng. Tyler thấy trên máy thật thì báo lại.
- Quảng cáo: đang chạy đợt Chân Thân (300.000đ, 13-19/11). Giữ đúng kế hoạch, không sửa 13-14/11. Sáng 15/11 cần số vkl_events (open có utm_content, nối sid với life_end) để tắt mẫu đắt nhất; nếu Supabase vẫn không kết nối được thì xem số click trong Trình quản lý quảng cáo và tạm giữ cả 3 mẫu.

Phần của phiên làm kế hoạch (cùng đêm 13/11):
- Kế hoạch: 4.6.0 Ngày 1 (SQL Sơn Môn) và Ngày 2 (`lib/sonmon/data.ts`, `scripts/sim-son-mon.ts`) đã đẩy `next`; SQL CHƯA áp lên Supabase vì không kết nối được, đêm 14/11 áp trước khi làm Ngày 3. Số mô phỏng ở "Ghi chú:" Ngày 2 của plan-4.6.0. Nhánh `sim-ban-song-song` của phiên kia chỉ để tham khảo, KHÔNG gộp (bản trong `next` là bản chốt).
- Sửa thêm (commit "tăng trưởng: thần binh truyền kiếp..."):
  1. #236, #229: thần binh truyền kiếp (vũ khí mang qua nhiều kiếp, ví dụ rìu Bàn Cổ 10 kiếp) bị lột khi thua trận thì mất luôn chuỗi kiếp. Giờ `robGear` (lib/game/duel.ts) bỏ qua thần binh truyền kiếp, như nó vốn không vỡ khi rèn và không phân giải được. Các món khác vẫn bị lột như cũ. Thử: `npx tsx scripts/thu-lot-than-binh.ts` (2.000 lần, 0 lần mất thần binh).
  2. #235: sổ linh thú trong kiếp chỉ đọc sổ cũ (cập nhật lúc kiếp khép lại) cộng con đang nuôi, nên thu phục Cùng Kỳ rồi đổi con khác thì sổ không thấy. Giờ sổ gộp cả các loài đã nuôi trong kiếp này. Thử: `node scripts/smoke-so-thu.cjs` (390x844).
  - Đối chiếu: không trùng plan-4.5.0, plan-4.6.0 (không đụng giao đấu, linh thú); không trùng việc túi đồ của phiên kia.
  - Đo: số góp ý báo mất thần binh hoặc sổ linh thú thiếu loài sau khi lên bản (không thêm sự kiện đo riêng).
  - Cáo thị 4.5.0: thêm 1 dòng vào "Sửa lỗi".
- Thử chung trên bản gộp cả hai phiên: tsc, smoke, smoke-login (cả FAIL_ME), smoke-linhthu, smoke-tui, smoke-do-thua, smoke-so-thu, build đều sạch.
- Góp ý cần trả lời sau khi lên trang (tác vụ 5:00 gửi, tặng 10 phúc mỗi góp ý, reply_ver 4.5.0):
  - #236: "Thiên Đạo đã sửa trong bản sáng 14/11: thần binh truyền kiếp không còn bị lột khi thua trận nữa. Cây rìu đã mất thì không lấy lại được: kẻ cướp là người giang hồ không phải người chơi thật nên không có mối thù để báo. Thiên Đạo tặng đạo hữu chút phúc duyên bù lại."
  - #229: "Thiên Đạo nghe rồi. Từ bản sáng 14/11, thần binh truyền kiếp (như Bàn Cổ chân phủ mang qua nhiều kiếp) không còn bị lột khi thua trận. Đồ thường vẫn có thể bị cướp, gặp lại người chơi đã cướp thì báo thù để đòi lại."
  - #235: "Thiên Đạo đã sửa trong bản sáng 14/11: sổ linh thú ghi ngay loài vừa thu phục trong kiếp, không đợi tới khi kiếp khép lại. Cùng Kỳ đạo hữu đã thu phục được ghi vào sổ khi kiếp đó kết thúc, kiếp đang chơi thì giờ đã thấy ngay."

Đề xuất chờ Tyler (thêm):
- Đồ Cực phẩm vẫn bị lột khi thua giao đấu (đồng môn ma môn, đồng đạo giả nhân nghĩa, địch thủ). Chỉ khi kẻ cướp là người chơi thật mới có mối thù để đòi lại; kẻ cướp là người giang hồ thì mất hẳn (#236 không tìm được ai để trả thù). Tyler muốn: (a) giữ nguyên, (b) kẻ cướp chỉ lột món không phải Cực phẩm, hay (c) món bị người giang hồ cướp có thể chuộc lại ở Vạn Bảo Lâu?
- Sơn Môn: số chốt làm tài nguyên là thứ phải chờ, giờ xây ngắn (cấp 10 khoảng 5-10 phút, cấp 20 khoảng 2 giờ), để người 1 lần/ngày không thua xa. Đồng hồ đáng chờ là luyện quân và hành quân. Tyler muốn giờ xây dài hơn kiểu Travian (vài giờ mỗi cấp) thì người 1 lần/ngày sẽ chỉ tới Chính Điện 10 vào ngày 11 trở đi và người hăng hơn gấp 2,5-3 lần.

Tiến độ việc nhiều đêm: không có.

### Bảng xếp hạng chậm (Tyler bấm chạy tay 22:06 13/11, dặn ưu tiên)

Đêm nay vẫn không kết nối được Supabase (lỗi 502), nên CHƯA chạy được `explain (analyze, buffers)` trên máy thật, pg_stat_statements, kích thước bảng hay get_advisors. Đã đo thay trên Postgres 16 cục bộ với dữ liệu giả cùng cỡ: 30.000 kiếp (look ~1,7KB mỗi kiếp, đúng cỡ đo từ 300 kiếp mới nhất trên máy thật; máy thật có 26.949 kiếp lúc 22:30) và 3.000 bản lưu.

Vì sao `vkl_leaderboard2` chậm (đọc từ định nghĩa trong `supabase/chong_gian_lan_2026_11_05.sql`): mỗi lần gọi, hàm dựng lại jsonb cho TOÀN BỘ vkl_lives và mọi bản lưu đang sống, gộp `look` với 12 trường, chạy `sane_char` từng dòng, rồi sắp xếp theo biểu thức jsonb. Mọi cột lọc và sắp xếp đều nằm trong jsonb vừa dựng nên không chỉ mục nào dùng được. Chi phí tăng theo số kiếp (mỗi ngày thêm ~1.000-2.500), nên càng ngày càng chậm. Cục bộ: 1,0-1,6 giây mỗi lần (máy cục bộ nhanh; máy Supabase đo được ~4 giây). Với 3 bảng mỗi lần vào kiếp mới, giờ quảng cáo dễ làm nghẹt máy.

ĐÃ BẬT 13/11 khoảng 23:10 (Tyler duyệt trong phiên): `supabase/bang_xep_hang_2026_11_13.sql`.
- Bảng tính sẵn `vkl_priv.lb_row` (cột số có chỉ mục + đúng jsonb `c` như cũ, cột `gone` để ẩn thay vì xóa), làm mới TĂNG DẦN bằng `vkl_priv.lb_refresh()`, pg_cron job `vkl_lb_refresh` mỗi 2 phút: chỉ kiếp có id mới và bản lưu có updated_at mới. Không thêm trigger vào đường ghi kiếp hay lưu game.
- Hàm đọc MỚI `public.vkl_leaderboard3` cùng chữ ký, cùng thứ tự. Không sửa `vkl_leaderboard`/`vkl_leaderboard2`, không cấp lại quyền `vkl_leaderboard2`.
- Code: `app/api/pub/lb/route.ts` và `lib/storage.ts` gọi `vkl_leaderboard3` trước, lỗi thì lùi về `vkl_leaderboard2` rồi `vkl_leaderboard`.
- Số trên máy thật: pg_stat_statements (từ lần đặt lại thống kê) bảng xếp hạng cũ 66.010 lần gọi, trung bình 1.683 ms, tổng ~111.000 giây, đứng đầu. Nay: dựng lần đầu 14,1 giây (27.157 kiếp, 1.810 bản lưu); làm mới tăng dần 0,12 giây; đọc 0,2 giây (explain analyze). So với `vkl_leaderboard2`: bảng giàu trùng hoàn toàn; bảng sức mạnh chỉ khác 1 người ở hạng 60 do nhiều người bằng điểm (cả hai hàm không có tiêu chí phá hòa, trình duyệt tự xếp lại theo lúc đạt).
- Đứng thứ hai trong pg_stat_statements: `vkl_titles_char` (danh hiệu tuần), 44.767 lần gọi, trung bình 604 ms, tổng ~27.000 giây. Đề xuất làm tương tự (tính sẵn theo tuần) ở đêm sau.
- Supabase hỏi xác nhận cho apply_migration và cho lệnh có `delete`, hộp hỏi không hiện trong app nên hết giờ; đã chạy bằng execute_sql từng phần và bỏ `delete` (dùng cột `gone`).

Có nên nâng compute Supabase không: CHƯA nên. Chậm là do thuật toán quét toàn bảng mỗi lần gọi, nâng máy chỉ giảm thời gian theo tỉ lệ CPU, còn số kiếp tăng mỗi ngày thì lại chậm dần. Nay bảng xếp hạng đã qua bộ đệm Vercel và `vkl_leaderboard3`; nếu giờ cao điểm truy vấn đơn giản vẫn mất trên 300 ms thì mới xét nâng một bậc. Việc phải làm khi Supabase kết nối lại: `select query, calls, mean_exec_time, total_exec_time from extensions.pg_stat_statements order by total_exec_time desc limit 15;`, `select relname, pg_size_pretty(pg_total_relation_size(relid)) from pg_statio_user_tables order by pg_total_relation_size(relid) desc limit 10;`, get_advisors (performance), và explain trên máy thật; ghi số vào đây.

### Bổ sung 14/11 00:30 (Supabase kết nối lại, đọc vkl_events / vkl_players)

Số chính:
- Tài khoản mới: 12/11 39, 13/11 86 (quảng cáo Chân Thân chạy từ 17:00). D1 nhóm 9-11/11: 31,3% / 32,8% / 29,2% (đầu tháng 35-42%). D7 nhóm 1-5/11: 12,0% / 15,7% / 12,7% / 7,6% / 10,1%.
- Phiên mỗi ngày (vkl_daily.sid): 11/11 930, 12/11 814, 13/11 1.128. Màn rời nhiều nhất 13/11: đầu thai 515, đang chơi 352, sự kiện 255, chưa rõ 243.
- Phễu chân thân từ 5:00 13/11 (số phiên): xem Mộng Tỉnh 261 (191 xem hết) -> tạo chân thân 250 (96%). Màn tạo KHÔNG làm rơi người, không cần rút gọn (điều kiện dừng của plan là dưới 60%). Xem Tam Tài Đồ 258, xem huyệt 280, bấm "Vào kiếp mới" từ màn Chân thân 39, chia sẻ huyệt 7.
- Quảng cáo từ 17:00 13/11: 321 phiên từ Facebook -> 145 vào kiếp (45%) -> 82 xong kiếp 1 -> 67 tạo chân thân -> 50 đủ 2 kiếp (16%), 44 đăng ký. Phiên mới 7 ngày: quảng cáo 50,0% vào kiếp / 25,5% xong kiếp 1 / 16,8% đủ 2 kiếp; nguồn khác 43,9% / 26,5% / 17,3%. Người từ quảng cáo không tệ hơn người tự tới.
- 123/140 phiên quảng cáo không vào kiếp rời ở màn đầu thai (Lá số kiếp 1), trung vị ở lại 21 giây.

Nhận định:
1. Chỗ rơi lớn nhất là màn Lá số kiếp 1: một nửa người mới mở game không bao giờ bấm Đầu thai. Màn này có hướng dẫn 3 bước, lá số 6 dòng, 5 lá thiên phú, tốc độ thời gian, nhiệm vụ ngày - quá nhiều chữ cho người vừa bấm quảng cáo trên điện thoại. Quảng cáo kể chuyện "chết rồi tỉnh mộng", màn đầu lại là bảng chỉ số.
2. Chỗ rơi thứ hai: một nửa người đã vào kiếp 1 bỏ giữa chừng (rời ở màn đang chơi, sự kiện), trước khi tới màn chết và Mộng Tỉnh - tức trước khi thấy tính năng mới.
3. Lỗi đo: Tracker cắt `q` ở 60 ký tự nên mất `utm_content`, không biết mẫu quảng cáo nào tốt. Đã sửa nóng trên main 14/11 00:40 (6230991, 200 ký tự). Sáng 15/11 đã đủ số theo mẫu.
4. 4.5.0 không làm hại phễu: 96% người chết kiếp 1 đi hết màn tạo chân thân.

ĐÃ LÀM 14/11 ~01:00 theo yêu cầu Tyler (lên bản 5:00 14/11), cờ FIRST_SIMPLE_ON trong lib/flags.ts, sự kiện đo `first_simple`. Đêm 14/11 KHÔNG làm lại, chỉ đo (so % phiên mới có life_start trước/sau 14/11 5:00) rồi làm ưu tiên 2. Mô tả gốc:
- Kiếp đầu tiên của người mới (chưa có kiếp nào): màn Lá số rút còn một màn: một câu mở đầu khớp quảng cáo ("Ngươi sắp sống kiếp đầu tiên. Chết rồi sẽ tỉnh."), hình nhân vật, tên, một nút lớn "Bắt đầu kiếp đầu" ngay giữa màn. Ẩn thiên phú, tốc độ, nhiệm vụ ngày, Xem chỉ số ở kiếp 1 (tự chọn tốc độ Nhanh, không thiên phú). Từ kiếp 2 hiện đủ như cũ. Giấu sau cờ, bật khi thử sạch.
- Đo: % phiên mới có life_start (mốc 7 ngày: 44-50%, mục tiêu 65%+), % xong kiếp 1, thời gian từ open tới life_start.
- Đối chiếu: không trùng plan-4.5.0 (Mộng Tỉnh ở SAU kiếp 1), plan-4.6.0 (Sơn Môn, layout 4 tab không đụng màn đầu thai trong /choi).
- Ưu tiên 2 (nếu còn giờ, hoặc đêm 15/11): đo người bỏ giữa kiếp 1 rời ở tuổi nào, sự kiện nào (vkl_events có sc, thêm tuổi nếu chưa có), rồi rút ngắn hoặc làm kịch tính đoạn đó.

## Đêm 16/11/2026 (lên bản 17/11)

Kế hoạch: không có khối nào tới hạn (4.5.0 xong hết; 4.6.0 Ngày 7 lên bản 18/11). Đêm nay làm việc Tyler giao (lỗi chữ oan hồn) và góp ý.

Việc Tyler giao - lỗi chữ "oan hồn đỡ đòn vô cớ" (d706964):
- Mỗi chỗ có kết bình an: khi `fatal()` trả câu cứu mạng (oan hồn, sư phụ, thân tu đạo, trời thương, ngọc bội) thì in một câu kể nạn đã xảy ra rồi câu cứu, bỏ nhánh thưởng. 37 chỗ trong events.ts, 2 events2.ts, 1 hopHoan.ts; thêm 5 chỗ cùng lỗi nhưng viết khác (`${f ?? ''}` trong chuỗi): Tiên Ma đại chiến, Tranh ngai Ma giới (+2.000 linh thạch), Ma điện luyện ma công, rời tông bị ma môn truy sát, theo chính phái diệt ma. events3.ts: `gamble()` nhận `[lead, near]`, 17 lựa chọn (Tiệc Hồng Môn...) có câu kể nạn riêng.
- Giữ nguyên các kết vốn đã là thua hoặc trọng thương (Lôi đài thua, bị phát hiện, Hợp Hoan bị truy...): câu cứu nối vào vẫn khớp, không có thưởng. Danh sách trong `KE_NAN` của script thử.
- Thử: `npx tsx scripts/thu-thoat-chet.ts` (mới): chạy mọi lựa chọn của mọi sự kiện với oan hồn + xúc xắc ép ra chết, 59 lựa chọn có câu cứu, 0 lỗi (trước sửa: 8 sự kiện còn kết bình an hoặc cộng thưởng ngoài 65 chỗ đã biết). tsc, smoke, smoke-login (cả FAIL_ME), smoke-linhthu, build sạch.
- Mô phỏng `sim-do-kho.ts 6000` trước/sau: tới Trúc Cơ 80,1/79,9%, Kim Đan 64,1/64,2%, Nguyên Anh 42,2/41,8%, Hóa Thần 22,5/22,3%, Luyện Hư 9,5/9,6%, Độ Kiếp 2,9/2,5%; tuổi chết TB 111/113. Trong sai số.
- Cáo thị 4.5.0 thêm nhóm "Mới 17/11" (câu Tyler duyệt, nguyên văn).

Số chính (đọc khoảng 21:40):
- Tài khoản mới: 14/11 139, 15/11 165 (cả ngày), 16/11 56 tới 21:40 (15/11 cùng giờ khoảng 124). Phiên mở game cùng khung giờ: 1.169 -> 1.013; người mới thấy màn kiếp đầu gọn 391 -> 250. Quảng cáo Chân Thân vẫn chạy tới 19/11, lượt từ quảng cáo trong ngày 237 -> 70: Meta phát ít hẳn hôm nay (Tyler xem Trình quản lý quảng cáo).
- D1: nhóm 13/11 37,2%, nhóm 14/11 21,7% (thấp), 12/11 25,6%. D7: nhóm 7/11 8,2%, 8/11 7,7% (dưới mốc 11-14%).
- Phiên mỗi ngày (vkl_daily): 14/11 1.235 -> 15/11 1.639 (phiên mới 616, đăng ký 165, trung vị 3,1 phút). Màn rời nhiều nhất 15/11: đầu thai 718, đang chơi 528, chưa rõ 418, sự kiện 336.
- Kiếp đầu gọn (theo ngày thấy màn gọn): xong kiếp 1 / vào kiếp 1: 14/11 55,3%, 15/11 46,4%, 16/11 40,7% (ngày đầu bật `KIEP1_CN_GON`, còn nhiều phiên đang chơi dở nên chưa kết luận; đo đủ 3 ngày tới 19/11). Quảng cáo xong kiếp 1: 65/201 (32%) -> 50/237 (21%) -> 10/70.
- Tính năng 24 giờ (phiên): khai huyệt 296, xem huyệt 311, cẩm nang 215, Mộng Tỉnh 149 -> tạo chân thân 140 (94%). Sư Đồ ngày đầu: 38 phiên bấm Mời đệ tử, 8 phiên mở link mời, 1 bái sư.
- Lôi đài: ra đài và đánh khớp nhau mọi giờ. Lỗi Vercel 24 giờ: không có.

Góp ý (13 góp ý 'moi' từ 15/11 23:00):
- #265 "Lôi đài lỗi không đánh được" (14:03 16/11): dữ liệu của người báo cho thấy 13:49 và 13:59 bấm ra đài, rút đối thủ rồi dừng (nút Ra đài bị thanh tab che, đúng lỗi Tyler báo và sửa nóng trưa 16/11); 14:01 đã đánh lại được 2 trận. Không cần sửa thêm.
- #262 Thiên sinh kiếm cốt (Huyền, 11% số lần rút) chỉ cộng công x1,1 mà không ghi ra, yếu hơn Trời sinh thần lực (Linh, x1,25). Sửa (4e5e0cf): x1,3 và thẻ ghi "Công +30% trong mọi trận, sinh ra đã cầm Mộc kiếm, sức khỏe +8". Mô tả Trời sinh thần lực ghi đúng là "Công +25% trong mọi trận" (trước ghi "khi trừ yêu" nhưng code cộng mọi trận). Không chạy sim-do-kho vì mô phỏng không rút thiên phú; thay đổi chỉ chạm người rút trúng kiếm cốt.
- #263 Huyết Ma Đao chờ chủ ghi "đủ Trúc Cơ là cầm được" nhưng cầm được từ 0 tuổi: túi đồ không chặn cảnh giới với món nào. Tự chốt: sửa mô tả cho đúng ("cầm được ngay từ nhỏ"), không thêm chặn (thêm chặn sẽ đụng cả thần binh truyền kiếp và đồ đang mặc của mọi người).
- Quang hỏi 16/11: trục "Tài" của biểu đồ đổi tên thành "Giàu"; thiên phú cộng sức khỏe ghi "(tối đa 100)". Không đổi luật.
- Ghi lại, chưa làm: #261 muốn cách tự hạ chỉ số để làm thành tựu; #264 tâm pháp lên cấp 8-9 không thêm gì (cần xem lại cân bằng tâm pháp, việc nhiều đêm); #269 thưởng khi mở nhiều kết cục chết (Lực chiến Sơn Môn đã tính số kết cục từ 18/11); #270 game hơi dễ, muốn chọn độ khó; #268 không biết cách truyền thần binh.
- Câu trả lời đã soạn: ở "Ghi chú:" Ngày 7 trong plan-4.6.0 (tác vụ 5:00 gửi sau khi bản 17/11 lên trang).
- Bù: không ai mất đồ hay kiếp vì lỗi đêm nay; #265 có 2 lượt ra đài bị kẹt, tặng 10 phúc như mọi góp ý báo lỗi.

Nhận định:
1. Người mới hôm nay ít hẳn (lượt quảng cáo 237 -> 70) dù không có lỗi: nhiều khả năng Meta phát ít ngày thứ Hai hoặc ngân sách trọn đời đã tiêu nhanh 3 ngày đầu. Không phải do bản 16/11 (tỉ lệ open -> vào kiếp giữ nguyên).
2. Xong kiếp 1 trên vào kiếp 1 đang đi xuống ba ngày liền (55 -> 46 -> 41%), phần cuối có thể do phiên chưa xong. Đây vẫn là chỗ thủng lớn nhất; đo tiếp `KIEP1_CN_GON` tới 19/11 trước khi làm lần 3 (dòng gợi ý thay cẩm nang).
3. D1 nhóm 14/11 chỉ 21,7% so với 37,2% nhóm 13/11; nhóm 14/11 là ngày nhiều quảng cáo nhất. Theo dõi D1 nhóm 15-16/11.

Đối chiếu: không trùng plan-4.5.0 (xong), plan-4.6.0 (Ngày 7 chỉ Sơn Môn, cáo thị 4.6.0 riêng; đêm nay không đụng Sơn Môn), không có docs/yeu-cau-lam-tinh-nang.md. Việc đêm nay nằm trong "Việc Tyler giao cho đêm 16/11".

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn lần 2: đo tới 19/11 (mục tiêu 55% xong kiếp 1 / vào kiếp 1).
- Sơn Môn: Ngày 7 đêm 17/11.
- Mới ghi: xem lại tâm pháp cấp cao (#264), cần đọc `lib/game/congPhap.ts` và mô phỏng trước khi đổi.

Quảng cáo Facebook: CHƯA chạy đợt Sơn Môn. Điều kiện đặt đêm 15/11 (quảng cáo xong kiếp 1 về lại 28%+) chưa đạt (21% ngày 15/11, hôm nay chưa đủ số). Đợt Chân Thân còn tới 19/11; nếu sáng 17/11 Trình quản lý báo đã tiêu gần hết 300.000đ thì để nó tự hết, không nạp thêm. Đề xuất đợt Sơn Môn giữ nguyên như đêm 15/11, quyết lại đêm 18/11 khi có số ngày đầu Sơn Môn.

Nội dung soạn sẵn: không có thứ mới đáng khoe đêm nay (sửa chữ và cân bằng nhỏ). Bài Sơn Môn để đêm 17/11.

Bổ sung 22:10 (Tyler gửi ảnh Trình quản lý quảng cáo lúc 21:59):
- Sửa số: so cùng khung giờ (trước 22h), phiên từ quảng cáo 13/11 210, 14/11 236, 15/11 224, 16/11 134 (giảm khoảng 40%, không phải 237 -> 70 như tin trước, tin trước so cả ngày với nửa ngày).
- Meta: đã tiêu 152.967đ / 300.000đ, 698 click, 219đ mỗi click, CTR 12,4%, tần suất 1,3. anh40 591 click (126.190đ), diaphu 67, manhua1 32, buivang 8. Ngân sách chưa hết: còn khoảng 147.000đ cho 17-19/11, Meta sẽ tiêu khoảng 49.000đ mỗi tối.
- Phễu quảng cáo 13-16/11 (vkl_events): 980 phiên -> 474 vào kiếp -> 251 xong kiếp 1 -> 194 tạo chân thân -> 157 đăng ký. Giá: khoảng 156đ mỗi phiên, 610đ mỗi người xong kiếp 1, 975đ mỗi tài khoản. Rẻ hơn rất xa mốc dừng 6.000đ mỗi người xong kiếp 1.
- Đề xuất (đổi so với tin trước): giữ đợt này tới 19/11, không sửa. Đợt Sơn Môn chạy 20-26/11, 50.000đ/ngày (350.000đ), 17h-24h, VN 18-40 Advantage+, Lưu lượng truy cập; 2 mẫu: anh40 (giữ nguyên ảnh, chỉ đổi utm_campaign) và ảnh bản đồ Sơn Môn lục giác ("Lập môn cùng đạo hữu, giữ đất trên bản đồ. Kỷ 1 tới 1/12."), bỏ hai video. Dừng mẫu nào trên 2.000đ mỗi người xong kiếp 1 sau 2 tối, hoặc D1 nhóm quảng cáo dưới 20%.

## Đêm 15/11/2026 (lên bản 16/11)

Kế hoạch đêm nay: 4.6.0 Ngày 3, 3b, 4, 5, 6 xong và đẩy `next`. Người chơi thấy từ 16/11: Sư Đồ (nút Mời đệ tử ở trang Chân thân) và thanh 4 tab + Menu. Sơn Môn vẫn sau cờ, tab Sơn Môn chỉ có màn chờ "Mở cửa 5:00 sáng 18/11". Máy chủ đã áp 2 migration mới (`su_do_2026_11_16`, `son_mon_ket_ky_2026_11_16`), không sửa hàm cũ.

Số chính (đêm 14/11 -> đêm 15/11, đọc lúc khoảng 22:00):
- Tài khoản mới: 14/11 107 (tới 22h) -> 139 cả ngày; 15/11 124 tới 22h (79 có kiếp).
- D1: nhóm 11/11 29,2 -> 37,5%; 12/11 22,6 -> 23,1%; 13/11 37,3% (mới có). D7: nhóm 5/11 12,5%, 6/11 8,3%, 7/11 9,4% (mốc 11-14%).
- Phiên mỗi ngày (vkl_daily): 13/11 1.128 -> 14/11 1.235 (phiên mới 435, đăng ký 139, trung vị 5,5 phút).
- Kiếp đầu gọn, 24 giờ: thấy màn gọn 513 -> vào kiếp 1 290 (56,5%, trước 62%) -> xong kiếp 1 129 (25,1%, trước 32%) -> chân thân 122. Xong kiếp 1 trên số vào kiếp 1: 52% -> 42-44%. Quảng cáo: 201 -> 103 (51%) -> 44 (22%, trước 30%).
- Bỏ giữa kiếp 1 (146 phiên): 64 (44%) có việc cuối là cẩm nang tự mở (Hồi 1 "Một kiếp người"), 81 (55%) bỏ trong 2 phút đầu. Cờ `KIEP1_CN_GON` vẫn tắt trên bản đang chạy.
- Màn rời nhiều nhất 24 giờ: đầu thai 511 (286 phiên chưa vào kiếp nào), đang chơi 328, sự kiện 178.
- Giờ đông: 21h 247 phiên, 20h 209, 19h 199; vắng nhất 4-6h.
- Tính năng (phiên, 24 giờ): khai huyệt 375, xem huyệt 324, điểm danh 329, đồ thừa 368, Lôi đài 112/123, Mộng Tỉnh 206 -> chân thân 194 (94%).
- Sơn Môn: đủ 50 kiếp + 5 ngày 93 tài khoản (85 có chơi 7 ngày); đủ 30 kiếp + 4 ngày 190; có chân thân + tài khoản + kiếp trong 7 ngày 457.
- Lỗi Vercel 24 giờ: không có.

Góp ý đã xử lý: 139 góp ý status 'moi'. Sửa trong đêm #211 (nhiệm vụ ngày đòi đồ ẩn mới / kết cục mới khi người đó đã mở gần hết). Soạn câu trả lời cho #208, #211, #222, #226, #233, #237-#257, nhóm Sư Đồ (6 góp ý, gửi sau khi Sư Đồ lên), và 15 góp ý đã trả lời nhưng còn 'moi': danh sách ở Ghi chú Ngày 6 trong plan-4.6.0 cho tác vụ 5:00. Nhóm lập tông môn để 18/11. Không có ai bị thiệt vì lỗi cần bù đêm nay (#211 chỉ mất cơ hội làm một nhiệm vụ ngày, không mất đồ).

Nhận định:
1. Kiếp 1 rơi người nhiều hơn hôm qua (xong kiếp 1 trên vào kiếp 1 52% -> 43%), nhất là người từ quảng cáo (30% -> 22%). Hơn một nửa người bỏ rời trong 2 phút đầu, ngay sau cẩm nang tự mở. Đây là chỗ thủng lớn nhất của phễu.
2. Sau kiếp 1 vẫn tốt: chân thân 94%, D1 nhóm 13/11 37,3%.
3. Sư Đồ là đường mời bạn đầu tiên của game; cần đo `su_link_open`, `su_bind`, `su_done` từ 16/11.

Việc đêm nay (tăng trưởng):
1. Bật `KIEP1_CN_GON` mặc định (cải thiện "Kiếp đầu gọn" lần 2): kiếp 1 không tự mở cẩm nang, các hồi dời sang kiếp 2-4. Code đã thử đêm 14/11; đêm nay chạy lại `smoke-kiep1-cn.cjs` OK.
   - Giả thuyết: 44% người bỏ kiếp 1 dừng ở cẩm nang tự mở; bỏ màn chặn đó thì họ chơi tới sự kiện thứ 3-5 trước khi quyết định.
   - Đo (trong phiên `first_simple`): xong kiếp 1 / vào kiếp 1 (mốc 43%, mục tiêu 55%+); % bỏ trong 2 phút đầu (mốc 55% số người bỏ, mục tiêu dưới 35%); quảng cáo xong kiếp 1 (mốc 22%, mục tiêu 30%); kiếp 2: `camnang_open from=auto` rồi rời ngay hay không.
   - Cải thiện tiếp (lần 3 nếu chưa đạt): thay cẩm nang bằng một dòng gợi ý không chặn màn ở 3 sự kiện đầu.
2. Sửa #211: `lib/game/hook.ts` `questSkip` - còn dưới 3 đồ ẩn chưa có thì bỏ "Có được một món đồ ẩn chưa từng thấy", còn dưới 3 kết cục chưa mở thì bỏ "Mở một kết cục mới"; danh sách hôm nay đã có nhiệm vụ đó (chưa xong) thì thay đúng nhiệm vụ ấy. Đo: góp ý về nhiệm vụ ngày không làm được.
- Đối chiếu: không trùng plan-4.5.0 (xong hết), plan-4.6.0 (Ngày 3-6 không đụng cẩm nang kiếp 1 hay nhiệm vụ ngày; nhiệm vụ Sơn Môn là bảng riêng `vkl_sm_nv`), không có docs/yeu-cau-lam-tinh-nang.md.
- Cáo thị: thêm một dòng về nhiệm vụ ngày vào nhóm "Mới 16/11" của bản 4.5.0.

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn: lần 1 lên 14/11, lần 2 bật từ bản 16/11, lần 3 (dòng gợi ý thay cẩm nang) nếu sau 3 ngày chưa đạt 55%.
- Sơn Môn: còn Ngày 7 (17/11 đêm): tạo Kỷ 1, cáo thị 4.6.0, soát toàn bộ màn, nút "Vào môn của sư phụ", video 9:16.

Quyết định lớn đã tự chốt: thưởng Sư Đồ đi qua "chờ nhận" ở máy chủ rồi máy khách nhận (máy chủ không ghi thẳng phúc duyên vì máy khách ghi đè meta); thanh tab bỏ 3 nút Góp ý, Cập nhật, Facebook khỏi trang đầu (vào Menu), giữ Mời tác giả chén trà ở cả thanh trên, Menu và trang đầu.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng):
- Bài Page (16/11): "Tu tiên một mình mãi cũng buồn. Từ hôm nay Vạn Kiếp Luân Hồi có Sư Đồ: vào trang Chân thân, bấm Mời đệ tử, gửi link cho bạn. Bạn mới chơi xong 10 kiếp trong 7 ngày thì hai thầy trò mỗi người được 20 phúc duyên. Ai thu được 20 đệ tử thành tài sẽ ngộ đạo Truyền Đạo. Sơn Môn mở cửa 5:00 sáng 18/11: lập môn cùng đạo hữu, giữ đất trên bản đồ. Chơi ngay trên trình duyệt: van-kiep-luan-hoi.vercel.app"
- Caption ngắn: "Thu đồ đệ đi đạo hữu. Mời một người, cả hai cùng mạnh lên. Sơn Môn mở 18/11."
- Kịch bản video 9:16 (15 giây): 0-2s cận chân thân pixel, chữ "Ngươi có đệ tử chưa?"; 2-6s bấm Mời đệ tử, thẻ "<pháp danh> mời ngươi bái sư" bật lên; 6-10s người mới chơi kiếp, thanh "4/10 kiếp, còn 4 ngày"; 10-13s "+20 phúc duyên" cho cả hai; 13-15s màn chờ Sơn Môn "Mở cửa 5:00 sáng 18/11" + link.

Quảng cáo Facebook: D1 nhóm 13/11 đạt 37,3% (trên mốc 30% đặt đêm 14/11), nên giữ đề xuất đợt Sơn Môn nhưng CHỜ 2 ngày số kiếp 1 sau khi bật `KIEP1_CN_GON`: nếu quảng cáo xong kiếp 1 về lại từ 28% trở lên vào đêm 17/11 thì chạy. Mục tiêu Lưu lượng truy cập, 18-25/11, 50.000đ/ngày (350.000đ), Việt Nam 18-40 thích game nhập vai, truyện tiên hiệp; mẫu: ảnh `anh40` (giữ), ảnh bản đồ Sơn Môn lục giác có huy hiệu ("Lập môn cùng đạo hữu, giữ đất trên bản đồ. Kỷ 1 tới 1/12."), ảnh thẻ mời bái sư ("Thu đồ đệ, cả hai cùng mạnh lên"); link /choi có utm_content; dừng mẫu nào dưới 20% phiên xong kiếp 1 sau 2 ngày hoặc giá mỗi người xong kiếp 1 trên 6.000đ.

## Đêm 14/11/2026 (lên bản 15/11)

Kế hoạch đêm nay: 4.6.0 Ngày 1 (máy chủ Sơn Môn) và Ngày 2 (số liệu, mô phỏng), xong và đã đẩy `next` (7aa34ac, 9ecc331). Supabase mới áp được phần 1 (bảng + hàm nội bộ); phần 2 bị chặn vì máy chủ Supabase hỏi xác nhận mà không ai trả lời (xem Ghi chú Ngày 1 trong plan-4.6.0). Người chơi không thấy gì khác từ kế hoạch.

Số chính (so với đêm 13/11):
- Tài khoản mới: 12/11 39, 13/11 86, 14/11 107 (tới 22:00; quảng cáo Chân Thân chạy 17:00-24:00). Người có ít nhất một kiếp: 13/11 201, 14/11 205 (12/11 182); kiếp mỗi ngày 919 -> 1.111.
- D1: nhóm 10/11 34,5%, 11/11 29,2%, 12/11 22,6% (đầu tháng 35-42%). D7: nhóm 5/11 11,3%, 6/11 4,4% (mốc 11-14%).
- Kiếp đầu gọn (FIRST_SIMPLE_ON, lên 14/11 5:00): 306 phiên mới thấy màn gọn -> 190 vào kiếp 1 (62%, trước 44-50%, mục tiêu 65%) -> 99 xong kiếp 1 (32%, trước 25-27%) -> 78 tạo chân thân. Riêng quảng cáo: 164 phiên -> 99 vào kiếp (60%, trước 50%) -> 49 xong kiếp 1 (30%, trước 25,5%).
- Quảng cáo theo mẫu (utm_content, từ 14/11 00:40): Meta dồn gần hết vào ảnh `anh40`: 207 phiên -> 114 vào kiếp -> 62 xong kiếp 1 -> 47 chân thân, 42 đăng ký, 35 đủ 2 kiếp. Hai video `diaphu`, `buivang` gần như không được phát (1 phiên). Không có mẫu nào để tắt.
- Phiên mỗi ngày (vkl_daily.sid) 13/11 1.128. Giờ đông nhất 24 giờ qua (phiên mở game): 20h 131, 17h 108, 21h và 23h 102.
- Dùng tính năng 24 giờ qua (số phiên): khai huyệt 355, xem huyệt 314, điểm danh 298, bán/phân giải đồ thừa (đo mới) 212, Mộng Tỉnh 198 -> tạo chân thân 186 (94%), Lôi đài ra đài 94 / đánh 101 (khớp, không còn kẹt), bấm thẻ chân thân 59, chia sẻ huyệt 7.
- Góp ý mới từ 13/11 tối: #237-#254 (18), không có góp ý báo mất đồ hay kẹt Lôi đài sau bản 14/11. Đáng xem: #250 (sau phi thăng, đánh tới Yêu Thánh quái ngừng cho tu vi dù không chênh 3 cấp), #243 (bị mất một kiếp), #251 (kiếm tiền quá chậm so với giá đồ), #242 (đồ truyền đời không ghi rõ cộng gì).
- Lỗi Vercel 24 giờ qua: không có.

Nhận định:
1. Màn kiếp đầu gọn có tác dụng: vào kiếp 1 từ 44-50% lên 62%, xong kiếp 1 từ 26% lên 32%.
2. Chỗ rơi kế tiếp nằm NGAY SAU đó: 91/190 người vào kiếp 1 bỏ giữa chừng, đa số ở tuổi 0-9 (24 người ở màn sự kiện sau 2,7 phút, 18 người ở màn chơi chỉ sau 0,9 phút). Việc cuối cùng của 42/91 người (46%) là đọc cẩm nang TỰ MỞ: Hồi 1 "Một kiếp người" (4 trang, mở ngay sau sự kiện đầu đời) 29 người, Hồi 2 "Thang cảnh giới" 10, Hồi 3 3. Kiếp 1 hiện tự mở tới 5 hồi (khoảng 20 trang) - trái với nguyên tắc "không cần nghĩ, chỉ đọc và bấm" mà màn kiếp đầu gọn vừa làm.
3. D1 nhóm 12/11 thấp (22,6%) trước khi có màn gọn; nhóm 13-14/11 có số D1 từ đêm 15-16/11.

Việc đêm nay (tăng trưởng): cải thiện "Kiếp đầu gọn" lần 2 - kiếp 1 không tự mở cẩm nang (cờ `KIEP1_CN_GON`, TẮT mặc định đêm nay).
- Giả thuyết: người vừa bấm "Vào kiếp đầu" gặp ngay 4 trang hướng dẫn rồi 4 trang nữa; nhiều người rời ở đó. Bỏ tự mở trong kiếp 1 (vẫn mở tay được từ nút Cẩm nang), dời các hồi sang kiếp 2-4 (khi người chơi đã chết một lần và hiểu vòng chơi).
- Đổi gì: `app/choi/page.tsx` điều kiện tự mở cẩm nang: khi cờ bật, chỉ tự mở từ kiếp 2 tới kiếp 4 (`meta.lives` 1-3, trước là 0-2); Hồi 1 hiện ở đầu kiếp 2 thay vì kiếp 1. Không đổi chữ, không đổi luật.
- Đối chiếu: không trùng plan-4.5.0 (Ngày 1-4 xong, Mộng Tỉnh ở SAU kiếp 1, không đụng cẩm nang), plan-4.6.0 (Sơn Môn; thanh 4 tab Ngày 5 không đụng màn chơi `/choi` trong kiếp); không có docs/yeu-cau-lam-tinh-nang.md. Nối tiếp việc "Kiếp đầu gọn" (FIRST_SIMPLE_ON) của 14/11.
- Đo: trong các phiên thấy màn kiếp đầu gọn, % xong kiếp 1 trên số vào kiếp 1 (mốc 14/11: 99/190 = 52%, mục tiêu 60%+); % bỏ ở tuổi 0-9; số lần `camnang_open` từ `auto` ở kiếp 2 (xem có rơi người ở kiếp 2 không).
- Thử: `node scripts/smoke-kiep1-cn.cjs <thư mục ảnh>` (mới, 390x844): cờ bật thì kiếp 1 trả lời sự kiện 25 giây không có cẩm nang tự mở, kiếp 2 thì Hồi 1 tự mở; `CN_TAT=1` với cờ tắt thì kiếp 1 vẫn tự mở như cũ. smoke, smoke-login (cả FAIL_ME), smoke-linhthu, tsc, build sạch.
- Bật: đêm 15/11 đổi mặc định cờ thành bật (sau khi đã thử ở đêm nay), trừ khi Tyler muốn bật ngay sáng 15/11.
- Cáo thị: không thêm (cờ tắt, người chơi chưa thấy gì khác).

Tiến độ việc nhiều đêm:
- Kiếp đầu gọn: lần 1 (màn lá số gọn) đã lên 14/11; lần 2 (bỏ cẩm nang tự mở ở kiếp 1) code xong sau cờ, bật đêm 15/11; lần 3 (nếu cần): xem các sự kiện tuổi 0-9 có quá nhiều chữ không.

Đề xuất chờ Tyler:
- Supabase hỏi xác nhận khi áp phần 2 máy chủ Sơn Môn (có câu `drop trigger if exists`) mà phiên đêm không trả lời được. Tyler có thể bấm duyệt khi được hỏi trong phiên đêm 15/11, hoặc mở Supabase SQL Editor dán cả file `supabase/son_mon_gon_2026_11_15.sql` và chạy (file áp lại nhiều lần không hỏng). Ngày 3 (16/11) cần các hàm này.
- Mốc Khí vận thứ hai đổi 60 -> 50 sau mô phỏng (môn trung vị chỉ 7-8 người, mốc 60 chỉ đạt 5% số ngày). Tyler đồng ý không?
- Quảng cáo: giữ nguyên tới 19/11 (Meta đã tự dồn vào `anh40`, mẫu này đang tốt: 30% phiên xong kiếp 1, 17% đủ 2 kiếp). Không nên chạy thêm đợt mới trước khi có D1 của nhóm 13-14/11 (đêm 15-16/11). Nếu D1 nhóm 13-14/11 từ 30% trở lên thì đề xuất đợt Sơn Môn: Lưu lượng truy cập, 18-25/11, 50.000đ/ngày (350.000đ), Việt Nam 18-40, 2 mẫu: ảnh `anh40` (giữ) và ảnh bản đồ Sơn Môn lục giác có huy hiệu ("Lập môn cùng đạo hữu, giữ đất trên bản đồ. Kỷ 1 tới 1/12."), link thẳng /choi có utm_content; dừng mẫu nào có dưới 20% phiên xong kiếp 1 sau 2 ngày.

Nội dung soạn sẵn (Tyler tự đăng, Claude không đăng): chưa có thứ mới người chơi thấy được đêm nay. Bài báo trước cho Sơn Môn để dành tới 17/11 khi có màn chờ.

## Sổ cải thiện tính năng

- Bán / phân giải đồ thừa (túi đồ), lần 1 (13/11, góp ý #224 #225): chiếc gốc Cực phẩm không còn tính là thừa, chỉ đụng đồ ở tab đang chọn, bước xác nhận ghi tên món. Số dùng trước: chưa đo (không có sự kiện riêng; đêm nay không đọc được vkl_events). Sau: đo bằng `do_thua` từ 14/11, và số góp ý báo mất đồ.
- Kiếp đầu gọn, lần 1 (14/11, FIRST_SIMPLE_ON, màn lá số kiếp 1 chỉ còn câu mở đầu và một nút): trước 44-50% phiên mới vào kiếp 1, 25-27% xong kiếp 1. Sau (14/11, 306 phiên): 62% vào kiếp 1, 32% xong kiếp 1.
- Kiếp đầu gọn, lần 2 (14/11 đêm, KIEP1_CN_GON, tắt mặc định, bật đêm 15/11): kiếp 1 không tự mở cẩm nang, các hồi dời sang kiếp 2-4. Trước: 52% người vào kiếp 1 xong kiếp 1; 46% người bỏ giữa kiếp 1 có việc cuối là đọc cẩm nang tự mở. Sau: đo từ khi bật.
- Kiếp đầu gọn, lần 2 (bật từ bản 16/11): trước (15/11, cờ tắt) 43% người vào kiếp 1 xong kiếp 1, 44% người bỏ có việc cuối là cẩm nang tự mở, 55% bỏ trong 2 phút đầu. Sau: đo từ 16/11 (ít nhất 3 ngày).
- Nhiệm vụ ngày, lần 1 (15/11, góp ý #211): người đã mở gần hết đồ ẩn hay kết cục không còn nhận nhiệm vụ không làm được. Trước: 1 góp ý. Sau: đếm góp ý về nhiệm vụ ngày.
- Thiên sinh kiếm cốt (thiên phú), lần 1 (16/11, góp ý #262): công x1,1 không ghi -> x1,3 có ghi trên thẻ. Đo: góp ý về thiên phú yếu.
- Tàng Kinh Các - nút nâng chiêu khi chạm trần tâm pháp, lần 1 (17/11, Truong Pham hỏi): "Luyện tâm pháp" -> "Cần tâm pháp T{n}" + lý do + gợi ý chép 3 thành 1. Số trước: 1 tin hỏi qua Messenger; `cp_tang` 450 phiên/24 giờ. Sau: đếm góp ý hỏi về nút này, `cp_tang` -> nâng tầng.
- Tuyệt kỹ sau dung hợp, lần 1 (17/11, Phan Anh Tuấn báo): có tàn quyển rơi và bán tới tầng 9. Số trước: `cp_dung_hop` 101 phiên/24 giờ, tuyệt kỹ kẹt ở tầng 5. Sau: đếm `mua_tq` cho tuyệt kỹ và tầng tuyệt kỹ trong bia.
- Lột đồ khi thua trận (`robGear`), lần 1 (13/11, góp ý #236 #229): không lột thần binh truyền kiếp. Số trước: 2 góp ý báo mất thần binh trong 2 ngày. Sau: đếm góp ý báo mất thần binh từ 14/11.

- Khe nứt không gian (sự kiện `xuyen_khong`), lần 1 (18/11): ghi rõ "bước qua là kiếp này khép lại" trên nút. Số trước: 2 góp ý than mất kiếp (#135, #283). Đo sau 3 ngày: tỉ lệ chọn Bước vào.

## Tính năng đã ẩn

(chưa có)

## 14/11 22:xx - Xử lý góp ý #243, #250, #251 (ngoài lịch đêm)

- #250 (sau phi thăng trảm Yêu Thánh không ra tu vi): không phải lỗi, tu vi mỗi năm bị chặn sau phi thăng. Đã sửa: khi tu vi năm đó đầy, mỗi con trảm cho x3 linh thạch, báo một lần mỗi năm, danh sách săn ghi "tu vi năm nay đã đầy, linh thạch x3".
- #251 (kiếm tiền chậm so với giá đồ): linh thạch trảm yêu nhân thêm 1 + 0,3 x (cảnh giới - 1), tối đa x4. sim-farm số năm cày cho một món: R2 2,4 → ~2; R5 5,7 → 3,9; R7 7,0 → 4,1. sim-do-kho gần như không đổi (r5 thua 14,5% → 13,5%, r7 0,9%).
- #243 (mất một kiếp): bia của dkunn kiếp 3 không lên máy chủ (tắt app/rớt mạng lúc lập bia). Toàn hệ thống 142 người thiếu 1.063 bia. Đã sửa: bia lưu vào máy trước khi gửi, mở game lại tự khắc bù (kiểm tra trùng player_name + life_no). Bù dkunn +200 phúc duyên (880 → 1.080).
- Đã trả lời 3 góp ý trong vkl_feedback, status da_xong. Lên bản 5:00 15/11 (commit 432c343).
- Lịch đêm đã đổi: tự quyết rồi báo sau, mỗi đêm đọc góp ý và bình luận FB, dùng game-design để đưa vào game.

## 18/11 16:40 - Sơn Môn ngày đầu: Khai hoang (Tyler giao)

- Số: 11 môn, 69 người, 18/127 ô có chủ, 8 xuất chinh đều tới ô trống, 0 trận giữa môn. Môn 15 người mà chỉ 1 ô.
- Làm: Khai hoang (cắm cờ ngay ô trống kề, ai cũng làm được), thẻ Lãnh thổ X/Y, dấu + trên bản đồ, luật 3 câu viết lại. Commit 3b0351e.
- Đo từ 19/11: số khai hoang/ngày (track sm_khai_hoang), tỉ lệ môn dùng hết ô, % thành viên có hành động trên bản đồ.
- Việc nhiều đêm: xem docs/brainstorm-son-mon-ky1.md. Đợt 1 (mục 1-5) làm từ đêm 19/11 sau khối kế hoạch; Đợt 2 để sau cờ, mô phỏng trước.
