
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, MapPin, Calendar, ChevronDown, Heart, Briefcase } from 'lucide-react';
import { ngos } from '@/lib/data';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { parse, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Volunteering } from '@/lib/types';

const FilterButton = ({ icon: Icon, title, options, selected, onSelectedChange }: {
    icon: React.ElementType;
    title: string;
    options: string[];
    selected: string[];
    onSelectedChange: (selected: string[]) => void;
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{title}</span>
                    {selected.length > 0 && (
                        <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {selected.length}
                        </span>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto" align="start">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Seçenek yok</div>
                ) : options.map(option => (
                    <DropdownMenuCheckboxItem
                        key={option}
                        checked={selected.includes(option)}
                        onCheckedChange={checked => {
                            onSelectedChange(checked ? [...selected, option] : selected.filter(i => i !== option));
                        }}
                    >
                        {option}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-1">
                            <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => onSelectedChange([])}>
                                Temizle
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const OpportunityCard = ({ opp, userAbilities }: { opp: Volunteering; userAbilities: string[] }) => {
    const ngo = ngos.find(n => n.id === opp.ngoId);

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

    const matchColor = matchPercentage >= 75 ? 'text-green-600' : matchPercentage >= 40 ? 'text-amber-600' : 'text-muted-foreground';

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
                                <p className={`text-[11px] font-bold ${matchColor}`}>%{Math.round(matchPercentage)} Uygun</p>
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
    const db = useFirestore();
    const { user: authUser } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [interestFilter, setInterestFilter] = useState<string[]>([]);
    const [skillFilter, setSkillFilter] = useState<string[]>([]);
    const [cityFilter, setCityFilter] = useState<string[]>([]);

    const oppsQuery = useMemoFirebase(() => collection(db, 'volunteering'), [db]);
    const { data: oppsData, isLoading } = useCollection<Volunteering>(oppsQuery);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, 'users', authUser.uid);
    }, [db, authUser]);
    const { data: userData } = useDoc<any>(userDocRef);

    const userAbilities = useMemo(() => {
        const vi = userData?.volunteerInfo;
        if (!vi) return [];
        return [
            ...(vi.skills || []),
            ...(vi.dailySkills || []),
            ...(vi.languages || []),
            ...(vi.programs || []),
            ...(vi.licenses || vi.driverLicenses || []),
            ...(vi.documents || vi.certificates || []),
        ];
    }, [userData]);

    const { interestOptions, skillOptions, cityOptions } = useMemo(() => {
        const interests = new Set<string>();
        const skills = new Set<string>();
        const cities = new Set<string>();
        (oppsData || []).forEach(opp => {
            if (opp.socialArea) interests.add(opp.socialArea);
            (opp.interests || []).forEach(i => interests.add(i));
            (opp.skills || []).forEach(s => skills.add(s));
            if (opp.location?.city) cities.add(opp.location.city);
        });
        return {
            interestOptions: Array.from(interests).sort((a, b) => a.localeCompare(b, 'tr')),
            skillOptions: Array.from(skills).sort((a, b) => a.localeCompare(b, 'tr')),
            cityOptions: Array.from(cities).sort((a, b) => a.localeCompare(b, 'tr')),
        };
    }, [oppsData]);

    const filteredOpps = useMemo(() => {
        if (!oppsData) return [];
        let filtered = [...oppsData];

        if (interestFilter.length > 0) {
            filtered = filtered.filter(opp =>
                interestFilter.includes(opp.socialArea) ||
                (opp.interests || []).some(i => interestFilter.includes(i)),
            );
        }
        if (skillFilter.length > 0) {
            filtered = filtered.filter(opp => (opp.skills || []).some(s => skillFilter.includes(s)));
        }
        if (cityFilter.length > 0) filtered = filtered.filter(opp => cityFilter.includes(opp.location.city));

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(opp =>
                opp.title.toLowerCase().includes(lower) ||
                opp.organization.toLowerCase().includes(lower)
            );
        }

        return filtered.sort((a, b) => b.points - a.points);
    }, [oppsData, interestFilter, skillFilter, cityFilter, searchTerm]);

  return (
    <div className="space-y-4 animate-in fade-in-0">
      <div className="p-4 space-y-4">
        <div className="space-y-3 sticky top-12 bg-background/80 backdrop-blur-xl z-10 py-2">
          <h1 className="text-2xl font-bold font-headline">Gönüllülük</h1>
          <div className="flex gap-2">
              <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="İlan ara..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11"><Filter size={20} /></Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              <FilterButton icon={Heart} title="Hassasiyet" options={interestOptions} selected={interestFilter} onSelectedChange={setInterestFilter} />
              <FilterButton icon={Briefcase} title="Yetkinlik" options={skillOptions} selected={skillFilter} onSelectedChange={setSkillFilter} />
              <FilterButton icon={MapPin} title="Konum" options={cityOptions} selected={cityFilter} onSelectedChange={setCityFilter} />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)
          ) : filteredOpps.length > 0 ? (
              filteredOpps.map(opp => <OpportunityCard key={opp.id} opp={opp} userAbilities={userAbilities} />)
          ) : (
              <p className="text-center py-20 text-muted-foreground">İlan bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
