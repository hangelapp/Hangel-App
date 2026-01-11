import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, Percent } from 'lucide-react';
import Link from 'next/link';

const ngos = [
  { id: '1', name: 'TEMA Vakfı', category: 'Çevre', followers: 12500, volunteers: 8500, transparency: 95, avatarUrl: 'https://picsum.photos/seed/tema/200' },
  { id: '2', name: 'Ahbap Derneği', category: 'İnsani Yardım', followers: 50000, volunteers: 25000, transparency: 92, avatarUrl: 'https://picsum.photos/seed/ahbap/200' },
  { id: '3', name: 'LÖSEV', category: 'Sağlık', followers: 35000, volunteers: 15000, transparency: 88, avatarUrl: 'https://picsum.photos/seed/losev/200' },
];

export default function NgosPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="STK ara..." className="pl-10" />
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
        {ngos.map((ngo) => (
          <Card key={ngo.id}>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{ngo.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{ngo.category}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex items-center justify-center gap-1"><Heart className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.followers / 1000}k</strong> <span className='hidden sm:inline'>Takipçi</span></div>
                <div className="flex items-center justify-center gap-1"><Users className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.volunteers / 1000}k</strong> <span className='hidden sm:inline'>Gönüllü</span></div>
                <div className="flex items-center justify-center gap-1"><Percent className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.transparency}</strong> <span className='hidden sm:inline'>Şeffaflık</span></div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/stklar/${ngo.id}`}>Profili İncele</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
