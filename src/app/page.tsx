import { redirect } from 'next/navigation';

export default function RootPage() {
  // Kullanıcıyı market sayfasına yönlendir.
  redirect('/market');
}
