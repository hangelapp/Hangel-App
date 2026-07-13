import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hangel.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Toplu Mail ve SMS — hangel STK | Kişiselleştirilmiş Toplu Gönderim',
  description:
    'Dernek ve vakıflar için toplu mail ve SMS gönderimi: segment veya CSV alıcılara kotaya dayalı toplu SMS ve e-posta gönderin, değişkenlerle kişiselleştirin, kontör paketleriyle bütçenizi yönetin. SMTP ve kotalı SMS altyapısı, hangel ile.',
  keywords: [
    'toplu SMS',
    'toplu mail',
    'toplu e-posta',
    'STK SMS gönderimi',
    'kişiselleştirilmiş SMS',
    'SMTP',
    'kontör paketi',
    'segment gönderim',
    'CSV alıcı',
    'hangel',
  ],
  openGraph: {
    type: 'website',
    title: 'Toplu Mail ve SMS — hangel STK',
    description:
      'Segment veya CSV alıcılara kotalı toplu SMS ve e-posta; değişkenlerle kişiselleştirme ve kontör paketleri. Tek panelde.',
    url: `${APP_URL}/features/toplu-mesajlasma`,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toplu Mail ve SMS — hangel STK',
    description:
      'Binlerce destekçiye tek seferde ulaşın; değişkenlerle kişiselleştirin, kontörle bütçelendirin.',
    images: ['/opengraph-image.png'],
  },
};

export default function TopluMesajlasmaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
