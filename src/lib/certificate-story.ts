'use client';

/**
 * Sertifika → Instagram hikâyesi (9:16, 1080×1920) marka kimlikli görsel.
 *
 * Etki hikayesi kartlarıyla aynı iOS-GÜVENLİ desen: self-contained SVG
 * (<text> + data-URI <image> + şekiller; foreignObject/filter YOK) → native
 * Image → canvas → JPEG data URI. Sertifikanın kendisi buildCertificateJpeg
 * çıktısı olarak gömülür — hikâye kartı ile PDF birebir aynı belgeyi gösterir.
 */

const CORAL = '#f34723';
const CORAL_DARK = '#c5391b';

const W = 1080;
const H = 1920;
// Sertifika JPEG'i A5 yatay (794×559) — hikâyede ~%88 genişlik kullanılır.
const CERT_W = 950;
const CERT_H = Math.round((CERT_W * 559) / 794); // ≈ 669

const FONT = "-apple-system,'SF Pro Display',system-ui,'Helvetica Neue',Arial,sans-serif";

const escXml = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

/** Düz metni ~maxChars genişlikte satırlara böler (SVG <text> sarmadığı için). */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return cut;
  }
  return lines;
}

function rasterizeSvgToJpeg(svg: string, widthPx: number, heightPx: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas 2d context alınamadı')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('SVG rasterize hatası'));
      }
    };
    img.onerror = () => reject(new Error('Hikâye görseli oluşturulamadı (SVG yüklenemedi)'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export type CertificateStoryInput = {
  /** buildEvent/VolunteerCertificateJpeg çıktısı (data URI). */
  certJpegDataUri: string;
  title: string;
  organization?: string;
  date?: string;
  userName?: string;
};

/** 1080×1920 hikâye kartı JPEG data URI'si üretir. */
export async function buildCertificateStoryJpeg(input: CertificateStoryInput): Promise<string> {
  const certX = Math.round((W - CERT_W) / 2);
  const certY = 560;

  const titleLines = wrapText(input.title, 34, 2);
  const meta = [input.organization, input.date].filter(Boolean).join(' · ');
  const titleY = certY + CERT_H + 120;
  const titleLineH = 62;
  const metaY = titleY + titleLines.length * titleLineH + 8;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CORAL}"/>
      <stop offset="1" stop-color="${CORAL_DARK}"/>
    </linearGradient>
    <clipPath id="certClip"><rect x="${certX}" y="${certY}" width="${CERT_W}" height="${CERT_H}" rx="28"/></clipPath>
  </defs>
  <style>text{font-family:${FONT};}</style>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- doku: köşelerde yumuşak beyaz daireler (Apple-temiz, filtresiz) -->
  <circle cx="80" cy="180" r="220" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="${W - 40}" cy="${H - 340}" r="300" fill="#ffffff" fill-opacity="0.05"/>

  <text x="${W / 2}" y="220" font-size="88" font-weight="800" letter-spacing="-2" fill="#ffffff" text-anchor="middle">hangel</text>
  <text x="${W / 2}" y="292" font-size="30" font-weight="700" letter-spacing="8" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">SOSYAL ETKİ</text>

  ${input.userName ? `<text x="${W / 2}" y="440" font-size="52" font-weight="800" letter-spacing="-1" fill="#ffffff" text-anchor="middle">${escXml(input.userName)}</text>
  <text x="${W / 2}" y="498" font-size="30" font-weight="600" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">sertifikasını kazandı 🧡</text>` : ''}

  <!-- sertifika: beyaz çerçeveli, yuvarlatılmış köşeli -->
  <rect x="${certX - 14}" y="${certY - 14}" width="${CERT_W + 28}" height="${CERT_H + 28}" rx="36" fill="#ffffff"/>
  <image x="${certX}" y="${certY}" width="${CERT_W}" height="${CERT_H}" clip-path="url(#certClip)" preserveAspectRatio="xMidYMid meet" href="${input.certJpegDataUri}" xlink:href="${input.certJpegDataUri}"/>

  ${titleLines.map((ln, i) => `<text x="${W / 2}" y="${titleY + i * titleLineH}" font-size="46" font-weight="800" letter-spacing="-0.5" fill="#ffffff" text-anchor="middle">${escXml(ln)}</text>`).join('\n  ')}
  ${meta ? `<text x="${W / 2}" y="${metaY}" font-size="30" font-weight="600" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">${escXml(meta)}</text>` : ''}

  <rect x="${W / 2 - 130}" y="${H - 170}" width="260" height="72" rx="36" fill="#ffffff"/>
  <text x="${W / 2}" y="${H - 122}" font-size="32" font-weight="800" fill="${CORAL}" text-anchor="middle">hangel.org</text>
</svg>`;

  return rasterizeSvgToJpeg(svg, W, H);
}
