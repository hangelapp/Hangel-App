'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, MessageCircle, Settings2, KeyRound, Smartphone, Instagram, Facebook, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/components/providers/language-provider';

export default function DmManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [msg, setMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const socialIntegrations = [
        { id: 'whatsapp', name: t('ngoAdminDm.whatsappName'), icon: Smartphone, color: 'bg-green-500', status: t('ngoAdminDm.statusConnected') },
        { id: 'instagram', name: t('ngoAdminDm.instagramName'), icon: Instagram, color: 'bg-pink-600', status: t('ngoAdminDm.statusAvailable') },
        { id: 'facebook', name: t('ngoAdminDm.messengerName'), icon: Facebook, color: 'bg-blue-600', status: t('ngoAdminDm.statusAvailable') },
    ];

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!msg.trim()) return;
        toast({ title: t('ngoAdminDm.toastSentTitle'), description: t('ngoAdminDm.toastSentDesc') });
        setMsg('');
    };

    const handleSaveConfig = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast({ title: t('ngoAdminDm.toastSavedTitle'), description: t('ngoAdminDm.toastSavedDesc') });
            setIsSaving(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminDm.backAria')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">{t('ngoAdminDm.title')}</h1>
                </div>
            </div>

            <Tabs defaultValue="chat">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="chat"><MessageCircle className="mr-2 h-4 w-4" /> {t('ngoAdminDm.tabMessages')}</TabsTrigger>
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> {t('ngoAdminDm.tabIntegration')}</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-6">
                    <Card className="h-[500px] flex flex-col">
                        <div className="flex-1 flex items-center justify-center text-muted-foreground italic bg-muted/10">
                            <div className="text-center space-y-2">
                                <MessageCircle className="h-12 w-12 mx-auto opacity-20" />
                                <p>{t('ngoAdminDm.emptyChat')}</p>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-background">
                            <form className="flex gap-2" onSubmit={handleSend}>
                                <Input
                                    placeholder={t('ngoAdminDm.messagePh')}
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                />
                                <Button type="submit" size="icon" aria-label={t('ngoAdminDm.sendAria')}><Send className="h-4 w-4" /></Button>
                            </form>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {socialIntegrations.map((item) => (
                            <Card key={item.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", item.color)}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{item.name}</p>
                                        <Badge variant={item.status === t('ngoAdminDm.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: t('ngoAdminDm.settingsBtn'), description: `${item.name} ${t('ngoAdminDm.settingsToastSuffix')}`})}>{t('ngoAdminDm.settingsBtn')}</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> {t('ngoAdminDm.apiTitle')}</CardTitle>
                            <CardDescription>{t('ngoAdminDm.apiDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('ngoAdminDm.authToken')}</Label>
                                <Input type="password" placeholder="EAAB..." />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('ngoAdminDm.verifyToken')}</Label>
                                <Input placeholder="hangel_verify_token" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleSaveConfig} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngoAdminDm.connecting')}</> : t('ngoAdminDm.verifyBtn')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
