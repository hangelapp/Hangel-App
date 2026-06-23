'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Loader2, Printer, Share2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface VolunteerApplicant { name: string; status?: string; date?: string }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// Tek kaynak belge — yazdır / indir (PDF) / paylaş hep buradan üretir → birebir aynı.
const DOC_CSS = `
  *{box-sizing:border-box}
  .doc{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:28px 32px;width:100%}
  .doc h1{font-size:20px;margin:0 0 2px;text-align:center;font-weight:800}
  .doc .sub{font-size:12px;color:#555;text-align:center;margin-bottom:14px}
  .doc .meta{font-size:12px;margin:8px 0 14px;line-height:1.7}
  .doc table{width:100%;border-collapse:collapse;font-size:13px}
  .doc th,.doc td{border:1px solid #999;padding:7px 8px;text-align:left;vertical-align:top}
  .doc th{background:#f0f0f0}
  .doc td.n{width:34px;color:#444}
  .doc td.nm{font-weight:600}
  .doc td.st{width:120px}
  .doc td.sig{width:32%;height:34px}
`;

function buildDocBody(title: string, applicants: VolunteerApplicant[]): string {
  const rows = applicants.map((a, i) =>
    `<tr><td class="n">${i + 1}</td><td class="nm">${escapeHtml(a.name)}</td><td class="st">${escapeHtml(a.status || 'Beklemede')}</td><td class="sig"></td></tr>`).join('');
  return `<div class="doc">
    <h1>${escapeHtml(title || 'Gönüllülük İlanı')}</h1>
    <div class="sub">Gönüllü Başvuru Listesi</div>
    <div class="meta"><b>Toplam:</b> ${applicants.length} başvuru</div>
    <table><thead><tr><th>#</th><th>Ad Soyad</th><th>Durum</th><th>İmza</th></tr></thead><tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#777;padding:24px">Başvuru yok</td></tr>'}</tbody></table>
  </div>`;
}

function fileBase(title: string): string {
  return (title || 'gonulluluk').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-').slice(0, 40);
}

// Gönüllülük ilanı başvuran listesi — Yazdır / İndir (PDF) / Paylaş; üçü de aynı belgeyi baz alır.
export function VolunteerApplicants({ title, applicants }: { title: string; applicants: VolunteerApplicant[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'pdf' | 'share'>(null);

  const buildPdfBlob = async (): Promise<Blob | null> => {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;';
    holder.innerHTML = `<style>${DOC_CSS}</style>${buildDocBody(title, applicants)}`;
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

  const handlePrint = () => {
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(title)} — Başvuru Listesi</title>
      <style>${DOC_CSS}@media print{.doc{padding:16px}}</style></head><body>${buildDocBody(title, applicants)}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast({ variant: 'destructive', title: 'Yazdırma penceresi açılamadı', description: 'Tarayıcı pop-up engelini kapatın.' }); return; }
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const handleDownload = async () => {
    setBusy('pdf');
    try {
      const blob = await buildPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileBase(title)}-basvuru-listesi.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      toast({ variant: 'destructive', title: 'İndirilemedi', description: e instanceof Error ? e.message : '' });
    } finally { setBusy(null); }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      const blob = await buildPdfBlob();
      if (!blob) return;
      const fileName = `${fileBase(title)}-basvuru-listesi.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `${title} — Başvuru Listesi`, text: `${title} gönüllü başvuru listesi` });
      } else if (nav.share) {
        await nav.share({ title: `${title} — Başvuru Listesi`, text: `${title} gönüllü başvuru listesi` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast({ title: 'Paylaşım desteklenmiyor', description: 'Belge indirildi; dosyayı paylaşabilirsiniz.' });
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      toast({ variant: 'destructive', title: 'Paylaşılamadı', description: e instanceof Error ? e.message : '' });
    } finally { setBusy(null); }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><FileText className="h-4 w-4 mr-1.5" /> Liste</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Başvuru Listesi</DialogTitle>
            <DialogDescription className="text-xs">Yazdır, indir ve paylaş aynı belgeyi üretir</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1.5" /> Yazdır</Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={handleDownload}>
                {busy === 'pdf' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />} İndir
              </Button>
              <Button size="sm" disabled={busy !== null} onClick={handleShare}>
                {busy === 'share' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Share2 className="h-4 w-4 mr-1.5" />} Paylaş
              </Button>
            </div>
            <div className="bg-white text-black rounded-xl border shadow-sm p-5 sm:p-6 space-y-4">
              <div className="text-center space-y-0.5 border-b border-gray-200 pb-3">
                <h3 className="text-lg font-black leading-tight">{title || 'Gönüllülük İlanı'}</h3>
                <p className="text-xs text-gray-500">Gönüllü Başvuru Listesi</p>
              </div>
              <div className="text-xs"><span className="font-bold">Toplam:</span> {applicants.length} başvuru</div>
              <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1.5 text-left w-10">#</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left">Ad Soyad</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left w-28">Durum</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left w-1/3">İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.length === 0 ? (
                    <tr><td colSpan={4} className="border border-gray-300 px-2 py-6 text-center text-gray-500">Henüz başvuru yok.</td></tr>
                  ) : (
                    applicants.map((a, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-3 align-top text-gray-700">{i + 1}</td>
                        <td className="border border-gray-300 px-2 py-3 align-top font-medium">{a.name}</td>
                        <td className="border border-gray-300 px-2 py-3 align-top">{a.status || 'Beklemede'}</td>
                        <td className="border border-gray-300 px-2 py-3"></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
