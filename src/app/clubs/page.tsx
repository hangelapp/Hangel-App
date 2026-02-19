'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { studentClubs, events as allEvents } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { StudentClub } from '@/lib/types';


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

const EventCard = ({ event }: { event: { id: string, name: string, club: string, clubId: string, date: string } }) => (
    <Link href={`/events/${event.id}`} key={event.id} className="block">
        <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-4 flex gap-4 items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-base">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.club}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    </Link>
);


export default function ClubsPage() {
  const [clubs, setClubs] = useState<StudentClub[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentClub | 'members' | 'points'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState<string[]>([]);

  const processedEvents = useMemo(() => {
    return allEvents.map(event => {
        const club = studentClubs.find(c => c.name === event.organizer);
        return {
            id: event.id,
            name: event.name,
            club: event.organizer,
            clubId: club?.id || '1', 
            date: event.date,
        };
    });
  }, []);

  useEffect(() => {
    setClubs(studentClubs);
  }, []);
  
  const allUniversities = useMemo(() => {
    const uniqueUniversities = [...new Set(studentClubs.map(club => club.university))];
    return uniqueUniversities.sort((a, b) => a.localeCompare(b));
  }, []);

  const sortedClubs = useMemo(() => {
    let sortableClubs = [...clubs];
    sortableClubs.sort((a, b) => {
        const key = sortConfig.key as keyof StudentClub;
        if (a[key] < b[key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
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

  const finalEvents = useMemo(() => {
      if (!searchTerm.trim()) return processedEvents;
      const lowercased = searchTerm.toLowerCase();
      return processedEvents.filter(event => 
        event.name.toLowerCase().includes(lowercased) ||
        event.club.toLowerCase().includes(lowercased)
      );
  }, [processedEvents, searchTerm]);

  const getEventsByType = (type?: 'university' | 'high-school') => {
      if (!type) return finalEvents;
      return finalEvents.filter(event => {
          const club = studentClubs.find(c => c.id === event.clubId);
          return club?.type === type;
      });
  };

  const ClubList = ({type}: {type?: 'university' | 'high-school'}) => {
    const filteredClubs = type ? finalClubs.filter(c => c.type === type) : finalClubs;
    return (
        <div className='space-y-3'>
            {filteredClubs.length > 0 ? filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
            )) : <div className="text-center text-muted-foreground p-8">Bu kategoride kulüp bulunmuyor.</div>}
        </div>
    )
  }
  
  const SchoolTypeTabs = () => {
    const clubContent = (
      <>
        <TabsContent value="university" className="mt-4"><ClubList type="university" /></TabsContent>
        <TabsContent value="high-school" className="mt-4"><ClubList type="high-school" /></TabsContent>
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

  const SubTabs = () => {
    const clubListAll = <ClubList />;
    const schoolTypeTabs = <SchoolTypeTabs />;

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
            <TabsContent value="school" className="mt-4 text-center text-muted-foreground py-8">Okulunuzdaki içerik yakında burada.</TabsContent>
            <TabsContent value="city" className="mt-4 text-center text-muted-foreground py-8">Şehrinizdeki içerik yakında burada.</TabsContent>
        </Tabs>
    )
  };


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

       <Tabs defaultValue="clubs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clubs">Kulüpler</TabsTrigger>
            <TabsTrigger value="events">Etkinlikler</TabsTrigger>
        </TabsList>
        <TabsContent value="clubs" className="mt-4">
            <SubTabs />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="country">Ülkemde</TabsTrigger>
                    <TabsTrigger value="school">Okulumda</TabsTrigger>
                    <TabsTrigger value="city">Şehrimde</TabsTrigger>
                    <TabsTrigger value="university">Üniversite</TabsTrigger>
                    <TabsTrigger value="high-school">Lise</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <div className='space-y-4'>
                        {finalEvents.length > 0 ? finalEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        )) : <div className="text-center text-muted-foreground p-8">Etkinlik bulunamadı.</div>}
                    </div>
                </TabsContent>
                <TabsContent value="country" className="mt-4">
                    <div className='space-y-4'>
                        {finalEvents.length > 0 ? finalEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        )) : <div className="text-center text-muted-foreground p-8">Etkinlik bulunamadı.</div>}
                    </div>
                </TabsContent>
                <TabsContent value="school" className="mt-4 text-center text-muted-foreground py-8">Okulunuzdaki etkinlikler yakında burada.</TabsContent>
                <TabsContent value="city" className="mt-4 text-center text-muted-foreground py-8">Şehrinizdeki etkinlikler yakında burada.</TabsContent>
                <TabsContent value="university" className="mt-4">
                    <div className='space-y-4'>
                        {getEventsByType('university').length > 0 ? getEventsByType('university').map((event) => (
                            <EventCard key={event.id} event={event} />
                        )) : <div className="text-center text-muted-foreground p-8">Üniversite etkinliği bulunamadı.</div>}
                    </div>
                </TabsContent>
                <TabsContent value="high-school" className="mt-4">
                     <div className='space-y-4'>
                        {getEventsByType('high-school').length > 0 ? getEventsByType('high-school').map((event) => (
                            <EventCard key={event.id} event={event} />
                        )) : <div className="text-center text-muted-foreground p-8">Lise etkinliği bulunamadı.</div>}
                    </div>
                </TabsContent>
            </Tabs>
             <div className="text-center text-muted-foreground pt-8">
                <p>Yakında daha fazla etkinlik burada olacak.</p>
                 <Button variant="link" asChild>
                  <Link href="/settings">
                    Bildirim almak için etkinlik bildirim ayarlarını aç
                  </Link>
                </Button>
            </div>
        </TabsContent>
    </Tabs>
    </div>
  );
}
