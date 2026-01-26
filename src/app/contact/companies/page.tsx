'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, ArrowLeft, TrendingUp, Handshake, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CompaniesPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Mesajınız Gönderildi",
            description: "Ekibimiz en kısa sürede sizinle iletişime geçecektir.",
        });
        // Optionally, redirect or clear form
        // e.g., router.push('/thank-you');
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
                <h1 className="text-3xl font-bold font-headline">Şirketler için Hangel</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Kurumsal sosyal sorumluluk hedeflerinize ulaşın, marka değerinizi artırın ve çalışan bağlılığını güçlendirin.
                </p>
                <div className="flex justify-center">
                    <Button asChild size="lg">
                        <Link href="/login/selection?action=register">Hemen Başvur</Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Neden Hangel ile İşbirliği Yapmalısınız?</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Marka İtibarını Güçlendirin</h3>
                        <p className="text-sm text-muted-foreground">Topluma duyarlı bir marka olarak bilinirliğinizi ve müşteri sadakatinizi artırın.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Handshake className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Somut Sosyal Etki Yaratın</h3>
                        <p className="text-sm text-muted-foreground">Şirketinizin değerleriyle uyumlu STK'ları destekleyerek ölçülebilir ve şeffaf bir fayda sağlayın.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Users className="h-8 w-8 text-primary"/>
                        <h3 className="font-semibold">Çalışan Bağlılığını Artırın</h3>
                        <p className="text-sm text-muted-foreground">Çalışanlarınıza yönelik özel gönüllülük programları ve sosyal etki kampanyaları düzenleyin.</p>
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
                            <h4 className="font-semibold">Başvuru ve Değerlendirme</h4>
                            <p>Platformumuza kurumsal ortak olarak katılmak için başvuru formunu doldurun. Ekibimiz, sosyal etki vizyonunuzu ve hedeflerinizi anlamak için sizinle iletişime geçsin.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>2</div>
                        <div>
                            <h4 className="font-semibold">Entegrasyon ve Kampanya Planı</h4>
                            <p>Şirketinize özel bir işbirliği modeli oluşturalım. Çalışanlarınıza veya müşterilerinize yönelik bağış kampanyaları, gönüllülük günleri veya farkındalık projeleri planlayalım.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>3</div>
                         <div>
                            <h4 className="font-semibold">Çalışan Katılımı ve Etkileşim</h4>
                            <p>Çalışanlarınızı Hangel platformu üzerinden organize edilen gönüllülük faaliyetlerine katılmaya teşvik edin, takım ruhunu ve şirket içi motivasyonu artırın.</p>
                        </div>
                    </div>
                     <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>4</div>
                        <div>
                            <h4 className="font-semibold">Etki Raporlaması ve İletişim</h4>
                            <p>İşbirliğinizin yarattığı somut sosyal etkiyi (desteklenen STK'lar, gönüllülük saatleri, ulaşılan kişi sayısı) size özel raporlarla takip edin ve bu başarıyı paydaşlarınızla paylaşın.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>İletişime Geçin</CardTitle>
                    <CardDescription>İşbirliği olanakları hakkında daha fazla bilgi almak için formu doldurun.</CardDescription>
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
                                <Input id="contact-name" placeholder="Adınız Soyadınız" required />
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
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea id="message" placeholder="İşbirliği yapmak istediğiniz alanlar, sorularınız veya önerileriniz..." rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full">Mesajı Gönder</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}