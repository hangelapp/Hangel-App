import type { Metadata } from 'next';

// /emergency/about client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `events/[id]/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'Acil Kan & SOS — Konum Bazlı Kan Bağışçı Eşleşmesi | hangel Acil';
const DESCRIPTION =
  'hangel Acil & Kan; afet ve kan ihtiyacında saniyeler içinde en yakındaki gönüllülere ulaşır. Apple Watch ile tek dokunuşta SOS, konum-tabanlı en yakın hastane eşleştirmesi, akıllı kan grubu uyumu ve anlık bildirim — Türkiye’de öncü acil yardım deneyimi. KVKK uyumlu, şifreli ve güvenli. Katılmak ücretsiz; bir bildirim bir hayat kurtarabilir.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'acil kan',
    'kan bağışı',
    'kan bağışçısı bul',
    'kan ihtiyacı',
    'kan grubu eşleşmesi',
    'acil yardım',
    'SOS',
    'Apple Watch SOS',
    'afet bildirimi',
    'deprem yardım',
    'en yakın hastane',
    'konum bazlı yardım',
    'gönüllü kan bağışçı ağı',
    'anlık bildirim',
    'trombosit bağışı',
    'kök hücre bağışı',
    'hayat kurtaran',
    'KVKK uyumlu',
    'hangel',
    'hangel acil',
  ],
  alternates: {
    canonical: '/emergency/about',
    languages: {
      'tr-TR': '/emergency/about',
      'en-US': '/emergency/about',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/emergency/about`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'hangel Acil & Kan — Konum Bazlı Kan Bağışçı Eşleşmesi ve SOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'Afet ve kan ihtiyacında saniyeler içinde en yakındaki yüreklere ulaşın. Apple Watch SOS, en yakın hastane eşleştirme, kan grubu uyumu ve anlık bildirim. Ücretsiz.',
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

export default function EmergencyAboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
