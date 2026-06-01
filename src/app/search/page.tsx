'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search as SearchIcon, ArrowLeft, X, HeartHandshake, Store, Calendar, GraduationCap, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

interface SearchableEntity {
    id: string;
    name?: string;
    avatarUrl?: string;
    logoUrl?: string;
    files?: { logo?: string };
    description?: string;
    title?: string;
    location?: { city?: string };
    organizer?: string;
    organization?: string;
    type?: string;
}

const RECENT_KEY = 'hangel-recent-searches';

export default function GlobalSearchPage() {
    return (
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <GlobalSearchPageInner />
        </Suspense>
    );
}

function GlobalSearchPageInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initialQ = params.get('q') || '';
    const [q, setQ] = useState(initialQ);
    const [recent, setRecent] = useState<string[]>([]);
    const db = useFirestore();

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_KEY);
            if (stored) setRecent(JSON.parse(stored).slice(0, 8));
        } catch { /* noop */ }
    }, []);

    const saveRecent = (term: string) => {
        if (!term.trim()) return;
        const next = [term, ...recent.filter(r => r !== term)].slice(0, 8);
        setRecent(next);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
    };

    const ngosRef = useMemoFirebase(() => db ? query(collection(db, COLLECTIONS.ngos)) : null, [db]);
    const brandsRef = useMemoFirebase(() => db ? query(collection(db, COLLECTIONS.brands)) : null, [db]);
    const clubsRef = useMemoFirebase(() => db ? query(collection(db, COLLECTIONS.clubs)) : null, [db]);
    const eventsRef = useMemoFirebase(() => db ? query(collection(db, COLLECTIONS.events)) : null, [db]);
    const oppsRef = useMemoFirebase(() => db ? query(collection(db, COLLECTIONS.volunteering)) : null, [db]);

    const { data: ngos } = useCollection<SearchableEntity>(ngosRef);
    const { data: brands } = useCollection<SearchableEntity>(brandsRef);
    const { data: clubs } = useCollection<SearchableEntity>(clubsRef);
    const { data: events } = useCollection<SearchableEntity>(eventsRef);
    const { data: opps } = useCollection<SearchableEntity>(oppsRef);

    const term = q.trim().toLowerCase();
    const filter = (items: SearchableEntity[] | null | undefined): SearchableEntity[] => {
        if (!items || !term) return [];
        return items.filter(i => {
            const name = (i.name || i.title || '').toLowerCase();
            const desc = (i.description || '').toLowerCase();
            return name.includes(term) || desc.includes(term);
        }).slice(0, 8);
    };

    const ngoResults = useMemo(() => filter(ngos), [ngos, term]);
    const brandResults = useMemo(() => filter(brands), [brands, term]);
    const clubResults = useMemo(() => filter(clubs), [clubs, term]);
    const eventResults = useMemo(() => filter(events), [events, term]);
    const oppResults = useMemo(() => filter(opps), [opps, term]);

    const totalResults = ngoResults.length + brandResults.length + clubResults.length + eventResults.length + oppResults.length;

    const getLogo = (i: SearchableEntity) => i.files?.logo || i.logoUrl || i.avatarUrl;

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
                <div className="container mx-auto px-3 h-14 flex items-center gap-2 max-w-3xl">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Geri">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="STK, marka, kulüp, etkinlik, gönüllülük ara..."
                            className="pl-9 pr-8 h-10"
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(q); }}
                        />
                        {q && (
                            <button
                                type="button"
                                onClick={() => setQ('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                                aria-label="Temizle"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-3 py-4 max-w-3xl space-y-4">
                {!term && recent.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Son Aramalar</h2>
                            <button
                                type="button"
                                onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ } }}
                                className="text-[11px] text-primary hover:underline"
                            >
                                Temizle
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recent.map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => { setQ(r); saveRecent(r); }}
                                    className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/70"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!term && recent.length === 0 && (
                    <div className="text-center py-16 space-y-3 text-muted-foreground">
                        <SearchIcon className="h-12 w-12 mx-auto opacity-30" />
                        <p className="text-sm">STK, marka, kulüp, etkinlik veya gönüllülük ilanı ara.</p>
                    </div>
                )}

                {term && totalResults === 0 && (
                    <div className="text-center py-12 space-y-2">
                        <p className="text-sm font-bold">Sonuç bulunamadı</p>
                        <p className="text-xs text-muted-foreground">&quot;{q}&quot; için eşleşen STK, marka, kulüp, etkinlik veya ilan yok.</p>
                    </div>
                )}

                {ngoResults.length > 0 && (
                    <Section icon={HeartHandshake} title="STK'lar" items={ngoResults} hrefPrefix="/ngos" getLogo={getLogo} />
                )}
                {brandResults.length > 0 && (
                    <Section icon={Store} title="Markalar" items={brandResults} hrefPrefix="/market" getLogo={getLogo} />
                )}
                {clubResults.length > 0 && (
                    <Section icon={GraduationCap} title="Öğrenci Kulüpleri" items={clubResults} hrefPrefix="/clubs/profile" getLogo={getLogo} />
                )}
                {eventResults.length > 0 && (
                    <Section icon={Calendar} title="Etkinlikler" items={eventResults} hrefPrefix="/events" getLogo={getLogo} />
                )}
                {oppResults.length > 0 && (
                    <Section icon={Users} title="Gönüllülük İlanları" items={oppResults} hrefPrefix="/volunteering" getLogo={getLogo} />
                )}
            </main>
        </div>
    );
}

function Section({ icon: Icon, title, items, hrefPrefix, getLogo }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    items: SearchableEntity[];
    hrefPrefix: string;
    getLogo: (i: SearchableEntity) => string | undefined;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span>{title}</span>
                <span className="text-muted-foreground/60">({items.length})</span>
            </div>
            <div className="space-y-1.5">
                {items.map(item => {
                    const name = item.name || item.title || 'İsimsiz';
                    return (
                        <Link key={item.id} href={`${hrefPrefix}/${item.id}`} className="block">
                            <Card className="hover:bg-accent transition-colors">
                                <CardContent className="p-2.5 flex items-center gap-2.5">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={getLogo(item)} alt={name} />
                                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 leading-tight">
                                        <p className="font-semibold text-sm truncate leading-tight">{name}</p>
                                        {item.location?.city && (
                                            <p className="text-[11px] text-muted-foreground truncate leading-tight">{item.location.city}</p>
                                        )}
                                        {(item.organizer || item.organization) && (
                                            <p className="text-[11px] text-muted-foreground truncate leading-tight">{item.organizer || item.organization}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
