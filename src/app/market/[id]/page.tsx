
'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Heart, Info, Percent, Rss, Star, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Calendar, Edit } from 'lucide-react';
import { allEntityLists } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const StatRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-3 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

export default function BrandProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const slug = params.id as string;
  const brand = allEntityLists.find(b => b.slug === slug);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, []);

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
         <div className="absolute top-4 right-4">
            <ShareButtons url={profileUrl} title={`Hangel'deki ${brand.name} mağazasını incele!`} />
        </div>
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
            <Button variant="outline" className="flex-1" onClick={() => toast({title: "Profili Düzenle", description: "Bu özellik yakında aktif olacaktır."})}>
                <Edit className="mr-2 h-4 w-4" /> Düzenle
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
                    {brand.about?.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
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
                                            <span className="font-medium text-foreground">% {item.rate}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Bağış Koşulları Bölümü - Sırası Alta Alındı */}
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

                    <Accordion type="single" collapsible className="w-full mt-4 bg-background rounded-lg border">
                        <AccordionItem value="general-conditions" className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-bold text-foreground">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-primary" />
                                    Genel Bağış Koşulları (Önemli)
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 space-y-4 text-xs leading-relaxed text-muted-foreground">
                                <div className="space-y-3 border-t pt-4">
                                    <p className="font-bold text-foreground text-sm">Bağış kazanacağınızdan emin olmak için:</p>
                                    
                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Adblock ve eklentileri devre dışı bırakın</p>
                                        <p>Reklam engelleyici programlar çerezleri sildiği için bağış takibi yapılamaz.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Çerezlere izin verin ve gizli sekme kullanmayın</p>
                                        <p>Mağazalar sizi tanımlamak için çerez kullanır. Gizli sekmede bu takip yapılamaz.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Başka ödül programı kullanmayın</p>
                                        <p>Alışveriş sırasında sadece hangel'in açık olduğundan emin olun; diğer programlar takibi bozabilir.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Sadece hangel kuponlarını kullanın</p>
                                        <p>Harici sitelerden alınan kuponlar bağış hakkınızı iptal edebilir.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Mobil uygulama yerine tarayıcı kullanın</p>
                                        <p>Aksi belirtilmedikçe, mobil uygulamalar üzerinden yapılan alışverişlerde teknik kısıtlar nedeniyle bağış yansıtılamamaktadır.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Sepeti sonradan doldurun</p>
                                        <p>Ürünleri sepetinize hangel üzerinden mağazaya gittikten sonra eklemeniz önerilir.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-semibold text-foreground">● Telefonla sipariş vermeyin</p>
                                        <p>Sadece online ve hangel üzerinden gerçekleştirilen işlemler bağış kapsamındadır.</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Topluluk İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                    <StatRow label="Takipçi Sayısı" value={brand.followers?.toLocaleString('tr-TR') || 'N/A'} />
                    <StatRow label="Destekçi Sayısı" value={brand.stats?.supporters.toLocaleString('tr-TR') || 'N/A'} />
                    <StatRow label="Toplam Bağış Tutarı" value={`${brand.stats?.totalDonation.toLocaleString('tr-TR') || 'N/A'} ₺`} />
                    <StatRow label="Aylık Takipçi Artışı" value={`+${brand.stats?.monthlyFollowerGrowth.toLocaleString('tr-TR') || 'N/A'}%`} />
                    <StatRow label="Profil Görüntülenme (30g)" value={brand.stats?.profileViews.toLocaleString('tr-TR') || 'N/A'} />
                    <StatRow label="Profil Paylaşımı (30g)" value={brand.stats?.profileShares.toLocaleString('tr-TR') || 'N/A'} />
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="sustainability" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Sürdürülebilirlik Raporları</CardTitle>
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
        <TabsContent value="posts" className="p-4">
            <div className="text-center text-muted-foreground py-16">
                <Rss className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                <p className="mt-4">Bu marka henüz bir gönderi paylaşmadı.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
