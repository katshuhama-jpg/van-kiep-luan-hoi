/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mã bản build: trình duyệt so với máy chủ để biết đã có bản mới
  env: { NEXT_PUBLIC_BUILD: process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()) },
};

export default nextConfig;
