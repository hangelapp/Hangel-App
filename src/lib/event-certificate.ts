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

const HANGEL_LOGO_PATH = '/icon-512.png';

// ── Gelir Modeli konferansları özel sertifikası ──────────────────────────────
// Bu konferanslar Social Business Global (Uluslararası Sosyal Fayda Derneği)
// tarafından, T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler GM desteğiyle
// düzenleniyor → sertifika sol-üstte 3 kurum logosu + iki teşekkür paragrafı
// taşır (hangel logosu / DÜZENLEYEN bloğu YOK). Etkinlik adı "gelir modeli"
// içerince otomatik bu düzene geçilir (çağıranlar değişmez).
const GM_LOGO_SBG = '/partners/social-business-global.png';
const GM_LOGO_MUHUR = '/partners/icisleri-muhur.png';
const GM_LOGO_STIGM = '/partners/icisleri-stigm.png';
const GM_PROJECT = 'Sivil Toplum Kuruluşlarında Gelir Modeli Oluşturma ve Sürdürülebilirlik Eğitim Konferansları';
const isGelirModeli = (name?: string): boolean => /gelir\s*modeli/i.test(name || '');

/** Türkçe datif (yönelme) eki: "Ali HAYIRDOĞAN" → "Ali HAYIRDOĞAN'a". Basit ünlü
 *  uyumu (a/e) + ünlüyle bitişte 'y' kaynaştırma. Özel ad → kesme işaretiyle. */
function turkishDative(name: string): string {
  const s = (name || '').trim();
  if (!s) return s;
  const lower = s.toLocaleLowerCase('tr');
  const vowels = 'aeıioöuü';
  let last = '';
  for (let i = lower.length - 1; i >= 0; i--) { if (vowels.includes(lower[i])) { last = lower[i]; break; } }
  const back = 'aıou'.includes(last); // kalın ünlü → 'a', ince → 'e'
  const suffix = back ? 'a' : 'e';
  const endsVowel = vowels.includes(lower[lower.length - 1]);
  return `${s}'${endsVowel ? 'y' : ''}${suffix}`;
}

