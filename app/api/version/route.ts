/** Mã bản build đang chạy trên máy chủ. Trình duyệt hỏi định kỳ để biết có bản mới chưa. */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ v: process.env.NEXT_PUBLIC_BUILD ?? '' }, { headers: { 'Cache-Control': 'no-store' } });
}
