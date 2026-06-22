'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { qrPaymentCardData } from '@/lib/data';
import { useTranslation } from '@/components/providers/language-provider';

export default function WalletSettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();

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
                <CardContent className="space-y-4">
                    {/* Kayıtlı banka kartı backend'i henüz yok — sahte kart yerine
                        dürüst boş durum. Bağış/ödeme akışı hangel QR kartlarıyla
                        yürür → kullanıcıyı çalışan QR akışına yönlendir. */}
                    <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
                        <CreditCard className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium text-foreground">{t('dashboard.settingsWallet.emptyTitle')}</p>
                        <p className="text-xs max-w-xs mt-1">{t('dashboard.settingsWallet.emptyDesc')}</p>
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/qr-payment">
                            <QrCode className="mr-2 h-4 w-4" />
                            {t('dashboard.settingsWallet.qrOptionTitle')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
