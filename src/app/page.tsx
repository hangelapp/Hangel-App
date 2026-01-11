import { redirect } from 'next/navigation';

export default function RootPage() {
  // Uygulama ilk açıldığında kullanıcıyı market sayfasına yönlendir.
  redirect('/onboarding');
}

    