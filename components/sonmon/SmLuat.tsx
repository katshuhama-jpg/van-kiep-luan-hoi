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
        <li>{tr('Chơi kiếp như thường. Điểm danh và nhiệm vụ góp Khí vận cho môn.', 'Play lives as usual. Check-ins and tasks add Fortune to your sect.')}</li>
        <li>{tr('Khí vận cao thì ngày mai môn mạnh hơn khi đánh và giữ đất.', 'High Fortune makes the sect stronger tomorrow, attacking and defending.')}</li>
        <li>{tr('Hết Kỷ (21:00 ngày 1/12), môn chiếm nhiều ô đất nhất thắng.', 'When the era ends (Dec 1, 9 PM), the sect holding the most land wins.')}</li>
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
  ['Mỗi ngày ta phải làm gì?', 'Điểm danh, rồi chơi kiếp như thường: 3 nhiệm vụ tự xong khi kiếp khép lại. Chọn sẵn một ô để đứng giữ. Chừng 2-3 phút.', 'What do I do each day?', 'Check in, then play lives as usual: the 3 tasks complete when a life ends. Pick a tile to guard. About 2-3 minutes.'],
  ['Khí vận để làm gì?', 'Cả môn góp đủ 30 Khí vận trong ngày thì ngày mai môn mạnh hơn 10%, đủ 50 thì mạnh hơn 20%. Khí vận không phải tiền, không tiêu, 5:00 sáng tính lại từ đầu.', 'What is Fortune for?', 'If the sect gathers 30 Fortune in a day, it is 10% stronger tomorrow; 50 makes it 20% stronger. Fortune is not money; it resets at 5:00 AM.'],
  ['Lực chiến là gì?', 'Sức của riêng ngươi. Chỉ lên khi chơi kiếp: sống lâu, nhiều kiếp, cảnh giới cao, nhiều kết cục, khai huyệt. Không mua được.', 'What is Power?', 'Your own strength. It only grows by playing: long lives, many lives, high realms, endings, opened points. It cannot be bought.'],
  ['Đánh nhau thế nào?', 'Môn chủ hoặc trưởng lão chọn một ô sát đất của môn rồi ra lệnh. Mọi người có 30 phút bấm Theo, sau đó quân lên đường. Tới nơi, bên nào tổng Lực chiến lớn hơn thì thắng, không có may rủi. Bên giữ có lợi thế sân nhà, ban đêm (0-7 giờ) còn mạnh gấp đôi.', 'How do battles work?', 'The master or an elder picks a tile next to your land and calls a march. Everyone has 30 minutes to tap Follow, then the army sets out. On arrival, the side with more total Power wins, no luck involved. Defenders get a home bonus, doubled at night (0-7 AM).'],
  ['Vắng mặt thì sao?', 'Ngươi vẫn đứng giữ ô đã chọn và vẫn được tính khi môn bị đánh.', 'What if I am offline?', 'You still guard your tile and still count when it is attacked.'],
  ['Thua thì mất gì?', 'Không mất đồ, không mất linh thạch. Đi đánh mà thua: người đi theo nghỉ 2 giờ. Bị đánh mà thua: môn mất ô đó, người giữ ô ấy về chính điện. Mất hết đất thì môn được cắm cờ lại ở một ô trống bất kỳ, có 12 giờ không ai đánh được.', 'What do I lose if we lose?', 'No items, no spirit stones. Lose an attack: those who followed rest 2 hours. Lose a defence: the sect loses that tile and its guards return to the main hall. Lose all land and the sect can plant a flag on any empty tile, safe for 12 hours.'],
  ['Hết Kỷ thì sao?', '21:00 ngày 1/12, môn nào đang chiếm nhiều ô đất nhất xếp hạng nhất (bằng nhau thì xét tổng Khí vận cả Kỷ). Thưởng chỉ để ngắm. Sau đó mọi ô về trống, tên môn và người trong môn giữ nguyên.', 'What happens when the era ends?', 'At 9 PM on Dec 1, the sect holding the most land ranks first (ties go to total Fortune). Rewards are cosmetic. Then all tiles empty out; sect names and members stay.'],
  ['Truyền âm là gì?', 'Chỗ trò chuyện của riêng môn, chỉ người trong môn đọc được. Link và số điện thoại tự ẩn, lời tục bị che. Thấy tin xấu thì chạm vào tin rồi bấm Báo xấu; môn chủ và trưởng lão ẩn được tin.', 'What is sect chat?', 'A chat only your sect can read. Links and phone numbers are hidden, swearing is masked. Tap a bad message and press Report; the master and elders can hide messages.'],
  ['Môn mới có bị đánh ngay không?', 'Không. Môn vừa cắm cờ được bảo hộ 48 giờ, không môn nào đánh được ô của môn đó. Môn mới vẫn chiếm ô trống thoải mái, nhưng tự đi đánh ô có chủ thì mất bảo hộ ngay.', 'Can a new sect be attacked right away?', 'No. A sect that just planted its flag is protected for 48 hours. It can still take empty tiles, but attacking an owned tile ends its protection at once.'],
  ['Giữ ô thế nào?', 'Mỗi ô chỉ tính sức những người đang đứng giữ ô đó. Môn chủ và trưởng lão xếp người vào từng ô, ai cũng tự đổi ô được. Sang ô khác mất 20 phút mỗi ô đường đi, trong lúc đi không giữ ô nào. Chiếm thêm ô thì phải chia người ra giữ.', 'How do I guard?', 'Each tile only counts the people standing on it. The master and elders assign people to tiles, and anyone can move. Moving takes 20 minutes per tile, and you guard nothing on the way. More tiles means spreading people out.'],
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
        <p>{tr('Chơi kiếp góp Khí vận. Khí vận làm môn mạnh. Môn mạnh thì giữ được đất. Hết Kỷ, môn nhiều đất nhất thắng.', 'Play lives to add Fortune. Fortune makes the sect strong. A strong sect holds land. Most land wins the era.')}</p>
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
