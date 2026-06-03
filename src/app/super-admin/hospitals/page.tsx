'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Inbox, Loader2, Upload } from 'lucide-react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  doc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

import { HospitalEditDialog } from './_components/hospital-edit-dialog';
import { HospitalFiltersCard } from './_components/hospital-filters-card';
import { HospitalListRow } from './_components/hospital-list-row';
import { HospitalStatsCards } from './_components/hospital-stats-cards';
import type {
  HospitalDoc,
  HospitalEditForm,
  HospitalFilter,
  HospitalSort,
  HospitalStats,
} from './_components/types';

const PAGE_SIZE = 50;

// Bir Firestore doc snapshot'ını runtime'da HospitalDoc'a normalize eder.
// Firestore alanları unknown — yanlış tipli (örn. lat string) değerleri sessizce
// drop ederiz ki UI'da renderda hata atmasın.
function snapToHospital(snap: QueryDocumentSnapshot<DocumentData>): HospitalDoc {
  const d = snap.data();
  const numOr = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const strOr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
  return {
    id: snap.id,
    name: strOr(d.name),
    city: strOr(d.city),
    district: strOr(d.district),
    address: strOr(d.address),
    neighborhood: strOr(d.neighborhood),
    phone: strOr(d.phone),
    website: strOr(d.website),
    postcode: strOr(d.postcode),
    lat: numOr(d.lat),
    lng: numOr(d.lng),
    source: strOr(d.source),
  };
}

