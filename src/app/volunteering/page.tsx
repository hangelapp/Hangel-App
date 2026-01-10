import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ArrowDownUp, Search, MapPin, Calendar, Users, Award, Bot, ChevronDown } from 'lucide-react';
import { volunteeringOpportunities } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function VolunteeringPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-headline">Gönüllülük</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="İlan, yetkinlik veya STK ara..." className="pl-10" />
        </div>
         <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <Bot />
                Yapay Zeka Önerileri
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
                <p className='text-sm text-muted-foreground'>Yetenek ve ilgi alanlarınıza en uygun ilanları sizin için bulalım.</p>
                <Input placeholder="Örn: Grafik Tasarım, Hayvan Hakları..." />
                <Button className="w-full">Önerileri Getir</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" /> Filtrele
          </Button>
          <Button variant="outline" className="flex-1">
            <ArrowDownUp className="mr-2 h-4 w-4" /> Sırala
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {volunteeringOpportunities.map((opp) => (
          <Card key={opp.id}>
            <CardHeader>
              <CardTitle className="text-lg">{opp.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{opp.organization}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4" />{opp.location}</div>
                <div className="flex items-center text-muted-foreground"><Calendar className="mr-2 h-4 w-4" />{opp.commitment}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                {opp.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">150 Puan</span>
                 </div>
              <Button>Başvur</Button>
            </CardFooter>
          </Card>
        ))}
        <Button variant="outline" className="w-full">Daha Fazla Yükle</Button>
      </div>
    </div>
  );
}
