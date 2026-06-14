/**
 * Apple Wallet — Etkinlik Bileti (.pkpass) üretici.
 *
 * Kullanıcının bir Hangel etkinliğine kayıtlı olduğunu gösteren bilet.
 * QR'ı /events/{eventId}/auto-checkin endpoint'ine yönlendirir; kullanıcı
 * etkinlik girişinde QR'ı taratıp otomatik check-in yapar.
 *
 * Not: `src/lib/passkit/generator.ts` içindeki `generateEventPass` ile
 * benzer ama auto-checkin için QR mesajı farklı (event id + uid imzalı).
 *
 * Cert kurulumu: src/lib/passkit/generator.ts başındaki uzun yorum bloğuna bak.
 */
import { PKPass } from 'passkit-generator';
import { PASS_ASSETS } from './pass-assets';

const PASS_TYPE_ID = process.env.PASSKIT_PASS_TYPE_ID ?? 'pass.com.hangel.ios.app';
const TEAM_ID = process.env.PASSKIT_TEAM_ID ?? 'NKZNY8NU8S';
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org.tr';

export interface EventTicketInput {
  uid: string;
  eventId: string;
  fullName: string;
  eventTitle: string;
  ngoName?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  coordinates?: { lat: number; lng: number };
  qrToken?: string;                // backend tarafından üretilen imzalı token
  authenticationToken?: string;
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
    const err = new Error('PASSKIT_CERTS_MISSING');
    err.name = 'PassKitCertsMissingError';
    throw err;
  }
  return {
    wwdr: Buffer.from(wwdrB64, 'base64'),
    signerCert: Buffer.from(certB64, 'base64'),
    signerKey: Buffer.from(keyB64, 'base64'),
    signerKeyPassphrase: passphrase,
  };
}

const SHARED_DEFAULTS = {
  formatVersion: 1,
  passTypeIdentifier: PASS_TYPE_ID,
  teamIdentifier: TEAM_ID,
  organizationName: 'hangel',
  foregroundColor: 'rgb(255, 255, 255)',
  backgroundColor: 'rgb(243, 71, 35)',
  labelColor: 'rgb(255, 255, 255)',
};

export async function generateEventTicket(input: EventTicketInput): Promise<Buffer> {
  const certificates = loadCertificates();
  const serialNumber = `ticket_${input.eventId}_${input.uid}`;
  // Auto-checkin URL — Apple Wallet QR taratıldığında bu açılır, NGO admin
  // cihazı /events/{eventId}/auto-checkin endpoint'ine vurarak otomatik
  // check-in yapar (qrToken imzalı olmalı, replay önler).
  const checkinUrl = `${PUBLIC_ORIGIN}/api/events/${input.eventId}/auto-checkin?uid=${encodeURIComponent(input.uid)}${input.qrToken ? `&t=${encodeURIComponent(input.qrToken)}` : ''}`;

  const secondaryFields: Array<{
    key: string;
    label: string;
    value: string;
    dateStyle?: string;
    timeStyle?: string;
  }> = [];
  if (input.location) {
    secondaryFields.push({ key: 'loc', label: 'LOKASYON', value: input.location });
  }
  secondaryFields.push({
    key: 'date',
    label: 'TARİH',
    value: input.startDate.toISOString(),
    dateStyle: 'PKDateStyleMedium',
    timeStyle: 'PKDateStyleShort',
  });

  const auxFields: Array<{ key: string; label: string; value: string }> = [
    { key: 'name', label: 'KATILIMCI', value: input.fullName },
  ];
  if (input.ngoName) {
    auxFields.push({ key: 'ngo', label: 'STK', value: input.ngoName });
  }

  const pass = new PKPass({
    ...PASS_ASSETS,
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_DEFAULTS,
      serialNumber,
      description: `hangel — ${input.eventTitle}`,
      eventTicket: {
        primaryFields: [
          { key: 'event', label: 'ETKİNLİK', value: input.eventTitle },
        ],
        secondaryFields,
        auxiliaryFields: auxFields,
        backFields: [
          { key: 'ticketId', label: 'Bilet No', value: serialNumber },
          {
            key: 'autoCheckin',
            label: 'Otomatik Giriş',
            value: 'Bu QR kodu etkinlik girişinde yetkiliye gösterin; sistem sizi otomatik olarak check-in yapar.',
          },
          {
            key: 'terms',
            label: 'Şartlar',
            value: 'Bilet yalnızca kayıtlı kullanıcı için geçerlidir. Devredilemez.',
          },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: checkinUrl,
          messageEncoding: 'iso-8859-1',
          altText: serialNumber.slice(0, 12),
        },
      ],
      locations: input.coordinates
        ? [{ latitude: input.coordinates.lat, longitude: input.coordinates.lng }]
        : [],
      relevantDate: input.startDate.toISOString(),
      webServiceURL: `${PUBLIC_ORIGIN}/api/passkit/`,
      authenticationToken: input.authenticationToken ?? serialNumber.padEnd(32, '0'),
    })),
  }, certificates);

  return pass.getAsBuffer();
}
