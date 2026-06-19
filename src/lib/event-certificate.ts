// hangel rol-farkında ETKİNLİK katılım/katkı sertifikası PDF üretici.
// Why:
// - badge-generator.ts (A6 yaka kartı) ile AYNI stil/yapı: jsPDF dinamik import,
//   turuncu hangel teması, dış kaynaktan QR base64 embed, Türkçe metin, hangel lowercase.
// - Etkinlik sertifikası YATAY A5 tek sayfa: katılımcıya/konuşmacıya verilen resmi belge.
// - Rol-farkında: roleLabelTr (başlık rozeti) + roleCertificatePhraseTr (gövde cümlesi).
// - Renk: hangel turuncu (#f34723).

import { roleLabelTr, roleCertificatePhraseTr } from '@/lib/event-roles';
import type { EventUserRole } from '@/lib/event-roles';

// A5 yatay boyutları (mm) — sertifika klasik landscape.
export const CERT_WIDTH_MM = 210;
export const CERT_HEIGHT_MM = 148;
export const HANGEL_ORANGE: [number, number, number] = [0xf3, 0x47, 0x23];

const HANGEL_LOGO_PATH = '/icon-512.png';

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
 * QR kod data URI üretir. badge-generator ile aynı yaklaşım: qrserver.com.
 */
async function generateQrDataUri(data: string, sizePx = 600): Promise<string | null> {
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=${sizePx}x${sizePx}&data=${encodeURIComponent(
    data,
  )}&margin=0`;
  return urlToDataUri(qrApi);
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
export async function generateEventCertificate(input: EventCertificateInput): Promise<Blob> {
  const { eventName, eventDate, userName, organizerName, role, certificateId, verifyUrl } = input;

  // YENİDEN TASARIM 2026-06-19: jsPDF 'helvetica' Türkçe ğ/ş/ı/İ glyph'lerini
  // desteklemediği için yazılar okunmuyordu. Çözüm: sertifikayı HTML+CSS (tarayıcı
  // sistem fontu = Türkçe tam destek) olarak kurup html2canvas ile görsele çevir,
  // jsPDF'e tek görsel olarak göm. Apple marka kimliği: temiz, bol boşluk, coral vurgu.
  const CORAL = '#f34723';
  const certUrl = verifyUrl || `https://hangel.org.tr/certificate/${certificateId}`;
  const [logoUri, qrUri] = await Promise.all([
    typeof window !== 'undefined' ? urlToDataUri(HANGEL_LOGO_PATH) : Promise.resolve(null),
    generateQrDataUri(certUrl, 600),
  ]);
  const roleLabel = roleLabelTr(role);
  const phrase = `${eventName} etkinliğinde ${roleCertificatePhraseTr(role)}.`;
  const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

  // A5 yatay @96dpi ≈ 794 × 559 px
  const PX_W = 794, PX_H = 559;
  const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,system-ui,'Helvetica Neue',Arial,sans-serif";
  const html = `
    <div style="width:${PX_W}px;height:${PX_H}px;background:#fff;position:relative;font-family:${FONT};color:#1d1d1f;box-sizing:border-box;overflow:hidden;-webkit-font-smoothing:antialiased">
      <div style="position:absolute;inset:18px;border:1.5px solid ${CORAL};border-radius:20px"></div>
      <div style="position:absolute;inset:25px;border:1px solid ${CORAL}33;border-radius:15px"></div>
      <div style="position:absolute;top:46px;left:60px;right:60px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:11px">
          ${logoUri ? `<img src="${logoUri}" style="width:34px;height:34px;border-radius:9px" />` : ''}
          <span style="font-size:25px;font-weight:800;letter-spacing:-0.03em;color:${CORAL}">hangel</span>
        </div>
        <span style="background:${CORAL};color:#fff;font-size:12px;font-weight:700;letter-spacing:0.06em;padding:8px 17px;border-radius:999px;text-transform:uppercase">${esc(roleLabel)}</span>
      </div>
      <div style="position:absolute;top:0;left:60px;right:60px;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div style="font-size:14px;font-weight:800;letter-spacing:0.3em;color:${CORAL};text-transform:uppercase">${esc(certTitleTr(role))}</div>
        <div style="width:50px;height:3px;background:${CORAL};border-radius:2px;margin:15px 0 24px"></div>
        <div style="font-size:13px;color:#86868b;font-weight:500">Bu belge</div>
        <div style="font-size:44px;font-weight:800;letter-spacing:-0.025em;margin:5px 0 16px;line-height:1.04;max-width:660px">${esc(userName || 'Katılımcı')}</div>
        <div style="font-size:16px;color:#515154;font-weight:500;max-width:580px;line-height:1.55">${esc(phrase)}</div>
        <div style="margin-top:28px;font-size:11px;font-weight:700;letter-spacing:0.22em;color:#aeaeb2">DÜZENLEYEN</div>
        <div style="font-size:17px;font-weight:700;color:${CORAL};margin-top:5px;max-width:580px">${esc(organizerName || 'hangel')}</div>
      </div>
      <div style="position:absolute;bottom:48px;left:60px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#aeaeb2">TARİH</div>
        <div style="font-size:15px;color:#515154;font-weight:500;margin-top:4px">${esc(formatTrDate(eventDate))}</div>
      </div>
      ${qrUri ? `<div style="position:absolute;bottom:42px;right:60px;text-align:center">
        <img src="${qrUri}" style="width:76px;height:76px" />
        <div style="font-size:9px;color:#aeaeb2;margin-top:4px">Doğrulamak için tarayın</div>
      </div>` : ''}
      <div style="position:absolute;bottom:21px;left:0;right:0;text-align:center">
        <span style="font-size:12px;font-weight:700;color:${CORAL}">hangel.org.tr</span>
        <span style="font-size:10px;color:#c7c7cc;margin-left:9px">Sertifika No: ${esc(certificateId)}</span>
      </div>
    </div>`;

  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-99999px;top:0;width:${PX_W}px;height:${PX_H}px`;
  holder.innerHTML = html;
  document.body.appendChild(holder);
  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const canvas = await html2canvas(holder.firstElementChild as HTMLElement, {
      scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
    });
    const pdf = new jsPDF({ unit: 'mm', format: [CERT_WIDTH_MM, CERT_HEIGHT_MM], orientation: 'landscape', compress: true });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, CERT_WIDTH_MM, CERT_HEIGHT_MM);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(holder);
  }
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
