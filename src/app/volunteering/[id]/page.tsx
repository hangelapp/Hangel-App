'use client';
import { notFound, useRouter } from 'next/navigation';
import { volunteeringOpportunities, user, ngos } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Award, CheckCircle, XCircle, Briefcase, FileText, Plane, Building, School, Languages, Laptop, Badge as BadgeIcon } from 'lucide-react';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { differenceInDays, format, parseISO } from 'date-fns';

const RequirementRow = ({ label, value, isMet }: { label: string, value: string | string[] | undefined, isMet: boolean }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null; // Don't render if there's no value
    }
    return (
        <div className="flex items-start py-3">
            <div className="w-5 mr-4 mt-1 flex-shrink-0">
                {isMet ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            </div>
            <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-muted-foreground text-sm">
                    {Array.isArray(value) ? value.join(', ') : value}
                </p>
            </div>
        </div>
    );
};


export default function VolunteeringDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const opportunity = volunteeringOpportunities.find(e => e.id === params.id);
  
  if (!opportunity) {
    notFound();
  }

  const ngo = ngos.find(n => n.id === opportunity.ngoId);

  const userAbilities = [
      ...user.volunteerInfo.skills,
      ...user.volunteerInfo.dailySkills,
  ];
  const userLanguages = user.volunteerInfo.languages;
  const userPrograms = user.volunteerInfo.programs;
  const userDocuments = [...user.volunteerInfo.documents, ...user.volunteerInfo.licenses];
  const userEducation = user.volunteerInfo.education.map(e => e.school);

  const checkRequirement = (required: string[] | undefined, userHas: string[]) => {
    if (!required || required.length === 0) return true;
    return required.every(req => userHas.includes(req));
  };
  
  const requiredSkillsMet = checkRequirement(opportunity.skills, userAbilities);
  const requiredLanguagesMet = checkRequirement(opportunity.languages, userLanguages);
  const requiredProgramsMet = checkRequirement(opportunity.programs, userPrograms);
  const requiredDocsMet = checkRequirement(opportunity.requirements, userDocuments);
  const requiredEducationMet = opportunity.education ? userEducation.some(edu => edu.includes(opportunity.education!)) : true;
  const domesticTravelMet = opportunity.travel?.domestic === false || !user.volunteerInfo.travelInfo.domesticObstacle;
  const internationalTravelMet = opportunity.travel?.international === false || !user.volunteerInfo.travelInfo.internationalObstacle;
  const visaMet = checkRequirement(opportunity.travel?.visas, user.volunteerInfo.travelInfo.visas);


  const allRequirementsMet = [
    requiredSkillsMet, 
    requiredLanguagesMet, 
    requiredProgramsMet, 
    requiredDocsMet, 
    requiredEducationMet,
    domesticTravelMet,
    internationalTravelMet,
    visaMet
  ].every(Boolean);

  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

  const daysRemaining = differenceInDays(parseISO(opportunity.dates.applicationEnd), new Date());
  const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} Gün - ` : (daysRemaining === 0 ? 'Son Gün - ' : '');

  return (
    <div className="animate-in fade-in-0">
        <div className="relative h-40 w-full bg-muted">
            {ngo?.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute top-4 right-4 flex gap-2">
                <ShareButtons url={profileUrl} title={`${opportunity.title} - Hangel Gönüllülük Fırsatı`} />
            </div>
        </div>

        <div className="p-4 bg-background space-y-4 -mt-12 relative z-10">
            <div>
                 <h1 className="text-2xl font-bold font-headline text-foreground">{opportunity.title}</h1>
                 <Link href={`/ngos/${opportunity.ngoId}`} className="text-foreground/90 text-base font-medium hover:underline">{opportunity.organization}</Link>
            </div>
            
            <Tabs defaultValue="details" className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Detay Bilgiler</TabsTrigger>
                    <TabsTrigger value="organization">Kuruluş Hakkında</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 mt-4">
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Açıklama</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p>{opportunity.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">İlan Tarihleri</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Son Başvuru:</span>
                                <span className='font-medium'>{format(parseISO(opportunity.dates.applicationEnd), 'dd MMMM yyyy')}</span>
                            </div>
                             <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Gönüllülük Başlangıcı:</span>
                                <span className='font-medium'>{format(parseISO(opportunity.dates.eventStart), 'dd MMMM yyyy')}</span>
                            </div>
                             <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Gönüllülük Bitişi:</span>
                                <span className='font-medium'>{format(parseISO(opportunity.dates.eventEnd), 'dd MMMM yyyy')}</span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="text-lg">İlan Detayları</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <div className='flex items-center gap-3'><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.location.city}, {opportunity.location.district} ({opportunity.location.type})</span></div>
                            <div className='flex items-center gap-3'><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.commitment} ({opportunity.taskType})</span></div>
                            <div className='flex items-center gap-3'><Award className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.points} Sosyal Etki Puanı</span></div>
                            <div className='flex items-center gap-3'><Users className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.volunteerCount.needed} Gönüllü Aranıyor</span></div>
                            <div className='flex items-center gap-3'><CheckCircle className="h-4 w-4 text-muted-foreground" /> <span>Sertifika: {opportunity.providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Uygunluk Durumun</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <RequirementRow label="Gerekli Yetkinlikler" value={opportunity.skills} isMet={requiredSkillsMet} />
                            <RequirementRow label="İstenen Diller" value={opportunity.languages} isMet={requiredLanguagesMet} />
                             <RequirementRow label="Bilgisi İstenen Programlar" value={opportunity.programs} isMet={requiredProgramsMet} />
                            <RequirementRow label="Gerekli Belgeler/Lisanslar" value={opportunity.requirements} isMet={requiredDocsMet} />
                            <RequirementRow label="Eğitim Seviyesi" value={opportunity.education} isMet={requiredEducationMet} />
                            <RequirementRow label="Yurtiçi Seyahat" value={opportunity.travel?.domestic ? "Gerekli" : "Gerekli Değil"} isMet={domesticTravelMet} />
                            <RequirementRow label="Yurtdışı Seyahat" value={opportunity.travel?.international ? "Gerekli" : "Gerekli Değil"} isMet={internationalTravelMet} />
                            <RequirementRow label="Gerekli Vizeler" value={opportunity.travel?.visas} isMet={visaMet} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="organization" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                                Kuruluş Hakkında
                            </CardTitle>
                        </CardHeader>
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
                </TabsContent>
            </Tabs>

            <div className="pt-4">
                <Button size="lg" className="w-full" disabled={!allRequirementsMet || daysRemaining < 0}>
                  {daysRemaining < 0 ? 'Başvuru Süresi Doldu' : `${countdownText}Hemen Başvur`}
                </Button>
            </div>
        </div>
    </div>
  );
}
