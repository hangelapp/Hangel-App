/**
 * GET /api/brand/qr
 *
 * hangel branded QR code generator — telefon kamerasına gösterildiğinde
 * native QR tarayıcısı hedef URL'i açar (hangel.org.tr varsayılan).
 *
 * Query parametreleri:
 *   url       — hedef URL (default: https://hangel.org.tr)
 *   size      — kenar uzunluğu px (default: 512, min 256, max 2048)
 *   format    — png | svg (default: png)
 *   fg        — foreground hex (default: hangel orange #f34723)
 *   bg        — background hex (default: white)
 *   logo      — 1/0 — ortada hangel wordmark mı olsun (default: 1)
 *   ec        — error correction L|M|Q|H (default: H — center logo için H gerekli)
 *
 * Örnekler:
 *   /api/brand/qr                                      → 512px hangel.org.tr PNG
 *   /api/brand/qr?url=https://hangel.org.tr/etki&size=1024
 *   /api/brand/qr?logo=0&fg=000000                     → klasik siyah/beyaz
 *   /api/brand/qr?format=svg                           → vektör (ölçeklenebilir)
 *
 * Edge cases:
 *   - URL boşsa fallback hangel.org.tr
 *   - Logo H seviyesinde error correction ile center'a yerleştirilir (≤%30 alan)
 *   - Cache-Control: 1 saat (statik branded asset)
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import sharp from 'sharp';

export const runtime = 'nodejs';

const DEFAULT_URL = 'https://hangel.org.tr';
const HANGEL_ORANGE = '#f34723';
const HANGEL_NAVY = '#042654';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexOrDefault(v: string | null, fallback: string): string {
  if (!v) return fallback;
  const clean = v.startsWith('#') ? v : `#${v}`;
  return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : fallback;
}

function makeLogoSvg(size: number, color = HANGEL_NAVY, bg = '#ffffff'): string {
  // White rounded square + hangel wordmark inside. Embedded in QR center.
  const padding = Math.round(size * 0.06);
  const fontSize = Math.round(size * 0.32);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect x='${padding}' y='${padding}' width='${size - padding * 2}' height='${size - padding * 2}'
          rx='${Math.round(size * 0.18)}' ry='${Math.round(size * 0.18)}'
          fill='${bg}' stroke='${color}' stroke-width='${Math.round(size * 0.025)}'/>
    <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle'
          font-family='-apple-system, Helvetica, sans-serif' font-weight='800'
          font-size='${fontSize}' fill='${color}'>hangel</text>
  </svg>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const url = (searchParams.get('url') || DEFAULT_URL).trim();
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { errorCode: 'invalid_url', message: 'URL must start with http(s)://' },
      { status: 400 }
    );
  }

  const size = clamp(parseInt(searchParams.get('size') || '512', 10) || 512, 256, 2048);
  const format = (searchParams.get('format') || 'png').toLowerCase();
  const fg = hexOrDefault(searchParams.get('fg'), HANGEL_ORANGE);
  const bg = hexOrDefault(searchParams.get('bg'), '#ffffff');
  const includeLogo = searchParams.get('logo') !== '0';
  const ecLevel = (searchParams.get('ec') || 'H').toUpperCase();
  const errorCorrectionLevel = (['L', 'M', 'Q', 'H'].includes(ecLevel) ? ecLevel : 'H') as 'L' | 'M' | 'Q' | 'H';

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel,
        margin: 2,
        width: size,
        color: { dark: fg, light: bg },
      });
      // SVG logo overlay — append <g> child inside the QR SVG centered.
      let finalSvg = svg;
      if (includeLogo) {
        const logoSize = Math.round(size * 0.24);
        const logoX = Math.round((size - logoSize) / 2);
        const logoY = Math.round((size - logoSize) / 2);
        const logoSvg = makeLogoSvg(logoSize, fg, bg);
        // Embed logo before closing </svg>
        const inner = logoSvg
          .replace(/^<svg[^>]*>/, '')
          .replace(/<\/svg>$/, '');
        finalSvg = svg.replace(
          /<\/svg>\s*$/,
          `<g transform='translate(${logoX},${logoY})'>${inner}</g></svg>`,
        );
      }
      return new NextResponse(finalSvg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Disposition': 'inline; filename="hangel-qr.svg"',
        },
      });
    }

    // PNG path — qrcode → buffer, sharp ile logo composite.
    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel,
      margin: 2,
      width: size,
      color: { dark: fg, light: bg },
    });

    let finalBuffer: Buffer = qrBuffer;
    if (includeLogo) {
      const logoSize = Math.round(size * 0.24);
      const logoSvg = makeLogoSvg(logoSize, fg, bg);
      const logoPng = await sharp(Buffer.from(logoSvg))
        .png()
        .toBuffer();
      finalBuffer = await sharp(qrBuffer)
        .composite([
          {
            input: logoPng,
            gravity: 'center',
          },
        ])
        .png()
        .toBuffer();
    }

    // Convert Buffer to Uint8Array view for NextResponse body (Edge-safe).
    const body = new Uint8Array(finalBuffer);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Disposition': `inline; filename="hangel-qr-${size}.png"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'qr_generation_failed';
    return NextResponse.json(
      { errorCode: 'qr_generation_failed', message: msg },
      { status: 500 }
    );
  }
}
