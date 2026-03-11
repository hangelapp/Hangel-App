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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedEvents.map((event: Event) => (
          <Card key={event.id} className="overflow-hidden flex flex-col h-full border-none shadow-md rounded-[1.5rem] hover:shadow-xl transition-shadow">
            <div className="relative aspect-[210/297] w-full bg-muted">
              <Image 
                src={event.imageUrl} 
                alt={event.name} 
                fill 
                className="object-cover" 
                data-ai-hint="event poster a4"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-white/90 backdrop-blur-md text-primary border-none font-black uppercase text-[8px] tracking-widest px-2 py-0.5 rounded-lg shadow-sm">{event.type}</Badge>
              </div>
            </div>
            <CardContent className="p-3 flex-1 space-y-2">
              <h2 className="text-sm font-bold font-headline leading-tight line-clamp-2 min-h-[2.5rem]">{event.name}</h2>
              <p className="text-[10px] font-bold text-primary truncate">{event.organizer}</p>
              <div className="space-y-1 pt-1 border-t border-dashed">
                <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                    <Calendar className='h-3 w-3 text-primary'/>
                    <span>{format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'dd MMM yy, HH:mm', {locale: tr})}</span>
                </div>
                <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                    <MapPin className='h-3 w-3 text-primary'/>
                    <span className="truncate">{event.location.type === 'Online' ? 'Online' : event.location.city}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-3 pb-3 pt-0 mt-auto flex flex-col gap-2">
              <div className="flex justify-between items-center w-full">
                <div className="space-y-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Kapasite</p>
                    <p className="text-[10px] font-black">{event.capacity.current}/{event.capacity.max}</p>
                </div>
                <Button asChild size="sm" className="rounded-lg font-black text-[10px] h-7 px-3">
                    <Link href={`/events/${event.slug}`}>İncele</Link>
                </Button>
              </div>
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
