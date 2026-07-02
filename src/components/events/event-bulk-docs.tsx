'use client';

/**
 * Etkinlik toplu belgeleri — YAKA KARTLARI ve SERTİFİKALAR.
 *
 * Butona basınca (popover/dialog DEĞİL) katılımcılar çekilir ve yeni bir pencerede
 * yazdırılabilir, Apple-temiz bir ızgara açılır; üstte Yazdır / PDF İndir / Paylaş
 * araç çubuğu (yazdırmada gizlenir). "PDF İndir" = tarayıcının Yazdır→PDF'e Kaydet
 * akışı; "Paylaş" = Web Share (destekleyen cihazda), yoksa bağlantı kopyalanır.
 *
 * Katılımcılar: GET /api/events/{id}/attendees (RSVP "going") — organizatör yetkisi.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IdCard, Award, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type Attendee = { name?: string; email?: string };
type EventInfo = { name?: string; date?: string; location?: string };

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fetchAttendees(eventId: string, token: string): Promise<{ event: EventInfo; attendees: Attendee[] }> {
  const res = await fetch(`/api/events/${eventId}/attendees`, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json().catch(() => null)) as { event?: EventInfo; attendees?: Attendee[]; message?: string } | null;
  if (!res.ok || !data) throw new Error(data?.message || 'Katılımcılar alınamadı.');
  return { event: data.event || {}, attendees: Array.isArray(data.attendees) ? data.attendees : [] };
}

// Ortak yazdırma penceresi (toolbar + ızgara). bodyHtml = kartlar/sertifikalar.
function openPrintWindow(title: string, styles: string, bodyHtml: string, shareText: string) {
  const w = window.open('', '_blank');
  if (!w) return false;
  const shareJs = `
    async function doShare(){
      try{ if(navigator.share){ await navigator.share({title:${JSON.stringify(title)}, text:${JSON.stringify(shareText)}}); return; } }catch(e){}
      try{ await navigator.clipboard.writeText(${JSON.stringify(shareText)}); alert('Bilgi panoya kopyalandı.'); }catch(e){ alert('Paylaşım desteklenmiyor.'); }
    }`;
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
  <style>
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Inter,system-ui,sans-serif;background:#f2f2f7;color:#1c1c1e}
    .toolbar{position:sticky;top:0;z-index:10;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:14px;background:rgba(255,255,255,.8);backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid rgba(0,0,0,.08)}
    .toolbar button{font:600 15px/1 -apple-system,system-ui,sans-serif;border:none;border-radius:980px;padding:11px 20px;cursor:pointer;transition:.15s}
    .btn-primary{background:#ff5722;color:#fff}.btn-primary:hover{background:#f4511e}
    .btn-secondary{background:rgba(120,120,128,.12);color:#1c1c1e}.btn-secondary:hover{background:rgba(120,120,128,.2)}
    .hint{width:100%;text-align:center;font:400 12px/1.4 system-ui;color:#8e8e93;margin-top:2px}
    .sheet{padding:24px;display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
    @media print{ .toolbar,.hint{display:none!important} body{background:#fff} .sheet{padding:0;gap:0} }
    ${styles}
  </style></head><body>
  <div class="toolbar">
    <button class="btn-primary" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-secondary" onclick="window.print()">⬇︎ PDF İndir</button>
    <button class="btn-secondary" onclick="doShare()">↗︎ Paylaş</button>
    <div class="hint">PDF için: Yazdır → Hedef "PDF olarak kaydet". Yaka kartlarını kesme çizgilerinden kesebilirsiniz.</div>
  </div>
  <div class="sheet">${bodyHtml}</div>
  <script>${shareJs}</script>
  </body></html>`);
  w.document.close();
  return true;
}

function badgeCardHtml(a: Attendee, ev: EventInfo, ngoName: string, logoUrl?: string) {
  const logo = logoUrl ? `<img class="b-logo" src="${esc(logoUrl)}" alt="">` : `<div class="b-logo b-logo-ph">${esc((ngoName || 'H').charAt(0))}</div>`;
  return `<div class="badge">
    <div class="b-top">${logo}<span class="b-ngo">${esc(ngoName)}</span></div>
    <div class="b-mid">
      <div class="b-name">${esc(a.name || 'Katılımcı')}</div>
      <div class="b-role">KATILIMCI</div>
    </div>
    <div class="b-bot">
      <div class="b-ev">${esc(ev.name || '')}</div>
      <div class="b-meta">${esc([ev.date, ev.location].filter(Boolean).join(' · '))}</div>
    </div>
  </div>`;
}
const BADGE_STYLES = `
  .badge{width:242px;height:384px;background:#fff;border-radius:22px;border:1px solid #e5e5ea;box-shadow:0 8px 24px rgba(0,0,0,.06);display:flex;flex-direction:column;overflow:hidden;page-break-inside:avoid}
  .b-top{display:flex;align-items:center;gap:8px;padding:16px 18px;background:linear-gradient(135deg,#ff7043,#ff5722);color:#fff}
  .b-logo{width:34px;height:34px;border-radius:9px;object-fit:contain;background:#fff;padding:3px}
  .b-logo-ph{display:flex;align-items:center;justify-content:center;font:800 18px system-ui;color:#ff5722}
  .b-ngo{font:700 13px/1.2 system-ui;flex:1;min-width:0}
  .b-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center;gap:8px}
  .b-name{font:800 24px/1.15 -apple-system,system-ui;letter-spacing:-.02em}
  .b-role{font:700 11px/1 system-ui;letter-spacing:.18em;color:#8e8e93;background:rgba(120,120,128,.12);padding:6px 12px;border-radius:980px}
  .b-bot{padding:16px 18px;border-top:1px dashed #e5e5ea;text-align:center}
  .b-ev{font:700 14px/1.25 system-ui}.b-meta{font:500 11px/1.3 system-ui;color:#8e8e93;margin-top:3px}
`;

function certHtml(a: Attendee, ev: EventInfo, ngoName: string, logoUrl?: string) {
  const logo = logoUrl ? `<img class="c-logo" src="${esc(logoUrl)}" alt="">` : '';
  return `<div class="cert">
    <div class="c-frame">
      ${logo}
      <div class="c-kicker">KATILIM SERTİFİKASI</div>
      <div class="c-sub">Bu belge aşağıdaki katılımcıya takdim edilmiştir</div>
      <div class="c-name">${esc(a.name || 'Katılımcı')}</div>
      <div class="c-body">${esc(ngoName)} tarafından düzenlenen<br><b>${esc(ev.name || '')}</b> etkinliğine katılımından dolayı teşekkür ederiz.</div>
      <div class="c-foot"><div class="c-line">${esc([ev.date, ev.location].filter(Boolean).join(' · '))}</div><div class="c-line">${esc(ngoName)}</div></div>
    </div>
  </div>`;
}
const CERT_STYLES = `
  .cert{width:1040px;max-width:100%;page-break-after:always}
  .c-frame{position:relative;background:#fff;border:2px solid #ff5722;border-radius:20px;padding:56px 64px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.06)}
  .c-logo{height:56px;object-fit:contain;margin-bottom:18px}
  .c-kicker{font:800 22px/1 -apple-system,system-ui;letter-spacing:.14em;color:#ff5722}
  .c-sub{font:500 14px system-ui;color:#8e8e93;margin-top:12px}
  .c-name{font:800 46px/1.1 'SF Pro Display',-apple-system,system-ui;letter-spacing:-.02em;margin:22px 0;color:#1c1c1e}
  .c-body{font:500 17px/1.6 system-ui;color:#3a3a3c;max-width:640px;margin:0 auto}
  .c-foot{display:flex;justify-content:space-between;margin-top:48px;padding-top:18px;border-top:1px solid #e5e5ea}
  .c-line{font:600 13px system-ui;color:#48484a}
  @page{size:A4 landscape;margin:14mm}
`;

function useBulkDoc(build: (att: Attendee[], ev: EventInfo) => { title: string; styles: string; body: string; share: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const run = async (eventId: string) => {
    if (!user) { toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const { event, attendees } = await fetchAttendees(eventId, token);
      if (attendees.length === 0) { toast({ title: 'Katılımcı yok', description: 'Bu etkinlikte henüz katılımcı bulunmuyor.' }); return; }
      const { title, styles, body, share } = build(attendees, event);
      const ok = openPrintWindow(title, styles, body, share);
      if (!ok) toast({ variant: 'destructive', title: 'Pencere açılamadı', description: 'Tarayıcı açılır pencereyi engelledi; izin verin.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Oluşturulamadı', description: e instanceof Error ? e.message : 'Tekrar deneyin.' });
    } finally { setLoading(false); }
  };
  return { run, loading };
}

export function EventBadgeCards({ eventId, eventName, ngoName, logoUrl }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string }) {
  const { run, loading } = useBulkDoc((att, ev) => ({
    title: `Yaka Kartları — ${eventName}`,
    styles: BADGE_STYLES,
    body: att.map((a) => badgeCardHtml(a, ev, ngoName, logoUrl)).join(''),
    share: `${eventName} · ${att.length} katılımcı yaka kartı`,
  }));
  return (
    <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" disabled={loading} onClick={() => run(eventId)}>
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <IdCard className="h-4 w-4 mr-1.5" />} Yaka Kartları
    </Button>
  );
}

export function EventCertificates({ eventId, eventName, ngoName, logoUrl }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string }) {
  const { run, loading } = useBulkDoc((att, ev) => ({
    title: `Sertifikalar — ${eventName}`,
    styles: CERT_STYLES,
    body: att.map((a) => certHtml(a, ev, ngoName, logoUrl)).join(''),
    share: `${eventName} · ${att.length} katılım sertifikası`,
  }));
  return (
    <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" disabled={loading} onClick={() => run(eventId)}>
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Award className="h-4 w-4 mr-1.5" />} Sertifikalar
    </Button>
  );
}
