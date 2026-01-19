'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { user, badges, pastVolunteering } from '@/lib/data';
import {
    Star, Briefcase, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop,
    HandCoins, Hourglass, ChevronRight, Mail, Phone, Cake, User as UserIcon, MapPin, Sparkles, Handshake, Brain, BookOpen, Globe, HeartPulse
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    <div className="flex items-start p-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="flex-1 ml-4">
            <p className="font-medium text-sm">{label}</p>
            {value && <p className="text-sm text-muted-foreground">{value}</p>}
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
        return (
             <div className="flex flex-col items-center text-center">
                 <div className={`p-3 rounded-full ${isEarned ? 'bg-amber-100' : 'bg-muted'}`}>
                    <badge.iconName className={`h-8 w-8 ${isEarned ? 'text-amber-500' : 'text-muted-foreground'}`} />
                 </div>
                 <p className="text-xs font-semibold mt-2">{badge.level}</p>
                 <p className="text-xs text-muted-foreground">{badge.name}</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in-0 bg-secondary min-h-screen">
            <div className="p-4 space-y-6">
                <div className="flex flex-col items-center text-center pt-8">
                    <UserAvatar className="w-24 h-24 mb-4" />
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-lg text-muted-foreground">{user.username}</p>
                    <Button variant="link" className="mt-1">Profili Düzenle</Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 px-2">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="about">Hakkında</TabsTrigger>
                    <TabsTrigger value="volunteering">Gönüllülük</TabsTrigger>
                    <TabsTrigger value="badges">Rozetler</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="p-4">
                    <Card>
                        <CardContent className="p-4 grid grid-cols-3 gap-2">
                            {impactStats.map(stat => <StatCard key={stat.label} {...stat} />)}
                        </CardContent>
                    </Card>
                    <div className='mt-6 space-y-2'>
                        <Link href="/my-donations" className='block p-4 bg-card rounded-xl text-left hover:bg-accent transition-colors'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-2 bg-primary/10 rounded-lg'><HandCoins className="h-5 w-5 text-primary" /></div>
                                    <div>
                                        <p className='font-semibold'>Bağışlarım</p>
                                        <p className='text-muted-foreground text-sm'>{user.stats.donationCount} İşlem</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </Link>
                         <Link href="/my-applications" className='block p-4 bg-card rounded-xl text-left hover:bg-accent transition-colors'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-2 bg-primary/10 rounded-lg'><FileText className="h-5 w-5 text-primary" /></div>
                                    <div>
                                        <p className='font-semibold'>Başvurularım</p>
                                        <p className='text-muted-foreground text-sm'>3 Beklemede</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </Link>
                         <Link href="/invite" className='block p-4 bg-card rounded-xl text-left hover:bg-accent transition-colors'>
                             <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='p-2 bg-primary/10 rounded-lg'><Heart className="h-5 w-5 text-primary" /></div>
                                    <div>
                                        <p className='font-semibold'>Arkadaşlarını Davet Et</p>
                                        <p className='text-muted-foreground text-sm'>İyiliği paylaş, puan kazan</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </Link>
                    </div>
                </TabsContent>

                <TabsContent value="about" className="p-4 space-y-4">
                     <Card>
                        <CardHeader><CardTitle className='text-lg'>Kişisel Bilgiler</CardTitle></CardHeader>
                        <CardContent className="divide-y">
                            <InfoRow icon={Mail} label="E-posta" value={user.personalInfo.email} />
                            <InfoRow icon={Phone} label="Telefon" value={user.personalInfo.phone} />
                            <InfoRow icon={Cake} label="Doğum Tarihi" value={format(new Date(user.personalInfo.birthDate), 'dd MMMM yyyy', { locale: tr })} />
                            <InfoRow icon={HeartPulse} label="Kan Grubu" value={user.personalInfo.bloodType} />
                            <InfoRow icon={MapPin} label="Adres" value={`${user.personalInfo.address.district}, ${user.personalInfo.address.city}`} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className='text-lg'>Gönüllülük Bilgileri</CardTitle></CardHeader>
                        <CardContent className="divide-y">
                            <InfoRow icon={Sparkles} label="İlgi Alanları" value={user.volunteerInfo.interests.join(', ')} />
                             <InfoRow icon={Brain} label="Yetkinlikler" value={user.volunteerInfo.skills.join(', ')} />
                            <InfoRow icon={School} label="Eğitim" value={user.volunteerInfo.education[0]?.school} />
                            <InfoRow icon={Briefcase} label="Meslek" value={user.volunteerInfo.profession} />
                             <InfoRow icon={Globe} label="Diller" value={user.volunteerInfo.languages.join(', ')} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="volunteering" className="p-4 space-y-4">
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
