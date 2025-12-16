/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Vercel 배포용 (output: "export" 제거 - Vercel은 자동으로 최적화)
  // output: "export", // Vercel에서는 필요 없음

  images: {
    // ✅ Vercel에서는 next/image 최적화 서버가 자동으로 제공됨
    // unoptimized: true, // Vercel에서는 필요 없음

    // ✅ 외부 이미지 도메인 허용
    remotePatterns: [
      { protocol: "https", hostname: "i.namu.wiki" },
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "ecimg.cafe24img.com" },
    ],
  },
};

module.exports = nextConfig;
