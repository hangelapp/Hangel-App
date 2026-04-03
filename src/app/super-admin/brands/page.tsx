
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Loader2, Store, Trash2, Power, PowerOff, ExternalLink, Percent } from 'lucide-react';
import type { Brand } from "@/lib/types";
import Link from 'next/link';

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    
    const brandsQuery = useMemoFirebase(() => collection(db, 'brands'), [db]);
    const { data: brands, isLoading } = useCollection<Brand>(brandsQuery);

    const handleToggleStatus = (id: string, currentStatus: string) => {
        const isPassive = currentStatus === 'Pasif';
        const brandRef = doc(db, 'brands', id);
        updateDocumentNonBlocking(brandRef, { status: isPassive ? 'Aktif' : 'Pasif' });
        
        toast({ 
            title: isPassive ? "Marka Aktifleştirildi" : "Marka Pasife Alındı", 
            description: "Durum değişikliği sisteme yansıtıldı." 
        });
    };

    const handleRemove = (id: string, name: string) => {
        const brandRef = doc(db, 'brands', id);
        deleteDocumentNonBlocking(brandRef);
        toast({
            variant: 'destructive',
            title: "Marka Kaldırıldı",
            description: `${name} platformdan kalıcı olarak silindi.`,
        });
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Marka Listesi Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Marka Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">İş ortağı markaları, bağış oranlarını ve listeleme durumlarını yönetin.</p>
            </div>

            <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-8">
                    <CardTitle className="text-xl font-bold">İş Ortağı Markalar ({brands?.length || 0})</CardTitle>
                    <CardDescription>Platformda aktif alışveriş-bağış döngüsünde yer alan markalar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y border-black/5">
                   {brands && brands.length > 0 ? brands.map(brand => {
                       const isPassive = (brand as any).status === 'Pasif';
                       return (
                       <div key={brand.id} className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-muted/30 transition-colors", isPassive && "opacity-60 grayscale")}>
                           <div className="flex items-center gap-5 flex-1">
                               <Avatar className="h-14 w-14 border-2 border-white shadow-lg bg-white">
                                   <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-1" />
                                   <AvatarFallback className="font-black text-xl">{brand.name[0]}</AvatarFallback>
                               </Avatar>
                               <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                       <p className="font-black text-lg text-[#1d1d1f] tracking-tight">{brand.name}</p>
                                       {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                                   </div>
                                   <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                       <span className="flex items-center gap-1 font-bold text-primary"><Percent className="h-3 w-3" /> {brand.donationRate} Bağış</span>
                                       <span>•</span>
                                       <span className="capitalize">{brand.type}</span>
                                       <span>•</span>
                                       <span>{brand.category}</span>
                                   </div>
                               </div>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto">
                               <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" asChild>
                                   <Link href={`/market/${brand.slug}`}>Mağazayı Gör</Link>
                               </Button>
                               <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" onClick={() => handleToggleStatus(brand.id, (brand as any).status)}>
                                 {isPassive ? <><Power className="mr-2 h-4 w-4" /> Aktif Et</> : <><PowerOff className="mr-2 h-4 w-4" /> Pasife Al</>}
                               </Button>
                               <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent className="rounded-[2.5rem]">
                                       <AlertDialogHeader>
                                           <AlertDialogTitle className="text-xl font-bold">{brand.name} markasını silmek istiyor musunuz?</AlertDialogTitle>
                                           <AlertDialogDescription className="text-base font-medium">
                                            Bu işlem geri alınamaz. Marka ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter className="gap-2">
                                           <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                            className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")} 
                                            onClick={() => handleRemove(brand.id, brand.name)}>
                                                Evet, Kalıcı Olarak Sil
                                            </AlertDialogAction>
                                       </AlertDialogFooter>
                                   </AlertDialogContent>
                               </AlertDialog>
                           </div>
                       </div>
                   )}) : (
                       <div className="p-20 text-center text-muted-foreground italic">Henüz kayıtlı bir marka bulunmuyor.</div>
                   )}
                </div>
                </CardContent>
            </Card>
        </div>
    )
}
