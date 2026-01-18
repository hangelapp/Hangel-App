'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, ExternalLink, Heart, Info, Percent, Rss, Star } from 'lucide-react';
import { allEntityLists } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function BrandProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const brand = allEntityLists.find(b => b.id === id);

  if (!brand) {
    notFound();
  }
  
  const coverPhotoUrl = brand.coverPhotoUrl || 'https://picsum.photos/seed/brand-cover/1200/400';

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-40 w-full bg-muted">
        <Image src={coverPhotoUrl} alt={`${brand.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
            <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-end -mt-16">
            <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white">
                <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain"/>
                <AvatarFallback>{brand.name.slice(0,2)}</AvatarFallback>
            </Avatar>
             <div className="flex-1 pb-2 flex justify-between items-end">
                <div>
                     <h1 className="text-2xl font-bold font-headline">{brand.name}</h1>
                     <p className="text-muted-foreground text-sm capitalize">{brand.category}</p>
                </div>
            </div>
        </div>
         <div className="flex gap-2 mt-4">
            <Button className="flex-1">
                Alışverişe Başla <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex-1">
                <Heart className="mr-2 h-4 w-4" /> Takip Et
            </Button>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2">
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="contact">İletişim</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Marka Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <p>
                        {brand.about || `${brand.name}, sosyal sorumluluk bilinciyle hareket ederek, her alışverişinizde topluma katkı sağlamanızı hedefler. Sürdürülebilir ve etik üretim ilkeleriyle çalışıyoruz.`}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Badge variant="secondary">{brand.type}</Badge>
                        <Badge variant="secondary">{brand.category}</Badge>
                    </div>
                </CardContent>
            </Card>
            {brand.donationRate > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Percent className="h-5 w-5 text-primary"/> Bağış Oranı</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">%{brand.donationRate}</p>
                        <p className="text-sm text-muted-foreground">Bu markadan yapacağınız her alışverişin %{brand.donationRate}'i seçtiğiniz STK'ya bağışlanır.</p>
                    </CardContent>
                </Card>
            )}
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Topluluk İstatistikleri</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/50 rounded-lg">
                        <p className="font-bold text-lg">{((brand.followers || 0) / 1000).toFixed(1)}k</p>
                        <p className="text-sm text-muted-foreground">Takipçi</p>
                    </div>
                    <div className="p-4 bg-accent/50 rounded-lg">
                        <p className="font-bold text-lg">{brand.donationRate > 0 ? 'Aktif' : 'Pasif'}</p>
                        <p className="text-sm text-muted-foreground">Bağış Durumu</p>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="posts" className="p-4">
            <div className="text-center text-muted-foreground py-16">
                <Rss className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                <p className="mt-4">Bu marka henüz bir gönderi paylaşmadı.</p>
            </div>
        </TabsContent>
        <TabsContent value="contact" className="p-4">
            <div className="text-center text-muted-foreground py-16">
                 <Building className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                <p className="mt-4">İletişim bilgileri yakında eklenecektir.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
