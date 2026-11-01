/** @type {import('next').NextConfig} */

// Ảnh tĩnh (LPC, pixel, icon, nền): cho trình duyệt giữ 7 ngày để không hỏi lại Vercel mỗi lần mở game.
// Mặc định Vercel trả max-age=0 nên mỗi ảnh là một request, từng làm vượt hạn mức 1M CDN Requests (1/11/2026).
// Sửa ảnh mà giữ tên file thì người chơi cũ có thể thấy ảnh cũ tới 7 ngày; muốn thấy ngay thì đổi tên file.
const ANH_TINH = 'public, max-age=604800, stale-while-revalidate=86400';

const nextConfig = {
  reactStrictMode: true,
  // mã bản build: trình duyệt so với máy chủ để biết đã có bản mới
  env: { NEXT_PUBLIC_BUILD: process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()) },
  async headers() {
    return ['lpc', 'px', 'icons', 'bg'].map((d) => ({
      source: `/${d}/:path*`,
      headers: [{ key: 'Cache-Control', value: ANH_TINH }],
    }));
  },
};

export default nextConfig;
