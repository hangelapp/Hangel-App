import { NextResponse, type NextRequest } from 'next/server';

/**
 * Kütük kısa-linki: hangel.org.tr/<kutukNo> doğrudan ilgili STK profiline
 * çözümlensin. Middleware salt rakamdan oluşan 4-12 haneli pathleri yakalar
 * ve /k/<kutukNo> rota handler'ına rewrite eder; orada Admin SDK ile NGO
 * çözümlenip /ngos/<id>'ye redirect edilir.
 *
 * Notlar:
 *  - 4-12 hane: tipik dernek/vakıf kütük no aralığı (8-10 rakam yaygın).
 *  - Yalnız "/<digits>" path'lerinde tetiklenir — alt path veya sorgu
 *    string'i olanlara dokunmaz.
 *  - matcher API/_next/static asset'lerini zaten dışlar.
 */
const NUMERIC_KUTUK_RE = /^\/\d{4,12}$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
