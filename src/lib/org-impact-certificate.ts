// hangel KURUM ETKİ SERTİFİKASI PDF üretici — her kurumun (STK/marka/öğrenci kulübü)
// KENDİ faaliyetinden OTOMATİK kazandığı etki sertifikası. Süper-admin elle vermez.
// Why:
// - Gönüllülük sertifikasından (src/lib/volunteer-certificate.ts) AYRI bir kimlik:
//   kuruma ait, ölçülebilir mali/sosyal etki belgesi. İki dönem üretilir:
//   "Toplam Etki" (sürekli birikimli) ve aylık ("Haziran 2026").
// - iOS-GÜVENLİ: self-contained SVG → Image → canvas → jsPDF (html2canvas YOK,
//   foreignObject YOK; sistem fontuyla Türkçe glyph'ler doğru görünür).
// - Apple kimliği: temiz beyaz zemin, coral (#f34723) vurgu, ince çerçeve.
// - Doğrulama: H ile başlayan tiresiz Luhn'lı kod + kontrol linki + QR (hangel.org/c/{kod}).

import { buildCertCode, certVerifyUrl } from '@/lib/certificate-code';

export const OCERT_WIDTH_MM = 210;
export const OCERT_HEIGHT_MM = 148;

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

const escXml = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

/** Türkçe TL biçimi — tam sayı (kuruş gösterilmez), binlik ayraçlı. */
function formatTRY(n: number): string {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return v.toLocaleString('tr-TR');
}

/** Saat — ondalık varsa tek hane, yoksa tam. */
function formatHours(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return (Math.round(v * 10) / 10).toLocaleString('tr-TR');
}

function formatCount(n: number): string {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return v.toLocaleString('tr-TR');
}

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

export type OrgImpactMetrics = {
  volunteerHours: number;
  eventHours: number;
  volunteerCount: number;
  participantCount: number;
  donationTRY: number;
  impactValueTRY: number;
  totalSocialValueTRY: number;
};

export type OrgImpactCertificateInput = {
  orgName: string;
  kind: 'ngo' | 'brand' | 'club';
  /** 'Toplam Etki' veya 'Haziran 2026' */
  periodLabel: string;
  metrics: OrgImpactMetrics;
  code?: string;
  /** Aylık için YYYYMM, toplam için undefined → kod üretiminde kullanılır. */
  ym?: string;
  logoUrl?: string;
};

/** Aylık için kod faaliyet no'su: YYYYMM'in son 5 hanesi (ör. 202606 → 02606), toplam için 0. */
function activityNoFromYm(ym?: string): number {
  if (!ym) return 0;
  const digits = ym.replace(/[^0-9]/g, '');
  if (digits.length < 4) return 0;
  return Number(digits.slice(-5)) || 0;
}

function yearFromYm(ym?: string): number {
  if (ym) {
    const y = Number(ym.slice(0, 4));
    if (Number.isFinite(y) && y >= 2000) return y;
  }
  return new Date().getFullYear();
}

const kindLabel = (kind: OrgImpactCertificateInput['kind']): string => {
  switch (kind) {
    case 'brand': return 'MARKA';
    case 'club': return 'ÖĞRENCİ KULÜBÜ';
    default: return 'KURUM';
  }
};

