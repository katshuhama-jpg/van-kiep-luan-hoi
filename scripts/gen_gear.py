# Sinh 100 vũ khí, 100 pháp y, 100 phụ kiện chia đều theo phái và cảnh giới -> lib/game/gear.ts
# Icon lấy từ bộ "496 pixel art icons" (CC0) copy vào public/icons/<id>.png
import json, os, shutil, sys, unicodedata, re

ICONS = sys.argv[1]  # thư mục icon gốc
OUT_ICON = '/home/claude/vkl/public/icons/'
OUT_TS = '/home/claude/vkl/lib/game/gear.ts'

GROUPS = ['chung', 'kiem', 'dan', 'tran', 'phat', 'ma', 'yeu']
REALM_CHUNG = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7]
REALM_PATH = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]

# ---------------- Vũ khí: (tên, dáng, mô tả) ----------------
W = {
 'chung': [
  ('Gậy tre đầu làng', 'truong', 'Đánh chó cũng được, chống gậy đi đường cũng xong.'),
  ('Dao rựa', 'dao', 'Phát bờ chặt củi, gặp cướp cũng vung lên được.'),
  ('Cung gỗ dâu', 'cung', 'Cung trẻ chăn trâu, bắn chim sẻ là chính.'),
  ('Chùy gỗ lim', 'chuy', 'Gỗ lim nặng trịch, đập đâu bẹp đó.'),
  ('Thiết thương', 'thuong', 'Cây thương sắt của lính trấn thủ.'),
  ('Phi tiêu sắt', 'tieu', 'Ném trúng ba con quạ trên một cành.'),
  ('Đoản đao giang hồ', 'dao', 'Lưỡi ngắn, dễ giấu trong ống tay áo.'),
  ('Cung sừng trâu', 'cung', 'Dây gân trâu, kéo căng nghe rắc rắc.'),
  ('Thanh Cương kiếm', 'kiem', 'Thép tôi chín lần, sáng xanh như nước.'),
  ('Lưu Tinh chùy', 'chuy', 'Quả chùy gai xích sắt, quay tít như sao băng.'),
  ('Bạch Lạp thương', 'thuong', 'Cán sáp trắng dẻo dai, đâm như rắn mổ.'),
  ('Truy Hồn tiêu', 'tieu', 'Tiêu bay không tiếng, kẻ trúng chưa kịp kêu.'),
  ('Phá Quân đao', 'dao', 'Đao của tướng tiên phong, một đao mở đường máu.'),
  ('Xuyên Vân cung', 'cung', 'Tên bắn xuyên mây, rơi xuống còn mang hơi lạnh.'),
  ('Lôi Âm chùy', 'chuy', 'Mỗi nhát nện vang như sấm rền.'),
  ('Tử Điện kiếm', 'kiem', 'Lưỡi kiếm lấp lóe tia chớp tím.'),
  ('Bá Vương thương', 'thuong', 'Thương nặng tám mươi cân, kẻ yếu không nhấc nổi.'),
  ('Hàn Nguyệt đao', 'dao', 'Đao cong như trăng lưỡi liềm, chém ra hơi băng.'),
  ('Lạc Nhật cung', 'cung', 'Tương truyền từng bắn rơi một vầng mặt trời giả.'),
  ('Thiên Cương kiếm', 'kiem', 'Kiếm khí ba mươi sáu đường như sao Thiên Cương.'),
  ('Phong Lôi chùy', 'chuy', 'Một cặp chùy gọi gió kéo sấm.'),
  ('Bách Bộ Xuyên Dương cung', 'cung', 'Trăm bước bắn trúng lá liễu, chưa từng trượt.'),
  ('Phương Thiên Họa Kích', 'thuong', 'Binh khí của chiến thần, ngựa xích thố mới xứng.'),
  ('Thanh Long Yển Nguyệt đao', 'dao', 'Đao rồng xanh tám mươi hai cân, chém tướng như chém chuối.'),
  ('Bạo Vũ Lê Hoa châm', 'tieu', 'Một hộp hai mươi bảy mũi kim, bắn ra như mưa hoa lê.'),
  ('Hiên Viên kiếm', 'kiem', 'Thánh kiếm của Hoàng Đế, một mặt khắc nhật nguyệt, một mặt khắc sơn hà.'),
  ('Bàn Cổ phủ', 'liem', 'Rìu khai thiên lập địa, một nhát tách trời đất.'),
  ('Hậu Nghệ thần cung', 'cung', 'Cung bắn rơi chín mặt trời năm xưa.'),
 ],
 'kiem': [
  ('Thu Thủy kiếm', 'kiem', 'Lưỡi kiếm trong như nước mùa thu.'), ('Ngư Trường kiếm', 'song', 'Kiếm nhỏ giấu trong bụng cá, chuyên dùng hành thích.'),
  ('Long Tuyền kiếm', 'kiem', 'Đúc bên suối rồng, đêm đêm ngân như rồng ngâm.'), ('Thất Tinh kiếm', 'kiem', 'Bảy viên ngọc trên chuôi xếp như chòm Bắc Đẩu.'),
  ('Thanh Sương kiếm', 'kiem', 'Rút ra là sương phủ trắng một vùng.'), ('Trảm Long kiếm', 'kiem', 'Kiếm từng chém đứt sừng giao long.'),
  ('Can Tương kiếm', 'kiem', 'Kiếm đực trong cặp kiếm phu thê.'), ('Mạc Tà kiếm', 'song', 'Kiếm cái, đúc bằng tóc và móng của Mạc Tà.'),
  ('Thái A kiếm', 'kiem', 'Kiếm uy đạo, cầm lên tự có khí thế đế vương.'), ('Trạm Lư kiếm', 'kiem', 'Kiếm nhân đạo, người bất nghĩa cầm sẽ tự rời tay.'),
  ('Tru Tiên kiếm', 'kiem', 'Một trong bốn thanh kiếm phá Tru Tiên trận.'), ('Vô Cực kiếm', 'song', 'Không lưỡi, không mũi, chỉ có kiếm ý.'),
 ],
 'dan': [
  ('Dược sừ', 'cuoc', 'Cuốc nhỏ đào linh thảo, không làm đứt rễ.'), ('Hỏa Linh phiến', 'quat', 'Quạt lửa lò đan, quạt người cũng bỏng.'),
  ('Bách Thảo trượng', 'truong', 'Gậy khắc trăm loài thảo dược.'), ('Đan Tâm bút', 'but', 'Bút viết đan phương, mực pha chu sa.'),
  ('Tử Diễm phiến', 'quat', 'Quạt ra lửa tím, luyện đan nhanh gấp đôi.'), ('Thần Nông xẻng', 'cuoc', 'Xẻng của Thần Nông nếm trăm thảo.'),
  ('Linh Chi trượng', 'truong', 'Đầu gậy là cây linh chi nghìn năm.'), ('Cửu Chuyển phiến', 'quat', 'Quạt chín vòng, lửa đan đổi chín màu.'),
  ('Thái Ất bút', 'but', 'Viết một nét, đan phương tự hiện.'), ('Dược Vương trượng', 'truong', 'Gậy của Dược Vương, gõ đâu cỏ mọc đó.'),
  ('Tam Muội Chân Hỏa phiến', 'quat', 'Quạt ra Tam Muội Chân Hỏa, luyện được cả sắt đá.'), ('Thần Nông xích', 'truong', 'Thước đo dược tính của trời đất.'),
 ],
 'tran': [
  ('Bát Quái phiến', 'quat', 'Quạt vẽ bát quái, phẩy ra một trận gió mê.'), ('Thiên Cơ bút', 'but', 'Bút vẽ trận đồ, nét nào cũng tính trước ba bước.'),
  ('Kỳ Môn trượng', 'truong', 'Cắm xuống đất là thành trận nhãn.'), ('Lục Hợp phiến', 'quat', 'Sáu nan quạt ứng sáu phương.'),
  ('Cửu Cung bút', 'but', 'Viết chín cung, giam người trong chín ô.'), ('Tinh Bàn trượng', 'truong', 'Đầu trượng là bàn sao xoay theo trời.'),
  ('Hà Đồ phiến', 'quat', 'Quạt chép lại Hà Đồ cổ.'), ('Lạc Thư bút', 'but', 'Bút viết Lạc Thư, số trời hiện trên giấy.'),
  ('Chu Thiên trượng', 'truong', 'Gõ ba cái, chu thiên tinh đấu dịch chuyển.'), ('Tứ Tượng phiến', 'quat', 'Thanh Long, Bạch Hổ, Chu Tước, Huyền Vũ vẽ trên bốn mặt.'),
  ('Thái Cực bút', 'but', 'Một nét âm, một nét dương, thành trận vô hình.'), ('Hồng Mông trượng', 'truong', 'Gậy từ thuở hồng mông, trận nào cũng phá được.'),
 ],
 'phat': [
  ('Thiền trượng gỗ', 'truong', 'Gậy của sư hành cước, mòn nhẵn vì đi vạn dặm.'), ('Kim cương xử', 'chuy', 'Pháp khí hàng ma của Mật tông.'),
  ('Bạch Mã phất trần', 'phattran', 'Lông đuôi ngựa trắng, phẩy bụi trần.'), ('Hàng Ma xử', 'chuy', 'Tà ma thấy là run sợ.'),
  ('Cửu Hoàn tích trượng', 'truong', 'Chín vòng đồng, mỗi bước leng keng tiếng kinh.'), ('Liên Hoa phất trần', 'phattran', 'Cán khắc hoa sen, phẩy ra hương thơm.'),
  ('Kim Cang trượng', 'truong', 'Gậy vàng nặng như núi Tu Di.'), ('Bồ Đề phất trần', 'phattran', 'Sợi phất trần dệt từ tơ cây bồ đề.'),
  ('Phục Hổ côn', 'truong', 'Côn của La Hán phục hổ.'), ('Như Ý kim cương xử', 'chuy', 'Pháp khí như ý, nhỏ to tùy tâm.'),
  ('Thất Bảo phất trần', 'phattran', 'Khảm bảy báu vật của nhà Phật.'), ('Đại Bi tích trượng', 'truong', 'Tích trượng của Bồ Tát Địa Tạng, mở cửa địa ngục.'),
 ],
 'ma': [
  ('Huyết Ảnh đao', 'dao', 'Lưỡi đao hút máu, càng chém càng đỏ.'), ('Thực Hồn liêm', 'liem', 'Lưỡi hái gặt hồn người.'),
  ('Câu Hồn tiên', 'roi', 'Roi móc hồn, quất trúng là mất vía.'), ('Âm Phong song đao', 'song', 'Đôi đao rít gió âm.'),
  ('Tu La đao', 'dao', 'Đao của chiến sĩ Tu La, không giết người thì không yên.'), ('Hắc Sát liêm', 'liem', 'Lưỡi liềm đen như đêm không trăng.'),
  ('Thị Huyết tiên', 'roi', 'Roi khát máu, quấn lấy là hút khô.'), ('Diêm La song nhận', 'song', 'Đôi dao của phán quan địa phủ.'),
  ('Phệ Thiên đao', 'dao', 'Đao muốn nuốt cả trời.'), ('Vong Xuyên liêm', 'liem', 'Rèn bằng nước sông Vong Xuyên.'),
  ('Cửu U tiên', 'roi', 'Roi luyện từ gân chín loài quỷ.'), ('Ma Thần đao', 'dao', 'Thanh đao của Ma Thần thượng cổ, cầm lên tâm ma nổi dậy.'),
 ],
 'yeu': [
  ('Lang Nha thủ sáo', 'quyen', 'Găng gắn nanh sói.'), ('Hổ Trảo', 'quyen', 'Móng hổ thép, cào rách cả giáp sắt.'),
  ('Xà Mâu', 'thuong', 'Mũi mâu uốn lượn như rắn.'), ('Ưng Trảo câu', 'liem', 'Móc sắt như vuốt chim ưng.'),
  ('Hùng Chưởng thủ sáo', 'quyen', 'Găng tay to như bàn tay gấu.'), ('Giao Long thương', 'thuong', 'Cán thương bọc da giao long.'),
  ('Hồ Vĩ liêm', 'liem', 'Lưỡi hái cong như đuôi cáo.'), ('Bạch Hổ trảo', 'quyen', 'Vuốt của Bạch Hổ thần thú.'),
  ('Thanh Xà mâu', 'thuong', 'Mâu tẩm nọc thanh xà.'), ('Kim Sí câu', 'liem', 'Móc vàng làm từ móng Kim Sí Đại Bằng.'),
  ('Kỳ Lân trảo', 'quyen', 'Vuốt lửa của kỳ lân.'), ('Yêu Đế mâu', 'thuong', 'Binh khí của Yêu Đế, vạn yêu cúi đầu.'),
 ],
}

