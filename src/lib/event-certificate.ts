// hangel rol-farkında ETKİNLİK katılım/katkı sertifikası PDF üretici.
// Why:
// - iOS-GÜVENLİ render: sertifika self-contained SVG string olarak kurulup native
//   Image → canvas → jsPDF ile gömülür (html2canvas WKWebView'de kırılıyordu).
// - Etkinlik sertifikası YATAY A5 tek sayfa: katılımcıya/konuşmacıya verilen resmi belge.
// - Rol-farkında: roleLabelTr (başlık rozeti) + roleCertificatePhraseTr (gövde cümlesi).
// - Renk: hangel coral paleti (Mercan #f34723, koyu koral #c5391b, Gece Siyahı #1f1f1f).

import { roleLabelTr, roleCertificatePhraseTr } from '@/lib/event-roles';
import type { EventUserRole } from '@/lib/event-roles';
import { buildCertCode, certVerifyUrl } from '@/lib/certificate-code';

// A5 yatay boyutları (mm) — sertifika klasik landscape.
export const CERT_WIDTH_MM = 210;
export const CERT_HEIGHT_MM = 148;
export const HANGEL_ORANGE: [number, number, number] = [0xf3, 0x47, 0x23];

// Gelir Modeli konferansı sertifikalarında organizatör (Social Business Global)
// logosunun yanında gösterilen partner kurum logoları — public/partners/ altında.
export const GELIR_MODELI_PARTNER_LOGOS = ['/partners/icisleri-stigm.png', '/partners/icisleri-muhur.png'];
/** Etkinlik adına göre partner logo listesi (gelir-modeli konferansları → İçişleri Bak. STİGM). */
export function partnerLogosForEventName(name?: string): string[] | undefined {
  return /gelir\s*modeli/i.test(name || '') ? GELIR_MODELI_PARTNER_LOGOS : undefined;
}

/**
 * Verilen URL'i fetch edip data URI (base64) olarak döner.
 * jsPDF.addImage data URI bekliyor.
 */
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

/**
 * QR kod data URI üretir — CLIENT-SIDE `qrcode` kütüphanesiyle (CORS'suz, offline).
 * Eskiden qrserver.com'a fetch atıyordu; external CORS/erişim hatası tüm PDF
 * üretimini patlatıp "sertifika oluşturulamadı" veriyordu. Artık ağ gerektirmez.
 */
