/**
 * Org profili zenginleştirme: HTML'den deterministik regex çıkarımları.
 *
 * Hiçbir AI çağrısı yok; salt regex + URL pattern matching. Çıkan değerler
 * "verified" değildir, "extracted from official source" olarak işaretlenir;
 * UI tarafında kullanıcıya bu kaynak gösterilir.
 */

export interface ExtractedContact {
  emails: string[];
  phones: string[];
  social: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  addressText?: string;
}

// Trabzon başta olmak üzere şehir/posta kodu/sokak içeren satırları yakala.
const ADDRESS_HINTS = ['adres', 'address', 'merkez', 'genel merkez', 'iletişim adresi'];

const TR_CITY_HINTS = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Trabzon', 'Eskişehir', 'Mersin', 'Diyarbakır', 'Samsun', 'Kayseri', 'Şanlıurfa',
];

// Türkiye telefon: +90 5xx xxx xx xx | 0 5xx xxx xx xx | (0212) 555 5555
const PHONE_RE = /(?:\+?9?0[\s.-]?)?(?:\(?0?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g;
// Geniş e-posta (RFC simplified)
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Sosyal medya: handle bağı (instagram.com/USER, x.com/USER, …)
const SOCIAL_PATTERNS: Array<[keyof ExtractedContact['social'], RegExp]> = [
  ['instagram', /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{1,32})/i],
  ['twitter', /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})/i],
  ['facebook', /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([A-Za-z0-9._-]{2,60})/i],
  ['linkedin', /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/([A-Za-z0-9_-]{2,80})/i],
  ['youtube', /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)([A-Za-z0-9_-]{2,80})/i],
  ['tiktok', /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9_.]{2,30})/i],
];

const STOP_HANDLES = new Set(['sharer', 'share', 'intent', 'tr', 'en', 'login', 'home']);

export function extractContact(html: string): ExtractedContact {
  const out: ExtractedContact = { emails: [], phones: [], social: {} };

  // Emails — uniq + filter obvious noise
  const emailSet = new Set<string>();
  for (const m of html.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase();
    if (e.includes('sentry') || e.includes('example.com') || e.includes('@example.') || e.endsWith('.png') || e.endsWith('.jpg')) continue;
    emailSet.add(e);
  }
  out.emails = Array.from(emailSet).slice(0, 5);

  // Phones — uniq + normalize to spaces
  const phoneSet = new Set<string>();
  for (const m of html.matchAll(PHONE_RE)) {
    const raw = m[0].replace(/[\s.\-()]+/g, ' ').replace(/\s+/g, ' ').trim();
    // Bazı false positives (tarih, kart no): en az 7 hane olmalı
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 14) continue;
    phoneSet.add(raw);
  }
  out.phones = Array.from(phoneSet).slice(0, 3);

  // Sosyal medya — herhangi bir match'i al
  for (const [key, re] of SOCIAL_PATTERNS) {
    const m = html.match(re);
    if (m && m[1]) {
      const handle = m[1].toLowerCase();
      if (STOP_HANDLES.has(handle)) continue;
      out.social[key] = handle;
    }
  }

  // Adres — naïve: "Adres" geçen <p>/<div>/<li> bloğunu (HTML strip) yakala
  const addressRegex = new RegExp(`(?:${ADDRESS_HINTS.join('|')})\\s*[:—–-]\\s*([^<\\n]{20,200})`, 'i');
  const am = html.match(addressRegex);
  if (am && am[1]) {
    out.addressText = am[1].replace(/<[^>]+>/g, '').trim().slice(0, 200);
  } else {
    // Fallback: satırda Türk şehri geçen blok
    const lines = html.replace(/<[^>]+>/g, '\n').split(/\n+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 200);
    for (const line of lines) {
      if (TR_CITY_HINTS.some(c => line.includes(c)) && /\d/.test(line) && /[a-zA-Z]/.test(line)) {
        out.addressText = line.slice(0, 200);
        break;
      }
    }
  }

  return out;
}

/** İsim normalize — kütük matching için Türkçe karakter-insensitive lowercase. */
export function normalizeName(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Basit Levenshtein distance (kütük adı vs NGO adı eşleşmesi için). */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = cur;
    }
  }
  return dp[n];
}

/**
 * SSRF guard: localhost, private IP, link-local, metadata IP'lerini engelle.
 * GCP metadata service (169.254.169.254) ve özel ağ adresleri engellenir.
 */
function isPrivateOrInternalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return true;
  // IPv4: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local + GCP metadata)
  const parts = h.split('.').map(Number);
  if (parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // GCP metadata + link-local
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
  }
  return false;
}

/** Web fetch — 8s timeout + user agent. SSRF guard + http(s) only. Hata: null. */
export async function safeFetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    // SSRF guard: protocol + host kontrolü
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (isPrivateOrInternalHost(parsed.hostname)) return null;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HangelEnricherBot/1.0; +https://hangel.org)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr,en;q=0.8',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return null;
    return await res.text();
  } catch {
    return null;
  }
}
