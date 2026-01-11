'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, Heart, Percent, ArrowDownUp, List, LayoutGrid } from 'lucide-react';
import { marketBrands, marketCampaigns } from '@/lib/data';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full px-4"
      >
        <CarouselContent>
          {marketCampaigns.map((campaign) => (
            <CarouselItem key={campaign.id} className="basis-5/6">
              <div className="relative h-32 rounded-lg overflow-hidden">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  objectFit="cover"
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
      
      <div className="p-4 flex gap-2">
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

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent p-0 px-4 gap-4 overflow-x-auto">
          <TabsTrigger value="products" className="rounded-full">
            Markalar
          </TabsTrigger>
          <TabsTrigger value="cooperatives" className="rounded-full">
            Kooperatifler
          </TabsTrigger>
           <TabsTrigger value="social" className="rounded-full">
            Sosyal Şirketler
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="p-4 bg-background">
          <div className="space-y-4">
            {marketBrands.map((brand) => (
              <Card
                key={brand.id}
                className="flex items-center text-left rounded-lg overflow-hidden group p-3"
              >
                <div className="relative h-16 w-16 rounded-md overflow-hidden mr-4">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    fill
                    objectFit="cover"
                    data-ai-hint={brand.logoHint}
                  />
                </div>

                <div className="flex-grow">
                    <p className="text-base font-bold truncate">{brand.name}</p>
                    <p className="text-sm text-muted-foreground">{brand.category}</p>
                </div>
                 
                <div className="flex items-center justify-center text-sm font-bold text-primary bg-primary/10 rounded-full py-1 px-3 ml-4">
                    <Percent className="h-4 w-4 mr-1"/>
                    <span>{`%${brand.donationRate}`} Bağış</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="cooperatives" className="p-4 text-center text-muted-foreground">
          Yakında...
        </TabsContent>
        <TabsContent value="social" className="p-4 text-center text-muted-foreground">
          Yakında...
        </TabsContent>
      </Tabs>
    </div>
  );
}
