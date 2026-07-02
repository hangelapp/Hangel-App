import { redirect } from 'next/navigation';

// Mağaza listesi /market/shops'a taşındı — eski /market/brands bağlantıları
// kalıcı olarak oraya yönlendirilir.
export default function BrandsRedirect() {
  redirect('/market/shops');
}
