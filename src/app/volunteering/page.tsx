import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ListFilter, Search } from 'lucide-react';
import { volunteeringOpportunities } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

export default function VolunteeringPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">Gönüllülük</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="İlan, yetkinlik veya STK ara..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" /> Filtrele
          </Button>
          <Button variant="outline" className="flex-1">
            <ListFilter className="mr-2 h-4 w-4" /> Sırala
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {volunteeringOpportunities.map((opp) => (
          <Card key={opp.id}>
            <CardHeader>
              <CardTitle className="text-lg">{opp.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{opp.organization}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <span className="font-semibold">Konum:</span> {opp.location}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Süre:</span> {opp.commitment}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {opp.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Başvur</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
