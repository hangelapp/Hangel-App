import { NextRequest } from 'next/server';

// Same-origin görsel proxy — harici logoları (Firebase Storage, kurum siteleri)
// CORS engeli olmadan canvas'a çizebilmek için kullanılır (ör. QR ortasındaki logo).
// Tarayıcı isteği same-origin olduğundan crossOrigin='anonymous' ile canvas
// kirlenmez → toDataURL (indirme) da çalışır.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Basit SSRF koruması: yalnız http(s) + iç/özel adresleri engelle.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h === 'metadata.google.internal' ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new Response('missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new Response('bad protocol', { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return new Response('forbidden host', { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; hangel-img-proxy)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return new Response('upstream error', { status: 502 });

    const ct = upstream.headers.get('content-type') || 'image/png';
    if (!ct.startsWith('image/')) return new Response('not an image', { status: 415 });

    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
}
