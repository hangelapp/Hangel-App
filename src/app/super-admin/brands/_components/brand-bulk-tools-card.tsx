'use client';

import React from 'react';
import { Database, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BulkOp = 'idle' | 'clearing' | 'seeding';

interface BrandBulkToolsCardProps {
    bulkOp: BulkOp;
    seedCount: number;
    onClearAll: () => void | Promise<void>;
    onSeed: () => void | Promise<void>;
    onResetAndSeed: () => void | Promise<void>;
}

export const BrandBulkToolsCard = ({ bulkOp, seedCount, onClearAll, onSeed, onResetAndSeed }: BrandBulkToolsCardProps) => {
    return (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Veri Yönetim Araçları</CardTitle>
                <CardDescription>Demo verileri temizle ve mevcut marka datalarını ({seedCount} marka) Firestore'a yükle.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={bulkOp !== 'idle'} className="gap-1.5">
                            <Trash2 className="h-4 w-4" /> Tüm Markaları Temizle
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tüm marka kayıtları silinsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu işlem <strong>kalıcıdır</strong>. Firestore'daki <code>brands</code> koleksiyonundaki tüm dokümanlar silinir.
                                Başvurular ve kullanıcı bağlantıları etkilenmez.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: 'destructive' }))}
                                onClick={onClearAll}>
                                {bulkOp === 'clearing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Evet, Tümünü Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={onSeed} disabled={bulkOp !== 'idle'} className="gap-1.5">
                    {bulkOp === 'seeding' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Marka Datalarını Yükle ({seedCount} marka)
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={bulkOp !== 'idle'} className="gap-1.5 bg-red-600 hover:bg-red-700">
                            <RefreshCw className="h-4 w-4" /> Sıfırla ve Yeniden Yükle
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sıfırla ve Yeniden Yükle?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Önce mevcut tüm marka kayıtları silinir, ardından <strong>{seedCount} marka</strong> Firestore'a aktarılır.
                                Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: 'destructive' }))}
                                onClick={onResetAndSeed}>
                                Devam Et
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};
