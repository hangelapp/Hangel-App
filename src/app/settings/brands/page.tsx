'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search, Filter, ArrowDownUp, Loader2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Brand } from '@/lib/types';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

type BrandTypeFilter = Brand['type'] | 'Tümü';

const typeLabels: Record<Brand['type'], string> = {
  brand: 'Ticari',
  cooperative: 'Kooperatif',
  social: 'Sosyal',
  economic: 'İktisadi',
};

export default function FollowedBrandsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const brandsQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.brands) : null), [db]);
  const { data: firestoreBrands, isLoading: isFirestoreLoading } = useCollection<Brand>(brandsQuery);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<{ followedBrands?: string[] }>(userDocRef);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<BrandTypeFilter>('Tümü');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  useEffect(() => {
    if (userData?.followedBrands) setSelectedBrands(userData.followedBrands);
  }, [userData]);

  useEffect(() => {
    fetch('/api/offers')
      .then(res => (res.ok ? res.json() : []))
      .then((data: Brand[]) => setApiBrands(Array.isArray(data) ? data : []))
      .catch(() => setApiBrands([]))
      .finally(() => setIsApiLoading(false));
  }, []);

  const allBrands = useMemo(() => {
    const combined = [...(firestoreBrands || []), ...apiBrands];
    const uniqueMap = new Map<string, Brand>();
    combined.forEach(b => {
      if (!b?.id || !b?.name) return;
      if (!uniqueMap.has(b.id)) uniqueMap.set(b.id, b);
    });
    return Array.from(uniqueMap.values());
  }, [firestoreBrands, apiBrands]);

  const isBrandsLoading = isFirestoreLoading || isApiLoading;

  const allCategories = useMemo(
    () => Array.from(new Set(allBrands.map(b => b.category).filter(Boolean))),
    [allBrands],
  );

  const filteredBrands = useMemo(() => {
    let filtered = [...allBrands];

    if (typeFilter !== 'Tümü') filtered = filtered.filter(b => b.type === typeFilter);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(lower) || (b.category || '').toLowerCase().includes(lower),
      );
    }

    if (categoryFilter.length > 0) filtered = filtered.filter(b => categoryFilter.includes(b.category));

    filtered.sort((a, b) => {
      // Önce takip edilenler üstte
      const aFollowed = selectedBrands.includes(a.id) ? 1 : 0;
      const bFollowed = selectedBrands.includes(b.id) ? 1 : 0;
      if (aFollowed !== bFollowed) return bFollowed - aFollowed;

      // Sonra seçilen sıralama
      switch (sortConfig.key) {
        case 'followers': {
          const af = a.followers ?? a.stats?.supporters ?? 0;
          const bf = b.followers ?? b.stats?.supporters ?? 0;
          return sortConfig.direction === 'asc' ? af - bf : bf - af;
        }
        case 'donationRate':
          return sortConfig.direction === 'asc' ? a.donationRate - b.donationRate : b.donationRate - a.donationRate;
        default:
          return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    });

    return filtered;
  }, [allBrands, typeFilter, searchTerm, sortConfig, categoryFilter, selectedBrands]);

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId],
    );
  };

  const handleSave = () => {
    if (userDocRef) updateDocumentNonBlocking(userDocRef, { followedBrands: selectedBrands });
    toast({ title: t('dashboard.settingsBrands.toastSavedTitle'), description: t('dashboard.settingsBrands.toastSavedDesc') });
    router.push('/settings');
  };

  if (isUserLoading || isUserDataLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsBrands.heading')}</h1>
        <p className="text-muted-foreground text-sm">{t('dashboard.settingsBrands.subheading')}</p>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder={t('dashboard.settingsBrands.searchPlaceholder')} className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.filter')}><Filter className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Kategoriye Göre Filtrele</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allCategories.map(cat => (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={categoryFilter.includes(cat)}
                onCheckedChange={checked => setCategoryFilter(checked ? [...categoryFilter, cat] : categoryFilter.filter(c => c !== cat))}
              >{cat}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.sort')}><ArrowDownUp className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortConfig({ key: 'followers', direction: 'desc' })}>Takipçi Sayısı</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortConfig({ key: 'donationRate', direction: 'desc' })}>Bağış Oranı</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="Tümü" className="w-full" onValueChange={v => setTypeFilter(v as BrandTypeFilter)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="Tümü">{t('dashboard.settingsBrands.tabAll')}</TabsTrigger>
          <TabsTrigger value="brand">{t('dashboard.settingsBrands.tabCommercial')}</TabsTrigger>
          <TabsTrigger value="cooperative">{t('dashboard.settingsBrands.tabCooperative')}</TabsTrigger>
          <TabsTrigger value="social">{t('dashboard.settingsBrands.tabSocial')}</TabsTrigger>
          <TabsTrigger value="economic">{t('dashboard.settingsBrands.tabEconomic')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="p-4">
          <p className="text-sm font-medium">{selectedBrands.length} Marka Seçildi</p>
        </CardHeader>
        <CardContent className="p-0">
          {isBrandsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredBrands.length > 0 ? (
            <div className="divide-y">
              {filteredBrands.map(brand => (
                <div
                  key={brand.id}
                  className={cn(
                    'flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors',
                    selectedBrands.includes(brand.id) && 'bg-primary/5',
                  )}
                  onClick={() => handleBrandSelect(brand.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 bg-muted">
                      <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-1" />
                      <AvatarFallback className="text-primary font-bold">{brand.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{brand.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        {brand.category}
                        {brand.category && <span className="text-muted-foreground/50">|</span>}
                        <span>{typeLabels[brand.type] ?? 'Ticari'}</span>
                        {typeof brand.donationRate === 'number' && (
                          <>
                            <span className="text-muted-foreground/50">|</span>
                            <span>%{brand.donationRate} Bağış</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0',
                    selectedBrands.includes(brand.id) ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground',
                  )}>
                    {selectedBrands.includes(brand.id) && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t('dashboard.settingsBrands.emptyMsg')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>{t('dashboard.settingsBrands.saveBtn')}</Button>
      </div>
    </div>
  );
}
