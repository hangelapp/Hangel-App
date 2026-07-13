import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Şeffaflık Endeksi — hangel STK | 0–100 Güven Puanı ve Belge Doğrulama',
  description:
    'Dernek ve vakıflar için şeffaflık endeksi: yasal belgelerinizi ve raporlarınızı yükleyin, kurumunuz 0–100 arası bir şeffaflık puanı kazansın. Belge doğrulama ile profilinizde halka açık güven rozeti; destekçilerinize güveni kanıtlayın. hangel ile ücretsiz.',
  keywords: [
    'şeffaflık endeksi',
    'STK şeffaflık',
    'şeffaflık puanı',
    'belge doğrulama',
    'dernek şeffaflık',
    'vakıf şeffaflık',
    'güven rozeti',
    'hesap verebilirlik',
    'faaliyet raporu',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Şeffaflık Endeksi — hangel STK',
    description:
      'Belge ve raporlarınızla 0–100 arası şeffaflık puanı; belge doğrulama ve profilinizde halka açık güven rozeti. Ücretsiz.',
    url: `${APP_URL}/features/seffaflik-endeksi`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Şeffaflık Endeksi — hangel STK',
    description:
      'Güveni ölçülebilir kılın: 0–100 şeffaflık puanı, belge doğrulama ve halka açık güven rozeti.',
    images: ['/opengraph-image.png'],
  },
};

export default function SeffaflikEndeksiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
