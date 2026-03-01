
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

export default function CompaniesPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Mesajınız Gönderildi",
            description: "İş geliştirme ekibimiz en kısa sürede sizinle iletişime geçecektir.",
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Şirketler için hangel</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Kurumsal sosyal sorumluluk hedeflerinizi Hangel'in teknoloji ve topluluk gücüyle birleştirin.
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>İletişim Formu</CardTitle>
                    <CardDescription>Şirketinize özel çözümler ve işbirliği modelleri hakkında bilgi almak için formu doldurun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Şirket Adı</Label>
                                <Input id="company-name" placeholder="Şirketinizin adı" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Yetkili Adı</Label>
                                <Input id="contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input id="email" type="email" placeholder="kurumsal@sirket.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <Input id="phone" type="tel" placeholder="+90..." />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="website">Web Sitesi</Label>
                            <Input id="website" placeholder="https://sirket.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea id="message" placeholder="İşbirliği yapmak istediğiniz alanlar, KSS hedefleriniz veya sorularınız..." rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full">Mesajı Gönder</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
