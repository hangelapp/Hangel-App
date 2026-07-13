import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Web Sitesi Yönetimi — hangel STK | Kodsuz, Ücretsiz Alan Adı',
  description:
    'Dernek ve vakıflar için kodsuz web sitesi yönetimi: markanıza özel kurumsal web sitesini kod yazmadan kurun, ücretsiz alan adıyla ya da kendi alan adınızla tek tıkla yayınlayın. Etkinlik, bağış ve gönüllülük içeriğiniz otomatik güncel. hangel ile ücretsiz.',
  keywords: [
    'STK web sitesi',
    'dernek web sitesi',
    'vakıf web sitesi',
    'kodsuz web sitesi',
    'ücretsiz alan adı',
    'kendi alan adı',
    'kurumsal web sitesi',
    'web sitesi yönetimi',
    'no-code',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Web Sitesi Yönetimi — hangel STK',
    description:
      'Kodsuz, markanıza özel kurumsal web sitesi; ücretsiz alan adı ya da kendi alan adınızla tek tıkla yayında.',
    url: `${APP_URL}/features/web-sitesi`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Sitesi Yönetimi — hangel STK',
    description:
      'Kod yazmadan kurumsal web siteniz yayında; ücretsiz alan adı dahil. hangel ile ücretsiz.',
    images: ['/opengraph-image.png'],
  },
};

export default function WebSitesiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
