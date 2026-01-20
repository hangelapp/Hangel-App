'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { user, badges, pastVolunteering } from '@/lib/data';
import {
    Star, Briefcase, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop,
    HandCoins, Hourglass, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Handshake, Brain, BookOpen, Globe, HeartPulse, BarChart3, TrendingUp, Target, DollarSign, Users, Plane, Landmark, Cpu, Edit
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ShareButtons } from '@/components/shared/share-buttons';

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    <div className="flex justify-between items-start py-3 text-sm">
        <div className='flex items-start'>
             <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
             <p className="font-medium ml-4">{label}</p>
        </div>
        <p className="text-muted-foreground text-right">{value}</p>
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProfileUrl(window.location.href);
        }
    }, []);

    const impactStats = [
        { icon: Star, value: user.impactScore.toLocaleString('tr-TR'), label: 'Etki Puanı' },
        { icon: HandCoins, value: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`, label: 'Bağış' },
        { icon: Hourglass, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
    ];
    
    const VolunteerCard = ({ item }: { item: (typeof pastVolunteering)[0] }) => (
        <Card>
            <CardHeader>
                <CardTitle className='text-base'>{item.title}</CardTitle>
                <CardDescription>{item.organization} - {formatDistanceToNow(new Date(item.dates.eventEnd), { addSuffix: true, locale: tr })}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground line-clamp-2'>{item.description}</p>
            </CardContent>
        </Card>
    )
    
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
        <div className="animate-in fade-in-0 bg-secondary min-h-screen relative">
            <div className="absolute top-4 right-4 z-10">
                <ShareButtons url={profileUrl} title={`${user.name} - Hangel Profili`} />
            </div>
            <div className="p-4 space-y-6">
                <div className="flex flex-col items-center text-center pt-8">
                    <UserAvatar className="w-24 h-24 mb-4" />
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-lg text-muted-foreground">{user.username}</p>
                </div>
            </div>

            <Tabs defaultValue="stats" className="w-full">
                <TabsList className="grid w-full grid-cols-4 px-2">
                    <TabsTrigger value="stats">İstatistikler</TabsTrigger>
                    <TabsTrigger value="about">Hakkında</TabsTrigger>
                    <TabsTrigger value="volunteering">Gönüllülük</TabsTrigger>
                    <TabsTrigger value="badges">Rozetler</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stats" className="p-4 space-y-4">
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
                            <InfoRow icon={Mail} label="E-posta" value={user.personalInfo.email} />
                            <InfoRow icon={Phone} label="Telefon" value={user.personalInfo.phone} />
                            <InfoRow icon={Cake} label="Doğum Tarihi" value={format(new Date(user.personalInfo.birthDate), 'dd MMMM yyyy', { locale: tr })} />
                             <InfoRow icon={Globe} label="Uyruk" value={user.personalInfo.nationality} />
                            <InfoRow icon={UserIcon} label="Cinsiyet" value={user.personalInfo.gender} />
                            <InfoRow icon={HeartPulse} label="Kan Grubu" value={user.personalInfo.bloodType} />
                            <InfoRow icon={MapPin} label="Adres" value={`${user.personalInfo.address.district}, ${user.personalInfo.address.city}`} />
                            <InfoRow icon={Globe} label="Web Sitesi" value={user.personalInfo.website} />
                            <InfoRow icon={Linkedin} label="LinkedIn" value={user.personalInfo.social?.linkedin} />
                            <InfoRow icon={Github} label="GitHub" value={user.personalInfo.social?.github} />
                            <InfoRow icon={Behance} label="Behance" value={user.personalInfo.social?.behance} />
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
                            <InfoRow icon={Sparkles} label="İlgi Alanları" value={user.volunteerInfo.interests.join(', ')} />
                            <InfoRow icon={Brain} label="Profesyonel Yetkinlikler" value={user.volunteerInfo.skills.join(', ')} />
                            <InfoRow icon={Users} label="Sosyal Yetkinlikler" value={user.volunteerInfo.dailySkills.join(', ')} />
                            <InfoRow icon={Cpu} label="Bildiği Programlar" value={user.volunteerInfo.programs.join(', ')} />
                            <InfoRow icon={Languages} label="Diller" value={user.volunteerInfo.languages.join(', ')} />
                            <InfoRow icon={FileText} label="Lisanslar" value={user.volunteerInfo.licenses.join(', ')} />
                            <InfoRow icon={FileText} label="Belgeler" value={user.volunteerInfo.documents.join(', ')} />
                            <InfoRow icon={Plane} label="Yurtiçi Seyahat" value={user.volunteerInfo.travelInfo.domesticObstacle ? 'Engelli' : 'Engel Yok'} />
                            <InfoRow icon={Plane} label="Yurtdışı Seyahat" value={user.volunteerInfo.travelInfo.internationalObstacle ? 'Engelli' : 'Engel Yok'} />
                            <InfoRow icon={Landmark} label="Vizeler" value={user.volunteerInfo.travelInfo.visas.join(', ')} />
                            <InfoRow icon={School} label="Eğitim" value={user.volunteerInfo.education.map(e => e.school).join('; ')} />
                            <InfoRow icon={Briefcase} label="Sektör" value={user.volunteerInfo.sector} />
                            <InfoRow icon={Briefcase} label="Pozisyon" value={user.volunteerInfo.profession} />
                             <InfoRow icon={HeartPulse} label="Acil Durumda Uygunluk" value={user.volunteerInfo.emergency.available ? 'Uygun' : 'Uygun Değil'} />
                            <InfoRow icon={HeartPulse} label="Kronik Hastalık" value={user.volunteerInfo.emergency.hasChronicIllness ? 'Var' : 'Yok'} />
                            <InfoRow icon={HeartPulse} label="Düzenli İlaç" value={user.volunteerInfo.emergency.usesRegularMedication ? 'Var' : 'Yok'} />
                            <InfoRow icon={HeartPulse} label="Fiziksel Kısıt" value={user.volunteerInfo.emergency.hasPhysicalLimitation ? 'Var' : 'Yok'} />
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

            </Tabs>
        </div>
    );
}
