'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Building2, Store, School, Heart, Leaf, ShoppingBag, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';

const statusVariantMap = {
    'approved': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
};

const iconMap: { [key: string]: any } = {
    'heart': Heart,
    'leaf': Leaf,
    'school': School,
    'shopping-bag': ShoppingBag,
    'store': Store
};

type ManagedEntity = {
  id: string;
  name: string;
  type: 'STK' | 'Marka' | 'Kulüp';
  icon: string;
  href: string;
  logoUrl?: string;
  status: 'approved' | 'pending';
};

export default function AdminPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();

  // Kullanıcının yönettiği varlıkları Firestore'dan bul
  const ngosQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, 'ngos'), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);
  const brandsQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, 'brands'), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);
  const clubsQ = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(collection(db, 'clubs'), where('adminUserId', '==', authUser.uid));
  }, [db, authUser?.uid]);

  const { data: managedNgos, isLoading: ngosLoading } = useCollection<any>(ngosQ);
  const { data: managedBrands, isLoading: brandsLoading } = useCollection<any>(brandsQ);
  const { data: managedClubs, isLoading: clubsLoading } = useCollection<any>(clubsQ);

  // User doc — fallback için: super-admin atadığında users/{uid}.managedNgoId vs.
  // de yazılıyor. adminUserId query'si herhangi bir nedenle eşleşmezse,
  // bu field'lardan direkt fetch ederek varlığı yine de gösteriyoruz.
  const userDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, 'users', authUser.uid) : null),
    [db, authUser?.uid],
  );
  const { data: userData } = useDoc<any>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (db && userData?.managedNgoId ? doc(db, 'ngos', userData.managedNgoId) : null),
    [db, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (db && userData?.managedBrandId ? doc(db, 'brands', userData.managedBrandId) : null),
    [db, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (db && userData?.managedClubId ? doc(db, 'clubs', userData.managedClubId) : null),
    [db, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<any>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<any>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<any>(fallbackClubRef);

  const isLoading = ngosLoading || brandsLoading || clubsLoading;

  const managedItems: ManagedEntity[] = useMemo(() => {
    const items: ManagedEntity[] = [];
    const seen = new Set<string>();
    const pushNgo = (n: any) => {
      if (!n || seen.has(`ngo:${n.id}`)) return;
      seen.add(`ngo:${n.id}`);
      items.push({
        id: n.id,
        name: n.name || 'STK',
        type: 'STK',
        icon: 'heart',
        href: '/ngo-admin/dashboard',
        logoUrl: n.avatarUrl || n.logoUrl,
        status: (n.status === 'Pasif' || n.status === 'Beklemede') ? 'pending' : 'approved',
      });
    };
    const pushBrand = (b: any) => {
      if (!b || seen.has(`brand:${b.id}`)) return;
      seen.add(`brand:${b.id}`);
      items.push({
        id: b.id,
        name: b.name || 'Marka',
        type: 'Marka',
        icon: 'shopping-bag',
        href: '/ngo-admin/dashboard',
        logoUrl: b.logoUrl,
        status: (b.status === 'Pasif' || b.status === 'Beklemede') ? 'pending' : 'approved',
      });
    };
    const pushClub = (c: any) => {
      if (!c || seen.has(`club:${c.id}`)) return;
      seen.add(`club:${c.id}`);
      items.push({
        id: c.id,
        name: c.name || 'Kulüp',
        type: 'Kulüp',
        icon: 'school',
        href: '/ngo-admin/dashboard',
        logoUrl: c.avatarUrl || c.logoUrl,
        status: (c.status === 'Pasif' || c.status === 'Beklemede') ? 'pending' : 'approved',
      });
    };

    (managedNgos || []).forEach(pushNgo);
    (managedBrands || []).forEach(pushBrand);
    (managedClubs || []).forEach(pushClub);

    // Fallback: user doc'daki managed*Id field'larından eklenmemişleri ekle
    if (fallbackNgo) pushNgo(fallbackNgo);
    if (fallbackBrand) pushBrand(fallbackBrand);
    if (fallbackClub) pushClub(fallbackClub);

    return items;
  }, [managedNgos, managedBrands, managedClubs, fallbackNgo, fallbackBrand, fallbackClub]);

  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12 p-4">
      <div className="space-y-1 px-1">
        <h1 className="text-3xl font-bold font-headline">Yönetim Paneli</h1>
        <p className="text-muted-foreground text-sm">Varlıklarınızı ve yönetim araçlarınızı buradan yönetin.</p>
      </div>

      <Card className="shadow-sm border-black/5 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/20 p-8 border-b border-black/5">
            <CardTitle className="text-xl font-bold">Yönettiğim Varlıklar</CardTitle>
            <CardDescription>Aktif olarak yönetiminde bulunduğunuz STK, Marka, Vakıf, Kulüp ve Kooperatifler.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : managedItems.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2 px-6">
              <Building2 className="h-10 w-10 mx-auto opacity-30" />
              <p className="font-medium">Henüz yönettiğin bir varlık yok.</p>
              <p className="text-xs">Aşağıdan yeni başvuru yapabilir veya bir kuruluştan davet bekleyebilirsin.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
            {managedItems.map((item) => {
                const Icon = iconMap[item.icon] || Building2;
                return (
                <Link href={item.href} key={item.id} className="block hover:bg-muted/30 transition-all group">
                    <div className="flex items-center p-6">
                        <div className="relative mr-6">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-lg bg-white">
                                <AvatarImage src={item.logoUrl} alt={item.name} className="object-contain p-1" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{item.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 p-1.5 bg-background rounded-lg shadow-md border border-black/5">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <p className="font-bold text-lg text-[#1d1d1f] group-hover:text-primary transition-colors">{item.name}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-[#f5f5f7] border-none text-muted-foreground">{item.type}</Badge>
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5", statusVariantMap[item.status as keyof typeof statusVariantMap])}>
                                    {item.status === 'approved' ? 'Aktif' : 'Onay Bekliyor'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Yönet</span>
                            <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                </Link>
            )})}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
              <h3 className="text-2xl font-bold">Yeni Varlık Ekle</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Başka bir STK, marka veya kulüp yönetimimine dahil olmak için yeni bir başvuru yapabilirsiniz.</p>
          </div>
          <Button asChild size="lg" className="rounded-full px-10 h-14 font-bold shadow-xl shadow-primary/20">
              <Link href="/login/selection?action=register&type=corporate">Yeni Başvuru Başlat</Link>
          </Button>
      </Card>
    </div>
  );
}