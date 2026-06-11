/**
 * Akakçe export — CanonicalProduct[] → Akakçe benzeri XML.
 * Türkçe alan adları; Akakçe fiyat-karşılaştırma feed şeması.
 */
import type { CanonicalProduct } from '@/lib/feed/types';

/** XML metin kaçışı (& < > " ' → entity). */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function toAkakceXml(products: CanonicalProduct[]): string {
  const items = products
    .map((p) => {
      const effectivePrice = typeof p.salePrice === 'number' ? p.salePrice : p.price;
      const lines: string[] = [];
      lines.push('  <urun>');
      lines.push(`    <ad>${esc(p.title)}</ad>`);
      lines.push(`    <fiyat>${esc(effectivePrice.toFixed(2))}</fiyat>`);
      lines.push(`    <link>${esc(p.productUrl)}</link>`);
      if (p.imageLink) {
        lines.push(`    <resim>${esc(p.imageLink)}</resim>`);
      }
      if (p.category) {
        lines.push(`    <kategori>${esc(p.category)}</kategori>`);
      }
      lines.push(`    <marka>${esc(p.brandName)}</marka>`);
      lines.push('  </urun>');
      return lines.join('\n');
    })
    .join('\n');

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urunler>', items, '</urunler>'].join('\n');
}
