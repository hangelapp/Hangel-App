
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { COLLECTIONS } from '@/firebase/collections';
import {
    Star, Briefcase, School, FileText, Languages,
    HandCoins, Handshake, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Brain, Globe, HeartPulse, Users, Plane, Landmark, Cpu, Edit, Share2, Linkedin, Github, Palette, Instagram, Twitter, Download, Eye, Award, ArrowLeft, ArrowDownUp, Filter, CheckCircle, Leaf, X, Loader2, LogOut, Store, HeartHandshake,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// PERF: getImpactStory dynamic import (AI flow ~50KB, sadece kullanıcı
// "Etki hikayemi oluştur" butonuna basınca yüklenir).
// Eski sync import: import { getImpactStory } from '@/ai/flows/impact-story-flow';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { EtkiTabContent } from '@/components/profile/etki-tab-content';
import { enrichBadges } from '@/lib/badge-points';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { useTranslation } from '@/components/providers/language-provider';
import { UnifiedStoryCard, type UnifiedStoryData } from './_components/unified-story-card';
import { VolunteeringCertificates } from './_components/volunteering-certificates';


const InfoRow = ({ icon: Icon, label, value, verified, href }: { icon: React.ElementType; label: string; value?: string | string[] | null, verified?: boolean, href?: string }) => {
    const ValueComponent = href ? (
        <Link href={href} className="flex items-center gap-1 text-muted-foreground hover:underline">
            <span>{value}</span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    ) : (
        <p className="text-muted-foreground">{Array.isArray(value) ? value.join(', ') : value}</p>
    );

    return (
        <div className="flex justify-between items-start py-2 text-sm">
            <div className='flex items-start'>
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="font-medium ml-3">{label}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
                {ValueComponent}
                {verified && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
            </div>
        </div>
    );
};

const pointTransactions: { type: string; icon: React.ElementType; description: string; points: number; time: string }[] = [];

const transactionTypes = ['Alışveriş', 'Gönüllülük', 'Davet', 'Rozet'];

// eslint-disable-next-line unused-imports/no-unused-vars
const NextBadgeGoal = ({ userProfile: _userProfile }: { userProfile: unknown }) => {
    const [isVisible, setIsVisible] = useState(true);
    const nextBadge = {
        name: 'Gümüş Çevre Koruyucusu',
        icon: Leaf,
        progress: 80,
        current: 800,
        required: 1000,
    };
    if (!isVisible) return null;
    return (
        <Card className="relative bg-transparent shadow-none">
            <CardHeader>
                <CardTitle className="text-lg">Sıradaki Rozet Hedefi</CardTitle>
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setIsVisible(false)} aria-label="Kapat">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <Link href="/my-badges" className="block p-3 rounded-lg border hover:bg-accent">
                    <div className="flex items-center gap-4">
                        <nextBadge.icon className="h-8 w-8 text-green-600"/>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{nextBadge.name}</p>
                            <Progress value={nextBadge.progress} className="mt-1 h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{nextBadge.current} / {nextBadge.required} Puan</p>
                        </div>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
};

// BUG-28: Her bağlı kurumu kart olarak göster (logo + isim + sağ üst düzenle ikonu)
type ConnectionItem = { id: string; name?: string; logoUrl?: string; href: string };

const ConnectionSection = ({ value, title, count, editHref, editLabel, emptyText, items, icon: Icon, orgCountSuffix, editVerb }: {
    value: string;
    title: string;
    count: number;
    editHref: string;
    editLabel: string;
    emptyText: string;
    items: ConnectionItem[];
    icon: React.ComponentType<{ className?: string }>;
    orgCountSuffix: string;
    editVerb: string;
}) => (
    <AccordionItem value={value} className="border-b">
        <AccordionTrigger className="py-3.5 hover:no-underline">
            <span className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="flex flex-col items-start gap-0.5">
                    <span className="font-bold text-sm leading-tight text-left">{title}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{count} {orgCountSuffix}</span>
                </span>
            </span>
        </AccordionTrigger>
        <AccordionContent>
            {count === 0 ? (
                <div className="py-3 px-2 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href={editHref}>{editLabel}</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-2 pt-1">
                    <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm" className="h-7 rounded-xl text-xs">
                            <Link href={editHref}>
                                <Edit className="mr-1.5 h-3 w-3" /> {editVerb}
                            </Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map(item => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 p-3 rounded-2xl border border-black/5 bg-muted/20 hover:bg-accent/40 transition-colors"
                            >
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={item.logoUrl} alt={item.name || ''} />
                                    <AvatarFallback className="text-xs font-bold">
                                        {(item.name || '?').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-semibold truncate flex-1 min-w-0">{item.name || '—'}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </AccordionContent>
    </AccordionItem>
);

export default function ProfilePage() {
    const { t } = useTranslation();
    const [_profileUrl, setProfileUrl] = useState('');
    const router = useRouter();
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState<string[]>([]);
    const { toast } = useToast();
    const [isStoryLoading, setIsStoryLoading] = useState(false);
    const [stories, setStories] = useState<string[]>([]);
    const [showStoryDesigns, setShowStoryDesigns] = useState(false);
    const [viewingCert, setViewingCert] = useState<{ id?: string; title: string; organization: string; date: string } | null>(null);

    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();
    const auth = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch {
            toast({ variant: 'destructive', title: t('profilePage.logoutErrorTitle'), description: t('profilePage.logoutErrorDesc') });
        }
    };

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const emptyUser = {
        id: authUser?.uid || '',
        name: authUser?.displayName || '',
        username: '',
        avatarUrl: authUser?.photoURL || '',
        coverPhotoUrl: '',
        impactScore: 0,
        personalInfo: { email: '', phone: '', birthDate: '', gender: '', nationality: '', bloodType: '', address: { country: '', city: '', district: '', neighborhood: '', fullAddress: '' }, website: '', social: {} },
        volunteerInfo: { skills: [], dailySkills: [], interests: [], education: [], profession: '', sector: '', languages: [], programs: [], licenses: [], documents: [], travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] }, emergency: { available: false, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] } },
        stats: { totalDonation: 0, donationCount: 0, highestSingleDonation: 0, supportedNgosCount: 0, mostSupportedNgo: '', avgDonation: 0, volunteerHours: 0, completedProjects: 0, volunteerRank: {}, mostActiveVolunteerArea: '', avgVolunteerDuration: '', totalImpactValue: 0 },
    };

    const currentUser = useMemo(() => {
        if (!userData) return emptyUser;
        return {
            ...emptyUser,
            ...userData,
            personalInfo: { ...emptyUser.personalInfo, ...(userData.personalInfo || {}) },
            volunteerInfo: { ...emptyUser.volunteerInfo, ...(userData.volunteerInfo || {}) },
            stats: { ...emptyUser.stats, ...(userData.stats || {}) },
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, authUser]);

    const supportedNgoIds: string[] = Array.isArray((userData as { supportedNgos?: string[] } | null)?.supportedNgos) ? (userData as { supportedNgos?: string[] }).supportedNgos! : [];
    const volunteerNgoIds: string[] = Array.isArray((userData as { volunteerNgos?: string[] } | null)?.volunteerNgos) ? (userData as { volunteerNgos?: string[] }).volunteerNgos! : [];
    const followedBrandIds: string[] = Array.isArray((userData as { followedBrands?: string[] } | null)?.followedBrands) ? (userData as { followedBrands?: string[] }).followedBrands! : [];
    const joinedClubIds: string[] = Array.isArray((userData as { joinedClubs?: string[] } | null)?.joinedClubs) ? (userData as { joinedClubs?: string[] }).joinedClubs! : [];

    const supportedNgosQuery = useMemoFirebase(() => {
        if (!db || supportedNgoIds.length === 0) return null;
        return query(collection(db, COLLECTIONS.ngos), where(documentId(), 'in', supportedNgoIds.slice(0, 10)));
    }, [db, supportedNgoIds.join(',')]);
    const volunteerNgosQuery = useMemoFirebase(() => {
        if (!db || volunteerNgoIds.length === 0) return null;
        return query(collection(db, COLLECTIONS.ngos), where(documentId(), 'in', volunteerNgoIds.slice(0, 10)));
    }, [db, volunteerNgoIds.join(',')]);
    const followedBrandsQuery = useMemoFirebase(() => {
        if (!db || followedBrandIds.length === 0) return null;
        return query(collection(db, COLLECTIONS.brands), where(documentId(), 'in', followedBrandIds.slice(0, 10)));
    }, [db, followedBrandIds.join(',')]);
    const joinedClubsQuery = useMemoFirebase(() => {
        if (!db || joinedClubIds.length === 0) return null;
        return query(collection(db, COLLECTIONS.clubs), where(documentId(), 'in', joinedClubIds.slice(0, 10)));
    }, [db, joinedClubIds.join(',')]);

    // PERF (B): /api/users/me/profile-bundle ile 7 useCollection sorgusu yerine
    // tek HTTP request. Real-time updates kaybedilir (kullanıcı follow/unfollow
    // sonrası refresh gerek) — profile sayfası için kabul edilebilir trade-off.
    // useUser + useDoc(userRef) hala mevcut — user stats real-time kalır.
    type BundleEntity = { id: string; name?: string; avatarUrl?: string; logoUrl?: string; files?: { logo?: string }; slug?: string };
    interface ProfileBundle {
        supportedNgos: BundleEntity[];
        volunteerNgos: BundleEntity[];
        followedBrands: BundleEntity[];
        joinedClubs: BundleEntity[];
        badges: Array<Record<string, unknown>>;
        certificates: Array<Record<string, unknown>>;
        pastVolunteering: Array<Record<string, unknown>>;
        approvedApplications: Array<Record<string, unknown>>;
    }
    const [bundle, setBundle] = useState<ProfileBundle | null>(null);
    useEffect(() => {
        if (!authUser?.uid) return;
        let active = true;
        (async () => {
            try {
                const idToken = await authUser.getIdToken();
                const res = await fetch('/api/users/me/profile-bundle', {
                    headers: { authorization: `Bearer ${idToken}` },
                });
                const data = await res.json();
                if (active && data?.ok && data.bundle) setBundle(data.bundle as ProfileBundle);
            } catch { /* graceful */ }
        })();
        return () => { active = false; };
    }, [authUser?.uid]);

    const supportedNgosData = bundle?.supportedNgos;
    const volunteerNgosData = bundle?.volunteerNgos;
    const followedBrandsData = bundle?.followedBrands;
    const joinedClubsData = bundle?.joinedClubs;
    void supportedNgosQuery; void volunteerNgosQuery; void followedBrandsQuery; void joinedClubsQuery;

    // P1-10: badges / certificates / pastVolunteering were hardcoded empty
    // arrays. Now fetched from Firestore sub-collections under
    // `users/{uid}`. Empty states are rendered via the shared <EmptyState/>
    // component (my-applications PoC pattern).
    type BadgeDoc = { id?: string; name?: string; level?: string; iconName?: React.ElementType; currentPoints?: number; pointsRequired?: number };
    type CertificateDoc = { id?: string; title: string; organization: string; date: string };
    type PastVolunteeringDoc = {
        id: string;
        title: string;
        organization: string;
        description?: string;
        dates: { eventEnd: string };
        review?: { rating: number; comment: string };
    };

    // P2-8c: depend on the stable uid string, not the authUser object reference
    // (which is a new object every render and forces the listener to rebuild).
    const badgesRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.badges) : null),
        [db, authUser?.uid],
    );
    const certificatesRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.certificates) : null),
        [db, authUser?.uid],
    );
    const pastVolunteeringRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.pastVolunteering) : null),
        [db, authUser?.uid],
    );

    // PERF: sub-collection queries kullanılmıyor — bundle endpoint döner
    void badgesRef; void certificatesRef; void pastVolunteeringRef;
    const badgesData = bundle?.badges as BadgeDoc[] | undefined;
    const certificatesData = bundle?.certificates as CertificateDoc[] | undefined;
    const pastVolunteeringData = bundle?.pastVolunteering as PastVolunteeringDoc[] | undefined;

    // Sertifika kaynağı: kullanıcının manuel girdiği sertifikalar (users/{uid}/certificates)
    // + STK yetkilisi tarafından ONAYLANMIŞ gönüllülük başvurularından oluşan sertifikalar.
    // my-badges sayfası ile birebir aynı kaynak — dedupe (title|organization) ile.
    type ApprovedApp = { id?: string; type?: string; status?: string; title?: string; org?: string; date?: string };
    const approvedAppsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.applications), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    void approvedAppsQuery;
    const approvedAppsData = bundle?.approvedApplications as ApprovedApp[] | undefined;
    const approvedCertificates = useMemo<CertificateDoc[]>(() => {
        return (approvedAppsData ?? [])
            .filter(app => app.type === 'Gönüllülük' && app.status === 'Onaylandı')
            .map(app => ({
                id: `app-${app.id}`,
                title: app.title || 'Gönüllülük Sertifikası',
                organization: app.org || '',
                date: app.date || '',
            }));
    }, [approvedAppsData]);
    const certificates = useMemo<CertificateDoc[]>(() => {
        const manual = certificatesData ?? [];
        const seen = new Set(manual.map(c => `${c.title}|${c.organization}`));
        const merged: CertificateDoc[] = [...manual];
        for (const c of approvedCertificates) {
            const key = `${c.title}|${c.organization}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(c);
        }
        return merged;
    }, [certificatesData, approvedCertificates]);
    const pastVolunteering = useMemo(() => pastVolunteeringData ?? [], [pastVolunteeringData]);

    // PRD/Sync: my-badges sayfası ile aynı kaynaktan rozet listesi türet.
    // userData.areaPoints (my-badges canonical olarak yazıyor) → enrichBadges →
    // currentPoints + prevTierRequired dolu liste. badgesData (users/{uid}/badges
    // subcollection) artık kullanılmıyor — eski/manuel veri okumayı kaldırdık.
    const userAreaPoints = useMemo<Record<string, number>>(
        () => (userData as { areaPoints?: Record<string, number> } | undefined)?.areaPoints || {},
        [userData]
    );
    const badges = useMemo(() => enrichBadges(userAreaPoints), [userAreaPoints]);
    // Toplam Sosyal Etki Puanı = alan bazlı kazanılan puanların gerçek toplamı
    // (Son Puan İşlemleri ile aynı kaynak). areaPoints boşsa userData.impactScore'a düş.
    const realImpactScore = useMemo(() => {
        const sum = Object.values(userAreaPoints).reduce((s, v) => s + (Number(v) || 0), 0);
        return sum > 0 ? sum : (Number(currentUser.impactScore) || 0);
    }, [userAreaPoints, currentUser.impactScore]);
    // Profile tab'ında yarım rozetler dahil 1+ puanlı tüm rozetler gösterilir.
    const visibleBadges = useMemo(
        () => badges.filter(b => (b.currentPoints ?? 0) > 0),
        [badges]
    );
    void badgesData; // legacy subcollection — şu an kullanılmıyor (dashboard sync)


    const handleDownloadCertificate = async (cert: { title: string; organization: string; date: string }) => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();

            // Border
            pdf.setDrawColor(234, 88, 12);
            pdf.setLineWidth(2);
            pdf.rect(10, 10, pageW - 20, pageH - 20);
            pdf.setLineWidth(0.5);
            pdf.rect(14, 14, pageW - 28, pageH - 28);

            // Title
            pdf.setFontSize(32);
            pdf.setTextColor(234, 88, 12);
            pdf.text('SERTİFİKA', pageW / 2, 45, { align: 'center' });

            pdf.setFontSize(12);
            pdf.setTextColor(80, 80, 80);
            pdf.text('Bu sertifika hangel platformu aracılığıyla verilmiştir.', pageW / 2, 58, { align: 'center' });

            // Recipient
            pdf.setFontSize(14);
            pdf.setTextColor(60, 60, 60);
            pdf.text('Sayın', pageW / 2, 78, { align: 'center' });

            pdf.setFontSize(22);
            pdf.setTextColor(20, 20, 20);
            pdf.text(currentUser.name || 'Gönüllü', pageW / 2, 92, { align: 'center' });

            // Body
            pdf.setFontSize(13);
            pdf.setTextColor(60, 60, 60);
            const body = `${cert.organization} tarafından düzenlenen aşağıdaki çalışmayı başarıyla tamamladığını belgeler:`;
            pdf.text(body, pageW / 2, 108, { align: 'center', maxWidth: pageW - 60 });

            // Title of cert
            pdf.setFontSize(20);
            pdf.setTextColor(20, 20, 20);
            pdf.text(cert.title, pageW / 2, 130, { align: 'center', maxWidth: pageW - 60 });

            // Date / org footer
            pdf.setFontSize(11);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`Veren Kuruluş: ${cert.organization}`, pageW / 2, 160, { align: 'center' });
            pdf.text(`Tarih: ${cert.date}`, pageW / 2, 168, { align: 'center' });

            pdf.setFontSize(9);
            pdf.setTextColor(120, 120, 120);
            pdf.text('hangel.org', pageW / 2, pageH - 18, { align: 'center' });

            const filename = `sertifika-${cert.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
            pdf.save(filename);

            toast({ title: t('profilePage.certDownloaded'), description: `${cert.title} ${t('profilePage.certDownloadedSuffix')}` });
        } catch (error) {
            console.error('Certificate PDF generation failed:', error);
            toast({ variant: 'destructive', title: t('profilePage.certDownloadFail'), description: t('profilePage.pdfFailDesc') });
        }
    };

    // JPG indirme — sertifikayı canvas'a çizip image/jpeg olarak indirir (ek bağımlılık yok).
    const handleDownloadCertificateImage = (cert: { title: string; organization: string; date: string }) => {
        try {
            const W = 1240, H = 877;
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas yok');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 8; ctx.strokeRect(30, 30, W - 60, H - 60);
            ctx.lineWidth = 2; ctx.strokeRect(50, 50, W - 100, H - 100);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ea580c'; ctx.font = 'bold 66px Arial'; ctx.fillText('SERTİFİKA', W / 2, 180);
            ctx.fillStyle = '#505050'; ctx.font = '22px Arial'; ctx.fillText('Bu sertifika hangel platformu aracılığıyla verilmiştir.', W / 2, 230);
            ctx.fillStyle = '#3c3c3c'; ctx.font = '26px Arial'; ctx.fillText('Sayın', W / 2, 320);
            ctx.fillStyle = '#141414'; ctx.font = 'bold 46px Arial'; ctx.fillText(currentUser.name || 'Gönüllü', W / 2, 385);
            ctx.fillStyle = '#3c3c3c'; ctx.font = '24px Arial';
            ctx.fillText(`${cert.organization} tarafından düzenlenen aşağıdaki çalışmayı`, W / 2, 460);
            ctx.fillText('başarıyla tamamladığını belgeler:', W / 2, 495);
            ctx.fillStyle = '#141414'; ctx.font = 'bold 40px Arial'; ctx.fillText(cert.title, W / 2, 580);
            ctx.fillStyle = '#505050'; ctx.font = '20px Arial';
            ctx.fillText(`Veren Kuruluş: ${cert.organization}`, W / 2, 680);
            ctx.fillText(`Tarih: ${cert.date}`, W / 2, 715);
            ctx.fillStyle = '#787878'; ctx.font = '16px Arial'; ctx.fillText('hangel.org', W / 2, H - 60);
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/jpeg', 0.95);
            a.download = `sertifika-${cert.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            a.click();
            toast({ title: t('profilePage.certDownloaded'), description: `${cert.title} ${t('profilePage.certJpgSuffix')}` });
        } catch (error) {
            console.error('Certificate JPG generation failed:', error);
            toast({ variant: 'destructive', title: t('profilePage.certDownloadFail'), description: t('profilePage.jpgFailDesc') });
        }
    };

    const handleGenerateStories = async () => {
        setIsStoryLoading(true);
        setStories([]);
        try {
            // P1-8c: fetch a Firebase ID token once and pass it to every flow
            // invocation. Server verifies via Admin SDK before consuming the
            // per-user daily AI quota. We NEVER pass a bare uid — the server
            // wouldn't trust it anyway.
            const idToken = authUser ? await authUser.getIdToken() : undefined;
            const { getImpactStory } = await import('@/ai/flows/impact-story-flow');
            const storyPromises = Array(5).fill(0).map(() =>
                getImpactStory({
                    userName: currentUser.name.split(' ')[0],
                    donations: `${currentUser.stats.totalDonation} TL bağış yapıldı. En çok desteklenen STK: ${currentUser.stats.mostSupportedNgo}.`,
                    volunteering: `${currentUser.stats.volunteerHours} saat gönüllülük yapıldı. En aktif alan: ${currentUser.stats.mostActiveVolunteerArea}.`,
                    badges: `Toplamda ${badges.filter(b => (b.currentPoints ?? 0) >= (b.pointsRequired ?? 0)).length} rozet kazanıldı.`
                }, idToken)
            );
            const results = await Promise.all(storyPromises);
            const generatedStories = results.map(r => r.story).filter(Boolean);
            if (generatedStories.length > 0) {
                setStories(generatedStories);
            } else {
                 throw new Error("AI assistant did not return any stories.");
            }
        } catch (error) {
            console.error("Story generation failed:", error);
            // P1-8c: server-action error serialization preserves `.message` but
            // not the class — detect the quota cap via message prefix.
            const msg = error instanceof Error ? error.message : '';
            if (msg.includes('QUOTA_EXCEEDED')) {
                toast({
                    variant: "destructive",
                    title: t('profilePage.aiQuotaTitle'),
                    description: t('profilePage.aiQuotaDesc')
                });
            } else {
                toast({
                    variant: "destructive",
                    title: t('profilePage.aiFailTitle'),
                    description: t('profilePage.aiFailDesc')
                });
            }
        } finally {
            setIsStoryLoading(false);
        }
    }
    
    const sortedAndFilteredTransactions = useMemo(() => {
        // Ayrı puan-işlem logu yok; kullanıcının alan bazlı kazandığı puanlardan (areaPoints) türet.
        const base = pointTransactions.length > 0
            ? [...pointTransactions]
            : Object.entries(userAreaPoints)
                .filter(([, v]) => Number(v) > 0)
                .map(([area, pts]) => ({ type: 'Rozet', icon: Award, description: `${area} alanında kazanılan puan`, points: Number(pts), time: '' }));
        let transactions = base;

        if (filters.length > 0) {
            transactions = transactions.filter(tx => filters.includes(tx.type));
        }

        transactions = [...transactions].sort((a, b) => {
            let valA: number, valB: number;
            if (sortConfig.key === 'date') {
                valA = a.time ? parseISO(a.time).getTime() : 0;
                valB = b.time ? parseISO(b.time).getTime() : 0;
            } else { // points
                valA = a.points;
                valB = b.points;
            }
            return sortConfig.direction === 'desc' ? valB - valA : valA - valB;
        });

        return transactions;
    }, [sortConfig, filters, userAreaPoints]);


    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProfileUrl(window.location.href);
        }
    }, []);
    
    const VolunteerCard = ({ item }: { item: (typeof pastVolunteering)[0] }) => (
        <Card variant="glass">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={item.id} className="border-b-0">
                    <CardHeader>
                        <CardTitle className='text-base'>{item.title}</CardTitle>
                        <CardDescription>{item.organization} - {formatDistanceToNow(new Date(item.dates.eventEnd), { addSuffix: true, locale: tr })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm text-muted-foreground line-clamp-2'>{item.description}</p>
                    </CardContent>
                    {item.review && (
                        <div className="px-6 pb-2 pt-0">
                            <AccordionTrigger className="text-sm hover:no-underline p-0 justify-start gap-2">{t('profilePage.seeNgoReview')}</AccordionTrigger>
                        </div>
                    )}
                    <AccordionContent className="px-6">
                        {item.review && (
                            <div className="border-t pt-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("h-5 w-5", i < (item.review?.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                                    ))}
                                    <span className="ml-2 text-sm font-bold">{item.review?.rating ?? 0}/5</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 italic">"{item.review?.comment ?? ''}"</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
    
    const BadgeDisplay = ({ badge }: { badge: (typeof badges)[0] }) => {
        const currentPoints = badge.currentPoints ?? 0;
        const pointsRequired = badge.pointsRequired ?? 0;
        // Tier-bazlı ilerleme: 0'dan başlat (prevTierRequired enrichBadges'ten geliyor).
        const prev = (badge as { prevTierRequired?: number }).prevTierRequired ?? 0;
        const tierDelta = Math.max(1, pointsRequired - prev);
        const tierCurrent = Math.max(0, Math.min(tierDelta, currentPoints - prev));
        const tierProgress = Math.min((tierCurrent / tierDelta) * 100, 100);
        const isEarned = currentPoints >= pointsRequired;
        const pointsRemaining = Math.max(tierDelta - tierCurrent, 0);
        const IconName = badge.iconName ?? Award;
        return (
             <div className="flex flex-col items-center text-center w-full">
                 <div className={`p-3 rounded-full ${isEarned ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
                    <IconName className={`h-8 w-8 ${isEarned ? 'text-amber-500 dark:text-amber-300' : 'text-muted-foreground'}`} />
                 </div>
                 <p className="text-xs font-semibold mt-2">{badge.level}</p>
                 <p className="text-xs text-muted-foreground">{badge.name}</p>
                 <div className="w-full mt-2 space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${tierProgress}%`, backgroundColor: '#E34234' }}
                        />
                    </div>
                    <p className="text-[10px] font-bold tracking-wide">
                        <span className="text-muted-foreground">{tierCurrent.toLocaleString('tr-TR')}/{tierDelta.toLocaleString('tr-TR')}</span>
                        {' · '}
                        {isEarned ? (
                            <span className="text-green-600">{t('profilePage.completed')}</span>
                        ) : (
                            <span style={{ color: '#E34234' }}>{pointsRemaining.toLocaleString('tr-TR')} {t('profilePage.remaining')}</span>
                        )}
                    </p>
                 </div>
            </div>
        )
    }

    if (isUserLoading || isUserDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-dvh">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in-0 bg-secondary/30 backdrop-blur-sm min-h-screen">
            <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label={t('aria.back')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label={t('profilePage.logoutAria')}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
            <div className="p-4 space-y-6">
                <div className="flex flex-col items-center text-center">
                    <UserAvatar className="w-24 h-24 mb-4" />
                    <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                </div>
                <Tabs defaultValue="impact" className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="h-auto p-1 flex-wrap">
                            <TabsTrigger value="impact">{t('dashboard.profile.tabImpact')}</TabsTrigger>
                            <TabsTrigger value="about">{t('dashboard.profile.tabAbout')}</TabsTrigger>
                            <TabsTrigger value="volunteering">{t('dashboard.profile.tabVolunteering')}</TabsTrigger>
                            <TabsTrigger value="connections">{t('profilePage.tabConnections')}</TabsTrigger>
                            <TabsTrigger value="badges-certificates">{t('dashboard.profile.tabBadges')}</TabsTrigger>
                            <TabsTrigger value="story">{t('dashboard.profile.tabStory')}</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="impact" className="p-3 space-y-3">
                        <EtkiTabContent
                            user={{ impactScore: realImpactScore, stats: currentUser.stats }}
                            earnedBadgeCount={badges.filter((b: { currentPoints?: number; pointsRequired?: number }) => (b.currentPoints ?? 0) >= (b.pointsRequired ?? 0)).length}
                            certificateCount={certificates.length}
                            impactCardTitle={t('dashboard.profile.impactCardTitle')}
                            pastVolunteering={pastVolunteering as Array<Record<string, unknown>>}
                            inlineCompletedTasks={
                                Array.isArray(
                                    (userData as { completedVolunteerTasks?: Array<Record<string, unknown>> } | null)
                                        ?.completedVolunteerTasks,
                                )
                                    ? (userData as { completedVolunteerTasks?: Array<Record<string, unknown>> })
                                          .completedVolunteerTasks
                                    : []
                            }
                            fallbackProfession={currentUser.volunteerInfo?.profession ?? null}
                            volunteerNgos={(volunteerNgosData ?? []) as Parameters<typeof EtkiTabContent>[0]['volunteerNgos']}
                            supportedNgos={(supportedNgosData ?? []) as Parameters<typeof EtkiTabContent>[0]['supportedNgos']}
                        />
                        <Card variant="glass">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>{t('profilePage.lastTransactions')}</CardTitle>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('aria.filter')}>
                                                <Filter className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('profilePage.transactionType')}</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {transactionTypes.map(type => (
                                                <DropdownMenuCheckboxItem
                                                    key={type}
                                                    checked={filters.includes(type)}
                                                    onCheckedChange={(checked) => {
                                                        setFilters(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                                                    }}
                                                >
                                                    {type}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('aria.sort')}>
                                                <ArrowDownUp className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'desc' })}>{t('profilePage.sortDateNewest')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'asc' })}>{t('profilePage.sortDateOldest')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'desc' })}>{t('profilePage.sortPointsDesc')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'asc' })}>{t('profilePage.sortPointsAsc')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sortedAndFilteredTransactions.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">{t('profilePage.noTransactions')}</p>
                                ) : sortedAndFilteredTransactions.slice(0, 5).map((tx, index) => {
                                    const Icon = tx.icon;
                                    return (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p>{tx.description}</p>
                                                {tx.time && <p className="text-xs text-muted-foreground">{format(parseISO(tx.time), 'dd MMMM yyyy, HH:mm', { locale: tr })}</p>}
                                            </div>
                                        </div>
                                        <p className="font-bold text-green-600">+{tx.points} {t('profilePage.pointSuffix')}</p>
                                    </div>
                                )})}
                            </CardContent>
                             <CardFooter>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/my-badges">{t('profilePage.viewAllTransactions')}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="about" className="p-3 space-y-3">
                         {/* FEAT: Welcome'da seçilen intent'ler — kullanım amacı tercihleri */}
                         {Array.isArray((userData as { preferences?: { intents?: string[] } } | undefined)?.preferences?.intents) &&
                          ((userData as { preferences?: { intents?: string[] } }).preferences!.intents!.length > 0) && (
                            <Card variant="glass">
                                <CardHeader className="flex flex-row justify-between items-center pb-2">
                                    <CardTitle className='text-lg flex items-center gap-2'>
                                        <Sparkles className='h-5 w-5 text-fuchsia-500' /> {t('profilePage.usagePreferences')}
                                    </CardTitle>
                                    <Button asChild variant="ghost" size="icon" aria-label={t('profilePage.editLabel')}>
                                        <Link href="/settings/intents">
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-2 flex flex-wrap gap-1.5">
                                    {((userData as { preferences?: { intents?: string[] } }).preferences!.intents!).map((intent) => (
                                        <span key={intent} className="text-[11px] px-2.5 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 font-semibold">
                                            {t(`welcome.intents.${intent}`)}
                                        </span>
                                    ))}
                                </CardContent>
                            </Card>
                         )}
                         <Card variant="glass">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className='text-lg'>{t('profilePage.personalInfoTitle')}</CardTitle>
                                 <Button asChild variant="ghost" size="icon" aria-label={t('profilePage.editProfileAria')}>
                                    <Link href="/settings/profile">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Mail} label={t('profilePage.fieldEmail')} value={currentUser.personalInfo.email} verified />
                                <InfoRow icon={Phone} label={t('profilePage.fieldPhone')} value={currentUser.personalInfo.phone} verified />
                                <InfoRow icon={Cake} label={t('profilePage.fieldBirthDate')} value={currentUser.personalInfo.birthDate ? format(new Date(currentUser.personalInfo.birthDate), 'dd MMMM yyyy', { locale: tr }) : '-'} />
                                 <InfoRow icon={Globe} label={t('profilePage.fieldNationality')} value={currentUser.personalInfo.nationality} />
                                <InfoRow icon={UserIcon} label={t('profilePage.fieldGender')} value={currentUser.personalInfo.gender} />
                                <InfoRow icon={MapPin} label={t('profilePage.fieldCity')} value={currentUser.personalInfo.address.city || '-'} />
                                <InfoRow icon={MapPin} label={t('profilePage.fieldDistrict')} value={currentUser.personalInfo.address.district || '-'} />
                                <InfoRow icon={MapPin} label={t('profilePage.fieldNeighborhood')} value={(currentUser.personalInfo.address as { neighborhood?: string }).neighborhood || '-'} />
                                {(currentUser.personalInfo.address as { fullAddress?: string }).fullAddress && (
                                    <InfoRow icon={MapPin} label={t('profilePage.fieldFullAddress')} value={(currentUser.personalInfo.address as { fullAddress?: string }).fullAddress} />
                                )}
                                <InfoRow icon={Globe} label={t('profilePage.fieldWebsite')} value={currentUser.personalInfo.website} />
                                <InfoRow icon={Linkedin} label={t('profilePage.fieldLinkedin')} value={currentUser.personalInfo.social?.linkedin} />
                                <InfoRow icon={Github} label={t('profilePage.fieldGithub')} value={currentUser.personalInfo.social?.github} />
                                <InfoRow icon={Palette} label={t('profilePage.fieldBehance')} value={currentUser.personalInfo.social?.behance} />
                                <InfoRow icon={Instagram} label={t('profilePage.fieldInstagram')} value={currentUser.personalInfo.social?.instagram} />
                                <InfoRow icon={Twitter} label={t('profilePage.fieldTwitter')} value={currentUser.personalInfo.social?.twitter} />
                                {(((currentUser.personalInfo.social as { custom?: Array<{ platform?: string; url?: string }> } | undefined)?.custom) || []).map((link, i) =>
                                    link?.platform && link?.url ? (
                                        <InfoRow key={`custom-${i}`} icon={Globe} label={link.platform} value={link.url} />
                                    ) : null
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="volunteering" className="p-4 space-y-4">
                         <Card variant="glass">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className='text-lg'>{t('profilePage.volunteerInfoTitle')}</CardTitle>
                                <Button asChild variant="ghost" size="icon" aria-label={t('profilePage.editVolunteerAria')}>
                                    <Link href="/settings/volunteer">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Sparkles} label={t('profilePage.fieldInterests')} value={currentUser.volunteerInfo.interests.join(', ')} />
                                <InfoRow icon={Brain} label={t('profilePage.fieldSkills')} value={currentUser.volunteerInfo.skills.join(', ')} />
                                <InfoRow icon={Users} label={t('profilePage.fieldDailySkills')} value={currentUser.volunteerInfo.dailySkills.join(', ')} />
                                <InfoRow icon={Cpu} label={t('profilePage.fieldPrograms')} value={currentUser.volunteerInfo.programs.join(', ')} />
                                <InfoRow icon={Languages} label={t('profilePage.fieldLanguages')} value={currentUser.volunteerInfo.languages.join(', ')} />
                                <InfoRow icon={FileText} label={t('profilePage.fieldLicenses')} value={currentUser.volunteerInfo.licenses.join(', ')} verified />
                                <InfoRow icon={FileText} label={t('profilePage.fieldDocuments')} value={currentUser.volunteerInfo.documents.join(', ')} verified />
                                <InfoRow icon={Plane} label={t('profilePage.fieldDomestic')} value={currentUser.volunteerInfo.travelInfo.domesticObstacle ? t('profilePage.hasObstacle') : t('profilePage.noObstacle')} />
                                <InfoRow icon={Plane} label={t('profilePage.fieldInternational')} value={currentUser.volunteerInfo.travelInfo.internationalObstacle ? t('profilePage.hasObstacle') : t('profilePage.noObstacle')} />
                                <InfoRow icon={Landmark} label={t('profilePage.fieldVisas')} value={currentUser.volunteerInfo.travelInfo.visas.join(', ')} />
                                <InfoRow icon={School} label={t('profilePage.fieldEducation')} value={currentUser.volunteerInfo.education.map((e: { school?: string }) => e.school || '').join('; ')} verified />
                                <InfoRow icon={Briefcase} label={t('profilePage.fieldSector')} value={currentUser.volunteerInfo.sector} />
                                <InfoRow icon={Briefcase} label={t('profilePage.fieldProfession')} value={currentUser.volunteerInfo.profession} />
                                 <InfoRow icon={HeartPulse} label={t('profilePage.fieldEmergencyAvail')} value={currentUser.volunteerInfo.emergency.available ? t('profilePage.yesAvailable') : t('profilePage.notAvailable')} />
                                <InfoRow icon={HeartPulse} label={t('profilePage.fieldChronic')} value={currentUser.volunteerInfo.emergency.hasChronicIllness ? t('profilePage.yes') : t('profilePage.no')} />
                                <InfoRow icon={HeartPulse} label={t('profilePage.fieldRegularMed')} value={currentUser.volunteerInfo.emergency.usesRegularMedication ? t('profilePage.yes') : t('profilePage.no')} />
                                <InfoRow icon={HeartPulse} label={t('profilePage.fieldPhysical')} value={currentUser.volunteerInfo.emergency.hasPhysicalLimitation ? t('profilePage.yes') : t('profilePage.no')} />
                                <InfoRow icon={UserIcon} label={t('profilePage.fieldEmergencyContact')} value={currentUser.volunteerInfo.emergency.emergencyContacts[0]?.name} />
                                <InfoRow icon={Phone} label={t('profilePage.fieldEmergencyPhone')} value={currentUser.volunteerInfo.emergency.emergencyContacts[0]?.phone} />
                            </CardContent>
                        </Card>
                        <Card variant="glass">
                             <CardHeader><CardTitle className='text-lg'>{t('profilePage.pastVolunteering')}</CardTitle></CardHeader>
                             <CardContent className='space-y-4'>
                                 {pastVolunteering.length > 0 ? (
                                     pastVolunteering.map(item => <VolunteerCard key={item.id} item={item} />)
                                 ) : (
                                     <EmptyState
                                         icon={Handshake}
                                         title={t('emptyStates.noVolunteeringDone')}
                                         description={t('profilePage.noPastVolunteeringDesc')}
                                         action={{ label: t('profilePage.exploreEvents'), href: '/events' }}
                                     />
                                 )}
                                 <Button variant="secondary" className='w-full'>{t('profilePage.seeAllPastVolunteering')}</Button>
                             </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="connections" className="p-4 space-y-4">
                        <Card variant="glass" className="rounded-2xl">
                            <CardHeader><CardTitle className='text-lg'>{t('profilePage.myConnections')}</CardTitle></CardHeader>
                            <CardContent>
                                <Accordion type="multiple" className="w-full">
                                    <ConnectionSection
                                        value="donor-ngos"
                                        title={t('profilePage.donorNgosTitle')}
                                        count={supportedNgoIds.length}
                                        editHref="/settings/ngo-selection"
                                        editLabel={t('profilePage.editDonorNgos')}
                                        emptyText={t('profilePage.noDonorNgos')}
                                        orgCountSuffix={t('profilePage.orgCountSuffix')}
                                        editVerb={t('profilePage.editLabel')}
                                        icon={HandCoins}
                                        items={(supportedNgosData || []).map(ngo => ({
                                            id: ngo.id,
                                            name: ngo.name,
                                            logoUrl: ngo.avatarUrl || ngo.logoUrl || ngo.files?.logo,
                                            href: `/ngos/${ngo.id}`,
                                        }))}
                                    />
                                    <ConnectionSection
                                        value="volunteer-ngos"
                                        title={t('profilePage.volunteerNgosTitle')}
                                        count={volunteerNgoIds.length}
                                        editHref="/settings/volunteer-ngo-selection"
                                        editLabel={t('profilePage.editVolunteerNgos')}
                                        emptyText={t('profilePage.noVolunteerNgos')}
                                        orgCountSuffix={t('profilePage.orgCountSuffix')}
                                        editVerb={t('profilePage.editLabel')}
                                        icon={HeartHandshake}
                                        items={(volunteerNgosData || []).map(ngo => ({
                                            id: ngo.id,
                                            name: ngo.name,
                                            logoUrl: ngo.avatarUrl || ngo.logoUrl || ngo.files?.logo,
                                            href: `/ngos/${ngo.id}`,
                                        }))}
                                    />
                                    <ConnectionSection
                                        value="brands"
                                        title={t('profilePage.followedBrandsTitle')}
                                        count={followedBrandIds.length}
                                        editHref="/settings/brands"
                                        editLabel={t('profilePage.editFollowedBrands')}
                                        emptyText={t('profilePage.noFollowedBrands')}
                                        orgCountSuffix={t('profilePage.orgCountSuffix')}
                                        editVerb={t('profilePage.editLabel')}
                                        icon={Store}
                                        items={(followedBrandsData || []).map(brand => ({
                                            id: brand.id,
                                            name: brand.name,
                                            logoUrl: brand.logoUrl,
                                            href: `/market/${brand.slug || brand.id}`,
                                        }))}
                                    />
                                    <ConnectionSection
                                        value="clubs"
                                        title={t('profilePage.joinedClubsTitle')}
                                        count={joinedClubIds.length}
                                        editHref="/clubs"
                                        editLabel={t('profilePage.editJoinedClubs')}
                                        emptyText={t('profilePage.noJoinedClubs')}
                                        orgCountSuffix={t('profilePage.orgCountSuffix')}
                                        editVerb={t('profilePage.editLabel')}
                                        icon={School}
                                        items={(joinedClubsData || []).map(club => ({
                                            id: club.id,
                                            name: club.name,
                                            logoUrl: club.avatarUrl || club.logoUrl || club.files?.logo,
                                            href: `/clubs/profile/${club.id}`,
                                        }))}
                                    />
                                </Accordion>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="badges-certificates" className="p-4 space-y-4">
                        <Card variant="glass">
                            <CardHeader><CardTitle className='text-lg'>{t('profilePage.earnedBadgesTitle')}</CardTitle></CardHeader>
                            <CardContent>
                                {visibleBadges.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {visibleBadges.slice(0, 6).map((badge) => <BadgeDisplay key={badge.id} badge={badge} />)}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={Award}
                                        title={t('emptyStates.noBadges')}
                                        description={t('profilePage.noBadgesDesc')}
                                    />
                                )}
                            </CardContent>
                             <CardFooter className='pt-4'>
                                 <Button asChild variant="secondary" className='w-full'>
                                     <Link href="/my-badges">{t('profilePage.seeAllBadges')}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                         <Card variant="glass">
                            <CardHeader><CardTitle className='text-lg'>{t('profilePage.myCertificates')}</CardTitle></CardHeader>
                            <CardContent>
                            {certificates.length > 0 ? (
                                <div className="space-y-4">
                                    {certificates.map(cert => (
                                        <div key={cert.id} className='relative p-4 rounded-lg border'>
                                        <div className='pr-24'>
                                            <p className='text-sm text-muted-foreground'>{cert.organization} - {cert.date}</p>
                                            <p className='font-semibold mt-1'>{cert.title}</p>
                                        </div>
                                        <div className='absolute top-2 right-2 flex gap-1 bg-background/50 backdrop-blur-sm rounded-md p-1'>
                                            <Button aria-label={t('profilePage.certViewAria')} size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewingCert({ id: cert.id, title: cert.title, organization: cert.organization, date: cert.date })}><Eye className="h-4 w-4"/></Button>
                                            <Button aria-label={t('profilePage.certDownloadAria')} size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadCertificate({ title: cert.title, organization: cert.organization, date: cert.date })}><Download className="h-4 w-4"/></Button>
                                            <Button aria-label={t('profilePage.certShareAria')} size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                                                const shareData = { title: cert.title, text: `${cert.title} — ${cert.organization} (${cert.date})${t('profilePage.shareTextSuffix')}`, url: typeof window !== 'undefined' ? window.location.href : '' };
                                                if (typeof navigator !== 'undefined' && navigator.share) {
                                                    try { await navigator.share(shareData); } catch { /* user cancelled */ }
                                                } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                                    toast({ title: t('profilePage.copied'), description: t('profilePage.copiedDesc') });
                                                } else {
                                                    toast({ title: t('profilePage.shareTitle'), description: t('profilePage.shareUnsupported') });
                                                }
                                            }}><Share2 className="h-4 w-4"/></Button>
                                        </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title={t('emptyStates.noCertificates')}
                                    description={t('profilePage.noCertificatesDesc')}
                                />
                            )}
                            </CardContent>
                        </Card>
                        {/* FEAT: Gönüllülük Sertifikaları — NGO logo + puan + yorum + A6 yaka kartı.
                            Kaynak: pastVolunteering (review içerir) + approvedApplications + manual
                            certificates (yedek). Logo lookup volunteer/supported NGO bundle'dan. */}
                        <VolunteeringCertificates
                            userName={currentUser.name || ''}
                            pastVolunteering={pastVolunteering as Parameters<typeof VolunteeringCertificates>[0]['pastVolunteering']}
                            approvedApplications={(approvedAppsData ?? []) as Parameters<typeof VolunteeringCertificates>[0]['approvedApplications']}
                            manualCertificates={(certificatesData ?? []) as Parameters<typeof VolunteeringCertificates>[0]['manualCertificates']}
                            volunteerNgos={(volunteerNgosData ?? []) as Parameters<typeof VolunteeringCertificates>[0]['volunteerNgos']}
                            supportedNgos={(supportedNgosData ?? []) as Parameters<typeof VolunteeringCertificates>[0]['supportedNgos']}
                        />
                    </TabsContent>


                    <TabsContent value="story" className="p-4 space-y-4">
                        <Card variant="glass-prominent">
                            <CardHeader>
                                <CardTitle className='text-lg flex items-center gap-2'><Sparkles className='h-5 w-5 text-primary' /> {t('profilePage.impactStoryTitle')}</CardTitle>
                                <CardDescription>{t('profilePage.impactStoryDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!showStoryDesigns ? (
                                    <Button onClick={() => setShowStoryDesigns(true)} className="w-full">
                                        <Sparkles className="mr-2 h-4 w-4" /> {t('profilePage.createStoryBtn')}
                                    </Button>
                                ) : (
                                    <>
                                        {(() => {
                                            // En yüksek kazanılan rozet seviyesi (Bakır < Bronz < Gümüş < Altın < Platin)
                                            const LEVEL_ORDER = ['Bakır', 'Bronz', 'Gümüş', 'Altın', 'Platin'] as const;
                                            const earned = badges.filter(b => (b.currentPoints ?? 0) >= (b.pointsRequired ?? 0));
                                            const highestBadgeLevel = earned
                                                .map(b => b.level as string)
                                                .sort((a, b) => LEVEL_ORDER.indexOf(b as typeof LEVEL_ORDER[number]) - LEVEL_ORDER.indexOf(a as typeof LEVEL_ORDER[number]))[0];
                                            const countryRank = (currentUser.stats.volunteerRank as { country?: string | number } | undefined)?.country;
                                            return (
                                                <UnifiedStoryCard
                                                    data={{
                                                        name: currentUser.name || t('profilePage.anonMember'),
                                                        avatarUrl: currentUser.avatarUrl,
                                                        impactScore: Number(currentUser.impactScore) || 0,
                                                        totalDonation: Number(currentUser.stats.totalDonation) || 0,
                                                        volunteerHours: Number(currentUser.stats.volunteerHours) || 0,
                                                        totalImpactValue: Number(currentUser.stats.totalImpactValue) || 0,
                                                        highestBadgeLevel,
                                                        certificateCount: certificates.length,
                                                        countryRank,
                                                        supportedNgos: (supportedNgosData || []).map(n => ({ id: n.id, name: n.name, avatarUrl: n.avatarUrl })),
                                                        volunteerNgos: (volunteerNgosData || []).map(n => ({ id: n.id, name: n.name, avatarUrl: n.avatarUrl })),
                                                        joinedClubs: (joinedClubsData || []).map(c => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl })),
                                                    } as UnifiedStoryData}
                                                />
                                            );
                                        })()}
                                        <Button variant="outline" onClick={() => setShowStoryDesigns(false)} className="w-full">
                                            {t('profilePage.hideStoryBtn')}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card variant="glass">
                            <CardHeader>
                                <CardTitle className='text-lg flex items-center gap-2'><Sparkles className='h-5 w-5 text-primary' /> {t('profilePage.aiNarrationTitle')}</CardTitle>
                                <CardDescription>{t('profilePage.aiNarrationDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={handleGenerateStories} disabled={isStoryLoading} variant="secondary" className="w-full">
                                    {isStoryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('profilePage.aiNarrationLoading')}</> : t('profilePage.aiNarrationBtn')}
                                </Button>
                                {stories.length > 0 && (
                                    <div className="space-y-4">
                                        {stories.map((story, index) => (
                                            <div key={index} className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-lg"
                                                 dangerouslySetInnerHTML={{ __html: sanitizeHtml(story) }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="text-xs text-muted-foreground">
                                <div className="w-full flex justify-between items-center">
                                    <p>{t('profilePage.aiFooter')}</p>
                                    <Link href="/support/ai-assistants" className="hover:underline text-primary">{t('profilePage.aiHowItWorks')}</Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            <Dialog open={!!viewingCert} onOpenChange={(open) => { if (!open) setViewingCert(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('profilePage.certPreviewTitle')}</DialogTitle>
                        <DialogDescription>{viewingCert?.organization}</DialogDescription>
                    </DialogHeader>
                    {viewingCert && (
                        <div className="rounded-lg border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-background text-center space-y-3">
                            <Award className="h-12 w-12 text-primary mx-auto" />
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('profilePage.certWord')}</p>
                            <p className="text-lg font-bold leading-tight">{viewingCert.title}</p>
                            <p className="text-sm text-muted-foreground">{t('profilePage.certOwner')} <span className="font-medium text-foreground">{currentUser.name || '-'}</span></p>
                            <p className="text-sm text-muted-foreground">{viewingCert.organization}</p>
                            <p className="text-xs text-muted-foreground">{t('profilePage.certDate')} {viewingCert.date}</p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="secondary" onClick={() => setViewingCert(null)}>{t('profilePage.close')}</Button>
                        {viewingCert && (
                            <>
                                <Button variant="outline" onClick={() => handleDownloadCertificateImage({ title: viewingCert.title, organization: viewingCert.organization, date: viewingCert.date })}>
                                    <Download className="mr-2 h-4 w-4" /> {t('profilePage.jpgDownload')}
                                </Button>
                                <Button onClick={() => handleDownloadCertificate({ title: viewingCert.title, organization: viewingCert.organization, date: viewingCert.date })}>
                                    <Download className="mr-2 h-4 w-4" /> {t('profilePage.pdfDownload')}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
