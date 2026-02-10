
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ArrowDownUp, Search, MapPin, Calendar, Award, Bot, CheckCircle, FileText, XCircle, Plane, ChevronRight } from 'lucide-react';
import { volunteeringOpportunities, user } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { parse } from 'date-fns';
import { Progress } from '@/components/ui/progress';


const OpportunityCard = ({ opp }: { opp: typeof volunteeringOpportunities[0] }) => {
    
    const userAbilities = [
        ...user.volunteerInfo.skills,
        ...user.volunteerInfo.dailySkills,
        ...user.volunteerInfo.languages,
        ...user.volunteerInfo.programs,
        ...user.volunteerInfo.licenses,
        ...user.volunteerInfo.documents,
    ];
    
    const requiredAbilities = [
        ...(opp.skills || []),
        ...(opp.languages || []),
        ...(opp.programs || []),
        ...(opp.requirements || []),
    ];

    const matchedAbilitiesCount = requiredAbilities.filter(req => userAbilities.includes(req)).length;
    const matchPercentage = requiredAbilities.length > 0 ? (matchedAbilitiesCount / requiredAbilities.length) * 100 : 100;

    return (
        <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <Link href={`/volunteering/${opp.id}`} className="block">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                            <p className="text-xs font-medium text-muted-foreground">{opp.organization}</p>
                            <h3 className="font-semibold text-base leading-tight mt-1 group-hover:text-primary transition-colors">{opp.title}</h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary">{opp.points} Puan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {opp.location.city} ({opp.location.type})</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {opp.commitment}</span>
                    </div>
                     {requiredAbilities.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium">Profil Uygunluğu</span>
                                <span className="font-bold">{Math.round(matchPercentage)}%</span>
                            </div>
                            <Progress value={matchPercentage} className="h-1.5" />
                        </div>
                    )}
                </CardContent>
            </Link>
        </Card>
    );
};


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
            let comparison = 0;
            if (sortKey === 'points') {
                comparison = b.points - a.points;
            } else if (sortKey === 'date') {
                const refDate = new Date(0); // Use a static date for hydration safety
                const timeA = parse(a.dates.applicationEnd, 'yyyy-MM-dd', refDate).getTime();
                const timeB = parse(b.dates.applicationEnd, 'yyyy-MM-dd', refDate).getTime();
                comparison = timeA - timeB;
            } else if (sortKey === 'match') {
                 const requiredA = [...(a.skills || []), ...(a.languages || []), ...(a.programs || []), ...(a.requirements || [])];
                 const matchedA = requiredA.filter(req => userAbilities.includes(req)).length;
                 const matchPercentageA = requiredA.length > 0 ? (matchedA / requiredA.length) : 1;

                 const requiredB = [...(b.skills || []), ...(b.languages || []), ...(b.programs || []), ...(b.requirements || [])];
                 const matchedB = requiredB.filter(req => userAbilities.includes(req)).length;
                 const matchPercentageB = requiredB.length > 0 ? (matchedB / requiredB.length) : 1;

                 comparison = matchPercentageB - matchPercentageA;
            }

            // If primary sort is equal, use a secondary sort for stability
            if (comparison === 0) {
                return a.id.localeCompare(b.id);
            }
            
            return comparison;
        });

        return opportunities;
    }, [sortKey, filters, searchTerm, userAbilities]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-4 sticky top-12 bg-background/80 backdrop-blur-xl z-10 py-4 -mx-4 px-4 border-b">
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
                     <DropdownMenuItem onClick={() => setSortKey('match')}>Bana En Uygun</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setSortKey('points')}>Puan (Yüksekten Düşüğe)</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setSortKey('date')}>Son Başvuru Tarihi (En Yakın)</DropdownMenuItem>
                 </DropdownMenuContent>
            </DropdownMenu>
      </div>
         <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="hover:no-underline">
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

      <div className="space-y-3">
        {sortedAndFilteredOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
        ))}
        {sortedAndFilteredOpportunities.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
                <p>Aradığınız kriterlere uygun ilan bulunamadı.</p>
            </div>
        ) : (
            <Button variant="outline" className="w-full">Daha Fazla Yükle</Button>
        )}
      </div>
    </div>
  );
}
