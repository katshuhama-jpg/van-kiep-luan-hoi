import { cardPng } from '@/lib/cardServer';

/** Ảnh 1200x630 của thẻ khoe, dùng làm og:image */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{6,16}$/.test(id)) return new Response('Not found', { status: 404 });
  const b64 = await cardPng(id);
  if (!b64) return new Response('Not found', { status: 404 });
  const buf = Buffer.from(b64, 'base64');
  return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' } });
}
