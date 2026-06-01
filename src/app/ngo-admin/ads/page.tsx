'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Target, Globe, ShieldCheck, KeyRound, CheckCircle2, Loader2, RefreshCw, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

export default function AdsManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const agencies = [
        { id: 'go', name: t('ngoAdminAds.agency1'), key: '891bae...9cd3', status: t('ngoAdminAds.statusActive'), color: 'bg-orange-600' },
        { id: 'ao', name: t('ngoAdminAds.agency2'), key: '942147...48d48', status: t('ngoAdminAds.statusActive'), color: 'bg-blue-500' },
        { id: 'ra', name: t('ngoAdminAds.agency3'), key: '2ae3a9...bb54', status: t('ngoAdminAds.statusActive'), color: 'bg-red-600' }
    ];

    const handleSaveIntegration = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({
                title: t('ngoAdminAds.toastSavedTitle'),
                description: t('ngoAdminAds.toastSavedDesc')
            });
            setIsSaving(false);
        }, 1500);
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        setTimeout(() => {
            toast({
                title: t('ngoAdminAds.toastConnectionOkTitle'),
                description: t('ngoAdminAds.toastConnectionOkDesc'),
            });
            setIsTesting(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminAds.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngoAdminAds.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngoAdminAds.subtitle')}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="marketplace"><Globe className="mr-2 h-4 w-4" /> {t('ngoAdminAds.tabMarketplace')}</TabsTrigger>
                    <TabsTrigger value="campaigns"><Megaphone className="mr-2 h-4 w-4" /> {t('ngoAdminAds.tabCampaigns')}</TabsTrigger>
                    <TabsTrigger value="integration"><KeyRound className="mr-2 h-4 w-4" /> {t('ngoAdminAds.tabIntegration')}</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('ngoAdminAds.partnerSlotsTitle')}</CardTitle>
                            <CardDescription>{t('ngoAdminAds.partnerSlotsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { site: 'haberler.com', slot: t('ngoAdminAds.slotHeadline'), type: t('ngoAdminAds.typeFree'), reach: '100k/Gün' },
                                { site: 'alisveris-sitesi.tr', slot: t('ngoAdminAds.slotCart'), type: t('ngoAdminAds.typeDiscount'), reach: '25k/Gün' },
                                { site: 'blog-portali.net', slot: t('ngoAdminAds.slotPost'), type: t('ngoAdminAds.typeFree'), reach: '10k/Gün' }
                            ].map((partner, i) => (
                                <div key={i} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary transition-colors bg-background shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-muted"><Globe className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm">{partner.site}</h4>
                                            <p className="text-xs text-muted-foreground">{partner.slot} • {partner.reach}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn(partner.type === t('ngoAdminAds.typeFree') ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700")}>{partner.type}</Badge>
                                        <Button size="sm" onClick={() => toast({title: t('ngoAdminAds.toastApplied'), description: t('ngoAdminAds.toastAppliedDesc')})}>{t('ngoAdminAds.requestSlotBtn')}</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="campaigns" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('ngoAdminAds.metricReach')}</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">125,400</p></CardContent>
                        </Card>
                        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('ngoAdminAds.metricCtr')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">3.2%</p></CardContent></Card>
                        <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('ngoAdminAds.metricActive')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">4</p></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <Card className="border-primary/30 bg-primary/5 shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" /> {t('ngoAdminAds.triplePoolTitle')}
                                    </CardTitle>
                                    <CardDescription>{t('ngoAdminAds.triplePoolDesc')}</CardDescription>
                                </div>
                                <Badge className="bg-green-600 text-white">{t('ngoAdminAds.activeStatus')}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                {agencies.map((agency) => (
                                    <div key={agency.id} className="flex items-center justify-between p-4 bg-background border rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg text-white", agency.color)}>
                                                <Target className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{agency.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">{agency.key}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 border-green-200">{t('ngoAdminAds.connectedBadge')}</Badge>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-100/50 rounded-xl border border-blue-200 text-blue-800 text-[11px] font-medium leading-relaxed">
                                <Layers className="h-4 w-4 shrink-0" />
                                <p>{t('ngoAdminAds.poolDescription')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-background/50 border-t p-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting}>
                                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                {t('ngoAdminAds.testAllBtn')}
                            </Button>
                            <Button size="sm" onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                {t('ngoAdminAds.saveBtn')}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>{t('ngoAdminAds.conversionTitle')}</CardTitle>
                            <CardDescription>{t('ngoAdminAds.conversionDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminAds.metaPixelLabel')}</Label>
                                    <Input placeholder="123456789012345" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminAds.googleAdsLabel')}</Label>
                                    <Input placeholder="AW-123456789" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>{t('ngoAdminAds.conversionBanner')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/10 p-4 flex justify-end">
                            <Button onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngoAdminAds.savingEllipsis')}</> : t('ngoAdminAds.saveBtn')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
