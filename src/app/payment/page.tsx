import { redirect } from 'next/navigation';

export default function PaymentPage() {
  // Bu sayfa artık kullanılmıyor, qr-payment sayfasına yönlendir.
  redirect('/qr-payment');
}
