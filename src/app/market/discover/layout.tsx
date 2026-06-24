/**
 * /market/discover route segment config.
 *
 * `force-dynamic`: sayfayı ISR/statik cache'leme — her istekte taze sunucu render'ı
 * + tarayıcıya no-store başlıkları. Neden: discover sık güncelleniyor; statik/ISR
 * cache (stale-time 300s) + edge cache yüzünden kullanıcılar deploy sonrası ESKİ
 * sürümü görüyordu (gizli modda bile). Dinamik → her zaman en güncel kabuk gelir.
 * Ürün/marka verisi zaten client-side çekildiği için bu ek sunucu maliyeti minimaldir.
 */
export const dynamic = 'force-dynamic';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
