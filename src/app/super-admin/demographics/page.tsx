'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Users, Cake, Heart, MapPin, Building, Loader2, Globe, GraduationCap, Sparkles, Target, ArrowRight,
    UserCheck, HandHeart, Activity,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

const COLORS = ['#f34723', '#042654', '#0ea5e9', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#6366f1'];

function ageFromBirthDate(birthDate: unknown): number | null {
    if (!birthDate) return null;
    const d = new Date(birthDate as string | number | Date);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
}

function ageBucket(age: number): string {
    if (age < 18) return '<18';
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    return '55+';
}

interface DemoUser {
    id: string;
    personalInfo?: { birthDate?: unknown; gender?: string; bloodType?: string; nationality?: string; address?: { country?: string; city?: string; district?: string; neighborhood?: string } };
    volunteerInfo?: { profession?: string; sector?: string; interests?: string[]; skills?: string[]; languages?: string[]; education?: Array<{ level?: string; school?: string; department?: string }> };
    supportedNgos?: string[];
    volunteerNgos?: string[];
    followedBrands?: string[];
    joinedClubs?: string[];
    managedNgoId?: string;
    [key: string]: unknown;
}

type NameMaps = { ngo: Map<string, string>; brand: Map<string, string>; club: Map<string, string> };

const ROLE_LABELS: Record<string, string> = {
    user: 'Kullanıcı', volunteer: 'Gönüllü', donor: 'Bağışçı', student: 'Öğrenci', individual: 'Bireysel',
    'ngo-admin': 'STK Yöneticisi', 'brand-admin': 'Marka Yöneticisi', 'club-admin': 'Kulüp Yöneticisi',
    admin: 'Yönetici', 'super-admin': 'Süper Admin',
};

const computeStats = (users: DemoUser[], nameMaps: NameMaps) => {
    const ageBuckets: Record<string, number> = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    const gender: Record<string, number> = {};
    const blood: Record<string, number> = {};
    const country: Record<string, number> = {};
    const city: Record<string, number> = {};
    const nationality: Record<string, number> = {};
    const profession: Record<string, number> = {};
    const sector: Record<string, number> = {};
    const interests: Record<string, number> = {};
    const skills: Record<string, number> = {};
    const educationLevel: Record<string, number> = {};
    const languages: Record<string, number> = {};
    const role: Record<string, number> = {};
    const district: Record<string, number> = {};
    const neighborhood: Record<string, number> = {};
    const department: Record<string, number> = {};
    const school: Record<string, number> = {};
    const clubs: Record<string, number> = {};
    const volunteeredNgoNames: Record<string, number> = {};
    const followedBrandNames: Record<string, number> = {};
    const secondaryNgo: Record<string, number> = {};
    let ageSum = 0, ageCount = 0, withVolunteer = 0, withBlood = 0, supporters = 0, volunteers = 0, withCity = 0;

    users.forEach(u => {
        const pi = u?.personalInfo || {};
        const vi = u?.volunteerInfo || {};

        const age = ageFromBirthDate(pi.birthDate);
        if (age != null) { ageBuckets[ageBucket(age)]++; ageSum += age; ageCount++; }
        if (pi.bloodType) withBlood++;
        if (pi.address?.city) withCity++;
        if (vi && Object.keys(vi).length > 0) withVolunteer++;
        if ((u.supportedNgos || []).length > 0) supporters++;
        if ((u.volunteerNgos || []).length > 0) volunteers++;
        { const r = (u.role as string) || 'user'; role[r] = (role[r] || 0) + 1; }

        if (pi.gender) gender[pi.gender] = (gender[pi.gender] || 0) + 1;
        if (pi.bloodType) blood[pi.bloodType] = (blood[pi.bloodType] || 0) + 1;
        if (pi.address?.country) country[pi.address.country] = (country[pi.address.country] || 0) + 1;
        if (pi.address?.city) city[pi.address.city] = (city[pi.address.city] || 0) + 1;
        if (pi.nationality) nationality[pi.nationality] = (nationality[pi.nationality] || 0) + 1;

        if (vi.profession) profession[vi.profession] = (profession[vi.profession] || 0) + 1;
        if (vi.sector) sector[vi.sector] = (sector[vi.sector] || 0) + 1;
        (vi.interests || []).forEach((i: string) => { interests[i] = (interests[i] || 0) + 1; });
        (vi.skills || []).forEach((s: string) => { skills[s] = (skills[s] || 0) + 1; });
        (vi.languages || []).forEach((l: string) => { languages[l] = (languages[l] || 0) + 1; });

        const edu0 = vi.education?.[0];
        if (edu0?.level) educationLevel[edu0.level] = (educationLevel[edu0.level] || 0) + 1;
        if (edu0?.school) school[edu0.school] = (school[edu0.school] || 0) + 1;
        if (edu0?.department) department[edu0.department] = (department[edu0.department] || 0) + 1;
        if (pi.address?.district) district[pi.address.district] = (district[pi.address.district] || 0) + 1;
        if (pi.address?.neighborhood) neighborhood[pi.address.neighborhood] = (neighborhood[pi.address.neighborhood] || 0) + 1;
        (u.joinedClubs || []).forEach(id => { const n = nameMaps.club.get(id); if (n) clubs[n] = (clubs[n] || 0) + 1; });
        (u.volunteerNgos || []).forEach(id => { const n = nameMaps.ngo.get(id); if (n) volunteeredNgoNames[n] = (volunteeredNgoNames[n] || 0) + 1; });
        (u.followedBrands || []).forEach(id => { const n = nameMaps.brand.get(id); if (n) followedBrandNames[n] = (followedBrandNames[n] || 0) + 1; });
        const sec = (u.supportedNgos || [])[1];
        if (sec) { const n = nameMaps.ngo.get(sec); if (n) secondaryNgo[n] = (secondaryNgo[n] || 0) + 1; }
    });

    const toArr = (obj: Record<string, number>, max = 12) =>
        Object.entries(obj)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, max);

    return {
        total: users.length,
        ageBuckets: Object.entries(ageBuckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
        gender: toArr(gender, 6),
        blood: toArr(blood, 8),
        country: toArr(country, 10),
        city: toArr(city, 12),
        nationality: toArr(nationality, 10),
        profession: toArr(profession, 12),
        sector: toArr(sector, 10),
        interests: toArr(interests, 12),
        skills: toArr(skills, 12),
        educationLevel: toArr(educationLevel, 6),
        languages: toArr(languages, 10),
        avgAge: ageCount ? Math.round(ageSum / ageCount) : 0,
        withVolunteer, withBlood, withCity, supporters, volunteers,
        roleDist: toArr(role, 8).map(r => ({ name: ROLE_LABELS[r.name] || r.name, value: r.value })),
        district: toArr(district, 12),
        neighborhood: toArr(neighborhood, 12),
        department: toArr(department, 12),
        school: toArr(school, 12),
        clubs: toArr(clubs, 12),
        volunteeredNgoNames: toArr(volunteeredNgoNames, 12),
        followedBrandNames: toArr(followedBrandNames, 12),
        secondaryNgo: toArr(secondaryNgo, 10),
    };
};

const StatChartCard = ({
    title, icon: Icon, data, type = 'bar', color = '#f34723',
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: { name: string; value: number }[];
    type?: 'bar' | 'pie' | 'horizontal';
    color?: string;
}) => (
    <Card className="rounded-2xl">
        <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            {data.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-xs">Veri yok.</p>
            ) : type === 'pie' ? (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%" cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            ) : type === 'horizontal' ? (
                <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill={color} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill={color} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </CardContent>
    </Card>
);

export default function DemographicsPage() {
    const db = useFirestore();
    const router = useRouter();

    // Yalnızca bu sayfa kendi başına açıldığında yönlendirme yap; analytics
    // sekmesi içine embed edildiğinde redirect tetiklenmesin.
    const [isStandalone, setIsStandalone] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const standalone = window.location.pathname === '/super-admin/demographics';
        setIsStandalone(standalone);
        if (!standalone) return;
        const t = setTimeout(() => {
            router.replace('/super-admin/analytics?tab=demographics');
        }, 5000);
        return () => clearTimeout(t);
    }, [router]);

    const usersQ = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
    const ngosQ = useMemoFirebase(() => collection(db, COLLECTIONS.ngos), [db]);

    const brandsQ = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
    const clubsQ = useMemoFirebase(() => collection(db, COLLECTIONS.clubs), [db]);

    const { data: users, isLoading } = useCollection<DemoUser>(usersQ);
    const { data: ngos } = useCollection<{ id: string; name?: string }>(ngosQ);
    const { data: brands } = useCollection<{ id: string; name?: string }>(brandsQ);
    const { data: clubs } = useCollection<{ id: string; name?: string }>(clubsQ);
    const nameMaps = useMemo<NameMaps>(() => ({
        ngo: new Map((ngos || []).map(n => [n.id, n.name || ''])),
        brand: new Map((brands || []).map(b => [b.id, b.name || ''])),
        club: new Map((clubs || []).map(c => [c.id, c.name || ''])),
    }), [ngos, brands, clubs]);

    const [selectedNgoId, setSelectedNgoId] = useState<string>('all');

    // Genel ya da seçili STK destekçileri
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        if (selectedNgoId === 'all') return users;
        return users.filter(u => {
            const supported = u.supportedNgos || [];
            const volunteered = u.volunteerNgos || [];
            return (
                supported.includes(selectedNgoId) ||
                volunteered.includes(selectedNgoId) ||
                u.managedNgoId === selectedNgoId
            );
        });
    }, [users, selectedNgoId]);

    const stats = useMemo(() => computeStats(filteredUsers, nameMaps), [filteredUsers, nameMaps]);
    const selectedNgoName = useMemo(() => {
        if (selectedNgoId === 'all') return 'Tüm Platform';
        return (ngos || []).find((n) => n.id === selectedNgoId)?.name || 'STK';
    }, [selectedNgoId, ngos]);

    if (isLoading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in-0">
            {isStandalone && (
                <Card className="rounded-2xl border-amber-300 bg-amber-50">
                    <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                        <ArrowRight className="h-5 w-5 text-amber-700 shrink-0" />
                        <div className="flex-1 min-w-[260px]">
                            <p className="font-semibold text-amber-900 text-sm">
                                Bu sayfa artık /super-admin/analytics altında.
                            </p>
                            <p className="text-xs text-amber-800">
                                5 saniye içinde yönlendirileceksiniz.
                            </p>
                        </div>
                        <button
                            onClick={() => router.replace('/super-admin/analytics?tab=demographics')}
                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 transition-colors"
                        >
                            Şimdi geç
                        </button>
                    </CardContent>
                </Card>
            )}
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Demografi Analizi</h1>
                <p className="text-muted-foreground text-sm">
                    Platform genelinde veya belirli bir STK'nın destekçileri için yaş, cinsiyet, konum,
                    meslek ve ilgi alanı dağılımları.
                </p>
            </div>

            {/* STK seçici */}
            <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <Building className="h-5 w-5 text-primary" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hedef Kitle</p>
                        <p className="font-bold">{selectedNgoName}</p>
                    </div>
                    <Select value={selectedNgoId} onValueChange={setSelectedNgoId}>
                        <SelectTrigger className="ml-auto h-10 w-72"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-72">
                            <SelectItem value="all">🌐 Tüm Platform (Genel)</SelectItem>
                            {(ngos || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr')).map((n) => (
                                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="ml-2">
                        {stats.total.toLocaleString('tr-TR')} kullanıcı
                    </Badge>
                </CardContent>
            </Card>

            {selectedNgoId !== 'all' && stats.total === 0 && (
                <Card className="rounded-2xl border-amber-200 bg-amber-50/40">
                    <CardContent className="p-4 text-sm text-amber-800">
                        Bu STK için henüz destekçi verisi bulunamadı. Kullanıcılar profil ayarlarından
                        STK seçtiklerinde burada toplanacak.
                    </CardContent>
                </Card>
            )}

            {/* Özet KPI şeridi */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Toplam Kullanıcı', value: stats.total.toLocaleString('tr-TR'), icon: Users },
                    { label: 'Ortalama Yaş', value: stats.avgAge || '—', icon: Cake },
                    { label: 'Gönüllü Profili', value: stats.withVolunteer.toLocaleString('tr-TR'), icon: UserCheck },
                    { label: 'STK Destekçisi', value: stats.supporters.toLocaleString('tr-TR'), icon: HandHeart },
                    { label: 'Kan Grubu Beyanı', value: stats.withBlood.toLocaleString('tr-TR'), icon: Heart },
                    { label: 'Konum Beyanı', value: stats.withCity.toLocaleString('tr-TR'), icon: MapPin },
                ].map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.label} className="rounded-2xl">
                            <CardContent className="p-4">
                                <Icon className="h-4 w-4 text-primary mb-1" />
                                <p className="text-2xl font-black leading-none">{kpi.value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 leading-tight">{kpi.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl h-auto">
                    <TabsTrigger value="basic"><Cake className="mr-1 h-4 w-4" /> Demografi</TabsTrigger>
                    <TabsTrigger value="location"><MapPin className="mr-1 h-4 w-4" /> Konum</TabsTrigger>
                    <TabsTrigger value="profile"><Sparkles className="mr-1 h-4 w-4" /> Profil &amp; İlgi</TabsTrigger>
                    <TabsTrigger value="engagement"><Activity className="mr-1 h-4 w-4" /> Etkileşim</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StatChartCard title="Yaş Dağılımı" icon={Cake} data={stats.ageBuckets} type="pie" />
                    <StatChartCard title="Cinsiyet Dağılımı" icon={Users} data={stats.gender} type="pie" color="#0ea5e9" />
                    <StatChartCard title="Kan Grubu" icon={Heart} data={stats.blood} type="bar" color="#dc2626" />
                </TabsContent>

                <TabsContent value="location" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StatChartCard title="Ülke" icon={Globe} data={stats.country} type="horizontal" color="#042654" />
                    <StatChartCard title="İl (Top 12)" icon={MapPin} data={stats.city} type="horizontal" color="#f34723" />
                    <StatChartCard title="İlçe (Top 12)" icon={MapPin} data={stats.district} type="horizontal" color="#0ea5e9" />
                    <StatChartCard title="Mahalle (Top 12)" icon={MapPin} data={stats.neighborhood} type="horizontal" color="#10b981" />
                    <StatChartCard title="Uyruk" icon={Globe} data={stats.nationality} type="horizontal" color="#a855f7" />
                </TabsContent>

                <TabsContent value="profile" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StatChartCard title="Eğitim Seviyesi" icon={GraduationCap} data={stats.educationLevel} type="bar" color="#10b981" />
                    <StatChartCard title="Okul (Top 12)" icon={GraduationCap} data={stats.school} type="horizontal" color="#0ea5e9" />
                    <StatChartCard title="Bölüm / Fakülte (Top 12)" icon={GraduationCap} data={stats.department} type="horizontal" color="#6366f1" />
                    <StatChartCard title="Meslek (Top 12)" icon={Sparkles} data={stats.profession} type="horizontal" color="#10b981" />
                    <StatChartCard title="Sektör" icon={Building} data={stats.sector} type="horizontal" color="#0ea5e9" />
                    <StatChartCard title="Sosyal Hassasiyetler / İlgi Alanları" icon={Heart} data={stats.interests} type="horizontal" color="#ec4899" />
                    <StatChartCard title="Yetkinlikler (Profesyonel & Sosyal)" icon={Target} data={stats.skills} type="horizontal" color="#f59e0b" />
                    <StatChartCard title="Diller" icon={Globe} data={stats.languages} type="horizontal" color="#6366f1" />
                </TabsContent>

                <TabsContent value="engagement" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StatChartCard title="Üye Olunan Kulüpler (Top 12)" icon={GraduationCap} data={stats.clubs} type="horizontal" color="#0ea5e9" />
                    <StatChartCard title="Gönüllü Olunan STK'lar (Top 12)" icon={HandHeart} data={stats.volunteeredNgoNames} type="horizontal" color="#10b981" />
                    <StatChartCard title="Takip Edilen Markalar (Top 12)" icon={Building} data={stats.followedBrandNames} type="horizontal" color="#f59e0b" />
                    <StatChartCard title="2. Tercih STK'lar (Top 10)" icon={Heart} data={stats.secondaryNgo} type="horizontal" color="#ec4899" />
                    <StatChartCard title="Rol Dağılımı" icon={UserCheck} data={stats.roleDist} type="pie" color="#6366f1" />
                    <StatChartCard
                        title="Bağış & Gönüllülük"
                        icon={HandHeart}
                        data={[
                            { name: 'STK Destekçisi', value: stats.supporters },
                            { name: 'Gönüllü', value: stats.volunteers },
                            { name: 'Gönüllü Profili', value: stats.withVolunteer },
                        ]}
                        type="bar"
                        color="#10b981"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
