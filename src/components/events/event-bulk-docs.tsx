'use client';

/**
 * Etkinlik toplu belgeleri — YAKA KARTLARI ve SERTİFİKALAR.
 *
 * Butona basınca uygulama-içi bir glass Dialog açılır (yeni "pop-art" pencere DEĞİL):
 *  - Solda katılımcı seçimi (1 kişi veya "Tümünü seç")
 *  - Sağda GERÇEK A4 çıktı önizlemesi (izole iframe — seçilenler anında yansır)
 *  - Altta "Yazdır / PDF olarak kaydet" (tarayıcının Yazdır→PDF akışı)
 *
 * Önizleme + baskı aynı izole iframe dokümanını kullanır (app DOM'una
 * dangerouslySetInnerHTML yok; kart/sertifika HTML'i sadece iframe içinde render edilir).
 * Katılımcılar: GET /api/events/{id}/attendees (RSVP "going") — organizatör yetkisi.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { IdCard, Award, Loader2, Printer } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type Attendee = { name?: string; email?: string };
type EventInfo = { name?: string; date?: string; location?: string };
type DocKind = 'badge' | 'cert';

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fetchAttendees(eventId: string, token: string): Promise<{ event: EventInfo; attendees: Attendee[] }> {
  const res = await fetch(`/api/events/${eventId}/attendees`, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json().catch(() => null)) as { event?: EventInfo; attendees?: Attendee[]; message?: string } | null;
  if (!res.ok || !data) throw new Error(data?.message || 'Katılımcılar alınamadı.');
  return { event: data.event || {}, attendees: Array.isArray(data.attendees) ? data.attendees : [] };
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
`;

/** Seçili katılımcılardan A4 önizleme + baskı için izole HTML doküman üretir. */
function buildSheetDoc(kind: DocKind, list: Attendee[], ev: EventInfo, ngoName: string, logoUrl?: string) {
  const styles = kind === 'badge' ? BADGE_STYLES : CERT_STYLES;
  const page = kind === 'cert' ? '@page{size:A4 landscape;margin:14mm}' : '@page{size:A4;margin:10mm}';
  const body = list.map((a) => (kind === 'badge' ? badgeCardHtml(a, ev, ngoName, logoUrl) : certHtml(a, ev, ngoName, logoUrl))).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Inter,system-ui,sans-serif;background:#f2f2f7;color:#1c1c1e}
    .sheet{padding:20px;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-content:flex-start}
    .empty{padding:80px 16px;text-align:center;color:#8e8e93;font:500 14px system-ui}
    @media print{ body{background:#fff} .sheet{padding:0;gap:${kind === 'badge' ? '8px' : '0'}} }
    ${page}
    ${styles}
  </style></head><body>
  <div class="sheet">${body || '<div class="empty">Önizlemek için en az bir kişi seçin.</div>'}</div>
  </body></html>`;
}

function BulkDocDialog({
  kind, eventId, eventName, ngoName, logoUrl, label, icon,
}: {
  kind: DocKind; eventId: string; eventName: string; ngoName: string; logoUrl?: string;
  label: string; icon: React.ReactNode;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [ev, setEv] = useState<EventInfo>({});
  const [sel, setSel] = useState<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!user) { toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' }); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const token = await user.getIdToken();
        const { event, attendees: att } = await fetchAttendees(eventId, token);
        if (cancelled) return;
        setEv(event);
        setAttendees(att);
        setSel(new Set(att.map((_, i) => i))); // varsayılan: hepsi seçili
      } catch (e) {
        if (!cancelled) toast({ variant: 'destructive', title: 'Alınamadı', description: e instanceof Error ? e.message : 'Tekrar deneyin.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user, eventId, toast]);

  const selectedList = useMemo(() => attendees.filter((_, i) => sel.has(i)), [attendees, sel]);
  const previewHtml = useMemo(
    () => buildSheetDoc(kind, selectedList, ev, ngoName, logoUrl),
    [kind, selectedList, ev, ngoName, logoUrl],
  );

  const allSelected = attendees.length > 0 && sel.size === attendees.length;
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(attendees.map((_, i) => i)));
  const toggle = (i: number) => setSel((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow;
    if (!w || selectedList.length === 0) return;
    w.focus();
    w.print();
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
              Soldan kişi seç (1 kişi veya tümü); sağda A4 önizlemesini gör, yazdır ya da PDF olarak kaydet.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : attendees.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
              Bu etkinlikte henüz katılımcı yok.
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
              {/* Kişi seçimi */}
              <div className="sm:w-60 shrink-0 border-b sm:border-b-0 sm:border-r overflow-y-auto p-3 space-y-0.5 max-h-40 sm:max-h-none">
                <label className="flex items-center gap-2 text-sm font-semibold py-1.5 cursor-pointer">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} /> Tümünü seç ({attendees.length})
                </label>
                <div className="h-px bg-border my-1" />
                {attendees.map((a, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                    <Checkbox checked={sel.has(i)} onCheckedChange={() => toggle(i)} />
                    <span className="truncate">{a.name || 'Katılımcı'}</span>
                  </label>
                ))}
              </div>
              {/* A4 önizleme (izole iframe) */}
              <div className="flex-1 min-h-0 bg-muted/20">
                <iframe ref={iframeRef} srcDoc={previewHtml} title={`${label} A4 önizleme`} className="w-full h-full border-0" />
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t shrink-0 gap-2 sm:justify-between">
            <span className="text-xs text-muted-foreground self-center">{selectedList.length} / {attendees.length} seçili</span>
            <Button onClick={handlePrint} disabled={selectedList.length === 0}>
              <Printer className="h-4 w-4 mr-2" /> Yazdır / PDF olarak kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EventBadgeCards({ eventId, eventName, ngoName, logoUrl }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string }) {
  return (
    <BulkDocDialog
      kind="badge" eventId={eventId} eventName={eventName} ngoName={ngoName} logoUrl={logoUrl}
      label="Yaka Kartları" icon={<IdCard className="h-4 w-4 mr-1.5" />}
    />
  );
}

export function EventCertificates({ eventId, eventName, ngoName, logoUrl }: { eventId: string; eventName: string; ngoName: string; logoUrl?: string }) {
  return (
    <BulkDocDialog
      kind="cert" eventId={eventId} eventName={eventName} ngoName={ngoName} logoUrl={logoUrl}
      label="Sertifikalar" icon={<Award className="h-4 w-4 mr-1.5" />}
    />
  );
}
