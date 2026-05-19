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
import { useTranslation } from '@/components/providers/language-provider';

const initialSavedCards = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/25' },
    { id: '2', type: 'Mastercard', last4: '5555', expiry: '08/26' },
];

export default function WalletSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [savedCards, setSavedCards] = useState(initialSavedCards);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    const handleCardDelete = (cardId: string) => {
        setSavedCards(prev => prev.filter(card => card.id !== cardId));
        toast({
            variant: "destructive",
            title: t('dashboard.settingsWallet.toastCardDeletedTitle'),
            description: t('dashboard.settingsWallet.toastCardDeletedDesc'),
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsWallet.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsWallet.subheading')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settingsWallet.hangelCardsTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.settingsWallet.hangelCardsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {qrPaymentCardData.map(card => (
                        <div key={card.id} className={cn("p-4 rounded-lg text-primary-foreground", card.bgColor)}>
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold">{card.type}{t('dashboard.settingsWallet.cardTypeSuffix')}</p>
                                <p className="text-2xl font-bold">{card.balance}</p>
                            </div>
                        </div>
                    ))}
                     <Button variant="outline" className="w-full" onClick={() => router.push('/qr-payment')}>
                        {t('dashboard.settingsWallet.manageAllCta')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settingsWallet.savedCardsTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.settingsWallet.savedCardsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {savedCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{card.type} **** {card.last4}</p>
                                    <p className="text-sm text-muted-foreground">{t('dashboard.settingsWallet.expiryLabel')} {card.expiry}</p>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="text-destructive" aria-label={t('dashboard.settingsWallet.deleteCardAria')}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t('dashboard.settingsWallet.deleteDialogTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('dashboard.settingsWallet.deleteDialogDescPrefix')}{card.last4}{t('dashboard.settingsWallet.deleteDialogDescSuffix')}
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t('dashboard.settingsWallet.deleteCancel')}</AlertDialogCancel>
                                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleCardDelete(card.id)}>{t('dashboard.settingsWallet.deleteConfirm')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    <Button variant="secondary" className="w-full" onClick={() => setIsAddCardOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('dashboard.settingsWallet.addCardBtn')}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.settingsWallet.addDialogTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dashboard.settingsWallet.addDialogDesc')}
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
                                <p className="font-medium text-sm">{t('dashboard.settingsWallet.qrOptionTitle')}</p>
                                <p className="text-xs text-muted-foreground">{t('dashboard.settingsWallet.qrOptionDesc')}</p>
                            </div>
                        </Link>
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                            <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{t('dashboard.settingsWallet.bankOptionTitle')}</p>
                                <p className="text-xs text-muted-foreground">{t('dashboard.settingsWallet.bankOptionDesc')}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsAddCardOpen(false)}>{t('dashboard.settingsWallet.addDialogClose')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