# ---------------- Pháp y: (tên, kiểu, màu thân/đậm/viền/sáng, mô tả) ----------------
O = {
 'chung': [
  ('Áo nâu sồng', None, ['#8a6a4a', '#6a4e34', '#c9a77a', '#a8885e'], 'Áo mặc đi cày, bền như đất.'),
  ('Áo bà ba lam', None, ['#3d5a8a', '#2a3e60', '#e6e0cc', '#5a7ab0'], 'Gọn nhẹ, mát mẻ.'),
  ('Áo vải gai', 'manh', ['#a89a7a', '#7a6e54', '#5a4a3a', '#c8bc9a'], 'Thô ráp nhưng chịu được gió rét.'),
  ('Áo đuôi tôm', None, ['#5a6a4a', '#3e4a32', '#c9a77a', '#7a8a62'], 'Áo của trai làng ngày hội.'),
  ('Võ phục lam', None, ['#2a4a8a', '#1e3460', '#ffd36b', '#4a6ab0'], 'Võ phục của võ quán trong trấn.'),
  ('Giáp da trâu', 'giap', ['#8a5a3a', '#6a4028', '#3a2a1a', '#a8784e'], 'Da trâu thuộc kỹ, đỡ được dao găm.'),
  ('Áo choàng lữ khách', 'vu', ['#6a5a4a', '#4a3e32', '#c9a77a', '#8a7a62'], 'Áo choàng sờn vai của người đi xa.'),
  ('Tiêu cục phục', None, ['#a82a2a', '#7a1e1e', '#2a2a2a', '#c84a4a'], 'Đồ của tiêu sư áp tải hàng.'),
  ('Thiết giáp binh', 'giap', ['#7a7a8a', '#5a5a6a', '#c9a77a', '#9a9aaa'], 'Giáp sắt của quan binh.'),
  ('Thanh Vân bào', 'van', ['#4a8a7a', '#346a5a', '#e6f0e8', '#6aaa9a'], 'Áo thêu mây xanh.'),
  ('Dạ Hành hắc y', None, ['#1e1e28', '#121218', '#4a4a5a', '#30303e'], 'Đi đêm không ai thấy.'),
  ('Áo lụa Hàng Châu', 'hoa', ['#e8b0c0', '#c08090', '#ffffff', '#ffd0dc'], 'Lụa mềm như nước, thêu hoa đào.'),
  ('Ngân Lân giáp', 'vay', ['#b0b8c8', '#8890a0', '#3d6fb0', '#d0d8e8'], 'Giáp vảy bạc sáng loáng.'),
  ('Tử Vân bào', 'van', ['#6a3a8a', '#4a2a60', '#ffd36b', '#8a5aaa'], 'Mây tím quấn quanh vạt áo.'),
  ('Lam Ngọc bào', 'long', ['#2a6ab0', '#1e4a80', '#e6f0ff', '#4a8ad0'], 'Áo xanh ngọc, tay áo rộng.'),
  ('Hồng Vân bào', 'hoa', ['#c83a3a', '#982a2a', '#ffd36b', '#e85a5a'], 'Ráng chiều đỏ rực trên vai.'),
  ('Kim Lân giáp', 'vay', ['#d8a83a', '#a87a20', '#7a2a1e', '#f0c860'], 'Giáp vảy vàng, đao kiếm khó xuyên.'),
  ('Thiên Tằm y', 'long', ['#f0f0e6', '#c8c8bc', '#9ab0c8', '#ffffff'], 'Dệt từ tơ tằm trời, nước lửa không vào.'),
  ('Huyền Băng bào', 'van', ['#bce0f0', '#8ab0c8', '#2a4a8a', '#e0f4ff'], 'Lạnh như băng nghìn năm.'),
  ('Long Lân giáp', 'vay', ['#3a8a5a', '#2a6a40', '#ffd36b', '#5aaa7a'], 'Ghép từ vảy rồng đã lột.'),
  ('Phượng Vũ y', 'vu', ['#e8603a', '#b8402a', '#ffd36b', '#ff8a5a'], 'Lông phượng hoàng, khoác vào ấm như lửa.'),
  ('Tinh Hà bào', 'van', ['#1e2a5a', '#141c3e', '#e6e0ff', '#3a4a8a'], 'Vạt áo lấp lánh như dải ngân hà.'),
  ('Thiên Y vô phùng', 'long', ['#ffffff', '#d8dce8', '#ffd36b', '#ffffff'], 'Áo tiên không một đường may.'),
  ('Ngũ Sắc thần y', 'hoa', ['#e83a5a', '#2a8a5a', '#ffd36b', '#3a6ab0'], 'Năm màu ngũ hành hòa trong một tấm áo.'),
  ('Vân Long chiến giáp', 'giap', ['#3a4a6a', '#2a3448', '#ffd36b', '#5a6a8a'], 'Giáp chạm rồng mây của đại tướng quân.'),
  ('Hỗn Độn tiên bào', 'long', ['#4a3a5a', '#2a2238', '#c8b0ff', '#6a5a7a'], 'Màu áo đổi theo người nhìn.'),
  ('Thái Thượng đạo bào', 'van', ['#f0e6d0', '#c8bc9a', '#2a2a2a', '#ffffff'], 'Đạo bào của Thái Thượng Lão Quân.'),
  ('Cửu Thiên huyền y', 'vu', ['#2a1e3a', '#1a1226', '#ffd36b', '#4a3a5a'], 'Áo của tiên nữ chín tầng trời.'),
 ],
 'kiem': [
  ('Kiếm khách thanh sam', None, ['#5a8ab0', '#3e6a8a', '#e6f0ff', '#7aaad0'], 'Áo xanh của kiếm khách giang hồ.'),
  ('Bạch y kiếm khách', None, ['#f2f2f6', '#c8c8d0', '#3d6fb0', '#ffffff'], 'Áo trắng không vướng bụi.'),
  ('Lăng Vân kiếm bào', 'van', ['#7ac8ff', '#4a9ad0', '#ffffff', '#a8dcff'], 'Kiếm bào bay như mây.'),
  ('Thu Thủy y', None, ['#9ab8c8', '#7a98a8', '#2a4a6a', '#bcd8e8'], 'Màu nước hồ mùa thu.'),
  ('Kiếm Tông chiến bào', 'giap', ['#3a5a8a', '#2a4060', '#e6f0ff', '#5a7aaa'], 'Chiến bào của Kiếm Tông.'),
  ('Hàn Sương y', 'long', ['#e0ecf4', '#b0c4d0', '#5a7ab0', '#ffffff'], 'Kiếm khí đọng thành sương trên vai.'),
  ('Thiên Kiếm bào', 'van', ['#2a4a8a', '#1e3460', '#ffd36b', '#4a6ab0'], 'Thêu chín thanh kiếm bay.'),
  ('Vô Ngân y', None, ['#c8d0e0', '#a0a8b8', '#f2f2f6', '#e0e8f4'], 'Đi qua tuyết không để lại dấu.'),
  ('Kiếm Thánh bào', 'long', ['#f2f2f6', '#c8c8d0', '#ffd36b', '#ffffff'], 'Áo của Kiếm Thánh, kiếm ý tỏa ra lạnh người.'),
  ('Tuyết Ảnh y', 'vu', ['#ffffff', '#d0d8e8', '#7ac8ff', '#ffffff'], 'Bóng trắng lướt qua, đầu kẻ địch đã rơi.'),
  ('Kiếm Tiên bào', 'van', ['#bce0ff', '#8ab0d8', '#ffffff', '#e0f4ff'], 'Ngự kiếm phi hành, áo bay phần phật.'),
  ('Nhất Kiếm Hàn Quang y', 'long', ['#1e2a4a', '#141c34', '#7ac8ff', '#3a4a6a'], 'Một kiếm hàn quang lạnh mười chín châu.'),
 ],
 'dan': [
  ('Dược đồng y', None, ['#c8a86a', '#a0844a', '#7a3a1e', '#e0c88a'], 'Áo của tiểu đồng trông lò đan.'),
  ('Đan sư bào', 'hoa', ['#e08a3a', '#b0682a', '#ffd36b', '#ffa85a'], 'Thêu lò đan ba chân.'),
  ('Hỏa Văn bào', 'hoa', ['#c84a2a', '#98341e', '#ffd36b', '#e86a4a'], 'Vân lửa chạy dọc thân áo.'),
  ('Bách Thảo y', None, ['#6a8a3a', '#4e6a2a', '#e6e0cc', '#8aaa5a'], 'Thêu trăm loài thảo dược.'),
  ('Tử Đan bào', 'long', ['#8a3a6a', '#682a50', '#ffd36b', '#aa5a8a'], 'Áo tím của đan sư bậc cao.'),
  ('Thần Hỏa y', 'hoa', ['#ff8a3a', '#d0682a', '#fff3c4', '#ffaa5a'], 'Mặc vào lửa lò ngoan như mèo.'),
  ('Đan Vương bào', 'long', ['#c8962e', '#9a7020', '#7a2a1e', '#ffd36b'], 'Áo của Đan Vương, đi đâu cũng có người xin đan.'),
  ('Linh Dược y', None, ['#3a8a6a', '#2a6a50', '#ffd36b', '#5aaa8a'], 'Thấm mùi linh dược trăm năm.'),
  ('Cửu Chuyển đan bào', 'hoa', ['#e8603a', '#b8402a', '#ffffff', '#ff8a5a'], 'Chín vòng đan văn trên ngực.'),
  ('Xích Diễm y', 'vu', ['#d82a2a', '#a81e1e', '#ffd36b', '#ff4a4a'], 'Lửa đỏ bám quanh vạt áo không tắt.'),
  ('Dược Thánh bào', 'long', ['#f0e0b0', '#c8b888', '#3a8a5a', '#fff4d0'], 'Áo của Dược Thánh, người bệnh chạm vào là khỏi.'),
  ('Thái Thượng đan y', 'van', ['#ffd36b', '#d0a840', '#c83a2a', '#fff0b0'], 'Đan y của Thái Thượng, đan thành ắt có kim quang.'),
 ],
 'tran': [
  ('Bát Quái đạo bào', 'van', ['#3a3a4a', '#24242e', '#e6e6ee', '#5a5a6a'], 'Áo đạo sĩ vẽ bát quái sau lưng.'),
  ('Thiên Cơ y', None, ['#5a4a8a', '#3e3460', '#c8b0ff', '#7a6aaa'], 'Đoán trước ba bước, áo không bao giờ bẩn.'),
  ('Tinh Đồ bào', 'van', ['#1e2a5a', '#141c3e', '#ffd36b', '#3a4a8a'], 'Thêu bản đồ sao trời.'),
  ('Kỳ Môn y', None, ['#6a6a3a', '#4e4e2a', '#e6e0cc', '#8a8a5a'], 'Ẩn tám cửa kỳ môn trong nếp áo.'),
  ('Lục Hợp bào', 'long', ['#4a6a8a', '#344e6a', '#ffd36b', '#6a8aaa'], 'Sáu phương hợp nhất.'),
  ('Huyền Cơ y', 'van', ['#2a2a3a', '#1a1a26', '#9ab0ff', '#4a4a5a'], 'Mặc vào thấy được trận văn trong không khí.'),
  ('Tứ Tượng bào', 'long', ['#3a6a5a', '#2a4e42', '#e83a3a', '#5a8a7a'], 'Bốn thần thú trên bốn vạt áo.'),
  ('Chu Thiên y', 'van', ['#4a3a8a', '#342a60', '#ffffff', '#6a5aaa'], 'Áo xoay theo chu thiên tinh đấu.'),
  ('Hà Lạc bào', 'long', ['#8a7a4a', '#6a5e38', '#2a2a2a', '#aa9a6a'], 'Chép trọn Hà Đồ Lạc Thư.'),
  ('Vô Cực y', 'vu', ['#e6e6ee', '#bcbcc8', '#2a2a3a', '#ffffff'], 'Trắng đen giao hòa, không đầu không cuối.'),
  ('Trận Hoàng bào', 'long', ['#6a3a8a', '#4a2a60', '#ffd36b', '#8a5aaa'], 'Áo của Trận Hoàng, phẩy tay là thành trận.'),
  ('Hồng Mông y', 'van', ['#3a3a5a', '#22223a', '#e0d0ff', '#5a5a7a'], 'Từ thuở trời đất chưa phân.'),
 ],
 'phat': [
  ('Tăng y vải thô', None, ['#a88a5a', '#7a6440', '#5a4028', '#c8aa7a'], 'Áo sư hành cước, vá nhiều chỗ.'),
  ('Hoàng y cà sa', 'casa', ['#e0a830', '#b08020', '#a8302a', '#ffc850'], 'Cà sa vàng của sư trong chùa.'),
  ('Hồng cà sa', 'casa', ['#b8302a', '#86201c', '#ffd36b', '#d8504a'], 'Cà sa đỏ của Mật tông.'),
  ('Bồ Đề y', None, ['#8a7a3a', '#6a5e2a', '#e6e0cc', '#aa9a5a'], 'Dệt dưới gốc bồ đề.'),
  ('Kim Lan cà sa', 'casa', ['#ffc850', '#d0a030', '#a8302a', '#ffe08a'], 'Cà sa chỉ vàng, khoác lên sáng cả điện.'),
  ('Huyền Trang bào', 'long', ['#c8962e', '#9a7020', '#7a2a1e', '#e8b84e'], 'Áo của cao tăng đi Tây Thiên thỉnh kinh.'),
  ('La Hán y', None, ['#a8682a', '#80501e', '#ffd36b', '#c8884a'], 'Áo của mười tám La Hán.'),
  ('Kim Cang cà sa', 'casa', ['#d8a83a', '#a87a20', '#3a2a1a', '#f0c860'], 'Đao kiếm chém vào như chém kim cương.'),
  ('Bát Nhã y', 'long', ['#f0e0b0', '#c8b888', '#c8962e', '#fff4d0'], 'Mặc vào lòng tự sáng.'),
  ('Như Lai bào', 'casa', ['#ffd36b', '#d0a840', '#ffffff', '#fff0b0'], 'Hào quang Như Lai thêu sau lưng.'),
  ('Đại Bi cà sa', 'casa', ['#e8e0c8', '#c0b8a0', '#c8962e', '#ffffff'], 'Cà sa trắng của Bồ Tát Đại Bi.'),
  ('Vạn Phật kim y', 'long', ['#ffc850', '#d0a030', '#ffffff', '#ffe08a'], 'Vạn tượng Phật thu nhỏ thêu trên áo.'),
 ],
 'ma': [
  ('Hắc bào ma môn', None, ['#2a1e2a', '#1a121a', '#a8302a', '#3e2e3e'], 'Áo đen của đệ tử ma môn.'),
  ('Huyết Sát y', 'long', ['#7a0a1e', '#5a0614', '#1e1a24', '#9a2a3e'], 'Nhuộm bằng máu kẻ thù.'),
  ('U Minh bào', 'van', ['#1e1a2e', '#121020', '#7a5aaa', '#3a3450'], 'Áo từ cõi u minh, lạnh buốt.'),
  ('Thi Cốt giáp', 'giap', ['#c8c0a8', '#9a9480', '#3a2a2a', '#e0d8c0'], 'Giáp ghép từ xương người.'),
  ('Tu La bào', 'long', ['#3a0a10', '#2a060a', '#e0402e', '#5a1a20'], 'Áo của chiến sĩ Tu La.'),
  ('Cửu U y', 'vu', ['#141018', '#0a080e', '#5a3a8a', '#2a2030'], 'Chín tầng u minh trong một tấm áo.'),
  ('Huyết Hải bào', 'long', ['#a8102a', '#7a0a1e', '#1e1a24', '#c8304a'], 'Áo như vừa ngoi lên từ biển máu.'),
  ('Diêm Ma giáp', 'giap', ['#2a2a2a', '#1a1a1a', '#e0402e', '#4a4a4a'], 'Giáp của Diêm Ma Vương.'),
  ('Vạn Quỷ bào', 'van', ['#2a3a2a', '#1a261a', '#9aff9a', '#3e4e3e'], 'Vạn quỷ gào thét trên vạt áo.'),
  ('Hắc Liên y', 'hoa', ['#1e1a24', '#121016', '#7a0a1e', '#30283a'], 'Thêu sen đen nở trong đêm.'),
  ('Ma Tôn bào', 'long', ['#1e1a24', '#121016', '#c0202e', '#3a2e44'], 'Áo của Ma Tôn, khoác vào vạn ma thần phục.'),
  ('Thiên Ma y', 'vu', ['#3a0a3a', '#2a062a', '#ff3448', '#5a1a5a'], 'Thiên Ma giáng thế, trời đất u ám.'),
 ],
 'yeu': [
  ('Áo da báo', 'long_thu', ['#d8a83a', '#a87a20', '#3a2a1a', '#f0c860'], 'Da báo hoa mai, mặc vào chạy nhanh như gió.'),
  ('Áo lông sói', 'long_thu', ['#7d8590', '#5c636c', '#e6e6ee', '#a4acb6'], 'Lông sói xám dày ấm.'),
  ('Xà bì y', 'vay', ['#3a8a3a', '#2a6a2a', '#d8c83a', '#5aaa5a'], 'Áo da rắn, trơn như lươn.'),
  ('Hồ cừu', 'long_thu', ['#ff9a5a', '#d07a3a', '#fff4e0', '#ffba7a'], 'Áo lông cáo đỏ.'),
  ('Hổ bì chiến giáp', 'giap', ['#e0902a', '#b06e1e', '#2a1e1a', '#ffb04a'], 'Da hổ vằn, uy phong lẫm liệt.'),
  ('Ưng vũ y', 'vu', ['#8a6a4a', '#6a4e34', '#f2f2f6', '#aa8a6a'], 'Lông chim ưng, nhẹ như không.'),
  ('Hùng bì giáp', 'giap', ['#3a2a28', '#2a1e1c', '#7a5a3a', '#5a4442'], 'Da gấu đen dày cả tấc.'),
  ('Giao lân y', 'vay', ['#3a6a8a', '#2a4e6a', '#9fd8ff', '#5a8aaa'], 'Vảy giao long xanh biếc.'),
  ('Bạch hổ cừu', 'long_thu', ['#f2f2f6', '#c8c8d0', '#2a2a2a', '#ffffff'], 'Da Bạch Hổ thần thú, vằn đen trên nền trắng.'),
  ('Kim sí vũ y', 'vu', ['#e0a030', '#b07a1a', '#ffe27a', '#ffd36b'], 'Lông cánh Kim Sí Đại Bằng.'),
  ('Kỳ lân giáp', 'giap', ['#e0502a', '#a8341a', '#ffd36b', '#ff8a5a'], 'Vảy kỳ lân đỏ rực.'),
  ('Yêu Hoàng bào', 'long', ['#5a2a6a', '#3e1e4a', '#ffd36b', '#7a4a8a'], 'Áo của Yêu Hoàng, vạn yêu quỳ lạy.'),
 ],
}

