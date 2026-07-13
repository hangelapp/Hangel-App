import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Etkinlik Yönetimi — hangel STK | QR Giriş, Yaka Kartı, Sertifika',
  description:
    'Dernek ve vakıflar için etkinlik yönetimi: online veya fiziksel etkinlik oluşturun, kayıt ve RSVP alın, QR ile giriş yapın, yaka kartı ve katılım sertifikası üretin, çok noktalı etkinlikleri tek panelden yönetin ve "selfie ile bul" fotoğraf galerisi paylaşın. hangel ile ücretsiz.',
  keywords: [
    'etkinlik yönetimi',
    'STK etkinlik yazılımı',
    'QR ile giriş',
    'etkinlik kayıt sistemi',
    'yaka kartı',
    'katılım sertifikası',
    'çok noktalı etkinlik',
    'etkinlik fotoğrafları',
    'RSVP',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Etkinlik Yönetimi — hangel STK',
    description:
      'Kayıt ve RSVP, QR ile giriş, yaka kartı, sertifika, çok noktalı etkinlik ve "selfie ile bul" fotoğraf galerisi. Tek panelde, ücretsiz.',
    url: `${APP_URL}/features/etkinlik-yonetimi`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Etkinlik Yönetimi — hangel STK',
    description:
      'QR ile giriş, yaka kartı, sertifika, çok noktalı etkinlik ve akıllı fotoğraf galerisi. Tek panelde, ücretsiz.',
    images: ['/opengraph-image.png'],
  },
};

export default function EtkinlikYonetimiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
