'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Building2, Store, School, Heart, Leaf, ShoppingBag, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { managedItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export default function AdminPage() {
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
            <div className="divide-y divide-black/5">
            {managedItems.map((item, index) => {
                const Icon = iconMap[item.icon] || Building2;
                return (
                <Link href={item.href} key={index} className="block hover:bg-muted/30 transition-all group">
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
