'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';


const savedCards = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/25' },
    { id: '2', type: 'Mastercard', last4: '5555', expiry: '08/26' },
];

export default function WalletSettingsPage() {
    const router = useRouter();

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Cüzdan ve Ödeme Yöntemleri</h1>
                <p className="text-muted-foreground text-sm">hangel kartınızı ve kayıtlı ödeme yöntemlerinizi yönetin.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>hangel Kart</CardTitle>
                    <CardDescription>QR kod ile ödeme ve transferler için kullandığınız dijital kartınız.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                        <p className="text-lg font-semibold">Bireysel Kart</p>
                        <p className="text-2xl font-bold">1.250,75 ₺</p>
                    </div>
                     <Button variant="outline" className="w-full" onClick={() => router.push('/qr-payment')}>
                        hangel Kartını Yönet ve İşlemleri Görüntüle
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Kayıtlı Banka/Kredi Kartlarım</CardTitle>
                    <CardDescription>Bakiye yüklemek için kullandığınız kayıtlı kartlar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {savedCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{card.type} **** {card.last4}</p>
                                    <p className="text-sm text-muted-foreground">Son Kullanma: {card.expiry}</p>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Kartı Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlem geri alınamaz. **** {card.last4} ile biten kartınız sistemden kalıcı olarak silinecektir.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))}>Evet, Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    <Button variant="secondary" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Kart Ekle
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
