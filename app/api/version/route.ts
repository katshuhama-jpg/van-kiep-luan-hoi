/**
 * Mã bản build đang chạy. Trình duyệt hỏi định kỳ để biết có bản mới chưa.
 * 16/11: dựng sẵn lúc build (CDN trả, không chạy hàm máy chủ). Giờ máy chủ để tính Hồn lực lấy từ
 * dòng Date mà CDN gắn vào mọi phản hồi (lib/serverTime.ts), nên không còn trường `now` ở đây.
 */
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ v: process.env.NEXT_PUBLIC_BUILD ?? '' }, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } });
}
