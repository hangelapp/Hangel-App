'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Contact, ShieldCheck, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { countryPhoneCodes } from '@/lib/data';

const roles = [
    { 
        id: 'Genel Yönetici', 
        label: 'Genel Yönetici', 
        description: 'Tüm yetkilere sahiptir. Profil, finans, gönüllü ve içerik yönetimini tam yetkiyle gerçekleştirebilir.' 
    },
    { 
        id: 'Finans Yöneticisi', 
        label: 'Finans Yöneticisi', 
        description: 'Sadece bağış takibi, finansal raporlar ve şeffaflık endeksi belgelerini yönetebilir.' 
    },
    { 
        id: 'Gönüllü Yöneticisi', 
        label: 'Gönüllü Yöneticisi', 
        description: 'Gönüllülük ilanları oluşturabilir, başvuruları değerlendirebilir ve gönüllü istatistiklerini görebilir.' 
    },
    { 
        id: 'Mini Blog Yöneticisi', 
        label: 'Mini Blog Yöneticisi', 
        description: 'Gönderi paylaşabilir, web sitesi ayarlarını düzenleyebilir ve içerik stratejisini yönetebilir.' 
    },
];

export default function NewUserPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('Genel Yönetici');

    const selectedRoleInfo = roles.find(r => r.id === role);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !phone) {
            toast({
                variant: "destructive",
                title: "Eksik Bilgi",
                description: "Lütfen tüm zorunlu alanları doldurun.",
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            toast({
                title: "Davet Gönderildi",
                description: `${name} için ${role} yetki başvurusu oluşturuldu. Onay bildirimi gönderildi.`,
            });
            setIsLoading(false);
            router.push('/ngo-admin/users');
        }, 1000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-0">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold font-headline">Yeni Yetkili Ekle</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Yetkili Davet Formu
                    </CardTitle>
                    <CardDescription>
                        Kuruluşunuza yeni bir yönetici veya editör eklemek için bilgileri doldurun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="add-user-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Soyad</Label>
                            <Input 
                                id="name" 
                                placeholder="Örn: Can Demir" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="eposta@kurum.org" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <div className="flex gap-2">
                                    <div className="w-[100px] shrink-0">
                                        <Select defaultValue="90">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Kod" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countryPhoneCodes.map(code => (
                                                    <SelectItem key={code} value={code}>+{code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="relative flex-1">
                                        <Input 
                                            id="phone" 
                                            type="tel" 
                                            placeholder="5XX XXX XX XX" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Contact className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedRoleInfo && (
                            <Alert className="bg-primary/5 border-primary/20">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-sm font-bold">Yetki Kapsamı: {selectedRoleInfo.label}</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground mt-1">
                                    {selectedRoleInfo.description}
                                </AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                    <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" form="add-user-form" disabled={isLoading}>
                        {isLoading ? 'Gönderiliyor...' : 'Davet Gönder'}
                    </Button>
                </CardFooter>
            </Card>

            <div className="p-4 bg-muted/30 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Davet gönderilen kullanıcıya e-posta ve SMS yoluyla bir aktivasyon linki ulaştırılacaktır. 
                    Kullanıcı linke tıklayıp şifresini belirlediğinde yetkisi aktif hale gelir.
                </p>
            </div>
        </div>
    );
}
