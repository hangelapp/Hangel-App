'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, ExternalLink, Filter, Search, ArrowDownUp, Info, CheckCircle2, Calendar, Target, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const funds = [
    { 
        id: '1', 
        name: 'Avrupa Birliği Sivil Toplum Destek Programı', 
        provider: 'Avrupa Birliği Delegasyonu', 
        status: 'Açık', 
        deadline: '2024-10-31', 
        areas: ['İnsan Hakları', 'Çevre'],
        description: 'Türkiye ve AB arasındaki sivil toplum diyaloğunu güçlendirmek, sivil toplumun kurumsal kapasitesini artırmak ve karar alma süreçlerine katılımını desteklemek amacıyla hibe desteği sunar.',
        budget: '60.000 € - 150.000 €',
        requirements: 'En az 3 yıldır aktif faaliyet gösteren dernek ve vakıflar.',
        url: 'https://www.ab.gov.tr'
    },
    { 
        id: '2', 
        name: 'Türkiye Sosyal Girişimcilik Ağı Hibe Programı', 
        provider: 'Koç Üniversitesi Sosyal Etki Forumu', 
        status: 'Açık', 
        deadline: '2024-09-15', 
        areas: ['Sosyal Girişimcilik', 'Gençlik'],
        description: 'Sosyal girişimcilerin kapasite gelişimini, ekosistem içindeki işbirliklerini ve toplumsal etki odaklı yeni iş modellerini destekleyen bir hızlandırma ve hibe programıdır.',
        budget: '25.000 ₺ - 75.000 ₺',
        requirements: 'Sosyal girişim statüsündeki veya bu modele geçmek isteyen yapılar.',
        url: 'https://sosyalgirisimcilikagi.org'
    },
    { 
        id: '3', 
        name: 'Kültür Sanat Fonu', 
        provider: 'Sabancı Vakfı', 
        status: 'Kapandı', 
        deadline: '2024-07-01', 
        areas: ['Kültür & Sanat'],
        description: 'Kadınlar, gençler ve engelliler odaklı sosyal projeleri kültür ve sanat aracılığıyla destekler. Toplumsal farkındalık yaratan yaratıcı projelere öncelik verir.',
        budget: '100.000 ₺ - 300.000 ₺',
        requirements: 'Kamu yararına çalışan dernek ve vakıflar.',
        url: 'https://www.sabancivakfi.org'
    },
    { 
        id: '4', 
        name: 'Japonya Büyükelçiliği Yerel Projelere Hibe Programı', 
        provider: 'Japonya Büyükelçiliği', 
        status: 'Açık', 
        deadline: '2024-11-30', 
        areas: ['Eğitim', 'Sağlık'],
        description: 'Yerel kalkınma, sağlık ve eğitim ihtiyaçlarına yönelik küçük ölçekli, somut ve doğrudan yarar sağlayan altyapı veya ekipman projelerine hibe sağlar.',
        budget: 'Maksimum 90.000 $',
        requirements: 'Yerel yönetimler, eğitim kurumları ve STK\'lar.',
        url: 'https://www.tr.emb-japan.go.jp'
    },
];

export default function FundsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFund, setSelectedFund] = useState<typeof funds[0] | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const filteredFunds = funds.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenDetails = (fund: typeof funds[0]) => {
        setSelectedFund(fund);
        setIsDetailsOpen(true);
    };

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
                    <Input 
                        placeholder="Hibe ara..." 
                        className="pl-10 h-11" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                    {filteredFunds.length > 0 ? filteredFunds.map(fund => (
                        <Card key={fund.id} className={fund.status === 'Kapandı' ? 'opacity-50' : 'hover:border-primary/50 transition-colors shadow-sm'}>
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-lg font-bold leading-tight">{fund.name}</CardTitle>
                                    <Badge variant={fund.status === 'Açık' ? 'default' : 'secondary'} className={fund.status === 'Açık' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                        {fund.status}
                                    </Badge>
                                </div>
                                <CardDescription className="font-medium text-foreground/70">{fund.provider}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {fund.areas.map(area => <Badge key={area} variant="outline" className="rounded-lg">{area}</Badge>)}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 p-2 rounded-lg w-fit">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Son Başvuru: {fund.deadline}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button size="sm" className="flex-1 font-bold" onClick={() => handleOpenDetails(fund)}>Detayları Gör</Button>
                                <Button asChild size="sm" variant="secondary" className="flex-1 font-bold">
                                    <a href={fund.url} target="_blank" rel="noopener noreferrer">
                                        Resmi Sayfa <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="text-center py-12 text-muted-foreground italic">Aradığınız kriterlerde fon bulunamadı.</div>
                    )}
                </CardContent>
            </Card>

            {/* Fund Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {selectedFund && (
                    <DialogContent className="sm:max-w-[600px] rounded-[2rem]">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <HandCoins className="h-6 w-6 text-primary" />
                                <Badge className="bg-primary/10 text-primary border-none">{selectedFund.status}</Badge>
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">{selectedFund.name}</DialogTitle>
                            <DialogDescription className="text-base font-semibold text-primary">{selectedFund.provider}</DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Info className="h-3 w-3" /> Program Hakkında
                                </h4>
                                <p className="text-sm leading-relaxed text-foreground/80">{selectedFund.description}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-3 w-3" /> Bütçe Aralığı
                                    </h4>
                                    <p className="text-sm font-bold text-foreground">{selectedFund.budget}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> Son Tarih
                                    </h4>
                                    <p className="text-sm font-bold text-foreground">{selectedFund.deadline}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Target className="h-3 w-3" /> Başvuru Koşulları
                                </h4>
                                <p className="text-sm font-medium text-foreground/80">{selectedFund.requirements}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3" /> Odak Alanları
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedFund.areas.map(area => (
                                        <Badge key={area} variant="secondary" className="rounded-md font-bold">{area}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="rounded-xl font-bold">Kapat</Button>
                            <Button asChild className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20">
                                <a href={selectedFund.url} target="_blank" rel="noopener noreferrer">
                                    Başvuru Sayfasına Git <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}