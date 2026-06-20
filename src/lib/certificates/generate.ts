/**
 * hangel — gönüllü tamamlama sertifikası HTML üretimi.
 *
 * Bilinçli olarak PDF lib (puppeteer/react-pdf) eklenmiyor — bundle ve cold
 * start maliyetini düşük tutmak için sertifikalar HTML olarak tutuluyor;
 * client browser'da yazdır → PDF veya share-sheet ile paylaşır.
 *
 * Saklama:
 *   - Firestore: `volunteerCompletions/{id}.certificateUrl` (varsa)
 *   - Storage (opsiyonel, gelecek faz): `/certificates/{uid}/{taskId}.html`
 *
 * Mevcut akışta `certificateUrl` boş bırakılır; istemci certificate sayfası
 * `volunteerCompletions/{id}` üzerinden bu fonksiyonu çağırıp render eder.
 */

export interface CertificateInput {
  completionId: string;
  userName: string;
  taskTitle: string;
  ngoName: string;
  professionLabel?: string;
  hoursLogged: number;
  impactValueTRY: number;
  completedAt: Date;
  approvedAt?: Date;
}

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmtTR = (n: number): string => n.toLocaleString('tr-TR');

const fmtDate = (d: Date): string =>
  d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Sertifika HTML'i — self-contained (inline CSS, network bağımsız).
 * "hangel" tüm UI metinlerinde lowercase tutulur (CLAUDE.md memory kuralı).
 */
export function generateCertificateHtml(input: CertificateInput): string {
  const {
    completionId,
    userName,
    taskTitle,
    ngoName,
    professionLabel,
    hoursLogged,
    impactValueTRY,
    completedAt,
    approvedAt,
  } = input;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>hangel sertifikası — ${escapeHtml(userName)}</title>
<style>
  /* Apple marka kimliği: sistem SF font yığını (Google Fonts importu YOK → çevrimdışı
     çalışır + Türkçe ğ/ş/ı/İ/ç/ö/ü tam destek). hangel coral paleti. */
  @page { size: A4 landscape; margin: 0; }
  body {
    margin: 0;
    font-family: -apple-system, 'SF Pro Display', system-ui, 'Helvetica Neue', Arial, sans-serif;
    background: #f1f1f1;
    -webkit-font-smoothing: antialiased;
  }
  .cert {
    width: 297mm; height: 210mm; box-sizing: border-box;
    padding: 28mm 24mm; background: #fff; position: relative;
    border: 1.5px solid #f34723; border-radius: 6mm; color: #1f1f1f;
  }
  .header { display: flex; justify-content: space-between; align-items: baseline; }
  .brand { font-size: 22pt; font-weight: 800; color: #f34723; letter-spacing: -0.5px; }
  .cert-id { font-size: 9pt; color: #86868b; }
  h1 { font-size: 30pt; margin: 44px 0 6px; text-align: center; font-weight: 800; letter-spacing: -0.5px; }
  .rule { width: 50px; height: 3px; background: #f34723; border-radius: 2px; margin: 10px auto 22px; }
  .subtitle { text-align: center; font-size: 12pt; color: #86868b; margin-bottom: 28px; }
  .name { text-align: center; font-size: 30pt; font-weight: 800; margin: 10px 0; color: #1f1f1f; letter-spacing: -0.5px; }
  .body-text { text-align: center; font-size: 13pt; line-height: 1.6; max-width: 220mm; margin: 16px auto; color: #515154; }
  .body-text strong { color: #1f1f1f; }
  .stats {
    display: flex; justify-content: center; gap: 36px;
    margin: 32px 0 24px;
  }
  .stat { text-align: center; }
  .stat-value { font-size: 22pt; font-weight: 800; color: #c5391b; }
  .stat-label { font-size: 10pt; color: #86868b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer {
    position: absolute; bottom: 18mm; left: 24mm; right: 24mm;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-size: 10pt; color: #86868b;
  }
  .stamp { text-align: right; }
  .stamp-org { font-weight: 700; color: #1f1f1f; font-size: 11pt; }
  @media print { body { background: #fff; } .cert { border: 1.5px solid #f34723; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="brand">hangel</div>
      <div class="cert-id">Sertifika No: ${escapeHtml(completionId)}</div>
    </div>
    <h1>Gönüllülük Sertifikası</h1>
    <div class="rule"></div>
    <div class="subtitle">Bu belge, aşağıda adı geçen gönüllünün katkısını teyit eder.</div>
    <div class="name">${escapeHtml(userName)}</div>
    <div class="body-text">
      <strong>${escapeHtml(ngoName)}</strong> için
      <strong>"${escapeHtml(taskTitle)}"</strong> görevini
      ${professionLabel ? `<em>${escapeHtml(professionLabel)}</em> kapsamında ` : ''}
      başarıyla tamamlamıştır.
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${fmtTR(hoursLogged)} saat</div>
        <div class="stat-label">Gönüllü emeği</div>
      </div>
      <div class="stat">
        <div class="stat-value">${fmtTR(impactValueTRY)} ₺</div>
        <div class="stat-label">Sosyal etki mali değeri</div>
      </div>
    </div>
    <div class="footer">
      <div>
        Tamamlanma: ${fmtDate(completedAt)}<br />
        ${approvedAt ? `Onay tarihi: ${fmtDate(approvedAt)}` : ''}
      </div>
      <div class="stamp">
        <div class="stamp-org">${escapeHtml(ngoName)}</div>
        <div>hangel platformu üzerinden onaylanmıştır</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
