/**
 * SMS segment hesabı.
 * - GSM-7 default alfabesi: 160 char/seg, 153 char/seg (çoklu mesajda concat header için).
 * - UCS-2 (Türkçe karakter dahil): 70 char/seg, 67 char/seg.
 * - GSM-7 extension table (€, [, ], {, }, ~, \, |, ^) her biri 2 char olarak sayılır.
 */

const GSM7_BASIC = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
);

const GSM7_EXTENSION = new Set('\f^{}\\[~]|€');

export type SmsEncoding = 'GSM7' | 'UCS2';

export interface SegmentInfo {
  encoding: SmsEncoding;
  segments: number;
  chars: number;
  /** Görsel uzunluk (Unicode kod noktası sayısı), GSM-7 ext karakterleri için 2 olarak sayılır. */
  weightedChars: number;
  hasTurkishOnlyChars: boolean;
}

const TURKISH_ONLY_CHARS = new Set('ışğİŞĞ');

export function detectEncoding(body: string): SmsEncoding {
  for (const ch of body) {
    if (GSM7_BASIC.has(ch) || GSM7_EXTENSION.has(ch)) continue;
    return 'UCS2';
  }
  return 'GSM7';
}

function countWeightedGsm7(body: string): number {
  let count = 0;
  for (const ch of body) {
    count += GSM7_EXTENSION.has(ch) ? 2 : 1;
  }
  return count;
}

function hasTurkishOnly(body: string): boolean {
  for (const ch of body) {
    if (TURKISH_ONLY_CHARS.has(ch)) return true;
  }
  return false;
}

export function segmentInfo(body: string): SegmentInfo {
  const encoding = detectEncoding(body);
  const chars = [...body].length;
  const hasTurkishOnlyChars = hasTurkishOnly(body);

  if (encoding === 'GSM7') {
    const weighted = countWeightedGsm7(body);
    const segments = weighted === 0 ? 0 : weighted <= 160 ? 1 : Math.ceil(weighted / 153);
    return { encoding, segments, chars, weightedChars: weighted, hasTurkishOnlyChars };
  }

  const segments = chars === 0 ? 0 : chars <= 70 ? 1 : Math.ceil(chars / 67);
  return { encoding, segments, chars, weightedChars: chars, hasTurkishOnlyChars };
}
