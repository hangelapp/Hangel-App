'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Plus, Trash2, QrCode, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { qrPaymentCardData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const initialSavedCards = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/25' },
    { id: '2', type: 'Mastercard', last4: '5555', expiry: '08/26' },
];

export default function WalletSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [savedCards, setSavedCards] = useState(initialSavedCards);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    const handleCardDelete = (cardId: string) => {
        setSavedCards(prev => prev.filter(card => card.id !== cardId));
        toast({
            variant: "destructive",
            title: "Kart Silindi",
            description: "Kayıtlı kartınız başarıyla silindi.",
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Cüzdan ve Ödeme Yöntemleri</h1>
                <p className="text-muted-foreground text-sm">hangel kartınızı ve kayıtlı ödeme yöntemlerinizi yönetin.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>hangel Kartlarım</CardTitle>
                    <CardDescription>QR kod ile ödeme ve transferler için kullandığınız dijital kartlarınız.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {qrPaymentCardData.map(card => (
                        <div key={card.id} className={cn("p-4 rounded-lg text-primary-foreground", card.bgColor)}>
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold">{card.type} Kart</p>
                                <p className="text-2xl font-bold">{card.balance}</p>
                            </div>
                        </div>
                    ))}
                     <Button variant="outline" className="w-full" onClick={() => router.push('/qr-payment')}>
                        Tüm Kartları Yönet ve İşlemleri Görüntüle
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
                                     <Button variant="ghost" size="icon" className="text-destructive" aria-label="Kartı sil">
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
                                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleCardDelete(card.id)}>Evet, Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    <Button variant="secondary" className="w-full" onClick={() => setIsAddCardOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Kart Ekle
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni Kart Ekleme</DialogTitle>
                        <DialogDescription>
                            Banka/kredi kartı entegrasyonu için ödeme altyapısı kurulum aşamasındadır.
                            Şimdilik bakiye yüklemek için aşağıdaki alternatifleri kullanabilirsiniz.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Link
                            href="/qr-payment"
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                            onClick={() => setIsAddCardOpen(false)}
                        >
                            <QrCode className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">QR ile öde</p>
                                <p className="text-xs text-muted-foreground">hangel QR koduyla anında ödeme alıp gönderin.</p>
                            </div>
                        </Link>
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                            <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">Banka EFT / Havale</p>
                                <p className="text-xs text-muted-foreground">Bakiye yüklemek için doğrudan hangel kurumsal hesabımıza EFT/havale yapabilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsAddCardOpen(false)}>Kapat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
