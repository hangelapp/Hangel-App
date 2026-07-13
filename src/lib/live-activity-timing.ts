/**
 * iOS Live Activity başlatma ZAMANLAMA kuralı — TEK KAYNAK.
 *
 * Kilit ekranı canlı etkinliği (Live Activity) rol'e göre farklı zamanlarda düşer:
 *
 *  - Yönetici (STK admin / ilan sahibi / süper-admin): etkinlik/gönüllülük
 *    YAYINLANDIĞI andan BİTİŞİNE kadar kilit ekranında kalır — geri sayım işler,
 *    ilerleme çizgisi dolar. 24 saat kısıtı YOK.
 *  - Katılımcı (başvuran gönüllü / katılımcı): Live Activity yalnız başlangıca
 *    ≤ 24 saat kala (veya etkinlik hâlihazırda sürüyorsa) kilit ekranına düşer.
 *
 * Saf + tipli (Firebase/React importu yok) — client, effect ve API rotaları import edebilir.
 */

export type LiveActivityRole = 'manager' | 'participant';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Bu izleyici (rol) için Live Activity şu an başlatılmalı mı?
 *
 * @param role       'manager' (yönetici) | 'participant' (katılımcı)
 * @param startEpoch etkinlik/gönüllülük başlangıcı (ms epoch; 0 = geçersiz/yok)
 * @param endEpoch   bitiş (ms epoch; 0 = geçersiz/yok)
 * @param now        şimdiki zaman (ms epoch) — genelde Date.now()
 */
export function shouldShowLiveActivity({
  role,
  startEpoch,
  endEpoch,
  now,
}: {
  role: LiveActivityRole;
  startEpoch: number;
  endEpoch: number;
  now: number;
}): boolean {
  // Geçerli tarih yok → gösterme (absürt/boş sayaç olmasın).
  if (!startEpoch && !endEpoch) return false;
  // Etkinlik bitmiş → gösterme.
  if (endEpoch > 0 && endEpoch < now) return false;

  // Yönetici: yayın anından bitişe kadar hep göster (lead-time kısıtı yok).
  if (role === 'manager') return true;

  // Katılımcı: yalnız başlangıca ≤ 24 saat kala VEYA etkinlik şu an sürüyorsa.
  const ongoing = startEpoch > 0 && startEpoch <= now && (endEpoch === 0 || now < endEpoch);
  if (ongoing) return true;
  return startEpoch > 0 && startEpoch - now <= TWENTY_FOUR_HOURS_MS && startEpoch - now >= 0;
}
