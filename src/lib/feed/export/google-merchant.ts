/**
 * Google Merchant export — CanonicalProduct[] → Google Merchant RSS 2.0 XML.
 * Standart `g:` namespace; Google Shopping feed şeması.
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

/** "123.45 TRY" formatında fiyat. */
function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function toGoogleMerchantXml(
  products: CanonicalProduct[],
  opts?: { title?: string; link?: string },
): string {
  const channelTitle = esc(opts?.title ?? 'hangel ürün feed');
  const channelLink = esc(opts?.link ?? 'https://hangel.org');

  const items = products
    .map((p) => {
      const lines: string[] = [];
      lines.push('    <item>');
      lines.push(`      <g:id>${esc(p.id)}</g:id>`);
      lines.push(`      <g:title>${esc(p.title)}</g:title>`);
      if (p.description) {
        lines.push(`      <g:description>${esc(p.description)}</g:description>`);
      }
      lines.push(`      <g:link>${esc(p.productUrl)}</g:link>`);
      if (p.imageLink) {
        lines.push(`      <g:image_link>${esc(p.imageLink)}</g:image_link>`);
      }
      for (const img of p.additionalImages ?? []) {
        lines.push(`      <g:additional_image_link>${esc(img)}</g:additional_image_link>`);
      }
      lines.push(`      <g:price>${esc(formatPrice(p.price, p.currency))}</g:price>`);
      if (typeof p.salePrice === 'number') {
        lines.push(`      <g:sale_price>${esc(formatPrice(p.salePrice, p.currency))}</g:sale_price>`);
      }
      lines.push(`      <g:availability>${esc(p.availability ?? 'in stock')}</g:availability>`);
      lines.push(`      <g:brand>${esc(p.brandName)}</g:brand>`);
      lines.push('      <g:condition>new</g:condition>');
      if (p.gtin) {
        lines.push(`      <g:gtin>${esc(p.gtin)}</g:gtin>`);
      }
      if (p.mpn) {
        lines.push(`      <g:mpn>${esc(p.mpn)}</g:mpn>`);
      }
      if (p.category) {
        lines.push(`      <g:product_type>${esc(p.category)}</g:product_type>`);
      }
      lines.push('    </item>');
      return lines.join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${channelTitle}</title>`,
    `    <link>${channelLink}</link>`,
    '    <description>hangel ürün kütüphanesi</description>',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}
