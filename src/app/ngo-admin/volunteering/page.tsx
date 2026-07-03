'use client';

/**
 * hangel NGO admin — Gönüllülük Yönetimi sayfası.
 *
 * 3 sekme:
 *   1. İlanlarım     — STK'nın açtığı volunteering doc'ları (status filtreli)
 *   2. Başvurular    — applications koleksiyonundan ilgili başvurular
 *                      (skill match score hesaplanır, onay/red butonları
 *                      bildirim emit eder)
 *   3. Tamamlanan    — status='Tamamlandı' ilanlar + onaylanan gönüllülere
 *                      puan + yorum + certificate düzenleme
 *
 * Cerrahi: bu yalnızca yeni `/ngo-admin/volunteering` route'unu ekler;
 * mevcut `/ngo-admin/volunteer-portal` (portal entegrasyonu) ve
 * `/ngo-admin/volunteer` (eski iki sekmeli görünüm) sayfalarına dokunulmaz.
 */

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Loader2, PlusCircle, Pencil, Trash2, CheckCircle2, Users, Award, Eye, Megaphone } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import type { Volunteering, Application as UserApplication } from '@/lib/types';

import { ListingForm, type ListingFormValues } from './_components/listing-form';
import { ApplicationReviewCard, type ApplicationReviewItem } from './_components/application-review-card';
import { CompletionScoringDialog, type ScoringItem } from './_components/completion-scoring-dialog';
import { SocialShareButton } from '@/components/ngo-admin/social-share-dialog';
import { EventAttendees } from '@/components/events/event-attendees';
import { EventBadgeCards, EventCertificates } from '@/components/events/event-bulk-docs';
import { VolunteeringCheckinQR } from '@/components/volunteering/volunteering-checkin-qr';
import { RewardManager } from '@/components/rewards/reward-manager';

/** Volunteering doc'larında status henüz mevcut değilse default 'Aktif' kabul
 *  ederiz — eski dokümanlar bozulmasın. */
type ListingStatus = 'Beklemede' | 'Aktif' | 'Pasif' | 'Tamamlandı';

type VolunteeringWithStatus = Volunteering & {
  status?: ListingStatus;
};

function resolveStatus(opp: VolunteeringWithStatus): ListingStatus {
  return opp.status ?? 'Aktif';
}

/** Skill match score = (kesişim ÷ ilan skill+interest sayısı) × 100.
 *  İlan hiç şart koşmuyorsa 100 döner (full match — engel yok). */
function computeMatchScore(
  listing: VolunteeringWithStatus | undefined,
  userSkills: string[] = [],
  userInterests: string[] = [],
): number {
  if (!listing) return 0;
  const requiredSkills = listing.skills ?? [];
  const requiredInterests = listing.interests ?? [];
  const total = requiredSkills.length + requiredInterests.length;
  if (total === 0) return 100;
  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const userInterestSet = new Set(userInterests.map((s) => s.toLowerCase()));
  const skillHits = requiredSkills.filter((s) => userSkillSet.has(s.toLowerCase())).length;
  const interestHits = requiredInterests.filter((s) => userInterestSet.has(s.toLowerCase())).length;
  return Math.round(((skillHits + interestHits) / total) * 100);
}

function statusBadgeVariant(status: ListingStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Aktif') return 'default';
  if (status === 'Beklemede') return 'secondary';
  if (status === 'Tamamlandı') return 'outline';
  return 'destructive';
}

// ---------------------------------------------------------------------------
// Tab 1 — İlanlarım
// ---------------------------------------------------------------------------