# ---------------- Phụ kiện: (tên, loại icon, mô tả) ----------------
A = {
 'chung': [
  ('Bùa bình an', 'bua', 'Mẹ xin ở chùa, đeo cho yên lòng.'), ('Vòng gỗ trầm', 'nhan', 'Thơm nhẹ, đeo vào ngủ ngon.'),
  ('Túi thơm ngải cứu', 'ho_lo', 'Đuổi muỗi, đuổi tà.'), ('Lông gà rừng', 'long', 'Cài lên mũ cho oai.'),
  ('Ngọc bội xanh', 'ngoc', 'Ngọc thường, nhưng trơn bóng.'), ('Nhẫn đồng', 'nhan', 'Nhẫn của thợ rèn tặng.'),
  ('Lệnh bài tiêu cục', 'lenh', 'Đi đường cướp thấy cũng nể.'), ('Hồ lô rượu', 'ho_lo', 'Rượu ngon, uống vào hăng máu.'),
  ('Bích Ngọc bội', 'ngoc', 'Ngọc bích thượng hạng, mát lạnh.'), ('Tụ Linh thạch', 'tinh', 'Đá gom linh khí quanh người.'),
  ('Kinh thư tàn quyển', 'kinh', 'Nửa cuốn công pháp không rõ tên.'), ('Ngân linh', 'kim', 'Chuông bạc nhỏ, rung lên trừ tà.'),
  ('Hộ Tâm kính', 'lenh', 'Gương đồng che trước ngực.'), ('Tử Kim nhẫn', 'nhan', 'Nhẫn vàng tím, nặng tay.'),
  ('Phong Hỏa phù', 'bua', 'Bùa gọi gió lửa.'), ('Thủy Linh châu', 'tinh', 'Hạt châu chứa một giọt linh thủy.'),
  ('Định Hồn châu', 'tinh', 'Giữ hồn không tán khi tẩu hỏa.'), ('Long văn bội', 'ngoc', 'Ngọc bội chạm rồng.'),
  ('Càn Khôn đại', 'ho_lo', 'Túi nhỏ đựng được cả núi.'), ('Thiên Cơ lệnh', 'lenh', 'Lệnh bài của Thiên Cơ Các.'),
  ('Hỗn Nguyên châu', 'tinh', 'Hạt châu hỗn nguyên nhất khí.'), ('Vạn Lý phù', 'bua', 'Đốt lên là đi được vạn dặm.'),
  ('Tử Vi tinh bàn', 'lenh', 'Bàn sao Tử Vi đoán mệnh trời.'), ('Côn Lôn kính', 'lenh', 'Gương thần soi được quá khứ.'),
  ('Nữ Oa thạch', 'tinh', 'Đá vá trời còn sót lại.'), ('Hà Đồ', 'kinh', 'Bức đồ cổ nhất trời đất.'),
  ('Lạc Thư', 'kinh', 'Chín cung số trời.'), ('Thiên Đạo ấn', 'lenh', 'Ấn của Thiên Đạo, đóng xuống là thành luật.'),
 ],
 'kiem': [
  ('Kiếm tuệ', 'long', 'Tua kiếm đỏ, múa kiếm bay phấp phới.'), ('Kiếm phổ tàn thiên', 'kinh', 'Ba chiêu kiếm cuối bị xé mất.'),
  ('Kiếm tâm ngọc', 'ngoc', 'Đeo vào kiếm tâm sáng tỏ.'), ('Kiếm ý phù', 'bua', 'Phong ấn một đạo kiếm ý.'),
  ('Kiếm hoàn', 'nhan', 'Vòng kiếm nhỏ, ném ra hóa kiếm.'), ('Thanh Phong kiếm phổ', 'kinh', 'Kiếm phổ của phái Thanh Phong.'),
  ('Kiếm cốt châu', 'tinh', 'Châu luyện từ kiếm cốt của tiền bối.'), ('Vạn Kiếm lệnh', 'lenh', 'Lệnh bài triệu vạn kiếm.'),
  ('Kiếm hồn bội', 'ngoc', 'Trong ngọc có một đạo kiếm hồn.'), ('Độc Cô kiếm phổ', 'kinh', 'Chín thức kiếm không chiêu thắng có chiêu.'),
  ('Kiếm tâm thông minh châu', 'tinh', 'Kiếm tâm thông minh, nhìn thấu mọi chiêu.'), ('Kiếm Tiên lệnh', 'lenh', 'Lệnh bài của Kiếm Tiên, kiếm tu thiên hạ nhường đường.'),
 ],
 'dan': [
  ('Dược nang', 'ho_lo', 'Túi đựng thảo dược.'), ('Tử Kim hồ lô', 'ho_lo', 'Hồ lô đựng đan, đan không bao giờ hỏng.'),
  ('Đan phương tàn quyển', 'kinh', 'Đan phương cổ, thiếu vài vị thuốc.'), ('Hỏa linh châu', 'tinh', 'Hạt châu chứa hỏa linh.'),
  ('Bách thảo kinh', 'kinh', 'Ghi dược tính trăm loài cỏ.'), ('Đỉnh đan nhỏ', 'kim', 'Lò đan bỏ túi.'),
  ('Linh hỏa phù', 'bua', 'Bùa giữ lửa lò đan.'), ('Thần Nông bản thảo', 'kinh', 'Bản chép tay của Thần Nông.'),
  ('Cửu Chuyển hồ lô', 'ho_lo', 'Hồ lô từng đựng Cửu Chuyển Kim Đan.'), ('Đan tâm ngọc', 'ngoc', 'Ngọc giúp cảm nhận dược lực.'),
  ('Tam Muội hỏa chủng', 'bua', 'Mồi lửa Tam Muội Chân Hỏa.'), ('Thái Thượng đan kinh', 'kinh', 'Đan kinh của Thái Thượng Lão Quân.'),
 ],
 'tran': [
  ('La bàn đồng', 'kim', 'Kim chỉ linh mạch dưới đất.'), ('Trận kỳ', 'lenh', 'Lá cờ cắm trận nhãn.'),
  ('Bát quái kính', 'lenh', 'Gương bát quái phản tà.'), ('Trận nhãn tinh thạch', 'tinh', 'Viên đá làm mắt trận.'),
  ('Kỳ Môn độn giáp thư', 'kinh', 'Sách độn giáp, học xong đi mất tăm.'), ('Lục Hợp châu', 'tinh', 'Hạt châu sáu phương.'),
  ('Thiên Cơ phù', 'bua', 'Bùa tính trước thiên cơ.'), ('Tinh đồ ngọc giản', 'ngoc', 'Ngọc giản ghi bản đồ sao.'),
  ('Chu Thiên tinh đẩu bàn', 'lenh', 'Bàn xoay chu thiên tinh đẩu.'), ('Hà Lạc ngọc phù', 'bua', 'Ngọc phù khắc Hà Lạc.'),
  ('Vô Cực trận đồ', 'kinh', 'Trận đồ không có điểm đầu.'), ('Hồng Mông trận bàn', 'lenh', 'Trận bàn từ thuở hồng mông.'),
 ],
 'phat': [
  ('Tràng hạt gỗ', 'ngoc', 'Một trăm lẻ tám hạt, lần mãi thành nhẵn.'), ('Mõ gỗ', 'kim', 'Gõ mõ tụng kinh, tâm yên như nước.'),
  ('Xá lợi tử', 'tinh', 'Xá lợi của một vị sư đã viên tịch.'), ('Kinh Kim Cang', 'kinh', 'Ưng vô sở trụ nhi sinh kỳ tâm.'),
  ('Bồ Đề tử', 'ngoc', 'Hạt bồ đề, đeo vào dễ ngộ.'), ('Tâm Kinh ngọc giản', 'kinh', 'Sắc tức thị không.'),
  ('Phật quang phù', 'bua', 'Bùa tỏa Phật quang.'), ('Liên hoa đài', 'lenh', 'Đài sen nhỏ để ngồi thiền.'),
  ('Kim bát', 'kim', 'Bát vàng khất thực.'), ('Đại Bi chú', 'bua', 'Đeo chú Đại Bi, tà ma không gần.'),
  ('Phật cốt xá lợi', 'tinh', 'Xá lợi cốt Phật, thần thánh vô song.'), ('Vạn Phật triều tông ấn', 'lenh', 'Ấn vạn Phật triều tông.'),
 ],
 'ma': [
  ('Huyết ngọc', 'ngoc', 'Ngọc đỏ như máu, ấm như da người.'), ('Đầu lâu bội', 'cot', 'Đầu lâu nhỏ đeo bên hông.'),
  ('Phệ hồn phù', 'bua', 'Bùa nuốt hồn.'), ('Ma đồng', 'tinh', 'Con mắt ma luyện từ yêu thú.'),
  ('Huyết Sát lệnh', 'lenh', 'Lệnh bài Huyết Sát Môn.'), ('U Minh châu', 'tinh', 'Châu đen từ cõi u minh.'),
  ('Thi cốt chuỗi', 'cot', 'Chuỗi xương ngón tay.'), ('Vạn Hồn phiên', 'bua', 'Cờ nhỏ giam vạn hồn.'),
  ('Ma tâm ngọc', 'ngoc', 'Ngọc nuôi tâm ma.'), ('Huyết thần kinh', 'kinh', 'Kinh luyện máu thành thần.'),
  ('Cửu U ấn', 'lenh', 'Ấn của chúa tể Cửu U.'), ('Thiên Ma xá lợi', 'cot', 'Xá lợi của Thiên Ma, ma khí ngút trời.'),
 ],
 'yeu': [
  ('Nanh sói', 'cot', 'Nanh sói xâu dây đeo cổ.'), ('Vảy mãng xà', 'kim', 'Vảy rắn cứng như sắt.'),
  ('Lông cáo đỏ', 'long', 'Lông đuôi hồ ly.'), ('Yêu đan nhỏ', 'tinh', 'Yêu đan trăm năm.'),
  ('Mắt ưng', 'tinh', 'Đeo vào nhìn xa nghìn dặm.'), ('Móng hổ', 'cot', 'Móng hổ đeo trừ tà.'),
  ('Hồ châu', 'tinh', 'Châu của Cửu Vĩ Hồ.'), ('Long lân', 'kim', 'Một chiếc vảy rồng.'),
  ('Phượng vũ', 'long', 'Lông phượng hoàng, cháy mãi không tàn.'), ('Vạn Yêu lệnh', 'lenh', 'Lệnh bài hiệu triệu vạn yêu.'),
  ('Kỳ Lân giác', 'cot', 'Sừng kỳ lân.'), ('Yêu Hoàng ấn', 'lenh', 'Ấn của Yêu Hoàng.'),
 ],
}

