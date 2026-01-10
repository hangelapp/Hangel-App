import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, Star, ArrowRight } from 'lucide-react';
import { marketBrands } from '@/lib/data';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MarketPage() {
  return (
    <div className="animate-in fade-in-0">
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold font-headline">Market</h1>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Marka, kategori veya ürün ara..." className="pl-10" />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                    <Filter className="mr-2 h-4 w-4" /> Filtrele
                </Button>
            </div>
        </div>

        <Tabs defaultValue="brands" className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent p-0 px-4 gap-4 overflow-x-auto">
                <TabsTrigger value="brands" className="rounded-full">Markalar</TabsTrigger>
                <TabsTrigger value="cooperatives" className="rounded-full">Kooperatifler</TabsTrigger>
                <TabsTrigger value="social" className="rounded-full">Sosyal Şirketler</TabsTrigger>
            </TabsList>
            <TabsContent value="brands" className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    {marketBrands.map((brand) => (
                    <Card key={brand.id} className="flex flex-col items-center justify-center p-4 text-center">
                        <CardHeader className="p-0 items-center">
                            <Image src={brand.logoUrl} alt={brand.name} width={64} height={64} className="rounded-full mb-2" data-ai-hint={brand.logoHint}/>
                            <CardTitle className="text-base font-bold">{brand.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 flex-grow">
                            <p className="text-xs text-muted-foreground">{brand.category}</p>
                            <p className="text-sm font-semibold text-primary mt-1">%{brand.donationRate} Bağış</p>
                        </CardContent>
                        <CardFooter className="p-0 w-full">
                            <Button className="w-full">
                                Alışverişe Başla <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
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
