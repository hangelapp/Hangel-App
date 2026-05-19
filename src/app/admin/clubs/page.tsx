'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit, ChevronRight, GraduationCap, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { studentClubs } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { StudentClub } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type UserData = {
    personalInfo?: {
        address?: { city?: string; country?: string };
    };
    volunteerInfo?: {
        education?: { school?: string }[];
    };
};


const ClubCard = ({ club }: { club: StudentClub }) => (
    <Link href={`/admin/clubs/profile/${club.id}`} key={club.id} className="block">
        <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-3 flex gap-3 items-center">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={club.avatarUrl} alt={club.name} />
                    <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{club.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{club.university}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {club.members} Üye</span>
                        <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" /> {club.points} Puan</span>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    </Link>
);

type ClubListProps = {
    finalClubs: StudentClub[];
    type?: 'university' | 'high-school';
};

const ClubList = ({ finalClubs, type }: ClubListProps) => {
    const filteredClubs = type ? finalClubs.filter(c => c.type === type) : finalClubs;
    return (
        <div className='space-y-3'>
            {filteredClubs.length > 0 ? filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
            )) : <div className="text-center text-muted-foreground p-8">Bu kategoride kulüp bulunmuyor.</div>}
        </div>
    );
};

type SchoolTypeTabsProps = {
    finalClubs: StudentClub[];
};

const SchoolTypeTabs = ({ finalClubs }: SchoolTypeTabsProps) => {
    const clubContent = (
        <>
            <TabsContent value="university" className="mt-4"><ClubList finalClubs={finalClubs} type="university" /></TabsContent>
            <TabsContent value="high-school" className="mt-4"><ClubList finalClubs={finalClubs} type="high-school" /></TabsContent>
        </>
    );

    return (
        <Tabs defaultValue="university" className='w-full mt-2'>
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="university">Üniversite</TabsTrigger>
                <TabsTrigger value="high-school">Lise</TabsTrigger>
            </TabsList>
            {clubContent}
        </Tabs>
    );
};

type SubTabsProps = {
    finalClubs: StudentClub[];
    activeSubTab: string;
    setActiveSubTab: (v: string) => void;
    userCity: string | null;
    userSchool: string | null;
};

const SubTabs = ({ finalClubs, activeSubTab, setActiveSubTab, userCity, userSchool }: SubTabsProps) => {
    const clubListAll = <ClubList finalClubs={finalClubs} />;
    const schoolTypeTabs = <SchoolTypeTabs finalClubs={finalClubs} />;

    const schoolClubs = useMemo(() => {
        if (!userSchool) return [];
        return finalClubs.filter(c => c.university.toLowerCase() === userSchool.toLowerCase());
    }, [finalClubs, userSchool]);

    const cityClubs = useMemo(() => {
        if (!userCity) return [];
        const c = userCity.toLowerCase();
        return finalClubs.filter(club => club.university.toLowerCase().includes(c));
    }, [finalClubs, userCity]);

    return (
        <Tabs defaultValue="all" className='w-full mt-4' onValueChange={setActiveSubTab}>
            <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="country">Ülkemde</TabsTrigger>
                <TabsTrigger value="school">Okulumda</TabsTrigger>
                <TabsTrigger value="city">Şehrimde</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                {['all'].includes(activeSubTab) ? schoolTypeTabs : clubListAll}
            </TabsContent>
            <TabsContent value="country" className="mt-4">
                {['country'].includes(activeSubTab) && schoolTypeTabs}
            </TabsContent>
            <TabsContent value="school" className="mt-4">
                {userSchool ? (
                    <>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {userSchool}</p>
                        <SchoolTypeTabs finalClubs={schoolClubs} />
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-8 space-y-2">
                        <p>Okulunuz tanımlı değil.</p>
                        <Button variant="link" asChild>
                            <Link href="/settings/volunteer">Okul bilgisini ekle</Link>
                        </Button>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="city" className="mt-4">
                {userCity ? (
                    <>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> {userCity}</p>
                        <SchoolTypeTabs finalClubs={cityClubs} />
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-8 space-y-2">
                        <p>Şehir bilginiz tanımlı değil.</p>
                        <Button variant="link" asChild>
                            <Link href="/settings/profile">Adres bilgisini ekle</Link>
                        </Button>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
};

export default function StudentClubsPage() {
  const [clubs, setClubs] = useState<StudentClub[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentClub | 'members' | 'points'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState<string[]>([]);

  const { user: authUser } = useUser();
  const db = useFirestore();
  const userDocRef = useMemoFirebase(() => {
      if (!db || !authUser?.uid) return null;
      return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser?.uid]);
  const { data: userData } = useDoc<UserData>(userDocRef);
  const userCity = userData?.personalInfo?.address?.city || null;
  const userSchool = userData?.volunteerInfo?.education?.[0]?.school || null;

  useEffect(() => {
    setClubs(studentClubs);
  }, []);
  
  const allUniversities = useMemo(() => {
    const uniqueUniversities = [...new Set(studentClubs.map(club => club.university))];
    return uniqueUniversities.sort((a, b) => a.localeCompare(b));
  }, []);

  const sortedClubs = useMemo(() => {
    const sortableClubs = [...clubs];
    sortableClubs.sort((a, b) => {
        const key = sortConfig.key as keyof StudentClub;
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';
        if (aVal < bVal) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    if (sortConfig.key === 'members' || sortConfig.key === 'points') {
        sortableClubs.sort((a, b) => {
            const valA = a[sortConfig.key] as number;
            const valB = b[sortConfig.key] as number;
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
    }
    return sortableClubs;
  }, [clubs, sortConfig]);

  const finalClubs = useMemo(() => {
    let clubsToFilter = [...sortedClubs];
    
    if (universityFilter.length > 0) {
      clubsToFilter = clubsToFilter.filter(club => universityFilter.includes(club.university));
    }
    
    if (!searchTerm.trim()) {
      return clubsToFilter;
    }

    const lowercased = searchTerm.toLowerCase();
    return clubsToFilter.filter(club => 
        club.name.toLowerCase().includes(lowercased) ||
        club.university.toLowerCase().includes(lowercased)
    );
  }, [sortedClubs, searchTerm, universityFilter]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Öğrenci Kulüpleri</h1>
      
       <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Kulüp veya etkinlik ara..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Filtrele">
                        <Filter className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Okula Göre Filtrele</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allUniversities.map(uni => (
                        <DropdownMenuCheckboxItem
                            key={uni}
                            checked={universityFilter.includes(uni)}
                            onCheckedChange={(checked) => {
                                setUniversityFilter(prev => 
                                    checked ? [...prev, uni] : prev.filter(u => u !== uni)
                                );
                            }}
                        >
                            {uni}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Sırala">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'members', direction: 'desc' })}>Üye Sayısı (Çoktan Aza)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'members', direction: 'asc' })}>Üye Sayısı (Azdan Çoğa)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'desc' })}>Puan (Yüksekten Düşüğe)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'asc' })}>Puan (Düşükten Yükseğe)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>
      <SubTabs finalClubs={finalClubs} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} userCity={userCity} userSchool={userSchool} />
    </div>
  );
}
