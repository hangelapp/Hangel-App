import { redirect } from 'next/navigation';

/**
 * /emergency/{requestId} için detay rotası YOK. Kan/acil push bildirimleri
 * eskiden bu linke (clickAction) gidiyordu → 404 → siyah ekran. Eski (daha önce
 * gönderilmiş) bildirimlerin içinde bu link gömülü olduğundan stub onları da
 * yanıt akışının bulunduğu /notifications sayfasına yönlendirir (kullanıcı orada
 * "Yardım Edebilirim" deyince detaylı hastane mesajı gelir).
 *
 * Not: statik /emergency/about rotası bu dinamik rotadan önce eşleşir, etkilenmez.
 */
export default function EmergencyRequestRedirect() {
  redirect('/notifications');
}
