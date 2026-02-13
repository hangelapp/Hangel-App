'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';

export default function ContactPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate a form error for demonstration
        const hasError = Math.random() > 0.5;
        setError(hasError);

        if (!hasError) {
            toast({
                title: "Mesajınız Gönderildi",
                description: "hangel iş geliştirme ekibi en kısa sürede sizinle iletişime geçecektir.",
            });
        }
    };
    
    const countryOptions = ["Türkiye", "ABD", "Almanya", "İngiltere"];
    const institutionTypeOptions = ["Belediye", "Bakanlık", "Üniversite", "Lise", "Şirket", "Diğer"];

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Kuruluşunuza özel bir plan oluşturalım.</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Öncelikle lütfen birkaç kısa soruyu yanıtlayın, ardından bir hangel iş geliştirme ekibi üyesi sizi arayarak size uygun ürünler, yazılımlar ve hizmetler hakkında bilgi verecektir.
                </p>
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>hangel Kamu Politikası Departmanı İletişim Formu</CardTitle>
                    <CardDescription>
                        E-posta için kurumsal bir e-posta adresi gereklidir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>
                                Gönderiminizde bir sorun oluştu. Lütfen tüm bilgilerin doğru olduğundan emin olmak için aşağıdaki alanları kontrol edin.
                            </AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="institution-type">Kurum Türü</Label>
                            <Select required>
                                <SelectTrigger id="institution-type">
                                    <SelectValue placeholder="Birini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {institutionTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">İşbirliği Amacı</Label>
                            <Textarea id="purpose" placeholder="Kurmak istediğiniz işbirliğinin amacını kısaca açıklayınız..." required />
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">İlk adı</Label>
                                <Input id="first-name" placeholder="Adınız" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Soyadı</Label>
                                <Input id="last-name" placeholder="Soyadınız" required />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" type="email" placeholder="kurumsal@sirket.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <Input id="phone" type="tel" placeholder="+90..." required />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="department">Departman</Label>
                            <Input id="department" placeholder="Departmanınız (örn: Kurumsal İletişim)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Ülke</Label>
                            <Select required>
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Birini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="comments">Ek Yorumlar (isteğe bağlı)</Label>
                            <Textarea id="comments" placeholder="İşbirliği yapmak istediğiniz alanlar, sorularınız veya önerileriniz..." />
                        </div>
                        
                        <div className="space-y-4 pt-4">
                             <div className="flex items-start space-x-3">
                                <Checkbox id="marketing-consent" />
                                <Label htmlFor="marketing-consent" className="text-xs font-normal text-muted-foreground">
                                    hangel'in kurumsal teklifleri ve daha fazlası hakkında duyurular, öneriler ve güncellemeler almak istiyorum.
                                </Label>
                            </div>
                             <Button type="submit" className="w-full">Gönder</Button>
                              <p className="text-xs text-muted-foreground">
                                “Gönder” düğmesine tıklayarak, talebinizi karşılamak için bilgilerinizi yetkili ortaklarımızla paylaşmayı kabul ediyorsunuz. Bilgileriniz yalnızca gerekli operasyonel ve işlemsel iletişimler için kullanılacaktır.
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
