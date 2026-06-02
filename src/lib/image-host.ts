/**
 * Next.js `Image` component yalnızca `next.config.ts` içindeki `remotePatterns`
 * whitelist'inde yer alan host'lardan görseli optimize eder. Admin Firestore'a
 * whitelist dışı bir `coverUrl` yazarsa server-side `<Image>` 500 fırlatır.
 *
 * Bu helper runtime'da URL host'unu doğrular; whitelist dışıysa caller'ın
 * placeholder fallback'e düşmesini sağlar.
 */

// TODO: sync with next.config.ts `images.remotePatterns` — exact string copy.
const ALLOWED_HOSTS: ReadonlyArray<string> = [
  'placehold.co',
  'images.unsplash.com',
  'picsum.photos',
  'logo.clearbit.com',
  'gelirortaklari.com',
  '*.gelirortaklari.com',
  'reklamaction.com',
  '*.reklamaction.com',
  'affocean.com',
  '*.affocean.com',
  'api.qrserver.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
];

function parseHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function matchesPattern(hostname: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    // Wildcard subdomain: `*.example.com` matches `a.example.com`, `a.b.example.com`,
    // but NOT bare `example.com` (Next.js behavior matches this).
    const suffix = pattern.slice(1); // ".example.com"
    return hostname.endsWith(suffix) && hostname.length > suffix.length;
  }
  return hostname === pattern;
}

/**
 * Returns true if `url` is a https URL whose hostname is whitelisted in
 * next.config.ts `remotePatterns`. Invalid URL or non-matching host -> false.
 */
export function isAllowedImageHost(url: string | undefined | null): boolean {
  if (!url) return false;
  const hostname = parseHostname(url);
  if (!hostname) return false;
  return ALLOWED_HOSTS.some((pattern) => matchesPattern(hostname, pattern));
}
