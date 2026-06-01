'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShieldCheck, Workflow, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/providers/language-provider';

export default function CrmManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const providers = [
        { id: 'salesforce', name: 'Salesforce NGO', logo: 'S', color: 'bg-[#00A1E0]', status: t('ngoAdminCrm.statusAvailable'), price: t('ngoAdminCrm.salesforcePrice'), discount: t('ngoAdminCrm.discount100') },
        { id: 'bitrix', name: 'Bitrix24', logo: 'B', color: 'bg-[#2FC1EE]', status: t('ngoAdminCrm.statusConnected'), price: t('ngoAdminCrm.bitrixPrice'), discount: t('ngoAdminCrm.discount50') },
        { id: 'zoho', name: 'Zoho CRM', logo: 'Z', color: 'bg-[#E31837]', status: t('ngoAdminCrm.statusAvailable'), price: t('ngoAdminCrm.zohoPrice'), discount: t('ngoAdminCrm.discount100') },
    ];

    const handleCrmConnect = (id: string, name: string) => {
        setConnectingId(id);
        setTimeout(() => {
            toast({ title: `${name} ${t('ngoAdminCrm.toastIntegrationSuffix')}`, description: t('ngoAdminCrm.toastConnectingDesc') });
            setConnectingId(null);
        }, 1200);
    };

    const handleSyncSave = () => {
        setIsSyncing(true);
        setTimeout(() => {
            toast({ title: t('ngoAdminCrm.toastSyncStartedTitle'), description: t('ngoAdminCrm.toastSyncStartedDesc') });
            setIsSyncing(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminCrm.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngoAdminCrm.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngoAdminCrm.subtitle')}</p>
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
                                <Badge variant={item.status === t('ngoAdminCrm.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium">{item.discount}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled={connectingId === item.id}
                                onClick={() => handleCrmConnect(item.id, item.name)}
                            >
                                {connectingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('ngoAdminCrm.integrateBtn')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Workflow className="h-5 w-5 text-primary"/> {t('ngoAdminCrm.syncTitle')}</CardTitle>
                    <CardDescription>{t('ngoAdminCrm.syncDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('ngoAdminCrm.webhookUrl')}</Label>
                            <Input placeholder={t('ngoAdminCrm.webhookUrlPh')} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('ngoAdminCrm.apiKey')}</Label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="p-4 border rounded-xl bg-green-50 text-green-800 text-xs flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p>{t('ngoAdminCrm.syncBanner')}</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                    <Button onClick={handleSyncSave} disabled={isSyncing}>
                        {isSyncing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngoAdminCrm.processing')}</> : t('ngoAdminCrm.saveAndStartBtn')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
