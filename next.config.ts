import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images and videos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
