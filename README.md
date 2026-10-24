# Vạn Kiếp Luân Hồi

Game pixel trùng sinh tu tiên, chơi trên trình duyệt điện thoại. Lấy cảm hứng từ 1in8b.life: đầu thai ngẫu nhiên, thời gian tự trôi, mỗi năm chọn một trọng tâm, gặp kỳ ngộ thì chọn 1 trong 4 hướng, sống đến hết thọ nguyên rồi luân hồi.

## Có gì trong game

- **Đầu thai ngẫu nhiên:** linh căn, xuất thân, giới tính, nhân tộc hay yêu tộc.
- **Thời gian chỉnh được:** chọn độ dài một năm (15/30/45 giây), tốc độ 1× đến 16×, nút » tua tới sự kiện kế tiếp, bế quan 10/30/100 năm.
- **Cảnh giới:** Phàm nhân → Luyện Khí (9 tầng) → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Độ Kiếp → Phi thăng. Từ Kim Đan trở lên có thiên kiếp.
- **Đạo tâm Chính ↔ Tà:** mỗi sự kiện có 4 lựa chọn, được tô màu theo hướng Chính/Tà.
- **Con đường tu tập** (chọn khi lên Trúc Cơ): Kiếm tu, Đan tu, Trận tu, Phật tu (cần nghiêng Chính), Ma tu (cần nghiêng Tà), Yêu tu (chỉ yêu tộc).
- **Nhân vật pixel ghép lớp:** đổi theo tuổi (bé, thiếu niên, trung niên, già tóc bạc chống gậy), cảnh giới (hào quang), con đường (đầu trọc Phật tu, mắt đỏ Ma tu, tai đuôi Yêu tu), quần áo và vũ khí mua ở phường thị.
- **Animation:** thở, chớp mắt, hào quang, linh khí bay lên, kiếm bay quanh người, linh thú nhảy, mùa xuân hạ thu đông, đột phá (chớp sáng, vòng sóng, rung màn hình), thiên kiếp (sét), bị thương, kết đạo lữ, chết (linh hồn bay lên).
- **Luân hồi:** chết xong lập bia ở nghĩa trang chung, nhận phúc duyên (hoặc nghiệp) để mua thiên phú cho kiếp sau.
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
