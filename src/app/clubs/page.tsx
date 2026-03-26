'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { StudentClub } from '@/lib/types';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';


const ClubCard = ({ club }: { club: StudentClub }) => (
    <Link href={`/clubs/profile/${club.id}`} key={club.id} className="block">
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

export default function ClubsPage() {
  const db = useFirestore();
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentClub | 'members' | 'points'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState<string[]>([]);
  const [contentType, setContentType] = useState('clubs');
  const [locationFilter, setLocationFilter] = useState('all');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('all');

  const clubsRef = useMemoFirebase(() => collection(db, 'clubs'), [db]);
  const { data: clubs, isLoading } = useCollection<StudentClub>(clubsRef);

  const allUniversities = useMemo(() => {
    if (!clubs) return [];
    return [...new Set(clubs.map(club => club.university))].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [clubs]);

  const finalClubs = useMemo(() => {
    if (!clubs) return [];
    let result = [...clubs];

    if (universityFilter.length > 0) {
      result = result.filter(club => universityFilter.includes(club.university));
    }

    if (schoolTypeFilter !== 'all') {
      result = result.filter(club => club.type === schoolTypeFilter);
    }

    if (searchTerm.trim()) {
      const lowercased = searchTerm.toLowerCase();
      result = result.filter(club =>
        club.name.toLowerCase().includes(lowercased) ||
        club.university.toLowerCase().includes(lowercased)
      );
    }

    result.sort((a, b) => {
      const key = sortConfig.key as keyof StudentClub;
      if (sortConfig.key === 'members' || sortConfig.key === 'points') {
        const valA = a[sortConfig.key] as number;
        const valB = b[sortConfig.key] as number;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [clubs, searchTerm, universityFilter, schoolTypeFilter, sortConfig]);

  const renderContent = () => {
    if (locationFilter === 'school' || locationFilter === 'city') {
      return <div className="text-center text-muted-foreground py-16">Bu özellik yakında aktif olacaktır.</div>;
    }

    if (isLoading) {
      return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (contentType === 'clubs') {
      return finalClubs.length > 0 ? (
        <div className='space-y-3'>
          {finalClubs.map((club) => <ClubCard key={club.id} club={club} />)}
        </div>
      ) : <div className="text-center text-muted-foreground p-8">Bu kategoride kulüp bulunmuyor.</div>;
    }

    if (contentType === 'events') {
      return (
        <div className='space-y-4'>
          <div className="text-center text-muted-foreground py-16">Etkinlik bulunamadı.</div>
          <div className="text-center text-muted-foreground pt-8">
            <p>Yakında daha fazla etkinlik burada olacak.</p>
            <Button variant="link" asChild>
              <Link href="/settings">Bildirim almak için etkinlik bildirim ayarlarını aç</Link>
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Öğrenci Kulüpleri</h1>

      <div className="p-0 flex gap-2 items-center sticky top-14 bg-background z-10 py-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Kulüp ara..."
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11">
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
            <Button variant="outline" size="icon" className="h-11 w-11">
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

      <div className="space-y-3">
        <Tabs value={contentType} onValueChange={setContentType}>
          <TabsList className="grid w-full grid-cols-2 p-1 h-12 rounded-2xl bg-muted/50">
            <TabsTrigger value="clubs" className="rounded-[1rem] h-full text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Kulüpler</TabsTrigger>
            <TabsTrigger value="events" className="rounded-[1rem] h-full text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Etkinlikler</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={locationFilter} onValueChange={setLocationFilter}>
          <TabsList className="grid w-full grid-cols-4 p-1 h-11 rounded-2xl bg-muted/50">
            <TabsTrigger value="all" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Tümü</TabsTrigger>
            <TabsTrigger value="country" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Ülkemde</TabsTrigger>
            <TabsTrigger value="school" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Okulumda</TabsTrigger>
            <TabsTrigger value="city" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Şehrimde</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
          <TabsList className="grid w-full grid-cols-3 p-1 h-11 rounded-2xl bg-muted/50">
            <TabsTrigger value="all" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Tümü</TabsTrigger>
            <TabsTrigger value="university" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Üniversite</TabsTrigger>
            <TabsTrigger value="high-school" className="rounded-[0.8rem] h-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Lise</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
}
