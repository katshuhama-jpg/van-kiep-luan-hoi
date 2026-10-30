# Kế hoạch 4.1.0 - mỗi ngày một phần

Nguồn: docs/research/lam-sau-he-thong.md (báo cáo "Làm sâu hệ thống Vạn Kiếp", mục 4.1.0, bảng Q1-Q8). Tyler chốt 29/10/2026: mỗi ngày đẩy 1-2 việc, không hiện bảng cập nhật; ngày cuối gom thành bản 4.1.0 có thông báo.

Mỗi lần chạy: làm khối **đầu tiên còn ô trống**, đánh dấu [x], ghi ngày và commit vào dòng "Xong:". Nếu khối nào làm dở thì ghi rõ còn thiếu gì ở dòng "Ghi chú:" để lần sau làm tiếp.

## Ngày 1 - Kết cục đúng cách chết, đo đạc, dòng tin ngày
- [x] Q1: gắn `endTag` cho chết vì quái chặn đường (`khinh_dich` khi quái yếu hơn hoặc ngang, `tu_dia` khi quái mạnh hơn; ambush.ts:92), thua giao đấu (`dao_giang_ho`; duel.ts:530, fightLines.ts:86-93), oan gia thắng (events.ts:1467), sát thủ "cây cao đón gió" (fate.ts:187). `hurtCause` lấy vết thương nặng nhất trong 4 năm gần nhất (engine.ts:496) và gắn tag theo nguồn. Câu nguyên nhân nêu đích danh kẻ giết và tuổi.
- [x] Đo đạc: track `ambush` và `duel` (kết quả, cảnh giới, tuổi), `forced_gap` (năm game kể từ trận bắt buộc trước); lưu `endTag` và `realm` vào `look` của mộ (đã có endTag, kiểm lại).
- [x] Dòng "Hôm nay Thiên Đạo đã sửa: ..." ở trang đầu: file `lib/dailyNotes.ts` (mảng `{day, vi, en}`), component nhỏ hiện ghi chú của hôm nay hoặc hôm qua (tối đa 2 ngày), không bật bảng cập nhật. Mỗi lần chạy sau thêm 1 dòng.
- Xong: 30/10/2026 3361e0c
- Ghi chú: Mô phỏng 1.000 kiếp (`npx tsx scripts/sim-ket-cuc.ts 1000`): `bat_dac` 23,1% xuống khoảng 10%, có tên kẻ giết 37%. Chưa tới mốc dưới 8%: phần còn lại là chết vì sự kiện (bia đỡ đạn, sét, phản môn, nghẹn bánh...), để Q2 xử lý. `dao_giang_ho` thành kết cục đầu bảng (khoảng 22%) vì quái chặn đường dạng người và thua địch thủ đều gắn vào đây, cần xem số thật sau vài ngày. Chết vì thương thế giờ lấy vết thương nặng nhất, nên một phần cái chết trước kia rơi vào Chết Đói (22% trong mô phỏng) chuyển sang kết cục theo kẻ gây thương. Sự kiện đo mới: `ambush`, `duel`, `forced_gap`; `death` có thêm `endTag`, `ending`, `killer`; mộ lưu `look.realm`, `look.killer`.

