import { PublicContract } from '@/components/legal/public-contract';

export const metadata = {
  title: 'Gizlilik Politikası — hangel',
  description: 'hangel gizlilik politikası: kişisel verilerin işlenmesi, saklanması ve korunması.',
};

// Public (girişsiz) gizlilik politikası — Google OAuth consent screen / doğrulama
// ve uygulama içi "/gizlilik-politikasi" bağlantıları için.
export default function GizlilikPolitikasiPage() {
  return <PublicContract slug="gizlilik-politikasi" />;
}
