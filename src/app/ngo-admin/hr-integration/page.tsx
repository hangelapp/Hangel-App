'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShieldCheck, Users, Loader2, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/components/providers/language-provider';

export default function HrIntegrationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const hrProviders = [
        { id: 'sap', name: t('ngo_admin_hr.providerSap'), logo: 'S', color: 'bg-[#008FD3]', status: t('ngo_admin_hr.statusConnectable'), type: t('ngo_admin_hr.typeEnterprise') },
        { id: 'workday', name: t('ngo_admin_hr.providerWorkday'), logo: 'W', color: 'bg-[#E28225]', status: t('ngo_admin_hr.statusConnectable'), type: t('ngo_admin_hr.typeCloud') },
        { id: 'kolayik', name: t('ngo_admin_hr.providerKolayIk'), logo: 'K', color: 'bg-[#FF5A5F]', status: t('ngo_admin_hr.statusConnected'), type: t('ngo_admin_hr.typeLocal') },
        { id: 'bamboohr', name: t('ngo_admin_hr.providerBambooHr'), logo: 'B', color: 'bg-[#6AB43E]', status: t('ngo_admin_hr.statusConnectable'), type: t('ngo_admin_hr.typeInternational') },
    ];

    const handleConnect = (id: string, name: string) => {
        setConnectingId(id);
        setTimeout(() => {
            toast({
                title: `${name} ${t('ngo_admin_hr.toastConnectTitleSuffix')}`,
                description: t('ngo_admin_hr.toastConnectDesc')
            });
            setConnectingId(null);
        }, 1200);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_hr.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_hr.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngo_admin_hr.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hrProviders.map((provider) => (
                    <Card key={provider.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", provider.color)}>
                                {provider.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{provider.name}</p>
                                <Badge variant={provider.status === t('ngo_admin_hr.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {provider.status}
                                </Badge>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled={connectingId === provider.id}
                                onClick={() => handleConnect(provider.id, provider.name)}
                            >
                                {connectingId === provider.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (provider.status === t('ngo_admin_hr.statusConnected') ? t('ngo_admin_hr.btnManage') : t('ngo_admin_hr.btnConnect'))}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="matching">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="matching"><Workflow className="mr-2 h-4 w-4" /> {t('ngo_admin_hr.tabMatching')}</TabsTrigger>
                    <TabsTrigger value="volunteer"><Users className="mr-2 h-4 w-4" /> {t('ngo_admin_hr.tabVolunteer')}</TabsTrigger>
                </TabsList>

                <TabsContent value="matching" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('ngo_admin_hr.matchingTitle')}</CardTitle>
                            <CardDescription>{t('ngo_admin_hr.matchingDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('ngo_admin_hr.labelCompanyCode')}</Label>
                                    <Input placeholder={t('ngo_admin_hr.placeholderCompanyCode')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ngo_admin_hr.labelMatchRate')}</Label>
                                    <Input placeholder={t('ngo_admin_hr.placeholderMatchRate')} />
                                </div>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>{t('ngo_admin_hr.matchingInfo')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: t('ngo_admin_hr.toastSettingsSaved')})}>{t('ngo_admin_hr.btnActivate')}</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="volunteer" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('ngo_admin_hr.volunteerTitle')}</CardTitle>
                            <CardDescription>{t('ngo_admin_hr.volunteerDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: t('ngo_admin_hr.teamX'), members: 45, area: t('ngo_admin_hr.teamAreaEducation'), status: t('ngo_admin_hr.teamStatusActive') },
                                { name: t('ngo_admin_hr.teamY'), members: 120, area: t('ngo_admin_hr.teamAreaEnvironment'), status: t('ngo_admin_hr.teamStatusPending') }
                            ].map((team, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
                                        <div>
                                            <p className="font-bold text-sm">{team.name}</p>
                                            <p className="text-xs text-muted-foreground">{team.members} {t('ngo_admin_hr.membersSuffix')} • {team.area}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{team.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
