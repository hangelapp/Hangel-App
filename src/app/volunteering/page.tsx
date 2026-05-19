
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Volunteering } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';

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

function computeMatch(opp: Volunteering, userAbilities: string[], userInterests: string[], userCity?: string) {
    const requiredAbilities = [
        ...(opp.skills || []),
        ...((opp as Volunteering & { dailySkills?: string[] }).dailySkills || []),
        ...(opp.languages || []),
        ...(opp.programs || []),
        ...(opp.requirements || []),
    ];
    const oppInterests = [
        ...(opp.socialArea ? [opp.socialArea] : []),
        ...((opp.interests || []) as string[]),
    ];

    // Yetkinlik eşleşmesi (max 60 puan)
    const abilityMatched = requiredAbilities.filter(r => userAbilities.includes(r)).length;
    const abilityScore = requiredAbilities.length > 0
        ? (abilityMatched / requiredAbilities.length) * 60
        : 60;

    // İlgi alanı / hassasiyet eşleşmesi (max 30 puan)
    const interestMatched = oppInterests.filter(i => userInterests.includes(i)).length;
    const interestScore = oppInterests.length > 0
        ? (interestMatched / oppInterests.length) * 30
        : 30;

    // Konum eşleşmesi (max 10 puan) — online her zaman %100 eşleşir
    let locationScore = 0;
    if (opp.location?.type === 'Online') locationScore = 10;
    else if (userCity && opp.location?.city && userCity === opp.location.city) locationScore = 10;
    else if (!userCity || !opp.location?.city) locationScore = 5;

    const total = Math.round(abilityScore + interestScore + locationScore);
    return {
        percent: Math.max(0, Math.min(100, total)),
        breakdown: {
            ability: { matched: abilityMatched, total: requiredAbilities.length },
            interest: { matched: interestMatched, total: oppInterests.length },
            location: locationScore === 10 ? 'Tam' : locationScore === 5 ? 'Belirsiz' : 'Farklı',
        },
    };
}

