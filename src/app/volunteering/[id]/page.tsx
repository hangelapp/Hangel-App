'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import Image from 'next/image';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Volunteering, NGO } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';
import { scoreMatch, type MatchingUserProfile } from '@/lib/volunteer-matching';

export default function VolunteeringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const db = useFirestore();

  const oppDocRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, COLLECTIONS.volunteering, id);
  }, [db, id]);

  const { data: opportunity, isLoading: isOppLoading } = useDoc<Volunteering>(oppDocRef);

  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !opportunity?.ngoId) return null;
    return doc(db, COLLECTIONS.ngos, opportunity.ngoId);
  }, [db, opportunity?.ngoId]);

  const { data: ngo } = useDoc<NGO>(ngoDocRef);

  const [profileUrl, setProfileUrl] = useState('');
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);
  const { data: userData } = useDoc<{
    volunteerInfo?: MatchingUserProfile['volunteerInfo'];
    personalInfo?: MatchingUserProfile['personalInfo'];
  }>(userDocRef);

  const matchingProfile = useMemo<MatchingUserProfile>(() => ({
    volunteerInfo: userData?.volunteerInfo ?? null,
    personalInfo: userData?.personalInfo ?? null,
  }), [userData]);

  const hasProfile = useMemo(() => {
    const vi = matchingProfile.volunteerInfo;
    const city = matchingProfile.personalInfo?.address?.city;
    const arrays = vi ? [vi.skills, vi.dailySkills, vi.interests, vi.languages, vi.availabilityDays, vi.availabilityTimes, vi.workModes, vi.motivations] : [];
    return arrays.some(a => Array.isArray(a) && a.length > 0) || Boolean(city && city.trim());
  }, [matchingProfile]);

  const matchPercentage = useMemo(() => {
    if (!opportunity || !hasProfile) return 0;
    const opp = opportunity as Volunteering & { dailySkills?: string[]; availabilityDays?: string[]; availabilityTimes?: string[] };
    const { score } = scoreMatch({
      id: opp.id,
      skills: opp.skills ?? null,
      dailySkills: opp.dailySkills ?? null,
      socialArea: opp.socialArea ?? null,
      interests: opp.interests ?? null,
      languages: opp.languages ?? null,
      location: { city: opp.location?.city ?? null, type: opp.location?.type ?? null },
      availabilityDays: opp.availabilityDays ?? null,
      availabilityTimes: opp.availabilityTimes ?? null,
    }, matchingProfile);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [opportunity, matchingProfile, hasProfile]);

  const matchTone = matchPercentage >= 75
    ? { text: 'text-green-700', bar: 'bg-green-500' }
    : matchPercentage >= 50
      ? { text: 'text-amber-700', bar: 'bg-amber-500' }
      : { text: 'text-muted-foreground', bar: 'bg-muted-foreground/40' };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setProfileUrl(window.location.href);
    }
  }, []);
  
  if (isOppLoading) {
    return (
        <div className="animate-in fade-in-0 pb-20">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-6 -mt-16">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
  }

  if (!opportunity) {
    notFound();
  }

  const safeFormat = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (isNaN(d.getTime())) return dateStr;
      return format(d, 'dd MMMM yyyy', { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const daysRemaining = (() => {
    if (!opportunity.dates?.applicationEnd) return -1;
    try {
      const d = parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date());
      if (isNaN(d.getTime())) return -1;
      return differenceInDays(d, new Date());
    } catch {
      return -1;
    }
  })();
  const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} Gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');
  const opp = opportunity as Volunteering & { providesCertificate?: boolean; amenities?: { providesCertificate?: boolean }; taskType?: string; commitment?: string };
  const providesCertificate = opp.providesCertificate ?? opp.amenities?.providesCertificate ?? false;
  const taskType = opp.taskType || opp.commitment || '—';

  const handleApply = () => {
    if (!authUser) {
        toast({ variant: 'destructive', title: "Giriş Yapmalısınız", description: "Başvuru yapmak için lütfen oturum açın." });
        const redirectUrl = `/login/selection?action=login&redirect=${encodeURIComponent(window.location.pathname)}`;
        router.push(redirectUrl);
        return;
    }
    
    setIsApplying(true);
    const appRef = collection(db, COLLECTIONS.applications);
    
    // Perform non-blocking write to Firestore
    addDocumentNonBlocking(appRef, {
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email?.split('@')[0] || 'Gönüllü',
        title: opportunity.title,
        type: 'Gönüllülük',
        org: opportunity.organization,
        entityId: opportunity.id,
        date: new Date().toISOString().split('T')[0],
        status: 'Beklemede',
        location: opportunity.location.city
    });

    // Simulated UX delay
    setTimeout(() => {
        setIsApplying(false);
        toast({
            title: "Başvurunuz Alındı",
            description: "Gönüllülük başvurunuz başarıyla iletildi. Durumu profilinizden takip edebilirsiniz.",
        });
        router.push('/my-applications');
    }, 1000);
  };

  return (
    <div className="animate-in fade-in-0 bg-background min-h-screen">
        <div className="relative h-48 w-full bg-muted">
            {ngo?.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
            <div className="absolute top-4 left-4 z-10">
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full" aria-label="Geri">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-4 right-4 z-10">
                <ShareButtons url={profileUrl} title={`${opportunity.title} - Hangel Gönüllülük Fırsatı`} />
            </div>
        </div>

        <div className="p-4 space-y-6 -mt-16 relative z-10">
            <div className='p-1 bg-background/80 backdrop-blur-xl rounded-2xl'>
                 <h1 className="text-2xl font-bold font-headline text-foreground p-3">{opportunity.title}</h1>
                 <Link href={`/ngos/${opportunity.ngoId}`} className="text-foreground/90 text-base font-medium hover:underline px-3 pb-3 block">{opportunity.organization}</Link>
            </div>

            {authUser && hasProfile && (
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                            <span className="font-bold text-muted-foreground">Profil Uygunluğun</span>
                            <span className={`font-black text-base ${matchTone.text}`}>%{matchPercentage}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full ${matchTone.bar} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${matchPercentage}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4 mt-4">
                <Card>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="font-bold text-lg text-primary">{opportunity.points}</p>
                            <p className="text-xs text-muted-foreground">Etki Puanı</p>
                        </div>
                            <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="font-bold text-lg">{opportunity.volunteerCount.needed}</p>
                            <p className="text-xs text-muted-foreground">Gönüllü</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Açıklama</CardTitle></CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {opportunity.description}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="text-lg">İlan Detayları</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <div className='flex items-center gap-3'><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.location.city}, {opportunity.location.district} ({opportunity.location.type})</span></div>
                        <div className='flex items-center gap-3'><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.commitment} ({taskType})</span></div>
                        <div className='flex items-center gap-3'><Award className="h-4 w-4 text-muted-foreground" /> <span>Sertifika: {providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span></div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="text-lg">Tarihler</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className='flex justify-between text-sm'><span className='text-muted-foreground font-medium'>Son Başvuru:</span><span className='font-bold text-primary'>{safeFormat(opportunity.dates?.applicationEnd)}</span></div>
                        <div className='flex justify-between text-sm'><span className='text-muted-foreground font-medium'>Başlangıç:</span><span className='font-bold'>{safeFormat(opportunity.dates?.eventStart)}</span></div>
                        <div className='flex justify-between text-sm'><span className='text-muted-foreground font-medium'>Bitiş:</span><span className='font-bold'>{safeFormat(opportunity.dates?.eventEnd)}</span></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg">Kuruluş Hakkında</CardTitle></CardHeader>
                    <CardContent>
                        {ngo && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-4">{ngo.about}</p>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/ngos/${ngo.id}`}>Kuruluş Profilini İncele</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg p-4 border-t mt-auto">
             <Button 
                size="lg" 
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" 
                disabled={isApplying || daysRemaining < 0}
                onClick={handleApply}
            >
              {isApplying ? <Loader2 className="animate-spin h-5 w-5" /> : daysRemaining < 0 ? 'Başvuru Süresi Doldu' : `${countdownText}, Hemen Başvur`}
            </Button>
        </div>
    </div>
  );
}