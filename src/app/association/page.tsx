import { redirect } from 'next/navigation';

// /association doğrudan açıldığında /association/about'a yönlendir.
// Önceden parent route yoktu → Next.js RSC prefetch bu yola 404 dönüyordu.
export default function AssociationIndex() {
  redirect('/association/about');
}