for d in (W, O, A):
    for g in GROUPS:
        n = 28 if g == 'chung' else 12
        assert len(d[g]) == n, (g, len(d[g]))

def slug(s):
    s = unicodedata.normalize('NFD', s).replace('đ', 'd').replace('Đ', 'D')
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '_', s).strip('_')

# icon theo loại
def pool(prefix):
    return sorted(f for f in os.listdir(ICONS) if f.startswith(prefix))
WPOOL = {
    'kiem': pool('W_Sword') + pool('S_Sword'), 'song': pool('W_Dagger'), 'dao': pool('W_Sword')[::-1] + pool('S_Sword')[::-1],
    'thuong': pool('W_Spear') + pool('W_Gold_Spear'), 'cung': pool('W_Bow') + pool('S_Bow'), 'chuy': pool('W_Mace'), 'liem': pool('W_Axe') + pool('S_Axe'),
    'truong': pool('W_Staff'), 'phattran': pool('W_Staff')[::-1], 'quat': pool('W_Book'), 'but': pool('W_Staff')[3:] + pool('W_Book'),
    'tieu': pool('W_Throw') + pool('W_Dagger')[::-1], 'quyen': pool('W_Fist'), 'roi': pool('W_Mace')[::-1], 'cuoc': pool('W_Axe')[::-1],
}
APOOL = {
    'ngoc': pool('Ac_Necklace') + ['Ac_Medal04.png'], 'nhan': pool('Ac_Ring'), 'lenh': pool('Ac_Medal')[:3] + pool('E_Gold') + pool('E_Metal'),
    'kinh': pool('W_Book') + pool('I_Scroll'), 'ho_lo': pool('I_Bottle'), 'long': pool('I_Feather'), 'tinh': pool('I_Crystal'),
    'cot': pool('E_Bones'), 'kim': pool('E_Metal')[::-1],
}
BUA = {'phat': pool('S_Holy'), 'dan': pool('S_Fire'), 'ma': pool('S_Shadow'), '_': pool('S_Magic')}
used = {}
def take(lst, key):
    i = used.get(key, 0)
    used[key] = i + 1
    return lst[i % len(lst)]

