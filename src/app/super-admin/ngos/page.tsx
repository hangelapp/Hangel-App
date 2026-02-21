'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ngos as initialNgos } from "@/lib/data";
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { NGO } from "@/lib/types";

type NGOWithStatus = NGO & { status: 'Aktif' | 'Pasif' };

export default function NgosPage() {
    const { toast } = useToast();
    const [ngos, setNgos] = useState<NGOWithStatus[]>([]);

    useEffect(() => {
        const storedNgos = localStorage.getItem('managedNgos');
        if (storedNgos) {
            setNgos(JSON.parse(storedNgos));
        } else {
            const initialNgosWithStatus = initialNgos.map(n => ({...n, status: 'Aktif' as 'Aktif' | 'Pasif'}));
            setNgos(initialNgosWithStatus);
        }
    }, []);

    useEffect(() => {
        if (ngos.length > 0) {
           localStorage.setItem('managedNgos', JSON.stringify(ngos));
        }
    }, [ngos]);


    const handleToggleActive = (id: string) => {
        setNgos(prevNgos => prevNgos.map(n => {
            if (n.id === id) {
                const newStatus = n.status === 'Aktif' ? 'Pasif' : 'Aktif';
                toast({ title: `Kuruluş ${newStatus} Hale Getirildi`, description: `${n.name} durumu güncellendi.` });
                return { ...n, status: newStatus };
            }
            return n;
        }));
    };

    const handleRemove = (id: string, name: string) => {
        setNgos(prevNgos => {
            const updatedNgos = prevNgos.filter(n => n.id !== id);
            localStorage.setItem('managedNgos', JSON.stringify(updatedNgos));
            return updatedNgos;
        });
        toast({
            variant: 'destructive',
            title: "Kuruluş Kaldırıldı",
            description: `${name} platformdan kalıcı olarak kaldırıldı.`,
        });
    };

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">STK Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm STK'lar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm STK'ları görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {ngos.map(ngo => (
                       <div key={ngo.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                   <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{ngo.name}</p>
                                   <p className="text-sm text-muted-foreground">{ngo.category}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-medium">{ngo.transparencyScore} Puan</span>
                               <Button variant="outline" size="sm" onClick={() => toast({ title: "Bu özellik yakında eklenecektir."})}>Profili Düzenle</Button>
                               <Button variant="outline" size="sm" onClick={() => handleToggleActive(ngo.id)}>
                                 {ngo.status === 'Aktif' ? 'Pasife Al' : 'Aktif Et'}
                               </Button>
                               <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Kaldır</Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                       <AlertDialogHeader>
                                           <AlertDialogTitle>{ngo.name} kuruluşunu kaldırmak istediğinizden emin misiniz?</AlertDialogTitle>
                                           <AlertDialogDescription>
                                            Bu işlem geri alınamaz. Kuruluş ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter>
                                           <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                            className={cn(buttonVariants({ variant: "destructive" }))} 
                                            onClick={() => handleRemove(ngo.id, ngo.name)}>
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
