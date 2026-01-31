'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function NewUserPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Yönetici');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email) {
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
                description: `${name} için yetki başvurusu oluşturuldu. Onay bildirimi gönderildi.`,
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
                            <Label htmlFor="role">Rol</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yönetici">Yönetici</SelectItem>
                                    <SelectItem value="Editör">Editör</SelectItem>
                                    <SelectItem value="Gönüllü Sorumlusu">Gönüllü Sorumlusu</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                {role === 'Yönetici' && 'Tam erişim ve yönetim yetkisi.'}
                                {role === 'Editör' && 'İçerik paylaşma ve profil düzenleme yetkisi.'}
                                {role === 'Gönüllü Sorumlusu' && 'Sadece gönüllü başvurularını yönetme yetkisi.'}
                            </p>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                    <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" form="add-user-form" disabled={isLoading}>
                        {isLoading ? 'Gönderiliyor...' : 'Davet Gönder'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
