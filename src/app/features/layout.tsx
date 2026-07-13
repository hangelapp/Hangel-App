import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Özellikler — hangel STK | Dernek ve Vakıflar için Dijital Yönetim',
  description:
    'hangel STK özellikleri: etkinlik yönetimi, gönüllülük ilan yönetimi, sanal santral, toplu mail ve SMS, kodsuz web sitesi, şeffaflık endeksi ve demografi analizi. Dernek ve vakıflar için tek panelde, ücretsiz.',
  keywords: [
    'STK yönetim yazılımı',
    'dernek yazılımı',
    'vakıf yönetimi',
    'gönüllü yönetimi',
    'etkinlik yönetimi',
    'STK sanal santral',
    'toplu SMS',
    'şeffaflık endeksi',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Özellikler — hangel STK',
    description:
      'Dernek ve vakıflar için 7 güçlü modül: etkinlik, gönüllülük, sanal santral, toplu mesaj, web sitesi, şeffaflık ve demografi. Tek panelde, ücretsiz.',
    url: `${APP_URL}/features`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Özellikler — hangel STK',
    description:
      'Dernek ve vakıflar için 7 güçlü modül, tek panelde ve ücretsiz.',
    images: ['/opengraph-image.png'],
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
