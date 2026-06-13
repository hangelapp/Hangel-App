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

  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    unit: 'mm',
    format: [CERT_WIDTH_MM, CERT_HEIGHT_MM],
    orientation: 'landscape',
    compress: true,
  });

  const W = CERT_WIDTH_MM;
  const H = CERT_HEIGHT_MM;
  const [r, g, b] = HANGEL_ORANGE;

  // Doğrulama URL'si — verifyUrl verilmezse kanonik certificate yolu.
  const certUrl = verifyUrl || `https://hangel.org.tr/certificate/${certificateId}`;

  // --- Paralel: logo + QR (verifyUrl varsa) data URI'ye çevir ---
  const [logoUri, qrUri] = await Promise.all([
    typeof window !== 'undefined' ? urlToDataUri(HANGEL_LOGO_PATH) : Promise.resolve(null),
    verifyUrl !== undefined || certificateId ? generateQrDataUri(certUrl, 600) : Promise.resolve(null),
  ]);

  // ============== ÇERÇEVE ==============
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(1.4);
  pdf.rect(6, 6, W - 12, H - 12);
  pdf.setLineWidth(0.3);
  pdf.rect(8.5, 8.5, W - 17, H - 17);

  // ============== ÜST: logo + hangel + rol rozeti ==============
  // Logo (sol üst, çerçeve içi)
  if (logoUri) {
    try {
      pdf.addImage(logoUri, 'PNG', 14, 13, 12, 12);
    } catch {
      // logo eklenemedi — sessizce devam
    }
  }

  // "hangel" yazısı (logonun yanında)
  pdf.setFontSize(13);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('hangel', logoUri ? 28 : 14, 21);

  // Rol rozeti (sağ üst) — turuncu pill
  const roleLabel = roleLabelTr(role);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const badgeTextW = pdf.getTextWidth(roleLabel);
  const badgePadX = 4;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeH = 8;
  const badgeX = W - 14 - badgeW;
  const badgeY = 13;
  pdf.setFillColor(r, g, b);
  pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.text(roleLabel, badgeX + badgeW / 2, badgeY + 5.6, { align: 'center' });

  // ============== BAŞLIK ==============
  pdf.setFontSize(24);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(certTitleTr(role), W / 2, 46, { align: 'center' });

  // İnce ayraç
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.5);
  pdf.line(W / 2 - 26, 51, W / 2 + 26, 51);

  // "Bu belge" üst etiketi
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Bu belge', W / 2, 62, { align: 'center' });

  // Kullanıcı adı (büyük, koyu)
  pdf.setFontSize(22);
  pdf.setTextColor(20, 20, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(userName || 'Katılımcı', W / 2, 73, { align: 'center', maxWidth: W - 40 });

  // Rol-özel katkı cümlesi: "... <etkinlik> etkinliğinde <rol cümlesi>."
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  const phrase = `${eventName} etkinliğinde ${roleCertificatePhraseTr(role)}.`;
  pdf.text(phrase, W / 2, 84, { align: 'center', maxWidth: W - 50 });

  // Düzenleyen kurum
  pdf.setFontSize(8.5);
  pdf.setTextColor(140, 140, 140);
  pdf.setFont('helvetica', 'normal');
  pdf.text('DÜZENLEYEN', W / 2, 100, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(organizerName || 'hangel', W / 2, 107, { align: 'center', maxWidth: W - 50 });

  // ============== ALT: tarih (sol) + QR (sağ) + footer ==============
  // Tarih (sol alt)
  pdf.setFontSize(8.5);
  pdf.setTextColor(140, 140, 140);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TARİH', 20, H - 30);

  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatTrDate(eventDate), 20, H - 23);

  // QR (sağ alt) — verifyUrl/cert varsa
  const qrSize = 24;
  const qrX = W - 20 - qrSize;
  const qrY = H - 20 - qrSize;
  if (qrUri) {
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.rect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3);
    try {
      pdf.addImage(qrUri, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {
      // QR eklenemedi — sessizce devam
    }
    pdf.setFontSize(6.5);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Doğrulamak için tarayın', qrX + qrSize / 2, qrY + qrSize + 4, {
      align: 'center',
    });
  }

  // Footer: hangel.org.tr + sertifika no
  pdf.setFontSize(8);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('hangel.org.tr', W / 2, H - 14, { align: 'center' });

  pdf.setFontSize(6.5);
  pdf.setTextColor(160, 160, 160);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Sertifika No: ${certificateId}`, W / 2, H - 9.5, { align: 'center' });

  // Blob olarak dön (badge-generator ile tutarlı)
  const blob = pdf.output('blob');
  return blob;
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
