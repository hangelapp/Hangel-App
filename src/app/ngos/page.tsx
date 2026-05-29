'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { COLLECTIONS } from '@/firebase/collections';
import { NgoListItem } from '@/components/shared/ngo-list-item';

type NgoType = NGO['type'] | 'Tümü';
type SortKey = 'random' | 'viewCount' | 'name-asc' | 'name-desc' | 'transparency-desc' | 'donors-desc' | 'volunteers-desc';

export default function NgosPage() {
    const db = useFirestore();
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
    useEffect(() => {
        let active = true;
        fetch('/api/ngos/engagement')
            .then(r => r.json())
            .then(d => { if (active && d?.ok && d.counts) setRealCounts(d.counts); })
            .catch(() => {});
        return () => { active = false; };
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
        <div className="p-4 space-y-4 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
                <p className="text-muted-foreground text-sm">Gerçek zamanlı veritabanı üzerinden listeleniyor.</p>
            </div>
            
            <div className="flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="STK ara..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative" aria-label="Filtrele">
                            <Filter className="h-5 w-5" />
                            {categoryFilter.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {categoryFilter.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                        <DropdownMenuLabel>Kategoriye Göre Filtrele</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allCategories.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">Henüz kategori yok</div>
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
                                    Filtreleri Temizle
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Sırala">
                            <ArrowDownUp className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortKey('random')}>Karışık (varsayılan)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('viewCount')}>En Çok Görüntülenen</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('transparency-desc')}>En Yüksek Şeffaflık</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('donors-desc')}>En Çok Bağışçı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('volunteers-desc')}>En Çok Gönüllü</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name-asc')}>İsme Göre (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name-desc')}>İsme Göre (Z-A)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="Tümü" className="w-full" onValueChange={(value) => setTypeFilter(value as NgoType)}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="Tümü">Tümü</TabsTrigger>
                    <TabsTrigger value="Dernek">Dernek</TabsTrigger>
                    <TabsTrigger value="Vakıf">Vakıf</TabsTrigger>
                    <TabsTrigger value="Spor Kulübü">Spor</TabsTrigger>
                    <TabsTrigger value="Özel İzinli">Özel</TabsTrigger>
                </TabsList>
            </Tabs>

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredNgos.map((ngo) => (
                        <NgoListItem key={ngo.id} ngo={ngo} />
                    ))}
                </div>
            )}

        </div>
    );
}