const OpportunityCard = ({ opp, userAbilities, userInterests, userCity }: {
    opp: Volunteering;
    userAbilities: string[];
    userInterests: string[];
    userCity?: string;
}) => {
    const ngo = ngos.find(n => n.id === opp.ngoId);
    const match = computeMatch(opp, userAbilities, userInterests, userCity);
    const matchPercentage = match.percent;

    const daysRemaining = differenceInDays(parse(opp.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
    const countdownText = daysRemaining > 0 ? `Son ${daysRemaining} gün` : (daysRemaining === 0 ? 'Son Gün' : 'Süre Doldu');

    const matchTone =
        matchPercentage >= 75 ? { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200', bar: 'bg-green-500' } :
        matchPercentage >= 50 ? { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500' } :
                                 { bg: 'bg-muted', text: 'text-muted-foreground', ring: 'ring-border', bar: 'bg-muted-foreground/40' };

    return (
        <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/20 h-full">
            <Link href={`/volunteering/${opp.id}`} className="block group h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {ngo && (
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground truncate">{opp.organization}</p>
                                    <h3 className="font-semibold text-base leading-tight mt-1 group-hover:text-primary transition-colors line-clamp-2">{opp.title}</h3>
                                </div>
                            </div>
                            {/* Belirgin uygunluk rozeti */}
                            <div
                                className={`flex flex-col items-center justify-center shrink-0 rounded-xl px-2.5 py-1.5 ring-1 ${matchTone.bg} ${matchTone.ring}`}
                                title={`Yetkinlik: ${match.breakdown.ability.matched}/${match.breakdown.ability.total} • Hassasiyet: ${match.breakdown.interest.matched}/${match.breakdown.interest.total} • Konum: ${match.breakdown.location}`}
                            >
                                <span className={`text-base font-black leading-none ${matchTone.text}`}>%{matchPercentage}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${matchTone.text}`}>Uygun</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {opp.location.city} ({opp.location.type})</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {opp.commitment}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-primary text-xs">{opp.points} Puan</span>
                                <Badge variant={daysRemaining < 0 ? 'destructive' : 'outline'} className="text-[10px] font-bold">
                                    {countdownText}
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase tracking-wider">
                                <span className="font-bold text-muted-foreground">Profil Uygunluğu</span>
                                <span className={`font-black ${matchTone.text}`}>%{matchPercentage}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${matchTone.bar} transition-all`} style={{ width: `${matchPercentage}%` }} />
                            </div>
                        </div>
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
    const [sortBy, setSortBy] = useState<'match' | 'points' | 'deadline'>('match');

    const oppsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.volunteering), [db]);
    const { data: oppsData, isLoading } = useCollection<Volunteering>(oppsQuery);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);
    const { data: userData } = useDoc<{
        volunteerInfo?: {
            skills?: string[];
            dailySkills?: string[];
            languages?: string[];
            programs?: string[];
            licenses?: string[];
            driverLicenses?: string[];
            documents?: string[];
            certificates?: string[];
            interests?: string[];
        };
        personalInfo?: { address?: { city?: string } };
    }>(userDocRef);

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

    const userInterests = useMemo(() => {
        const vi = userData?.volunteerInfo;
        return (vi?.interests || []) as string[];
    }, [userData]);

    const userCity = useMemo(() => {
        return userData?.personalInfo?.address?.city as string | undefined;
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
        // Sadece onaylanmış (Aktif) ilanlar — Beklemede/Pasif gizli
        let filtered = oppsData.filter(opp => {
            const status = (opp as Volunteering & { status?: string }).status;
            // Eski ilanlar status alanı olmayabilir — varsayılan olarak gösterilir
            return !status || status === 'Aktif';
        });

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

        if (sortBy === 'match') {
            return filtered
                .map(o => ({ o, m: computeMatch(o, userAbilities, userInterests, userCity).percent }))
                .sort((a, b) => b.m - a.m)
                .map(x => x.o);
        }
        if (sortBy === 'deadline') {
            return filtered.sort((a, b) => {
                const ad = differenceInDays(parse(a.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
                const bd = differenceInDays(parse(b.dates.applicationEnd, 'yyyy-MM-dd', new Date()), new Date());
                return ad - bd;
            });
        }
        return filtered.sort((a, b) => b.points - a.points);
    }, [oppsData, interestFilter, skillFilter, cityFilter, searchTerm, sortBy, userAbilities, userInterests, userCity]);

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
              <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Filtrele"><Filter size={20} /></Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar items-center">
              <FilterButton icon={Heart} title="Hassasiyet" options={interestOptions} selected={interestFilter} onSelectedChange={setInterestFilter} />
              <FilterButton icon={Briefcase} title="Yetkinlikler" options={skillOptions} selected={skillFilter} onSelectedChange={setSkillFilter} />
              <FilterButton icon={MapPin} title="Konum" options={cityOptions} selected={cityFilter} onSelectedChange={setCityFilter} />
              {(interestFilter.length + skillFilter.length + cityFilter.length) > 0 && (
                  <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs shrink-0"
                      onClick={() => { setInterestFilter([]); setSkillFilter([]); setCityFilter([]); }}
                  >
                      Filtreleri temizle
                  </Button>
              )}
              <div className="ml-auto flex items-center gap-1 shrink-0 pl-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sırala:</span>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs font-bold">
                              {sortBy === 'match' ? 'Uygunluğa göre' : sortBy === 'deadline' ? 'Son tarihe göre' : 'Puana göre'}
                              <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuCheckboxItem checked={sortBy === 'match'} onCheckedChange={() => setSortBy('match')}>Uygunluğa göre</DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem checked={sortBy === 'points'} onCheckedChange={() => setSortBy('points')}>Puana göre</DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem checked={sortBy === 'deadline'} onCheckedChange={() => setSortBy('deadline')}>Son tarihe göre</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
              [...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)
          ) : filteredOpps.length > 0 ? (
              filteredOpps.map(opp => (
                  <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      userAbilities={userAbilities}
                      userInterests={userInterests}
                      userCity={userCity}
                  />
              ))
          ) : (
              <p className="text-center py-20 text-muted-foreground">İlan bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
