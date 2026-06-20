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
  // The old email/password shop-partner portal is retired — partners now use the
  // simple phone+OTP login on the distributor dashboard.
  async redirects() {
    return [
      { source: '/shop-partner', destination: '/distributor-dashboard', permanent: false },
      { source: '/shop-partner/:path*', destination: '/distributor-dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
