'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { user, badges, certificates, pastVolunteering } from '@/lib/data';
import { HandCoins, Hourglass, UserPlus, Edit, Star, X, Briefcase, Sparkles, Heart, School, BookOpen, FileText, Badge, Languages, Laptop, Globe, Home, Phone, Mail, Cake, Users, Flag, Droplet } from 'lucide-react';

const impactStats = [
  { icon: HandCoins, value: '1,250 ₺', label: 'Bağış Tutarı' },
  { icon: Hourglass, value: '48 Saat', label: 'Gönüllülük' },
  { icon: UserPlus, value: '12', label: 'Davet' },
];

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'Belirtilmemiş'}</p>
        </div>
    </div>
);

const VolunteerInfoCard = ({ title, items, icon: Icon }: { title: string, items: string[], icon: React.ElementType }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                        <div key={item} className="text-sm border rounded-full px-3 py-1 bg-secondary/50">{item}</div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">Belirtilmemiş</p>}
        </CardContent>
    </Card>
);

export default function ProfilePage() {

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-32 w-full">
        {user.coverPhotoUrl && (
          <Image
            src={user.coverPhotoUrl}
            alt="Profile Banner"
            fill
            objectFit="cover"
            data-ai-hint="abstract nature"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="p-4 -mt-16">
        <div className="relative h-24 w-24 rounded-full border-4 border-background">
            {user.avatarUrl && <Image src={user.avatarUrl} alt="User Avatar" fill objectFit="cover" className="rounded-full" data-ai-hint="person portrait"/>}
        </div>
      </div>
      <div className="px-4 -mt-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
                <p className="text-muted-foreground">{user.username}</p>
            </div>
            <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <div className="px-4 mt-4">
        <Card className="bg-primary/5 border-primary/20 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6">
                <X className="h-4 w-4" />
            </Button>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="text-primary" /> Hangel Etki Puanı
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center">
                {impactStats.map((stat, i) => (
                    <div key={i}>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statistics" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="statistics">İstatistikler</TabsTrigger>
            <TabsTrigger value="info">Bilgilerim</TabsTrigger>
            <TabsTrigger value="volunteer">Gönüllülük</TabsTrigger>
            <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
            <TabsTrigger value="badges">Rozetlerim</TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics" className="p-4">
            <div className="text-center text-muted-foreground py-12">
                <p>İstatistikleriniz yakında burada görüntülenecek.</p>
            </div>
        </TabsContent>

        <TabsContent value="info" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoRow icon={Home} label="Profil Fotoğrafı" value="profil.jpg" />
                    <InfoRow icon={Phone} label="Telefon" value={user.personalInfo.phone} />
                    <InfoRow icon={Mail} label="E-posta" value={user.personalInfo.email} />
                    <InfoRow icon={Cake} label="Doğum Tarihi" value={user.personalInfo.birthDate} />
                    <InfoRow icon={Users} label="Cinsiyet" value={user.personalInfo.gender} />
                    <InfoRow icon={Flag} label="Uyruk" value={user.personalInfo.nationality} />
                    <InfoRow icon={Droplet} label="Kan Grubu" value={user.personalInfo.bloodType} />
                    <InfoRow icon={Home} label="Adres" value={user.personalInfo.address.fullAddress} />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="volunteer" className="p-4 space-y-4">
            <VolunteerInfoCard title="Mesleki Yetkinlikler" items={user.volunteerInfo.skills} icon={Briefcase} />
            <VolunteerInfoCard title="Gündelik Yetkinlikler" items={user.volunteerInfo.dailySkills} icon={Sparkles} />
            <VolunteerInfoCard title="Sosyal Hassasiyetleri" items={user.volunteerInfo.interests} icon={Heart} />
            <VolunteerInfoCard title="Mezuniyetler" items={user.volunteerInfo.education.map(e => e.school)} icon={School} />
            <VolunteerInfoCard title="Meslek" items={[user.volunteerInfo.profession]} icon={Briefcase} />
            <VolunteerInfoCard title="Belgeler" items={user.volunteerInfo.documents} icon={FileText} />
            <VolunteerInfoCard title="Lisanslar" items={user.volunteerInfo.licenses} icon={Badge} />
            <VolunteerInfoCard title="Diller" items={user.volunteerInfo.languages} icon={Languages} />
            <VolunteerInfoCard title="Bildiği Programlar" items={user.volunteerInfo.programs} icon={Laptop} />
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Seyahat
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p>Yurtiçi seyahat engeli: {user.volunteerInfo.travelObstacle.domestic ? 'Var' : 'Yok'}</p>
                    <p>Yurtdışı seyahat engeli: {user.volunteerInfo.travelObstacle.international ? 'Var' : 'Yok'}</p>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="p-4">
             {certificates.length > 0 ? (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        {certificates.map(cert => (
                            <div key={cert.id} className='p-4 rounded-lg border flex items-center justify-between'>
                                <div>
                                    <p className='font-semibold'>{cert.title}</p>
                                    <p className='text-sm text-muted-foreground'>{cert.organization}</p>
                                    <p className='text-xs text-muted-foreground mt-1'>Tarih: {cert.date}</p>
                                </div>
                                <Button size="sm" variant="outline">Görüntüle</Button>
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
                {badges.slice(0, 4).map(badge => (
                    <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-accent/20 rounded-full mb-2">
                            <badge.iconName className="h-8 w-8 text-primary"/>
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.level} Seviye</p>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
