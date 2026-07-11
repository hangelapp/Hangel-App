'use client';

/**
 * hangel NGO admin — Meydan Okuma Oluşturma paneli.
 *
 * STK yöneticisi buradan takım meydan okumaları (challenges) oluşturur,
 * listeler, düzenler ve siler. Görüntüleme tarafı `/volunteering/challenges`
 * bu koleksiyonu okur; şema BİREBİR o sayfayla uyumludur.
 *
 * Cerrahi / çakışmasız: yalnızca bu YENİ route'u ekler. Paylaşılan dosyalara
 * (src/lib/types.ts, src/firebase/collections.ts, volunteering/*, ngo-admin
 * layout, nav/app-shell) DOKUNMAZ. Gereken tipler ve koleksiyon adı burada
 * yerel olarak tanımlıdır.
 *
 * Mobil-öncelikli, Apple-temiz, Türkçe.
 */

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Trophy, Target, Plus, Trash2, Loader2, Pencil, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

// Koleksiyon adı — COLLECTIONS'a (paylaşılan dosya) DOKUNMAMAK için yerel sabit.
// Görüntüleme sayfası (src/app/volunteering/challenges/page.tsx) da aynı adı
// yerel sabit olarak kullanır.
const CHALLENGES_COLLECTION = 'challenges';

// --- `challenges` şeması (types.ts'e DOKUNMADAN, yerel; görüntüleme sayfasıyla
//     birebir aynı alan adları) ---
type ChallengeMetric = 'hours' | 'count';

type FirestoreTs = { seconds: number; nanoseconds: number };

type Challenge = {
  id: string;
  title: string;
  description?: string;
  ngoId?: string;
  metric: ChallengeMetric;
  target: number;
  startsAt?: FirestoreTs;
  endsAt?: FirestoreTs;
};

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const METRIC_UNIT: Record<ChallengeMetric, string> = {
  hours: 'saat',
  count: 'faaliyet',
};

const METRIC_LABEL: Record<ChallengeMetric, string> = {
  hours: 'Toplam saat',
  count: 'Faaliyet adedi',
};

/** Firestore Timestamp benzeri değeri ms'ye çevir (yoksa null). */
function tsToMs(ts?: FirestoreTs): number | null {
  if (!ts || typeof ts.seconds !== 'number') return null;
  return ts.seconds * 1000 + Math.floor((ts.nanoseconds ?? 0) / 1e6);
}

