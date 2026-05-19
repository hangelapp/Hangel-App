
'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronRight, Mail, Phone, Globe, School, Tag, Info, Loader2, CheckCircle } from 'lucide-react';
import { schoolRepresentatives as schoolRepresentativesRaw } from '@/lib/data';
import type { SchoolRepresentative, StudentClub } from '@/lib/types';

const schoolRepresentatives = schoolRepresentativesRaw as SchoolRepresentative[];
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButtons } from '@/components/shared/share-buttons';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';


const RepresentativeCard = ({ name, role, avatarUrl }: { name: string, role: string, avatarUrl: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
        <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
    </div>
);


export default function ClubProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const db = useFirestore();
  const [profileUrl, setProfileUrl] = useState('');
  const [pendingJoin, setPendingJoin] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const clubDocRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, COLLECTIONS.clubs, id);
  }, [db, id]);

  const { data: club, isLoading: clubLoading, error: clubError } = useDoc<StudentClub>(clubDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);
  const { data: userData } = useDoc<{
    joinedClubs?: string[];
    volunteerInfo?: { education?: { school?: string }[] };
  }>(userDocRef);
  const isJoined = !!userData?.joinedClubs?.includes(id);

  const handleToggleJoin = async () => {
    if (!authUser) {
      router.push('/login/selection?action=login');
      return;
    }
    if (pendingJoin || !db || !club) return;
    setPendingJoin(true);
    try {
      if (isJoined) {
        await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), {
          joinedClubs: arrayRemove(club.id),
        });
        toast({ title: 'Kulüpten çıktın' });
      } else {
        const userSchools = (userData?.volunteerInfo?.education ?? []).map(e =>
          (e.school ?? '').trim().toLowerCase()
        );
        const clubSchool = (club.university ?? '').trim().toLowerCase();
        if (!clubSchool || !userSchools.includes(clubSchool)) {
          toast({
            title: 'Bu kulübe katılmak için profilinde ilgili okulu seçmelisin',
            variant: 'destructive',
          });
          router.push('/settings/volunteer');
          return;
        }
        await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), {
          joinedClubs: arrayUnion(club.id),
        });
        toast({ title: 'Kulübe katıldın' });
      }
    } catch {
      toast({ title: 'İşlem başarısız', variant: 'destructive' });
    } finally {
      setPendingJoin(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, []);

  if (clubLoading || !clubDocRef) {
    return (
        <div className="animate-in fade-in-0">
           <Skeleton className="h-48 w-full" />
          <div className="p-4 bg-background">
            <div className="flex gap-4 items-center -mt-16">
                <Skeleton className="h-20 w-20 rounded-lg border-4 border-background" />
                 <div className="space-y-1 pt-16">
                     <Skeleton className="h-7 w-48" />
                     <Skeleton className="h-5 w-32" />
                </div>
            </div>
             <div className="mt-4 space-y-2">
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
    );
  }

  if (clubError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Loader2 className="h-8 w-8 text-muted-foreground mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold mb-2">Kulüp bilgileri yüklenemedi</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    );
  }

  if (!club) {
    notFound();
  }

  const president = schoolRepresentatives[0];
  const boardMembers = schoolRepresentatives.slice(1, 5).map(rep => ({
      ...rep,
      role: ['Başkan Yardımcısı', 'Genel Sekreter', 'Sayman', 'Proje Koordinatörü'][schoolRepresentatives.indexOf(rep) - 1]
  }));

  return (
    <div className="animate-in fade-in-0">
       <div className="relative h-48 w-full bg-muted">
        <Image src={club.coverPhotoUrl} alt={`${club.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full" aria-label="Geri">
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4">
            <ShareButtons url={profileUrl} title={`Hangel'deki ${club.name} kulüp profilini incele!`} buttonClassName="border-white/50 text-white hover:bg-white/20"/>
        </div>
      </div>
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-center -mt-16">
            <Avatar className="h-20 w-20 shrink-0 bg-white border-4 border-background shadow-lg">
                <AvatarImage src={club.avatarUrl} alt={club.name} className="object-contain p-2"/>
                <AvatarFallback>{club.name.slice(0,2)}</AvatarFallback>
            </Avatar>
             <div className="space-y-1 pt-16">
                 <h1 className="text-2xl font-bold font-headline">{club.name}</h1>
                 <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <School className="h-3.5 w-3.5" />
                    <span>{club.university}</span>
                 </div>
            </div>
        </div>
         <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2">
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{(club.members ?? 0).toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground">Üye</p>
                </div>
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{(club.points ?? 0).toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground">Puan</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    variant={isJoined ? 'secondary' : 'default'}
                    onClick={handleToggleJoin}
                    disabled={pendingJoin}
                >
                    {pendingJoin ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isJoined ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                    ) : null}
                    {isJoined ? 'Üyesin' : 'Kulübe Katıl'}
                </Button>
            </div>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2">
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="management">Yönetim</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Kulüp Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    {club.category && (
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="font-bold">{club.category}</Badge>
                        </div>
                    )}
                    <p className="leading-relaxed">
                        {club.description} Kulübümüz, öğrenciler arasında {(club.category ?? 'genel').toLowerCase()} ruhunu teşvik etmek, yenilikçi fikirleri desteklemek ve geleceğin liderlerini yetiştirmek amacıyla kurulmuştur. Düzenlediğimiz atölyeler, zirveler ve yarışmalarla üyelerimize ilham veriyor ve onları iş dünyasına hazırlıyoruz.
                    </p>
                    {club.joinDate && (
                        <p className="text-xs pt-4 border-t italic">hangel&apos;a Katılım Tarihi: {club.joinDate}</p>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Vizyonumuz</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p className="leading-relaxed">{club.vision}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">İletişim</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {club.contact?.email && (
                        <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{club.contact.email}</span></div>
                    )}
                    {club.contact?.phone && (
                        <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{club.contact.phone}</span></div>
                    )}
                    {club.contact?.website && (
                        <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span>{club.contact.website}</span></div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp İstatistikleri</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.members ?? 0}</p><p className="text-sm text-muted-foreground">Toplam Üye</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.projects || 0}</p><p className="text-sm text-muted-foreground">Tamamlanan Projeler</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.volunteerHours || 0} Saat</p><p className="text-sm text-muted-foreground">Gönüllülük Saati</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">%{club.activeMemberRate || 0}</p><p className="text-sm text-muted-foreground">Aktif Üye Oranı</p></div>
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="posts" className="p-4">
            <div className="text-center text-muted-foreground py-16">
                <p>Bu kulüp henüz bir gönderi paylaşmadı.</p>
            </div>
        </TabsContent>
        <TabsContent value="management" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp Başkanı</CardTitle></CardHeader>
                <CardContent>
                    <RepresentativeCard name={president.name} role="Kulüp Başkanı" avatarUrl={president.avatarUrl} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Yönetim Kurulu</CardTitle></CardHeader>
                <CardContent className="divide-y">
                    {boardMembers.map(member => (
                        <RepresentativeCard key={member.id} name={member.name} role={member.role} avatarUrl={member.avatarUrl} />
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
