'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowDownUp, Users, BrainCircuit, ChevronRight, ChevronDown, Loader2, GraduationCap, Globe, MapPin, Filter, School, BookOpen, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { StudentClub } from '@/lib/types';
import { useFirestore, useMemoFirebase, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';


const ClubCard = ({
    club,
    actualMembers,
    actualPoints,
}: {
    club: StudentClub;
    actualMembers: number;
    actualPoints: number;
}) => {
    const name = club?.name || 'İsimsiz Kulüp';
    const university = club?.university || '—';
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
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {actualMembers.toLocaleString('tr-TR')} Üye</span>
                            <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" /> {actualPoints.toLocaleString('tr-TR')} Puan</span>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
};

// Üye sayısı + puan toplamı için kullanıcı şeması — joinedClubs ve managedClubId
// kulüp üyeliğini; volunteerInfo.education[].school üniversite öğrencisi
// sayımını besler. Etki puanı için iki yaygın schema'yı da destekler.
interface MemberUser {
    id: string;
    joinedClubs?: string[];
    managedClubId?: string;
    volunteerInfo?: { education?: { school?: string }[] };
    impactScore?: number;
    stats?: { impactScore?: number };
}

function getImpact(u: MemberUser): number {
    return Math.max(
        Number(u.impactScore) || 0,
        Number(u.stats?.impactScore) || 0,
    );
}

export default function ClubsPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<'global' | 'country' | 'city' | 'school' | 'university' | 'highSchool'>('global');
  const [sortMode, setSortMode] = useState<'name' | 'members' | 'clubCount'>('clubCount');
  const [expandedUniversity, setExpandedUniversity] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const clubsRef = useMemoFirebase(() => collection(db, COLLECTIONS.clubs), [db]);
  const { data: clubs, isLoading } = useCollection<StudentClub>(clubsRef);

  // Tüm kullanıcıları yükle — kulüp/üniversite üye sayıları ve puan toplamları
  // bunların üzerinden hesaplanır. (joinedClubs.includes(clubId) ya da
  // managedClubId === clubId → kulüp üyesi; volunteerInfo.education[].school
  // eşleşmesi → üniversite öğrencisi.)
  const usersRef = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
  const { data: allUsers } = useCollection<MemberUser>(usersRef);

  // Kulüp bazında üye sayısı + etki puanı toplamı (yöneticiler dahil).
  const clubStats = useMemo(() => {
    const map = new Map<string, { members: number; points: number }>();
    if (!allUsers) return map;
    for (const u of allUsers) {
      const joined = new Set<string>(u.joinedClubs || []);
      if (u.managedClubId) joined.add(u.managedClubId);
      if (joined.size === 0) continue;
      const impact = getImpact(u);
      joined.forEach((cid) => {
        const cur = map.get(cid) || { members: 0, points: 0 };
        cur.members += 1;
        cur.points += impact;
        map.set(cid, cur);
      });
    }
    return map;
  }, [allUsers]);

  // Üniversite bazında ayırt edici üye sayısı — eğitiminde o okulu listelemiş
  // kullanıcılar (büyük/küçük harf ve trim normalize).
  const universityStats = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!allUsers) return map;
    for (const u of allUsers) {
      const edu = u.volunteerInfo?.education || [];
      const seen = new Set<string>();
      for (const e of edu) {
        const s = (e?.school || '').trim().toLowerCase();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        const cur = map.get(s) || new Set<string>();
        cur.add(u.id);
        map.set(s, cur);
      }
    }
    return map;
  }, [allUsers]);

  // İsim → ayırt edici üye sayısı yardımcısı (case-insensitive lookup)
  const getUniversityMemberCount = (univName: string): number => {
    const key = (univName || '').trim().toLowerCase();
    return universityStats.get(key)?.size || 0;
  };

  type ClubWithMeta = StudentClub & {
    location?: { country?: string; city?: string };
    skills?: string[];
    interests?: string[];
    socialAreas?: string[];
  };

  // Veriden unique kategori, yetkinlik ve hassasiyet değerleri
  const { availableCategories, availableSkills, availableInterests } = useMemo(() => {
    const categoriesSet = new Set<string>();
    const skillsSet = new Set<string>();
    const interestsSet = new Set<string>();
    for (const c of (clubs || []) as ClubWithMeta[]) {
      if (c.category) categoriesSet.add(c.category);
      (c.skills || []).forEach(s => s && skillsSet.add(s));
      (c.interests || c.socialAreas || []).forEach(i => i && interestsSet.add(i));
    }
    return {
      availableCategories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, 'tr')),
      availableSkills: Array.from(skillsSet).sort((a, b) => a.localeCompare(b, 'tr')),
      availableInterests: Array.from(interestsSet).sort((a, b) => a.localeCompare(b, 'tr')),
    };
  }, [clubs]);

  const toggleCategory = (s: string) => setSelectedCategories(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSkill = (s: string) => setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleInterest = (s: string) => setSelectedInterests(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const filterCount = selectedCategories.length + selectedSkills.length + selectedInterests.length;

  // Kullanıcının ülke/şehir bilgisi (Ülkemde/Şehrimde filtreleri için)
  const userDocRef = useMemoFirebase(() => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null), [db, authUser?.uid]);
  const { data: userData } = useDoc<{
    personalInfo?: { address?: { country?: string; city?: string } };
    volunteerInfo?: { education?: { level?: string; school?: string }[] };
  }>(userDocRef);
  const userCountry = userData?.personalInfo?.address?.country || '';
  const userCity = userData?.personalInfo?.address?.city || '';
  const userSchools = useMemo(
    () => (userData?.volunteerInfo?.education || [])
      .map(e => (e?.school || '').trim())
      .filter((s): s is string => s.length > 0),
    [userData?.volunteerInfo?.education],
  );

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    let result = [...clubs];

    // Konum / okul filtresi
    if (locationFilter === 'country' && userCountry) {
      result = result.filter(c => (c as ClubWithMeta).location?.country === userCountry);
    } else if (locationFilter === 'city' && userCity) {
      result = result.filter(c => (c as ClubWithMeta).location?.city === userCity);
    } else if (locationFilter === 'school' && userSchools.length > 0) {
      const lowered = userSchools.map(s => s.toLowerCase());
      result = result.filter(c => {
        const uni = (c.university || '').toLowerCase();
        return lowered.some(s => s === uni || (s.length > 2 && uni.includes(s)));
      });
    } else if (locationFilter === 'university') {
      result = result.filter(c => c.type === 'university');
    } else if (locationFilter === 'highSchool') {
      result = result.filter(c => c.type === 'high-school');
    }

    // Kategori filtresi (multi-select, OR mantığı)
    if (selectedCategories.length > 0) {
      result = result.filter(c => !!c.category && selectedCategories.includes(c.category));
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
  }, [clubs, searchTerm, locationFilter, userCountry, userCity, userSchools, selectedCategories, selectedSkills, selectedInterests]);

  // Üniversiteye göre grupla
  const universitiesGrouped = useMemo(() => {
    const map = new Map<string, StudentClub[]>();
    for (const c of filteredClubs) {
      const uni = c.university || 'Diğer';
      if (!map.has(uni)) map.set(uni, []);
      map.get(uni)!.push(c);
    }
    const list = Array.from(map.entries()).map(([university, clubsArr]) => {
      // Kulüpleri grup içinde de seçilen ölçüte göre sırala (sıralama görünür olsun)
      const sortedClubs = [...clubsArr].sort((a, b) => {
        if (sortMode === 'members') {
          const aMembers = clubStats.get(a.id)?.members || 0;
          const bMembers = clubStats.get(b.id)?.members || 0;
          return bMembers - aMembers;
        }
        return (a.name || '').localeCompare(b.name || '', 'tr');
      });
      return {
        university,
        clubs: sortedClubs,
        // Üniversitenin gerçek öğrenci sayısı (profilinde bu okulu seçenler;
        // tek kullanıcı birden fazla kulüpte olsa da bir kez sayılır).
        memberTotal: getUniversityMemberCount(university),
      };
    });

    if (sortMode === 'name') {
      list.sort((a, b) => a.university.localeCompare(b.university, 'tr'));
    } else if (sortMode === 'members') {
      list.sort((a, b) => b.memberTotal - a.memberTotal);
    } else {
      list.sort((a, b) => b.clubs.length - a.clubs.length);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getUniversityMemberCount, universityStats'tan türer ve universityStats deps'te var
  }, [filteredClubs, sortMode, clubStats, universityStats]);

  const userSchoolSublabel = userSchools[0]
    ? userSchools.length > 1
      ? `${userSchools[0].slice(0, 14)}…`
      : userSchools[0]
    : undefined;
  // BUG-27: tek filtre state'i (locationFilter) iki satıra ayrıldı —
  // 2. satır: kulüp türü (Üniversite/Lise), 3. satır: konum (Global/Ülkem/Şehrim/Okulum)
  const typeTabs: { value: typeof locationFilter; label: string; icon: LucideIcon; sublabel?: string }[] = [
    { value: 'university', label: 'Üniversite', icon: GraduationCap },
    { value: 'highSchool', label: 'Lise', icon: BookOpen },
  ];
  const locationTabs: { value: typeof locationFilter; label: string; icon: LucideIcon; sublabel?: string }[] = [
    { value: 'global', label: 'Global', icon: Globe },
    { value: 'country', label: 'Ülkemde', icon: MapPin, sublabel: userCountry || undefined },
    { value: 'city', label: 'Şehrimde', icon: MapPin, sublabel: userCity || undefined },
    { value: 'school', label: 'Okulumda', icon: School, sublabel: userSchoolSublabel },
  ];

  // Ortak tab render helper (iki ayrı tabset için)
  const renderTabsList = (
    tabs: { value: typeof locationFilter; label: string; icon: LucideIcon; sublabel?: string }[],
    columns: 2 | 4,
  ) => (
    <Tabs value={locationFilter} onValueChange={(v) => setLocationFilter(v as typeof locationFilter)}>
      <TabsList className={`flex w-full overflow-x-auto sm:grid ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-4'} gap-1 p-1 h-12 rounded-2xl bg-muted/50`}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="shrink-0 sm:shrink rounded-[1rem] h-full px-3 sm:px-1 text-xs sm:text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col items-center justify-center"
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
  );

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Öğrenci Kulüpleri</h1>

      {/* 1. satır: Arama + filtre/sıralama */}
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
            {availableCategories.length > 0 && (
              <>
                <DropdownMenuLabel>Kategoriler</DropdownMenuLabel>
                {availableCategories.map(s => (
                  <DropdownMenuCheckboxItem
                    key={`cat-${s}`}
                    checked={selectedCategories.includes(s)}
                    onCheckedChange={() => toggleCategory(s)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
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
            {availableCategories.length === 0 && availableSkills.length === 0 && availableInterests.length === 0 && (
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Henüz filtre verisi yok
              </DropdownMenuLabel>
            )}
            {filterCount > 0 && (
              <DropdownMenuItem onSelect={() => { setSelectedCategories([]); setSelectedSkills([]); setSelectedInterests([]); }}>
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

      {/* 2. satır: Üniversite / Lise */}
      {renderTabsList(typeTabs, 2)}

      {/* 3. satır: Global / Ülkemde / Şehrimde / Okulumda */}
      {renderTabsList(locationTabs, 4)}

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
      {locationFilter === 'school' && authUser && userSchools.length === 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Okul bilgini profilinde belirt → <Link href="/settings/profile" className="underline font-bold">Profili Düzenle</Link>
        </div>
      )}
      {!authUser && (locationFilter === 'country' || locationFilter === 'city' || locationFilter === 'school') && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Konum/okul bazlı filtre için giriş yapmanız gerekir.
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
                      {uClubs.map(club => {
                        const stats = clubStats.get(club.id);
                        return (
                          <ClubCard
                            key={club.id}
                            club={club}
                            actualMembers={stats?.members || 0}
                            actualPoints={stats?.points || 0}
                          />
                        );
                      })}
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
