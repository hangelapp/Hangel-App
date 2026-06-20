import { redirect } from 'next/navigation';

// Eski Türkçe route → İngilizce route'a kalıcı yönlendirme.
export default function StkEkleRedirect() {
  redirect('/register-organization');
}
