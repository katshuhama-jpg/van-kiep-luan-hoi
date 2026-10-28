/**
 * Dịch lại chữ đã lưu (gia phả, nơi sinh, sự kiện đang chờ...) khi người chơi đổi ngôn ngữ giữa chừng.
 * Từ điển dựng từ mọi tr('vi', 'en') trong mã (public/i18n-dict.json): khớp nguyên câu hoặc khớp mẫu có chỗ trống,
 * phần trong chỗ trống dịch tiếp đệ quy; câu ghép thì tách theo dấu câu rồi dịch từng đoạn. Không khớp thì giữ nguyên.
 */
import type { Lang } from './i18n';

type Pair = [string, string];
interface Tpl {
  re: RegExp;
  to: string;
  idx: number[]; // nhóm bắt thứ k ứng với chỗ trống số mấy
  lit: number; // độ dài phần chữ cố định, mẫu dài khớp trước
  anchored: number; // số đầu mút là chữ cố định (mẫu neo hai đầu cụ thể hơn)
}
interface Dir {
  exact: Map<string, string>;
  lower: Map<string, string>; // khớp không phân biệt hoa thường (code hay viết thường tên xuất thân)
  tpls: Tpl[];
}

let dirs: Record<'vi2en' | 'en2vi', Dir> | null = null;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function build(list: Pair[], from: 0 | 1): Dir {
  const exact = new Map<string, string>();
  const tpls: Tpl[] = [];
  for (const p of list) {
    // dòng mở đầu kiếp: __KIEP__ được thay bằng "Kiếp thứ N." lúc ghi, dịch riêng phần đó
    const a = p[from].replace(/^__KIEP__ /, '');
    const b = p[1 - from].replace(/^__KIEP__ /, '');
    if (!/\{\d+\}/.test(a)) {
      if (!exact.has(a.trim())) exact.set(a.trim(), b.trim());
      continue;
    }
    const idx: number[] = [];
    const parts = a.split(/(\{\d+\})/);
    let lit = 0;
    const src = parts
      .map((x) => {
        const m = x.match(/^\{(\d+)\}$/);
        if (m) {
          idx.push(+m[1]);
          return '([\\s\\S]+?)';
        }
        lit += x.trim().length;
        return esc(x);
      })
      .join('');
    // mẫu gần như toàn chỗ trống ("{0} {1}") khớp bừa, bỏ
    if (lit < 4) continue;
    const ends = (parts[0].trim() ? 1 : 0) + (parts[parts.length - 1].trim() ? 1 : 0);
    tpls.push({ re: new RegExp('^' + src.trim() + '$'), to: b, idx, lit, anchored: ends });
  }
  tpls.sort((x, y) => y.anchored - x.anchored || y.lit - x.lit);
  const lower = new Map<string, string>();
  for (const [k, v] of exact) if (!lower.has(k.toLowerCase())) lower.set(k.toLowerCase(), v);
  return { exact, lower, tpls };
}

/** Tải từ điển (một lần) */
export async function loadDict(): Promise<boolean> {
  if (dirs) return true;
  try {
    const r = await fetch('/i18n-dict.json', { cache: 'force-cache' });
    const list = (await r.json()) as Pair[];
    dirs = { vi2en: build(list, 0), en2vi: build(list, 1) };
    return true;
  } catch {
    return false;
  }
}

/** Dùng cho mô phỏng ngoài trình duyệt */
export function setDict(list: Pair[]) {
  dirs = { vi2en: build(list, 0), en2vi: build(list, 1) };
  phraseCache = null;
}

const VN = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

