import { redirect } from 'next/navigation';

// /brand doğrudan açıldığında /brand/qr'a yönlendir.
// Önceden parent route yoktu → Next.js RSC prefetch bu yola 404 dönüyordu.
export default function BrandIndex() {
  redirect('/brand/qr');
}
