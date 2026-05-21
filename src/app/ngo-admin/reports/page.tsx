'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';
import { Loader2, BarChart3, ShieldAlert } from 'lucide-react';
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type EntityKind = 'ngo' | 'brand' | 'club';

interface EntityDoc {
  id: string;
  name?: string;
  adminUserId?: string;
}
interface UserDocData {
  id: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
  supportedNgos?: string[];
  volunteerNgos?: string[];
  followedBrands?: string[];
}
interface DonationDoc {
  id?: string;
  ngoIds?: string[];
  ngoId?: string;
  brandId?: string;
  brandName?: string;
  userId?: string;
  donationAmount?: string | number;
  amount?: string | number;
  ngoShare?: number;
  date?: string;
}
interface MonthlyEarning {
  id: string;
  month: string;
  amount: number;
  status: string;
}
interface OpportunityDoc {
  id?: string;
  title?: string;
  status?: string;
  volunteerCount?: { applications?: number };
}

const fmtTRY = (n: number) => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const EmptyState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
    <p className="text-muted-foreground font-medium">{message || 'Henüz veri yok'}</p>
    <p className="text-sm text-muted-foreground/70 mt-1">İlgili faaliyetler oluştukça raporlar burada görünür.</p>
  </div>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-muted/50 p-5 text-center">
    <p className="text-2xl font-black">{value}</p>
    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">{label}</p>
  </div>
);

