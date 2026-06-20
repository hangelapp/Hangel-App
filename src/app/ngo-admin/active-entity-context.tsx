'use client';

/**
 * Active-entity context for the ngo-admin panel (multi-tenant org switching).
 *
 * A user can manage more than one org (STK / Marka / Kulüp). This provider
 * resolves the ACTIVE org and keeps it stable across in-panel navigation.
 *
 * Resolution priority:
 *   1. URL query (?id=&type=)             — deep links / clicks from /admin
 *   2. localStorage 'activeAdminEntity'   — persisted across navigation
 *   3. managed*Id fast-path (users/{uid}) — single-org fast path
 *   4. adminUserId fallback queries       — covers users without managed*Id link
 *
 * The display `type` strings ('STK' | 'Marka' | 'Kulüp') are kept on the URL and
 * in localStorage for compatibility with the dashboard's existing ?type handling.
 * Internally we also expose the canonical `kind` ('ngo' | 'brand' | 'club') used
 * by the per-type menus.
 *
 * SAFETY: single-org admins are unaffected — when no URL/localStorage context is
 * present we fall back to the same managed*Id / adminUserId resolution the panel
 * used before, so the active kind (and therefore the menu) is identical.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { collection, doc, query, where } from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

export type EntityKind = 'ngo' | 'brand' | 'club';
export type EntityType = 'STK' | 'Marka' | 'Kulüp';

const STORAGE_KEY = 'activeAdminEntity';

export type ManagedOrg = {
  id: string;
  kind: EntityKind;
  type: EntityType;
  /** Spesifik alt tip (ör. Dernek / Vakıf / Spor Kulübü / Özel İzinli). */
  subType?: string;
  name: string;
  logoUrl?: string;
};

/** Türkçe iyelik biçimleri — tipe göre hitap için (Derneğin, Vakfın, ...). */
const POSSESSIVE: Record<string, string> = {
  'Dernek': 'Derneğin',
  'Vakıf': 'Vakfın',
  'Spor Kulübü': 'Spor Kulübünün',
  'Özel İzinli': 'Kuruluşun',
  'Marka': 'Markanın',
  'Öğrenci Kulübü': 'Öğrenci Kulübünün',
  'Kulüp': 'Kulübün',
  'STK': "STK'nın",
};

/** Aktif kurumun gösterilecek tip etiketi — spesifik alt tip varsa onu, yoksa kind varsayılanı. */
export function entityTypeLabel(kind: EntityKind | null, subType?: string | null): string {
  if (subType && subType.trim()) return subType.trim();
  if (kind === 'brand') return 'Marka';
  if (kind === 'club') return 'Öğrenci Kulübü';
  if (kind === 'ngo') return 'STK';
  return 'Kurum';
}

/** Tipe göre Türkçe iyelik (ör. "Derneğin", "Spor Kulübünün", "Markanın"). */
export function entityPossessive(kind: EntityKind | null, subType?: string | null): string {
  const label = entityTypeLabel(kind, subType);
  return POSSESSIVE[label] || `${label}'nın`;
}

type ActiveEntityValue = {
  /** Currently active org id, or null while unresolved. */
  id: string | null;
  /** Canonical kind for menu selection. */
  kind: EntityKind | null;
  /** Display type string ('STK' | 'Marka' | 'Kulüp'). */
  type: EntityType | null;
  /** Spesifik alt tip (Dernek/Vakıf/Spor Kulübü/Özel İzinli/Marka/Öğrenci Kulübü). */
  subType: string | null;
  /** All orgs the user manages (for the switcher). */
  managedList: ManagedOrg[];
  isLoading: boolean;
  /** Persist + switch the active org. */
  setActive: (org: { id: string; type: EntityType }) => void;
  /** Append the active ?id&type to an in-panel href, preserving any hash. */
  withEntityParams: (href: string) => string;
};

const KIND_TO_TYPE: Record<EntityKind, EntityType> = {
  ngo: 'STK',
  brand: 'Marka',
  club: 'Kulüp',
};

/** Map URL / storage display type → canonical kind. Accepts the legacy
 *  'Öğrenci Kulübü' value so old deep links keep resolving the Kulüp menu. */
function typeToKind(type: string | null | undefined): EntityKind | null {
  if (type === 'STK') return 'ngo';
  if (type === 'Marka') return 'brand';
  if (type === 'Kulüp' || type === 'Öğrenci Kulübü') return 'club';
  return null;
}

const ActiveEntityContext = createContext<ActiveEntityValue | null>(null);

type UserDocData = {
  id: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
  role?: 'super-admin' | 'ngo-admin' | 'user';
};

