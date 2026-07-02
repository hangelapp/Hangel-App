// hangel A6 gönüllülük yaka kartı PDF üretici.
// Why:
// - A6 (105x148mm) arkalı önlü tek dosya: yaka boyunda taşınabilir baskı.
// - jsPDF dinamik import (bundle hafifletme; node_modules'da hâlihazırda var).
// - QR ve logo dış kaynak (qrserver.com + /icon-512.png) — base64'e indirilip embed edilir.
// - Tüm metin Türkçe; hangel daima lowercase.
// - Renk: hangel turuncu (#FF6B35) — CSS var --primary ile aynı.

import type { Certificate, User, NGO } from '@/lib/types';

// A6 boyutları (mm)
export const BADGE_WIDTH_MM = 105;
export const BADGE_HEIGHT_MM = 148;
export const HANGEL_ORANGE: [number, number, number] = [0xff, 0x6b, 0x35];

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
 * QR kod data URI üretir. qrcode paketi yoksa qrserver.com fallback'i.
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

export type BadgeInput = {
  certificate: Certificate;
  user: Pick<User, 'id' | 'name'> & { name?: string };
  ngo: Pick<NGO, 'id' | 'name'> & { name: string };
};

/**
 * A6 arkalı önlü gönüllülük yaka kartı PDF üretir.
 *
 * Ön yüz: hangel logo, "gönüllülük sertifikası", kullanıcı adı, NGO adı, ilan başlığı, tarih.
 * Arka yüz: QR (hangel.org/certificate/[id]), kısa açıklama, hangel.org.
 */