/** Düz metni ~maxChars genişlikte satırlara böler (SVG <text> sarmadığı için). */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Kalın/normal karışık metni sararak satır başına {text,bold} run dizisi üretir. */
function wrapRich(segments: { text: string; bold?: boolean }[], maxChars: number): { text: string; bold: boolean }[][] {
  type Tok = { text: string; bold: boolean; space: boolean };
  const toks: Tok[] = [];
  for (const seg of segments) {
    for (const p of seg.text.split(/(\s+)/)) {
      if (p === '') continue;
      toks.push({ text: p, bold: !!seg.bold, space: /^\s+$/.test(p) });
    }
  }
  const lines: Tok[][] = [];
  let cur: Tok[] = []; let len = 0;
  for (const t of toks) {
    if (t.space) { if (cur.length) { cur.push(t); len += t.text.length; } continue; }
    if (len + t.text.length > maxChars && cur.length) {
      while (cur.length && cur[cur.length - 1].space) len -= (cur.pop() as Tok).text.length;
      lines.push(cur); cur = []; len = 0;
    }
    cur.push(t); len += t.text.length;
  }
  if (cur.length) { while (cur.length && cur[cur.length - 1].space) cur.pop(); lines.push(cur); }
  // aynı ağırlıktaki ardışık token'ları birleştir
  return lines.map((line) => {
    const runs: { text: string; bold: boolean }[] = [];
    for (const t of line) {
      const last = runs[runs.length - 1];
      if (last && last.bold === t.bold) last.text += t.text;
      else runs.push({ text: t.text, bold: t.bold });
    }
    return runs;
  });
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
  logoUrl?: string; // düzenleyen kurum logosu (sertifikada gösterilir)
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
  const CORAL_DARK = '#c5391b';
  const INK = '#1f1f1f';
  const code = input.code || buildCertCode({ country: input.country, kind: 'event', idSeed: certificateId });
  const verify = verifyUrl || certVerifyUrl(code);
  const verifyShort = verify.replace(/^https?:\/\//, '');
  const gm = isGelirModeli(eventName);
  const [logoUri, qrUri, orgLogoUri, sbgUri, muhurUri, stigmUri] = await Promise.all([
    gm ? Promise.resolve(null) : (typeof window !== 'undefined' ? urlToDataUri(HANGEL_LOGO_PATH) : Promise.resolve(null)),
    generateQrDataUri(verify, 600),
    input.logoUrl ? urlToDataUri(input.logoUrl) : Promise.resolve(null),
    gm ? urlToDataUri(GM_LOGO_SBG) : Promise.resolve(null),
    gm ? urlToDataUri(GM_LOGO_MUHUR) : Promise.resolve(null),
    gm ? urlToDataUri(GM_LOGO_STIGM) : Promise.resolve(null),
  ]);
  const roleLabel = roleLabelTr(role);
  const phrase = `${eventName} etkinliğinde ${roleCertificatePhraseTr(role)}.`;

  // A5 yatay @96dpi ≈ 794 × 559 px
  const PX_W = 794;
  const PX_H = 559;
  const FONT = "-apple-system,'SF Pro Display',system-ui,'Helvetica Neue',Arial,sans-serif";

  // Uzun metinleri tek satıra sığacak şekilde kırp (SVG <text> sarmaz).
  const fit = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

  // ── Ortak parçalar (her iki tasarımda da) ──
  const frame = `<rect width="${PX_W}" height="${PX_H}" fill="#ffffff"/>
  <rect x="18" y="18" width="${PX_W - 36}" height="${PX_H - 36}" rx="20" fill="none" stroke="${CORAL}" stroke-width="1.5"/>
  <rect x="25" y="25" width="${PX_W - 50}" height="${PX_H - 50}" rx="15" fill="none" stroke="${CORAL}" stroke-opacity="0.2" stroke-width="1"/>`;

  const rolePill = `<rect x="${PX_W - 60 - 150}" y="46" width="150" height="33" rx="16" fill="${CORAL}"/>
  <text x="${PX_W - 60 - 75}" y="68" font-size="12" font-weight="700" letter-spacing="0.7" fill="#ffffff" text-anchor="middle">${escXml(fit(roleLabel, 22))}</text>`;

  // Etkinlik saati (eventDate ISO'da saat taşıyorsa) — mockup'ta tarih altında gösterilir.
  const timeStr = /T\d{2}:\d{2}/.test(eventDate)
    ? (() => { try { return new Date(eventDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } })()
    : '';
  const footer = `<text x="60" y="${PX_H - (timeStr ? 92 : 76)}" font-size="11" font-weight="700" letter-spacing="2" fill="#aeaeb2">TARİH</text>
  <text x="60" y="${PX_H - (timeStr ? 72 : 56)}" font-size="15" font-weight="600" fill="#515154">${escXml(formatTrDate(eventDate))}</text>
  ${timeStr ? `<text x="60" y="${PX_H - 52}" font-size="15" font-weight="600" fill="#515154">${escXml(timeStr)}</text>` : ''}
  ${qrUri ? `<image x="${PX_W - 54 - 40}" y="${PX_H - 54 - 44}" width="54" height="54" href="${qrUri}" xlink:href="${qrUri}"/>
  <text x="${PX_W - 40 - 27}" y="${PX_H - 30}" font-size="8" fill="#aeaeb2" text-anchor="middle">${escXml(fit(verifyShort, 32))}</text>` : ''}
  <text x="${PX_W / 2}" y="${PX_H - 28}" font-size="12" font-weight="700" fill="${CORAL}" text-anchor="middle">hangel.org</text>
  <text x="${PX_W / 2}" y="${PX_H - 13}" font-size="9" fill="#c7c7cc" text-anchor="middle">Sertifika Kodu: ${escXml(code)}</text>`;

  // ── Gelir Modeli tasarımı: 3 logo + iki teşekkür paragrafı (DÜZENLEYEN yok) ──
  const renderPlain = (lines: string[], y0: number, lh: number, attrs: string) =>
    lines.map((ln, i) => `<text x="${PX_W / 2}" y="${y0 + i * lh}" ${attrs} text-anchor="middle">${escXml(ln)}</text>`).join('\n  ');
  const renderRich = (lines: { text: string; bold: boolean }[][], y0: number, lh: number, attrs: string) =>
    lines.map((runs, i) => `<text x="${PX_W / 2}" y="${y0 + i * lh}" ${attrs} text-anchor="middle">${runs.map((r) => `<tspan font-weight="${r.bold ? 700 : 400}">${escXml(r.text)}</tspan>`).join('')}</text>`).join('\n  ');

  const nameDative = turkishDative(userName || 'Katılımcı');
  const gmPhrase = `"${GM_PROJECT}"na katılımı nedeniyle kendisine takdim edilmiştir.`;
  const gmSeg1 = [
    { text: 'Uluslararası Sosyal Fayda Derneği tarafından yürütülen ve İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü tarafından desteklenen ' },
    { text: `"${GM_PROJECT}"`, bold: true },
    { text: ' projesine katılımınıza teşekkür eder.' },
  ];
  const gmPara2 = 'Sivil toplum kuruluşlarının kurumsal kapasitesinin güçlendirilmesine ve sürdürülebilir gelir modellerinin geliştirilmesine sunduğunuz katkı ve ilginiz için teşekkür eder, çalışmalarınızda başarılar dileriz.';
  const gmPhraseLines = wrapText(gmPhrase, 82);
  const gmP1Lines = wrapRich(gmSeg1, 98);
  const gmP2Lines = wrapText(gmPara2, 100);
  const gmPhraseY = 266;
  const gmP1Y = gmPhraseY + gmPhraseLines.length * 18 + 16;
  const gmP2Y = gmP1Y + gmP1Lines.length * 17 + 12;

  const gmBody = `${sbgUri ? `<image x="60" y="48" width="90" height="42" href="${sbgUri}" xlink:href="${sbgUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${muhurUri ? `<image x="158" y="46" width="46" height="46" href="${muhurUri}" xlink:href="${muhurUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${stigmUri ? `<image x="214" y="46" width="46" height="46" href="${stigmUri}" xlink:href="${stigmUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${rolePill}
  <text x="${PX_W / 2}" y="146" font-size="15" font-weight="800" letter-spacing="4.5" fill="${CORAL}" text-anchor="middle">${escXml(certTitleTr(role))}</text>
  <rect x="${PX_W / 2 - 26}" y="160" width="52" height="3" rx="1.5" fill="${CORAL}"/>
  <text x="${PX_W / 2}" y="190" font-size="13" font-weight="600" fill="#86868b" text-anchor="middle">Bu belge</text>
  <text x="${PX_W / 2}" y="232" font-size="40" font-weight="800" letter-spacing="-1" fill="${INK}" text-anchor="middle">${escXml(fit(nameDative, 34))}</text>
  ${renderPlain(gmPhraseLines, gmPhraseY, 18, 'font-size="12.5" font-weight="600" fill="#515154"')}
  ${renderRich(gmP1Lines, gmP1Y, 17, 'font-size="11.5" fill="#6e6e73"')}
  ${renderPlain(gmP2Lines, gmP2Y, 17, 'font-size="11.5" fill="#6e6e73"')}`;

  // ── Klasik tasarım (diğer tüm etkinlikler) ──
  const classicBody = `${logoUri ? `<image x="60" y="46" width="34" height="34" href="${logoUri}" xlink:href="${logoUri}"/>` : ''}
  <text x="${logoUri ? 105 : 60}" y="71" font-size="25" font-weight="800" letter-spacing="-0.7" fill="${CORAL}">hangel</text>
  ${rolePill}
  <text x="${PX_W / 2}" y="186" font-size="14" font-weight="800" letter-spacing="4" fill="${CORAL}" text-anchor="middle">${escXml(certTitleTr(role))}</text>
  <rect x="${PX_W / 2 - 25}" y="200" width="50" height="3" rx="1.5" fill="${CORAL}"/>
  <text x="${PX_W / 2}" y="240" font-size="13" font-weight="500" fill="#86868b" text-anchor="middle">Bu belge</text>
  <text x="${PX_W / 2}" y="290" font-size="44" font-weight="800" letter-spacing="-1.1" fill="${INK}" text-anchor="middle">${escXml(fit(userName || 'Katılımcı', 34))}</text>
  <text x="${PX_W / 2}" y="326" font-size="16" font-weight="500" fill="#515154" text-anchor="middle">${escXml(fit(phrase, 78))}</text>
  ${orgLogoUri ? `<image x="${PX_W / 2 - 18}" y="350" width="36" height="36" href="${orgLogoUri}" xlink:href="${orgLogoUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  <text x="${PX_W / 2}" y="410" font-size="11" font-weight="700" letter-spacing="2.4" fill="#aeaeb2" text-anchor="middle">DÜZENLEYEN</text>
  <text x="${PX_W / 2}" y="432" font-size="17" font-weight="700" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(organizerName || 'hangel', 50))}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PX_W}" height="${PX_H}" viewBox="0 0 ${PX_W} ${PX_H}">
  <style>text{font-family:${FONT};}</style>
  ${frame}
  ${gm ? gmBody : classicBody}
  ${footer}
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
