import { PublicContract } from '@/components/legal/public-contract';

export const metadata = {
  title: 'Kullanıcı Sözleşmesi — hangel',
  description: 'hangel kullanıcı sözleşmesi ve hizmet şartları.',
};

// Public (girişsiz) kullanıcı sözleşmesi / hizmet şartları — Google OAuth consent
// screen "Hizmet Şartları" bağlantısı ve doğrulama için.
export default function KullaniciSozlesmesiPage() {
  return <PublicContract slug="kullanici-sozlesmesi" />;
}
