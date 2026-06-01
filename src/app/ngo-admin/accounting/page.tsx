'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calculator, Settings2, KeyRound, ShieldCheck, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

export default function AccountingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string | null>(null);

    const erpProviders = [
        { id: 'parasut', name: 'Paraşüt', logo: 'P', color: 'bg-orange-600', status: t('ngoAdminAccounting.statusConnected') },
        { id: 'logo', name: 'Logo İşbaşı', logo: 'L', color: 'bg-red-600', status: t('ngoAdminAccounting.statusAvailable') },
        { id: 'kolaybi', name: 'KolayBi', logo: 'K', color: 'bg-blue-500', status: t('ngoAdminAccounting.statusAvailable') },
        { id: 'bizimhesap', name: 'Bizim Hesap', logo: 'B', color: 'bg-emerald-600', status: t('ngoAdminAccounting.statusAvailable') },
    ];

    const handleConnect = (id: string, name: string) => {
        setActiveProvider(id);
        setTimeout(() => {
            toast({ title: `${name} ${t('ngoAdminAccounting.toastConnectStartedSuffix')}`, description: t('ngoAdminAccounting.toastRedirecting') });
            setActiveProvider(null);
        }, 1000);
    };

    const handleValidate = () => {
        setIsValidating(true);
        setTimeout(() => {
            toast({ title: t('ngoAdminAccounting.toastVerifiedTitle'), description: t('ngoAdminAccounting.toastVerifiedDesc') });
            setIsValidating(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminAccounting.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngoAdminAccounting.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngoAdminAccounting.subtitle')}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> {t('ngoAdminAccounting.tabIntegration')}</TabsTrigger>
                    <TabsTrigger value="overview"><Calculator className="mr-2 h-4 w-4" /> {t('ngoAdminAccounting.tabOverview')}</TabsTrigger>
                    <TabsTrigger value="api"><LinkIcon className="mr-2 h-4 w-4" /> {t('ngoAdminAccounting.tabApi')}</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {erpProviders.map((erp) => (
                            <Card key={erp.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", erp.color)}>
                                        {erp.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{erp.name}</p>
                                        <Badge variant={erp.status === t('ngoAdminAccounting.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {erp.status}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        disabled={activeProvider === erp.id}
                                        onClick={() => handleConnect(erp.id, erp.name)}
                                    >
                                        {activeProvider === erp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (erp.status === t('ngoAdminAccounting.statusConnected') ? t('ngoAdminAccounting.manageBtn') : t('ngoAdminAccounting.connectBtn'))}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> {t('ngoAdminAccounting.codesTitle')}</CardTitle>
                            <CardDescription>{t('ngoAdminAccounting.codesDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminAccounting.usernameLabel')}</Label>
                                    <Input placeholder={t('ngoAdminAccounting.usernamePh')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminAccounting.passwordLabel')}</Label>
                                    <Input type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>{t('ngoAdminAccounting.infoBanner')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleValidate} disabled={isValidating}>
                                {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngoAdminAccounting.validating')}</> : t('ngoAdminAccounting.validateBtn')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700">{t('ngoAdminAccounting.incomeLabel')}</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-emerald-800">45,250 ₺</p></CardContent>
                        </Card>
                        <Card className="bg-rose-50 border-rose-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-rose-700">{t('ngoAdminAccounting.expenseLabel')}</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-rose-800">12,800 ₺</p></CardContent>
                        </Card>
                        <Card className="bg-sky-50 border-sky-200">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-sky-700">{t('ngoAdminAccounting.netLabel')}</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold text-sky-800">32,450 ₺</p></CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('ngoAdminAccounting.recentTitle')}</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => toast({title: t('ngoAdminAccounting.toastExporting')})}>{t('ngoAdminAccounting.exportBtn')}</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>{t('ngoAdminAccounting.colType')}</TableHead><TableHead>{t('ngoAdminAccounting.colDesc')}</TableHead><TableHead className="text-right">{t('ngoAdminAccounting.colAmount')}</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><Badge>{t('ngoAdminAccounting.income')}</Badge></TableCell>
                                        <TableCell>{t('ngoAdminAccounting.sampleDonation')}</TableCell>
                                        <TableCell className="text-right text-emerald-600">+12,400 ₺</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Badge variant="secondary">{t('ngoAdminAccounting.expense')}</Badge></TableCell>
                                        <TableCell>{t('ngoAdminAccounting.sampleRent')}</TableCell>
                                        <TableCell className="text-right text-rose-600">-4,500 ₺</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>{t('ngoAdminAccounting.webhookTitle')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>{t('ngoAdminAccounting.webhookUrl')}</Label><Input placeholder="https://..." /></div>
                            <div className="space-y-2"><Label>{t('ngoAdminAccounting.authToken')}</Label><Input type="password" placeholder="••••" /></div>
                            <Button onClick={() => toast({title: t('ngoAdminAccounting.toastApiSavedTitle')})}>{t('ngoAdminAccounting.saveBtn')}</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
