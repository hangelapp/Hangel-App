import { NextResponse, type NextRequest } from 'next/server';

/**
 * İki host-bazlı yönlendirme:
 *
 * 1) STK alt alan adı: `{slug}.hangel.org.tr` → o STK'nın YAYINLANMIŞ sitesi.
 *    Middleware tek-etiketli, rezerve olmayan alt alanı yakalar ve
 *    `/ngo-sites/s/{slug}` render rotasına rewrite eder; orada STK shortLink/slug
 *    ile çözümlenip siteSettings'ten gerçek veriyle render edilir. (Ana domain,
 *    www ve App Hosting servis alan adları `.hangel.org.tr` ile bitmediği için
 *    ETKİLENMEZ — güvenli.)
 *
 * 2) Kütük kısa-linki: ana alanda salt-rakam `/<kutukNo>` → `/k/<kutukNo>`.
 *
 * matcher API/_next/static asset'lerini dışlar.
 */
const NUMERIC_KUTUK_RE = /^\/\d{4,12}$/;
const ROOT_DOMAIN = 'hangel.org.tr';
// STK alt alanı SAYILMAYAN rezerve etiketler.
const RESERVED_SUBS = new Set(['www', 'app', 'admin', 'api', 'mail', 'm', 'cdn', 'static', '']);

function getHost(req: NextRequest): string {
  const h = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return h.split(':')[0].toLowerCase().trim();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = getHost(req);

  // 1) STK alt alan adı.
  if (host.endsWith('.' + ROOT_DOMAIN)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1)); // baştaki "{sub}." → "{sub}"
    if (sub && !sub.includes('.') && !RESERVED_SUBS.has(sub)) {
      const url = req.nextUrl.clone();
      // Tek sayfalık STK sitesi — tüm path'ler aynı render rotasına gider.
      url.pathname = `/ngo-sites/s/${encodeURIComponent(sub)}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2) Kütük kısa-linki (ana alan).
  if (NUMERIC_KUTUK_RE.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/k${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
