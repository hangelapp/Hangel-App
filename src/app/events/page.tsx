'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ListFilter, Map, Search, Calendar, MapPin, X, Globe, MapPinned } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Event } from '@/lib/types';
import { format, parse, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { EventMapDialog } from '@/components/events/event-map-dialog';
import { COLLECTIONS } from '@/firebase/collections';

function EventsPageContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const [sortKey, setSortKey] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'Online' | 'Fiziksel'>('all');
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch events from Firestore
  const eventsRef = useMemoFirebase(() => collection(db, COLLECTIONS.events), [db]);
  const { data: firestoreEvents } = useCollection(eventsRef);
  const events = useMemo<Event[]>(() => (firestoreEvents ?? []) as Event[], [firestoreEvents]);

  // Filters from URL
  const categoryParam = searchParams.get('category');
  const monthParam = searchParams.get('month');
  const tagParam = searchParams.get('tag');

  // Dynamic filter options from data
  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.type))).filter(Boolean).sort(), [events]);
  const cities = useMemo(() => Array.from(new Set(events.map(e => e.location?.city))).filter(Boolean).sort(), [events]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter.length > 0) count++;
    if (locationTypeFilter !== 'all') count++;
    if (cityFilter.length > 0) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [typeFilter, locationTypeFilter, cityFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setTypeFilter([]);
    setLocationTypeFilter('all');
    setCityFilter([]);
    setDateFrom('');
    setDateTo('');
  };

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
             return event.type?.toLowerCase().includes(lowercasedTag) ||
                    event.organizer?.toLowerCase().includes(lowercasedTag) ||
                    event.location?.city?.toLowerCase().includes(lowercasedTag) ||
                    event.location?.district?.toLowerCase().includes(lowercasedTag);
        });
    }
    if (monthParam) {
        eventsToFilter = eventsToFilter.filter(event => format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'yyyy-MM') === monthParam);
    }

    // Filter by event type
    if (typeFilter.length > 0) {
      eventsToFilter = eventsToFilter.filter(event => typeFilter.includes(event.type));
    }

    // Filter by location type
    if (locationTypeFilter !== 'all') {
      eventsToFilter = eventsToFilter.filter(event => event.location?.type === locationTypeFilter);
    }

    // Filter by city
    if (cityFilter.length > 0) {
      eventsToFilter = eventsToFilter.filter(event => cityFilter.includes(event.location?.city));
    }

    // Filter by date range
    if (dateFrom) {
      const from = startOfDay(new Date(dateFrom));
      eventsToFilter = eventsToFilter.filter(event => {
        const eventDate = parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date());
        return !isBefore(eventDate, from);
      });
    }
    if (dateTo) {
      const to = endOfDay(new Date(dateTo));
      eventsToFilter = eventsToFilter.filter(event => {
        const eventDate = parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date());
        return !isAfter(eventDate, to);
      });
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
  }, [sortKey, searchTerm, categoryParam, monthParam, tagParam, typeFilter, locationTypeFilter, cityFilter, dateFrom, dateTo, events]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">Etkinlikler</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Etkinlik ara..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 relative" onClick={() => setIsFilterOpen(true)}>
            <Filter className="mr-2 h-4 w-4" /> Filtrele
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilterCount}</Badge>
            )}
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
          <Button variant="outline" onClick={() => setIsMapOpen(true)}>
            <Map className="mr-2 h-4 w-4" /> Harita
          </Button>
        </div>
      </div>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg font-black">Filtrele</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            {/* Event Type Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Etkinlik Türü</Label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map(type => (
                  <Button
                    key={type}
                    variant={typeFilter.includes(type) ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full text-xs h-8"
                    onClick={() => setTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                  >
                    {type}
                  </Button>
                ))}
                {eventTypes.length === 0 && <p className="text-xs text-muted-foreground">Henüz etkinlik verisi yok</p>}
              </div>
            </div>

            {/* Location Type Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Konum</Label>
              <div className="flex gap-2">
                {([['all', 'Tümü', MapPin], ['Fiziksel', 'Fiziksel', MapPinned], ['Online', 'Online', Globe]] as const).map(([value, label, Icon]) => (
                  <Button
                    key={value}
                    variant={locationTypeFilter === value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 rounded-full text-xs h-9"
                    onClick={() => setLocationTypeFilter(value)}
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" /> {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Şehir</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cities.map(city => (
                  <div key={city} className="flex items-center gap-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={cityFilter.includes(city)}
                      onCheckedChange={(checked) => {
                        setCityFilter(prev => checked ? [...prev, city] : prev.filter(c => c !== city));
                      }}
                    />
                    <label htmlFor={`city-${city}`} className="text-sm cursor-pointer">{city}</label>
                  </div>
                ))}
                {cities.length === 0 && <p className="text-xs text-muted-foreground">Henüz etkinlik verisi yok</p>}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tarih Aralığı</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Başlangıç</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Bitiş</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" /> Temizle
            </Button>
            <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
              Uygula ({sortedEvents.length})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <EventMapDialog open={isMapOpen} onOpenChange={setIsMapOpen} events={sortedEvents} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedEvents.map((event: Event) => {
          const detailHref = `/events/${event.slug || event.id}`;
          return (
            <Link key={event.id} href={detailHref} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[1.5rem]">
              <Card className="overflow-hidden flex flex-col h-full border-none shadow-md rounded-[1.5rem] hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative aspect-[210/297] w-full bg-muted block">
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
                  <h2 className="text-sm font-bold font-headline leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{event.name}</h2>
                  <p className="text-[10px] font-bold text-primary truncate">{event.organizer}</p>
                  <div className="space-y-1 pt-1 border-t border-dashed">
                    <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                        <Calendar className='h-3 w-3 text-primary'/>
                        <span>{format(parse(event.startDate, 'yyyy-MM-dd HH:mm', new Date()), 'dd MMM yy, HH:mm', {locale: tr})}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                        <MapPin className='h-3 w-3 text-primary'/>
                        <span className="truncate">{event.location?.type === 'Online' ? 'Online' : event.location?.city}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-3 pb-3 pt-0 mt-auto flex flex-col gap-2">
                  <div className="flex justify-between items-center w-full">
                    <div className="space-y-0">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Kapasite</p>
                        <p className="text-[10px] font-black">{event.capacity?.current}/{event.capacity?.max}</p>
                    </div>
                    <Button size="sm" className="rounded-lg font-black text-[10px] h-7 px-3 pointer-events-none">
                      İncele
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
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
