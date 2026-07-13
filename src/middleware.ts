import { NextResponse, type NextRequest } from 'next/server';

/**
 * İki host-bazlı yönlendirme:
 *
 * 1) STK alt alan adı: `{slug}.hangel.org` → o STK'nın YAYINLANMIŞ sitesi.
 *    Middleware tek-etiketli, rezerve olmayan alt alanı yakalar ve
 *    `/ngo-sites/s/{slug}` render rotasına rewrite eder; orada STK shortLink/slug
 *    ile çözümlenip siteSettings'ten gerçek veriyle render edilir. (Ana domain,
 *    www ve App Hosting servis alan adları `.hangel.org` ile bitmediği için
 *    ETKİLENMEZ — güvenli.)
 *
 * 2) Kütük kısa-linki: ana alanda salt-rakam `/<kutukNo>` → `/k/<kutukNo>`.
 *
 * matcher API/_next/static asset'lerini dışlar.
 */
const NUMERIC_KUTUK_RE = /^\/\d{4,12}$/;
const ROOT_DOMAIN = 'hangel.org';
// Vanity kısa-linkler (kampanya için). hangel.org/worldcleanday ve /cleanday →
// Guinness temizlik rekoru etkinliği. Kısa URL adres çubuğunda kalsın diye rewrite.
const VANITY_SHORTLINKS: Record<string, string> = {
  '/worldcleanday': '/volunteering/worldcleanday-2026',
  '/cleanday': '/volunteering/worldcleanday-2026',
};
// Eski/önceki nesil site adresleri (Google'da hâlâ indeksli, boş sayfaya düşüyor).
// 301 kalıcı yönlendirme ile arama motoru eski URL'leri yeni sayfalara taşır ve
// kullanıcı boş sayfa yerine doğru içeriğe ulaşır. (Samara raporu: madde 13,14,21)
const LEGACY_REDIRECTS: Record<string, string> = {
  '/stk': '/ngos',
  '/en': '/',
  '/en/markalar': '/market',
  '/markalar': '/market',
  '/sozlesmeler': '/settings/contracts',
  '/hangel_app': '/app',
  '/hangel-org-gonulluk-protokolu': '/settings/contracts',
  '/hakkimizda': '/about',
  '/iletisim': '/support/app-support',
};
// STK alt alanı SAYILMAYAN rezerve etiketler.
const RESERVED_SUBS = new Set(['www', 'app', 'admin', 'api', 'mail', 'm', 'cdn', 'static', '']);
// Uygulamanın KENDİ servis ettiği host'lar — custom domain SAYILMAZ.
const APP_HOST_SUFFIXES = ['.web.app', '.firebaseapp.com', '.run.app', '.a.run.app', '.hosted.app', '.cloudworkstations.dev'];
const APP_HOSTS_EXACT = new Set(['localhost', '127.0.0.1', '0.0.0.0', ROOT_DOMAIN, 'www.' + ROOT_DOMAIN]);

function getHost(req: NextRequest): string {
  const h = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return h.split(':')[0].toLowerCase().trim();
}

function isAppHost(host: string): boolean {
  if (APP_HOSTS_EXACT.has(host)) return true;
  if (host.endsWith('.' + ROOT_DOMAIN)) return true; // alt alanlar ayrı ele alınır
  return APP_HOST_SUFFIXES.some((sfx) => host.endsWith(sfx));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = getHost(req);

  // 0a) www.hangel.org → hangel.org (kanonik host). SEO + tutarlılık; www boş
  //     içerik döndürüyordu (Samara raporu: madde 22). 301 kalıcı.
  if (host === 'www.' + ROOT_DOMAIN) {
    const url = req.nextUrl.clone();
    url.host = ROOT_DOMAIN;
    url.hostname = ROOT_DOMAIN;
    return NextResponse.redirect(url, 301);
  }

  // 0b) Eski/ölü site adresleri → yeni sayfalara 301 (Samara raporu: 13,14,21).
  const legacyKey = pathname.replace(/\/+$/, '').toLowerCase();
  const legacyTarget = LEGACY_REDIRECTS[legacyKey];
  if (legacyTarget) {
    const url = req.nextUrl.clone();
    url.pathname = legacyTarget;
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // 1) STK alt alan adı: {slug}.hangel.org → STK sitesi.
  if (host.endsWith('.' + ROOT_DOMAIN)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1)); // baştaki "{sub}." → "{sub}"
    if (sub && !sub.includes('.') && !RESERVED_SUBS.has(sub)) {
      const url = req.nextUrl.clone();
      url.pathname = `/ngo-sites/s/${encodeURIComponent(sub)}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2) STK custom domain (Cloudflare for SaaS ile proxylenir). Env ile kapalı
  //    başlar — Cloudflare bağlanıp app-serving host'lar doğrulanınca açılır.
  //    Yalnız uygulamanın kendi host'ları DIŞINDAKI host'lar custom domaindir.
  if (process.env.CUSTOM_DOMAINS_ENABLED === 'true' && host && !isAppHost(host)) {
    const url = req.nextUrl.clone();
    url.pathname = `/ngo-sites/d/${encodeURIComponent(host)}`;
    return NextResponse.rewrite(url);
  }

  // 3) Vanity kampanya kısa-linkleri (ana alan): /worldcleanday · /cleanday.
  //    REDIRECT (rewrite DEĞİL): hedef sayfa 'use client' + useParams() kullanıyor;
  //    rewrite'ta tarayıcı URL'i /worldcleanday kalıp [id] paramı boş gelir → notFound.
  //    Redirect ile tarayıcı gerçek /volunteering/<id>'ye gider, param doğru dolar.
  const vanityKey = pathname.replace(/\/+$/, '').toLowerCase();
  const vanityTarget = VANITY_SHORTLINKS[vanityKey];
  if (vanityTarget) {
    const url = req.nextUrl.clone();
    url.pathname = vanityTarget;
    return NextResponse.redirect(url, 307);
  }

  // 4) Kütük kısa-linki (ana alan).
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