# chỉ số
REALM_BASE = [0, 1, 9, 12, 15, 18, 21, 24]
MONS = [('tho_yeu', 1), ('soi_xam', 2), ('ran_hoa', 3), ('son_tac', 4), ('khi_ac', 5), ('heo_rung', 7), ('thich_khach', 8), ('bo_cap', 9), ('ho_yeu', 11), ('thiet_chuong', 12), ('cuong_thi', 13), ('hac_hung', 15), ('doc_vuong', 16), ('ngan_giac', 17), ('dai_bang', 19), ('cuong_dao', 20), ('huyet_ma', 21), ('bang_giao', 23), ('kiem_si', 24), ('ky_lan', 25), ('hac_long', 27)]
def mons_for(t):
    lo = REALM_BASE[t] if t else 0
    hi = (REALM_BASE[t + 1] if t + 1 < len(REALM_BASE) else 30) + 1
    r = [m for m, lv in MONS if lo <= lv <= hi]
    if not r:
        r = [min(MONS, key=lambda x: abs(x[1] - lo))[0]]
    return r[:4]

def fx_for(slot, g, t, q):
    k = lambda v: max(1, round(v * q))
    if slot == 'vu_khi':
        base = 8 + t * 4
        f = {
            'chung': {'atk': k(base), 'crit': k(2 + t)},
            'kiem': {'atk': k(base * 1.1), 'crit': k(4 + t * 1.5)},
            'dan': {'atk': k(base * 0.6), 'dan': k(10 + t * 5), 'money': k(5 + t * 3)},
            'tran': {'atk': k(base * 0.7), 'def': k(6 + t * 3), 'flee': k(6 + t * 3)},
            'phat': {'atk': k(base * 0.8), 'hp': k(6 + t * 3), 'tamMa': -1 if t < 5 else -2},
            'ma': {'atk': k(base * 1.15), 'exp': k(6 + t * 3), 'tamMa': 1},
            'yeu': {'atk': k(base), 'hp': k(5 + t * 3), 'drop': k(4 + t * 2)},
        }[g]
    elif slot == 'ao':
        base = 8 + t * 4
        f = {
            'chung': {'def': k(base), 'hp': k(4 + t * 3)},
            'kiem': {'def': k(base * 0.8), 'crit': k(2 + t), 'atk': k(3 + t * 2)},
            'dan': {'def': k(base * 0.7), 'dan': k(8 + t * 4)},
            'tran': {'def': k(base * 1.1), 'flee': k(6 + t * 3)},
            'phat': {'def': k(base), 'cult': k(4 + t * 2), 'tamMa': -1},
            'ma': {'def': k(base * 0.8), 'atk': k(4 + t * 2), 'exp': k(5 + t * 2), 'tamMa': 1},
            'yeu': {'def': k(base * 0.9), 'hp': k(8 + t * 4), 'drop': k(3 + t * 2)},
        }[g]
        if g == 'chung' and t >= 2: f['cult'] = k(2 + t)
    else:
        base = 5 + t * 3
        f = {
            'chung': {'cult': k(base), ('drop' if t % 2 else 'money'): k(5 + t * 3)},
            'kiem': {'cult': k(base * 0.8), 'atk': k(3 + t * 2), 'crit': k(2 + t)},
            'dan': {'cult': k(base * 0.8), 'dan': k(8 + t * 4), 'money': k(4 + t * 2)},
            'tran': {'cult': k(base * 0.8), 'def': k(4 + t * 2), 'flee': k(5 + t * 2)},
            'phat': {'cult': k(base), 'tamCanh': 1 if t < 5 else 2, 'tamMa': -1},
            'ma': {'cult': k(base * 1.2), 'exp': k(5 + t * 3), 'tamMa': 1 if t < 5 else 2},
            'yeu': {'cult': k(base * 0.8), 'hp': k(6 + t * 3), 'drop': k(5 + t * 3)},
        }[g]
    return f

