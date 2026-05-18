
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Landmark, ArrowLeft, Users, Handshake, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function MunicipalitiesPage() {
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
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Landmark className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Belediyeler için hangel</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Şehrinizdeki sosyal faydayı artırın, vatandaş katılımını güçlendirin ve dijital hizmetlerinizi hangel ile entegre edin.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Neden hangel ile İşbirliği Yapmalısınız?</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Users className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Vatandaş Katılımını Artırın</h3>
                        <p className="text-sm text-muted-foreground">Vatandaşlarınızı şehirdeki gönüllülük faaliyetlerine ve sosyal projelere dahil edin.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Handshake className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">STK'ları Güçlendirin</h3>
                        <p className="text-sm text-muted-foreground">Bölgenizdeki sivil toplum kuruluşlarını dijital araçlarla destekleyerek kapasitelerini artırın.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Building2 className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Akıllı Şehir Çözümleri</h3>
                        <p className="text-sm text-muted-foreground">Sosyal yardım ve gönüllülük yönetimi için dijital çözümler üreterek kaynaklarınızı verimli kullanın.</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Nasıl Çalışır?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>1</div>
                        <div>
                            <h4 className="font-semibold">Stratejik Ortaklık Kurulması</h4>
                            <p>Belediyenizin sosyal hedefleri ve öncelikleri doğrultusunda bir işbirliği çerçevesi belirlemek için bir araya gelelim.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>2</div>
                        <div>
                            <h4 className="font-semibold">"Akıllı Şehir" Entegrasyonu</h4>
                            <p>Belediyenizin mevcut dijital hizmetlerini (e-belediye, şehir uygulamaları vb.) hangel platformu ile entegre ederek vatandaşlara tek bir noktadan sosyal katılım imkanı sunalım.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>3</div>
                         <div>
                            <h4 className="font-semibold">Vatandaş Katılımı Kampanyaları</h4>
                            <p>Şehrinize özel gönüllülük günleri, mahalle bazlı yardım kampanyaları veya sosyal sorumluluk yarışmaları gibi etkinlikler düzenleyerek vatandaşların aktif katılımını sağlayalım.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>4</div>
                        <div>
                            <h4 className="font-semibold">Etki Analizi ve Raporlama</h4>
                            <p>Gerçekleştirilen projelerin sosyal etkisini (gönüllü katılım oranları, ulaşılan kişi sayısı vb.) ölçümleyerek belediyenizin sosyal karnesini şeffaf bir şekilde kamuoyuyla paylaşmanıza yardımcı olalım.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>İletişime Geçin</CardTitle>
                    <CardDescription>Belediyenize özel çözümlerimiz ve işbirliği modellerimiz hakkında bilgi almak için formu doldurun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="municipality-name">Belediye Adı</Label>
                                <Input id="municipality-name" placeholder="Örn: Kadıköy Belediyesi" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Yetkili Adı</Label>
                                <Input id="contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input id="email" type="email" placeholder="ornek@belediye.gov.tr" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <Input id="phone" type="tel" placeholder="+90..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea id="message" placeholder="İşbirliği yapmak istediğiniz alanlar, sorularınız veya projeleriniz..." rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full">Mesajı Gönder</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