/** Firestore Timestamp'i <input type="date"> için "YYYY-MM-DD"e çevir. */
function tsToDateInput(ts?: FirestoreTs): string {
  const ms = tsToMs(ts);
  if (ms == null) return '';
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → o günün başlangıcındaki (yerel) Firestore Timestamp'i. */
function dateInputToTs(value: string): Timestamp | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

/** Firestore Timestamp'i okunur TR tarihine çevir. */
function fmtDate(ts?: FirestoreTs): string {
  const ms = tsToMs(ts);
  if (ms == null) return '—';
  return new Date(ms).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Kalan gün (bugünden endsAt'e; geçmişse 0). */
function daysLeft(endsAt?: FirestoreTs): number | null {
  const end = tsToMs(endsAt);
  if (end == null) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

function statusLabel(ch: Challenge): { text: string; active: boolean } {
  const d = daysLeft(ch.endsAt);
  if (d == null) return { text: 'Süresiz', active: true };
  if (d === 0) return { text: 'Süresi doldu', active: false };
  if (d === 1) return { text: 'Son 1 gün', active: true };
  return { text: `${d} gün kaldı`, active: true };
}

// ---------------------------------------------------------------------------
// Form değerleri
// ---------------------------------------------------------------------------

type FormValues = {
  title: string;
  description: string;
  metric: ChallengeMetric;
  target: string; // input'ta string; kaydederken Number'a çevrilir
  startsAt: string; // "YYYY-MM-DD"
  endsAt: string; // "YYYY-MM-DD"
};

const EMPTY_FORM: FormValues = {
  title: '',
  description: '',
  metric: 'hours',
  target: '',
  startsAt: '',
  endsAt: '',
};

function toFormValues(ch: Challenge): FormValues {
  return {
    title: ch.title ?? '',
    description: ch.description ?? '',
    metric: ch.metric === 'count' ? 'count' : 'hours',
    target: ch.target != null ? String(ch.target) : '',
    startsAt: tsToDateInput(ch.startsAt),
    endsAt: tsToDateInput(ch.endsAt),
  };
}

// ---------------------------------------------------------------------------
// Ana içerik
// ---------------------------------------------------------------------------

function ChallengesAdmin() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // entityId deseni — volunteering admin sayfasıyla aynı: ?id= veya oturum uid.
  const ngoId = searchParams.get('id') || authUser?.uid || null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);

  // Bu STK'nın meydan okumaları — tek alanlı where (composite index gerektirmez).
  const challengesQuery = useMemoFirebase(
    () =>
      db && ngoId
        ? query(collection(db, CHALLENGES_COLLECTION), where('ngoId', '==', ngoId))
        : null,
    [db, ngoId],
  );
  const { data: rawChallenges, isLoading } = useCollection<Challenge>(challengesQuery);

  // Bitişe en yakın olan önce (süresizler en sonda).
  const challenges = useMemo(() => {
    const list = [...(rawChallenges ?? [])];
    return list.sort((a, b) => {
      const da = daysLeft(a.endsAt);
      const dbb = daysLeft(b.endsAt);
      const va = da == null ? Number.MAX_SAFE_INTEGER : da;
      const vb = dbb == null ? Number.MAX_SAFE_INTEGER : dbb;
      return va - vb;
    });
  }, [rawChallenges]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (ch: Challenge) => {
    setEditing(ch);
    setForm(toFormValues(ch));
    setDialogOpen(true);
  };

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!ngoId || !db) {
      toast({
        variant: 'destructive',
        title: 'STK bulunamadı',
        description: 'Meydan okuma oluşturmak için STK hesabıyla giriş yapmalısınız.',
      });
      return;
    }

    const title = form.title.trim();
    if (!title) {
      toast({ variant: 'destructive', title: 'Başlık gerekli' });
      return;
    }

    const target = Number(form.target);
    if (!Number.isFinite(target) || target <= 0) {
      toast({
        variant: 'destructive',
        title: 'Geçerli bir hedef girin',
        description: 'Hedef 0’dan büyük bir sayı olmalıdır.',
      });
      return;
    }

    const endsAtTs = dateInputToTs(form.endsAt);
    if (!endsAtTs) {
      toast({
        variant: 'destructive',
        title: 'Bitiş tarihi gerekli',
        description: 'Meydan okumanın bir bitiş tarihi olmalıdır.',
      });
      return;
    }

    const startsAtTs = dateInputToTs(form.startsAt);
    if (startsAtTs && startsAtTs.toMillis() > endsAtTs.toMillis()) {
      toast({
        variant: 'destructive',
        title: 'Tarih aralığı hatalı',
        description: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        description: form.description.trim(),
        ngoId,
        metric: form.metric,
        target,
        endsAt: endsAtTs,
        // startsAt opsiyonel — yalnız girildiyse yazılır.
        ...(startsAtTs ? { startsAt: startsAtTs } : {}),
      };

      if (editing) {
        await updateDoc(doc(db, CHALLENGES_COLLECTION, editing.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Meydan okuma güncellendi',
          description: `“${title}” kaydedildi.`,
        });
      } else {
        await addDoc(collection(db, CHALLENGES_COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Meydan okuma oluşturuldu',
          description: `“${title}” yayınlandı.`,
        });
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('[ngo-admin/challenges] save failed', err);
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: 'Bir hata oluştu, lütfen tekrar deneyin.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !db) return;
    try {
      await deleteDoc(doc(db, CHALLENGES_COLLECTION, deleteTarget.id));
      toast({
        title: 'Meydan okuma silindi',
        description: `“${deleteTarget.title}” kaldırıldı.`,
      });
    } catch (err) {
      console.error('[ngo-admin/challenges] delete failed', err);
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: 'Bir hata oluştu, lütfen tekrar deneyin.',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!authUser) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Bu sayfayı görüntülemek için giriş yapmalısınız.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Başlık */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <h1 className="font-headline text-2xl font-bold">Meydan Okumalar</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gönüllülerinize takım hedefleri koyun. Yayınladığınız meydan
            okumalar gönüllülük sayfasında görünür.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Meydan Okuma
        </Button>
      </header>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : challenges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" aria-hidden />
            </span>
            <p className="text-base font-semibold text-foreground">
              Henüz meydan okuma yok
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              İlk meydan okumanızı oluşturun; gönüllüleriniz birlikte bir hedefe
              doğru ilerlesin.
            </p>
            <Button onClick={openCreate} className="mt-1">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Meydan Okuma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch) => {
            const status = statusLabel(ch);
            return (
              <Card key={ch.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Target className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-base leading-tight">
                          {ch.title}
                        </CardTitle>
                        {ch.description ? (
                          <CardDescription className="mt-1 line-clamp-2">
                            {ch.description}
                          </CardDescription>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ' +
                        (status.active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground')
                      }
                    >
                      <Clock className="h-3 w-3" aria-hidden />
                      {status.text}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="h-4 w-4" aria-hidden />
                    Hedef:{' '}
                    <strong className="text-foreground">
                      {ch.target.toLocaleString('tr-TR')} {METRIC_UNIT[ch.metric]}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden />
                    {fmtDate(ch.startsAt)} – {fmtDate(ch.endsAt)}
                  </span>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(ch)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Düzenle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(ch)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Sil
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Oluştur / Düzenle dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Meydan Okumayı Düzenle' : 'Yeni Meydan Okuma'}
            </DialogTitle>
            <DialogDescription>
              Gönüllüleriniz için bir takım hedefi tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Başlık */}
            <div className="space-y-1.5">
              <Label htmlFor="ch-title">Başlık</Label>
              <Input
                id="ch-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Örn. 100 saatlik dayanışma"
                maxLength={120}
              />
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <Label htmlFor="ch-desc">Açıklama (opsiyonel)</Label>
              <Textarea
                id="ch-desc"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Meydan okumanın amacını kısaca anlatın."
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Metrik + Hedef */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ch-metric">Ölçüt</Label>
                <Select
                  value={form.metric}
                  onValueChange={(v) => setField('metric', v as ChallengeMetric)}
                >
                  <SelectTrigger id="ch-metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">{METRIC_LABEL.hours}</SelectItem>
                    <SelectItem value="count">{METRIC_LABEL.count}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-target">
                  Hedef ({METRIC_UNIT[form.metric]})
                </Label>
                <Input
                  id="ch-target"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.target}
                  onChange={(e) => setField('target', e.target.value)}
                  placeholder="Örn. 100"
                />
              </div>
            </div>

            {/* Tarihler */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ch-start">Başlangıç (opsiyonel)</Label>
                <Input
                  id="ch-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setField('startsAt', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-end">Bitiş</Label>
                <Input
                  id="ch-end"
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setField('endsAt', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
                setForm(EMPTY_FORM);
              }}
              disabled={submitting}
            >
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editing ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editing ? 'Kaydet' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme onayı */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Meydan okuma silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title ?? ''}</strong> kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <ChallengesAdmin />
    </Suspense>
  );
}
