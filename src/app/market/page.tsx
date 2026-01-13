'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, Percent, ArrowDownUp, Star } from 'lucide-react';
import { marketCampaigns, allEntityLists } from '@/lib/data';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Brand } from '@/lib/types';
import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';

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
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  return (
    <div className="animate-in fade-in-0 bg-background">
      <Carousel
        plugins={[plugin.current]}
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {marketCampaigns.map((campaign) => (
            <CarouselItem key={campaign.id} className="basis-full">
              <div className="relative h-32 rounded-lg overflow-hidden m-4 mb-0">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  className="object-cover"
                  data-ai-hint={campaign.imageHint}
                />
                <div className="absolute inset-0 bg-black/30" />
                 {campaign.sponsored && (
                  <Badge variant="outline" className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 text-foreground border-amber-500 text-amber-500">
                    <Star className="h-3 w-3" />
                    <span>Sponsorlu</span>
                  </Badge>
                )}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">
            Marka
          </TabsTrigger>
          <TabsTrigger value="cooperatives">
            Kooperatif
          </TabsTrigger>
           <TabsTrigger value="social">
            Sosyal Şirket
          </TabsTrigger>
           <TabsTrigger value="economic">
            İktisadi İşletme
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
