'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { studentClubs } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClubCard = ({ club }: { club: (typeof studentClubs)[0] }) => (
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


export default function StudentClubsPage() {
  const [clubs, setClubs] = useState(studentClubs);
  const [activeSubTab, setActiveSubTab] = useState('all');

   const sampleEvents = [
        { id: '1', name: 'Girişimcilik Zirvesi \'24', club: 'İTÜ Girişimcilik Kulübü', clubId: '1', date: '25 Ekim 2024' },
        { id: '2', name: 'Sonbahar Konseri', club: 'Boğaziçi Üniversitesi Müzik Kulübü', clubId: '2', date: '15 Kasım 2024' },
        { id: '3', name: 'Fotoğraf Sergisi: "İstanbul\'un Renkleri"', club: 'Galatasaray Lisesi Sanat Kulübü', clubId: '3', date: '1-7 Aralık 2024' }
    ];

  useEffect(() => {
    // This is to avoid hydration mismatch error
    setClubs(studentClubs.map(club => ({
      ...club,
      members: Math.floor(Math.random() * 200) + 50,
      points: Math.floor(Math.random() * 5000) + 1000
    })));
  }, []);

  const ClubList = ({type}: {type?: 'university' | 'high-school'}) => {
    const filteredClubs = type ? clubs.filter(c => c.type === type) : clubs;
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
                />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11">
                <ArrowDownUp className="h-5 w-5" />
            </Button>
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
            <div className='space-y-4'>
                {sampleEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
                 <div className="text-center text-muted-foreground pt-8">
                    <p>Yakında daha fazla etkinlik burada olacak.</p>
                     <Button variant="link" asChild>
                      <Link href="/settings">
                        Bildirim almak için etkinlik bildirim ayarlarını aç
                      </Link>
                    </Button>
                </div>
            </div>
        </TabsContent>
    </Tabs>
    </div>
  );
}
