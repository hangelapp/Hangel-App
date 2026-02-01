
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Palette, Layout, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const providers = [
    { id: 'canva', name: 'Canva', logo: 'C', color: 'bg-[#00C4CC]', status: 'Bağlı', price: 'Ücretsiz (NGO)', discount: '%100 İndirim' },
    { id: 'adobe', name: 'Adobe Creative Cloud', logo: 'A', color: 'bg-[#FF0000]', status: 'Bağlanabilir', price: '120 ₺ / ay', discount: '%60 İndirim' },
    { id: 'figma', name: 'Figma', logo: 'F', color: 'bg-[#F24E1E]', status: 'Bağlanabilir', price: 'Ücretsiz (Eğitim/NGO)', discount: '%100 İndirim' },
];

export default function DesignToolsPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Tasarım Programları Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Görsel kimlik ve tasarım araçlarınızı yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", item.color)}>
                                {item.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <Badge variant={item.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium">{item.discount}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Yönlendiriliyorsunuz", description: "Kurumsal indirim sayfasına aktarılıyorsunuz."})}>İndirimden Yararlan</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Hangel Tasarım Stüdyosu</CardTitle>
                    <CardDescription>İlanlarınız ve gönderileriniz için yapay zeka destekli otomatik şablonlar oluşturun.</CardDescription>
                </CardHeader>
                <CardContent className="py-8 flex flex-col items-center justify-center space-y-4">
                    <Palette className="h-16 w-16 text-primary/40" />
                    <p className="text-sm text-muted-foreground text-center max-w-sm">Logonuzu ve renklerinizi bir kez tanımlayın, tüm sosyal medya gönderileriniz saniyeler içinde hazır olsun.</p>
                    <Button size="lg">Stüdyoyu Aç</Button>
                </CardContent>
            </Card>
        </div>
    );
}
