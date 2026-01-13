import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, Percent } from 'lucide-react';
import Link from 'next/link';
import { ngos } from '@/lib/data';

export default function NgosPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
      <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="STK ara..."
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
                        <CardTitle className="text-base">{ngo.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{ngo.category}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex items-center justify-center gap-1"><Heart className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.stats.followers / 1000}k</strong> <span className='hidden sm:inline'>Takipçi</span></div>
                <div className="flex items-center justify-center gap-1"><Users className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.stats.volunteers / 1000}k</strong> <span className='hidden sm:inline'>Gönüllü</span></div>
                <div className="flex items-center justify-center gap-1"><Percent className="h-4 w-4 text-muted-foreground"/> <strong>{ngo.transparencyScore}</strong> <span className='hidden sm:inline'>Şeffaflık</span></div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/ngos/${ngo.id}`}>Profili İncele</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
