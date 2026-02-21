
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, ExternalLink, Filter, Search, ArrowDownUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const funds = [
    { id: '1', name: 'Avrupa Birliği Sivil Toplum Destek Programı', provider: 'Avrupa Birliği Delegasyonu', status: 'Açık', deadline: '2024-10-31', areas: ['İnsan Hakları', 'Çevre'] },
    { id: '2', name: 'Türkiye Sosyal Girişimcilik Ağı Hibe Programı', provider: 'Koç Üniversitesi Sosyal Etki Forumu', status: 'Açık', deadline: '2024-09-15', areas: ['Sosyal Girişimcilik', 'Gençlik'] },
    { id: '3', name: 'Kültür Sanat Fonu', provider: 'Sabancı Vakfı', status: 'Kapandı', deadline: '2024-07-01', areas: ['Kültür & Sanat'] },
    { id: '4', name: 'Japonya Büyükelçiliği Yerel Projelere Hibe Programı', provider: 'Japonya Büyükelçiliği', status: 'Açık', deadline: '2024-11-30', areas: ['Eğitim', 'Sağlık'] },
];

export default function FundsPage() {
    const router = useRouter();
    const { toast } = useToast();

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Hibeler ve Fonlar</h1>
                    <p className="text-muted-foreground text-sm">Kuruluşunuzun başvurabileceği aktif hibe ve fon fırsatları.</p>
                </div>
            </div>

            <div className="flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Hibe ara..." className="pl-10 h-11" />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"><Filter className="h-5 w-5" /></Button>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"><ArrowDownUp className="h-5 w-5" /></Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Aktif Hibe Programları</CardTitle>
                    <CardDescription>Başvuruya açık olan hibe ve fon fırsatlarını inceleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {funds.map(fund => (
                        <Card key={fund.id} className={fund.status === 'Kapandı' ? 'opacity-50' : ''}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{fund.name}</CardTitle>
                                    <Badge variant={fund.status === 'Açık' ? 'default' : 'secondary'} className={fund.status === 'Açık' ? 'bg-green-100 text-green-700' : ''}>{fund.status}</Badge>
                                </div>
                                <CardDescription>{fund.provider}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {fund.areas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}
                                </div>
                                <p className="text-sm text-muted-foreground">Son Başvuru: <strong>{fund.deadline}</strong></p>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => toast({title: 'Detaylar gösteriliyor...'})}>Detayları Gör</Button>
                                <Button asChild size="sm" variant="secondary" className="flex-1">
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        Resmi Sayfa <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
