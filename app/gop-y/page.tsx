'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addFeedback, listFeedback, voteFeedback, type Feedback, type FeedbackKind } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const KINDS: { id: FeedbackKind; name: string }[] = [
  { id: 'tinh_nang', name: 'Tính năng mới' },
  { id: 'can_bang', name: 'Cân bằng game' },
  { id: 'loi', name: 'Báo lỗi' },
  { id: 'khac', name: 'Khác' },
];
const STATUS: Record<Feedback['status'], string> = { moi: '', dang_lam: 'Đang làm', da_xong: 'Đã xong', tu_choi: 'Tạm gác' };

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function GopY() {
  const { user, ready } = useAuth();
  const [list, setList] = useState<Feedback[] | null>(null);
  const [kind, setKind] = useState<FeedbackKind>('tinh_nang');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [filter, setFilter] = useState<FeedbackKind | 'all'>('all');
  const [state, setState] = useState<'open' | 'done' | 'all'>('open');

  const load = () => listFeedback(user).then((l) => setList(l ?? []));
  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.token]);

  const send = async () => {
    const t = text.trim();
    if (t.length < 5) return setMsg({ ok: false, text: 'Viết dài hơn chút nhé (ít nhất 5 ký tự).' });
    setBusy(true);
    const err = await addFeedback(user, kind, t);
    setBusy(false);
    if (err) return setMsg({ ok: false, text: err });
    setText('');
    setMsg({ ok: true, text: 'Đã gửi! Cảm ơn đạo hữu đã góp ý.' });
    load();
  };

  const vote = async (f: Feedback) => {
    if (!user || f.voted) return;
    const n = await voteFeedback(user, f.id);
    if (n === null) return;
    setList((l) => l?.map((x) => (x.id === f.id ? { ...x, votes: n, voted: true } : x)) ?? null);
  };

  const isDone = (f: Feedback) => f.status === 'da_xong';
  const byKind = (list ?? []).filter((f) => filter === 'all' || f.kind === filter);
  const nOpen = byKind.filter((f) => !isDone(f)).length;
  const nDone = byKind.length - nOpen;
  const shown = byKind
    .filter((f) => state === 'all' || (state === 'done') === isDone(f))
    .sort((a, b) => (sort === 'top' ? b.votes - a.votes || +new Date(b.created_at) - +new Date(a.created_at) : +new Date(b.created_at) - +new Date(a.created_at)));

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Góp ý
          </span>
          <span className="meta">Muốn game có gì, cứ viết. Nhiều người đồng ý sẽ được làm trước.</span>
          <BackButton fallback="/" />
        </div>
      </header>

      <section className="panel">
        <h2>Viết góp ý</h2>
        {user ? (
          <>
            <div className="fb-kinds" role="radiogroup" aria-label="Loại góp ý">
              {KINDS.map((k) => (
                <button key={k.id} role="radio" aria-checked={kind === k.id} className={`btn ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>
                  {k.name}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Nội dung ({text.length}/500)</span>
              <textarea value={text} maxLength={500} rows={4} onChange={(e) => setText(e.target.value)} placeholder="vd: Thêm chức năng kết bái huynh đệ với người chơi khác" />
            </label>
            <button className="btn btn-red btn-big" style={{ width: '100%', marginTop: 8 }} onClick={send} disabled={busy}>
              {busy ? 'Đang gửi...' : 'Gửi góp ý'}
            </button>
            {msg && (
              <p className="note" style={{ color: msg.ok ? 'var(--jade)' : 'var(--ta)', marginBottom: 0 }} role="status">
                {msg.text}
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0 }}>
            <Link href="/dang-nhap">Đăng nhập</Link> để viết góp ý và bấm đồng ý. Khách vẫn xem được.
          </p>
        )}
      </section>

      <div className="fb-filter">
        <div className="fb-state" role="tablist" aria-label="Trạng thái">
          {(
            [
              { id: 'open', name: 'Chưa giải quyết', n: nOpen },
              { id: 'done', name: 'Đã giải quyết', n: nDone },
              { id: 'all', name: 'Tất cả', n: byKind.length },
            ] as const
          ).map((t) => (
            <button key={t.id} role="tab" aria-selected={state === t.id} className={state === t.id ? 'on' : ''} onClick={() => setState(t.id)}>
              {t.name} <small>{t.n}</small>
            </button>
          ))}
        </div>
        <div className="fb-selects">
          <select aria-label="Loại góp ý" value={filter} onChange={(e) => setFilter(e.target.value as FeedbackKind | 'all')}>
            <option value="all">Mọi loại</option>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
          <select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value as 'top' | 'new')}>
            <option value="top">Nhiều đồng ý</option>
            <option value="new">Mới nhất</option>
          </select>
        </div>
      </div>

      <div className="fb-list">
        {list === null && <p className="note">Đang tải...</p>}
        {list && !shown.length && <p className="note">{state === 'done' ? 'Chưa có góp ý nào được giải quyết ở mục này.' : state === 'open' && byKind.length ? 'Mọi góp ý ở mục này đã được giải quyết.' : 'Chưa có góp ý nào. Hãy là người đầu tiên!'}</p>}
        {shown.map((f) => (
          <article key={f.id} className={`fb-item ${f.status}`}>
            <button className={`fb-vote ${f.voted ? 'on' : ''}`} onClick={() => vote(f)} disabled={!user || f.voted} aria-label={f.voted ? `Đã đồng ý, ${f.votes} phiếu` : `Đồng ý, hiện ${f.votes} phiếu`}>
              <span aria-hidden="true">▲</span>
              <b>{f.votes}</b>
            </button>
            <div className="fb-body">
              <div className="fb-meta">
                <span className={`fb-kind k-${f.kind}`}>{KINDS.find((k) => k.id === f.kind)?.name}</span>
                {STATUS[f.status] && <span className={`fb-status s-${f.status}`}>{STATUS[f.status]}</span>}
                <small>
                  {f.username}
                  {f.mine ? ' (bạn)' : ''} · {ago(f.created_at)}
                </small>
              </div>
              <p>{f.content}</p>
              {f.reply && (
                <div className="fb-reply">
                  <span className="fb-reply-seal" aria-hidden="true">
                    Thiên
                    <br />
                    Đạo
                  </span>
                  <div>
                    <b>Thiên Đạo hồi đáp{f.reply_ver ? ` · bản ${f.reply_ver}` : ''}</b>
                    <p>{f.reply}</p>
                    {f.reply_ver && (
                      <Link href="/cap-nhat" className="fb-reply-link">
                        Xem cáo thị bản {f.reply_ver} ›
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
