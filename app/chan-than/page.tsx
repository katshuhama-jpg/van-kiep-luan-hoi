'use client';

/**
 * 4.5.0 Trang chân thân: chân thân lớn với chấm huyệt, pháp danh, danh hiệu, đổi ngoại hình và tên,
 * bảng Tam Tài 3 tab (Thân, Khí, Đạo), tủ ngoại trang, khoe thẻ, xem lại Tam Tài Đồ. Giấu sau cờ CHAN_THAN_ON: cờ tắt thì về trang đầu.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { CtCreate, TamTaiReview, checkCtName } from '@/components/ChanThan';
import { CtWardrobe, HuyetBar, HuyetBody, TamTaiBoard, useCtExt } from '@/components/TamTai';
import ShareSheet from '@/components/ShareSheet';
import { shareChanThan } from '@/lib/ctCard';
import type { ShareOut } from '@/lib/shareCard';
import { displayName } from '@/lib/storage';
import { CHAN_THAN_ON } from '@/lib/flags';
import { CT_RENAME_COST, ctSuggestName } from '@/lib/game/chanThan';
import { ctTitles, huyetCount, nextHuyet } from '@/lib/game/khaiMach';
import type { Meta } from '@/lib/game/types';
import { loadAll, saveMeta } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

export default function ChanThanPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [mode, setMode] = useState<'view' | 'look' | 'name'>('view');
  const [help, setHelp] = useState(false);
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<ShareOut | null>(null);
  const [saved, setSaved] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const ext = useCtExt(user, CHAN_THAN_ON);
  const viewed = useRef(false);
  useEffect(() => {
    if (!CHAN_THAN_ON) router.replace('/');
  }, [router]);
  useEffect(() => {
    if (meta?.chanThan && !viewed.current) {
      viewed.current = true;
      track('huyet_view', { from: 'chan_than', n: huyetCount(meta) });
    }
  }, [meta]);
  useEffect(() => {
    if (!CHAN_THAN_ON || !ready) return;
    loadAll(user)
      .then(({ meta: m }) => setMeta(m))
      .catch(() => {});
  }, [ready, user]);
  if (!CHAN_THAN_ON) return null;
  const save = (m: Meta) => {
    setMeta(m);
    saveMeta(user, m).catch(() => {});
  };
  const ct = meta?.chanThan ?? null;
  const cost = ct && ct.renamed >= 1 ? CT_RENAME_COST : 0;
  const h = meta ? nextHuyet(meta) : null;
  return (
    <main className="app ct-page">
      <header className="topbar">
        <div className="topbar-row">
          <BackButton />
          <span className="age-big" style={{ fontSize: 26 }}>
            {tr('Chân thân', 'True Self')}
          </span>
          <button className="icon-btn" aria-label={tr('Xem lại Tam Tài Đồ', 'Review the Three Treasures')} onClick={() => (track('huyet_intro_open', { from: 'chan_than' }), setHelp(true))}>
            ?
          </button>
        </div>
      </header>
      {!meta && <p>{tr('Đang tìm chân thân...', 'Looking for your true self...')}</p>}
      {meta && !ct && (
        <section className="panel">
          <p>{tr('Ngươi chưa nhớ lại chân thân. Hãy khép lại một giấc mộng trước đã.', 'You have not yet remembered your true self. Let one dream end first.')}</p>
          <Link href="/choi" className="btn" style={{ display: 'block', textDecoration: 'none' }}>
            {tr('Vào luân hồi', 'Enter the cycle')}
          </Link>
        </section>
      )}
      {meta && ct && mode === 'view' && (
        <>
          <section className="panel ct-card-big">
            <div className="ct-big">
              <HuyetBody ct={ct} open={huyetCount(meta)} size={190} />
            </div>
            <h2 style={{ margin: '6px 0 0', textAlign: 'center' }}>{ct.name}</h2>
            {ctTitles(meta, ext).length > 0 && <p className="ct-titles">{ctTitles(meta, ext).join(' · ')}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 2px' }}>
              <HuyetBar n={huyetCount(meta)} />
            </div>
            <p style={{ textAlign: 'center', margin: '4px 0' }}>{tr(`Thân: ${huyetCount(meta)}/10 huyệt`, `Body: ${huyetCount(meta)}/10 points`)}</p>
            {h && (
              <div className="ct-how">
                <p className="ct-how-h">
                  <span className="ct-new">{tr('MỚI', 'NEW')}</span> {tr('Khai huyệt chơi thế nào?', 'How do points open?')}
                </p>
                <ol className="ct-how-steps">
                  <li>{tr('Vào một kiếp mới, chơi như mọi khi.', 'Start a new life and play as usual.')}</li>
                  <li>
                    {tr(`Kiếp nào ${h.task}, lúc kiếp đó kết thúc thì huyệt ${h.name} sáng.`, `In any life where you ${h.task}, the ${h.name} point lights up when that life ends.`)}
                  </li>
                  <li>{tr('Huyệt đã sáng giúp mọi kiếp sau mạnh hơn một chút. Mỗi kiếp sáng tối đa một huyệt.', 'Lit points make every later life a little stronger. At most one point per life.')}</li>
                </ol>
                {huyetCount(meta) === 0 && (
                  <small className="note" style={{ display: 'block', margin: '0 0 6px' }}>
                    {tr('Huyệt mới có từ bản này, nên ai cũng bắt đầu từ 0, kể cả người đã chơi lâu.', 'Points are new in this version, so everyone starts from 0, even long-time players.')}
                  </small>
                )}
                <Link
                  href="/choi"
                  className="btn"
                  style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
                  onClick={() => track('huyet_go_play', { from: 'chan_than', n: huyetCount(meta) })}
                >
                  {tr('Vào kiếp mới', 'Start a new life')}
                </Link>
              </div>
            )}
            <div className="home-grid">
              <button className="btn" onClick={() => setMode('look')}>
                {tr('Đổi ngoại hình', 'Change appearance')}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setName(ct.name);
                  setErr(null);
                  setMode('name');
                }}
              >
                {tr('Đổi pháp danh', 'Change name')}
              </button>
            </div>
            <button
              className="btn btn-red"
              style={{ width: '100%', marginTop: 8 }}
              disabled={drawing}
              onClick={async () => {
                setDrawing(true);
                track('huyet_share', { n: huyetCount(meta) });
                const r = await shareChanThan(meta, ext, user ? displayName(user) : ct.name).catch(() => null);
                setDrawing(false);
                if (r?.link) setOut(r);
                else if (r?.saved) setSaved(true);
              }}
            >
              {drawing ? tr('Đang vẽ thẻ...', 'Drawing your card...') : tr('Khoe chân thân', 'Share your true self')}
            </button>
            {saved && <small className="note">{tr('Đã tải thẻ về máy. Đăng nhập để có link khoe hiện hình.', 'Card downloaded. Log in to get a link that shows the picture.')}</small>}
          </section>
          <section className="panel ct-dark">
            <TamTaiBoard meta={meta} ext={ext} onHelp={() => (track('huyet_intro_open', { from: 'bang' }), setHelp(true))} />
          </section>
          <section className="panel ct-dark">
            <CtWardrobe
              meta={meta}
              ext={ext}
              onWear={(o) => {
                save({ ...meta, chanThan: { ...ct, outfit: o } });
                track('ct_look', { gender: ct.gender, hair: ct.hair, hairColor: ct.hairColor, outfit: o });
              }}
            />
          </section>
          {out && <ShareSheet out={out} kind="life" onClose={() => setOut(null)} />}
        </>
      )}
      {meta && ct && mode === 'look' && (
        <section className="panel ct-dark">
          <CtCreate
            init={ct}
            nameLocked
            title={tr('Đổi ngoại hình', 'Change appearance')}
            confirm={tr('Giữ dáng này', 'Keep this look')}
            onDone={(x) => {
              save({ ...meta, chanThan: { ...ct, gender: x.gender, skin: x.skin, hair: x.hair, hairColor: x.hairColor, outfit: x.outfit } });
              track('ct_look', { gender: x.gender, hair: x.hair, hairColor: x.hairColor, outfit: x.outfit });
              setMode('view');
            }}
          />
          <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setMode('view')}>
            {tr('Thôi', 'Cancel')}
          </button>
        </section>
      )}
      {meta && ct && mode === 'name' && (
        <section className="panel">
          <label className="ct-name" style={{ color: 'inherit' }}>
            <span>{tr('Pháp danh', 'Dharma name')}</span>
            <span className="ct-name-row">
              <input value={name} maxLength={24} onChange={(e) => (setErr(null), setName(e.target.value))} aria-invalid={!!err} />
              <button className="btn ct-dice" type="button" onClick={() => (setErr(null), setName(ctSuggestName(ct.gender)))}>
                {tr('Gợi tên khác', 'Another name')}
              </button>
            </span>
          </label>
          <p style={{ margin: '8px 0' }}>{cost ? tr(`Đổi tên lần này tốn ${cost} phúc duyên (đang có ${meta.phucDuyen}).`, `This rename costs ${cost} Fortune (you have ${meta.phucDuyen}).`) : tr('Lần đổi tên đầu tiên không tốn gì.', 'Your first rename is free.')}</p>
          {err && (
            <p className="ct-err" role="alert">
              {err}
            </p>
          )}
          <div className="home-grid">
            <button className="btn" onClick={() => setMode('view')}>
              {tr('Thôi', 'Cancel')}
            </button>
            <button
              className="btn btn-dark"
              disabled={busy}
              onClick={async () => {
                if (cost && meta.phucDuyen < cost) return setErr(tr('Phúc duyên chưa đủ.', 'Not enough Fortune.'));
                setBusy(true);
                const e = await checkCtName(name);
                setBusy(false);
                if (e) return setErr(e);
                const nm = name.normalize('NFC').replace(/\s+/g, ' ').trim();
                if (nm === ct.name) return setMode('view');
                save({ ...meta, phucDuyen: meta.phucDuyen - cost, chanThan: { ...ct, name: nm, renamed: ct.renamed + 1 } });
                track('ct_rename', { n: ct.renamed + 1, cost });
                setMode('view');
              }}
            >
              {busy ? '...' : tr('Định tên', 'Settle name')}
            </button>
          </div>
        </section>
      )}
      {help && meta && <TamTaiReview meta={meta} from="chan_than" onClose={() => setHelp(false)} />}
    </main>
  );
}
