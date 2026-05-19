
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Calendar, GraduationCap, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { events as allEvents, studentClubs } from '@/lib/data';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type ProcessedEvent = {
    id: string;
    name: string;
    club: string;
    clubId: string;
    date: string;
    slug: string;
    clubType: 'university' | 'high-school';
    university: string;
};

type UserData = {
    personalInfo?: {
        address?: { city?: string; country?: string };
    };
    volunteerInfo?: {
        education?: { school?: string }[];
    };
};

const EventCard = ({ event }: { event: ProcessedEvent }) => (
    <Card key={event.id}>
        <CardHeader>
             <Link href={`/admin/clubs/profile/${event.clubId}`} className="text-sm text-muted-foreground hover:underline">{event.club}</Link>
            <CardTitle className="text-base">{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{event.date}</span>
            </div>
            {event.university && (
                <div className="flex items-center text-xs text-muted-foreground">
                    <GraduationCap className="mr-2 h-3 w-3" />
                    <span>{event.university}</span>
                </div>
            )}
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`/events/${event.slug}`}>Detayları Gör</Link>
            </Button>
        </CardFooter>
    </Card>
);

type EventListProps = {
    sortedEvents: ProcessedEvent[];
    emptyMessage?: string;
};

const EventList = ({ sortedEvents, emptyMessage }: EventListProps) => (
    <div className='space-y-4'>
        {sortedEvents.length > 0 ? sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
        )) : <p className="text-center text-muted-foreground py-8">{emptyMessage || 'Etkinlik bulunamadı.'}</p>}
        {sortedEvents.length > 0 && (
            <div className="text-center text-muted-foreground pt-8">
                <Button variant="link" asChild>
                    <Link href="/settings">
                    Bildirim almak için etkinlik bildirim ayarlarını aç
                    </Link>
                </Button>
            </div>
        )}
    </div>
);

type SchoolTypeTabsProps = {
    sortedEvents: ProcessedEvent[];
};

const SchoolTypeTabs = ({ sortedEvents }: SchoolTypeTabsProps) => {
    const universityEvents = useMemo(() => sortedEvents.filter(e => e.clubType === 'university'), [sortedEvents]);
    const highSchoolEvents = useMemo(() => sortedEvents.filter(e => e.clubType === 'high-school'), [sortedEvents]);

    return (
        <Tabs defaultValue="university" className='w-full mt-2'>
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="university">Üniversite</TabsTrigger>
                <TabsTrigger value="high-school">Lise</TabsTrigger>
            </TabsList>
            <TabsContent value="university" className="mt-4"><EventList sortedEvents={universityEvents} emptyMessage="Üniversite etkinliği bulunamadı." /></TabsContent>
            <TabsContent value="high-school" className="mt-4"><EventList sortedEvents={highSchoolEvents} emptyMessage="Lise etkinliği bulunamadı." /></TabsContent>
        </Tabs>
    );
};

type SubTabsProps = {
    sortedEvents: ProcessedEvent[];
    userCity: string | null;
    userSchool: string | null;
    setActiveSubTab: (v: string) => void;
};

const SubTabs = ({ sortedEvents, userCity, userSchool, setActiveSubTab }: SubTabsProps) => {
    const schoolEvents = useMemo(() => {
        if (!userSchool) return [];
        return sortedEvents.filter(e => e.university && e.university.toLowerCase() === userSchool.toLowerCase());
    }, [sortedEvents, userSchool]);

    const cityEvents = useMemo(() => {
        if (!userCity) return [];
        const c = userCity.toLowerCase();
        return sortedEvents.filter(e => e.university && e.university.toLowerCase().includes(c));
    }, [sortedEvents, userCity]);

    return (
        <Tabs defaultValue="all" className='w-full mt-4' onValueChange={setActiveSubTab}>
            <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="country">Ülkemde</TabsTrigger>
                <TabsTrigger value="school">Okulumda</TabsTrigger>
                <TabsTrigger value="city">Şehrimde</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                <SchoolTypeTabs sortedEvents={sortedEvents} />
            </TabsContent>
            <TabsContent value="country" className="mt-4">
                <SchoolTypeTabs sortedEvents={sortedEvents} />
            </TabsContent>
            <TabsContent value="school" className="mt-4">
                {userSchool ? (
                    <>
                        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {userSchool}</p>
                        <SchoolTypeTabs sortedEvents={schoolEvents} />
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
                        <SchoolTypeTabs sortedEvents={cityEvents} />
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

export default function StudentClubEventsPage() {
    const [_activeSubTab, setActiveSubTab] = useState('all');
    const [sortKey, setSortKey] = useState('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
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

    const allUniversities = useMemo(() => {
        const set = new Set(studentClubs.map(c => c.university).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    const processedEvents = useMemo<ProcessedEvent[]>(() => {
        return allEvents.map(event => {
            const club = studentClubs.find(c => c.name === event.organizer);
            return {
                id: event.id,
                name: event.name,
                slug: event.slug,
                club: event.organizer,
                clubId: club?.id || '1',
                date: event.date,
                clubType: club?.type || 'university',
                university: club?.university || '',
            };
        });
    }, []);

    const sortedEvents = useMemo(() => {
        let events = [...processedEvents];

        if (typeFilter.length > 0) {
            events = events.filter(e => typeFilter.includes(e.clubType));
        }
        if (universityFilter.length > 0) {
            events = events.filter(e => universityFilter.includes(e.university));
        }

        if (searchTerm.trim()) {
            const lowercased = searchTerm.toLowerCase();
            events = events.filter(event =>
                event.name.toLowerCase().includes(lowercased) ||
                event.club.toLowerCase().includes(lowercased)
            );
        }

        return events.sort((a, b) => {
            if (sortKey === 'name') {
                return a.name.localeCompare(b.name);
            }
            if (sortKey === 'club') {
                return a.club.localeCompare(b.club);
            }
            return 0;
        });
    }, [sortKey, searchTerm, processedEvents, typeFilter, universityFilter]);

    return (
        <div className="p-4 space-y-4 animate-in fade-in-0">
            <h1 className="text-2xl font-bold font-headline">Kulüp Etkinlikleri Yönetimi</h1>
            <div className="p-0 flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Etkinlik ara..."
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
                    <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                        <DropdownMenuLabel>Okul Tipi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={typeFilter.includes('university')}
                            onCheckedChange={(checked) => setTypeFilter(prev => checked ? [...prev, 'university'] : prev.filter(t => t !== 'university'))}
                        >Üniversite</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={typeFilter.includes('high-school')}
                            onCheckedChange={(checked) => setTypeFilter(prev => checked ? [...prev, 'high-school'] : prev.filter(t => t !== 'high-school'))}
                        >Lise</DropdownMenuCheckboxItem>
                        {allUniversities.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Okula Göre</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {allUniversities.map(uni => (
                                    <DropdownMenuCheckboxItem
                                        key={uni}
                                        checked={universityFilter.includes(uni)}
                                        onCheckedChange={(checked) => setUniversityFilter(prev => checked ? [...prev, uni] : prev.filter(u => u !== uni))}
                                    >
                                        {uni}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </>
                        )}
                        {(typeFilter.length > 0 || universityFilter.length > 0) && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTypeFilter([]); setUniversityFilter([]); }}>
                                    Filtreleri Temizle
                                </DropdownMenuItem>
                            </>
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
                        <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre Sırala</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('club')}>Kulübe Göre Sırala</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <SubTabs sortedEvents={sortedEvents} userCity={userCity} userSchool={userSchool} setActiveSubTab={setActiveSubTab} />
        </div>
    );
}