function one(text: string, d: Dir, depth: number): string | null {
  const t = text.trim();
  const kiep = depth === 0 ? t.match(/^(Kiếp thứ \d+\.|Life #\d+\.) (.+)$/s) : null;
  if (kiep) {
    const rest = one(kiep[2], d, 1) ?? split(kiep[2], d, 1);
    const head = one(kiep[1], d, 1);
    if (rest != null && head != null) return text.replace(t, `${head} ${rest}`);
  }
  if (!t) return text;
  const ex = d.exact.get(t);
  if (ex !== undefined) return text.replace(t, ex);
  const lo = d.lower.get(t.toLowerCase());
  if (lo !== undefined) return text.replace(t, t[0] === t[0].toLowerCase() ? lo.charAt(0).toLowerCase() + lo.slice(1) : lo);
  if (depth > 4) return null;
  for (const tp of d.tpls) {
    const m = t.match(tp.re);
    if (!m) continue;
    let out = tp.to;
    tp.idx.forEach((ph, k) => {
      const cap = m[k + 1];
      const tr2 = one(cap, d, depth + 1) ?? split(cap, d, depth + 1) ?? cap;
      out = out.split(`{${ph}}`).join(tr2);
    });
    return text.replace(t, out);
  }
  return null;
}

/** Câu ghép: tách theo dấu câu, ghép các đoạn liền nhau sao cho khớp được nhiều chữ nhất (quy hoạch động) */
function split(text: string, d: Dir, depth: number): string | null {
  const segs = text.split(/(?<=[.!?:…])\s+/);
  if (segs.length < 2) return null;
  const n = segs.length;
  // best[i]: [số ký tự khớp, các đoạn đã dịch] cho segs[0..i)
  const best: [number, string[]][] = [[0, []]];
  for (let i = 1; i <= n; i++) {
    best[i] = [best[i - 1][0], [...best[i - 1][1], segs[i - 1]]];
    for (let j = Math.max(0, i - 6); j < i; j++) {
      const chunk = segs.slice(j, i).join(' ');
      const r = one(chunk, d, depth) ?? (/[.!?:…]$/.test(chunk) ? one(chunk.slice(0, -1), d, depth)?.concat(chunk.slice(-1)) : undefined);
      if (r != null && best[j][0] + chunk.length > best[i][0]) best[i] = [best[j][0] + chunk.length, [...best[j][1], r]];
    }
  }
  return best[n][0] ? best[n][1].join(' ') : null;
}

/** Cuối cùng: thay từng cụm cố định (từ 8 ký tự) xuất hiện trong câu, cụm dài trước. Dùng cho câu ráp từ nhiều mảnh. */
let phraseCache: { vi2en: [string, string][]; en2vi: [string, string][] } | null = null;
function phrases(d: Dir, key: 'vi2en' | 'en2vi') {
  if (!phraseCache) phraseCache = { vi2en: [], en2vi: [] };
  if (!phraseCache[key].length)
    phraseCache[key] = [...d.exact.entries()].filter(([k]) => k.length >= 8 && !/^[A-ZĐ]/.test(k) === !/^[A-ZĐ]/.test(k)).sort((x, y) => y[0].length - x[0].length);
  return phraseCache[key];
}
function patch(text: string, d: Dir, key: 'vi2en' | 'en2vi'): string {
  let out = text;
  for (const [k, v] of phrases(d, key)) if (out.includes(k)) out = out.split(k).join(v);
  return out;
}

/** Đoán ngôn ngữ của một câu đã lưu */
export const looksVi = (s: string) => VN.test(s);

/** Dịch một câu sang ngôn ngữ đích; không dịch được thì trả lại nguyên câu */
export function retrans(text: string | null | undefined, to: Lang): string {
  if (!text || !dirs) return text ?? '';
  const isVi = looksVi(text);
  if ((to === 'vi') === isVi) return text;
  const key = to === 'en' ? 'vi2en' : 'en2vi';
  const d = dirs[key];
  const r = one(text, d, 0) ?? split(text, d, 0) ?? text;
  // còn sót chữ ngôn ngữ cũ thì vá từng cụm
  const left = to === 'en' ? looksVi(r) : /\b(the|you|your|and|of|with)\b/i.test(r);
  return left ? patch(r, d, key) : r;
}

// ---------- Đổi ngôn ngữ cho dữ liệu đã lưu ----------
import type { Character, Meta, PendingEvent } from './game/types';

/** Ngôn ngữ của một nhân vật đã lưu: có nhãn thì theo nhãn, không thì đoán từ gia phả */
export function charLang(c: Character): Lang {
  if (c.lang) return c.lang;
  const sample = (c.log ?? []).slice(0, 8).map((l) => l.text).join(' ') + ' ' + (c.origin ?? '');
  return looksVi(sample) ? 'vi' : 'en';
}

/** Dịch chữ đã lưu của nhân vật sang ngôn ngữ đang dùng. Tên người giữ nguyên. Trả true nếu có đổi. */
export function convertChar(c: Character, to: Lang, pending?: PendingEvent | null): boolean {
  if (charLang(c) === to) {
    c.lang = to;
    return false;
  }
  const t = (s: string | null | undefined) => (s ? retrans(s, to) : s);
  c.log = (c.log ?? []).map((l) => ({ ...l, text: t(l.text) as string }));
  for (const k of ['origin', 'linhCan', 'cause', 'enemy', 'region', 'birthPlace', 'maTitle'] as const) {
    const v = (c as unknown as Record<string, unknown>)[k];
    if (typeof v === 'string') (c as unknown as Record<string, unknown>)[k] = t(v);
  }
  if (pending) {
    pending.title = t(pending.title) as string;
    pending.text = t(pending.text) as string;
    pending.choices = pending.choices.map((ch) => ({ ...ch, label: t(ch.label) as string, hint: t(ch.hint) ?? undefined }));
  }
  c.lang = to;
  return true;
}

/** Dịch phần tóm tắt kiếp trước, lời tiên tri, nơi chôn rương trong hồ sơ */
export function convertMeta(m: Meta, to: Lang): Meta {
  const t = (s: string | null | undefined) => (s ? retrans(s, to) : s);
  const m2: Meta = { ...m };
  if (m.past) m2.past = { ...m.past, realmName: t(m.past.realmName) as string, cause: t(m.past.cause) ?? null, path: t(m.past.path) ?? null };
  if (m.stash) m2.stash = { ...m.stash, place: t(m.stash.place) as string };
  if (m.prophecy) m2.prophecy = { ...m.prophecy, text: t(m.prophecy.text) as string };
  return m2;
}
