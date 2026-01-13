'use client';
import { notFound, useRouter } from 'next/navigation';
import { volunteeringOpportunities, user } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Award, CheckCircle, XCircle, Briefcase, FileText, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ShareButtons } from '@/components/shared/share-buttons';

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
       <div className="p-4 space-y-6">
        <div className='flex justify-between items-center'>
            <Button onClick={() => router.back()} variant="ghost" className=" -ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
            <ShareButtons url={profileUrl} title={`${opportunity.title} - Hangel Gönüllülük Fırsatı`} />
        </div>
        
        <div>
            <Link href={`/ngos/${opportunity.ngoId}`} className="text-primary font-medium hover:underline">{opportunity.organization}</Link>
            <h1 className="text-3xl font-bold font-headline mt-1">{opportunity.title}</h1>
        </div>

        <div className='grid grid-cols-3 gap-2 text-center'>
            <div className='p-3 bg-muted rounded-lg'>
                <MapPin className='h-5 w-5 mx-auto text-muted-foreground mb-1'/>
                <p className='text-xs font-semibold'>{opportunity.location.city}</p>
                <p className='text-xs text-muted-foreground'>{opportunity.location.type}</p>
            </div>
            <div className='p-3 bg-muted rounded-lg'>
                <Calendar className='h-5 w-5 mx-auto text-muted-foreground mb-1'/>
                <p className='text-xs font-semibold'>{opportunity.commitment}</p>
                 <p className='text-xs text-muted-foreground'>Süre</p>
            </div>
             <div className='p-3 bg-muted rounded-lg'>
                <Award className='h-5 w-5 mx-auto text-muted-foreground mb-1'/>
                <p className='text-xs font-semibold'>{opportunity.points} Puan</p>
                <p className='text-xs text-muted-foreground'>Değer</p>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Açıklama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{opportunity.description}</p>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Uygunluk Durumun</CardTitle>
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
        
         <Card>
            <CardHeader>
                <CardTitle className="text-xl">İlan Detayları</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                <p><strong className="text-foreground">Tarihler:</strong> {opportunity.dates.applicationStart} - {opportunity.dates.eventEnd}</p>
                <p><strong className="text-foreground">Saatler:</strong> {opportunity.hours.start} - {opportunity.hours.end}</p>
                <p><strong className="text-foreground">Katılım Türü:</strong> {opportunity.taskType}</p>
                <p><strong className="text-foreground">Sertifika:</strong> {opportunity.providesCertificate ? 'Veriliyor' : 'Verilmiyor'}</p>
            </CardContent>
        </Card>


        <Button size="lg" className="w-full" disabled={!requiredSkillsMet || !requiredDocsMet || !travelMet}>
          Hemen Başvur
        </Button>
      </div>
    </div>
  );
}
