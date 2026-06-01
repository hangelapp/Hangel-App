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

  // Pass template assets (icon.png, logo.png, strip.png) sonra Hangel
  // tasarımcısı tarafından `src/lib/passkit/templates/event.pass/` altına
  // konacak. Şimdilik en küçük geçerli template (sadece pass.json).
  // PKPass.from() bir dizin path'i ister; alternatif olarak PKPass constructor
  // ile programmatic create edilebilir.
  const pass = new PKPass({
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_PASS_DEFAULTS,
      serialNumber: input.serialNumber,
      description: `hangel — ${input.eventTitle}`,
      eventTicket: {
        primaryFields: [
          { key: 'event', label: 'ETKİNLİK', value: input.eventTitle },
        ],
        secondaryFields: [
          { key: 'loc', label: 'LOKASYON', value: input.location },
          {
            key: 'date',
            label: 'TARİH',
            value: input.startDate.toISOString(),
            dateStyle: 'PKDateStyleMedium',
            timeStyle: 'PKDateStyleShort',
          },
        ],
        auxiliaryFields: [
          { key: 'ngo', label: 'STK', value: input.ngoName },
        ],
        backFields: [
          { key: 'ticketId', label: 'Bilet No', value: input.ticketId ?? input.serialNumber },
          {
            key: 'terms',
            label: 'Şartlar',
            value: 'Bilet sadece kayıtlı kullanıcı için geçerlidir. Etkinlik girişinde QR kod taratılacaktır.',
          },
        ],
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
