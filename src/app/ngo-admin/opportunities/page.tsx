import { redirect } from 'next/navigation';

// Gönüllülük yönetimi + ilan oluşturma GERÇEK rota /ngo-admin/volunteer (+ /volunteer/new).
// Bu eski /opportunities rotası (boş placeholder'dı) çift form karışıklığını önlemek
// için oraya yönlendirilir.
export default function OpportunitiesRedirect() {
  redirect('/ngo-admin/volunteer');
}
