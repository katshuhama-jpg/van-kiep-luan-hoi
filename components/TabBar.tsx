'use client';

/**
 * 4.6.0 Ngày 5: thanh 4 tab (Mộng · Nhân vật · Sơn Môn · Lôi đài) và thanh trên có nút Mời trà + Menu.
 * Cờ riêng TAB_ON (bật mặc định, tắt gấp bằng NEXT_PUBLIC_TAB=0 thì về menu cũ). KHÔNG phụ thuộc SON_MON_ON.
 * Biểu tượng vẽ pixel bằng lưới ô vuông (không emoji, không gradient).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import LangToggle from './LangToggle';
import MusicToggle from './MusicToggle';
import { CURRENT_VERSION } from '@/lib/releases';
import { FB_PAGE } from '@/lib/links';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import { displayName } from '@/lib/storage';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';

export type TabId = 'mong' | 'nv' | 'sm' | 'ld';

/** lưới 11x11, '#' là ô tô */
const ICON: Record<TabId, string[]> = {
  mong: ['....###....', '..##.......', '.##........', '.#.........', '##.........', '##.........', '##.......#.', '.##.....##.', '.###..###..', '..######...', '....###....'],
  nv: ['....###....', '...#####...', '...#####...', '....###....', '..#######..', '.#.#####.#.', '.#.#####.#.', '...#####...', '...##.##...', '...##.##...', '..###.###..'],
  sm: ['.....#.....', '.....##....', '.....###...', '.....#.....', '....###....', '...#####...', '...#####.#.', '..#######.#', '.#########.', '###########', '###########'],
  ld: ['#.........#', '.#.......#.', '..#.....#..', '...#...#...', '....#.#....', '.....#.....', '....#.#....', '.##.....##.', '.##.....##.', '##.......##', '#.........#'],
};

function PxIcon({ id }: { id: TabId }) {
  const rows = ICON[id];
  return (
    <svg width="22" height="22" viewBox="0 0 11 11" aria-hidden="true" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {rows.flatMap((r, y) => [...r].map((ch, x) => (ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null)))}
    </svg>
  );
}

const TABS: { id: TabId; href: string; vi: string; en: string }[] = [
  { id: 'mong', href: '/', vi: 'Mộng', en: 'Dream' },
  { id: 'nv', href: '/chan-than', vi: 'Nhân vật', en: 'Character' },
  { id: 'sm', href: '/son-mon', vi: 'Sơn Môn', en: 'Sects' },
  { id: 'ld', href: '/loi-dai', vi: 'Lôi đài', en: 'Arena' },
];

const HINT_KEY = 'vkl.tabHint';

/** người cũ: máy này đã có hồ sơ chơi ít nhất một kiếp */
function oldPlayer(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (k !== 'vkl.meta' && !k.startsWith('vkl.meta.u.')) continue;
      const m = JSON.parse(localStorage.getItem(k) ?? 'null') as { lives?: number } | null;
      if ((m?.lives ?? 0) > 0) return true;
    }
  } catch {}
  return false;
}

export function TabBar({ cur }: { cur: TabId }) {
  const [hint, setHint] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY) && oldPlayer()) setHint(true);
      else if (!localStorage.getItem(HINT_KEY)) localStorage.setItem(HINT_KEY, 'new');
    } catch {}
  }, []);
  const closeHint = () => {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {}
    track('tab_hint_ok');
  };
  return (
    <>
      {hint && (
        <div className="tab-hint" role="status">
          <p>
            <b>{tr('Bố cục mới. ', 'New layout. ')}</b>
            {tr('Đầu thai và túi đồ ở Mộng, chân thân ở Nhân vật, bảng xếp hạng ở Lôi đài. Góp ý, Cập nhật nằm trong nút Menu ở góc trên.', 'Rebirth and your bag are in Dream, your true self in Character, the leaderboard in Arena. Feedback and Updates are in the Menu button at the top.')}
          </p>
          <button className="btn tab-hint-ok" onClick={closeHint}>
            {tr('Đã hiểu', 'Got it')}
          </button>
        </div>
      )}
      <nav className="tabbar" aria-label={tr('Tab chính', 'Main tabs')}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`tab-item${t.id === cur ? ' on' : ''}`}
            aria-current={t.id === cur ? 'page' : undefined}
            onClick={() => t.id !== cur && track('tab_open', { tab: t.id, from: cur })}
          >
            <PxIcon id={t.id} />
            <span>{tr(t.vi, t.en)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

/** thanh trên: Mời trà luôn thấy, các mục phụ (Cập nhật, Góp ý, Facebook, ngôn ngữ, nhạc) trong Menu */
export function TopMenu({ at }: { at: TabId }) {
  const [open, setOpen] = useState(false);
  const { user, ready, enabled } = useAuth();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);
  return (
    <div className="top-menu">
      <Link href="/moi-tra" className="btn top-tra" onClick={() => track('tra_open', { from: `top_${at}` })}>
        {tr('Mời trà', 'Buy tea')}
      </Link>
      <button className="btn top-menu-btn" aria-label={tr('Menu', 'Menu')} aria-expanded={open} onClick={() => (setOpen(true), track('menu_open', { at }))}>
        <span aria-hidden="true">≡</span> {tr('Menu', 'Menu')}
      </button>
      {open && (
        <div className="drawer-bg" onClick={() => setOpen(false)}>
          <nav className="drawer" aria-label={tr('Menu phụ', 'More')} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <b>{tr('Vạn Kiếp Luân Hồi', 'Ten Thousand Rebirths')}</b>
              <button className="btn drawer-x" aria-label={tr('Đóng menu', 'Close menu')} onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <Link href="/cap-nhat" className="drawer-row">
              {tr('Cập nhật', 'Updates')} <small className="ver-tag">{CURRENT_VERSION}</small>
            </Link>
            <Link href="/gop-y" className="drawer-row">
              {tr('Góp ý', 'Feedback')}
            </Link>
            <a href={FB_PAGE} target="_blank" rel="noopener noreferrer" className="drawer-row" onClick={() => track('fb_open', { from: 'menu' })}>
              {tr('Trang Facebook', 'Facebook page')}
            </a>
            <Link href="/moi-tra" className="drawer-row drawer-tra" onClick={() => track('tra_open', { from: 'menu' })}>
              {tr('Mời tác giả chén trà', 'Buy the author a tea')}
            </Link>
            <div className="drawer-row drawer-ctl">
              <LangToggle />
              <MusicToggle />
            </div>
            {ready && enabled && !user && (
              <Link href="/dang-nhap" className="drawer-row">
                {tr('Đăng nhập / Đăng ký', 'Log in / Sign up')}
              </Link>
            )}
            <div className="drawer-foot">
              <Link href="/tac-gia">{tr('Tác giả hình ảnh', 'Art credits')}</Link> · <Link href="/chinh-sach">{tr('Quyền riêng tư', 'Privacy')}</Link> · <Link href="/dieu-khoan">{tr('Điều khoản', 'Terms')}</Link>
            </div>
            {user && (
              <div className="drawer-foot">
                {tr('Đạo hữu ', 'Fellow Daoist ')}
                <b>{displayName(user)}</b>
                <button className="btn drawer-out" onClick={() => (setOpen(false), signOut())}>
                  {tr('Đăng xuất', 'Log out')}
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
