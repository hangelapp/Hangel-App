'use client';
import React, { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Building2, Store, School, Heart, Leaf, ShoppingBag, PlusCircle, Loader2, type LucideProps } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, documentId, getDocs, query, where, doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

const statusVariantMap = {
    'approved': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
};

const iconMap: { [key: string]: ComponentType<LucideProps> } = {
    'heart': Heart,
    'leaf': Leaf,
    'school': School,
    'shopping-bag': ShoppingBag,
    'store': Store
};

type ManagedNgoDoc = {
  id: string;
  name?: string;
  avatarUrl?: string;
  logoUrl?: string;
  status?: string;
};

type ManagedBrandDoc = {
  id: string;
  name?: string;
  logoUrl?: string;
  status?: string;
};

type ManagedClubDoc = {
  id: string;
  name?: string;
  avatarUrl?: string;
  logoUrl?: string;
  status?: string;
};

type UserDoc = {
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
};

type ManagedEntity = {
  id: string;
  name: string;
  type: 'STK' | 'Marka' | 'Kulüp';
  icon: string;
  href: string;
  logoUrl?: string;
  status: 'approved' | 'pending';
  role?: string; // Yetki başlığı (Genel Yönetici, Marka Yöneticisi, vb.)
};

type InvitationDoc = {
  id: string;
  brandId?: string;
  ngoId?: string;
  clubId?: string;
  role?: string;
  status?: string;
  inviteeUserId?: string;
};

// Persisted active org for the ngo-admin panel (read by active-entity-context).
const ACTIVE_ENTITY_STORAGE_KEY = 'activeAdminEntity';