export default function ReportsPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // ---- Resolve managed entity (NGO / brand / club) — same pattern as posts/demographics/impact-story ----
  const adminNgosQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityDoc>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityDoc>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityDoc>(adminClubsQ);

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(userDocRef);

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

  const activeEntity = useMemo<{ kind: EntityKind; id: string; name: string } | null>(() => {
    const ngo = (adminNgos && adminNgos[0]) || fallbackNgo;
    if (ngo?.id) return { kind: 'ngo', id: ngo.id, name: ngo.name || 'STK' };
    const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
    if (brand?.id) return { kind: 'brand', id: brand.id, name: brand.name || 'Marka' };
    const club = (adminClubs && adminClubs[0]) || fallbackClub;
    if (club?.id) return { kind: 'club', id: club.id, name: club.name || 'Kulüp' };
    return null;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub]);

  // ---- Real data sources ----
  const donationsQuery = useMemoFirebase(() => (firestore ? collection(firestore, COLLECTIONS.donations) : null), [firestore]);
  const { data: allDonations } = useCollection<DonationDoc>(donationsQuery);

  const earningsQuery = useMemoFirebase(
    () => (firestore && activeEntity?.id ? query(collection(firestore, COLLECTIONS.monthlyEarnings), where('ngoId', '==', activeEntity.id), orderBy('month', 'desc')) : null),
    [firestore, activeEntity?.id],
  );
  const { data: monthlyEarnings } = useCollection<MonthlyEarning>(earningsQuery);

  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, COLLECTIONS.users) : null), [firestore]);
  const { data: allUsers } = useCollection<UserDocData>(usersQuery);

  const volunteeringQuery = useMemoFirebase(
    () => (firestore && activeEntity?.kind === 'ngo' ? query(collection(firestore, COLLECTIONS.volunteering), where('ngoId', '==', activeEntity.id)) : null),
    [firestore, activeEntity?.kind, activeEntity?.id],
  );
  const { data: opportunities } = useCollection<OpportunityDoc>(volunteeringQuery);

  const postsQuery = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.posts), where('authorId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const { data: posts } = useCollection<{ id?: string }>(postsQuery);

  const transparencyQuery = useMemoFirebase(
    () => (firestore && activeEntity?.kind === 'ngo' ? query(collection(firestore, COLLECTIONS.transparency), where('ngoId', '==', activeEntity.id)) : null),
    [firestore, activeEntity?.kind, activeEntity?.id],
  );
  const { data: transparencyItems } = useCollection<{ id?: string }>(transparencyQuery);

  // ---- Finansal: real donations matched to this entity (same logic as impact-story) ----
  const financial = useMemo(() => {
    const id = activeEntity?.id;
    if (!id) return { totalShare: 0, totalCount: 0, average: 0, byBrand: [] as { name: string; Bağış: number }[] };
    const matching = (allDonations || []).filter((d) => {
      if (Array.isArray(d.ngoIds) && d.ngoIds.includes(id)) return true;
      if (d.ngoId === id) return true;
      if (activeEntity?.kind === 'brand' && (d.brandId === id || d.brandName === activeEntity.name)) return true;
      return false;
    });
    const share = (d: DonationDoc) => {
      if (typeof d.ngoShare === 'number') return d.ngoShare;
      const amt = parseFloat(String(d.donationAmount ?? d.amount ?? '0'));
      return isNaN(amt) ? 0 : amt;
    };
    const totalShare = matching.reduce((s, d) => s + share(d), 0);
    const byBrandMap: Record<string, number> = {};
    matching.forEach((d) => {
      const name = d.brandName || 'Diğer';
      byBrandMap[name] = (byBrandMap[name] || 0) + share(d);
    });
    const byBrand = Object.entries(byBrandMap)
      .map(([name, value]) => ({ name, Bağış: value }))
      .sort((a, b) => b.Bağış - a.Bağış);
    return {
      totalShare,
      totalCount: matching.length,
      average: matching.length > 0 ? totalShare / matching.length : 0,
      byBrand,
    };
  }, [activeEntity, allDonations]);

  const earnings = useMemo(() => monthlyEarnings || [], [monthlyEarnings]);

  // ---- Gönüllülük: real supporter/volunteer/application counts ----
  const volunteerStats = useMemo(() => {
    const id = activeEntity?.id;
    if (!id) return { volunteers: 0, supporters: 0, openOpportunities: 0, totalOpportunities: 0, totalApplications: 0, byOpportunity: [] as { name: string; Başvuru: number }[] };
    const supporters = (allUsers || []).filter((u) => {
      if (activeEntity?.kind === 'ngo') {
        return (Array.isArray(u.supportedNgos) && u.supportedNgos.includes(id))
          || (Array.isArray(u.volunteerNgos) && u.volunteerNgos.includes(id));
      }
      if (activeEntity?.kind === 'brand') {
        return Array.isArray(u.followedBrands) && u.followedBrands.includes(id);
      }
      return false;
    }).length;
    const volunteers = (allUsers || []).filter((u) => Array.isArray(u.volunteerNgos) && u.volunteerNgos.includes(id)).length;
    const opps = opportunities || [];
    const openOpportunities = opps.filter((o) => o.status === 'Aktif' || o.status === 'Yayında').length;
    const totalApplications = opps.reduce((s, o) => s + (o.volunteerCount?.applications || 0), 0);
    const byOpportunity = opps
      .map((o) => ({ name: o.title || 'İlan', Başvuru: o.volunteerCount?.applications || 0 }))
      .filter((o) => o.Başvuru > 0)
      .sort((a, b) => b.Başvuru - a.Başvuru);
    return { volunteers, supporters, openOpportunities, totalOpportunities: opps.length, totalApplications, byOpportunity };
  }, [activeEntity, allUsers, opportunities]);

  // ---- Sosyal Etki: real activity-derived impact metrics ----
  const impactStats = useMemo(() => ({
    postsCount: (posts || []).length,
    transparencyCount: (transparencyItems || []).length,
    opportunitiesCount: (opportunities || []).length,
  }), [posts, transparencyItems, opportunities]);

  const initialLoading = ngosLoading || brandsLoading || clubsLoading;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeEntity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground">Kuruluşunuzun faaliyetleri, finansalları ve etkisiyle ilgili tüm raporlara buradan erişin.</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Yönetici olduğunuz bir varlık bulunamadı.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Lütfen sistem yöneticinize danışın.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entityTypeLabel = activeEntity.kind === 'ngo' ? 'STK' : activeEntity.kind === 'brand' ? 'Marka' : 'Kulüp';
  const hasFinancial = financial.totalCount > 0 || earnings.length > 0;
  const hasVolunteer = volunteerStats.supporters > 0 || volunteerStats.totalOpportunities > 0 || volunteerStats.totalApplications > 0;
  const hasImpact = impactStats.postsCount > 0 || impactStats.transparencyCount > 0 || impactStats.opportunitiesCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{activeEntity.name}</span>
          <span className="mx-2 text-muted-foreground/40">·</span>
          <span className="text-xs uppercase tracking-widest font-bold">{entityTypeLabel}</span>
        </p>
      </div>

      <Tabs defaultValue="Finansal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Finansal">Finansal</TabsTrigger>
          <TabsTrigger value="Gönüllülük">Gönüllülük</TabsTrigger>
          <TabsTrigger value="Sosyal Etki">Sosyal Etki</TabsTrigger>
        </TabsList>

        <TabsContent value="Finansal" className="mt-6 space-y-6">
          {!hasFinancial ? (
            <Card><CardContent className="py-4"><EmptyState message="Henüz finansal veri yok" /></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Genel Finansal Özet</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label={activeEntity.kind === 'brand' ? 'Toplam Bağış' : 'Toplam STK Payı'} value={fmtTRY(financial.totalShare)} />
                  <StatCard label="Toplam İşlem Sayısı" value={String(financial.totalCount)} />
                  <StatCard label="Ortalama Bağış Tutarı" value={fmtTRY(financial.average)} />
                </CardContent>
              </Card>

              {financial.byBrand.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Markalara Göre Bağış Dağılımı</CardTitle>
                    <CardDescription>Bağışların kaynağına göre dağılımı.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financial.byBrand}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => fmtTRY(value)} />
                        <Legend />
                        <Bar dataKey="Bağış" fill="#f34723" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {earnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Aylık Hak Edişler</CardTitle>
                    <CardDescription>Kesinleşmiş ve tahmini aylık hak edişleriniz.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-semibold">{earning.month}</p>
                          <p className="text-xs text-muted-foreground">{earning.status} Hak Ediş</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{fmtTRY(earning.amount || 0)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="Gönüllülük" className="mt-6 space-y-6">
          {activeEntity.kind !== 'ngo' ? (
            <Card><CardContent className="py-4"><EmptyState message="Gönüllülük raporları yalnızca STK hesapları içindir" /></CardContent></Card>
          ) : !hasVolunteer ? (
            <Card><CardContent className="py-4"><EmptyState message="Henüz gönüllülük verisi yok" /></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Genel Gönüllülük Özeti</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Destekçi" value={String(volunteerStats.supporters)} />
                  <StatCard label="Gönüllü" value={String(volunteerStats.volunteers)} />
                  <StatCard label="Aktif İlan" value={String(volunteerStats.openOpportunities)} />
                  <StatCard label="Toplam Başvuru" value={String(volunteerStats.totalApplications)} />
                </CardContent>
              </Card>

              {volunteerStats.byOpportunity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>İlana Göre Başvuru Dağılımı</CardTitle>
                    <CardDescription>Gönüllülük ilanlarınıza gelen başvuru sayıları.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart layout="vertical" data={volunteerStats.byOpportunity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Başvuru" fill="#f34723" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="Sosyal Etki" className="mt-6 space-y-6">
          {!hasImpact ? (
            <Card><CardContent className="py-4"><EmptyState message="Henüz sosyal etki verisi yok" /></CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Faaliyet Özeti</CardTitle>
                <CardDescription>Kuruluşunuzun platform üzerindeki etki faaliyetleri.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Paylaşım" value={String(impactStats.postsCount)} />
                {activeEntity.kind === 'ngo' && <StatCard label="Şeffaflık Kaydı" value={String(impactStats.transparencyCount)} />}
                {activeEntity.kind === 'ngo' && <StatCard label="Gönüllülük İlanı" value={String(impactStats.opportunitiesCount)} />}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
