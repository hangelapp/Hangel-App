'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, Heart, Info, Rss, Handshake, Calendar, MapPin, Award, Store, Users, DollarSign, ShieldCheck, Mail, Phone, Globe, Twitter, Instagram, Linkedin, Facebook, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const StatRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-3 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

const PostCard = ({ post }: { post: (typeof timelinePosts)[0] }) => (
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
    </Card>
);

const OpportunityCard = ({ opp }: { opp: (typeof volunteeringOpportunities)[0] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base">{opp.title}</CardTitle>
            <CardDescription>{opp.organization}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{opp.location.city} ({opp.location.type})</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />{opp.commitment}</div>
            <div className="flex items-center gap-2 text-primary font-semibold"><Award className="h-4 w-4" />{opp.points} Puan</div>
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`/volunteering/${opp.id}`}>Detayları Gör</Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function NgoProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const ngo = ngos.find(n => n.id === id);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    setProfileUrl(window.location.href);
  }, []);

  if (!ngo) {
    notFound();
  }

  const handleStoreClick = () => {
    if (ngo.economicEnterpriseUrl) {
      router.push(ngo.economicEnterpriseUrl);
    } else {
      toast({
        title: "Bilgi",
        description: "Bu sivil toplum kuruluşunun iktisadi işletmesi bulunmamaktadır.",
      });
    }
  };
  
  const transparencyCriteria = [
      { name: 'Faaliyet Belgesi', completed: true },
      { name: 'Tüzük / Vakıf Senedi', completed: true },
      { name: 'Yıllık Faaliyet Raporu', completed: true },
      { name: 'Finansal Tablolar', completed: ngo.transparencyScore > 85 },
      { name: 'Bağımsız Denetim Raporu', completed: ngo.transparencyScore > 90 },
      { name: 'Web Sitesi', completed: true },
  ];

  return (
    <div className="animate-in fade-in-0">
        <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
                <Button onClick={handleStoreClick} size="icon" variant="outline" className="rounded-full h-9 w-9 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
                    <Store className="h-4 w-4" />
                </Button>
                <ShareButtons url={profileUrl} title={`Hangel'deki ${ngo.name} profilini incele!`} buttonClassName="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" />
            </div>
        </div>
      <div className="p-4 pt-4 bg-background">
        <div className="flex gap-4 items-center">
            <Avatar className="h-20 w-20 shrink-0 bg-white">
                <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-2"/>
                <AvatarFallback>{ngo.name.slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
                <p className="text-muted-foreground text-sm capitalize">{ngo.category}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 divide-x rounded-lg border flex-1 mt-4">
            <div className="p-3 text-center">
                <p className="font-bold text-lg">{ngo.stats.donors.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Bağışçı</p>
            </div>
            <div className="p-3 text-center">
                <p className="font-bold text-lg">{ngo.stats.volunteers.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Gönüllü</p>
            </div>
        </div>
        <div className="flex gap-2 mt-4">
            <Button className="flex-1">
                 Bağışçı Ol
            </Button>
            <Button variant="outline" className="flex-1">
                <Heart className="mr-2 h-4 w-4" /> Gönüllü Ol
            </Button>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-5 px-2">
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="opportunities">Fırsatlar</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="transparency">Şeffaflık</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Kuruluş Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    {ngo.about.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                        <Badge variant="secondary">{ngo.type}</Badge>
                        <Badge variant="secondary">{ngo.category}</Badge>
                        {ngo.joinDate && <Badge variant="outline" className='text-xs'>Katılım: {ngo.joinDate}</Badge>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Detaylar</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Faydalanıcı Gruplar</h4>
                        <div className="flex flex-wrap gap-2">
                            {ngo.beneficiaryGroups.map(group => <Badge key={group} variant="outline">{group}</Badge>)}
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Desteklenen SKA'lar</h4>
                         <div className="flex flex-wrap gap-2">
                            {ngo.supportedSDGs.map(sdg => <Badge key={sdg} variant="outline">{sdg}</Badge>)}
                        </div>
                    </div>
                     <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Üye Olunan Platformlar</h4>
                         <div className="flex flex-wrap gap-2">
                            {ngo.memberOf.map(platform => <Badge key={platform} variant="outline">{platform}</Badge>)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">İletişim</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.email}</span></div>
                    <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.phone}</span></div>
                    <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.website}</span></div>
                    <Separator className="my-4" />
                    <div className="flex gap-4">
                        <a href={`https://twitter.com/${ngo.contact.social.twitter}`} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href={`https://instagram.com/${ngo.contact.social.instagram}`} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href={`https://facebook.com/${ngo.contact.social.facebook}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href={`https://linkedin.com/company/${ngo.contact.social.linkedin}`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="opportunities" className="p-4 space-y-4">
             {ngo.opportunities && ngo.opportunities.length > 0 ? (
                ngo.opportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} />)
             ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Handshake className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">Bu kuruluşun aktif bir gönüllülük ilanı bulunmuyor.</p>
                </div>
             )}
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Özet İstatistikler</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="font-bold text-lg">{ngo.stats.totalDonation.toLocaleString('tr-TR')} ₺</p><p className="text-sm text-muted-foreground">Toplam Bağış</p></div>
                    <div><p className="font-bold text-lg">{ngo.stats.donors.toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">Bağışçı</p></div>
                    <div><p className="font-bold text-lg">{ngo.stats.volunteers.toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">Gönüllü</p></div>
                 </CardContent>
             </Card>
             <Card>
                 <CardHeader><CardTitle className="text-lg">Gönüllülük İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                     <StatRow label="Toplam Gönüllülük Saati" value={`${ngo.stats.volunteerHours.toLocaleString('tr-TR')} saat`} />
                     <StatRow label="Toplam Gönüllü Sayısı" value={ngo.stats.volunteers.toLocaleString('tr-TR')} />
                     <StatRow label="Tamamlanan Proje Sayısı" value={ngo.stats.projects} />
                 </CardContent>
             </Card>
             <Card>
                 <CardHeader><CardTitle className="text-lg">Bağış İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                    <StatRow label="Toplam Bağış Tutarı" value={`${ngo.stats.totalDonation.toLocaleString('tr-TR')} ₺`} />
                    <StatRow label="Toplam Bağışçı Sayısı" value={ngo.stats.donors.toLocaleString('tr-TR')} />
                    <StatRow label="Ulaşılan İnsan Sayısı" value={ngo.stats.peopleReached.toLocaleString('tr-TR')} />
                 </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="transparency" className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/> Şeffaflık Endeksi</CardTitle>
                    <CardDescription>Bu puan, kuruluşun platformumuzdaki şeffaflık kriterlerini ne ölçüde karşıladığını gösterir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-3xl font-bold text-primary">{ngo.transparencyScore} / 100</p>
                        <Progress value={ngo.transparencyScore} className="mt-2 h-2" />
                    </div>
                    <div className="pt-4 space-y-3">
                        <h4 className="font-semibold text-sm">Karşılanan Kriterler</h4>
                        {transparencyCriteria.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50">
                                <div className='flex items-center'>
                                     {item.completed ? (
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-500"/>
                                    ) : (
                                        <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground"/>
                                    )}
                                    <span className={!item.completed ? 'text-muted-foreground' : ''}>{item.name}</span>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="posts" className="p-4 space-y-4">
            {ngo.posts && ngo.posts.length > 0 ? (
                ngo.posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Rss className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">Bu kuruluş henüz bir gönderi paylaşmadı.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
