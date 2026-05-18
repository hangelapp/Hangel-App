'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, MapPin, ShieldCheck, Loader2, CheckCircle2, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const providers = [
    { 
        id: 'karsiyaka', 
        name: 'Karşıyaka Belediyesi', 
        location: 'İzmir - Sancar Maruflu STK Yerleşkesi', 
        color: 'bg-green-600', 
        status: 'Ücretsiz', 
        price: '0 ₺', 
        discount: 'Belediye Desteği',
        services: ['Ofis Masası', 'Toplantı Salonu', 'Sekreterlik', 'Posta Kutusu'],
        type: 'Public'
    },
    { 
        id: 'muratpasa', 
        name: 'Muratpaşa Belediyesi', 
        location: 'Antalya - Abdullah Sevimçok STK Merkezi', 
        color: 'bg-orange-500', 
        status: 'Ücretsiz', 
        price: '0 ₺', 
        discount: 'Belediye Desteği',
        services: ['Paylaşımlı Masa', 'Etkinlik Alanı', 'İnternet & İkram'],
        type: 'Public'
    },
    { 
        id: 'workinton', 
        name: 'Workinton', 
        location: '21 Lokasyon (İstanbul, Ankara, İzmir)', 
        color: 'bg-[#E30613]', 
        status: 'Anlaşmalı', 
        price: '450 ₺ / ay', 
        discount: '%40 STK İndirimi',
        services: ['Sanal Ofis', 'Hazır Ofis', 'Toplantı Odası', 'Coworking'],
        type: 'Corporate'
    },
    { 
        id: 'kolektif', 
        name: 'Kolektif House', 
        location: '12 Lokasyon (İstanbul)', 
        color: 'bg-[#1A1A1A]', 
        status: 'Anlaşmalı', 
        price: 'Ücretsiz (Kota Dahil)', 
        discount: 'Partner STK Avantajı',
        services: ['Gezgin Üyelik', 'Toplantı Odası', 'Etkinlik Alanı'],
        type: 'Corporate'
    },
    { 
        id: 'eoffice', 
        name: 'eOfis', 
        location: '35 Lokasyon (Türkiye Geneli)', 
        color: 'bg-[#0054A6]', 
        status: 'Bağlanabilir', 
        price: '300 ₺ / ay', 
        discount: '%50 İndirim',
        services: ['Yasal Adres', 'Çağrı Karşılama', 'Ortak Alan Kullanımı'],
        type: 'Corporate'
    },
];

export default function VirtualOfficePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [bookingId, setBookingId] = useState<string | null>(null);

    const handleReserve = (id: string, name: string) => {
        setBookingId(id);
        setTimeout(() => {
            toast({ 
                title: "Rezervasyon Talebi Alındı", 
                description: `${name} için STK özel kullanım onay süreci başlatıldı. Bir iş günü içinde dönüş yapılacaktır.` 
            });
            setBookingId(null);
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Sanal ve Fiziki Ofis Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Resmi adres, paylaşımlı ofis ve belediye destekli yerleşkeleri yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group overflow-hidden flex flex-col">
                        <div className={cn("h-2 w-full", item.color)} />
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start mb-2">
                                {item.type === 'Public' ? <Landmark className="h-6 w-6 text-primary" /> : <Building2 className="h-6 w-6 text-primary" />}
                                <Badge variant={item.status === 'Ücretsiz' ? 'default' : 'outline'} className={cn(
                                    "text-[10px] uppercase font-bold",
                                    item.status === 'Ücretsiz' && "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                )}>
                                    {item.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-base font-bold leading-tight">{item.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 shrink-0" /> {item.location}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 flex-1 space-y-4">
                            <div className="py-2 border-y border-dashed bg-muted/20 px-2 rounded-md">
                                <p className="text-sm font-black text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">{item.discount}</p>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sunulan Hizmetler</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {item.services.map((service, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-foreground/80">
                                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                            <span>{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full font-bold group-hover:bg-primary group-hover:text-white transition-colors"
                                disabled={bookingId === item.id}
                                onClick={() => handleReserve(item.id, item.name)}
                            >
                                {bookingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Alan / Hizmet Rezerve Et'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-blue-800 text-base flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" /> Resmi Adres Kullanımı Hakkında
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-xs text-blue-700 leading-relaxed">
                        STK'nızın yasal tebligat adresi olarak sanal ofisleri kullanabilirsiniz. 
                        <strong> Karşıyaka</strong> ve <strong>Muratpaşa</strong> belediyeleri tarafından sağlanan yerleşkeler sadece ilgili şehirlerde faaliyet gösteren veya şubesi bulunan STK'lara öncelik vermektedir. 
                        Kurumsal sağlayıcılar (Workinton, eOfis vb.) ise Türkiye geneli şubelerinde kullanım hakkı sunar.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Mevcut Adres ve Sekreterlik Durumu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-xl bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-sm">Resmi Yerleşim Yeriniz:</p>
                            <p className="text-xs text-muted-foreground mt-1">Levent, Büyükdere Cad. No: 199 (Kolektif House Levent)</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => toast({title: "Posta Kontrolü", description: "Bekleyen resmi evrak bulunmuyor."})}>Postaları Gör</Button>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => toast({title: "Adres Değişikliği", description: "Yeni adres seçim ekranına yönlendiriliyorsunuz."})}>Adresi Değiştir</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
