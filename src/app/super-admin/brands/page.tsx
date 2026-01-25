'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { allEntityLists } from "@/lib/data";
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Brand } from "@/lib/types";

type BrandWithStatus = Brand & { status: 'Aktif' | 'Pasif' };

export default function BrandsPage() {
    const { toast } = useToast();
    const [brands, setBrands] = useState<BrandWithStatus[]>(allEntityLists.map(b => ({...b, status: 'Aktif'})));

    const handleToggleActive = (id: string) => {
        setBrands(prevBrands => prevBrands.map(b => {
            if (b.id === id) {
                const newStatus = b.status === 'Aktif' ? 'Pasif' : 'Aktif';
                toast({ title: `Marka ${newStatus} Hale Getirildi`, description: `${b.name} durumu güncellendi.` });
                return { ...b, status: newStatus };
            }
            return b;
        }));
    };

    const handleRemove = (id: string, name: string) => {
        setBrands(prevBrands => prevBrands.filter(b => b.id !== id));
        toast({
            variant: 'destructive',
            title: "Marka Kaldırıldı",
            description: `${name} platformdan kalıcı olarak kaldırıldı.`,
        });
    };
    
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Marka Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Markalar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm markaları, kooperatifleri ve sosyal işletmeleri görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {brands.map(brand => (
                       <div key={brand.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={brand.logoUrl} alt={brand.name} />
                                   <AvatarFallback>{brand.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{brand.name}</p>
                                   <p className="text-sm text-muted-foreground">{brand.category} - <span className="capitalize">{brand.type}</span></p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-primary">%{brand.donationRate}</span>
                               <Button variant="outline" size="sm" onClick={() => toast({ title: "Bu özellik yakında eklenecektir."})}>Profili Düzenle</Button>
                               <Button variant="outline" size="sm" onClick={() => handleToggleActive(brand.id)}>
                                 {brand.status === 'Aktif' ? 'Pasife Al' : 'Aktif Et'}
                               </Button>
                               <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Kaldır</Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                       <AlertDialogHeader>
                                           <AlertDialogTitle>{brand.name} markasını kaldırmak istediğinizden emin misiniz?</AlertDialogTitle>
                                           <AlertDialogDescription>
                                            Bu işlem geri alınamaz. Marka ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter>
                                           <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                            className={cn(buttonVariants({ variant: "destructive" }))} 
                                            onClick={() => handleRemove(brand.id, brand.name)}>
                                                Evet, Kaldır
                                            </AlertDialogAction>
                                       </AlertDialogFooter>
                                   </AlertDialogContent>
                               </AlertDialog>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