function ListingsTab({
  opportunities,
  applicationCounts,
  ngoId,
  ngoName,
  ngoLogoUrl,
  isLoading,
}: {
  opportunities: VolunteeringWithStatus[];
  applicationCounts: Map<string, number>;
  ngoId: string | null;
  ngoName: string;
  ngoLogoUrl?: string;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VolunteeringWithStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VolunteeringWithStatus | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (opp: VolunteeringWithStatus) => {
    setEditing(opp);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ListingFormValues) => {
    if (!ngoId) {
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.entityMissingTitle'),
        description: t('ngo_admin_volunteering.toast.entityMissingDesc'),
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        organization: ngoName,
        ngoId,
        socialArea: values.socialArea,
        interests: values.interests,
        skills: values.skills,
        location: {
          city: values.city,
          district: values.district,
          type: values.locationType,
          ...(values.address.trim() ? { address: values.address.trim() } : {}),
        },
        dates: {
          applicationStart: values.applicationStart,
          applicationEnd: values.applicationEnd,
          eventStart: values.eventStart,
          eventEnd: values.eventEnd,
        },
        volunteerCount: {
          needed: values.capacity,
          applications: editing?.volunteerCount?.applications ?? 0,
        },
        commitment: values.commitment,
        hours: {
          start: values.hoursStart,
          end: values.hoursEnd,
          total: values.hoursTotal,
        },
        amenities: {
          transport: values.transport,
          food: values.food,
          accommodation: values.accommodation,
        },
        requirements: values.requirements,
        participationCondition: values.participationCondition,
        hasPreTraining: values.hasPreTraining,
      };

      if (editing) {
        await updateDoc(doc(db, COLLECTIONS.volunteering, editing.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: t('ngo_admin_volunteering.toast.updatedTitle'),
          description: t('ngo_admin_volunteering.toast.updatedDesc'),
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.volunteering), {
          ...payload,
          status: 'Beklemede' satisfies ListingStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: t('ngo_admin_volunteering.toast.createdTitle'),
          description: t('ngo_admin_volunteering.toast.createdDesc'),
        });
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error('[ngo-admin/volunteering] listing save failed', err);
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.saveFailedTitle'),
        description: t('ngo_admin_volunteering.toast.saveFailedDesc'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (opp: VolunteeringWithStatus) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.volunteering, opp.id), {
        status: 'Tamamlandı' satisfies ListingStatus,
        completedAt: serverTimestamp(),
      });
      toast({
        title: t('ngo_admin_volunteering.toast.completedTitle'),
        description: t('ngo_admin_volunteering.toast.completedDesc'),
      });
    } catch (err) {
      console.error('[ngo-admin/volunteering] complete failed', err);
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.completeFailedTitle'),
        description: t('ngo_admin_volunteering.toast.completeFailedDesc'),
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.volunteering, deleteTarget.id));
      toast({
        title: t('ngo_admin_volunteering.toast.deletedTitle'),
        description: t('ngo_admin_volunteering.toast.deletedDesc'),
      });
    } catch (err) {
      console.error('[ngo-admin/volunteering] delete failed', err);
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.deleteFailedTitle'),
        description: t('ngo_admin_volunteering.toast.deleteFailedDesc'),
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Tamamlanan ilanlar diğer sekmede gösterildiği için burada Beklemede/
  // Aktif/Pasif olanları gösteriyoruz.
  const visible = opportunities.filter((o) => resolveStatus(o) !== 'Tamamlandı');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const initialValues: Partial<ListingFormValues> | undefined = editing
    ? {
        title: editing.title,
        description: editing.description,
        applicationStart: editing.dates?.applicationStart ?? '',
        applicationEnd: editing.dates?.applicationEnd ?? '',
        eventStart: editing.dates?.eventStart ?? '',
        eventEnd: editing.dates?.eventEnd ?? '',
        city: editing.location?.city ?? '',
        district: editing.location?.district ?? '',
        capacity: editing.volunteerCount?.needed ?? 1,
        address: editing.location?.address ?? '',
        locationType: editing.location?.type ?? 'Saha',
        socialArea: editing.socialArea ?? '',
        commitment: editing.commitment ?? 'Tek Günlük',
        skills: editing.skills ?? [],
        interests: editing.interests ?? [],
        hoursStart: editing.hours?.start ?? '',
        hoursEnd: editing.hours?.end ?? '',
        hoursTotal: editing.hours?.total ?? 0,
        transport: editing.amenities?.transport ?? false,
        food: editing.amenities?.food ?? false,
        accommodation: editing.amenities?.accommodation ?? false,
        requirements: editing.requirements ?? [],
        participationCondition: editing.participationCondition ?? '',
        hasPreTraining: editing.hasPreTraining ?? false,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {t('ngo_admin_volunteering.listings.summaryPrefix')} {visible.length}{' '}
          {t('ngo_admin_volunteering.listings.summarySuffix')}
        </p>
        <Button onClick={openCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('ngo_admin_volunteering.listings.newCta')}
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-muted-foreground p-8">
          {t('ngo_admin_volunteering.listings.empty')}
        </p>
      ) : (
        visible.map((opp) => {
          const status = resolveStatus(opp);
          const appCount = applicationCounts.get(opp.id) ?? 0;
          return (
            <Card key={opp.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{opp.title}</CardTitle>
                    <CardDescription>
                      {opp.location?.city || ''}
                      {opp.location?.district ? ` · ${opp.location.district}` : ''}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                    <a href={`/volunteering/${opp.id}`} target="_blank" rel="noopener noreferrer" title="İncele — public sayfayı aç" aria-label="İncele" className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Eye className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {t('ngo_admin_volunteering.listings.applicationsLabel')}:
                  </span>
                  <Badge variant="secondary" className="ml-1">
                    {appCount}
                  </Badge>
                </div>
                {opp.volunteerCount?.needed ? (
                  <span className="text-xs text-muted-foreground">
                    {t('ngo_admin_volunteering.listings.capacityLabel')}: {opp.volunteerCount.needed}
                  </span>
                ) : null}
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                <SocialShareButton
                  kind="volunteering"
                  item={{
                    title: opp.title,
                    description: opp.description || '',
                    date: opp.dates?.eventStart || '',
                    location: opp.location?.address || '',
                    city: opp.location?.city || '',
                    ngoName: ngoName || opp.organization || '',
                    url: typeof window !== 'undefined' ? `${window.location.origin}/volunteering/${opp.id}` : '',
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => openEdit(opp)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  {t('ngo_admin_volunteering.listings.editBtn')}
                </Button>
                <Button asChild variant="outline" size="sm" className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700">
                  <a href="/ngo-admin/ads?tab=google" title="Google'da Ücretsiz Tanıt — Reklam Yönetimi (Google Ad Grants)"><Megaphone className="h-3.5 w-3.5 mr-1.5" /> Google'da Ücretsiz Tanıt</a>
                </Button>
                <VolunteeringCheckinQR oppId={opp.id} logoUrl={ngoLogoUrl} />
                <RewardManager kind="volunteering" id={opp.id} />
                <EventAttendees eventId={opp.id} label="Gönüllüler" endpoint={`/api/volunteering/${opp.id}/attendees`} />
                <EventBadgeCards eventId={opp.id} eventName={opp.title} ngoName={ngoName} logoUrl={ngoLogoUrl} orgKind="volunteer" attendeesEndpoint={`/api/volunteering/${opp.id}/attendees`} />
                <EventCertificates eventId={opp.id} eventName={opp.title} ngoName={ngoName} logoUrl={ngoLogoUrl} orgKind="volunteer" attendeesEndpoint={`/api/volunteering/${opp.id}/attendees`} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleComplete(opp)}
                  disabled={status === 'Tamamlandı'}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('ngo_admin_volunteering.listings.completeBtn')}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/volunteering/${opp.id}`}>
                    {t('ngo_admin_volunteering.listings.viewBtn')}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(opp)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('ngo_admin_volunteering.listings.deleteBtn')}
                </Button>
              </CardFooter>
            </Card>
          );
        })
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('ngo_admin_volunteering.dialog.editTitle')
                : t('ngo_admin_volunteering.dialog.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('ngo_admin_volunteering.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <ListingForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ngo_admin_volunteering.deleteConfirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ngo_admin_volunteering.deleteConfirm.descPrefix')}{' '}
              <strong>{deleteTarget?.title ?? ''}</strong>{' '}
              {t('ngo_admin_volunteering.deleteConfirm.descSuffix')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ngo_admin_volunteering.deleteConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('ngo_admin_volunteering.deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Başvurular
// ---------------------------------------------------------------------------

type UserSkillProfile = { id: string; skills?: string[]; interests?: string[] };

function ApplicationsTab({
  opportunities,
  applications,
  isLoading,
  userProfiles,
}: {
  opportunities: VolunteeringWithStatus[];
  applications: UserApplication[];
  isLoading: boolean;
  userProfiles: Map<string, UserSkillProfile>;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const [pendingId, setPendingId] = useState<string | null>(null);

  const oppById = useMemo(() => {
    const m = new Map<string, VolunteeringWithStatus>();
    opportunities.forEach((o) => m.set(o.id, o));
    return m;
  }, [opportunities]);

  // Tamamlanan ilanlara ait başvuruları "Tamamlanan" sekmesi gösterir;
  // burada sadece aktif/beklemede/pasif olanları listeleriz.
  const visible = useMemo(
    () =>
      applications.filter((app) => {
        const opp = oppById.get(app.entityId || '');
        if (!opp) return false;
        return resolveStatus(opp) !== 'Tamamlandı';
      }),
    [applications, oppById],
  );

  const grouped = useMemo(() => {
    const m = new Map<string, UserApplication[]>();
    visible.forEach((a) => {
      const k = a.title || a.entityId || '';
      const arr = m.get(k) ?? [];
      arr.push(a);
      m.set(k, arr);
    });
    return Array.from(m.entries());
  }, [visible]);

  const handleDecision = async (
    app: UserApplication,
    decision: 'approved' | 'rejected',
  ) => {
    setPendingId(app.id);
    try {
      // Güvenli rota: ownership doğrulaması + status + in-app bildirim +
      // Gelen Kutusu mesajı + FCM push hepsini sunucu tarafında yapar.
      // Eski client-side raw write bunları (ownership + push) atlıyordu.
      const token = await authUser?.getIdToken();
      if (!token) {
        toast({
          variant: 'destructive',
          title: t('ngo_admin_volunteering.toast.applicationFailedTitle'),
          description: t('ngo_admin_volunteering.toast.applicationFailedDesc'),
        });
        return;
      }
      const res = await fetch(
        `/api/volunteering/applications/${app.id}/${decision === 'approved' ? 'approve' : 'reject'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        // Sunucu {errorCode,error} döner; raw internals sızdırmadan kullanıcıya
        // dostça Türkçe mesaj gösteriyoruz.
        await res.json().catch(() => ({}));
        toast({
          variant: 'destructive',
          title: t('ngo_admin_volunteering.toast.applicationFailedTitle'),
          description: t('ngo_admin_volunteering.toast.applicationFailedDesc'),
        });
        return;
      }

      toast({
        title:
          decision === 'approved'
            ? t('ngo_admin_volunteering.toast.applicationApprovedTitle')
            : t('ngo_admin_volunteering.toast.applicationRejectedTitle'),
        description: t('ngo_admin_volunteering.toast.applicationVolunteerNotified'),
      });
    } catch (err) {
      console.error('[ngo-admin/volunteering] decision failed', err);
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.applicationFailedTitle'),
        description: t('ngo_admin_volunteering.toast.applicationFailedDesc'),
      });
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <p className="text-center text-muted-foreground p-8">
        {t('ngo_admin_volunteering.applications.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([listingTitle, apps]) => {
        const opp = oppById.get(apps[0]?.entityId || '');
        return (
          <Card key={listingTitle}>
            <CardHeader>
              <CardTitle className="text-base">{listingTitle}</CardTitle>
              <CardDescription>
                {apps.length} {t('ngo_admin_volunteering.applications.countSuffix')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apps.map((app) => {
                const profile = app.userId ? userProfiles.get(app.userId) : undefined;
                const matchScore = computeMatchScore(opp, profile?.skills, profile?.interests);
                const item: ApplicationReviewItem = {
                  id: app.id,
                  userId: app.userId,
                  userName: app.userName,
                  userAvatarUrl: null,
                  listingTitle,
                  matchScore,
                  status: app.status,
                };
                return (
                  <ApplicationReviewCard
                    key={app.id}
                    application={item}
                    pending={pendingId === app.id}
                    onDecision={(d) => handleDecision(app, d)}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Tamamlanan
// ---------------------------------------------------------------------------

function CompletedTab({
  opportunities,
  applications,
  scoringItems,
  isLoading,
}: {
  opportunities: VolunteeringWithStatus[];
  applications: UserApplication[];
  scoringItems: ScoringItem[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const [scoringTarget, setScoringTarget] = useState<{
    listing: VolunteeringWithStatus;
    volunteer: UserApplication;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scoredKeys, setScoredKeys] = useState<Set<string>>(new Set());

  const completed = opportunities.filter((o) => resolveStatus(o) === 'Tamamlandı');

  const acceptedByListing = useMemo(() => {
    const m = new Map<string, UserApplication[]>();
    applications.forEach((a) => {
      if (a.status !== 'Onaylandı' || !a.entityId) return;
      const arr = m.get(a.entityId) ?? [];
      arr.push(a);
      m.set(a.entityId, arr);
    });
    return m;
  }, [applications]);

  const handleScore = async ({
    hours,
    taskTypeId,
    notes,
  }: {
    hours: number;
    taskTypeId: string;
    notes: string;
  }) => {
    if (!scoringTarget) return;
    const { listing, volunteer } = scoringTarget;
    if (!volunteer.userId || !authUser) {
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.scoreFailedTitle'),
        description: t('ngo_admin_volunteering.toast.scoreFailedDesc'),
      });
      return;
    }
    setSubmitting(true);
    try {
      // Kanonik tamamlama rotası: volunteerCompletions oluşturur + ANINDA onaylar,
      // puan/mali değer hesaplar, user.stats + pastVolunteering yazar, gönüllüye
      // teşekkür + "değerlendir misiniz?" bildirimi gönderir.
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/volunteering/${listing.id}/complete-volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: volunteer.userId,
          taskTypeId,
          hours,
          ...(notes ? { notes } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        impactValueTRY?: number;
        impactPoints?: number;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Tamamlama işlenemedi');
      }

      setScoredKeys((prev) => {
        const next = new Set(prev);
        next.add(`${listing.id}:${volunteer.id}`);
        return next;
      });

      toast({
        title: t('ngo_admin_volunteering.toast.scoreSavedTitle'),
        description:
          typeof json.impactPoints === 'number' && typeof json.impactValueTRY === 'number'
            ? `${json.impactPoints.toLocaleString('tr-TR')} puan ve ${json.impactValueTRY.toLocaleString('tr-TR')} ₺ etki değeri gönüllünün profiline işlendi.`
            : t('ngo_admin_volunteering.toast.scoreSavedDesc'),
      });
      setScoringTarget(null);
    } catch (err) {
      console.error('[ngo-admin/volunteering] completion failed', err);
      toast({
        variant: 'destructive',
        title: t('ngo_admin_volunteering.toast.scoreFailedTitle'),
        description: err instanceof Error ? err.message : t('ngo_admin_volunteering.toast.scoreFailedDesc'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <p className="text-center text-muted-foreground p-8">
        {t('ngo_admin_volunteering.completed.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {completed.map((opp) => {
        const winners = acceptedByListing.get(opp.id) ?? [];
        return (
          <Card key={opp.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                {opp.title}
              </CardTitle>
              <CardDescription>
                {winners.length} {t('ngo_admin_volunteering.completed.winnersCountSuffix')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {winners.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('ngo_admin_volunteering.completed.noWinners')}
                </p>
              ) : (
                winners.map((w) => {
                  const key = `${opp.id}:${w.id}`;
                  const alreadyScored = scoredKeys.has(key);
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3"
                    >
                      <div className="text-sm">
                        <p className="font-semibold">
                          {w.userName ?? t('ngo_admin_volunteering.review.volunteerFallback')}
                        </p>
                        <p className="text-xs text-muted-foreground">{w.date}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyScored ? 'outline' : 'default'}
                        disabled={alreadyScored}
                        onClick={() => setScoringTarget({ listing: opp, volunteer: w })}
                      >
                        <Award className="h-3.5 w-3.5 mr-1.5" />
                        {alreadyScored
                          ? t('ngo_admin_volunteering.completed.alreadyScored')
                          : t('ngo_admin_volunteering.completed.scoreBtn')}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}

      <CompletionScoringDialog
        open={!!scoringTarget}
        onOpenChange={(open) => {
          if (!open) setScoringTarget(null);
        }}
        volunteerName={
          scoringTarget?.volunteer.userName ?? t('ngo_admin_volunteering.review.volunteerFallback')
        }
        listingTitle={scoringTarget?.listing.title ?? ''}
        scoringItems={scoringItems}
        onSubmit={handleScore}
        submitting={submitting}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

function VolunteeringPage() {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const searchParams = useSearchParams();
  const entityId = searchParams.get('id') || authUser?.uid || null;

  const oppsQuery = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', entityId));
  }, [db, entityId]);
  const { data: opps, isLoading: oppsLoading } = useCollection<VolunteeringWithStatus>(oppsQuery);

  const opportunities = useMemo(() => opps ?? [], [opps]);
  const opportunityIds = useMemo(() => opportunities.map((o) => o.id), [opportunities]);

  const appsQuery = useMemoFirebase(() => {
    if (!db || opportunityIds.length === 0) return null;
    return query(collection(db, COLLECTIONS.applications), where('type', '==', 'Gönüllülük'));
  }, [db, opportunityIds]);
  const { data: rawApps, isLoading: appsLoading } = useCollection<UserApplication>(appsQuery);

  const applications = useMemo(() => {
    if (!rawApps) return [];
    const idSet = new Set(opportunityIds);
    return rawApps.filter((a) => idSet.has(a.entityId || ''));
  }, [rawApps, opportunityIds]);

  const applicationCounts = useMemo(() => {
    const m = new Map<string, number>();
    applications.forEach((a) => {
      if (!a.entityId) return;
      m.set(a.entityId, (m.get(a.entityId) ?? 0) + 1);
    });
    return m;
  }, [applications]);

  // Başvuranların skill/interest profilleri — match score için.
  const applicantIds = useMemo(() => {
    const s = new Set<string>();
    applications.forEach((a) => {
      if (a.userId) s.add(a.userId);
    });
    return Array.from(s);
  }, [applications]);

  // Firestore 'in' query limiti 10 — fazlasını parçalayıp birden çok hook
  // açmak yerine, mevcut profile read pattern'inde olduğu gibi tek query
  // ile çekmek için ilk 10'u alıyoruz; bu yeterli match score görselleştirme
  // sağlar. 10+ başvurulu ilanlarda sonrakiler 100 default skoru ile düşer.
  const profileQuery = useMemoFirebase(() => {
    if (!db || applicantIds.length === 0) return null;
    const first10 = applicantIds.slice(0, 10);
    return query(collection(db, COLLECTIONS.users), where('__name__', 'in', first10));
  }, [db, applicantIds]);
  const { data: profilesData } = useCollection<UserSkillProfile>(profileQuery);
  const userProfiles = useMemo(() => {
    const m = new Map<string, UserSkillProfile>();
    (profilesData ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [profilesData]);

  // NGO adı — sertifika ve mesajda kullanılır.
  const ngoQuery = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return query(collection(db, COLLECTIONS.ngos), where('__name__', '==', entityId));
  }, [db, entityId]);
  const { data: ngoData } = useCollection<{ id: string; name?: string; logoUrl?: string; avatarUrl?: string }>(ngoQuery);
  const ngoName = ngoData?.[0]?.name ?? '';
  const ngoLogoUrl = ngoData?.[0]?.logoUrl ?? ngoData?.[0]?.avatarUrl ?? undefined;

  // Süper-admin iş kalemi kataloğu — tamamlama dialog'unda yönetici seçer,
  // puan + mali değer otomatik hesaplanır.
  const scoringQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.volunteerScoring), orderBy('order', 'asc')) : null),
    [db],
  );
  const { data: scoringData } = useCollection<ScoringItem>(scoringQuery);
  const scoringItems = useMemo(() => scoringData ?? [], [scoringData]);

  if (!authUser) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('ngo_admin_volunteering.authRequired')}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">
          {t('ngo_admin_volunteering.pageTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('ngo_admin_volunteering.pageSubtitle')}
        </p>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings">{t('ngo_admin_volunteering.tabs.listings')}</TabsTrigger>
          <TabsTrigger value="applications">
            {t('ngo_admin_volunteering.tabs.applications')}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('ngo_admin_volunteering.tabs.completed')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <ListingsTab
            opportunities={opportunities}
            applicationCounts={applicationCounts}
            ngoId={entityId}
            ngoName={ngoName}
            ngoLogoUrl={ngoLogoUrl}
            isLoading={oppsLoading}
          />
        </TabsContent>
        <TabsContent value="applications" className="mt-4">
          <ApplicationsTab
            opportunities={opportunities}
            applications={applications}
            isLoading={appsLoading || oppsLoading}
            userProfiles={userProfiles}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <CompletedTab
            opportunities={opportunities}
            applications={applications}
            scoringItems={scoringItems}
            isLoading={oppsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VolunteeringPage />
    </Suspense>
  );
}
