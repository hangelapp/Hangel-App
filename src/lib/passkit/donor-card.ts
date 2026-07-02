/**
 * Apple Wallet — Bağışçı Kartı (.pkpass) üretici.
 *
 * Kullanıcının "bağışçı kimliği" kartı. Profilde, bağışta, etkinlikte STK'ya
 * gösterilir; toplam bağış + üyelik yılı bilgisi taşır. QR kod kullanıcının
 * hangel profil URL'sine yönlendirir (NGO'lar kimlik doğrulama için
 * kullanır).
 *
 * Cert kurulumu: src/lib/passkit/generator.ts başındaki uzun yorum bloğuna bak.
 * Bu modül de aynı PASSKIT_* env değişkenlerini kullanır.
 */
import { PKPass } from 'passkit-generator';
import { PASS_ASSETS } from './pass-assets';

const PASS_TYPE_ID = process.env.PASSKIT_PASS_TYPE_ID ?? 'pass.com.hangel.ios.app';
const TEAM_ID = process.env.PASSKIT_TEAM_ID ?? 'NKZNY8NU8S';
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export interface DonorCardInput {
  uid: string;                     // serialNumber temeli
  fullName: string;                // Kullanıcı tam adı (Ad Soyad)
  donorId: string;                 // Hangel bağışçı kimliği (kullanıcının
                                   // username veya kısa kod)
  totalDonationsTry?: number;      // Şu ana kadar toplam bağış (TL)
  memberSinceYear?: number;        // İlk bağış / üyelik yılı
  authenticationToken?: string;    // pass update web service için
}

interface Certificates {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase: string;
}

/**
 * Cert env değişkenlerini yükler. Cert eksikse `PASSKIT_CERTS_MISSING` koduyla
 * hata fırlatır — endpoint bunu yakalayıp 503 döner.
 */
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

export async function generateDonorCard(input: DonorCardInput): Promise<Buffer> {
  const certificates = loadCertificates();
  const serialNumber = `donor_${input.uid}`;

  const secondaryFields: Array<{ key: string; label: string; value: string }> = [];
  if (typeof input.totalDonationsTry === 'number' && input.totalDonationsTry > 0) {
    secondaryFields.push({
      key: 'donations',
      label: 'TOPLAM BAĞIŞ',
      value: `${Math.round(input.totalDonationsTry).toLocaleString('tr-TR')} TL`,
    });
  }
  if (typeof input.memberSinceYear === 'number' && input.memberSinceYear > 1900) {
    secondaryFields.push({
      key: 'member',
      label: 'ÜYELİK',
      value: `${input.memberSinceYear}'den beri`,
    });
  }

  const pass = new PKPass({
    ...PASS_ASSETS,
    'pass.json': Buffer.from(JSON.stringify({
      ...SHARED_DEFAULTS,
      serialNumber,
      description: `hangel — Bağışçı Kartı (${input.fullName})`,
      generic: {
        primaryFields: [
          { key: 'name', label: 'BAĞIŞÇI', value: input.fullName },
        ],
        secondaryFields,
        auxiliaryFields: [
          { key: 'donorId', label: 'BAĞIŞÇI NO', value: input.donorId },
        ],
        backFields: [
          {
            key: 'about',
            label: 'Hakkında',
            value: 'hangel bağışçı kartı, sahibinin hangel platformunda kayıtlı bağışçı olduğunu kanıtlar. STK\'lara ve etkinliklerde gösterilebilir.',
          },
          {
            key: 'contact',
            label: 'İletişim',
            value: 'hangel.org | destek@hangel.org',
          },
          {
            key: 'profile',
            label: 'Profil',
            value: `${PUBLIC_ORIGIN}/u/${input.donorId}`,
          },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `${PUBLIC_ORIGIN}/u/${input.donorId}`,
          messageEncoding: 'iso-8859-1',
          altText: input.donorId,
        },
      ],
      webServiceURL: `${PUBLIC_ORIGIN}/api/passkit/`,
      authenticationToken: input.authenticationToken ?? serialNumber.padEnd(32, '0'),
    })),
  }, certificates);

  return pass.getAsBuffer();
}
