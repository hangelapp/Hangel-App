
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Bot, Send, Loader2, Sparkles, X } from 'lucide-react';
import { marketCategories, allEntityLists } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { askMarketAssistant } from '@/ai/flows/marketplace-ai-assistant';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !brand.logoUrl) {
    return (
      <div className="w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center p-2">
        <span className="text-primary font-black text-xl">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img 
      src={brand.logoUrl} 
      alt={brand.name} 
      className="w-full h-full object-contain p-3"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

const MarketAssistant = ({ brands }: { brands: Brand[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const { toast } = useToast();

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);

        try {
            const brandsContext = brands.map(b => `${b.name} (${b.category}): %${b.donationRate} bağış oranı.`).join('\n');
            const result = await askMarketAssistant({ userQuestion: userMsg, brandsContext });
            setMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
        } catch (error) {
            toast({ variant: 'destructive', title: "Asistan Hatası", description: "Yanıt alınamadı." });
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            <Button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-2xl z-50 p-0 overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary animate-pulse opacity-20" />
                <Bot className="h-7 w-7 relative z-10" />
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Bot className="h-6 w-6" /></div>
                            <div className="text-left">
                                <SheetTitle>Alışveriş Asistanı</SheetTitle>
                                <SheetDescription className="text-xs">İyilik dolu bir alışveriş için size rehberlik ederim.</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-12 space-y-4">
                                <Sparkles className="h-12 w-12 text-primary/20 mx-auto" />
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">"Hangi markalar eğitim için bağış yapıyor?" veya "Spor ayakkabı almak istiyorum" gibi sorular sorabilirsiniz.</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={cn(
                                "max-w-[85%] rounded-2xl p-4 text-sm",
                                m.role === 'user' ? "bg-primary text-white ml-auto" : "bg-muted text-foreground mr-auto"
                            )}>
                                {m.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="bg-muted text-foreground mr-auto max-w-[85%] rounded-2xl p-4 flex gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">Yanıt Hazırlanıyor...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-background">
                        <form className="flex gap-2" onSubmit={handleAsk}>
                            <Input 
                                placeholder="Bir soru sorun..." 
                                value={query} 
                                onChange={e => setQuery(e.target.value)}
                                className="rounded-xl h-12"
                            />
                            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={isTyping}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default function MarketPage() {
  const db = useFirestore();
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [brandType, setBrandType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const brandsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'brands');
  }, [db]);

  const { data: firestoreBrands, isLoading } = useCollection<Brand>(brandsQuery);

  const brandsToShow = useMemo(() => {
    // Merge Firestore brands with static fallback brands
    const staticBrands = allEntityLists;
    const combined = [...(firestoreBrands || []), ...staticBrands];
    
    // Deduplicate by ID
    const uniqueMap = new Map<string, Brand>();
    combined.forEach(b => uniqueMap.set(b.id, b));
    let list = Array.from(uniqueMap.values());

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (activeCategory !== 'Tümü') {
      list = list.filter(b => b.category === activeCategory);
    }
    
    if (brandType !== 'all') {
      list = list.filter(b => b.type === brandType);
    }

    return list.sort((a, b) => b.donationRate - a.donationRate);
  }, [firestoreBrands, activeCategory, searchTerm, brandType]);

  return (
    <div className="flex flex-col h-full bg-secondary/30 relative">
      <div className="p-4 space-y-4 border-b bg-background/80 backdrop-blur-xl sticky top-12 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Marka Ara..."
              className="pl-10 h-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-1 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm">
                <Filter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveCategory('Tümü')}>Tüm Kategoriler</DropdownMenuItem>
              {marketCategories.filter(c => c.mainCategory !== 'Tümü').map(cat => (
                <DropdownMenuItem key={cat.mainCategory} onClick={() => setActiveCategory(cat.mainCategory)}>
                  {cat.mainCategory}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="all" onValueChange={setBrandType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="brand">Ticari</TabsTrigger>
                <TabsTrigger value="cooperative">Kooperatif</TabsTrigger>
                <TabsTrigger value="social">Sosyal</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[100px] sm:w-1/4 border-r overflow-y-auto bg-background/50">
          <nav className="flex flex-col py-2">
            {marketCategories.map((cat) => (
              <button
                key={cat.mainCategory}
                onClick={() => setActiveCategory(cat.mainCategory)}
                className={cn(
                  "text-left text-[11px] sm:text-sm p-4 whitespace-nowrap truncate transition-all",
                  activeCategory === cat.mainCategory
                    ? "bg-primary/10 text-primary border-l-4 border-primary font-black"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {cat.mainCategory}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 pb-32">
            {isLoading && brandsToShow.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
                </div>
            ) : brandsToShow.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                  Aramanızla eşleşen marka bulunamadı.
                </div>
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {brandsToShow.map((brand) => (
                    <Link href={`/market/${brand.slug}`} key={brand.id} className="group">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="relative w-full aspect-square">
                                <div className="w-full h-full rounded-[1.5rem] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-xl transition-all">
                                    <BrandLogo brand={brand} />
                                </div>
                                <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white border-2 border-white">
                                    %{brand.donationRate}
                                </div>
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold leading-tight text-foreground group-hover:text-primary line-clamp-2">{brand.name}</p>
                        </div>
                    </Link>
                  ))}
                </div>
            )}
        </main>
      </div>
      <MarketAssistant brands={brandsToShow} />
    </div>
  );
}
