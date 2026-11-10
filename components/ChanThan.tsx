'use client';

/**
 * 4.5.0 Chân thân: hình chân thân (LPC), đoạn mở đầu "Mộng Tỉnh", màn tạo chân thân, màn giới thiệu "Tam Tài Đồ".
 * Lời dẫn lấy đúng từng chữ ở doc "Kế hoạch 4.5.0", mục "Kịch bản và lời dẫn". Giấu sau cờ CHAN_THAN_ON.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ANIM, composeStrip, readyStrip, type Layer } from '@/lib/lpc';
import { CT_HAIR, CT_HAIR_COLORS, CT_OUTFITS, CT_SKINS, ctBlockedLine, ctCleanName, ctDefault, ctLayers, ctNameError, ctRandom, ctSuggestName } from '@/lib/game/chanThan';
import { COI, DAO, HANH, MONG_TINH, TAM_TAI_END, TAM_TAI_INTRO, daoDone, huyetCount, khaiCheck } from '@/lib/game/khaiMach';
import type { Character, ChanThanLook, Gender, Meta } from '@/lib/game/types';
import { supabase } from '@/lib/supabase';
import { loadAll, saveMeta } from '@/lib/storage';
import type { Player } from '@/lib/auth';
import { musicPref } from '@/lib/music';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';
import Sprite from './Sprite';
import { PixelFx, fxMotes } from './PixelFx';

// ---------------- Hình chân thân ----------------

/** Vẽ một bộ lớp LPC đứng yên thở (dáng idle quay ra trước) */
export function LpcFigure({ layers, size = 140, className, style }: { layers: Layer[]; size?: number; className?: string; style?: CSSProperties }) {
  const key = JSON.stringify(layers);
  const [url, setUrl] = useState<string | undefined>(() => (typeof window !== 'undefined' ? readyStrip(layers, 'idle', 2) : undefined));
  useEffect(() => {
    let live = true;
    composeStrip(layers, 'idle', 2).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const meta = ANIM.idle;
  const cell = size * 2;
  const strip: CSSProperties = {
    width: cell,
    height: cell,
    left: (size - cell) / 2,
    top: size - cell * 0.82,
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: `${meta.frames * cell}px ${cell}px`,
    ['--lpc-end' as string]: `-${meta.frames * cell}px`,
    animation: url ? `lpc-play ${meta.frames / meta.fps}s steps(${meta.frames}) infinite` : 'none',
  };
  return (
    <div className={`lpc ${className ?? ''}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      {!url && <span className="lpc-wait" style={{ width: size * 0.36, height: size * 0.62, left: size * 0.32, top: size * 0.2 }} />}
      <span className="lpc-strip" style={strip} />
    </div>
  );
}

/** Chân thân của người chơi */
export function CtSprite({ ct, size = 140 }: { ct: Pick<ChanThanLook, 'gender' | 'skin' | 'hair' | 'hairColor' | 'outfit'>; size?: number }) {
  return <LpcFigure layers={ctLayers(ct)} size={size} />;
}

/** Bóng người ngồi thiền chưa rõ mặt: chân thân mặc định tô tối */
function shadowLayers(gender: Gender = 'nam'): Layer[] {
  return ctLayers(ctDefault(gender)).map((l) => ({ key: l.key, tint: '#1c1830' }));
}

// ---------------- Tiếng chuông xa ----------------

function bell(vol = 0.18) {
  if (typeof window === 'undefined' || !musicPref()) return;
  try {
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
    const ctx = new AC();
    const t = ctx.currentTime;
    for (const [f, v] of [
      [220, 1],
      [440 * 1.19, 0.5],
      [660 * 1.02, 0.25],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(vol * v, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 3.2);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 3.3);
    }
    setTimeout(() => ctx.close().catch(() => {}), 3600);
  } catch {
    /* trình duyệt không cho phát tiếng: bỏ qua */
  }
}

// ---------------- Mộng Tỉnh: 5 khung ----------------

function MongTinh({ dead, onDone }: { dead: Character | null; onDone: (skipAt: number | null) => void }) {
  const [i, setI] = useState(0);
  const lines = MONG_TINH();
  useEffect(() => {
    if (i === 0) bell();
  }, [i]);
  const next = () => (i >= lines.length - 1 ? onDone(null) : setI(i + 1));
  const g: Gender = dead?.gender ?? 'nam';
  return (
    <div className="ct-scene" onClick={next} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && next()} data-frame={i}>
      <button
        className="ct-skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone(i);
        }}
      >
        {tr('Bỏ qua', 'Skip')}
      </button>
      <div className={`ct-stage f${i}`}>
        {i <= 3 && <PixelFx spec={fxMotes(i === 0 ? 10 : 16, '#ffe9a8')} scale={4} dur={i === 3 ? 1.6 : 3.2} className={`ct-dust d${i}`} />}
        {i === 0 && dead && (
          <div className="ct-dead">
            <Sprite c={dead} size={150} />
          </div>
        )}
        {i >= 2 && (
          <div className={`ct-shadow s${i}`}>
            <LpcFigure layers={shadowLayers(g)} size={170} />
            {i >= 3 && <span className="ct-sole" />}
          </div>
        )}
        {i >= 2 && <span className="ct-sky" />}
        {i >= 2 && <span className="ct-earth" />}
      </div>
      <p className="ct-line" key={i}>
        {lines[i]}
      </p>
      <small className="ct-tap">{tr('Chạm để tiếp', 'Tap to continue')}</small>
    </div>
  );
}

// ---------------- Màn tạo chân thân ----------------

async function serverNameOk(name: string): Promise<boolean | null> {
  const sb = supabase();
  if (!sb) return null;
  try {
    const res = await Promise.race([sb.rpc('vkl_ct_name_ok', { p_name: name }), new Promise<null>((r) => setTimeout(() => r(null), 4000))]);
    if (!res || res.error) return null;
    return res.data === true;
  } catch {
    return null;
  }
}

/** Kiểm tra pháp danh ở trình duyệt rồi ở máy chủ. Trả null nếu nhận, hoặc câu báo. Máy chủ không trả lời thì theo bộ lọc trình duyệt. */
export async function checkCtName(raw: string): Promise<string | null> {
  const err = ctNameError(raw);
  if (err) return err;
  const ok = await serverNameOk(ctCleanName(raw));
  return ok === false ? ctBlockedLine() : null;
}

type CtTab = 'than' | 'toc' | 'ao' | 'ten';

/**
 * Màn tạo chân thân, chia 4 thẻ để mỗi lúc chỉ chọn một thứ (sửa 11/11 theo góp ý Tyler: bản một cột dài quá rối).
 * Chân thân lớn luôn ở trên, hai nút chính luôn ở dưới. Kiểu tóc và trang phục chọn bằng hình thu nhỏ thay cho chữ.
 */
export function CtCreate({ init, title, confirm, onDone, nameLocked }: { init?: ChanThanLook | null; title?: string; confirm?: string; onDone: (ct: ChanThanLook, info: { random: boolean; nameEdited: boolean }) => void; nameLocked?: boolean }) {
  const [ct, setCt] = useState<ChanThanLook>(() => init ?? { ...ctDefault(Math.random() < 0.5 ? 'nam' : 'nu'), name: '' });
  const [name, setName] = useState(() => init?.name || ctSuggestName(ct.gender));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<CtTab>('than');
  const random = useRef(false);
  const edited = useRef(false);
  const suggested = useRef(name);
  const set = (p: Partial<ChanThanLook>) => setCt((x) => ({ ...x, ...p }));
  const g = ct.gender;
  const tabs: { id: CtTab; label: string }[] = [
    { id: 'than', label: tr('Thân', 'Body') },
    { id: 'toc', label: tr('Tóc', 'Hair') },
    { id: 'ao', label: tr('Y phục', 'Outfit') },
    ...(nameLocked ? [] : [{ id: 'ten' as CtTab, label: tr('Pháp danh', 'Name') }]),
  ];
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const e = nameLocked ? null : await checkCtName(name);
    setBusy(false);
    if (e) {
      setTab('ten');
      return setErr(e);
    }
    onDone({ ...ct, name: nameLocked ? (init?.name ?? name) : ctCleanName(name) }, { random: random.current, nameEdited: edited.current && ctCleanName(name) !== suggested.current });
  };
  return (
    <div className="ct-create">
      <h2>{title ?? tr('Nhớ lại chân thân', 'Remember your true self')}</h2>
      <div className="ct-hero">
        <CtSprite ct={ct} size={170} />
        {!nameLocked && (
          <button className="ct-hero-name" onClick={() => setTab('ten')} aria-label={tr('Sửa pháp danh', 'Edit name')}>
            {ctCleanName(name) || '...'}
          </button>
        )}
      </div>
      <div className="ct-tabs" role="tablist" aria-label={tr('Chọn ngoại hình', 'Choose appearance')}>
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`ct-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="ct-panel" role="tabpanel">
        {tab === 'than' && (
          <>
            <p className="ct-label">{tr('Giới tính', 'Gender')}</p>
            <div className="ct-two">
              {(['nam', 'nu'] as Gender[]).map((x) => (
                <button key={x} className={`btn ct-opt ${g === x ? 'on' : ''}`} aria-pressed={g === x} onClick={() => g !== x && setCt((c) => ({ ...ctDefault(x, c), name: c.name }))}>
                  {x === 'nam' ? tr('Nam', 'Male') : tr('Nữ', 'Female')}
                </button>
              ))}
            </div>
            <p className="ct-label">{tr('Màu da', 'Skin')}</p>
            <div className="ct-swatches" role="group" aria-label={tr('Màu da', 'Skin')}>
              {CT_SKINS.map((s, k) => (
                <button key={k} className={`ct-sw ${ct.skin === k ? 'on' : ''}`} style={{ background: s.swatch }} aria-label={tr(`Màu da ${k + 1}`, `Skin ${k + 1}`)} aria-pressed={ct.skin === k} onClick={() => set({ skin: k })} />
              ))}
            </div>
          </>
        )}
        {tab === 'toc' && (
          <>
            <p className="ct-label">
              {tr('Màu tóc', 'Hair color')} <b>{CT_HAIR_COLORS[ct.hairColor]?.name}</b>
            </p>
            <div className="ct-swatches" role="group" aria-label={tr('Màu tóc', 'Hair color')}>
              {CT_HAIR_COLORS.map((h, k) => (
                <button key={k} className={`ct-sw ${ct.hairColor === k ? 'on' : ''}`} style={{ background: h.hex }} aria-label={h.name} aria-pressed={ct.hairColor === k} onClick={() => set({ hairColor: k })} />
              ))}
            </div>
            <p className="ct-label">
              {tr('Kiểu tóc', 'Hair style')} <b>{CT_HAIR[g][ct.hair]?.name}</b>
            </p>
            <div className="ct-grid" role="group" aria-label={tr('Kiểu tóc', 'Hair style')}>
              {CT_HAIR[g].map((h, k) => (
                <button key={h.key} className={`ct-tile ${ct.hair === k ? 'on' : ''}`} aria-label={h.name} aria-pressed={ct.hair === k} onClick={() => set({ hair: k })}>
                  <span className="ct-tile-head">
                    <CtSprite ct={{ ...ct, hair: k }} size={110} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'ao' && (
          <>
            <p className="ct-label">
              {tr('Trang phục', 'Outfit')} <b>{CT_OUTFITS[g][ct.outfit]?.name}</b>
            </p>
            <div className="ct-grid" role="group" aria-label={tr('Trang phục', 'Outfit')}>
              {CT_OUTFITS[g].map((o, k) => (
                <button key={k} className={`ct-tile ${ct.outfit === k ? 'on' : ''}`} aria-label={o.name} aria-pressed={ct.outfit === k} onClick={() => set({ outfit: k })}>
                  <CtSprite ct={{ ...ct, outfit: k }} size={66} />
                </button>
              ))}
            </div>
            <small className="ct-note">{tr('Ngoại trang khác nằm rải trên đường tu: khai huyệt, viên mãn ngũ hành, ngộ đạo.', 'More outfits lie scattered along the path: opening points, perfecting elements, grasping Daos.')}</small>
          </>
        )}
        {tab === 'ten' && !nameLocked && (
          <label className="ct-name">
            <span className="ct-label">{tr('Pháp danh', 'Dharma name')}</span>
            <span className="ct-name-row">
              <input
                value={name}
                maxLength={24}
                onChange={(e) => {
                  edited.current = true;
                  setErr(null);
                  setName(e.target.value);
                }}
                aria-invalid={!!err}
              />
              <button
                className="btn ct-dice"
                type="button"
                onClick={() => {
                  const n = ctSuggestName(g);
                  suggested.current = n;
                  edited.current = false;
                  setErr(null);
                  setName(n);
                }}
              >
                {tr('Gợi tên khác', 'Another name')}
              </button>
            </span>
            <small className="ct-note">{tr('Từ 2 đến 12 chữ cái.', '2 to 12 letters.')}</small>
          </label>
        )}
        {err && (
          <p className="ct-err" role="alert">
            {err}
          </p>
        )}
      </div>
      <div className="ct-actions">
        <button
          className="btn ct-random"
          onClick={() => {
            random.current = true;
            setCt((c) => ({ ...ctRandom(c.name), renamed: c.renamed, createdAt: c.createdAt }));
          }}
        >
          {tr('Thuận theo duyên', 'Let fate decide')}
        </button>
        <button className="btn btn-dark ct-ok" disabled={busy} onClick={submit}>
          {busy ? '...' : (confirm ?? tr('Định chân thân', 'Settle your true self'))}
        </button>
      </div>
    </div>
  );
}

// ---------------- Tam Tài Đồ: 4 khung ----------------

export function TamTaiDo({ ct, meta, dead, from, onDone }: { ct: ChanThanLook | null; meta: Meta; dead?: Character | null; from: string; onDone: () => void }) {
  const frames = TAM_TAI_INTRO();
  const [i, setI] = useState(0);
  const end = i >= frames.length;
  // kiếp vừa rồi đã đạt huyệt 1 thì xem Dũng Tuyền khai ngay
  const first = dead && huyetCount(meta) === 0 ? khaiCheck(meta, dead) : null;
  const finish = (skipAt: number | null) => {
    track('huyet_intro', { done: skipAt === null, skipAt, from });
    onDone();
  };
  const next = () => (end ? finish(null) : setI(i + 1));
  const daos = daoDone(meta);
  return (
    <div className="ct-scene ct-tamtai" onClick={next} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && next()} data-frame={i}>
      {!end && (
        <button
          className="ct-skip"
          onClick={(e) => {
            e.stopPropagation();
            finish(i);
          }}
        >
          {tr('Bỏ qua', 'Skip')}
        </button>
      )}
      <div className={`ct-stage tt f${i}`}>
        {i === 3 && <TamTaiMarks meta={meta} />}
        <div className={`ct-me ${end && first ? 'flash' : ''}`}>{ct ? <CtSprite ct={ct} size={170} /> : <LpcFigure layers={shadowLayers()} size={170} />}</div>
        {(i === 1 || end) && <span className={`ct-huyet ${end && first ? 'lit' : ''}`} />}
        {i === 2 && (
          <div className="ct-hanh">
            {HANH.map((h) => (
              <span key={h.id} className={`ct-hanh-dot ${(meta.career?.hanh?.[h.id] ?? 0) > 0 ? 'lit' : ''}`} style={{ ['--hc' as string]: h.color } as CSSProperties}>
                {h.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {!end ? (
        <>
          <h2 className="ct-title">{frames[i].title}</h2>
          <p className="ct-line" key={i}>
            {frames[i].line}
          </p>
          <small className="ct-small">{frames[i].small}</small>
          {i === 3 && daos.length > 0 && <small className="ct-small">{tr(`Ngươi đã ngộ ${daos.length}/27 đạo từ những giấc mộng trước.`, `You have already grasped ${daos.length}/27 Daos in earlier dreams.`)}</small>}
        </>
      ) : (
        <p className="ct-line" key="end">
          {first ? first.line : TAM_TAI_END()}
        </p>
      )}
      <small className="ct-tap">{tr('Chạm để tiếp', 'Tap to continue')}</small>
    </div>
  );
}

/** Sao trên đầu, ấn dưới chân, hồn đăng trong bóng: đạo đã ngộ sáng lên */
function TamTaiMarks({ meta }: { meta: Meta }) {
  const done = daoDone(meta);
  return (
    <>
      {COI.map((coi) => (
        <div key={coi.id} className={`ct-marks m-${coi.id}`} aria-label={coi.name}>
          {DAO.filter((d) => d.coi === coi.id).map((d) => (
            <span key={d.id} className={`ct-mark ${done.includes(d.id) ? 'lit' : ''}`} />
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------- Cả luồng: Mộng Tỉnh → tạo → Tam Tài Đồ ----------------

export function CtFlow({ meta, dead, from, onDone }: { meta: Meta; dead: Character | null; from: 'death' | 'home' | 'birth'; onDone: (ct: ChanThanLook) => void }) {
  const [step, setStep] = useState<'mong' | 'tao' | 'nho' | 'tamtai'>('mong');
  const [ct, setCt] = useState<ChanThanLook | null>(null);
  useEffect(() => {
    document.body.dataset.ctflow = '1';
    return () => {
      delete document.body.dataset.ctflow;
    };
  }, []);
  return (
    <div className="ct-flow" role="dialog" aria-modal="true" aria-label={tr('Chân thân', 'True self')}>
      {step === 'mong' && (
        <MongTinh
          dead={dead}
          onDone={(skipAt) => {
            track('ct_intro', { done: skipAt === null, skipAt, from });
            setStep('tao');
          }}
        />
      )}
      {step === 'tao' && (
        <div className="ct-scene ct-scroll-y">
          <CtCreate
            onDone={(x, info) => {
              const made = { ...x, createdAt: Date.now(), renamed: 0 };
              track('ct_create', { gender: made.gender, hair: CT_HAIR[made.gender][made.hair]?.key, hairColor: made.hairColor, skin: made.skin, outfit: made.outfit, random: info.random, nameEdited: info.nameEdited, from });
              setCt(made);
              setStep('nho');
              setTimeout(() => setStep('tamtai'), 1800);
            }}
          />
        </div>
      )}
      {step === 'nho' && ct && (
        <div className="ct-scene" onClick={() => setStep('tamtai')}>
          <div className="ct-stage">
            <div className="ct-me">
              <CtSprite ct={ct} size={170} />
            </div>
          </div>
          <p className="ct-line">{tr(`${ct.name}. Ngươi nhớ ra rồi.`, `${ct.name}. You remember now.`)}</p>
        </div>
      )}
      {step === 'tamtai' && ct && <TamTaiDo ct={ct} meta={meta} dead={dead} from={from} onDone={() => onDone(ct)} />}
    </div>
  );
}

/** Mở lại Tam Tài Đồ (nút "?") */
export function TamTaiReview({ meta, from, onClose }: { meta: Meta; from: string; onClose: () => void }) {
  return (
    <div className="ct-flow" role="dialog" aria-modal="true" aria-label={tr('Tam Tài Đồ', 'The Three Treasures')}>
      <TamTaiDo ct={meta.chanThan ?? null} meta={meta} from={from} onDone={onClose} />
    </div>
  );
}

// ---------------- Trang chủ: người cũ chưa có chân thân ----------------

/**
 * Người đã có kiếp mà chưa có chân thân: lần đầu vào trang chủ sau bản này thì mở Mộng Tỉnh, màn tạo, Tam Tài Đồ.
 * Màn tạo phải xong mới đi tiếp (có nút Thuận theo duyên nên chỉ mất một chạm). Chỉ tải hồ sơ khi cờ bật.
 */
export function HomeChanThan({ user, ready, on }: { user: Player | null; ready: boolean; on: boolean }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    if (!on || !ready) return;
    let live = true;
    loadAll(user)
      .then(({ meta: m }) => live && setMeta(m))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [on, ready, user]);
  if (!on || !meta || meta.chanThan || (meta.lives ?? 0) < 1) return null;
  return (
    <CtFlow
      meta={meta}
      dead={null}
      from="home"
      onDone={(ct) => {
        const m2 = { ...meta, chanThan: ct };
        setMeta(m2);
        saveMeta(user, m2).catch(() => {});
      }}
    />
  );
}
