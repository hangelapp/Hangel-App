'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, ListFilter, Map, Search, Calendar, Calendar as CalendarIcon, MapPin, X, Globe, MapPinned } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';
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
import { collection, query } from 'firebase/firestore';
import { EventMapDialog } from '@/components/events/event-map-dialog';
import { EventCardCountdownBadge } from '@/components/events/event-countdown';
import { EmptyState } from '@/components/shared/empty-state';
import { COLLECTIONS } from '@/firebase/collections';
import { eventPhase } from '@/lib/event-time';

// Statuses that explicitly hide an event from the public listing.
// Everything else — including 'Yayında', 'Aktif', and legacy docs with no
// `status` field — is treated as a publicly visible (active) event.
const HIDDEN_EVENT_STATUSES = new Set(['Beklemede', 'Reddedildi', 'Pasif']);

// Tamamlanan etkinlik, tamamlanma anından sonra bu süre kadar "Etkinlik bitti"
// rozetiyle listede kalır; sonra düşer.
const COMPLETED_VISIBLE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 saat

// Boş/eksik etkinlik adı için kullanıcıya gösterilen yedek metin.
const EVENT_NAME_FALLBACK = 'Adsız etkinlik';

// Etkinlik startDate/endDate alanları "yyyy-MM-dd HH:mm", saatsiz "yyyy-MM-dd"
// veya (eski/legacy kayıtlarda) boş/undefined gelebilir. Güvenli parse: önce
// saatli, olmazsa saatsiz, olmazsa native Date dener; hiçbiri tutmazsa null döner.
// Böylece format() asla Invalid Date ile çağrılıp sayfayı çökertmez.
function parseEventDate(s?: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  let d = parse(trimmed, 'yyyy-MM-dd HH:mm', new Date());
  if (isNaN(d.getTime())) d = parse(trimmed, 'yyyy-MM-dd', new Date());
  if (isNaN(d.getTime())) {
    const native = new Date(trimmed);
    return isNaN(native.getTime()) ? null : native;
  }
  return d;
}

function formatEventDate(s?: string): string {
  const d = parseEventDate(s);
  if (!d) return '—';
  const hasTime = typeof s === 'string' && /\d{1,2}:\d{2}/.test(s);
  return format(d, hasTime ? 'dd MMM yy, HH:mm' : 'dd MMM yy', { locale: tr });
}

// `completedAt` Firestore Timestamp ({seconds}), ms (number) ya da ISO string
// olarak gelebilir. Hepsini ms'e çevirir; çözülemezse null döner.
function completedAtMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return seconds * 1000;
    }
  }
  return null;
}

// Tamamlanan bir etkinliğin "kapanış" anını ms olarak döndürür. Önce
// completedAt; yoksa endDate/startDate (yerel parse) yedeği kullanılır.
function completionTimeMs(e: { completedAt?: unknown; endDate?: string; startDate?: string }): number | null {
  const fromCompletedAt = completedAtMs(e.completedAt);
  if (fromCompletedAt != null) return fromCompletedAt;
  const fallback = parseEventDate(e.endDate) ?? parseEventDate(e.startDate);
  return fallback ? fallback.getTime() : null;
}

function EventsPageContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { t } = useTranslation();
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

  // Fetch ALL events, then filter client-side to surface every active one.
  // We deliberately avoid a server-side `where('status', '==', 'Yayında')` filter
  // because it silently dropped (a) legacy docs without a `status` field and
  // (b) docs created by club/org admins with `status === 'Aktif'`. Pending,
  // rejected and deactivated (Pasif) events stay hidden via HIDDEN_EVENT_STATUSES.
  const eventsRef = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.events)),
    [db],
  );
  const { data: firestoreEvents } = useCollection(eventsRef);
  const events = useMemo<Event[]>(() => {
    const now = Date.now();
    const all = (firestoreEvents ?? []) as (Event & { status?: string; completed?: boolean; completedAt?: unknown })[];
    return all.filter((e) => {
      // Gizli statüler her zaman listeden düşer.
      if (HIDDEN_EVENT_STATUSES.has(e.status ?? '')) return false;
      // Tamamlanan etkinlik, tamamlanma anından 24 saat boyunca "Etkinlik bitti"
      // rozetiyle listede kalır; sonra düşer. completedAt yoksa endDate/startDate
      // yedeği kullanılır; o da yoksa (zaman bilinmiyor) yeni bitmiş sayılıp tutulur.
      if (e.completed === true) {
        const completedMs = completionTimeMs(e);
        if (completedMs == null) return true;
        return now - completedMs < COMPLETED_VISIBLE_WINDOW_MS;
      }
      return true;
    }) as Event[];
  }, [firestoreEvents]);

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
        (event.name ?? '').toLowerCase().includes(lowercased) ||
        (event.organizer ?? '').toLowerCase().includes(lowercased)
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
        eventsToFilter = eventsToFilter.filter(event => {
          const d = parseEventDate(event.startDate);
          return d ? format(d, 'yyyy-MM') === monthParam : false;
        });
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
        const eventDate = parseEventDate(event.startDate);
        return eventDate ? !isBefore(eventDate, from) : false;
      });
    }
    if (dateTo) {
      const to = endOfDay(new Date(dateTo));
      eventsToFilter = eventsToFilter.filter(event => {
        const eventDate = parseEventDate(event.startDate);
        return eventDate ? !isAfter(eventDate, to) : false;
      });
    }

    // Sort
    return eventsToFilter.sort((a, b) => {
        if (sortKey === 'name') {
            return (a.name ?? '').localeCompare(b.name ?? '');
        }
        if (sortKey === 'capacity') {
            return ((b.capacity?.max ?? 0) - (b.capacity?.current ?? 0)) - ((a.capacity?.max ?? 0) - (a.capacity?.current ?? 0));
        }
        // Default sort by date
        const dateA = parseEventDate(a.startDate)?.getTime() ?? 0;
        const dateB = parseEventDate(b.startDate)?.getTime() ?? 0;
        return dateB - dateA;
    });
  }, [sortKey, searchTerm, categoryParam, monthParam, tagParam, typeFilter, locationTypeFilter, cityFilter, dateFrom, dateTo, events]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0 bg-secondary/30 backdrop-blur-sm min-h-screen">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline">{t('eventsPage.title')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder={t('eventsPage.searchPlaceholder')} className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 relative" onClick={() => setIsFilterOpen(true)}>
            <Filter className="mr-2 h-4 w-4" /> {t('eventsPage.filterButton')}
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilterCount}</Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                    <ListFilter className="mr-2 h-4 w-4" /> {t('eventsPageExtra.sortLabel')}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortKey('date')}>{t('eventsPageExtra.sortByDate')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('name')}>{t('eventsPageExtra.sortByName')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('capacity')}>{t('eventsPageExtra.sortByCapacity')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setIsMapOpen(true)}>
            <Map className="mr-2 h-4 w-4" /> {t('eventsPageExtra.mapLabel')}
          </Button>
        </div>
      </div>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg font-black">{t('eventsPageExtra.filterSheetTitle')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            {/* Event Type Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('eventsPageExtra.typeLabel')}</Label>
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
                {eventTypes.length === 0 && <p className="text-xs text-muted-foreground">{t('eventsPageExtra.noEventDataYet')}</p>}
              </div>
            </div>

            {/* Location Type Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('eventsPageExtra.locationLabel')}</Label>
              <div className="flex gap-2">
                {(['all', 'Fiziksel', 'Online'] as const).map(value => {
                  const label = value === 'all' ? t('eventsPageExtra.locAll') : value === 'Fiziksel' ? t('eventsPageExtra.locPhysical') : t('eventsPageExtra.locOnline');
                  const Icon = value === 'all' ? MapPin : value === 'Fiziksel' ? MapPinned : Globe;
                  return (
                    <Button
                      key={value}
                      variant={locationTypeFilter === value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 rounded-full text-xs h-9"
                      onClick={() => setLocationTypeFilter(value)}
                    >
                      <Icon className="mr-1.5 h-3.5 w-3.5" /> {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* City Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('eventsPageExtra.cityLabel')}</Label>
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
                {cities.length === 0 && <p className="text-xs text-muted-foreground">{t('eventsPageExtra.noEventDataYet')}</p>}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('eventsPageExtra.dateRangeLabel')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('eventsPageExtra.dateFromLabel')}</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('eventsPageExtra.dateToLabel')}</label>
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
              <X className="mr-2 h-4 w-4" /> {t('eventsPageExtra.clearLabel')}
            </Button>
            <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
              {t('eventsPageExtra.applyPrefix')} ({sortedEvents.length})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <EventMapDialog open={isMapOpen} onOpenChange={setIsMapOpen} events={sortedEvents} />

      {sortedEvents.length === 0 && (
        <EmptyState
          icon={CalendarIcon}
          title={t('emptyStates.eventsTitle')}
          description={(typeFilter.length > 0 || cityFilter.length > 0 || searchTerm)
            ? t('eventsPageExtra.noEventsFiltered')
            : t('emptyStates.eventsDesc')}
          action={(typeFilter.length > 0 || cityFilter.length > 0 || searchTerm) ? {
            label: t('eventsPageExtra.clearFiltersBtn'),
            onClick: () => { setTypeFilter([]); setCityFilter([]); setSearchTerm(''); },
          } : { label: t('emptyStates.eventsAction'), href: '/ngos' }}
        />
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedEvents.map((event: Event) => {
          const detailHref = `/events/${event.slug || event.id}`;
          const eventName = event.name || EVENT_NAME_FALLBACK;
          // Etkinlik bitti: ya tamamlandı olarak işaretli ya da bitiş zamanı geçti.
          const isEnded = (event as Event & { completed?: boolean }).completed === true || eventPhase(event) === 'ended';
          return (
            <Link key={event.id} href={detailHref} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[1.5rem]">
              <Card variant="glass" className="overflow-hidden flex flex-col h-full border-none shadow-md rounded-[1.5rem] hover:shadow-xl transition-shadow cursor-pointer">
                <div className="relative aspect-[210/297] w-full bg-muted block">
                  <Image
                    src={event.imageUrl}
                    alt={eventName}
                    fill
                    className={`object-cover${isEnded ? ' grayscale-[0.35]' : ''}`}
                    data-ai-hint="event poster a4"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-white/90 backdrop-blur-md text-primary border-none font-black uppercase text-[8px] tracking-widest px-2 py-0.5 rounded-lg shadow-sm">{event.type}</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    {isEnded
                      ? <Badge className="bg-foreground/85 backdrop-blur-md text-background border-none font-black uppercase text-[8px] tracking-widest px-2 py-0.5 rounded-lg shadow-sm">Etkinlik bitti</Badge>
                      : <EventCardCountdownBadge event={event} />}
                  </div>
                </div>
                <CardContent className="p-3 flex-1 space-y-2">
                  <h2 className="text-sm font-bold font-headline leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{eventName}</h2>
                  <p className="text-[10px] font-bold text-primary truncate">{event.organizer}</p>
                  <div className="space-y-1 pt-1 border-t border-dashed">
                    <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                        <Calendar className='h-3 w-3 text-primary'/>
                        <span>{formatEventDate(event.startDate)}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5">
                        <MapPin className='h-3 w-3 text-primary'/>
                        <span className="truncate">{event.location?.type === 'Online' ? t('eventsPageExtra.onlineLabel') : event.location?.city}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-3 pb-3 pt-0 mt-auto flex flex-col gap-2">
                  <div className="flex justify-between items-center w-full">
                    <div className="space-y-0">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{t('eventsPageExtra.capacityLabel')}</p>
                        <p className="text-[10px] font-black">{event.capacity?.current}/{event.capacity?.max}</p>
                    </div>
                    {isEnded ? (
                      <Button size="sm" variant="secondary" disabled className="rounded-lg font-black text-[10px] h-7 px-3 pointer-events-none opacity-60">
                        Bitti
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-lg font-black text-[10px] h-7 px-3 pointer-events-none">
                        {t('eventsPageExtra.inspectBtn')}
                      </Button>
                    )}
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

function EventsLoadingFallback() {
    const { t } = useTranslation();
    return <div>{t('eventsPageExtra.loadingFallback')}</div>;
}

export default function EventsPageWrapper() {
    return (
        <Suspense fallback={<EventsLoadingFallback />}>
            <EventsPageContent />
        </Suspense>
    )
}