## Ngày 2 - Hết chết oan theo cảnh giới, nhịp kẻ địch
- [ ] Q2: rà 32 sự kiện phàm giới có lựa chọn `fatal` mà không có `maxRealm` (viết script đếm như báo cáo). Hoặc gắn `maxRealm`, hoặc nhân tỉ lệ chết theo khoảng cách cảnh giới. `ran_doc`: hết đan thì chết 0,4 chỉ khi realm ≤ 1, từ Trúc Cơ đổi thành mất sức khỏe và tăng tâm ma. `cuop_duong`: `maxRealm: 3`, từ Nguyên Anh trở lên thành bọn cướp quỳ xin tha (câu hài). Góp ý #29 (29/10): Luyện Hư vẫn chết vì nhà sập đè (events3.ts:481-488, động đất kho linh thạch) hoặc sửa cầu trượt chân (events.ts:294 giếng cổ và sự kiện sửa cầu) - từ Trúc Cơ trở lên các tai nạn phàm tục này chỉ gây thương, không chết. Trả lời #29 cùng #23.
- [ ] Q3: khoảng lặng giữa các trận bắt buộc (chặn đường, gặp người chơi, oan gia, cuop_duong, sat_thu): cách nhau ít nhất 3 năm game và 60 giây thời gian thực. Bỏ chặn đường khi sức khỏe dưới 35. Sau trận thua còn sống, tăng trọng số sự kiện cơ duyên trong 5 năm.
- [ ] HHT: Hợp Hoan Tông (Tyler chốt 30/10: đưa vào đợt ngày 2, 15 sự kiện tông có logic nối nhau; Tình duyên/đạo lữ để Tyler nghĩ thêm, KHÔNG đổi cơ chế đạo lữ ngoài các chỗ ghi dưới đây). Trả lời góp ý #24 (phần Hợp Hoan Tông; nói rõ tình duyên sẽ làm sau).
  - Tông tà thứ ba: thêm `tr('Hợp Hoan Tông', 'Hehuan Sect')` vào `TA_SECTS` (lib/game/sect.ts:43), `SECT_RANKS` 4 bậc: Hoa nô, Mị đồ, Hoan Hỷ sứ, Hợp Hoan Thánh tử/Thánh nữ (theo giới tính). Đồ tông môn `SECT_GEAR_BY` (lib/game/items2.ts:550) 3-4 món, icon dùng lại icon pixel/LPC có sẵn (nhuộm màu như 2 phụ kiện 3.1.0), không vẽ mới bằng code. Phản môn dùng luật ma môn có sẵn (Phật tu hoặc đạo tâm ≥ 40).
  - Trạng thái riêng `c.hh?: { lo: number; thu: string[]; tinh?: string; rival?: string; bo?: boolean }` (số lô đỉnh, tên người từng bị hút, người thật lòng, đối thủ trong tông, đã bỏ tông). Thêm vào types.ts.
  - Lợi ích: mỗi lô đỉnh +3% tu luyện (tối đa 5), mỗi lô đỉnh +1 tâm ma/năm. Thắng giao đấu khi là đệ tử Hợp Hoan: "Thái âm bổ dương" thêm 10% tu vi thưởng, 20% sinh oan gia (`c.enemy`). Sự kiện `dao_lu` lựa chọn "Lợi dụng song tu" đặt cờ `qf.hutCong = 1`; nếu đã là đệ tử Hợp Hoan thì tỉ lệ chết của lựa chọn đó giảm một nửa.
  - Chữ viết kiểu tiên hiệp đại chúng: song tu là trao đổi chân khí, mị thuật, mưu kế. Không có nội dung tình dục cụ thể.
  - 15 sự kiện (file mới lib/game/hopHoan.ts, đăng ký như SECT_EVENTS2), điều kiện nối nhau:
    1. `hh_bai_su` Mị Cơ mời nhập môn: tán tu cảnh giới 1-4, đạo tâm ≤ -15 hoặc `qf.hutCong`. Theo (Hoa nô hoặc Mị đồ theo tâm cảnh) / từ chối / giả vờ theo để dò tin (chỉ khi đạo tâm ≥ 0, rời sau 1 sự kiện, +đạo tâm).
    2. `hh_me_hon_tran` thử Mê Hồn Trận ngay năm sau khi nhập môn: thắng theo tâm cảnh thì thăng bậc, thua thì +tâm ma.
    3. `hh_lo_dinh_dau` lô đỉnh đầu tiên (cần `lo = 0`): hút cạn (tà, lo+1, thêm tên vào `thu`) / song tu đôi bên cùng lợi (trung, lo+1, không thêm thù) / tha (chính, -bậc thiện cảm tông).
    4. `hh_mi_thuat` luyện Mị thuật ở Hoan Hỷ Điện (cần lo ≥ 1): +ngộ tính hoặc +khí vận, quá tham thì +tâm ma.
    5. `hh_tranh_sung` tranh sủng với sư huynh/sư tỷ (bậc ≥ 1): đặt `rival` là tên đối thủ; thắng thăng bậc, thua bị hãm hại (thương).
    6. `hh_lo_dinh_them` thêm lô đỉnh (lo ≥ 1, cách lần trước ≥ 3 năm): như 3 nhưng cái giá tăng dần theo lo.
    7. `hh_chinh_phai_truy` chính phái truy sát (cảnh giới ≥ 2, lo ≥ 2): đánh / chạy / dùng mị thuật; chết gắn `dao_giang_ho`, nêu tên và tuổi như Q1.
    8. `hh_bao_thu` người trong `thu` quay lại báo thù (cách lúc hút ≥ 3 năm, nêu đích danh): chết gắn kết cục mới `tinh_cu_doi_mang` (Tình Cũ Đòi Mạng); thắng thì xóa tên khỏi `thu`.
    9. `hh_bach_hoa_yen` Bách Hoa Yến tranh danh mỗi 5 năm (thay Đại bỉ của tông): thắng thăng bậc; nếu `rival` còn thì đối thủ là `rival`.
    10. `hh_that_long` gặp người thật lòng (bậc ≥ 1, lo ≥ 2, một lần): coi như lô đỉnh / động lòng (đặt `tinh`, -tâm ma) / tránh mặt.
    11. `hh_tong_chu_biet` tông chủ phát hiện (cần `tinh`, ≥ 2 năm sau 10): giết người ấy để chứng tâm (thăng bậc, +tâm ma lớn, thêm `tinh` vào `thu`) / giấu (dùng `sectHide` có sẵn, 10%/năm lộ) / bỏ trốn cùng người ấy (`leaveSect(c, true)`, `bo = true`).
    12. `hh_truy_phan_do` tông truy sát kẻ bỏ trốn (cần `bo`, 1-3 năm sau): sống sót thì `c.partner = tinh` (chỉ gán tên như sự kiện dao_lu, không thêm cơ chế đạo lữ mới).
    13. `hh_phan_phe` Thái âm phản phệ (lo ≥ 4 và tâm ma ≥ 60): tán công bỏ bớt lô đỉnh (-tu vi, lo về 2) / cố nuốt (rủi ro tẩu hỏa).
    14. `hh_thanh_tu_tuyen` tuyển Thánh tử/Thánh nữ (bậc 2, cảnh giới ≥ 3): đấu với `rival` nếu có; thắng lên bậc 3.
    15. `hh_vay_coc` chính phái vây Hợp Hoan Cốc (bậc ≥ 2, cảnh giới ≥ 3, một lần): giữ cốc / bán đứng tông (rời tông, +đạo tâm, tông thành oan gia) / bỏ chạy.
  - 2 kết cục mới trong endings.ts (đặt trước nhóm kết cục chung): `tinh_cu_doi_mang` (endTag, từ sự kiện 8) và `vi_tinh_bo_tong` (Vì Tình Bỏ Tông: chết khi `hh.bo` và còn `partner`), rare 3, có `how`.
  - Thử: mô phỏng bằng `npx tsx` (mở rộng scripts/sim-ket-cuc.ts): trong số kiếp vào Hợp Hoan Tông, cả 15 sự kiện đều xuất hiện ít nhất một lần, không sự kiện nào chạy khi điều kiện trước chưa có (ví dụ 8 khi `thu` rỗng), tỉ lệ chết của đệ tử Hợp Hoan không cao hơn Vạn Độc Môn quá 5 điểm. Playwright: lưu kiếp giả là đệ tử Hợp Hoan, mở túi đồ thấy đồ tông, chụp màn.
