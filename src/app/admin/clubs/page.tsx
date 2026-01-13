'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { studentClubs } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClubCard = ({ club }: { club: (typeof studentClubs)[0] }) => (
    <Card key={club.id}>
        <CardHeader>
            <Link href={`/admin/clubs/profile/${club.id}`} className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={club.avatarUrl} alt={club.name} />
                    <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base hover:underline">{club.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{club.university}</p>
                </div>
            </Link>
        </CardHeader>
        <CardContent className="flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /> <strong>{club.members}</strong> Üye</div>
            <div className="flex items-center gap-1 text-muted-foreground"><BrainCircuit className="h-4 w-4" /> <strong>{club.points}</strong> Puan</div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/clubs/profile/${club.id}`}>Profili Gör</Link>
          </Button>
        </CardContent>
    </Card>
);

const EventCard = ({ event }: { event: { id: string, name: string, club: string, clubId: string, date: string } }) => (
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
        </CardContent>
        <CardContent className="flex justify-end">
            <Button variant="outline">Detayları Gör</Button>
        </CardContent>
    </Card>
);


export default function StudentClubsPage() {
  const [clubs, setClubs] = useState(studentClubs);
  const [activeSubTab, setActiveSubTab] = useState('all');

  useEffect(() => {
    // This is to avoid hydration mismatch error
    setClubs(studentClubs.map(club => ({
      ...club,
      members: Math.floor(Math.random() * 200) + 50,
      points: Math.floor(Math.random() * 5000) + 1000
    })));
  }, []);

  const sampleEvents = [
    { id: '1', name: 'Girişimcilik Zirvesi \'24', club: 'İTÜ Girişimcilik Kulübü', clubId: '1', date: '25 Ekim 2024' },
    { id: '2', name: 'Sonbahar Konseri', club: 'Boğaziçi Üniversitesi Müzik Kulübü', clubId: '2', date: '15 Kasım 2024' },
    { id: '3', name: 'Fotoğraf Sergisi: "İstanbul\'un Renkleri"', club: 'Galatasaray Lisesi Sanat Kulübü', clubId: '3', date: '1-7 Aralık 2024' }
  ];

  const ClubList = ({type}: {type?: 'university' | 'high-school'}) => {
    const filteredClubs = type ? clubs.filter(c => c.type === type) : clubs;
    return (
        <div className='space-y-4'>
            {filteredClubs.length > 0 ? filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
            )) : <div className="text-center text-muted-foreground p-8">Bu kategoride kulüp bulunmuyor.</div>}
        </div>
    )
  }

  const EventList = () => (
     <div className='space-y-4'>
        {sampleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
        ))}
         <div className="text-center text-muted-foreground pt-8">
            <p>Yakında daha fazla etkinlik burada olacak.</p>
        </div>
    </div>
  )
  
  const SchoolTypeTabs = ({ contentType }: { contentType: 'club' | 'event' }) => {
    const clubContent = (
      <>
        <TabsContent value="university" className="mt-4"><ClubList type="university" /></TabsContent>
        <TabsContent value="high-school" className="mt-4"><ClubList type="high-school" /></TabsContent>
      </>
    );

    const eventContent = (
       <>
        <TabsContent value="university" className="mt-4"><EventList /></TabsContent>
        <TabsContent value="high-school" className="mt-4 text-center text-muted-foreground py-8">Lise etkinlikleri yakında burada.</TabsContent>
      </>
    );

    return (
        <Tabs defaultValue="university" className='w-full mt-2'>
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="university">Üniversite</TabsTrigger>
                <TabsTrigger value="high-school">Lise</TabsTrigger>
            </TabsList>
            {contentType === 'club' ? clubContent : eventContent}
        </Tabs>
    );
  };

  const SubTabs = ({ contentType }: { contentType: 'club' | 'event' }) => {
    const clubListAll = <ClubList />;
    const eventListAll = <EventList />;
    const schoolTypeTabs = <SchoolTypeTabs contentType={contentType} />;

    return (
        <Tabs defaultValue="all" className='w-full mt-4' onValueChange={setActiveSubTab}>
            <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="country">Ülkemde</TabsTrigger>
                <TabsTrigger value="school">Okulumda</TabsTrigger>
                <TabsTrigger value="city">Şehrimde</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
                {['all'].includes(activeSubTab) ? schoolTypeTabs : (contentType === 'club' ? clubListAll : eventListAll)}
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
                    className="pl-10 bg-card"
                />
            </div>
            <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
                <ArrowDownUp className="h-4 w-4" />
            </Button>
      </div>

      <Tabs defaultValue="clubs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs">Kulüpler</TabsTrigger>
          <TabsTrigger value="events">Etkinlikler</TabsTrigger>
        </TabsList>
        <TabsContent value="clubs" className="mt-0">
            <SubTabs contentType="club" />
        </TabsContent>
        <TabsContent value="events" className="mt-0">
            <SubTabs contentType="event" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
