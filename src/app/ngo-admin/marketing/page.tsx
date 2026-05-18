
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const providers = [
    { id: 'google-ads', name: 'Google Ads Grants', logo: 'G', color: 'bg-[#4285F4]', status: 'Bağlanabilir', price: '$10,000 / ay', discount: '%100 Reklam Kredisi' },
    { id: 'hubspot', name: 'HubSpot NGO', logo: 'H', color: 'bg-[#FF7A59]', status: 'Bağlanabilir', price: 'Ücretsiz', discount: '%90 İndirim (Premium)' },
    { id: 'mailchimp', name: 'Mailchimp', logo: 'M', color: 'bg-[#FFE01B]', status: 'Bağlı', price: 'Ücretsiz (NGO Plan)', discount: '%100 İndirim' },
];

export default function MarketingPage() {
    const { toast } = useToast();
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Pazarlama İletişimi</h1>
                    <p className="text-muted-foreground text-sm">Görünürlüğünüzü ve bağışçı etkileşiminizi artırın.</p>
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
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Başvuru Sayfası", description: "Google Grants başvurusu için hangel danışmanlık talebi oluşturuldu."})}>Aktif Et</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-800 text-base flex items-center gap-2"><Info className="h-5 w-5"/> Google Ads Grants Nedir?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 leading-relaxed">
                    Kâr amacı gütmeyen kuruluşlar için Google tarafından sağlanan aylık 10.000$ değerindeki ücretsiz reklam kredisidir. Hangel ekibi olarak bu krediyi almanız ve yönetmeniz için ücretsiz teknik destek sağlıyoruz.
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100">Detaylı Bilgi Al</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
