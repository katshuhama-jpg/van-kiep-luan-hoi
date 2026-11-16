'use client';

/**
 * Tab Nhân vật (16/11, Tyler yêu cầu): chân thân giữa sân khấu, ô đồ hai bên, lực chiến, tab con Quần áo / Mũ / Vũ khí / Cánh,
 * công pháp chân thân (để trống chờ bản sau), Sư Đồ, đổi tóc da và pháp danh, khoe thẻ.
 * Bảng Tam Tài và huyệt nay ở tab riêng /tam-tai. Giấu sau cờ CHAN_THAN_ON: cờ tắt thì về trang đầu.
 */
import Link from 'next/link';
import { NhanVatBag, NhanVatCongPhap, NhanVatStage, type NvTab } from '@/components/NhanVat';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { CtCreate, checkCtName } from '@/components/ChanThan';
import { useCtExt } from '@/components/TamTai';
import ShareSheet from '@/components/ShareSheet';
import SuDoPanel from '@/components/SuDoPanel';
import { shareChanThan } from '@/lib/ctCard';
import type { ShareOut } from '@/lib/shareCard';
import { displayName } from '@/lib/storage';
import { CHAN_THAN_ON, SU_DO_ON, TAB_ON } from '@/lib/flags';
import { TabBar, TopMenu } from '@/components/TabBar';
import { CT_RENAME_COST, ctSuggestName } from '@/lib/game/chanThan';
import { huyetCount } from '@/lib/game/khaiMach';
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
  const [bagTab, setBagTab] = useState<NvTab>('ao');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<ShareOut | null>(null);
  const [saved, setSaved] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const ext = useCtExt(user, CHAN_THAN_ON);
  // Sư Đồ: cộng phúc duyên vừa nhận vào bản hồ sơ MỚI NHẤT rồi lưu (thử lại một lần nếu lỗi)
  const metaRef = useRef<Meta | null>(null);
  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);
  const onSuGain = useCallback(
    async (n: number) => {
      const m = metaRef.current;
      if (!m) return;
      const nm = { ...m, phucDuyen: (m.phucDuyen ?? 0) + n };
      metaRef.current = nm;
      setMeta(nm);
      try {
        await saveMeta(user, nm);
      } catch {
        await saveMeta(user, nm).catch(() => {});
      }
    },
    [user],
  );
  useEffect(() => {
    if (!CHAN_THAN_ON) router.replace('/');
  }, [router]);
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
  return (
    <main className={`app ct-page${TAB_ON ? ' has-tabs' : ''}`}>
      {TAB_ON && <TopMenu at="nv" />}
      <header className="topbar">
        <div className="topbar-row">
          <BackButton />
          <span className="age-big" style={{ fontSize: 26 }}>
            {tr('Nhân vật', 'Character')}
          </span>
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
          <section className="panel nv-panel">
            <NhanVatStage ct={ct} meta={meta} ext={ext} active={bagTab} onSlot={(t) => (setBagTab(t), track('ct_slot_tap', { slot: t }), document.querySelector('.nv-bag')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))} />
          </section>
          {SU_DO_ON && <SuDoPanel user={user} meta={meta} onGain={onSuGain} />}
          <section className="panel">
            <NhanVatBag ct={ct} meta={meta} ext={ext} tab={bagTab} setTab={setBagTab} onWear={(x) => save({ ...meta, chanThan: x })} />
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
            <NhanVatCongPhap />
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
      {TAB_ON && <TabBar cur="nv" />}
    </main>
  );
}
