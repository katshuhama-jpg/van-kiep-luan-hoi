/**
 * 14/11: danh hiệu tuần (vkl_titles_char) qua bộ đệm Vercel 5 phút.
 * Hàm này giống nhau với mọi người chơi nhưng mất ~600 ms mỗi lần và được gọi ~3.000 lần/ngày
 * (đứng thứ ba về thời gian chạy trong pg_stat_statements). Giờ cả server chỉ tính lại 5 phút một lần.
 */
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ error: 'no db' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc('vkl_titles_char');
  if (error) return Response.json({ error: 'db' }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=15' } });
  return Response.json(data ?? [], { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } });
}
