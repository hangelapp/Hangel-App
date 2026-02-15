
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-hangel-new-v4-1771025305522.cluster-2nmnojxdmnfh2vwda4kd7uoumu.cloudworkstations.dev',
      '*.cloudworkstations.dev'
    ]
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
