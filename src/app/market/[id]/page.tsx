

'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Heart, Info, Percent, Rss, Star, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Calendar, MessageSquare, Edit } from 'lucide-react';
import { allEntityLists } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import type { Post, Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Local StatRow component for statistics tab
const StatRow = ({ label, value }: { label: string, value: string | number | undefined }) => {
    if (value === undefined) return null;
    return (
        <div className="flex justify-between items-center py-3 text-sm border-b last:border-b-0">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-semibold text-foreground">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}{label.includes('Oranı') ? '%' : ''}</p>
        </div>
    );
};

// Local PostCard component for posts tab
const PostCard = ({ post }: { post: Post }) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm">{post.content}</p>
            {post.imageUrl && (
                <div className="relative aspect-video mt-4 rounded-lg overflow-hidden">
                    <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-start gap-2 border-t pt-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Heart className="mr-2 h-4 w-4" />
                {post.likes} Beğeni
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MessageSquare className="mr-2 h-4 w-4" />
                {post.comments} Yorum
            </Button>
        </CardFooter>
    </Card>
);

export default function BrandProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const slug = params.id as string;
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    const storedBrands = localStorage.getItem('managedBrands');
    const brandsSource: Brand[] = storedBrands ? JSON.parse(storedBrands) : allEntityLists;
    const foundBrand = brandsSource.find((b: Brand) => b.slug === slug);
    setBrand(foundBrand || null);
    
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, [slug]);

  if (brand === undefined) {
    return (
        <div className="animate-in fade-in-0">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 bg-background">
            <div className="flex gap-4 items-end -mt-16">
                <Skeleton className="h-24 w-24 rounded-full border-4 border-background shrink-0" />
                 <div className="flex-1 pb-2 flex justify-between items-end">
                    <div className='space-y-2'>
                         <Skeleton className="h-7 w-48" />
                         <Skeleton className="h-5 w-32" />
                    </div>
                </div>
            </div>
             <div className="flex gap-2 mt-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
    );
  }

  if (!brand) {
    notFound();
  }

  return (
    <div className="animate-in fade-in-0">
        <div className="p-4 bg-background pt-16">
            <div className="flex items-center gap-2 absolute top-4 left-4">
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-foreground bg-background/50 hover:bg-background rounded-full">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-4 right-4">
              <ShareButtons url={profileUrl} title={`Hangel'deki ${brand.name} mağazasını incele!`} />
            </div>

            <div className="flex gap-4 items-center">
                <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white shadow-lg">
                    <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain"/>
                    <AvatarFallback>{brand.name.slice(0,2)}</AvatarFallback>
                </Avatar>
                 <div className="flex-1">
                    <div>
                         <h1 className="text-2xl font-bold font-headline">{brand.name}</h1>
                         <p className="text-muted-foreground text-sm capitalize">{brand.category}</p>
                    </div>
                </div>
            </div>
            <div className="text-sm text-center text-muted-foreground mt-4">
                <span className="font-bold text-foreground">{brand.followers?.toLocaleString('tr-TR') || 0}</span> kişi bu markayı takip ederek destekliyor.
            </div>
            <div className="flex gap-2 mt-2">
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
            <TabsTrigger value="sustainability">Sürdürülebilirlik</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Marka Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <p>{brand.about}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                        <Badge variant="secondary">{brand.type}</Badge>
                        <Badge variant="secondary">{brand.category}</Badge>
                        {brand.joinDate && <Badge variant="outline" className='text-xs'>Katılım: {brand.joinDate}</Badge>}
                    </div>
                </CardContent>
            </Card>
            {brand.donationRate > 0 && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Percent className="h-5 w-5 text-primary"/> Bağış Oranları</CardTitle></CardHeader>
                    <CardContent className='space-y-3'>
                        <div>
                            <p className="text-2xl font-bold text-primary">%{brand.donationRate}</p>
                            <p className="text-sm text-muted-foreground">Bu markadan yapacağınız her alışverişin ortalama %{brand.donationRate}'i seçtiğiniz STK'ya bağışlanır.</p>
                        </div>
                        {brand.donationByCategory && brand.donationByCategory.length > 0 && (
                            <div className="pt-4 border-t">
                                <h4 className="font-semibold text-sm mb-2 text-foreground">Kategori Bazlı Oranlar</h4>
                                <div className="space-y-2">
                                    {brand.donationByCategory.map(item => (
                                        <div key={item.category} className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{item.category}</span>
                                            <span className="font-medium text-foreground">% {item.rate.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <ShieldAlert className="h-5 w-5" /> Mağaza Özel Bağış Koşulları
                    </CardTitle>
                    <CardDescription>Bağışınızın sorunsuz yansıması için lütfen okuyunuz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3">
                        <div className="flex gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <p>Aldığınız ürünleri mağaza üzerinden onaylamanızı öneririz. Onay işlemi bağış değerlendirme sürecini hızlandıracaktır.</p>
                        </div>
                        <div className="flex gap-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p>Alışveriş sırasında itiraz (dispute) açılması durumunda mağaza bağış aktarımı yapmamaktadır.</p>
                        </div>
                        <div className="flex gap-3">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p>Satın alımların tek bir oturumda tamamlanması tavsiye edilir; tarayıcı kapatıldığında çerez takibi sıfırlanabilir.</p>
                        </div>
                        <div className="flex gap-3">
                            <Percent className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <p>Bağış tutarı ödediğiniz net tutar üzerinden hesaplanır; hediye çekleri ve puan kullanımları bağış kapsamı dışındadır.</p>
                        </div>
                        <div className="flex gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p>Bağışların değerlendirme ve onay süreci ürüne göre 4 ile 6 ay arasında değişiklik gösterebilir.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Topluluk İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                    <StatRow label="Takipçi Sayısı" value={brand.followers?.toLocaleString('tr-TR')} />
                    <StatRow label="Destekçi Sayısı" value={brand.stats?.supporters.toLocaleString('tr-TR')} />
                    <StatRow label="Toplam Bağış Tutarı" value={brand.stats?.totalDonation ? `${brand.stats.totalDonation.toLocaleString('tr-TR')} ₺` : 'N/A'} />
                    <StatRow label="Aylık Takipçi Artışı" value={brand.stats?.monthlyFollowerGrowth} />
                    <StatRow label="Profil Görüntülenme (30g)" value={brand.stats?.profileViews.toLocaleString('tr-TR')} />
                    <StatRow label="Profil Paylaşımı (30g)" value={brand.stats?.profileShares.toLocaleString('tr-TR')} />
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="sustainability" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sürdürülebilirlik ve KSS Raporları</CardTitle>
                    <CardDescription>Markanın sosyal ve çevresel etki raporları.</CardDescription>
                </CardHeader>
                <CardContent>
                    {brand.sustainabilityReports && brand.sustainabilityReports.length > 0 ? (
                        <div className="space-y-3">
                            {brand.sustainabilityReports.map((report) => (
                                <a key={report.title} href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                                    <span className="font-medium text-sm">{report.title}</span>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Henüz bir rapor yayınlanmadı.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="posts" className="p-4 space-y-4">
            {brand.posts && brand.posts.length > 0 ? (
                brand.posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Rss className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">Bu marka henüz bir gönderi paylaşmadı.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
