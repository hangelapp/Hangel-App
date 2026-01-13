import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { HandCoins, Hourglass, Star, UserPlus, Award, ShieldCheck, Leaf, Dog, Baby, Edit } from 'lucide-react';

const impactStats = [
  { icon: HandCoins, value: '1,250 ₺', label: 'Bağış Tutarı' },
  { icon: Hourglass, value: '48 Saat', label: 'Gönüllülük' },
  { icon: UserPlus, value: '12', label: 'Davet' },
];

const badges = [
  { icon: Leaf, name: 'Doğa Koruyucu', level: 'Altın' },
  { icon: Dog, name: 'Hayvan Dostu', level: 'Gümüş' },
  { icon: Baby, name: 'Çocuk Gelişimi', level: 'Bronz' },
  { icon: ShieldCheck, name: 'Toplum Lideri', level: 'Platin' },
]

export default function ProfilePage() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');
  const profileBanner = PlaceHolderImages.find((img) => img.id === 'user-profile-banner');

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-32 w-full">
        {profileBanner && (
          <Image
            src={profileBanner.imageUrl}
            alt="Profile Banner"
            fill
            objectFit="cover"
            data-ai-hint={profileBanner.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="p-4 -mt-16">
        <div className="relative h-24 w-24 rounded-full border-4 border-background">
            {userAvatar && <Image src={userAvatar.imageUrl} alt="User Avatar" fill objectFit="cover" className="rounded-full" data-ai-hint={userAvatar.imageHint}/>}
        </div>
      </div>
      <div className="p-4 -mt-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-headline">Ayşe Yılmaz</h1>
                <p className="text-muted-foreground">@ayseyilmaz</p>
            </div>
            <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <div className="px-4">
        <Card className="bg-primary/5 border-primary/20">
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

      <Tabs defaultValue="badges" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">Rozetlerim</TabsTrigger>
            <TabsTrigger value="info">Bilgilerim</TabsTrigger>
        </TabsList>
        <TabsContent value="badges" className="p-4">
            <div className="grid grid-cols-2 gap-4">
                {badges.map(badge => (
                    <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-accent/20 rounded-full mb-2">
                            <badge.icon className="h-8 w-8 text-primary"/>
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.level} Seviye</p>
                    </Card>
                ))}
            </div>
        </TabsContent>
        <TabsContent value="info" className="p-4 space-y-4 text-sm">
            <Card>
                <CardHeader><CardTitle className="text-base">Kişisel Bilgiler</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><span className="font-semibold">E-posta:</span> a.yilmaz@email.com</p>
                    <p><span className="font-semibold">Kan Grubu:</span> A Rh+</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Gönüllülük Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><span className="font-semibold">Yetkinlikler:</span> Grafik Tasarım, Proje Yönetimi</p>
                    <p><span className="font-semibold">Sosyal Hassasiyetler:</span> Hayvan Hakları, Çevre</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
