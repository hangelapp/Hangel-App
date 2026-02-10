
'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { volunteeringOpportunities, user, ngos } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Award, CheckCircle, XCircle, Briefcase, FileText, Plane, Building, School, Languages, Laptop, Badge as BadgeIcon } from 'lucide-react';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';

const RequirementRow = ({ label, value, isMet }: { label: string; value: string | string[] | undefined; isMet: boolean }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null; // Don't render if there's no value
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

  useEffect(() => {
    setProfileUrl(window.location.href);
  }, []);
  
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

  const daysRemaining = differenceInDays(parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
  const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} Gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');

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
            
            <Tabs defaultValue="details" className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Detaylar</TabsTrigger>
                    <TabsTrigger value="requirements">Gereklilikler</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 mt-4">
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

                    <Accordion type="single" collapsible defaultValue="description">
                        <AccordionItem value="description">
                            <AccordionTrigger>Açıklama</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                                {opportunity.description}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="details">
                            <AccordionTrigger>İlan Detayları</AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-3">
                                <div className='flex items-center gap-3'><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.location.city}, {opportunity.location.district} ({opportunity.location.type})</span></div>
                                <div className='flex items-center gap-3'><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{opportunity.commitment} ({opportunity.taskType})</span></div>
                                <div className='flex items-center gap-3'><Award className="h-4 w-4 text-muted-foreground" /> <span>Sertifika: {opportunity.providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</span></div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="dates">
                            <AccordionTrigger>Tarihler</AccordionTrigger>
                            <AccordionContent className="text-sm space-y-3 pt-2">
                                <div className='flex justify-between'><span className='text-muted-foreground'>Son Başvuru:</span><span className='font-medium'>{format(parse(opportunity.dates.applicationEnd, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
                                <div className='flex justify-between'><span className='text-muted-foreground'>Başlangıç:</span><span className='font-medium'>{format(parse(opportunity.dates.eventStart, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
                                <div className='flex justify-between'><span className='text-muted-foreground'>Bitiş:</span><span className='font-medium'>{format(parse(opportunity.dates.eventEnd, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</span></div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="organization">
                             <AccordionTrigger>Kuruluş Hakkında</AccordionTrigger>
                             <AccordionContent className="pt-2">
                                {ngo && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-4">{ngo.about}</p>
                                        <Button asChild variant="secondary" className="w-full">
                                            <Link href={`/ngos/${ngo.id}`}>Kuruluş Profilini İncele</Link>
                                        </Button>
                                    </div>
                                )}
                             </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </TabsContent>
                <TabsContent value="requirements" className="space-y-4 mt-4">
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
                            <RequirementRow label="Yurtiçi Seyahat" value={opportunity.travel?.domestic ? "Gerekli" : "Gerekli Değil"} isMet={domesticTravelMet} />
                            <RequirementRow label="Yurtdışı Seyahat" value={opportunity.travel?.international ? "Gerekli" : "Gerekli Değil"} isMet={internationalTravelMet} />
                            <RequirementRow label="Gerekli Vizeler" value={opportunity.travel?.visas} isMet={visaMet} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg p-4 border-t mt-auto">
             <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={!allRequirementsMet || daysRemaining < 0}>
              {daysRemaining < 0 ? 'Başvuru Süresi Doldu' : allRequirementsMet ? `${countdownText}, Hemen Başvur` : `Gereklilikleri Sağlamıyorsun`}
            </Button>
        </div>
    </div>
  );
}
