/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出：next build 后生成 out/ 目录，可部署到任意静态托管
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
