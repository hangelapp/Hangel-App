/**
 * Cimri export — CanonicalProduct[] → Cimri XML.
 * Türkçe alan adları; Cimri fiyat-karşılaştırma feed şeması.
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

export function toCimriXml(products: CanonicalProduct[]): string {
  const items = products
    .map((p) => {
      const effectivePrice = typeof p.salePrice === 'number' ? p.salePrice : p.price;
      const inStock = (p.availability ?? 'in stock') === 'in stock';
      const lines: string[] = [];
      lines.push('  <product>');
      lines.push(`    <name>${esc(p.title)}</name>`);
      lines.push(`    <price>${esc(effectivePrice.toFixed(2))}</price>`);
      lines.push(`    <url>${esc(p.productUrl)}</url>`);
      if (p.imageLink) {
        lines.push(`    <image>${esc(p.imageLink)}</image>`);
      }
      if (p.category) {
        lines.push(`    <category>${esc(p.category)}</category>`);
      }
      lines.push(`    <brand>${esc(p.brandName)}</brand>`);
      lines.push(`    <stock>${inStock ? '1' : '0'}</stock>`);
      lines.push('  </product>');
      return lines.join('\n');
    })
    .join('\n');

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<products>', items, '</products>'].join('\n');
}
