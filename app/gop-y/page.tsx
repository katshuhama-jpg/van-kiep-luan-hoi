'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addFeedback, listFeedback, voteFeedback, type Feedback, type FeedbackKind } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

const KINDS: { id: FeedbackKind; name: string }[] = [
  { id: 'tinh_nang', name: tr('Tính năng mới', "New feature") },
  { id: 'can_bang', name: tr('Cân bằng game', "Game balance") },
  { id: 'loi', name: tr('Báo lỗi', "Bug report") },
  { id: 'khac', name: tr('Khác', "Other") },
];
const STATUS: Record<Feedback['status'], string> = { moi: '', dang_lam: tr('Đang làm', "In progress"), da_xong: tr('Đã xong', "Done"), tu_choi: tr('Tạm gác', "On hold") };

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return tr('vừa xong', "just now");
  if (m < 60) return tr(`${m} phút trước`, `${m} min ago`);
  const h = Math.floor(m / 60);
  if (h < 24) return tr(`${h} giờ trước`, `${h}h ago`);
  return tr(`${Math.floor(h / 24)} ngày trước`, `${Math.floor(h / 24)}d ago`);
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
  const [state, setState] = useState<'open' | 'done' | 'all'>('done');

  const load = () => listFeedback(user).then((l) => setList(l ?? []));
  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.token]);

  const send = async () => {
    const t = text.trim();
    if (t.length < 5) return setMsg({ ok: false, text: tr('Viết dài hơn chút nhé (ít nhất 5 ký tự).', "Write a bit more (at least 5 characters).") });
    setBusy(true);
    const err = await addFeedback(user, kind, t);
    setBusy(false);
    if (err) return setMsg({ ok: false, text: err });
    setText('');
    setMsg({ ok: true, text: tr('Đã gửi! Cảm ơn đạo hữu đã góp ý.', "Sent! Thank you for the feedback, fellow Daoist.") });
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
            
            {tr("Góp ý", "Feature requests")}
          </span>
          <span className="meta">{tr("Muốn game có gì, cứ viết. Nhiều người đồng ý sẽ được làm trước.", "Want something in the game? Write it. The most-backed ideas get built first.")}</span>
          <BackButton fallback="/" />
        </div>
      </header>

      <section className="panel">
        <h2>{tr("Viết góp ý", "Write a request")}</h2>
        {user ? (
          <>
            <div className="fb-kinds" role="radiogroup" aria-label={tr("Loại góp ý", "Request type")}>
              {KINDS.map((k) => (
                <button key={k.id} role="radio" aria-checked={kind === k.id} className={`btn ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>
                  {k.name}
                </button>
              ))}
            </div>
            <label className="field">
              <span>{tr("Nội dung (", "Content (")}{text.length}/500)</span>
              <textarea value={text} maxLength={500} rows={4} onChange={(e) => setText(e.target.value)} placeholder={tr("vd: Thêm chức năng kết bái huynh đệ với người chơi khác", "e.g. Let me become sworn brothers with other players")} />
            </label>
            <button className="btn btn-red btn-big" style={{ width: '100%', marginTop: 8 }} onClick={send} disabled={busy}>
              {busy ? tr('Đang gửi...', "Sending...") : tr('Gửi góp ý', "Send request")}
            </button>
            {msg && (
              <p className="note" style={{ color: msg.ok ? 'var(--jade)' : 'var(--ta)', marginBottom: 0 }} role="status">
                {msg.text}
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0 }}>
            <Link href="/dang-nhap">{tr("Đăng nhập", "Log in")}</Link>{tr(" để viết góp ý và bấm đồng ý. Khách vẫn xem được.", " to write requests and vote. Guests can still browse.")}
          </p>
        )}
      </section>

      <div className="fb-filter">
        <div className="fb-state" role="tablist" aria-label={tr("Trạng thái", "Status")}>
          {(
            [
              { id: 'done', name: tr('Đã giải quyết', "Resolved"), n: nDone },
              { id: 'open', name: tr('Chưa giải quyết', "Unresolved"), n: nOpen },
              { id: 'all', name: tr('Tất cả', "All"), n: byKind.length },
            ] as const
          ).map((t) => (
            <button key={t.id} role="tab" aria-selected={state === t.id} className={state === t.id ? 'on' : ''} onClick={() => setState(t.id)}>
              {t.name} <small>{t.n}</small>
            </button>
          ))}
        </div>
        <div className="fb-selects">
          <select aria-label={tr("Loại góp ý", "Request type")} value={filter} onChange={(e) => setFilter(e.target.value as FeedbackKind | 'all')}>
            <option value="all">{tr("Mọi loại", "All types")}</option>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
          <select aria-label={tr("Sắp xếp", "Sort")} value={sort} onChange={(e) => setSort(e.target.value as 'top' | 'new')}>
            <option value="top">{tr("Nhiều đồng ý", "Most votes")}</option>
            <option value="new">{tr("Mới nhất", "Newest")}</option>
          </select>
        </div>
      </div>

      <div className="fb-list">
        {list === null && <p className="note">{tr("Đang tải...", "Loading...")}</p>}
        {list && !shown.length && <p className="note">{state === 'done' ? tr('Chưa có góp ý nào được giải quyết ở mục này.', "No resolved requests in this category yet.") : state === 'open' && byKind.length ? tr('Mọi góp ý ở mục này đã được giải quyết.', "Every request in this category has been resolved.") : tr('Chưa có góp ý nào. Hãy là người đầu tiên!', "No requests yet. Be the first!")}</p>}
        {shown.map((f) => (
          <article key={f.id} className={`fb-item ${f.status}`}>
            <button className={`fb-vote ${f.voted ? 'on' : ''}`} onClick={() => vote(f)} disabled={!user || f.voted} aria-label={f.voted ? tr(`Đã đồng ý, ${f.votes} phiếu`, `Voted, ${f.votes} votes`) : tr(`Đồng ý, hiện ${f.votes} phiếu`, `Vote, ${f.votes} so far`)}>
              <span aria-hidden="true">▲</span>
              <b>{f.votes}</b>
            </button>
            <div className="fb-body">
              <div className="fb-meta">
                <span className={`fb-kind k-${f.kind}`}>{KINDS.find((k) => k.id === f.kind)?.name}</span>
                {STATUS[f.status] && <span className={`fb-status s-${f.status}`}>{STATUS[f.status]}</span>}
                <small>
                  {f.username}
                  {f.mine ? tr(' (bạn)', " (you)") : ''} · {ago(f.created_at)}
                </small>
              </div>
              <p>{f.content}</p>
              {f.reply && (
                <div className="fb-reply">
                  <span className="fb-reply-seal" aria-hidden="true">
                    
                    {tr("Thiên", "Heaven")}
                    <br />
                    
                    {tr("Đạo", "Dao")}
                  </span>
                  <div>
                    <b>{tr("Thiên Đạo hồi đáp", "The Heavenly Dao replies")}{f.reply_ver ? tr(` · bản ${f.reply_ver}`, ` · version ${f.reply_ver}`) : ''}</b>
                    <p>{f.reply}</p>
                    {f.reply_ver && (
                      <Link href="/cap-nhat" className="fb-reply-link">
                        
                        {tr("Xem cáo thị bản ", "See the proclamation for version ")}{f.reply_ver} ›
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
