'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Download, Loader2, Printer } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Attendee { name: string; email: string }
interface AttendeesResponse { event: { name: string; date: string; location: string }; attendees: Attendee[] }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// Etkinlik katılımcı listesi — yalnızca yetkili (super-admin / organizatör) görür.
// "Katılımcılar" butonu → dialogda, İNDİRİLECEK BELGE GÖRÜNÜMÜNDE liste:
// Etkinlik adı/tarih/konum başlığı + (# | Ad Soyad | İmza) tablosu (imza için boş
// geniş sütun, ıslak imza alanı). Excel İndir + Yazdır.
export function EventAttendees({ eventId, label = 'Katılımcılar' }: { eventId: string; label?: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AttendeesResponse | null>(null);

  const load = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/events/${eventId}/attendees`, { headers: { authorization: `Bearer ${token}` } });
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

  const exportExcel = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ['Etkinlik', data.event.name],
      ['Tarih', data.event.date],
      ['Konum', data.event.location],
      ['Toplam Katılımcı', data.attendees.length],
      [],
      ['#', 'Ad Soyad', 'İmza'],
      ...data.attendees.map((a, i) => [i + 1, a.name, '']),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 45 }];
    ws['!rows'] = rows.map((_, i) => (i >= 6 ? { hpt: 34 } : {}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Katılımcılar');
    const safe = (data.event.name || 'etkinlik').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-').slice(0, 40);
    XLSX.writeFile(wb, `${safe}-katilimci-listesi.xlsx`);
  };

  const handlePrint = () => {
    if (!data) return;
    const body = data.attendees.map((a, i) =>
      `<tr><td class="n">${i + 1}</td><td>${escapeHtml(a.name)}</td><td class="sig"></td></tr>`).join('');
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(data.event.name)} — Katılımcı Listesi</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#000;margin:24px}
        h1{font-size:18px;margin:0 0 2px;text-align:center}
        .sub{font-size:11px;color:#555;text-align:center;margin-bottom:12px}
        .meta{font-size:12px;margin:8px 0 14px}
        .meta b{display:inline-block;min-width:64px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#f0f0f0}
        td.n{width:36px}
        td.sig{width:40%;height:34px}
        @media print{body{margin:0}}
      </style></head><body>
      <h1>${escapeHtml(data.event.name || 'Etkinlik')}</h1>
      <div class="sub">Katılımcı İmza Listesi</div>
      <div class="meta"><b>Tarih:</b> ${escapeHtml(data.event.date || '—')}<br/><b>Konum:</b> ${escapeHtml(data.event.location || '—')}<br/><b>Toplam:</b> ${data.attendees.length} katılımcı</div>
      <table><thead><tr><th>#</th><th>Ad Soyad</th><th>İmza</th></tr></thead><tbody>${body || '<tr><td colspan="3" style="text-align:center;color:#777">Katılımcı yok</td></tr>'}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast({ variant: 'destructive', title: 'Yazdırma penceresi açılamadı', description: 'Tarayıcı pop-up engelini kapatın.' }); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const count = data?.attendees.length || 0;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}><Users className="h-4 w-4 mr-1.5" /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Katılımcı Listesi</DialogTitle>
            <DialogDescription className="text-xs">İndirilecek belge önizlemesi — imza listesi</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" disabled={!data} onClick={handlePrint}><Printer className="h-4 w-4 mr-1.5" /> Yazdır</Button>
                <Button size="sm" disabled={!data || count === 0} onClick={exportExcel}><Download className="h-4 w-4 mr-1.5" /> Excel İndir</Button>
              </div>

              {/* Belge önizleme — indirilecek dosyayla aynı düzen (beyaz zemin, imza sütunlu) */}
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
