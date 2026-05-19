'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Laptop, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

const activeSessions = [
    { device: 'Chrome, macOS', location: 'İstanbul, TR', time: 'Şu an aktif', icon: Laptop },
    { device: 'iPhone 14 Pro', location: 'İzmir, TR', time: '2 saat önce', icon: Smartphone },
];

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('dashboard.settingsSecurity.toastSavedTitle'),
            description: t('dashboard.settingsSecurity.toastSavedDesc'),
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsSecurity.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsSecurity.subheading')}</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.settingsSecurity.twoFactorTitle')}</CardTitle>
                        <CardDescription>{t('dashboard.settingsSecurity.twoFactorDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div>
                             <Label htmlFor="2fa-switch">Telefon Numarası ile Doğrulama</Label>
                             <p className="text-xs text-muted-foreground">Giriş yaparken telefonunuza bir kod gönderilir.</p>
                           </div>
                            <Switch id="2fa-switch" checked={twoFactorEnabled} onCheckedChange={(checked) => {
                                setTwoFactorEnabled(checked);
                                toast({ title: t('dashboard.settingsSecurity.toast2faTitle'), description: checked ? t('dashboard.settingsSecurity.toast2faOn') : t('dashboard.settingsSecurity.toast2faOff')});
                            }} />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.settingsSecurity.sessionsTitle')}</CardTitle>
                        <CardDescription>{t('dashboard.settingsSecurity.sessionsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeSessions.map((session, index) => {
                            const Icon = session.icon;
                            return (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-6 w-6 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{session.device}</p>
                                            <p className="text-sm text-muted-foreground">{session.location} - {session.time}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                         <Button type="button" variant="outline" className="w-full" onClick={() => toast({ title: t('dashboard.settingsSecurity.toastSessionsClosedTitle'), description: t('dashboard.settingsSecurity.toastSessionsClosedDesc')})}>{t('dashboard.settingsSecurity.closeOtherSessions')}</Button>
                    </CardContent>
                </Card>
                
                 <div className="flex justify-end">
                    <Button type="submit">{t('dashboard.settingsSecurity.saveBtn')}</Button>
                </div>
            </form>
        </div>
    );
}
