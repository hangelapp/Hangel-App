'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { studentClubs } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClubCard = ({ club }: { club: (typeof studentClubs)[0] }) => (
    <Card key={club.id}>
        <CardHeader className="flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={club.avatarUrl} alt={club.name} />
                <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-base hover:underline">
                    <Link href={`/admin/clubs/profile/${club.id}`}>{club.name}</Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{club.university}</p>
            </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> <strong>{club.members}</strong> Üye</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><BrainCircuit className="h-4 w-4" /> <strong>{club.points}</strong> Puan</div>
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`/admin/clubs/profile/${club.id}`}>Profili Gör</Link>
            </Button>
        </CardFooter>
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
                    placeholder="Kulüp ara..."
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
