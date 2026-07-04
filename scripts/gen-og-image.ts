/**
 * Varsayılan OpenGraph / Twitter paylaşım kartını üretir.
 *
 * 1200×630 PNG → public/opengraph-image.png
 * Mercan (#f34723) gradyan zemin + beyaz "hangel" wordmark + slogan.
 *
 * Çalıştır: npx tsx scripts/gen-og-image.ts
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const W = 1200;
const H = 630;
const OUT = path.join(process.cwd(), 'public', 'opengraph-image.png');

// SVG ile mercan gradyan zemin + metinler. Yazı tipi olarak sistemde daima
// bulunan generic sans-serif (bold) kullanılır — böylece font gömmeye gerek
// kalmaz ve script her ortamda çalışır.
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f34723"/>
      <stop offset="55%" stop-color="#f0532f"/>
      <stop offset="100%" stop-color="#d83a1a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W - 120}" cy="120" r="260" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="${H - 90}" r="200" fill="#ffffff" opacity="0.05"/>
  <text x="50%" y="46%" text-anchor="middle"
    font-family="'Poppins','Helvetica Neue',Arial,sans-serif"
    font-size="150" font-weight="900" fill="#ffffff"
    letter-spacing="-4">hangel</text>
  <text x="50%" y="64%" text-anchor="middle"
    font-family="'Poppins','Helvetica Neue',Arial,sans-serif"
    font-size="46" font-weight="600" fill="#ffffff" opacity="0.96"
    letter-spacing="0.5">Alışverişin iyiliğe dönüşür</text>
</svg>`;

async function main() {
  const buf = Buffer.from(svg);
  await sharp(buf).png().toFile(OUT);
  const meta = await sharp(OUT).metadata();
  const stat = fs.statSync(OUT);
  console.log(
    `✓ ${OUT} (${meta.width}×${meta.height}, ${(stat.size / 1024).toFixed(1)} KB)`,
  );
}

main().catch((e) => {
  console.error('OG image üretilemedi:', e);
  process.exit(1);
});
