
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, ChevronRight, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { ngos, timelinePosts, user, volunteeringOpportunities } from '@/lib/data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { NGO, Post, Volunteering } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Separator } from '@/components/ui/separator';


type NgoType = NGO['type'] | 'Tümü';
type LocationFilter = 'global' | 'country' | 'city';

const NgoDetailView = ({ ngo }: { ngo: NGO; }) => {
    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name);
    const ngoOpps = volunteeringOpportunities.filter(o => o.ngoId === ngo.id);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/ngos/${ngo.id}` : '';

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
                    <TabsTrigger value="opportunities">Fırsatlar</TabsTrigger>
                    <TabsTrigger value="transparency">Şeffaflık</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Kuruluş Hakkında</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                           <p>{ngo.about}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="opportunities" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Gönüllülük Fırsatları</CardTitle></CardHeader>
                        <CardContent>
                             {ngoOpps.length > 0 ? (
                                ngoOpps.map(opp => <p key={opp.id}>{opp.title}</p>)
                            ) : (
                                <p className="text-center text-muted-foreground p-4">Aktif gönüllülük ilanı bulunmuyor.</p>
                            )}
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
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [locationFilter, setLocationFilter] = useState<LocationFilter>('country');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [viewingNgo, setViewingNgo] = useState<NGO | null>(null);
    
    const allCategories = useMemo(() => Array.from(new Set(ngos.map(n => n.category))), []);

    const filteredNgos = useMemo(() => {
        let filtered = [...ngos];

        // Location Filter
        if (locationFilter === 'city') {
            filtered = filtered.filter(ngo => ngo.contact.address?.city === user.personalInfo.address.city);
        } else if (locationFilter === 'country') {
             // Assuming all are in TR for now
        }
        
        // Type Filter
        if (typeFilter !== 'Tümü') {
            filtered = filtered.filter(ngo => ngo.type === typeFilter);
        }

        // Search Term Filter
        if (searchTerm) {
            const lowercased = searchTerm.toLowerCase();
            filtered = filtered.filter(ngo => 
                ngo.name.toLowerCase().includes(lowercased) || 
                ngo.category.toLowerCase().includes(lowercased)
            );
        }

        // Category Filter
        if (categoryFilter.length > 0) {
            filtered = filtered.filter(ngo => categoryFilter.includes(ngo.category));
        }

        // Sorting
        filtered.sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch(sortConfig.key) {
                case 'followers': valA = a.stats.followers; valB = b.stats.followers; break;
                case 'volunteers': valA = a.stats.volunteers; valB = b.stats.volunteers; break;
                case 'transparencyScore': valA = a.transparencyScore; valB = b.transparencyScore; break;
                default: // name
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            if(typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });

        return filtered;
    }, [typeFilter, locationFilter, searchTerm, sortConfig, categoryFilter]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
            <p className="text-muted-foreground text-sm">Destekleyebileceğin STK'ları keşfet.</p>
        </div>
        <div className="p-0 flex gap-2 items-center">
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
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <Filter className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Kategoriye Göre Filtrele</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {allCategories.map(category => (
                        <DropdownMenuCheckboxItem
                            key={category}
                            checked={categoryFilter.includes(category)}
                            onCheckedChange={(checked) => {
                                const newFilter = checked ? [...categoryFilter, category] : categoryFilter.filter(c => c !== category);
                                setCategoryFilter(newFilter);
                            }}
                        >
                            {category}
                        </DropdownMenuCheckboxItem>
                     ))}
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'followers', direction: 'desc' })}>Takipçi Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'volunteers', direction: 'desc' })}>Gönüllü Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'transparencyScore', direction: 'desc' })}>Şeffaflık Puanı</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

       <Tabs defaultValue="country" className="w-full" onValueChange={(value) => setLocationFilter(value as LocationFilter)}>
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="country">Ülkemde</TabsTrigger>
            <TabsTrigger value="city">Şehrimde</TabsTrigger>
        </TabsList>
       </Tabs>

       <Tabs defaultValue="Tümü" className="w-full" onValueChange={(value) => setTypeFilter(value as NgoType)}>
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="Tümü">Tümü</TabsTrigger>
            <TabsTrigger value="Dernek">Dernek</TabsTrigger>
            <TabsTrigger value="Vakıf">Vakıf</TabsTrigger>
            <TabsTrigger value="Spor Kulübü">Spor Kulübü</TabsTrigger>
            <TabsTrigger value="Özel İzinli">Özel İzinli</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNgos.length > 0 ? filteredNgos.map((ngo) => (
            <Card key={ngo.id} className="transition-colors hover:bg-accent/50 cursor-pointer" onClick={() => setViewingNgo(ngo)}>
                <div className="p-3 flex gap-3 items-center">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate">{ngo.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="truncate">{ngo.category}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1 flex-shrink-0"><ShieldCheck className="h-3 w-3" /> {ngo.transparencyScore}</span>
                            <span className="flex items-center gap-1 flex-shrink-0"><Heart className="h-3 w-3" /> {ngo.stats.followers / 1000}k</span>
                            <span className="flex items-center gap-1 flex-shrink-0"><Users className="h-3 w-3" /> {ngo.stats.volunteers / 1000}k</span>
                        </div>
                    </div>
                </div>
            </Card>
        )) : (
             <div className="text-center text-muted-foreground py-16">
                <p>Bu filtrelerle eşleşen STK bulunamadı.</p>
            </div>
        )}
      </div>

       <Dialog open={!!viewingNgo} onOpenChange={(isOpen) => !isOpen && setViewingNgo(null)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto p-0 border-0 rounded-2xl">
            <div className="absolute top-4 right-4 z-20">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 text-white" onClick={() => setViewingNgo(null)}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
          {viewingNgo && <NgoDetailView ngo={viewingNgo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
