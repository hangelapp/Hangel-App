import { redirect } from 'next/navigation';

/**
 * /emergency/{requestId} için detay rotası YOK. Kan/acil push bildirimleri
 * eskiden bu linke (clickAction) gidiyordu → 404 → iOS/Android WebView'de
 * siyah ekran. Artık yeni bildirimler /emergency'ye gidiyor, ama DAHA ÖNCE
 * gönderilmiş bildirimlerin içine eski link gömülü olduğundan bu stub onları
 * da var olan liste sayfasına yönlendirip siyah ekranı önler.
 *
 * Not: statik /emergency/about rotası bu dinamik rotadan önce eşleşir, etkilenmez.
 */
export default function EmergencyRequestRedirect() {
  redirect('/emergency');
}
