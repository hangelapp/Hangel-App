/**
 * Apple Wallet PassKit (.pkpass) üretici — Faz 1.2.
 *
 * Etkinlik biletleri ve gönüllülük görev biletleri Apple Wallet'a eklenebilir
 * .pkpass dosyaları üretir. Update'ler Apple update web service üzerinden
 * APNs push ile yapılır (saat değişikliği, lokasyon güncellemesi vs.).
 *
 * GEREKLİ ENV (apphosting.yaml'da secret olarak tanımlı olmalı):
 *  - PASSKIT_PASS_TYPE_ID         — 'pass.com.hangel.ios.app'
 *  - PASSKIT_TEAM_ID              — 'NKZNY8NU8S'
 *  - PASSKIT_WWDR_PEM_BASE64      — Apple WWDR cert PEM (public, kaynaktan
 *                                    indir: https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer)
 *  - PASSKIT_SIGNER_CERT_PEM_BASE64  — Pass Type ID cert PEM (Apple Dev console)
 *  - PASSKIT_SIGNER_KEY_PEM_BASE64   — Pass Type ID private key PEM
 *  - PASSKIT_SIGNER_KEY_PASSPHRASE   — .p12 export sırasında belirlenen parola
 *
 * KURULUM (henüz yapılmadı — Apple Developer Console'da):
 *  1. Identifiers → "+" → Pass Type IDs → Description: "Hangel Volunteer Event
 *     Tickets", Identifier: `pass.com.hangel.ios.app` → Register
 *  2. Sertifika oluştur (CSR aracılığıyla) → .cer indir → Keychain'e import →
 *     .p12 olarak parola ile export et
 *  3. Apple WWDR cert: https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
 *  4. Her ikisini PEM'e çevir + base64'le, apphosting.yaml env'lerine yaz
 */

import { PKPass } from 'passkit-generator';
import { PASS_ASSETS } from './pass-assets';

import { COLLECTIONS } from '@/firebase/collections';

const PASS_TYPE_ID = process.env.PASSKIT_PASS_TYPE_ID ?? 'pass.com.hangel.ios.app';
const TEAM_ID = process.env.PASSKIT_TEAM_ID ?? 'NKZNY8NU8S';
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org.tr';

export interface EventPassInput {
  serialNumber: string;          // event id
  eventTitle: string;
  ngoName: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  coordinates?: { lat: number; lng: number };
  ticketId?: string;             // backend tarafından üretilen unique kayıt
  authenticationToken?: string;  // pass update web service için (32+ char)
  qrPayload?: string;            // QR kod içeriği (URL veya unique kod)
  /** 'event' | 'volunteer' — başlık etiketlerini belirler. */
  kind?: 'event' | 'volunteer';
  /** Katılımcı statüsü/rolü: Katılımcı / Konuşmacı / Gönüllü vb. */
  role?: string;
  /** Katılımcı/gönüllü adı (kartın arka yüzünde). */
  userName?: string;
  /** Tam adres (arka yüz). */
  address?: string;
  /** Başlangıç–bitiş saati etiketi, örn "14:00 – 17:00". */
  timeLabel?: string;
  /** STK logo URL'si — PNG ise thumbnail olarak gömülür (hangel logosu pass logosu olarak zaten var). */
  ngoLogoUrl?: string;
}

/**
 * STK logosunu indir; YALNIZ geçerli PNG ise Buffer döndür (pass'i bozmamak için).
 * Hata/timeout/non-PNG → null (thumbnail atlanır, hangel logosu yine görünür).
 */
async function fetchPngBuffer(url?: string): Promise<Buffer | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG magic: 89 50 4E 47
    if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return buf;
    }
    return null;
  } catch {
    return null;
  }
}

export interface TaskPassInput {
  serialNumber: string;          // task id
  taskTitle: string;
  ngoName: string;
  location?: string;
  startDate?: Date;
  durationMinutes?: number;
  authenticationToken?: string;
  qrPayload?: string;
}

interface Certificates {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase: string;
}

function loadCertificates(): Certificates {
  const wwdrB64 = process.env.PASSKIT_WWDR_PEM_BASE64;
  const certB64 = process.env.PASSKIT_SIGNER_CERT_PEM_BASE64;
  const keyB64 = process.env.PASSKIT_SIGNER_KEY_PEM_BASE64;
  const passphrase = process.env.PASSKIT_SIGNER_KEY_PASSPHRASE;
  if (!wwdrB64 || !certB64 || !keyB64 || !passphrase) {
    throw new Error('PASSKIT_* env değişkenleri eksik — sertifika kurulumu gerekli.');
  }
  return {
    wwdr: Buffer.from(wwdrB64, 'base64'),
    signerCert: Buffer.from(certB64, 'base64'),
    signerKey: Buffer.from(keyB64, 'base64'),
    signerKeyPassphrase: passphrase,
  };
}

const SHARED_PASS_DEFAULTS = {
  formatVersion: 1,
  passTypeIdentifier: PASS_TYPE_ID,
  teamIdentifier: TEAM_ID,
  organizationName: 'hangel',
  foregroundColor: 'rgb(255, 255, 255)',
  backgroundColor: 'rgb(243, 71, 35)',
  labelColor: 'rgb(255, 255, 255)',
};

