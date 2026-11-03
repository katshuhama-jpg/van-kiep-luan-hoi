'use client';
/**
 * Bản thứ Năm 5/11: "Hành trang kiếp sau" ở ngay đầu màn chết.
 * Người chơi hay tắt game ngay sau khi chết; thẻ này cho thấy liền những gì kiếp sau được mang theo,
 * từng món hiện ra lần lượt như mở bọc hành lý, để có lý do bấm luân hồi.
 */
import type { Character, Meta } from '@/lib/game/types';
import { ITEMS, TALENTS } from '@/lib/game/data';
import { heirChoices } from '@/lib/game/congPhap';
import { isHidden } from '@/lib/game/collect';
import { tr } from '@/lib/i18n';
import ItemIconImg from './ItemIcon';

export interface HanhTrangProps {
  c: Character;
  meta: Meta;
  phuc: number; // phúc duyên kiếp này góp thêm (kể cả nhiệm vụ ngày)
  nghiep: number;
  isNew: boolean; // kết cục mới mở
  endingName: string;
  legend?: string | null; // thần binh truyền lại (nếu đang chọn)
  stash?: { money: number; item?: string | null } | null; // rương chôn (nếu đang chọn)
}

function Icon({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/icons/${src}.png`} width={34} height={34} alt="" className="px-icon" />;
}

export function HanhTrang({ c, meta, phuc, nghiep, isNew, endingName, legend, stash }: HanhTrangProps) {
  const total = meta.phucDuyen + phuc;
  const buy = [...TALENTS].filter((t) => !t.ta && t.cost <= total && !meta.talents.includes(t.id)).sort((a, b) => b.cost - a.cost)[0];
  const heirs = heirChoices(c);
  const heir = heirs.find((d) => d.id === c.cpHeirPick) ?? heirs[0];
  const book = new Set(meta.itemBook ?? []);
  const newItems = [...new Set([...c.inventory, ...Object.values(c.equipped).filter((x): x is string => !!x)])].filter((id) => !book.has(id) && isHidden(id));
  const cpBook = new Set(meta.cpBook ?? []);
  const newCp = (c.cp?.own ?? []).filter((o) => !cpBook.has(o.id)).length;
  const rows: { k: string; icon: React.ReactNode; b: string; s: string; hot?: boolean }[] = [];
  rows.push({
    k: 'phuc',
    icon: <Icon src="tien_tich_ngoc_phu" />,
    b: tr(`+${phuc} phúc duyên`, `+${phuc} Fortune`),
    s: buy ? tr(`Đang có ${total}, đủ mua thiên phú ${buy.name}`, `You'll have ${total}, enough for the ${buy.name} talent`) : tr(`Đang có ${total}, để dành mua thiên phú lúc đầu thai`, `You'll have ${total}, saved for talents at rebirth`),
    hot: true,
  });
  if (nghiep > 0) rows.push({ k: 'nghiep', icon: <Icon src="huyet_sat" />, b: tr(`+${nghiep} nghiệp lực`, `+${nghiep} Karma`), s: tr('Mua được thiên phú tà đạo', 'Buys evil-path talents') });
  if (heir)
    rows.push({ k: 'cp', icon: <Icon src="g_kinh_thu_tan_quyen" />, b: tr(`Truyền thừa: ${heir.name}`, `Inheritance: ${heir.name}`), s: tr('Kiếp sau sinh ra đã biết chiêu này', 'Your next life is born knowing this move'), hot: true });
  else if ((c.cp?.own ?? []).some((o) => o.tang >= 6))
    rows.push({ k: 'cp0', icon: <Icon src="g_kinh_thu_tan_quyen" />, b: tr('Chưa có chiêu viên mãn', 'No perfected move yet'), s: tr('Luyện một chiêu tới tầng 9 là truyền được cho kiếp sau', 'Raise a move to stage 9 to pass it on') });
  if (legend) rows.push({ k: 'legend', icon: <ItemIconImg item={ITEMS.find((i) => i.id === c.equipped.vu_khi)} size={34} />, b: tr(`Thần binh: ${legend}`, `Divine weapon: ${legend}`), s: tr('Đi theo bạn sang kiếp sau, mạnh dần mỗi đời', 'Follows you into the next life, stronger every generation'), hot: true });
  if (stash)
    rows.push({
      k: 'stash',
      icon: stash.item ? <ItemIconImg item={ITEMS.find((i) => i.id === stash.item)} size={34} /> : <Icon src="van_co_bao" />,
      b: tr(`Rương chôn: ${stash.money} linh thạch${stash.item ? ` và ${ITEMS.find((i) => i.id === stash.item)?.name ?? ''}` : ''}`, `Buried chest: ${stash.money} spirit stones${stash.item ? ` and ${ITEMS.find((i) => i.id === stash.item)?.name ?? ''}` : ''}`),
      s: tr('Kiếp sau đào lên được', 'Your next life can dig it up'),
    });
  if (isNew) rows.push({ k: 'end', icon: <Icon src="phan_quan_but" />, b: tr(`Kết cục mới: ${endingName}`, `New ending: ${endingName}`), s: tr('Ghi vào Sổ Sinh Tử, giữ mãi', 'Written into the Book of Life and Death forever'), hot: true });
  if (newItems.length) rows.push({ k: 'items', icon: <Icon src="van_co_bao" />, b: tr(`${newItems.length} món mới vào Bảo khố`, `${newItems.length} new items in the Treasury`), s: tr('Bảo khố giữ qua mọi kiếp', 'The Treasury keeps them across lives') });
  if (newCp) rows.push({ k: 'cpbook', icon: <Icon src="g_kinh_thu_tan_quyen" />, b: tr(`${newCp} công pháp mới vào sổ`, `${newCp} new techniques in your book`), s: tr('Bóng kiếp trước sẽ rơi tàn quyển các bộ này', 'Past-life shadows will drop fragments of these') });
  return (
    <div className="hanh-trang" aria-label={tr('Hành trang kiếp sau', 'Baggage for the next life')}>
      <b className="ht-title">{tr('Hành trang kiếp sau', 'Carried into your next life')}</b>
      <ul>
        {rows.map((r, i) => (
          <li key={r.k} className={r.hot ? 'hot' : ''} style={{ animationDelay: `${0.15 + i * 0.22}s` }}>
            <span className="ht-ico">{r.icon}</span>
            <span className="ht-txt">
              <b>{r.b}</b>
              <small>{r.s}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
