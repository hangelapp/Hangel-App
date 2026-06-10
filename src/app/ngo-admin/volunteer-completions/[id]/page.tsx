import { redirect } from 'next/navigation';

/**
 * /ngo-admin/volunteer-completions/{id} için sayfa rotası YOK. Gönüllü tamamlama
 * onay bildirimleri (admin) eskiden bu linke gidiyordu → 404 → siyah ekran.
 * Onaylar /ngo-admin/volunteer sayfasında yapılıyor; eski bildirimleri de oraya
 * yönlendirip siyah ekranı önle.
 */
export default function VolunteerCompletionRedirect() {
  redirect('/ngo-admin/volunteer');
}
