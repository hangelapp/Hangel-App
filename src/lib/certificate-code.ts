/**
 * hangel Sertifika Kodu — ULUSLARARASI, yapısal, TİRESİZ, Luhn sağlamalı.
 *
 * Biçim (tiresiz):  H + {ülke}{tür}{yıl}{faaliyetNo}{kişiNo3}{checksum}
 * Örnek:  H9022610076
 *   → H · 90 (ülke=TR) · 2 (tür=etkinlik) · 26 (yıl=2026) · 1 (yılın 1. etkinliği)
 *     · 007 (7. katılımcı) · 6 (Luhn sağlama)
 *
 * Tür: 1 Gönüllülük · 2 Etkinlik · 3 Bağış · 4 Kan bağışı
 *
 * NEDEN tiresiz sorun değil: gerçek doğrulama /api/certificate/verify → DB'de KOD
 * STRING eşlemesidir; yapısal alanlar (ülke/tür/yıl/faaliyet/kişi) sertifika
 * dokümanında AYRICA saklanır. Checksum son haneden okunur (Luhn), yani elle yazım
 * hatası DB'ye gitmeden anında yakalanır.
 *
 * Saf TS (Firebase importu yok) — client (PDF) + server (API/route) ortak.
 */

export const CERT_VERIFY_BASE = 'https://hangel.org.tr/c/';

export type CertKind = 'volunteer' | 'event' | 'donation' | 'blood';

const KIND_TO_CODE: Record<CertKind, string> = { volunteer: '1', event: '2', donation: '3', blood: '4' };
const CODE_TO_KIND: Record<string, CertKind> = { '1': 'volunteer', '2': 'event', '3': 'donation', '4': 'blood' };

const DIALING_TO_COUNTRY: Record<string, string> = {
  '90': 'Türkiye', '1': 'ABD/Kanada', '44': 'Birleşik Krallık', '49': 'Almanya', '33': 'Fransa',
  '39': 'İtalya', '34': 'İspanya', '31': 'Hollanda', '32': 'Belçika', '41': 'İsviçre', '43': 'Avusturya',
  '7': 'Rusya', '380': 'Ukrayna', '48': 'Polonya', '46': 'İsveç', '47': 'Norveç', '45': 'Danimarka',
  '358': 'Finlandiya', '30': 'Yunanistan', '40': 'Romanya', '36': 'Macaristan', '420': 'Çekya',
  '971': 'BAE', '966': 'S. Arabistan', '974': 'Katar', '965': 'Kuveyt', '973': 'Bahreyn', '968': 'Umman',
  '20': 'Mısır', '212': 'Fas', '216': 'Tunus', '213': 'Cezayir', '218': 'Libya', '964': 'Irak',
  '963': 'Suriye', '962': 'Ürdün', '961': 'Lübnan', '98': 'İran', '92': 'Pakistan', '91': 'Hindistan',
  '86': 'Çin', '81': 'Japonya', '82': 'G. Kore', '60': 'Malezya', '62': 'Endonezya', '994': 'Azerbaycan',
  '995': 'Gürcistan', '996': 'Kırgızistan', '998': 'Özbekistan', '992': 'Tacikistan', '993': 'Türkmenistan',
  '61': 'Avustralya', '64': 'Y. Zelanda', '55': 'Brezilya', '52': 'Meksika', '54': 'Arjantin',
  '27': 'G. Afrika', '234': 'Nijerya', '254': 'Kenya', '880': 'Bangladeş',
};

export function countryName(dialing?: string): string | undefined {
  return dialing ? DIALING_TO_COUNTRY[dialing] : undefined;
}

export function kindLabelTr(kind?: CertKind): string {
  switch (kind) {
    case 'volunteer': return 'Gönüllülük Sertifikası';
    case 'donation': return 'Bağış Sertifikası';
    case 'blood': return 'Kan Bağışı Sertifikası';
    default: return 'Etkinlik Katılım Sertifikası';
  }
}

function normCountry(c?: string): string {
  const v = (c || '90').replace(/[^0-9]/g, '');
  return v || '90';
}

function pad3(n: number): string {
  return String(Math.floor(n)).padStart(3, '0');
}

function hashNum(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** Luhn sağlama hanesi (kredi kartı yöntemi) — yanlış rakamı + yer değiştirmeyi yakalar. */
export function luhnCheckDigit(numStr: string): number {
  let sum = 0;
  let dbl = true; // en sağdaki payload hanesi çiftlenir
  for (let i = numStr.length - 1; i >= 0; i--) {
    let d = numStr.charCodeAt(i) - 48;
    if (d < 0 || d > 9) continue;
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10;
}

export interface CertCodeInput {
  kind?: CertKind;
  country?: string;       // arama kodu, default '90'
  year?: number;          // 2026 veya 26 → 2 hane; verilmezse içinde bulunulan yıl
  activityNo?: number;    // o yıl o türdeki sıralı faaliyet no (1'den)
  personNo?: number;      // o faaliyetteki sıralı kişi no
  idSeed?: string;        // activityNo/personNo yoksa buradan türetilir (sunucu-dışı sertifikalar)
}

/** Tiresiz yapısal kod: H + ülke + tür + yıl + faaliyetNo + kişiNo(3) + Luhn. */
export function buildCertCode(input: CertCodeInput): string {
  const cc = normCountry(input.country);
  const ty = KIND_TO_CODE[input.kind || 'event'] || '2';
  const rawYear = input.year ?? new Date().getFullYear();
  const yy = String(((rawYear % 100) + 100) % 100).padStart(2, '0');
  const act = Number.isFinite(input.activityNo) && (input.activityNo as number) >= 1
    ? String(Math.floor(input.activityNo as number))
    : String(hashNum(input.idSeed || '', 100000));
  const pn = Number.isFinite(input.personNo) && (input.personNo as number) >= 1
    ? pad3(input.personNo as number)
    : pad3(hashNum((input.idSeed || '') + 'p', 1000));
  const payload = `${cc}${ty}${yy}${act}${pn}`;
  return `H${payload}${luhnCheckDigit(payload)}`;
}

export interface DecodedCertCode {
  valid: boolean; // biçim + Luhn checksum tutuyor mu (gerçek geçerlilik = DB eşlemesi)
}

/** Yapısal alanlar DB'de saklı; burada yalnız biçim + Luhn sağlaması doğrulanır. */
export function decodeCertCode(raw: string): DecodedCertCode {
  const code = String(raw || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!/^H\d{7,}$/.test(code)) return { valid: false };
  const digits = code.slice(1);
  const payload = digits.slice(0, -1);
  const chk = Number(digits.slice(-1));
  if (luhnCheckDigit(payload) !== chk) return { valid: false };
  return { valid: true };
}

/** DB'de saklanan yapısal alanlardan kodu kanonik biçime getirir (normalize). */
export function normalizeCertCode(raw: string): string {
  return String(raw || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function certVerifyUrl(code: string): string {
  return CERT_VERIFY_BASE + code;
}
