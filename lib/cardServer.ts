/** Đọc thẻ khoe từ database ở phía máy chủ (trang /k/[id] và ảnh og) */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function rpc<T>(fn: string, body: Record<string, unknown>, revalidate = 3600): Promise<T | null> {
  if (!URL_ || !KEY) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export type CardMeta = { id: string; owner: string; kind: 'life' | 'match'; title: string; desc: string; at: string };
export const cardMeta = (id: string) => rpc<CardMeta>('vkl_card_meta', { p_id: id });
export const cardPng = (id: string) => rpc<string>('vkl_card_png', { p_id: id }, 86400);
