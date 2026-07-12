'use client';

/**
 * hangel NGO admin — Kurumsal Başvurular paneli.
 *
 * Bir gönüllülük ilanına (volunteering/{oppId}) gelen kurumsal katılımcı
 * başvurularını (belediye / valilik / marka / üniversite / STK) STK yöneticisi
 * inceler, onaylar veya reddeder.
 *
 * Veri modeli:
 *   - Başvurular: volunteering/{oppId}/corporateApplications/{appId}
 *       ({ id, type, name, logoUrl?, website?, contactName?, contactEmail?,
 *          contactPhone?, note?, status, createdAt })
 *   - Yayınlanan katılımcılar: volunteering/{oppId}.corporateParticipants[]
 *       ({ id, type, name, logoUrl?, website? })
 *
 * ONAYLA akışı (yayına alır):
 *   1) Başvuru dokümanının status'ü 'approved' yapılır (updateDoc).
 *   2) İlanın corporateParticipants dizisine { id, type, name, logoUrl?, website? }
 *      arrayUnion ile eklenir → ilan detay sayfası bu diziyi render ettiğinden
 *      katılımcı ANINDA yayınlanmış olur.
 *
 * İletişim bilgisi (contactName/Email/Phone) yalnız bu yönetici panelinde
 * gösterilir; yayınlanan corporateParticipants nesnesine kopyalanmaz.
 */

import React, { useMemo, useState } from 'react';
import {
  collection,
  doc,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  Building2,
  Loader2,
  Check,
  X,
  ExternalLink,
  Mail,
  Phone,
  User,
  EyeOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import type { CorporateApplication, CorporateParticipant, CorporateParticipantType } from '@/lib/types';

/** Kurumsal katılımcı türü → Türkçe etiket. */
const TYPE_LABELS: Record<CorporateParticipantType, string> = {
  stk: 'STK',
  belediye: 'Belediye',
  valilik: 'Valilik',
  marka: 'Marka',
  universite: 'Üniversite',
};

function typeLabel(type: CorporateParticipantType): string {
  return TYPE_LABELS[type] ?? type;
}

/** Firestore Timestamp benzeri değeri okunur Türkçe tarihe çevir. */
function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const v = value as { toDate?: () => Date; seconds?: number };
    const date =
      typeof v.toDate === 'function'
        ? v.toDate()
        : typeof v.seconds === 'number'
          ? new Date(v.seconds * 1000)
          : typeof value === 'number'
            ? new Date(value)
            : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function statusBadge(status: CorporateApplication['status']): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (status === 'approved') return { label: 'Onaylandı · Yayında', variant: 'default' };
  if (status === 'rejected') return { label: 'Reddedildi', variant: 'destructive' };
  return { label: 'Beklemede', variant: 'secondary' };
}

/**
 * Bir başvurudan yayına konacak (public) katılımcı nesnesini üretir.
 * İletişim bilgisi hariç tutulur; undefined alanlar Firestore'a yazılmaz.
 */
function toParticipant(app: CorporateApplication): CorporateParticipant {
  const participant: CorporateParticipant = {
    id: app.id,
    type: app.type,
    name: app.name,
  };
  if (app.logoUrl) participant.logoUrl = app.logoUrl;
  if (app.website) participant.website = app.website;
  return participant;
}

