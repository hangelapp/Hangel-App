'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { user, badges, certificates, pastVolunteering } from '@/lib/data';
import { 
    Star, X, Briefcase, Sparkles, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop, Globe, 
    Home, Phone, Mail, Cake, Users, Flag, Droplet, Edit, Share2, Download, Eye, HandCoins, Hourglass, Plane
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined | null }) => (
    <div className="flex items-start gap-4 py-2">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'Belirtilmemiş'}</p>
        </div>
    </div>
);

const VolunteerInfoCard = ({ title, items, icon: Icon }: { title: string, items: string[] | undefined, icon: React.ElementType }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            {items && items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                        <div key={item} className="text-sm border rounded-full px-3 py-1 bg-secondary/50">{item}</div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">Belirtilmemiş</p>}
        </CardContent>
    </Card>
);

const StatDetailRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-2 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
    </div>
);


export default function ProfilePage() {
  const [showImpactCard, setShowImpactCard] = useState(true);

  const impactStats = [
    { icon: Star, value: user.impactScore.toLocaleString(), label: 'Sosyal Etki Puanı' },
    { icon: HandCoins, value: `${user.stats.totalDonation.toLocaleString()} ₺`, label: 'Bağış Tutarı' },
    { icon: Hourglass, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
  ];

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-32 w-full">
        {user.coverPhotoUrl && (
          <Image
            src={user.coverPhotoUrl}
            alt="Profile Banner"
            fill
            className="object-cover"
            data-ai-hint="abstract nature"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="p-4 -mt-16">
         <div className="flex items-end gap-4">
            <div className="relative h-24 w-24 rounded-full border-4 border-background shrink-0">
                {user.avatarUrl && <Image src={user.avatarUrl} alt="User Avatar" fill className="object-cover rounded-full" data-ai-hint="person portrait"/>}
            </div>
            <div className="w-full flex justify-between items-end pb-1">
                <div>
                    <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
                    <p className="text-muted-foreground">{user.username}</p>
                </div>
                <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>
      
      {showImpactCard && (
          <div className="px-4 mt-4">
            <Card className="bg-primary/5 border-primary/20 relative">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => setShowImpactCard(false)}>
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className='pb-2'>
                    <CardTitle className="flex items-center gap-2 text-lg">
                         Hangel Sosyal Etki Puanı
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-center">
                    {impactStats.map((stat, i) => (
                        <div key={i} className='p-2'>
                            <stat.icon className="h-6 w-6 text-primary mx-auto mb-1" />
                            <p className="text-lg font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
          </div>
      )}

      <Tabs defaultValue="statistics" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-5 px-2">
            <TabsTrigger value="statistics">İstatistikler</TabsTrigger>
            <TabsTrigger value="info">Bilgilerim</TabsTrigger>
            <TabsTrigger value="volunteer">Gönüllülük</TabsTrigger>
            <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
            <TabsTrigger value="badges">Rozetlerim</TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Gönüllülük Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatDetailRow label="Gönüllülük Sıralaması" value={user.stats.volunteerRank} />
                    <Separator/>
                    <StatDetailRow label="Tamamlanan Proje Sayısı" value={user.stats.completedProjects} />
                    <Separator/>
                    <StatDetailRow label="En Aktif Gönüllülük Alanı" value={user.stats.mostActiveVolunteerArea} />
                    <Separator/>
                    <StatDetailRow label="Ortalama Gönüllülük Süresi" value={user.stats.avgVolunteerDuration} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Bağış Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatDetailRow label="Toplam İşlem Adedi" value={user.stats.donationCount} />
                    <Separator/>
                    <StatDetailRow label="Desteklenen Farklı STK" value={user.stats.supportedNgosCount} />
                    <Separator/>
                    <StatDetailRow label="En Çok Desteklenen STK" value={user.stats.mostSupportedNgo} />
                    <Separator/>
                    <StatDetailRow label="Tek Seferde En Yüksek Bağış" value={`${user.stats.highestSingleDonation} ₺`} />
                     <Separator/>
                    <StatDetailRow label="Ortalama Bağış Tutarı" value={`${user.stats.avgDonation.toFixed(2)} ₺`} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="info" className="p-4 space-y-4">
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
                    <Button variant="ghost" size="icon"><Edit className="h-5 w-5"/></Button>
                </CardHeader>
                <CardContent className="divide-y">
                    <InfoRow icon={Home} label="Profil Fotoğrafı" value="profil.jpg" />
                    <InfoRow icon={Phone} label="Telefon" value={user.personalInfo.phone} />
                    <InfoRow icon={Mail} label="E-posta" value={user.personalInfo.email} />
                    <InfoRow icon={Cake} label="Doğum Tarihi" value={user.personalInfo.birthDate} />
                    <InfoRow icon={Users} label="Cinsiyet" value={user.personalInfo.gender} />
                    <InfoRow icon={Flag} label="Uyruk" value={user.personalInfo.nationality} />
                    <InfoRow icon={Droplet} label="Kan Grubu" value={user.personalInfo.bloodType} />
                    <div className="flex items-start gap-4 py-3">
                        <Home className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Adres</p>
                            <p className="font-medium">{user.personalInfo.address.fullAddress}</p>
                            <p className="text-sm text-muted-foreground">{user.personalInfo.address.district}, {user.personalInfo.address.city}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="volunteer" className="p-4 space-y-4">
             <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle className="text-lg">Gönüllülük Bilgileri</CardTitle>
                    <Button variant="ghost" size="icon"><Edit className="h-5 w-5"/></Button>
                </CardHeader>
                <CardContent className="space-y-4">
                     <VolunteerInfoCard title="Mesleki Yetkinlikler" items={user.volunteerInfo.skills} icon={Briefcase} />
                    <VolunteerInfoCard title="Gündelik Yetkinlikler" items={user.volunteerInfo.dailySkills} icon={Sparkles} />
                    <VolunteerInfoCard title="Sosyal Hassasiyetleri" items={user.volunteerInfo.interests} icon={Heart} />
                    <VolunteerInfoCard title="Mezuniyetler" items={user.volunteerInfo.education.map(e => e.school)} icon={School} />
                    <VolunteerInfoCard title="Meslek" items={user.volunteerInfo.profession ? [user.volunteerInfo.profession] : []} icon={Briefcase} />
                    <VolunteerInfoCard title="Belgeler" items={user.volunteerInfo.documents} icon={FileText} />
                    <VolunteerInfoCard title="Lisanslar" items={user.volunteerInfo.licenses} icon={BadgeIcon} />
                    <VolunteerInfoCard title="Diller" items={user.volunteerInfo.languages} icon={Languages} />
                    <VolunteerInfoCard title="Bildiği Programlar" items={user.volunteerInfo.programs} icon={Laptop} />
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Plane className="h-5 w-5 text-primary" />
                                Seyahat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div>
                                <p>Yurtiçi seyahat engeli: <span className='font-medium'>{user.volunteerInfo.travelInfo.domesticObstacle ? 'Var' : 'Yok'}</span></p>
                                <p>Yurtdışı seyahat engeli: <span className='font-medium'>{user.volunteerInfo.travelInfo.internationalObstacle ? 'Var' : 'Yok'}</span></p>
                            </div>
                            <VolunteerInfoCard title="Vizeler" items={user.volunteerInfo.travelInfo.visas} icon={Globe} />
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="p-4">
             {certificates.length > 0 ? (
                <Card>
                    <CardContent className="p-4 space-y-4">
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
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>Henüz kazanılmış bir sertifikanız bulunmuyor.</p>
                </div>
            )}
        </TabsContent>

        <TabsContent value="badges" className="p-4">
             <div className="grid grid-cols-2 gap-4">
                {badges.filter(b => b.currentPoints >= b.pointsRequired).slice(0, 4).map(badge => (
                    <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-accent/20 rounded-full mb-2">
                            <badge.iconName className="h-8 w-8 text-primary"/>
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.level} Seviye</p>
                    </Card>
                ))}
            </div>
             {badges.filter(b => b.currentPoints >= b.pointsRequired).length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>Henüz kazanılmış bir rozetiniz bulunmuyor.</p>
                </div>
             )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
