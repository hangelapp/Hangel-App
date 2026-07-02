'use client';

/**
 * VolunteeringCheckinQR — gönüllülük yönetiminde "Yoklama QR" butonu.
 *
 * STK yöneticisi QR'ı kapıda gösterir (tablet/basılı); onaylı gönüllü hangel app
 * ile okutur → o ilana check-in (yoklama) olur. Dialog canlı listeyi gösterir:
 * gelenler YEŞİL, bekleyenler gri. Veri: GET /api/volunteering/[id]/checkins.
 *
 * Tarama hedefi: /v/{id}/checkin
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScanLine, Loader2, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { LogoQr } from '@/components/shared/logo-qr';

interface Person {
  uid: string; name: string; email: string;
  checkedIn: boolean; checkedInAt: string | null;
}
interface CheckinsResponse {
  opp: { title: string };
  approvedCount: number;
  checkedInCount: number;
  people: Person[];
}

export function VolunteeringCheckinQR({ oppId, logoUrl }: { oppId: string; logoUrl?: string | null }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CheckinsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const scanUrl = (() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
    return `${origin}/v/${oppId}/checkin`;
  })();

  const loadList = useCallback(async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/volunteering/${oppId}/checkins`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Liste yüklenemedi');
      setData(body);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Liste yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [oppId, user, toast]);

  const onOpen = useCallback(() => { setOpen(true); setData(null); void loadList(); }, [loadList]);

  const people = data?.people ?? [];

  return (
    <>
      <Button variant="outline" size="sm" onClick={onOpen}><ScanLine className="mr-1.5 h-4 w-4" /> Yoklama QR</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" /> Yoklama QR
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kapıda göster — onaylı gönüllü hangel app ile okutur, anında yoklamaya girer.
            </DialogDescription>
          </DialogHeader>

          {/* Büyük QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border bg-white p-2 shadow-sm">
              <LogoQr value={scanUrl} logoUrl={logoUrl} size={216} className="rounded-lg" />
            </div>
            <p className="break-all text-center text-xs text-muted-foreground">{scanUrl}</p>
          </div>

          {/* Sayaç + yenile */}
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm font-semibold">
              Yoklama: <span className="text-emerald-600">{data?.checkedInCount ?? 0}</span> / {data?.approvedCount ?? 0} onaylı gönüllü
            </p>
            <Button variant="ghost" size="sm" onClick={loadList} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {/* Liste */}
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {loading && !data ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…</div>
            ) : people.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Henüz onaylı gönüllü yok.</p>
            ) : (
              people.map((p) => {
                const green = p.checkedIn;
                return (
                  <div key={p.uid} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${green ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-border'}`}>
                    <div className="min-w-0">
                      <p className={`break-words text-sm font-semibold ${green ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</p>
                      {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                    </div>
                    {p.checkedIn
                      ? <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Geldi</span>
                      : <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Bekliyor</span>}
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
