import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Gönüllülük İlan Yönetimi — hangel STK | Yüzde Uyum Eşleştirme',
  description:
    'Dernek ve vakıflar için gönüllülük ilan yönetimi: yetenek bazlı ilan yayınlayın, her gönüllüye otomatik yüzde uyum eşleştirmesi yapın, başvuruları toplu onaylayın, koordinatör atayın, gönüllü saat ve sosyal etki (SROI-hazır) raporu alın. hangel ile ücretsiz.',
  keywords: [
    'gönüllü yönetimi',
    'gönüllülük ilanı',
    'STK gönüllü yazılımı',
    'yüzde uyum eşleştirme',
    'gönüllü saat raporu',
    'SROI',
    'sosyal etki raporu',
    'koordinatör atama',
    'başvuru yönetimi',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Gönüllülük İlan Yönetimi — hangel STK',
    description:
      'Yetenek bazlı ilanlar, yüzde uyum eşleştirmesi, toplu onay, koordinatör atama ve gönüllü saat & etki raporu. Tek panelde, ücretsiz.',
    url: `${APP_URL}/features/gonulluluk-yonetimi`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gönüllülük İlan Yönetimi — hangel STK',
    description:
      'Doğru gönüllüyü doğru göreve eşleştirin; saat ve sosyal etkiyi kanıtlayın. Tek panelde, ücretsiz.',
    images: ['/opengraph-image.png'],
  },
};

export default function GonullulukYonetimiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
