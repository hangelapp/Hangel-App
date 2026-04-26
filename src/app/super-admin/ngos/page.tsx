
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React, { useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Trash2, Edit3, Power, PowerOff } from 'lucide-react';
import type { NGO } from "@/lib/types";

export default function NgosPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const router = useRouter();
    const { user: authUser } = useUser();
    const myUserDocRef = useMemoFirebase(() => {
        if (!db || !authUser?.uid) return null;
        return doc(db, 'users', authUser.uid);
    }, [db, authUser?.uid]);
    const { data: myUserData } = useDoc<any>(myUserDocRef);
    
    const ngosQuery = useMemoFirebase(() => collection(db, 'ngos'), [db]);
    const { data: ngos, isLoading } = useCollection<NGO>(ngosQuery);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const isPassive = currentStatus === 'Pasif';
        const ngoRef = doc(db, 'ngos', id);
        try {
            await updateDoc(ngoRef, { status: isPassive ? 'Aktif' : 'Pasif' });
            toast({
                title: isPassive ? 'Kuruluş Aktifleştirildi' : 'Kuruluş Pasife Alındı',
                description: isPassive
                    ? 'STK platformdaki tüm listelerde tekrar görünür olacak.'
                    : 'STK artık platformdaki public listelerde görünmeyecek.',
            });
        } catch (e: any) {
            console.error('NGO status toggle failed:', e);
            toast({
                variant: 'destructive',
                title: 'Durum güncellenemedi',
                description: e?.code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : (e?.message || 'Beklenmeyen bir hata oluştu.'),
            });
        }
    };

    const handleRemove = async (id: string, name: string) => {
        const ngoRef = doc(db, 'ngos', id);
        try {
            await deleteDoc(ngoRef);
            toast({
                variant: 'destructive',
                title: 'Kuruluş Kaldırıldı',
                description: `${name} platformdan kalıcı olarak silindi.`,
            });
        } catch (e: any) {
            console.error('NGO delete failed:', e);
            toast({
                variant: 'destructive',
                title: 'Silme başarısız',
                description: e?.code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : (e?.message || 'Beklenmeyen bir hata oluştu.'),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">STK Listesi Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">STK Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">Kayıtlı sivil toplum kuruluşlarını ve şeffaflık puanlarını denetleyin.</p>
            </div>

            {/* Debug paneli — auth.uid ile user doc'taki role eşleşmesini göster */}
            <Card className="rounded-2xl border-amber-200 bg-amber-50/40 p-4">
                <div className="text-xs font-mono space-y-1">
                    <p><strong>auth.uid:</strong> {authUser?.uid || '(giriş yok)'}</p>
                    <p><strong>auth.email:</strong> {authUser?.email || '(yok)'}</p>
                    <p><strong>users/{authUser?.uid || '?'}.role:</strong> {myUserData?.role ? `"${myUserData.role}"` : '(role field yok veya doc yok)'}</p>
                    <p><strong>Süper Admin Sayılır mı?</strong> {(authUser?.email === '5384009090@hangel.org' || myUserData?.role === 'super-admin') ? '✓ EVET' : '✗ HAYIR'}</p>
                </div>
            </Card>

            <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-8">
                    <CardTitle className="text-xl font-bold">Tüm Kuruluşlar ({ngos?.length || 0})</CardTitle>
                    <CardDescription>Aktif ve pasif durumdaki kuruluşların listesi.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y border-black/5">
                   {ngos && ngos.length > 0 ? ngos.map(ngo => {
                       const isPassive = (ngo as any).status === 'Pasif';
                       return (
                       <div key={ngo.id} className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-muted/30 transition-colors cursor-pointer", isPassive && "opacity-60 grayscale")}
                            onClick={() => router.push(`/ngos/${ngo.id}`)}>
                           <div className="flex items-center gap-5 flex-1">
                               <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                                   <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-1" />
                                   <AvatarFallback className="font-black text-xl">{ngo.name[0]}</AvatarFallback>
                               </Avatar>
                               <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                       <p className="font-black text-lg text-[#1d1d1f] tracking-tight">{ngo.name}</p>
                                       {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                                   </div>
                                   <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                       <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {ngo.transparencyScore} Puan</span>
                                       <span>•</span>
                                       <span className="capitalize">{ngo.type}</span>
                                       <span>•</span>
                                       <span>{ngo.category}</span>
                                   </div>
                               </div>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                               <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" asChild>
                                   <Link href={`/ngos/${ngo.id}`}>Profili Gör</Link>
                               </Button>
                               <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" asChild>
                                   <Link href={`/super-admin/ngos/${ngo.id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Düzelt</Link>
                               </Button>
                               <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" onClick={() => handleToggleStatus(ngo.id, (ngo as any).status)}>
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
                                           <AlertDialogTitle className="text-xl font-bold">{ngo.name} kuruluşunu silmek istiyor musunuz?</AlertDialogTitle>
                                           <AlertDialogDescription className="text-base font-medium">
                                            Bu işlem geri alınamaz. Kuruluş ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                           </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter className="gap-2">
                                           <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                                           <AlertDialogAction 
                                            className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")} 
                                            onClick={() => handleRemove(ngo.id, ngo.name)}>
                                                Evet, Kalıcı Olarak Sil
                                            </AlertDialogAction>
                                       </AlertDialogFooter>
                                   </AlertDialogContent>
                               </AlertDialog>
                           </div>
                       </div>
                   )}) : (
                       <div className="p-20 text-center text-muted-foreground italic">Henüz kayıtlı bir kuruluş bulunmuyor.</div>
                   )}
                </div>
                </CardContent>
            </Card>
        </div>
    )
}
