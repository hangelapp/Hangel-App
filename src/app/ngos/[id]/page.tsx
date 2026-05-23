
'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, Heart, Info, Rss, Handshake, Calendar, MapPin, Award, Store, Users, ShieldCheck, Mail, Phone, Globe, Instagram, Linkedin, Facebook, CheckCircle, AlertCircle, Eye, Share2, CreditCard, Target, Copy } from 'lucide-react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import { NgoAnalyticsScripts } from '@/components/shared/ngo-analytics-scripts';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { NGO, Post, Volunteering } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { COLLECTIONS } from '@/firebase/collections';

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const StatRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-3 text-sm border-b last:border-b-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

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
        <CardFooter className="flex justify-start gap-0 border-t p-0">
            <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                <Heart className="h-5 w-5" /> 
                <span>Beğen</span>
            </Button>
            <div className="w-[1px] h-6 bg-border self-center" />
            <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                <Share2 className="h-5 w-5" /> 
                <span>Paylaş</span>
            </Button>
        </CardFooter>
    </Card>
);

const OpportunityCard = ({ opp }: { opp: Volunteering }) => (
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
  const db = useFirestore();

  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, COLLECTIONS.ngos, id);
  }, [db, id]);

  const { data: ngo, isLoading } = useDoc<NGO>(ngoDocRef);

  const { user: authUser } = useUser();
  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);
  const { data: userData } = useDoc<{
    supportedNgos?: string[];
    volunteerNgos?: string[];
    lastNgoSelectionChange?: { toDate?: () => Date; seconds?: number; nanoseconds?: number } | null;
  }>(userDocRef);

  const isSupporter = Array.isArray(userData?.supportedNgos) && userData!.supportedNgos!.includes(id);
  const isVolunteer = Array.isArray(userData?.volunteerNgos) && userData!.volunteerNgos!.includes(id);

  const [profileUrl, setProfileUrl] = useState('');
  const [isPosInfoOpen, setIsPosInfoOpen] = useState(false);
  const [donorBusy, setDonorBusy] = useState(false);
  const [volunteerBusy, setVolunteerBusy] = useState(false);

  const handleToggleDonor = async () => {
    if (!authUser || !userDocRef) {
      router.push('/login/selection?action=login');
      return;
    }
    if (donorBusy) return;

    const current = Array.isArray(userData?.supportedNgos) ? userData!.supportedNgos! : [];
    const isAdding = !isSupporter;

    // Bağışçı limiti (max 2) + 30 günlük kilit, settings/ngo-selection ile aynı kurallar.
    if (isAdding && current.length >= 2) {
      const raw = userData?.lastNgoSelectionChange;
      const lastDate = typeof raw?.toDate === 'function'
        ? raw.toDate()
        : typeof raw?.seconds === 'number'
          ? new Date(raw.seconds * 1000)
          : null;
      const daysElapsed = lastDate
        ? Math.floor((Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
        : 30;
      const remainingDays = Math.max(0, 30 - daysElapsed);
      if (remainingDays > 0) {
        // 30 gün dolmadan değişiklik yapılamaz.
        toast({
          title: `${remainingDays} gün sonra bağış yapacağınız STK'yı değiştirebilirsiniz`,
          variant: 'destructive',
        });
      } else {
        // 30 gün doldu: değişiklik için seçim sayfasına yönlendir.
        toast({
          title: 'Bağışçı limitiniz dolu',
          description: 'Desteklediğiniz STK\'ları değiştirmek için STK seçim sayfasına yönlendiriliyorsunuz.',
        });
        router.push('/settings/ngo-selection');
      }
      return;
    }

    setDonorBusy(true);
    try {
      // User doc + NGO stats.donors atomic update: ikisi de aynı transaction'da
      // değişir → sayaç ve kullanıcı listesi senkron kalır. Eğer biri hata
      // verirse ikisi de revert eder. NGO ref güncellemesi rules tarafında
      // public 'viewCount'+'stats' yazımına izin verilen alanlarla aynı tipte
      // (donor ekleme/çıkarma kullanıcı talebi sonucu).
      const ngoRef = doc(db, COLLECTIONS.ngos, id);
      const isFirstSelection = current.length === 0;
      await runTransaction(db, async (tx) => {
        if (isSupporter) {
          // Çıkış: user'dan kaldır + NGO donor sayacını 1 azalt.
          tx.update(userDocRef, { supportedNgos: arrayRemove(id) });
          tx.set(ngoRef, { stats: { donors: increment(-1) } }, { merge: true });
        } else {
          // Giriş: user'a ekle + NGO donor sayacını 1 artır. İlk seçimde
          // 30-gün kilidi için lastNgoSelectionChange damgalanır.
          const userPayload: Record<string, unknown> = { supportedNgos: arrayUnion(id) };
          if (isFirstSelection) userPayload.lastNgoSelectionChange = serverTimestamp();
          tx.update(userDocRef, userPayload);
          tx.set(ngoRef, { stats: { donors: increment(1) } }, { merge: true });
        }
      });
      if (isSupporter) {
        toast({ title: 'Bağışçılıktan çıkıldı', description: `${ngo?.name} artık desteklediğin STK'lar arasında değil.` });
      } else {
        toast({ title: 'Bağışçı oldun', description: `Artık ${ngo?.name} bağışçılarındansın. Teşekkürler!` });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Bir hata oluştu', description: (e as Error)?.message || 'Lütfen tekrar deneyin.' });
    } finally {
      setDonorBusy(false);
    }
  };

  const handleToggleVolunteer = async () => {
    if (!authUser || !userDocRef) {
      router.push('/login/selection?action=login');
      return;
    }
    if (volunteerBusy) return;
    setVolunteerBusy(true);
    try {
      // Atomic: user.volunteerNgos + ngo.stats.volunteers (donor ile aynı kalıp).
      const ngoRef = doc(db, COLLECTIONS.ngos, id);
      await runTransaction(db, async (tx) => {
        if (isVolunteer) {
          tx.update(userDocRef, { volunteerNgos: arrayRemove(id) });
          tx.set(ngoRef, { stats: { volunteers: increment(-1) } }, { merge: true });
        } else {
          tx.update(userDocRef, { volunteerNgos: arrayUnion(id) });
          tx.set(ngoRef, { stats: { volunteers: increment(1) } }, { merge: true });
        }
      });
      if (isVolunteer) {
        toast({ title: 'Gönüllülükten çıkıldı', description: `${ngo?.name} artık gönüllü olduğun STK'lar arasında değil.` });
      } else {
        toast({ title: 'Gönüllü oldun', description: `Artık ${ngo?.name} gönüllülerindensin. Hoş geldin!` });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Bir hata oluştu', description: (e as Error)?.message || 'Lütfen tekrar deneyin.' });
    } finally {
      setVolunteerBusy(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (db && id) {
      updateDoc(doc(db, COLLECTIONS.ngos, id), { viewCount: increment(1) }).catch(() => {});
    }
  }, [db, id]);
  
  if (isLoading || !ngoDocRef) {
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
  
  const transparencyScore = ngo.transparencyScore ?? 0;
  const transparencyCriteria = [
    { name: 'Faaliyet Belgesi', completed: true },
    { name: 'Tüzük / Vakıf Senedi', completed: true },
    { name: 'Yönetim Kurulu Listesi', completed: transparencyScore > 80 },
    { name: 'Yıllık Faaliyet Raporu', completed: true },
    { name: 'Finansal Tablolar', completed: transparencyScore > 85 },
    { name: 'Bağımsız Denetim Raporu', completed: transparencyScore > 90 },
    { name: 'Etki Raporu', completed: transparencyScore > 75 },
  ];

  const ngoAnalytics = (ngo as NGO & { analytics?: { gaId?: string; gtmId?: string; metaPixelId?: string } }).analytics;

  // Kütük (devlet sicil) numarası ngo dokümanında birden fazla alan adıyla tutulabilir;
  // ilk dolu olanı paylaşılabilir hangel.org.tr/<no> linki olarak gösteririz.
  const ngoRegistry = ngo as NGO & { kutukNo?: string; registryNo?: string; registryNumber?: string; kutuk?: string };
  const kutukNo = (ngoRegistry.kutukNo ?? ngoRegistry.registryNo ?? ngoRegistry.registryNumber ?? ngoRegistry.kutuk ?? '').toString().trim();
  const kutukShortLink = kutukNo ? `hangel.org.tr/${kutukNo}` : '';

  const handleCopyKutuk = async () => {
    if (!kutukShortLink) return;
    try {
      await navigator.clipboard.writeText(kutukShortLink);
      toast({ title: 'Bağlantı kopyalandı', description: kutukShortLink });
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Lütfen bağlantıyı elle kopyalayın.' });
    }
  };

  return (
    <div className="animate-in fade-in-0">
        <NgoAnalyticsScripts
            gaId={ngoAnalytics?.gaId}
            gtmId={ngoAnalytics?.gtmId}
            metaPixelId={ngoAnalytics?.metaPixelId}
        />
        <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label="Geri">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
                <Button onClick={handleStoreClick} size="icon" variant="outline" className="rounded-full h-9 w-9 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" aria-label="Mağaza">
                    <Store className="h-4 w-4" />
                </Button>
                <Button aria-label="POS ile ödeme" onClick={() => setIsPosInfoOpen(true)} size="icon" variant="outline" className="rounded-full h-9 w-9 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
                    <CreditCard className="h-4 w-4" />
                </Button>
                <ShareButtons url={profileUrl} title={`Hangel'deki ${ngo.name} profilini incele!`} buttonClassName="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" />
                <Button asChild size="icon" variant="outline" className="rounded-full h-9 w-9 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" aria-label="Web sitesini görüntüle">
                  <Link href={`/ngo-admin/website/preview`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </Link>
                </Button>
            </div>
        </div>
      <div className="p-4 pt-4 bg-background">
        <div className="flex gap-4 items-center">
            <Avatar className="h-20 w-20 shrink-0 bg-white">
                <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-2"/>
                <AvatarFallback>{ngo.name.slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
                    <Badge variant="outline" className="text-base font-bold border-primary/50 text-primary bg-primary/10">
                        <ShieldCheck className="h-4 w-4 mr-1.5"/>
                        {transparencyScore}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-muted-foreground text-sm capitalize">{ngo.category}</p>
                    <Separator orientation="vertical" className="h-3" />
                    <p className="text-muted-foreground text-sm">{ngo.type}</p>
                </div>
            </div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2">
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{(ngo.stats?.donors ?? 0).toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground">Bağışçı</p>
                </div>
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{(ngo.stats?.volunteers ?? 0).toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground">Gönüllü</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleToggleDonor}
                    disabled={donorBusy}
                    variant={isSupporter ? 'secondary' : 'default'}
                    className="flex-1"
                >
                    {isSupporter ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                    {isSupporter ? 'Bağışçısısın' : 'Bağışçı Ol'}
                </Button>
                <Button
                    onClick={handleToggleVolunteer}
                    disabled={volunteerBusy}
                    variant={isVolunteer ? 'secondary' : 'outline'}
                    className="flex-1"
                >
                    {isVolunteer ? <CheckCircle className="mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />}
                    {isVolunteer ? 'Gönüllüsün' : 'Gönüllü Ol'}
                </Button>
            </div>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="flex flex-wrap justify-center h-auto p-1">
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
                    {(ngo.about ?? '').split('\n\n').filter(Boolean).map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between"><span className="font-medium text-foreground">Kuruluş Türü:</span><span>{ngo.type}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-foreground">Kategori:</span><span>{ngo.category}</span></div>
                        {ngo.foundationYear && <div className="flex justify-between"><span className="font-medium text-foreground">Kuruluş Yılı:</span><span>{ngo.foundationYear}</span></div>}
                        {ngo.joinDate && <div className="flex justify-between"><span className="font-medium text-foreground">Katılım Tarihi:</span><span>{new Date(ngo.joinDate).toLocaleDateString('tr-TR')}</span></div>}
                        <div className="flex justify-between"><span className="font-medium text-foreground">İktisadi İşletme:</span><span>{ngo.economicEnterpriseStatus === 'var' ? 'Var' : 'Yok'}</span></div>
                        {kutukNo && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="font-medium text-foreground shrink-0">Kütük No:</span>
                                <div className="flex items-center gap-1 min-w-0">
                                    <Link href={`/k/${kutukNo}`} className="text-primary font-medium hover:underline truncate" title={kutukShortLink}>
                                        {kutukShortLink}
                                    </Link>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0"
                                        onClick={handleCopyKutuk}
                                        aria-label="Kütük bağlantısını kopyala"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Etki Alanları</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-4">
                    {ngo.beneficiaryGroups && ngo.beneficiaryGroups.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> Faydalanıcı Gruplar</h4>
                            <div className="flex flex-wrap gap-2">
                                {ngo.beneficiaryGroups.map(group => <Link key={group} href={`/ngos?filter=${encodeURIComponent(group)}`}><Badge variant="outline" className="cursor-pointer hover:bg-accent">{group}</Badge></Link>)}
                            </div>
                        </div>
                    )}
                    {ngo.supportedSDGs && ngo.supportedSDGs.length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary"/> Desteklenen SKA'lar</h4>
                             <div className="flex flex-wrap gap-2">
                                {ngo.supportedSDGs.map(sdg => <Link key={sdg} href={`/ngos?filter=${encodeURIComponent(sdg)}`}><Badge variant="outline" className="cursor-pointer hover:bg-accent">{sdg}</Badge></Link>)}
                            </div>
                        </div>
                    )}
                    {ngo.federations && ngo.federations.length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Building className="h-4 w-4 text-primary"/> Kayıtlı Federasyonlar</h4>
                             <div className="flex flex-wrap gap-2">
                                {ngo.federations.map(fed => <Badge key={fed} variant="secondary" className="text-[10px]">{fed}</Badge>)}
                            </div>
                        </div>
                    )}
                    {ngo.memberOf && ngo.memberOf.length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Handshake className="h-4 w-4 text-primary"/> Üye Olunan Platformlar</h4>
                             <div className="flex flex-wrap gap-2">
                                {ngo.memberOf.map(platform => <Link key={platform} href={`/ngos?filter=${encodeURIComponent(platform)}`}><Badge variant="outline" className="cursor-pointer hover:bg-accent">{platform}</Badge></Link>)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">İletişim</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {ngo.contact?.email && <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.email}</span></div>}
                    {ngo.contact?.phone && <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.phone}</span></div>}
                    {ngo.contact?.website && <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.website}</span></div>}
                    {ngo.contact?.address && (
                        <div className="flex items-start gap-3 text-sm pt-3 border-t">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span>{ngo.contact.address.fullAddress}<br/>{ngo.contact.address.district}, {ngo.contact.address.city}</span>
                        </div>
                     )}
                    {ngo.contact?.social && (ngo.contact.social.twitter || ngo.contact.social.instagram || ngo.contact.social.facebook || ngo.contact.social.linkedin) && (
                        <>
                            <Separator className="my-4" />
                            <div className="flex gap-4">
                                {ngo.contact.social.twitter && <a href={`https://x.com/${ngo.contact.social.twitter}`} target="_blank" rel="noopener noreferrer"><XIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                                {ngo.contact.social.instagram && <a href={`https://instagram.com/${ngo.contact.social.instagram}`} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                                {ngo.contact.social.facebook && <a href={`https://facebook.com/${ngo.contact.social.facebook}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                                {ngo.contact.social.linkedin && <a href={`https://linkedin.com/company/${ngo.contact.social.linkedin}`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                            </div>
                        </>
                    )}
                    {!ngo.contact?.email && !ngo.contact?.phone && !ngo.contact?.website && !ngo.contact?.address && (
                        <p className="text-sm text-muted-foreground italic">İletişim bilgisi henüz eklenmedi.</p>
                    )}
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
                    <div><p className="font-bold text-lg">{(ngo.stats?.totalDonation ?? 0).toLocaleString('tr-TR')} ₺</p><p className="text-sm text-muted-foreground">Toplam Bağış</p></div>
                    <div><p className="font-bold text-lg">{(ngo.stats?.donors ?? 0).toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">Bağışçı</p></div>
                    <div><p className="font-bold text-lg">{(ngo.stats?.volunteers ?? 0).toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">Gönüllü</p></div>
                 </CardContent>
             </Card>
             <Card>
                 <CardHeader><CardTitle className="text-lg">Gönüllülük İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                     <StatRow label="Toplam Gönüllülük Saati" value={`${(ngo.stats?.volunteerHours ?? 0).toLocaleString('tr-TR')} saat`} />
                     <StatRow label="Gönüllülük Mali Değeri" value={`${((ngo.stats?.volunteerHours ?? 0) * 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`} />
                     <StatRow label="Toplam Gönüllü Sayısı" value={(ngo.stats?.volunteers ?? 0).toLocaleString('tr-TR')} />
                     <StatRow label="Tamamlanan Proje Sayısı" value={ngo.stats?.projects ?? 0} />
                 </CardContent>
             </Card>
             <Card>
                 <CardHeader><CardTitle className="text-lg">Bağış İstatistikleri</CardTitle></CardHeader>
                 <CardContent className="divide-y">
                    <StatRow label="Toplam Bağış Tutarı" value={(ngo.stats?.totalDonation ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} />
                    <StatRow label="Toplam Bağışçı Sayısı" value={(ngo.stats?.donors ?? 0).toLocaleString('tr-TR')} />
                    <StatRow label="Toplam İşlem Adedi" value={(ngo.stats?.donationCount ?? 0).toLocaleString('tr-TR')} />
                    <StatRow label="Ortalama Bağış Tutarı" value={(ngo.stats?.avgDonation ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} />
                    <StatRow label="Tek Seferde En Yüksek Bağış" value={(ngo.stats?.highestSingleDonation ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} />
                    <StatRow label="Ulaşılan İnsan Sayısı" value={(ngo.stats?.peopleReached ?? 0).toLocaleString('tr-TR')} />
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
                        <p className="text-3xl font-bold text-primary">{transparencyScore} / 100</p>
                        <Progress value={transparencyScore} className="mt-2 h-2" />
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
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Görüntüle">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{item.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-4">
                                            {item.completed ? (
                                                <p>Bu kriterle ilgili belge veya bilgi burada görüntülenecektir.</p>
                                            ) : (
                                                <p>Bu kriter henüz karşılanmamıştır. Kuruluş tarafından ilgili belge veya bilgi yüklendiğinde burada görüntülenecektir.</p>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
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

      <Dialog open={isPosInfoOpen} onOpenChange={setIsPosInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>POS ile Ödeme</DialogTitle>
            <DialogDescription>
              Üye işyeri POS entegrasyonu bir sonraki onboarding turunda devreye alınacaktır.
              Şu an için aşağıdaki alternatifleri kullanabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Link
              href="/qr-payment"
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              onClick={() => setIsPosInfoOpen(false)}
            >
              <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">QR ile öde</p>
                <p className="text-xs text-muted-foreground">hangel QR ödemesiyle anında bağış yapın.</p>
              </div>
            </Link>
            <Link
              href={`/ngos/${id}`}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              onClick={() => setIsPosInfoOpen(false)}
            >
              <Heart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Bağış sayfasına git</p>
                <p className="text-xs text-muted-foreground">Bu kuruluşa kart veya cüzdan ile bağış yapın.</p>
              </div>
            </Link>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPosInfoOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
