import type { Metadata } from 'next';

// /campus-advantages client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `ngo-onboarding/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'hangel Kampüs — Öğrenci Kulüpleri için Ücretsiz Dijital Yönetim | hangel';
const DESCRIPTION =
  'hangel Kampüs; üniversite ve lise kulüpleri için ücretsiz dijital yönetim ile kampüs etki ağını birleştiren Türkiye’deki ilk platformdur. Etkinlik ve gönüllülük ilanları, QR/NFC yoklama, otomatik sertifika, etki puanı ve lider tablosu, Sosyal Etki Karnesi ve KVKK-uyumlu güvenli altyapı — hepsi tek panelde ve tamamen ücretsiz. Gönüllülük artık CV’nde sayılıyor.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'hangel Kampüs',
    'öğrenci kulübü yönetimi',
    'kampüs kulüpleri',
    'üniversite kulübü',
    'kulüp dijitalleşme',
    'ücretsiz kulüp paneli',
    'öğrenci gönüllülük',
    'gönüllülük sertifikası',
    'CV için gönüllülük',
    'QR yoklama',
    'NFC check-in',
    'etkinlik yönetimi',
    'etki puanı',
    'lider tablosu',
    'sosyal etki karnesi',
    'kampüs etki ağı',
    'kulüp web sitesi',
    'KVKK uyumlu',
    'veri güvenliği',
    'hangel',
  ],
  alternates: {
    canonical: '/campus-advantages',
    // TR birincil dil; sayfa içeriği dil sağlayıcısıyla EN olarak da sunulur.
    languages: {
      'tr-TR': '/campus-advantages',
      'en-US': '/campus-advantages',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/campus-advantages`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'hangel Kampüs — Öğrenci Kulüpleri için Ücretsiz Dijital Yönetim',
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

export default function CampusAdvantagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