export async function generateEventPass(input: EventPassInput): Promise<Buffer> {
  const certificates = loadCertificates();
  const isVolunteer = input.kind === 'volunteer';
  const titleLabel = isVolunteer ? 'GÖNÜLLÜLÜK' : 'ETKİNLİK';
  const role = (input.role && input.role.trim()) || (isVolunteer ? 'Gönüllü' : 'Katılımcı');
  // Apple kimliği — iki tasarım görsel olarak AYRIŞIR: etkinlik=coral, gönüllülük=emerald.
  const accentBg = isVolunteer ? 'rgb(17, 122, 94)' : 'rgb(243, 71, 35)';

  // hangel logosu pass logosu olarak zaten var (PASS_ASSETS). STK logosunu —
  // yalnız geçerli PNG ise — sağ thumbnail olarak ekle (pass'i bozmadan).
  const ngoThumb = await fetchPngBuffer(input.ngoLogoUrl);
  const bundle: Record<string, Buffer> = { ...PASS_ASSETS };
  if (ngoThumb) {
    bundle['thumbnail.png'] = ngoThumb;
    bundle['thumbnail@2x.png'] = ngoThumb;
  }

  // İkincil satır — öne çıkan "ne zaman": tarih (+ saat varsa).
  const secondaryFields: Record<string, unknown>[] = [
    {
      key: 'date', label: 'NE ZAMAN', value: input.startDate.toISOString(),
      dateStyle: 'PKDateStyleMedium', timeStyle: input.timeLabel ? 'PKDateStyleNone' : 'PKDateStyleShort',
    },
  ];
  if (input.timeLabel) {
    secondaryFields.push({ key: 'time', label: 'SAAT', value: input.timeLabel });
  }

  // Yardımcı satır: statü/rol + düzenleyen + konum.
  const auxiliaryFields: Record<string, unknown>[] = [
    { key: 'role', label: 'STATÜ', value: role },
    { key: 'ngo', label: 'DÜZENLEYEN', value: input.ngoName },
  ];
  if (input.location) {
    auxiliaryFields.push({ key: 'loc', label: 'KONUM', value: input.location });
  }

  // Arka yüz: katılımcı adı, statü, tam tarih/saat, adres, düzenleyen, kayıt no.
  const backFields: Record<string, unknown>[] = [];
  if (input.userName) backFields.push({ key: 'name', label: isVolunteer ? 'Gönüllü' : 'Katılımcı', value: input.userName });
  backFields.push({ key: 'roleBack', label: 'Statü / Rol', value: role });
  backFields.push({
    key: 'dateBack', label: 'Tarih & Saat', value: input.startDate.toISOString(),
    dateStyle: 'PKDateStyleFull', timeStyle: 'PKDateStyleShort',
  });
  if (input.timeLabel) backFields.push({ key: 'hours', label: 'Saat', value: input.timeLabel });
  if (input.address) backFields.push({ key: 'addr', label: 'Adres', value: input.address });
  backFields.push({ key: 'org', label: 'Düzenleyen', value: input.ngoName });
  backFields.push({ key: 'ticketId', label: 'Kayıt No', value: input.ticketId ?? input.serialNumber });
  backFields.push({
    key: 'terms', label: 'Bilgi',
    value: 'Bu kart yalnızca kayıtlı kullanıcı için geçerlidir. Girişte karekod taratılır. hangel.org.tr',
  });

  const pass = new PKPass({
    ...bundle,
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_PASS_DEFAULTS,
      backgroundColor: accentBg,
      serialNumber: input.serialNumber,
      description: `hangel — ${input.eventTitle}`,
      eventTicket: {
        headerFields: [
          { key: 'hdr', label: 'TARİH', value: input.startDate.toISOString(), dateStyle: 'PKDateStyleShort', timeStyle: 'PKDateStyleNone' },
        ],
        primaryFields: [
          { key: 'event', label: titleLabel, value: input.eventTitle },
        ],
        secondaryFields,
        auxiliaryFields,
        backFields,
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: input.qrPayload ?? `${PUBLIC_ORIGIN}/checkin/${input.serialNumber}`,
          messageEncoding: 'iso-8859-1',
          altText: input.serialNumber.slice(0, 8),
        },
      ],
      locations: input.coordinates ? [{ latitude: input.coordinates.lat, longitude: input.coordinates.lng }] : [],
      relevantDate: input.startDate.toISOString(),
      webServiceURL: `${PUBLIC_ORIGIN}/api/passkit/`,
      authenticationToken: input.authenticationToken ?? input.serialNumber.padEnd(32, '0'),
    })),
  }, certificates);

  return pass.getAsBuffer();
}

export async function generateTaskPass(input: TaskPassInput): Promise<Buffer> {
  const certificates = loadCertificates();

  const pass = new PKPass({
    ...PASS_ASSETS,
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_PASS_DEFAULTS,
      serialNumber: input.serialNumber,
      description: `hangel — ${input.taskTitle}`,
      generic: {
        primaryFields: [
          { key: 'task', label: 'GÖREV', value: input.taskTitle },
        ],
        secondaryFields: [
          ...(input.location ? [{ key: 'loc', label: 'LOKASYON', value: input.location }] : []),
          ...(input.durationMinutes ? [{ key: 'dur', label: 'SÜRE', value: `${input.durationMinutes} dk` }] : []),
        ],
        auxiliaryFields: [
          { key: 'ngo', label: 'STK', value: input.ngoName },
        ],
        backFields: [
          { key: 'taskId', label: 'Görev No', value: input.serialNumber },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: input.qrPayload ?? `${PUBLIC_ORIGIN}/task/${input.serialNumber}/verify`,
          messageEncoding: 'iso-8859-1',
          altText: input.serialNumber.slice(0, 8),
        },
      ],
      ...(input.startDate ? { relevantDate: input.startDate.toISOString() } : {}),
      webServiceURL: `${PUBLIC_ORIGIN}/api/passkit/`,
      authenticationToken: input.authenticationToken ?? input.serialNumber.padEnd(32, '0'),
    })),
  }, certificates);

  return pass.getAsBuffer();
}

export { COLLECTIONS };