export async function generateVolunteerBadgePDF(
  certificate: Certificate,
  user: BadgeInput['user'],
  ngo: BadgeInput['ngo'],
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    unit: 'mm',
    format: [BADGE_WIDTH_MM, BADGE_HEIGHT_MM],
    orientation: 'portrait',
    compress: true,
  });

  // --- Paralel olarak QR + logo'yu data URI'ye çevir ---
  const certUrl = `https://hangel.org/certificate/${certificate.id}`;
  const [logoUri, qrUri] = await Promise.all([
    typeof window !== 'undefined' ? urlToDataUri(HANGEL_LOGO_PATH) : Promise.resolve(null),
    generateQrDataUri(certUrl, 600),
  ]);

  const W = BADGE_WIDTH_MM;
  const H = BADGE_HEIGHT_MM;
  const [r, g, b] = HANGEL_ORANGE;

  // ============== ÖN YÜZ ==============
  // Dış turuncu border
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(1.2);
  pdf.rect(4, 4, W - 8, H - 8);
  pdf.setLineWidth(0.3);
  pdf.rect(6, 6, W - 12, H - 12);

  // Üst turuncu şerit (header bandı)
  pdf.setFillColor(r, g, b);
  pdf.rect(6, 6, W - 12, 22, 'F');

  // Logo (varsa) — şerit içinde
  if (logoUri) {
    try {
      pdf.addImage(logoUri, 'PNG', (W - 14) / 2, 9, 14, 14);
    } catch {
      // logo eklenemedi — sessizce devam
    }
  }

  // "hangel" yazı (logonun yanında değil, altında değil — şeridin altı)
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('hangel', W / 2, 32, { align: 'center' });

  // Başlık: "gönüllülük sertifikası"
  pdf.setFontSize(13);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GÖNÜLLÜLÜK SERTİFİKASI', W / 2, 45, { align: 'center' });

  // İnce ayraç
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.4);
  pdf.line(W / 2 - 15, 48, W / 2 + 15, 48);

  // "Bu belge ...'a verilmiştir." üst etiketi
  pdf.setFontSize(8);
  pdf.setTextColor(110, 110, 110);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Bu belge', W / 2, 56, { align: 'center' });

  // Kullanıcı adı (büyük, koyu)
  pdf.setFontSize(16);
  pdf.setTextColor(20, 20, 20);
  pdf.setFont('helvetica', 'bold');
  const displayName = user.name || 'Gönüllü';
  pdf.text(displayName, W / 2, 65, { align: 'center', maxWidth: W - 20 });

  // "adına düzenlenmiştir."
  pdf.setFontSize(8);
  pdf.setTextColor(110, 110, 110);
  pdf.setFont('helvetica', 'normal');
  pdf.text('adına düzenlenmiştir.', W / 2, 71, { align: 'center' });

  // İlan başlığı kutusu
  pdf.setFillColor(252, 244, 238);
  pdf.roundedRect(10, 78, W - 20, 22, 2, 2, 'F');

  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  pdf.setFont('helvetica', 'normal');
  pdf.text('İLAN / PROJE', W / 2, 84, { align: 'center' });

  pdf.setFontSize(10.5);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont('helvetica', 'bold');
  pdf.text(certificate.title, W / 2, 91, {
    align: 'center',
    maxWidth: W - 26,
  });

  // STK adı
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  pdf.setFont('helvetica', 'normal');
  pdf.text('KURUM', W / 2, 108, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(ngo.name, W / 2, 114, { align: 'center', maxWidth: W - 20 });

  // Tarih
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TARİH', W / 2, 125, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatTrDate(certificate.date), W / 2, 131, { align: 'center' });

  // Alt footer
  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.text('hangel.org', W / 2, H - 10, { align: 'center' });

  // ============== ARKA YÜZ ==============
  pdf.addPage([W, H], 'portrait');

  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(1.2);
  pdf.rect(4, 4, W - 8, H - 8);
  pdf.setLineWidth(0.3);
  pdf.rect(6, 6, W - 12, H - 12);

  // Üst etiket
  pdf.setFontSize(9);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SERTİFİKA DOĞRULAMA', W / 2, 16, { align: 'center' });

  // İnce ayraç
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.3);
  pdf.line(W / 2 - 18, 19, W / 2 + 18, 19);

  // QR kutusu
  const qrSize = 60;
  const qrX = (W - qrSize) / 2;
  const qrY = 26;

  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

  if (qrUri) {
    try {
      pdf.addImage(qrUri, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {
      // QR eklenemedi — placeholder
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text('QR yüklenemedi', W / 2, qrY + qrSize / 2, { align: 'center' });
    }
  }

  // QR altında URL
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Doğrulamak için tarayın', W / 2, qrY + qrSize + 6, {
    align: 'center',
  });

  pdf.setFontSize(7);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`hangel.org/certificate/${certificate.id}`, W / 2, qrY + qrSize + 11, {
    align: 'center',
    maxWidth: W - 14,
  });

  // Kısa açıklama kutusu
  const descY = qrY + qrSize + 18;
  pdf.setFillColor(252, 244, 238);
  pdf.roundedRect(10, descY, W - 20, 24, 2, 2, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'normal');
  const desc =
    'Bu kart, hangel platformu üzerinden tamamlanan gönüllülük çalışmasını belgeler. QR kodu okutarak doğrulayabilirsiniz.';
  pdf.text(desc, W / 2, descY + 6, {
    align: 'center',
    maxWidth: W - 26,
  });

  // Alt footer: hangel.org
  pdf.setFontSize(9);
  pdf.setTextColor(r, g, b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('hangel.org', W / 2, H - 12, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gönüllülüğün dijital pasaportu', W / 2, H - 7, { align: 'center' });

  // Blob olarak dön
  const blob = pdf.output('blob');
  return blob;
}

/**
 * PDF dosya adı üretici. Türkçe karakterleri sade ASCII'ye indirger.
 */
export function badgeFileName(certificate: Certificate): string {
  const safe = certificate.title
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `hangel-yaka-karti-${safe || certificate.id}.pdf`;
}

/**
 * Sertifika doğrulama URL'si (kanonik).
 */
export function certificateUrl(certificate: Certificate): string {
  return `https://hangel.org/certificate/${certificate.id}`;
}
