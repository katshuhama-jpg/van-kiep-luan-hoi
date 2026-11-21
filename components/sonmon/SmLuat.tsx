'use client';

/**
 * 17/11 (Tyler: luật Sơn Môn lằng nhằng, người chơi khó hiểu): không đổi luật, chỉ đổi cách kể.
 * - SmBaCau: Sơn Môn trong 3 câu (vòng chơi), ở đầu danh sách môn và môn nhà (môn nhà: bấm Đã hiểu thì ẩn).
 * - SmLuat: luật đủ, viết dạng hỏi - đáp, mở từ thẻ 3 câu và từ màn Kỷ. Số nhân của trận (sân nhà, trần) chỉ nói bằng lời.
 */
import { useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { smCo, type SmCtx } from './ui';

const HIEU_KEY = 'vkl.sm.baCau';

export function SmBaCau({ c, anDuoc = false }: { c: SmCtx; anDuoc?: boolean }) {
  const [an, setAn] = useState(() => {
    if (!anDuoc) return false;
    try {
      return localStorage.getItem(HIEU_KEY) === '1';
    } catch {
      return false;
    }
  });
  if (an) return null;
  return (
    <section className="sm-card sm-bacau">
      <h3>{tr('Sơn Môn trong 3 câu', 'Sects in 3 lines')}</h3>
      <ol>
        <li>{tr('Khai hoang đất trống kề lãnh thổ: cắm cờ ngay, không phải đánh ai. Môn càng đông giữ được càng nhiều ô.', 'Claim empty land next to yours at once, no fighting. Bigger sects can hold more tiles.')}</li>
        <li>{tr('Chơi kiếp, điểm danh, làm nhiệm vụ góp Khí vận: môn mạnh hơn khi giữ đất và khi giành ô của môn khác.', 'Lives, check-ins and tasks add Fortune: stronger defence, and strength to take tiles from others.')}</li>
        <li>{tr('Giữ đất mỗi giờ được điểm, Linh Mạch và Thiên Trì được nhiều hơn. Xuất chinh thắng, lấy được ô của môn khác hay của yêu thú: +2 điểm ngay (tối đa +10 mỗi ngày; khai hoang ô trống không tính). Hết Kỷ (21:00 ngày 1/12), môn nhiều Điểm giữ đất nhất thắng.', 'Each hour held land earns points, more on Spirit Veins and the Heaven Pool. Win a march and take a tile from another sect or a beast: +2 points at once (up to +10 a day; claiming empty land does not count). When the era ends (Dec 1, 9 PM), the sect with the most land points wins.')}</li>
      </ol>
      <div className="sm-row">
        <button
          className="sm-btn small sm-grow"
          onClick={() => {
            track('sm_luat', { from: anDuoc ? 'mon' : 'list' });
            c.go('luat');
          }}
        >
          {tr('Xem luật đủ', 'Full rules')}
        </button>
        {anDuoc && (
          <button
            className="sm-btn small dark sm-grow"
            onClick={() => {
              try {
                localStorage.setItem(HIEU_KEY, '1');
              } catch {}
              track('sm_bacau_ok');
              setAn(true);
            }}
          >
            {tr('Đã hiểu', 'Got it')}
          </button>
        )}
      </div>
    </section>
  );
}

const HOI: [string, string, string, string][] = [
  ['Điểm giữ đất là gì?', 'Mỗi giờ, môn giữ một ô thường được 1 điểm, một ô Linh Mạch được 3 điểm, Thiên Trì (ô giữa bản đồ) được 5 điểm. Điểm cộng dồn cả Kỷ, không mất khi mất ô. Hết Kỷ, môn nhiều điểm nhất thắng. Linh Mạch còn cho môn giữ +2 Khí vận mỗi sáng 5:00.', 'What are land points?', 'Each hour a sect earns 1 point per ordinary tile, 3 per Spirit Vein and 5 for the Heaven Pool (the centre tile). Points add up over the era and are never lost. Most points at the end wins. Spirit Veins also give +2 fortune each 5:00.'],
  ['Yêu thú là gì?', 'Mỗi sáng 5:00, yêu thú chiếm vài ô trống ở rìa bản đồ, trên ô ghi lực giữ của nó. Môn nào quanh đất không có yêu thú (thường là môn ở giữa bản đồ) thì có thêm một ổ yêu mọc ngay sát đất môn. Đánh thắng thì ô về tay môn, mỗi người đi theo được +10 phúc duyên. Ô yêu thú chưa ai đánh sẽ về trống vào sáng hôm sau, nên mỗi sáng yêu thú hiện ở chỗ mới. Linh Mạch, Thiên Trì mới xuất hiện có khi có yêu thú canh, có khi không: có thì phải đánh thắng nó, yêu thú canh mạch không tự bỏ đi lúc 5:00; không có thì môn nào tới trước chiếm ngay. Nhìn hình là biết độ mạnh: Linh Thố yếu nhất, rồi Thanh Vân Lộc, Phong Tốc Mã, Độc Chướng Oa, Ma Lang, Ám Ảnh Báo, Thạch Giáp Sơn Hùng, Bích Hải Long Quy, Dung Nham Tích Dịch, Băng Phách Cốt Xà, mạnh nhất là Hám Địa Thần Ngưu. Yêu thú mạnh dần theo từng ngày của Kỷ (mỗi ngày thêm khoảng 7% so với ngày đầu), nên càng về cuối Kỷ càng phải kéo đông người.', 'What are demon beasts?', 'Each 5:00, demon beasts take a few empty tiles on the map edge; the number on the tile is their defence. Sects with no beasts near their land (usually those in the middle) also get a den right next to them. Beat one and the tile is ours, and each marcher gets +10 blessing. Unbeaten beasts leave the next morning, so each day they show up somewhere new. New Spirit Veins and the Heaven Pool may or may not have a beast on guard: if so you must beat it (it does not leave at 5:00); if not, the first sect to arrive takes it. The picture shows the strength: the Spirit Hare is weakest, the Earthshaker Ox strongest. Beasts grow stronger each day of the era (about 7% of day one per day), so late in the era you need bigger groups.'],
  ['Yêu thú có tự đánh không?', 'Có. Ban ngày yêu thú đánh theo đợt (9, 12, 15, 18, 21 giờ). Trước mỗi đợt 1 giờ, bản đồ hiện vệt đỏ và dấu ! trên ô bị nhắm, môn bị nhắm thấy ở Chiến sự. Sang đứng giữ ô đó: sức giữ (cộng cả hộ sơn trận) lớn hơn lực yêu thú thì đẩy lui được, yêu thú yếu đi 1/4, mỗi người đứng giữ +5 phúc duyên. Thua thì ô thành ô yêu thú, đánh lại được. Diệt ổ yêu trước giờ thì đợt đó tan. Yêu thú không đánh chính điện, Linh Mạch, Thiên Trì, ô đang bảo hộ, và không động tới môn yếu: chỉ đánh môn có từ 4 ô và Lực chiến từ một nửa môn mạnh nhất, mỗi môn cách 6 giờ mới bị đánh lại. Ổ yêu chưa có việc thì có thể lan sang một ô trống kề bên.', 'Do beasts attack on their own?', 'Yes. By day beasts raid in waves (9, 12, 15, 18, 21). An hour before each wave the map shows a red trail and a ! on the target, and the target sect sees it under War. Guard that tile: out-defend the beast (the sect ward counts too) and it retreats a quarter weaker, each guard gets +5 blessing. Lose and the tile becomes a beast tile you can retake. Destroy the den first and the raid is off. Beasts never hit main halls, Spirit Veins, the Heaven Pool or protected tiles, and leave weak sects alone: only sects with 4+ tiles and at least half the strongest sect power, at most once per 6 hours. Idle dens may spread to an empty tile next to them.'],
  ['Đệ tử có phát lệnh xuất chinh được không?', 'Được, khi đánh ô yêu thú, hoặc Linh Mạch, Thiên Trì đang có môn khác giữ. Môn đã khai hoang đủ ô vẫn đánh yêu thú được: thắng thì nhận ô. Ô thường của môn khác thì môn chủ hoặc trưởng lão ra lệnh. Mỗi lúc môn chỉ có một lệnh xuất chinh; môn chủ, trưởng lão rút quân được trong lúc tập hợp.', 'Can disciples order a march?', 'Yes, on beast tiles, and on Spirit Veins or the Heaven Pool held by another sect. Sects that have claimed all their free tiles can still fight beasts: win and you keep it. Ordinary enemy tiles need the master or an elder. One march at a time; the master and elders can call it off while gathering.'],
  ['Thú triều là gì?', 'Thứ Tư và thứ Bảy, từ 8 giờ tới 22 giờ, cứ 2 giờ yêu thú đánh một đợt, mạnh thêm 30% và đánh nhiều ô hơn. Môn mạnh nên chia người đứng giữ các ô gần ổ yêu, hoặc rủ môn bên cạnh cùng diệt ổ yêu trước.', 'What is the beast tide?', 'Wednesdays and Saturdays, 8:00 to 22:00, beasts raid every 2 hours, 30% stronger and on more tiles. Strong sects should spread guards near the dens, or team up with neighbours to clear dens early.'],
  ['Linh Mạch có cạn không?', 'Có. Mỗi Linh Mạch có trữ lượng 120 điểm. Môn giữ mạch được +3 điểm mỗi giờ và mạch hao đi 3, nên giữ liền chừng 40 giờ là cạn. Cạn thì ô thành ô thường (môn vẫn giữ ô), linh khí dời tới một ô trống khác, chưa từng có mạch trong Kỷ này. Mạch mới dời nằm ẩn, phải trinh sát mới thấy. Chạm ô Linh Mạch để xem trữ lượng còn bao nhiêu.', 'Do Spirit Veins run dry?', 'Yes. Each vein holds 120 points. The holder gets +3 per hour and the vein loses 3, so about 40 hours of holding drains it. Then the tile becomes ordinary (the sect keeps it) and the vein moves to another empty tile that has not had one this era. A moved vein is hidden until scouted. Tap a vein to see what is left.'],
  ['Sao không thấy Linh Mạch mới?', 'Linh Mạch mới sinh nằm ẩn trên bản đồ. Chạm một ô trống hay ô yêu thú rồi bấm Trinh sát tìm mạch. Có mạch thì kết quả ghi "Có Linh Mạch", môn ta thấy mạch đó tới hết Kỷ; môn khác chưa trinh sát thì vẫn không thấy. Mạch nằm trên đất của môn ta thì môn ta luôn thấy. Thiên Trì thì ai cũng thấy.', 'Why can I not see new Spirit Veins?', 'New Spirit Veins are hidden on the map. Tap an empty or beast tile and press Scout for a vein. If there is one the report says "Spirit Vein here", and our sect sees it until the era ends; other sects do not until they scout it. Veins on our own land are always visible. Everyone sees the Heaven Pool.'],
  ['Sao không đánh được môn kia?', 'Hai lý do. Môn đó yếu hơn 1/3 môn ta: không được bắt nạt, trừ khi họ giữ Linh Mạch hay Thiên Trì. Hoặc môn ta vừa thắng họ: 12 giờ sau mới đánh tiếp được. Ô đó ghi rõ lý do ngay trên nút.', 'Why can I not attack that sect?', 'Two reasons. They are under a third of our strength: no bullying, except on Spirit Veins and the Heaven Pool. Or we just beat them: wait 12 hours. The tile shows the reason above the button.'],
  ['Mỗi ngày ta phải làm gì?', 'Điểm danh, rồi chơi kiếp như thường: 3 nhiệm vụ tự xong khi kiếp khép lại. Chọn sẵn một ô để đứng giữ. Chừng 2-3 phút.', 'What do I do each day?', 'Check in, then play lives as usual: the 3 tasks complete when a life ends. Pick a tile to guard. About 2-3 minutes.'],
  ['Khí vận để làm gì?', 'Cả môn góp đủ 30 Khí vận trong ngày thì ngày mai môn mạnh hơn 10%, đủ 50 thì mạnh hơn 20%. Khí vận không phải tiền, không tiêu, 5:00 sáng tính lại từ đầu.', 'What is Fortune for?', 'If the sect gathers 30 Fortune in a day, it is 10% stronger tomorrow; 50 makes it 20% stronger. Fortune is not money; it resets at 5:00 AM.'],
  ['Lực chiến là gì?', 'Sức của riêng ngươi. Chỉ lên khi chơi kiếp: sống lâu, nhiều kiếp, cảnh giới cao, nhiều kết cục, khai huyệt. Không mua được.', 'What is Power?', 'Your own strength. It only grows by playing: long lives, many lives, high realms, endings, opened points. It cannot be bought.'],
  ['Mở rộng đất thế nào?', 'Khai hoang: chạm một ô trống có dấu + (kề đất của môn) rồi bấm Khai hoang, cờ cắm ngay, không phải đánh ai. Ai trong môn cũng làm được. Khai hoang tối đa 1 ô cộng thêm 1 ô cho mỗi 3 người (15 người khai hoang được 6 ô). Đất giành bằng xuất chinh thì giữ luôn, tới gấp đôi mức đó (15 người giữ được 12 ô); vượt nữa mới phải bỏ ô xa chính điện nhất. Đất mới chưa ai đứng giữ thì nhớ cử người sang.', 'How do we expand?', 'Claim: tap an empty tile marked + (next to your land) and press Claim; the flag goes up at once, no fighting. Any member can do it. Free claims go up to 1 tile plus 1 per 3 members (15 members claim 6). Land won by marching is kept, up to double that (15 members hold 12); beyond that you leave the tile farthest from the main hall. Send someone to guard new land.'],
  ['Đánh nhau thế nào?', 'Chỉ cần khi muốn giành ô đã có môn khác giữ. Môn chủ hoặc trưởng lão chọn một ô sát đất của môn rồi ra lệnh. Mọi người có 30 phút bấm Theo, sau đó quân lên đường. Tới nơi, bên nào tổng Lực chiến lớn hơn thì thắng, không có may rủi. Bên giữ có lợi thế sân nhà, ban đêm (0-7 giờ) còn mạnh gấp đôi.', 'How do battles work?', 'The master or an elder picks a tile next to your land and calls a march. Everyone has 30 minutes to tap Follow, then the army sets out. On arrival, the side with more total Power wins, no luck involved. Defenders get a home bonus, doubled at night (0-7 AM).'],
  ['Vắng mặt thì sao?', 'Ngươi vẫn đứng giữ ô đã chọn và vẫn được tính khi môn bị đánh.', 'What if I am offline?', 'You still guard your tile and still count when it is attacked.'],
  ['Thua thì mất gì?', 'Không mất đồ, không mất linh thạch. Đi đánh mà thua: người đi theo nghỉ 2 giờ, rồi bị trọng thương, Lực chiến giảm một thời gian. Thua lần đầu trong ngày: -10% thêm 1 giờ. Lần 2: -30% thêm 3 giờ. Từ lần 3: -50% tới 5:00 sáng. Thẻ người và màn Xuất chinh ghi rõ giờ hồi; 5:00 sáng mọi người hồi hết, đếm lại từ đầu. Bị đánh mà thua: môn mất ô đó, người giữ ô ấy về chính điện. Mất hết đất thì môn được cắm cờ lại ở một ô trống bất kỳ, có 12 giờ không ai đánh được.', 'What do I lose if we lose?', 'No items, no spirit stones. Lose an attack: those who followed rest 2 hours, then are wounded and fight weaker for a while. First loss of the day: -10% power for 1 more hour. Second: -30% for 3 hours. Third and later: -50% until 5:00 AM. Member cards and the March screen show when it heals; everyone heals at 5:00 AM and the count restarts. Lose a defence: the sect loses that tile and its guards return to the main hall. Lose all land and the sect can plant a flag on any empty tile, safe for 12 hours.'],
  ['Bỏ ô thế nào?', 'Môn chủ hoặc trưởng lão chạm một ô của môn trên bản đồ rồi bấm Bỏ ô, xác nhận một lần. Ô về trống, người đứng giữ ở đó về chính điện, chiến báo ghi lại. Chính điện và ô đang có quân hay yêu thú kéo tới thì không bỏ được. Môn đủ ô mà chiếm thêm thì vẫn tự bỏ ô xa chính điện nhất như cũ.', 'How do we give up a tile?', 'The master or an elder taps one of the sect tiles on the map, presses Give up and confirms once. The tile becomes empty, its guards return to the main hall, and the war log notes it. The main hall and tiles with troops or beasts on the way cannot be given up. A sect at its limit that takes a new tile still drops the farthest one automatically.'],
  ['Đất đứt mạch là gì?', 'Đất của môn phải liền với chính điện qua các ô kề nhau. Mất hay bỏ một ô mà có ô bị tách khỏi chính điện thì ô đó về trống, người giữ ở đó về chính điện, chiến báo ghi "Đất đứt mạch". Linh Mạch, Thiên Trì, ô yêu thú đã chiếm cũng vậy. Mở đất thành khối và giữ chắc các ô nối thì khỏi mất oan.', 'What is a cut-off?', 'Sect land must connect to the main hall through neighbouring tiles. If losing or dropping a tile leaves others cut off from the hall, those tiles become empty, their guards return to the hall, and the war log says "Land cut off". Spirit Veins, the Heaven Pool and captured beast tiles too. Grow in a block and guard the linking tiles.'],
  ['Hết Kỷ thì sao?', '21:00 ngày 1/12, môn nhiều Điểm giữ đất nhất xếp hạng nhất (bằng điểm thì xét số ô rồi tổng Khí vận cả Kỷ). Môn hạng 1 được khắc tên vào Sổ Sinh Tử, hạng 2-3 có khung vàng, các môn còn nhận pháp bảo (câu dưới). Sau đó mọi ô về trống, tên môn và người trong môn giữ nguyên.', 'What happens when the era ends?', 'At 9 PM on Dec 1, the sect with the most land points ranks first (ties: tiles, then total Fortune). The top sect is carved into the Book of Life and Death, ranks 2-3 get a gold frame, and sects also receive treasures (see below). Then all tiles empty out; sect names and members stay.'],
  ['Phần thưởng Kỷ là gì?', 'Pháp bảo Sơn Môn, phát một lần lúc kết Kỷ (21:00 ngày 1/12), không phát trong Kỷ. Môn hạng 1 nhận Thần phẩm, hạng 2 Tiên phẩm, hạng 3 Linh phẩm, hạng 4-10 Bảo phẩm, còn lại Phàm phẩm. Trong mỗi môn, 7 người nhiều Công nhất nhận vũ khí: hạng 1 cầm kiếm, hạng 2 đao, cứ thế tới song chùy. Môn chủ nhận thêm ấn. Công có từ điểm danh, nhiệm vụ, khai hoang, theo xuất chinh và đứng giữ ô, cần từ 10 Công. Pháp bảo có chỉ số (Công, Thủ, Máu, Bạo kích) như đồ trong Mộng, dùng mãi không mất tác dụng. Lắp vào ô Vũ khí, Phụ kiện của chân thân để cộng Lực chiến chân thân; chưa đổi trận trong kiếp.', 'What are the era rewards?', 'Sect treasures, handed out once when the era ends (Dec 1, 9 PM), not during it. The top sect gets Divine grade, 2nd Immortal, 3rd Spirit, 4th-10th Treasure, the rest Mortal. In each sect, the 7 members with the most merit get weapons: #1 a sword, #2 a saber, and so on to twin maces. The leader also gets a seal. Merit comes from check-ins, tasks, claiming land, joining marches and guarding tiles; 10 merit is the minimum. Treasures carry stats (Attack, Defense, HP, Crit) like dream gear and never expire. Equip them in the Weapon and Trinket slots of your true self to raise its power; lives are not affected yet.'],
  ['Truyền âm là gì?', 'Chỗ trò chuyện của riêng môn, chỉ người trong môn đọc được. Link và số điện thoại tự ẩn, lời tục bị che. Thấy tin xấu thì chạm vào tin rồi bấm Báo xấu; môn chủ và trưởng lão ẩn được tin.', 'What is sect chat?', 'A chat only your sect can read. Links and phone numbers are hidden, swearing is masked. Tap a bad message and press Report; the master and elders can hide messages.'],
  ['Môn mới có bị đánh ngay không?', 'Không ngay. Ô cắm cờ được bảo hộ 48 giờ. Ô chiếm thêm được bảo hộ ngắn dần tính từ lúc chiếm: ô thứ 2 được 24 giờ, ô 3 được 12 giờ, ô 4 được 6 giờ, từ ô 5 thì không, và không ô nào quá mốc 48 giờ. Tự đi đánh ô có chủ thì mất hết bảo hộ ngay.', 'Can a new sect be attacked right away?', 'Not at once. The flag tile is protected for 48 hours. Each later tile gets less, counted from when it is taken: 24 hours for the 2nd, 12 for the 3rd, 6 for the 4th, none from the 5th, never past the 48-hour mark. Attacking an owned tile ends all protection at once.'],
  ['Giữ ô thế nào?', 'Mỗi ô chỉ tính sức những người đang đứng giữ ô đó. Môn chủ và trưởng lão xếp người vào từng ô, ai cũng tự đổi ô được. Sang ô khác mất 20 phút mỗi ô đường đi, trong lúc đi không giữ ô nào. Chiếm thêm ô thì phải chia người ra giữ. Ô không ai đứng vẫn có hộ sơn trận giữ hộ, sức bằng 1,5 người cỡ trung bình của môn (có cả sân nhà, đêm gấp đôi): một người lẻ khó lấy trắng, nhưng 2-3 người thì được.', 'How do I guard?', 'Each tile only counts the people standing on it. The master and elders assign people to tiles, and anyone can move. Moving takes 20 minutes per tile, and you guard nothing on the way. More tiles means spreading people out. Unguarded tiles still have a sect ward worth 1.5 average members (home bonus included, doubled at night): one raider alone struggles, but 2-3 can take it.'],
  ['Môn ta có bị nuốt mất không?', 'Không. Chính điện của môn không bị đánh, nên môn luôn còn ít nhất một ô. Một môn thắng môn ta thì 12 giờ sau mới đánh tiếp môn ta được. Môn bị mất từ 2 ô trở lên trong 12 giờ (kể cả ô đứt mạch) thì các ô còn lại được bảo hộ 6 giờ để kịp xếp người. Điểm đã có không bao giờ mất.', 'Can our sect be swallowed?', 'No. Main halls cannot be attacked, so a sect always keeps at least one tile. A sect that beats us must wait 12 hours to attack us again. Lose 2 or more tiles within 12 hours (cut-offs included) and the rest are protected for 6 hours so you can regroup. Points already earned are never lost.'],
  ['Đánh môn yếu hơn nhiều thì sao?', 'Môn bị đánh có tổng Lực chiến dưới một nửa môn ta thì thắng chỉ đuổi được người giữ: ô về trống, không về tay ta, không có điểm chiếm. Linh Mạch và Thiên Trì thì vẫn giành như thường. Môn yếu hơn 1/3 thì không đánh được (trừ Linh Mạch, Thiên Trì). Màn xuất chinh báo trước nếu gặp trường hợp này.', 'What about attacking a much weaker sect?', 'If the target sect has under half our total Power, winning only drives off the guards: the tile becomes empty, not ours, and gives no capture points. Spirit Veins and the Heaven Pool are taken as usual. Sects under a third of ours cannot be attacked (except on veins and the Pool). The March screen warns you first.'],
  ['Môn chủ không online thì sao?', 'Môn chủ vắng mặt 48 giờ (không chơi, không điểm danh, không mở Sơn Môn, không nhắn Truyền âm) thì ai trong môn cũng mở được cuộc bầu môn chủ mới ở tab Thành viên. Bầu trong 24 giờ, mỗi người 1 phiếu. Ai được quá nửa thì lên ngay, hết giờ thì người nhiều phiếu nhất lên. Môn chủ quay lại trong lúc bầu thì bầu hủy.', 'What if the leader is never online?', 'If the leader is away for 48 hours (no play, no check-in, no sect visit, no chat), anyone in the sect can start a leader vote in the Members tab. It runs 24 hours, one vote each. A majority wins at once; otherwise the most votes win when time is up. If the leader returns, the vote is cancelled.'],
  ['Rời môn được không?', 'Được. Nhưng môn đã cắm cờ mà ngươi tự rời thì phải chờ 12 giờ mới vào môn khác, 24 giờ mới lập môn mới. Bị đuổi thì vào môn khác được ngay.', 'Can I leave?', 'Yes. But if you leave a sect that has planted its flag, you wait 12 hours to join another and 24 hours to found one. If expelled, you can join one at once.'],
];

export function SmLuat({ c }: { c: SmCtx }) {
  const [mo, setMo] = useState<number | null>(0);
  return (
    <>
      <button className="sm-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => c.go(c.st.mon ? 'mon' : 'list')}>
        ‹ {c.st.mon ? tr('Về môn', 'Back to sect') : tr('Danh sách môn', 'Sect list')}
      </button>
      <section className="sm-card dark">
        <h2>{tr('Luật Sơn Môn', 'Sect rules')}</h2>
        <p>{tr('Chơi kiếp góp Khí vận. Khí vận làm môn mạnh. Môn mạnh thì giữ được đất. Giữ đất mỗi giờ được Điểm. Hết Kỷ, môn nhiều Điểm nhất thắng.', 'Play lives to add Fortune. Fortune makes the sect strong. A strong sect holds land. Land earns points every hour. Most points wins the era.')}</p>
      </section>
      {HOI.filter(([h]) => (h !== 'Môn mới có bị đánh ngay không?' || smCo(c.st).bh) && (h !== 'Giữ ô thế nào?' || smCo(c.st).di)).map(([h, d, he, de], i) => (
        <section key={h} className="sm-card sm-hoi">
          <button className="sm-hoi-q" aria-expanded={mo === i} onClick={() => setMo(mo === i ? null : i)}>
            <span>{tr(h, he)}</span>
            <b aria-hidden="true">{mo === i ? '−' : '+'}</b>
          </button>
          {mo === i && <p>{tr(d, de)}</p>}
        </section>
      ))}
      <button className="sm-btn small" onClick={() => c.go('luc-chien')}>
        {tr('Lực chiến tính chi tiết thế nào', 'Power in detail')}
      </button>
    </>
  );
}
