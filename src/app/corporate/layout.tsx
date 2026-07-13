import type { Metadata } from 'next';

// /corporate client bir bileşen olduğu için `metadata` export edemez.
// SEO ve AI-arama görünürlüğü için zengin başlık/açıklama/OG burada, server
// katmanında üretilir. `events/[id]/layout.tsx` ile aynı yaklaşım.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

const TITLE = 'Kamu İşbirlikleri & Kurumsal — STK, Belediye ve Bakanlık | hangel';
const DESCRIPTION =
  'hangel; STK, dernek, vakıf, kulüp ve kamu kurumları için panel, çağrı merkezi, reklam yönetimi, CRM, toplu mail/SMS, AI sürdürülebilirlik raporu, sertifika ve şeffaflık skorunu tek çatıda ücretsiz toplar. Belediye ve bakanlıklar için sosyal projeleri veriyle planlayıp şeffaf yöneten öncü kamu-STK işbirliği altyapısı. KVKK uyumlu, güvenli bulut, rol-bazlı yetki.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'kamu işbirliği',
    'kamu-STK işbirliği',
    'belediye sosyal proje',
    'bakanlık işbirliği',
    'STK yönetim yazılımı',
    'dernek yönetim programı',
    'vakıf yönetimi',
    'kurumsal panel',
    'çağrı merkezi',
    'reklam yönetimi',
    'CRM',
    'AI sürdürülebilirlik raporu',
    'etki raporu',
    'şeffaflık skoru',
    'sertifika üreteci',
    'veriyle planlama',
    'KVKK uyumlu',
    'güvenli bulut',
    'hangel',
    'hangel STK',
  ],
  alternates: {
    canonical: '/corporate',
    languages: {
      'tr-TR': '/corporate',
      'en-US': '/corporate',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: `${APP_URL}/corporate`,
    siteName: 'hangel',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'hangel — Kamu İşbirlikleri ve Kurumsal Değer, Tek Panelde',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description:
      'STK, kulüp ve kamu kurumları için panel, çağrı merkezi, reklam, CRM, AI rapor ve şeffaflık tek çatıda, ücretsiz. Kamu-STK işbirliğini veriyle planlayın.',
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

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
