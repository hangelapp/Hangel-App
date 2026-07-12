import { redirect } from 'next/navigation';

/**
 * /ngo-admin/volunteer-completions/{id} için per-kayıt sayfa rotası YOK. Gönüllü
 * tamamlama onay bildirimleri (admin) bu linke gidiyor. Artık tüm tamamlamaların
 * onaylandığı gerçek rapor sayfası var (../volunteer-completions); eski deep-link'leri
 * de oraya yönlendir (siyah ekran/404 yerine ilgili raporu aç).
 */
export default function VolunteerCompletionRedirect() {
  redirect('/ngo-admin/volunteer-completions');
}
