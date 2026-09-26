import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Allow the dev machine's LAN IP to load /_next/* dev assets (so testing on a
  // phone over http://<ip>:3000 or https://<ip>:3000 works without warnings).
  allowedDevOrigins: ['10.60.50.73'],
  poweredByHeader: false,
  images: {
    // Optimized copies are cached for 30 days (served to browsers with the same max-age).
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  // The distributor-dashboard demo is retired — the real shop/distributor partner
  // dashboard lives at /shop-partner.
  // Long browser caching for static design assets / brand files in public/.
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }];
    return [
      { source: '/design/:path*', headers: cache },
      { source: '/:file(favicon.ico|favicon.png|brand-logo-v3.png|white-logo-bm.png)', headers: cache },
    ];
  },
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
