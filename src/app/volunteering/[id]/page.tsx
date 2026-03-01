
'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { volunteeringOpportunities, ngos } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Award, CheckCircle, XCircle, Briefcase, FileText, Plane, Building, School, Languages, Laptop, Badge as BadgeIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import Image from 'next/image';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const RequirementRow = ({ label, value, isMet }: { label: string; value: string | string[] | undefined; isMet: boolean }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    const Icon = isMet ? CheckCircle : XCircle;
    const colorClass = isMet ? 'text-green-600' : 'text-red-600';

    return (
        <div className="flex items-start py-3 text-sm">
            <Icon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${colorClass}`} />
            <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground leading-snug">
                    {Array.isArray(value) ? value.join(', ') : value}
                </p>
            </div>
        </div>
    );
};

export default function VolunteeringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const opportunity = volunteeringOpportunities.find(e => e.id === id);
  const [profileUrl, setProfileUrl] = useState('');
  const { user: authUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setProfileUrl(window.location.href);
  }, []);
  
  if (!opportunity) {
    notFound();
  }

  const ngo = ngos.find(n => n.id === opportunity.ngoId);

  // Mock checking logic remains for visual feedback
  const requiredSkillsMet = true; 
  const requiredLanguagesMet = true;
  const requiredProgramsMet = true;
  const requiredDocsMet = true;
  const requiredEducationMet = true;
  const domesticTravelMet = true;
  const internationalTravelMet = true;
  const visaMet = true;

  const daysRemaining = differenceInDays(parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
  const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} Gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');

  const handleApply = () => {
    if (!authUser) {
        toast({ variant: 'destructive', title: "Giriş Yapmalısınız", description: "Başvuru yapmak için lütfen oturum açın." });
        return;
    }
    
    setIsApplying(true);
    const appRef = collection(db, 'applications');
    
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
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
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
                        <div className='flex items-center gap-3'><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.commitment} ({opportunity.taskType})</span></div>
                        <div className='flex items-center gap-3'><Award className="h-4 w-4 text-muted-foreground" /> <span>Sertifika: {opportunity.providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span></div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="text-lg">Tarihler</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <div className='flex justify-between'><span className='text-muted-foreground'>Son Başvuru:</span><span className='font-medium'>{format(parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
                        <div className='flex justify-between'><span className='text-muted-foreground'>Başlangıç:</span><span className='font-medium'>{format(parse(opportunity.dates.eventStart, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
                        <div className='flex justify-between'><span className='text-muted-foreground'>Bitiş:</span><span className='font-medium'>{format(parse(opportunity.dates.eventEnd, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
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
                
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Uygunluk Durumun</CardTitle>
                        <CardDescription>Bu ilana başvurmak için profilinin ne kadar uyumlu olduğunu gör.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <RequirementRow label="Gerekli Yetkinlikler" value={opportunity.skills} isMet={requiredSkillsMet} />
                        <RequirementRow label="İstenen Diller" value={opportunity.languages} isMet={requiredLanguagesMet} />
                        <RequirementRow label="Bilgisi İstenen Programlar" value={opportunity.programs} isMet={requiredProgramsMet} />
                        <RequirementRow label="Gerekli Belgeler/Lisanslar" value={opportunity.requirements} isMet={requiredDocsMet} />
                        <RequirementRow label="Eğitim Seviyesi" value={opportunity.education} isMet={requiredEducationMet} />
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
