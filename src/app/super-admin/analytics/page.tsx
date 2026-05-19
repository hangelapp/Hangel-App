'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { Users, Building, Store, HandCoins, Trophy, Loader2, Heart, FileText, Bell, Hourglass, CheckCircle2, XCircle, GraduationCap, MessageSquare, Star, ShoppingBag, Clock, Pencil, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DemographicsPage from '../demographics/page';
import { COLLECTIONS } from '@/firebase/collections';

const COLORS = ['#f34723', '#042654', '#0ea5e9', '#10b981', '#a855f7', '#f59e0b'];

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

interface AnalyticsDoc {
    id?: string;
    status?: string;
    type?: string;
    donationAmount?: string | number;
    purchaseAmount?: string | number;
    stats?: { volunteerHours?: number; projects?: number; totalDonation?: number };
    createdAt?: unknown;
    joinDate?: unknown;
    likes?: number;
    comments?: number;
    personalInfo?: { birthDate?: unknown; gender?: string };
    shortName?: string;
    name?: string;
    rating?: number;
    [key: string]: unknown;
}

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
        try { return (value as { toDate: () => Date }).toDate(); } catch { return null; }
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value instanceof Date) return value;
    return null;
}

function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildLast7Months() {
    const now = new Date();
    const buckets: { key: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ key: monthKey(d), label: TR_MONTHS[d.getMonth()] });
    }
    return buckets;
}

