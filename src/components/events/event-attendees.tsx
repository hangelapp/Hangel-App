'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, Download, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Attendee { name: string; email: string }
interface AttendeesResponse { event: { name: string; date: string; location: string }; attendees: Attendee[] }

// Etkinlik katılımcı listesi — yalnızca yetkili (super-admin / organizatör) görür.
// İlgili etkinliğin altında "Katılımcılar" butonu; dialogda liste + Excel indir.
// Excel: etkinlik adı/tarih/konum başlığı + (# | Ad Soyad | İmza) — imza için
// geniş sütun ve uzun satırlar (ıslak imza alanı).
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
    // İmza için bol alan: katılımcı satırlarını (başlık satırından sonra) uzun yap.
    ws['!rows'] = rows.map((_, i) => (i >= 6 ? { hpt: 34 } : {}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Katılımcılar');
    const safe = (data.event.name || 'etkinlik').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '-').slice(0, 40);
    XLSX.writeFile(wb, `${safe}-katilimci-listesi.xlsx`);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}><Users className="h-4 w-4 mr-1.5" /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Katılımcılar</DialogTitle>
            <DialogDescription className="text-xs">{data?.event?.name || 'Etkinliğe katılan kullanıcılar'}</DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="py-8 flex justify-center items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{data?.attendees.length || 0} katılımcı</span>
                <Button size="sm" disabled={!data || data.attendees.length === 0} onClick={exportExcel}><Download className="h-4 w-4 mr-1.5" /> Excel İndir</Button>
              </div>
              {data && data.attendees.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Henüz katılımcı yok.</p>
              ) : (
                <ol className="divide-y rounded-xl border">
                  {data?.attendees.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                      <span className="font-medium truncate">{a.name}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
