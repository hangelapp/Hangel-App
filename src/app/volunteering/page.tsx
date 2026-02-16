
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ArrowDownUp, Search, MapPin, Calendar, Award, Bot, CheckCircle, FileText, XCircle, Plane, ChevronRight, Building, Hourglass } from 'lucide-react';
import { volunteeringOpportunities, user, ngos } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { parse, format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];


const MultiSelect = ({ title, options, selected, onSelectedChange }: { title: string, options: string[], selected: string[], onSelectedChange: (selected: string[]) => void }) => {
    return (
        <div className="w-full">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left font-normal h-11">
                        <span className="truncate pr-2">{selected.length > 0 ? selected.join(', ') : title}</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                     <DropdownMenuLabel>{title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {options.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option}
                            checked={selected.includes(option)}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    onSelectedChange([...selected, option]);
                                } else {
                                    onSelectedChange(selected.filter((item) => item !== option));
                                }
                            }}
                        >
                            {option}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};


const OpportunityCard = ({ opp }: { opp: typeof volunteeringOpportunities[0] }) => {
    const ngo = ngos.find(n => n.id === opp.ngoId);
    
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
    
    const daysRemaining = differenceInDays(parse(opp.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
    const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');


    return (
        <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/20 h-full">
            <Link href={`/volunteering/${opp.id}`} className="block group h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 pr-4">
                                {ngo && (
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground">{opp.organization}</p>
                                    <h3 className="font-semibold text-base leading-tight mt-1 group-hover:text-primary transition-colors">{opp.title}</h3>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-1">
                                <p className="font-bold text-primary text-sm">{opp.points} Puan</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 flex-wrap gap-2">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {opp.location.city} ({opp.location.type})</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {opp.commitment}</span>
                            </div>
                             <Badge variant={daysRemaining < 0 ? 'destructive' : 'outline'} className="text-[10px] font-bold">
                                {countdownText}
                            </Badge>
                        </div>
                        
                         {requiredAbilities.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-muted-foreground">Profil Uygunluğu</span>
                                    <span className="font-bold">{Math.round(matchPercentage)}%</span>
                                </div>
                                <Progress value={matchPercentage} className="h-1.5" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};


export default function VolunteeringPage() {
    const { toast } = useToast();
    const [sortKey, setSortKey] = useState('points');
    const [searchTerm, setSearchTerm] = useState('');
    const [aiSearchTerm, setAiSearchTerm] = useState('');

    const [interestFilter, setInterestFilter] = useState<string[]>([]);
    const [skillFilter, setSkillFilter] = useState<string[]>([]);
    const [cityFilter, setCityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);

    const allCities = useMemo(() => Array.from(new Set(volunteeringOpportunities.map(o => o.location.city))).sort(), []);
    const allNgoTypes = ['Dernek', 'Vakıf', 'Spor Kulübü', 'Özel İzinli'];


    const userAbilities = [
      ...user.volunteerInfo.skills,
      ...user.volunteerInfo.dailySkills,
      ...user.volunteerInfo.languages,
      ...user.volunteerInfo.programs
    ];
    
    const sortedAndFilteredOpportunities = useMemo(() => {
        let opportunities = [...volunteeringOpportunities];

        if (interestFilter.length > 0) {
            opportunities = opportunities.filter(opp => interestFilter.includes(opp.socialArea));
        }
        if (skillFilter.length > 0) {
            opportunities = opportunities.filter(opp => opp.skills && skillFilter.some(s => opp.skills!.includes(s)));
        }
        if (cityFilter.length > 0) {
            opportunities = opportunities.filter(opp => cityFilter.includes(opp.location.city));
        }
        if (typeFilter.length > 0) {
            opportunities = opportunities.filter(opp => {
                const ngo = ngos.find(n => n.id === opp.ngoId);
                return ngo && typeFilter.includes(ngo.type);
            });
        }

        if (searchTerm.trim()) {
            const lowercased = searchTerm.toLowerCase();
            opportunities = opportunities.filter(opp => 
                opp.title.toLowerCase().includes(lowercased) ||
                opp.organization.toLowerCase().includes(lowercased) ||
                (opp.skills && opp.skills.some(skill => skill.toLowerCase().includes(lowercased)))
            );
        }

        opportunities.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'points') {
                comparison = b.points - a.points;
            } else if (sortKey === 'date') {
                const refDate = new Date(0);
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

            if (comparison === 0) {
                return a.id.localeCompare(b.id);
            }
            
            return comparison;
        });

        return opportunities;
    }, [sortKey, searchTerm, userAbilities, interestFilter, skillFilter, cityFilter, typeFilter]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-4 sticky top-12 bg-background/80 backdrop-blur-xl z-10 py-2 -mx-4 px-4 border-b">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MultiSelect title="Sosyal Hassasiyet" options={allInterests} selected={interestFilter} onSelectedChange={setInterestFilter} />
            <MultiSelect title="Yetkinlikler" options={allSkills} selected={skillFilter} onSelectedChange={setSkillFilter} />
            <MultiSelect title="Lokasyon" options={allCities} selected={cityFilter} onSelectedChange={setCityFilter} />
            <MultiSelect title="Kurum Türü" options={allNgoTypes} selected={typeFilter} onSelectedChange={setTypeFilter} />
        </div>
         <div className="pb-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="hover:no-underline -mx-1 py-1 text-sm font-medium text-muted-foreground">
                  <div className='flex items-center gap-2'>
                    <Bot />
                    Yapay Zeka ile Öneri Al
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
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
    