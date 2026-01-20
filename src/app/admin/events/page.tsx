'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <CardFooter>
            <Button variant="secondary" className="w-full">Detayları Gör</Button>
        </CardFooter>
    </Card>
);

export default function StudentClubEventsPage() {
    const [activeSubTab, setActiveSubTab] = useState('all');

    const sampleEvents = [
        { id: '1', name: 'Girişimcilik Zirvesi \'24', club: 'İTÜ Girişimcilik Kulübü', clubId: '1', date: '25 Ekim 2024' },
        { id: '2', name: 'Sonbahar Konseri', club: 'Boğaziçi Üniversitesi Müzik Kulübü', clubId: '2', date: '15 Kasım 2024' },
        { id: '3', name: 'Fotoğraf Sergisi: "İstanbul\'un Renkleri"', club: 'Galatasaray Lisesi Sanat Kulübü', clubId: '3', date: '1-7 Aralık 2024' }
    ];

    const EventList = () => (
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
    );

    const SchoolTypeTabs = () => {
        return (
            <Tabs defaultValue="university" className='w-full mt-2'>
                <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value="university">Üniversite</TabsTrigger>
                    <TabsTrigger value="high-school">Lise</TabsTrigger>
                </TabsList>
                <TabsContent value="university" className="mt-4"><EventList /></TabsContent>
                <TabsContent value="high-school" className="mt-4 text-center text-muted-foreground py-8">Lise etkinlikleri yakında burada.</TabsContent>
            </Tabs>
        );
    };

    const SubTabs = () => {
        return (
            <Tabs defaultValue="all" className='w-full mt-4' onValueChange={setActiveSubTab}>
                <TabsList className='grid w-full grid-cols-4'>
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="country">Ülkemde</TabsTrigger>
                    <TabsTrigger value="school">Okulumda</TabsTrigger>
                    <TabsTrigger value="city">Şehrimde</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                     <SchoolTypeTabs />
                </TabsContent>
                <TabsContent value="country" className="mt-4">
                    <SchoolTypeTabs />
                </TabsContent>
                <TabsContent value="school" className="mt-4 text-center text-muted-foreground py-8">Okulunuzdaki içerik yakında burada.</TabsContent>
                <TabsContent value="city" className="mt-4 text-center text-muted-foreground py-8">Şehrinizdeki içerik yakında burada.</TabsContent>
            </Tabs>
        )
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in-0">
            <h1 className="text-2xl font-bold font-headline">Kulüp Etkinlikleri</h1>
            <div className="p-0 flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Etkinlik ara..."
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
            <SubTabs />
        </div>
    );
}
