'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Heart, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type NgoType = NGO['type'] | 'Tümü';

export default function NgosPage() {
    const db = useFirestore();
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'viewCount', direction: 'desc' });

    const ngosQuery = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, 'ngos');
    }, [db]);

    const { data: ngosData, isLoading } = useCollection<NGO>(ngosQuery);

    const filteredNgos = useMemo(() => {
        if (!ngosData) return [];
        // Pasif kuruluşları public listeden gizle
        let filtered = ngosData.filter(ngo => (ngo as any).status !== 'Pasif');

        if (typeFilter !== 'Tümü') {
            filtered = filtered.filter(ngo => ngo.type === typeFilter);
        }

        if (searchTerm) {
            const lowercased = searchTerm.toLowerCase();
            filtered = filtered.filter(ngo => 
                ngo.name.toLowerCase().includes(lowercased) || 
                ngo.category.toLowerCase().includes(lowercased)
            );
        }

        filtered.sort((a, b) => {
            if (sortConfig.key === 'viewCount') {
                const av = a.viewCount ?? 0;
                const bv = b.viewCount ?? 0;
                return sortConfig.direction === 'desc' ? bv - av : av - bv;
            }
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            return 0;
        });

        return filtered;
    }, [ngosData, typeFilter, searchTerm, sortConfig]);

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
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                    <Filter className="h-5 w-5" />
                </Button>
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
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1" title="Şeffaflık Puanı"><ShieldCheck className="h-3 w-3 text-primary" /> {ngo.transparencyScore ?? 0} Şeffaflık</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /> {ngo.stats?.donors || 0} Bağışçı</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ngo.stats?.volunteers || 0} Gönüllü</span>
                                </div>
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
