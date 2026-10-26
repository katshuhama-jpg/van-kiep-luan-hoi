/** Mã bản build đang chạy trên máy chủ và giờ máy chủ. Trình duyệt hỏi để biết có bản mới chưa, và để tính Hồn lực. */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ v: process.env.NEXT_PUBLIC_BUILD ?? '', now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
