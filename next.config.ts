import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i2.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i3.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i4.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'iili.io',
      },
      {
        protocol: 'https',
        hostname: 'd1q70pf5vjeyhc.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'd2p7pge43lyniu.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'clear-elephant-794.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: 'static.aiquickdraw.com',
      },
      {
        protocol: 'https',
        hostname: 'tempfile.aiquickdraw.com',
      },
    ],
  },
};

export default nextConfig;
