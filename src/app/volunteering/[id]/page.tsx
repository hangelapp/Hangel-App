'use client';
import { notFound, useRouter } from 'next/navigation';
import { volunteeringOpportunities, user, ngos } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Award, CheckCircle, XCircle, Briefcase, FileText, Plane, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RequirementRow = ({ label, value, isMet }: { label: string, value: string | string[], isMet: boolean }) => (
    <div className="flex items-start py-3">
        <div className="w-5 mr-4 mt-1 flex-shrink-0">
            {isMet ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
        </div>
        <div className="flex-1">
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground text-sm">
                {Array.isArray(value) ? value.join(', ') : value}
            </p>
        </div>
    </div>
);

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
      ...user.volunteerInfo.languages,
      ...user.volunteerInfo.programs
    ];
  const userDocuments = [
        ...user.volunteerInfo.documents,
        ...user.volunteerInfo.licenses
  ];

  const requiredSkillsMet = opportunity.skills.every(skill => userAbilities.includes(skill));
  const requiredDocsMet = opportunity.requirements.every(doc => userDocuments.includes(doc));
  const travelMet = opportunity.location.type === 'Saha' ? !user.volunteerInfo.travelInfo.domesticObstacle : true;
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

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

        <div className="p-4 bg-background">
            <div className="flex gap-4 items-end -mt-16">
                <Avatar className="h-24 w-24 border-4 border-background shrink-0">
                    {ngo?.avatarUrl && <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />}
                    <AvatarFallback>{opportunity.organization.slice(0,2)}</AvatarFallback>
                </Avatar>
            </div>
            <div className='mt-4'>
                 <h1 className="text-2xl font-bold font-headline">{opportunity.title}</h1>
                 <Link href={`/ngos/${opportunity.ngoId}`} className="text-muted-foreground text-base font-medium hover:underline">{opportunity.organization}</Link>
            </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 px-2">
                <TabsTrigger value="details">Detaylar</TabsTrigger>
                <TabsTrigger value="eligibility">Uygunluk</TabsTrigger>
                <TabsTrigger value="organization">Kuruluş</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-4 space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Açıklama</CardTitle></CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>{opportunity.description}</p>
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
            </TabsContent>
            <TabsContent value="eligibility" className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Uygunluk Durumun</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <RequirementRow 
                            label="Gerekli Yetkinlikler" 
                            value={opportunity.skills.length > 0 ? opportunity.skills : 'Belirtilmemiş'} 
                            isMet={requiredSkillsMet} 
                        />
                        <RequirementRow 
                            label="Gerekli Belgeler" 
                            value={opportunity.requirements.length > 0 ? opportunity.requirements : 'Belirtilmemiş'} 
                            isMet={requiredDocsMet} 
                        />
                        <RequirementRow 
                            label="Seyahat Durumu" 
                            value={opportunity.location.type === "Saha" ? "Saha görevi (Yurtiçi seyahat engeli olmamalı)" : "Online görev (Seyahat engeli önemsiz)"} 
                            isMet={travelMet} 
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="organization" className="p-4">
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
                                <p className="text-sm text-muted-foreground line-clamp-3">{ngo.about}</p>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/ngos/${ngo.id}`}>Kuruluş Profilini İncele</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <div className="p-4">
            <Button size="lg" className="w-full" disabled={!requiredSkillsMet || !requiredDocsMet || !travelMet}>
              Hemen Başvur
            </Button>
        </div>
    </div>
  );
}
