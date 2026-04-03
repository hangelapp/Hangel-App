
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, Check, Loader2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Brand } from '@/lib/types';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function FollowedBrandsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all brands from Firestore
  const brandsQuery = useMemoFirebase(() => collection(db, 'brands'), [db]);
  const { data: allBrands, isLoading: brandsLoading } = useCollection<Brand>(brandsQuery);

  // Fetch user document for followedBrands
  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
  }, [db, authUser]);

  const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

  const followedBrandIds: string[] = useMemo(() => {
    return userData?.followedBrands || [];
  }, [userData]);

  const filteredBrands = useMemo(() => {
    if (!allBrands) return [];
    if (!searchTerm.trim()) return allBrands;
    const term = searchTerm.toLowerCase();
    return allBrands.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.category?.toLowerCase().includes(term)
    );
  }, [allBrands, searchTerm]);

  const handleToggleBrand = (brandId: string) => {
    if (!userDocRef) return;

    const isFollowing = followedBrandIds.includes(brandId);

    try {
      if (isFollowing) {
        updateDocumentNonBlocking(userDocRef, {
          followedBrands: arrayRemove(brandId),
        });
      } else {
        updateDocumentNonBlocking(userDocRef, {
          followedBrands: arrayUnion(brandId),
        });
      }
    } catch (error) {
      console.error('Error toggling brand follow:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Marka takip durumu güncellenirken bir hata oluştu.',
      });
    }
  };

  const isLoading = isUserLoading || brandsLoading || userLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold font-headline">Takip Ettiğim Markalar</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Marka ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {followedBrandIds.length} marka takip ediliyor
      </p>

      {filteredBrands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Henüz marka bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBrands.map((brand) => {
            const isFollowing = followedBrandIds.includes(brand.id);
            return (
              <Card
                key={brand.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-accent',
                  isFollowing && 'border-primary/50 bg-primary/5'
                )}
                onClick={() => handleToggleBrand(brand.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="relative h-12 w-12 rounded-xl bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1.5"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={cn("fallback text-primary font-bold text-lg", brand.logoUrl && "hidden")}>
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{brand.name}</p>
                    {brand.category && (
                      <p className="text-xs text-muted-foreground truncate">{brand.category}</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      isFollowing
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isFollowing && <Check className="h-4 w-4" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
