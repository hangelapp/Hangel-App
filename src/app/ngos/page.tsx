'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp, Building2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { COLLECTIONS } from '@/firebase/collections';
import { NgoListItem } from '@/components/shared/ngo-list-item';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/components/providers/language-provider';

type NgoType = NGO['type'] | 'Tümü';
type SortKey = 'random' | 'viewCount' | 'name-asc' | 'name-desc' | 'transparency-desc' | 'donors-desc' | 'volunteers-desc';

export default function NgosPage() {
    const db = useFirestore();
    const { t } = useTranslation();
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [searchTerm, setSearchTerm] = useState('');
    // Kullanıcı talebi: her sayfa yüklemesinde STK listesi rastgele sıralı gelsin.
    const [sortKey, setSortKey] = useState<SortKey>('random');
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    // Random shuffle id sırası — useEffect içinde set edilir (hydration güvenli).
    const [randomOrder, setRandomOrder] = useState<string[]>([]);
    // Gerçek (ilişki bazlı) bağışçı/gönüllü sayıları — /api/ngos/engagement.
    const [realCounts, setRealCounts] = useState<Record<string, { donors: number; volunteers: number }>>({});

    const ngosQuery = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, COLLECTIONS.ngos);
    }, [db]);

    const { data: ngosData, isLoading } = useCollection<NGO>(ngosQuery);

    // Kartlardaki Bağışçı/Gönüllü için gerçek (kullanıcı ilişkisi bazlı) sayıları çek.
    // 30s aralıklı polling → "anlık" hissi (server tarafında zaten 30s cache var,
    // gereksiz Firestore okuması yapmaz).
    useEffect(() => {
        let active = true;
        const fetchCounts = () => {
            fetch('/api/ngos/engagement')
                .then(r => r.json())
                .then(d => { if (active && d?.ok && d.counts) setRealCounts(d.counts); })
                .catch(() => {});
        };
        fetchCounts();
        const t = setInterval(fetchCounts, 30_000);
        return () => { active = false; clearInterval(t); };
    }, []);

    // ngosData'yı gerçek sayılarla zenginleştir → hem sıralama hem görüntüleme tutarlı.
    const enrichedNgos = useMemo(() => {
        if (!ngosData) return [] as NGO[];
        return ngosData.map(n => {
            const rc = realCounts[n.id];
            if (!rc) return n;
            return { ...n, stats: { ...(n.stats ?? {}), donors: rc.donors, volunteers: rc.volunteers } } as NGO;
        });
    }, [ngosData, realCounts]);

    useEffect(() => {
        if (!ngosData || ngosData.length === 0) return;
        const ids = ngosData.map(n => n.id);
        // Fisher-Yates shuffle (mount + ngo set değişimi sonrası tetiklenir).
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        setRandomOrder(ids);
    }, [ngosData?.length]);
    const randomIndexMap = useMemo(() => {
        const m = new Map<string, number>();
        randomOrder.forEach((id, i) => m.set(id, i));
        return m;
    }, [randomOrder]);

    const allCategories = useMemo(() => {
        if (!ngosData) return [];
        return Array.from(new Set(ngosData.map(n => n.category).filter(Boolean))).sort();
    }, [ngosData]);

    const filteredNgos = useMemo(() => {
        if (!enrichedNgos.length) return [];
        // Demo / seed temizliği (PDF audit #1):
        //  - 'Pasif' statüsündeki kuruluşları gizle
        //  - isDemo=true ile işaretlenmiş kuruluşları gizle (backfill: runbook)
        //  - Adı "Demo"/"Test"/"Örnek" ile başlayan seed kayıtlarını gizle
        //  - joinDate yok ve tüm istatistikler 0 ise placeholder kabul et
        let filtered = enrichedNgos.filter((raw) => {
            const ngo = raw as NGO & { status?: string; isDemo?: boolean };
            if (ngo.status === 'Pasif') return false;
            // Taslak (ön kayıt / evrak yüklenmemiş) STK'lar herkese görünmez — sadece sahibi yönetir.
            if (ngo.status === 'taslak') return false;
            if (ngo.isDemo === true) return false;
            const nm = (ngo.name ?? '').trim().toLowerCase();
            if (nm.startsWith('demo ') || nm.startsWith('test ') || nm.startsWith('örnek ') || nm.startsWith('ornek ')) return false;
            const s = ngo.stats;
            const allZero = !s || ((s.donors ?? 0) === 0 && (s.volunteers ?? 0) === 0 && (s.followers ?? 0) === 0 && (s.totalDonation ?? 0) === 0);
            if (!ngo.joinDate && allZero) return false;
            return true;
        });

        if (typeFilter !== 'Tümü') {
            filtered = filtered.filter(ngo => ngo.type === typeFilter);
        }

        if (categoryFilter.length > 0) {
            filtered = filtered.filter(ngo => categoryFilter.includes(ngo.category));
        }

        if (searchTerm) {
            const lowercased = searchTerm.toLowerCase();
            filtered = filtered.filter(ngo =>
                ngo.name.toLowerCase().includes(lowercased) ||
                ngo.category.toLowerCase().includes(lowercased)
            );
        }

        filtered.sort((a, b) => {
            switch (sortKey) {
                case 'random': {
                    const ai = randomIndexMap.get(a.id);
                    const bi = randomIndexMap.get(b.id);
                    if (ai === undefined || bi === undefined) return 0;
                    return ai - bi;
                }
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'transparency-desc': return (b.transparencyScore ?? 0) - (a.transparencyScore ?? 0);
                case 'donors-desc': return (b.stats?.donors ?? 0) - (a.stats?.donors ?? 0);
                case 'volunteers-desc': return (b.stats?.volunteers ?? 0) - (a.stats?.volunteers ?? 0);
                case 'viewCount':
                default: return (b.viewCount ?? 0) - (a.viewCount ?? 0);
            }
        });

        return filtered;
    }, [enrichedNgos, typeFilter, searchTerm, sortKey, categoryFilter]);

    return (
        <div className="px-4 py-6 space-y-6 animate-in fade-in-0 bg-secondary/30 min-h-screen">
            <div className="space-y-1.5 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">{t('ngosPage.title')}</h1>
                <p className="text-muted-foreground text-[15px] leading-relaxed">{t('ngosPage.subtitle')}</p>
            </div>

            <div className="flex gap-2.5 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder={t('ngosPage.searchPlaceholder')}
                        className="pl-11 h-12 rounded-2xl text-[15px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl shrink-0 relative" aria-label={t('ngosPage.filterAria')}>
                            <Filter className="h-5 w-5" />
                            {categoryFilter.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {categoryFilter.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                        <DropdownMenuLabel>{t('ngosPage.filterByCategory')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allCategories.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">{t('ngosPage.noCategories')}</div>
                        )}
                        {allCategories.map(cat => (
                            <DropdownMenuCheckboxItem
                                key={cat}
                                checked={categoryFilter.includes(cat)}
                                // Çoklu seçim için menüyü açık tut (varsayılan: seçince kapanır)
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={(checked) => setCategoryFilter(prev =>
                                    checked ? [...prev, cat] : prev.filter(c => c !== cat)
                                )}
                            >{cat}</DropdownMenuCheckboxItem>
                        ))}
                        {categoryFilter.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setCategoryFilter([])} className="text-destructive">
                                    {t('ngosPage.clearFilters')}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl shrink-0" aria-label={t('ngosPageExtra.sortLabel')}>
                            <ArrowDownUp className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('ngosPageExtra.sortLabel')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortKey('random')}>{t('ngosPageExtra.sortRandom')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('viewCount')}>{t('ngosPageExtra.sortViewCount')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('transparency-desc')}>{t('ngosPageExtra.sortTransparency')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('donors-desc')}>{t('ngosPageExtra.sortDonors')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('volunteers-desc')}>{t('ngosPageExtra.sortVolunteers')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name-asc')}>{t('ngosPageExtra.sortNameAsc')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name-desc')}>{t('ngosPageExtra.sortNameDesc')}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="Tümü" className="w-full" onValueChange={(value) => setTypeFilter(value as NgoType)}>
                <TabsList className="grid w-full grid-cols-5 h-11 rounded-2xl p-1">
                    <TabsTrigger value="Tümü" className="rounded-xl text-xs sm:text-sm truncate">{t('ngosPageExtra.tabAll')}</TabsTrigger>
                    <TabsTrigger value="Dernek" className="rounded-xl text-xs sm:text-sm truncate">{t('ngosPageExtra.tabAssociation')}</TabsTrigger>
                    <TabsTrigger value="Vakıf" className="rounded-xl text-xs sm:text-sm truncate">{t('ngosPageExtra.tabFoundation')}</TabsTrigger>
                    <TabsTrigger value="Spor Kulübü" className="rounded-xl text-xs sm:text-sm truncate">{t('ngosPageExtra.tabSportClub')}</TabsTrigger>
                    <TabsTrigger value="Özel İzinli" className="rounded-xl text-xs sm:text-sm truncate">{t('ngosPageExtra.tabSpecialPermit')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Card key={i} variant="glass" className="h-36 rounded-3xl animate-pulse" />)}
                </div>
            ) : filteredNgos.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title={t('emptyStates.ngosTitle')}
                    description={t('emptyStates.ngosDesc')}
                    action={(searchTerm || typeFilter !== 'Tümü' || categoryFilter.length > 0) ? {
                        label: t('emptyStates.ngosAction'),
                        onClick: () => {
                            setSearchTerm('');
                            setTypeFilter('Tümü');
                            setCategoryFilter([]);
                        },
                    } : undefined}
                />
            ) : (
                <div className="space-y-3">
                    {filteredNgos.map((ngo) => (
                        <NgoListItem key={ngo.id} ngo={ngo} />
                    ))}
                </div>
            )}

        </div>
    );
}
