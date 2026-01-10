'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, Heart, Percent, ArrowDownUp, List, LayoutGrid } from 'lucide-react';
import { marketBrands } from '@/lib/data';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MarketPage() {
  return (
    <div className="animate-in fade-in-0 bg-background">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Marka, ürün veya kategori ara"
            className="pl-10 bg-white rounded-full"
          />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
                <Filter className="mr-2 h-4 w-4" /> Filtrele
            </Button>
            <Button variant="outline" className="flex-1">
                <ArrowDownUp className="mr-2 h-4 w-4" /> Sırala
            </Button>
            <Button variant="outline" size="icon">
                <LayoutGrid className="h-4 w-4" />
            </Button>
             <Button variant="outline" size="icon">
                <List className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0 px-4 gap-4 overflow-x-auto">
          <TabsTrigger value="products" className="rounded-full">
            Ürünler
          </TabsTrigger>
          <TabsTrigger value="brands" className="rounded-full">
            Markalar
          </TabsTrigger>
          <TabsTrigger value="cooperatives" className="rounded-full">
            Kooperatifler
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="p-4 bg-background">
          <div className="grid grid-cols-2 gap-4">
            {marketBrands.map((brand) => (
              <Card
                key={brand.id}
                className="flex flex-col text-left rounded-lg overflow-hidden"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={brand.logoHint}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="p-2 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold truncate">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">{brand.category}</p>
                  </div>
                  <div className="flex items-center text-sm font-bold text-primary mt-1">
                    <Percent className="h-4 w-4 mr-1"/>
                    <span>{brand.donationRate} Bağış</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="brands" className="p-4 text-center text-muted-foreground">
          Yakında...
        </TabsContent>
        <TabsContent value="cooperatives" className="p-4 text-center text-muted-foreground">
          Yakında...
        </TabsContent>
      </Tabs>
    </div>
  );
}
