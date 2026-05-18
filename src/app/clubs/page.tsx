'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowDownUp, Users, BrainCircuit, ChevronRight, ChevronDown, Loader2, GraduationCap, Globe, MapPin, Filter, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { StudentClub } from '@/lib/types';
import { useFirestore, useMemoFirebase, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';


const ClubCard = ({ club }: { club: StudentClub }) => {
    const name = club?.name || 'İsimsiz Kulüp';
    const university = club?.university || '—';
    const members = Number(club?.members) || 0;
    const points = Number(club?.points) || 0;
    return (
        <Link href={`/clubs/profile/${club.id}`} key={club.id} className="block">
            <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-3 flex gap-3 items-center">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={club?.avatarUrl} alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{university}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {members} Üye</span>
                            <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" /> {points} Puan</span>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
};

export default function ClubsPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<'global' | 'country' | 'city'>('global');
  const [sortMode, setSortMode] = useState<'name' | 'members' | 'clubCount'>('clubCount');
  const [expandedUniversity, setExpandedUniversity] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const clubsRef = useMemoFirebase(() => collection(db, 'clubs'), [db]);
  const { data: clubs, isLoading } = useCollection<StudentClub>(clubsRef);

  type ClubWithMeta = StudentClub & {
    location?: { country?: string; city?: string };
    skills?: string[];
    interests?: string[];
    socialAreas?: string[];
  };

  // Veriden unique yetkinlik ve hassasiyet değerleri
  const { availableSkills, availableInterests } = useMemo(() => {
    const skillsSet = new Set<string>();
    const interestsSet = new Set<string>();
    for (const c of (clubs || []) as ClubWithMeta[]) {
      (c.skills || []).forEach(s => s && skillsSet.add(s));
      (c.interests || c.socialAreas || []).forEach(i => i && interestsSet.add(i));
    }
    return {
      availableSkills: Array.from(skillsSet).sort((a, b) => a.localeCompare(b, 'tr')),
      availableInterests: Array.from(interestsSet).sort((a, b) => a.localeCompare(b, 'tr')),
    };
  }, [clubs]);

  const toggleSkill = (s: string) => setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleInterest = (s: string) => setSelectedInterests(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const filterCount = selectedSkills.length + selectedInterests.length;

  // Kullanıcının ülke/şehir bilgisi (Ülkemde/Şehrimde filtreleri için)
  const userDocRef = useMemoFirebase(() => (db && authUser?.uid ? doc(db, 'users', authUser.uid) : null), [db, authUser?.uid]);
  const { data: userData } = useDoc<{ personalInfo?: { address?: { country?: string; city?: string } } }>(userDocRef);
  const userCountry = userData?.personalInfo?.address?.country || '';
  const userCity = userData?.personalInfo?.address?.city || '';

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    let result = [...clubs];

    // Konum filtresi: club.location.country / club.location.city
    if (locationFilter === 'country' && userCountry) {
      result = result.filter(c => (c as ClubWithMeta).location?.country === userCountry);
    } else if (locationFilter === 'city' && userCity) {
      result = result.filter(c => (c as ClubWithMeta).location?.city === userCity);
    }

    // Yetkinlik filtresi (multi-select, AND mantığı)
    if (selectedSkills.length > 0) {
      result = result.filter(c => {
        const skills = (c as ClubWithMeta).skills || [];
        return selectedSkills.every(s => skills.includes(s));
      });
    }

    // Hassasiyet filtresi (interests veya socialAreas)
    if (selectedInterests.length > 0) {
      result = result.filter(c => {
        const cm = c as ClubWithMeta;
        const ints = cm.interests || cm.socialAreas || [];
        return selectedInterests.every(s => ints.includes(s));
      });
    }

    // Arama
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c?.name || '').toLowerCase().includes(q) ||
        (c?.university || '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [clubs, searchTerm, locationFilter, userCountry, userCity, selectedSkills, selectedInterests]);

  // Üniversiteye göre grupla
  const universitiesGrouped = useMemo(() => {
    const map = new Map<string, StudentClub[]>();
    for (const c of filteredClubs) {
      const uni = c.university || 'Diğer';
      if (!map.has(uni)) map.set(uni, []);
      map.get(uni)!.push(c);
    }
    const list = Array.from(map.entries()).map(([university, clubsArr]) => ({
      university,
      clubs: clubsArr,
      memberTotal: clubsArr.reduce((s, c) => s + (c.members || 0), 0),
    }));

    if (sortMode === 'name') {
      list.sort((a, b) => a.university.localeCompare(b.university, 'tr'));
    } else if (sortMode === 'members') {
      list.sort((a, b) => b.memberTotal - a.memberTotal);
    } else {
      list.sort((a, b) => b.clubs.length - a.clubs.length);
    }
    return list;
  }, [filteredClubs, sortMode]);

  const locationTabs: { value: 'global' | 'country' | 'city'; label: string; icon: LucideIcon; sublabel?: string }[] = [
    { value: 'global', label: 'Global', icon: Globe },
    { value: 'country', label: 'Ülkemde', icon: MapPin, sublabel: userCountry || undefined },
    { value: 'city', label: 'Şehrimde', icon: MapPin, sublabel: userCity || undefined },
  ];

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Öğrenci Kulüpleri</h1>

      <div className="p-0 flex gap-2 items-center sticky top-14 bg-background z-10 py-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Üniversite veya kulüp ara..."
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 relative" aria-label="Filtrele">
              <Filter className="h-5 w-5" />
              {filterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[60vh] overflow-y-auto w-56">
            {availableSkills.length > 0 && (
              <>
                <DropdownMenuLabel>Yetkinlikler</DropdownMenuLabel>
                {availableSkills.map(s => (
                  <DropdownMenuCheckboxItem
                    key={`skill-${s}`}
                    checked={selectedSkills.includes(s)}
                    onCheckedChange={() => toggleSkill(s)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            {availableInterests.length > 0 && (
              <>
                <DropdownMenuLabel>Hassasiyetler</DropdownMenuLabel>
                {availableInterests.map(s => (
                  <DropdownMenuCheckboxItem
                    key={`int-${s}`}
                    checked={selectedInterests.includes(s)}
                    onCheckedChange={() => toggleInterest(s)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            {availableSkills.length === 0 && availableInterests.length === 0 && (
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Henüz filtre verisi yok
              </DropdownMenuLabel>
            )}
            {filterCount > 0 && (
              <DropdownMenuItem onSelect={() => { setSelectedSkills([]); setSelectedInterests([]); }}>
                Filtreleri Temizle
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Sırala">
              <ArrowDownUp className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortMode('clubCount')}>Kulüp Sayısı (Çok → Az)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode('members')}>Toplam Üye (Çok → Az)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode('name')}>İsme Göre (A → Z)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Konum tabları: Global / Ülkemde / Şehrimde */}
      <Tabs value={locationFilter} onValueChange={(v) => setLocationFilter(v as 'global' | 'country' | 'city')}>
        <TabsList className="grid w-full grid-cols-3 p-1 h-12 rounded-2xl bg-muted/50">
          {locationTabs.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-[1rem] h-full text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center justify-center"
              >
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </span>
                {t.sublabel && (
                  <span className="text-[9px] text-muted-foreground font-normal mt-0.5 truncate max-w-[80px]">
                    {t.sublabel}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Login bilgi mesajı */}
      {locationFilter === 'country' && !userCountry && authUser && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Ülke bilgini profilinde belirt → <Link href="/settings/profile" className="underline font-bold">Profili Düzenle</Link>
        </div>
      )}
      {locationFilter === 'city' && !userCity && authUser && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Şehir bilgini profilinde belirt → <Link href="/settings/profile" className="underline font-bold">Profili Düzenle</Link>
        </div>
      )}
      {!authUser && locationFilter !== 'global' && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Konum bazlı filtre için giriş yapmanız gerekir.
        </div>
      )}

      {/* Üniversite Listesi */}
      <div className="mt-2">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : universitiesGrouped.length === 0 ? (
          <div className="text-center text-muted-foreground p-12">Bu filtreyle eşleşen üniversite bulunamadı.</div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Üniversite Listesi ({universitiesGrouped.length})
            </p>
            {universitiesGrouped.map(({ university, clubs: uClubs, memberTotal }) => {
              const isOpen = expandedUniversity === university;
              return (
                <Card key={university} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedUniversity(isOpen ? null : university)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-accent/40 transition-colors text-left"
                  >
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{university}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{uClubs.length} kulüp</Badge>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {memberTotal} üye</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t bg-muted/20 p-3 space-y-2">
                      {uClubs.map(club => <ClubCard key={club.id} club={club} />)}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
