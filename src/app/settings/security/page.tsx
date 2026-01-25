'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Laptop, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const activeSessions = [
    { device: 'Chrome, macOS', location: 'İstanbul, TR', time: 'Şu an aktif', icon: Laptop },
    { device: 'iPhone 14 Pro', location: 'İzmir, TR', time: '2 saat önce', icon: Smartphone },
];

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add validation logic here
        if (newPassword && newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Yeni şifreler eşleşmiyor.",
            });
            return;
        }
        toast({
            title: "Ayarlar Kaydedildi",
            description: "Güvenlik ayarlarınız başarıyla güncellendi.",
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Güvenlik ve Şifre</h1>
                <p className="text-muted-foreground text-sm">Hesap güvenliğinizi yönetin ve şifrenizi güncelleyin.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Şifre Değiştir</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Mevcut Şifre</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="new-password">Yeni Şifre</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>İki Adımlı Doğrulama (2FA)</CardTitle>
                        <CardDescription>Hesabınıza giriş yaparken ek bir güvenlik katmanı ekleyin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div>
                             <Label htmlFor="2fa-switch">Telefon Numarası ile Doğrulama</Label>
                             <p className="text-xs text-muted-foreground">Giriş yaparken telefonunuza bir kod gönderilir.</p>
                           </div>
                            <Switch id="2fa-switch" checked={twoFactorEnabled} onCheckedChange={(checked) => {
                                setTwoFactorEnabled(checked);
                                toast({ title: 'İki Adımlı Doğrulama', description: checked ? 'Aktif edildi.' : 'Devre dışı bırakıldı.'});
                            }} />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Oturum Geçmişi</CardTitle>
                        <CardDescription>Hesabınızda açık olan oturumları görüntüleyin ve yönetin.</CardDescription>
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
                         <Button type="button" variant="outline" className="w-full" onClick={() => toast({ title: 'Oturumlar Kapatıldı', description: 'Mevcut oturum dışındaki tüm oturumlarınız sonlandırıldı.'})}>Diğer tüm oturumları kapat</Button>
                    </CardContent>
                </Card>
                
                 <div className="flex justify-end">
                    <Button type="submit">Değişiklikleri Kaydet</Button>
                </div>
            </form>
        </div>
    );
}
