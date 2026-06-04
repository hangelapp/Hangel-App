
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
          // HSTS: 2 yıl + preload — HTTPS zorunlu (downgrade attack engeller)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // iOS Universal Links — Apple bu dosyayı uzantısız ister, application/json bekler.
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        // Android App Links — Digital Asset Links protocol.
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
  images: {
    // P2-3: Image optimization re-enabled (was `unoptimized: true`). Capacitor
    // mobile shell loads `https://hangel.org.tr` (server.url in capacitor.config.ts),
    // so the production Next.js server serves optimized images. The `webDir: 'out'`
    // static export is now a stale dev artifact and not consumed at runtime.
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
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'books.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.gr-assets.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ia.media-imdb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'resizing.flixster.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
