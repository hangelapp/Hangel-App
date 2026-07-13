import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Demografi Analizi — hangel STK | Destekçi Tabanı Canlı Grafikler',
  description:
    'Dernek ve vakıflar için demografi analizi: destekçi tabanınızın yaş, şehir, meslek ve ilgi dağılımını canlı grafiklerle görün. Kararlarınızı veriyle alın, kampanyalarınızı doğru kitleye yönlendirin, etkinizi büyütün. hangel ile ücretsiz.',
  keywords: [
    'demografi analizi',
    'STK veri analizi',
    'destekçi analizi',
    'canlı grafikler',
    'yaş dağılımı',
    'şehir dağılımı',
    'meslek dağılımı',
    'kitle analizi',
    'veriyle karar',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Demografi Analizi — hangel STK',
    description:
      'Destekçi tabanınızın yaş, şehir, meslek ve ilgi dağılımını canlı grafiklerle görün; kararlarınızı veriyle alın. Ücretsiz.',
    url: `${APP_URL}/features/demografi-analizi`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demografi Analizi — hangel STK',
    description:
      'Destekçi tabanınızı canlı grafiklerle tanıyın; kampanyalarınızı doğru kitleye yönlendirin.',
    images: ['/opengraph-image.png'],
  },
};

export default function DemografiAnaliziLayout({ children }: { children: React.ReactNode }) {
  return children;
}
