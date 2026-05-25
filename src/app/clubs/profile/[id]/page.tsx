
'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Globe, School, Tag, Info, Loader2, CheckCircle, UserCircle2, Sparkles, ShieldCheck, Flame, Award, Instagram, Linkedin, Twitter, Calendar, GraduationCap } from 'lucide-react';
import type { StudentClub } from '@/lib/types';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButtons } from '@/components/shared/share-buttons';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

interface ClubInvitation {
  id: string;
  clubId?: string;
  inviteeUserId?: string;
  inviteeName?: string;
  inviteeAvatarUrl?: string;
  role?: string;
  status?: string;
}


const RepresentativeCard = ({ name, role, avatarUrl }: { name: string, role: string, avatarUrl?: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
        <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{(name || 'Ü').charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
        </div>
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

  // Bu kulübün üyelerini ve etki puanı toplamını hesapla — joinedClubs.includes(id)
  // ya da managedClubId === id eşleşmesiyle (yöneticiler dahil).
  const membersQuery = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.users) : null),
    [db],
  );
  const { data: allUsersForStats } = useCollection<{
    id: string;
    joinedClubs?: string[];
    managedClubId?: string;
    impactScore?: number;
    stats?: { impactScore?: number };
  }>(membersQuery);
  const memberStats = useMemo(() => {
    if (!allUsersForStats || !id) return { members: 0, points: 0 };
    let members = 0;
    let points = 0;
    for (const u of allUsersForStats) {
      const joined = u.joinedClubs?.includes(id) || u.managedClubId === id;
      if (!joined) continue;
      members += 1;
      points += Math.max(
        Number(u.impactScore) || 0,
        Number(u.stats?.impactScore) || 0,
      );
    }
    return { members, points };
  }, [allUsersForStats, id]);

  // Kulüp yöneticilerini userInvitations'tan çek (BUG-12 ile aynı pattern)
  const adminsQuery = useMemoFirebase(
    () => (db && id ? query(collection(db, COLLECTIONS.userInvitations), where('clubId', '==', id)) : null),
    [db, id],
  );
  const { data: adminInvitations } = useCollection<ClubInvitation>(adminsQuery);
  const activeAdmins = useMemo(() => {
    return (adminInvitations || [])
      .filter(inv => inv.status !== 'revoked' && inv.status !== 'pending')
      .map(inv => ({
        id: inv.id,
        name: inv.inviteeName || 'Üye',
        role: inv.role || 'Yetkili',
        avatarUrl: inv.inviteeAvatarUrl,
      }));
  }, [adminInvitations]);
  // 'Kulüp Başkanı' yeni rol (Faz 3), eski kayıtlar 'Genel Yönetici' ile kaldı.
  const president = activeAdmins.find(a => a.role === 'Kulüp Başkanı' || a.role === 'Genel Yönetici');
  const otherBoardMembers = activeAdmins.filter(a => a.role !== 'Kulüp Başkanı' && a.role !== 'Genel Yönetici');

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
        const userSchools = (userData?.volunteerInfo?.education ?? [])
          .map(e => (e.school ?? '').trim())
          .filter(s => s.length > 0);
        const loweredSchools = userSchools.map(s => s.toLowerCase());
        const clubSchool = (club.university ?? '').trim().toLowerCase();
        if (!clubSchool || !loweredSchools.includes(clubSchool)) {
          toast({
            title:
              userSchools.length === 0
                ? 'Bu kulübe katılmak için önce profilinde okulunu belirtmelisin'
                : `Bu kulübe yalnızca ${club.university} öğrencileri katılabilir. Profilindeki okulunu güncelle.`,
            description: 'Okul bilgini düzenleme sayfasına yönlendiriliyorsun.',
            variant: 'destructive',
          });
          router.push('/settings/profile');
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

  return (
    <div className="animate-in fade-in-0">
       <div className="relative h-48 w-full bg-muted">
        {club.coverPhotoUrl ? (
          <Image src={club.coverPhotoUrl} alt={`${club.name} Cover`} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60" aria-hidden="true" />
        )}
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
             <div className="space-y-1 pt-16 min-w-0">
                 <h1 className="text-2xl font-bold font-headline truncate">{club.name}</h1>
                 <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <School className="h-3.5 w-3.5" />
                    <span className="truncate">{club.university}</span>
                 </div>
                 {/* Kulüp rozetleri — Doğrulanmış / Aktif / Kampüs Elçisi */}
                 <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {club.verified && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-300 text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Doğrulanmış Kulüp
                        </Badge>
                    )}
                    {club.activeClub && (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-300 text-[10px] font-bold uppercase tracking-wider">
                            <Flame className="h-3 w-3 mr-1" /> Aktif Kulüp
                        </Badge>
                    )}
                    {club.campusAmbassador && (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-300 text-[10px] font-bold uppercase tracking-wider">
                            <Award className="h-3 w-3 mr-1" /> Kampüs Elçisi
                        </Badge>
                    )}
                 </div>
            </div>
        </div>
         <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2">
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{memberStats.members.toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground">Üye</p>
                </div>
                <div className="p-3 text-center">
                    <p className="font-bold text-lg">{memberStats.points.toLocaleString('tr-TR')}</p>
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
                    {club.shortDescription && (
                        <p className="font-medium text-foreground/90 leading-relaxed border-l-4 border-primary pl-3 italic">
                            {club.shortDescription}
                        </p>
                    )}
                    {club.eventFrequency && (
                        <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Etkinlik sıklığı:</span>
                            <span className="font-bold text-foreground">{club.eventFrequency}</span>
                        </div>
                    )}
                    {club.description && (
                        <p className="leading-relaxed">{club.description}</p>
                    )}
                    {club.joinDate && (
                        <p className="text-xs pt-4 border-t italic">hangel&apos;a Katılım Tarihi: {club.joinDate}</p>
                    )}
                </CardContent>
            </Card>

            {/* Çalışma Alanları — kategorilerden oluşur (STK Etki Alanları muadili) */}
            {(club.categories && club.categories.length > 0) || club.category ? (
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5 text-primary"/> Çalışma Alanları</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {(club.categories && club.categories.length > 0 ? club.categories : [club.category!]).map(cat => (
                                <Badge key={cat} variant="secondary" className="font-medium text-xs">{cat}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {club.vision && (
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Vizyonumuz</CardTitle></CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p className="leading-relaxed">{club.vision}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/> İletişim</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {club.contact?.email && (
                        <a href={`mailto:${club.contact.email}`} className="flex items-center gap-3 text-sm hover:text-primary"><Mail className="h-4 w-4 text-muted-foreground" /><span>{club.contact.email}</span></a>
                    )}
                    {club.contact?.phone && (
                        <a href={`tel:${club.contact.phone}`} className="flex items-center gap-3 text-sm hover:text-primary"><Phone className="h-4 w-4 text-muted-foreground" /><span>{club.contact.phone}</span></a>
                    )}
                    {club.contact?.website && (
                        <a href={club.contact.website.startsWith('http') ? club.contact.website : `https://${club.contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary"><Globe className="h-4 w-4 text-muted-foreground" /><span className="truncate">{club.contact.website}</span></a>
                    )}
                </CardContent>
            </Card>

            {/* Sosyal Medya */}
            {(club.contact?.instagram || club.contact?.linkedin || club.contact?.twitter) && (
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/> Sosyal Medya</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {club.contact.instagram && (
                            <a href={club.contact.instagram.startsWith('http') ? club.contact.instagram : `https://instagram.com/${club.contact.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-card hover:bg-accent transition-colors">
                                <Instagram className="h-4 w-4" /> <span className="text-sm">{club.contact.instagram}</span>
                            </a>
                        )}
                        {club.contact.linkedin && (
                            <a href={club.contact.linkedin.startsWith('http') ? club.contact.linkedin : `https://linkedin.com/company/${club.contact.linkedin.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-card hover:bg-accent transition-colors">
                                <Linkedin className="h-4 w-4" /> <span className="text-sm">{club.contact.linkedin}</span>
                            </a>
                        )}
                        {club.contact.twitter && (
                            <a href={club.contact.twitter.startsWith('http') ? club.contact.twitter : `https://x.com/${club.contact.twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-card hover:bg-accent transition-colors">
                                <Twitter className="h-4 w-4" /> <span className="text-sm">{club.contact.twitter}</span>
                            </a>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Akademik Danışman — sadece ad, iletişim KVKK private */}
            {club.advisorName && (
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Akademik Danışman</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm font-bold">{club.advisorName}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">İletişim bilgileri KVKK gereği gizlidir.</p>
                    </CardContent>
                </Card>
            )}
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp İstatistikleri</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{memberStats.members.toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">Toplam Üye</p></div>
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
             {president && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg">Kulüp Başkanı</CardTitle></CardHeader>
                    <CardContent>
                        <RepresentativeCard name={president.name} role="Kulüp Başkanı" avatarUrl={president.avatarUrl} />
                    </CardContent>
                </Card>
             )}
             {otherBoardMembers.length > 0 && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg">Yönetim Kurulu</CardTitle></CardHeader>
                    <CardContent className="divide-y">
                        {otherBoardMembers.map(member => (
                            <RepresentativeCard key={member.id} name={member.name} role={member.role} avatarUrl={member.avatarUrl} />
                        ))}
                    </CardContent>
                </Card>
             )}
             {!president && otherBoardMembers.length === 0 && (
                 <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        <UserCircle2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" aria-hidden="true" />
                        Bu kulüp için henüz yönetim bilgisi eklenmemiş.
                    </CardContent>
                </Card>
             )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
