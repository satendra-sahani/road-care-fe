import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  // The distributor-dashboard demo is retired — the real shop/distributor partner
  // dashboard lives at /shop-partner.
  async redirects() {
    return [
      { source: '/distributor-dashboard', destination: '/shop-partner', permanent: false },
    ];
  },
  // Same-origin API proxy. When the site is served over HTTPS (needed on a phone
  // for the microphone / secure context), the browser blocks plain-HTTP API calls
  // as "mixed content". Routing them through this same-origin path lets Next.js
  // forward them to the backend server-side, so the browser only makes secure
  // same-origin requests. The axios client switches to /proxy-api automatically
  // in that scenario (see src/services/api.ts).
  async rewrites() {
    const backend = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').replace(/\/$/, '');
    return [
      { source: '/proxy-api/:path*', destination: `${backend}/:path*` },
    ];
  },
};

export default nextConfig;
