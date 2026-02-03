'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartHandshake, ShieldCheck, HandCoins, Users, Globe, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NgoOnboardingPage() {
    const router = useRouter();

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <HeartHandshake className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">Kuruluşunuzla İyiliği Büyütün</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    hangel Hub ekosistemine dahil olarak sivil toplum faaliyetlerinizi dijitalleştirin, daha fazla bağışçıya ve gönüllüye ulaşın.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/login/selection?action=register&type=corporate">Şimdi Başvur</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                        <CardTitle>Şeffaflık Endeksi</CardTitle>
                        <CardDescription>Kurumsal verilerinizi paylaşarak bağışçı güvenini kazanın ve platformda öne çıkın.</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <HeartHandshake className="h-8 w-8 text-primary mb-2" />
                        <CardTitle>Gönüllülük Yönetimi</CardTitle>
                        <CardDescription>Yetenek bazlı ilanlar yayınlayın ve gönüllü başvurularını profesyonelce yönetin.</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <HandCoins className="h-8 w-8 text-primary mb-2" />
                        <CardTitle>Sürdürülebilir Bağış</CardTitle>
                        <CardDescription>Marka işbirlikleri sayesinde kullanıcıların alışverişlerinden ek fon yaratın.</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <BarChart3 className="h-8 w-8 text-primary mb-2" />
                        <CardTitle>Demografi Analizi</CardTitle>
                        <CardDescription>Destekçilerinizin yaş, şehir ve ilgi alanlarını analiz ederek stratejinizi geliştirin.</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="text-lg">Diğer Tüm Araçlar</CardTitle>
                    <CardDescription>
                        SMS/Mail gönderimi, etkinlik yönetimi, CRM entegrasyonu, web sitesi kurucusu ve daha fazlası STK'lar için hangel Hub'da hazır.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="link" asChild className="p-0 text-primary">
                        <Link href="/about">Hangel nasıl çalışır? Daha fazla bilgi al.</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