async function generateQrDataUri(data: string, sizePx = 600): Promise<string | null> {
  try {
    const { default: QRCode } = await import('qrcode');
    return await QRCode.toDataURL(data, {
      margin: 0,
      width: sizePx,
      color: { dark: '#1f1f1f', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  } catch {
    return null;
  }
}

/**
 * Türkçe tarih formatı (1 Haziran 2026).
 */
function formatTrDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Rol-özel sertifika başlığı.
 * Konuşmacı/sanatçı/moderatör için "TEŞEKKÜR & KATKI", katılımcı için "KATILIM".
 */
function certTitleTr(role: EventUserRole): string {
  return role === 'participant' ? 'KATILIM SERTİFİKASI' : 'TEŞEKKÜR & KATKI SERTİFİKASI';
}

export type EventCertificateInput = {
  eventName: string;
  eventDate: string;
  userName: string;
  organizerName: string;
  role: EventUserRole;
  certificateId: string;
  verifyUrl?: string;
  code?: string;
  country?: string;
  city?: string;
  logoUrl?: string; // düzenleyen kurum logosu — sertifikanın SOL ÜST köşesinde gösterilir
  partnerLogoUrls?: string[]; // ek/partner kurum logoları (ör. gelir-modeli: İçişleri Bak. Sivil Toplumla İlişkiler GM) — organizatör logosunun yanında bir şeritte gösterilir
};

/**
 * Rol-farkında etkinlik sertifikası PDF üretir (yatay A5, tek sayfa).
 *
 * Başlık: rol-özel ("KATILIM" / "TEŞEKKÜR & KATKI" SERTİFİKASI) + rol rozeti.
 * Gövde: kullanıcı adı (büyük), etkinlik adı, roleCertificatePhraseTr cümlesi,
 *        düzenleyen kurum, tarih. Altta doğrulama QR (verifyUrl varsa).
 *
 * badge-generator.generateVolunteerBadgePDF ile tutarlı: Promise<Blob> döner.
 */
/**
 * XML/SVG güvenli kaçış. SVG <text> içinde &, <, >, ", ' kaçılmalı.
 * Kullanıcıdan gelen tüm metinler bu helper'dan geçer (CLAUDE.md güvenlik kuralı).
 */
const escXml = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

/**
 * SVG string'i iOS-GÜVENLİ şekilde JPEG data URI'ye çevirir.
 *
 * Why (iOS fix): html2canvas WKWebView'de foreignObject/CSS klonlama, bellek ve
 * toDataURL timeout bug'ları yüzünden "pdf oluşturulurken hata oluştu" veriyordu.
 * Native <img src="data:image/svg+xml,...">"" → ctx.drawImage → canvas.toDataURL
 * yolu iOS Safari/WKWebView'de çalışır (data-URI görseller canvas'ı taint ETMEZ).
 * SVG <foreignObject> KULLANMIYORUZ (iOS'u kıran element); sadece <text> + <image>.
 */
function rasterizeSvgToJpeg(svg: string, widthPx: number, heightPx: number, scale = 2): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    // crossOrigin gerekmez: tüm <image href> data: URI (taint yok).
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

export async function buildEventCertificateJpeg(input: EventCertificateInput): Promise<{ jpeg: string; code: string }> {
  const { eventName, eventDate, userName, organizerName, role, certificateId, verifyUrl } = input;

  // iOS FIX 2026-06-20: html2canvas WKWebView'de "pdf oluşturulurken hata oluştu"
  // veriyordu (foreignObject/CSS klonlama + toDataURL timeout bug'ları). Çözüm:
  // sertifikayı kendi içinde tam (self-contained) SVG string olarak kur (<text> +
  // data-URI <image>, foreignObject YOK), native Image ile canvas'a çiz, jsPDF'e göm.
  // Sistem font yığını → Türkçe ğ/ş/ı/İ/ç/ö/ü glyph'leri doğru render edilir.
  // Apple marka kimliği: temiz, bol boşluk, ince coral çerçeve, hangel paleti.
  const CORAL = '#f34723';
  const INK = '#1f1f1f';
  const code = input.code || buildCertCode({ country: input.country, kind: 'event', idSeed: certificateId });
  const verify = verifyUrl || certVerifyUrl(code);
  const verifyShort = verify.replace(/^https?:\/\//, '');
  const [qrUri, orgLogoUri, ...partnerLogoUris] = await Promise.all([
    generateQrDataUri(verify, 600),
    input.logoUrl ? urlToDataUri(input.logoUrl) : Promise.resolve(null),
    ...(input.partnerLogoUrls || []).slice(0, 3).map((u) => (u ? urlToDataUri(u) : Promise.resolve(null))),
  ]);
  const partners = partnerLogoUris.filter((u): u is string => Boolean(u));
  const hasPartners = partners.length > 0;
  const roleLabel = roleLabelTr(role);
  const phrase = `${eventName} etkinliğinde ${roleCertificatePhraseTr(role)}.`;

  // A5 yatay @96dpi ≈ 794 × 559 px
  const PX_W = 794;
  const PX_H = 559;
  const FONT = "-apple-system,'SF Pro Display',system-ui,'Helvetica Neue',Arial,sans-serif";

  // Uzun metinleri tek satıra sığacak şekilde kırp (SVG <text> sarmaz).
  const fit = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PX_W}" height="${PX_H}" viewBox="0 0 ${PX_W} ${PX_H}">
  <style>text{font-family:${FONT};}</style>
  <rect width="${PX_W}" height="${PX_H}" fill="#ffffff"/>
  <rect x="18" y="18" width="${PX_W - 36}" height="${PX_H - 36}" rx="20" fill="none" stroke="${CORAL}" stroke-width="1.5"/>
  <rect x="25" y="25" width="${PX_W - 50}" height="${PX_H - 50}" rx="15" fill="none" stroke="${CORAL}" stroke-opacity="0.2" stroke-width="1"/>

  ${orgLogoUri
      ? `<image x="60" y="40" width="48" height="48" href="${orgLogoUri}" xlink:href="${orgLogoUri}" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="60" y="72" font-size="18" font-weight="800" letter-spacing="-0.4" fill="${INK}">${escXml(fit(organizerName || '', 28))}</text>`}

  ${hasPartners
      ? (() => {
        // SAĞ ÜST KÖŞE: partner/otorite logoları (gelir-modeli → İçişleri Bak. STİGM + mühür).
        // Sağa hizalı bir sıra; üstünde küçük "İŞ BİRLİĞİ İLE" etiketi. Rol rozeti
        // çakışmayı önlemek için başlığın üstüne (ortaya) taşınır (aşağıda).
        const lw = 48, gap = 16, right = PX_W - 60;
        const total = partners.length * lw + (partners.length - 1) * gap;
        let x0 = right - total;
        const imgs = partners.map((u) => { const t = `<image x="${x0.toFixed(1)}" y="50" width="${lw}" height="48" href="${u}" xlink:href="${u}" preserveAspectRatio="xMidYMid meet"/>`; x0 += lw + gap; return t; }).join('');
        return `<text x="${right}" y="44" font-size="8" font-weight="700" letter-spacing="2" fill="#aeaeb2" text-anchor="end">İŞ BİRLİĞİ İLE</text>${imgs}`;
      })()
      : `<rect x="${PX_W - 60 - 150}" y="48" width="150" height="32" rx="16" fill="${CORAL}"/>
  <text x="${PX_W - 60 - 75}" y="69" font-size="12" font-weight="700" letter-spacing="0.7" fill="#ffffff" text-anchor="middle">${escXml(fit(roleLabel, 22))}</text>`}

  ${hasPartners
      ? `<rect x="${PX_W / 2 - 70}" y="120" width="140" height="30" rx="15" fill="${CORAL}"/>
  <text x="${PX_W / 2}" y="140" font-size="12" font-weight="700" letter-spacing="0.7" fill="#ffffff" text-anchor="middle">${escXml(fit(roleLabel, 22))}</text>`
      : ''}

  <text x="${PX_W / 2}" y="186" font-size="14" font-weight="800" letter-spacing="4" fill="${CORAL}" text-anchor="middle">${escXml(certTitleTr(role))}</text>
  <rect x="${PX_W / 2 - 25}" y="200" width="50" height="3" rx="1.5" fill="${CORAL}"/>

  <text x="${PX_W / 2}" y="240" font-size="13" font-weight="500" fill="#86868b" text-anchor="middle">Bu belge</text>
  <text x="${PX_W / 2}" y="290" font-size="44" font-weight="800" letter-spacing="-1.1" fill="${INK}" text-anchor="middle">${escXml(fit(userName || 'Katılımcı', 34))}</text>
  <text x="${PX_W / 2}" y="326" font-size="16" font-weight="500" fill="#515154" text-anchor="middle">${escXml(fit(phrase, 78))}</text>

  <text x="60" y="${PX_H - 76}" font-size="11" font-weight="700" letter-spacing="2" fill="#aeaeb2">TARİH</text>
  <text x="60" y="${PX_H - 56}" font-size="15" font-weight="500" fill="#515154">${escXml(formatTrDate(eventDate))}</text>

  ${qrUri ? `<image x="${PX_W - 54 - 40}" y="${PX_H - 54 - 44}" width="54" height="54" href="${qrUri}" xlink:href="${qrUri}"/>
  <text x="${PX_W - 40 - 27}" y="${PX_H - 30}" font-size="8" fill="#aeaeb2" text-anchor="middle">${escXml(fit(verifyShort, 32))}</text>` : ''}

  <text x="${PX_W / 2}" y="${PX_H - 28}" font-size="12" font-weight="700" fill="${CORAL}" text-anchor="middle">hangel.org</text>
  <text x="${PX_W / 2}" y="${PX_H - 13}" font-size="9" fill="#c7c7cc" text-anchor="middle">Sertifika Kodu: ${escXml(code)}</text>
</svg>`;

  const jpeg = await rasterizeSvgToJpeg(svg, PX_W, PX_H, 2);
  return { jpeg, code };
}

/** A5 tek-sayfa PDF blob (kullanıcı-tarafı tekil indirme — davranış değişmedi). */
export async function generateEventCertificate(input: EventCertificateInput): Promise<Blob> {
  const { jpeg } = await buildEventCertificateJpeg(input);
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: [CERT_WIDTH_MM, CERT_HEIGHT_MM], orientation: 'landscape', compress: true });
  pdf.addImage(jpeg, 'JPEG', 0, 0, CERT_WIDTH_MM, CERT_HEIGHT_MM);
  return pdf.output('blob');
}

/**
 * Sertifika PDF dosya adı üretici. Türkçe karakterleri sade ASCII'ye indirger.
 */
export function eventCertificateFileName(input: Pick<EventCertificateInput, 'eventName' | 'certificateId'>): string {
  const safe = input.eventName
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `hangel-sertifika-${safe || input.certificateId}.pdf`;
}
