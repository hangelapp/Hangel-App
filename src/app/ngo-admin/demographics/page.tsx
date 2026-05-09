'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { Loader2, BarChart3, Users, Building, ShieldAlert } from 'lucide-react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

const COLORS = ['#f34723', '#042654', '#1f1f1f', '#8884d8', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const EmptyChartState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
    <p className="text-muted-foreground font-medium">{message || 'Henüz yeterli veri yok'}</p>
    <p className="text-sm text-muted-foreground/70 mt-1">Bu varlığı destekleyen/gönüllüsü olan kullanıcılar olduğunda grafikler oluşur.</p>
  </div>
);

const computeAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const ageBucket = (age: number): string => {
  if (age < 18) return '< 18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
};

const AGE_ORDER = ['< 18', '18-24', '25-34', '35-44', '45-54', '55+'];

const topN = <T extends { count: number }>(arr: T[], n = 10): T[] =>
  [...arr].sort((a, b) => b.count - a.count).slice(0, n);

type EntityKind = 'ngo' | 'brand' | 'club';
type ManagedEntity = { kind: EntityKind; id: string; name: string };

function DemographicsPageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  useEffect(() => { setIsMounted(true); }, []);

  // 1) Kullanıcının yönettiği varlığı tespit et: önce NGO/Brand/Club query, sonra user doc fallback
  const adminNgosQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'ngos'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'brands'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'clubs'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );

  const { data: adminNgos, isLoading: ngosLoading } = useCollection<any>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<any>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<any>(adminClubsQ);

  // Fallback: user doc'taki managed*Id
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<any>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (firestore && userData?.managedNgoId ? doc(firestore, 'ngos', userData.managedNgoId) : null),
    [firestore, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (firestore && userData?.managedBrandId ? doc(firestore, 'brands', userData.managedBrandId) : null),
    [firestore, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (firestore && userData?.managedClubId ? doc(firestore, 'clubs', userData.managedClubId) : null),
    [firestore, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<any>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<any>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<any>(fallbackClubRef);

  // Yönetici olduğu varlıkları topla (NGO > Brand > Club önceliği)
  const managedEntities = useMemo<ManagedEntity[]>(() => {
    const list: ManagedEntity[] = [];
    const seen = new Set<string>();
    const push = (kind: EntityKind, e: any) => {
      if (!e?.id) return;
      const key = `${kind}:${e.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ kind, id: e.id, name: e.name || (kind === 'ngo' ? 'STK' : kind === 'brand' ? 'Marka' : 'Kulüp') });
    };
    (adminNgos || []).forEach(e => push('ngo', e));
    if (fallbackNgo) push('ngo', fallbackNgo);
    (adminBrands || []).forEach(e => push('brand', e));
    if (fallbackBrand) push('brand', fallbackBrand);
    (adminClubs || []).forEach(e => push('club', e));
    if (fallbackClub) push('club', fallbackClub);
    return list;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub]);

  const activeEntity = managedEntities[0] || null;

  // Tüm kullanıcıları + tüm markaları oku (filtreleme için)
  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: allUsers, isLoading: usersLoading } = useCollection<any>(usersQuery);

  const brandsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'brands') : null), [firestore]);
  const { data: allBrands } = useCollection<any>(brandsQuery);

  const { donors, volunteers, supporters } = useMemo(() => {
    if (!activeEntity || !allUsers) return { donors: [], volunteers: [], supporters: [] };
    const id = activeEntity.id;
    let donors: any[] = [];
    let volunteers: any[] = [];
    if (activeEntity.kind === 'ngo') {
      donors = allUsers.filter(u => Array.isArray(u.supportedNgos) && u.supportedNgos.includes(id));
      volunteers = allUsers.filter(u => Array.isArray(u.volunteerNgos) && u.volunteerNgos.includes(id));
    } else if (activeEntity.kind === 'brand') {
      // Marka için: takip eden kullanıcılar = destekçi/bağışçı (gönüllü kavramı geçerli değil)
      donors = allUsers.filter(u => Array.isArray(u.followedBrands) && u.followedBrands.includes(id));
      volunteers = [];
    } else {
      // Kulüp için: ileride membership eklendiğinde buradan filtrelenecek
      donors = [];
      volunteers = [];
    }
    const supporters = Array.from(new Map([...donors, ...volunteers].map(u => [u.id, u])).values());
    return { donors, volunteers, supporters };
  }, [allUsers, activeEntity]);

  const ageGroupData = useMemo(() => {
    const counts: Record<string, { Gonullu: number; Bagisci: number }> = {};
    AGE_ORDER.forEach(a => { counts[a] = { Gonullu: 0, Bagisci: 0 }; });
    volunteers.forEach(u => {
      const age = computeAge(u.personalInfo?.birthDate);
      if (age != null) counts[ageBucket(age)].Gonullu += 1;
    });
    donors.forEach(u => {
      const age = computeAge(u.personalInfo?.birthDate);
      if (age != null) counts[ageBucket(age)].Bagisci += 1;
    });
    return AGE_ORDER
      .map(age => ({ age, Gonullu: counts[age].Gonullu, Bagisci: counts[age].Bagisci }))
      .filter(d => d.Gonullu > 0 || d.Bagisci > 0);
  }, [volunteers, donors]);

  const cityData = useMemo(() => {
    const counts: Record<string, { Gonullu: number; Bagisci: number }> = {};
    volunteers.forEach(u => {
      const c = u.personalInfo?.address?.city;
      if (!c) return;
      counts[c] = counts[c] || { Gonullu: 0, Bagisci: 0 };
      counts[c].Gonullu += 1;
    });
    donors.forEach(u => {
      const c = u.personalInfo?.address?.city;
      if (!c) return;
      counts[c] = counts[c] || { Gonullu: 0, Bagisci: 0 };
      counts[c].Bagisci += 1;
    });
    return Object.entries(counts)
      .map(([name, v]) => ({ name, Gonullu: v.Gonullu, Bagisci: v.Bagisci, count: v.Gonullu + v.Bagisci }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ count, ...rest }) => rest);
  }, [volunteers, donors]);

  const volunteerInterestData = useMemo(() => {
    const counts: Record<string, number> = {};
    volunteers.forEach(u => {
      (u.volunteerInfo?.interests || []).forEach((interest: string) => {
        counts[interest] = (counts[interest] || 0) + 1;
      });
    });
    return topN(
      Object.entries(counts).map(([name, count]) => ({ name, count, Gonullu: count })),
      8,
    ).map(({ count, ...rest }) => rest);
  }, [volunteers]);

  const genderAgeData = useMemo(() => {
    const counts: Record<string, { Kadin: number; Erkek: number; Diger: number }> = {};
    AGE_ORDER.forEach(a => { counts[a] = { Kadin: 0, Erkek: 0, Diger: 0 }; });
    supporters.forEach(u => {
      const age = computeAge(u.personalInfo?.birthDate);
      if (age == null) return;
      const b = ageBucket(age);
      const g = (u.personalInfo?.gender || '').toLowerCase();
      if (g === 'kadın' || g === 'kadin' || g === 'female') counts[b].Kadin += 1;
      else if (g === 'erkek' || g === 'male') counts[b].Erkek += 1;
      else counts[b].Diger += 1;
    });
    return AGE_ORDER
      .map(age => ({ age, ...counts[age] }))
      .filter(d => d.Kadin > 0 || d.Erkek > 0 || d.Diger > 0);
  }, [supporters]);

  const schoolData = useMemo(() => {
    const counts: Record<string, number> = {};
    supporters.forEach(u => {
      (u.volunteerInfo?.education || []).forEach((e: any) => {
        const s = e?.school;
        if (s) counts[s] = (counts[s] || 0) + 1;
      });
    });
    return topN(
      Object.entries(counts).map(([name, count]) => ({ name, count, Destekci: count })),
      5,
    ).map(({ count, ...rest }) => rest);
  }, [supporters]);

  const competencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    volunteers.forEach(u => {
      (u.volunteerInfo?.skills || []).forEach((s: string) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return topN(
      Object.entries(counts).map(([name, count]) => ({ name, count, value: count })),
      10,
    ).map(({ count, ...rest }) => rest);
  }, [volunteers]);

  const spendingHabitsData = useMemo(() => {
    if (!allBrands) return [];
    const brandNameById = new Map(allBrands.map((b: any) => [b.id, b.name]));
    const counts: Record<string, number> = {};
    donors.forEach(u => {
      (u.followedBrands || []).forEach((brandId: string) => {
        const name = brandNameById.get(brandId);
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return topN(
      Object.entries(counts).map(([name, count]) => ({ name, count, value: count })),
      5,
    ).map(({ count, ...rest }) => rest);
  }, [donors, allBrands]);

  const initialLoading = !isMounted || usersLoading || ngosLoading || brandsLoading || clubsLoading;

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
          <h1 className="text-2xl font-bold">Demografi Analizi</h1>
          <p className="text-muted-foreground">Yönettiğiniz STK, marka ya da kulüp için destekçi demografisini görün.</p>
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
  const supportersLabel = activeEntity.kind === 'brand' ? 'Toplam Takipçi' : 'Toplam Destekçi';

  const hasAnyData = ageGroupData.length > 0 || cityData.length > 0 || volunteerInterestData.length > 0 ||
    genderAgeData.length > 0 || schoolData.length > 0 || spendingHabitsData.length > 0 || competencyData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Demografi Analizi</h1>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{activeEntity.name}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="text-xs uppercase tracking-widest font-bold">{entityTypeLabel}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-black">{supporters.length}</p><p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{supportersLabel}</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-xl bg-green-500/10"><Users className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-black">{volunteers.length}</p><p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Gönüllü</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/10"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-black">{donors.length}</p><p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{activeEntity.kind === 'brand' ? 'Takipçi' : 'Bağışçı'}</p></div></CardContent></Card>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-16">
            <EmptyChartState />
          </CardContent>
        </Card>
      ) : (
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="numbers">Sayilar</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Gönüllü & Bağışçı Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş gruplarına göre karşılaştırmalı dağılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                {ageGroupData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ageGroupData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Gonullu" stackId="1" stroke="#f34723" fill="#f34723" />
                        <Area type="monotone" dataKey="Bagisci" stackId="1" stroke="#042654" fill="#042654" />
                    </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gönüllü İlgi Alanları</CardTitle>
                <CardDescription>Gönüllülerinizin en çok ilgi gösterdiği sosyal alanlar.</CardDescription>
              </CardHeader>
              <CardContent>
                {volunteerInterestData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                   <BarChart layout="vertical" data={volunteerInterestData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gonullu" fill="#f34723" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cinsiyete Göre Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş ve cinsiyet kırılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                {genderAgeData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderAgeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Kadin" stackId="a" fill="#f34723" />
                    <Bar dataKey="Erkek" stackId="a" fill="#042654" />
                    <Bar dataKey="Diger" stackId="a" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gönüllü Yetkinlikleri</CardTitle>
                    <CardDescription>Gönüllü havuzunuzdaki en yaygın yetkinlikler.</CardDescription>
                </CardHeader>
                <CardContent>
                    {competencyData.length === 0 ? <EmptyChartState /> : (
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart layout="vertical" data={competencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" width={110} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Kisi Sayisi" fill="#042654" />
                        </BarChart>
                    </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bağışçı Tüketim Alışkanlıkları</CardTitle>
                <CardDescription>Bağışçılarınızın takip ettiği markalar.</CardDescription>
              </CardHeader>
              <CardContent>
                {spendingHabitsData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={spendingHabitsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {spendingHabitsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Şehirlere Göre Dağılımı</CardTitle>
                <CardDescription>Gönüllü ve bağışçılarınızın yoğunlaştığı ilk 5 şehir.</CardDescription>
              </CardHeader>
              <CardContent>
                {cityData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gonullu" fill="#f34723" />
                        <Bar dataKey="Bagisci" fill="#042654" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Okullara Göre Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin en yoğun olduğu ilk 5 üniversite/okul.</CardDescription>
              </CardHeader>
              <CardContent>
                {schoolData.length === 0 ? <EmptyChartState /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={schoolData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Destekci" fill="#f34723" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="numbers" className="mt-6 space-y-6">
            <Card>
                <CardHeader><CardTitle>Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {ageGroupData.length === 0 ? <EmptyChartState /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {ageGroupData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d['Gonullu']}</TableCell><TableCell className='text-right'>{d['Bagisci']}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Cinsiyete Göre Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {genderAgeData.length === 0 ? <EmptyChartState /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Kadın</TableHead><TableHead className='text-right'>Erkek</TableHead><TableHead className='text-right'>Diğer</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {genderAgeData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d.Kadin}</TableCell><TableCell className='text-right'>{d.Erkek}</TableCell><TableCell className='text-right'>{d.Diger}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Şehirlere Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {cityData.length === 0 ? <EmptyChartState /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Şehir</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {cityData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d['Gonullu']}</TableCell><TableCell className='text-right'>{d['Bagisci']}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Okullara Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {schoolData.length === 0 ? <EmptyChartState /> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Okul</TableHead><TableHead className='text-right'>Destekçi Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {schoolData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d.Destekci}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Detaylı Kırılımlar</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü İlgi Alanları</h4>
                        {volunteerInterestData.length === 0 ? <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p> : (
                          volunteerInterestData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d['Gonullu']} kişi</span></div>))
                        )}
                    </div>
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü Yetkinlikleri</h4>
                        {competencyData.length === 0 ? <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p> : (
                          competencyData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))
                        )}
                    </div>
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Bağışçı Tüketim Alışkanlıkları</h4>
                        {spendingHabitsData.length === 0 ? <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p> : (
                          spendingHabitsData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

export default function DemographicsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <DemographicsPageContent />
    </Suspense>
  );
}