export default function SuperAdminHospitalsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();

  const [items, setItems] = useState<HospitalDoc[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<HospitalFilter>('all');
  const [sortBy, setSortBy] = useState<HospitalSort>('missingFirst');

  const [editing, setEditing] = useState<HospitalDoc | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [stats, setStats] = useState<HospitalStats>({ total: 0, missingAddress: 0, missingCity: 0, missingDistrict: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // One-shot count aggregate'ları — 4 ayrı sayım (total + 3 "alan == '' ya da yok").
  // Firestore'da "field yok" sorgusu mümkün değil → import script'inin boş alanları
  // '' string olarak yazdığı varsayılır. Aksi halde sayı düşük çıkabilir; bu durumda
  // import script'i `name ?? ''` ile alanları doldurmalı.
  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    (async () => {
      try {
        const base = collection(db, COLLECTIONS.hospitals);
        const [totalSnap, missAddrSnap, missCitySnap, missDistSnap] = await Promise.all([
          getCountFromServer(base),
          getCountFromServer(query(base, where('address', '==', ''))),
          getCountFromServer(query(base, where('city', '==', ''))),
          getCountFromServer(query(base, where('district', '==', ''))),
        ]);
        if (cancelled) return;
        setStats({
          total: totalSnap.data().count,
          missingAddress: missAddrSnap.data().count,
          missingCity: missCitySnap.data().count,
          missingDistrict: missDistSnap.data().count,
        });
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'unknown';
        toast({
          variant: 'destructive',
          title: t('super_admin_hospitals.toastStatsFailed'),
          description: message,
        });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db, t, toast]);

  // İlk sayfayı yükle — name asc. Filter/sort değişimi ek bir reset effect ile
  // handle edilir (aşağıda) ki UX akıcı kalsın.
  const loadPage = useCallback(async (
    after: QueryDocumentSnapshot<DocumentData> | null,
    activeFilter: HospitalFilter,
  ): Promise<{ docs: HospitalDoc[]; lastSnap: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> => {
    const base = collection(db, COLLECTIONS.hospitals);
    // Server-side filtreler — sadece "missingX" durumlarında `where(field, '==', '')`.
    // Eksik alanı `''` olarak yazılmamış doc'lar bu filtreye düşmez (false negative)
    // ama veri import konvansiyonu boş alan → '' olduğu için pratikte çakışmaz.
    const baseQ = activeFilter === 'missingAddress'
      ? query(base, where('address', '==', ''), orderBy('name'), fsLimit(PAGE_SIZE))
      : activeFilter === 'missingCity'
        ? query(base, where('city', '==', ''), orderBy('name'), fsLimit(PAGE_SIZE))
        : activeFilter === 'missingDistrict'
          ? query(base, where('district', '==', ''), orderBy('name'), fsLimit(PAGE_SIZE))
          : query(base, orderBy('name'), fsLimit(PAGE_SIZE));
    const q = after ? query(baseQ, startAfter(after)) : baseQ;
    const snap = await getDocs(q);
    const docs = snap.docs.map(snapToHospital);
    const lastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null;
    return { docs, lastSnap, hasMore: snap.docs.length === PAGE_SIZE };
  }, [db]);

  // Filter değişiminde listeyi resetle (yeni sorgu).
  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    setInitialLoading(true);
    setItems([]);
    setCursor(null);
    setHasMore(true);
    loadPage(null, filter)
      .then(({ docs, lastSnap, hasMore: more }) => {
        if (cancelled) return;
        setItems(docs);
        setCursor(lastSnap);
        setHasMore(more);
      })
      .catch((e) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'unknown';
        toast({
          variant: 'destructive',
          title: t('super_admin_hospitals.toastLoadFailed'),
          description: message,
        });
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => { cancelled = true; };
  }, [db, filter, loadPage, t, toast]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { docs, lastSnap, hasMore: more } = await loadPage(cursor, filter);
      setItems(prev => [...prev, ...docs]);
      setCursor(lastSnap);
      setHasMore(more);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown';
      toast({
        variant: 'destructive',
        title: t('super_admin_hospitals.toastLoadFailed'),
        description: message,
      });
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, filter, hasMore, loadPage, loadingMore, t, toast]);

  // Client-side filter (arama) + sıralama. Server-side filtreler 50'lik chunk'lar
  // halinde indi; bu chunk içinde arama + missing-first re-order.
  const visibleItems = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('tr');
    const filtered = term.length === 0
      ? items
      : items.filter(h => (h.name || '').toLocaleLowerCase('tr').includes(term));

    const sorted = [...filtered];
    switch (sortBy) {
      case 'nameAsc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
        break;
      case 'nameDesc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'tr'));
        break;
      case 'missingFirst': {
        const score = (h: HospitalDoc) =>
          (h.address && h.address.trim() ? 0 : 1) +
          (h.city && h.city.trim() ? 0 : 1) +
          (h.district && h.district.trim() ? 0 : 1);
        sorted.sort((a, b) => {
          const diff = score(b) - score(a);
          if (diff !== 0) return diff;
          return (a.name || '').localeCompare(b.name || '', 'tr');
        });
        break;
      }
      default:
        break;
    }
    return sorted;
  }, [items, searchTerm, sortBy]);

  const handleStartEdit = (h: HospitalDoc) => {
    setEditing(h);
    setDialogOpen(true);
  };

  const handleSave = useCallback(async (id: string, patch: HospitalEditForm) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.hospitals, id), {
        name: patch.name,
        city: patch.city,
        district: patch.district,
        neighborhood: patch.neighborhood,
        address: patch.address,
        phone: patch.phone,
        website: patch.website,
        postcode: patch.postcode,
      });
      // Local state güncelle — sayfayı yeniden çekmeden.
      setItems(prev => prev.map(h => (h.id === id ? { ...h, ...patch } : h)));
      toast({
        title: t('super_admin_hospitals.toastSaved'),
        description: t('super_admin_hospitals.toastSavedDesc'),
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'unknown';
      toast({
        variant: 'destructive',
        title: t('super_admin_hospitals.toastSaveFailed'),
        description: code === 'permission-denied'
          ? t('super_admin_hospitals.toastPermDenied')
          : message,
      });
      throw e;
    }
  }, [db, t, toast]);

  const rowLabels = useMemo(() => ({
    edit: t('super_admin_hospitals.rowEdit'),
    hasCoords: t('super_admin_hospitals.rowHasCoords'),
    missingAddress: t('super_admin_hospitals.rowMissingAddress'),
    missingCity: t('super_admin_hospitals.rowMissingCity'),
    missingDistrict: t('super_admin_hospitals.rowMissingDistrict'),
    sourceOsm: t('super_admin_hospitals.sourceOsm'),
    sourceSb: t('super_admin_hospitals.sourceSb'),
    sourceUnknown: t('super_admin_hospitals.sourceUnknown'),
  }), [t]);

  const filterLabels = useMemo(() => ({
    search: t('super_admin_hospitals.filterSearch'),
    searchPlaceholder: t('super_admin_hospitals.filterSearchPlaceholder'),
    filter: t('super_admin_hospitals.filterStatus'),
    filterAll: t('super_admin_hospitals.filterAll'),
    filterMissingAddress: t('super_admin_hospitals.filterMissingAddress'),
    filterMissingCity: t('super_admin_hospitals.filterMissingCity'),
    filterMissingDistrict: t('super_admin_hospitals.filterMissingDistrict'),
    sort: t('super_admin_hospitals.filterSort'),
    sortMissingFirst: t('super_admin_hospitals.sortMissingFirst'),
    sortNameAsc: t('super_admin_hospitals.sortNameAsc'),
    sortNameDesc: t('super_admin_hospitals.sortNameDesc'),
    resultSuffix: t('super_admin_hospitals.resultSuffix'),
  }), [t]);

  const dialogLabels = useMemo(() => ({
    title: t('super_admin_hospitals.dialogTitle'),
    description: t('super_admin_hospitals.dialogDesc'),
    name: t('super_admin_hospitals.fieldName'),
    namePlaceholder: t('super_admin_hospitals.fieldNamePlaceholder'),
    address: t('super_admin_hospitals.fieldAddress'),
    addressPlaceholder: t('super_admin_hospitals.fieldAddressPlaceholder'),
    phone: t('super_admin_hospitals.fieldPhone'),
    website: t('super_admin_hospitals.fieldWebsite'),
    postcode: t('super_admin_hospitals.fieldPostcode'),
    openInMaps: t('super_admin_hospitals.openInMaps'),
    coordsMissing: t('super_admin_hospitals.coordsMissing'),
    cancel: t('super_admin_hospitals.dialogCancel'),
    save: t('super_admin_hospitals.dialogSave'),
    saving: t('super_admin_hospitals.dialogSaving'),
  }), [t]);

  return (
    <div className="space-y-8 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">
          {t('super_admin_hospitals.pageTitle')}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          {t('super_admin_hospitals.pageSubtitle')}
        </p>
      </div>

      <HospitalStatsCards
        stats={stats}
        loading={statsLoading}
        labelTotal={t('super_admin_hospitals.statTotal')}
        labelMissingAddress={t('super_admin_hospitals.statMissingAddress')}
        labelMissingCity={t('super_admin_hospitals.statMissingCity')}
        labelMissingDistrict={t('super_admin_hospitals.statMissingDistrict')}
      />

      <HospitalFiltersCard
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        resultCount={visibleItems.length}
        labels={filterLabels}
      />

      <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-8">
          <CardTitle className="text-xl font-bold">
            {t('super_admin_hospitals.listTitle')} ({visibleItems.length.toLocaleString('tr-TR')})
          </CardTitle>
          <CardDescription>{t('super_admin_hospitals.listDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {t('super_admin_hospitals.loadingList')}
              </p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center gap-3">
              <Inbox className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground italic">{t('super_admin_hospitals.empty')}</p>
            </div>
          ) : (
            <div className="divide-y border-black/5">
              {visibleItems.map(h => (
                <HospitalListRow
                  key={h.id}
                  hospital={h}
                  onEdit={handleStartEdit}
                  labels={rowLabels}
                />
              ))}
            </div>
          )}

          {hasMore && !initialLoading && (
            <div className="p-6 flex justify-center border-t border-black/5">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {t('super_admin_hospitals.loadingMore')}
                  </>
                ) : (
                  t('super_admin_hospitals.loadMore')
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV upload placeholder — gerçek upload sonraki PR'a bırakıldı. */}
      <Card className="rounded-2xl border-dashed border-black/10 bg-muted/10">
        <CardContent className="p-6 flex items-center gap-4 text-sm text-muted-foreground">
          <Upload className="h-5 w-5 shrink-0 opacity-60" />
          <div>
            <p className="font-semibold text-[#1d1d1f]">{t('super_admin_hospitals.csvTitle')}</p>
            <p className="text-xs">{t('super_admin_hospitals.csvDesc')}</p>
          </div>
        </CardContent>
      </Card>

      <HospitalEditDialog
        hospital={editing}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        onSave={handleSave}
        labels={dialogLabels}
      />
    </div>
  );
}
