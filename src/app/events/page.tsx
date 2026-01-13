'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ListFilter, Map, Search, Calendar, MapPin } from 'lucide-react';
import { events } from '@/lib/data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">Etkinlikler</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Etkinlik ara..." className="pl-10 h-11" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Filter className="mr-2 h-4 w-4" /> Filtrele
          </Button>
          <Button variant="outline" className="flex-1">
            <ListFilter className="mr-2 h-4 w-4" /> Sırala
          </Button>
          <Button variant="outline">
            <Map className="mr-2 h-4 w-4" /> Harita
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative h-40 w-full">
              <Image src={event.imageUrl} alt={event.name} fill className="object-cover" data-ai-hint={event.imageHint}/>
            </div>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-bold font-headline">{event.name}</h2>
              <p className="text-sm font-medium text-muted-foreground">{event.organizer}</p>
              <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                <Calendar className='h-4 w-4'/>
                <span>{event.date}</span>
              </div>
               <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className='h-4 w-4'/>
                <span>{event.location}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {event.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Kapasite: {event.capacity.current} / {event.capacity.max}
              </p>
              <Button asChild variant="secondary">
                <Link href={`/events/${event.id}`}>Detayları Gör</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
