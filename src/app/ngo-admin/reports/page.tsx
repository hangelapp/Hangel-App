'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';
import { Loader2, BarChart3, ShieldAlert } from 'lucide-react';
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';

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

const EmptyState = ({ message, hint }: { message?: string; hint?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
    <p className="text-muted-foreground font-medium">{message}</p>
    {hint ? <p className="text-sm text-muted-foreground/70 mt-1">{hint}</p> : null}
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
  const { t } = useTranslation();

  // Aktif kuruluş (ActiveEntityProvider) — banner ve rapor içeriği tek kaynak.
  const { id: activeIdFromCtx, kind: activeKind, isLoading: activeLoading } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();
  const ngosLoading = activeLoading;
  const brandsLoading = activeLoading;
  const clubsLoading = activeLoading;

  const activeEntity = useMemo<{ kind: EntityKind; id: string; name: string } | null>(() => {
    if (!activeIdFromCtx || !activeKind || !activeDoc) return null;
    const labels: Record<EntityKind, string> = {
      ngo: t('ngo_admin_reports.entityKindNgo'),
      brand: t('ngo_admin_reports.entityKindBrand'),
      club: t('ngo_admin_reports.entityKindClub'),
    };
    return { kind: activeKind, id: activeIdFromCtx, name: activeDoc.name || labels[activeKind] };
  }, [activeIdFromCtx, activeKind, activeDoc, t]);

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
    const otherLabel = t('ngo_admin_reports.otherBrand');
    matching.forEach((d) => {
      const name = d.brandName || otherLabel;
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
  }, [activeEntity, allDonations, t]);

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
    const fallbackName = t('ngo_admin_reports.opportunityDefaultName');
    const byOpportunity = opps
      .map((o) => ({ name: o.title || fallbackName, Başvuru: o.volunteerCount?.applications || 0 }))
      .filter((o) => o.Başvuru > 0)
      .sort((a, b) => b.Başvuru - a.Başvuru);
    return { volunteers, supporters, openOpportunities, totalOpportunities: opps.length, totalApplications, byOpportunity };
  }, [activeEntity, allUsers, opportunities, t]);

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
          <h1 className="text-2xl font-bold">{t('ngo_admin_reports.heading')}</h1>
          <p className="text-muted-foreground">{t('ngo_admin_reports.subheading')}</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">{t('ngo_admin_reports.noManagedEntityTitle')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('ngo_admin_reports.noManagedEntityHint')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entityTypeLabel = activeEntity.kind === 'ngo'
    ? t('ngo_admin_reports.entityKindNgo')
    : activeEntity.kind === 'brand'
      ? t('ngo_admin_reports.entityKindBrand')
      : t('ngo_admin_reports.entityKindClub');
  const hasFinancial = financial.totalCount > 0 || earnings.length > 0;
  const hasVolunteer = volunteerStats.supporters > 0 || volunteerStats.totalOpportunities > 0 || volunteerStats.totalApplications > 0;
  const hasImpact = impactStats.postsCount > 0 || impactStats.transparencyCount > 0 || impactStats.opportunitiesCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('ngo_admin_reports.heading')}</h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{activeEntity.name}</span>
          <span className="mx-2 text-muted-foreground/40">·</span>
          <span className="text-xs uppercase tracking-widest font-bold">{entityTypeLabel}</span>
        </p>
      </div>

      <Tabs defaultValue="Finansal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Finansal">{t('ngo_admin_reports.tabFinancial')}</TabsTrigger>
          <TabsTrigger value="Gönüllülük">{t('ngo_admin_reports.tabVolunteer')}</TabsTrigger>
          <TabsTrigger value="Sosyal Etki">{t('ngo_admin_reports.tabImpact')}</TabsTrigger>
        </TabsList>

        <TabsContent value="Finansal" className="mt-6 space-y-6">
          {!hasFinancial ? (
            <Card><CardContent className="py-4"><EmptyState message={t('ngo_admin_reports.financialEmpty')} hint={t('ngo_admin_reports.emptyHint')} /></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>{t('ngo_admin_reports.financialOverviewTitle')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label={activeEntity.kind === 'brand' ? t('ngo_admin_reports.totalBrandDonation') : t('ngo_admin_reports.totalNgoShare')} value={fmtTRY(financial.totalShare)} />
                  <StatCard label={t('ngo_admin_reports.totalTransactions')} value={String(financial.totalCount)} />
                  <StatCard label={t('ngo_admin_reports.avgDonation')} value={fmtTRY(financial.average)} />
                </CardContent>
              </Card>

              {financial.byBrand.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('ngo_admin_reports.brandChartTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_reports.brandChartDescription')}</CardDescription>
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
                    <CardTitle>{t('ngo_admin_reports.monthlyEarningsTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_reports.monthlyEarningsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-semibold">{earning.month}</p>
                          <p className="text-xs text-muted-foreground">{earning.status} {t('ngo_admin_reports.monthlyEarningsLabel')}</p>
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
            <Card><CardContent className="py-4"><EmptyState message={t('ngo_admin_reports.volunteerNgoOnly')} hint={t('ngo_admin_reports.emptyHint')} /></CardContent></Card>
          ) : !hasVolunteer ? (
            <Card><CardContent className="py-4"><EmptyState message={t('ngo_admin_reports.volunteerEmpty')} hint={t('ngo_admin_reports.emptyHint')} /></CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>{t('ngo_admin_reports.volunteerOverviewTitle')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label={t('ngo_admin_reports.volunteerSupporters')} value={String(volunteerStats.supporters)} />
                  <StatCard label={t('ngo_admin_reports.volunteerVolunteers')} value={String(volunteerStats.volunteers)} />
                  <StatCard label={t('ngo_admin_reports.volunteerOpenOpportunities')} value={String(volunteerStats.openOpportunities)} />
                  <StatCard label={t('ngo_admin_reports.volunteerTotalApplications')} value={String(volunteerStats.totalApplications)} />
                </CardContent>
              </Card>

              {volunteerStats.byOpportunity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('ngo_admin_reports.opportunityChartTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_reports.opportunityChartDescription')}</CardDescription>
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
            <Card><CardContent className="py-4"><EmptyState message={t('ngo_admin_reports.impactEmpty')} hint={t('ngo_admin_reports.emptyHint')} /></CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('ngo_admin_reports.impactOverviewTitle')}</CardTitle>
                <CardDescription>{t('ngo_admin_reports.impactOverviewDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label={t('ngo_admin_reports.impactPosts')} value={String(impactStats.postsCount)} />
                {activeEntity.kind === 'ngo' && <StatCard label={t('ngo_admin_reports.impactTransparency')} value={String(impactStats.transparencyCount)} />}
                {activeEntity.kind === 'ngo' && <StatCard label={t('ngo_admin_reports.impactOpportunities')} value={String(impactStats.opportunitiesCount)} />}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
