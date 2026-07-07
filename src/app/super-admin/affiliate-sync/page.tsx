'use client';

/**
 * /super-admin/affiliate-sync — Affiliate Onay Senkron paneli.
 *
 * Robot mantığı functions/src/affiliate-approval-sync.ts (Cloud Function, 06:00)
 * içinde. GCP güvenlik incident'inden (2026-06-26) beri Cloud Function
 * tetiklenmiyor; bu panel App Hosting üzerindeki ikinci yolu (Next.js API
 * route + manuel tetik) yönetir:
 *   - GET  /api/super-admin/affiliate-sync/status → son çalışma + dağılım + geçmiş
 *   - POST /api/super-admin/affiliate-sync/run    → şimdi tara ve eşitle
 *
 * Auth: useUser() + super-admin claim. Yetkisiz → "Yetki yok" + /super-admin.
 * Tasarım: Apple iOS dili + hangel coral vurgu; sade kartlar, net kontrast.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
  Store, EyeOff, Eye, Clock, ShieldQuestion, PlayCircle, History,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/* ---------- API tipleri (affiliate-approval-sync.ts summary şekliyle uyumlu) ---------- */

interface NetworkRow {
  network: string;
  agency: string;
  scanned: number;
  listable: number;
}

interface RunEntry {
  id: string;              // affiliateSyncRuns doc id (YYYY-MM-DD)
  runAt: number | null;    // epoch ms
  listable: number;
  newlyListed: number;
  removed: number;
}

/** Onaylı/onaysız marka dağılımı — brands koleksiyonu status raporundan. */
interface BrandDistribution {
  approved: number;   // onaylı / yayında
  pending: number;    // beklemede
  rejected: number;   // reddedilmiş / gizli
}

interface StatusResp {
  runAt: number | null;        // son çalışma epoch ms
  totals: {
    scanned: number;
    listable: number;
    excluded: number;
    byNetwork: NetworkRow[];
  } | null;
  distribution?: BrandDistribution;
  recentRuns?: RunEntry[];
}

interface RunResultItem { id?: string; network?: string; agency?: string; name: string }

interface RunResp {
  ok: boolean;
  runAt: number | null;
  totals: {
    scanned: number;
    listable: number;
    excluded: number;
    byNetwork: NetworkRow[];
  };
  newlyListed: RunResultItem[];
  removedFromList: RunResultItem[];
  hiddenBrands: string[];
  reactivatedBrands: string[];
}

/* ---------- Yardımcılar ---------- */

const STALE_HOURS = 26;
const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString('tr-TR');

const AGENCY_LABEL: Record<string, string> = {
  reklamaction: 'ReklamAction',
  affocean: 'Affocean',
  gelirortaklari: 'GelirOrtakları',
};

function relTime(ms: number | null): string {
  if (!ms) return 'hiç çalışmadı';
  const diff = Date.now() - ms;
  if (diff < 0) return 'az önce';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

function fullDate(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ---------- Küçük bileşenler ---------- */

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="text-[13px] text-muted-foreground mb-1.5">{label}</div>
      <div className={cn('text-3xl font-semibold tracking-tight tabular-nums', accent && 'text-primary')}>{value}</div>
    </div>
  );
}

/* ---------- Sayfa ---------- */

