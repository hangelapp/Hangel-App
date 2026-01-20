import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, Percent, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ngos } from '@/lib/data';

export default function NgosPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
            <p className="text-muted-foreground text-sm">Destekleyebileceğin STK'ları keşfet.</p>
        </div>
      <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="STK ara..."
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

      <div className="space-y-3">
        {ngos.map((ngo) => (
           <Link href={`/ngos/${ngo.id}`} key={ngo.id} className="block">
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="p-4 flex gap-4 items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                  <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-base">{ngo.name}</p>
                  <p className="text-sm text-muted-foreground">{ngo.category}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{ngo.stats.followers / 1000}k Takipçi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{ngo.stats.volunteers / 1000}k Gönüllü</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span>%{ngo.transparencyScore} Şeffaflık</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
