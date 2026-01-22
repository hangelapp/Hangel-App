'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, Percent, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ngos } from '@/lib/data';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NGO } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type NgoType = NGO['type'] | 'Tümü';

export default function NgosPage() {
    const [activeTab, setActiveTab] = useState<NgoType>('Tümü');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    
    const allCategories = useMemo(() => Array.from(new Set(ngos.map(n => n.category))), []);

    const filteredNgos = useMemo(() => {
        let filtered = ngos.filter(ngo => {
            const matchesTab = activeTab === 'Tümü' || ngo.type === activeTab;
            const matchesSearch = searchTerm === '' || ngo.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(ngo.category);
            return matchesTab && matchesSearch && matchesCategory;
        });

        filtered.sort((a, b) => {
            let valA, valB;
            switch(sortConfig.key) {
                case 'followers': valA = a.stats.followers; valB = b.stats.followers; break;
                case 'volunteers': valA = a.stats.volunteers; valB = b.stats.volunteers; break;
                case 'transparency': valA = a.transparencyScore; valB = b.transparencyScore; break;
                default: // name
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        return filtered;
    }, [activeTab, searchTerm, sortConfig, categoryFilter]);

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
                                setCategoryFilter(prev => checked ? [...prev, category] : prev.filter(c => c !== category));
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
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'followers', direction: 'desc' })}>Takipçi Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'volunteers', direction: 'desc' })}>Gönüllü Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'transparency', direction: 'desc' })}>Şeffaflık Puanı</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

       <Tabs defaultValue="Tümü" className="w-full" onValueChange={(value) => setActiveTab(value as NgoType)}>
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
           <Link href={`/ngos/${ngo.id}`} key={ngo.id} className="block">
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="p-3 flex gap-3 items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                  <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-sm truncate">{ngo.name}</p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    <span className="truncate">{ngo.category}</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Heart className="h-3 w-3" /> {ngo.stats.followers / 1000}k
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0"><Users className="h-3 w-3" /> {ngo.stats.volunteers / 1000}k</span>
                    <span className="flex items-center gap-1 flex-shrink-0"><Percent className="h-3 w-3" /> %{ngo.transparencyScore}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )) : (
             <div className="text-center text-muted-foreground py-16">
                <p>Bu filtrelerle eşleşen STK bulunamadı.</p>
            </div>
        )}
      </div>
    </div>
  );
}
