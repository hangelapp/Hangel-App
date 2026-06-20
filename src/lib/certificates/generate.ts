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
<title>hangel gönüllülük sertifikası — ${escapeHtml(userName)}</title>
<style>
  /* Apple marka kimliği: sistem SF font yığını (Google Fonts importu YOK → çevrimdışı
     çalışır + Türkçe ğ/ş/ı/İ/ç/ö/ü tam destek).
     GÖNÜLLÜLÜK kimliği: etkinlik (Katılım) sertifikasından AYIRT EDİLEBİLİR olsun diye
     ana vurgu rengi DERİN YEŞİL (#0f7a5a — emek/sosyal etki), coral (#f34723) yalnızca
     hangel marka aksanı olarak küçük kalır. Sol dikey "emek şeridi" + el-kalp etki mührü
     + saat/mali etki vurgusu bu belgeyi etkinlik sertifikasından net ayırır. */
  @page { size: A4 landscape; margin: 0; }
  body {
    margin: 0;
    font-family: -apple-system, 'SF Pro Display', system-ui, 'Helvetica Neue', Arial, sans-serif;
    background: #eef2f0;
    -webkit-font-smoothing: antialiased;
  }
  .cert {
    width: 297mm; height: 210mm; box-sizing: border-box;
    padding: 24mm 24mm 24mm 34mm; background: #fff; position: relative; overflow: hidden;
    border: 1.5px solid #0f7a5a; border-radius: 6mm; color: #1f1f1f;
  }
  /* Sol dikey emek şeridi — etkinlik sertifikasında YOK, gönüllülüğe özgü kimlik. */
  .band {
    position: absolute; top: 0; left: 0; bottom: 0; width: 14mm;
    background: linear-gradient(160deg, #0f7a5a 0%, #0a5f46 100%);
  }
  .band-text {
    position: absolute; top: 50%; left: 7mm; transform: translate(-50%, -50%) rotate(-90deg);
    transform-origin: center; white-space: nowrap;
    font-size: 9pt; font-weight: 800; letter-spacing: 4px; color: #ffffff; opacity: 0.92;
  }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .brand-wrap { display: flex; align-items: center; gap: 8px; }
  .brand { font-size: 22pt; font-weight: 800; color: #f34723; letter-spacing: -0.5px; }
  .brand-tag { font-size: 8.5pt; font-weight: 700; color: #0f7a5a; letter-spacing: 1.5px; text-transform: uppercase; }
  .cert-id { font-size: 9pt; color: #86868b; }
  /* El-kalp etki mührü — gönüllü emeğinin sembolü (etkinlik sertifikasında yok). */
  .seal {
    position: absolute; top: 20mm; right: 24mm;
    width: 22mm; height: 22mm; border-radius: 50%;
    background: #eaf6f1; border: 1.5px solid #0f7a5a;
    display: flex; align-items: center; justify-content: center;
  }
  .seal svg { width: 13mm; height: 13mm; }
  h1 { font-size: 28pt; margin: 30px 0 6px; text-align: center; font-weight: 800; letter-spacing: -0.5px; color: #0a5f46; }
  .rule { width: 56px; height: 3px; background: #0f7a5a; border-radius: 2px; margin: 10px auto 20px; }
  .subtitle { text-align: center; font-size: 12pt; color: #86868b; margin-bottom: 22px; }
  .name { text-align: center; font-size: 30pt; font-weight: 800; margin: 8px 0; color: #1f1f1f; letter-spacing: -0.5px; }
  .body-text { text-align: center; font-size: 13pt; line-height: 1.6; max-width: 215mm; margin: 14px auto; color: #515154; }
  .body-text strong { color: #1f1f1f; }
  /* Saat + mali etki vurgusu — gönüllülüğün ölçülebilir değeri öne çıkar. */
  .stats {
    display: flex; justify-content: center; gap: 18px;
    margin: 26px 0 20px;
  }
  .stat {
    text-align: center; background: #f4faf7; border: 1px solid #d6ece3;
    border-radius: 14px; padding: 14px 26px; min-width: 54mm;
  }
  .stat-value { font-size: 23pt; font-weight: 800; color: #0a5f46; }
  .stat-label { font-size: 9.5pt; color: #2f7a63; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .footer {
    position: absolute; bottom: 16mm; left: 34mm; right: 24mm;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-size: 10pt; color: #86868b;
  }
  .stamp { text-align: right; }
  .stamp-org { font-weight: 700; color: #0a5f46; font-size: 11pt; }
  @media print { body { background: #fff; } .cert { border: 1.5px solid #0f7a5a; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="band"></div>
    <div class="band-text">GÖNÜLLÜLÜK · SOSYAL ETKİ</div>
    <div class="seal" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="#0f7a5a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11.5 6.2 11 5.7a2.6 2.6 0 0 0-3.7 3.7l4.2 4.2 4.2-4.2A2.6 2.6 0 0 0 12 5.7l-.5.5Z"/>
        <path d="M5 14.5v3.5a1.5 1.5 0 0 0 1.5 1.5h9a3 3 0 0 0 2.7-1.7l1.6-3.3a1.3 1.3 0 0 0-1.8-1.7l-3.2 1.7"/>
        <path d="M5 15.5 7.3 14a2 2 0 0 1 1-.3h2.9a1.2 1.2 0 0 1 0 2.4H9"/>
      </svg>
    </div>
    <div class="header">
      <div class="brand-wrap">
        <div class="brand">hangel</div>
        <div class="brand-tag">Gönüllülük</div>
      </div>
      <div class="cert-id">Sertifika No: ${escapeHtml(completionId)}</div>
    </div>
    <h1>Gönüllülük Sertifikası</h1>
    <div class="rule"></div>
    <div class="subtitle">Bu belge, aşağıda adı geçen gönüllünün topluma sunduğu emeği ve sosyal etkisini teyit eder.</div>
    <div class="name">${escapeHtml(userName)}</div>
    <div class="body-text">
      <strong>${escapeHtml(ngoName)}</strong> için
      <strong>"${escapeHtml(taskTitle)}"</strong> görevini
      ${professionLabel ? `<em>${escapeHtml(professionLabel)}</em> kapsamında ` : ''}
      gönüllü olarak başarıyla tamamlamıştır.
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
