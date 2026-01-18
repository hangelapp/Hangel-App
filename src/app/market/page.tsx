'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, ChevronRight } from 'lucide-react';
import { marketCategories, marketBrands } from '@/lib/data';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const categoryMapping: Record<string, string[]> = {
    'Ev & Mutfak': ['Mobilya', 'Yapı Market', 'Mutfak', 'Ev Tekstili', 'Küçük Ev Aletleri', 'Yatak', 'Beyaz Eşya', 'Ev & Giyim'],
    'Kadın Giyim': ['Kadın Giyim', 'Giyim', 'Tesettür Giyim', 'Lüks Giyim', 'Çok Kategorili', 'İç Giyim'],
    'Kadın Ayakkabı': ['Ayakkabı'],
    'Kadın İç Giyim & Ev Giyim': ['İç Giyim'],
    'Erkek Giyim': ['Erkek Giyim', 'Giyim', 'Çok Kategorili', 'İç Giyim'],
    'Erkek Ayakkabıları': ['Ayakkabı'],
    'Erkek İç Çamaşır & Pijama': ['İç Giyim'],
    'Spor & Outdoor': ['Spor Giyim', 'Outdoor', 'Ayakkabı'],
    'Takı & Aksesuar': ['Mücevher', 'Saat', 'Aksesuar'],
    'Bebek & Çocuk': ['Bebek Giyim', 'Bebek Ürünleri', 'Çocuk Giyim', 'Oyuncak'],
    'Yeme & İçme & Gurme': ['Kahve & Giyim', 'Kahve', 'Restoran', 'Evcil Hayvan', 'Gurme', 'Sağlıklı Gıda'],
    'Tatil & Seyahat': ['Seyahat', 'Araç Kiralama', 'Bilet', 'Konaklama', 'Aksesuar'],
    'Pazaryeri & Market': ['Market', 'Hızlı Market', 'Pazaryeri', 'Giyim Pazaryeri'],
    'Elektronik': ['Elektronik', 'Aksesuar', 'Teknoloji', 'Müzik Aletleri'],
    'Hobi & Hediye & Diğer': ['Kitap', 'Kitap & Hobi', 'Eğitim', 'Hediye', 'Teknoloji', 'Evcil Hayvan', 'Seyahat'],
    'Kozmetik & Kişisel Bakım': ['Kozmetik', 'Sağlık', 'Kişisel Bakım'],
    'Kadın Büyük Beden Giyim': ['Giyim'],
    'Erkek Büyük Beden Giyim': ['Giyim'],
};


export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState(marketCategories[0].mainCategory);

  const brandsToShow = useMemo(() => {
    if (activeCategory === 'Öne çıkanlar') {
        return [...marketBrands].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 18);
    }
    const brandCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
    if (!brandCategories) {
        return [];
    }
    return marketBrands.filter(brand => brandCategories.includes(brand.category));
  }, [activeCategory]);

  return (
    <div className="flex flex-col h-full"> 
      {/* Search Header */}
      <div className="p-2 space-y-2">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="hangel'da Ara"
                className="pl-10 h-10 rounded-full bg-muted border-none"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Camera className="h-5 w-5" />
                </Button>
            </div>
        </div>
        <div className="flex items-center justify-between bg-orange-100 text-orange-800 p-2 rounded-lg text-xs cursor-pointer">
            <p className="font-medium">
              <span className="font-bold">✓ Ücretsiz kargo</span> | <span>200 TL alt limitine ulaştınız</span>
            </p>
            <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 mt-2">
        {/* Left Sidebar */}
        <aside className="w-1/4 border-r">
            <nav className="flex flex-col">
              {marketCategories.map((cat) => (
                <button
                  key={cat.mainCategory}
                  onClick={() => setActiveCategory(cat.mainCategory)}
                  className={cn(
                    "text-left text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap truncate",
                    activeCategory === cat.mainCategory
                      ? "bg-primary/10 text-primary font-bold border-l-4 border-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {cat.mainCategory}
                </button>
              ))}
            </nav>
        </aside>

        {/* Right Content */}
        <main className="w-3/4 p-2">
            <h2 className="font-bold text-sm sm:text-base mb-2 px-2">
                {activeCategory}
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {brandsToShow.length > 0 ? brandsToShow.map((brand) => (
                <Link href={brand.link || '#'} key={brand.id}>
                    <div className="flex flex-col items-center text-center space-y-1 p-1">
                      <div className="relative w-full aspect-square">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            <Image
                            src={brand.logoUrl}
                            alt={brand.name}
                            fill
                            className="object-contain p-2"
                            />
                        </div>
                          {brand.donationRate > 0 && (
                            <div className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground ring-2 ring-background">
                                {brand.donationRate}%
                            </div>
                          )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-center leading-tight">{brand.name}</p>
                    </div>
                </Link>
                )) : (
                    <p className="col-span-full text-center text-muted-foreground mt-8 text-sm">Bu kategoride marka bulunmuyor.</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}
