/**
 * Apple Wallet — NGO (STK) Üyelik Kartı (.pkpass) üretici.
 *
 * Kullanıcının belirli bir STK'yı desteklediğini / üyesi olduğunu gösteren
 * kart. STK admini fiziksel etkinliklerde QR'ı tarayıp kullanıcıyı doğrular.
 *
 * Cert kurulumu: src/lib/passkit/generator.ts başındaki uzun yorum bloğuna bak.
 */
import { PKPass } from 'passkit-generator';
import { PASS_ASSETS } from './pass-assets';

const PASS_TYPE_ID = process.env.PASSKIT_PASS_TYPE_ID ?? 'pass.com.hangel.ios.app';
const TEAM_ID = process.env.PASSKIT_TEAM_ID ?? 'NKZNY8NU8S';
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export interface NgoCardInput {
  uid: string;
  ngoId: string;
  fullName: string;                // Üye adı
  ngoName: string;                 // STK adı
  membershipType?: string;         // 'Üye' | 'Destekçi' | 'Gönüllü' vs.
  joinDate?: Date;                 // Üyelik başlangıç
  ngoLogoUrl?: string;             // ileride strip.png için (şu an sadece backFields)
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

export async function generateNgoCard(input: NgoCardInput): Promise<Buffer> {
  const certificates = loadCertificates();
  const serialNumber = `ngo_${input.ngoId}_${input.uid}`;
  const verifyUrl = `${PUBLIC_ORIGIN}/api/ngos/${input.ngoId}/verify-member/${input.uid}`;

  const auxFields: Array<{ key: string; label: string; value: string }> = [];
  if (input.membershipType) {
    auxFields.push({ key: 'role', label: 'STATÜ', value: input.membershipType });
  }

  const secondaryFields: Array<{
    key: string;
    label: string;
    value: string;
    dateStyle?: string;
    timeStyle?: string;
  }> = [
    { key: 'ngo', label: 'STK', value: input.ngoName },
  ];
  if (input.joinDate) {
    secondaryFields.push({
      key: 'joined',
      label: 'ÜYE OL.',
      value: input.joinDate.toISOString(),
      dateStyle: 'PKDateStyleMedium',
      timeStyle: 'PKDateStyleNone',
    });
  }

  const pass = new PKPass({
    ...PASS_ASSETS,
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_DEFAULTS,
      serialNumber,
      description: `hangel — ${input.ngoName} Üyelik Kartı`,
      generic: {
        primaryFields: [
          { key: 'member', label: 'ÜYE', value: input.fullName },
        ],
        secondaryFields,
        auxiliaryFields: auxFields,
        backFields: [
          {
            key: 'about',
            label: 'Hakkında',
            value: `Bu kart, sahibinin ${input.ngoName} bünyesindeki kayıtlı üyeliğini gösterir. QR kodu yetkili kişi taradığında üyelik bilgileri doğrulanır.`,
          },
          {
            key: 'ngoProfile',
            label: 'STK Profili',
            value: `${PUBLIC_ORIGIN}/ngos/${input.ngoId}`,
          },
          {
            key: 'contact',
            label: 'hangel',
            value: 'hangel.org | destek@hangel.org',
          },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: verifyUrl,
          messageEncoding: 'iso-8859-1',
          altText: `${input.ngoId.slice(0, 4)}/${input.uid.slice(0, 6)}`,
        },
      ],
      webServiceURL: `${PUBLIC_ORIGIN}/api/passkit/`,
      authenticationToken: input.authenticationToken ?? serialNumber.padEnd(32, '0'),
    })),
  }, certificates);

  return pass.getAsBuffer();
}