PATH_LEAN = {'phat': 'chinh', 'ma': 'ta'}
items = []
ids = set()
for slot, table in (('vu_khi', W), ('ao', O), ('phu_kien', A)):
    for g in GROUPS:
        realms = REALM_CHUNG if g == 'chung' else REALM_PATH
        seen_in_realm = {}
        for idx, entry in enumerate(table[g]):
            t = realms[idx]
            j = seen_in_realm.get(t, 0)
            seen_in_realm[t] = j + 1
            name = entry[0]
            iid = ('g_' + slug(name))[:40]
            while iid in ids: iid += '_2'
            ids.add(iid)
            # món đầu mỗi cảnh giới bán ở phường thị, món sau phải trừ yêu (mạnh hơn)
            drop = j >= (2 if g == 'chung' else 1)
            rare = 3 if t >= 7 and drop else 2 if drop else (1 if t >= 3 else 0)
            q = 1.25 if drop else 1.0
            it = {'id': iid, 'name': name, 'slot': slot, 'minRealm': t, 'look': 'x', 'rare': rare, 'fx': fx_for(slot, g, t, q)}
            if g != 'chung': it['path'] = g
            if g in PATH_LEAN and t >= 4: it['lean'] = PATH_LEAN[g]
            if drop:
                it['price'] = 0; it['src'] = 'drop'; it['from'] = mons_for(t)
            else:
                it['price'] = int(round(30 * (t + 1) ** 2 * (1.5 if t >= 4 else 1) / 10) * 10)
            if slot == 'vu_khi':
                _, kind, desc = entry
                it['desc'] = desc
                cols = {'chung': ('#e0e4ee', '#8a5a2a'), 'kiem': ('#d9e6ff', '#3d6fb0'), 'dan': ('#ffb057', '#7a3a1e'), 'tran': ('#c8b0ff', '#3a3a4a'), 'phat': ('#ffe27a', '#a8302a'), 'ma': ('#e0202e', '#1e1a24'), 'yeu': ('#f2f2f6', '#7a5a3a')}[g]
                it['wpn'] = {'k': kind, 'a': cols[0], 'b': cols[1]}
                src = take(WPOOL[kind], 'w_' + kind)
                it['icon'] = True; it['_icon'] = src
            elif slot == 'ao':
                _, deco, robe, desc = entry
                it['desc'] = desc; it['robe'] = robe
                if deco: it['deco'] = deco
            else:
                _, cat, desc = entry
                it['desc'] = desc
                src = take(BUA.get(g, BUA['_']), 'bua_' + g) if cat == 'bua' else take(APOOL[cat], 'a_' + cat)
                it['icon'] = True; it['_icon'] = src; it['_cat'] = cat
            items.append(it)

