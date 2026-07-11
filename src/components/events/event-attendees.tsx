'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Download, Loader2, Printer, Share2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { downloadBlobSmart } from '@/lib/native-file';

interface Attendee { name: string; email: string }
interface AttendeesResponse { event: { name: string; date: string; location: string }; attendees: Attendee[] }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// Tek kaynak: imza listesi belgesinin gövde HTML'i. Hem yazdır hem indir hem
// paylaş AYNI bu gövdeyi kullanır → çıktılar birebir aynı belge olur.
const DOC_CSS = `
  *{box-sizing:border-box}
  .doc{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:28px 32px;width:100%}
  .doc h1{font-size:20px;margin:0 0 2px;text-align:center;font-weight:800}
  .doc .sub{font-size:12px;color:#555;text-align:center;margin-bottom:14px}
  .doc .meta{font-size:12px;margin:8px 0 14px;line-height:1.7}
  .doc .meta b{display:inline-block;min-width:64px}
  .doc table{width:100%;border-collapse:collapse;font-size:13px}
  .doc th,.doc td{border:1px solid #999;padding:7px 8px;text-align:left;vertical-align:top}
  .doc th{background:#f0f0f0}
  .doc td.n{width:36px;color:#444}
  .doc td.nm{font-weight:600}
  .doc td.sig{width:40%;height:36px}
`;

function buildDocBody(data: AttendeesResponse): string {
  const rows = data.attendees.map((a, i) =>
    `<tr><td class="n">${i + 1}</td><td class="nm">${escapeHtml(a.name)}</td><td class="sig"></td></tr>`).join('');
  return `<div class="doc">
    <h1>${escapeHtml(data.event.name || 'Etkinlik')}</h1>
    <div class="sub">Katılımcı İmza Listesi</div>
    <div class="meta"><b>Tarih:</b> ${escapeHtml(data.event.date || '—')}<br/><b>Konum:</b> ${escapeHtml(data.event.location || '—')}<br/><b>Toplam:</b> ${data.attendees.length} katılımcı</div>
    <table><thead><tr><th>#</th><th>Ad Soyad</th><th>İmza</th></tr></thead><tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#777;padding:24px">Katılımcı yok</td></tr>'}</tbody></table>
  </div>`;
}

function docFileNameBase(data: AttendeesResponse): string {
  return (data.event.name || 'etkinlik').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-').slice(0, 40);
}

