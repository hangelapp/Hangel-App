'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Users, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { studentClubs, schoolRepresentatives } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { University, School } from 'lucide-react';

const RepresentativeCard = ({ rep }: { rep: (typeof schoolRepresentatives)[0] }) => (
    <Card className="overflow-hidden">
      <Link href={`/admin/temsilciler/${rep.id}`}>
        <div className="p-4 flex items-center gap-4 hover:bg-accent transition-colors">
            <Avatar className="h-12 w-12">
                <AvatarImage src={rep.avatarUrl} alt={rep.name} />
                <AvatarFallback>{rep.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{rep.name}</p>
                <p className="text-sm text-muted-foreground">{rep.school}</p>
                <p className="text-xs text-muted-foreground">{rep.role}</p>
            </div>
        </div>
       </Link>
    </Card>
);


export default function StudentClubsPage() {
  const [clubs, setClubs] = useState(studentClubs);
  const [representatives, setRepresentatives] = useState(schoolRepresentatives);

  useEffect(() => {
    // This is to avoid hydration mismatch error
    setClubs(studentClubs.map(club => ({
      ...club,
      members: Math.floor(Math.random() * 200) + 50,
      points: Math.floor(Math.random() * 5000) + 1000
    })));
    setRepresentatives(schoolRepresentatives);
  }, []);

  const universityClubs = clubs.filter(c => c.type === 'university');
  const highSchoolClubs = clubs.filter(c => c.type === 'high-school');
  const universityReps = representatives.filter(r => r.type === 'university');
  const highSchoolReps = representatives.filter(r => r.type === 'high-school');

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Öğrenci Kulüpleri</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Kulüp, üniversite veya şehir ara..." className="pl-10" />
      </div>
       <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" /> Filtrele
          </Button>
          <Button variant="outline" className="flex-1">
            <ArrowDownUp className="mr-2 h-4 w-4" /> Sırala
          </Button>
        </div>

      <Tabs defaultValue="all-clubs" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all-clubs">Tümü</TabsTrigger>
          <TabsTrigger value="my-school">Okulumda</TabsTrigger>
          <TabsTrigger value="my-city">Şehrimde</TabsTrigger>
          <TabsTrigger value="representatives">Temsilciler</TabsTrigger>
          <TabsTrigger value="events">Etkinlikler</TabsTrigger>
        </TabsList>
        <TabsContent value="all-clubs" className="mt-4">
             <Tabs defaultValue="university" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="university">Üniversite</TabsTrigger>
                    <TabsTrigger value="highschool">Lise</TabsTrigger>
                </TabsList>
                 <TabsContent value="university" className="space-y-4 mt-4">
                    {universityClubs.map((club) => (
                        <Card key={club.id}>
                            <CardHeader>
                                <div className='flex items-center gap-4'>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={club.avatarUrl} alt={club.name} />
                                        <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{club.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{club.university}</p>
                                    </div>
                                </div>
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
                    ))}
                 </TabsContent>
                 <TabsContent value="highschool" className="space-y-4 mt-4">
                    {highSchoolClubs.map((club) => (
                         <Card key={club.id}>
                            <CardHeader>
                                <div className='flex items-center gap-4'>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={club.avatarUrl} alt={club.name} />
                                        <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{club.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{club.university}</p>
                                    </div>
                                </div>
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
                    ))}
                 </TabsContent>
             </Tabs>
        </TabsContent>
        <TabsContent value="my-school" className="text-center text-muted-foreground pt-8">Okulunuzda kayıtlı kulüp bulunamadı.</TabsContent>
        <TabsContent value="my-city" className="text-center text-muted-foreground pt-8">Şehrinizde kayıtlı kulüp bulunamadı.</TabsContent>
        <TabsContent value="representatives" className="mt-4">
            <Tabs defaultValue="university-reps" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="university-reps">Üniversite</TabsTrigger>
                    <TabsTrigger value="highschool-reps">Lise</TabsTrigger>
                    <TabsTrigger value="city-reps">Şehrimde</TabsTrigger>
                </TabsList>
                <TabsContent value="university-reps" className="space-y-4 mt-4">
                    {universityReps.map(rep => <RepresentativeCard key={rep.id} rep={rep} />)}
                </TabsContent>
                <TabsContent value="highschool-reps" className="space-y-4 mt-4">
                    {highSchoolReps.map(rep => <RepresentativeCard key={rep.id} rep={rep} />)}
                </TabsContent>
                <TabsContent value="city-reps" className="text-center text-muted-foreground pt-8">Şehrinizde temsilci bulunamadı.</TabsContent>
            </Tabs>
        </TabsContent>
         <TabsContent value="events" className="text-center text-muted-foreground pt-8">Yakında burada kulüp etkinliklerini görebileceksiniz.</TabsContent>
      </Tabs>
    </div>
  );
}
