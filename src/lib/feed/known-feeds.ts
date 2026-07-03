/**
 * Keşfedilmiş mağaza ürün-feed'leri (kendi importer'ımız).
 *
 * Ajanslar ürün-feed'i vermeyince mağazaların KENDİ herkese açık feed'lerinden
 * çekiyoruz. İki açık desen bulundu:
 *  - Shopify  → {domain}/products.json (sayfalı JSON)
 *  - T-Soft   → {domain}/xml/googleshopping.com.php (Google Merchant RSS)
 *
 * `brandId` = mağazanın hangel katalog anahtarı (ao-/ra-/go-<offerId>). Çekilen
 * ürünler bu brandId ile yazılır → marka/mağaza gruplaması ve "Ürüne Git"
 * affiliate deep-link'i (bağış zinciri) doğru çalışır.
 *
 * Yeni feed bulundukça buraya eklenir; super-admin "Bilinen feed'leri senkronla"
 * ile hepsi tek tıkla çekilir.
 */
export type KnownFeed = {
  name: string;
  brandId: string;        // ao-/ra-/go-<offerId>
  kind: 'shopify' | 'generic';
  feedUrl: string;        // shopify: mağaza kökü; generic: merchant XML URL'i
  donationRate: number;
};

export const KNOWN_STORE_FEEDS: KnownFeed[] = [
  // ── T-Soft (Google Merchant RSS — generic adapter) ──
  { name: 'Slazenger', brandId: 'ra-61650', kind: 'generic', feedUrl: 'https://slazenger.com.tr/xml/googleshopping.com.php', donationRate: 3 },
  { name: 'Mizalle', brandId: 'ra-62341', kind: 'generic', feedUrl: 'https://mizalle.com/xml/googleshopping.com.php', donationRate: 5 },
  { name: 'Hemington', brandId: 'ao-2845', kind: 'generic', feedUrl: 'https://hemington.com.tr/xml/googleshopping.com.php', donationRate: 6 },
  { name: 'Kütahya Porselen', brandId: 'ra-62144', kind: 'generic', feedUrl: 'https://kutahyaporselen.com/xml/googleshopping.com.php', donationRate: 4 },
  { name: 'Hızlısaat', brandId: 'ao-2874', kind: 'generic', feedUrl: 'https://hizlisaat.com/xml/googleshopping.com.php', donationRate: 6 },
  // ── Shopify (products.json — shopify adapter) ──
  { name: 'DAGİ', brandId: 'ra-61267', kind: 'shopify', feedUrl: 'https://www.dagi.com.tr', donationRate: 4 },
  { name: 'Fresh Scarfs', brandId: 'ra-62549', kind: 'shopify', feedUrl: 'https://www.freshscarfs.com', donationRate: 5 },
  { name: 'Reeder', brandId: 'ra-62508', kind: 'shopify', feedUrl: 'https://www.reeder.com.tr', donationRate: 2 },
];
