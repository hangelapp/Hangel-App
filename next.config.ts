
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  typescript: {
    // 0 errors baseline; CI also enforces. Switch to true only if a regression
    // must be merged in an emergency.
    ignoreBuildErrors: false,
  },
  eslint: {
    // 0 problems baseline; CI also enforces.
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  images: {
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gelirortaklari.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gelirortaklari.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'reklamaction.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.reklamaction.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'affocean.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.affocean.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
