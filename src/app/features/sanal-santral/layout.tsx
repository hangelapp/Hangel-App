import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Sanal Santral (Çağrı Merkezi) — hangel STK | Tarayıcıdan Arama',
  description:
    'Dernek ve vakıflar için sanal santral: tarayıcıdan kulaklıkla arama yapın, kendi hattınızı bağlayın, gelen ve giden çağrıları yönetin, görüşme notu ve sonuç girin, çağrı kaydı tutun, cevapsızları takip edin. WebRTC tabanlı çağrı merkezi, hangel ile ücretsiz.',
  keywords: [
    'sanal santral',
    'çağrı merkezi',
    'STK çağrı merkezi',
    'tarayıcıdan arama',
    'WebRTC',
    'kendi hattını bağla',
    'çağrı kaydı',
    'gelen giden çağrı',
    'görüşme notu',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Sanal Santral (Çağrı Merkezi) — hangel STK',
    description:
      'Tarayıcıdan kulaklıkla arama, kendi hattınızı bağlama, çağrı kaydı, görüşme notu ve sonuç takibi. Tek panelde, ücretsiz.',
    url: `${APP_URL}/features/sanal-santral`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanal Santral (Çağrı Merkezi) — hangel STK',
    description:
      'Donanım yok, tarayıcı yeter. Kendi hattınızı bağlayın, çağrıları tek panelde yönetin. Ücretsiz.',
    images: ['/opengraph-image.png'],
  },
};

export default function SanalSantralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
