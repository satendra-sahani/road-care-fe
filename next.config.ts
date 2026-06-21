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
};

export default nextConfig;