export default function AffiliateSyncPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  // Super-admin claim doğrulaması (sayfa içi guard — layout da korur, defansif).
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { setIsSuperAdmin(false); return; }
    let cancelled = false;
    user.getIdTokenResult()
      .then((res) => {
        if (cancelled) return;
        const role = (res.claims as { role?: unknown; superAdminPermissions?: unknown }).role;
        const perms = (res.claims as { superAdminPermissions?: unknown }).superAdminPermissions;
        setIsSuperAdmin(role === 'super-admin' || (Array.isArray(perms) && perms.length > 0));
      })
      .catch(() => { if (!cancelled) setIsSuperAdmin(false); });
    return () => { cancelled = true; };
  }, [user, isUserLoading]);

  const [status, setStatus] = useState<StatusResp | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResp | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/affiliate-sync/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Durum yüklenemedi.');
      }
      setStatus(await res.json());
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Durum yüklenemedi.');
    } finally {
      setStatusLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin && user) void loadStatus();
  }, [isSuperAdmin, user, loadStatus]);

  const runNow = useCallback(async () => {
    if (!user || running) return;
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/affiliate-sync/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || 'Senkron çalıştırılamadı.');
      }
      setRunResult(body as RunResp);
      // Durum kartı + geçmişi tazele.
      void loadStatus();
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Senkron çalıştırılamadı.');
    } finally {
      setRunning(false);
    }
  }, [user, running, loadStatus]);

  // Bayatlık: son çalışma STALE_HOURS'tan eskiyse uyar. Date.now() render'da
  // impure sayıldığı için status değişiminde effect ile hesaplanır.
  const [isStale, setIsStale] = useState(true);
  useEffect(() => {
    if (!status?.runAt) { setIsStale(true); return; }
    setIsStale(Date.now() - status.runAt > STALE_HOURS * 3600_000);
  }, [status]);

  const dist = status?.distribution;
  const distTotal = dist ? dist.approved + dist.pending + dist.rejected : 0;

  /* ---------- Auth durumları ---------- */

  if (isUserLoading || isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Yükleniyor" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ShieldQuestion className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-semibold">Yetki yok</h1>
        <p className="text-sm text-muted-foreground">
          Bu sayfayı görüntülemek için super-admin yetkisi gerekir.
        </p>
        <Button onClick={() => router.replace('/super-admin')} className="rounded-full">
          Admin paneline dön
        </Button>
      </div>
    );
  }

  /* ---------- Panel ---------- */

  return (
    <div className="max-w-5xl mx-auto px-1 py-2 space-y-6">
      {/* Başlık + geri */}
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full" aria-label="Geri">
          <Link href="/super-admin"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Affiliate Onay Senkronu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            3 affiliate ağını tarar, onaysız mağazaları yayından kaldırır, yeni onaylıları ekler.
          </p>
        </div>
      </header>

      {/* Açıklama kartı */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Nasıl çalışır?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Robot her gün <span className="font-medium text-foreground">06:00</span>&apos;da otomatik çalışır.
          ReklamAction, Affocean ve GelirOrtakları ağlarını tarar; onaysız mağazaları Market&apos;ten
          gizler, yeni onaylananları geri açar. Aşağıdaki butonla dilediğin an elle de çalıştırabilirsin.
        </CardContent>
      </Card>

      {/* Bayatlık uyarısı */}
      {!statusLoading && isStale && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Robot {STALE_HOURS} saatten uzun süredir çalışmadı</AlertTitle>
          <AlertDescription>
            Cloud Function veya cron kontrolü gerekebilir. Son çalışma: {fullDate(status?.runAt ?? null)}.
            Aşağıdaki &quot;Şimdi Çalıştır&quot; ile elle tetikleyebilirsin.
          </AlertDescription>
        </Alert>
      )}

      {/* Durum kartı */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Son Çalışma</CardTitle>
            <CardDescription>
              {statusLoading ? 'Yükleniyor…' : (
                <span className={cn(isStale ? 'text-destructive font-medium' : 'text-foreground')}>
                  {relTime(status?.runAt ?? null)}
                </span>
              )}
              {!statusLoading && status?.runAt ? (
                <span className="text-muted-foreground"> · {fullDate(status.runAt)}</span>
              ) : null}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void loadStatus()}
            disabled={statusLoading}
          >
            {statusLoading
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : <RefreshCw className="h-4 w-4 mr-1.5" />}
            Yenile
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {statusError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          )}

          {!statusError && status?.totals && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="Taranan offer" value={fmt(status.totals.scanned)} />
                <StatTile label="Onaylı (listelenen)" value={fmt(status.totals.listable)} accent />
                <StatTile label="Elenen" value={fmt(status.totals.excluded)} />
              </div>

              {/* Ağ kırılımı */}
              {status.totals.byNetwork.length > 0 && (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ağ</TableHead>
                        <TableHead className="text-right">Taranan</TableHead>
                        <TableHead className="text-right">Onaylı</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {status.totals.byNetwork.map((n) => (
                        <TableRow key={n.network}>
                          <TableCell className="font-medium">
                            {n.agency || AGENCY_LABEL[n.network] || n.network}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(n.scanned)}</TableCell>
                          <TableCell className="text-right tabular-nums text-primary font-medium">
                            {fmt(n.listable)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {!statusError && !statusLoading && !status?.totals && (
            <p className="text-sm text-muted-foreground">
              Henüz çalışma kaydı yok. &quot;Şimdi Çalıştır&quot; ile ilk taramayı başlat.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Marka dağılımı */}
      {dist && distTotal > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" /> Marka Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600 border-transparent hover:bg-emerald-500/20 dark:text-emerald-400">
                {fmt(dist.approved)} onaylı
              </Badge>
              <Badge className="bg-amber-500/15 text-amber-600 border-transparent hover:bg-amber-500/20 dark:text-amber-400">
                {fmt(dist.pending)} bekliyor
              </Badge>
              <Badge className="bg-rose-500/15 text-rose-600 border-transparent hover:bg-rose-500/20 dark:text-rose-400">
                {fmt(dist.rejected)} reddedilmiş
              </Badge>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-muted">
              <div className="h-full bg-emerald-500" style={{ width: `${(dist.approved / distTotal) * 100}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${(dist.pending / distTotal) * 100}%` }} />
              <div className="h-full bg-rose-500" style={{ width: `${(dist.rejected / distTotal) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Şimdi Çalıştır */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              size="lg"
              className="rounded-full w-full sm:w-auto"
              onClick={() => void runNow()}
              disabled={running}
            >
              {running
                ? <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                : <PlayCircle className="h-5 w-5 mr-2" />}
              {running ? 'Taranıyor…' : 'Şimdi Çalıştır'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Tarama 3 ağı gezdiği için 30–60 saniye sürebilir. Sekmeyi açık tut.
            </p>
          </div>

          {runError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{runError}</AlertDescription>
            </Alert>
          )}

          {runResult && (
            <div className="space-y-4">
              <Alert className="rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Senkron tamamlandı</AlertTitle>
                <AlertDescription>
                  {fmt(runResult.totals.scanned)} offer tarandı ·{' '}
                  <span className="text-primary font-medium">{fmt(runResult.totals.listable)}</span> onaylı listeleniyor.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yeni eklenenler */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    <Eye className="h-4 w-4" />
                    Yeni eklenenler ({runResult.newlyListed.length + runResult.reactivatedBrands.length})
                  </div>
                  {runResult.newlyListed.length === 0 && runResult.reactivatedBrands.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Yeni onaylı marka yok.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {runResult.newlyListed.map((o, i) => (
                        <li key={`nl-${o.id ?? i}`} className="flex items-center gap-2 break-words">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="min-w-0">{o.name}</span>
                          {o.agency ? <span className="text-[11px] text-muted-foreground shrink-0">· {o.agency}</span> : null}
                        </li>
                      ))}
                      {runResult.reactivatedBrands.map((name, i) => (
                        <li key={`re-${i}`} className="flex items-center gap-2 break-words">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="min-w-0">{name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">· yeniden açıldı</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Çıkarılanlar */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 mb-2">
                    <EyeOff className="h-4 w-4" />
                    Çıkarılanlar ({runResult.removedFromList.length + runResult.hiddenBrands.length})
                  </div>
                  {runResult.removedFromList.length === 0 && runResult.hiddenBrands.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Listeden çıkan marka yok.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {runResult.removedFromList.map((o, i) => (
                        <li key={`rm-${o.id ?? i}`} className="flex items-center gap-2 break-words">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="min-w-0">{o.name}</span>
                        </li>
                      ))}
                      {runResult.hiddenBrands.map((name, i) => (
                        <li key={`hb-${i}`} className="flex items-center gap-2 break-words">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="min-w-0">{name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">· gizlendi</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {fmt(runResult.hiddenBrands.length)} marka gizlendi ·{' '}
                {fmt(runResult.reactivatedBrands.length)} marka yeniden açıldı.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geçmiş çalışmalar */}
      {status?.recentRuns && status.recentRuns.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Geçmiş Çalışmalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Onaylı</TableHead>
                    <TableHead className="text-right">Yeni</TableHead>
                    <TableHead className="text-right">Çıkan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.recentRuns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {r.runAt ? fullDate(r.runAt) : r.id}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.listable)}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {r.newlyListed > 0 ? `+${fmt(r.newlyListed)}` : '0'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                        {r.removed > 0 ? `−${fmt(r.removed)}` : '0'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
