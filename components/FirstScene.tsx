'use client';
/**
 * Ngày 7 (19/11): màn đầu "Cảnh sống" cho người chưa có kiếp nào (hướng A, mẫu docs/design/man-dau/A-canh-song.png).
 * Cảnh pixel trôi ngang, nhân vật của lá số đi giữa màn, hộp thoại gõ câu chào đời, nút "Sống kiếp này" tự vào sau 4 giây.
 * Người đến từ quảng cáo (utm_medium=paid) có thêm dòng dẫn của hướng C phía trên cảnh.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Sprite from './Sprite';
import { FAMILY_TIERS } from '@/lib/game/data';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';

export const AUTO_SEC = 4;

/** câu điềm lạ ngày chào đời, chọn theo tên để gieo lại thì đổi câu */
const OMENS: (() => string)[] = [
  () => tr('Bà đỡ bảo: đứa này khóc to như sấm, sau này không ở yên được đâu.', 'The midwife says: this one cries like thunder, it will never sit still.'),
  () => tr('Đêm ấy trên mái nhà có tiếng chim lạ, cả xóm không ai ngủ được.', 'That night a strange bird sang on the roof, and nobody in the village slept.'),
  () => tr('Thầy bói xem tay đứa nhỏ rất lâu, rồi đi mà không lấy tiền.', 'The fortune-teller studied the baby\'s palm for a long time, then left without taking any money.'),
  () => tr('Ngoài sân, cây đào trái mùa bỗng nở một cành.', 'Out in the yard, the peach tree put out one branch of blossoms, out of season.'),
  () => tr('Đứa nhỏ không khóc, chỉ mở mắt nhìn trời như đang cố nhớ ra điều gì.', 'The baby did not cry. It just stared at the sky, as if trying to remember something.'),
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function birthLine(c: Character) {
  const kid = c.gender === 'nam' ? tr('một bé trai', 'a baby boy') : tr('một bé gái', 'a baby girl');
  return tr(`Năm ấy ${kid} chào đời ở ${c.birthPlace}. `, `That year ${kid} was born in ${c.birthPlace}. `) + OMENS[hash(c.name) % OMENS.length]();
}

/** dòng dẫn trên cảnh: người đến từ quảng cáo thấy câu của hướng C */
function leadOf(): string | null {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('utm_medium') === 'paid' || q.get('utm_source') === 'fb' || q.get('fbclid')) return tr('Ngươi đã chết 40 lần. Mà chưa nhớ ra mình là ai.', 'You have died 40 times. And you still do not remember who you are.');
  } catch {}
  return null;
}

export default function FirstScene({ c, onRoll, onBorn, busy, invite }: { c: Character; onRoll: () => void; onBorn: () => void; busy?: boolean; invite?: string | null }) {
  const line = birthLine(c);
  const [n, setN] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [age, setAge] = useState(0);
  const [lead, setLead] = useState<string | null>(null);
  const went = useRef(false);
  const t0 = useRef(Date.now());
  useEffect(() => setLead(leadOf()), []);
  // gõ chữ: gieo lại thì gõ lại và đếm lại
  useEffect(() => {
    setN(0);
    setLeft(null);
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setN(line.length);
      setLeft(AUTO_SEC);
      return;
    }
    const id = setInterval(() => {
      setN((x) => {
        if (x >= line.length) {
          clearInterval(id);
          setLeft(AUTO_SEC);
          return x;
        }
        return x + 2;
      });
    }, 28);
    return () => clearInterval(id);
  }, [line]);
  // đếm ngược, ẩn tab thì dừng
  const counting = left !== null;
  useEffect(() => {
    if (!counting || busy) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setLeft((x) => (x === null ? x : x - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [counting, busy, line]);
  useEffect(() => {
    if (left === null || left > 0 || busy || went.current) return;
    went.current = true;
    track('first_go', { auto: 1, ab: 'a', ms: Date.now() - t0.current });
    onBorn();
  }, [left, busy, onBorn]);
  // tuổi nhích dần cho cảnh có hồn, dừng ở 3
  useEffect(() => {
    const id = setInterval(() => setAge((a) => (a >= 3 ? a : a + 1)), 1400);
    return () => clearInterval(id);
  }, []);
  const go = () => {
    if (went.current || busy) return;
    went.current = true;
    track('first_go', { auto: 0, ab: 'a', ms: Date.now() - t0.current });
    onBorn();
  };
  const el = ELEMENTS[elementOf(c)];
  const fam = FAMILY_TIERS[c.familyTier ?? 1];
  const rareLc = c.linhCanMul >= 1.2;
  const grown = { ...c, age: 22, lifespan: 90 };
  const typed = line.slice(0, n);
  return (
    <div className="fs-wrap" role="dialog" aria-label={tr('Kiếp đầu tiên', 'Your first life')}>
      {(invite || lead) && <p className={`fs-lead ${invite ? 'inv' : ''}`}>{invite ?? lead}</p>}
      <div className="fs-scene">
        <div className="fs-bg" aria-hidden />
        <div className="fs-hud">
          <span className="fs-tag">
            {tr('Năm thứ ', 'Year ')}<b>{age + 1}</b>
            <small>{tr('Kiếp thứ nhất', 'Your first life')}</small>
          </span>
          <span className="fs-tag r">
            {tr('Tuổi ', 'Age ')}<b>{age}</b>
            <small>{tr(`thọ khoảng ${c.lifespan}`, `lifespan about ${c.lifespan}`)}</small>
          </span>
        </div>
        <div className="fs-logo" aria-hidden>{tr('Vạn Kiếp Luân Hồi', 'Ten Thousand Rebirths')}</div>
        <Link href="/dang-nhap" className="fs-login">{tr('Đã có tài khoản? Đăng nhập', 'Have an account? Log in')}</Link>
        <div className="fs-hero" role="img" aria-label={tr(`${c.name} đang đi`, `${c.name} walking`)}>
          <Sprite c={grown} size={190} anim="walk" dir={3} />
        </div>
      </div>
      <div className="fs-box">
        <div className="fs-who">
          <b>{c.name}</b>
          <span>{c.origin}</span>
        </div>
        <p className="fs-say" aria-live="polite">
          {typed}
          {n >= line.length && <i aria-hidden>▼</i>}
        </p>
        <div className="fs-chips">
          <span className={`fs-chip ${rareLc ? 'lc' : ''}`}>{c.linhCan}</span>
          <span className="fs-chip">{tr('Mệnh ', 'Element: ')}{el.name}</span>
          <span className="fs-chip">{tr('Nhà ', 'Family: ')}{fam?.name}</span>
        </div>
      </div>
      <div className="fs-bar">
        <button
          className="fs-ghost"
          onClick={() => {
            track('first_reroll', { ab: 'a' });
            onRoll();
          }}
          disabled={busy}
        >
          {tr('Gieo lại', 'Reroll')}
        </button>
        <button className="fs-go" onClick={go} disabled={busy}>
          {tr('Sống kiếp này', 'Live this life')}
          <small>{left === null ? tr('năm tháng tự trôi', 'the years roll by') : tr(`tự vào sau ${Math.max(0, left)} giây`, `starting in ${Math.max(0, left)}s`)}</small>
          {left !== null && <i key={line} style={{ animationDuration: `${AUTO_SEC}s` }} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