// Etkinlik katılımcı listesi — yalnızca yetkili (super-admin / organizatör) görür.
// "Katılımcılar" → dialogda İNDİRİLECEK BELGE GÖRÜNÜMÜNDE liste + Yazdır / İndir
// (PDF) / Paylaş. Üçü de aynı belgeyi (buildDocBody) baz alır.
export function EventAttendees({ eventId, label = 'Katılımcılar', endpoint }: { eventId: string; label?: string; endpoint?: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<null | 'pdf' | 'share'>(null);
  const [data, setData] = useState<AttendeesResponse | null>(null);

  const load = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(endpoint || `/api/events/${eventId}/attendees`, { headers: { authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Yüklenemedi');
      setData(body);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Katılımcılar yüklenemedi', description: e instanceof Error ? e.message : '' });
      setData({ event: { name: '', date: '', location: '' }, attendees: [] });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => { setOpen(true); setData(null); load(); };

  // Belge gövdesini A4 genişlikli gizli kapta render edip PDF blob üretir.
  // Yazdır/İndir/Paylaş hep buradan → aynı çıktı.
  const buildPdfBlob = async (): Promise<Blob | null> => {
    if (!data) return null;
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;';
    holder.innerHTML = `<style>${DOC_CSS}</style>${buildDocBody(data)}`;
    document.body.appendChild(holder);
    try {
      const canvas = await html2canvas(holder, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const pageW = 210, pageH = 297;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      return pdf.output('blob');
    } finally {
      document.body.removeChild(holder);
    }
  };

  // Yazdır — aynı belge gövdesini yeni pencerede açıp yazdırır (vektörel metin).
  const handlePrint = () => {
    if (!data) return;
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(data.event.name)} — Katılımcı Listesi</title>
      <style>${DOC_CSS}@media print{.doc{padding:16px}}</style></head><body>${buildDocBody(data)}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast({ variant: 'destructive', title: 'Yazdırma penceresi açılamadı', description: 'Tarayıcı pop-up engelini kapatın.' }); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleDownload = async () => {
    if (!data) return;
    setBusy('pdf');
    try {
      const blob = await buildPdfBlob();
      if (!blob) return;
      // <a download> native WebView'de sessiz no-op — tek kapı: downloadBlobSmart.
      await downloadBlobSmart(blob, `${docFileNameBase(data)}-katilimci-listesi.pdf`, {
        title: `${data.event.name} — Katılımcı Listesi`,
        dialogTitle: 'Listeyi kaydet veya paylaş',
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'İndirilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  // Paylaş — aynı PDF'i native paylaşım sayfasıyla gönder (Mail / WhatsApp / SMS /
  // AirDrop). Dosya paylaşımı desteklenmiyorsa indirmeye düşer.
  const handleShare = async () => {
    if (!data) return;
    setBusy('share');
    try {
      const blob = await buildPdfBlob();
      if (!blob) return;
      const fileName = `${docFileNameBase(data)}-katilimci-listesi.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `${data.event.name} — Katılımcı Listesi`, text: `${data.event.name} katılımcı imza listesi` });
      } else if (nav.share) {
        await nav.share({ title: `${data.event.name} — Katılımcı Listesi`, text: `${data.event.name} katılımcı imza listesi` });
      } else {
        // Paylaşım yok → tek kapı (native'de paylaşım sayfası, web'de indirme).
        await downloadBlobSmart(blob, fileName, {
          title: `${data.event.name} — Katılımcı Listesi`,
          text: `${data.event.name} katılımcı imza listesi`,
          dialogTitle: 'Listeyi paylaş',
        });
      }
    } catch (e) {
      // Kullanıcı paylaşımı iptal ettiyse sessiz geç.
      if (e instanceof Error && e.name === 'AbortError') return;
      toast({ variant: 'destructive', title: 'Paylaşılamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const count = data?.attendees.length || 0;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}><Users className="h-4 w-4 mr-1.5" /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Katılımcı Listesi</DialogTitle>
            <DialogDescription className="text-xs">İndirilecek belge önizlemesi — yazdır, indir ve paylaş aynı belgeyi üretir</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" variant="outline" disabled={!data} onClick={handlePrint}><Printer className="h-4 w-4 mr-1.5" /> Yazdır</Button>
                <Button size="sm" variant="outline" disabled={!data || busy !== null} onClick={handleDownload}>
                  {busy === 'pdf' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />} İndir
                </Button>
                <Button size="sm" disabled={!data || busy !== null} onClick={handleShare}>
                  {busy === 'share' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Share2 className="h-4 w-4 mr-1.5" />} Paylaş
                </Button>
              </div>

              {/* Belge önizleme — indirilecek/yazdırılacak dosyayla aynı düzen */}
              <div className="bg-white text-black rounded-xl border shadow-sm p-5 sm:p-6 space-y-4">
                <div className="text-center space-y-0.5 border-b border-gray-200 pb-3">
                  <h3 className="text-lg font-black leading-tight">{data?.event.name || 'Etkinlik'}</h3>
                  <p className="text-xs text-gray-500">Katılımcı İmza Listesi</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  <div><span className="font-bold">Tarih:</span> {data?.event.date || '—'}</div>
                  <div><span className="font-bold">Toplam:</span> {count} katılımcı</div>
                  <div className="sm:col-span-2"><span className="font-bold">Konum:</span> {data?.event.location || '—'}</div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1.5 text-left w-10">#</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left">Ad Soyad</th>
                      <th className="border border-gray-300 px-2 py-1.5 text-left w-2/5">İmza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && count === 0 ? (
                      <tr><td colSpan={3} className="border border-gray-300 px-2 py-6 text-center text-gray-500">Henüz katılımcı yok.</td></tr>
                    ) : (
                      data?.attendees.map((a, i) => (
                        <tr key={i}>
                          <td className="border border-gray-300 px-2 py-3 align-top text-gray-700">{i + 1}</td>
                          <td className="border border-gray-300 px-2 py-3 align-top font-medium">{a.name}</td>
                          <td className="border border-gray-300 px-2 py-3"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
