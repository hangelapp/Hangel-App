/**
 * PassKit branded PNG generator — Hangel brand assets.
 *
 * Apple Wallet .pkpass için gerekli icon/logo/strip görsellerini Hangel
 * markası ile üretir. Saf Node (built-in `zlib` + `Buffer`) ile çalışır —
 * external image library yok (sharp/canvas/jimp gerekmez).
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-passkit-placeholders.ts
 *
 * Çıktı: src/lib/passkit/assets/{icon,logo,strip}{,@2x,@3x}.png
 *
 * Tasarım:
 *   - Icon (kare): Hangel kırmızı arkaplan (#E0140F) + ortalı beyaz "h" harfi
 *   - Logo (yatay): beyaz arkaplan + sol Hangel kare logosu + "hangel" wordmark
 *   - Strip (geniş yatay): Hangel kırmızı arkaplan + ortalı beyaz "h" badge
 *
 * "h" harfi geometrik olarak (font'tan bağımsız) iki dikey bar + üst köprü
 * şeklinde çizilir. Production tasarımcısı override edebilir.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { deflateSync } from 'zlib';

const ASSETS_DIR = resolve(process.cwd(), 'src/lib/passkit/assets');
mkdirSync(ASSETS_DIR, { recursive: true });

type Color = readonly [number, number, number, number]; // RGBA, 0-255

const HANGEL_RED: Color = [0xE0, 0x14, 0x0F, 0xFF];
const HANGEL_ORANGE: Color = [0xF8, 0x71, 0x58, 0xFF];
const WHITE: Color = [0xFF, 0xFF, 0xFF, 0xFF];
const TRANSPARENT: Color = [0, 0, 0, 0];

// -----------------------------------------------------------------------------
// Pure-JS PNG encoder (RGBA8, non-interlaced, single IDAT)
// -----------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width: number, height: number, pixels: Uint8Array): Buffer {
  // pixels = RGBA, row-major, length = width*height*4
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type = RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // IDAT: each scanline prefixed with filter byte 0 (None)
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * rowBytes, rowBytes)
      .copy(raw, y * (rowBytes + 1) + 1);
  }
  const idatChunk = chunk('IDAT', deflateSync(raw, { level: 9 }));
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// -----------------------------------------------------------------------------
// Pixel buffer + drawing primitives
// -----------------------------------------------------------------------------

class PixelBuffer {
  readonly data: Uint8Array;
  constructor(public readonly width: number, public readonly height: number) {
    this.data = new Uint8Array(width * height * 4);
  }
  fill(c: Color): void {
    const [r, g, b, a] = c;
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }
  fillRect(x: number, y: number, w: number, h: number, c: Color): void {
    const [r, g, b, a] = c;
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.ceil(x + w));
    const y1 = Math.min(this.height, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * this.width + xx) * 4;
        this.data[i] = r;
        this.data[i + 1] = g;
        this.data[i + 2] = b;
        this.data[i + 3] = a;
      }
    }
  }
  // Filled circle (no AA — simple inclusion test)
  fillCircle(cx: number, cy: number, radius: number, c: Color): void {
    const [r, g, b, a] = c;
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(this.width, Math.ceil(cx + radius));
    const y1 = Math.min(this.height, Math.ceil(cy + radius));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const dx = xx + 0.5 - cx;
        const dy = yy + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) {
          const i = (yy * this.width + xx) * 4;
          this.data[i] = r;
          this.data[i + 1] = g;
          this.data[i + 2] = b;
          this.data[i + 3] = a;
        }
      }
    }
  }
  // Rounded rectangle (corner radius rr) — used for badge backgrounds
  fillRoundedRect(x: number, y: number, w: number, h: number, rr: number, c: Color): void {
    rr = Math.min(rr, w / 2, h / 2);
    // Center band
    this.fillRect(x, y + rr, w, h - 2 * rr, c);
    // Top + bottom bands
    this.fillRect(x + rr, y, w - 2 * rr, rr, c);
    this.fillRect(x + rr, y + h - rr, w - 2 * rr, rr, c);
    // 4 corners
    this.fillCircle(x + rr, y + rr, rr, c);
    this.fillCircle(x + w - rr, y + rr, rr, c);
    this.fillCircle(x + rr, y + h - rr, rr, c);
    this.fillCircle(x + w - rr, y + h - rr, rr, c);
  }
  toPng(): Buffer {
    return encodePng(this.width, this.height, this.data);
  }
}

// -----------------------------------------------------------------------------
// Hangel "h" glyph — geometric drawing (no font)
//
// Bounding box `(x, y, w, h)` içine ortalı bir "h" çizer.
// Tasarım: iki dikey bar (sol = uzun, sağ = kısa) + üst sağ köprü (arch).
// -----------------------------------------------------------------------------

function drawHGlyph(buf: PixelBuffer, x: number, y: number, w: number, h: number, color: Color): void {
  // Stroke kalınlığı: glyph yüksekliğinin yaklaşık 1/4'ü
  const stroke = Math.max(1, Math.round(h * 0.24));
  // Sol bar: tüm boy
  const leftBarX = x;
  const leftBarW = stroke;
  buf.fillRect(leftBarX, y, leftBarW, h, color);
  // Sağ bar: orta yüksekliği yaklaşık 60% (alt kısmı)
  const rightBarW = stroke;
  const rightBarX = x + w - rightBarW;
  const rightBarY = y + Math.round(h * 0.42);
  const rightBarH = h - (rightBarY - y);
  buf.fillRect(rightBarX, rightBarY, rightBarW, rightBarH, color);
  // Köprü (arch): sol bar üstünden sağ bara doğru — yatay bağlayıcı
  const archY = rightBarY;
  const archX = leftBarX + leftBarW;
  const archW = rightBarX - archX + rightBarW; // include right bar
  const archH = stroke;
  buf.fillRect(archX, archY, archW, archH, color);
  // Arch'in sol üstüne yuvarlatma — küçük circle
  buf.fillCircle(archX + Math.round(stroke * 0.4), archY + Math.round(stroke * 0.5), Math.round(stroke * 0.55), color);
}

// "hangel" wordmark — basit harf harf geometric çizim. Apple PassKit logo
// alanına sığması için kompakt versiyon. Her harf yaklaşık `letterW` genişlik.
function drawWordmarkHangel(buf: PixelBuffer, x: number, y: number, h: number, color: Color): number {
  const letterH = h;
  const letterW = Math.round(h * 0.65);
  const stroke = Math.max(1, Math.round(h * 0.18));
  const gap = Math.max(1, Math.round(h * 0.10));
  let cx = x;
  // 'h'
  drawHGlyph(buf, cx, y, letterW, letterH, color);
  cx += letterW + gap;
  // 'a' — daire + sağ alt bar
  {
    const w = letterW;
    const cyA = y + letterH - Math.round(letterH * 0.45);
    const rA = Math.round(letterH * 0.42);
    // Outer ring
    buf.fillCircle(cx + w / 2, cyA, rA, color);
    // Inner cutout
    buf.fillCircle(cx + w / 2, cyA, Math.max(1, rA - stroke), WHITE);
    // Sağ alt dikey bar (a'nın sağ kenarı)
    buf.fillRect(cx + w - stroke, cyA, stroke, Math.round(letterH * 0.45), color);
    cx += w + gap;
  }
  // 'n' — sol bar + arch + sağ bar (alt yarıda)
  {
    const w = letterW;
    const nY = y + Math.round(letterH * 0.42);
    const nH = letterH - (nY - y);
    buf.fillRect(cx, nY, stroke, nH, color);
    buf.fillRect(cx + w - stroke, nY, stroke, nH, color);
    buf.fillRect(cx, nY, w, stroke, color);
    cx += w + gap;
  }
  // 'g' — daire + sağ uzun bar (descender alta uzanır)
  {
    const w = letterW;
    const cyG = y + letterH - Math.round(letterH * 0.45);
    const rG = Math.round(letterH * 0.42);
    buf.fillCircle(cx + w / 2, cyG, rG, color);
    buf.fillCircle(cx + w / 2, cyG, Math.max(1, rG - stroke), WHITE);
    // Sağ dikey bar — descender (alta inen)
    buf.fillRect(cx + w - stroke, cyG, stroke, Math.round(letterH * 0.50), color);
    cx += w + gap;
  }
  // 'e' — daire + iç yatay çizgi + sağ kesik
  {
    const w = letterW;
    const cyE = y + letterH - Math.round(letterH * 0.45);
    const rE = Math.round(letterH * 0.42);
    buf.fillCircle(cx + w / 2, cyE, rE, color);
    buf.fillCircle(cx + w / 2, cyE, Math.max(1, rE - stroke), WHITE);
    // Yatay orta çizgi (e'nin ortası)
    buf.fillRect(cx + Math.round(stroke * 0.6), cyE - Math.round(stroke * 0.3), w - Math.round(stroke * 1.2), stroke, color);
    // Sağ alt kesim — beyaz dikdörtgen (e'nin sağ açıklığı)
    buf.fillRect(cx + w - stroke - Math.round(rE * 0.4), cyE - Math.round(stroke * 0.3), Math.round(rE * 0.4) + stroke, Math.round(stroke * 0.9), WHITE);
    cx += w + gap;
  }
  // 'l' — tek dikey bar (uzun)
  {
    buf.fillRect(cx, y, stroke, letterH, color);
    cx += stroke + gap;
  }
  return cx - x; // total wordmark width
}

// -----------------------------------------------------------------------------
// Asset builders
// -----------------------------------------------------------------------------

function buildIcon(size: number): Buffer {
  // Hangel kırmızı zemin + ortalı beyaz "h"
  const buf = new PixelBuffer(size, size);
  buf.fill(HANGEL_RED);
  // 'h' glyph — ikon yüksekliğinin %60'ı, ortalı
  const glyphH = Math.round(size * 0.60);
  const glyphW = Math.round(glyphH * 0.70);
  const gx = Math.round((size - glyphW) / 2);
  const gy = Math.round((size - glyphH) / 2);
  drawHGlyph(buf, gx, gy, glyphW, glyphH, WHITE);
  return buf.toPng();
}

function buildLogo(width: number, height: number): Buffer {
  // Beyaz zemin + sol kare Hangel logo + "hangel" wordmark
  const buf = new PixelBuffer(width, height);
  buf.fill(TRANSPARENT); // PassKit logo bölgesi şeffaf — pass renk altında
  // Sol kare logo (kırmızı badge)
  const badgeSize = Math.min(height, Math.round(width * 0.32));
  const badgeX = 0;
  const badgeY = Math.round((height - badgeSize) / 2);
  const badgeRR = Math.round(badgeSize * 0.20);
  buf.fillRoundedRect(badgeX, badgeY, badgeSize, badgeSize, badgeRR, HANGEL_RED);
  // 'h' badge içinde
  const innerH = Math.round(badgeSize * 0.62);
  const innerW = Math.round(innerH * 0.70);
  const ix = badgeX + Math.round((badgeSize - innerW) / 2);
  const iy = badgeY + Math.round((badgeSize - innerH) / 2);
  drawHGlyph(buf, ix, iy, innerW, innerH, WHITE);
  // Wordmark "hangel" — beyaz değil, kırmızı (beyaz/şeffaf zeminde)
  const wmH = Math.round(height * 0.50);
  const wmX = badgeX + badgeSize + Math.round(height * 0.18);
  const wmY = Math.round((height - wmH) / 2);
  drawWordmarkHangel(buf, wmX, wmY, wmH, HANGEL_RED);
  return buf.toPng();
}

function buildStrip(width: number, height: number): Buffer {
  // Hangel kırmızı zemin + sağ tarafta turuncu accent şerit + sol ortada beyaz badge
  const buf = new PixelBuffer(width, height);
  buf.fill(HANGEL_RED);
  // Sağ turuncu accent (genişliğin %25'i)
  const accentW = Math.round(width * 0.25);
  buf.fillRect(width - accentW, 0, accentW, height, HANGEL_ORANGE);
  // Sol orta beyaz "h" badge (kare, height'in %70'i)
  const badgeSize = Math.round(height * 0.70);
  const badgeX = Math.round(width * 0.06);
  const badgeY = Math.round((height - badgeSize) / 2);
  const badgeRR = Math.round(badgeSize * 0.18);
  buf.fillRoundedRect(badgeX, badgeY, badgeSize, badgeSize, badgeRR, WHITE);
  // 'h' kırmızı, badge içinde
  const innerH = Math.round(badgeSize * 0.60);
  const innerW = Math.round(innerH * 0.70);
  const ix = badgeX + Math.round((badgeSize - innerW) / 2);
  const iy = badgeY + Math.round((badgeSize - innerH) / 2);
  drawHGlyph(buf, ix, iy, innerW, innerH, HANGEL_RED);
  // "hangel" wordmark — badge sağında, beyaz
  const wmH = Math.round(height * 0.32);
  const wmX = badgeX + badgeSize + Math.round(height * 0.20);
  const wmY = Math.round((height - wmH) / 2);
  drawWordmarkHangel(buf, wmX, wmY, wmH, WHITE);
  return buf.toPng();
}

// -----------------------------------------------------------------------------
// Asset manifest (Apple PassKit @1x / @2x / @3x sizes)
// -----------------------------------------------------------------------------

interface AssetSpec {
  name: string;
  width: number;
  height: number;
  build: (w: number, h: number) => Buffer;
}

const assets: AssetSpec[] = [
  // icon: 29×29, 58×58, 87×87 (Apple spec)
  { name: 'icon.png',     width: 29,  height: 29,  build: (w, _h) => buildIcon(w) },
  { name: 'icon@2x.png',  width: 58,  height: 58,  build: (w, _h) => buildIcon(w) },
  { name: 'icon@3x.png',  width: 87,  height: 87,  build: (w, _h) => buildIcon(w) },
  // logo: 160×50, 320×100, 480×150
  { name: 'logo.png',     width: 160, height: 50,  build: buildLogo },
  { name: 'logo@2x.png',  width: 320, height: 100, build: buildLogo },
  { name: 'logo@3x.png',  width: 480, height: 150, build: buildLogo },
  // strip: 320×123, 640×246, 960×369
  { name: 'strip.png',    width: 320, height: 123, build: buildStrip },
  { name: 'strip@2x.png', width: 640, height: 246, build: buildStrip },
  { name: 'strip@3x.png', width: 960, height: 369, build: buildStrip },
];

for (const asset of assets) {
  const path = resolve(ASSETS_DIR, asset.name);
  const png = asset.build(asset.width, asset.height);
  writeFileSync(path, png);
  console.log(`  OK  ${asset.name} (${asset.width}×${asset.height}, ${png.length} bytes)`);
}

console.log(`\n${assets.length} branded Hangel PassKit asset yazıldı: ${ASSETS_DIR}`);
console.log('Tasarımcı override ederse: aynı boyutlarda PNG-32 üzerine yaz.');
