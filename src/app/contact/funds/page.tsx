'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, ArrowLeft, Globe, LineChart, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function FundsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Mesajınız Gönderildi",
            description: "Ekibimiz en kısa sürede sizinle iletişime geçecektir.",
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <DollarSign className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Uluslararası Fonlar için Hangel</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Türkiye'deki sosyal etki ekosistemine yatırım yapın, şeffaf ve ölçülebilir projelerle pozitif değişime ortak olun.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Neden Hangel ile İşbirliği Yapmalısınız?</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Globe className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Yerel Erişim, Global Standartlar</h3>
                        <p className="text-sm text-muted-foreground">Türkiye'deki geniş STK ağımıza erişin ve projeleri uluslararası raporlama standartlarında takip edin.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <LineChart className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Ölçülebilir Sosyal Etki</h3>
                        <p className="text-sm text-muted-foreground">Yatırımınızın sosyal getirisini (SROI) detaylı analizler ve etki raporları ile izleyin.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Şeffaf ve Güvenilir Projeler</h3>
                        <p className="text-sm text-muted-foreground">Hangel Şeffaflık Endeksi'nden geçmiş, denetlenmiş ve güvenilir projelere yatırım yapın.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>İletişime Geçin</CardTitle>
                    <CardDescription>Portföyümüzdeki projeler ve işbirliği fırsatları hakkında bilgi almak için formu doldurun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fund-name">Fon / Kuruluş Adı</Label>
                                <Input id="fund-name" placeholder="Kuruluşunuzun adı" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Yetkili Adı</Label>
                                <Input id="contact-name" placeholder="Adınız Soyadınız" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input id="email" type="email" placeholder="contact@fund.org" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <Input id="phone" type="tel" placeholder="+..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea id="message" placeholder="İlgi alanlarınız, yatırım kriterleriniz veya sorularınız..." rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full">Mesajı Gönder</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
