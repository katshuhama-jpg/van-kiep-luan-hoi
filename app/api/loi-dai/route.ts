/**
 * 5/11 chống gian lận: Lôi đài và chiến thư tính trận trên máy chủ.
 * Trước đây trình duyệt tự đánh rồi báo "thắng/thua" lên, sửa được. Giờ trình duyệt chỉ gửi số phi kiếm đã cắm
 * (phần chơi tay), máy chủ lấy bóng hai bên từ cơ sở dữ liệu, tự đánh với một hạt giống ngẫu nhiên, ghi kết quả,
 * rồi trả hạt giống và hai bóng để trình duyệt phát lại đúng trận đó.
 * Ghi kết quả qua vkl_arena_fight_srv / vkl_thach_fight_srv (cần VKL_SRV_SECRET, chỉ máy chủ biết).
 */
import { createClient } from '@supabase/supabase-js';
import { autoClash, powerOf } from '@/lib/game/phiKiem';
import { baseChance, equalize, ruleOf } from '@/lib/game/arena';
import { seeded } from '@/lib/game/helpers';
import { toRival } from '@/lib/rival';
import type { RivalChar } from '@/lib/game/types';

export const dynamic = 'force-dynamic';

/** Số phi kiếm tối đa cắm được trong một lượt (12 giây, mỗi lần phóng cách nhau ít nhất 0,14 giây) */
const MAX_SWORDS = 60;

type Body = { token?: string; mode?: 'arena' | 'thach'; opp?: string; revenge?: number | null; lifeId?: number; myLifeId?: number; swords?: number };

const bad = (error: string, status = 400) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const secret = process.env.VKL_SRV_SECRET;
  // chưa cấu hình khóa: trình duyệt dùng cách ghi cũ
  if (!secret) return bad('NO_SRV', 503);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return bad('NO_DB', 503);
  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return bad('BAD_BODY');
  }
  const token = String(b.token ?? '');
  const opp = String(b.opp ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(token) || !opp) return bad('BAD_BODY');
  const swords = Math.max(0, Math.min(MAX_SWORDS, Math.floor(Number(b.swords) || 0)));
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

  // bóng của mình
  const st = await sb.rpc('vkl_arena_state2', { p_token: token });
  const meRow = (st.data as { me?: { username?: string; champ?: unknown } | null } | null)?.me;
  if (st.error || !meRow?.username) return bad('NOT_LOGGED_IN', 401);
  const username = meRow.username;
  let me: RivalChar | null = null;
  let foe0: RivalChar | null = null;
  const mode = b.mode === 'thach' ? 'thach' : 'arena';
  if (mode === 'arena') {
    me = meRow.champ ? toRival(username, meRow.champ) : null;
    if ((b.revenge ?? 0) > 0) {
      const r = await sb.rpc('vkl_arena_shadow', { p_username: opp });
      foe0 = r.error || !r.data ? null : toRival(opp, r.data);
    } else {
      // trận thường: đối thủ phải đúng người máy chủ đã rút (quẻ chưa giải thì rút lại ra đúng người cũ)
      const r = await sb.rpc('vkl_arena_draw', { p_token: token });
      const d = r.data as { opp?: string; shadow?: unknown; error?: string } | null;
      if (r.error || !d || d.error) return bad(d?.error ?? 'NO_OPP');
      if (d.opp !== opp) return bad('BAD_OPP');
      foe0 = d.shadow ? toRival(opp, d.shadow) : null;
    }
  } else {
    const c = await sb.rpc('vkl_arena_candidates', { p_token: token });
    const mine = Array.isArray(c.data) ? (c.data as unknown[]).map((d) => toRival(username, d)).filter((x): x is RivalChar => !!x) : [];
    me = mine.find((x) => x.lifeId === Number(b.myLifeId)) ?? null;
    if ((b.lifeId ?? 0) > 0) {
      const r = await sb.rpc('vkl_life_shadow_get', { p_id: Number(b.lifeId) });
      const d = r.data as { player?: string; shadow?: unknown } | null;
      if (d?.player && d.player !== opp) return bad('BAD_OPP');
      foe0 = d?.shadow ? toRival(opp, d.shadow) : null;
    } else {
      const r = await sb.rpc('vkl_arena_shadow', { p_username: opp });
      foe0 = r.error || !r.data ? null : toRival(opp, r.data);
    }
  }
  if (!me || !foe0) return bad('NO_SHADOW');

  // tự đánh, đúng như trình duyệt sẽ phát lại
  const rule = ruleOf();
  const foe = mode === 'thach' ? foe0 : equalize(foe0, me);
  const base = baseChance(me, foe, rule);
  const seed = Math.floor(Math.random() * 4294967296);
  const clash = autoClash(me, foe0, base, rule, powerOf(swords), seeded(seed));
  const hp = clash.hpPct;
  const detail = `${me.name} ${clash.win ? 'hạ' : 'bại dưới tay'} ${foe.name}, cắm ${swords} phi kiếm, ${clash.win ? 'còn' : 'đối thủ còn'} ${hp}% máu. Luật hôm nay: ${rule.name}.`;
  const rec =
    mode === 'thach'
      ? await sb.rpc('vkl_thach_fight_srv', { p_secret: secret, p_token: token, p_opp: opp, p_life_id: Number(b.lifeId) || 0, p_win: clash.win, p_hp: hp, p_swords: swords, p_detail: detail })
      : await sb.rpc('vkl_arena_fight_srv', { p_secret: secret, p_token: token, p_opp: opp, p_win: clash.win, p_detail: detail, p_revenge: Number(b.revenge) || 0, p_hp: hp, p_swords: swords });
  if (rec.error) return bad('RECORD_FAIL', 500);
  return Response.json({ seed, swords, win: clash.win, hp, me, foe0, clash, res: rec.data }, { headers: { 'Cache-Control': 'no-store' } });
}
