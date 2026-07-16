/**
 * Hazır e-posta şablonları (mail sihirbazında "Şablondan başla" ile seçilir).
 *
 * Gelir Modeli Konferansı daveti — il il gönderim için tasarlandı: `{sehir}`
 * değişkeni alıcının şehriyle dolar (STK yöneticisi kitlesinde `{stk_sehir}`
 * da kullanılabilir). Mail istemcileriyle (Gmail/Outlook) uyumlu olması için
 * TAM inline-stil + tablo tabanlı düzen; harici CSS/font YOK.
 *
 * 3 logo: hangel logosu gömülü gelir; diğer 2 yuva super-admin tarafından
 * editörde değiştirilir (görsel butonu ile) — kurum/partner logoları eklenir.
 * Placeholder metinleri "[Ortak Kurum Logosu]" olarak bırakıldı.
 */

export interface MailTemplateDef {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const HANGEL_LOGO = 'https://hangel.org/brand/hangel-wordmark.png';

// Konferans davet gövdesi. `{sehir}` alıcının iline göre değişir.
function incomeModelInviteBody(): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f">
  <tr>
    <td style="padding:24px 8px;text-align:center;border-bottom:1px solid #e5e5ea">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
        <td style="padding:0 14px;vertical-align:middle"><img src="${HANGEL_LOGO}" alt="hangel" width="120" style="display:block" /></td>
        <td style="padding:0 14px;vertical-align:middle;color:#c7c7cc;font-size:20px">·</td>
        <td style="padding:0 14px;vertical-align:middle;color:#86868b;font-size:12px">[Ortak Kurum Logosu]</td>
        <td style="padding:0 14px;vertical-align:middle;color:#c7c7cc;font-size:20px">·</td>
        <td style="padding:0 14px;vertical-align:middle;color:#86868b;font-size:12px">[Ortak Kurum Logosu]</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 24px 8px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#f34723">Gelir Modeli Konferansı</p>
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;color:#1d1d1f">{sehir}'de STK'lar için sürdürülebilir gelir buluşması</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3a3a3c">Sayın yetkili,</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3a3a3c">
        Sivil toplum kuruluşlarının bağış bağımlılığından çıkıp <strong>kendi düzenli gelirini</strong>
        oluşturmasını konuşacağımız <strong>Gelir Modeli Konferansı</strong>'na sizi <strong>{sehir}</strong>'de
        aramızda görmekten mutluluk duyarız.
      </p>
      <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#3a3a3c">Konu başlıkları:</p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:16px;line-height:1.7;color:#3a3a3c">
        <li>STK'lar için komisyon & sponsorluk temelli sürdürülebilir gelir</li>
        <li>Markalarla iş birliği ve dijital bağış altyapısı</li>
        <li>hangel platformu ile adım/etki hedefli kampanyalar</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 28px">
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f5f5f7;border-radius:16px">
        <tr><td style="padding:20px 24px">
          <p style="margin:0 0 4px;font-size:13px;color:#86868b">Tarih & Yer</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1d1d1f">[Tarih] · [Mekan], {sehir}</p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 36px;text-align:center">
      <a href="https://hangel.org/gelir-modeli-konferanslari" style="display:inline-block;background:#f34723;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 32px;border-radius:980px">Yerini ayır</a>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 24px;border-top:1px solid #e5e5ea;text-align:center">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#86868b">
        Bu davet <strong style="color:#f34723">hangel</strong> tarafından gönderilmiştir · <a href="https://hangel.org" style="color:#86868b">hangel.org</a>
      </p>
    </td>
  </tr>
</table>`.trim();
}

export const MAIL_TEMPLATES: MailTemplateDef[] = [
  {
    id: 'income-model-invite',
    name: 'Gelir Modeli Konferansı Daveti (il il)',
    subject: "{sehir}'de STK Gelir Modeli Konferansı — davetlisiniz",
    body: incomeModelInviteBody(),
  },
];
