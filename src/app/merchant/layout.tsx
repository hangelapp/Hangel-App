import type { Metadata } from 'next';

// /merchant client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `ngo-onboarding/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'Markalar için hangel — Alışverişle Bağış & Ücretsiz Marka Paneli | hangel Markalar';
const DESCRIPTION =
  'hangel Markalar; markanızdan yapılan her satışı seçilen bir sivil topluma bağışa dönüştüren, Türkiye’ye özel ve ücretsiz marka platformudur. Sosyal fayda başına bağış oranını ürün bazında şeffaf gösteren öncü yaklaşım, ürün feed’i, market listeleme, reklam yönetimi, CRM, etki sertifikası ve KVKK-uyumlu güvenli altyapı — hepsi tek panelde. Markanızı iyiliğin tarafına yazın.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'markalar için hangel',
    'alışverişle bağış',
    'shop to donate',
    'sosyal fayda pazarı',
    'bağış oranı şeffaflık',
    'ürün bazında bağış',
    'marka paneli',
    'ücretsiz marka paneli',
    'ürün feed',
    'PIM',
    'market listeleme',
    'reklam yönetimi',
    'CRM',
    'etki sertifikası',
    'sosyal fayda rozeti',
    'KVKK uyumlu',
    'veri güvenliği',
    'bilinçli tüketici',
    'kurumsal sosyal sorumluluk',
    'KSS',
    'hangel',
    'hangel Markalar',
  ],
  alternates: {
    canonical: '/merchant',
    // TR birincil dil; sayfa içeriği dil sağlayıcısıyla EN olarak da sunulur.
    languages: {
      'tr-TR': '/merchant',
      'en-US': '/merchant',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/merchant`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Markalar için hangel — Alışverişle Bağış',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