export default function AdminPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { t } = useTranslation();

  // Kullanıcının yönettiği varlıkları Firestore'dan bul
  const ngosQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);
  const brandsQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);
  const clubsQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);

  const { data: managedNgos, isLoading: ngosLoading } = useCollection<ManagedNgoDoc>(ngosQ);
  const { data: managedBrands, isLoading: brandsLoading } = useCollection<ManagedBrandDoc>(brandsQ);
  const { data: managedClubs, isLoading: clubsLoading } = useCollection<ManagedClubDoc>(clubsQ);

  // User doc — fallback için: super-admin atadığında users/{uid}.managedNgoId vs.
  // de yazılıyor. adminUserId query'si herhangi bir nedenle eşleşmezse,
  // bu field'lardan direkt fetch ederek varlığı yine de gösteriyoruz.
  const userDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDoc>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (db && userData?.managedNgoId ? doc(db, COLLECTIONS.ngos, userData.managedNgoId) : null),
    [db, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (db && userData?.managedBrandId ? doc(db, COLLECTIONS.brands, userData.managedBrandId) : null),
    [db, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (db && userData?.managedClubId ? doc(db, COLLECTIONS.clubs, userData.managedClubId) : null),
    [db, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<ManagedNgoDoc>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<ManagedBrandDoc>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<ManagedClubDoc>(fallbackClubRef);

  // Tüm yetkilendirmeleri çek: userInvitations'da inviteeUserId=uid.
  // Status filter (status='accepted') CLIENT-SIDE yapılır — Firestore çift
  // where ile composite index gerektirir, deploy edilmemiş durumda sessiz
  // boş döner. Single-equality (inviteeUserId) auto-index ile çalışır,
  // client'ta status != 'revoked' filtresi uygulanır.
  // Bir kullanıcı birden fazla marka/STK'ya yetkili olabilir; user doc'unda
  // tek managedXId var, son atanan kazanır — bu audit trail ile hepsini buluyoruz.
  const invitationsQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(
      collection(db, COLLECTIONS.userInvitations),
      where('inviteeUserId', '==', authUser.uid),
    );
  }, [db, authUser?.uid]);
  const { data: invitationsRaw } = useCollection<InvitationDoc>(invitationsQ);
  // Client-side filter: 'accepted' veya status alanı olmayan kayıtlar dahil;
  // 'revoked' / 'pending' (henüz onaylanmamış davet) hariç.
  const invitations = useMemo(
    () => (invitationsRaw || []).filter(i => i.status !== 'revoked' && i.status !== 'pending'),
    [invitationsRaw],
  );

  // Davetlerdeki entity ID'lerini topla (tip başına unique, SINIRSIZ — eskiden
  // slice(0, 10) vardı; Firestore documentId() IN 10-limit yüzünden. Aşağıda
  // chunked fetch ile bu kısıt kalktı: kullanıcı kaç entity'ye yetkili olursa
  // olsun tümü listelenir).
  const invitedBrandIds = useMemo(
    () => Array.from(new Set((invitations || []).map(i => i.brandId).filter((x): x is string => !!x))),
    [invitations],
  );
  const invitedNgoIds = useMemo(
    () => Array.from(new Set((invitations || []).map(i => i.ngoId).filter((x): x is string => !!x))),
    [invitations],
  );
  const invitedClubIds = useMemo(
    () => Array.from(new Set((invitations || []).map(i => i.clubId).filter((x): x is string => !!x))),
    [invitations],
  );

  // Chunked batch fetch: Firestore `documentId() IN` 10-limit. ID listesini
  // 10'arlık parçalara böl, Promise.all ile paralel sorgular, sonuçları
  // birleştir. ID listesi değişince state sıfırlanır + yeniden fetch.
  const [invitedBrandsData, setInvitedBrandsData] = useState<ManagedBrandDoc[]>([]);
  const [invitedNgosData, setInvitedNgosData] = useState<ManagedNgoDoc[]>([]);
  const [invitedClubsData, setInvitedClubsData] = useState<ManagedClubDoc[]>([]);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    const chunkFetch = async <T extends { id: string }>(
      ids: string[],
      collName: string,
    ): Promise<T[]> => {
      if (ids.length === 0) return [];
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
      const results = await Promise.all(
        chunks.map(c =>
          getDocs(query(collection(db, collName), where(documentId(), 'in', c)))
            .then(snap => snap.docs.map(d => ({ ...(d.data() as Omit<T, 'id'>), id: d.id } as T)))
            .catch(err => { console.warn(`[admin] ${collName} chunk fetch failed:`, err); return [] as T[]; }),
        ),
      );
      return results.flat();
    };
    (async () => {
      const [b, n, c] = await Promise.all([
        chunkFetch<ManagedBrandDoc>(invitedBrandIds, COLLECTIONS.brands),
        chunkFetch<ManagedNgoDoc>(invitedNgoIds, COLLECTIONS.ngos),
        chunkFetch<ManagedClubDoc>(invitedClubIds, COLLECTIONS.clubs),
      ]);
      if (cancelled) return;
      setInvitedBrandsData(b);
      setInvitedNgosData(n);
      setInvitedClubsData(c);
    })();
    return () => { cancelled = true; };
  }, [db, invitedBrandIds, invitedNgoIds, invitedClubIds]);

  // Davet → rol eşlemesi (her entity için role badge göstermek için).
  const roleByEntityId = useMemo(() => {
    const map: Record<string, string> = {};
    (invitations || []).forEach(i => {
      if (i.brandId && i.role) map[`brand:${i.brandId}`] = i.role;
      if (i.ngoId && i.role) map[`ngo:${i.ngoId}`] = i.role;
      if (i.clubId && i.role) map[`club:${i.clubId}`] = i.role;
    });
    return map;
  }, [invitations]);

  const isLoading = ngosLoading || brandsLoading || clubsLoading;

  const managedItems: ManagedEntity[] = useMemo(() => {
    const items: ManagedEntity[] = [];
    const seen = new Set<string>();
    const pushNgo = (n: ManagedNgoDoc | null | undefined) => {
      if (!n || seen.has(`ngo:${n.id}`)) return;
      seen.add(`ngo:${n.id}`);
      items.push({
        id: n.id,
        name: n.name || t('ngoAdminLanding.fallbackNgoName'),
        type: 'STK',
        icon: 'heart',
        href: `/ngo-admin/dashboard?id=${encodeURIComponent(n.id)}&type=${encodeURIComponent('STK')}`,
        logoUrl: n.avatarUrl || n.logoUrl,
        status: (n.status === 'Pasif' || n.status === 'Beklemede') ? 'pending' : 'approved',
        role: roleByEntityId[`ngo:${n.id}`],
      });
    };
    const pushBrand = (b: ManagedBrandDoc | null | undefined) => {
      if (!b || seen.has(`brand:${b.id}`)) return;
      seen.add(`brand:${b.id}`);
      items.push({
        id: b.id,
        name: b.name || t('ngoAdminLanding.fallbackBrandName'),
        type: 'Marka',
        icon: 'shopping-bag',
        href: `/ngo-admin/dashboard?id=${encodeURIComponent(b.id)}&type=${encodeURIComponent('Marka')}`,
        logoUrl: b.logoUrl,
        status: (b.status === 'Pasif' || b.status === 'Beklemede') ? 'pending' : 'approved',
        role: roleByEntityId[`brand:${b.id}`],
      });
    };
    const pushClub = (c: ManagedClubDoc | null | undefined) => {
      if (!c || seen.has(`club:${c.id}`)) return;
      seen.add(`club:${c.id}`);
      items.push({
        id: c.id,
        name: c.name || t('ngoAdminLanding.fallbackClubName'),
        type: 'Kulüp',
        icon: 'school',
        href: `/ngo-admin/dashboard?id=${encodeURIComponent(c.id)}&type=${encodeURIComponent('Kulüp')}`,
        logoUrl: c.avatarUrl || c.logoUrl,
        status: (c.status === 'Pasif' || c.status === 'Beklemede') ? 'pending' : 'approved',
        role: roleByEntityId[`club:${c.id}`],
      });
    };

    (managedNgos || []).forEach(pushNgo);
    (managedBrands || []).forEach(pushBrand);
    (managedClubs || []).forEach(pushClub);

    // Fallback: user doc'daki managed*Id field'larından eklenmemişleri ekle
    if (fallbackNgo) pushNgo(fallbackNgo);
    if (fallbackBrand) pushBrand(fallbackBrand);
    if (fallbackClub) pushClub(fallbackClub);

    // userInvitations'tan gelen TÜM yetkilendirmeler (multi-brand/multi-ngo desteği)
    (invitedNgosData || []).forEach(pushNgo);
    (invitedBrandsData || []).forEach(pushBrand);
    (invitedClubsData || []).forEach(pushClub);

    return items;
  }, [managedNgos, managedBrands, managedClubs, fallbackNgo, fallbackBrand, fallbackClub, invitedNgosData, invitedBrandsData, invitedClubsData, roleByEntityId, t]);

  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12 p-3 sm:p-4 md:p-6">
      <div className="space-y-1 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">{t('ngoAdminLanding.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('ngoAdminLanding.subtitle')}</p>
      </div>

      {showDebug && (
        <Card className="bg-amber-50 border-amber-300/40 dark:bg-amber-900/20 dark:border-amber-800/40 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">DEBUG — /admin tanılama (?debug=1)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
{JSON.stringify({
  authUserUid: authUser?.uid || '(null)',
  userDoc: userData ? { managedNgoId: userData.managedNgoId, managedBrandId: userData.managedBrandId, managedClubId: userData.managedClubId } : '(loading)',
  managedViaAdminUserId: { ngos: (managedNgos || []).map(n => n.id), brands: (managedBrands || []).map(b => b.id), clubs: (managedClubs || []).map(c => c.id) },
  fallback: { ngo: fallbackNgo?.id || null, brand: fallbackBrand?.id || null, club: fallbackClub?.id || null },
  invitationsRaw: { count: invitationsRaw?.length ?? 0, sample: (invitationsRaw || []).slice(0, 10).map(i => ({ id: i.id, brandId: i.brandId, ngoId: i.ngoId, clubId: i.clubId, status: i.status, role: i.role })) },
  invitationsFiltered: invitations.length,
  extractedIds: { brand: invitedBrandIds, ngo: invitedNgoIds, club: invitedClubIds },
  chunkedFetchResults: { brands: invitedBrandsData.length, ngos: invitedNgosData.length, clubs: invitedClubsData.length },
  finalManagedItemsCount: managedItems.length,
  loadingStates: { ngos: ngosLoading, brands: brandsLoading, clubs: clubsLoading, isLoading },
}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-border rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/20 p-5 sm:p-8 border-b border-border">
            <CardTitle className="text-xl font-bold">{t('ngoAdminLanding.managedTitle')}</CardTitle>
            <CardDescription>{t('ngoAdminLanding.managedDesc')}</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : managedItems.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2 px-6">
              <Building2 className="h-10 w-10 mx-auto opacity-30" />
              <p className="font-medium">{t('ngoAdminLanding.emptyTitle')}</p>
              <p className="text-xs">{t('ngoAdminLanding.emptyDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
            {managedItems.map((item) => {
                const Icon = iconMap[item.icon] || Building2;
                return (
                <Link
                    href={item.href}
                    key={item.id}
                    className="block hover:bg-muted/30 transition-all group"
                    onClick={() => {
                        try {
                            window.localStorage.setItem(
                                ACTIVE_ENTITY_STORAGE_KEY,
                                JSON.stringify({ id: item.id, type: item.type }),
                            );
                        } catch {
                            // localStorage unavailable (private mode / quota) — URL params still carry the org
                        }
                    }}
                >
                    <div className="flex items-center p-4 sm:p-6">
                        <div className="relative mr-4 sm:mr-6 shrink-0">
                            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-background shadow-md bg-card">
                                <AvatarImage src={item.logoUrl} alt={item.name} className="object-contain p-1" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{item.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 p-1.5 bg-background rounded-lg shadow-md border border-border">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="font-bold text-base sm:text-lg text-foreground break-words group-hover:text-primary transition-colors">{item.name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs font-black uppercase tracking-widest bg-muted border-none text-muted-foreground">{item.type}</Badge>
                                <Badge variant="outline" className={cn("text-xs font-black uppercase tracking-widest px-2 py-0.5", statusVariantMap[item.status as keyof typeof statusVariantMap])}>
                                    {item.status === 'approved' ? t('ngoAdminLanding.statusActive') : t('ngoAdminLanding.statusPending')}
                                </Badge>
                                {item.role && (
                                    <Badge variant="outline" className="text-xs font-black uppercase tracking-widest bg-primary/5 border-primary/20 text-primary">
                                        {item.role}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 pl-3">
                            <span className="hidden sm:inline text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{t('ngoAdminLanding.manageBtn')}</span>
                            <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                </Link>
            )})}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20 rounded-3xl p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold">{t('ngoAdminLanding.addEntityTitle')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">{t('ngoAdminLanding.addEntityDesc')}</p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8 sm:px-10 h-14 font-bold shadow-md shadow-primary/20">
              <Link href="/login/selection?action=register&type=corporate">{t('ngoAdminLanding.addEntityCta')}</Link>
          </Button>
      </Card>
    </div>
  );
}