type EntityDoc = {
  id: string;
  name?: string;
  avatarUrl?: string;
  logoUrl?: string;
  adminUserId?: string;
  type?: string; // spesifik alt tip (Dernek/Vakıf/Spor Kulübü/Özel İzinli)
};

export function ActiveEntityProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // --- 1) URL params — Next.js usePathname/useSearchParams ensures we re-read
  // on every route change (router.push, link clicks, deep links, popstate).
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSelection = useMemo<{ id: string; type: EntityType } | null>(() => {
    const id = searchParams?.get('id') ?? null;
    const type = searchParams?.get('type') ?? null;
    const kind = typeToKind(type);
    if (id && kind) return { id, type: KIND_TO_TYPE[kind] };
    return null;
  }, [pathname, searchParams]);

  // --- 2) localStorage persisted selection ---
  const [storedSelection, setStoredSelection] = useState<{ id: string; type: EntityType } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { id?: unknown; type?: unknown };
      const id = typeof parsed.id === 'string' ? parsed.id : null;
      const kind = typeof parsed.type === 'string' ? typeToKind(parsed.type) : null;
      if (id && kind) setStoredSelection({ id, type: KIND_TO_TYPE[kind] });
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist the URL selection so it survives in-panel navigation that drops params.
  useEffect(() => {
    if (typeof window === 'undefined' || !urlSelection) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(urlSelection));
    } catch {
      // ignore quota / disabled storage
    }
    setStoredSelection(urlSelection);
  }, [urlSelection]);

  // --- 3 & 4) managed*Id fast-path + adminUserId fallback (also feeds the switcher) ---
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData, isLoading: userDocLoading } = useDoc<UserDocData>(userDocRef);

  const adminNgosQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid
        ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid
        ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () =>
      firestore && authUser?.uid
        ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid))
        : null,
    [firestore, authUser?.uid],
  );

  const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityDoc>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityDoc>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityDoc>(adminClubsQ);

  // managed*Id fallback docs (covers users whose adminUserId query misses, e.g.
  // a super-admin assignment that only wrote users/{uid}.managed*Id).
  const fallbackNgoRef = useMemoFirebase(
    () => (firestore && userData?.managedNgoId ? doc(firestore, COLLECTIONS.ngos, userData.managedNgoId) : null),
    [firestore, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (firestore && userData?.managedBrandId ? doc(firestore, COLLECTIONS.brands, userData.managedBrandId) : null),
    [firestore, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (firestore && userData?.managedClubId ? doc(firestore, COLLECTIONS.clubs, userData.managedClubId) : null),
    [firestore, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<EntityDoc>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<EntityDoc>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<EntityDoc>(fallbackClubRef);

  const managedList = useMemo<ManagedOrg[]>(() => {
    const list: ManagedOrg[] = [];
    const seen = new Set<string>();
    const push = (kind: EntityKind, e: EntityDoc | null | undefined) => {
      if (!e?.id) return;
      const key = `${kind}:${e.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({
        id: e.id,
        kind,
        type: KIND_TO_TYPE[kind],
        subType: e.type,
        name: e.name || KIND_TO_TYPE[kind],
        logoUrl: e.avatarUrl || e.logoUrl,
      });
    };
    (adminNgos || []).forEach((n) => push('ngo', n));
    (adminBrands || []).forEach((b) => push('brand', b));
    (adminClubs || []).forEach((c) => push('club', c));
    push('ngo', fallbackNgo);
    push('brand', fallbackBrand);
    push('club', fallbackClub);
    return list;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub]);

  // Fallback kind from managed*Id fast-path, then adminUserId scans (preserves
  // the previous single-org panel behavior exactly).
  const fallbackKind = useMemo<EntityKind | null>(() => {
    if (userData?.managedNgoId) return 'ngo';
    if (userData?.managedBrandId) return 'brand';
    if (userData?.managedClubId) return 'club';
    if (adminNgos && adminNgos.length > 0) return 'ngo';
    if (adminBrands && adminBrands.length > 0) return 'brand';
    if (adminClubs && adminClubs.length > 0) return 'club';
    return null;
  }, [
    userData?.managedNgoId,
    userData?.managedBrandId,
    userData?.managedClubId,
    adminNgos,
    adminBrands,
    adminClubs,
  ]);

  const fallbackId = useMemo<string | null>(() => {
    if (!fallbackKind) return null;
    const match = managedList.find((o) => o.kind === fallbackKind);
    return match?.id ?? null;
  }, [fallbackKind, managedList]);

  // Resolve active org by priority. The URL/storage selection is only trusted if
  // it points at an org the user actually manages (once the list has loaded);
  // otherwise we fall back, which keeps single-org admins safe.
  const selection = urlSelection || storedSelection;

  const isSuperAdmin = userData?.role === 'super-admin';

  const active = useMemo<{ id: string | null; kind: EntityKind | null; type: EntityType | null }>(() => {
    if (selection) {
      const selKind = typeToKind(selection.type);
      const inList = managedList.some((o) => o.id === selection.id && o.kind === selKind);
      // Trust the selection if it's in the managed list, OR if the list hasn't
      // resolved yet, OR the user is super-admin (can view any entity).
      const listResolved = managedList.length > 0;
      if (selKind && (inList || !listResolved || isSuperAdmin)) {
        return { id: selection.id, kind: selKind, type: KIND_TO_TYPE[selKind] };
      }
    }
    if (fallbackKind) {
      return { id: fallbackId, kind: fallbackKind, type: KIND_TO_TYPE[fallbackKind] };
    }
    return { id: null, kind: null, type: null };
  }, [selection, managedList, fallbackKind, fallbackId, isSuperAdmin]);

  const isLoading =
    isUserLoading || userDocLoading || ngosLoading || brandsLoading || clubsLoading;

  const setActive = useCallback((org: { id: string; type: EntityType }) => {
    const kind = typeToKind(org.type);
    if (!kind) return;
    const normalized = { id: org.id, type: KIND_TO_TYPE[kind] };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore
      }
    }
    setStoredSelection(normalized);
    // KRİTİK: URL ?id/type ÖNCELİKLİ (selection = urlSelection || storedSelection).
    // URL'i de güncellemezsek eski ?id seçimi ezer ve üstteki kurum değişmez.
    try {
      const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
      params.set('id', normalized.id);
      params.set('type', normalized.type);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } catch {
      // ignore — localStorage fallback yine de geçerli
    }
  }, [router, pathname, searchParams]);

  const withEntityParams = useCallback(
    (href: string) => {
      if (!active.id || !active.type) return href;
      const [path, hash] = href.split('#');
      const [base, existingQuery] = path.split('?');
      const params = new URLSearchParams(existingQuery || '');
      params.set('id', active.id);
      params.set('type', active.type);
      const qs = params.toString();
      return `${base}${qs ? `?${qs}` : ''}${hash ? `#${hash}` : ''}`;
    },
    [active.id, active.type],
  );

  // Aktif kurumun spesifik alt tipi (managedList'ten; yoksa null → kind varsayılanı kullanılır).
  const activeSubType = useMemo<string | null>(() => {
    if (!active.id || !active.kind) return null;
    return managedList.find((o) => o.id === active.id && o.kind === active.kind)?.subType ?? null;
  }, [active.id, active.kind, managedList]);

  const value = useMemo<ActiveEntityValue>(
    () => ({
      id: active.id,
      kind: active.kind,
      type: active.type,
      subType: activeSubType,
      managedList,
      isLoading,
      setActive,
      withEntityParams,
    }),
    [active.id, active.kind, active.type, activeSubType, managedList, isLoading, setActive, withEntityParams],
  );

  return <ActiveEntityContext.Provider value={value}>{children}</ActiveEntityContext.Provider>;
}

export function useActiveEntity(): ActiveEntityValue {
  const ctx = useContext(ActiveEntityContext);
  if (!ctx) {
    throw new Error('useActiveEntity must be used within an ActiveEntityProvider');
  }
  return ctx;
}

/**
 * Aktif kurumun Firestore dokümanını çeker — iç sayfalar bunu kullanır.
 *
 * Eski pattern (her sayfada manuel adminUserId/managedNgoId resolution +
 * `[0]` alma) çoklu kurum sahibi adminlerde HEP ilk kurumu döndürüyordu. Bu
 * hook tek kaynaktan (ActiveEntityProvider) gelen id/kind'e bağlanır, böylece
 * banner'da görünen kurum ile sayfa verisi her zaman aynı.
 *
 * Dönüş şekli `useDoc` ile aynıdır: `{ data, isLoading, error }`.
 */
export function useActiveEntityDoc<T = EntityDoc>() {
  const firestore = useFirestore();
  const { id, kind } = useActiveEntity();
  const colName =
    kind === 'ngo'
      ? COLLECTIONS.ngos
      : kind === 'brand'
        ? COLLECTIONS.brands
        : kind === 'club'
          ? COLLECTIONS.clubs
          : null;
  const docRef = useMemoFirebase(
    () => (firestore && id && colName ? doc(firestore, colName, id) : null),
    [firestore, id, colName],
  );
  return useDoc<T>(docRef);
}
