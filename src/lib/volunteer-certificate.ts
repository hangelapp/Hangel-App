// hangel GÖNÜLLÜLÜK sertifikası PDF üretici — etkinlik sertifikasından AYRI tasarım + AYRI metin.
// Why:
// - Gönüllülük "yalnız başına bir mücadele" değildir; birlikte, kolektif bir dayanışmadır.
//   Metin bilinçli olarak duygusal ve "birlikte" temalı (kullanıcı isteği).
// - Tasarım etkinlik sertifikasından FARKLI: üstte coral degrade bant + kalp motifi,
//   ortada duygusal alıntı. iOS-GÜVENLİ: self-contained SVG → Image → canvas → jsPDF
//   (html2canvas YOK, foreignObject YOK; sistem fontuyla Türkçe glyph'ler doğru).
// - Doğrulama: H ile başlayan kısa kod + kontrol linki + QR (hangel.org.tr/c/{kod}).

import { buildCertCode, certVerifyUrl } from '@/lib/certificate-code';

export const VCERT_WIDTH_MM = 210;
export const VCERT_HEIGHT_MM = 148;

const HANGEL_LOGO_PATH = '/icon-512.png';

async function urlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generateQrDataUri(data: string, sizePx = 600): Promise<string | null> {
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=${sizePx}x${sizePx}&data=${encodeURIComponent(data)}&margin=0`;
  return urlToDataUri(qrApi);
}

function formatTrDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const escXml = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

/** SVG → JPEG data URI (iOS-güvenli: native Image → canvas, foreignObject yok). */
function rasterizeSvgToJpeg(svg: string, widthPx: number, heightPx: number, scale = 2): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(widthPx * scale);
        canvas.height = Math.round(heightPx * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas 2d context alınamadı'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('SVG rasterize hatası'));
      }
    };
    img.onerror = () => reject(new Error('Sertifika görseli oluşturulamadı (SVG yüklenemedi)'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export type VolunteerCertificateInput = {
  taskTitle: string;
  organizerName: string;
  userName: string;
  date: string;
  certificateId: string;
  code?: string;
  country?: string;
  city?: string;
  logoUrl?: string;
};

export async function generateVolunteerCertificate(input: VolunteerCertificateInput): Promise<Blob> {
  const { taskTitle, organizerName, userName, date, certificateId } = input;
  const code = input.code || buildCertCode({ country: input.country, kind: 'volunteer', idSeed: certificateId });
  const verify = certVerifyUrl(code);
  const verifyShort = verify.replace(/^https?:\/\//, '');

  const CORAL = '#f34723';
  const CORAL_DARK = '#c5391b';
  const INK = '#1f1f1f';

  const [logoUri, qrUri, orgLogoUri] = await Promise.all([
    typeof window !== 'undefined' ? urlToDataUri(HANGEL_LOGO_PATH) : Promise.resolve(null),
    generateQrDataUri(verify, 600),
    input.logoUrl ? urlToDataUri(input.logoUrl) : Promise.resolve(null),
  ]);

  const PX_W = 794;
  const PX_H = 559;
  const FONT = "-apple-system,'SF Pro Display',system-ui,'Helvetica Neue',Arial,sans-serif";
  const fit = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

  // Duygusal, "birlikte/kolektif" temalı metin.
  const quote = 'İyilik yalnız başına başarılmaz; birlikte, omuz omuza büyür.';
  const bodyLine1 = `${organizerName || 'bir STK'} ile yürüttüğü`;
  const bodyLine2 = `“${taskTitle || 'gönüllülük'}” gönüllülüğünde gönülden emek verdi.`;
  const bodyLine3 = 'Bu kolektif dayanışmanın gerçek bir parçası oldu — verdiği her an bir umuda dokundu.';

  // Üstte coral degrade bant + beyaz kalp (etkinlik sertifikasından farklı kimlik).
  const heart =
    'M0,7 C0,2 4,0 7,3 C10,0 14,2 14,7 C14,11 7,16 7,16 C7,16 0,11 0,7 Z';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PX_W}" height="${PX_H}" viewBox="0 0 ${PX_W} ${PX_H}">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${CORAL}"/>
      <stop offset="1" stop-color="${CORAL_DARK}"/>
    </linearGradient>
  </defs>
  <style>text{font-family:${FONT};}</style>
  <rect width="${PX_W}" height="${PX_H}" fill="#ffffff"/>
  <rect x="14" y="14" width="${PX_W - 28}" height="${PX_H - 28}" rx="20" fill="none" stroke="${CORAL}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Üst coral bant -->
  <path d="M14 34 a20 20 0 0 1 20 -20 h${PX_W - 68} a20 20 0 0 1 20 20 v62 h-${PX_W - 28} Z" fill="url(#band)"/>
  ${logoUri ? `<image x="44" y="34" width="34" height="34" href="${logoUri}" xlink:href="${logoUri}"/>` : ''}
  <text x="${logoUri ? 88 : 44}" y="59" font-size="24" font-weight="800" letter-spacing="-0.7" fill="#ffffff">hangel</text>
  <g transform="translate(${PX_W - 250}, 40) scale(1.4)"><path d="${heart}" fill="#ffffff" fill-opacity="0.95"/></g>
  <text x="${PX_W - 44}" y="59" font-size="15" font-weight="800" letter-spacing="3" fill="#ffffff" text-anchor="end">GÖNÜLLÜLÜK SERTİFİKASI</text>

  <!-- Duygusal alıntı -->
  <text x="${PX_W / 2}" y="158" font-size="15" font-weight="600" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(quote, 64))}</text>

  <text x="${PX_W / 2}" y="206" font-size="13" font-weight="500" fill="#86868b" text-anchor="middle">Bu belge</text>
  <text x="${PX_W / 2}" y="256" font-size="42" font-weight="800" letter-spacing="-1.1" fill="${INK}" text-anchor="middle">${escXml(fit(userName || 'Gönüllü', 34))}</text>

  <text x="${PX_W / 2}" y="298" font-size="15" font-weight="500" fill="#515154" text-anchor="middle">${escXml(fit(bodyLine1, 80))}</text>
  <text x="${PX_W / 2}" y="320" font-size="15" font-weight="600" fill="${INK}" text-anchor="middle">${escXml(fit(bodyLine2, 70))}</text>
  <text x="${PX_W / 2}" y="346" font-size="12.5" font-weight="500" fill="#86868b" text-anchor="middle">${escXml(fit(bodyLine3, 92))}</text>

  ${orgLogoUri ? `<image x="${PX_W / 2 - 16}" y="360" width="32" height="32" href="${orgLogoUri}" xlink:href="${orgLogoUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  <text x="${PX_W / 2}" y="${orgLogoUri ? 412 : 398}" font-size="11" font-weight="700" letter-spacing="2.4" fill="#aeaeb2" text-anchor="middle">DÜZENLEYEN</text>
  <text x="${PX_W / 2}" y="${orgLogoUri ? 434 : 420}" font-size="17" font-weight="700" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(organizerName || 'hangel', 50))}</text>

  <text x="60" y="${PX_H - 76}" font-size="11" font-weight="700" letter-spacing="2" fill="#aeaeb2">TARİH</text>
  <text x="60" y="${PX_H - 56}" font-size="15" font-weight="500" fill="#515154">${escXml(formatTrDate(date))}</text>

  ${qrUri ? `<image x="${PX_W - 54 - 40}" y="${PX_H - 54 - 44}" width="54" height="54" href="${qrUri}" xlink:href="${qrUri}"/>
  <text x="${PX_W - 40 - 27}" y="${PX_H - 30}" font-size="8" fill="#aeaeb2" text-anchor="middle">${escXml(fit(verifyShort, 32))}</text>` : ''}

  <text x="${PX_W / 2}" y="${PX_H - 28}" font-size="12" font-weight="700" fill="${CORAL}" text-anchor="middle">hangel.org.tr</text>
  <text x="${PX_W / 2}" y="${PX_H - 13}" font-size="9" fill="#c7c7cc" text-anchor="middle">Sertifika Kodu: ${escXml(code)}</text>
</svg>`;

  const jpeg = await rasterizeSvgToJpeg(svg, PX_W, PX_H, 2);
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: [VCERT_WIDTH_MM, VCERT_HEIGHT_MM], orientation: 'landscape', compress: true });
  pdf.addImage(jpeg, 'JPEG', 0, 0, VCERT_WIDTH_MM, VCERT_HEIGHT_MM);
  return pdf.output('blob');
}
