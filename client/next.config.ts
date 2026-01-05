import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    const baseUrl =
      process.env.NEXT_PUBLIC_ORCA_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
      'http://localhost:8000';

    const normalized = baseUrl.replace(/\/+$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${normalized}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
