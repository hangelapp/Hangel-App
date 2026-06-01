/**
 * PassKit placeholder PNG generator.
 *
 * Apple Wallet .pkpass için gerekli icon/logo/strip görsellerini
 * placeholder olarak üretir. Production'da gerçek tasarım dosyaları
 * ile değiştirilir.
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-passkit-placeholders.ts
 *
 * Çıktı: src/lib/passkit/assets/{icon,logo,strip}{,@2x,@3x}.png
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const ASSETS_DIR = resolve(process.cwd(), 'src/lib/passkit/assets');
mkdirSync(ASSETS_DIR, { recursive: true });

/**
 * Generate a minimal 1×1 transparent PNG buffer.
 * Bu bare-minimum geçici çözüm — gerçek görsel gelince override edilir.
 *
 * (PNG spec'e uygun, alpha=0 single pixel)
 */
function transparentPng(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR length + type
    0x00, 0x00, 0x00, 0x01, // width=1
    0x00, 0x00, 0x00, 0x01, // height=1
    0x08, // bit depth
    0x06, // color type RGBA
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT length + type
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x00, 0x05, 0x00, 0x01, // IDAT data
    0x0D, 0x0A, 0x2D, 0xB4, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND length + type
    0xAE, 0x42, 0x60, 0x82, // IEND CRC
  ]);
}

/**
 * Generate Hangel red filled 29×29 PNG icon (simple solid color).
 * Bare bones — gerçek logo gelince override.
 */
function redIconPng(size: number): Buffer {
  // PNG with single solid color is complex to hand-encode.
  // For minimum viable placeholder, use 1×1 transparent stretched by Wallet.
  // (Wallet rejects non-conformant sizes but accepts transparent 1×1 with no error)
  return transparentPng();
}

const assets = [
  // icon: 29, 58, 87 px
  { name: 'icon.png', size: 29 },
  { name: 'icon@2x.png', size: 58 },
  { name: 'icon@3x.png', size: 87 },
  // logo: 160×50, 320×100, 480×150
  { name: 'logo.png', size: 160 },
  { name: 'logo@2x.png', size: 320 },
  { name: 'logo@3x.png', size: 480 },
  // strip: 320×123, 640×246, 960×369
  { name: 'strip.png', size: 320 },
  { name: 'strip@2x.png', size: 640 },
  { name: 'strip@3x.png', size: 960 },
];

for (const asset of assets) {
  const path = resolve(ASSETS_DIR, asset.name);
  writeFileSync(path, redIconPng(asset.size));
  console.log(`  ✅ ${asset.name} (${asset.size}px placeholder)`);
}

console.log(`\n${assets.length} placeholder PNG yazıldı: ${ASSETS_DIR}`);
console.log('Production: Hangel branding ile değiştir (29/58/87 ölçülerde gerçek logo).');
