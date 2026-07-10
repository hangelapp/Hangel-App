'use client';

/**
 * Etkinlik/gönüllülük toplu belgeleri — YAKA KARTLARI ve SERTİFİKALAR.
 *
 * Uygulama-içi glass Dialog (yeni "pop-art" pencere DEĞİL):
 *  - Solda kişi seçimi (1 kişi veya "Tümünü seç")
 *  - Sağda GERÇEK A4 çıktı önizlemesi (izole iframe)
 *  - Altta AYRI: Yazdır · Paylaş · İndir
 *
 * SERTİFİKA: kullanıcı-tarafındaki gerçek QR-serili tasarım (event-certificate.ts /
 *   volunteer-certificate.ts) per-kişi üretilir; her biri bir A4 sayfaya basılır.
 * YAKA KARTI: önlü-arkalı; tek yön A7, katlanınca A6; 1 A4'e 4 kişi (2×2). Arka
 *   yüzde profile/etkinliğe giden QR. Önizleme + baskı izole iframe'de (app DOM'una
 *   dangerouslySetInnerHTML YOK).
 *
 * Katılımcılar: GET {attendeesEndpoint} (varsayılan /api/events/{id}/attendees).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { IdCard, Award, Loader2, Printer, Download, Share2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { buildEventCertificateJpeg, partnerLogosForEventName } from '@/lib/event-certificate';
import { buildVolunteerCertificateJpeg } from '@/lib/volunteer-certificate';

type Attendee = { name?: string; email?: string; userId?: string };
type EventInfo = { name?: string; date?: string; location?: string };
type DocKind = 'badge' | 'cert';
type OrgKind = 'event' | 'volunteer';

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Önizleme iframe'inde A4 içeriğini KABIN GENİŞLİĞİNE sığdırır (yatay kırpılma yok).
// Gerçek fiziksel genişlik (badge ~210mm, sertifika ~297mm) iframe'den geniş olduğunda
// `zoom` ile küçültülür → sayfalar dikey akar, aşağı kaydırınca sıradaki A4 gelir.
// Baskıda (@media print) zoom sıfırlanır → çıktı gerçek A4 ölçüsünde kalır.
const FIT_SCRIPT = `<script>(function(){
  function fit(){
    var b=document.body; if(!b) return;
    b.style.zoom='1';
    var w=b.scrollWidth, avail=document.documentElement.clientWidth||w;
    b.style.zoom = (w>avail && avail>0) ? String(avail/w) : '1';
  }
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);
  document.addEventListener('DOMContentLoaded',fit);
  setTimeout(fit,60);setTimeout(fit,300);setTimeout(fit,800);
})();</script>`;

async function fetchAttendees(endpoint: string, token: string): Promise<{ event: EventInfo; attendees: Attendee[] }> {
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json().catch(() => null)) as { event?: EventInfo; attendees?: Attendee[]; message?: string } | null;
  if (!res.ok || !data) throw new Error(data?.message || 'Katılımcılar alınamadı.');
  return { event: data.event || {}, attendees: Array.isArray(data.attendees) ? data.attendees : [] };
}

// ---- YAKA KARTI (önlü-arkalı, A6, A4'e 4-up) ----
async function qrDataUri(text: string, size = 220): Promise<string> {
  try {
    const QR = (await import('qrcode')).default;
    return await QR.toDataURL(text, { width: size, margin: 0, errorCorrectionLevel: 'M' });
  } catch {
    return '';
  }
}

function badgeCardHtml(a: Attendee, ev: EventInfo, ngoName: string, logoUrl: string | undefined, backQr: string, orgKind: OrgKind) {
  const roleLabel = orgKind === 'volunteer' ? 'GÖNÜLLÜ' : 'KATILIMCI';
  const logo = logoUrl ? `<img class="b-logo" src="${esc(logoUrl)}" alt="">` : `<div class="b-logo b-logo-ph">${esc((ngoName || 'H').charAt(0))}</div>`;
  // A6 kart = üstte ÖN (A7), altta ARKA (A7, katlama çizgisi). Katlanınca ön görünür.
  return `<div class="badge">
    <div class="b-front">
      <div class="b-top">${logo}<span class="b-ngo">${esc(ngoName)}</span></div>
      <div class="b-mid">
        <div class="b-name">${esc(a.name || (orgKind === 'volunteer' ? 'Gönüllü' : 'Katılımcı'))}</div>
        <div class="b-role">${roleLabel}</div>
      </div>
      <div class="b-ev">${esc(ev.name || '')}</div>
      <div class="b-meta">${esc([ev.date, ev.location].filter(Boolean).join(' · '))}</div>
    </div>
    <div class="b-fold"><span>katlama çizgisi</span></div>
    <div class="b-back">
      ${backQr ? `<img class="b-qr" src="${backQr}" alt="QR">` : ''}
      <div class="b-back-t">${esc(ev.name || 'hangel')}</div>
      <div class="b-back-s">Doğrulamak / detay için okut · hangel.org</div>
    </div>
  </div>`;
}

const BADGE_STYLES = `
  .sheet{padding:8mm;display:grid;grid-template-columns:1fr 1fr;gap:0;justify-items:center;align-content:start}
  .badge{width:105mm;height:148mm;display:flex;flex-direction:column;border:1px dashed #d0d0d5;box-sizing:border-box;page-break-inside:avoid;overflow:hidden}
  .b-front{height:calc(50% - 4mm);display:flex;flex-direction:column;padding:8mm 8mm 2mm;text-align:center}
  .b-top{display:flex;align-items:center;gap:6px;justify-content:center}
  .b-logo{width:30px;height:30px;border-radius:8px;object-fit:contain;background:#fff}
  .b-logo-ph{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:800 16px system-ui;color:#ff5722;background:#fff2ee}
  .b-ngo{font:700 12px/1.15 system-ui;color:#ff5722;max-width:60mm}
  .b-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
  .b-name{font:800 22px/1.1 -apple-system,system-ui;letter-spacing:-.02em;color:#1c1c1e}
  .b-role{font:700 10px/1 system-ui;letter-spacing:.18em;color:#8e8e93;background:rgba(120,120,128,.12);padding:5px 11px;border-radius:980px}
  .b-ev{font:700 12px/1.2 system-ui;color:#1c1c1e}
  .b-meta{font:500 10px/1.3 system-ui;color:#8e8e93;margin-top:2px}
  .b-fold{height:8mm;display:flex;align-items:center;justify-content:center;border-top:1px dashed #c7c7cc;border-bottom:1px dashed #c7c7cc;background:#fafafa}
  .b-fold span{font:600 7px/1 system-ui;letter-spacing:.15em;color:#c7c7cc;text-transform:uppercase}
  .b-back{height:calc(50% - 4mm);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8mm;text-align:center;transform:rotate(180deg)}
  .b-qr{width:34mm;height:34mm}
  .b-back-t{font:700 12px/1.2 system-ui;color:#1c1c1e}
  .b-back-s{font:500 9px/1.3 system-ui;color:#8e8e93;max-width:70mm}
  @page{size:A4 portrait;margin:0}
  @media print{ body{zoom:1 !important} .badge{border-color:#e5e5ea} }
`;

// ---- Ortak: seçili belge JPEG/HTML'lerini üret ----
async function buildBadgeSheetHtml(kind: OrgKind, list: Attendee[], ev: EventInfo, ngoName: string, logoUrl?: string): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
  const verifyBase = kind === 'volunteer' ? `${origin}/volunteering/` : `${origin}/events/`;
  const cards = await Promise.all(
    list.map(async (a) => {
      const qr = await qrDataUri(`${verifyBase}${encodeURIComponent(ev.name || 'hangel')}`, 220);
      return badgeCardHtml(a, ev, ngoName, logoUrl, qr, kind);
    }),
  );
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
  <style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#f2f2f7}
  ${BADGE_STYLES}</style></head><body><div class="sheet">${cards.join('') || '<p style="padding:40px;color:#8e8e93">Kişi seçin.</p>'}</div>${FIT_SCRIPT}</body></html>`;
}

function certInputFor(kind: OrgKind, a: Attendee, ev: EventInfo, ngoName: string, logoUrl: string | undefined, seed: string) {
  if (kind === 'volunteer') {
    return { taskTitle: ev.name || '', organizerName: ngoName, userName: a.name || 'Gönüllü', date: ev.date || '', certificateId: seed, logoUrl } as const;
  }
  return { eventName: ev.name || '', eventDate: ev.date || '', userName: a.name || 'Katılımcı', organizerName: ngoName, role: 'participant' as const, certificateId: seed, logoUrl, partnerLogoUrls: partnerLogosForEventName(ev.name) } as const;
}

async function buildCertSheetHtml(kind: OrgKind, list: Attendee[], ev: EventInfo, ngoName: string, logoUrl?: string): Promise<{ html: string; jpegs: string[] }> {
  const jpegs: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    const seed = `${ev.name || 'x'}::${a.userId || a.email || a.name || i}`;
    const input = certInputFor(kind, a, ev, ngoName, logoUrl, seed);
    // A5 (210×148) tasarım; A4 sayfa aynı en-boy oranında (297×210) → tam doldurur.
    const { jpeg } = kind === 'volunteer'
      ? await buildVolunteerCertificateJpeg(input as never)
      : await buildEventCertificateJpeg(input as never);
    jpegs.push(jpeg);
  }
  const pages = jpegs.map((j) => `<div class="page"><img src="${j}" alt="Sertifika"></div>`).join('');
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
  <style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;background:#e5e5ea}
  .page{width:297mm;height:210mm;margin:6mm auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.12)}
  .page img{width:100%;height:100%;display:block;object-fit:contain}
  @page{size:A4 landscape;margin:0}
  @media print{ body{background:#fff;zoom:1 !important} .page{margin:0;box-shadow:none;page-break-after:always} }
  </style></head><body>${pages || '<p style="padding:40px;font-family:system-ui;color:#8e8e93">Kişi seçin.</p>'}${FIT_SCRIPT}</body></html>`;
  return { html, jpegs };
}

async function certJpegsToPdfBlob(jpegs: string[]): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape', compress: true });
  jpegs.forEach((j, i) => {
    if (i > 0) pdf.addPage('a4', 'landscape');
    pdf.addImage(j, 'JPEG', 0, 0, 297, 210);
  });
  return pdf.output('blob');
}

function BulkDocDialog({
  docKind, orgKind, eventId, eventName, ngoName, logoUrl, attendeesEndpoint, label, icon,
}: {
  docKind: DocKind; orgKind: OrgKind; eventId: string; eventName: string; ngoName: string; logoUrl?: string;
  attendeesEndpoint?: string; label: string; icon: React.ReactNode;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [ev, setEv] = useState<EventInfo>({});
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [certJpegs, setCertJpegs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endpoint = attendeesEndpoint || `/api/events/${eventId}/attendees`;

  useEffect(() => {
    if (!open) return;
    if (!user) { toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' }); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const token = await user.getIdToken();
        const { event, attendees: att } = await fetchAttendees(endpoint, token);
        if (cancelled) return;
        setEv(event);
        setAttendees(att);
        setSel(new Set(att.map((_, i) => i)));
      } catch (e) {
        if (!cancelled) toast({ variant: 'destructive', title: 'Alınamadı', description: e instanceof Error ? e.message : 'Tekrar deneyin.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user, endpoint, toast]);

  const selectedList = useMemo(() => attendees.filter((_, i) => sel.has(i)), [attendees, sel]);

  // Seçim değişince önizlemeyi (badge HTML / cert JPEG'leri) yeniden üret.
  useEffect(() => {
    if (!open || loading || selectedList.length === 0) { setPreviewHtml(''); setCertJpegs([]); return; }
    let cancelled = false;
    setBusy(true);
    (async () => {
      try {
        if (docKind === 'badge') {
          const html = await buildBadgeSheetHtml(orgKind, selectedList, ev, ngoName, logoUrl);
          if (!cancelled) { setPreviewHtml(html); setCertJpegs([]); }
        } else {
          const { html, jpegs } = await buildCertSheetHtml(orgKind, selectedList, ev, ngoName, logoUrl);
          if (!cancelled) { setPreviewHtml(html); setCertJpegs(jpegs); }
        }
      } catch (e) {
        if (!cancelled) toast({ variant: 'destructive', title: 'Önizleme oluşturulamadı', description: e instanceof Error ? e.message : '' });
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, docKind, orgKind, sel, attendees, ev, ngoName, logoUrl]);

  const allSelected = attendees.length > 0 && sel.size === attendees.length;
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(attendees.map((_, i) => i)));
  const toggle = (i: number) => setSel((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  const buildPdfBlob = async (): Promise<Blob | null> => {
    if (docKind === 'cert') return certJpegs.length ? certJpegsToPdfBlob(certJpegs) : null;
    // Badge: iframe (izole) gövdesini html2canvas ile A4'e al.
    const doc = iframeRef.current?.contentDocument;
    const el = doc?.querySelector('.sheet') as HTMLElement | null;
    if (!el) return null;
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    // Önizlemede fit için uygulanan `zoom`'u yakalama sırasında sıfırla → PDF tam
    // çözünürlükte (gerçek A4) alınır; sonra geri koy.
    const bodyEl = doc?.body as HTMLElement | undefined;
    const prevZoom = bodyEl?.style.zoom ?? '';
    if (bodyEl) bodyEl.style.zoom = '1';
    let img: string;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      img = canvas.toDataURL('image/jpeg', 0.92);
    } finally {
      if (bodyEl) bodyEl.style.zoom = prevZoom;
    }
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
    return pdf.output('blob');
  };

  const handlePrint = () => { iframeRef.current?.contentWindow?.focus(); iframeRef.current?.contentWindow?.print(); };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await buildPdfBlob();
      if (!blob) { toast({ title: 'İndirilecek belge yok', description: 'Kişi seçin.' }); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docKind === 'cert' ? 'sertifika' : 'yaka-karti'}-${(eventName || 'hangel').slice(0, 40)}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      toast({ variant: 'destructive', title: 'İndirilemedi', description: e instanceof Error ? e.message : '' });
    } finally { setBusy(false); }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await buildPdfBlob();
      if (!blob) { toast({ title: 'Paylaşılacak belge yok', description: 'Kişi seçin.' }); return; }
      const file = new File([blob], `${docKind === 'cert' ? 'sertifika' : 'yaka-karti'}.pdf`, { type: 'application/pdf' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: unknown) => Promise<void> };
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: `${label} — ${eventName}` });
      } else {
        // Paylaşım desteklenmiyorsa indirmeye düş.
        await handleDownload();
        toast({ title: 'Paylaşım desteklenmiyor', description: 'Belge indirildi; oradan paylaşabilirsiniz.' });
      }
    } catch {
      /* kullanıcı iptal etti veya desteklenmedi */
    } finally { setBusy(false); }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto" onClick={() => setOpen(true)}>
        {icon} {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-5 pb-3 shrink-0">
            <DialogTitle>{label} — A4 çıktı önizleme</DialogTitle>
            <DialogDescription className="text-xs">
              {docKind === 'badge'
                ? 'Kişi seç; önlü-arkalı yaka kartı (katlanınca A6). 1 A4’e 4 kişi. Yazdır, paylaş ya da indir.'
                : 'Kişi seç; her sertifika QR-serili gerçek tasarımla A4’te. Yazdır, paylaş ya da indir.'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : attendees.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-6 text-center">Henüz katılımcı yok.</div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
              <div className="sm:w-60 shrink-0 border-b sm:border-b-0 sm:border-r overflow-y-auto p-3 space-y-0.5 max-h-40 sm:max-h-none">
                <label className="flex items-center gap-2 text-sm font-semibold py-1.5 cursor-pointer">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} /> Tümünü seç ({attendees.length})
                </label>
                <div className="h-px bg-border my-1" />
                {attendees.map((a, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                    <Checkbox checked={sel.has(i)} onCheckedChange={() => toggle(i)} />
                    <span className="truncate">{a.name || (orgKind === 'volunteer' ? 'Gönüllü' : 'Katılımcı')}</span>
                  </label>
                ))}
              </div>
              <div className="flex-1 min-h-0 bg-muted/20 relative">
                {busy && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                <iframe ref={iframeRef} srcDoc={previewHtml} title={`${label} A4 önizleme`} className="w-full h-full border-0" />
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t shrink-0 gap-2 sm:justify-between">
            <span className="text-xs text-muted-foreground self-center">{selectedList.length} / {attendees.length} seçili</span>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={busy || selectedList.length === 0}><Printer className="h-4 w-4 mr-1.5" /> Yazdır</Button>
              <Button variant="outline" size="sm" onClick={handleShare} disabled={busy || selectedList.length === 0}><Share2 className="h-4 w-4 mr-1.5" /> Paylaş</Button>
              <Button size="sm" onClick={handleDownload} disabled={busy || selectedList.length === 0}><Download className="h-4 w-4 mr-1.5" /> İndir (PDF)</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EventBadgeCards({ eventId, eventName, ngoName, logoUrl, orgKind = 'event', attendeesEndpoint }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string; orgKind?: OrgKind; attendeesEndpoint?: string }) {
  return (
    <BulkDocDialog docKind="badge" orgKind={orgKind} eventId={eventId} eventName={eventName} ngoName={ngoName} logoUrl={logoUrl}
      attendeesEndpoint={attendeesEndpoint} label="Yaka Kartları" icon={<IdCard className="h-4 w-4 mr-1.5" />} />
  );
}

export function EventCertificates({ eventId, eventName, ngoName, logoUrl, orgKind = 'event', attendeesEndpoint }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string; orgKind?: OrgKind; attendeesEndpoint?: string }) {
  return (
    <BulkDocDialog docKind="cert" orgKind={orgKind} eventId={eventId} eventName={eventName} ngoName={ngoName} logoUrl={logoUrl}
      attendeesEndpoint={attendeesEndpoint} label="Sertifikalar" icon={<Award className="h-4 w-4 mr-1.5" />} />
  );
}
