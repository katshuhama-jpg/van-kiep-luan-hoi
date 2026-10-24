# Vạn Kiếp Luân Hồi

Game pixel trùng sinh tu tiên, chơi trên trình duyệt điện thoại. Lấy cảm hứng từ 1in8b.life: đầu thai ngẫu nhiên, thời gian tự trôi, mỗi năm chọn một trọng tâm, gặp kỳ ngộ thì chọn 1 trong 4 hướng, sống đến hết thọ nguyên rồi luân hồi.

## Có gì trong game

- **Đầu thai ngẫu nhiên:** linh căn, xuất thân, giới tính, nhân tộc hay yêu tộc.
- **Thời gian chỉnh được:** chọn độ dài một năm (10/20/30 giây), tốc độ 1× đến 16×, nút » tua tới sự kiện kế tiếp, bế quan 5/10/20 năm.
- **Cảnh giới:** Phàm nhân → Luyện Khí (9 tầng) → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Độ Kiếp → Phi thăng. Từ Kim Đan trở lên có thiên kiếp.
- **Đạo tâm Chính ↔ Tà:** mỗi sự kiện có 4 lựa chọn, được tô màu theo hướng Chính/Tà.
- **Con đường tu tập** (chọn khi lên Trúc Cơ): Kiếm tu, Đan tu, Trận tu, Phật tu (cần nghiêng Chính), Ma tu (cần nghiêng Tà), Yêu tu (chỉ yêu tộc).
- **Nhân vật pixel ghép lớp:** đổi theo tuổi (bé, thiếu niên, trung niên, già tóc bạc chống gậy), cảnh giới (hào quang), con đường (đầu trọc Phật tu, mắt đỏ Ma tu, tai đuôi Yêu tu), quần áo và vũ khí mua ở phường thị.
- **Animation:** thở, chớp mắt, hào quang, linh khí bay lên, kiếm bay quanh người, linh thú nhảy, mùa xuân hạ thu đông, đột phá (chớp sáng, vòng sóng, rung màn hình), thiên kiếp (sét), bị thương, kết đạo lữ, chết (linh hồn bay lên).
- **Luân hồi:** chết xong lập bia ở nghĩa trang chung, nhận phúc duyên (hoặc nghiệp) để mua thiên phú cho kiếp sau.
- **Trừ yêu (kiểu Task Bar Hero):** chọn trọng tâm Trừ yêu, chọn 1 trong 15 loại quái theo cấp, nhân vật tự đánh liên tục để lấy tu vi, linh thạch, đan dược, yêu đan. Quái quá mạnh có thể giết chết nhân vật; có tùy chọn tự rút lui khi máu dưới 30%. Thêm 2 boss không thể thắng: Huyết Ma Lão Tổ (Tà) và Thái Thượng Kiếm Tôn (Chính) - đánh vào là trọng thương hoặc chết.
- **Lựa chọn chí mạng:** nhiều lựa chọn kiểu kiếm hiệp có thể chết ngay (canh độc, tẩu hỏa nhập ma, rơi vực, rắn độc, sát thủ...). Ngọc bội hộ thân đỡ một lần.
- **Thọ nguyên tối đa 120 năm**, mỗi sự kiện gặp tối đa 2 lần mỗi kiếp, câu chuyện thường ngày ghép ngẫu nhiên để ít lặp.
- **Bảng xếp hạng** năng lực và phú hào, lọc theo phái và con đường.
- **Nhạc nền 8-bit** tự sinh (ngũ cung), đổi nhịp khi đánh quái, có nút bật/tắt.
- **Tài khoản:** tên đăng nhập + mật khẩu 3-6 ký tự. Chưa đăng nhập vẫn chơi được, lưu trên máy.

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Mở http://localhost:3000

## Database (Supabase)

Chạy file `supabase/schema.sql` trong Supabase SQL Editor. Game dùng các bảng `vkl_players`, `vkl_sessions`, `vkl_saves`, `vkl_lives` và các hàm `vkl_*`. Trình duyệt không đọc trực tiếp bảng tài khoản, mọi thao tác đi qua các hàm này.

## Deploy

Import repo vào Vercel, thêm 2 biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Cấu trúc

- `lib/game/` - toàn bộ luật chơi: dữ liệu (cảnh giới, con đường, đồ), sự kiện 4 lựa chọn, engine thời gian.
- `components/Sprite.tsx` - nhân vật pixel ghép lớp.
- `components/Scene.tsx` - sân khấu, nền theo trọng tâm, mùa và hiệu ứng.
- `app/choi` - màn chơi chính. `app/dang-nhap`, `app/nghia-trang` - đăng nhập, nghĩa trang.

## Cơ chế "wow"

- **Nhân quả xuyên kiếp:** chôn rương + lời nhắn cho kiếp sau, gặp mộ kiếp trước, ân nhân/oan hồn kiếp trước tìm đến.
- **Người chơi khác:** mộ của người chơi khác, ma đầu Tà phái và minh chủ Chính phái lấy từ bảng xếp hạng thật.
- **Sổ Sinh Tử** (`/so-sinh-tu`): 18 kết cục, có kết cục ẩn (Xuyên Không, Long Kỵ Sĩ, Hệ Thống...).
- **Gieo quẻ thiên phú:** 24 thiên phú, 5 phẩm, Thiên phẩm 0.1%, có thiên phú mang họa.
- **Thẻ chia sẻ kết cục:** ảnh PNG pixel để khoe.
- **Thiên kiếp mini-game:** chạm đúng lúc để đỡ 9 đạo lôi.
- **Chuỗi sự kiện:** trứng rồng → long kỵ, đồ đệ phản sư, từ hôn - ước hẹn ba năm, Hệ Thống.
- **Quá độ:** làm một việc quá lâu hoặc bế quan quá lâu đều có cái giá.
