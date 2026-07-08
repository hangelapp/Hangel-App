/**
 * Kart görselleri için ücretsiz thumbnail proxy (perf: market ~5MB → ~1MB).
 *
 * Ürün görselleri merchant CDN'lerinden TAM BOY geliyor ama kartta ~144px, detayda
 * ~800px gösteriliyor. images.weserv.nl (ücretsiz, kayıtsız, yaygın kullanılan
 * resize/webp proxy) ile küçültüp webp veririz → indirilen bayt %80 azalır.
 *
 * GÜVENLİK/DAYANIKLILIK: proxy erişilemezse kart onError ile ORİJİNAL görsele
 * döner (mevcut davranış), yani en kötü ihtimalde bugünküyle aynı. Sıfır maliyet.
 */
export function proxiedThumb(url?: string | null, width = 320): string | undefined {
  if (!url) return undefined;
  // data:/blob: veya göreli yol → dokunma.
  if (!/^https?:\/\//i.test(url)) return url;
  // Zaten weserv ise tekrar sarma.
  if (/images\.weserv\.nl/i.test(url)) return url;
  const stripped = url.replace(/^https?:\/\//i, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&w=${width}&output=webp&q=72&we`;
}
