import { redirect } from 'next/navigation';

export default function RootPage() {
  // Kullanıcıyı uygulama ana akışına yönlendir.
  redirect('/timeline');
}
