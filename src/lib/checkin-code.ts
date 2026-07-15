/**
 * checkin-code.ts — QR'sız (kodla) check-in için DETERMİNİSTİK kısa kod üretici.
 *
 * Amaç: Kapıdaki QR okunamadığında (kamera kapalı, ışık, eski cihaz…) katılımcı
 * yöneticinin ekranındaki 6 haneli kodu elle girerek check-in olabilsin. Kod
 * DB'ye YAZILMAZ; etkinlik/ilan id'sinden deterministik türetilir → yönetici,
 * katılımcı ve sunucu AYNI girdi için AYNI kodu üretir. Ekstra koleksiyon yok.
 *
 * Güvenlik seviyesi: mevcut imzasız statik QR ile aynı (düşük riskli "geldi"
 * kanıtı). İstemci tarafında sır gerektirmez; sunucu tarafı doğrulama (route'lar)
 * ek savunma olarak aynı fonksiyonu çağırır. crypto YOK → hem istemci hem sunucu.
 *
 * Saf (pure), tipli ve deterministik: yan etki yok, tarayıcı/Node API'sine bağlı
 * değil → istemci bileşenlerinden de sunucu route'larından da import edilebilir.
 */

// Karıştırılması kolay karakterler (0/O, 1/I/L) HARİÇ 32 karakterlik alfabe.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * FNV-1a benzeri stabil 32-bit string hash (saf JS, crypto yok).
 * Aynı girdi her platformda aynı sayıyı verir.
 */
function stableHash(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime (0x01000193) çarpımı — 32-bit taşmayı >>> 0 ile sabitle.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * kind + id'den 6 haneli, büyük harf alfanumerik (0/O/1/I yok) check-in kodu üretir.
 * Deterministik: aynı (kind, id) → her zaman aynı kod (yönetici = katılımcı = sunucu).
 */
export function checkinCodeFor(kind: 'event' | 'volunteering', id: string): string {
  // İki farklı hash tohumu ile 32-bit x 2 = 64 bitlik entropi → 6 karakter için yeterli.
  let h1 = stableHash(`${kind}:${id}`);
  let h2 = stableHash(`${id}:${kind}:hangel`);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    // Sırayla iki hash'ten 5'er bit tüketerek alfabeye eşle.
    const src = i % 2 === 0 ? h1 : h2;
    out += ALPHABET[src & 31]; // 32 karakterlik alfabe → 5 bit
    if (i % 2 === 0) h1 = h1 >>> 5;
    else h2 = h2 >>> 5;
  }
  return out;
}

/**
 * Kullanıcı girdisini karşılaştırma için normalize eder: büyük harfe çevirir,
 * boşluk ve tireleri atar. ("abc-123" ve " ABC123 " → "ABC123").
 */
export function normalizeCode(input: string | null | undefined): string {
  return (input ?? '').toUpperCase().replace(/[\s-]+/g, '');
}
