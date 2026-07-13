import type { Metadata } from 'next';

// /ngo-onboarding client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `events/[id]/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'STK Yönetim Yazılımı — Dernek & Vakıf Dijitalleşme | hangel STK';
const DESCRIPTION =
  'hangel STK; dernek ve vakıflar için Türkiye’ye özel, ücretsiz ve bütünleşik STK yönetim yazılımıdır. Şeffaflık endeksi, gönüllü yönetimi, otomatik hibe ve fon eşleştirme, bağış, etkinlik yönetimi, sertifikalar ve tek panelde onlarca araç. Kurumunuzun dijitalleşmesi dakikalar içinde başlar.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'STK yönetim yazılımı',
    'dernek yönetim programı',
    'vakıf yönetim yazılımı',
    'dernek dijitalleşme',
    'STK dijitalleşme',
    'gönüllü yönetimi',
    'gönüllülük yönetimi',
    'şeffaflık endeksi',
    'STK şeffaflık',
    'bağış yönetimi',
    'etkinlik yönetimi',
    'hibe ve fonlar',
    'otomatik hibe eşleştirme',
    'STK sertifikaları',
    'gönüllü sertifikası',
    'sivil toplum',
    'hangel',
    'hangel STK',
  ],
  alternates: {
    canonical: '/ngo-onboarding',
    // TR birincil dil; sayfa içeriği dil sağlayıcısıyla EN olarak da sunulur.
    languages: {
      'tr-TR': '/ngo-onboarding',
      'en-US': '/ngo-onboarding',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/ngo-onboarding`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'hangel STK — STK Yönetim Yazılımı',
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

export default function NgoOnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
