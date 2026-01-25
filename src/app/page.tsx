import { redirect } from 'next/navigation';

export default function RootPage() {
  // Kullanıcıyı yeni landing page'e yönlendir.
  redirect('/login');
}
