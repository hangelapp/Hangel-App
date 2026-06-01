'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, History, Settings2, KeyRound, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

export default function SmsSendingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [smsContent, setSmsContent] = useState('');
    const SMS_LIMIT = 160;

    const smsProviders = [
        { id: 'netgsm', name: 'Netgsm', logo: 'N', color: 'bg-blue-600', status: t('ngoAdminSms.statusConnected') },
        { id: 'iletimerkezi', name: t('ngoAdminSms.iletimerkeziName'), logo: 'İ', color: 'bg-orange-500', status: t('ngoAdminSms.statusAvailable') },
        { id: 'mutlucell', name: 'MutluCell', logo: 'M', color: 'bg-green-500', status: t('ngoAdminSms.statusAvailable') },
        { id: 'twilio', name: 'Twilio', logo: 'T', color: 'bg-red-600', status: t('ngoAdminSms.statusAvailable') },
    ];

    const handleSendSms = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            toast({ title: t('ngoAdminSms.toastSentTitle'), description: t('ngoAdminSms.toastSentDesc') });
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminSms.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">{t('ngoAdminSms.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('ngoAdminSms.subtitle')}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> {t('ngoAdminSms.tabIntegration')}</TabsTrigger>
                    <TabsTrigger value="new-sms"><Send className="mr-2 h-4 w-4" /> {t('ngoAdminSms.tabNew')}</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> {t('ngoAdminSms.tabHistory')}</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {smsProviders.map((provider) => (
                            <Card key={provider.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", provider.color)}>
                                        {provider.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{provider.name}</p>
                                        <Badge variant={provider.status === t('ngoAdminSms.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {provider.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full">
                                        {provider.status === t('ngoAdminSms.statusConnected') ? t('ngoAdminSms.settingsBtn') : t('ngoAdminSms.connectBtn')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> {t('ngoAdminSms.apiTitle')}</CardTitle>
                            <CardDescription>{t('ngoAdminSms.apiDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminSms.apiKey')}</Label>
                                    <Input placeholder={t('ngoAdminSms.apiKeyPh')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('ngoAdminSms.apiSecret')}</Label>
                                    <Input type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ngoAdminSms.senderHeader')}</Label>
                                <Input placeholder={t('ngoAdminSms.senderHeaderPh')} />
                                <p className="text-[10px] text-muted-foreground">{t('ngoAdminSms.senderHeaderHint')}</p>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p className="text-xs">{t('ngoAdminSms.sslBanner')}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: t('ngoAdminSms.toastSavedTitle')})}>{t('ngoAdminSms.saveBtn')}</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="new-sms" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('ngoAdminSms.composeTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>{t('ngoAdminSms.recipientGroup')}</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder={t('ngoAdminSms.selectPh')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="volunteers">{t('ngoAdminSms.groupVolunteers')}</SelectItem>
                                        <SelectItem value="donors">{t('ngoAdminSms.groupDonors')}</SelectItem>
                                        <SelectItem value="custom">{t('ngoAdminSms.groupCustom')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between"><Label>{t('ngoAdminSms.messageBody')}</Label><span className="text-[10px]">{smsContent.length}/{SMS_LIMIT}</span></div>
                                <Textarea rows={5} value={smsContent} onChange={(e) => setSmsContent(e.target.value)} placeholder={t('ngoAdminSms.messageBodyPh')} />
                            </div>
                            <Button className="w-full" onClick={handleSendSms} disabled={isLoading}>
                                <Send className="mr-2 h-4 w-4" /> {t('ngoAdminSms.startSendingBtn')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>{t('ngoAdminSms.historyTitle')}</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { title: t('ngoAdminSms.sample1Title'), recipient: t('ngoAdminSms.sample1Recipient'), date: '20.07.2024', count: 150, status: t('ngoAdminSms.statusSent') },
                                    { title: t('ngoAdminSms.sample2Title'), recipient: t('ngoAdminSms.sample2Recipient'), date: '15.07.2024', count: 2500, status: t('ngoAdminSms.statusSent') }
                                ].map((log, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm">{log.title}</p>
                                            <p className="text-[10px] text-muted-foreground">{log.date} • {log.count} {t('ngoAdminSms.recipientsSuffix')}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700">{log.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
