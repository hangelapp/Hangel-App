'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { School, ArrowLeft, Users, BrainCircuit, Handshake } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function UniversitiesPage() {
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
                    <School className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Üniversiteler için Hangel</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Öğrenci kulüplerinizi güçlendirin, sosyal sorumluluk projelerinizi yönetin ve kampüsünüzde bir etki ağı oluşturun.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Neden Hangel ile İşbirliği Yapmalısınız?</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Users className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Öğrenci Kulüplerini Dijitalleştirin</h3>
                        <p className="text-sm text-muted-foreground">Kulüplerinize özel yönetim panelleri, etkinlik takvimi ve üye yönetimi araçları sunun.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Sosyal Etkiyi Ölçümleyin</h3>
                        <p className="text-sm text-muted-foreground">Öğrencilerinizin gönüllülük saatlerini ve sosyal etki puanlarını takip ederek başarılarını ödüllendirin.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Handshake className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">STK ve Şirketlerle Köprü Kurun</h3>
                        <p className="text-sm text-muted-foreground">Öğrencilerinizi, platformdaki STK'lar ve kurumsal ortaklarla staj ve proje fırsatları için buluşturun.</p>
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
                            <h4 className="font-semibold">Kampüs Programına Başvuru</h4>
                            <p>Üniversitenizin Hangel Kampüs Programı'na dahil olması için bizimle iletişime geçin. Üniversitenize özel bir işbirliği modeli oluşturalım.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>2</div>
                        <div>
                            <h4 className="font-semibold">Kulüp ve Öğrenci Entegrasyonu</h4>
                            <p>Öğrenci kulüplerinizi platforma davet edin ve onlara özel yönetim panelleri sağlayın. Öğrencilerinizi gönüllülük ve sosyal etki faaliyetleri için platforma katılmaya teşvik edin.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>3</div>
                         <div>
                            <h4 className="font-semibold">Sosyal Sorumluluk Projeleri</h4>
                            <p>Üniversitenizin "Sosyal Sorumluluk" veya "Topluma Hizmet Uygulamaları" gibi dersleri kapsamında öğrencilerin Hangel üzerinden gönüllülük projeleri bulmalarını ve tamamlamalarını sağlayın.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>4</div>
                        <div>
                            <h4 className="font-semibold">Etki Ölçümü ve Kariyer Fırsatları</h4>
                            <p>Üniversitenizin ve öğrencilerinizin yarattığı toplam sosyal etkiyi (gönüllülük saatleri, desteklenen projeler) raporlayın. Öğrencilerinizi platformdaki şirket ve STK'larla buluşturarak kariyer olanakları yaratın.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>İletişime Geçin</CardTitle>
                    <CardDescription>Üniversitenize özel Hangel Kampüs çözümleri hakkında bilgi almak için formu doldurun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="university-name">Üniversite Adı</Label>
                                <Input id="university-name" placeholder="Üniversitenizin adı" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Yetkili Adı</Label>
                                <Input id="contact-name" placeholder="Adınız Soyadınız" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <Input id="email" type="email" placeholder="ornek@universite.edu.tr" required />
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
