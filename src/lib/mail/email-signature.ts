/**
 * Kurumsal e-posta imzası — HTML (tablo + inline style, e-posta istemcisi-güvenli).
 * Gönderen kuruma göre doldurulur (hangel toplu outreach → hangel; STK Workspace
 * mail → STK profili). Tasarım: solda logo/wordmark, sağda ad+ünvan, altında
 * coral (#f34723) renkli adres/telefon ve tagline + web.
 */

const CORAL = '#f34723';

export interface EmailSignatureOpts {
  /** Kurum adı (alt metin / fallback). */
  orgName: string;
  /** Kişi adı — yoksa orgName kullanılır (ör. "İsmail Hilmi ADIGÜZEL"). */
  contactName?: string;
  /** Ünvan (ör. "Sosyal Girişimci, Ülke Lideri"). */
  title?: string;
  /** Logo görsel URL (STK logosu). Yoksa wordmark metni gösterilir. */
  logoUrl?: string;
  /** Metin logo (ör. "hangel") — logoUrl yoksa coral kalın yazı olarak basılır. */
  wordmark?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  /** Web sitesi (ör. "hangel.org"). */
  website?: string;
  /** Alt slogan (ör. "Ulusal Gönüllülük Portalı ve Bağış Odaklı Sosyal Etki Platformu"). */
  tagline?: string;
}

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Logo hücresi — görsel varsa <img>, yoksa coral wordmark, o da yoksa boş. */
function logoCell(o: EmailSignatureOpts): string {
  if (o.logoUrl) {
    return `<img src="${esc(o.logoUrl)}" alt="${esc(o.orgName)}" width="120" style="display:block;max-width:120px;height:auto;border:0;" />`;
  }
  if (o.wordmark) {
    return `<span style="color:${CORAL};font-weight:800;font-size:30px;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">${esc(o.wordmark)}</span>`;
  }
  return '';
}

/**
 * Kurumsal HTML imzası üretir. Çıktı, e-posta gövdesinin altına eklenmeye uygundur.
 */
export function buildEmailSignatureHtml(o: EmailSignatureOpts): string {
  const name = o.contactName?.trim() || o.orgName;
  const logo = logoCell(o);

  const phoneLine = [
    o.phone ? `Tel: ${esc(o.phone)}` : '',
    o.mobile ? `Mobil: ${esc(o.mobile)}` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const webLink = o.website
    ? `<a href="${esc(o.website.startsWith('http') ? o.website : 'https://' + o.website)}" style="color:${CORAL};text-decoration:none;font-weight:600;">${esc(o.website.replace(/^https?:\/\//, ''))}</a>`
    : '';
  const taglineLine = [o.tagline ? esc(o.tagline) : '', webLink].filter(Boolean).join(' ');

  return [
    `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-top:1px solid #eee;padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333333;">`,
    `<tr>`,
    logo ? `<td style="padding-right:18px;vertical-align:top;">${logo}</td>` : '',
    `<td style="vertical-align:top;">`,
    `<div style="font-weight:bold;font-size:16px;color:#1a1a1a;">${esc(name)}</div>`,
    o.title ? `<div style="color:#555555;font-size:14px;">${esc(o.title)}</div>` : '',
    (o.address || phoneLine) ? `<div style="height:10px;line-height:10px;">&nbsp;</div>` : '',
    o.address ? `<div style="color:${CORAL};">${esc(o.address)}</div>` : '',
    phoneLine ? `<div style="color:${CORAL};">${phoneLine}</div>` : '',
    taglineLine ? `<div style="height:10px;line-height:10px;">&nbsp;</div><div style="color:${CORAL};">${taglineLine}</div>` : '',
    `</td>`,
    `</tr>`,
    `</table>`,
  ].filter(Boolean).join('');
}

/** hangel platformunun kendi e-posta imzası (toplu outreach gönderimleri için). */
export const HANGEL_EMAIL_SIGNATURE: EmailSignatureOpts = {
  orgName: 'hangel',
  contactName: 'İsmail Hilmi ADIGÜZEL',
  title: 'Sosyal Girişimci, Ülke Lideri',
  wordmark: 'hangel',
  address: 'Beybi Giz Plaza Kat:7/26 Maslak, Sarıyer, İstanbul 34980',
  phone: '+90 216 708 0216',
  mobile: '+90 538 400 90 90',
  website: 'hangel.org',
  tagline: 'Ulusal Gönüllülük Portalı ve Bağış Odaklı Sosyal Etki Platformu',
};
