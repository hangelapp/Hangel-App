'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { studentClubs as initialClubs } from "@/lib/data";
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { StudentClub } from "@/lib/types";

type ClubWithStatus = StudentClub & { status: 'Aktif' | 'Pasif' };

export default function ClubsPage() {
    const { toast } = useToast();
    const [clubs, setClubs] = useState<ClubWithStatus[]>([]);

    useEffect(() => {
        const storedClubs = localStorage.getItem('managedClubs');
        if (storedClubs) {
            setClubs(JSON.parse(storedClubs));
        } else {
            const initialClubsWithStatus = initialClubs.map(c => ({...c, status: 'Aktif' as 'Aktif' | 'Pasif'}));
            setClubs(initialClubsWithStatus);
        }
    }, []);

    useEffect(() => {
        if (clubs.length > 0) {
           localStorage.setItem('managedClubs', JSON.stringify(clubs));
        }
    }, [clubs]);

    const handleToggleActive = (id: string) => {
        setClubs(prevClubs => prevClubs.map(c => {
            if (c.id === id) {
                const newStatus = c.status === 'Aktif' ? 'Pasif' : 'Aktif';
                toast({ title: `Kulüp ${newStatus} Hale Getirildi`, description: `${c.name} durumu güncellendi.` });
                return { ...c, status: newStatus };
            }
            return c;
        }));
    };

    const handleRemove = (id: string, name: string) => {
        setClubs(prevClubs => {
            const updatedClubs = prevClubs.filter(c => c.id !== id);
            localStorage.setItem('managedClubs', JSON.stringify(updatedClubs));
            return updatedClubs;
        });
        toast({
            variant: 'destructive',
            title: "Kulüp Kaldırıldı",
            description: `${name} platformdan kalıcı olarak kaldırıldı.`,
        });
    };

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Öğrenci Kulübü Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Öğrenci Kulüpleri</CardTitle>
                    <CardDescription>
                        Platformdaki tüm öğrenci kulüplerini görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {clubs.map(club => (
                       <div key={club.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={club.avatarUrl} alt={club.name} />
                                   <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{club.name}</p>
                                   <p className="text-sm text-muted-foreground">{club.university}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-medium">{club.points} Puan</span>
                               <Button variant="outline" size="sm" onClick={() => toast({ title: "Bu özellik yakında eklenecektir."})}>Profili Düzenle</Button>
                               <Button variant="outline" size="sm" onClick={() => handleToggleActive(club.id)}>
                                 {club.status === 'Aktif' ? 'Pasife Al' : 'Aktif Et'}
                               </Button>
                                <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">Kaldır</Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                       <AlertDialogHeader>
                                           <AlertDialogTitle>{club.name} kulübünü kaldırmak istediğinizden emin misiniz?</AlertDialogTitle>
                                           <AlertDialogDescription>
                                            Bu işlem geri alınamaz. Kulüp ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter>
                                           <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                            className={cn(buttonVariants({ variant: "destructive" }))} 
                                            onClick={() => handleRemove(club.id, club.name)}>
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
