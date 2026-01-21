
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { user, badges, pastVolunteering, certificates } from '@/lib/data';
import { 
    Star, Briefcase, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop,
    HandCoins, Hourglass, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Handshake, Brain, BookOpen, Globe, HeartPulse, BarChart3, TrendingUp, Target, DollarSign, Users, Plane, Landmark, Cpu, Edit, QrCode, Share2, Linkedin, Github, Palette, Instagram, Twitter, Download, Eye, Award, ArrowLeft, ArrowDownUp, Filter, Rss, CheckCircle
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


const InfoRow = ({ icon: Icon, label, value, verified }: { icon: React.ElementType; label: string; value?: string | null, verified?: boolean }) => (
    <div className="flex justify-between items-start py-3 text-sm">
        <div className='flex items-start'>
             <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
             <p className="font-medium ml-4">{label}</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <p className="text-muted-foreground">{value}</p>
          {verified && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
        </div>
    </div>
);

const StatCard = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string | number, label: string }) => (
    <div className='text-center p-2'>
        <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);


export default function ProfilePage() {
    const [profileUrl, setProfileUrl] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProfileUrl(window.location.href);
        }
    }, []);

    const recentPointTransactions = [
        { icon: HandCoins, description: "Doğa Dostu Giyim alışverişi", points: 120, time: "2024-07-22T14:30:00" },
        { icon: Handshake, description: "TEMA Fidan Dikimi gönüllülüğü", points: 150, time: "2024-07-21T10:00:00" },
        { icon: Users, description: "Ayşe Yılmaz'ı davet ettin", points: 100, time: "2024-07-19T18:45:00" },
        { icon: Award, description: "'Bronz Çevre Koruyucusu' rozeti", points: 250, time: "2024-07-19T11:20:00" },
        { icon: DollarSign, description: "Lezzet Köyü alışverişi", points: 45, time: "2024-07-17T09:05:00" },
    ];
    
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
                    <TabsList className="grid w-full grid-cols-6 px-2">
                        <TabsTrigger value="impact">Etki</TabsTrigger>
                        <TabsTrigger value="about">Hakkında</TabsTrigger>
                        <TabsTrigger value="volunteering">Gönüllülük</TabsTrigger>
                        <TabsTrigger value="badges">Rozetler</TabsTrigger>
                        <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
                        <TabsTrigger value="posts">Gönderiler</TabsTrigger>
                    </TabsList>
                    
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
                                <InfoRow icon={TrendingUp} label="Türkiye Gönüllü Sıralaması" value={user.stats.volunteerRank.country} />
                                 <InfoRow icon={TrendingUp} label="Şehir Gönüllü Sıralaması" value={user.stats.volunteerRank.city} />
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <ArrowDownUp className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentPointTransactions.map((tx, index) => {
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
                                 <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
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
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
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
                    
                    <TabsContent value="badges" className="p-4">
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
                    </TabsContent>
                    
                    <TabsContent value="certificates" className="p-4">
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
                                            <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7"><Share2 className="h-4 w-4"/></Button>
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
                              <CardFooter className='pt-4'>
                                 <Button asChild variant="secondary" className='w-full'>
                                     <Link href="/my-badges">Tüm Rozetleri ve Sertifikaları Gör</Link>
                                </Button>
                            </CardFooter>
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

                </Tabs>
            </div>
        </div>
    );
}
