/**
 * 13/11: bảng xếp hạng qua bộ đệm Vercel.
 * Trước đây mỗi lần vào kiếp mới, trình duyệt gọi thẳng 3 bảng xếp hạng lên cơ sở dữ liệu. vkl_leaderboard2 chạy quá
 * giới hạn thời gian (bị hủy sau ~4 giây) rồi mới lùi về vkl_leaderboard (~3 giây), nên giờ đông người máy chủ nghẹt.
 * Giờ kết quả mỗi bảng được giữ ở Vercel 2 phút: cả server chỉ tính lại một lần mỗi 2 phút cho mỗi loại bảng.
 */
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const KINDS = new Set(['power', 'wealth', 'age']);
const ok = (s: string | null, re = /^[a-z_]{1,24}$/) => (s && re.test(s) ? s : null);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const k = ok(q.get('kind'));
  const kind = k && KINDS.has(k) ? k : null;
  const lean = ok(q.get('lean')) ?? 'all';
  const path = ok(q.get('path')) ?? 'all';
  const scope = ok(q.get('scope')) ?? 'all';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!kind || !url || !key) return Response.json({ error: 'bad' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const args = { p_kind: kind, p_lean: lean, p_path: path, p_scope: scope };
  // 13/11: vkl_leaderboard3 đọc bảng tính sẵn vkl_priv.lb_row (pg_cron làm mới 2 phút/lần, supabase/bang_xep_hang_2026_11_13.sql)
  let { data, error } = await sb.rpc('vkl_leaderboard3', args);
  if (error) ({ data, error } = await sb.rpc('vkl_leaderboard2', args));
  if (error) ({ data, error } = await sb.rpc('vkl_leaderboard', args));
  if (error) return Response.json({ error: 'db' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=15' } });
  return Response.json(data ?? [], { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } });
}