export function CorporateApplicationsAdmin({ oppId }: { oppId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Başvurular yalnız dialog açıkken okunur (gereksiz canlı dinleyici açılmasın).
  const appsQuery = useMemoFirebase(
    () =>
      db && open
        ? query(
            collection(db, COLLECTIONS.volunteering, oppId, COLLECTIONS.corporateApplications),
            orderBy('createdAt', 'desc'),
          )
        : null,
    [db, oppId, open],
  );
  const { data: applications, isLoading } = useCollection<CorporateApplication>(appsQuery);

  const pendingCount = useMemo(
    () => (applications ?? []).filter((a) => a.status === 'pending').length,
    [applications],
  );

  // (a) status:'approved' + (b) corporateParticipants dizisine ekle → yayınla.
  const handleApprove = async (app: CorporateApplication) => {
    if (!db) return;
    setPendingId(app.id);
    try {
      await updateDoc(
        doc(db, COLLECTIONS.volunteering, oppId, COLLECTIONS.corporateApplications, app.id),
        { status: 'approved' },
      );
      await updateDoc(doc(db, COLLECTIONS.volunteering, oppId), {
        corporateParticipants: arrayUnion(toParticipant(app)),
      });
      toast({ title: 'Onaylandı ve yayınlandı ✓' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Onaylanamadı',
        description: e instanceof Error ? e.message : 'Başvuru onaylanamadı.',
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (app: CorporateApplication) => {
    if (!db) return;
    setPendingId(app.id);
    try {
      await updateDoc(
        doc(db, COLLECTIONS.volunteering, oppId, COLLECTIONS.corporateApplications, app.id),
        { status: 'rejected' },
      );
      toast({ title: 'Başvuru reddedildi' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Reddedilemedi',
        description: e instanceof Error ? e.message : 'Başvuru reddedilemedi.',
      });
    } finally {
      setPendingId(null);
    }
  };

  // Onaylı bir katılımcıyı yayından kaldır: status'ü 'pending'e çevir + diziden çıkar.
  const handleUnpublish = async (app: CorporateApplication) => {
    if (!db) return;
    setPendingId(app.id);
    try {
      await updateDoc(
        doc(db, COLLECTIONS.volunteering, oppId, COLLECTIONS.corporateApplications, app.id),
        { status: 'pending' },
      );
      await updateDoc(doc(db, COLLECTIONS.volunteering, oppId), {
        corporateParticipants: arrayRemove(toParticipant(app)),
      });
      toast({ title: 'Yayından kaldırıldı' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Kaldırılamadı',
        description: e instanceof Error ? e.message : 'Katılımcı yayından kaldırılamadı.',
      });
    } finally {
      setPendingId(null);
    }
  };

  const list = applications ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative rounded-xl w-full sm:w-auto">
          <Building2 className="h-4 w-4 mr-1.5" />
          Kurumsal Başvurular
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kurumsal Başvurular</DialogTitle>
          <DialogDescription className="text-xs">
            Belediye, valilik, marka, üniversite ve STK'ların bu ilana kurumsal katılım
            başvuruları. Onayladığınız katılımcılar ilan detay sayfasında yayınlanır.
            İletişim bilgileri yalnız burada, size özel görünür.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Bu ilana henüz kurumsal başvuru gelmemiş.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {list.length} başvuru · {pendingCount} beklemede
            </p>
            {list.map((app) => {
              const badge = statusBadge(app.status);
              const busy = pendingId === app.id;
              const created = formatDate(app.createdAt);
              return (
                <div key={app.id} className="rounded-xl border bg-card p-4 space-y-3">
                  {/* Başlık: tür çipi + ad + durum */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{typeLabel(app.type)}</Badge>
                        <span className="font-semibold break-words">{app.name}</span>
                      </div>
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {app.website}
                        </a>
                      )}
                    </div>
                    <Badge variant={badge.variant} className="shrink-0">
                      {badge.label}
                    </Badge>
                  </div>

                  {/* Yöneticiye özel iletişim bilgileri */}
                  {(app.contactName || app.contactEmail || app.contactPhone) && (
                    <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
                      <p className="font-medium text-muted-foreground">İletişim (size özel)</p>
                      {app.contactName && (
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {app.contactName}
                        </p>
                      )}
                      {app.contactEmail && (
                        <a
                          href={`mailto:${app.contactEmail}`}
                          className="flex items-center gap-1.5 hover:underline break-all"
                        >
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {app.contactEmail}
                        </a>
                      )}
                      {app.contactPhone && (
                        <a
                          href={`tel:${app.contactPhone}`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {app.contactPhone}
                        </a>
                      )}
                    </div>
                  )}

                  {app.note && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {app.note}
                    </p>
                  )}

                  {created && (
                    <p className="text-[11px] text-muted-foreground">Başvuru: {created}</p>
                  )}

                  {/* Eylemler */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {app.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => handleApprove(app)}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={busy}
                          onClick={() => handleReject(app)}
                        >
                          <X className="h-3.5 w-3.5 mr-1.5" />
                          Reddet
                        </Button>
                      </>
                    )}
                    {app.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => handleUnpublish(app)}
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Yayından kaldır
                      </Button>
                    )}
                    {app.status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => handleApprove(app)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Yine de onayla
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
