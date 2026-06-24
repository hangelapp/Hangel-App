/**
 * /market route segment config.
 *
 * `force-dynamic`: market vitrini sık güncellenir; statik/ISR + edge cache
 * yüzünden deploy sonrası kullanıcılar ESKİ sürümü görmesin diye her istekte
 * taze sunucu render'ı + no-store. Ürün/marka verisi zaten client-side çekilir,
 * ek sunucu maliyeti minimaldir. (Eskiden /market/discover/layout.tsx'teydi.)
 */
export const dynamic = 'force-dynamic';

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
