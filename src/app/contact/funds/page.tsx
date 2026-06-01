
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, ArrowLeft, Globe, LineChart, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

export default function FundsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('contactPage.sentTitle'),
            description: t('contactFunds.sentDesc'),
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <DollarSign className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">{t('contactFunds.title')}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    {t('contactFunds.subtitle')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('contactFunds.whyTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Globe className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">{t('contactFunds.benefit1Title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('contactFunds.benefit1Desc')}</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <LineChart className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">{t('contactFunds.benefit2Title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('contactFunds.benefit2Desc')}</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">{t('contactFunds.benefit3Title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('contactFunds.benefit3Desc')}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('contactFunds.contactTitle')}</CardTitle>
                    <CardDescription>{t('contactFunds.contactDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fund-name">{t('contactFunds.fundName')}</Label>
                                <Input id="fund-name" placeholder={t('contactFunds.fundNamePh')} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">{t('contactPage.contactPerson')}</Label>
                                <Input id="contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('contactCompanies.emailLabel')}</Label>
                                <Input id="email" type="email" placeholder="contact@fund.org" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('contactPage.phone')}</Label>
                                <Input id="phone" type="tel" placeholder="+..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">{t('contactPage.message')}</Label>
                            <Textarea id="message" placeholder={t('contactFunds.messagePh')} rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full">{t('contactCompanies.sendMessage')}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
