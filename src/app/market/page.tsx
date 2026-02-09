'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2, Bot, Sparkles, Send } from 'lucide-react';
import { marketCategories, allEntityLists } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { askMarketAssistant } from '@/ai/flows/marketplace-ai-assistant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchAllAgencyOffers } from '@/lib/api-clients';

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

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [sortKey, setSortKey] = useState('donationRate');
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicBrands, setDynamicBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const apiData = await fetchAllAgencyOffers();
        // Merge API data with the hardcoded list, prioritizing higher rates for duplicates
        const combined = [...apiData, ...allEntityLists];
        const uniqueMap = new Map<string, Brand>();
        combined.forEach(brand => {
          const key = brand.name.toLowerCase().trim();
          const existing = uniqueMap.get(key);
          if (!existing || brand.donationRate > existing.donationRate) {
            uniqueMap.set(key, brand);
          }
        });
        setDynamicBrands(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error("Market fetch error:", err);
        setDynamicBrands(allEntityLists);
      } finally {
        setIsLoading(false);
      }
    };
    loadBrands();
  }, []);

  const brandsToShow = useMemo(() => {
    let list = [...dynamicBrands];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (activeCategory !== 'Tümü') {
      list = list.filter(b => b.category === activeCategory);
    }

    list.sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name, 'tr') : b.donationRate - a.donationRate);
    return list;
  }, [activeCategory, sortKey, searchTerm, dynamicBrands]);

  const handleAskAssistant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assistantQuestion.trim()) return;

    const userMsg = assistantQuestion;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAssistantQuestion('');
    setIsAssistantLoading(true);

    try {
      const brandsContext = brandsToShow.slice(0, 50).map(b => 
        `${b.name} (%${b.donationRate} bağış)`
      ).join(', ');

      const result = await askMarketAssistant({
        userQuestion: userMsg,
        brandsContext: brandsContext,
      });

      if (result.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary/30 relative">
      <div className="p-4 space-y-4 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
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
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm"><Filter className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortKey('donationRate')}>En Yüksek Bağış</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre (A-Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                    ? "bg-primary/10 text-primary border-l-4 border-primary font-black shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {cat.mainCategory}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-primary font-bold">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Kampanyalar Hazırlanıyor...</span>
              </div>
            ) : brandsToShow.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic">
                Aramanızla eşleşen marka bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {brandsToShow.map((brand) => (
                  <Link href={`/market/${brand.id}`} key={brand.id} className="group">
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
          </div>
        </main>
      </div>

      <div className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-50">
        <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-primary hover:bg-primary/90">
              <Bot className="h-7 w-7 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Alışveriş Asistanı</DialogTitle>
                  <DialogDescription className="text-xs text-primary-foreground/80">
                    Sizin için en doğru markaları ve bağış oranlarını bulurum.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4 bg-muted/30">
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Nasıl yardımcı olabilirim?</p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {['En yüksek bağışlı ayakkabı?', 'Anne & Bebek ürünleri', 'Teknoloji markaları'].map(q => (
                        <Button key={q} variant="outline" size="sm" className="text-xs rounded-full" onClick={() => { setAssistantQuestion(q); }}>
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn("text-[10px]", msg.role === 'user' ? "bg-primary text-white" : "bg-muted")}>
                        {msg.role === 'user' ? 'BEN' : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm max-w-[85%] shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-background border rounded-tl-none text-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAssistantLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-muted animate-pulse">
                      <AvatarFallback className="text-[10px]">AI</AvatarFallback>
                    </Avatar>
                    <div className="p-3 bg-background border rounded-2xl rounded-tl-none">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
              <form className="flex gap-2" onSubmit={handleAskAssistant}>
                <Input 
                  placeholder="Bir şeyler sor..." 
                  value={assistantQuestion}
                  onChange={(e) => setAssistantQuestion(e.target.value)}
                  disabled={isAssistantLoading}
                  className="flex-1 rounded-xl h-11"
                />
                <Button type="submit" size="icon" disabled={isAssistantLoading || !assistantQuestion.trim()} className="rounded-xl h-11 w-11">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
