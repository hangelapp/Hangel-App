'use client';

/**
 * EventCheckinQR — etkinlik yönetiminde "Kayıt QR" + "Check-in QR" butonları.
 *
 * Düzenleyici QR'ı kapıda gösterir (perde/tablet/basılı); katılımcı hangel app ile
 * okutur → kayıt (RSVP) ya da check-in olur. Dialog ayrıca canlı listeyi gösterir:
 *  - Kayıt QR  → kayıt olanlar (RSVP "going") + link kopyala/indir/paylaş
 *  - Check-in QR → herkes; check-in yapanlar YEŞİL + yan sütunda "Check-in yaptı".
 *
 * Veri: GET /api/events/[id]/attendance (organizatör/super-admin yetkili).
 * Tarama hedefleri: /e/{id}/kayit ve /e/{id}/checkin.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode, ScanLine, Loader2, RefreshCw, CheckCircle2, Clock, Copy, Check, Download, Share2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { LogoQr } from '@/components/shared/logo-qr';
import { checkinCodeFor } from '@/lib/checkin-code';

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

export function EventCheckinQR({ eventId, logoUrl }: { eventId: string; logoUrl?: string | null }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode | null>(null);
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // QR'sız check-in kodu — etkinlik id'sinden deterministik (DB'ye yazılmaz).
  const checkinCode = checkinCodeFor('event', eventId);

  const scanUrl = useCallback((m: Mode) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
    // Kayıt QR/link → önce ETKİNLİK DETAY sayfası açılsın (kişi ne olduğunu görüp
    // oradan kaydolsun); gönüllülükle simetrik. Check-in ise yoklama aksiyonu →
    // doğrudan /e/{id}/checkin. (Önceki: kayıt da /e/{id}/kayit aksiyon ekranına
    // gidiyordu, detay görünmüyordu.)
    return m === 'kayit' ? `${origin}/events/${eventId}` : `${origin}/e/${eventId}/checkin`;
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
    setMode(m); setData(null); setCopied(false); setCodeCopied(false);
    void loadList();
  }, [loadList]);

  // QR'sız check-in kodunu panoya kopyala.
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(checkinCode);
      setCodeCopied(true);
      toast({ title: 'Kod kopyalandı' });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı' });
    }
  }, [checkinCode, toast]);

  // Link işlemleri — kopyala / indir (PNG) / paylaş
  const handleCopy = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Kopyalandı' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı' });
    }
  }, [toast]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) { toast({ variant: 'destructive', title: 'İndirilemedi' }); return; }
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `kayit-qr-${eventId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [qrDataUrl, eventId, toast]);

  const handleShare = useCallback(async (url: string) => {
    const title = data?.event?.name || 'hangel';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return; // kullanıcı iptal etti
        // diğer hatalarda kopyalamaya düş
      }
    }
    void handleCopy(url);
  }, [data, handleCopy]);

  const people = data?.people ?? [];
  const registered = people.filter((p) => p.registered);
  const list = mode === 'kayit' ? registered : people; // check-in: herkes (kayıtlı + check-in yapan)
  const current = mode ?? 'checkin';

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
            <div className="rounded-2xl border bg-white p-2 shadow-sm">
              <LogoQr value={scanUrl(current)} logoUrl={logoUrl} size={216} className="rounded-lg" onDataUrl={setQrDataUrl} />
            </div>
            <p className="break-all text-center text-xs text-muted-foreground">{scanUrl(current)}</p>
            {/* Kopyala / İndir (PNG) / Paylaş */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCopy(scanUrl(current))}>
                {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
                Kopyala
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-4 w-4" /> İndir
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare(scanUrl(current))}>
                <Share2 className="mr-1.5 h-4 w-4" /> Paylaş
              </Button>
            </div>
          </div>

          {/* QR'sız Check-in Kodu — kamera/QR çalışmayan katılımcı için (yalnız Check-in QR modu) */}
          {mode === 'checkin' && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">QR&apos;sız Check-in Kodu</p>
              <div className="flex items-center gap-2">
                <span className="select-all rounded-xl bg-background px-4 py-2 font-mono text-2xl font-bold tracking-[0.35em] text-primary shadow-sm">
                  {checkinCode}
                </span>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {codeCopied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
                  Kopyala
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Katılımcı, <span className="font-semibold">Check-in Yap → kod gir</span> ile bu kodu girerek check-in olabilir.
              </p>
            </div>
          )}

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
              <p className="py-8 text-center text-sm text-muted-foreground">{mode === 'kayit' ? 'Henüz kayıt olan yok.' : 'Henüz katılımcı yok.'}</p>
            ) : (
              list.map((p) => {
                const green = mode === 'checkin' && p.checkedIn;
                return (
                  <div key={p.uid} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${green ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-border'}`}>
                    <div className="min-w-0">
                      <p className={`break-words text-sm font-semibold ${green ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</p>
                      {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
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
