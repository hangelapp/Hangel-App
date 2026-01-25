import { redirect } from 'next/navigation';

export default function RootPage() {
  // Kullanıcıyı web sitesi tarzı giriş sayfasına yönlendir.
  redirect('/login');
}
