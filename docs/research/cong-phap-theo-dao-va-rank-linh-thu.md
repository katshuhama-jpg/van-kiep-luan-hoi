# Công pháp theo con đường tu, rank linh thú

Viết 2/11/2026. Đề xuất, demo ở nhánh `demo-cong-phap` (/demo). Số liệu chưa cân bằng.

## Nguyên tắc
- Mỗi đạo có một thanh riêng trong trận và một cách thắng riêng. Chọn đạo là chọn lối đánh, không chỉ đổi chỉ số.
- Mỗi đạo: 1 tâm pháp (bị động), 4 chiêu (2 ô mở sẵn, ô 3 mở ở Nguyên Anh), 1 tuyệt kỹ ra từ dung hợp.
- Hiệu ứng vẽ pixel, dùng lại bộ PixelFx có sẵn (đan hoàn, chuông vàng, cửu vĩ, ma hỏa, huyết nguyệt...).

| Đạo | Thanh | Lối đánh | Tâm pháp | Chiêu | Tuyệt kỹ |
|---|---|---|---|---|---|
| Kiếm | Kiếm ý | Chém liên hoàn, trúng đòn tích kiếm ý | Thanh Liên Kiếm Tâm Quyết | Liệt Hỏa Kiếm Quyết, Kim Xà Kiếm Pháp, Thái Cực Kiếm, Độc Cô Cửu Kiếm | Vạn Kiếm Quy Tông |
| Đan | Đan hỏa | Ném đan, độc cộng dồn 5 tầng, tự hồi máu | Thanh Mộc Trường Sinh Quyết | Liệt Diễm Đan Bạo, Vạn Độc Vụ, Hồi Xuân Đan Thuật | Cửu Chuyển Luyện Thiên Lô |
| Trận | Trận nhãn | Mỗi chiêu dựng 1 cột trận, đủ 3 cột mở đại trận | Chu Thiên Tinh Đấu Quyết | Kim Quang Hộ Trận, Ngũ Lôi Phù, Mê Tung Khốn Trận | Chu Thiên Tinh Đấu Đại Trận |
| Phật | Định lực | Chịu đòn tích định lực, đầy thì phản chưởng | Kim Cang Bất Hoại Thể | Đại Lực Kim Cang Chưởng, Kim Chung Tráo, Sư Tử Hống | Như Lai Thần Chưởng |
| Ma | Sát khí | Đốt máu lấy sức, hút máu bù, máu thấp sát khí lên nhanh | Huyết Hải Ma Công | Huyết Ảnh Trảo, Thôn Phệ Ma Công, Cuồng Ma Hóa | Huyết Tế Thiên Ma |
| Yêu | Yêu lực | Dựa huyết mạch và linh thú, đầy thì hóa bản thể | Yêu Thần Luyện Thể | Thiên Hồ Mị Thuật, Yêu Trảo Liệt Không, Hóa Hình Thuật | Hiện Chân Thân |

## Rank linh thú (5 bậc, chốt 2/11)
| Rank | Ý nghĩa | Tỉ lệ gặp | Loài |
|---|---|---|---|
| N | Thú thường | 45% | chó vàng, chuột xám, bạch thử, ưng con, dơi, sói con, hồ ly, hùng con |
| R | Có linh tính | 30% | kim phong, nấm linh, linh dịch, tiểu thanh xà, sư tử con, mai hoa lộc, tằm linh |
| SR | Khai linh trí, mang ngũ hành | 17% | hắc lang, xích lang, tuyết hồ, linh lộc, thực nhân hoa, băng phong, hỏa linh dịch, kim thử, băng lang, hỏa hồ, huyết bức, tuyết hùng, bạch xà, xích chi |
| SSR | Yêu vương, dị thú | 7,5% | bạch lang, thử vương, thổ long, Kim Sí Đại Bằng, Tất Phương, Cửu Vĩ Thiên Hồ, Côn Bằng, Bạch Hổ, Thanh Giao, Cùng Kỳ |
| SSS | Thần thú (tứ linh) | 0,5% | Thanh Long, Kỳ Lân, Huyền Vũ, Hỏa Phượng |

- Tiến hóa nâng rank: Sói con N → Xích Lang SR → Thiên Lang SSR.
- Loài từ SSR trở lên phần lớn dùng thú LPC lớn có sẵn trong bộ quái. Hỏa Phượng đang mượn sprite hạc nhuộm lửa, Kỳ Lân LPC trông như ngựa một sừng, nên có sprite riêng.
