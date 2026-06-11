/**
 * hangel markalı, yazdırılabilir ödeme (payout) makbuzu.
 *
 * Gerçek banka API'si yok; ödeme manuel. Bu makbuz `payouts` kaydından üretilir
 * ve süper-admin (donations) + STK (ngo-admin/donations) sayfalarında "Makbuz
 * Görüntüle" aksiyonuyla yeni sekmede açılır. PDF için ekstra paket yok — tarayıcı
 * print (Ctrl/Cmd+P → PDF olarak kaydet) yeterli.
 *
 * İçerik: STK adı, dönem, net tutar, içerdiği bağış sayısı, ödeme tarihi, referans.
 * Marka: #f34723, Poppins.
 */

export interface PayoutReceiptData {
  ngoName: string;
  period: string;
  amount: number;
  donationCount: number;
  paidAtMs: number | null;
  reference?: string;
  notes?: string;
  payoutId?: string;
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));

const fmtTRY = (n: number): string =>
  n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const fmtDate = (ms: number | null): string => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
};

/** Makbuzu yeni sekmede açar ve yazdırma diyaloğunu tetikler. */
export function printPayoutReceipt(data: PayoutReceiptData): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;

  const refRow = data.reference
    ? `<tr><td class="lbl">Referans</td><td class="val">${esc(data.reference)}</td></tr>`
    : '';
  const notesRow = data.notes
    ? `<tr><td class="lbl">Not</td><td class="val">${esc(data.notes)}</td></tr>`
    : '';
  const idRow = data.payoutId
    ? `<tr><td class="lbl">Makbuz No</td><td class="val mono">${esc(data.payoutId)}</td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hangel — Ödeme Makbuzu</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', system-ui, sans-serif; color: #1d1d1f; background: #f5f5f7; padding: 32px; }
  .sheet { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.08); }
  .head { background: #f34723; color: #fff; padding: 28px 32px; }
  .brand { font-size: 28px; font-weight: 900; letter-spacing: -.02em; }
  .sub { font-size: 13px; font-weight: 500; opacity: .92; margin-top: 4px; }
  .amount-box { padding: 28px 32px; border-bottom: 1px solid #eee; }
  .amount-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #86868b; }
  .amount-val { font-size: 40px; font-weight: 900; color: #f34723; letter-spacing: -.03em; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 14px 32px; font-size: 14px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .lbl { font-weight: 600; color: #86868b; width: 40%; }
  .val { font-weight: 700; text-align: right; }
  .mono { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 500; }
  .foot { padding: 20px 32px; font-size: 11px; color: #86868b; line-height: 1.6; }
  .actions { max-width: 640px; margin: 20px auto 0; text-align: center; }
  button { font-family: inherit; font-weight: 700; font-size: 14px; background: #f34723; color: #fff; border: none; border-radius: 999px; padding: 12px 28px; cursor: pointer; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">hangel</div>
      <div class="sub">Hak Ediş Ödeme Makbuzu</div>
    </div>
    <div class="amount-box">
      <div class="amount-lbl">Ödenen Net Tutar</div>
      <div class="amount-val">${esc(fmtTRY(data.amount))}</div>
    </div>
    <table>
      <tr><td class="lbl">STK</td><td class="val">${esc(data.ngoName)}</td></tr>
      <tr><td class="lbl">Dönem</td><td class="val">${esc(data.period)}</td></tr>
      <tr><td class="lbl">Bağış Sayısı</td><td class="val">${data.donationCount}</td></tr>
      <tr><td class="lbl">Ödeme Tarihi</td><td class="val">${esc(fmtDate(data.paidAtMs))}</td></tr>
      ${refRow}
      ${idRow}
      ${notesRow}
    </table>
    <div class="foot">
      Bu makbuz hangel hak ediş ödeme sistemi tarafından otomatik üretilmiştir.
      Ödeme manuel olarak gerçekleştirilmiştir; tutar yukarıda belirtilen dönemdeki
      net hak edişin toplamıdır.
    </div>
  </div>
  <div class="actions">
    <button onclick="window.print()">Yazdır / PDF</button>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
