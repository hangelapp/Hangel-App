
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/providers/language-provider';

export default function PaymentSystemsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();

    const providers = [
        { id: 'iyzico', name: 'iyzico', logo: 'i', color: 'bg-[#14294B]', status: t('ngoAdminPayments.statusConnected'), price: t('ngoAdminPayments.iyzicoPrice'), discount: t('ngoAdminPayments.iyzicoDiscount') },
        { id: 'paytr', name: 'PayTR', logo: 'P', color: 'bg-[#00A8FF]', status: t('ngoAdminPayments.statusAvailable'), price: t('ngoAdminPayments.paytrPrice'), discount: t('ngoAdminPayments.paytrDiscount') },
        { id: 'stripe', name: 'Stripe', logo: 'S', color: 'bg-[#635BFF]', status: t('ngoAdminPayments.statusAvailable'), price: t('ngoAdminPayments.stripePrice'), discount: t('ngoAdminPayments.stripeDiscount') },
    ];

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminPayments.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngoAdminPayments.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngoAdminPayments.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", item.color)}>
                                {item.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <Badge variant={item.status === t('ngoAdminPayments.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium">{item.discount}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: t('ngoAdminPayments.toastApplying')})}>{t('ngoAdminPayments.connectVposBtn')}</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> {t('ngoAdminPayments.vposTitle')}</CardTitle>
                    <CardDescription>{t('ngoAdminPayments.vposDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('ngoAdminPayments.merchantId')}</Label>
                        <Input placeholder={t('ngoAdminPayments.merchantIdPh')} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('ngoAdminPayments.apiKey')}</Label>
                            <Input placeholder={t('ngoAdminPayments.apiKeyPh')} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('ngoAdminPayments.secretKey')}</Label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={() => toast({title: t('ngoAdminPayments.toastVerified')})}>{t('ngoAdminPayments.testAndSaveBtn')}</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
