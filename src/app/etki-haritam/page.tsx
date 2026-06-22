'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Loader2, MapPin, CalendarHeart, HandHeart, Sparkles, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useUser, useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { lookupCityCoords } from '@/lib/turkey-city-coords';
import { cn } from '@/lib/utils';
import type { CityImpact } from '@/components/impact/impact-map';

// Leaflet window'a erişir → SSR'da yüklenemez. Proje genel deseni: dynamic + ssr:false.
const ImpactMap = dynamic(
  () => import('@/components/impact/impact-map').then((m) => m.ImpactMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

/** Bir şehir/katkı türü kırılımı taşıyan ara birim. */
type Contribution = {
  city: string;
  kind: 'event' | 'volunteering' | 'donation';
  title: string;
  subtitle?: string;
};

/** Diziyi n'erli parçalara böler (Firestore `in` sorgusu 10 ile sınırlı). */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Bilinen TR il adlarına normalize eder (lookupCityCoords zaten case-insensitive). */
function normalizeCity(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Koordinatı çözülebiliyorsa geçerli bir TR ili kabul et.
  return lookupCityCoords(trimmed) ? trimmed : null;
}

export default function EtkiHaritamPage() {
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!db || !authUser) {
      if (!isUserLoading) setLoading(false);
      return;
    }

    async function aggregate(uid: string): Promise<Contribution[]> {
      const result: Contribution[] = [];

      // 1) Etkinlik katılımları — collectionGroup('rsvps') + parent event id.
      const eventIds = new Set<string>();
      try {
        const rsvpSnap = await getDocs(
          query(
            collectionGroup(db, COLLECTIONS.eventRsvps),
            where('userId', '==', uid),
            where('status', '==', 'going'),
          ),
        );
        rsvpSnap.forEach((d) => {
          const parentEventId = d.ref.parent.parent?.id;
          if (parentEventId) eventIds.add(parentEventId);
        });
      } catch {
        /* izin/sorgu hatası → bu kaynak atlanır, sayfa boş düşmez */
      }

      // 2) Onaylı gönüllülük tamamlamaları — taskId (event VEYA volunteering id).
      const completionTaskIds = new Set<string>();
      try {
        const compSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.volunteerCompletions),
            where('userId', '==', uid),
          ),
        );
        compSnap.forEach((d) => {
          const data = d.data() as { taskId?: string; ngoApproved?: boolean };
          if (data.ngoApproved === true && data.taskId) completionTaskIds.add(data.taskId);
        });
      } catch {
        /* atlanır */
      }

      // 3) Bağışlar — ngoIds üzerinden STK şehrine bağla.
      const donationNgoIds = new Set<string>();
      const donationByNgo = new Map<string, { brand: string }>();
      try {
        const donSnap = await getDocs(
          query(collection(db, COLLECTIONS.donations), where('userId', '==', uid)),
        );
        donSnap.forEach((d) => {
          const data = d.data() as { ngoIds?: string[]; brand?: string; type?: string };
          if (data.type && data.type !== 'expense') return;
          const ids = Array.isArray(data.ngoIds) ? data.ngoIds : [];
          for (const nid of ids) {
            if (typeof nid === 'string' && nid) {
              donationNgoIds.add(nid);
              if (!donationByNgo.has(nid)) donationByNgo.set(nid, { brand: data.brand || 'Markalı bağış' });
            }
          }
        });
      } catch {
        /* atlanır */
      }

      // --- Referans dokümanları toplu çek (chunk'lı `in` sorguları) ---
      const fetchByIds = async (
        collName: string,
        ids: string[],
      ): Promise<Map<string, Record<string, unknown>>> => {
        const map = new Map<string, Record<string, unknown>>();
        for (const part of chunk(ids, 10)) {
          if (part.length === 0) continue;
          try {
            const snap = await getDocs(
              query(collection(db, collName), where(documentId(), 'in', part)),
            );
            snap.forEach((d) => map.set(d.id, d.data() as Record<string, unknown>));
          } catch {
            /* atlanır */
          }
        }
        return map;
      };

      // Etkinlikler: hem rsvp event id'leri hem (taskId event olabilir) için çek.
      const allEventIds = Array.from(new Set([...eventIds, ...completionTaskIds]));
      const allVolunteeringIds = Array.from(completionTaskIds);

      const [eventDocs, volunteeringDocs, ngoDocs] = await Promise.all([
        fetchByIds(COLLECTIONS.events, allEventIds),
        fetchByIds(COLLECTIONS.volunteering, allVolunteeringIds),
        fetchByIds(COLLECTIONS.ngos, Array.from(donationNgoIds)),
      ]);

      const cityFromLocation = (doc?: Record<string, unknown>): string | null => {
        const loc = doc?.location as { city?: string } | undefined;
        return normalizeCity(loc?.city);
      };

      // Etkinlik katkıları (rsvp).
      for (const eid of eventIds) {
        const ev = eventDocs.get(eid);
        const city = cityFromLocation(ev);
        if (!city) continue;
        result.push({
          city,
          kind: 'event',
          title: (ev?.name as string) || 'Etkinlik',
          subtitle: (ev?.organizer as string) || undefined,
        });
      }

      // Gönüllülük katkıları (onaylı completion → volunteering ya da event).
      for (const tid of completionTaskIds) {
        const vol = volunteeringDocs.get(tid);
        const ev = eventDocs.get(tid);
        const city = cityFromLocation(vol) || cityFromLocation(ev);
        if (!city) continue;
        result.push({
          city,
          kind: 'volunteering',
          title: (vol?.title as string) || (ev?.name as string) || 'Gönüllülük',
          subtitle:
            (vol?.organization as string) || (ev?.organizer as string) || undefined,
        });
      }

      // Bağış katkıları (STK şehri).
      for (const nid of donationNgoIds) {
        const ngo = ngoDocs.get(nid);
        const contact = ngo?.contact as { address?: { city?: string } } | undefined;
        const city = normalizeCity(contact?.address?.city);
        if (!city) continue;
        result.push({
          city,
          kind: 'donation',
          title: (ngo?.name as string) || 'STK',
          subtitle: donationByNgo.get(nid)?.brand,
        });
      }

      return result;
    }

    setLoading(true);
    aggregate(authUser.uid)
      .then((res) => {
        if (!cancelled) setContributions(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db, authUser, isUserLoading]);

  // Şehir bazında yoğunluk + kırılım.
  const cities: CityImpact[] = useMemo(() => {
    const map = new Map<string, CityImpact>();
    for (const c of contributions) {
      const coords = lookupCityCoords(c.city);
      if (!coords) continue;
      let entry = map.get(c.city);
      if (!entry) {
        entry = { city: c.city, coords, total: 0, events: 0, volunteering: 0, donations: 0 };
        map.set(c.city, entry);
      }
      entry.total += 1;
      if (c.kind === 'event') entry.events += 1;
      else if (c.kind === 'volunteering') entry.volunteering += 1;
      else entry.donations += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [contributions]);

  const totals = useMemo(() => {
    let events = 0;
    let volunteering = 0;
    let donations = 0;
    for (const c of contributions) {
      if (c.kind === 'event') events += 1;
      else if (c.kind === 'volunteering') volunteering += 1;
      else donations += 1;
    }
    return { events, volunteering, donations, total: contributions.length };
  }, [contributions]);

  const selectedContributions = useMemo(
    () => (selectedCity ? contributions.filter((c) => c.city === selectedCity) : []),
    [contributions, selectedCity],
  );

  const cityCount = cities.length;

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="p-4">
        <EmptyState
          icon={MapPin}
          title="Etki haritan seni bekliyor"
          description="İz bıraktığın şehirleri haritada görmek için giriş yap."
          action={{ label: 'Giriş yap', href: '/login' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in-0 p-4 space-y-5">
      {/* Başlık */}
      <header className="space-y-1.5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Etki Haritan
        </div>
        <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl">
          Senin etki haritan
        </h1>
        <p className="text-muted-foreground">
          {cityCount > 0
            ? `${cityCount} şehirde iz bıraktın.`
            : 'Henüz haritana düşen bir iz yok — ilk katkın burada parlayacak.'}
        </p>
      </header>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={MapPin} label="Şehir" value={cityCount} accent />
        <StatCard icon={CalendarHeart} label="Etkinlik" value={totals.events} />
        <StatCard icon={HandHeart} label="Gönüllülük" value={totals.volunteering} />
        <StatCard icon={Gift} label="Bağış" value={totals.donations} />
      </div>

      {cityCount === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Haritan henüz boş"
          description="Bir etkinliğe katıl, gönüllü ol ya da markalı bağış yap; bıraktığın iz şehir şehir burada belirsin."
          action={{ label: 'Etkinlikleri keşfet', href: '/events' }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Harita */}
          <Card className="overflow-hidden rounded-3xl border-border/60">
            <CardContent className="p-0">
              <div className="h-[50dvh] min-h-[360px] w-full sm:h-[60dvh]">
                <ImpactMap
                  cities={cities}
                  selectedCity={selectedCity}
                  onSelectCity={(city) => setSelectedCity(city)}
                />
              </div>
              {/* Coral yoğunluk skalası lejantı */}
              <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                <span className="text-xs text-muted-foreground">Az iz</span>
                <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#ffd6c8] via-[#f89068] to-[#c43012]" />
                <span className="text-xs text-muted-foreground">Çok iz</span>
              </div>
            </CardContent>
          </Card>

          {/* Şehir listesi + seçili şehir kırılımı */}
          <div className="space-y-3">
            <Card className="rounded-3xl border-border/60">
              <CardContent className="p-2">
                <ul className="divide-y divide-border/60">
                  {cities.map((c) => (
                    <li key={c.city}>
                      <button
                        type="button"
                        onClick={() => setSelectedCity(c.city)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                          selectedCity === c.city ? 'bg-primary/10' : 'hover:bg-accent/60',
                        )}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: '#f34723', opacity: 0.55 + 0.45 * (c.total / (cities[0]?.total || 1)) }}
                          />
                          <span className="truncate text-sm font-semibold text-foreground">{c.city}</span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {c.total} katkı
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {selectedCity && (
              <Card className="rounded-3xl border-border/60">
                <CardContent className="space-y-2.5 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold">{selectedCity}</h2>
                  </div>
                  <ul className="space-y-2">
                    {selectedContributions.map((c, i) => (
                      <li key={`${c.kind}-${i}`} className="flex items-start gap-2.5">
                        <ContributionIcon kind={c.kind} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                          {c.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className={cn('rounded-2xl border-border/60', accent && 'border-primary/30 bg-primary/5')}>
      <CardContent className="flex items-center gap-3 p-3.5">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            accent ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground',
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ContributionIcon({ kind }: { kind: Contribution['kind'] }) {
  const map = {
    event: { Icon: CalendarHeart, cls: 'bg-rose-500/15 text-rose-600' },
    volunteering: { Icon: HandHeart, cls: 'bg-primary/15 text-primary' },
    donation: { Icon: Gift, cls: 'bg-emerald-500/15 text-emerald-600' },
  } as const;
  const { Icon, cls } = map[kind];
  return (
    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', cls)}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
