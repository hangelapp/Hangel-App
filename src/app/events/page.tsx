
'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ListFilter, Map, Search, Calendar, MapPin } from 'lucide-react';
import { events, studentClubs } from '@/lib/data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Event } from '@/lib/types';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

function EventsPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters from URL
  const categoryParam = searchParams.get('category');
  const universityParam = searchParams.get('university');
  const monthParam = searchParams.get('month');
  const tagParam = searchParams.get('tag');

  const sortedEvents = useMemo(() => {
    let eventsToFilter = [...events];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const lowercased = searchTerm.toLowerCase();
      eventsToFilter = eventsToFilter.filter(event => 
        event.name.toLowerCase().includes(lowercased) ||
        event.organizer.toLowerCase().includes(lowercased)
      );
    }
    
    // Filter by URL params
    const activeTag = categoryParam || tagParam;
    if (activeTag) {
        const lowercasedTag = activeTag.toLowerCase();
        eventsToFilter = eventsToFilter.filter(event => {
             const club = studentClubs.find(c => c.name === event.organizer);
             const organizerCategory = (club as any)?.category;
            
             return event.type.toLowerCase().includes(lowercasedTag) ||
                    (organizerCategory && organizerCategory.toLowerCase().includes(lowercasedTag)) ||
                    event.organizer.toLowerCase().includes(lowercasedTag) ||
                    event.location.city.toLowerCase().includes(lowercasedTag) ||
                    event.location.district.toLowerCase().includes(lowercasedTag);
        });
    }
    if (universityParam) {
        eventsToFilter = eventsToFilter.filter(event => {
            const club = studentClubs.find(c => c.name === event.organizer);
            return (club as any)?.university === universityParam;
        });
    }
    if (monthParam) {
        eventsToFilter = eventsToFilter.filter(event => format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'yyyy-MM') === monthParam);
    }


    // Sort
    return eventsToFilter.sort((a, b) => {
        if (sortKey === 'name') {
            return a.name.localeCompare(b.name);
        }
        if (sortKey === 'capacity') {
            return (b.capacity.max - b.capacity.current) - (a.capacity.max - a.capacity.current);
        }
        // Default sort by date
        const dateA = parse(a.startDate, 'yyyy-MM-dd HH:mm', new Date()).getTime();
        const dateB = parse(b.startDate, 'yyyy-MM-dd HH:mm', new Date()).getTime();
        return dateB - dateA;
    });
  }, [sortKey, searchTerm, categoryParam, universityParam, monthParam, tagParam]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">Etkinlikler</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Etkinlik ara..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => toast({ title: 'Filtreleme özelliği yakında gelecek!'})}>
            <Filter className="mr-2 h-4 w-4" /> Filtrele
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                    <ListFilter className="mr-2 h-4 w-4" /> Sırala
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortKey('date')}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre (A-Z)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('capacity')}>Kalan Kapasite</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => toast({ title: 'Harita özelliği yakında gelecek!'})}>
            <Map className="mr-2 h-4 w-4" /> Harita
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event: Event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative h-40 w-full">
              <Image src={event.imageUrl} alt={event.name} fill className="object-cover" data-ai-hint={event.imageHint}/>
            </div>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-bold font-headline">{event.name}</h2>
              <p className="text-sm font-medium text-muted-foreground">{event.organizer}</p>
              <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                <Calendar className='h-4 w-4'/>
                <span>{format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'dd MMMM, HH:mm', {locale: tr})}</span>
              </div>
               <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className='h-4 w-4'/>
                <span>{event.location.type === 'Online' ? 'Online' : `${event.location.city}, ${event.location.district}`}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">{event.type}</Badge>
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

export default function EventsPageWrapper() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <EventsPageContent />
        </Suspense>
    )
}