export async function generateOrgImpactCertificate(input: OrgImpactCertificateInput): Promise<Blob> {
  const { orgName, kind, periodLabel, metrics } = input;
  const code =
    input.code ||
    buildCertCode({
      kind,
      country: '90',
      year: yearFromYm(input.ym),
      activityNo: activityNoFromYm(input.ym),
      personNo: 1,
      idSeed: `${orgName}-${input.ym ?? 'toplam'}`,
    });
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

  // Metrik satırları — sıfır olanları atla (boş "0 saat" göstermek yerine anlamlıları vurgula).
  const chips: string[] = [];
  if (metrics.volunteerHours > 0) chips.push(`${formatHours(metrics.volunteerHours)} saat gönüllülük`);
  if (metrics.eventHours > 0) chips.push(`${formatHours(metrics.eventHours)} saat etkinlik`);
  if (metrics.volunteerCount > 0) chips.push(`${formatCount(metrics.volunteerCount)} gönüllü`);
  if (metrics.participantCount > 0) chips.push(`${formatCount(metrics.participantCount)} katılımcı`);
  if (metrics.donationTRY > 0) chips.push(`${formatTRY(metrics.donationTRY)} TL bağış`);
  if (metrics.impactValueTRY > 0) chips.push('sosyal etki değeri');
  // Her zaman en az bir satır göster.
  const metricLine = chips.length > 0 ? chips.join('  ·  ') : 'henüz ölçülebilir etki kaydı yok';

  // Uzun metrik satırını iki satıra böl (orta nokta sınırından).
  const splitMetric = (line: string, maxLen: number): [string, string] => {
    if (line.length <= maxLen) return [line, ''];
    const parts = line.split('  ·  ');
    let a = '';
    let b = '';
    for (const p of parts) {
      if (a.length === 0) a = p;
      else if ((a + '  ·  ' + p).length <= maxLen) a = a + '  ·  ' + p;
      else b = b.length === 0 ? p : b + '  ·  ' + p;
    }
    return [a, b];
  };
  const [metricLine1, metricLine2] = splitMetric(metricLine, 64);

  const closing = `Toplamda ${formatTRY(metrics.totalSocialValueTRY)} TL sosyal fayda mali değeri üretilmiştir.`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PX_W}" height="${PX_H}" viewBox="0 0 ${PX_W} ${PX_H}">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${CORAL}"/>
      <stop offset="1" stop-color="${CORAL_DARK}"/>
    </linearGradient>
    <linearGradient id="closeBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CORAL}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${CORAL}" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <style>text{font-family:${FONT};}</style>
  <rect width="${PX_W}" height="${PX_H}" fill="#ffffff"/>
  <rect x="14" y="14" width="${PX_W - 28}" height="${PX_H - 28}" rx="20" fill="none" stroke="${CORAL}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Üst coral bant -->
  <path d="M14 34 a20 20 0 0 1 20 -20 h${PX_W - 68} a20 20 0 0 1 20 20 v62 h-${PX_W - 28} Z" fill="url(#band)"/>
  ${logoUri ? `<image x="44" y="34" width="34" height="34" href="${logoUri}" xlink:href="${logoUri}"/>` : ''}
  <text x="${logoUri ? 88 : 44}" y="59" font-size="24" font-weight="800" letter-spacing="-0.7" fill="#ffffff">hangel</text>
  <text x="${PX_W - 44}" y="59" font-size="15" font-weight="800" letter-spacing="3" fill="#ffffff" text-anchor="end">KURUM ETKİ SERTİFİKASI</text>

  <!-- Tür + period etiketi -->
  <text x="${PX_W / 2}" y="150" font-size="11" font-weight="700" letter-spacing="3" fill="#aeaeb2" text-anchor="middle">${escXml(kindLabel(kind))} ETKİ BELGESİ</text>

  <text x="${PX_W / 2}" y="200" font-size="40" font-weight="800" letter-spacing="-1.1" fill="${INK}" text-anchor="middle">${escXml(fit(orgName || 'Kurum', 36))}</text>

  <!-- Period rozeti -->
  <g transform="translate(${PX_W / 2}, 224)">
    <rect x="-100" y="0" width="200" height="30" rx="15" fill="${CORAL}" fill-opacity="0.12"/>
    <text x="0" y="20" font-size="14" font-weight="800" letter-spacing="0.4" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(periodLabel, 28))}</text>
  </g>

  <!-- Metrik satırları -->
  <text x="${PX_W / 2}" y="${metricLine2 ? 290 : 300}" font-size="15" font-weight="600" fill="#515154" text-anchor="middle">${escXml(metricLine1)}</text>
  ${metricLine2 ? `<text x="${PX_W / 2}" y="314" font-size="15" font-weight="600" fill="#515154" text-anchor="middle">${escXml(metricLine2)}</text>` : ''}

  <!-- Vurgulu kapanış -->
  <rect x="64" y="${PX_H - 158}" width="${PX_W - 128}" height="50" rx="14" fill="url(#closeBg)"/>
  <text x="${PX_W / 2}" y="${PX_H - 127}" font-size="15.5" font-weight="800" letter-spacing="-0.2" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(closing, 70))}</text>

  ${orgLogoUri ? `<image x="60" y="${PX_H - 86}" width="34" height="34" href="${orgLogoUri}" xlink:href="${orgLogoUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}

  ${qrUri ? `<image x="${PX_W - 54 - 40}" y="${PX_H - 54 - 44}" width="54" height="54" href="${qrUri}" xlink:href="${qrUri}"/>
  <text x="${PX_W - 40 - 27}" y="${PX_H - 30}" font-size="8" fill="#aeaeb2" text-anchor="middle">${escXml(fit(verifyShort, 32))}</text>` : ''}

  <text x="${PX_W / 2}" y="${PX_H - 28}" font-size="12" font-weight="700" fill="${CORAL}" text-anchor="middle">hangel.org</text>
  <text x="${PX_W / 2}" y="${PX_H - 13}" font-size="9" fill="#c7c7cc" text-anchor="middle">Sertifika Kodu: ${escXml(code)}</text>
</svg>`;

  const jpeg = await rasterizeSvgToJpeg(svg, PX_W, PX_H, 2);
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: [OCERT_WIDTH_MM, OCERT_HEIGHT_MM], orientation: 'landscape', compress: true });
  pdf.addImage(jpeg, 'JPEG', 0, 0, OCERT_WIDTH_MM, OCERT_HEIGHT_MM);
  return pdf.output('blob');
}
