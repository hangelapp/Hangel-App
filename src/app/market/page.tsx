'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, ArrowDownUp, Star } from 'lucide-react';
import { allEntityLists, marketCampaigns } from '@/lib/data';
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

const BrandCard = ({ brand }: { brand: Brand }) => {
  const isEconomicEnterprise = brand.type === 'economic';
  const profileLink = isEconomicEnterprise ? `/ngos/${brand.ngoId}` : `/market/${brand.id}`;

  return (
    <Card key={brand.id}>
        <CardHeader>
             <Link href={profileLink} className="flex flex-row items-center gap-4 group">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={brand.logoUrl} alt={brand.name} />
                    <AvatarFallback>{brand.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base group-hover:underline">{brand.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{brand.category}</p>
                </div>
             </Link>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-1.5 text-sm font-medium">
                <span><strong>%{brand.donationRate}</strong> Bağış</span>
            </div>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={isEconomicEnterprise ? profileLink : `/market/${brand.id}`}>
                    {isEconomicEnterprise ? 'STK Profilini Gör' : 'Alışverişe Başla'}
                </Link>
            </Button>
        </CardFooter>
    </Card>
  );
};


const EntityList = ({ type }: { type: Brand['type'] }) => {
    const entities = allEntityLists.filter(e => e.type === type);
    if (entities.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Bu kategoride henüz bir işletme bulunmuyor.</div>
    }
    return (
        <div className="grid grid-cols-1 gap-4">
            {entities.map(brand => <BrandCard key={brand.id} brand={brand} />)}
        </div>
    )
};


export default function MarketPage() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  return (
    <div className="animate-in fade-in-0">
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
              <div className="relative h-36 rounded-lg overflow-hidden m-4 mb-2">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  className="object-cover"
                  data-ai-hint={campaign.imageHint}
                />
                <div className="absolute inset-0 bg-black/40" />
                 {campaign.sponsored && (
                  <Badge variant="outline" className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 text-foreground border-amber-500 text-amber-500">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">Sponsorlu</span>
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
                    className="pl-10 h-11 bg-card"
                />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11">
                <ArrowDownUp className="h-5 w-5" />
            </Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2">
          <TabsTrigger value="products">
            Marka
          </TabsTrigger>
           <TabsTrigger value="economic">
            İktisadi İşletme
          </TabsTrigger>
           <TabsTrigger value="social">
            Sosyal Şirket
          </TabsTrigger>
          <TabsTrigger value="cooperatives">
            Kooperatif
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
