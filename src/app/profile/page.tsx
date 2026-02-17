'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { user, badges, pastVolunteering, certificates } from '@/lib/data';
import { 
    Star, Briefcase, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop,
    HandCoins, Hourglass, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Handshake, Brain, BookOpen, Globe, HeartPulse, BarChart3, TrendingUp, Target, DollarSign, Users, Plane, Landmark, Cpu, Edit, QrCode, Share2, Linkedin, Github, Palette, Instagram, Twitter, Download, Eye, Award, ArrowLeft, ArrowDownUp, Filter, Rss, CheckCircle, Leaf, X
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getImpactStory } from '@/ai/flows/impact-story-flow';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';


const InfoRow = ({ icon: Icon, label, value, verified, href }: { icon: React.ElementType; label: string; value?: string | null, verified?: boolean, href?: string }) => {
    const ValueComponent = href ? (
        <Link href={href} className="flex items-center gap-1 text-muted-foreground hover:underline">
            <span>{value}</span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    ) : (
        <p className="text-muted-foreground">{value}</p>
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

const pointTransactions = [
    { type: 'Alışveriş', icon: HandCoins, description: "Doğa Dostu Giyim alışverişi", points: 120, time: "2024-07-22T14:30:00" },
    { type: 'Gönüllülük', icon: Handshake, description: "TEMA Fidan Dikimi gönüllülüğü", points: 150, time: "2024-07-21T10:00:00" },
    { type: 'Davet', icon: Users, description: "Ayşe Yılmaz'ı davet ettin", points: 100, time: "2024-07-19T18:45:00" },
    { type: 'Rozet', icon: Award, description: "'Bronz Çevre Koruyucusu' rozeti", points: 250, time: "2024-07-19T11:20:00" },
    { type: 'Alışveriş', icon: DollarSign, description: "Lezzet Köyü alışverişi", points: 45, time: "2024-07-17T09:05:00" },
];

const transactionTypes = ['Alışveriş', 'Gönüllülük', 'Davet', 'Rozet'];

const NextBadgeGoal = () => {
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
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setIsVisible(false)}>
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
    const [profileUrl, setProfileUrl] = useState('');
    const router = useRouter();
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState<string[]>([]);
    const { toast } = useToast();
    const [isStoryLoading, setIsStoryLoading] = useState(false);
    const [stories, setStories] = useState<string[]>([]);
    
    const handleGenerateStories = async () => {
        setIsStoryLoading(true);
        setStories([]);
        try {
            const storyPromises = Array(5).fill(0).map(() => 
                getImpactStory({
                    userName: user.name.split(' ')[0],
                    donations: `${user.stats.totalDonation} TL bağış yapıldı. En çok desteklenen STK: ${user.stats.mostSupportedNgo}.`,
                    volunteering: `${user.stats.volunteerHours} saat gönüllülük yapıldı. En aktif alan: ${user.stats.mostActiveVolunteerArea}.`,
                    badges: `Toplamda ${badges.filter(b => b.currentPoints >= b.pointsRequired).length} rozet kazanıldı.`
                })
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
            toast({
                variant: "destructive",
                title: "Hikaye oluşturulamadı",
                description: "Yapay zeka ile hikaye oluşturulurken bir sorun oluştu."
            });
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
                                        <Star key={i} className={cn("h-5 w-5", i < item.review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                                    ))}
                                    <span className="ml-2 text-sm font-bold">{item.review.rating}/5</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 italic">"{item.review.comment}"</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
    
    const BadgeDisplay = ({ badge }: { badge: (typeof badges)[0] }) => {
        const isEarned = badge.currentPoints >= badge.pointsRequired;
        const pointsNeeded = badge.pointsRequired - badge.currentPoints;
        return (
             <div className="flex flex-col items-center text-center">
                 <div className={`p-3 rounded-full ${isEarned ? 'bg-amber-100' : 'bg-muted'}`}>
                    <badge.iconName className={`h-8 w-8 ${isEarned ? 'text-amber-500' : 'text-muted-foreground'}`} />
                 </div>
                 <p className="text-xs font-semibold mt-2">{badge.level}</p>
                 <p className="text-xs text-muted-foreground">{badge.name}</p>
                 {isEarned ? (
                    <p className="text-xs font-semibold text-green-600 mt-1">Kazanıldı!</p>
                ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                        {pointsNeeded > 0 ? `${pointsNeeded} Puan Kaldı` : `${badge.currentPoints}/${badge.pointsRequired} Puan`}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="animate-in fade-in-0 bg-secondary min-h-screen">
            <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <ShareButtons url={profileUrl} title={`${user.name} - Hangel Profili`} buttonClassName="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" />
            </div>
            <div className="p-4 space-y-6">
                <div className="flex flex-col items-center text-center">
                    <UserAvatar className="w-24 h-24 mb-4" />
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-lg text-muted-foreground">{user.username}</p>
                </div>
                <Tabs defaultValue="impact" className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="h-auto p-1 flex-wrap">
                            <TabsTrigger value="impact">Etki</TabsTrigger>
                            <TabsTrigger value="about">Hakkında</TabsTrigger>
                            <TabsTrigger value="volunteering">Gönüllülük</TabsTrigger>
                            <TabsTrigger value="badges-certificates">Rozetler & Sertifikalar</TabsTrigger>
                            <TabsTrigger value="posts">Gönderi</TabsTrigger>
                            <TabsTrigger value="story">Hikaye</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="impact" className="p-4 space-y-4">
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle>Toplam Sosyal Etki Puanın</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-6xl font-bold text-primary">{user.impactScore.toLocaleString('tr-TR')}</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle className='text-lg flex items-center gap-2'><BarChart3 className='h-5 w-5 text-primary' />Gönüllülük İstatistikleri</CardTitle></CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Hourglass} label="Toplam Gönüllülük Saati" value={`${user.stats.volunteerHours} Saat`} />
                                <InfoRow icon={Handshake} label="Tamamlanan Proje Sayısı" value={`${user.stats.completedProjects} Proje`} />
                                <InfoRow icon={Sparkles} label="En Aktif Gönüllülük Alanı" value={user.stats.mostActiveVolunteerArea} />
                                <InfoRow icon={TrendingUp} label="Türkiye Gönüllü Sıralaması" value={user.stats.volunteerRank.country} href="/leaderboard" />
                                 <InfoRow icon={TrendingUp} label="Şehir Gönüllü Sıralaması" value={user.stats.volunteerRank.city} href="/leaderboard" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className='text-lg flex items-center gap-2'><HandCoins className='h-5 w-5 text-primary' />Bağış İstatistikleri</CardTitle></CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={DollarSign} label="Toplam Bağış Tutarı" value={`${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`} />
                                <InfoRow icon={FileText} label="Toplam İşlem Adedi" value={`${user.stats.donationCount} İşlem`} />
                                <InfoRow icon={Target} label="En Çok Desteklenen STK" value={user.stats.mostSupportedNgo} />
                                <InfoRow icon={TrendingUp} label="Tek Seferde En Yüksek Bağış" value={`${user.stats.highestSingleDonation.toLocaleString('tr-TR')} ₺`} />
                                <InfoRow icon={BarChart3} label="Ortalama Bağış Tutarı" value={`${user.stats.avgDonation.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Son Puan İşlemleri</CardTitle>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                {sortedAndFilteredTransactions.slice(0, 5).map((tx, index) => {
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
                                 <Button asChild variant="ghost" size="icon">
                                    <Link href="/settings/profile">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Mail} label="E-posta" value={user.personalInfo.email} verified />
                                <InfoRow icon={Phone} label="Telefon" value={user.personalInfo.phone} verified />
                                <InfoRow icon={Cake} label="Doğum Tarihi" value={format(new Date(user.personalInfo.birthDate), 'dd MMMM yyyy', { locale: tr })} />
                                 <InfoRow icon={Globe} label="Uyruk" value={user.personalInfo.nationality} />
                                <InfoRow icon={UserIcon} label="Cinsiyet" value={user.personalInfo.gender} />
                                <InfoRow icon={HeartPulse} label="Kan Grubu" value={user.personalInfo.bloodType} />
                                <InfoRow icon={MapPin} label="Adres" value={`${user.personalInfo.address.district}, ${user.personalInfo.address.city}`} />
                                <InfoRow icon={Globe} label="Web Sitesi" value={user.personalInfo.website} />
                                <InfoRow icon={Linkedin} label="LinkedIn" value={user.personalInfo.social?.linkedin} />
                                <InfoRow icon={Github} label="GitHub" value={user.personalInfo.social?.github} />
                                <InfoRow icon={Palette} label="Behance" value={user.personalInfo.social?.behance} />
                                <InfoRow icon={Instagram} label="Instagram" value={user.personalInfo.social?.instagram} />
                                <InfoRow icon={Twitter} label="X (Twitter)" value={user.personalInfo.social?.twitter} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="volunteering" className="p-4 space-y-4">
                         <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className='text-lg'>Gönüllülük Bilgileri</CardTitle>
                                <Button asChild variant="ghost" size="icon">
                                    <Link href="/settings/volunteer">
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <InfoRow icon={Sparkles} label="Sosyal Hassasiyetler" value={user.volunteerInfo.interests.join(', ')} />
                                <InfoRow icon={Brain} label="Profesyonel Yetkinlikler" value={user.volunteerInfo.skills.join(', ')} />
                                <InfoRow icon={Users} label="Sosyal Yetkinlikler" value={user.volunteerInfo.dailySkills.join(', ')} />
                                <InfoRow icon={Cpu} label="Bildiği Programlar" value={user.volunteerInfo.programs.join(', ')} />
                                <InfoRow icon={Languages} label="Diller" value={user.volunteerInfo.languages.join(', ')} />
                                <InfoRow icon={FileText} label="Lisanslar" value={user.volunteerInfo.licenses.join(', ')} verified />
                                <InfoRow icon={FileText} label="Belgeler" value={user.volunteerInfo.documents.join(', ')} verified />
                                <InfoRow icon={Plane} label="Yurtiçi Seyahat" value={user.volunteerInfo.travelInfo.domesticObstacle ? 'Engelli' : 'Engel Yok'} />
                                <InfoRow icon={Plane} label="Yurtdışı Seyahat" value={user.volunteerInfo.travelInfo.internationalObstacle ? 'Engelli' : 'Engel Yok'} />
                                <InfoRow icon={Landmark} label="Vizeler" value={user.volunteerInfo.travelInfo.visas.join(', ')} />
                                <InfoRow icon={School} label="Eğitim" value={user.volunteerInfo.education.map(e => e.school).join('; ')} verified />
                                <InfoRow icon={School} label="Fakülte / Bölüm" value="Yönetim Bilişim Sistemleri" />
                                <InfoRow icon={Briefcase} label="Çalıştığınız Sektör" value={user.volunteerInfo.sector} />
                                <InfoRow icon={Briefcase} label="Çalıştığınız Pozisyon" value={user.volunteerInfo.profession} />
                                 <InfoRow icon={HeartPulse} label="Acil Durumda Uygunluk" value={user.volunteerInfo.emergency.available ? 'Uygun' : 'Uygun Değil'} />
                                <InfoRow icon={HeartPulse} label="Kronik Hastalık" value={user.volunteerInfo.emergency.hasChronicIllness ? 'Var' : 'Yok'} />
                                <InfoRow icon={HeartPulse} label="Düzenli İlaç" value={user.volunteerInfo.emergency.usesRegularMedication ? 'Var' : 'Yok'} />
                                <InfoRow icon={HeartPulse} label="Fiziksel Kısıt" value={user.volunteerInfo.emergency.hasPhysicalLimitation ? 'Var' : 'Yok'} />
                                <InfoRow icon={UserIcon} label="Acil Durum Kişisi 1" value={user.volunteerInfo.emergency.emergencyContacts[0]?.name} />
                                <InfoRow icon={Phone} label="Acil Durum Tel 1" value={user.volunteerInfo.emergency.emergencyContacts[0]?.phone} />
                                {user.volunteerInfo.emergency.emergencyContacts[1]?.name && (
                                    <>
                                        <InfoRow icon={UserIcon} label="Acil Durum Kişisi 2" value={user.volunteerInfo.emergency.emergencyContacts[1]?.name} />
                                        <InfoRow icon={Phone} label="Acil Durum Tel 2" value={user.volunteerInfo.emergency.emergencyContacts[1]?.phone} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader><CardTitle className='text-lg'>Geçmiş Gönüllülükler</CardTitle></CardHeader>
                             <CardContent className='space-y-4'>
                                 {pastVolunteering.map(item => <VolunteerCard key={item.id} item={item} />)}
                                 <Button variant="secondary" className='w-full'>Tüm Gönüllülük Geçmişini Gör</Button>
                             </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="badges-certificates" className="p-4 space-y-4">
                        <NextBadgeGoal />
                        <Card>
                            <CardHeader><CardTitle className='text-lg'>Kazanılan Rozetler</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4">
                                {badges.slice(0, 6).map(badge => <BadgeDisplay key={badge.id} badge={badge} />)}
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
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast({ title: "Sertifika Görüntüleme", description: "Bu özellik yakında eklenecektir." })}><Eye className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast({ title: "Sertifika İndirme", description: "Bu özellik yakında eklenecektir." })}><Download className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast({ title: "Sertifika Paylaşma", description: "Bu özellik yakında eklenecektir." })}><Share2 className="h-4 w-4"/></Button>
                                        </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    <p>Henüz kazanılmış bir sertifikanız bulunmuyor.</p>
                                </div>
                            )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="posts" className="p-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gönderilerim</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center text-muted-foreground py-16">
                                    <Rss className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                                    <p className="mt-4">Henüz bir gönderi paylaşmadınız.</p>
                                </div>
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
                                                 dangerouslySetInnerHTML={{ __html: story }}
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
        </div>
    );
}
