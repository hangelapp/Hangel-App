import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter } from 'lucide-react';
import Link from 'next/link';

const clubs = [
  { id: '1', name: 'BÜROCK - Boğaziçi Üniversitesi Rock Kulübü', university: 'Boğaziçi Üniversitesi', members: 125, points: 2500, avatarUrl: 'https://picsum.photos/seed/club1/200/200' },
  { id: '2', name: 'ODTÜ Eşli Danslar Topluluğu', university: 'Orta Doğu Teknik Üniversitesi', members: 210, points: 4200, avatarUrl: 'https://picsum.photos/seed/club2/200/200' },
  { id: '3', name: 'İTÜ Gönüllülük Kulübü', university: 'İstanbul Teknik Üniversitesi', members: 180, points: 3800, avatarUrl: 'https://picsum.photos/seed/club3/200/200' },
];

export default function StudentClubsPage() {
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

      <div className="space-y-4">
        {clubs.map((club) => (
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
              <div>
                <p><strong>{club.members}</strong> Üye</p>
                <p><strong>{club.points}</strong> Puan</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/admin/clubs/profile/${club.id}`}>Profili Gör</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
