'use client';

import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp, Bot, Sparkles, Loader2 } from 'lucide-react';
import { marketCategories, categoryMapping } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Öne çıkanlar');
  const [activeEntityType, setActiveEntityType] = useState('all');
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState('donationRate');
  const [searchTerm, setSearchTerm] = useState('');

  // Veri çekme motoru
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllAgencyOffers();
        setBrands(data);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Bağlantı Hatası', description: 'Veriler çekilemedi.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const brandsToShow = useMemo(() => {
    let list = [...brands];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (activeCategory !== 'Tümü' && activeCategory !== 'Öne çıkanlar') {
      const mapped = categoryMapping[activeCategory as keyof typeof categoryMapping];
      if (mapped) {
        list = list.filter(b => mapped.some(m => b.category.toLowerCase().includes(m.toLowerCase())));
      }
    }

    list.sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name, 'tr') : b.donationRate - a.donationRate);
    return list;
  }, [brands, activeCategory, sortKey, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-secondary/30">
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
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    </div>
  );
}