# icon vẽ riêng kiểu kiếm hiệp bằng scripts/draw_icons.py (không dùng icon kiểu châu Âu nữa)
cats = {}
for it in items:
    it.pop('_icon', None)
    c = it.pop('_cat', None)
    if c: cats[it['id']] = c
json.dump(cats, open('/home/claude/vkl/scripts/acc_cats.json', 'w'), ensure_ascii=False, indent=0)

order = ['id', 'name', 'icon', 'slot', 'price', 'minRealm', 'path', 'lean', 'desc', 'look', 'fx', 'src', 'from', 'rare', 'robe', 'deco', 'wpn']
lines = []
for it in items:
    parts = []
    for k in order:
        if k in it:
            v = it[k]
            parts.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
    lines.append('  { ' + ', '.join(parts) + ' },')
ts = ("// Tự sinh bởi scripts/gen_gear.py, đừng sửa tay\n"
      "import type { Item } from './data';\n\n"
      "/** 100 vũ khí, 100 pháp y, 100 phụ kiện chia đều cho các phái và cảnh giới */\n"
      "export const GEAR: Item[] = [\n" + '\n'.join(lines) + '\n];\n')
ts = re.sub(r'"(\w+)":', r'\1:', ts)
open(OUT_TS, 'w').write(ts)
from collections import Counter
print(len(items), Counter(i['slot'] for i in items), Counter(i.get('src', 'shop') for i in items))
