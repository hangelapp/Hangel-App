/**
 * htmlToPlainText — HTML e-posta gövdesinden okunur düz metin (text/plain) türetir.
 *
 * Neden: HTML-only e-postalar Gmail'de çoğunlukla "Tanıtımlar/Güncellemeler"
 * sekmesine düşer. Yanında düz metin (multipart/alternative) versiyonu olan
 * e-postalar daha "kişisel/birincil" değerlendirilir ve teslim/erişilebilirlik
 * (screen reader, metin-tercihli istemci) artar. Bağımlılıksız, hafif.
 */

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  let s = html;

  // <style>/<script>/<head> bloklarını tamamen at.
  s = s.replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '');

  // Linkleri "metin (url)" biçimine indir — çıplak URL kaybolmasın.
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
    const label = inner.replace(/<[^>]+>/g, '').trim();
    const url = String(href).trim();
    if (!label) return url;
    if (label === url) return url;
    return `${label} (${url})`;
  });

  // Blok/satır öğelerini satır sonuna çevir.
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|header|footer|blockquote)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<li\b[^>]*>/gi, '• ');

  // Kalan tüm etiketleri kaldır.
  s = s.replace(/<[^>]+>/g, '');

  // HTML entity'lerini çöz (yaygın olanlar).
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…');

  // Boşlukları toparla: satır içi çoklu boşluk → tek; 3+ satır sonu → 2.
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return s;
}
