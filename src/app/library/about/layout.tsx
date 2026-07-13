import type { Metadata } from 'next';

// /library/about client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `events/[id]/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'Veri Kütüphanesi — STK Araştırma, Açık Veri & AI Proje Yazarı | hangel Kütüphane';
const DESCRIPTION =
  'hangel Kütüphane; sivil topluma özel, Türkçe ve ücretsiz tek araştırma çatısı. Sosyal etki, gönüllülük ve sürdürülebilirlik verisini filtrelenebilir sunan öncü Türkçe veri kütüphanesi. AI proje yazarı, 300+ küresel etki kuruluşu, 50+ kamu veri seti, akademik makaleler, kitaplar, filmler ve şablonlar. KVKK uyumlu, güvenli bulut altyapısı; üyeliksiz keşfedin.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'veri kütüphanesi',
    'açık veri',
    'kamu veri setleri',
    'STK araştırma',
    'sivil toplum verisi',
    'sosyal etki verisi',
    'sürdürülebilirlik verisi',
    'gönüllülük verisi',
    'AI proje yazarı',
    'fon başvurusu',
    'hibe başvurusu',
    'etki ölçümü',
    'etki envanteri',
    'akademik makaleler',
    'STK şablonları',
    'bütçe şablonu',
    'TÜİK verisi',
    'KVKK uyumlu',
    'hangel',
    'hangel kütüphane',
  ],
  alternates: {
    canonical: '/library/about',
    languages: {
      'tr-TR': '/library/about',
      'en-US': '/library/about',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/library/about`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'hangel Kütüphane — Sivil Topluma Özel Veri Kütüphanesi ve AI Araçları',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'Sivil topluma özel, Türkçe ve ücretsiz araştırma çatısı: açık veri, AI proje yazarı, küresel etki kataloğu ve akademik kaynaklar. Üyeliksiz keşfedin.',
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

export default function LibraryAboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
