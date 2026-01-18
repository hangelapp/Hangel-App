import { redirect } from 'next/navigation';

export default function RootPage() {
  // Kullanıcıyı onboarding sayfasına yönlendir.
  redirect('/onboarding');
}
