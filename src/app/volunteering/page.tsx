import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ArrowDownUp, Search, MapPin, Calendar, Award, Bot, CheckCircle, FileText, XCircle, Plane } from 'lucide-react';
import { volunteeringOpportunities, user } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';


const RequirementRow = ({ label, value, isMet }: { label: string, value: string, isMet: boolean }) => (
    <div className="flex items-center text-xs">
        {isMet ? <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" /> : <XCircle className="h-3.5 w-3.5 mr-2 text-red-600" />}
        <span className="font-medium mr-1">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
    </div>
);


export default function VolunteeringPage() {
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

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-4 sticky top-16 bg-background/80 backdrop-blur-xl z-10 py-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">Gönüllülük</h1>
            <p className="text-muted-foreground text-sm">Topluma katkıda bulun ve etki yarat.</p>
        </div>
        <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="İlan, yetkinlik veya STK ara..."
                    className="pl-10 h-11"
                />
            </div>
             <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                <Filter className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                <ArrowDownUp className="h-5 w-5" />
            </Button>
      </div>
         <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Bot />
                Yapay Zeka ile Öneri Al
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <p className='text-sm text-muted-foreground'>Yetenek ve ilgi alanlarınıza en uygun ilanları sizin için bulalım.</p>
                <Input placeholder="Örn: Grafik Tasarım, Hayvan Hakları..." />
                <Button className="w-full">Önerileri Getir</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="space-y-4">
        {volunteeringOpportunities.map((opp) => {
            const requiredSkillsMet = opp.skills.every(skill => userAbilities.includes(skill));
            const requiredDocsMet = opp.requirements.every(doc => userDocuments.includes(doc));
            const travelMet = opp.location.type === 'Saha' ? !user.volunteerInfo.travelInfo.domesticObstacle : true;

            return (
              <Card key={opp.id}>
                <CardHeader>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{opp.organization}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center text-muted-foreground gap-2"><MapPin className="h-4 w-4" />{`${opp.location.city}${opp.location.type !== 'Online' ? `, ${opp.location.district}` : ''} (${opp.location.type})`}</div>
                    <div className="flex items-center text-muted-foreground gap-2"><Calendar className="h-4 w-4" />{opp.commitment}</div>
                   <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="reqs" className="border-none">
                        <AccordionTrigger className="text-xs py-1 text-muted-foreground hover:no-underline">Gereksinimler</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                             <RequirementRow label="Konum" value={opp.location.type} isMet={travelMet}/>
                             <RequirementRow label="Yetkinlikler" value={opp.skills.join(', ') || 'Belirtilmemiş'} isMet={requiredSkillsMet} />
                             <RequirementRow label="Belgeler" value={opp.requirements.join(', ') || 'Belirtilmemiş'} isMet={requiredDocsMet} />
                             <RequirementRow label="Sertifika" value={opp.providesCertificate ? 'Veriliyor' : 'Verilmiyor'} isMet={true} />
                        </AccordionContent>
                    </AccordionItem>
                   </Accordion>

                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                     <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">{opp.points} Puan</span>
                     </div>
                  <Button>Başvur</Button>
                </CardFooter>
              </Card>
            )
        })}
        <Button variant="outline" className="w-full">Daha Fazla Yükle</Button>
      </div>
    </div>
  );
}
