'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, Heart, Info, Rss, Handshake, Calendar, MapPin, Award } from 'lucide-react';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';

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

export default function NgoProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const ngo = ngos.find(n => n.id === id);

  if (!ngo) {
    notFound();
  }
  
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-40 w-full bg-muted">
        <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
            <ArrowLeft className="h-5 w-5" />
        </Button>
         <div className="absolute top-4 right-4">
            <ShareButtons url={profileUrl} title={`Hangel'deki ${ngo.name} profilini incele!`} />
        </div>
      </div>
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-end -mt-16">
            <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white">
                <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-2"/>
                <AvatarFallback>{ngo.name.slice(0,2)}</AvatarFallback>
            </Avatar>
             <div className="flex-1 pb-2 flex justify-between items-end">
                <div>
                     <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
                     <p className="text-muted-foreground text-sm capitalize">{ngo.category}</p>
                </div>
            </div>
        </div>
         <div className="text-sm text-center text-muted-foreground mt-4">
            <span className="font-bold text-foreground">{ngo.stats.followers.toLocaleString() || 0}</span> kişi bu kuruluşu takip ederek destekliyor.
        </div>
         <div className="flex gap-2 mt-2">
            <Button className="flex-1">
                 Bağış Yap
            </Button>
            <Button variant="outline" className="flex-1">
                <Heart className="mr-2 h-4 w-4" /> Takip Et
            </Button>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2">
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="opportunities">Fırsatlar</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
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
            {ngo.economicEnterpriseUrl && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> İktisadi İşletme</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Bu kuruluşun ürünlerini satın alarak doğrudan destek olabilirsiniz.</p>
                        <Button asChild className="w-full">
                            <Link href={ngo.economicEnterpriseUrl}>İktisadi İşletmeyi Ziyaret Et</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
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
                <CardHeader><CardTitle className="text-lg">Topluluk İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                    <StatRow label="Takipçi Sayısı" value={ngo.stats.followers.toLocaleString()} />
                    <StatRow label="Bağışçı Sayısı" value={ngo.stats.donors.toLocaleString()} />
                    <StatRow label="Gönüllü Sayısı" value={ngo.stats.volunteers.toLocaleString()} />
                    <StatRow label="Toplam Gönüllülük Saati" value={`${ngo.stats.volunteerHours.toLocaleString()} saat`} />
                    <StatRow label="Tamamlanan Proje Sayısı" value={ngo.stats.projects} />
                    <StatRow label="Ulaşılan İnsan Sayısı" value={ngo.stats.peopleReached.toLocaleString()} />
                    <StatRow label="Şeffaflık Puanı" value={ngo.transparencyScore} />
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