function ageFromBirthDate(birthDate: unknown): number | null {
    const d = toDate(birthDate);
    if (!d) return null;
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

function AnalyticsPageInner() {
    const db = useFirestore();
    const [growthSort, setGrowthSort] = useState<'desc' | 'asc'>('desc');

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const initialTab = searchParams?.get('tab') === 'demographics' ? 'demographics' : 'stats';
    const [activeTab, setActiveTab] = useState<'stats' | 'demographics'>(initialTab);

    useEffect(() => {
        const t = searchParams?.get('tab');
        if (t === 'demographics' && activeTab !== 'demographics') setActiveTab('demographics');
        if ((!t || t === 'stats') && activeTab !== 'stats') setActiveTab('stats');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleTabChange = (value: string) => {
        const next = value === 'demographics' ? 'demographics' : 'stats';
        setActiveTab(next);
        try {
            const params = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
            if (next === 'demographics') params.set('tab', 'demographics');
            else params.delete('tab');
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname);
        } catch { /* ignore */ }
    };

    const usersQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
    const ngosQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngos) : null), [db]);
    const brandsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.brands) : null), [db]);
    const clubsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.clubs) : null), [db]);
    const postsQ = useMemoFirebase(() => (db ? query(collection(db, COLLECTIONS.posts), orderBy('createdAt', 'desc'), limit(2000)) : null), [db]);
    const appsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.applications) : null), [db]);
    const volunteeringQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.volunteering) : null), [db]);
    const emergencyQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.emergencyRequests) : null), [db]);
    const responsesQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.emergencyResponses) : null), [db]);
    const donationsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.donations) : null), [db]);
    const supportQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.supportTickets) : null), [db]);
    const fundsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.funds) : null), [db]);
    const ratingsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ratings) : null), [db]);
    const surveysQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.surveys) : null), [db]);

    const { data: users, isLoading: usersLoading } = useCollection<AnalyticsDoc>(usersQ);
    const { data: ngos, isLoading: ngosLoading } = useCollection<AnalyticsDoc>(ngosQ);
    const { data: brands, isLoading: brandsLoading } = useCollection<AnalyticsDoc>(brandsQ);
    const { data: clubs } = useCollection<AnalyticsDoc>(clubsQ);
    const { data: posts, isLoading: postsLoading } = useCollection<AnalyticsDoc>(postsQ);
    const { data: apps, isLoading: appsLoading } = useCollection<AnalyticsDoc>(appsQ);
    const { data: opportunities, isLoading: oppLoading } = useCollection<AnalyticsDoc>(volunteeringQ);
    const { data: emergencies } = useCollection<AnalyticsDoc>(emergencyQ);
    const { data: responses } = useCollection<AnalyticsDoc>(responsesQ);
    const { data: donations } = useCollection<AnalyticsDoc>(donationsQ);
    const { data: supportTickets } = useCollection<AnalyticsDoc>(supportQ);
    const { data: funds } = useCollection<AnalyticsDoc>(fundsQ);
    const { data: ratings } = useCollection<AnalyticsDoc>(ratingsQ);
    const { data: surveys } = useCollection<AnalyticsDoc>(surveysQ);

    const isLoading = usersLoading || ngosLoading || brandsLoading || postsLoading || appsLoading || oppLoading;

    // KPI'lar — gerçek Firestore verileri
    const totalUsers = users?.length ?? 0;
    const activeNgos = (ngos ?? []).filter((n) => !n.status || n.status === 'Aktif').length;
    const activeBrands = (brands ?? []).filter((b) => !b.status || b.status === 'Aktif').length;
    const activeClubs = (clubs ?? []).filter((c) => !c.status || c.status === 'Aktif').length;
    // Açık gönüllülük ilanları — status 'Aktif' veya 'Yayında' veya boş (varsayılan aktif kabul)
    const activeOpportunities = (opportunities ?? []).filter((o) => {
        const s = (o.status ?? '').toString();
        return !s || s === 'Aktif' || s === 'Yayında' || s === 'active' || s === 'open' || s === 'Açık';
    }).length;

    // Gerçek bağış toplamları (donations koleksiyonundan)
    const realDonations = (donations ?? []).filter((d) => d.type !== 'income');
    const totalDonationActual = realDonations.reduce((s: number, d) =>
        s + (parseFloat(String(d.donationAmount ?? '0')) || 0), 0);
    const paidDonationTotal = realDonations
        .filter((d) => d.status === 'Yatırıldı' || d.status === 'Tamamlandı')
        .reduce((s: number, d) => s + (parseFloat(String(d.donationAmount ?? '0')) || 0), 0);
    const pendingDonationTotal = totalDonationActual - paidDonationTotal;
    const _totalPurchase = realDonations.reduce((s: number, d) =>
        s + (parseFloat(String(d.purchaseAmount ?? '0')) || 0), 0);

    const totalVolunteerHours = (ngos ?? []).reduce((sum: number, n) => sum + (n?.stats?.volunteerHours || 0), 0);
    const _totalProjects = (ngos ?? []).reduce((sum: number, n) => sum + (n?.stats?.projects || 0), 0);
    const _totalPosts = posts?.length ?? 0;
    const openTickets = (supportTickets ?? []).filter((t) => (t.status || 'open') === 'open').length;
    const avgRating = (ratings && ratings.length > 0)
        ? (ratings.reduce((s: number, r) => s + (r.rating || 0), 0) / ratings.length)
        : 0;

    // Aylık kullanıcı büyümesi (joinDate / createdAt'a göre)
    const monthBuckets = useMemo(() => buildLast7Months(), []);
    const userGrowthData = useMemo(() => {
        const counts: Record<string, number> = {};
        monthBuckets.forEach(b => { counts[b.key] = 0; });
        (users ?? []).forEach((u) => {
            const d = toDate(u.createdAt) || toDate(u.joinDate);
            if (!d) return;
            const key = monthKey(d);
            if (key in counts) counts[key]++;
        });
        return monthBuckets.map(b => ({ month: b.label, key: b.key, users: counts[b.key] }));
    }, [users, monthBuckets]);

    // Aylık gönderi etkileşimi
    const engagementData = useMemo(() => {
        const grouped: Record<string, { posts: number; likes: number; comments: number }> = {};
        monthBuckets.forEach(b => { grouped[b.key] = { posts: 0, likes: 0, comments: 0 }; });
        (posts ?? []).forEach((p) => {
            const d = toDate(p.createdAt);
            if (!d) return;
            const key = monthKey(d);
            if (key in grouped) {
                grouped[key].posts++;
                grouped[key].likes += p.likes || 0;
                grouped[key].comments += p.comments || 0;
            }
        });
        return monthBuckets.map(b => ({
            month: b.label,
            Gonderi: grouped[b.key].posts,
            Begeni: grouped[b.key].likes,
            Yorum: grouped[b.key].comments,
        }));
    }, [posts, monthBuckets]);

    // Yaş demografisi (kullanıcılardan)
    const ageGroupData = useMemo(() => {
        const counts: Record<string, number> = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
        (users ?? []).forEach((u) => {
            const age = ageFromBirthDate(u?.personalInfo?.birthDate);
            if (age == null) return;
            counts[ageBucket(age)]++;
        });
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value }));
    }, [users]);

    const usersWithBirthDate = ageGroupData.reduce((sum, d) => sum + d.value, 0);

    // Cinsiyet dağılımı
    const genderData = useMemo(() => {
        const counts: Record<string, number> = {};
        (users ?? []).forEach((u) => {
            const g = (u?.personalInfo?.gender || '').trim();
            if (!g) return;
            counts[g] = (counts[g] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [users]);

    // Top STK'lar (bağışa göre)
    const topNgosByDonation = useMemo(() => {
        return [...(ngos ?? [])]
            .map((n) => ({
                name: n.shortName || n.name || 'Adsız',
                Bagis: n?.stats?.totalDonation || 0,
                Gonulluluk: n?.stats?.volunteerHours || 0,
            }))
            .sort((a, b) => b.Bagis - a.Bagis)
            .slice(0, 7);
    }, [ngos]);

    // Başvuru durumu dağılımı
    const applicationStatus = useMemo(() => {
        const counts = { pending: 0, approved: 0, rejected: 0 };
        (apps ?? []).forEach((a) => {
            const s = a.status;
            if (s === 'Beklemede') counts.pending++;
            else if (s === 'Onaylandı' || s === 'Onaylandi' || s === 'approved') counts.approved++;
            else if (s === 'Reddedildi' || s === 'rejected') counts.rejected++;
        });
        return counts;
    }, [apps]);

    // Sıralanmış aylık kullanıcı tablosu
    const sortedUserGrowth = useMemo(() => {
        return [...userGrowthData].sort((a, b) =>
            growthSort === 'asc' ? a.users - b.users : b.users - a.users,
        );
    }, [userGrowthData, growthSort]);

    const formatTL = (v: number) => v.toLocaleString('tr-TR') + ' ₺';

    if (isLoading && !users && !ngos) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold font-headline tracking-tight">Platform Analizleri ve Raporlar</h1>
                <p className="text-muted-foreground text-sm">
                    Firestore'dan gerçek zamanlı veriler. Toplam {totalUsers.toLocaleString('tr-TR')} kullanıcı, {(ngos?.length ?? 0).toLocaleString('tr-TR')} STK, {(brands?.length ?? 0).toLocaleString('tr-TR')} marka taranıyor.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="stats">
                        <BarChart3 className="mr-2 h-4 w-4" /> İstatistikler
                    </TabsTrigger>
                    <TabsTrigger value="demographics">
                        <PieChartIcon className="mr-2 h-4 w-4" /> Demografi
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-6 space-y-6">

            {/* Ana KPI'lar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">{totalUsers.toLocaleString('tr-TR')}</p>
                    <CardTitle className="text-sm font-medium mt-1">Toplam Kullanıcı</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{usersWithBirthDate} kişi yaş bilgisi paylaşmış</p>
                </Card>
                <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">{activeNgos.toLocaleString('tr-TR')}</p>
                    <CardTitle className="text-sm font-medium mt-1">Aktif STK</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{(ngos?.length ?? 0) - activeNgos} pasif kayıt</p>
                </Card>
                <Card className="aspect-square flex flex-col justify-center items-center p-4 relative">
                    <Store className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">{activeBrands.toLocaleString('tr-TR')}</p>
                    <CardTitle className="text-sm font-medium mt-1">Aktif Marka</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{(brands?.length ?? 0) - activeBrands} pasif kayıt</p>
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-2xl h-7 px-3 text-[11px]"
                    >
                        <Link href="/super-admin/brands">
                            <Pencil className="h-3 w-3 mr-1" /> Düzenle (Markalar)
                        </Link>
                    </Button>
                </Card>
                <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <HandCoins className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">
                        {totalDonationActual >= 1_000_000
                            ? `${(totalDonationActual / 1_000_000).toFixed(1)}M ₺`
                            : totalDonationActual >= 1000
                                ? `${(totalDonationActual / 1000).toFixed(0)}K ₺`
                                : `${totalDonationActual.toLocaleString('tr-TR')} ₺`}
                    </p>
                    <CardTitle className="text-sm font-medium mt-1">Toplam Bağış</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        {realDonations.length} işlem · {paidDonationTotal.toLocaleString('tr-TR')} ₺ yatırıldı
                    </p>
                </Card>
            </div>

            {/* İkincil KPI'lar — gerçek Firestore verileri */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100"><GraduationCap className="h-4 w-4 text-purple-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{activeClubs.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Aktif Öğrenci Kulübü</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100"><ShoppingBag className="h-4 w-4 text-orange-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{realDonations.length.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Bağış İşlemi (Toplam)</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100"><Clock className="h-4 w-4 text-amber-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{pendingDonationTotal.toLocaleString('tr-TR')} ₺</p>
                            <p className="text-xs text-muted-foreground">Bekleyen Bağış</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{paidDonationTotal.toLocaleString('tr-TR')} ₺</p>
                            <p className="text-xs text-muted-foreground">Yatırılan Bağış</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-100"><Heart className="h-4 w-4 text-pink-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{totalVolunteerHours.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Toplam Gönüllülük Saati</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-lg bg-blue-100"><FileText className="h-4 w-4 text-blue-600" /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-2xl font-bold">{activeOpportunities.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">
                                Açık Gönüllülük İlanı
                                <span className="block text-[10px] opacity-70">
                                    Toplam {(opportunities?.length ?? 0).toLocaleString('tr-TR')} kayıt
                                </span>
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100"><Bell className="h-4 w-4 text-red-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{(emergencies?.length ?? 0).toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Acil Durum Talebi</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{((responses ?? []).filter((r) => r.status === 'positive').length).toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Olumlu Acil Yanıt</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-100"><MessageSquare className="h-4 w-4 text-cyan-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{openTickets.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Açık Destek Talebi</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100"><Star className="h-4 w-4 text-yellow-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">{(ratings?.length || 0)} değerlendirme ort.</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100"><FileText className="h-4 w-4 text-indigo-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{(funds?.length ?? 0).toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">{(funds ?? []).filter((f) => f.status === 'Açık').length} açık fon</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100"><Trophy className="h-4 w-4 text-rose-600" /></div>
                        <div>
                            <p className="text-2xl font-bold">{(surveys?.length ?? 0).toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-muted-foreground">Anket Cevabı</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Başvurular durumu */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Başvurular</CardTitle>
                    <CardDescription>{(apps?.length ?? 0)} toplam başvuru, durum kırılımı.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center gap-3">
                            <Hourglass className="h-5 w-5 text-amber-600" />
                            <div><p className="text-xl font-bold">{applicationStatus.pending}</p><p className="text-xs text-amber-700">Beklemede</p></div>
                        </div>
                        <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div><p className="text-xl font-bold">{applicationStatus.approved}</p><p className="text-xs text-green-700">Onaylandı</p></div>
                        </div>
                        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-center gap-3">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div><p className="text-xl font-bold">{applicationStatus.rejected}</p><p className="text-xs text-red-700">Reddedildi</p></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Büyüme ve Etkileşim Trendleri</CardTitle>
                    <CardDescription>Son 7 ayın gerçek verileri.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="graphs">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="graphs">Grafikler</TabsTrigger>
                            <TabsTrigger value="numbers">Sayılar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="graphs" className="mt-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Aylık Yeni Kullanıcı</CardTitle></CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={userGrowthData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="users" name="Yeni Kullanıcı" stroke="#f34723" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Top STK'lar — Bağış &amp; Gönüllülük</CardTitle></CardHeader>
                                    <CardContent>
                                        {topNgosByDonation.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-12">STK verisi bulunamadı.</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={topNgosByDonation}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="Bagis" name="Bağış (₺)" fill="#f34723" />
                                                    <Bar dataKey="Gonulluluk" name="Gönüllülük (Saat)" fill="#042654" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Yaş Demografisi</CardTitle></CardHeader>
                                    <CardContent>
                                        {ageGroupData.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-12">
                                                Kullanıcılar henüz doğum tarihi paylaşmadı.
                                            </p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={ageGroupData}
                                                        cx="50%" cy="50%"
                                                        labelLine={false}
                                                        outerRadius={90}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {ageGroupData.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Aylık Sosyal Etkileşim</CardTitle></CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={engagementData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Area type="monotone" dataKey="Gonderi" stackId="1" stroke="#f34723" fill="#f34723" fillOpacity={0.6} />
                                                <Area type="monotone" dataKey="Yorum" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                                                <Area type="monotone" dataKey="Begeni" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                {genderData.length > 0 && (
                                    <Card className="xl:col-span-2">
                                        <CardHeader><CardTitle className="text-base">Cinsiyet Dağılımı</CardTitle></CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart data={genderData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" allowDecimals={false} />
                                                    <YAxis type="category" dataKey="name" width={100} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" name="Kullanıcı Sayısı" fill="#042654" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="numbers" className="mt-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Aylık Kullanıcı Tablosu</CardTitle>
                                        <button
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => setGrowthSort(s => (s === 'desc' ? 'asc' : 'desc'))}
                                        >
                                            Sırala: {growthSort === 'desc' ? 'Yüksek → Düşük' : 'Düşük → Yüksek'}
                                        </button>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Ay</TableHead><TableHead className="text-right">Yeni Kullanıcı</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {sortedUserGrowth.map(d => (
                                                    <TableRow key={d.key}>
                                                        <TableCell>{d.month}</TableCell>
                                                        <TableCell className="text-right">{d.users.toLocaleString('tr-TR')}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Top STK Tablosu</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>STK</TableHead><TableHead className="text-right">Bağış (₺)</TableHead><TableHead className="text-right">Saat</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {topNgosByDonation.length === 0 ? (
                                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">STK verisi bulunamadı.</TableCell></TableRow>
                                                ) : (
                                                    topNgosByDonation.map(n => (
                                                        <TableRow key={n.name}>
                                                            <TableCell className="truncate max-w-[200px]">{n.name}</TableCell>
                                                            <TableCell className="text-right">{formatTL(n.Bagis)}</TableCell>
                                                            <TableCell className="text-right">{n.Gonulluluk.toLocaleString('tr-TR')}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
                </TabsContent>

                <TabsContent value="demographics" className="mt-6">
                    <DemographicsPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>}>
            <AnalyticsPageInner />
        </Suspense>
    );
}
