'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ArrowDownUp, Search, MapPin, Calendar, Award, Bot, CheckCircle, FileText, XCircle, Plane } from 'lucide-react';
import { volunteeringOpportunities, user } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { parse } from 'date-fns';


const RequirementRow = ({ label, value, isMet }: { label: string, value: string, isMet: boolean }) => (
    <div className="flex items-center text-xs">
        {isMet ? <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" /> : <XCircle className="h-3.5 w-3.5 mr-2 text-red-600" />}
        <span className="font-medium mr-1">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
    </div>
);


export default function VolunteeringPage() {
    const { toast } = useToast();
    const [sortKey, setSortKey] = useState('points');
    const [filters, setFilters] = useState({ location: 'all', commitment: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    const [aiSearchTerm, setAiSearchTerm] = useState('');

    const userAbilities = [
      ...user.volunteerInfo.skills,
      ...user.volunteerInfo.dailySkills,
      ...user.volunteerInfo.languages,
      ...user.volunteerInfo.programs
    ];
    
    const sortedAndFilteredOpportunities = useMemo(() => {
        let opportunities = [...volunteeringOpportunities];

        // Filtering
        if (filters.location !== 'all') {
            opportunities = opportunities.filter(opp => opp.location.type === filters.location);
        }
        if (filters.commitment !== 'all') {
            opportunities = opportunities.filter(opp => opp.taskType === filters.commitment);
        }

        if (searchTerm.trim()) {
            const lowercased = searchTerm.toLowerCase();
            opportunities = opportunities.filter(opp => 
                opp.title.toLowerCase().includes(lowercased) ||
                opp.organization.toLowerCase().includes(lowercased) ||
                (opp.skills && opp.skills.some(skill => skill.toLowerCase().includes(lowercased)))
            );
        }

        // Sorting
        opportunities.sort((a, b) => {
            if (sortKey === 'points') {
                return b.points - a.points;
            }
            if (sortKey === 'date') {
                return parse(a.dates.applicationEnd, 'yyyy-MM-dd', new Date()).getTime() - parse(b.dates.applicationEnd, 'yyyy-MM-dd', new Date()).getTime();
            }
            return 0;
        });

        return opportunities;
    }, [sortKey, filters, searchTerm]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-4 sticky top-12 bg-background/80 backdrop-blur-xl z-10 py-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">Gönüllülük</h1>
            <p className="text-muted-foreground text-sm">Topluma katkıda bulun ve etki yarat.</p>
        </div>
        <div className="flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="İlan, yetkinlik veya STK ara..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                        <Filter className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Konum</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.location === 'all'} onCheckedChange={() => setFilters(f => ({...f, location: 'all'}))}>Tümü</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.location === 'Online'} onCheckedChange={() => setFilters(f => ({...f, location: 'Online'}))}>Online</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.location === 'Saha'} onCheckedChange={() => setFilters(f => ({...f, location: 'Saha'}))}>Saha</DropdownMenuCheckboxItem>
                    <DropdownMenuLabel>Çalışma Şekli</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.commitment === 'all'} onCheckedChange={() => setFilters(f => ({...f, commitment: 'all'}))}>Tümü</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.commitment === 'Tek Gün'} onCheckedChange={() => setFilters(f => ({...f, commitment: 'Tek Gün'}))}>Tek Günlük</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.commitment === 'Dönemsel'} onCheckedChange={() => setFilters(f => ({...f, commitment: 'Dönemsel'}))}>Dönemsel</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.commitment === 'Sürekli'} onCheckedChange={() => setFilters(f => ({...f, commitment: 'Sürekli'}))}>Sürekli</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
             </DropdownMenu>
            <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent>
                     <DropdownMenuItem onClick={() => setSortKey('points')}>Puan (Yüksekten Düşüğe)</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setSortKey('date')}>Son Başvuru Tarihi (En Yakın)</DropdownMenuItem>
                 </DropdownMenuContent>
            </DropdownMenu>
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
                <Input 
                    placeholder="Örn: Grafik Tasarım, Hayvan Hakları..." 
                    value={aiSearchTerm}
                    onChange={(e) => setAiSearchTerm(e.target.value)}
                />
                <Button 
                    className="w-full"
                    onClick={() => toast({ title: 'Yapay Zeka Önerisi', description: 'Bu özellik yakında daha detaylı sonuçlar sunacaktır.' })}
                >
                    Önerileri Getir
                </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="space-y-4">
        {sortedAndFilteredOpportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{opp.organization}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center text-muted-foreground gap-2"><MapPin className="h-4 w-4" />{`${opp.location.city}${opp.location.type !== 'Online' ? `, ${opp.location.district}` : ''} (${opp.location.type})`}</div>
                    <div className="flex items-center text-muted-foreground gap-2"><Calendar className="h-4 w-4" />{opp.commitment}</div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {(opp.skills ?? []).map(skill => (
                            <Badge
                                key={skill}
                                variant="outline"
                                className={cn(
                                    userAbilities.includes(skill) && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300"
                                )}
                            >
                                {userAbilities.includes(skill) && <CheckCircle className="h-3 w-3 mr-1" />}
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                     <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">{opp.points} Puan</span>
                     </div>
                  <Button asChild variant="secondary">
                    <Link href={`/volunteering/${opp.id}`}>Detayları Gör</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
        )}
        <Button variant="outline" className="w-full">Daha Fazla Yükle</Button>
      </div>
    </div>
  );
}
