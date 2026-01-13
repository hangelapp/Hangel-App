'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, Percent, ArrowDownUp } from 'lucide-react';
import { marketCampaigns, allEntityLists } from '@/lib/data';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Brand } from '@/lib/types';
import { useState } from 'react';

const BrandCard = ({ brand }: { brand: Brand }) => (
    <Card key={brand.id} className="overflow-hidden">
        <CardContent className="p-4 flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src={brand.logoUrl} alt={brand.name} />
                <AvatarFallback>{brand.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className='flex-grow'>
                <p className="font-semibold">{brand.name}</p>
                <p className="text-sm text-muted-foreground">{brand.category}</p>
                 <div className="flex items-center gap-1 text-sm mt-1">
                    <Percent className="h-4 w-4 text-muted-foreground"/> <strong>{brand.donationRate}% Bağış</strong>
                </div>
            </div>
            <Button asChild>
                <Link href={`/market/${brand.id}`}>Alışverişe Başla</Link>
            </Button>
        </CardContent>
    </Card>
);

const EntityList = ({ type }: { type: Brand['type'] }) => {
    const entities = allEntityLists.filter(e => e.type === type);
    if (entities.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Bu kategoride henüz bir işletme bulunmuyor.</div>
    }
    return (
        <div className="space-y-4">
            {entities.map(brand => <BrandCard key={brand.id} brand={brand} />)}
        </div>
    )
};


export default function MarketPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <div className="animate-in fade-in-0 bg-background">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className='pl-4 pr-4 -ml-4'>
          {marketCampaigns.map((campaign) => (
            <CarouselItem key={campaign.id} className="basis-5/6 pl-4">
              <div className="relative h-32 rounded-lg overflow-hidden">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  className="object-cover"
                  data-ai-hint={campaign.imageHint}
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                    <h3 className="font-bold text-lg">{campaign.title}</h3>
                    <p className="text-sm">{campaign.description}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      <div className="p-4 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Marka, ürün veya kategori ara"
                    className="pl-10 bg-card"
                />
            </div>
            <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
                <ArrowDownUp className="h-4 w-4" />
            </Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0 px-4 gap-4 overflow-x-auto border-b">
          <TabsTrigger value="products" className="rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
            Markalar
          </TabsTrigger>
          <TabsTrigger value="cooperatives" className="rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
            Kooperatifler
          </TabsTrigger>
           <TabsTrigger value="social" className="rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
            Sosyal Şirketler
          </TabsTrigger>
           <TabsTrigger value="economic" className="rounded-none bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
            İktisadi İşletmeler
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="p-4 bg-background">
          <EntityList type="brand" />
        </TabsContent>
        <TabsContent value="cooperatives" className="p-4 bg-background">
          <EntityList type="cooperative" />
        </TabsContent>
        <TabsContent value="social" className="p-4 bg-background">
           <EntityList type="social" />
        </TabsContent>
        <TabsContent value="economic" className="p-4 bg-background">
           <EntityList type="economic" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
