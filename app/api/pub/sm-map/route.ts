/**
 * 4.6.0 Sơn Môn: bản đồ lục giác công khai qua bộ đệm Vercel 30 giây (RPC vkl_sm_map).
 * Mọi người xem bản đồ cùng lúc thì máy chủ chỉ tính lại mỗi 30 giây một lần.
 * Cờ SON_MON_ON tắt thì trả 404, không lộ gì.
 */
import { createClient } from '@supabase/supabase-js';
import { SON_MON_ON } from '@/lib/flags';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!SON_MON_ON) return Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const k = new URL(req.url).searchParams.get('ky');
  const ky = k && /^\d{1,6}$/.test(k) ? Number(k) : null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ error: 'cfg' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc('vkl_sm_map', { p_ky: ky });
  if (error) return Response.json({ error: 'db' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=10' } });
  return Response.json(data ?? { ky: null, o: [], mon: {}, di: [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
