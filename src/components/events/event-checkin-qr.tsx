'use client';

/**
 * EventCheckinQR — etkinlik yönetiminde "Kayıt QR" + "Check-in QR" butonları.
 *
 * Düzenleyici QR'ı kapıda gösterir (perde/tablet/basılı); katılımcı hangel app ile
 * okutur → kayıt (RSVP) ya da check-in olur. Dialog ayrıca canlı listeyi gösterir:
 *  - Kayıt QR  → kayıt olanlar
 *  - Check-in QR → herkes; check-in yapanlar YEŞİL + yan sütunda "Check-in yaptı".
 *
 * Veri: GET /api/events/[id]/attendance (organizatör/super-admin yetkili).
 * Tarama hedefleri: /e/{id}/kayit ve /e/{id}/checkin.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode, ScanLine, Loader2, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface Person {
  uid: string; name: string; email: string;
  registered: boolean; checkedIn: boolean; checkedInAt: string | null;
}
interface AttendanceResponse {
  event: { name: string };
  registeredCount: number;
  checkedInCount: number;
  people: Person[];
}

type Mode = 'kayit' | 'checkin';

export function EventCheckinQR({ eventId }: { eventId: string }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode | null>(null);
  const [qr, setQr] = useState('');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const scanUrl = useCallback((m: Mode) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org.tr';
    return `${origin}/e/${eventId}/${m}`;
  }, [eventId]);

  const loadList = useCallback(async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/events/${eventId}/attendance`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Liste yüklenemedi');
      setData(body);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Liste yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [eventId, user, toast]);

  const open = useCallback((m: Mode) => {
    setMode(m); setData(null); setQr('');
    import('qrcode').then((q) => q.default.toDataURL(scanUrl(m), { width: 360, margin: 1 })).then(setQr).catch(() => undefined);
    void loadList();
  }, [scanUrl, loadList]);

  const people = data?.people ?? [];
  const registered = people.filter((p) => p.registered);
  const list = mode === 'kayit' ? registered : people; // check-in: herkes (kayıtlı + check-in yapan)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => open('kayit')}><QrCode className="mr-1.5 h-4 w-4" /> Kayıt QR</Button>
      <Button variant="outline" size="sm" onClick={() => open('checkin')}><ScanLine className="mr-1.5 h-4 w-4" /> Check-in QR</Button>

      <Dialog open={mode !== null} onOpenChange={(o) => { if (!o) setMode(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'kayit' ? <QrCode className="h-5 w-5 text-primary" /> : <ScanLine className="h-5 w-5 text-primary" />}
              {mode === 'kayit' ? 'Kayıt QR' : 'Check-in QR'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {mode === 'kayit'
                ? 'Kapıda göster — katılımcı hangel app ile okutur, etkinliğe kaydolur.'
                : 'Kapıda göster — katılımcı hangel app ile okutur, anında check-in yapar (puan + rozet).'}
            </DialogDescription>
          </DialogHeader>

          {/* Büyük QR */}
          <div className="flex flex-col items-center gap-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR" className="h-56 w-56 rounded-2xl border bg-white p-2 shadow-sm" />
            ) : (
              <div className="h-56 w-56 animate-pulse rounded-2xl bg-muted" />
            )}
            <p className="break-all text-center text-[11px] text-muted-foreground">{scanUrl(mode ?? 'checkin')}</p>
          </div>

          {/* Sayaç + yenile */}
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm font-semibold">
              {mode === 'kayit'
                ? <>Kayıt olanlar: <span className="text-primary">{data?.registeredCount ?? 0}</span></>
                : <>Check-in: <span className="text-emerald-600">{data?.checkedInCount ?? 0}</span> / {data?.registeredCount ?? 0} kayıt</>}
            </p>
            <Button variant="ghost" size="sm" onClick={loadList} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {/* Liste */}
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {loading && !data ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…</div>
            ) : list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{mode === 'kayit' ? 'Henüz kayıt yok.' : 'Henüz katılımcı yok.'}</p>
            ) : (
              list.map((p) => {
                const green = mode === 'checkin' && p.checkedIn;
                return (
                  <div key={p.uid} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${green ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-border'}`}>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${green ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</p>
                      {p.email && <p className="truncate text-[11px] text-muted-foreground">{p.email}</p>}
                    </div>
                    {mode === 'checkin' && (
                      p.checkedIn
                        ? <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Check-in yaptı</span>
                        : <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Bekliyor</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
