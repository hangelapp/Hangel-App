/**
 * Mesafe / süre yardımcıları — kullanıcı konumu ile hedef (etkinlik/gönüllülük/kan)
 * arasındaki uzaklığı km + yaklaşık sürüş dakikası olarak verir.
 *
 * Sürüş süresi için ücretsiz routing API yok → kuş uçuşu mesafeden TAHMİN edilir
 * (yol katsayısı × ortalama hız). Bu yüzden dakika "~" (yaklaşık) ile gösterilir.
 * Saf TS — client + server import edebilir.
 */

export type LatLon = { lat: number; lon: number };

/** Kuş uçuşu mesafe (km), haversine. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Yaklaşık sürüş süresi (dk). Routing API olmadığı için kuş uçuşu mesafeyi
 * ~1.3 yol katsayısı ile çarpıp şehir-içi ortalama ~30 km/s hıza böler.
 * Çok kısa mesafelerde en az 1 dk döner.
 */
export function estimateDriveMinutes(km: number): number {
  const roadKm = km * 1.3;
  const minutes = (roadKm / 30) * 60;
  return Math.max(1, Math.round(minutes));
}

/** "12 km" / "850 m" biçimi. */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** "~26 dk" / "~1 sa 10 dk" biçimi. */
export function formatMinutes(min: number): string {
  if (min < 60) return `~${min} dk`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `~${h} sa` : `~${h} sa ${m} dk`;
}

/** Hedef koordinata göre "12 km · ~26 dk" özeti. */
export function distanceSummary(user: LatLon, target: LatLon): { km: number; minutes: number; text: string } {
  const km = haversineKm(user, target);
  const minutes = estimateDriveMinutes(km);
  return { km, minutes, text: `${formatKm(km)} · ${formatMinutes(minutes)}` };
}
