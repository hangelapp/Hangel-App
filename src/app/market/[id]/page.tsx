
'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Heart, Info, Percent, Rss, Star, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Calendar, MessageSquare, Edit, Loader2, BarChart3, TrendingUp, Users, Share2, FileText } from 'lucide-react';
import { ngos } from '@/lib/data';
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
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

const StatRow = ({ label, value }: { label: string, value: string | number | undefined }) => {
    if (value === undefined) return null;
    return (
        <div className="flex justify-between items-center py-4 text-sm border-b last:border-b-0">
            <p className="text-muted-foreground font-medium">{label}</p>
            <p className="font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}{label.includes('Oranı') ? '%' : ''}</p>
        </div>
    );
};

const PostCard = ({ post }: { post: Post }) => (
    <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-sm">{post.author.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{post.timestamp}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm leading-relaxed">{post.content}</p>
            {post.imageUrl && (
                <div className="relative aspect-video mt-4 rounded-xl overflow-hidden shadow-sm">
                    <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-start gap-0 border-t p-0">
            <Button variant="ghost" className="flex-1 h-12 text-sm gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                {post.likes} Beğeni
            </Button>
            <div className="w-px h-6 bg-border self-center" />
            <Button variant="ghost" className="flex-1 h-12 text-sm gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {post.comments} Yorum
            </Button>
        </CardFooter>
    </Card>
);

export default function BrandProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const db = useFirestore();
  const slug = params.id as string;
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [profileUrl, setProfileUrl] = useState('');
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
    fetch('/api/offers')
      .then(res => res.ok ? res.json() : [])
      .then((data: Brand[]) => {
        const match = Array.isArray(data) ? data.find(b => b.slug === slug) : undefined;
        setBrand(match || null);
      })
      .catch(() => setBrand(null));
  }, [slug]);

  const handleStartShopping = () => {
    if (!authUser) {
        toast({ variant: 'destructive', title: "Giriş Yapmalısınız", description: "Bağış sürecini başlatmak için lütfen oturum açın." });
        return;
    }
    
    if (!brand) return;

    setIsDonating(true);
    const transRef = collection(db, 'donations');
    
    addDocumentNonBlocking(transRef, {
        userId: authUser.uid,
        brandId: brand.id,
        brandName: brand.name,
        purchaseAmount: "0.00", 
        donationAmount: "0.00", 
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        type: 'expense',
        status: 'Yönlendirildi',
        ngo: ["Varsayılan STK'nız"]
    });

    setTimeout(() => {
        setIsDonating(false);
        toast({
            title: "Mağazaya Yönlendiriliyorsunuz",
            description: `${brand.name} üzerinden yapacağınız harcamanın bir kısmı iyiliğe dönüşecek.`,
        });
        if (brand.link) {
            window.open(brand.link, '_blank');
        }
    }, 1000);
  };

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
            <Skeleton className="h-24 w-24" />
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
            <div className="flex items-center gap-2 absolute top-20 left-4 z-10">
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-foreground bg-background/80 shadow-sm hover:bg-background rounded-full">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-20 right-4 z-10">
              <ShareButtons url={profileUrl} title={`Hangel'deki ${brand.name} mağazasını incele!`} buttonClassName="bg-background/80 shadow-sm" />
            </div>

            <div className="flex gap-4 items-center">
                <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white shadow-xl">
                    <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-2"/>
                    <AvatarFallback className="font-black text-2xl">{brand.name.slice(0,2)}</AvatarFallback>
                </Avatar>
                 <div className="flex-1">
                    <div>
                         <h1 className="text-3xl font-black font-headline tracking-tighter leading-tight">{brand.name}</h1>
                         <p className="text-muted-foreground text-sm font-medium capitalize">{brand.category}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 space-y-4">
                <div className="text-sm text-center text-muted-foreground bg-muted/30 py-3 rounded-2xl border border-dashed border-black/5">
                    <span className="font-black text-[#1d1d1f]">{brand.followers?.toLocaleString('tr-TR') || '1.240'}</span> kişi bu markayı takip ederek toplumsal faydayı destekliyor.
                </div>
                <div className="flex gap-2">
                    <Button className="flex-1 h-12 rounded-2xl font-bold shadow-xl shadow-primary/20" onClick={handleStartShopping} disabled={isDonating}>
                        {isDonating ? <Loader2 className="animate-spin h-5 w-5" /> : <>Alışverişe Başla <ExternalLink className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-black/10 hover:bg-muted/50" onClick={() => toast({ title: "Takip Edildi", description: `${brand.name} artık favorilerinde.` })}>
                        <Heart className="mr-2 h-4 w-4" /> Takip Et
                    </Button>
                </div>
            </div>
        </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2 bg-transparent h-14 items-center border-b rounded-none">
            <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Hakkında</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Veriler</TabsTrigger>
            <TabsTrigger value="sustainability" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Etki</TabsTrigger>
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold">Akış</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="p-4 space-y-6">
            <Card className="rounded-[2rem] shadow-sm border-black/5">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 font-bold"><Info className="h-5 w-5 text-primary"/> Marka Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4 font-medium leading-relaxed">
                    <p>{brand.about}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-dashed">
                        <Badge variant="secondary" className="font-bold rounded-lg">{brand.type}</Badge>
                        <Badge variant="secondary" className="font-bold rounded-lg">{brand.category}</Badge>
                        {brand.joinDate && <Badge variant="outline" className='text-[9px] uppercase font-black tracking-widest bg-muted/50 border-none'>Katılım: {brand.joinDate}</Badge>}
                    </div>
                </CardContent>
            </Card>

            {brand.donationRate > 0 && (
                 <Card className="rounded-[2rem] shadow-sm border-black/5 overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                                <Percent className="h-5 w-5"/> Bağış Oranları
                            </CardTitle>
                            <Badge className="bg-primary text-white font-black text-xl px-4 py-1.5 h-auto rounded-xl">%{brand.donationRate}</Badge>
                        </div>
                        <CardDescription className="text-muted-foreground mt-2 font-medium">
                            Bu markadan yapacağınız her alışverişin belirtilen oranı seçtiğiniz STK'ya bağışlanır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='p-0'>
                        {brand.donationByCategory && brand.donationByCategory.length > 0 ? (
                            <div className="divide-y border-t border-black/5">
                                {brand.donationByCategory.map(item => (
                                    <div key={item.category} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                                        <span className="font-bold text-sm text-[#1d1d1f]">{item.category}</span>
                                        <span className="font-black text-primary text-lg tracking-tighter">%{item.rate.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground italic text-sm">
                                Tüm kategorilerde sabit %{brand.donationRate} oranı uygulanmaktadır.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="border-primary/20 bg-primary/5 rounded-[2rem] shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                        <ShieldAlert className="h-5 w-5" /> Mağaza Özel Koşulları
                    </CardTitle>
                    <CardDescription className="font-medium text-primary/70">Bağışınızın hatasız yansıması için lütfen okuyunuz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm font-medium">
                    <div className="grid gap-4">
                        <div className="flex gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <p className="leading-relaxed">Aldığınız ürünleri mağaza üzerinden onaylamanızı öneririz.</p>
                        </div>
                        <div className="flex gap-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="leading-relaxed">İtiraz (dispute) durumunda mağaza bağış aktarımı yapmamaktadır.</p>
                        </div>
                        <div className="flex gap-3">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="leading-relaxed">Satın alımların tek bir oturumda (browser penceresi) tamamlanması gerekir.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="general-rules" className="border rounded-[2rem] bg-white px-6">
                    <AccordionTrigger className="hover:no-underline font-bold text-base py-5">
                        Genel Kullanım Şartları
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 space-y-4 text-muted-foreground font-medium leading-relaxed">
                        <p>1. hangel üzerinden "Alışverişe Başla" butonuna tıklayarak markanın resmi online mağazasına ya da mobil uygulamasına gitmeniz ve alışverişinizi aynı oturumda tamamlamanız gerekmektedir.</p>
                        <p>2. Bağış oranları sadece sayfada belirtilen kategoriler için geçerlidir. Diğer ürün ve kategorilerde bağış aktarımı yapılmayabilir.</p>
                        <p>3. Alışveriş sırasında herhangi bir kupon, indirim kodu veya hediye çeki kullanıldığında bağış süreci teknik olarak iptal olabilir.</p>
                        <p>4. Toplu alımlarda bağış verilmemektedir. (1 ay içerisinde herhangi bir üründen 3 adet ve üzeri alımlar, ve/veya aynı adrese aynı müşteri tarafından yapılan toplu siparişler bu kapsamdadır.)</p>
                        <p>5. Öğrenci/Öğretmen indirimleri veya kurumsal ayrıcalıklı indirim programları (Kamu, Eğitim, İş Ortağı vb.) kullanıldığında bağış yapılmayacaktır.</p>
                        <p>6. Belirtilen kısıtlamalar dışındaki diğer genel mağaza kampanyaları ile hangel bağışı birleştirilebilir.</p>
                        <p>7. Markanın mobil uygulaması üzerinden gerçekleşen alışverişlerde de aksi belirtilmedikçe bağış takibi yapılmaktadır.</p>
                        <p>8. Tarayıcıda reklam engelleyici (AdBlock) kullanımı bağış takibini engelleyebilir; işlem öncesi devre dışı bırakılması önerilir.</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </TabsContent>

        <TabsContent value="stats" className="p-4 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-[1.5rem] border-none bg-[#f5f5f7] p-6 text-center space-y-2">
                    <Users className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-black tracking-tighter text-[#1d1d1f]">{brand.followers?.toLocaleString('tr-TR') || '1.240'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aktif Destekçi</p>
                </Card>
                <Card className="rounded-[1.5rem] border-none bg-[#f5f5f7] p-6 text-center space-y-2">
                    <TrendingUp className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-black tracking-tighter text-[#1d1d1f]">%{brand.stats?.monthlyFollowerGrowth || '12.4'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aylık Büyüme</p>
                </Card>
             </div>

             <Card className="rounded-[2rem] shadow-sm border-black/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 font-bold">
                        <BarChart3 className="h-5 w-5 text-primary" /> Detaylı Performans Verileri
                    </CardTitle>
                </CardHeader>
                 <CardContent className="divide-y border-t border-black/5">
                    <StatRow label="Destekçi Sayısı (Tüm Zamanlar)" value={brand.stats?.supporters.toLocaleString('tr-TR')} />
                    <StatRow label="Toplam Bağış Hacmi" value={brand.stats?.totalDonation ? `${brand.stats.totalDonation.toLocaleString('tr-TR')} ₺` : '125.400 ₺'} />
                    <StatRow label="Profil Görüntülenme (Son 30 Gün)" value={brand.stats?.profileViews.toLocaleString('tr-TR') || '4.520'} />
                    <StatRow label="Profil Paylaşımı (Son 30 Gün)" value={brand.stats?.profileShares.toLocaleString('tr-TR') || '845'} />
                    <StatRow label="Yıllık Sosyal Etki Skoru" value="94 / 100" />
                </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="p-4 space-y-4">
            <Card className="rounded-[2rem] shadow-sm border-black/5">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Sürdürülebilirlik ve KSS Raporları</CardTitle>
                    <CardDescription className="font-medium">Markanın şeffaf sosyal ve çevresel etki raporları.</CardDescription>
                </CardHeader>
                <CardContent>
                    {brand.sustainabilityReports && brand.sustainabilityReports.length > 0 ? (
                        <div className="space-y-3">
                            {brand.sustainabilityReports.map((report) => (
                                <a key={report.title} href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 border rounded-2xl hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="font-bold text-sm text-[#1d1d1f]">{report.title}</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-16 bg-muted/10 rounded-2xl border-2 border-dashed">
                            <Info className="h-10 w-10 mx-auto mb-4 opacity-20" />
                            <p className="italic font-medium text-sm">Henüz kurumsal bir rapor yayınlanmadı.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="posts" className="p-4 space-y-4 pb-20">
            {brand.posts && brand.posts.length > 0 ? (
                brand.posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div className="text-center text-muted-foreground py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                    <Rss className="mx-auto h-12 w-12 opacity-20"/>
                    <p className="mt-4 font-bold text-sm uppercase tracking-widest">Henüz bir gönderi yok</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
