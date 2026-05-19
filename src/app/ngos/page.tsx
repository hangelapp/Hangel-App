'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Heart, Users, ShieldCheck, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { COLLECTIONS } from '@/firebase/collections';

type NgoType = NGO['type'] | 'Tümü';
type SortKey = 'viewCount' | 'name-asc' | 'name-desc' | 'transparency-desc' | 'donors-desc' | 'volunteers-desc';

export default function NgosPage() {
    const db = useFirestore();
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('viewCount');
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

    const ngosQuery = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, COLLECTIONS.ngos);
    }, [db]);

    const { data: ngosData, isLoading } = useCollection<NGO>(ngosQuery);

    const allCategories = useMemo(() => {
        if (!ngosData) return [];
        return Array.from(new Set(ngosData.map(n => n.category).filter(Boolean))).sort();
    }, [ngosData]);

    const filteredNgos = useMemo(() => {
        if (!ngosData) return [];
        // Demo / seed temizliği (PDF audit #1):
        //  - 'Pasif' statüsündeki kuruluşları gizle
        //  - isDemo=true ile işaretlenmiş kuruluşları gizle (backfill: runbook)
        //  - Adı "Demo"/"Test"/"Örnek" ile başlayan seed kayıtlarını gizle
        //  - joinDate yok ve tüm istatistikler 0 ise placeholder kabul et
        let filtered = ngosData.filter((raw) => {
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
    }, [ngosData, typeFilter, searchTerm, sortKey, categoryFilter]);

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
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNgos.map((ngo) => (
                        <Link key={ngo.id} href={`/ngos/${ngo.id}`}>
                            <Card className="transition-colors hover:bg-accent/50 p-3 cursor-pointer">
                                <div className="flex gap-3 items-center">
                                    <Avatar className="h-12 w-12 border shrink-0">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{ngo.name}</p>
                                        <p className="text-xs text-muted-foreground">{ngo.category}</p>
                                    </div>
                                </div>
                                {(() => {
                                    // PDF audit #1: tüm değerler 0 ise (demo / yeni kayıt) chip'leri gizle
                                    const transparency = ngo.transparencyScore ?? 0;
                                    const donors = ngo.stats?.donors ?? 0;
                                    const volunteers = ngo.stats?.volunteers ?? 0;
                                    if (transparency === 0 && donors === 0 && volunteers === 0) return null;
                                    return (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            {transparency > 0 && (
                                                <>
                                                    <span className="flex items-center gap-1" title="Şeffaflık Puanı"><ShieldCheck className="h-3 w-3 text-primary" /> {transparency} Şeffaflık</span>
                                                </>
                                            )}
                                            {donors > 0 && (
                                                <>
                                                    {transparency > 0 && <Separator orientation="vertical" className="h-3" />}
                                                    <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /> {donors} Bağışçı</span>
                                                </>
                                            )}
                                            {volunteers > 0 && (
                                                <>
                                                    {(transparency > 0 || donors > 0) && <Separator orientation="vertical" className="h-3" />}
                                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {volunteers} Gönüllü</span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
                                {ngo.memberOf && ngo.memberOf.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        <span className="text-[10px] text-muted-foreground self-center">Platformlar:</span>
                                        {ngo.memberOf.map((platform) => (
                                            <Badge key={platform} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{platform}</Badge>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

        </div>
    );
}
