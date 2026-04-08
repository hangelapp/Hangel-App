'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, ShieldCheck, X, Info, HandCoins } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type NgoType = NGO['type'] | 'Tümü';
type LocationFilter = 'global' | 'country' | 'city';

const NgoDetailView = ({ ngo }: { ngo: NGO; }) => {
    const [profileUrl, setProfileUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
          setProfileUrl(window.location.href);
        }
    }, []);
    
    const transparencyCriteria = [
        { name: 'Faaliyet Belgesi', completed: true },
        { name: 'Tüzük / Vakıf Senedi', completed: true },
        { name: 'Yıllık Faaliyet Raporu', completed: true },
    ];
    
    return (
        <div className="animate-in fade-in-0">
            <div className="relative h-48 w-full bg-muted">
                {ngo.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                 <div className="absolute top-4 right-4 z-10">
                    <ShareButtons url={profileUrl} title={`Hangel'deki ${ngo.name} profilini incele!`} />
                </div>
            </div>
            <div className="p-4 bg-background">
                <div className="flex gap-4 items-end -mt-16">
                    <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white shadow-lg">
                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-2"/>
                        <AvatarFallback>{ngo.name.slice(0,2)}</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="mt-4 space-y-2">
                    <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
                    <p className="text-muted-foreground text-sm capitalize">{ngo.category}</p>
                </div>
                 <div className="flex gap-2 mt-4">
                    <Button className="flex-1">
                        <Heart className="mr-2 h-4 w-4" /> Takip Et
                    </Button>
                    <Button variant="outline" className="flex-1">
                        Bağışçı Ol
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="about" className="w-full p-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">Hakkında</TabsTrigger>
                    <TabsTrigger value="transparency">Şeffaflık</TabsTrigger>
                    <TabsTrigger value="stats">Veriler</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Kuruluş Hakkında</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                           <p>{ngo.about}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transparency" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Şeffaflık Puanı</CardTitle></CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold text-primary">{ngo.transparencyScore}</p>
                            <Progress value={ngo.transparencyScore} className="mt-2" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default function NgosPage() {
    const db = useFirestore();
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [viewingNgo, setViewingNgo] = useState<NGO | null>(null);

    const ngosQuery = useMemoFirebase(() => {
        if (!db) return null;
        return collection(db, 'ngos');
    }, [db]);

    const { data: ngosData, isLoading } = useCollection<NGO>(ngosQuery);

    const filteredNgos = useMemo(() => {
        if (!ngosData) return [];
        let filtered = [...ngosData];

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
                        <Card key={ngo.id} className="transition-colors hover:bg-accent/50 relative group">
                            <div className="absolute top-2 right-2 z-10">
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 bg-background/50 rounded-full" onClick={() => setViewingNgo(ngo)}>
                                    <Info className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Link href={`/ngos/${ngo.id}`} className="block p-3">
                                <div className="flex gap-3 items-center">
                                    <Avatar className="h-12 w-12 border">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{ngo.name}</p>
                                        <p className="text-xs text-muted-foreground">{ngo.category}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> {ngo.transparencyScore ?? 0}</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /> {ngo.stats?.donors || 0} Bağışçı</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ngo.stats?.volunteers || 0} Gönüllü</span>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!viewingNgo} onOpenChange={(isOpen) => !isOpen && setViewingNgo(null)}>
                <DialogContent className="max-w-md w-full p-0 border-0 rounded-2xl overflow-hidden">
                    {viewingNgo && <NgoDetailView ngo={viewingNgo} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
