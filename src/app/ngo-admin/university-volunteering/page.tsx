'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, School, Info, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const universities = [
    { id: 'boun', name: 'Boğaziçi Üniversitesi', status: 'Bağlı', students: 120, course: 'Gönüllülük Dersi (GND101)', discount: '%100 Akademik Kredi' },
    { id: 'itu', name: 'İstanbul Teknik Üniversitesi', status: 'Bağlı', students: 85, course: 'Toplumsal Fayda (SOS202)', discount: '%100 Akademik Kredi' },
    { id: 'odtu', name: 'Orta Doğu Teknik Üniversitesi', status: 'Görüşme Aşamasında', students: 0, course: '-', discount: 'Kredi Onayı Bekleniyor' },
];

export default function UniversityVolunteeringPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isApproving, setIsApproving] = useState(false);

    const handleBulkApprove = () => {
        setIsApproving(true);
        setTimeout(() => {
            toast({ title: "Başarı Belgeleri Onaylandı", description: "Tüm aktif öğrencilerin dönem sonu başarı belgeleri üniversite sistemlerine iletildi." });
            setIsApproving(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Üniversite Gönüllülük Dersi</h1>
                    <p className="text-muted-foreground text-sm">Akademik kredi kapsamında gönüllü öğrenci yönetimi.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {universities.map((uni) => (
                    <Card key={uni.id} className="hover:border-primary transition-all group overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b">
                            <div className="flex justify-between items-start">
                                <School className="h-8 w-8 text-primary/60" />
                                <Badge variant={uni.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[9px] uppercase">{uni.status}</Badge>
                            </div>
                            <CardTitle className="text-sm font-bold mt-2">{uni.name}</CardTitle>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">İlgili Ders:</p>
                                <p className="font-bold text-foreground">{uni.course}</p>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground pt-2 border-t">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {uni.students} Öğrenci</span>
                                <span className="text-green-600 font-bold">{uni.discount}</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({title: "Üniversite Paneli", description: `${uni.name} ders kontenjanı yönetim sayfası açılıyor.`})}>Kontenjan Yönet</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Akademik Onay ve Sertifikasyon</CardTitle>
                    <CardDescription>Öğrencilerin dönem sonu not girişleri ve başarı belgeleri.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-xl bg-orange-50 text-orange-800 text-xs flex items-center gap-3">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>Öğrencilerin ders kredisini alabilmesi için haftalık "Gönüllülük Günlüğü" onaylarını her cuma saat 18:00'e kadar tamamlamanız önerilir.</p>
                    </div>
                    <Button className="w-full" onClick={handleBulkApprove} disabled={isApproving}>
                        {isApproving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Onaylanıyor</> : 'Toplu Başarı Belgesi Onayla'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}