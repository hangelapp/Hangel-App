'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, ChevronRight } from 'lucide-react';
import { marketCategories } from '@/lib/data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState(marketCategories[0].mainCategory);

  const selectedCategoryData = marketCategories.find(cat => cat.mainCategory === activeCategory);

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
                {selectedCategoryData?.subCategories.length > 0 ? selectedCategoryData?.subCategories.map((subCat) => (
                <Link href="#" key={subCat.name}>
                    <div className="flex flex-col items-center text-center space-y-1 p-1">
                      <div className="relative w-full aspect-square rounded-full overflow-hidden">
                          <Image
                          src={subCat.imageUrl}
                          alt={subCat.name}
                          fill
                          className="object-cover"
                          />
                          {subCat.isHot && (
                          <Badge className="absolute top-1 right-1 bg-red-500 text-white border-none text-[10px] px-1.5 py-0.5 h-auto">
                              HOT
                          </Badge>
                          )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-center leading-tight">{subCat.name}</p>
                    </div>
                </Link>
                )) : (
                    <p className="col-span-full text-center text-muted-foreground mt-8 text-sm">Bu kategoride ürün bulunmuyor.</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}
