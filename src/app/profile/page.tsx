
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { COLLECTIONS } from '@/firebase/collections';
import {
    Star, Briefcase, School, FileText, Languages,
    HandCoins, Hourglass, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Handshake, Brain, Globe, HeartPulse, BarChart3, TrendingUp, Target, DollarSign, Users, Plane, Landmark, Cpu, Edit, Share2, Linkedin, Github, Palette, Instagram, Twitter, Download, Eye, Award, ArrowLeft, ArrowDownUp, Filter, CheckCircle, Leaf, X, Loader2, LogOut
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
import { getImpactStory } from '@/ai/flows/impact-story-flow';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sanitizeHtml } from '@/lib/sanitize-html';


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
        <div className="flex justify-between items-start py-3 text-sm">
            <div className='flex items-start'>
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="font-medium ml-4">{label}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
                {ValueComponent}
                {verified && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string | number, label: string }) => (
    <div className='text-center p-2'>
        <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

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

export default function ProfilePage() {
    const [_profileUrl, setProfileUrl] = useState('');
    const router = useRouter();
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState<string[]>([]);
    const { toast } = useToast();
    const [isStoryLoading, setIsStoryLoading] = useState(false);
    const [stories, setStories] = useState<string[]>([]);
    const [viewingCert, setViewingCert] = useState<{ id?: string; title: string; organization: string; date: string } | null>(null);

    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();
    const auth = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu.' });
        }
    };

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, 'users', authUser.uid);
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
        return query(collection(db, 'ngos'), where(documentId(), 'in', supportedNgoIds.slice(0, 10)));
    }, [db, supportedNgoIds.join(',')]);
    const volunteerNgosQuery = useMemoFirebase(() => {
        if (!db || volunteerNgoIds.length === 0) return null;
        return query(collection(db, 'ngos'), where(documentId(), 'in', volunteerNgoIds.slice(0, 10)));
    }, [db, volunteerNgoIds.join(',')]);
    const followedBrandsQuery = useMemoFirebase(() => {
        if (!db || followedBrandIds.length === 0) return null;
        return query(collection(db, 'brands'), where(documentId(), 'in', followedBrandIds.slice(0, 10)));
    }, [db, followedBrandIds.join(',')]);
    const joinedClubsQuery = useMemoFirebase(() => {
        if (!db || joinedClubIds.length === 0) return null;
        return query(collection(db, 'clubs'), where(documentId(), 'in', joinedClubIds.slice(0, 10)));
    }, [db, joinedClubIds.join(',')]);

    const { data: supportedNgosData } = useCollection<{ name?: string; avatarUrl?: string }>(supportedNgosQuery);
    const { data: volunteerNgosData } = useCollection<{ name?: string; avatarUrl?: string }>(volunteerNgosQuery);
    const { data: followedBrandsData } = useCollection<{ name?: string; logoUrl?: string; slug?: string }>(followedBrandsQuery);
    const { data: joinedClubsData } = useCollection<{ name?: string; avatarUrl?: string }>(joinedClubsQuery);

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

    const { data: badgesData } = useCollection<BadgeDoc>(badgesRef);
    const { data: certificatesData } = useCollection<CertificateDoc>(certificatesRef);
    const { data: pastVolunteeringData } = useCollection<PastVolunteeringDoc>(pastVolunteeringRef);

    const badges = useMemo(() => badgesData ?? [], [badgesData]);
    const certificates = useMemo(() => certificatesData ?? [], [certificatesData]);
    const pastVolunteering = useMemo(() => pastVolunteeringData ?? [], [pastVolunteeringData]);


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

            toast({ title: 'Sertifika İndirildi', description: `${cert.title} başarıyla indirildi.` });
        } catch (error) {
            console.error('Certificate PDF generation failed:', error);
            toast({ variant: 'destructive', title: 'Sertifika İndirilemedi', description: 'PDF oluşturulurken bir hata oluştu.' });
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
                    title: "Günlük yapay zeka kotası doldu",
                    description: "Bugün için hikaye oluşturma limitine ulaştın. Lütfen yarın tekrar dene."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Hikaye oluşturulamadı",
                    description: "Yapay zeka ile hikaye oluşturulurken bir sorun oluştu."
                });
            }
        } finally {
            setIsStoryLoading(false);
        }
    }
    
    const sortedAndFilteredTransactions = useMemo(() => {
        let transactions = [...pointTransactions];

        if (filters.length > 0) {
            transactions = transactions.filter(tx => filters.includes(tx.type));
        }

        transactions.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'date') {
                valA = parseISO(a.time).getTime();
                valB = parseISO(b.time).getTime();
            } else { // points
                valA = a.points;
                valB = b.points;
            }

            if (sortConfig.direction === 'desc') {
                return valB - valA;
            } else {
                return valA - valA;
            }
        });

        return transactions;
    }, [sortConfig, filters]);


    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProfileUrl(window.location.href);
        }
    }, []);
    
    const VolunteerCard = ({ item }: { item: (typeof pastVolunteering)[0] }) => (
        <Card>
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
                            <AccordionTrigger className="text-sm hover:no-underline p-0 justify-start gap-2">STK Değerlendirmesini Gör</AccordionTrigger>
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
        const isEarned = currentPoints >= pointsRequired;
        const pointsNeeded = pointsRequired - currentPoints;
        const IconName = badge.iconName ?? Award;
        return (
             <div className="flex flex-col items-center text-center">
                 <div className={`p-3 rounded-full ${isEarned ? 'bg-amber-100' : 'bg-muted'}`}>
                    <IconName className={`h-8 w-8 ${isEarned ? 'text-amber-500' : 'text-muted-foreground'}`} />
                 </div>
                 <p className="text-xs font-semibold mt-2">{badge.level}</p>
                 <p className="text-xs text-muted-foreground">{badge.name}</p>
                 {isEarned ? (
                    <p className="text-xs font-semibold text-green-600 mt-1">Kazanıldı!</p>
                ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                        {pointsNeeded > 0 ? `${pointsNeeded} Puan Kaldı` : `${currentPoints}/${pointsRequired} Puan`}
                    </p>
                )}
            </div>
        )
    }

    if (isUserLoading || isUserDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in-0 bg-secondary min-h-screen">
            <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label="Geri">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label="Çıkış yap">
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
                            <TabsTrigger value="impact">Etki</TabsTrigger>
                            <TabsTrigger value="about">Hakkında</TabsTrigger>
                            <TabsTrigger value="volunteering">Gönüllülük</TabsTrigger>
                            <TabsTrigger value="badges-certificates">Rozetler & Sertifikalar</TabsTrigger>
                            <TabsTrigger value="story">Hikaye</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="impact" className="p-4 space-y-4">
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle>Toplam Sosyal Etki Puanın</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-6xl font-bold text-primary">{currentUser.impactScore.toLocaleString('tr-TR')}</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Özet İstatistikler</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatCard icon={HandCoins} value={`${currentUser.stats.totalDonation.toLocaleString('tr-TR')} ₺`} label="Toplam Bağış" />
                                <StatCard icon={Sparkles} value={`${currentUser.stats.totalImpactValue.toLocaleString('tr-TR')} ₺`} label="Sosyal Etki Mali Değeri" />
                                <StatCard icon={Handshake} value={`${currentUser.stats.volunteerHours} Saat`} label="Gönüllülük" />
                                <StatCard icon={Award} value={badges.filter((b: { currentPoints?: number; pointsRequired?: number }) => (b.currentPoints ?? 0) >= (b.pointsRequired ?? 0)).length} label="Kazanılan Rozet" />
                                <StatCard icon={FileText} value={certificates.length} label="Sertifika" />
                                <StatCard icon={BarChart3} value={currentUser.stats.volunteerRank.country} label="Türkiye Sıralaması" />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle className='text-lg flex items-center gap-2'><BarChart3 className='h-5 w-5 text-primary' />Gönüllülük İstatistikleri</CardTitle></CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Hourglass} label="Toplam Gönüllülük Saati" value={`${currentUser.stats.volunteerHours} Saat`} />
                                <InfoRow icon={Handshake} label="Tamamlanan Proje Sayısı" value={`${currentUser.stats.completedProjects} Proje`} />
                                <InfoRow icon={Sparkles} label="En Aktif Gönüllülük Alanı" value={currentUser.stats.mostActiveVolunteerArea} />
                                <InfoRow icon={TrendingUp} label="Türkiye Gönüllü Sıralaması" value={currentUser.stats.volunteerRank.country} href="/leaderboard" />
                                 <InfoRow icon={TrendingUp} label="Şehir Gönüllü Sıralaması" value={currentUser.stats.volunteerRank.city} href="/leaderboard" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className='text-lg flex items-center gap-2'><HandCoins className='h-5 w-5 text-primary' />Bağış İstatistikleri</CardTitle></CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={DollarSign} label="Toplam Bağış Tutarı" value={`${currentUser.stats.totalDonation.toLocaleString('tr-TR')} ₺`} />
                                <InfoRow icon={FileText} label="Toplam İşlem Adedi" value={`${currentUser.stats.donationCount} İşlem`} />
                                <InfoRow icon={Target} label="En Çok Desteklenen STK" value={currentUser.stats.mostSupportedNgo} />
                                <InfoRow icon={TrendingUp} label="Tek Seferde En Yüksek Bağış" value={`${currentUser.stats.highestSingleDonation.toLocaleString('tr-TR')} ₺`} />
                                <InfoRow icon={BarChart3} label="Ortalama Bağış Tutarı" value={`${currentUser.stats.avgDonation.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Son Puan İşlemleri</CardTitle>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Filtrele">
                                                <Filter className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>İşlem Türü</DropdownMenuLabel>
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sırala">
                                                <ArrowDownUp className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'desc' })}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'asc' })}>Tarihe Göre (En Eski)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'desc' })}>Puana Göre (En Yüksek)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'asc' })}>Puana Göre (En Düşük)</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sortedAndFilteredTransactions.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">Henüz puan işleminiz bulunmuyor.</p>
                                ) : sortedAndFilteredTransactions.slice(0, 5).map((tx, index) => {
                                    const Icon = tx.icon;
                                    return (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p>{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(tx.time), 'dd MMMM yyyy, HH:mm', { locale: tr })}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-green-600">+{tx.points} Puan</p>
                                    </div>
                                )})}
                            </CardContent>
                             <CardFooter>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/my-badges">Tüm İşlemleri Gör</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="about" className="p-4 space-y-4">
                         <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className='text-lg'>Kişisel Bilgiler</CardTitle>
                                 <Button asChild variant="ghost" size="icon" aria-label="Profili düzenle">
                                    <Link href="/settings/profile">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Mail} label="E-posta" value={currentUser.personalInfo.email} verified />
                                <InfoRow icon={Phone} label="Telefon" value={currentUser.personalInfo.phone} verified />
                                <InfoRow icon={Cake} label="Doğum Tarihi" value={currentUser.personalInfo.birthDate ? format(new Date(currentUser.personalInfo.birthDate), 'dd MMMM yyyy', { locale: tr }) : '-'} />
                                 <InfoRow icon={Globe} label="Uyruk" value={currentUser.personalInfo.nationality} />
                                <InfoRow icon={UserIcon} label="Cinsiyet" value={currentUser.personalInfo.gender} />
                                <InfoRow icon={MapPin} label="Adres" value={`${currentUser.personalInfo.address.district}, ${currentUser.personalInfo.address.city}`} />
                                <InfoRow icon={Globe} label="Web Sitesi" value={currentUser.personalInfo.website} />
                                <InfoRow icon={Linkedin} label="LinkedIn" value={currentUser.personalInfo.social?.linkedin} />
                                <InfoRow icon={Github} label="GitHub" value={currentUser.personalInfo.social?.github} />
                                <InfoRow icon={Palette} label="Behance" value={currentUser.personalInfo.social?.behance} />
                                <InfoRow icon={Instagram} label="Instagram" value={currentUser.personalInfo.social?.instagram} />
                                <InfoRow icon={Twitter} label="X (Twitter)" value={currentUser.personalInfo.social?.twitter} />
                                {(((currentUser.personalInfo.social as { custom?: Array<{ platform?: string; url?: string }> } | undefined)?.custom) || []).map((link, i) =>
                                    link?.platform && link?.url ? (
                                        <InfoRow key={`custom-${i}`} icon={Globe} label={link.platform} value={link.url} />
                                    ) : null
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="volunteering" className="p-4 space-y-4">
                         <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className='text-lg'>Gönüllülük Bilgileri</CardTitle>
                                <Button asChild variant="ghost" size="icon" aria-label="Gönüllülük bilgilerini düzenle">
                                    <Link href="/settings/volunteer">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Sparkles} label="Sosyal Hassasiyetler" value={currentUser.volunteerInfo.interests.join(', ')} />
                                <InfoRow icon={Brain} label="Profesyonel Yetkinlikler" value={currentUser.volunteerInfo.skills.join(', ')} />
                                <InfoRow icon={Users} label="Sosyal Yetkinlikler" value={currentUser.volunteerInfo.dailySkills.join(', ')} />
                                <InfoRow icon={Cpu} label="Bildiği Programlar" value={currentUser.volunteerInfo.programs.join(', ')} />
                                <InfoRow icon={Languages} label="Diller" value={currentUser.volunteerInfo.languages.join(', ')} />
                                <InfoRow icon={FileText} label="Lisanslar" value={currentUser.volunteerInfo.licenses.join(', ')} verified />
                                <InfoRow icon={FileText} label="Belgeler" value={currentUser.volunteerInfo.documents.join(', ')} verified />
                                <InfoRow icon={Plane} label="Yurtiçi Seyahat" value={currentUser.volunteerInfo.travelInfo.domesticObstacle ? 'Engelli' : 'Engel Yok'} />
                                <InfoRow icon={Plane} label="Yurtdışı Seyahat" value={currentUser.volunteerInfo.travelInfo.internationalObstacle ? 'Engelli' : 'Engel Yok'} />
                                <InfoRow icon={Landmark} label="Vizeler" value={currentUser.volunteerInfo.travelInfo.visas.join(', ')} />
                                <InfoRow icon={School} label="Eğitim" value={currentUser.volunteerInfo.education.map((e: { school?: string }) => e.school || '').join('; ')} verified />
                                <InfoRow icon={Briefcase} label="Çalıştığınız Sektör" value={currentUser.volunteerInfo.sector} />
                                <InfoRow icon={Briefcase} label="Çalıştığınız Pozisyon" value={currentUser.volunteerInfo.profession} />
                                 <InfoRow icon={HeartPulse} label="Acil Durumda Uygunluk" value={currentUser.volunteerInfo.emergency.available ? 'Uygun' : 'Uygun Değil'} />
                                <InfoRow icon={HeartPulse} label="Kronik Hastalık" value={currentUser.volunteerInfo.emergency.hasChronicIllness ? 'Var' : 'Yok'} />
                                <InfoRow icon={HeartPulse} label="Düzenli İlaç" value={currentUser.volunteerInfo.emergency.usesRegularMedication ? 'Var' : 'Yok'} />
                                <InfoRow icon={HeartPulse} label="Fiziksel Kısıt" value={currentUser.volunteerInfo.emergency.hasPhysicalLimitation ? 'Var' : 'Yok'} />
                                <InfoRow icon={UserIcon} label="Acil Durum Kişisi 1" value={currentUser.volunteerInfo.emergency.emergencyContacts[0]?.name} />
                                <InfoRow icon={Phone} label="Acil Durum Tel 1" value={currentUser.volunteerInfo.emergency.emergencyContacts[0]?.phone} />
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl">
                            <CardHeader><CardTitle className='text-lg'>Bağlantılarım</CardTitle></CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    <div className="py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-sm">Bağışçı Olduğun STK'lar</p>
                                            <span className="text-xs text-muted-foreground">{supportedNgoIds.length}</span>
                                        </div>
                                        {supportedNgoIds.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Henüz bağış yaptığın STK yok.</p>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(supportedNgosData || []).slice(0, 5).map((ngo) => (
                                                    <Link key={ngo.id} href={`/ngos/${ngo.id}`} aria-label={ngo.name || 'STK'}>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={ngo.avatarUrl} alt={ngo.name || ''} />
                                                            <AvatarFallback>{(ngo.name || '?').charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                ))}
                                                {supportedNgoIds.length > 5 && (
                                                    <span className="text-xs text-muted-foreground">+{supportedNgoIds.length - 5} daha</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-sm">Gönüllü Olduğun STK'lar</p>
                                            <span className="text-xs text-muted-foreground">{volunteerNgoIds.length}</span>
                                        </div>
                                        {volunteerNgoIds.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Henüz gönüllü olduğun STK yok.</p>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(volunteerNgosData || []).slice(0, 5).map((ngo) => (
                                                    <Link key={ngo.id} href={`/ngos/${ngo.id}`} aria-label={ngo.name || 'STK'}>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={ngo.avatarUrl} alt={ngo.name || ''} />
                                                            <AvatarFallback>{(ngo.name || '?').charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                ))}
                                                {volunteerNgoIds.length > 5 && (
                                                    <span className="text-xs text-muted-foreground">+{volunteerNgoIds.length - 5} daha</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-sm">Takip Ettiğin Markalar</p>
                                            <span className="text-xs text-muted-foreground">{followedBrandIds.length}</span>
                                        </div>
                                        {followedBrandIds.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Henüz takip ettiğin marka yok.</p>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(followedBrandsData || []).slice(0, 5).map((brand) => (
                                                    <Link key={brand.id} href={`/market/${brand.slug || brand.id}`} aria-label={brand.name || 'Marka'}>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={brand.logoUrl} alt={brand.name || ''} />
                                                            <AvatarFallback>{(brand.name || '?').charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                ))}
                                                {followedBrandIds.length > 5 && (
                                                    <span className="text-xs text-muted-foreground">+{followedBrandIds.length - 5} daha</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-sm">Üye Olduğun Kulüpler</p>
                                            <span className="text-xs text-muted-foreground">{joinedClubIds.length}</span>
                                        </div>
                                        {joinedClubIds.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Henüz üye olduğun kulüp yok.</p>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(joinedClubsData || []).slice(0, 5).map((club) => (
                                                    <Link key={club.id} href={`/clubs/profile/${club.id}`} aria-label={club.name || 'Kulüp'}>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={club.avatarUrl} alt={club.name || ''} />
                                                            <AvatarFallback>{(club.name || '?').charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                ))}
                                                {joinedClubIds.length > 5 && (
                                                    <span className="text-xs text-muted-foreground">+{joinedClubIds.length - 5} daha</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader><CardTitle className='text-lg'>Geçmiş Gönüllülükler</CardTitle></CardHeader>
                             <CardContent className='space-y-4'>
                                 {pastVolunteering.length > 0 ? (
                                     pastVolunteering.map(item => <VolunteerCard key={item.id} item={item} />)
                                 ) : (
                                     <EmptyState
                                         icon={Handshake}
                                         title="Henüz tamamlanmış gönüllülük yok"
                                         description="Etkinliklere katılınca burada görünecek."
                                         action={{ label: 'Etkinlikleri keşfet', href: '/events' }}
                                     />
                                 )}
                                 <Button variant="secondary" className='w-full'>Tüm Gönüllülük Geçmişini Gör</Button>
                             </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="badges-certificates" className="p-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle className='text-lg'>Kazanılan Rozetler</CardTitle></CardHeader>
                            <CardContent>
                                {badges.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {badges.slice(0, 6).map((badge) => <BadgeDisplay key={badge.id} badge={badge} />)}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={Award}
                                        title="Henüz rozet yok"
                                        description="Bağış ve gönüllülük yaparak rozet kazanmaya başla."
                                    />
                                )}
                            </CardContent>
                             <CardFooter className='pt-4'>
                                 <Button asChild variant="secondary" className='w-full'>
                                     <Link href="/my-badges">Tüm Rozetleri ve Sertifikaları Gör</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className='text-lg'>Sertifikalarım</CardTitle></CardHeader>
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
                                            <Button aria-label="Sertifikayı görüntüle" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewingCert({ id: cert.id, title: cert.title, organization: cert.organization, date: cert.date })}><Eye className="h-4 w-4"/></Button>
                                            <Button aria-label="Sertifikayı indir" size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadCertificate({ title: cert.title, organization: cert.organization, date: cert.date })}><Download className="h-4 w-4"/></Button>
                                            <Button aria-label="Sertifikayı paylaş" size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                                                const shareData = { title: cert.title, text: `${cert.title} — ${cert.organization} (${cert.date}) sertifikamı hangel üzerinden paylaşıyorum.`, url: typeof window !== 'undefined' ? window.location.href : '' };
                                                if (typeof navigator !== 'undefined' && navigator.share) {
                                                    try { await navigator.share(shareData); } catch { /* user cancelled */ }
                                                } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                                    toast({ title: 'Kopyalandı', description: 'Paylaşım metni panoya kopyalandı.' });
                                                } else {
                                                    toast({ title: 'Paylaşım', description: 'Tarayıcınız paylaşımı desteklemiyor.' });
                                                }
                                            }}><Share2 className="h-4 w-4"/></Button>
                                        </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title="Henüz sertifika yok"
                                    description="Tamamladığın programlardan kazanacağın sertifikalar burada listelenir."
                                />
                            )}
                            </CardContent>
                        </Card>
                    </TabsContent>


                    <TabsContent value="story" className="p-4 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className='text-lg flex items-center gap-2'><Sparkles className='h-5 w-5 text-primary' /> Yapay Zeka Destekli Etki Hikayen</CardTitle>
                                <CardDescription>Bu ayki katkılarınla sağladığın pozitif etkiyi gör ve paylaş!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={handleGenerateStories} disabled={isStoryLoading} className="w-full">
                                    {isStoryLoading ? 'Hikayelerin oluşturuluyor...' : 'Bu Ayki 5 Hikayeni Oluştur'}
                                </Button>
                                {isStoryLoading && (
                                    <div className="flex justify-center items-center p-8">
                                        <p>Hikayeleriniz hazırlanıyor, lütfen bekleyin...</p>
                                    </div>
                                )}
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
                            <CardFooter className="flex-col items-start gap-2 text-xs text-muted-foreground">
                                {stories.length > 0 && (
                                    <Button onClick={handleGenerateStories} disabled={isStoryLoading} variant="secondary" className="w-full">
                                        {isStoryLoading ? 'Hikayelerin oluşturuluyor...' : 'Yeni Hikayeler Oluştur'}
                                    </Button>
                                )}
                                <div className="w-full flex justify-between items-center">
                                    <p>Yapay zeka tarafından sağlanan verilerle oluşturulmuştur.</p>
                                    <Link href="/support/ai-assistants" className="hover:underline text-primary">Nasıl çalışır?</Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            <Dialog open={!!viewingCert} onOpenChange={(open) => { if (!open) setViewingCert(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sertifika Önizleme</DialogTitle>
                        <DialogDescription>{viewingCert?.organization}</DialogDescription>
                    </DialogHeader>
                    {viewingCert && (
                        <div className="rounded-lg border-2 border-primary/30 p-6 bg-gradient-to-br from-primary/5 to-background text-center space-y-3">
                            <Award className="h-12 w-12 text-primary mx-auto" />
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sertifika</p>
                            <p className="text-lg font-bold leading-tight">{viewingCert.title}</p>
                            <p className="text-sm text-muted-foreground">Sahibi: <span className="font-medium text-foreground">{currentUser.name || '-'}</span></p>
                            <p className="text-sm text-muted-foreground">{viewingCert.organization}</p>
                            <p className="text-xs text-muted-foreground">Tarih: {viewingCert.date}</p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="secondary" onClick={() => setViewingCert(null)}>Kapat</Button>
                        {viewingCert && (
                            <Button onClick={() => handleDownloadCertificate({ title: viewingCert.title, organization: viewingCert.organization, date: viewingCert.date })}>
                                <Download className="mr-2 h-4 w-4" /> PDF İndir
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