- Xong:
- Ghi chú:

## Ngày 3 - Tuổi 16 thành dốc, tích cốc
- [ ] Q4: tỉ lệ chết khi thua trừ yêu hoặc chặn đường nhân 0,3 ở 16 tuổi, tăng dần lên 1,0 ở 22 tuổi (combat.ts:827). Lần thua trừ yêu đầu tiên sau 16 tuổi của mỗi kiếp luôn chỉ trọng thương, kèm một câu "trưởng thành". Linh căn Tạp/Phế được chọn định hướng con đường từ Luyện Khí tầng 3 (engine.ts:878).
- [ ] Q5: từ Trúc Cơ, "tích cốc": bỏ tiền ăn, chi phí đổi tên thành linh dược, động phủ. Thiếu tiền thì tu vi chậm và thêm tâm ma, không trừ sức khỏe, không in câu nhịn đói. `chet_doi` chỉ cho cảnh giới dưới 2 (engine.ts:710-726). Trả lời góp ý #28.
- Xong:
- Ghi chú:

## Ngày 4 - Lời viếng có tên tuổi, lore, tông môn
- [ ] Q6: lời viếng mẫu (components/CondoPresets.tsx) sinh từ dữ liệu mộ: tên, cảnh giới, con đường, kết cục, kẻ giết, đạo lữ. Màn lập bia gợi ý 3 câu văn bia từ khoảnh khắc lớn nhất kiếp.
- [ ] Q7: thiên sát cô tinh không còn cha mẹ trong sự kiện; "đệ tử đầu tiên" theo thứ tự thật (#4). Tông môn chính phái phản ứng khi đệ tử đổi sang ma đạo, dùng cơ chế phản môn và lộ thân phận có sẵn (engine.ts:669-679) (#13).
- Xong:
- Ghi chú:

## Ngày 5 - Kinh tế, gom bản 4.1.0
- [ ] Q8: kéo hệ số bán đồ trùng (1 + 0,5×cảnh giới) và giá phường thị (1 + 0,25×cảnh giới) về cùng nhịp; từ Nguyên Anh giá theo phẩm; đồ cao cấp có số lượng giới hạn làm mới theo năm game (data.ts:892-895, combat.ts:766-794). Trả lời góp ý #14.
- [ ] Gom bản 4.1.0: thêm mục 4.1.0 vào lib/releases.ts (dạng `asked` cho các góp ý #12, #13, #14, #18, #22, #23, #24, #26, #28 với `short`), cập nhật docs/CONTEXT.md (số kết cục, quái, đồ theo code), soạn sẵn bài Threads tối thứ Ba 3/11 lúc 20h (kiếp kỳ lạ nhất tuần + những gì đã sửa) gửi Tyler duyệt, không tự đăng.
- Xong:
- Ghi chú:

## Chờ Tyler quyết (chưa làm)
- Tình duyên (đạo lữ có tính cách, độ gắn bó, song tu, đỡ đòn thay): Tyler để nghĩ thêm (30/10). Không đổi cơ chế đạo lữ cho tới khi Tyler chốt.
