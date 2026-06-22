'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Package, Globe, Copy, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

const marketplaceProviders = [
    { id: 'trendyol', name: 'Trendyol', logo: 'T', color: 'bg-[#f27a1a]', connected: false },
    { id: 'hepsiburada', name: 'Hepsiburada', logo: 'H', color: 'bg-[#ff6000]', connected: true },
    { id: 'amazon', name: 'Amazon', logo: 'A', color: 'bg-[#232f3e]', connected: false },
    { id: 'n11', name: 'n11', logo: 'n', color: 'bg-[#5d1ed4]', connected: false },
];

export default function EcommerceManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const xmlFeedUrl = "https://hangel.org/api/v1/xml/ahbap-isletme-feed";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: t('ngo_admin_ecommerce.copiedTitle'), description: t('ngo_admin_ecommerce.copiedDescription') });
    };

    const handleSaveIntegration = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ title: t('ngo_admin_ecommerce.connectedToastTitle'), description: t('ngo_admin_ecommerce.connectedToastDescription') });
            setIsSaving(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_ecommerce.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_ecommerce.heading')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngo_admin_ecommerce.subheading')}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Globe className="mr-2 h-4 w-4" /> {t('ngo_admin_ecommerce.tabIntegration')}</TabsTrigger>
                    <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> {t('ngo_admin_ecommerce.tabProducts')}</TabsTrigger>
                    <TabsTrigger value="xml"><Copy className="mr-2 h-4 w-4" /> {t('ngo_admin_ecommerce.tabXml')}</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {marketplaceProviders.map((mp) => (
                            <Card key={mp.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", mp.color)}>
                                        {mp.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{mp.name}</p>
                                        <Badge variant={mp.connected ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {mp.connected ? t('ngo_admin_ecommerce.providerStatusConnected') : t('ngo_admin_ecommerce.providerStatusConnectable')}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: t('ngo_admin_ecommerce.providerRedirectTitle'), description: t('ngo_admin_ecommerce.providerRedirectDescription').replace('{name}', mp.name)})}>{t('ngo_admin_ecommerce.providerConnectButton')}</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> {t('ngo_admin_ecommerce.apiInfoTitle')}</CardTitle>
                            <CardDescription>{t('ngo_admin_ecommerce.apiInfoDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('ngo_admin_ecommerce.storeIdLabel')}</Label>
                                <Input placeholder={t('ngo_admin_ecommerce.storeIdPlaceholder')} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('ngo_admin_ecommerce.apiKeyLabel')}</Label>
                                    <Input placeholder={t('ngo_admin_ecommerce.apiKeyPlaceholder')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ngo_admin_ecommerce.apiSecretLabel')}</Label>
                                    <Input type="password" placeholder={t('ngo_admin_ecommerce.apiSecretPlaceholder')} />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-orange-50 text-orange-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>{t('ngo_admin_ecommerce.integrationNotice')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleSaveIntegration} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngo_admin_ecommerce.savingLabel')}</> : t('ngo_admin_ecommerce.saveButton')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="products" className="mt-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold">{t('ngo_admin_ecommerce.productsActiveTitle')}</h3>
                        <Button size="sm" disabled><Plus className="mr-2 h-4 w-4" /> {t('ngo_admin_ecommerce.productsAddButton')}</Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground -mt-4">Bu modül geliştiriliyor, yakında. Aşağıdaki ürünler örnek (demo) verilerdir.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: '1', name: t('ngo_admin_ecommerce.sampleProduct1'), price: '250 ₺', stock: 120, img: 'https://picsum.photos/seed/t1/200/200' },
                            { id: '2', name: t('ngo_admin_ecommerce.sampleProduct2'), price: '85 ₺', stock: 450, img: 'https://picsum.photos/seed/t2/200/200' },
                            { id: '3', name: t('ngo_admin_ecommerce.sampleProduct3'), price: '120 ₺', stock: 85, img: 'https://picsum.photos/seed/t3/200/200' }
                        ].map(product => (
                            <Card key={product.id} className="overflow-hidden group hover:border-primary transition-colors">
                                <div className="relative aspect-square w-full">
                                    <Image src={product.img} alt={product.name} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        <Button variant="secondary" size="sm" disabled>{t('ngo_admin_ecommerce.productEditButton')}</Button>
                                        <span className="text-[10px] text-white/80">geliştiriliyor</span>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                    <p className="text-lg font-black text-primary">{product.price}</p>
                                    <p className="text-[10px] text-muted-foreground">{t('ngo_admin_ecommerce.productStockLabel')}: {product.stock}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="xml" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>{t('ngo_admin_ecommerce.xmlTitle')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{t('ngo_admin_ecommerce.xmlDescription')}</p>
                            <div className="flex gap-2">
                                <Input readOnly value={xmlFeedUrl} className="font-mono text-xs bg-muted" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(xmlFeedUrl)} aria-label={t('ngo_admin_ecommerce.xmlCopyAria')}><Copy className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => toast({title: t('ngo_admin_ecommerce.xmlRefreshToast')})}>{t('ngo_admin_ecommerce.xmlRefreshButton')}</Button>
                                <Button variant="outline" className="flex-1" onClick={() => window.open(xmlFeedUrl, '_blank')}>{t('ngo_admin_ecommerce.xmlPreviewButton')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}