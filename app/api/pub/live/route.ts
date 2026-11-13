/**
 * 13/11: số liệu "giang hồ đang sống" của trang đầu, qua bộ đệm Vercel 60 giây.
 * Trước đây mỗi tab đang mở tự gửi 5 truy vấn lên cơ sở dữ liệu; giờ cả server chỉ tính một lần mỗi phút.
 */
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const isTest = (n: string) => /^(test|ui)_/.test(n) || n === 'Khách' || n === 'Guest';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ error: 'no db' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // nửa đêm giờ Việt Nam
  const vn = new Date(Date.now() + 7 * 3600_000);
  const midnight = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - 7 * 3600_000);
  const [online, feed, total, today, lives] = await Promise.all([
    sb.rpc('vkl_online_now7'),
    sb.rpc('vkl_live_feed'),
    sb.from('vkl_lives').select('id', { count: 'estimated', head: true }),
    sb.from('vkl_lives').select('player_name').gte('created_at', midnight.toISOString()).limit(2000),
    sb
      .from('vkl_lives')
      .select('id, player_name, char_name, life_no, age, realm, realm_no, layer_no, ascended, cause, epitaph, incense, created_at, look')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);
  const body = {
    online: typeof online.data === 'number' ? online.data : null,
    feed: Array.isArray(feed.data) ? feed.data : [],
    total: total.count ?? null,
    today: today.data ? new Set((today.data as { player_name: string }[]).map((r) => r.player_name).filter((n) => !isTest(n))).size : null,
    lives: ((lives.data as { player_name: string }[] | null) ?? []).filter((l) => !isTest(l.player_name)),
  };
  return Response.json(body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
