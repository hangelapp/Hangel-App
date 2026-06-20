/**
 * hangel Sertifika Kodu — kısa, "H" ile başlayan, uluslararası-his veren doğrulama kodu.
 *
 * Tek bir 9 karakterlik kod (örn. H7K2QF9XA) içine GİZLİ olarak paketlenir:
 *   • tarih   (gün, 2020-01-01'den itibaren — 14 bit)
 *   • ülke    (ISO 3166-1 alpha-2, varsayılan TR — 10 bit)
 *   • tür     (etkinlik / gönüllülük — 1 bit)
 *   • idHash  (sertifika id'sinden türemiş kısa imza — 10 bit, çakışma direnci + DB eşleşmesi)
 *   • checksum (son karakter — yanlış yazımı yakalar)
 *
 * Kod, base32 (Crockford — karışan I/L/O/U yok) ile kodlanır; ne tarih ne ülke
 * çıplak gözle okunur ("gizli"), ama decodeCertCode ile geri çözülür. Kısa link:
 *   https://hangel.org.tr/c/{KOD}
 * Bu sayede QR'sız da elle yazılarak doğrulanabilir.
 *
 * Saf TS (Firebase importu yok) — hem client (PDF üretimi) hem server (API) import eder.
 * Aynı girdiden HER İKİ tarafta da AYNI kod üretilir (deterministik) → DB eşleşmesi çalışır.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (32 char)
const EPOCH_MS = Date.UTC(2020, 0, 1);
const DAY_MS = 86_400_000;
const MAX_DAYS = 16383; // 14 bit

export const CERT_VERIFY_BASE = 'https://hangel.org.tr/c/';

export type CertKind = 'event' | 'volunteer';

export interface CertCodeInput {
  date: string; // "YYYY-MM-DD" (veya parse edilebilir tarih)
  country?: string; // ISO alpha-2, default 'TR'
  kind?: CertKind;
  idSeed?: string; // sertifika id'si (deterministik idHash için)
}

export interface DecodedCertCode {
  valid: boolean;
  kind?: CertKind;
  country?: string;
  date?: string; // "YYYY-MM-DD"
  idHash?: number;
}

function daysSinceEpoch(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0;
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.min(MAX_DAYS, Math.floor((utc - EPOCH_MS) / DAY_MS)));
}

function hash10(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 1024; // 10 bit
}

function country10(country: string): number {
  const cc = (country || 'TR').toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(2, 'X').slice(0, 2);
  const v = (cc.charCodeAt(0) - 65) * 26 + (cc.charCodeAt(1) - 65);
  return ((v % 1024) + 1024) % 1024; // 0..1023 (10 bit; geçerli alpha-2 ≤ 675)
}

/** Deterministik 9 karakterlik sertifika kodu (H + 7 gövde + 1 checksum). */
export function buildCertCode(input: CertCodeInput): string {
  const days = daysSinceEpoch(input.date);
  const cc = country10(input.country || 'TR');
  const kindBit = input.kind === 'volunteer' ? 1 : 0;
  const idH = hash10(input.idSeed || `${input.date}|${input.kind || 'event'}`);

  // payload = idH + 1024*(kindBit + 2*cc + 2048*days)  → 35 bit, < 2^53 (güvenli)
  const payload = idH + 1024 * (kindBit + 2 * cc + 2048 * days);

  let body = '';
  for (let i = 6; i >= 0; i--) {
    const div = Math.pow(32, i);
    body += ALPHABET[Math.floor(payload / div) % 32];
  }
  let sum = 0;
  for (const ch of body) sum += ALPHABET.indexOf(ch);
  return 'H' + body + ALPHABET[sum % 32];
}

/** Kodu çöz + checksum doğrula. Geçersizse { valid: false }. */
export function decodeCertCode(raw: string): DecodedCertCode {
  const code = String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (code.length !== 9 || code[0] !== 'H') return { valid: false };
  const body = code.slice(1, 8);
  const chk = code[8];
  let sum = 0;
  let payload = 0;
  for (const ch of body) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return { valid: false };
    sum += idx;
    payload = payload * 32 + idx;
  }
  if (ALPHABET[sum % 32] !== chk) return { valid: false };

  const idH = payload % 1024;
  let r = Math.floor(payload / 1024);
  const kindBit = r % 2;
  r = Math.floor(r / 2);
  const cc = r % 1024;
  const days = Math.floor(r / 1024);

  const c0 = String.fromCharCode(65 + Math.floor(cc / 26));
  const c1 = String.fromCharCode(65 + (cc % 26));
  const date = new Date(EPOCH_MS + days * DAY_MS).toISOString().slice(0, 10);

  return { valid: true, kind: kindBit ? 'volunteer' : 'event', country: c0 + c1, date, idHash: idH };
}

/** Doğrulama kısa linki. */
export function certVerifyUrl(code: string): string {
  return CERT_VERIFY_BASE + code;
}
