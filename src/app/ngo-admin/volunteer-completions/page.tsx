'use client';

/**
 * /ngo-admin/volunteer-completions — Gönüllü Saat & Etki Raporu
 *
 * STK yöneticisi için gerçek bir rapor + onay paneli. Gönüllülerin tamamladığı
 * görevleri (volunteerCompletions) çeker, saat/etki özetlerini çıkarır ve
 * bekleyen tamamlamaları ONAYLAMA imkanı verir.
 *
 * - Sorgu: volunteerCompletions where ngoId == activeEntity.id (equality → index gerekmez).
 *   firestore.rules `allow list` bu sorguyu managedNgoId == ngoId olan STK admin'e açar.
 * - Onay: MEVCUT rota yeniden kullanılır →
 *   PATCH /api/ngo-admin/volunteer-completions/{id}/approve
 *   Body: { approved: boolean, adjustedHours?: number, reason?: string }
 *   Header: Authorization: Bearer <idToken>
 *   Yeni server fonksiyonu YOK.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { doc, collection, query, where } from 'firebase/firestore';
import {
  Clock,
  Loader2,
  ShieldAlert,
  Check,
  Award,
  Users,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';
import type { VolunteerCompletion } from '@/lib/types';

// --- yardımcılar ---------------------------------------------------------

type FsTimestamp = { seconds: number; nanoseconds: number };

const effectiveHours = (c: VolunteerCompletion): number =>
  typeof c.adjustedHours === 'number' ? c.adjustedHours : (c.hoursLogged || 0);

const fmtHours = (n: number) =>
  `${n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat`;

const fmtTRY = (n: number) =>
  n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

const fmtDate = (ts?: FsTimestamp): string => {
  if (!ts || typeof ts.seconds !== 'number') return '—';
  try {
    return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR');
  } catch {
    return '—';
  }
};

// Gönüllü adı — users/{userId}.name çeker (ApplicantRow ile aynı desen).
const VolunteerName = ({ userId }: { userId?: string }) => {
  const db = useFirestore();
  const userRef = useMemoFirebase(
    () => (db && userId ? doc(db, COLLECTIONS.users, userId) : null),
    [db, userId],
  );
  const { data: userDoc } = useDoc<{ name?: string; username?: string }>(userRef);
  const name = (userDoc?.name || userDoc?.username || '').trim();
  return <>{name || 'Gönüllü'}</>;
};

// Görev başlığı — best-effort volunteering/{taskId}.title (yoksa kısa id).
const TaskTitle = ({ taskId }: { taskId?: string }) => {
  const db = useFirestore();
  const ref = useMemoFirebase(
    () => (db && taskId ? doc(db, COLLECTIONS.volunteering, taskId) : null),
    [db, taskId],
  );
  const { data } = useDoc<{ title?: string }>(ref);
  const title = (data?.title || '').trim();
  return <>{title || (taskId ? `Görev ${taskId.slice(0, 6)}…` : 'Görev')}</>;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-muted/50 p-5 text-center">
    <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
    <p className="text-2xl font-black tabular-nums">{value}</p>
    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">
      {label}
    </p>
  </div>
);

// --- Bekleyen onay satırı ------------------------------------------------

const PendingRow = ({
  completion,
  onApprove,
  busy,
}: {
  completion: VolunteerCompletion;
  onApprove: (id: string, adjustedHours?: number) => Promise<void>;
  busy: boolean;
}) => {
  const originalHours = completion.hoursLogged || 0;
  const [hoursInput, setHoursInput] = useState<string>(String(effectiveHours(completion)));

  const parsedHours = parseFloat(hoursInput.replace(',', '.'));
  const hoursValid = !isNaN(parsedHours) && parsedHours > 0;
  // adjustedHours yalnız değişmişse gönderilir (orijinal saatle aynıysa göndermeyiz).
  const adjusted =
    hoursValid && Math.abs(parsedHours - originalHours) > 0.001 ? parsedHours : undefined;

  return (
    <div className="p-4 border rounded-xl space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-sm break-words">
            <VolunteerName userId={completion.userId} />
          </p>
          <p className="text-xs text-muted-foreground break-words">
            <TaskTitle taskId={completion.taskId} />
          </p>
          {completion.professionLabel ? (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {completion.professionLabel}
            </p>
          ) : null}
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0">
          Onay bekliyor
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="tabular-nums">
          <strong>{fmtHours(originalHours)}</strong>
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="tabular-nums text-primary font-semibold">
          {fmtTRY(completion.impactValueTRY || 0)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Tamamlanma: {fmtDate(completion.completedAt)}</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor={`hours-${completion.id}`}
            className="text-[11px] font-semibold text-muted-foreground block"
          >
            Onaylanacak saat
          </label>
          <Input
            id={`hours-${completion.id}`}
            type="number"
            min="0"
            step="0.5"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            className="h-9 w-28 tabular-nums"
            disabled={busy}
          />
        </div>
        {adjusted !== undefined && (
          <p className="text-[11px] text-amber-600 mb-2">
            Saat düzeltildi ({fmtHours(originalHours)} → {fmtHours(adjusted)}). Etki değeri
            onayda yeniden hesaplanır.
          </p>
        )}
        <Button
          size="sm"
          className="ml-auto rounded-lg h-9 bg-green-600 hover:bg-green-700 text-white"
          disabled={busy || !hoursValid}
          onClick={() => onApprove(completion.id, adjusted)}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1.5" />
          )}
          Onayla
        </Button>
      </div>
    </div>
  );
};

// --- Onaylanan satır (salt okunur) ---------------------------------------

const ApprovedRow = ({ completion }: { completion: VolunteerCompletion }) => (
  <div className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-2">
    <div className="min-w-0">
      <p className="font-semibold text-sm break-words">
        <VolunteerName userId={completion.userId} />
      </p>
      <p className="text-xs text-muted-foreground break-words">
        <TaskTitle taskId={completion.taskId} />
      </p>
    </div>
    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm justify-end">
      <span className="tabular-nums font-medium">{fmtHours(effectiveHours(completion))}</span>
      <span className="tabular-nums text-primary font-semibold">
        {fmtTRY(completion.impactValueTRY || 0)}
      </span>
      <span className="text-xs text-muted-foreground">Onay: {fmtDate(completion.approvedAt)}</span>
      {completion.certificateUrl ? (
        <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
          <a href={completion.certificateUrl} target="_blank" rel="noopener noreferrer">
            <Award className="h-3.5 w-3.5 mr-1.5" /> Sertifika
          </a>
        </Button>
      ) : (
        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
          <Check className="h-3.5 w-3.5 mr-1" /> Onaylandı
        </Badge>
      )}
    </div>
  </div>
);

// --- Gönüllü bazında toplam satırı ---------------------------------------

const VolunteerAggRow = ({
  userId,
  hours,
  impact,
  count,
}: {
  userId: string;
  hours: number;
  impact: number;
  count: number;
}) => (
  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 border-b last:border-b-0 text-sm">
    <span className="font-medium truncate">
      <VolunteerName userId={userId} />
    </span>
    <span className="tabular-nums text-right w-24">{fmtHours(hours)}</span>
    <span className="tabular-nums text-right w-28 text-primary font-semibold">{fmtTRY(impact)}</span>
    <span className="tabular-nums text-right w-16 text-muted-foreground">{count} görev</span>
  </div>
);

// --- Sayfa ---------------------------------------------------------------

function VolunteerCompletionsReport() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const { id: activeId, isLoading: entityLoading } = useActiveEntity();
  const { isNgoAdmin, isLoading: adminLoading } = useIsNgoAdmin();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  const completionsQuery = useMemoFirebase(() => {
    if (!db || !activeId) return null;
    return query(
      collection(db, COLLECTIONS.volunteerCompletions),
      where('ngoId', '==', activeId),
    );
  }, [db, activeId]);

  const { data: completions, isLoading: completionsLoading } =
    useCollection<VolunteerCompletion>(completionsQuery);

  const rows = useMemo(() => completions || [], [completions]);

  const pending = useMemo(() => rows.filter((c) => c.ngoApproved !== true), [rows]);
  const approved = useMemo(() => rows.filter((c) => c.ngoApproved === true), [rows]);

  const summary = useMemo(() => {
    let totalHours = 0;
    let totalImpact = 0;
    const volunteers = new Set<string>();
    for (const c of rows) {
      totalHours += effectiveHours(c);
      totalImpact += c.impactValueTRY || 0;
      if (c.userId) volunteers.add(c.userId);
    }
    return {
      totalHours,
      totalImpact,
      pendingCount: pending.length,
      approvedCount: approved.length,
      volunteerCount: volunteers.size,
    };
  }, [rows, pending.length, approved.length]);

  // Gönüllü bazında toplamlar (client-side reduce).
  const perVolunteer = useMemo(() => {
    const map: Record<string, { hours: number; impact: number; count: number }> = {};
    for (const c of rows) {
      const key = c.userId || '';
      if (!key) continue;
      if (!map[key]) map[key] = { hours: 0, impact: 0, count: 0 };
      map[key].hours += effectiveHours(c);
      map[key].impact += c.impactValueTRY || 0;
      map[key].count += 1;
    }
    return Object.entries(map)
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.hours - a.hours);
  }, [rows]);

  const handleApprove = async (completionId: string, adjustedHours?: number) => {
    const token = await authUser?.getIdToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Oturum gerekli',
        description: 'Lütfen tekrar giriş yapıp deneyin.',
      });
      return;
    }
    setBusyId(completionId);
    try {
      const res = await fetch(`/api/ngo-admin/volunteer-completions/${completionId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved: true,
          ...(adjustedHours !== undefined ? { adjustedHours } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errorCode?: string };
        const friendly =
          data.errorCode === 'FORBIDDEN'
            ? 'Bu kaydı onaylama yetkiniz yok.'
            : data.errorCode === 'ALREADY_APPROVED'
              ? 'Bu kayıt zaten onaylanmış.'
              : data.errorCode === 'COMPLETION_NOT_FOUND'
                ? 'Tamamlama kaydı bulunamadı.'
                : 'Onaylama sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        toast({ variant: 'destructive', title: 'İşlem başarısız', description: friendly });
        return;
      }
      toast({
        title: 'Tamamlama onaylandı',
        description: 'Gönüllüye puan, etki değeri ve sertifika bildirimi gönderildi.',
      });
      // Liste canlı useCollection aboneliğiyle otomatik yenilenir.
    } catch (err) {
      console.error('[ngo-admin/volunteer-completions] approve failed', err);
      toast({
        variant: 'destructive',
        title: 'İşlem başarısız',
        description: 'Onaylama sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setBusyId(null);
    }
  };

  // --- Gate & yükleme durumları ---
  if (adminLoading || entityLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNgoAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gönüllü Saat & Etki Raporu</h1>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Bu sayfaya erişim yetkiniz yok.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Bu bölüm yalnızca STK yöneticilerine açıktır.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = completionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Gönüllü Saat & Etki Raporu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gönüllülerin tamamladığı görevleri onaylayın; saat ve sosyal etki değerini takip edin.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/ngo-admin/volunteer">
            <Users className="h-4 w-4 mr-1.5" /> Gönüllülük Yönetimi
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <HeartHandshake className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">
                Henüz tamamlanmış gönüllü görevi yok.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Gönüllüler görevlerini tamamladıkça buradan onaylayabilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Clock} label="Toplam Saat" value={fmtHours(summary.totalHours)} />
            <StatCard
              icon={HeartHandshake}
              label="Sosyal Etki Değeri"
              value={fmtTRY(summary.totalImpact)}
            />
            <StatCard icon={Clock} label="Onay Bekleyen" value={String(summary.pendingCount)} />
            <StatCard icon={Check} label="Onaylanan" value={String(summary.approvedCount)} />
            <StatCard icon={Users} label="Gönüllü" value={String(summary.volunteerCount)} />
          </div>

          {/* Bekleyen onaylar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Onay Bekleyenler
                {pending.length > 0 && (
                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F4624A] px-2 text-xs font-bold text-white">
                    {pending.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Onayladığınızda gönüllünün saati ve sosyal etki puanı işlenir, sertifikası
                oluşturulur. Saati onaydan önce düzeltebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  Onay bekleyen tamamlama yok.
                </p>
              ) : (
                pending.map((c) => (
                  <PendingRow
                    key={c.id}
                    completion={c}
                    onApprove={handleApprove}
                    busy={busyId === c.id}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Gönüllü bazında toplamlar */}
          {perVolunteer.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gönüllü Bazında Toplam</CardTitle>
                <CardDescription>Her gönüllünün toplam saat ve sosyal etki katkısı.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="rounded-lg border overflow-x-auto">
                  {perVolunteer.map((v) => (
                    <VolunteerAggRow
                      key={v.userId}
                      userId={v.userId}
                      hours={v.hours}
                      impact={v.impact}
                      count={v.count}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onaylananlar (açılır) */}
          {approved.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <button
                  type="button"
                  onClick={() => setShowApproved((s) => !s)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <CardTitle className="text-lg">Onaylananlar ({approved.length})</CardTitle>
                  {showApproved ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showApproved && (
                <CardContent className="space-y-2">
                  {approved.map((c) => (
                    <ApprovedRow key={c.id} completion={c} />
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default VolunteerCompletionsReport;
